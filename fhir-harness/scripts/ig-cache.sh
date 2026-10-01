#!/usr/bin/env bash
set -uo pipefail

PROG="${0##*/}"
PRIVATE_REF="refs/ig-cache-restore"

die()  { printf '%s: %s\n' "$PROG" "$*" >&2; exit 2; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }

command -v git >/dev/null 2>&1 || die "git not found on PATH"

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) \
  || die "not inside a git repository"

# ── Argument parsing ────────────────────────────────────────────────
CMD="${1:-}"; shift || true
IG_ROOT=""
PACKAGE=""
BRANCH=""
PUSH=0
FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --ig-root)   IG_ROOT="${2:-}"; shift 2 ;;
    --package)   PACKAGE="${2:-}";   shift 2 ;;
    --branch)    BRANCH="${2:-}";    shift 2 ;;
    --push)      PUSH=1; shift ;;
    --force)     FORCE=1; shift ;;
    -h|--help)   CMD="help"; shift ;;
    *) die "unknown option: $1" ;;
  esac
done

resolve_ig_root() {
  if [ -n "$IG_ROOT" ]; then
    printf '%s\n' "$(cd "$IG_ROOT" 2>/dev/null && pwd)" || die "no such --ig-root: $IG_ROOT"
    return
  fi
  local d="$PWD"
  while [ "$d" != "/" ]; do
    if [ -f "$d/sushi-config.yaml" ] || [ -f "$d/ig.ini" ]; then
      printf '%s\n' "$d"; return
    fi
    d=$(dirname "$d")
  done
  printf '%s\n' "$PWD"
}

