---
# folio-assistant-ff09
title: 'DOGFOOD test plan #1: certify the crdm-detect skill against a plan built from its existing 27-case run'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-11T07:00:59Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-3o5b
---

Arc `3fva`, proposal §3.3 and §4 item 5.6. Blocked on the TEST PROCESS bean.

The skill it certifies is the one #203 asked for (CRDM: recognise a feature
request and run a requirements process). #203 stays open until the owner
authorises closing it; this bean is where the work plan reaches it.

`test/results/crdm-detect-eval.test-run.json` already holds 27 cases with precision and recall, plus a second-annotator corpus in `scripts/eval/`. Turn it into `test-plan/v1`, execute it through `test-plan-execution.bpmn`, and take a certification decision. The second plan is an MCP tool (`workflow_complete` refuses a step that is not enabled). The third is a FHIR IG, which needs CWA 16408 uploaded (`y4uj`).

## Done when
- [ ] a signed certification exists for crdm-detect at a stated version, stored per D5
- [ ] the report renders, and its badge links to the run


## Owner ruling 2026-10-01
A plan needs at least one `req:` requirement. **Write a crdm-detect requirement first** (what precision/recall it must reach, and on which corpus), then build the plan against it.

## Owner ruling (2026-10-11 ~06:55 UTC, drain ml9h)

**Certified.** Asked in session_01JkK6uP3iU2etyMbrw7v3cu with lane B's evidence (run r-3554a15543fc-00051fde91fd: 27/27 executed, 25 pass, 2 warn, 0 fail; P=R=F1=0.9545; untainted checker agreed on 6 sampled). The owner's pick stands as the human signature; lane B files it (fileSignedCertification, human route).
