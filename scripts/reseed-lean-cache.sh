#!/usr/bin/env bash
# Rebuild a Lean cache branch from scratch, safely and resumably.
#
# Automates docs/guides/reseeding-the-lean-cache.md. The manual procedure
# has two ordering traps that cost hours when missed, so they are
# ENFORCED here rather than documented:
#
#   1. An incomplete extracted toolchain must be removed BEFORE running
#      elan. It sits at exactly the path elan expects, so elan concludes
#      a toolchain is installed, skips the download, and leaves a `lean`
#      that elaborates but cannot link — surfacing much later as
#      `-lleancpp not found`.
#   2. `lake exe cache get` must run BEFORE `lake build`. Mathlib's
#      upstream cache ships oleans WITH their traces (the missing
#      ingredient) in minutes; building from source takes hours. It only
#      works once the toolchain links, hence the order.
#
# SAFE BY DEFAULT: seeds to `<branch>-test` and verifies a restore from a
# clean clone. Publishing to the production branch requires `--promote`,
# because an orphan branch carries no history and a bad force-push is not
# recoverable.
#
# RUNS FROM ANY BRANCH. Your working tree is never switched, and the
# script refuses to run rather than disturb uncommitted work.
#
# USAGE
#
#   scripts/reseed-lean-cache.sh --repo ~/src/qou [OPTIONS]
#
#   --repo DIR        Content repo (required)
#   --package NAME    Roster package (default: qou)
#   --lake-root DIR   Override the roster's lake-root
#   --target T        Build only this Lake target — chip across sessions
#   --phase P         Run one phase: toolchain|cache|build|seed|verify|promote
#   --promote         Publish to the PRODUCTION branch (implies verify)
#   --auto-promote    Same, but publish WITHOUT the final prompt, provided
#                     verification AND the regression check both pass
#   --force           Promote even if the candidate is smaller than the
#                     branch it replaces (a deliberate downgrade)
#   --yes             Do not prompt
#   --dry-run         Print what would run, change nothing
#
# Phases run in order and are individually resumable: each detects
# whether its work is already done and skips.
set -uo pipefail

PROG="${0##*/}"
FA_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CACHE_SVC="$FA_ROOT/scripts/lake-cache.sh"

REPO=""; PACKAGE="qou"; LAKE_ROOT=""; TARGET=""; PHASE=""
PROMOTE=0; AUTO_PROMOTE=0; FORCE=0; ASSUME_YES=0; DRY=0

die()  { printf '%s: %s\n' "$PROG" "$*" >&2; exit 2; }
say()  { printf '\n\033[1m== %s\033[0m\n' "$*"; }
info() { printf '   %s\n' "$*"; }
warn() { printf '   ! %s\n' "$*" >&2; }
run()  { if [ "$DRY" -eq 1 ]; then printf '   [dry-run] %s\n' "$*"; else eval "$@"; fi; }

while [ $# -gt 0 ]; do
  case "$1" in
    --repo)      REPO="${2:-}"; shift 2 ;;
    --package)   PACKAGE="${2:-}"; shift 2 ;;
    --lake-root) LAKE_ROOT="${2:-}"; shift 2 ;;
    --target)    TARGET="${2:-}"; shift 2 ;;
    --phase)     PHASE="${2:-}"; shift 2 ;;
    --promote)   PROMOTE=1; shift ;;
    --auto-promote) AUTO_PROMOTE=1; PROMOTE=1; shift ;;
    --force)     FORCE=1; shift ;;
    --yes|-y)    ASSUME_YES=1; shift ;;
    --dry-run)   DRY=1; shift ;;
    -h|--help)   sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "unknown option: $1" ;;
  esac
done

[ -n "$REPO" ] || die "--repo is required (the CONTENT repo, e.g. ~/src/qou)"
REPO="$(cd "$REPO" 2>/dev/null && pwd)" || die "no such --repo directory"
[ -f "$CACHE_SVC" ] || die "cache service not found at $CACHE_SVC"

confirm() {  # prompt
  [ "$ASSUME_YES" -eq 1 ] && return 0
  [ "$DRY" -eq 1 ] && return 0
  printf '\n   %s [y/N] ' "$1"
  read -r a </dev/tty || return 1
  case "$a" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}

phase_wanted() {  # name
  [ -z "$PHASE" ] && return 0
  [ "$PHASE" = "$1" ]
}

# ── Resolve paths ───────────────────────────────────────────────────

