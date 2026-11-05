#!/usr/bin/env bash
#
# Build a generated bundle only when its inputs changed (beans x35i, tv20).
# CI only. Used by the `qa-working-copy` and `publish-pages` jobs of
# `code-quality-gates.yml`, and meant for Feature Staging's `stage` too.
#
# ## The key
#
# A bundle (the QA working copy, the publish-time pages) is keyed on a DIGEST
# of what it is built from:
#
# - the tree of the commit checked out (`HEAD^{tree}`). The writers that build
#   these bundles declare `{tracked}` as their input (`task-io.ts`): the whole
#   tree, nothing narrower. The tree holds `bun.lock`, `index.lock.json` (the
#   mount pins), the workflow, the Bun pin, the Playwright and PlantUML pins.
# - the runner image (`ImageOS`, `ImageVersion`, `RUNNER_ARCH`) and the Bun,
#   git and Node versions on PATH: the tools the tree does not pin.
# - whatever the caller adds (`digest NAME EXTRA...`): the publish-time pages
#   add the QA working copy's manifest sha256, since they are built over it.
#
# NOT in the key, as for `verdict-reuse.sh`, `qa-copy-reuse.sh` and
# `publish-pages-reuse.sh`: the branch-kept graphs `state:mount` lays down and
# the `qa-reports` entries the writers read when they ran. That is the one
# input the tree does not pin, and it is said here rather than hidden.
#
# ## The record
#
# A job that has its bundle (built or restored) uploads it as before, then a
# small artifact named `bundle-<NAME>-<DIGEST>` (`record`) saying which run,
# commit, head and ref produced it. The record is uploaded LAST, so it exists
# only when the bundle upload succeeded. `fetch` lists the records of a digest
# repository-wide (`GET /actions/artifacts?name=`), newest first, main's runs
# included, and takes the first source that passes every check below.
#
# ## When a recorded bundle is used — every check, or it is built
#
# 1. Trusted source. Any run can upload an artifact with any name, so a PR
#    could record a poisoned bundle under main's digest. A source run is used
#    only when its head commit is this run's head, a parent of this commit
#    (the merged PR head), or a commit whose tree IS this tree. Each way, the
#    code that ran there is code this run is running.
# 2. Whole. Its `<NAME>` artifact downloads, carries `manifest.txt` and the
#    tar, and every file in the tar matches the manifest (checked in a scratch
#    directory, so a bad copy is a miss, not a red job).
# 3. Names nothing of another commit. Writers stamp the commit they ran at
#    (QA records' `last_run_sha`, `reviewed_sha`). A bundle that names the
#    source run's id, commit, head or `<n>/merge` ref, where they are not this
#    run's own, would publish another commit's identity here: a miss. Measured
#    on main 2026-11-05: every publish-pages bundle of a PR run names its
#    merge ref (`test/results/witnesses/**`), so pages are reused only on the
#    SAME commit (a re-run, Feature Staging, a dispatch).
#
# Could-not-determine is never a hit: every API error, absent file or failed
# check prints `hit=false` with the reason, and the job builds as before.
#
# ## Usage
#
#   bundle-cache.sh digest NAME [EXTRA...]   # prints the digest; its inputs go to stderr
#   bundle-cache.sh fetch NAME DIGEST OUTDIR # hit=, run_id=, manifest= to $GITHUB_OUTPUT
#   bundle-cache.sh record NAME DIGEST OUTDIR # writes OUTDIR/bundle-cache.txt to upload
#
# Env: REPO (owner/name), SHA (the commit checked out), HEAD_SHA (the PR head
# on a pull_request, else SHA), GITHUB_REF, GITHUB_RUN_ID, GH_TOKEN.
#
# Exit: 0 in every fetch outcome · 2 usage.

set -uo pipefail

RECIPE=1
cmd="${1:-}"

output() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >> "$GITHUB_OUTPUT"; echo "$1=$2"; return 0; }
summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; fi; printf '%s\n' "$@" >&2; }

ver() { "$@" 2>/dev/null | head -1 || true; }

