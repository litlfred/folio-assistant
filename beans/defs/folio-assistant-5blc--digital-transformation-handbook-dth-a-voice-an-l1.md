---
# folio-assistant-5blc
title: 'Digital Transformation Handbook (DTH): a voice, an L1 document subtype on Reference Architecture + DIIG concepts, and a source of methodologies / processes / glossary'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T18:16:53Z
updated_at: 2026-10-03T10:52:39Z
parent: folio-assistant-qvxh
---

Owner, 2026-10-01 (during stage D, #1767), attaching 9789240116191-eng.pdf (DTH for health product catalogue): 'use for one voice for "Digital Transformation Handbook" a specific type of a L1 document that uses the Reference Architecture and DIIG concepts', then 'also as source of methodologies / processes / glossary'. Same session: commit 27078551 on main uploaded four WHO DTHs to uploads/ (primary health care 9789240093362 — already in smart-base/library; supply chain architecture 9789240101197; health product catalogue 9789240116191; the DRAFT Reference Architecture for DPI-H).

Queued, not started: stage D (#1795) was in flight; this belongs to D5 (L1 kind, bean qvxh) and the library half is bean tyo0.

## Done when
- [ ] the three new handbooks ingested into smart-base/library via the ingest pipeline (bean tyo0), licence read from each
- [ ] a DTH voice in smart-base (voices graph), derived from the handbooks' own register, as the WHO digital-health voice was from its corpus
- [ ] DTH declared as a subtype of the L1 document kind (qvxh), whose required structure names the Reference Architecture and DIIG concepts it uses — read from the handbooks, not assumed
- [ ] methodologies, processes (BPMN) and glossary terms the handbooks define, each extracted with a citation to its handbook section; owner reviews the list before they are authored
- [ ] no empirical claim from a handbook enters a formal statement

*2026-10-01* — Owner, two placement rules for the DTH kind: (1) "DTH should fit in somewhere in DIIG process ideally and utlized the Ref Arch" — so dth.json is placed as a step/output of the DIIG process (Digital Implementation Investment Guide, smart-base/library/9789240010567-eng) and draws its architecture sections from the Reference Architecture for DPI-H; (2) "some DTHs written befroe draft Ref Arch, but should really have been refernces" — the Reference Architecture is the normative reference a DTH cites, and the earlier DTHs (primary health care 9789240093362, supply chain 9789240101197, product catalogue 9789240116191) are read as instances that should have referenced it. The Ref Arch draft is ingested by bean tyo0 (PR #1826) as who-dpi-h-reference-architecture-draft-v1, licence CC BY-NC-SA 3.0 IGO on the owner's statement. Propose the design to the owner before authoring dth.json.

_2026-10-03T10:52:39Z_ — Claimed by claude/dth-voice-alternatives — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
