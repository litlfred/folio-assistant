---
# folio-assistant-n60j
title: 'SKILL: nothing tells an agent to run the platform''s own gates'
status: completed
type: task
priority: normal
created_at: 2026-09-19T17:05:47Z
updated_at: 2026-09-19T18:25:40Z
parent: folio-assistant-ahvw
---


Found by the SDLC audit for `folio-assistant-haya`
([`fsh-guts/proposals/sdlc-process-audit.md`](../../../fsh-guts/proposals/sdlc-process-audit.md)
§3), and it is the concrete content of that audit's finding that the
**Verification** phase is unowned for the platform.

## The measurement

A contributor runs these before pushing, and they are enumerated in
`package.json` and in CI YAML and **nowhere an agent is told to read**:

    typecheck · lint · kg:audit:check · ns:check · kg:schema:check
    check:harness-dirs · check:workflow-refs · render:bpmn:check
    avatars:css:check · themes:css:check · gen:jsonld:check
    check:schema-nodes · check:declared-paths · check:declared-assets
    check:bean-parents · check:orphan-verdicts

An agent finds them by grepping `package.json`. That is not a knowledge
gap it can be blamed for — there is no skill to find.

## Why this is more than an inconvenience

`bun test` passing is NOT the same as the gates passing, and the two come
apart in practice. Measured 2026-09-19 on `folio-assistant-zz0a`: the unit
suite was green while `tsc` failed on a readonly-array assignment, and
`check:schema-nodes` failed on a missing `@graphNode` tag — which ALSO
broke the `kg-export` sidecar comparison, one cause with two symptoms.
An agent that ran only `bun test` would have pushed all three.

That is the local-green-that-CI-does-not-share trap, and it has now cost
this repository several CI cycles across at least two sessions.

## What the skill has to answer

1. **What to run before a push**, as a list an agent can execute, not a
   pointer at `package.json`.
2. **Which are fast and which are slow**, so the inner loop is usable.
3. **What each one is FOR** — a gate whose purpose is unstated gets
   "fixed" by making it pass.
4. **The generated-file gates specifically**: several are `*:check`
   against a generator, so the fix is to re-run the generator and commit,
   never to hand-edit the artefact.

## Do NOT let this become a second source of truth

The list lives in `package.json`. A skill that RESTATES it will drift, and
a drifted list is worse than none because it reads as authoritative. Prefer
one aggregate script the skill names, or generate the list with a
`--check` gate — the same discipline every other generated artefact here
carries.

## Referenced from

`processes/code-change-review.bpmn`, whose "Run the platform's own
gates" activity carries `<folio:no-skill>` naming this bean. When the skill
exists, that exemption becomes a `<folio:skill ref>`.

## Done when

- [ ] a skill exists and is bound from that activity, replacing the
      exemption
- [ ] the gate list is not restated by hand, or is generated with a check
- [ ] it distinguishes the fast inner loop from the full sweep

## Closed 2026-09-19 — all three criteria met

`skills/folio-core/platform-gates.md`, `scripts/gates.ts`,
`bun run gates` / `gates:list`. The `<folio:no-skill>` exemption in
`code-change-review.bpmn` is now a `<folio:skill ref="platform-gates"/>`.

- **[x] a skill exists and is bound, replacing the exemption**
- **[x] the gate list is not restated by hand** — it is DERIVED, at run
  time, from `.github/workflows/code-quality-gates.yml`
- **[x] it distinguishes the fast inner loop from the full sweep** — and
  the split is derived too, from job membership: `typescript` needs no
  browser, `e2e` installs Chromium

## The authority is the WORKFLOW, not package.json

This was the design question, and the answer was not the obvious one. The
failure being prevented is specifically *green here, red in CI*, so the
question an agent needs answered is not "what checks exist" but **"what
will CI run against my change"**. Only the workflow knows that.

`package.json` over-answers: 21 of 33 `check:`/`:check` scripts appear in
no workflow, and the workflow's own comments name six it deliberately
excludes, each with a stated reason. Those reasons live beside the
exclusion, which is where they should be read.

## The drift this bean predicted, demonstrated on its own author

The bean warned that a restated list would drift. It had already happened:
the agent writing this had spent the session running **17** gates by hand
and reporting them as "the gate sweep" in commit messages and PR bodies.
The derived set is **37** fast, **40** with the browser job.

Among the thirteen never run once: `check:tools`, `check:voices`,
`kg:schema:check`, `readme:audit`, `agent-memory:check`,
`gen-skill-docs --check`. That last one FAILED on the first derived run —
this very skill had no generated page — which a hand-list would have
missed for exactly the reason the hand-list existed.

## The vacuity guard

An extraction finding nothing THROWS rather than exiting clean. An empty
sweep that exits 0 is indistinguishable from a passing one, and this
repository has paid for that shape three times: a grep over zero Lean
files printing OK, a ruff scan of missing paths reporting a baseline it
never computed, and `readme:sync:check` passing over a README with no
markers. Proved load-bearing by disabling it (1 fail).

## Verified

`bun run gates` → 37 pass. `bun run gates --all` → 40 pass, including 174
e2e. Suite 2903 pass / 0 fail across 211 files.

Two real defects the derived set caught that the hand-list did not: the
missing generated skill page, and this skill being absent from
`skills/folio-core/package-manifest.json`.
