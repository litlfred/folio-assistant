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
#   scripts/lake-cache.sh seed       [--lake-root DIR] [--package NAME] [--branch BR] [--push] [--force]
#   scripts/lake-cache.sh contribute [--lake-root DIR] [--package NAME] [--force]
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
PUSH=0
FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --lake-root) LAKE_ROOT="${2:-}"; shift 2 ;;
    --package)   PACKAGE="${2:-}";   shift 2 ;;
    --branch)    BRANCH="${2:-}";    shift 2 ;;
    --push)      PUSH=1; shift ;;
    --force)     FORCE=1; shift ;;
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
# A SECOND way a healthy-looking total lies, distinct from the gutting
# check below. A cache branch can carry thousands of Mathlib oleans and
# NONE of the paper's own modules — `lake-cache/qou-v4-24-0` does exactly
# that: 7268 oleans, zero `QOU.*`. Nothing was evicted, so the stamp
# check passes; the branch was simply seeded without the package. Every
# build still recompiles the paper, and sibling `.lean` files cannot
# elaborate standalone.
count_own_oleans() {
  find "$1/.lake/build/lib" -name '*.olean' -type f 2>/dev/null | head -20000 | wc -l | tr -d ' '
}

# Trace files, which are what Lake actually consults for staleness.
#
# THE reason a cache can look full and still not help `lake build`. Lake
# decides a module is up to date from its `.trace` sibling, not from the
# `.olean`. An olean with no trace is "out-of-date and needs to be
# rebuilt" — so Lake rebuilds it, and rebuilding EVICTS the untraced
# neighbours.
#
# Measured on lake-cache/qou-v4-24-0: 7268 oleans, 775 traces. Building
# ONE module ran 823 targets and left 772 oleans — every survivor had a
# trace (494 mathlib oleans, 494 traces, zero of 200 sampled missing
# one). The cache only ever worked for direct `lean` invocations with
# LEAN_PATH, never for a build.
count_traces() {
  find "$1/.lake" -name '*.trace' -type f 2>/dev/null | head -20000 | wc -l | tr -d ' '
}

# Trace coverage as a percentage of oleans. Below ~90% a `lake build`
# will rebuild — and evict — the shortfall.
trace_coverage_pct() {  # root
  local o t
  o=$(count_oleans "$1"); t=$(count_traces "$1")
  [ "$o" -eq 0 ] && { printf '0\n'; return; }
  printf '%s\n' $(( t * 100 / o ))
}

# A restore stamps how many oleans it laid down. Counting alone cannot
# distinguish a healthy cache from a GUTTED one: `lake build` re-resolves
# the dep graph and can evict most of a restored Mathlib, leaving a count
# that is nonzero — and so passes any `> 0` test — but far below what was
# restored. Observed in the wild: 7268 -> 459, after which `restore`
# reported "already present, nothing to do" and refused to repair.
#
# The stamp is written INTO `.lake/`, so it dies with the tree it
# describes and needs no network to read. Checking against the cache
# branch instead would mean fetching ~1.6 GB of split parts just to
# answer `status`.
STAMP_REL=".lake/.lake-cache-stamp"

write_stamp() {  # root count branch
  printf '%s %s\n' "$2" "$3" > "$1/$STAMP_REL" 2>/dev/null || true
}

# Echoes the stamped count, or nothing when unstamped (older caches, or
# a tree built from source). Absence is not an error — it only means the
# shortfall check cannot run.
read_stamp_count() {
  [ -f "$1/$STAMP_REL" ] || return 1
  awk 'NR==1{print $1}' "$1/$STAMP_REL" 2>/dev/null | grep -E '^[0-9]+$'
}

