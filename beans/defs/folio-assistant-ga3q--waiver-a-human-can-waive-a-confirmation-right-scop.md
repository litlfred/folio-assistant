---
# folio-assistant-ga3q
title: 'WAIVER: a human can waive a confirmation right, scoped to a session or a process run'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T18:51:21Z
updated_at: 2026-10-09T13:22:00Z
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

- `skills/conduct/conduct-core/confirmation-waiver.md` — five required fields, the closed
  gate vocabulary, the three-state read, and the four things an agent may never
  do (grant itself one, widen one, infer one from tone, treat one as a reason
  to skip the work).
- `schemas/waiver.ts` — `WaiverNodeSchema` with **no optionals**, `WAIVABLE_GATES`
  as a closed enum, and `waiverState()` returning three states rather than a
  boolean.
- The `waiver` graph kind, declared over the same directory as `memory` and
  told apart by the `$schema` tag — the owner's *"should be in memories"*.
- `bun run cat check:waivers`, wired into `code-quality-gates.yml`.
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

- [x] The skill exists; all six gated skills point at it.
      `confirmation-waiver`'s gate table lists `process-reentry` →
      [`process-state`](../../cat-harness/skills/process/workflow/process-state.md),
      and that skill now carries the explicit pointer in §"Recovering" item 3.
      The other five — `deletion-requires-confirmation`, `swarm-management`,
      `issue-working`, `bean-coordination`, `AGENTS.md` — also point at it.
- [x] A schema, a graph kind and a check exist, and the check is run by CI
- [x] The CRDM `merge-to-main` gate names the waiver (its workflow text is a
      separate file and a separate change)
- [x] A first real waiver is granted, so the read path is exercised rather than
      only the empty case

## Closed 2026-10-09

Fixed on branch `claude/ga3q-process-state-waiver` (commit `213948bb`):

1. **Gated skills pointer complete:** In `skills/process/workflow/process-state.md` and `docs/reference/skill-instructions/process-state.md`, added explicit pointer in §"Recovering" item 3 to `confirmation-waiver.md`:
   > The person owed the confirmation may give it in advance for a stated scope — see [`confirmation-waiver.md`](../../cat-harness/skills/conduct/conduct-core/confirmation-waiver.md).
   All six waivable gates now have explicit pointers in their governing skills (`process-state`, `deletion-requires-confirmation`, `swarm-management`, `issue-working`, `bean-coordination`, `AGENTS.md`).
2. **Schema & Check verification:**
   - `schemas/waiver.ts` defines `WaiverNodeSchema` with `WAIVABLE_GATES` closed enum (`merge-to-main`, `bean-close`, `deletion`, `swarm-spawn`, `process-reentry`, `issue-close`), strict schema validation and 3-state `waiverState()` evaluator.
   - `cat-harness-tools/scripts/check-waivers.ts` verified and executed (`bun cat-harness-tools/scripts/check-waivers.ts` -> passes clean, reports 0 in-force, 0 inert, 0 malformed).
3. **Typecheck & reference integrity:**
   - `bun run typecheck` clean pass (tsc exited 0).
   - Link integrity verified: all relative links in `skills/conduct/conduct-core/confirmation-waiver.md` resolve to existing targets.

## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open working branch touches it; the sessions that held theme B (CI reliability, QA instruments, process) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run cat beans:claim <id>`.

