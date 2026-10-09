---
# folio-assistant-4kq7
title: 'Adopt github/spec-kit: spec-before-code gate, one spec template, specs as issue comments, change-size splitting'
status: completed
type: feature
priority: normal
created_at: 2026-09-21T14:46:51Z
updated_at: 2026-10-09T21:40:00Z
parent: folio-assistant-ahvw
---

Issue: https://github.com/litlfred/folio-assistant/issues/730

Owner request 2026-09-21: align folio-assistant with github/spec-kit; no development before a spec exists; all specs in one template; specs posted as GitHub issue comments; oversized changes split into multiple issues so human adjudication on the PR stays feasible; follow industry standards for the split.

## Blocking decision — RESOLVED

Owner rulings:
- **FR-001 (settled 2026-09-21)**: **Option A** — spec-kit as a peer methodology beside CRDM (CRDM stays for stakeholder-facing WHO/IG work; spec-kit governs feature development requests by tool developers, content-agnostic). Child 1 landed in PR #731 (commit `b505da342d77`).
- **FR-009 (settled 2026-10-07)**: Report-only warning initially at ~400 lines of non-generated/non-lockfile code (prose/KG weighted lower at 0.25x), transitioning to a blocking CI gate once calibrated against PR history. Discharges Child 4 (issue #754).
- **FR-013 (settled 2026-10-07)**: Specs live in GitHub issue comments; upon completion, accepted requirements graduate directly into governing skills (as `req:*` statements) and automated tests, keeping SDLC churn off the knowledge graph. Discharges Child 2 (issue #752).

## Done when
- [x] Owner picks A, B or C on issue #730 (Option A selected)
- [x] A spec for this work exists in the agreed template and is posted as a comment on #730 (dogfoods REQ-1/2/3)
- [x] Spec template is a declared KG artefact with a check that fails a spec missing a mandatory section (Child 2 / issue #752)
- [x] Spec-before-code gate is declared where an agent reads it AND is detectable - breach is a finding, not silence (Child 3 / issue #753)
- [x] Change-size rule names its threshold AND its basis, and distinguishes prose/KG changes from code (Child 4 / issue #754)
- [x] Splitting uses GitHub sub-issues: parent carries the spec, each child one adjudicable increment (Child 5 / issue #755)
- [x] methodology-adoption.md 'choosing which applies' ladder updated in the same change (landed in PR #731)

## Completion Evidence (2026-10-09)

Completed and pushed in commit `4c3eb4aff6dfdd2a3c9969044f793dfa3fbbb08c` on branch `claude/4kq7-spec-before-code`:
- **Child 3 / issue #753**: Implemented `checkSpecBeforeCode` and `--spec-before-code` in `scripts/check-spec.ts`. Scans feature beans (`type: feature`) and PRs, verifies the referenced issue carries a valid specification comment adhering to `spec-template.md`. Reports findings (exit 1), never silence, when a spec is absent or invalid; reports unknown (exit 2) if unreachable. Declared in `skills/sdlc/spec-kit/spec-kit.md`.
- **Child 5 / issue #755**: Documented GitHub sub-issues splitting rules in `skills/sdlc/spec-kit/change-size.md` and `skills/sdlc/spec-kit/spec-kit.md`: oversized changes (>400 effective lines) or multi-increment features must split into GitHub sub-issues under the parent issue carrying the spec, where each sub-issue delivers one standalone reviewable/revertible increment.
- **Verification**: 22 tests in `scripts/tests/check-spec.test.ts` passed (67 assertions); 10 tests in `scripts/tests/check-change-size.test.ts` passed (46 assertions); `typecheck` clean.


## Spec

Posted 2026-09-21 as a comment on the issue, in spec-kit's template:
https://github.com/litlfred/folio-assistant/issues/730#issuecomment-5762493076

13 functional requirements (FR-001..FR-013), 8 success criteria, 3 prioritised
journeys. All three `[NEEDS CLARIFICATION]` markers are now settled by the owner:

- FR-001 — Option A (spec-kit peer methodology beside CRDM).
- FR-009 — Report-only ~400 lines non-generated code advisory limit, prose/KG lower weight, transitioning to blocking gate after calibration.
- FR-013 — Spec in issue comment; accepted requirements graduate into governing skill `req:*` statements and automated tests.

## Settled without needing the owner

FR-013: where a spec INSTANCE lives. `where-a-proposal-goes` already answers it
— the owner's standing rule of 2026-09-19, "do not pollute the KG with SDLC
churn", sends a design argument to the issue and explicitly off the knowledge
graph. So the owner's spec-as-issue-comment requirement and the existing rule
agree, and spec-kit's own `specs/NNN-feature/spec.md` layout does NOT survive
contact with this repository. A `specs/` directory was drafted in this session
and withdrawn before anything was committed, which is the first concrete
instance of "adopt it whole" colliding with a rule already paid for here.



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open working branch touches it; the sessions that held theme B (CI reliability, QA instruments, process) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run cat beans:claim <id>`.
