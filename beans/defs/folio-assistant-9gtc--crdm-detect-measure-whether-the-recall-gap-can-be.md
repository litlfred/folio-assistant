---
# folio-assistant-9gtc
title: 'crdm-detect: measure whether the RECALL gap can be closed by phrases at all'
status: in-progress
type: task
created_at: 2026-09-21T16:20:20Z
updated_at: 2026-09-21T16:20:20Z
parent: folio-assistant-ahvw
blocked_by:
    - folio-assistant-vjbl
---

**BASELINE — `main` at `5bca749`, `bun run eval:crdm-detect`.** Whole 27-issue
population: precision **80%**, recall **63%** (12 of 19), F1 **71%**. Re-run it;
do not quote this as a current answer.

Sibling of `xfoh`, which closed the *precision* half. This is the other half and
it is **not the same job**.

## The asymmetry, which is the whole design constraint

`xfoh` narrowed the EXCLUSIONS. Every pattern added there can only turn a false
alarm into a true negative — it cannot cost recall, and the one direction that
could (silencing a true positive) was closed with a corpus-wide test.

Widening the CATEGORIES is the mirror image: **every pattern added there can
only cost precision.** It turns a true negative into a false alarm, never the
reverse. So the acceptance test is not "recall went up":

> recall up **and precision not down**, over the whole population.

A candidate that costs a true negative is rejected unless it buys more than one
miss, and the guard test is written before the patterns.

## The seven misses

`#232` getting started · `#205` RAG ingestion proposal · `#203` business
requirements gathering (CRDM) · `#199` IG incremental build register ·
`#194` IG Publisher micro-asks · `#192` incremental build decisions · `#1` add
assistant framework.

`#203` is the issue that asked for this capability. `#1` is titled *"add
assistant framework"* — three words.

## What would falsify the approach

If the seven share no phrasing the eight true negatives do not also carry, then
**there is no pattern to add**, and the honest outcome is a recorded NEGATIVE
RESULT: the phrase list is at its ceiling on this corpus and recall needs
judgement rather than phrases. That finding is worth as much as a fix and
must be shipped rather than swapped for a pattern tuned to reach a number.

## Done when

- [ ] Each of the seven read, and a candidate signal named or the miss recorded
      as unreachable by phrase, with the reason.
- [ ] Guard test written FIRST: precision does not fall, over the whole corpus.
- [ ] Re-measured against 80/63/71, and the movement reported as precision AND
      recall — never F1 alone, which hides a trade.
- [ ] `bun run gates` green.

## Caveat that rides every number

`vjbl`: the labels are one unblinded annotator's. A "miss" is a miss against a
label nobody has independently confirmed.
