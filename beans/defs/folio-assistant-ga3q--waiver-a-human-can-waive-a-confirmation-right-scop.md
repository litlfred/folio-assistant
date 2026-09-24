---
# folio-assistant-ga3q
title: 'WAIVER: a human can waive a confirmation right, scoped to a session or a process run'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-20T18:51:21Z
updated_at: 2026-09-20T18:51:53Z
parent: folio-assistant-ahvw
---

The owner, 2026-09-20, while the `bbbl` decision was being implemented:

> *"human can waive cinfirmation rights (e.g. for session, for process run)"*
>
> *"context depedndent, should be in memories.  (update skills)"*

## What this changes

Several rules here stop an agent and hand a decision back: merging to `main`,
removing a durable artefact, spawning a swarm, closing a bean whose evidence
the session could not re-derive, re-entering a process it fell out of, closing
an issue. Each is right, and each costs the owner a round trip. **The person
owed the confirmation may give it in advance, for a stated scope.**

The distinction the whole design turns on: that is not an agent making an
exception for itself, it is the same decision made earlier by the same person.
Every field on a waiver exists to keep that true.

## Landed in this change

- `skills/folio-core/confirmation-waiver.md` — five required fields, the closed
  gate vocabulary, the three-state read, and the four things an agent may never
  do (grant itself one, widen one, infer one from tone, treat one as a reason
  to skip the work).
- `schemas/waiver.ts` — `WaiverNodeSchema` with **no optionals**, `WAIVABLE_GATES`
  as a closed enum, and `waiverState()` returning three states rather than a
  boolean.
- The `waiver` graph kind, declared over the same directory as `memory` and
  told apart by the `$schema` tag — the owner's *"should be in memories"*.
- `bun run check:waivers`, wired into `code-quality-gates.yml`.
- Gate pointers in `deletion-requires-confirmation`, `swarm-management`,
  `issue-working`, `bean-coordination` and `AGENTS.md`, so the skill is
  consulted rather than merely present.

## The line that keeps it from being a hole in every other rule

> **A waiver relaxes a rule whose text is *ask first*. It can never relax a
> rule whose text is *never*.**

`AGENTS.md`'s *never delete ANY bean* is out of reach by construction: it is a
prohibition, not a confirmation anybody is owed, and `scrapped` is always
available.

## Done when

- [~] The skill exists; **five of the six gated skills point at it.**
      `confirmation-waiver`'s own gate table lists `process-reentry` →
      [`process-state`](../../cat-harness/skills/workflow/process-state.md),
      and that skill carries no pointer to the waiver. Ticked as done until
      2026-09-24, which is what stopped anybody looking. The other five —
      `deletion-requires-confirmation`, `swarm-management`, `issue-working`,
      `bean-coordination`, `AGENTS.md` — do point at it.
      **Cost while it stands:** an agent that has fallen out of process reads
      `process-state`, meets confirm-before-re-entering with no mention that
      the owner may have waived it, and asks anyway — the round trip this
      whole bean exists to remove.
- [x] A schema, a graph kind and a check exist, and the check is run by CI
- [ ] The CRDM `merge-to-main` gate names the waiver (its workflow text is a
      separate file and a separate change)
- [ ] A first real waiver is granted, so the read path is exercised rather than
      only the empty case
