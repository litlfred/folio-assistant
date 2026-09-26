---
# folio-assistant-g1ph
title: content-pipeline-navigator MEMORY.md is at capacity, so no new entry can be added
status: completed
type: bug
priority: normal
created_at: 2026-09-19T08:50:00Z
updated_at: 2026-09-19T08:58:33Z
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

---

## Done, 2026-09-19 — the sibling mechanism, not smaller entries

**The fix is a schema feature, because brevity had run out.** `AGENTS.md`
prescribed *"split detail into sibling files the agent reads on demand"* and
there was no mechanism, so the only lever was shortening prose — and the
entries worth keeping are the ones with evidence in them.

`MemoryNode` gains an optional `detail`, split from the body at a
`<!-- detail -->` marker. `renderEntries` emits a one-line pointer; the
generator writes the evidence to `.claude/agent-memory/<agent>/detail/<id>.md`
and **prunes** files whose node no longer declares one — an orphan there says
something the entry has stopped saying, which is the orphan-sidecar shape one
directory along.

**In the body, not the front matter**, and that was a correction mid-flight: I
first carried it as a YAML block scalar, and the hand-rolled front-matter
parser here has no block-scalar support, so nothing reached the node and no
detail file was written. Detail is prose; indenting paragraphs into YAML is how
a later code fence or colon breaks a parse for no gain. An HTML comment is
invisible in rendered Markdown, so the source still reads as one document.

Split so far: `who-owns-which-file`, `derive-the-gate-list`,
`never-assert-on-a-qa-verdict`, `adapter-vs-profile`, `qa-sidecars`,
`the-commands-that-do-exist-here`, plus the new `block-verdicts-moved`.

**Result: 16 entries, region ending at line 193 of 200** — the four TRAPs from
bean `2634` are in, every entry injects whole, and there is headroom for the
next writer, which is the thing that was actually missing.

### The gate was wrong, and only the fix revealed it

`entriesPastBudget` reported entry HEADINGS past line 200. After the first
split the region ended at **209**, so the last entry's body ran nine lines past
the cut — and the check returned nothing, because that entry's heading sat
comfortably inside. **A truncated entry is worse than a dropped one: it still
looks complete to the agent reading it.**

It now reports a heading past the budget as before, and a region ENDING past it
too, naming the last entry. Pinned by four tests including a live one over this
repo's own generated files — the assertion the heading check never made.

## Summary of Changes

- `schemas/memory.ts` — optional `detail`
- `scripts/agent-memory.ts` — `splitDetail`, `detailRelPath`, `writeDetail`
  with pruning, and the corrected `entriesPastBudget`
- seven memory nodes split
- `scripts/tests/agent-memory.test.ts` — four new tests
