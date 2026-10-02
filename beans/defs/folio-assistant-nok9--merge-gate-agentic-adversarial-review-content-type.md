---
# folio-assistant-nok9
title: 'MERGE GATE: agentic adversarial review + content-type compile gates, and per-content-block QA backfill'
status: todo
type: epic
priority: normal
created_at: 2026-10-02T16:29:09Z
updated_at: 2026-10-02T16:29:09Z
---

Owner, 2026-10-02 (bean for later): update the Merge Manager skills, process and tools so that a merge is GATED on:

- a full agentic adversarial software code review of any change made by one or more agents;
- no blocking RED FLAG from any agentic review;
- (math content block) every changed Lean file compiles;
- (FHIR IG) SUSHI and the IG AST compile;
- JSON(-LD) plus schema for the KG renders (downstream renders such as just-the-docs are NOT blockers);
- etc.

Also: research best practice, document the methodology, list open-access literature to upload to the library, and run the same QA reviews **per content block** (tools, schemas, guidance, processes) so the existing corpus can be backfilled.

Design and reading list: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` and `cat-harness/docs/proposals/merge-gate-reading-list.md`. **Nothing is implemented. This bean files the work.**

## Why standalone, not under 7x5n

`7x5n` is the repo-separation arc. Its S2 child (merge treadmill) is about making `merge:main` and regen land, not about what a merge must prove. This is a change to what the merge decides, so it stays standalone. Related: `1xhc` (CI reliability: a gate that does not fire looks like a pass), `d33q` (merge-base sub-process), `3pqn` (PRs with no checks on their head).

## Prior adversarial work: link, do not duplicate

- `v048`: ROAST of the catalogue-import design (the roast as a recorded deliverable)
- `osyc`: ROAST of a session's navbar work and its claims (archived)
- `vkm0`: GENERALISE THE FIX, THEN ATTACK IT (archived; skill `generalise-the-fix`)
- `w4tq`: adversarial pass over a session's own numeric claims (archived)
- skill `devils-advocate-watcher`: per-block adversarial reading for content

These are all **ad hoc and session-scoped**. None blocks a merge, and none writes a verdict that a merge could read. This epic makes the adversarial pass a recorded, gate-readable artefact.

## Evidence that the merge steward needs this (measured 2026-10-02)

1. `regen` (`regen-after-merge.ts`) has no writer pair for `check:l1-complete`, nor for `smart-base:smart-kg-l1`. Both are CI gates, so a merge train can regenerate "everything" and still go red.
2. `merge-base` resolves a submodule gitlink to main's side even when the other pin fast-forwards it, which silently reverts a pin bump.
3. GitHub does not run `pull_request` CI while a PR conflicts, so some PRs reached a merge train with no CI on their head.
4. The `merge-main` bot adds `needs-merge-human` but never removes it after a later success.
5. `.github/workflows/agent-review.yml` exists but is dispatch-only and runs after merge. It truncates the diff at 50,000 characters, files issues, and still derives a QOU PDF URL. It gates nothing.

## Done when
- [ ] child (a): an adversarial agentic review is a required check for any PR with agent-authored commits, and it writes a verdict sidecar
- [ ] child (b): content-type compile gates (Lean, SUSHI/IG AST, JSON-LD + schema) are required checks scoped by changed paths; downstream site renders stay advisory
- [ ] child (c): a RED FLAG taxonomy, schema and override path exist, and a blocking flag holds the merge until it is resolved or a person overrides it on the record
- [ ] child (d): per-content-block QA for tools, schemas, skills/guidance and processes is defined, and the backfill has been run at least once with its coverage reported by `audit:coverage`
- [ ] child (e): the four merge-steward gaps above are fixed or filed with owners
- [ ] the merge process (`code-change-review.bpmn` → `merge-base.bpmn`, plus the `prepare-merge` skill and command) names the new gates, and how they compose with merge trains is documented
- [ ] the owner has answered the open questions in the proposal (§9)
- [ ] the reading list's items are uploaded to the library, or the ones not uploaded are recorded with the reason
