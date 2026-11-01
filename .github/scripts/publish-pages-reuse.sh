#!/usr/bin/env bash
#
# Reuse the merged PR's publish-time pages in the main deploy (Q-SPD-8 D,
# issue #2880). CI only. Same pattern as `qa-copy-reuse.sh` (#2878).
#
# ## Why
#
# `docs-site.yml` ran `bun run cat derive:publish` itself on every push to
# main: about 5 minutes, in series. The merged PR's `code-quality-gates` run
# already ran it over the same tree, in its `publish-pages` job, and uploaded
# what it wrote as the `publish-pages` artifact (bundle plus sha256 manifest).
#
# ## When it is the same build
#
# All four must hold, or nothing is reused:
#
# 1. That run tested THIS tree: its one `tested-tree-<tree>` record (bean
#    `qbco`) equals the tree of the pushed commit. The PR head is found the
#    way `verdict-reuse.sh` finds it: the second parent of a merge commit, or
#    the one merged PR whose merge commit this is.
# 2. Its `publish-pages` job succeeded.
# 3. The QA working copy the pages were built over is the one on disk now:
#    `qa-working-copy-bundle.sh verify` passes against that run's
#    `qa-working-copy` manifest (every carried file, new directory and
#    deletion), so the writers' QA inputs are the same.
# 4. The pages name nothing of the PR run: not its run id, not the commit it
#    tested, not the PR head, not `<n>/merge`. A writer that stamps its build
#    would otherwise publish the PR's identity on main.
#
# The writers also read the branch-kept graphs (`state:mount`) at the time
# they ran, as for verdict reuse (bean `qbco`) and #2878. That is the one
# input the checks above do not pin.
#
# ## What it does
#
# Prints `reused=true` (and `run_id`) to $GITHUB_OUTPUT after restoring the
# pages byte-identical to their manifest, or `reused=false` with the reason,
# and the workflow then builds them as before. Anything that cannot be
# determined is a `false`, never a guess. A restore that fails AFTER
# extracting is red: the tree is no longer the checkout, so building over it
# would not be the same build either.
#
# Env: REPO, SHA (the pushed commit), GH_TOKEN, RECORD_WRITERS ('true' on a
# manual traced run, which always builds).

set -uo pipefail

WORKFLOW=code-quality-gates.yml
PAGES_JOB='Publish-time pages, built once for this run (not a gate)'
BUNDLE=cat-harness-tools/scripts/qa-working-copy-bundle.sh

output() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >> "$GITHUB_OUTPUT"; return 0; }
summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; fi; printf '%s\n' "$@"; }
build() {
  output reused false
  summary "### Publish-time pages: built here (#2880)" "" "$1"
  exit 0
}
# Download artifact URL $1 into a fresh directory $2 and unzip it there.
fetch() { rm -rf "$2"; mkdir -p "$2" && gh api "$1" > "$2/a.zip" 2>/dev/null && unzip -q -o "$2/a.zip" -d "$2"; }

: "${REPO:?}" "${SHA:?}"
[ "${RECORD_WRITERS:-}" != true ] || build "This run records the writers (\`record_writers\`), so every writer runs here."
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

