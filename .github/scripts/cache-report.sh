#!/usr/bin/env bash
#
# The daily cache report: hit rate per cached step, and the Actions cache
# budget (`.github/actions/cached-step/README.md`, "Budget").
#
# 1. Hit rate. Every `cached-step` restore uploads a record named
#    cached-step--<step>--<hit|warm|miss>--<unique>, so the NAMES say it all and
#    nothing is downloaded. Counted over the last HOURS (default 24).
# 2. Budget. GET actions/cache/usage, and the caches grouped by namespace
#    (the key up to its first digest-like segment) with their size.
# 3. Prune (--prune). Deletes only entries scoped to a CLOSED pull request's
#    merge ref: GitHub lets nothing but that PR's own runs read them, and a
#    closed PR has no more runs, so they are unreadable by anyone and only
#    take budget. Nothing main, or an open PR, can read is ever deleted here;
#    LRU eviction at the 10 GB limit stays GitHub's.
#
# Usage: cache-report.sh [--hours N] [--prune]
# Env: REPO (owner/name), GH_TOKEN (actions: read; write for --prune).
# Writes Markdown to $GITHUB_STEP_SUMMARY (and stdout).
# Exit: 0 · 1 when an API it needs could not be read (the report says which).

set -uo pipefail

hours=24; prune=false
while [ $# -gt 0 ]; do
  case "$1" in
    --hours) hours="$2"; shift 2 ;;
    --prune) prune=true; shift ;;
    *) echo "usage: $0 [--hours N] [--prune]" >&2; exit 2 ;;
  esac
done
: "${REPO:?REPO=owner/name}"

LIMIT=$((10 * 1024 * 1024 * 1024))   # GitHub's per-repository Actions cache limit
say() { printf '%s\n' "$@"; [ -n "${GITHUB_STEP_SUMMARY:-}" ] && printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; return 0; }
gib() { awk -v b="$1" 'BEGIN { printf "%.2f GiB", b / 1073741824 }'; }
status=0

since=$(date -u -d "-$hours hours" +%Y-%m-%dT%H:%M:%SZ)
say "## Cache report — last ${hours} h (since $since)" ""

# ---- 1. Hit rate ---------------------------------------------------------
names=$(gh api --paginate "repos/$REPO/actions/artifacts?per_page=100" \
  --jq ".artifacts[] | select((.name | startswith(\"cached-step--\")) and .created_at >= \"$since\") | .name" 2>/dev/null) \
  || { say "**Hit rate: could not list artifacts** — not reported, not zero."; status=1; names=""; }
if [ -n "$names" ]; then
  say "### Hit rate per step" "" "| step | hit | warm | miss | hit rate |" "|---|---:|---:|---:|---:|"
  printf '%s\n' "$names" | awk -F'--' '{ n[$2]++; c[$2 "|" $3]++ }
    END { for (s in n) { h = c[s "|hit"] + 0; w = c[s "|warm"] + 0; m = c[s "|miss"] + 0;
            printf "| `%s` | %d | %d | %d | %.0f%% |\n", s, h, w, m, 100 * h / n[s] } }' | sort | while IFS= read -r l; do say "$l"; done
  say ""
elif [ "$status" = 0 ]; then
  say "No \`cached-step\` restore ran in this window." ""
fi

# ---- 2. Budget -----------------------------------------------------------
usage=$(gh api "repos/$REPO/actions/cache/usage" --jq '[.active_caches_size_in_bytes, .active_caches_count] | @tsv' 2>/dev/null) \
  || { say "**Budget: could not read actions/cache/usage** — not reported."; status=1; usage=""; }
caches=$(gh api --paginate "repos/$REPO/actions/caches?per_page=100" \
  --jq '.actions_caches[] | [.id, .key, .ref, .size_in_bytes, .last_accessed_at] | @tsv' 2>/dev/null) \
  || { say "**Budget: could not list caches** — not reported."; status=1; caches=""; }
if [ -n "$usage" ]; then
  read -r bytes count <<< "$usage"
  pct=$(awk -v b="$bytes" -v l="$LIMIT" 'BEGIN { printf "%.0f", 100 * b / l }')
  say "### Budget" "" "$count entries, $(gib "$bytes") of 10 GiB ($pct%)."
  [ "$pct" -lt 80 ] || say "" "**Over 80% of the limit:** GitHub evicts least-recently-used entries next; move the largest namespace to GHCR or a git ref (README, \"Budget\")."
  say ""
fi
if [ -n "$caches" ]; then
  say "| namespace | entries | size | of which on PR refs |" "|---|---:|---:|---:|"
  printf '%s\n' "$caches" | awk -F'\t' '{
      ns = $2; sub(/-[0-9a-f]{12,}.*$/, "", ns); sub(/-v[0-9]+-.*$/, "", ns)
      if (ns ~ /^cs1-/) { split($2, p, "-"); ns = "cs1-" p[2] }
      n[ns]++; b[ns] += $4; if ($3 ~ /^refs\/pull\//) pb[ns] += $4 }
    END { for (k in n) printf "%d\t| `%s` | %d | %.1f MiB | %.1f MiB |\n", b[k], k, n[k], b[k] / 1048576, pb[k] / 1048576 }' \
    | sort -rn | cut -f2- | while IFS= read -r l; do say "$l"; done
  say ""
fi

# ---- 3. Prune ------------------------------------------------------------
if [ "$prune" = true ] && [ -n "$caches" ]; then
  freed=0; deleted=0; declare -A state=()
  while IFS=$'\t' read -r id key ref size _; do
    [[ "$ref" =~ ^refs/pull/([0-9]+)/merge$ ]] || continue
    n="${BASH_REMATCH[1]}"
    [ -n "${state[$n]:-}" ] || state[$n]=$(gh api "repos/$REPO/pulls/$n" --jq .state 2>/dev/null || echo unknown)
    [ "${state[$n]}" = closed ] || continue
    if gh api -X DELETE "repos/$REPO/actions/caches/$id" > /dev/null 2>&1; then
      deleted=$((deleted + 1)); freed=$((freed + size))
    fi
  done <<< "$caches"
  say "### Pruned" "" "$deleted entries of closed PRs' merge refs, $(gib "$freed") freed (unreadable by any run)." ""
fi

exit "$status"
