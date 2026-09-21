---
# folio-assistant-4kq7
title: 'Adopt github/spec-kit: spec-before-code gate, one spec template, specs as issue comments, change-size splitting'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-21T14:46:51Z
updated_at: 2026-09-21T17:15:47Z
parent: folio-assistant-ahvw
---

Issue: https://github.com/litlfred/folio-assistant/issues/730

Owner request 2026-09-21: align folio-assistant with github/spec-kit; no development before a spec exists; all specs in one template; specs posted as GitHub issue comments; oversized changes split into multiple issues so human adjudication on the PR stays feasible; follow industry standards for the split.

## Blocking decision
methodology-adoption forbids blending methodologies. CRDM and spec-kit both answer 'request -> agreed requirements'. Three options tabled on #730: (A) spec-kit as a peer methodology beside CRDM (recommended, reversible), (B) spec-kit replaces CRDM, (C) spec-kit template only, drop the 'aligned' claim. Awaiting owner's call.

## Done when
- [ ] Owner picks A, B or C on issue #730
- [ ] A spec for this work exists in the agreed template and is posted as a comment on #730 (dogfoods REQ-1/2/3)
- [ ] Spec template is a declared KG artefact with a check that fails a spec missing a mandatory section
- [ ] Spec-before-code gate is declared where an agent reads it AND is detectable - breach is a finding, not silence (vlhk failure mode)
- [ ] Change-size rule names its threshold AND its basis, and distinguishes prose/KG changes from code
- [ ] Splitting uses GitHub sub-issues: parent carries the spec, each child one adjudicable increment
- [ ] methodology-adoption.md 'choosing which applies' ladder updated in the same change

## Spec

Posted 2026-09-21 as a comment on the issue, in spec-kit's template:
https://github.com/litlfred/folio-assistant/issues/730#issuecomment-5762493076

13 functional requirements (FR-001..FR-013), 8 success criteria, 3 prioritised
journeys. Three `[NEEDS CLARIFICATION]` markers remain open and are NOT the
agent's to close (req:agent-workflow -> judgement-stays-human, SHALL):

- FR-001 — which of A / B / C. Blocks everything else.
- FR-009 — the size threshold's value, and whether the gate blocks or reports.
- FR-013 — what durable trace a decided spec leaves.

## Settled without needing the owner

FR-013: where a spec INSTANCE lives. `where-a-proposal-goes` already answers it
— the owner's standing rule of 2026-09-19, "do not pollute the KG with SDLC
churn", sends a design argument to the issue and explicitly off the knowledge
graph. So the owner's spec-as-issue-comment requirement and the existing rule
agree, and spec-kit's own `specs/NNN-feature/spec.md` layout does NOT survive
contact with this repository. A `specs/` directory was drafted in this session
and withdrawn before anything was committed, which is the first concrete
instance of "adopt it whole" colliding with a rule already paid for here.
