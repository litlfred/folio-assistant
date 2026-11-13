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
# - the exact versions of the tools the writers call that the tree does not
#   pin: Bun, git, Node, Python and Java on PATH, with the OS family
#   (`ImageOS`) and `RUNNER_ARCH`. NOT the runner image's build number
#   (`ImageVersion`): it changes weekly, and two builds are live at once
#   during a rollout. Measured 2026-11-05: runs 42025861803 and 42030336059,
#   30 minutes apart on the same commit, got images 20261026.180.1 and
#   20261101.186.1. Keyed on the image they could only hit by luck; keyed on
#   the tools, a new image misses only when it changes a tool the build uses
#   (there it did: Node v24.22.1 -> v24.22.2).
# - whatever the caller adds (`digest NAME EXTRA...`): the publish-time pages
#   add the QA working copy's manifest sha256, since they are built over it.
#
# - every branch-kept graph `state:mount` laid down, by the commit it was
#   mounted at (the `tip` of each marker under `<git-dir>/branch-mounts/`).
#   The writers read them: the processes page reads the work plan's workflow
#   instances (found on #2966, run 42035462008: a page built from an older
#   `beans` tip than the test read). So the digest is taken AFTER
#   `state:mount`, and a marker that cannot be read is no digest at all.
# - what the QA working copy build can READ of `cat/cat-harness/qa-reports`
#   (`qa-working-copy.ts`, `input-site: traced`): the `main/` subtree, and the
#   `index.json` main pointer with the skip chain that starts from it. Every
#   build-time read resolves `main` (or `main/<sha>`) through those
#   (`qa-store.ts` `resolveSpec`, `findSkippedTarget`). NOT the branch head:
#   a PR run's own publish job pushes `pr/<n>/<sha>` (and an index update)
#   AFTER it records its bundle, so a head-keyed digest could never match the
#   merge push. Measured 2026-11-13: 19 main pushes since 2026-11-08, 0
#   reuses, each key differing from its PR run's only in that head.
#
# Measured cost of that honesty (2026-11-05): `cat/cat-harness/beans` took 10
# commits between 14:06Z and 14:25Z, so two runs rarely see one tip. A hit
# then needs the same tree AND an unmoved work plan; keys narrowed to what
# each writer actually read are the traced-reads work (`writer-cone.ts`), not
# a hand-kept list here.
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
# Env: REPO (owner/name), SHA (the commit checked out), GH_TOKEN, and the
# runner's GITHUB_EVENT_NAME, GITHUB_REF, GITHUB_RUN_ID. The head is SHA, or
# on a pull_request the second parent of the test merge commit SHA (the PR
# head), read from the API, so no step depends on the pull_request payload.
#
# Exit: 0 in every fetch outcome · 2 usage.

set -uo pipefail

RECIPE=3
cmd="${1:-}"

output() { [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1=$2" >> "$GITHUB_OUTPUT"; echo "$1=$2"; return 0; }
summary() { if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then printf '%s\n' "$@" >> "$GITHUB_STEP_SUMMARY"; fi; printf '%s\n' "$@" >&2; }

ver() { "$@" 2>/dev/null | head -1 || true; }

# The skip chain from the index's main pointer, as `qa-store.ts` follows it
# (`skipped["main/<sha>"] ?? skipped["<sha>"]`, a value either form). Bounded,
# so a cycle cannot hang the job. Reads index.json on stdin.
QA_MAIN_CHAIN_JQ='def norm: if type == "string" then sub("^main/"; "") else tostring end;
  (.skipped // {}) as $s
  | ((.main.sha? // .main) | if . == null then empty else norm end) as $m
  | [limit(20; $m | recurse(($s["main/" + .] // $s[.]) | if . == null then empty else norm end))]'

# What the QA working copy build can read of the qa-reports branch: the
# `main/` subtree and the main pointer's skip chain, never `pr/`. One line,
# or a non-zero exit (no digest) when any of it cannot be read.
qa_reports_read_state() {
  local repo="${REPO:-${GITHUB_REPOSITORY:-}}" tip root trees main idx chain
  [ -n "$repo" ] || return 1
  tip=$(git ls-remote origin refs/heads/cat/cat-harness/qa-reports 2>/dev/null | cut -f1)
  [ -n "$tip" ] || return 1
  root=$(gh api "repos/$repo/git/commits/$tip" --jq .tree.sha 2>/dev/null) || return 1
  trees=$(gh api "repos/$repo/git/trees/$root" --jq '[(.tree[] | select(.path == "main" and .type == "tree") | .sha), (.tree[] | select(.path == "index.json" and .type == "blob") | .sha)] | join(" ")' 2>/dev/null) || return 1
  read -r main idx <<< "$trees"
  [ -n "$main" ] && [ -n "$idx" ] || return 1
  chain=$(gh api "repos/$repo/git/blobs/$idx" --jq .content 2>/dev/null | base64 -d | jq -c "$QA_MAIN_CHAIN_JQ") || return 1
  [ -n "$chain" ] && [ "$chain" != "[]" ] || return 1
  echo "main-tree $main chain $chain"
}
# This commit's parents, space-separated, from the API (a depth-1 checkout has none).
parents_of() { gh api "repos/$REPO/commits/$1" --jq '[.parents[].sha] | join(" ")' 2>/dev/null; }
# The head this run is for: SHA, or the PR head (second parent) on a pull_request.
head_of() {
  if [ "${GITHUB_EVENT_NAME:-}" = pull_request ]; then
    local p; p=$(parents_of "$SHA") || return 1
    set -- $p; [ $# -eq 2 ] || return 1; echo "$2"
  else
    echo "$SHA"
  fi
}

case "$cmd" in
  digest)
    [ $# -ge 2 ] || { echo "usage: $0 digest NAME [EXTRA...]" >&2; exit 2; }
    name="$2"; shift 2
    tree=$(git rev-parse 'HEAD^{tree}' 2>/dev/null) || { echo "digest: cannot read HEAD^{tree}" >&2; exit 1; }
    inputs=$(
      echo "recipe $RECIPE"
      echo "bundle $name"
      echo "tree $tree"
      echo "os ${ImageOS:-?} ${RUNNER_ARCH:-?}"
      echo "bun $(ver bun --version)"
      echo "git $(ver git --version)"
      echo "node $(ver node --version)"
      echo "python $(ver python3 --version)"
      echo "java $(java -version 2>&1 | grep -m1 -i " version " || true)"
      for e in "$@"; do echo "extra $e"; done
      gitdir=$(git rev-parse --git-dir) || exit 1
      if [ -d "$gitdir/branch-mounts" ]; then
        for m in "$gitdir"/branch-mounts/*.json; do
          [ -e "$m" ] || continue
          jq -er '"state \(.key // .id) \(.repository // "origin") \(.branch) \(.tip)"' "$m" || exit 1
        done
      fi
      qr=$(qa_reports_read_state) || exit 1
      echo "qa-reports $qr"
    ) || { echo "digest: a state mount marker or the qa-reports state could not be read: no digest" >&2; exit 1; }
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
      echo "head: $( [ -n "${SHA:-}" ] && [ -n "${REPO:-}" ] && head_of || true)"
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
    [[ "$digest" =~ ^[0-9a-f]{64}$ ]] || miss "The digest could not be computed."
    tree=$(git rev-parse 'HEAD^{tree}' 2>/dev/null) || miss "Could not read this tree."
    head=$(head_of) || miss "Could not read the PR head (the second parent of \`$SHA\`)."
    parents=$(parents_of "$SHA") || parents=""

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
