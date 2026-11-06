---
# folio-assistant-llxa
$schema: bean/1.0.0
title: 'cat-harness CRDM skills: cite PHII and PATH CRDM as the method they adapt'
status: completed
type: task
priority: normal
created_at: 2026-10-31T01:56:00Z
updated_at: 2026-11-06T05:30:30Z
parent: folio-assistant-dthl
blocked_by:
  - folio-assistant-max2
---

Owner, 2026-10-31 01:53Z: "cat-harness CRDM should be referencing PHII and PATH CRDM so its same, no?" Card option A at 01:54Z: the citation fix is a bean, not a PR yet.

cat-harness `skills/sdlc/crdm/` (phases 1-6 and `processes/process/crdm-*.bpmn`) uses the CRDM name and phase idea but cites no source. Today "CRDM" names two things: PHII's methodology (cited by the PHC handbook) and this platform's feature workflow.

- [x] once max2 lands, cite the PHII and PATH library entries from `crdm-requirements-workflow.md` (and the methodology node, if one is added)
- [x] state the relation as "adapts": say which phases follow PHII CRDM and which are the platform's own (agent, beans, code impact analysis, merge sign-off)
- [x] one CRDM glossary concept (PHII's); the cat-harness skill and dth-phc both link to it
- [x] align priority scales: PHC High/Medium/Low = Must/Should/Nice-to-have; the separate SHALL/SHOULD/MAY field cites the ingested rfc2119 / rfc8174 entries

Needs the owner's OK before any PR. Thread: "Plan primary health care handbook KG".

_2026-11-05T13:34:18Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-05T14:44:00Z_ — Added `methodologies/crdm.md` (`$schema: folio-methodology/v1`, `name: crdm`) citing `library/phii-2023-crdm`, `library/phii-2021-defining-and-validating-requirements-guide`, `library/path-2012-common-requirements-mhis-crdm`, `library/rfc2119-key-words-requirement-levels`, and `library/rfc8174-uppercase-vs-lowercase-2119-key-words`; added the canonical SKOS concept `https://litlfred.github.io/cat-harness/v0/ns/glossary/platform/collaborative-requirements-development-methodology` to `docs/assets/glossary/cat-harness--platform.skos.jsonld`; updated `sdlc/skills/crdm/crdm-requirements-workflow.md`, `sdlc/skills/crdm/crdm-requirements-template.md`, `skills/process/process-core/methodology-adoption.md`, and `docs/source/process-crdm-methodology/what-is-crdm.md`; updated `litlfred/dth-phc#1` cross-references; and opened PR [`litlfred/cat-harness#1062`](https://github.com/litlfred/cat-harness/pull/1062) (awaiting owner review/merge).

_2026-11-06T05:30:30Z_ — Completed on `origin/main` evidence: `litlfred/cat-harness#1062` merged at `2292a377789c7c1c3cb362af9d4c6c3f979ecc4c` (`2026-11-05T16:50:36Z`).
