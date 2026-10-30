---
# folio-assistant-nr5p
$schema: bean/1.0.0
title: 'Declare smart-trust-phw as a harness instance and mount it (PCF1)'
status: todo
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T15:46:00Z
parent: folio-assistant-negd
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: litlfred/smart-trust-phw, folio-assistant. Depends on: —.

## Done when
- `mount:remote:check` reports phw `mounted`; its artefact index builds.
