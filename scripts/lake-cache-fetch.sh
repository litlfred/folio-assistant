#!/usr/bin/env bash
# scripts/lake-cache-fetch.sh — agent-side Tier-2 cache fetch
#
# Fetches the pre-built `.lake/` artifacts from the populated orphan
# branch `lake-cache/qou-v<toolchain-slug>` and extracts them into the
# repo root. The CI-side equivalent lives at
# `.github/actions/lake-cache-restore/action.yml` (Tier 2 step); this
# script is the local-agent equivalent for sessions in ephemeral
# containers where `lake build` from source would take 1-3 hours and
# `lake exe cache get` 403s on the Mathlib oleans CDN.
#
# Storage format on the orphan branch (as of 2026-06-04 reseed):
# the `.lake/` tree is bundled as a gzipped tarball split into
# `lake-oleans.tgz.part00`..`partNN` chunks of ≤ 100 MB each (under
# GitHub's per-blob limit). This script fetches the branch shallowly,
# concatenates the parts, untars into the repo root, then prunes.
#
# Usage:
#   ./scripts/lake-cache-fetch.sh           # default: qou package, toolchain auto-detected
#   ./scripts/lake-cache-fetch.sh --force   # re-extract even if .lake/build/lib/ exists
#   ./scripts/lake-cache-fetch.sh --branch lake-cache/qou-v4-24-0   # explicit branch
#
# Exit codes:
#   0 = cache restored OR already warm
#   1 = orphan branch not found, fetch failed, or extraction failed
#   2 = bad invocation

set -uo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Parse flags.
FORCE=0
BRANCH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --force) FORCE=1 ; shift ;;
    --branch)
      if [ $# -lt 2 ] || [ -z "${2:-}" ]; then
        echo "lake-cache-fetch: --branch requires a non-empty value" >&2
        exit 2
      fi
      BRANCH="$2" ; shift 2 ;;
    -h|--help)
      sed -n '2,30p' "$0" | sed 's|^# ||;s|^#||'
      exit 0
      ;;
    *) echo "Unknown flag: $1" >&2 ; exit 2 ;;
  esac
done

