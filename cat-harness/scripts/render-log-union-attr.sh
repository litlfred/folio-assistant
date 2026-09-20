#!/usr/bin/env bash
# Make the render log survive the retry's rebase.
#
# Bean `pb4n`. The gh-pages push loops already handle a REJECTION — fetch,
# rebase, retry — and that is load-bearing, because a concurrency group only
# serialises the jobs that name it and six workflows push to this ref. What
# the retry cannot handle is a CONTENT CONFLICT, and `_render-log/<date>.jsonl`
# produces one BY CONSTRUCTION: every run appends a line to the same day's
# file, so two runs on one day whose pushes interleave conflict on it every
# time, not by bad luck. Measured on PR #603 and again on #616:
#
#     push rejected; rebasing onto origin/gh-pages and retrying
#     CONFLICT (content): Merge conflict in _render-log/2026-09-20.jsonl
#     error: could not apply ... staging(<slug>)
#
# `merge=union` takes the added lines from BOTH sides. For an append-only log
# that is not a heuristic to paper over a conflict — it is the correct
# semantics, and it is the reason the driver exists. The existing three-attempt
# loop then succeeds where it currently aborts.
#
# ## Why `.git/info/attributes` and not a committed `.gitattributes`
#
# `info/attributes` is per-checkout and needs no commit, so it works on the
# FIRST run rather than on the run after the one that seeds the file. It also
# leaves no artefact on the published site: gh-pages IS the site, and a
# `.gitattributes` at its root would be served.
#
# ## Why this is the whole fix for this conflict, despite six writers
#
# Only the four loops in `feature-staging.yml` write `_render-log` at all, so
# no other workflow can conflict on it. This does NOT stop the six workflows
# contending for the ref — that is `yzsj`, a different bean about PREVENTING
# the race rather than SURVIVING it.
#
# ## Scoped deliberately
#
# `_render-log/*.jsonl`, never `*.jsonl`. Widening it would silently
# union-merge files where a conflict is real information.
#
# Ordering is NOT preserved by union, and that was checked rather than assumed:
# nothing in this repository parses the log (only `readRenderLogEntry`, which
# validates a single entry), and every entry carries `at` as an RFC3339
# timestamp — so a future reader sorts by the entry rather than trusting file
# order. That is `pb4n`'s third "done when", answered.
set -euo pipefail

dir="${1:?usage: render-log-union-attr.sh <git-checkout-dir>}"

gitdir=$(git -C "$dir" rev-parse --git-dir)
# `rev-parse --git-dir` is relative to $dir when it is not absolute, so resolve
# it against $dir rather than against the caller's cwd.
case "$gitdir" in
  /*) ;;
  *) gitdir="$dir/$gitdir" ;;
esac

mkdir -p "$gitdir/info"
if ! grep -qsF '_render-log/*.jsonl merge=union' "$gitdir/info/attributes"; then
  printf '_render-log/*.jsonl merge=union\n' >>"$gitdir/info/attributes"
fi
echo "render-log: merge=union set in $gitdir/info/attributes"
