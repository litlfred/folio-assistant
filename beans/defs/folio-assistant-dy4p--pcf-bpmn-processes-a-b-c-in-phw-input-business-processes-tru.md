---
# folio-assistant-dy4p
$schema: bean/1.0.0
title: 'PCF BPMN processes A/B/C in phw input/business-processes, trust-anchor neutral (PCF4)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T16:26:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-sl5v
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: smart-trust-phw. Depends on: PCF2.

## Done when
- All three render in the IG and each task names its PCF/VHL transaction.

## Implementation & Verification (2026-10-30)

- **PR:** [`litlfred/smart-trust-phw#5`](https://github.com/litlfred/smart-trust-phw/pull/5) (branch `feat/pcf2-pcf4-library-and-bpmn`, stacked on `litlfred/smart-trust-phw#4` / `feat/pcf1-pcf3-harness-and-ihe-deps`, commit `b5b9aed`).
- **Delivered:**
  - `input/business-processes/PHW.A.bpmn` (`PHW.A` — *A. Record and Manage Patient Privacy Consent*): 3 lanes (`VHL Holder`, `PCF Consent Recorder`, `PCF Consent Registry`), 9 flow nodes (`PHW.A.Start`, `PHW.A.1`..`PHW.A.6`, `PHW.A.Gateway1`, `PHW.A.End`), 9 sequence flows, full `bpmndi:BPMNDiagram` layout, naming `[ITI-108]` Access Consent (`Post`, `Put`, `Delete`).
  - `input/business-processes/PHW.B.bpmn` (`PHW.B` — *B. Issue Consent-Backed Verifiable Health Link*): 4 lanes (`VHL Holder`, `VHL Sharer`, `PCF Consent Registry`, `Trust Anchor`), 9 flow nodes (`PHW.B.Start`, `PHW.B.1`..`PHW.B.7`, `PHW.B.End`), 8 sequence flows, full `bpmndi:BPMNDiagram` layout, naming `[ITI-YY1]` Submit PKI Material with DID, `[ITI-108]` Access Consent (`Search` / `Post`), and `[ITI-YY3]` Generate VHL (`$generate-vhl`).
  - `input/business-processes/PHW.C.bpmn` (`PHW.C` — *C. Present and Redeem Verifiable Health Link with PCF Consent Enforcement*): 5 lanes (`VHL Holder`, `VHL Receiver`, `Trust Anchor`, `VHL Sharer`, `PCF Consent Registry`), 13 flow nodes (`PHW.C.Start`, `PHW.C.1`..`PHW.C.10`, `PHW.C.Gateway1`, `PHW.C.End`), 13 sequence flows, full `bpmndi:BPMNDiagram` layout, naming `[ITI-YY4]` Provide VHL, `[ITI-YY2]` Retrieve Trust List with DID, `[ITI-YY5]` Retrieve Manifest, `[ITI-108]` Access Consent: Search, ODRL `consentToOdrl()` + three-valued `decide()` (`permit` | `deny` | `unknown`), and W3C PROV-O `prov:Activity` logging (`Consent.id` + `Consent.meta.versionId`).
  - Rendered SVGs in `input/images/PHW.{A,B,C}.svg` and `input/business-processes/PHW.{A,B,C}.svg`, and updated `input/pagecontent/business-processes.md` with process overview table, embedded SVG figures, and activity-to-transaction tables.
  - All three processes are **trust-anchor neutral** (WHO GDHCN explicitly documented as one possible Trust Anchor among others) and make **no IHE IUA claim**.
- **Verification:**
  - `bun run cat-harness-tools/scripts/bpmn-render.ts input/business-processes -o input/images` → `3 file(s), 3 diagram(s), 0 failure(s)` (`exit 0`).
  - `processesFrom()` (`smart-base/scripts/dak-swimlanes.ts`) and `markdownTable()` (`smart-base/scripts/l1-scenario-vocabulary.ts`) parse all 3 processes (`PHW.A`, `PHW.B`, `PHW.C`) and their figures (`PHW.A.svg`, `PHW.B.svg`, `PHW.C.svg`) from `input/pagecontent/business-processes.md`.
  - `bun run smart-base/scripts/dak-pdf.ts . -o /tmp/fix-pcf24/test-phw-dak.html --html-only` → 54 sections rendered with 0 BPMN omissions (`exit 0`).
