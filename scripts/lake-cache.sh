#!/usr/bin/env bash
# Lake / olean cache service — restore, verify, seed, and diagnose the
# prebuilt `.lake/` artifacts for a Lean package.
#
# WHY THIS EXISTS
#
# Restoring oleans used to be an eight-line git incantation copied out of
# a 600-line skill file, with a documented `FETCH_HEAD` race and no way to
# tell a real hit from a silent miss. Agents burned hours rebuilding
# Mathlib from source because a restore *looked* like it worked. This is
# that procedure as one command, done correctly.
#
# A from-source Mathlib build is 30-60 minutes. A restore is ~2 minutes.
# Always try `restore` first.
#
# USAGE
#
#   scripts/lake-cache.sh status   [--lake-root DIR]
#   scripts/lake-cache.sh restore  [--lake-root DIR] [--package NAME] [--branch BR]
#   scripts/lake-cache.sh restore-toolchain [--branch BR]
#   scripts/lake-cache.sh seed     [--lake-root DIR] [--package NAME] [--branch BR]
#   scripts/lake-cache.sh list
#   scripts/lake-cache.sh doctor   [--lake-root DIR]
#
# The package and branch are derived automatically from
# `.github/lake-packages.json` + `lean-toolchain`; pass them only to
# override.
#
# EXIT CODES
#   0  success / cache present
#   1  cache miss (nothing restored — a build is required)
#   2  usage or environment error (git missing, not a repo, bad roster)
#   3  cache present but UNUSABLE (corrupt or toolchain mismatch)
#
# Callers should branch on these rather than grepping the output.
set -uo pipefail

# ── On-disk formats ─────────────────────────────────────────────────
#
# Cache branches have appeared in two shapes, and confusing them is what
# made the CI restore silently dead:
#
#   parts  — `lake-oleans.tgz.part00..NN`, concatenated then untarred.
#            This is what the branches actually carry today (GitHub
#            rejects single blobs over 100 MB, hence the split).
#   tree   — a literal `.lake/` directory committed to the branch.
#            Older shape; still read for backward compatibility.
#
# `restore` detects which is present rather than assuming.

PROG="${0##*/}"
PRIVATE_REF="refs/lake-cache-restore"

die()  { printf '%s: %s\n' "$PROG" "$*" >&2; exit 2; }
info() { printf '  %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }

command -v git >/dev/null 2>&1 || die "git not found on PATH"

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) \
  || die "not inside a git repository"

# ── Argument parsing ────────────────────────────────────────────────
CMD="${1:-}"; shift || true
LAKE_ROOT=""
PACKAGE=""
BRANCH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --lake-root) LAKE_ROOT="${2:-}"; shift 2 ;;
    --package)   PACKAGE="${2:-}";   shift 2 ;;
    --branch)    BRANCH="${2:-}";    shift 2 ;;
    -h|--help)   CMD="help"; shift ;;
    *) die "unknown option: $1" ;;
  esac
done

# ── Resolution ──────────────────────────────────────────────────────

# The Lake root is the directory holding `lakefile.toml` and `.lake/`.
# Default to the nearest enclosing one, so the script works from inside a
# package without the caller knowing the layout.
resolve_lake_root() {
  if [ -n "$LAKE_ROOT" ]; then
    printf '%s\n' "$(cd "$LAKE_ROOT" 2>/dev/null && pwd)" || die "no such --lake-root: $LAKE_ROOT"
    return
  fi
  local d="$PWD"
  while [ "$d" != "/" ]; do
    if [ -f "$d/lakefile.toml" ] || [ -f "$d/lakefile.lean" ]; then
      printf '%s\n' "$d"; return
    fi
    d=$(dirname "$d")
  done
  printf '%s\n' "$REPO_ROOT"
}

# Toolchain slug: `leanprover/lean4:v4.24.0` -> `v4-24-0`.
# Read the Lake root's pin first, then the repo root's.
toolchain_slug() {
  local root="$1" f=""
  [ -f "$root/lean-toolchain" ] && f="$root/lean-toolchain"
  [ -z "$f" ] && [ -f "$REPO_ROOT/lean-toolchain" ] && f="$REPO_ROOT/lean-toolchain"
  [ -z "$f" ] && return 1
  cut -d: -f2 "$f" | tr -d '[:space:]' | tr . -
}

