---
# note on folio-assistant-o8s9 from claude/festive-galileo-s7ibx0
$schema: folio-bean-note/v1
bean: folio-assistant-o8s9
branch: "claude/festive-galileo-s7ibx0"
created: "2026-10-03"
---
## Owner ruling on drain order — mechanism before throughput

Asked how to drain the queue given that each merge discards a sweep, the owner
chose **"Fix the mechanism first"** over merging on sight, freezing one sweep
window, or going to the root with the `auto-docs` branch (#1966):

> Hold merges until o8s9 (concurrency) and 8c6v (17 docs patterns) land, then
> drain. Both are dispatched and small. Costs ~30-45 min of throughput now;
> after it, my merges stop killing sweeps and ~53-of-55 conflicts auto-resolve.

The Merge Manager therefore merged nothing to `main` between #1764
(`1aaa669f998`) and this bean's own fix (#1969, `077c3673acc`).

**What the freeze measured, which was not what it was for.** Across it, `main`
moved **four times and every one was a `beans:claim` push**, never a merge:
`8c6v` 09:17:36Z, `ax6r` 09:38:42Z, `ay3x` 09:52:37Z, plus a direct
"Add files via upload" at 10:16. So a freeze on merges is not a freeze on
`main` — bean `24fa`'s evidence, gathered by accident.

**Why this note exists rather than an append to the bean body.** The body was
appended to on this branch while `beans:claim` put its own copy of the same
bean on `main` via #1969. With no common ancestor for the file, git saw an
**add/add** conflict, where any difference at all conflicts — and the
merge-main bot refused this branch three times on that one path while
resolving every other conflict by pattern. `bean-coordination` §"Adding to a
bean — a note, not an append" exists for precisely this, one file per branch
per bean, and ignoring it cost three refusals. The def is now byte-identical
to `main`'s and this note carries the addition.
