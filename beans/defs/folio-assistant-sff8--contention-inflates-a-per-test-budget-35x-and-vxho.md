---
# folio-assistant-sff8
title: Contention inflates a per-test budget ~35x, and vxho fixed ONE of 505 files — two more just failed on main
status: todo
type: bug
created_at: 2026-09-26T03:31:40Z
updated_at: 2026-09-26T03:31:40Z
parent: folio-assistant-1xhc
---


Measured 2026-09-26 on a clean checkout of `main` at `0ef9543ccf3`, while
starting unrelated work. `bun test` **exited 1**:

```
cat-harness/content/pipeline/translation-block-qa.test.ts:
(fail) buildReport — absence is absence > a translated block reports coverage,
       terms and echo — and NO round-trip verdict [5031.09ms]
  ^ this test timed out after 5000ms.

cat-harness/scripts/tests/profile-scoping.test.ts:
(fail) the sweep's profile gate, end to end > a paper-only criterion is n/a'd
       in a document folio, under its OWN outcome [12314.36ms]
  ^ this test timed out after 5000ms.
```

Both are **timeouts, not assertion failures** — the `^ this test timed out`
line says so. `11698 pass, 56 skip, 2 fail` across 505 files in 305s.

**Both pass in isolation.** The two files together: `45 pass, 0 fail, 12.44s`,
exit 0. So neither test is broken and neither is slow on its own.

The first one is the striking number: **5031ms against a 5000ms limit — 0.6 %
over.** That is not a race that happens sometimes; it is a coin whose bias
depends on what else the machine is doing.

## Why this is NOT a reopening of `vxho`

`vxho` is completed and its fix was right. It hoisted `SCHEMA_GRAPH` and
`LIBRARY_GRAPH` to module scope in **`viz-generators.test.ts`**, so that file's
filesystem work no longer sits inside any single test's budget, and it closed
with a stated falsifier:

> *"if this ever recurs on `viz-generators.test.ts` after this change, the cause
> is elsewhere and this entry is the record of what was already ruled out."*

It has **not** recurred there. It recurred in two other files. So `vxho`'s fix
holds and its falsifier is unfired — which is exactly why this is a separate
bean rather than a note on a closed one.

What `vxho` established and did not generalise is the mechanism:

> *"the test's own work is ~150ms and the full suite inflates it ~35x. That is
> CONTENTION — hundreds of test files against one disk."*

**That mechanism is a property of the suite, not of one file.** `vxho` fixed the
one file where it had been observed. 505 files remain, every one of which does
filesystem work inside a per-test budget shares the defect, and two of them
surfaced within 24 hours of `vxho` closing.

## Why it matters more than a re-run

The failure clears on re-run, so it teaches everyone who meets it to re-run —
and **flake is not a root cause**. Worse, it is indistinguishable from a real
failure at the moment you read it, which is `1xhc`'s subject from the other
side: here a gate fires when nothing is wrong, where `1xhc`'s usual case is a
gate staying silent when something is.

It also has a measurable cost in this repo: an author who runs `bun run gates`
and sees 2 red cannot tell it is not theirs, which is the same "could not
determine is never rendered as clean" failure that plausibly contributes to
open PRs sitting unlandable.

## What a fix is NOT

**Not a raised timeout.** `vxho` argued this and the argument holds: a bigger
number buys months and decays as the repo grows, and it converts "fails under
load" into "fails under more load".

**Not per-file hoisting, 505 times.** That is `vxho` applied by hand until
somebody stops, with no way to know when it is done.

## Done when

- [ ] the two files above are measured the way `vxho` measured its one — the
      test's own work timed in a quiet process, against its runtime under the
      full suite — so the ~35x is confirmed or corrected rather than assumed
      from `vxho`
- [ ] a decision is recorded on whether the general shape is addressable at the
      suite level at all: does `bun test` offer a per-test budget that excludes
      I/O, or concurrency limits that bound contention, or is per-file hoisting
      genuinely the only lever?
- [ ] MEASURED AFTER: whatever is chosen, `bun test` over the full suite is run
      repeatedly on a loaded machine and the pass rate reported — a single green
      run is what made this look fixed in the first place
- [ ] the two named tests stop appearing; and if a THIRD file appears before
      this is addressed, that count goes here rather than into a new bean

## Not claimed

Recorded and left `todo`. The session that found it was doing unrelated work
(`ymsu`) and deliberately did not pivot.