case "$cmd" in
  digest)
    [ $# -ge 2 ] || { echo "usage: $0 digest NAME [EXTRA...]" >&2; exit 2; }
    name="$2"; shift 2
    tree=$(git rev-parse 'HEAD^{tree}' 2>/dev/null) || { echo "digest: cannot read HEAD^{tree}" >&2; exit 1; }
    inputs=$(
      echo "recipe $RECIPE"
      echo "bundle $name"
      echo "tree $tree"
      echo "image ${ImageOS:-?} ${ImageVersion:-?} ${RUNNER_ARCH:-?}"
      echo "bun $(ver bun --version)"
      echo "git $(ver git --version)"
      echo "node $(ver node --version)"
      for e in "$@"; do echo "extra $e"; done
    )
    printf '%s\n' "$inputs" | sed 's/^/digest input: /' >&2
    printf '%s\n' "$inputs" | sha256sum | cut -d' ' -f1
    ;;

  record)
    [ $# -eq 4 ] || { echo "usage: $0 record NAME DIGEST OUTDIR" >&2; exit 2; }
    mkdir -p "$4"
    {
      echo "bundle: $2"
      echo "digest: $3"
      echo "run: ${GITHUB_RUN_ID:-}"
      echo "commit: ${SHA:-$(git rev-parse HEAD)}"
      echo "head: ${HEAD_SHA:-${SHA:-}}"
      echo "ref: ${GITHUB_REF:-}"
    } > "$4/bundle-cache.txt"
    cat "$4/bundle-cache.txt"
    ;;

  fetch)
    [ $# -eq 4 ] || { echo "usage: $0 fetch NAME DIGEST OUTDIR" >&2; exit 2; }
    name="$2"; digest="$3"; out="$4"
    miss() {
      output hit false
      summary "### \`$name\`: built here (bundle cache)" "" "Digest \`$digest\`. $1"
      exit 0
    }
    : "${REPO:?}" "${SHA:?}"
    head="${HEAD_SHA:-$SHA}"
    [[ "$digest" =~ ^[0-9a-f]{64}$ ]] || miss "The digest could not be computed."
    tree=$(git rev-parse 'HEAD^{tree}' 2>/dev/null) || miss "Could not read this tree."
    parents=$(gh api "repos/$REPO/commits/$SHA" --jq '[.parents[].sha] | join(" ")' 2>/dev/null) || parents=""

    records=$(gh api "repos/$REPO/actions/artifacts?name=bundle-$name-$digest&per_page=30" \
      --jq '.artifacts | sort_by(.created_at) | reverse | .[] | select(.expired == false)
            | [.workflow_run.id, .workflow_run.head_sha, .archive_download_url] | @tsv' 2>/dev/null) \
      || miss "Could not list the records of this digest."
    [ -n "$records" ] || miss "No run has recorded this digest (or its records expired)."

    tmp="${RUNNER_TEMP:-/tmp}/bundle-cache-$name"
    fetchzip() { rm -rf "$2"; mkdir -p "$2" && gh api "$1" > "$2/a.zip" 2>/dev/null && unzip -q -o "$2/a.zip" -d "$2" && rm -f "$2/a.zip"; }
    checked=""
    seen=" "
    while IFS=$'\t' read -r rid rhead rec_url; do
      case "$seen" in *" $rid "*) continue ;; esac
      seen+="$rid "

      # (1) Trusted source.
      trusted=""
      if [ "$rhead" = "$head" ] || [ "$rhead" = "$SHA" ]; then trusted="same head"
      elif [[ " $parents " == *" $rhead "* ]]; then trusted="a parent of this commit"
      else
        rtree=$(gh api "repos/$REPO/commits/$rhead" --jq '.commit.tree.sha' 2>/dev/null) || rtree=""
        [ "$rtree" = "$tree" ] && trusted="a head with this tree"
      fi
      [ -n "$trusted" ] || { checked+=" $rid(head ${rhead:0:12} is not this commit, a parent, or this tree)"; continue; }

      # (2) Whole.
      fetchzip "$rec_url" "$tmp/rec" || { checked+=" $rid(record download failed)"; continue; }
      url=$(gh api "repos/$REPO/actions/runs/$rid/artifacts?per_page=100" \
        --jq ".artifacts[] | select(.name == \"$name\" and .expired == false) | .archive_download_url" 2>/dev/null | head -1)
      [ -n "$url" ] || { checked+=" $rid(no $name artifact)"; continue; }
      fetchzip "$url" "$out" || { checked+=" $rid($name download failed)"; continue; }
      [ -f "$out/manifest.txt" ] && [ -f "$out/qa-working-copy.tar" ] || { checked+=" $rid($name incomplete)"; continue; }
      rm -rf "$tmp/scan"; mkdir -p "$tmp/scan"
      tar -xf "$out/qa-working-copy.tar" -C "$tmp/scan" 2>/dev/null || { checked+=" $rid(tar unreadable)"; continue; }
      grep -vE '^(dir|deleted) ' "$out/manifest.txt" > "$tmp/sums.txt" || true
      if [ -s "$tmp/sums.txt" ] && ! (cd "$tmp/scan" && sha256sum --quiet -c "$tmp/sums.txt" > /dev/null 2>&1); then
        checked+=" $rid(tar does not match its manifest)"; continue
      fi

      # (3) Names nothing of another commit.
      rv() { sed -n "s/^$1: //p" "$tmp/rec/bundle-cache.txt" 2>/dev/null | head -1; }
      needles=()
      [ "$rid" = "${GITHUB_RUN_ID:-}" ] || needles+=("$rid")
      for v in "$(rv commit)" "$(rv head)"; do
        [ -n "$v" ] && [ "$v" != "$SHA" ] && [ "$v" != "$head" ] && needles+=("$v")
      done
      rref=$(rv ref)
      if [[ "$rref" =~ ^refs/pull/([0-9]+)/merge$ ]] && [ "$rref" != "${GITHUB_REF:-}" ]; then needles+=("${BASH_REMATCH[1]}/merge"); fi
      if [ ${#needles[@]} -gt 0 ]; then
        args=(); for n in "${needles[@]}"; do args+=(-e "$n"); done
        hits=$(grep -rlF "${args[@]}" "$tmp/scan" 2>/dev/null | sed "s#^$tmp/scan/##" | head -3 | tr '\n' ' ')
        [ -z "$hits" ] || { checked+=" $rid(names its own commit, e.g. ${hits% })"; continue; }
      fi

      manifest=$(sha256sum "$out/manifest.txt" | cut -d' ' -f1)
      output hit true
      output run_id "$rid"
      output manifest "$manifest"
      summary "### \`$name\`: reused from run $rid (bundle cache)" "" \
        "Digest \`$digest\` was recorded by run [$rid](https://github.com/$REPO/actions/runs/$rid) ($trusted). Its \`$name\` artifact matches its manifest (sha256 \`$manifest\`) and names nothing of that run's commit, so it was not built here.${checked:+ Passed over:$checked.}"
      exit 0
    done <<< "$records"
    miss "No recorded run passed every check. Checked:${checked:- nothing}."
    ;;

  *)
    echo "usage: $0 digest NAME [EXTRA...] | fetch NAME DIGEST OUTDIR | record NAME DIGEST OUTDIR" >&2
    exit 2
    ;;
esac
