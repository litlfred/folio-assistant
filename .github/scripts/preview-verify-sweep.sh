#!/usr/bin/env bash
# Dispatch the oldest pending agent-build verify, when none is running.
# folio-assistant#2881 (owner, 2026-11-01, Q-SPD-9 B / Q-SPD-9b A). Moved out of
# `preview-verify-sweep.yml` unchanged so the one scheduled dispatcher
# (`sweeps.yml`) runs it in its own job instead of starting a runner for it.
# Needs GH_TOKEN (actions: write, statuses: read, pull-requests: read) and REPO.
set -eu
# One verify at a time: a verify is a Feature Staging dispatch run.
# Any dispatch counts (a cleanup too): waiting a sweep costs nothing.
busy=0
for st in queued in_progress waiting pending; do
  n=$(gh api "repos/$REPO/actions/workflows/feature-staging.yml/runs?event=workflow_dispatch&status=$st&per_page=20" \
    --jq '.total_count')
  busy=$((busy + n))
done
if [ "$busy" -gt 0 ]; then
  echo "a Feature Staging dispatch is already queued or running ($busy): the next sweep tries again"
  exit 0
fi
# The queue: open PRs whose head commit has `preview/agent-build`
# pending. Oldest head commit first.
best=""; best_at=""
while IFS=$'\t' read -r num ref sha; do
  [ -n "$num" ] || continue
  # Newest first, so [0] is the status as it stands.
  line=$(gh api "repos/$REPO/commits/$sha/statuses?per_page=100" \
    --jq '[.[] | select(.context == "preview/agent-build")][0] | "\(.state // "")\t\(.created_at // "")"')
  state="${line%%$'\t'*}"; at="${line#*$'\t'}"
  [ "$state" = "pending" ] || continue
  echo "pending: #$num ($ref) since $at"
  if [ -z "$best_at" ] || [[ "$at" < "$best_at" ]]; then best="$num"$'\t'"$ref"; best_at="$at"; fi
done < <(gh api --paginate "repos/$REPO/pulls?state=open&per_page=100" \
  --jq '.[] | select(.head.repo.full_name == "'"$REPO"'") | [.number, .head.ref, .head.sha] | @tsv')
if [ -z "$best" ]; then
  echo "no agent-built preview is waiting for a verify"
  exit 0
fi
num="${best%%$'\t'*}"; ref="${best#*$'\t'}"
echo "dispatching the verify of #$num ($ref)"
gh workflow run feature-staging.yml -R "$REPO" -f branch="$ref" -f verify_pr="$num"
