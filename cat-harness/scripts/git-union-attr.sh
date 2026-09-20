#!/usr/bin/env bash
# Let a same-day `_render-log/<day>.jsonl` append MERGE instead of conflicting.
#
# `feature-staging` loses the `gh-pages` push race by design — the ref is the
# most contended here and a queue does not help, because a PENDING job is
# cancelled by the next arrival rather than waiting. Its answer is three
# attempts with a rebase between. That answer was measured failing on
# 2026-09-20 (PR #612, `stage` on 0da595551b):
#
#   Auto-merging _render-log/2026-09-20.jsonl
#   CONFLICT (content): Merge conflict in _render-log/2026-09-20.jsonl
#   error: could not apply f2a2836... staging(claude-sharp-fermi-xvs06i)
#
# The retry RAN and died on attempt 1. `renderLogPath()` gives one file per
# calendar day shared by every session, and the entry is committed in the SAME
# commit as the deploy — deliberately, so a preview cannot exist with no record
# of where it came from. Two sessions append at EOF; the loser rebases onto the
# winner; git cannot merge two appends to the last line. The property that
# makes the log trustworthy is the one that defeated the retry.
#
# `union` is the textbook driver for an append-only log: it keeps BOTH sides'
# lines rather than writing conflict markers. Verified before shipping on a
# scratch repo — rebase exit 0, zero conflicts, both entries present, every
# line still valid JSON. Order within a day is not load-bearing; each entry
# carries its own timestamp and run URL.
#
# ## Why `$GIT_DIR/info/attributes` and NOT a committed `.gitattributes`
#
# The attribute has to be in effect on `gh-pages`, and `gh-pages` is the one
# branch that cannot hold a committed file reliably: `docs-site` publishes with
# `peaceiris` as a FULL REPLACE. `restore-staging.ts` records that mechanism
# deleting this exact path — "`docs(gh-pages)` full replace, deleted
# `_render-log/2026-09-20.jsonl`" — which is why a restore step exists at all.
#
# A committed `.gitattributes` would therefore be removed by the next full
# replace and quietly stop applying, and the conflict would return looking like
# a NEW defect rather than a regression. `info/` is local to the checkout,
# never committed, and re-established every run by construction rather than by
# anybody remembering. Bean `yzsj`, issue #605.
#
# Usage:  git-union-attr.sh [repo-dir]     (default: the current directory)
set -euo pipefail

repo="${1:-.}"
rule='*.jsonl merge=union'

# `--absolute-git-dir` rather than `--git-dir`: the latter answers RELATIVE to
# the repository, so it is `.git` whatever directory the caller stands in, and
# every use site would have to re-prefix it. It also resolves the case where
# `actions/checkout` leaves `.git` as a FILE pointing elsewhere.
git_dir="$(git -C "$repo" rev-parse --absolute-git-dir)"
mkdir -p "$git_dir/info"

# Append only if absent: idempotent, and it does not clobber an attributes file
# somebody else put there. `-x` so a longer line containing this one as a
# substring is not mistaken for it.
if ! grep -qxF "$rule" "$git_dir/info/attributes" 2>/dev/null; then
  printf '%s\n' "$rule" >> "$git_dir/info/attributes"
fi

# VERIFY, and fail loudly. A silent no-op here is the whole failure mode this
# script exists to prevent: the conflict would come back and read as new.
# `check-attr` answers for a path whether or not it exists.
probe="_render-log/probe.jsonl"
got="$(git -C "$repo" check-attr merge -- "$probe")"
case "$got" in
  *": merge: union") echo "union merge driver active for *.jsonl in $repo" ;;
  *) echo "::error::git-union-attr: attribute did not take effect — $got" >&2; exit 1 ;;
esac
