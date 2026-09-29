---
# folio-assistant-zldg
title: 'BLOCKING IS UNRECORDABLE: the skill prescribes `status: blocked`, which the CLI and schema both refuse — so 0 of 99 blocks carry an expiry'
status: completed
type: bug
priority: normal
created_at: 2026-09-22T11:43:50Z
updated_at: 2026-09-22T11:50:46Z
parent: folio-assistant-ahvw
---

Found 2026-09-22 by a dispatched audit of the in-progress population, then
re-derived from `origin/main` rather than from the audit's report.

## The contradiction, checked three ways

| source | says |
|---|---|
| `skills/folio-core/bean-blocking.md` §"When it really is blocked" | its worked example is **`status: blocked`** · waits on · since · expires · handoff |
| `beans update --help` | *"New status (in-progress, todo, draft, completed, scrapped)"* |
| `schemas/tool-types.ts:36` | `draft \| todo \| in-progress \| completed \| scrapped` — *"Exactly what `beans update --status` accepts"* |

**The skill instructs agents to write a status the tool refuses.** So the
prescribed record cannot be created, and agents fall back to prose.

## What that costs, measured over the 99 in-progress beans on main

| | count |
|---|---|
| carry `expires:` | **0** |
| assert a block in a STRUCTURED way (`## Blocked on` heading) | **4** (`7sf1`, `p5wm`, `wlqd`, `yg29`) |
| use blocking language somewhere in prose | 26 |
| say "waits on" / "waiting on" | 15 |
| carry `status: blocked` | 0 — it does not parse |

`bean-blocking` says the expiry is the field that matters, *"because a block
with no expiry cannot be told from abandoned work"*. Not one bean has it. So 26
beans are stopped and **none of them can go stale on a date** — which is the
condition that skill exists to prevent, holding across the entire store.

## Not `fgnw`, which is completed and adjacent

`fgnw` fixed *"an in-progress claim carries no activity signal"* — staleness by
**silence**. This is staleness by **declaration**: a bean that says out loud it
is waiting, in a form nothing can check and no date can expire. Different half,
different repair.

## Done when

- [x] The skill's worked example uses a form that actually parses
- [x] A bean asserting a block in the structured form must carry all four
      fields, enforced
- [x] Prose blocks are REPORTED, never failed — the language is too varied to
      gate on without false positives, and a gate that fires on "no longer
      blocked" is one that gets switched off
- [x] Falsified both ways: a field stripped goes red; a bean with no block
      language is untouched

## Summary of Changes

**The root cause was that the prescribed form did not parse.** `bean-blocking`
told agents to write `status: blocked`; the CLI accepts five values and that is
not one. So the four-field record had a **0 % compliance ceiling**, and 0 of 99
in-progress beans carried an expiry.

- **Skill corrected** — the worked example is now a `## Blocked on` section,
  the form four beans had already invented independently. `status` stays
  `in-progress`. `expires` is an absolute date, not `+48h`, so a stale block is
  not arguable.
- **`check:bean-blocks`**, registered and wired into `code-quality-gates.yml`.
  It **imports** `readBeans`, `hasExpiry` and `beanFindings` from `scripts/beans.ts`
  rather than restating any of them — two answers to "does this bean state an
  expiry" would be two answers free to disagree.
- **What was actually missing was teeth, not machinery.** `beanFindings`
  already emitted `blocked-without-expiry`, firing on 4 of 4 subjects; its only
  consumer was `gen-docs-pages.ts`, which publishes it to a page. A finding
  that reaches a page nobody must read is a finding with none.
- **Seven beans given a structured record**: `cz17`, `xeg6`, `p5wm`, `yg29`,
  `7m6g`, `7sf1`, `7u3g`. Gate now green: 7 complete, 0 incomplete.
- **Prose is reported, never failed** — 29 in-progress beans. The corpus has
  *"genuinely blocked"* beside *"this unblocked `68dt`"*; a gate on the word
  would go red on beans that are not blocked, and one nobody can keep green
  gets switched off.

### The refinement the corpus forced

`cz17` waits on **WHO finalising a FHIR Logical Model**. There is no honest
date on which to take that over, so an external block's expiry is a **RE-ASK
date** and its handoff says so. Written into the skill. What the gate refuses
is an expiry that is *absent*, never one extended with a reason.

### A measurement error worth recording

I read the first failing list through `tail` and acted on 4 beans, believing
that was all of them. It was 7 — the truncation hid the first three. Caught by
re-running rather than by trusting the earlier output.

### Where it landed

Issue #950, PR #951. The PR carries the same reasoning for a reader who comes
at it from the diff rather than from the work plan.
