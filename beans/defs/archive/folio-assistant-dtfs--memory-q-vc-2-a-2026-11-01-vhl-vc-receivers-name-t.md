---
# folio-assistant-dtfs
$schema: bean/1.0.0
title: 'Memory: Q-VC-2 A (2026-11-01): VHL VC receivers name trust-domain policies in VC termsOfUse; each GDHCN trust domain has a terms-of-use ValueSet; Admin Frame...'
status: completed
type: task
priority: low
created_at: 2026-11-01T08:22:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `gdhcn-trust-domain-terms-of-use.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-VC-2 A (2026-11-01): VHL VC receivers name trust-domain policies in VC termsOfUse; each GDHCN trust domain has a terms-of-use ValueSet; Admin Framework is the L1 legal glossary source


On 2026-11-01 at 08:19Z the user chose Q-VC-2 A in the thread "Explain the VC gap". The VHL Verifiable Credential option has no agreement field, so a receiver's self-issued VC lists the policies it acts under in VC 2.0 `termsOfUse`, one entry per trust-domain policy. The Sharer matches each entry to `Consent.policyRule`, then runs the default DMN rule from phw#20.

User rules from that message:
- Each GDHCN Trust Domain has a ValueSet of its terms of use, and that ValueSet is part of the formal Trust Domain definition. A Trust Domain logical model is needed; none exists yet.
- The GDHCN Administrative and Operational Framework is the legal source. Ingest it as L1 into the KG and use it as the source for the primary glossary. The IG can add terms but does not override it. The file is at smart-trust input/images/GDHCN_Administrative_and_Operational_Framework.pdf/.docx, version 1.2 (9 Oct 2026). It has 21 definitions in Section II.
- For IPS-PILGRIMAGE, the Hajj consents (the IPS.HAJJ.CONSENT ValueSet) are the domain's terms of use.

Fact: Framework 1.2 has only Annex I (DDCC). IPS-PILGRIMAGE, PH4H and ICVP have no annex. Q-VC-3 A (08:23Z): the IPS-PILGRIMAGE Trust Domain is drafted from the pilgrimage IG and marked "no annex yet".

Plan doc: https://claude.ai/artifact/GayzeK1S6C6xem8JWpMpRS. It covers six steps across smart-trust, smart-ips-pilgrimage and smart-trust-phw. Related: folio-assistant-ycp5.

Model rules (user, 08:27Z–08:28Z): useCase is modelled by DAK components. useCase, technicalSpecification and policyStandard are each 0..*, but an empty one is a QA error (invariants gdhcn-td-1..3, severity error). It is also a QA error if the terms-of-use ValueSet is not tied to a BPMN process (gdhcn-td-4). legalSource and letterOfApplication were dropped. A VC termsOfUse entry is compact, {type, id}; VC 2.0 requires `type`, so a bare IRI is not allowed.

Q-VC-5 A: the L1 licence is CC-BY-SA-3.0-IGO. Q-VC-6 A: keep the inferred L1 sections and note the list-item defect.

All merged 2026-11-01 by 09:55Z: smart-trust #102 (L1 Framework), #104 (GDHCN glossary + translations/), #106 (TrustDomain/TrustDomainPolicy LMs); smart-ips-pilgrimage #5 (+ #7 harness checks); smart-trust-phw #22. Next: Q-BPMN-5 (start build-out P1/P2). The draft GDHCN note is at /mnt/project-files/vc-terms-of-use-2026-11-01/.

BPMN reuse and onboarding BPMN: see folio-assistant-oepg.
