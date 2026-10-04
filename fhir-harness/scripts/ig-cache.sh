#!/usr/bin/env bash
# FHIR AST cache service — restore, verify, seed, and diagnose the
# prebuilt AST JSON artifacts for a FHIR Implementation Guide.
#
# USAGE
#   scripts/ig-cache.sh status     [--ig-root DIR]
#   scripts/ig-cache.sh restore    [--ig-root DIR] [--package NAME] [--branch BR]
#   scripts/ig-cache.sh seed       [--ig-root DIR] [--package NAME] [--branch BR] [--remote REM] [--push] [--force]
#   scripts/ig-cache.sh contribute [--ig-root DIR] [--package NAME] [--remote REM] [--force]
#   scripts/ig-cache.sh verify     [--ig-root DIR]
#   scripts/ig-cache.sh doctor     [--ig-root DIR]
#   scripts/ig-cache.sh list
#
# EXIT CODES
#   0  success / cache present
#   1  cache miss (nothing restored — a build is required)
#   2  usage or environment error (git missing, not a repo, bad roster)
#   3  cache present but UNUSABLE (corrupt or mismatched)
#
# WARM-START SUPPORT
#   The Publisher's tx cache (`input-cache/txcache/`) persists across runs.
#   This cache is restored alongside the AST JSON files, skipping terminology
#   expansion network round-trips for unchanged ValueSets.

set -uo pipefail

PROG="${0##*/}"
PRIVATE_REF="refs/ig-cache-restore"

die()  { printf '%s: %s\n' "$PROG" "$*" >&2; exit 2; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }

command -v git >/dev/null 2>&1 || die "git not found on PATH"

# The harness this script ships in, found from the script itself — never
# from the caller's directory. A caller may run it from folio-assistant, from
# the IG checkout, or (after separation) from a repository that vendors it.
HARNESS_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
IG_AST_TS="$HARNESS_ROOT/fhir-harness/scripts/ig-ast.ts"
CALLER_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)

# Every git operation targets the IG's OWN repository. Before 2026-10-02 they
# ran in the caller's directory, so `restore --ig-root X` started from
# folio-assistant fetched folio-assistant's origin and reported the cache
# "not found" while it sat on X's origin (bean wnhh).
IGIT_ROOT=""
igit() { git -C "$IGIT_ROOT" "$@"; }

CMD="${1:-}"; shift || true
IG_ROOT=""
PACKAGE=""
BRANCH=""
REMOTE="origin"
PUSH=0
FORCE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --ig-root) IG_ROOT="${2:-}"; shift 2 ;;
    --package) PACKAGE="${2:-}"; shift 2 ;;
    --branch)  BRANCH="${2:-}"; shift 2 ;;
    --remote)  REMOTE="${2:-}"; shift 2 ;;
    --push)    PUSH=1; shift ;;
    --force)   FORCE=1; shift ;;
    -h|--help) CMD="help"; shift ;;
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
    if [ -f "$d/sushi-config.yaml" ]; then
      printf '%s\n' "$d"; return
    fi
    d=$(dirname "$d")
  done
  printf '%s\n' "$CALLER_ROOT"
}

