---
# folio-assistant-qjyi
title: qa-panel.e2e.ts pinned four literals to a corpus finding that got adjudicated away
status: completed
type: bug
priority: normal
created_at: 2026-09-19T01:38:50Z
updated_at: 2026-09-19T01:39:14Z
---

`main` went red on the `End-to-end + accessibility (hard)` job because a spec
asserted against corpus data that another PR legitimately regenerated.

## What broke, and why neither PR was wrong

[#317](https://github.com/litlfred/folio-assistant/pull/317) added the e2e job
at 01:04 on 2026-09-19. [#302](https://github.com/litlfred/folio-assistant/pull/302)
merged the voice work at 01:05, adjudicating all 26 `voice-*` findings to zero.
Each was green on its own branch; the defect exists only in the merge — the
third instance of that shape in one session, after #312's stale KG sidecar and
the gh-pages push race.

`tests/qa-panel.e2e.ts` read a real sidecar off disk —
`docs/assets/qa/crdm-methodology/what-is-not-built-yet.block.json` — and pinned
four things to the one failing criterion it happened to carry: the criterion id
`voice-status-leak`, the fold count `47`, the checker filename
`qa-checkers-voice.ts`, and the checker source hash `5af6856733f3`.

That failure was the `⚠` glyph #302 records as "the only glyph in all 122
blocks". Adjudicating it took the block's counts to
`{fail: 0, warn: 0, pass: 22, na: 26}` — so the spec's subject stopped existing.

**The data was right and the panel was working.** Measured on `main` at
`78a399e`: 2 failed, 40 passed.

## The deeper problem

A green corpus is the goal. A spec that needs a red one gets worse as the work
succeeds, and would have broken again on the next re-audit even if the four
literals were simply updated.

## The rule this now follows, which the file already stated

`STALE_JSON` in the same spec was written to avoid exactly this, and says so:

> Whether a hash comparison yields `stale` is settled in `qa-witness.test.ts`
> against files it controls; what belongs HERE is whether the panel renders
> that state — which must not depend on the corpus happening to hold an
> out-of-date verdict on the day the suite runs.

Applied to the rest of the spec: the failing criterion is injected with the
exact shape the sweep really wrote for it, recovered from commit `55ee7ca`, and
every expectation is derived from that object instead of restated.

## Todo
- [x] inject the failing criterion rather than rely on the corpus carrying one
- [x] derive criterion id, severity, fold count, witness kind, id, hash and evidence
- [x] point `STALE_JSON` at the criterion that actually renders first
- [x] derive the badge's announced counts too
- [x] reproduce the failure, then show it pass

## Done when
`bunx playwright test tests/qa-panel.e2e.ts` passes, and re-auditing the corpus
cannot change whether it does.

## Summary of Changes

`tests/qa-panel.e2e.ts` only. `FAILING_CRITERION` holds the criterion's real
shape — id, `severity: critical`, its evidence line, and a script witness with
`scriptHash` — recovered from `55ee7ca`, before the adjudication. `BLOCK_DOC`
parses the corpus sidecar, appends that criterion **last** so the "worst
criterion first" test proves the panel reorders rather than that the row
happened to come first, and bumps `counts.fail`.

Every expectation is now read from those objects: `FAILING_CRITERION.result`,
`.id`, `.severity`, `.evidence[0]`, `FAIL_WITNESS.kind`, `.id`, `.scriptHash`,
and `QUIET_COUNT = BLOCK_DOC.criteria.length - 1` for the fold. The harness
badge's announced counts come from `BLOCK_DOC.counts` too, so the aria-label
cannot drift from the document it describes.

`STALE_JSON` now marks the witness of the criterion whose `result` is `fail`
rather than `criteria[0]`. Worst-first sorting means `criteria[0]` in source
order is a passing criterion folded away behind the count — the spec clicks the
first *rendered* row, so the old index would have marked the wrong one.

Verified in the order the repo's own rule asks for: with the fix stashed,
`bunx playwright test tests/qa-panel.e2e.ts` gives **2 failed, 5 passed** —
byte-for-byte the failure on `main` at `78a399e`. With it applied, **7 passed**.
Across every e2e spec that runs in this container (`qa-panel`, `kg-viewer`,
`sidebar-panels`, `test-server`): **26 passed, 0 failed**. `bun test` 2009 pass
/ 0 fail; `bunx tsc --noEmit` and `eslint` clean.

`tests/a11y.e2e.ts` could not be run here: it needs network this container's
egress policy denies (`www.google.com`, `redirector.gvt1.com` — 43 rejected
CONNECTs). It is untouched by this change and CI runs it.

## Superseded — dropped in favour of a sibling's fix, 2026-09-19

**Another session fixed this first and its fix is on `main`** (`9eaeb23`,
"Two e2e suites: one my change broke, one main is red on"). Merging `main` into
this branch conflicted on `tests/qa-panel.e2e.ts`; resolved by taking `main`'s
version wholesale and discarding mine. Nothing of this bean's patch survives.

Worth recording, because two sessions reached it independently: **the diagnosis
and the design were the same on both sides.** Both identified that #302
legitimately adjudicated the failing criterion away, both quoted the file's own
`STALE_JSON` comment as the rule that already covered this shape of mistake,
and both injected the real criterion — recovered from the sweep before the
adjudication — rather than updating the four literals. Their phrasing of the
principle is the better one: *"a test of the PANEL failed because the CONTENT
got better"*.

One substantive difference, left as an observation rather than a change, since
it is merged code and not mine: **theirs replaces `criteria[0]`; mine appended
last.** Its comment argues the opposite of what it does — "a row appended at
the end still has to be hoisted, which is the behaviour under test" is an
argument FOR appending — and replacing at index 0 means the failing row is
already first in source order, so the test named "worst criterion first" no
longer demonstrates that the panel hoists anything. It would pass against a
panel that did no sorting at all. Minor, and not worth a second PR over a file
someone else just fixed, but it is the assertion's whole subject.

This bean stays `completed` rather than `scrapped`: the work was done and
correct, it simply lost a race.
