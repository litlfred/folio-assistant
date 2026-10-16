---
# folio-assistant-ff09
$schema: bean/1.0.0
title: 'DOGFOOD test plan #1: certify the crdm-detect skill against a plan built from its existing 27-case run'
status: completed
type: task
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-16T06:30:00Z
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

## Summary of Changes

Built to the owner's option 4 (no threshold).
- **Requirement and plan:** `req:crdm-detect-evaluation`, the plan `test/plans/crdm-detect-evaluation.test-plan.json` and the `test-plans` directory (cat-harness#145). The system under test is the `crdm-detect-signals` actor (cat-harness#146).
- **Execution:** run through test-plan-execution.bpmn by scripts/run-crdm-detect-plan.ts (cat-harness-tools#122).
  - 27 cases: 25 pass, 2 warn, 0 fail.
  - P = R = F1 = 0.9545, recorded and not graded.
  - The untainted checker agrees on its sample.
  - All four test-plan audit criteria pass.
- **Done-when 1:** the signed certification is filed with fileSignedCertification (cat-harness#151). Signer: the owner, by the human route. The decision was relayed from lane A's session, and the record says so.
- **Done-when 2:** the report renders (test-report.md) and its badge links to the run (scripts/render-test-report.ts, #122).
- **Not done:** the signed report is not stored on qa-reports. cat-harness has no qa-reports branch, and bean 3hk4 refuses a one-run entry. So Task_StoreSigned stays open in beans/workflows/, and certification-resolves (zaui) reads this certification as unknown until a full cat-harness qa publish exists.

_2026-10-16T06:30:00Z_ — Completed here to match the cat-harness and cat-harness-tools stores (Owner ruling 2026-10-16, item 6); the Summary of Changes above is copied from them. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.
