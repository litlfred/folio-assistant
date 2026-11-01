#!/usr/bin/env bash
#
# Publish every waiting staging preview to gh-pages in ONE commit (Q-SPD-5c,
# owner card 2026-11-01 16:24Z, option A). Run by `staging-publish.yml`.
#
# ## Why
#
# Pages keeps only its newest build, so `staging-push-gate.ts` holds each push
# until the last one is 5 min old (10 min after a main-site publish). Each
# preview job used to wait at that gate itself, on its own runner, and push
# only its own preview: N previews queued N windows deep, so a busy preview
# waited up to 21 min (job 124892423472, 2026-11-01) and held a runner all
# that time. Now a preview job uploads its built site as the artifact
# `staging-site-<slug>` and finishes, and this script, one run at a time,
# pushes every waiting preview in one commit per window.
#
# ## The queue
#
# The queue is the set of unexpired `staging-site-<slug>` artifacts. The
# newest per slug is published; it and every older one for that slug are
# deleted after the push lands, so a published build never comes back. A
# preview whose PR is closed, or whose branch is gone, is dropped (and its
# artifact deleted) rather than published, so the cleanup job's removal is
# never undone.
#
# ## Each preview, as the in-job deploy did it
#
# Slug checked by value, a non-empty site, the slug's directory replaced (not
# overlaid, bean `85im`), files shared with the live root (`staging-share.ts`),
# a render-log entry, and the size cap (`staging-rotate.ts`). A preview whose
# slug, site, download or PR fails a check is left out and reported, and the
# others still go. A tool that fails fails the run, and the queue stays for
# the next one.
#
# Env: GH_TOKEN, REPO, RUN_URL. Writes `published.json` to $RUNNER_TEMP.

set -euo pipefail

: "${REPO:?}" "${RUN_URL:?}"
T="${RUNNER_TEMP:-/tmp}/staging-publish"
mkdir -p "$T"
PUBLISHED="$RUNNER_TEMP/published.json"
echo '[]' > "$PUBLISHED"
TOOLS=cat-harness-tools/scripts

