---
# folio-assistant-676g
title: kg:validate cannot own a NESTED instance's path, so 15 instances' committed QA sidecars are consumer-validated by nothing
status: todo
type: task
created_at: 2026-09-27T16:50:03Z
updated_at: 2026-09-27T16:50:03Z
parent: folio-assistant-1xhc
---

## What was measured

`kg:validate` resolves declared directories from ONE instance root, so a sidecar
in a nested instance is refused rather than validated. Measured 2026-09-27, from
the repository root:

    bun run cat-harness/scripts/kg-validate.ts cat-harness/test/results/kg-qa/processes/adjudication.kg-qa.json
      ✓ … [qa]

    bun run cat-harness/scripts/kg-validate.ts bootstrap/test/results/kg-qa/skills/discussion.kg-qa.json
      ? … could not determine: no declared directory owns this path, or the one
          that does declares several graphs and which applies is not stated

    bun run cat-harness/scripts/kg-validate.ts smart-dak/test/results/kg-qa/scenarios/kg.kg-qa.json
      ? … same

**This is PRE-EXISTING, not caused by the loop.** bootstrap declared `qa` →
`test/results/` and committed its sidecars in bean `bjzs` box 6, before
`kg:audit:all` existed, and they have never been consumer-validated either. The
per-instance loop did not create the gap; it multiplied the artefacts sitting in
it from 2 instances to 15.

The message's second clause is a red herring here: `smart-dak.json` declares
`test/results/` with `graphKinds: ["qa"]` — exactly one kind — so the failing
branch is "no declared directory owns this path", i.e. the resolver never read
that instance's declaration at all.

## Why it matters, in the corpus's own terms

`check:artefact-verification` asks, per generated-artefact check, *what verifies
the artefact for its CONSUMER* as opposed to verifying the committed copy is
current — and its own comment says why the distinction is not academic:

> the difference has cost six pages — `library:viz:check` was green while the
> page it generated could not run (PR #805).

`kg:audit:all:check` proves currency: every sidecar matches what the auditor
would write today. Nothing proves a sidecar PARSES as `kg-qa/v1` for a reader
that picks one up, because the one tool that would say so cannot address it. So
the entry for that gate is `none` with this bean as its reason, not `verified`.

## What this is NOT

Not `pgzn`. That one is `kg:audit --instance .` crashing on the instance declared
at the repository ROOT. This is the reverse direction: a consumer run from the
root failing to own a NESTED instance's declared path. Same family as the five
cross-instance issues in `bjzs`, and the same polarity as the fifth — a tool
seeing less than the declarations say.

## Done when

- [ ] `kg:validate <nested-instance>/test/results/kg-qa/**` validates rather than
      reporting "could not determine" — for bootstrap and for the 13 the loop
      added.
- [ ] a test pins it against a nested instance, not only the auditor's own.
- [ ] `artefact-verification.json` moves `kg:audit:all:check` from `none` to
      `verified`, naming what does the validating. That move is the reason this
      bean exists, and the declaration file may only shrink in the `none`
      direction.