# Package short name.
#
# Three sources, in order — the tool must work with ZERO configuration,
# because needing a roster before you can restore a cache is most of the
# friction being removed here.
#
#   1. --package                        explicit wins
#   2. .github/lake-packages.json       the roster the refresh workflow
#                                       reads, so agent and CI agree
#   3. the cache branches themselves    `lake-cache/<pkg>-<slug>` already
#                                       encodes the package; if exactly
#                                       one branch matches this toolchain
#                                       slug exactly (no extra suffix),
#                                       that IS the package
#
# (3) matters in practice: the roster currently lives in folio-assistant
# while the paths it names belong to the content repo, so a content repo
# may legitimately have no roster at all.
resolve_package() {
  local root="$1" roster="$REPO_ROOT/.github/lake-packages.json"
  [ -n "$PACKAGE" ] && { printf '%s\n' "$PACKAGE"; return; }

  local rel="${root#"$REPO_ROOT"/}"
  [ "$rel" = "$root" ] && rel="."

  if [ -f "$roster" ]; then
    local hit
    hit=$(python3 - "$roster" "$rel" <<'PY' 2>/dev/null
import json, sys
roster, rel = sys.argv[1], sys.argv[2]
try:
    pkgs = json.load(open(roster)).get("packages", [])
except Exception:
    pkgs = []
for p in pkgs:
    if p.get("lake-root", ".").rstrip("/") == rel.rstrip("/"):
        print(p["package"]); break
PY
)
    [ -n "$hit" ] && { printf '%s\n' "$hit"; return; }
  fi

  # Infer from the branch family. Only an EXACT `<pkg>-<slug>` match
  # counts — the suffixed variants (`-test`, `-new`, topic branches) are
  # experiments, and silently restoring one of those would be worse than
  # failing to resolve.
  #
  # `toolchain` is excluded: `lake-cache/toolchain-<slug>` caches the elan
  # TOOLCHAIN (see `restore-toolchain`), not a Lake package's oleans.
  # Without this exclusion a single-package repo has two exact matches and
  # inference declines for no good reason.
  local slug; slug=$(toolchain_slug "$root") || return 1
  local cands
  cands=$(cmd_list_names \
    | sed -n "s#^lake-cache/\(.*\)-${slug}\$#\1#p" \
    | grep -vx 'toolchain')
  [ "$(printf '%s\n' "$cands" | grep -c .)" -eq 1 ] && printf '%s\n' "$cands"
}

# ── Cache inspection ────────────────────────────────────────────────

# A restore is only real if oleans actually landed. `.lake/` existing
# proves nothing — a failed extract, or a Lake dir holding only a
# manifest, both leave the directory present and the build cold.
count_oleans() {
  find "$1/.lake" -name '*.olean' -type f 2>/dev/null | head -20000 | wc -l | tr -d ' '
}

# Oleans belonging to the package ITSELF, as opposed to its dependencies.
#
# This distinction is load-bearing and easy to miss. A cache branch can
# carry thousands of Mathlib oleans and NONE of the paper's own modules —
# `lake-cache/qou-v4-24-0` does exactly that: 7268 oleans, zero `QOU.*`.
# Total count then looks healthy while every file importing the paper's
# own package still fails to elaborate and every build still recompiles
# the paper from scratch.
count_own_oleans() {
  find "$1/.lake/build/lib" -name '*.olean' -type f 2>/dev/null | head -20000 | wc -l | tr -d ' '
}