safe_slug() {
  case "$1" in
    ""|.|..|*/*|_retired) return 1 ;;
  esac
  [[ "$1" =~ ^[A-Za-z0-9._-]+$ ]]
}

# The waiting previews: one line per slug, newest artifact first, then the ids
# of every artifact of that slug (all are deleted once the newest is live).
list_queue() {
  gh api --paginate "repos/$REPO/actions/artifacts?per_page=100" \
    --jq '.artifacts[] | select(.expired == false and (.name | startswith("staging-site-"))) | [.name, .id, .created_at, .archive_download_url] | @tsv' \
    2>/dev/null | sort -t$'\t' -k1,1 -k3,3r
}

still_wanted() {
  # $1 = meta.json. A PR preview needs the PR open; a branch preview needs the branch.
  local pr branch
  pr=$(jq -r '.pr // empty' "$1")
  branch=$(jq -r '.branch' "$1")
  if [ -n "$pr" ]; then
    [ "$(gh api "repos/$REPO/pulls/$pr" --jq .state 2>/dev/null)" = open ]
  else
    gh api "repos/$REPO/branches/$(jq -rn --arg b "$branch" '$b|@uri')" --jq .name >/dev/null 2>&1
  fi
}

git -C pages config user.name 'github-actions[bot]'
git -C pages config user.email '41898282+github-actions[bot]@users.noreply.github.com'
QUEUED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
attempt=1
while [ "$attempt" -le 3 ]; do
  git -C pages fetch --depth=1 origin gh-pages
  git -C pages reset --hard FETCH_HEAD
  bun run "$TOOLS/staging-push-gate.ts" gate --dir pages --queued-at "$QUEUED_AT" && gate=0 || gate=$?
  if [ "$gate" = 75 ]; then continue; fi
  if [ "$gate" != 0 ]; then exit 1; fi
  BASE=$(git -C pages rev-parse HEAD)

  # Read the queue AFTER the gate, so a preview that arrived while this run
  # waited goes in this commit too.
  queue=$(list_queue)
  if [ -z "$queue" ]; then echo "staging-publish: nothing waiting"; exit 0; fi

  : > "$T/batch.tsv"   # slug, artifact ids (comma), meta path
  : > "$T/drop.txt"    # artifact ids to delete without publishing
  : > "$T/rotated.txt"
  declare -A seen=()
  while IFS=$'\t' read -r name id created url <&3; do
    slug="${name#staging-site-}"
    if [ -n "${seen[$slug]:-}" ]; then
      # An older build of a slug already in the batch: superseded.
      echo "$id" >> "$T/superseded-$slug.txt"; continue
    fi
    seen[$slug]=1
    : > "$T/superseded-$slug.txt"
    if ! safe_slug "$slug"; then echo "::warning::artifact $name: '$slug' is not one safe path segment; dropped"; echo "$id" >> "$T/drop.txt"; continue; fi
    d="$T/q/$slug"
    if [ ! -f "$d/.ready-$id" ]; then
      rm -rf "$d"; mkdir -p "$d/site"
      if ! gh api "$url" > "$d/a.zip" || ! unzip -q -o "$d/a.zip" -d "$d" || ! tar -xf "$d/site.tar" -C "$d/site"; then
        echo "::warning::$slug: could not download or unpack artifact $id; left in the queue"; rm -rf "$d"; unset "seen[$slug]"; continue
      fi
      rm -f "$d/a.zip" "$d/site.tar"; touch "$d/.ready-$id"
    fi
    if [ "$(jq -r .slug "$d/meta.json" 2>/dev/null)" != "$slug" ]; then
      echo "::warning::$slug: meta.json names another slug; dropped"; echo "$id" >> "$T/drop.txt"; continue
    fi
    if ! still_wanted "$d/meta.json"; then
      echo "$slug: its PR is closed or its branch is gone; dropped, not published"; echo "$id" >> "$T/drop.txt"; continue
    fi
    if [ -z "$(ls -A "$d/site" 2>/dev/null || true)" ]; then
      echo "::warning::$slug: the built site is empty; dropped, STAGING/$slug keeps its last preview"; echo "$id" >> "$T/drop.txt"; continue
    fi
    printf '%s\t%s\t%s\n' "$slug" "$id" "$d" >> "$T/batch.tsv"
  done 3<<< "$queue"

  if [ ! -s "$T/batch.tsv" ]; then
    echo "staging-publish: nothing publishable"
    xargs -r -I{} gh api -X DELETE "repos/$REPO/actions/artifacts/{}" < "$T/drop.txt" || true
    exit 0
  fi

  n=0; body=()
  # fd 3, so a tool that reads stdin cannot eat the rest of the batch.
  while IFS=$'\t' read -r slug id d <&3; do
    branch=$(jq -r .branch "$d/meta.json"); sha=$(jq -r .sha "$d/meta.json"); run=$(jq -r .run "$d/meta.json")
    rm -rf "pages/STAGING/$slug"
    mkdir -p "pages/STAGING/$slug"
    cp -R "$d/site/." "pages/STAGING/$slug/"
    if [ -f "$TOOLS/staging-share.ts" ]; then
      bun run "$TOOLS/staging-share.ts" apply --root pages --preview "pages/STAGING/$slug" --slug "$slug"
    fi
    jq -n --arg s 'staging preview published' '{summary:$s}' | bun run "$TOOLS/render-log.ts" --dir pages \
      --event rendered --kind staging-preview --path "STAGING/$slug" --slug "$slug" \
      --branch "$branch" --commit "$sha" --run "$run"
    bun run "$TOOLS/staging-rotate.ts" --dir pages --current "$slug" --run "$RUN_URL" --summary-out "$T/rot-$slug.txt"
    cat "$T/rot-$slug.txt" >> "$T/rotated.txt" 2>/dev/null || true
    body+=("$slug from $sha ($run)")
    n=$((n + 1))
  done 3< "$T/batch.tsv"

  git -C pages add -A STAGING
  if [ -d pages/_render-log ]; then git -C pages add -A _render-log; fi
  if [ "$n" = 1 ]; then
    first=$(head -1 "$T/batch.tsv" | cut -f1)
    MSG=(-m "staging($first): from $(jq -r .sha "$T/q/$first/meta.json")")
  else
    MSG=(-m "staging(batch): $n previews")
  fi
  MSG+=(-m "$(printf '%s\n' "${body[@]}")" -m "render-log: rendered $n preview(s)")
  if [ -s "$T/rotated.txt" ]; then
    MSG+=(-m "rotated off (preview size budget, owner ruling 2026-10-02 amended 2026-10-04, #1868):"$'\n'"$(cat "$T/rotated.txt")")
  fi
  MSG+=(-m "$RUN_URL")
  if ! git -C pages commit -q "${MSG[@]}"; then
    echo "staging-publish: every preview in the queue is already live"
  elif git -C pages push origin gh-pages; then
    echo "staging-publish: pushed $n preview(s) on attempt $attempt"
  else
    REMOTE=$(git -C pages ls-remote origin refs/heads/gh-pages | cut -f1)
    if [ -n "$REMOTE" ] && [ "$REMOTE" != "$BASE" ]; then
      echo "push rejected: gh-pages moved to $REMOTE, a lost race; back to the gate"
      continue
    fi
    if [ "$attempt" = 3 ]; then echo "::error::could not push the staging batch after 3 attempts"; exit 1; fi
    bun run "$TOOLS/backoff-sleep.ts" --attempt "$attempt"
    attempt=$((attempt + 1))
    continue
  fi

  PUSHED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  while IFS=$'\t' read -r slug id d; do
    jq -c --arg at "$PUSHED_AT" --arg s "$slug" '{slug: $s, branch, sha, pr, pushed_at: $at}' "$d/meta.json"
    { echo "$id"; cat "$T/superseded-$slug.txt"; } >> "$T/done.txt"
  done < "$T/batch.tsv" | jq -s . > "$PUBLISHED"
  cat "$T/drop.txt" >> "$T/done.txt"
  # A failed delete leaves the artifact queued; the next run finds it live
  # already and its commit is empty, so this is safe to ignore.
  sort -u "$T/done.txt" | xargs -r -I{} gh api -X DELETE "repos/$REPO/actions/artifacts/{}" || true
  {
    echo "### Staging batch: $n preview(s) in one push (Q-SPD-5c)"
    echo
    jq -r '.[] | "- `\(.slug)` from `\(.sha)`"' "$PUBLISHED"
  } >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
  exit 0
done
