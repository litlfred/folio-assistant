---
# folio-assistant-sl5v
$schema: bean/1.0.0
title: 'Library entries for IHE PCF 1.1.0 and VHL 1.0.0-comment (hashed, Dublin Core, CC BY 4.0) (PCF2)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T15:46:00Z
updated_at: 2026-10-30T16:26:00Z
parent: folio-assistant-negd
blocked_by:
    - folio-assistant-nr5p
---

IHE PCF adoption, owner card 2026-10-30 15:44Z "A: Approve, take all advice": PCF 1.1.0 (Trial Implementation) and FHIR R4 Consent (Trial Use) approved; no IUA claim; home smart-trust-phw; IHE source via library snapshots + pinned FHIR package, profiles referenced by URL only; Basic consent first. Plan: `/mnt/project-files/dsa-analysis/ihe-pcf-vhl-options.md` §5. Issue: litlfred/folio-assistant#2702. GDHCN is only one possible trust anchor.

Repo: smart-trust-phw `library/`. Depends on: PCF1.

## Done when
- `check:materialized-fixity` green; one changed byte fails it.