# Exit 0 = gutted. A build may legitimately ADD oleans (a package's own
# modules compile on top of restored deps), so only a SHORTFALL counts.
is_gutted() {  # root have
  local want; want=$(read_stamp_count "$1") || return 1
  [ -n "$want" ] && [ "$2" -lt "$want" ]
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
  local tr cov; tr=$(count_traces "$root"); cov=$(trace_coverage_pct "$root")
  info "oleans:     $n  (deps + own)"
  info "own pkg:    $own"
  info "traces:     $tr  (${cov}% coverage)"
  # Gutting is checked first: an evicted tree is the more urgent of the
  # two failures, and it is repairable by re-running restore.
  if is_gutted "$root" "$n"; then
    local want; want=$(read_stamp_count "$root")
    printf '\n  cache GUTTED — %s oleans on disk, %s were restored.\n' "$n" "$want"
    printf '  Something evicted them; `lake build` is the usual culprit.\n'
    printf '  Repair with: %s restore\n' "$PROG"
    return 3
  fi
  if [ "$n" -gt 0 ]; then
    printf '\n  cache PRESENT — %s oleans on disk.\n' "$n"
    if [ "$own" -eq 0 ]; then
      warn "but ZERO belong to this package — only its dependencies are cached."
      info "Anything importing the package's own modules still rebuilds, and"
      info "sibling .lean files will not elaborate standalone. Reseed with a"
      info "build that includes the package: $PROG seed (after a full build)."
    fi
    if [ "$cov" -lt 90 ]; then
      warn "trace coverage is only ${cov}% — \`lake build\` WILL rebuild the rest."
      info "Lake reads .trace, not .olean, to decide staleness, and rebuilding"
      info "evicts the untraced neighbours. This cache is usable for direct"
      info "\`lean\` + LEAN_PATH but NOT for a build. Reseed from a tree where"
      info "traces accompany the oleans."
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
  if is_gutted "$root" "$have"; then
    # Repair rather than no-op: the old `> 0` test called this "present"
    # and refused, so the only recovery was `rm -rf .lake`. Extraction
    # overlays the existing tree, restoring exactly the evicted files.
    local want; want=$(read_stamp_count "$root")
    warn "cache GUTTED — $have oleans on disk, $want were restored. Repairing."
  elif [ "$have" -gt 0 ]; then
    printf 'cache already present (%s oleans) — nothing to do.\n' "$have"
    printf 'Force a re-restore by removing %s/.lake first.\n' "$root"
    # Adopt an unstamped tree as its own baseline, so a cache restored by
    # an older version of this script (or built from source) still gets
    # shortfall protection from here on. Only ever written when absent —
    # re-stamping on every call would ratchet the baseline upward and
    # silently mask a gutting.
    if ! read_stamp_count "$root" >/dev/null 2>&1; then
      write_stamp "$root" "$have" "$br (adopted)"
      info "stamped this tree at $have oleans as the shortfall baseline."
    fi
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
  # Accept numeric OR alphabetic suffixes. `sort` orders both correctly
  # within a scheme, and tolerating both means a branch seeded by hand
  # with a default `split` still restores instead of reading as empty.
  local parts; parts=$(printf '%s\n' "$names" | grep -E '\.tgz\.part([0-9]+|[a-z]+)$' | sort)

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
  write_stamp "$root" "$n" "$br"
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


# ── No-shrink guard ─────────────────────────────────────────────────
#
# The enabling mechanism for agentic contribution, not just a safety net.
#
# If every authoring session can push its build back, the cache improves
# continuously — but only if a session that compiled a SUBSET can never
# replace a fuller cache. `seed` records its counts in the branch's
# commit message, so the incumbent's figures are readable without
# downloading ~1.6 GB of tarball blobs (`--filter=blob:none` fetches the
# commit and skips the payload).
#
# Returns 0 when publishing is safe, 1 when it would shrink the branch.
branch_counts() {  # branch -> "<oleans> <own>", empty if unreadable
  local ref="refs/lake-cache-prevcheck"
  git update-ref -d "$ref" 2>/dev/null || true
  timeout 60 git fetch --depth=1 --filter=blob:none -q origin "+$1:$ref" 2>/dev/null || return 1
  local msg; msg=$(git log -1 --format=%s "$ref" 2>/dev/null)
  git update-ref -d "$ref" 2>/dev/null || true
  printf '%s' "$msg" | sed -n 's/.*(\([0-9]*\) oleans, \([0-9]*\) own).*/\1 \2/p'
}

would_shrink() {  # branch cand_oleans cand_own
  local prev; prev=$(branch_counts "$1") || return 1
  [ -z "$prev" ] && return 1   # no recorded counts (new or legacy branch)
  local po pw; po=${prev%% *}; pw=${prev##* }
  info "incumbent $1: $po oleans, $pw own"
  # 90% tolerates churn between Mathlib revisions without tolerating a
  # partial build replacing a complete one.
  [ "$2" -lt $(( po * 90 / 100 )) ] || [ "$3" -lt $(( pw * 90 / 100 )) ]
}

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

  # Refuse to seed a package whose OWN modules are absent.
  #
  # This is the exact defect that shipped on lake-cache/qou-v4-24-0:
  # 7268 oleans, every one a dependency, zero QOU.*. The total looked
  # healthy, so nothing caught it, and every consumer since has
  # rebuilt the paper from source while believing the cache was warm.
  # `mathlib` is exempt — for that package the dependencies ARE the
  # payload and `.lake/build` is legitimately thin.
  local own; own=$(count_own_oleans "$root")
  if [ "$pkg" != "mathlib" ] && [ "$own" -eq 0 ]; then
    die "refusing to seed '$br': $n oleans present but ZERO belong to '$pkg'.
Only .lake/packages/ was populated — .lake/build/lib is empty, so the
package itself never built. Run a full \`lake build\` in $root first.
Seeding this would reproduce the bug it is meant to fix."
  fi

  # Refuse to publish a cache Lake will not trust.
  #
  # Oleans without their `.trace` siblings are invisible to Lake's
  # staleness check: it rebuilds them and evicts them in the process. A
  # branch seeded that way restores a big number and helps no build —
  # which is exactly the state lake-cache/qou-v4-24-0 is in (7268 oleans,
  # 775 traces). Catching it at seed time is the only place it is cheap.
  local cov; cov=$(trace_coverage_pct "$root")
  if [ "$cov" -lt 90 ]; then
    die "refusing to seed '$br': trace coverage is only ${cov}% ($(count_traces "$root") traces for $n oleans).
Lake reads .trace to decide staleness, so it would rebuild — and evict —
everything untraced. Seed from a tree where a real \`lake build\`
produced the traces alongside the oleans."
  fi

  # Never replace a fuller cache with a thinner one. This is what lets an
  # agent contribute a partial build without risking everyone else's.
  if [ "$PUSH" -eq 1 ] && would_shrink "$br" "$n" "$own"; then
    if [ "$FORCE" -eq 0 ]; then
      die "refusing to publish '$br': the candidate ($n oleans, $own own) is
materially smaller than what is already there. Usually this means a
partial build is about to overwrite a complete cache. Finish the build,
or pass --force for a deliberate downgrade."
    fi
    warn "--force: publishing a smaller cache than the incumbent"
  fi

  printf 'seeding %s from %s (%s oleans, %s own, %s%% traced)\n' "$br" "$root/.lake" "$n" "$own" "$cov"
  local tmp; tmp=$(mktemp -d) || die "mktemp failed"
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" RETURN

  # 90 MB parts: GitHub rejects blobs over 100 MB.
  #
  # `-d` is REQUIRED, not cosmetic. Without it `split` emits alphabetic
  # suffixes (`partaa`, `partab`), and the restore matches
  # `\.tgz\.part[0-9]+$` — so a seed made without `-d` produces parts
  # the restore cannot see, and reports the branch as carrying neither
  # parts nor a tree. The live branches are numeric (`part00`…), i.e.
  # they were NOT produced by this code path.
  #
  # `-a 3` gives headroom to 1000 parts (~90 GB); the default width of 2
  # errors out rather than extending once it runs out of suffixes.
  tar czf - -C "$root" .lake | split -d -a 3 -b 90m - "$tmp/lake-oleans.tgz.part" \
    || die "failed to create the split tarball"
  ( cd "$tmp" && for f in lake-oleans.tgz.part*; do mv "$f" "$(printf '%s' "$f")"; done )

  if [ "$PUSH" -eq 1 ]; then
    # CI path. Uses a detached worktree so the caller's working tree is
    # never switched — `git switch --orphan` in the main tree leaves
    # every file untracked and strands the job on switch-back.
    local wt; wt=$(mktemp -d) || die "mktemp failed"
    git worktree add --detach "$wt" >/dev/null 2>&1 || die "git worktree add failed"
    (
      cd "$wt" || exit 1
      git checkout --orphan "$br" >/dev/null 2>&1
      git rm -rf . >/dev/null 2>&1 || true
      cp "$tmp"/lake-oleans.tgz.part* .
      git add lake-oleans.tgz.part*
      git -c user.name=folio-lake-cache-bot \
          -c user.email=folio-lake-cache-bot@users.noreply.github.com \
          commit -q -m "lake-cache: $pkg at $slug ($n oleans, $own own)"
      git push -f origin "$br"
    )
    local rc=$?
    git worktree remove --force "$wt" >/dev/null 2>&1 || true
    [ "$rc" -ne 0 ] && die "push to '$br' failed"
    printf '\npushed %s (%s oleans, %s own)\n' "$br" "$n" "$own"
    return 0
  fi

  printf '\nParts written to %s\n' "$tmp"
  printf 'Push them to the orphan branch with:\n\n'
  printf '  git checkout --orphan %s\n  git rm -rf . >/dev/null\n  cp %s/lake-oleans.tgz.part* .\n' "$br" "$tmp"
  printf '  git add lake-oleans.tgz.part* && git commit -m "lake cache: %s"\n' "$br"
  printf '  git push -f origin %s\n\n' "$br"
  printf 'Or pass --push to do it automatically (CI).\n'
  printf 'Manual by default: seeding force-pushes an orphan branch, which is\n'
  printf 'destructive and should be a deliberate act.\n'
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
          | grep -E '\.tgz\.part([0-9]+|[a-z]+)$' | sort)
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

  # Elaborating is not the same as being usable. The toolchain cache
  # branch carries `.trace` and `.hash` files for the static libraries
  # but NONE of the `.a` files themselves, so `lean` runs while any
  # LINK step fails:
  #     /usr/bin/ld: cannot find -lleancpp
  # That kills `lake exe <anything>` — including `lake exe cache get`,
  # the standard way to obtain a properly-traced Mathlib. Reporting a
  # bare version string here would hide it.
  local libdir; libdir="$(dirname "$(dirname "$bin")")/lib/lean"
  local nlibs; nlibs=$(find "$libdir" -name '*.a' -type f 2>/dev/null | wc -l | tr -d ' ')

  printf '\nrestored %s\n' "$ver"
  printf '  binary: %s\n' "$bin"
  printf '  PATH:   export PATH="%s:$PATH"\n' "$(dirname "$bin")"
  if [ "$nlibs" -eq 0 ]; then
    warn "no static libraries (*.a) under $libdir"
    info "\`lean\` will elaborate, but every LINK fails (-lleancpp not found),"
    info "so \`lake exe …\` — including \`lake exe cache get\` — cannot run."
    info "Install the real toolchain for build work:"
    info "  elan toolchain install \$(cat lean-toolchain)"
    return 3
  fi
  info "static libs: $nlibs"
}


# ── Contribute ──────────────────────────────────────────────────────

# The agentic loop's last step: give this session's build back.
#
# An authoring session restores the cache, drafts and compiles Lean, and
# ends holding a `.lake` that is strictly better than the one it started
# from. `contribute` publishes that, so the next agent starts warmer.
# Every guard `seed` has applies — own-package oleans, trace coverage,
# and the no-shrink check — so a session that only compiled a subtree
# cannot degrade the shared cache.
cmd_contribute() {
  local root; root=$(resolve_lake_root)
  local slug pkg
  slug=$(toolchain_slug "$root") || die "no lean-toolchain"
  pkg=$(resolve_package "$root"); [ -z "$pkg" ] && die "pass --package NAME"

  printf 'contributing this build to lake-cache/%s-%s\n' "$pkg" "$slug"
  info "oleans: $(count_oleans "$root")   own: $(count_own_oleans "$root")   traces: $(trace_coverage_pct "$root")%"
  PUSH=1
  BRANCH="${BRANCH:-lake-cache/$pkg-$slug}"
  cmd_seed
}

# ── List / doctor ───────────────────────────────────────────────────

# Cached for the process: `resolve_package` may consult this, and status
# / doctor call it again. Also TIMED OUT — `git ls-remote` blocks
# indefinitely against an unreachable or auth-prompting remote, which
# would hang a CI job (and did hang an interactive run) with no output.
# An empty list degrades gracefully: package inference declines and the
# caller is told to pass --package.
_LIST_CACHE=""
_LIST_DONE=0
cmd_list_names() {
  if [ "$_LIST_DONE" -eq 0 ]; then
    _LIST_DONE=1
    _LIST_CACHE=$(timeout 30 git ls-remote --heads origin 'refs/heads/lake-cache/*' 2>/dev/null \
      | sed 's#.*refs/heads/##' | sort)
  fi
  printf '%s\n' "$_LIST_CACHE"
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
  local have; have=$(count_oleans "$root")
  if is_gutted "$root" "$have"; then
    printf 'cache GUTTED (%s on disk, %s restored) — run `%s restore` to repair.\n' \
      "$have" "$(read_stamp_count "$root")" "$PROG"
  elif [ "$have" -gt 0 ]; then
    # Deliberately NOT "build directly": `lake build` re-resolves the dep
    # graph and can evict most of a restored Mathlib (7268 -> 459 observed),
    # so recommending it as the next step after a restore is what destroys
    # the restore. To CHECK a file, `lean`-direct reuses the oleans and
    # touches nothing.
    printf 'cache is present.\n'
    printf '  verify a file:  LEAN_PATH=<deps> lean path/to/File.lean\n'
    printf '  build:          lake build  — WARNING: may evict restored oleans;\n'
    printf '                  re-check with `%s status` afterwards.\n' "$PROG"
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
  contribute) cmd_contribute ;;
  list)    cmd_list ;;
  doctor)  cmd_doctor ;;
  ""|help|-h|--help) usage ;;
  *) die "unknown command: $CMD (try: status restore restore-toolchain build-aware: contribute, seed, list, doctor)" ;;
esac
