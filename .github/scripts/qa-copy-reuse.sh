#!/usr/bin/env bash
#
# Reuse the merged PR's QA working copy in the main deploy (Q-SPD-7b, owner
# card 2026-11-01 16:17Z, option A). CI only.
#
# ## Why
#
# `docs-site.yml` built the QA working copy itself on every push to main:
# about 8 minutes (468 s on job 124793773959), in series before the security
# gate. The merged PR's `code-quality-gates` run already built the same copy,
# over the same steps, and uploaded it as the `qa-working-copy` artifact.
#
# ## When it is the same copy
#
# Only when that run tested THIS tree. The producer job records the tree it
# tested as an artifact named `tested-tree-<tree>` (bean `qbco`, the record
# `verdict-reuse.sh` reads). The PR head is found the way `verdict-reuse.sh`
# finds it: the second parent of a merge commit, or the one merged PR whose
# merge commit this is. If main moved between that PR's last run and the
# merge, the trees differ and nothing is reused.
#
# The copy's writers also read the branch-kept graphs (`state:mount`) and
# `qa-reports` at the time they ran, as for verdict reuse. That is the one
# input the tree does not pin.
#
# ## What it does
#
# Prints `reused=true` (and `run_id`) to $GITHUB_OUTPUT after restoring the
# copy byte-identical to its manifest with `qa-working-copy-bundle.sh`, or
# `reused=false` with the reason, and the workflow then builds it as before.
# Anything that cannot be determined is a `false`, never a guess. A restore
# that fails AFTER extracting is red: the tree is no longer the checkout, so
# building over it would not be the same build either.
#
# Env: REPO, SHA (the pushed commit), GH_TOKEN.

set -uo pipefail

WORKFLOW=code-quality-gates.yml
PRODUCER_JOB='QA working copy, built once for this run (not a gate)'
BUNDLE=cat-harness-tools/scripts/qa-working-copy-bundle.sh

output() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >> "$GITHUB_OUTPUT"; return 0; }
summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; fi; printf '%s\n' "$@"; }
build() {
  output reused false
  summary "### QA working copy: built here (Q-SPD-7b)" "" "$1"
  exit 0
}

: "${REPO:?}" "${SHA:?}"
[ -f "$BUNDLE" ] || build "This tools pin has no \`$BUNDLE\`."
tree=$(git rev-parse "$SHA^{tree}" 2>/dev/null) || build "Could not read the tree of \`$SHA\`."

parents=$(gh api "repos/$REPO/commits/$SHA" --jq '[.parents[].sha] | join(" ")' 2>/dev/null) \
  || build "Could not read the parents of \`$SHA\`."
read -r p1 p2 extra <<< "$parents"
[ -z "${extra:-}" ] || build "\`$SHA\` is an octopus merge."
if [ -z "${p2:-}" ]; then
  [ -n "${p1:-}" ] || build "\`$SHA\` has no parents on record."
  prs=$(gh api "repos/$REPO/commits/$SHA/pulls" \
    --jq ".[] | select(.merged_at != null and .merge_commit_sha == \"$SHA\") | .head.sha" 2>/dev/null) \
    || build "Could not list the PRs merged as \`$SHA\`."
  [ "$(printf '%s\n' "$prs" | grep -c .)" -eq 1 ] \
    || build "\`$SHA\` is not the merge commit of exactly one merged PR (a direct push?)."
  p2=$prs
fi

runs=$(gh api "repos/$REPO/actions/workflows/$WORKFLOW/runs?head_sha=$p2&event=pull_request&per_page=30" \
  --jq '.workflow_runs[] | .id' 2>/dev/null) || build "Could not list \`$WORKFLOW\` runs on the PR head \`$p2\`."
[ -n "$runs" ] || build "No \`$WORKFLOW\` pull_request run on the PR head \`$p2\`."

checked=""
for id in $runs; do
  ok=$(gh api "repos/$REPO/actions/runs/$id/jobs?per_page=100" \
    --jq "[.jobs[] | select(.name == \"$PRODUCER_JOB\" and .conclusion == \"success\")] | length" 2>/dev/null) \
    || { checked+=" $id(jobs unreadable)"; continue; }
  [ "$ok" = 1 ] || { checked+=" $id(no successful producer job)"; continue; }
  arts=$(gh api "repos/$REPO/actions/runs/$id/artifacts?per_page=100" \
    --jq '.artifacts[] | select(.expired == false) | [.name, .archive_download_url] | @tsv' 2>/dev/null) \
    || { checked+=" $id(artifacts unreadable)"; continue; }
  tested=$(printf '%s\n' "$arts" | cut -f1 | grep -xE 'tested-tree-[0-9a-f]{40}' | sed 's/^tested-tree-//')
  [ "$(printf '%s\n' "$tested" | grep -c .)" -eq 1 ] || { checked+=" $id(not one tested-tree record)"; continue; }
  [ "$tested" = "$tree" ] || { checked+=" $id(tested tree $tested)"; continue; }
  url=$(printf '%s\n' "$arts" | awk -F'\t' '$1 == "qa-working-copy" {print $2; exit}')
  [ -n "$url" ] || { checked+=" $id(no qa-working-copy artifact)"; continue; }

  d="${RUNNER_TEMP:-/tmp}/reused-qa-working-copy"
  rm -rf "$d"; mkdir -p "$d"
  if ! gh api "$url" > "$d/a.zip" 2>/dev/null || ! unzip -q -o "$d/a.zip" -d "$d"; then
    checked+=" $id(download failed)"; continue
  fi
  for f in manifest.txt qa-working-copy.tar; do
    [ -f "$d/$f" ] || { checked+=" $id($f missing)"; continue 2; }
  done
  tar -tf "$d/qa-working-copy.tar" > /dev/null 2>&1 || { checked+=" $id(tar unreadable)"; continue; }

  # The producer's manifest hash is a job output, which the API does not
  # expose, so the downloaded manifest is the record; the restore then checks
  # every file against it in place.
  manifest=$(sha256sum "$d/manifest.txt" | cut -d' ' -f1)
  if ! bash "$BUNDLE" restore "$d" "$manifest"; then
    echo "::error::restoring run $id's QA working copy failed after extracting; the checkout is no longer clean. NOT a pass."
    exit 1
  fi
  output reused true
  output run_id "$id"
  summary "### QA working copy: reused from the merged PR's run $id (Q-SPD-7b)" "" \
    "This push \`$SHA\` has tree \`$tree\`, which run [$id](https://github.com/$REPO/actions/runs/$id) on PR head \`$p2\` tested. Its \`qa-working-copy\` artifact was restored byte-identical to its manifest (sha256 \`$manifest\`)."
  exit 0
done
build "No run on the PR head \`$p2\` has a usable copy of tree \`$tree\`. Checked:${checked:- nothing}."
