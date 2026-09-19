---
# folio-assistant-n60j
title: 'SKILL: nothing tells an agent to run the platform''s own gates'
status: todo
type: task
created_at: 2026-09-19T17:05:47Z
updated_at: 2026-09-19T17:05:47Z
parent: folio-assistant-ahvw
---


Found by the SDLC audit for `folio-assistant-haya`
([`fsh-guts/proposals/sdlc-process-audit.md`](../../fsh-guts/proposals/sdlc-process-audit.md)
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

`skills/workflows/code-change-review.bpmn`, whose "Run the platform's own
gates" activity carries `<folio:no-skill>` naming this bean. When the skill
exists, that exemption becomes a `<folio:skill ref>`.

## Done when

- [ ] a skill exists and is bound from that activity, replacing the
      exemption
- [ ] the gate list is not restated by hand, or is generated with a check
- [ ] it distinguishes the fast inner loop from the full sweep
