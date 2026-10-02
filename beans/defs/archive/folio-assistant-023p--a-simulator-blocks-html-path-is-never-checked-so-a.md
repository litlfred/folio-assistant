---
# folio-assistant-023p
title: 'A simulator block''s html: path is never checked, so a dangling one validates clean'
status: completed
type: task
priority: normal
created_at: 2026-09-19T15:29:10Z
updated_at: 2026-09-20T16:33:59Z
parent: folio-assistant-1xhc
---

## What

`content/pipeline/validate.ts` contains **no reference to `simulator` or
`.html`**. A `simulator` block declares `html: "simulators/x.html"`, and
nothing anywhere in the pipeline asks whether that file is on disk.

## How it was found

Measured 2026-09-19 while running `/prepare-merge` on qou#7444, which
repoints all 11 simulator paths out of the platform and into the folio.

Two of the eleven — `descent_rate_probe.html` and `multi_level_jet_sum.html`
— **exist in neither repository**. They were already dangling on qou's
`main`, at the old path, before that branch touched anything.

`bun run scripts/run-validate.ts` in qou exits **0** with 3 issues, none of
them about a simulator. Both dangling blocks pass clean. They were caught by
reading each path against the filesystem by hand, not by any gate.

`grep -n 'simulator\|\.html' content/pipeline/validate.ts` → no output.

## Why it belongs to this epic

A simulator block with a dead `html:` is indistinguishable, to every check
that runs, from one whose target is present. The folio renders a block whose
content cannot load, and the validator's `✓ Valid` is what says it is fine.

## Not the same as the `todo-html` tag

Both dangling blocks carry `tags: [..., "todo-html", ...]`, which records the
author's intent to write the file later. That is a **claim in a tag**, not a
check: nothing reads it, nothing reconciles it against disk, and a block that
loses the tag while keeping the dead path is reported by nobody.

## Done when

- A declared simulator asset that is not on disk is a finding, not silence.
- The three states are distinguished: present · absent · could-not-determine
  (an `http(s)` target, or a path outside the folio root). Absent is a
  finding; could-not-determine is never rendered as clean.
- A block tagged `todo-html` is reported **as a deferred stub** rather than
  dropped from the count — an intentional absence is still an absence, and
  "how many are deferred" is the number an author needs.
- The two known cases in qou appear in that report.

## Not in scope

Writing the two missing simulators. This bean is about the gate, not the
content; the folio decides whether those blocks get files or get scrapped.

## DONE 2026-09-20 — phase 6 of `validate.ts`, and a bug of my own on the way

`content/pipeline/validate-simulator.ts`, wired as phase 6. Three states kept
apart exactly as this bean required:

- **present** — resolved and on disk. Silent.
- **absent** — a finding. `error` untagged, `warning` when tagged
  `todo-html`, and **counted either way**.
- **undetermined** — an `http(s)` target, or a path escaping the repository.
  Reported as its own thing, never rendered as clean.

### Verified against the two cases this bean names

    present       9
    absent        2  -> simulators/descent_rate_probe.html
                        simulators/multi_level_jet_sum.html
    undetermined  0

Both carry `todo-html`, so both surface as deferred stubs with a count rather
than as errors — which is what the bean asked for, and what distinguishes an
intended absence from an unnoticed one. A block that LOSES the tag while
keeping the dead path escalates to `error`; that transition has a test.

### The bug that nearly shipped, and why the first check did not catch it

The first draft resolved `html:` against `folioDir()`. Both known-dangling
cases came back `absent` — **the right answer for the wrong reason.** qou's
targets are `simulators/<x>.html` and the files sit at `<repo>/simulators/`,
not under the folio root at `<repo>/content/`, so all NINE present ones would
have been reported missing.

`SimulatorBlock.html` documents itself as *"relative to repo root"*. I had read
the two cases that confirmed my expectation and not the nine that would have
refuted it. Fixed, and the corpus now returns 9/2/0.

### Two things found while in here

**The schema was lying.** `SimulatorBlock`'s doc comment claimed *"Pipeline
validates: .html companion exists"* — for months, while `validate.ts`
contained no reference to `simulator` or `.html`. Corrected, with a line
saying to delete a claim rather than let it go stale.

**The partition classified the new module `sci`.** Its keyword rule matches the
word `simulator`. Measured: `simulator` is in core's own
`DOCUMENT_BLOCK_KINDS`, NOT `MATH_BLOCK_KINDS`, so a check on its asset path
belongs to the layer declaring the kind — the classification was wrong, not the
import, exactly as `schemas/dak-blocks.ts` was in the `smart-base` block. Fixed
as an `exact` entry in a rule that PRECEDES the keyword rule, since first match
wins and an `exact` after it never runs.

## Done when

- [x] a declared simulator asset not on disk is a finding
- [x] three states distinguished; undetermined never rendered as clean
- [x] `todo-html` reported as a deferred stub rather than dropped from the count
- [x] the two known qou cases appear in that report

Out of scope, as stated: writing the two missing simulators. The folio decides
whether those blocks get files or get scrapped.