cmd_status() {
  local root; root=$(resolve_lake_root)
  local slug pkg
  slug=$(toolchain_slug "$root") || { warn "no lean-toolchain found"; slug="(unknown)"; }
  pkg=$(resolve_package "$root"); [ -z "$pkg" ] && pkg="(not in roster)"
  local n; n=$(count_oleans "$root")

  printf 'lake cache status\n'
  info "lake root:  $root"
  info "package:    $pkg"
  info "toolchain:  $slug"
  info "branch:     lake-cache/$pkg-$slug"
  local own; own=$(count_own_oleans "$root")
  info "oleans:     $n  (deps + own)"
  info "own pkg:    $own"
  if [ "$n" -gt 0 ]; then
    printf '\n  cache PRESENT — %s oleans on disk.\n' "$n"
    if [ "$own" -eq 0 ]; then
      warn "but ZERO belong to this package — only its dependencies are cached."
      info "Anything importing the package's own modules still rebuilds, and"
      info "sibling .lean files will not elaborate standalone. Reseed with a"
      info "build that includes the package: $PROG seed (after a full build)."
    fi
    return 0
  fi
  printf '\n  cache ABSENT — run: %s restore\n' "$PROG"
  return 1
}

# ── Restore ─────────────────────────────────────────────────────────

cmd_restore() {
  local root; root=$(resolve_lake_root)
  local slug pkg
  slug=$(toolchain_slug "$root") || die "no lean-toolchain — cannot derive the cache branch"
  pkg=$(resolve_package "$root")
  [ -z "$pkg" ] && die "could not resolve the package for lake-root '$root'.
Add it to .github/lake-packages.json, or pass --package NAME.
Known packages: $(cmd_list_names | tr '\n' ' ')"
  local br="${BRANCH:-lake-cache/$pkg-$slug}"

  local have; have=$(count_oleans "$root")
  if [ "$have" -gt 0 ]; then
    printf 'cache already present (%s oleans) — nothing to do.\n' "$have"
    printf 'Force a re-restore by removing %s/.lake first.\n' "$root"
    return 0
  fi

  printf 'restoring %s -> %s\n' "$br" "$root/.lake"

  # Fetch into a PRIVATE ref, not FETCH_HEAD.
  #
  # FETCH_HEAD is global and mutable: a concurrent `git fetch` anywhere
  # in the repo repoints it mid-restore, the part blobs then resolve
  # against the wrong commit, and the assembled tarball is truncated —
  # surfacing as `gzip: not in gzip format`, i.e. exactly like a corrupt
  # cache. This is the race the old copy-paste recipe warned about and
  # could not actually prevent.
  git update-ref -d "$PRIVATE_REF" 2>/dev/null || true
  if ! git fetch --depth=1 origin "+$br:$PRIVATE_REF" 2>/dev/null; then
    warn "cache branch '$br' not found on origin."
    info "Available: $(cmd_list_names | tr '\n' ' ')"
    info "A build is required. Afterwards run: $PROG seed"
    return 1
  fi

  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'; git update-ref -d '$PRIVATE_REF' 2>/dev/null || true" RETURN

  # --full-tree: `git ls-tree` is CWD-PREFIX-RELATIVE by default. Run from
  # a package subdirectory (the normal case — you are in the Lake root),
  # it would list that path inside the orphan branch, which does not
  # exist there, and return NOTHING. The restore then reports "carries
  # neither parts nor a tree" against a perfectly good cache.
  local names; names=$(git ls-tree --full-tree --name-only "$PRIVATE_REF")
  local parts; parts=$(printf '%s\n' "$names" | grep -E '\.tgz\.part[0-9]+$' | sort)

  if [ -n "$parts" ]; then
    info "format: split tarball ($(printf '%s\n' "$parts" | wc -l | tr -d ' ') parts)"
    local tgz="$tmp/cache.tgz"
    local p
    while IFS= read -r p; do
      git show "$PRIVATE_REF:$p" >> "$tgz" || { warn "failed reading part $p"; return 3; }
    done <<< "$parts"
    if ! tar xzf "$tgz" -C "$root" 2>/dev/null; then
      warn "tarball did not extract — cache branch '$br' is corrupt."
      info "Reseed it after a successful build: $PROG seed --branch $br"
      return 3
    fi
  elif printf '%s\n' "$names" | grep -qx '.lake'; then
    # Legacy shape: a committed `.lake/` tree.
    info "format: committed .lake/ tree (legacy)"
    if ! git archive --format=tar "$PRIVATE_REF" -- '.lake' 2>/dev/null | tar -xC "$tmp" 2>/dev/null; then
      warn "could not extract the .lake tree from '$br'."
      return 3
    fi
    rm -rf "$root/.lake"
    mv "$tmp/.lake" "$root/.lake"
  else
    warn "branch '$br' carries neither *.tgz.part* nor a .lake/ tree."
    info "Contents: $(printf '%s ' $names)"
    return 3
  fi

  # Verify, rather than trusting that extraction implies usability.
  local n; n=$(count_oleans "$root")
  if [ "$n" -eq 0 ]; then
    warn "extract succeeded but produced NO oleans — cache is unusable."
    info "Most likely seeded from a build that had not compiled, or for a"
    info "different lake-root. Rebuild, then: $PROG seed --branch $br"
    return 3
  fi
  local own; own=$(count_own_oleans "$root")
  printf '\nrestored %s oleans from %s.\n' "$n" "$br"
  if [ "$own" -eq 0 ]; then
    warn "ZERO of them belong to this package — dependencies only."
    info "The package's own modules still need building, and sibling .lean"
    info "files will not elaborate standalone until they are. Not a failed"
    info "restore; an incompletely SEEDED branch."
  else
    info "$own are this package's own — no rebuild needed."
  fi
  return 0
}