resolve_package() {
  local root="$1"
  [ -n "$PACKAGE" ] && { printf '%s\n' "$PACKAGE"; return; }
  if [ -f "$root/sushi-config.yaml" ]; then
    local pkg; pkg=$(grep -E '^id:' "$root/sushi-config.yaml" | awk '{print $2}' | tr -d '"'\''')
    [ -n "$pkg" ] && { printf '%s\n' "$pkg"; return; }
  fi
  return 1
}

count_resources() {
  find "$1/fhir-ast" -maxdepth 1 -name '*.json' -not -name 'manifest.json' -not -name 'dependencies.json' -type f 2>/dev/null | wc -l | tr -d ' '
}

# ── Restore ─────────────────────────────────────────────────────────

cmd_restore() {
  local root; root=$(resolve_ig_root)
  local pkg; pkg=$(resolve_package "$root") || die "could not resolve package id from sushi-config.yaml"
  local br="${BRANCH:-fhir-ast/$pkg}"

  local have; have=$(count_resources "$root")
  if [ "$have" -gt 0 ]; then
    if [ "$FORCE" -eq 0 ]; then
      printf 'cache already present (%s resources) — nothing to do.\n' "$have"
      return 0
    fi
    info "--force: overwriting existing cache"
  fi

  printf 'restoring %s -> %s\n' "$br" "$root/fhir-ast"

  git update-ref -d "$PRIVATE_REF" 2>/dev/null || true
  if ! git fetch --depth=1 origin "+$br:$PRIVATE_REF" 2>/dev/null; then
    warn "cache branch '$br' not found on origin."
    info "A build is required. Afterwards run: $PROG seed"
    return 1
  fi

  rm -rf "$root/fhir-ast"
  mkdir -p "$root/fhir-ast"
  mkdir -p "$root/input-cache/txcache"

  git --work-tree="$root" checkout "$PRIVATE_REF" -- fhir-ast txcache 2>/dev/null || true
  
  if [ -d "$root/txcache" ]; then
    cp -r "$root/txcache/"* "$root/input-cache/txcache/" 2>/dev/null || true
    rm -rf "$root/txcache"
  fi

  local n; n=$(count_resources "$root")
  if [ "$n" -eq 0 ]; then
    warn "extract succeeded but produced NO resources — cache is unusable."
    return 3
  fi

  printf '\nrestored %s resources from %s.\n' "$n" "$br"
  return 0
}

# ── Seed ────────────────────────────────────────────────────────────

seed_subject() {
  printf 'AST %s | %s resources | %s edges | Publisher %s | src %s' "$1" "$2" "$3" "$4" "$5"
}

parse_counts() {
  printf '%s' "$1" | sed -n 's/.*| \([0-9]*\) resources | \([0-9]*\) edges |.*/\1 \2/p'
}

branch_counts() {
  local ref="refs/ig-cache-prevcheck"
  git update-ref -d "$ref" 2>/dev/null || true
  timeout 60 git fetch --depth=1 --filter=blob:none -q origin "+$1:$ref" 2>/dev/null || return 1
  local msg; msg=$(git log -1 --format=%s "$ref" 2>/dev/null)
  git update-ref -d "$ref" 2>/dev/null || true
  parse_counts "$msg"
}

would_shrink() {
  local prev; prev=$(branch_counts "$1") || return 1
  [ -z "$prev" ] && return 1
  local pr pe; pr=${prev%% *}; pe=${prev##* }
  info "incumbent $1: $pr resources, $pe edges"
  [ "$2" -lt $(( pr * 90 / 100 )) ] || [ "$3" -lt $(( pe * 90 / 100 )) ]
}

cmd_seed() {
  local root; root=$(resolve_ig_root)
  local pkg; pkg=$(resolve_package "$root") || die "no package id"
  local br="${BRANCH:-fhir-ast/$pkg}"

  local n; n=$(count_resources "$root")
  if [ "$n" -eq 0 ]; then
    info "running AstExportCli to build AST..."
    if command -v bun >/dev/null; then
      bun run fhir-harness/scripts/ig-ast.ts export --ig-root "$root" || die "AST export failed"
      n=$(count_resources "$root")
    else
      die "bun not found, cannot build AST automatically"
    fi
    [ "$n" -eq 0 ] && die "no AST resources found in $root/fhir-ast after export"
  fi

  local edges=0
  [ -f "$root/fhir-ast/manifest.json" ] && edges=$(grep -o '"edges": *[0-9]*' "$root/fhir-ast/manifest.json" | grep -o '[0-9]*' | head -1 || echo 0)
  
  local pub_ver="unknown"
  [ -f "$root/fhir-ast/manifest.json" ] && pub_ver=$(grep -o '"publisherVersion": *"[^"]*"' "$root/fhir-ast/manifest.json" | cut -d'"' -f4 | head -1 || echo "unknown")
  
  local short_sha; short_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

  if [ "$PUSH" -eq 1 ] && would_shrink "$br" "$n" "$edges"; then
    if [ "$FORCE" -eq 0 ]; then
      die "refusing to publish '$br': candidate smaller than incumbent."
    fi
    warn "--force: publishing smaller cache"
  fi

  local subj; subj=$(seed_subject "$pkg" "$n" "$edges" "$pub_ver" "$short_sha")

  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" RETURN

  cp -r "$root/fhir-ast" "$tmp/fhir-ast"
  if [ -d "$root/input-cache/txcache" ]; then
    cp -r "$root/input-cache/txcache" "$tmp/txcache"
  fi

  local tree; tree=$( (
    cd "$tmp" || exit 1
    find . -type f | sed 's#^\./##' | while read -r f; do
      sha=$(git hash-object -w "$f")
      printf '100644 blob %s\t%s\n' "$sha" "$f"
    done | git mktree
  ) ) || die "mktree failed"

  local commit; commit=$(git -c user.name=folio-ig-cache-bot -c user.email=folio-ig-cache-bot@users.noreply.github.com commit-tree "$tree" -m "$subj")

  if [ "$PUSH" -eq 1 ]; then
    printf 'pushing %s\n' "$br"
    git push -f origin "$commit:refs/heads/$br" >/dev/null 2>&1 || die "push failed"
  else
    printf 'Built tree %s. Use --push to publish.\n' "$commit"
  fi
}

cmd_contribute() {
  local root; root=$(resolve_ig_root)
  PUSH=1
  cmd_seed
}

cmd_verify() {
  local root; root=$(resolve_ig_root)
  if ! command -v bun >/dev/null 2>&1; then
    die "bun not found on PATH"
  fi
  bun run fhir-harness/scripts/ig-ast.ts validity --ig-root "$root"
}

cmd_status() {
  local root; root=$(resolve_ig_root)
  local pkg; pkg=$(resolve_package "$root")
  local br="${BRANCH:-fhir-ast/$pkg}"
  
  local n; n=$(count_resources "$root")
  if [ "$n" -eq 0 ]; then
    printf 'cache ABSENT\n'
    return 1
  fi
  
  printf 'cache PRESENT — %s resources\n' "$n"
  
  if ! cmd_verify >/dev/null 2>&1; then
    warn "AST is present but invalid/stale according to validity check"
    return 3
  fi
  return 0
}

cmd_doctor() {
  local root; root=$(resolve_ig_root)
  printf 'IG cache doctor\n'
  info "IG root: $root"
  info "java: $(command -v java >/dev/null && java -version 2>&1 | head -1 || echo 'MISSING')"
  info "sushi: $(command -v sushi >/dev/null && sushi -v || echo 'MISSING')"
  info "publisher: $([ -f "$HOME/.fhir/publishers/publisher.jar" ] && echo 'PRESENT' || echo 'MISSING')"
  
  if curl -Ism 5 https://packages.fhir.org | grep -q 'HTTP/'; then
    info "packages.fhir.org: REACHABLE"
  else
    warn "packages.fhir.org: UNREACHABLE"
  fi
  
  if curl -Ism 5 https://tx.fhir.org | grep -q 'HTTP/'; then
    info "tx.fhir.org: REACHABLE"
  else
    warn "tx.fhir.org: UNREACHABLE"
  fi
}

cmd_list_names() {
  timeout 30 git ls-remote --heads origin 'refs/heads/fhir-ast/*' 2>/dev/null \
    | sed 's#.*refs/heads/##' | sort
}

cmd_list() {
  printf 'cache branches on origin:\n'
  local out; out=$(cmd_list_names)
  [ -z "$out" ] && { info "(none)"; return 1; }
  printf '%s\n' "$out" | sed 's/^/  /'
}

case "$CMD" in
  status)     cmd_status ;;
  restore)    cmd_restore ;;
  seed)       cmd_seed ;;
  contribute) cmd_contribute ;;
  verify)     cmd_verify ;;
  doctor)     cmd_doctor ;;
  list)       cmd_list ;;
  *)          die "unknown command: $CMD" ;;
esac