resolve_package() {
  local root="$1"
  [ -n "$PACKAGE" ] && { printf '%s\n' "$PACKAGE"; return; }
  
  if [ -f "$root/sushi-config.yaml" ]; then
    local id
    # Carriage returns stripped too: smart-base's sushi-config.yaml has CRLF
    # line endings, and its id read as `smart.who.int.base<CR>`, naming a
    # cache branch nobody has (2026-10-02).
    id=$(grep '^id:' "$root/sushi-config.yaml" | head -1 | sed 's/^id:[[:space:]]*//' | tr -d '"'\''\r' | sed 's/[[:space:]]*$//')
    [ -n "$id" ] && { printf '%s\n' "$id"; return; }
  fi
  return 1
}

cmd_list_names() {
  IGIT_ROOT=$(resolve_ig_root)
  igit ls-remote --heads "$REMOTE" 'refs/heads/cat/fhir-harness/fhir-ast/*' 'refs/heads/cat-fhir-ast/*' 'refs/heads/fhir-ast/*' | sed -n 's#^.*refs/heads/\(.*\)$#\1#p'
}

# The cache branch for a package. Special branches are moving to the owner's
# final scheme `cat/<harness>/<name>` (bean tlk2, after #1913's interim
# `cat-` prefix), so every name must work until the moves land: the first of
# `cat/fhir-harness/fhir-ast/<pkg>`, `cat-fhir-ast/<pkg>`, `fhir-ast/<pkg>`
# that exists, else the final name (a first seed creates it). `--branch`
# overrides.
# IGIT_ROOT must be set. A remote that cannot be reached is an error, not
# "absent": reading it as absent would seed a second branch beside the first.
resolve_branch() {
  local pkg="$1"
  if [ -n "$BRANCH" ]; then printf '%s\n' "$BRANCH"; return; fi
  local name rc
  for name in "cat/fhir-harness/fhir-ast/$pkg" "cat-fhir-ast/$pkg" "fhir-ast/$pkg"; do
    igit ls-remote --exit-code --heads "$REMOTE" "refs/heads/$name" >/dev/null 2>&1
    rc=$?
    if [ "$rc" -eq 0 ]; then printf '%s\n' "$name"; return; fi
    [ "$rc" -eq 2 ] || die "could not reach remote '$REMOTE' to look up $name (git ls-remote exit $rc)"
  done
  printf '%s\n' "cat/fhir-harness/fhir-ast/$pkg"
}

count_resources() {
  local dir="$1"
  find "$dir" -name '*.json' -not -name 'manifest.json' -not -name 'dependencies.json' -not -name 'fsh-index.json' -type f 2>/dev/null | head -20000 | wc -l | tr -d ' '
}

cmd_status() {
  local root; root=$(resolve_ig_root)
  local pkg; pkg=$(resolve_package "$root")
  [ -z "$pkg" ] && pkg="(unknown)"
  
  local out="$root/output-ast"
  printf 'ig cache status\n'
  info "ig root: $root"
  info "package: $pkg"
  
  if [ ! -d "$out" ]; then
    printf '\n  cache ABSENT — run: %s restore\n' "$PROG"
    return 1
  fi
  
  local n; n=$(count_resources "$out")
  if [ "$n" -eq 0 ]; then
    warn "output-ast exists but has 0 resources — unusable."
    return 3
  fi
  
  printf '\n  cache PRESENT — %s resources on disk.\n' "$n"
  
  if ! bun run "$IG_AST_TS" validity "$out" --ig "$root" >/dev/null 2>&1; then
    warn "AST is stale for current inputs. Run \`$PROG seed\` after rebuilding."
    return 3
  fi
  return 0
}

cmd_restore() {
  local root; root=$(resolve_ig_root)
  local pkg; pkg=$(resolve_package "$root") || die "could not resolve package id from $root/sushi-config.yaml"
  IGIT_ROOT="$root"
  local br; br=$(resolve_branch "$pkg") || exit 2
  
  local out="$root/output-ast"
  if [ -d "$out" ] && [ "$(count_resources "$out")" -gt 0 ]; then
    local n; n=$(count_resources "$out")
    printf 'cache already present (%s resources) — nothing to do.\n' "$n"
    return 0
  fi
  
  printf 'restoring %s -> %s\n' "$br" "$out"
  
  igit update-ref -d "$PRIVATE_REF" 2>/dev/null || true
  # One retry: a transfer refused by a proxy or rate limit is not a missing
  # branch, and the two used to print the same "not found". The error git
  # gave is shown either way, so the next reader can tell them apart.
  local ferr
  if ! ferr=$(igit fetch --depth=1 "$REMOTE" "+$br:$PRIVATE_REF" 2>&1); then
    sleep 5
    if ! ferr=$(igit fetch --depth=1 "$REMOTE" "+$br:$PRIVATE_REF" 2>&1); then
      if igit ls-remote --exit-code --heads "$REMOTE" "refs/heads/$br" >/dev/null 2>&1; then
        warn "cache branch '$br' EXISTS on $REMOTE but could not be fetched:"
        printf '%s\n' "$ferr" | tail -3 | sed 's/^/      /' >&2
        return 2
      fi
      warn "cache branch '$br' not found on $REMOTE."
      info "A build is required. Afterwards run: $PROG seed"
      return 1
    fi
  fi
  
  mkdir -p "$out"
  
  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  trap "rm -rf '$tmp'; git -C '$root' update-ref -d '$PRIVATE_REF' 2>/dev/null || true" RETURN
  
  igit archive --format=tar "$PRIVATE_REF" | tar -xC "$tmp" 2>/dev/null || {
    warn "could not extract AST from '$br'."
    return 3
  }
  
  # The AST files sit at the root of the branch, along with txcache/
  # Move everything except txcache into output-ast
  for item in "$tmp"/*; do
    local base; base=$(basename "$item")
    [ "$base" = "txcache" ] && continue
    # A lock file is the seed's own scratch, never AST content.
    [ "$base" = "index.lock" ] && continue
    cp -R "$item" "$out/"
  done
  
  if [ -d "$tmp/txcache" ]; then
    info "restoring txcache -> $root/input-cache/txcache"
    mkdir -p "$root/input-cache"
    rm -rf "$root/input-cache/txcache"
    mv "$tmp/txcache" "$root/input-cache/txcache"
  fi
  
  local n; n=$(count_resources "$out")
  if [ "$n" -eq 0 ]; then
    warn "extract produced NO resources — cache is unusable."
    return 3
  fi
  
  printf '\nrestored %s resources from %s.\n' "$n" "$br"
  return 0
}

seed_subject() {
  printf 'AST %s | %s resources | %s edges | Publisher %s | src %s' "$1" "$2" "$3" "$4" "$5"
}

parse_counts() {
  local msg="$1"
  local resources edges
  resources=$(printf '%s' "$msg" | sed -n 's/.*| \([0-9]*\) resources .*/\1/p')
  edges=$(printf '%s' "$msg" | sed -n 's/.*| \([0-9]*\) edges .*/\1/p')
  if [ -n "$resources" ] && [ -n "$edges" ]; then
    printf '%s %s\n' "$resources" "$edges"
  fi
}

would_shrink() {
  local br="$1" cand_res="$2" cand_edges="$3"
  local ref="refs/ig-cache-prevcheck"
  igit update-ref -d "$ref" 2>/dev/null || true
  timeout 60 git -C "$IGIT_ROOT" fetch --depth=1 --filter=blob:none -q "$REMOTE" "+$br:$ref" 2>/dev/null || return 1
  local msg; msg=$(igit log -1 --format=%s "$ref" 2>/dev/null)
  igit update-ref -d "$ref" 2>/dev/null || true
  
  local prev; prev=$(parse_counts "$msg")
  [ -z "$prev" ] && return 1
  
  local po pw; po=${prev%% *}; pw=${prev##* }
  info "incumbent $br: $po resources, $pw edges"
  
  [ "$cand_res" -lt $(( po * 90 / 100 )) ] || [ "$cand_edges" -lt $(( pw * 90 / 100 )) ]
}

cmd_seed() {
  local root; root=$(resolve_ig_root)
  local pkg; pkg=$(resolve_package "$root") || die "pass --package NAME"
  IGIT_ROOT="$root"
  local br; br=$(resolve_branch "$pkg") || exit 2
  
  local out="$root/output-ast"
  
  info "Running AstExportCli..."
  local export_dir="$HARNESS_ROOT/fhir-ig-publisher/ast-export"
  [ ! -d "$export_dir" ] && export_dir="$PWD/fhir-ig-publisher/ast-export"
  if [ -d "$export_dir" ] && [ -f "$export_dir/target/classes/org/hl7/fhir/igtools/ast/AstExportCli.class" ]; then
    (cd "$export_dir" && java -cp "target/classes:$(cat cp.txt 2>/dev/null)" org.hl7.fhir.igtools.ast.AstExportCli -ig "$root" -ast-out "$out") || die "AstExportCli failed"
  else
    warn "AstExportCli not built or not found, assuming AST is already in $out"
  fi
  
  local n; n=$(count_resources "$out")
  [ "$n" -eq 0 ] && die "no resources under $out — build before seeding."
  
  local edges=0
  if [ -f "$out/dependencies.json" ]; then
    edges=$(grep -o '"target"' "$out/dependencies.json" 2>/dev/null | wc -l | tr -d ' ')
  fi
  
  local pub_version="unknown"
  local sha; sha=$(igit rev-parse --short HEAD 2>/dev/null || echo "unknown")
  
  if [ "$PUSH" -eq 1 ] && would_shrink "$br" "$n" "$edges"; then
    if [ "$FORCE" -eq 0 ]; then
      die "refusing to publish '$br': candidate smaller than incumbent. Use --force."
    fi
    warn "--force: publishing a smaller cache than the incumbent"
  fi
  
  local subj; subj=$(seed_subject "$pkg" "$n" "$edges" "$pub_version" "$sha")
  
  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  trap "rm -rf '$tmp'" RETURN
  
  cp -R "$out/"* "$tmp/" 2>/dev/null || true
  rm -f "$tmp/index.lock"
  # txcache goes alongside AST on the branch
  if [ -d "$root/input-cache/txcache" ]; then
    cp -R "$root/input-cache/txcache" "$tmp/"
  fi
  
  if [ "$PUSH" -eq 1 ]; then
    info "committing to $br directly..."
    # The index lives OUTSIDE the tree being committed: inside it, `git add .`
    # picked up its own `index.lock` (the 2026-10-02 smart-trust seed carries
    # one). The env is scoped to these commands, never exported.
    local gitdir; gitdir=$(igit rev-parse --absolute-git-dir) || die "IG root is not a git repository: $root"
    local idx; idx=$(mktemp) && rm -f "$idx"
    local tree commit
    GIT_DIR="$gitdir" GIT_INDEX_FILE="$idx" GIT_WORK_TREE="$tmp" git add -A . \
      || die "git add failed"
    tree=$(GIT_DIR="$gitdir" GIT_INDEX_FILE="$idx" git write-tree) || die "git write-tree failed"
    rm -f "$idx"
    commit=$(GIT_DIR="$gitdir" git commit-tree "$tree" -m "$subj") || die "git commit-tree failed"
    igit push -f "$REMOTE" "$commit:refs/heads/$br" >/dev/null 2>&1 || die "push failed"
    printf '\npushed %s (%s resources, %s edges)\n' "$br" "$n" "$edges"
  else
    printf '\nFiles written to %s\n' "$tmp"
    printf 'Push them to the orphan branch manually or pass --push.\n'
  fi
}

cmd_contribute() {
  PUSH=1
  cmd_seed "$@"
}

cmd_verify() {
  local root; root=$(resolve_ig_root)
  local out="$root/output-ast"
  if [ ! -d "$out" ]; then
    die "no output-ast found in $root"
  fi
  bun run "$IG_AST_TS" validity "$out" --ig "$root"
}

cmd_doctor() {
  local root; root=$(resolve_ig_root)
  printf 'ig cache doctor\n'
  
  if command -v java >/dev/null 2>&1; then
    info "java: $(java -version 2>&1 | head -1)"
  else
    warn "java not found"
  fi
  
  if command -v sushi >/dev/null 2>&1; then
    info "sushi: $(sushi -v 2>&1 | head -1)"
  else
    warn "sushi not found"
  fi
  
  local jar=$(find ~/.fhir -name 'org.hl7.fhir.publisher.jar' 2>/dev/null | head -1)
  if [ -n "$jar" ]; then
    info "publisher: $jar"
  else
    warn "publisher: org.hl7.fhir.publisher.jar not found in ~/.fhir"
  fi
  
  if command -v mvn >/dev/null 2>&1; then
    info "maven: $(mvn -v 2>&1 | head -1 | cut -d' ' -f1-3)"
  else
    warn "maven not found"
  fi
  
  if curl -sI https://packages.fhir.org | grep -q '200 OK'; then
    info "network: packages.fhir.org reachable"
  else
    warn "network: packages.fhir.org UNREACHABLE"
  fi
  
  if curl -sI https://tx.fhir.org | grep -q '200 OK'; then
    info "network: tx.fhir.org reachable"
  else
    warn "network: tx.fhir.org UNREACHABLE"
  fi
}

cmd_list() {
  cmd_list_names
}

case "$CMD" in
  status)     cmd_status "$@" ;;
  restore)    cmd_restore "$@" ;;
  seed)       cmd_seed "$@" ;;
  contribute) cmd_contribute "$@" ;;
  verify)     cmd_verify "$@" ;;
  doctor)     cmd_doctor "$@" ;;
  list)       cmd_list "$@" ;;
  help)
    grep '^#' "$0" | cut -c 3-
    ;;
  *)
    die "unknown command: $CMD"
    ;;
esac