tmp="${RUNNER_TEMP:-/tmp}/reused-publish-pages"
checked=""
for id in $runs; do
  ok=$(gh api "repos/$REPO/actions/runs/$id/jobs?per_page=100" \
    --jq "[.jobs[] | select(.name == \"$PAGES_JOB\" and .conclusion == \"success\")] | length" 2>/dev/null) \
    || { checked+=" $id(jobs unreadable)"; continue; }
  [ "$ok" = 1 ] || { checked+=" $id(no successful pages job)"; continue; }
  arts=$(gh api "repos/$REPO/actions/runs/$id/artifacts?per_page=100" \
    --jq '.artifacts[] | select(.expired == false) | [.name, .archive_download_url] | @tsv' 2>/dev/null) \
    || { checked+=" $id(artifacts unreadable)"; continue; }
  tested=$(printf '%s\n' "$arts" | cut -f1 | grep -xE 'tested-tree-[0-9a-f]{40}' | sed 's/^tested-tree-//')
  [ "$(printf '%s\n' "$tested" | grep -c .)" -eq 1 ] || { checked+=" $id(not one tested-tree record)"; continue; }
  [ "$tested" = "$tree" ] || { checked+=" $id(tested tree $tested)"; continue; }
  url_of() { printf '%s\n' "$arts" | awk -F'\t' -v n="$1" '$1 == n {print $2; exit}'; }
  pages_url=$(url_of publish-pages); qa_url=$(url_of qa-working-copy); rec_url=$(url_of "tested-tree-$tested")
  [ -n "$pages_url" ] || { checked+=" $id(no publish-pages artifact)"; continue; }
  [ -n "$qa_url" ] || { checked+=" $id(no qa-working-copy artifact)"; continue; }
  [ -n "$rec_url" ] || { checked+=" $id(tested-tree record unreadable)"; continue; }

  # (3) The QA working copy on disk is the one these pages were built over.
  fetch "$qa_url" "$tmp/qa" || { checked+=" $id(qa-working-copy download failed)"; continue; }
  [ -f "$tmp/qa/manifest.txt" ] || { checked+=" $id(qa-working-copy manifest missing)"; continue; }
  if ! bash "$BUNDLE" verify "$tmp/qa" "$(sha256sum "$tmp/qa/manifest.txt" | cut -d' ' -f1)" > "$tmp/qa-verify.log" 2>&1; then
    checked+=" $id(QA working copy on disk differs from the one its pages were built over: $(tail -1 "$tmp/qa-verify.log"))"; continue
  fi

  fetch "$pages_url" "$tmp/pages" || { checked+=" $id(publish-pages download failed)"; continue; }
  for f in manifest.txt qa-working-copy.tar; do
    [ -f "$tmp/pages/$f" ] || { checked+=" $id(publish-pages $f missing)"; continue 2; }
  done
  rm -rf "$tmp/scan"; mkdir -p "$tmp/scan"
  tar -xf "$tmp/pages/qa-working-copy.tar" -C "$tmp/scan" 2>/dev/null || { checked+=" $id(publish-pages tar unreadable)"; continue; }

  # (4) Nothing in the pages names the PR run. The record says which commit
  # the run checked out (the merge ref), as "tested-tree: <tree> (commit <sha>)".
  fetch "$rec_url" "$tmp/rec" || { checked+=" $id(tested-tree record download failed)"; continue; }
  tested_commit=$(sed -n 's/.*(commit \([0-9a-f]\{40\}\)).*/\1/p' "$tmp/rec/tested-tree.txt" 2>/dev/null | head -1)
  [ -n "$tested_commit" ] || { checked+=" $id(tested commit not on record)"; continue; }
  pr=$(gh api "repos/$REPO/actions/runs/$id" --jq '.pull_requests[0].number // empty' 2>/dev/null)
  needles=("$id" "$tested_commit" "$p2")
  [ -z "$pr" ] || needles+=("$pr/merge")
  args=(); for n in "${needles[@]}"; do args+=(-e "$n"); done
  hits=$(grep -rlF "${args[@]}" "$tmp/scan" 2>/dev/null | sed "s#^$tmp/scan/##" | head -5 | tr '\n' ' ')
  if [ -n "$hits" ]; then
    checked+=" $id(pages name the PR run, e.g. ${hits% })"; continue
  fi

  manifest=$(sha256sum "$tmp/pages/manifest.txt" | cut -d' ' -f1)
  if ! bash "$BUNDLE" restore "$tmp/pages" "$manifest"; then
    echo "::error::restoring run $id's publish-time pages failed after extracting; the checkout is no longer clean. NOT a pass."
    exit 1
  fi
  output reused true
  output run_id "$id"
  summary "### Publish-time pages: reused from the merged PR's run $id (#2880)" "" \
    "This push \`$SHA\` has tree \`$tree\`, which run [$id](https://github.com/$REPO/actions/runs/$id) on PR head \`$p2\` tested. Its QA working copy matches the one on disk, its pages name nothing of that run, and its \`publish-pages\` artifact was restored byte-identical to its manifest (sha256 \`$manifest\`). \`derive:publish\` did not run here."
  exit 0
done
build "No run on the PR head \`$p2\` has usable pages for tree \`$tree\`. Checked:${checked:- nothing}."