# Auto-derive branch name from lean-toolchain if not provided.
if [ -z "$BRANCH" ]; then
  if [ ! -f lean-toolchain ]; then
    echo "lake-cache-fetch: no lean-toolchain file at repo root" >&2
    exit 1
  fi
  toolchain=$(grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' lean-toolchain | head -1)
  if [ -z "$toolchain" ]; then
    echo "lake-cache-fetch: could not parse toolchain version from lean-toolchain" >&2
    exit 1
  fi
  slug=$(echo "$toolchain" | tr '.' '-')
  BRANCH="lake-cache/qou-${slug}"
fi

# Warm-cache short-circuit unless --force. The signal is the mathlib
# oleans dir — that's the heavy artefact this script exists to restore
# and it matches the check in setup-lean-toolchain.sh (Copilot review
# on PR #1950: both scripts must use the same readiness signal).
WARMSIG="$REPO_ROOT/.lake/packages/mathlib/.lake/build/lib"
if [ "$FORCE" -eq 0 ] && [ -d "$WARMSIG" ]; then
  count=$(find "$WARMSIG" -maxdepth 1 -mindepth 1 2>/dev/null | wc -l)
  if [ "$count" -gt 0 ]; then
    echo "lake-cache-fetch: mathlib oleans already populated ($count entries); use --force to re-extract"
    exit 0
  fi
fi

echo "lake-cache-fetch: fetching orphan branch '$BRANCH' from origin"
# Shallow-fetch the orphan branch (no history). Tolerate fetch failure.
if ! git fetch --depth=1 origin "$BRANCH" 2>&1 | tail -5; then
  echo "lake-cache-fetch: ERROR — orphan branch '$BRANCH' does not exist on origin" >&2
  echo "  Hint: refresh the cache via the lake-cache-refresh.yml workflow_dispatch," >&2
  echo "  or set --branch <name> if your toolchain differs from the populated branch." >&2
  exit 1
fi

# Detect the orphan-branch format. Two formats are supported:
#
#   1. PER-FILE (preferred, matches lake-cache-refresh.yml workflow):
#      tip tree has a `.lake/` directory with one git blob per file.
#      Restore = `git archive --format=tar FETCH_HEAD -- .lake` then untar.
#      Granular (diffable), no chunking, integrates with CI's existing
#      Action restore path.
#
#   2. CHUNKED-TGZ (legacy 2026-06-04 reseed format):
#      tip tree has lake-oleans.tgz.partXX blobs. Restore = stream blobs,
#      concat in sorted order, untar.
#
# Detection precedence: the per-file `.lake/` tree is the preferred
# (and maintainable) format. If the top tree contains `.lake/`, that
# path wins — EVEN if `lake-oleans.tgz.partNN` blobs are also present.
# A branch with both formats only arises during a manual transition
# (won't happen by accident); in that case we want per-file. If only
# the chunked-tgz blobs are present, we fall through to that path.
TMP=$(mktemp -d -t lake-cache-fetch.XXXXXX)
# Bake $TMP value into the trap string at definition time (the value is
# stable for the script's lifetime, so this is intentional). Double-
# quoted outer + explicit ${TMP} avoids any single-quote ambiguity per
# the Copilot review on PR #1950.
trap "rm -rf ${TMP}" EXIT INT TERM

top_tree=$(git ls-tree --name-only FETCH_HEAD 2>/dev/null)
parts=$(echo "$top_tree" | grep -E '^lake-oleans\.tgz\.part[0-9]+$' | sort)
has_lake_dir=$(echo "$top_tree" | grep -E '^\.lake$' | head -1)

# Per-file format takes precedence — it's the maintainable one.
if [ -n "$has_lake_dir" ]; then
  echo "lake-cache-fetch: detected per-file format on $BRANCH"
  echo "lake-cache-fetch: extracting .lake/ tree via git archive"
  mkdir -p "$TMP/extract"
  if ! git archive --format=tar FETCH_HEAD -- .lake \
        | tar -xf - -C "$TMP/extract" 2>&1 | tail -3; then
    echo "lake-cache-fetch: ERROR — git archive extraction failed" >&2
    exit 1
  fi
  if [ ! -d "$TMP/extract/.lake" ]; then
    echo "lake-cache-fetch: ERROR — git archive did not produce .lake/" >&2
    exit 1
  fi
  rm -rf "$REPO_ROOT/.lake"
  mv "$TMP/extract/.lake" "$REPO_ROOT/.lake"

  # Verify with same signal both scripts use.
  WARMSIG="$REPO_ROOT/.lake/packages/mathlib/.lake/build/lib"
  if [ ! -d "$WARMSIG" ]; then
    echo "lake-cache-fetch: ERROR — per-file extract did not produce $WARMSIG" >&2
    exit 1
  fi
  lib_count=$(find "$WARMSIG" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
  lake_size=$(du -sh "$REPO_ROOT/.lake" 2>/dev/null | awk '{print $1}')
  echo "lake-cache-fetch: ✓ restored .lake/ from $BRANCH (per-file)"
  echo "  .lake/ size:           $lake_size"
  echo "  mathlib lib has        $lib_count top-level directories"
  echo ""
  echo "Next: 'lake build QOU' should now complete in seconds rather than hours."
  exit 0
fi

# Chunked-tgz fallback (legacy format).
echo "lake-cache-fetch: detected chunked-tgz format on $BRANCH (legacy)"

if [ -z "$parts" ]; then
  echo "lake-cache-fetch: ERROR — branch $BRANCH has no lake-oleans.tgz.part* blobs" >&2
  echo "  Branch tree:" >&2
  git ls-tree --name-only FETCH_HEAD 2>&1 | head -10 | sed 's/^/    /' >&2
  exit 1
fi

n_parts=$(echo "$parts" | wc -l)
echo "lake-cache-fetch: found $n_parts chunks; extracting blobs to $TMP"

# Extract each part blob to the temp dir. `git show <ref>:<path>`
# streams the blob content to stdout.
for p in $parts; do
  if ! git show "FETCH_HEAD:$p" > "$TMP/$p" 2>/dev/null; then
    echo "lake-cache-fetch: ERROR — failed to extract blob $p" >&2
    exit 1
  fi
done

# Concatenate parts into one tarball IN THE SORTED ORDER computed above.
# A naive `cat $TMP/*.part*` glob would put part10 before part2,
# corrupting the archive (Copilot review on PR #1950).
echo "lake-cache-fetch: assembling tarball + extracting into $REPO_ROOT"
> "$TMP/lake-oleans.tgz"
for p in $parts; do
  cat "$TMP/$p" >> "$TMP/lake-oleans.tgz"
done
tar_size=$(stat -c '%s' "$TMP/lake-oleans.tgz" 2>/dev/null || stat -f '%z' "$TMP/lake-oleans.tgz")
echo "  assembled tarball: $((tar_size / 1024 / 1024)) MB"

# Validate every entry path is under '.lake/' and contains no traversal
# / absolute-path components before extracting. Defense-in-depth even
# though the source is a controlled internal orphan branch (Copilot
# review on PR #1950: a malicious or corrupted tarball could otherwise
# write outside .lake/ via absolute paths or '..' traversal).
bad_entries=$(tar -tzf "$TMP/lake-oleans.tgz" 2>/dev/null \
  | awk '/^\// || /(^|\/)\.\.($|\/)/ || !/^(\.lake\/|content\/.*\/\.lake\/)/' | head -5)
if [ -n "$bad_entries" ]; then
  echo "lake-cache-fetch: ERROR — tarball contains entries outside .lake/ or with traversal" >&2
  echo "  Offending entries (first 5):" >&2
  echo "$bad_entries" | sed 's/^/    /' >&2
  exit 1
fi

# Extract into the repo root. GNU tar's default behavior is to strip
# leading slashes from member names (since tar 1.35 `--no-absolute-names`
# is removed as redundant — the default IS that behavior). Path
# validation above is the primary defense; tar's default-strip is
# defense-in-depth. Stage into a temp dir then rename so partial
# extraction can't leave a half-populated .lake/.
mkdir -p "$TMP/extract"
if ! tar -xzf "$TMP/lake-oleans.tgz" -C "$TMP/extract" 2>&1 | tail -5; then
  echo "lake-cache-fetch: ERROR — tar extraction failed" >&2
  exit 1
fi
if [ ! -d "$TMP/extract/.lake" ]; then
  echo "lake-cache-fetch: ERROR — tarball did not produce .lake/ at top level" >&2
  exit 1
fi
# Atomic-ish replace: remove any existing partial .lake/, then move.
rm -rf "$REPO_ROOT/.lake.staging" "$REPO_ROOT/.lake"
mv "$TMP/extract/.lake" "$REPO_ROOT/.lake"

# Verify the extraction populated the mathlib oleans (the heavy part
# we care about). Both this script and setup-lean-toolchain.sh use the
# same readiness signal — '.lake/packages/mathlib/.lake/build/lib' —
# per the Copilot review on PR #1950.
WARMSIG="$REPO_ROOT/.lake/packages/mathlib/.lake/build/lib"
if [ ! -d "$WARMSIG" ]; then
  echo "lake-cache-fetch: ERROR — extraction did not produce $WARMSIG" >&2
  echo "  Extracted .lake/ top-level:" >&2
  ls -1 "$REPO_ROOT/.lake" | head -5 | sed 's/^/    /' >&2
  exit 1
fi

lib_count=$(find "$WARMSIG" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l)
lake_size=$(du -sh "$REPO_ROOT/.lake" 2>/dev/null | awk '{print $1}')
echo "lake-cache-fetch: ✓ restored .lake/ from $BRANCH"
echo "  .lake/ size:         $lake_size"
echo "  mathlib lib has $lib_count top-level directories"
echo ""
echo "Next: 'lake build QOU' should now complete in seconds rather than hours."
