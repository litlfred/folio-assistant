---
# folio-assistant-g1ph
title: 'content-pipeline-navigator MEMORY.md is at capacity, so no new entry can be added'
status: todo
type: bug
priority: normal
created_at: 2026-09-19T08:50:00Z
updated_at: 2026-09-19T08:55:00Z
---

## The finding

`.claude/agent-memory/content-pipeline-navigator/MEMORY.md` is **223 lines**,
of which the last 23 are a hand-written tail rather than entries. Every entry
therefore ends just before the harness's 200-line injection cut — it fits, but
with **no headroom at all**.

**The practical consequence is not "it is untidy". It is that the file cannot
accept another entry.** Adding four TRAPs during bean `2634` took it to 267
lines and pushed **two existing entries past the cut**, where the harness
silently drops them:

- `TRAP — never assert on a QA VERDICT from the published corpus`
- `TRAP — the schema cannot catch a profile violation`

Condensing the new entries from 299 lines to 267 did not help: the four cost
~44 lines and only ~66 were available, and roughly 8 of each entry's lines are
front matter that cannot be shortened. Trimming is not the fix; the file needs
the split `AGENTS.md` prescribes — *"keep it under 200 lines — split detail
into sibling files the agent reads on demand."*

The four entries were backed out rather than shipped, so nothing is currently
dropped.

## Correcting my own first version of this bean

I originally wrote that the file was "already 22 over budget, so at least one
entry was already unreachable". **That was wrong**, and
`scripts/tests/agent-memory.test.ts` proves it: the gate asserts no entry falls
past the cut, and it was GREEN before this session. 223 lines with entries
ending before 200 is a file that fits. I mistook total length for overflow and
would have shipped a bean blaming a predecessor for my own regression.

## The four facts that could not be recorded

Preserved here so they are not lost, and to be added as entries once the split
lands. All measured 2026-09-19 during bean `2634`:

1. **A block's QA verdict is no longer beside the block.** `${block.root}.qa.json`
   finds nothing, and finding nothing reads as "never audited" — a false pass.
   `content/pipeline/qa-paths.ts` is the one answer: `existingBlockQaPath` to
   read (results tree, then legacy sibling), `blockQaPath` to write (results
   tree only), `blockOfQaPath` to invert.
2. **A diagnostic must not reuse a finding's grep string.** A "could not read
   the results tree" warning worded with `orphan QA sidecar` turned ten
   assertions red — it inflated the very census the check protects.
3. **`validateObjects`'s empty-corpus guard is disarmed by any advisory issue.**
   It detects "validated nothing" as `allBlocks.size === 0 && issues.length === 0`,
   so a warning about a check that could not run flipped "an empty directory is
   INVALID" to `valid: true`. Fixed there; the fragility remains for the next
   check that adds an advisory issue.
4. **A `mkdtemp` fixture cannot exercise anything using `findContentRepoRoot()`.**
   It sits outside every instance root, so a check that has stopped working
   still passes. Every pre-existing `no-orphan-sidecar` fixture was one, which
   is why none of them noticed that check becoming a no-op.

## Done when

- [ ] entries end well before line 200, with headroom for the next session
- [ ] the four facts above are entries
- [ ] detail moved to siblings is still reachable, not deleted
- [ ] consider whether `agent-memory` should FAIL rather than warn on the
      budget — the test gates entries falling past the cut, but nothing gates
      a file arriving at capacity, which is what made this a trap for the
      next writer rather than for the one who filled it