# ── Seed ────────────────────────────────────────────────────────────

cmd_seed() {
  local root; root=$(resolve_lake_root)
  local slug pkg
  slug=$(toolchain_slug "$root") || die "no lean-toolchain"
  pkg=$(resolve_package "$root"); [ -z "$pkg" ] && die "pass --package NAME"
  local br="${BRANCH:-lake-cache/$pkg-$slug}"

  local n; n=$(count_oleans "$root")
  [ "$n" -eq 0 ] && die "no oleans under $root/.lake — build before seeding.
Seeding an empty cache is worse than none: the next agent gets a hit,
skips the build, and fails with no oleans."

  printf 'seeding %s from %s (%s oleans)\n' "$br" "$root/.lake" "$n"
  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" RETURN

  # 90 MB parts: GitHub rejects blobs over 100 MB.
  tar czf - -C "$root" .lake | split -b 90m - "$tmp/lake-oleans.tgz.part" \
    || die "failed to create the split tarball"
  ( cd "$tmp" && for f in lake-oleans.tgz.part*; do mv "$f" "$(printf '%s' "$f")"; done )

  printf '\nParts written to %s\n' "$tmp"
  printf 'Push them to the orphan branch with:\n\n'
  printf '  git checkout --orphan %s\n  git rm -rf . >/dev/null\n  cp %s/lake-oleans.tgz.part* .\n' "$br" "$tmp"
  printf '  git add lake-oleans.tgz.part* && git commit -m "lake cache: %s"\n' "$br"
  printf '  git push -f origin %s\n\n' "$br"
  printf 'Left as explicit steps: seeding force-pushes an orphan branch,\n'
  printf 'which is destructive and should be a deliberate act.\n'
}

# ── Toolchain restore ───────────────────────────────────────────────

