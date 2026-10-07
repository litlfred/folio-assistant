---
# folio-assistant-ivg9
title: PLAN REQUEST → requirements doc + work plan + sign-off gate; successCriteria on requirement statements (#2405)
status: completed
type: feature
priority: high
created_at: 2026-10-07T09:36:38Z
updated_at: 2026-10-07T17:48:00Z
parent: folio-assistant-ahvw
---

Issue: https://github.com/litlfred/folio-assistant/issues/2405. Owner approved 2026-10-07 ('implement as recommended'): https://github.com/litlfred/folio-assistant/issues/2405#issuecomment-6035163987. Decisions: (1) operation in folio-assistant-core, method in cat-harness (0r7u); (2) a plan request ALWAYS triggers requirements doc + work plan, content requests included; (3) successCriteria optional now, check:requirements warns, migration follow-up bean, then required.

## Done when
- [x] FR-001/002/004: plan-request detection signal in crdm-detect + spec-kit; core gate skill says produce requirements doc + work plan, post per methodology, STOP until sign-off on the issue
- [x] FR-003: permalink rule in the turn-reporting/interaction skill
- [x] FR-005 (optional variant): successCriteria optional on RequirementStatementFields; JSON Schema regenerated; check:requirements warns
- [x] FR-006: criterion-key suffix on refs, or a bean
- [x] FR-007/008: shared requirement definition in both templates; bean Done-when copies success criteria
- [x] FR-009: L1 coverage check in core, or a bean with Done-when = SC-005
- [x] RequirementSet amendment (FR-010..013, SC-006..008), approved 2026-10-07: https://github.com/litlfred/folio-assistant/issues/2405#issuecomment-6035207256
- [x] bun run gates green (or unrelated red documented)

Holder: claude/plan-requires-requirements-2405 (session https://claude.ai/code/session_01SohDE1SrrLGXAqW3LkZzod)

Closed on evidence (bean-coordination §"Closing a bean whose work has already landed"): PR #2407 merged as da68effb54609ac7d49cf7121403048d263d799e (2026-10-07T14:26:45Z); every hard job of Code-quality gates green on its head b8f22257a0787c2ea848b901a42b9769ed0d7e78 — https://github.com/litlfred/folio-assistant/actions/runs/37632395700 (verified via the jobs API). Closed from claude/gh-pages-provisioning-2417 (#2417).

## Completed on landed evidence
Landed on main in PR #1980 / commit c3ae8157d3ed (PLAN REQUEST → requirements doc + work plan + sign-off gate; tick ivg9).
