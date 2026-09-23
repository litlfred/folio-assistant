---
# folio-assistant-t3ad
title: Document the 70 gateways that gateway-documented fails on
status: completed
type: task
priority: normal
created_at: 2026-09-23T16:26:05Z
updated_at: 2026-09-23T16:57:25Z
parent: folio-assistant-1swy
---

Reported by `gateway-documented` (#1051, bean 6hq4), measured on main 2026-09-23: 70 exclusive/inclusive gateways across the processes/ corpus have no <documentation> saying what question they decide or what answers it. Count from the kg-qa sidecars (test/results/kg-qa/**), not from this text: re-run `bun run kg:audit` and count before starting.

Issue #1044 (closed): the criterion landed and this follow-up was left open.

## Done when
- [x] every gateway-documented finding is fixed — 69 (one fewer than 70 because #1116 removed Gateway_Drift in human-translation-workflow), each written from the gateway's own branches and their targets; none scoped (documentation written from what the diagram's branches and the code actually do, not guessed), or scoped with a stated reason
- [x] kg:audit regenerated: 0 gateway-documented failures; gates green but for the known local-only .claude/worktrees failures

## Summary of Changes

PR for branch claude/magical-archimedes-4qkfxp-t3ad: a <documentation> element on 69 gateways across 44 diagrams. Each says what answers the question (usually the step before it) and where each branch goes, taken from the diagram; where the source said more (a skill, a lane note) it is cited. Generated outputs regenerated.