# `lake-cache/toolchain-<slug>` caches the elan TOOLCHAIN itself (the
# Lean binaries), not any package's oleans. Distinct tier, distinct
# failure: with no toolchain, `lake` does not exist and every olean
# restore is moot. Where `elan toolchain install` is slow or the elan
# host is firewalled, this is the difference between minutes and hours.
cmd_restore_toolchain() {
  local root; root=$(resolve_lake_root)
  local slug; slug=$(toolchain_slug "$root") || die "no lean-toolchain"
  local br="${BRANCH:-lake-cache/toolchain-$slug}"
  local dest="${ELAN_HOME:-$HOME/.elan}"

  if command -v lean >/dev/null 2>&1; then
    printf 'toolchain already installed: %s\n' "$(lean --version 2>/dev/null | head -1)"
    return 0
  fi

  printf 'restoring toolchain %s -> %s\n' "$br" "$dest"
  git update-ref -d "$PRIVATE_REF" 2>/dev/null || true
  if ! git fetch --depth=1 origin "+$br:$PRIVATE_REF" 2>/dev/null; then
    warn "toolchain cache branch '$br' not found."
    info "Install normally: elan toolchain install \$(cat lean-toolchain)"
    return 1
  fi
  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'; git update-ref -d '$PRIVATE_REF' 2>/dev/null || true" RETURN

  local parts
  parts=$(git ls-tree --full-tree --name-only "$PRIVATE_REF" \
          | grep -E '\.tgz\.part[0-9]+$' | sort)
  [ -z "$parts" ] && { warn "branch '$br' has no tarball parts"; return 3; }

  local tgz="$tmp/toolchain.tgz" p
  while IFS= read -r p; do
    git show "$PRIVATE_REF:$p" >> "$tgz" || { warn "failed reading $p"; return 3; }
  done <<< "$parts"

  # The tarball holds a TOOLCHAIN directory (`leanprover--lean4---vX.Y.Z/`),
  # and elan looks for those under `$ELAN_HOME/toolchains/`. Extracting to
  # `$ELAN_HOME` itself lands it one level too high, where nothing finds
  # it — which is exactly what an earlier version of this did while
  # reporting success.
  mkdir -p "$dest/toolchains"
  if ! tar xzf "$tgz" -C "$dest/toolchains" 2>/dev/null; then
    warn "toolchain tarball did not extract — branch '$br' is corrupt."
    return 3
  fi

  # VERIFY. Extraction succeeding says nothing about a usable toolchain;
  # the same trap the olean restore has (`.lake/` present, zero oleans).
  local bin
  bin=$(find "$dest/toolchains" -maxdepth 3 -type f -name lean -perm -u+x 2>/dev/null | head -1)
  if [ -z "$bin" ]; then
    warn "extract produced no lean binary under $dest/toolchains — unusable."
    info "Install normally: elan toolchain install \$(cat lean-toolchain)"
    return 3
  fi
  local ver; ver=$("$bin" --version 2>/dev/null | head -1)
  if [ -z "$ver" ]; then
    warn "lean binary at $bin does not run (architecture mismatch?)."
    return 3
  fi

  printf '\nrestored %s\n' "$ver"
  printf '  binary: %s\n' "$bin"
  printf '  PATH:   export PATH="%s:$PATH"\n' "$(dirname "$bin")"
}

# ── List / doctor ───────────────────────────────────────────────────

cmd_list_names() {
  git ls-remote --heads origin 'refs/heads/lake-cache/*' 2>/dev/null \
    | sed 's#.*refs/heads/##' | sort
}

cmd_list() {
  printf 'cache branches on origin:\n'
  local out; out=$(cmd_list_names)
  [ -z "$out" ] && { info "(none)"; return 1; }
  printf '%s\n' "$out" | sed 's/^/  /'
}

cmd_doctor() {
  local root; root=$(resolve_lake_root)
  printf 'lake cache doctor\n'
  info "lake root:   $root"
  info "lakefile:    $([ -f "$root/lakefile.toml" ] && echo present || echo MISSING)"
  local slug; slug=$(toolchain_slug "$root") \
    && info "toolchain:   $slug" \
    || warn "no lean-toolchain — the branch name cannot be derived"
  local pkg; pkg=$(resolve_package "$root")
  [ -n "$pkg" ] && info "package:     $pkg" \
    || warn "lake-root not in .github/lake-packages.json — pass --package"
  info "oleans:      $(count_oleans "$root")"
  info "elan:        $(command -v elan >/dev/null && elan --version 2>/dev/null || echo 'NOT INSTALLED')"
  info "lake:        $(command -v lake >/dev/null && lake --version 2>/dev/null | head -1 || echo 'NOT INSTALLED')"
  printf '\nremote branches:\n'
  cmd_list | tail -n +2
  printf '\nnext step: '
  if [ "$(count_oleans "$root")" -gt 0 ]; then
    printf 'cache is present — build directly.\n'
  else
    printf 'run `%s restore`.\n' "$PROG"
  fi
}

usage() {
  sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'
}

case "$CMD" in
  status)  cmd_status ;;
  restore) cmd_restore ;;
  restore-toolchain) cmd_restore_toolchain ;;
  seed)    cmd_seed ;;
  list)    cmd_list ;;
  doctor)  cmd_doctor ;;
  ""|help|-h|--help) usage ;;
  *) die "unknown command: $CMD (try: status restore restore-toolchain seed list doctor)" ;;
esac