if [ -z "$LAKE_ROOT" ]; then
  roster="$REPO/.github/lake-packages.json"
  if [ -f "$roster" ]; then
    LAKE_ROOT=$(python3 - "$roster" "$PACKAGE" <<'PY' 2>/dev/null
import json, sys
try:
    for p in json.load(open(sys.argv[1])).get("packages", []):
        if p.get("package") == sys.argv[2]:
            print(p.get("lake-root", ".")); break
except Exception:
    pass
PY
)
  fi
fi
[ -n "$LAKE_ROOT" ] || die "could not resolve a lake-root for package '$PACKAGE'.
Pass --lake-root, or add the package to $REPO/.github/lake-packages.json"

ABS_LAKE="$REPO/$LAKE_ROOT"
[ "$LAKE_ROOT" = "." ] && ABS_LAKE="$REPO"
[ -d "$ABS_LAKE" ] || die "lake-root does not exist: $ABS_LAKE"
[ -f "$ABS_LAKE/lean-toolchain" ] || [ -f "$REPO/lean-toolchain" ] \
  || die "no lean-toolchain in $ABS_LAKE or $REPO"

TOOLCHAIN=$(cat "$ABS_LAKE/lean-toolchain" 2>/dev/null || cat "$REPO/lean-toolchain")
TOOLCHAIN="$(printf '%s' "$TOOLCHAIN" | tr -d '[:space:]')"
SLUG="$(printf '%s' "${TOOLCHAIN##*:}" | tr . -)"
PROD_BRANCH="lake-cache/$PACKAGE-$SLUG"
TEST_BRANCH="$PROD_BRANCH-test"

# elan's on-disk name for a pin: `/` -> `--`, `:` -> `---`, giving
# `leanprover--lean4---v4.24.0`.
#
# This was `tr '/:' '--'`, which replaces single characters and yields
# `leanprover-lean4-v4.24.0` — a path no elan install ever has. So the
# phase-1 guard against a non-linking toolchain tested a directory that
# never exists and never fired, i.e. trap (1) in this script's header was
# unenforced by the code meant to enforce it.
TC_DIR="$HOME/.elan/toolchains/$(printf '%s' "$TOOLCHAIN" | sed -e 's#/#--#g' -e 's#:#---#g')"

# A direct (non-elan) install has no `~/.elan/bin` shims, so the
# toolchain's own bin must be on PATH or phases 2+ cannot find `lake`.
export PATH="$TC_DIR/bin:$HOME/.elan/bin:$PATH"

# ── Phase 0: preflight ──────────────────────────────────────────────
#
# Runs unconditionally, including under --phase, because every later
# phase assumes it passed.

say "Preflight"
CURRENT_BRANCH=$(git -C "$REPO" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
info "repo:       $REPO"
info "branch:     $CURRENT_BRANCH   (never switched by this script)"
info "package:    $PACKAGE"
info "lake-root:  $LAKE_ROOT"
info "toolchain:  $TOOLCHAIN  -> slug $SLUG"
info "branches:   $TEST_BRANCH  ->  $PROD_BRANCH"

# Uncommitted work: `lake build` writes into .lake/ (normally ignored),
# but a dirty tree plus a worktree operation is how people lose changes.
# Refuse rather than risk it.
if [ -n "$(git -C "$REPO" status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  warn "the working tree has uncommitted TRACKED changes."
  info "Seeding adds a git worktree; commit or stash first so nothing is at risk."
  git -C "$REPO" status --short --untracked-files=no | head -10
  confirm "Continue anyway?" || die "stopped — commit or stash, then re-run"
fi

# A local branch with the cache name blocks `git checkout --orphan` inside
# the seed worktree. Harmless to delete: the real branch lives on origin
# and these locals are leftovers from a previous run.
for b in "$PROD_BRANCH" "$TEST_BRANCH"; do
  if git -C "$REPO" show-ref --verify --quiet "refs/heads/$b"; then
    warn "local branch '$b' exists and would block the seed worktree"
    if confirm "Delete the LOCAL branch '$b'? (origin is untouched)"; then
      run "git -C '$REPO' branch -D '$b'"
    else
      die "stopped — delete it or the seed will fail"
    fi
  fi
done

# Stale worktrees from an interrupted run.
if git -C "$REPO" worktree list 2>/dev/null | grep -q 'lake-cache\|detached'; then
  info "pruning stale worktrees"
  run "git -C '$REPO' worktree prune"
fi

command -v python3 >/dev/null 2>&1 || die "python3 not found (roster parsing)"
info "OK"

# ── Phase 1: toolchain ──────────────────────────────────────────────

if phase_wanted toolchain; then
  say "Phase 1 — toolchain"

  # Scoped to THIS pin. A tree-wide `find ~/.elan/toolchains` is satisfied
  # by a linkable install of some OTHER version, which then skips the
  # install and leaves this build unable to link.
  if find "$TC_DIR" -name 'libleancpp.a' -type f 2>/dev/null | grep -q .; then
    info "a linkable $TOOLCHAIN is already installed — skipping"
  else
    # Direct from GitHub releases FIRST. elan's own hosts
    # (elan.lean-lang.org, release.lean-lang.org) are unreachable behind
    # some egress proxies — the failure that stalled this whole reseed
    # and sent it to CI — while github.com release assets serve the very
    # same toolchain. The service also removes a non-linking tree at
    # $TC_DIR itself, so trap (1) is enforced where it is tested.
    info "installing $TOOLCHAIN (direct from GitHub releases)"
    if [ "$DRY" -eq 1 ]; then
      info "[dry-run] bash $CACHE_SVC install-toolchain --toolchain '$TOOLCHAIN'"
    elif ! ( cd "$REPO" && bash "$CACHE_SVC" install-toolchain --toolchain "$TOOLCHAIN" ); then
      warn "direct install did not succeed — falling back to elan"
      if [ -d "$TC_DIR" ] \
         && ! find "$TC_DIR" -name 'libleancpp.a' -type f 2>/dev/null | grep -q .; then
        warn "an existing toolchain at $TC_DIR has NO static libraries."
        info "elan would see it and skip the download, leaving a lean that"
        info "cannot link. It must be removed first."
        confirm "Remove $TC_DIR?" || die "stopped — cannot proceed with a non-linking toolchain"
        run "rm -rf '$TC_DIR'"
      fi
      if ! command -v elan >/dev/null 2>&1; then
        info "installing elan"
        run "curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain '$TOOLCHAIN'"
      else
        run "elan toolchain install '$TOOLCHAIN'"
      fi
    fi
  fi

  if [ "$DRY" -eq 0 ]; then
    find "$TC_DIR" -name 'libleancpp.a' -type f 2>/dev/null | grep -q . \
      || die "still no static libraries for $TOOLCHAIN.
\`lean\` may elaborate but nothing will LINK, so \`lake exe cache get\`
(phase 2) cannot run.
Tried the direct GitHub-releases install, then elan. If both failed on
the network: elan's hosts are blocked behind some proxies, but
github.com release assets usually are not — check that first."
    info "static libs present ✓"
  fi
fi

# ── Phase 2: traced Mathlib ─────────────────────────────────────────

if phase_wanted cache; then
  say "Phase 2 — Mathlib upstream cache (supplies the TRACES)"
  # Must run FROM the content repo: lake-cache.sh derives its repo root
  # from `git rev-parse` in the current directory, so invoking it from
  # the platform checkout would resolve folio-assistant as the content
  # repo and read the wrong roster.
  # Scraped from `status`'s human-readable output, so the two are
  # COUPLED: renaming that line silently degrades this to 0. It already
  # did once — `traces: N (P% coverage)` became
  # `traced: N/M oleans (P%)` and this quietly reported 0% on a fully
  # traced tree. Failing to 0 is the safe direction (it fetches, and
  # `cache get` is idempotent), but silence hides the breakage, so say so.
  status_out=$(cd "$REPO" && bash "$CACHE_SVC" status --package "$PACKAGE" --lake-root "$ABS_LAKE" 2>/dev/null)
  cov=$(printf '%s\n' "$status_out" \
        | sed -n 's/^ *traced: *[0-9]*\/[0-9]* oleans *(\([0-9]*\)%).*/\1/p' | head -1)
  if [ -z "$cov" ]; then
    warn "could not read trace coverage from \`$CACHE_SVC status\` — assuming 0%"
    info "(its output format may have changed; this parser needs updating)"
    cov=0
  fi
  nol=$(printf '%s\n' "$status_out" | sed -n 's/^ *oleans: *\([0-9]*\).*/\1/p' | head -1)
  nol="${nol:-0}"
  # Coverage is a RATIO, so a nearly-empty tree scores 100% on a handful
  # of oleans and would skip fetching thousands. Observed: a partially
  # built tree with 13 oleans, all traced, sailing past a 90% gate while
  # Mathlib's ~7300 modules were absent. Require both.
  #
  # The floor is deliberately crude — any Mathlib-backed tree has
  # thousands — and erring low is safe because `lake exe cache get` is
  # idempotent and returns quickly when everything is already present.
  if [ "$cov" -ge 90 ] && [ "$nol" -ge 1000 ]; then
    info "trace coverage already ${cov}% over $nol oleans — skipping"
  else
    [ "$cov" -ge 90 ] && [ "$nol" -lt 1000 ] \
      && info "coverage ${cov}% but only $nol oleans — ratio is high because the tree is nearly empty"
    # Reachability FIRST. `cache get` resolves every module before it
    # downloads, so an unreachable CDN surfaces as ~7300 individual
    # "Transfer failed … CONNECT tunnel failed, response 403" lines and a
    # final "Downloaded: 0 file(s)" — minutes of output that looks like a
    # cache problem and is actually egress. Observed here: the toolchain
    # host is reachable and `cache:exe` links and runs, while the cache
    # CDN itself is blocked. These are INDEPENDENT restrictions; do not
    # infer one from the other.
    if [ "$DRY" -eq 0 ] \
       && ! curl -sS -o /dev/null --max-time 20 -I https://mathlib4.lean-cache.cloud/ 2>/dev/null; then
      die "Mathlib's cache CDN is unreachable from here.

  mathlib4.lean-cache.cloud        no route
  lakecache.blob.core.windows.net  no route

\`lake exe cache get\` would attempt every module and fail every one.
This is separate from the toolchain: \`install-toolchain\` works over
github.com, but no equivalent GitHub-hosted mirror of Mathlib's oleans
exists, so there is nothing to fall back to.

Run this phase where the CDN is reachable — CI, or a local machine —
or build from source with --phase build (hours)."
    fi
    info "coverage ${cov}% — fetching upstream cache (minutes, vs hours from source)"
    run "cd '$ABS_LAKE' && lake exe cache get"
  fi
fi

# ── Phase 3: build the package's own modules ────────────────────────

if phase_wanted build; then
  say "Phase 3 — build${TARGET:+ (target: $TARGET)}"
  info "First full build is hours. Later builds are incremental once traced."
  info "Chip across sessions with --target <SubTree>, seeding after each."
  run "cd '$ABS_LAKE' && lake build ${TARGET}"
  [ "$DRY" -eq 0 ] && ( cd "$REPO" && bash "$CACHE_SVC" status --package "$PACKAGE" --lake-root "$ABS_LAKE" ) || true
fi

# ── Phase 4: seed to the TEST branch ────────────────────────────────

if phase_wanted seed; then
  say "Phase 4 — seed to $TEST_BRANCH"
  info "Test branch first: an orphan branch has no history, so a bad"
  info "force-push to production cannot be undone."
  run "cd '$REPO' && bash '$CACHE_SVC' seed --package '$PACKAGE' --lake-root '$ABS_LAKE' --branch '$TEST_BRANCH' --push"
fi

# ── Phase 5: verify from a CLEAN clone ──────────────────────────────

if phase_wanted verify || [ "$PROMOTE" -eq 1 ]; then
  say "Phase 5 — verify $TEST_BRANCH restores into a clean clone"
  ORIGIN=$(git -C "$REPO" remote get-url origin 2>/dev/null) || die "no origin remote"
  VDIR=$(mktemp -d)
  info "clone: $VDIR"
  if [ "$DRY" -eq 0 ]; then
    git clone --depth 1 -q "$ORIGIN" "$VDIR/repo" || die "verify clone failed"
    VLAKE="$VDIR/repo/$LAKE_ROOT"; [ "$LAKE_ROOT" = "." ] && VLAKE="$VDIR/repo"
    ( cd "$VLAKE" && bash "$CACHE_SVC" restore --package "$PACKAGE" --branch "$TEST_BRANCH" ) \
      || { rm -rf "$VDIR"; die "restore from $TEST_BRANCH FAILED — do not promote"; }
    out=$( cd "$VLAKE" && bash "$CACHE_SVC" status --package "$PACKAGE" 2>&1 )
    printf '%s\n' "$out" | sed 's/^/   /'
    rm -rf "$VDIR"

    own=$(printf '%s' "$out" | sed -n 's/.*own pkg: *\([0-9]*\).*/\1/p')
    cov=$(printf '%s' "$out" | sed -n 's/.*traces:.*(\([0-9]*\)% coverage).*/\1/p')
    [ "${own:-0}" -gt 0 ] || die "verify FAILED: own-package oleans are 0.
That is the defect this reseed exists to fix — do not promote."
    [ "${cov:-0}" -ge 90 ] || die "verify FAILED: trace coverage ${cov:-0}%.
A build would rebuild and evict the shortfall — do not promote."
    info "verified: own=$own, traces=${cov}% ✓"
    # Carried into the regression check below.
    VERIFIED_OLEANS=$(printf '%s' "$out" | sed -n 's/.*oleans: *\([0-9]*\).*/\1/p' | head -1)
    VERIFIED_OWN="$own"
  fi
fi


# ── Regression guard ────────────────────────────────────────────────
#
# Verification proves the candidate is INTERNALLY sound (own oleans
# present, traces complete). It says nothing about whether the candidate
# is better than what it would replace — and with `--target` chipping,
# a partial build passes verification while carrying a fraction of the
# modules. Auto-promoting that would silently shrink the cache for
# everyone.
#
# `seed` records counts in the branch's commit message, so the previous
# figures are readable without downloading ~1.6 GB of tarball blobs:
# `--filter=blob:none` fetches the commit and skips the payload.
prod_counts() {  # -> "<oleans> <own>", empty when unreadable
  local tmpref="refs/reseed-prodcheck"
  git -C "$REPO" update-ref -d "$tmpref" 2>/dev/null || true
  git -C "$REPO" fetch --depth=1 --filter=blob:none -q origin \
      "+$PROD_BRANCH:$tmpref" 2>/dev/null || return 1
  local msg; msg=$(git -C "$REPO" log -1 --format=%s "$tmpref" 2>/dev/null)
  git -C "$REPO" update-ref -d "$tmpref" 2>/dev/null || true
  printf '%s' "$msg" | sed -n 's/.*(\([0-9]*\) oleans, \([0-9]*\) own).*/\1 \2/p'
}

check_regression() {  # cand_oleans cand_own -> 0 ok, 1 regression
  local co="$1" cw="$2"
  local prev; prev=$(prod_counts) || { info "no readable production counts — nothing to compare"; return 0; }
  [ -z "$prev" ] && { info "production branch predates count recording — nothing to compare"; return 0; }
  local po pw; po=$(printf '%s' "$prev" | cut -d' ' -f1); pw=$(printf '%s' "$prev" | cut -d' ' -f2)
  info "production now: $po oleans, $pw own"
  info "candidate:      $co oleans, $cw own"
  # 90%: tolerates churn between Mathlib revisions without tolerating a
  # partial build replacing a complete one.
  if [ "$co" -lt $(( po * 90 / 100 )) ] || [ "$cw" -lt $(( pw * 90 / 100 )) ]; then
    return 1
  fi
  return 0
}

# ── Phase 6: promote ────────────────────────────────────────────────

if [ "$PROMOTE" -eq 1 ] || [ "$PHASE" = "promote" ]; then
  say "Phase 6 — promote to $PROD_BRANCH"

  if [ "$DRY" -eq 0 ] && [ -n "${VERIFIED_OLEANS:-}" ]; then
    if ! check_regression "$VERIFIED_OLEANS" "$VERIFIED_OWN"; then
      warn "the candidate is materially SMALLER than the branch it would replace."
      info "Usually this means a partial build (--target) is about to overwrite a"
      info "complete cache. Finish the build, or pass --force for a deliberate"
      info "downgrade."
      [ "$FORCE" -eq 1 ] || die "stopped — refusing to shrink $PROD_BRANCH"
      warn "--force given; promoting a smaller cache anyway"
    fi
  fi

  if [ "$AUTO_PROMOTE" -eq 1 ]; then
    info "auto-promote: verification and regression checks passed"
  else
    warn "This FORCE-PUSHES the production cache branch. It has no history."
    confirm "Publish to $PROD_BRANCH?" || die "stopped — nothing published"
  fi
  run "cd '$REPO' && bash '$CACHE_SVC' seed --package '$PACKAGE' --lake-root '$ABS_LAKE' --branch '$PROD_BRANCH' --push"
  say "Done — $PROD_BRANCH published"
else
  say "Stopped before promotion (by design)"
  info "Verified content is on $TEST_BRANCH."
  info "Publish with:  $PROG --repo '$REPO' --package '$PACKAGE' --promote"
  info "Or in one pass:  … --auto-promote   (no prompt; still gated on"
  info "                 verification AND the no-shrink regression check)"
fi
