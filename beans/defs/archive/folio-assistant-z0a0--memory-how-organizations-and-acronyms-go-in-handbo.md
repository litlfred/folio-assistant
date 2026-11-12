---
# folio-assistant-z0a0
$schema: bean/1.0.0
title: 'Memory: How organizations and acronyms go in handbook glossaries (option B, SKOS + W3C ORG, 2026-10-31) and the PRs for it'
status: completed
type: task
priority: low
created_at: 2026-10-31T13:38:41Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `glossary-organizations-acronyms.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How organizations and acronyms go in handbook glossaries (option B, SKOS + W3C ORG, 2026-10-31) and the PRs for it


Owner chose option B on 2026-10-31: SKOS + W3C ORG. A term keeps its labels, with the acronym as `notation`. An optional `focus` (foaf:focus) points to an org:Organization that holds the ORG type, homepage, subOrganizationOf and sameAs. Schema: folio-glossary/v1 in folio-assistant-core (issue #411, PR #412).

Where things live:
- Shared organizations (WHO, HL7, ISO, GS1, UNICEF, USAID, UMC, PAHO and others) are in smart-ra `glossary/organizations.glossary.json` (smart-ra#198, merged 2026-10-31 as 7aaec92). Handbooks list them under `members` and never copy them.
- Organizations only one handbook names stay in that handbook's glossary.
- FHIR is held in smart-ra, and DHSC and WMS in dth-sc. Don't redefine them.

Acronyms:
- The QA criterion `acronym-in-glossary` warns and never fails. The checker is in core and the registry entry in cat-harness-tools (#1138 merged; #1151 fixed a reference-direction gate it exposed).
- `glossary:acronyms` builds the folio-wide report.
- The owner wants every missing acronym added. Generic IT acronyms (VPN, LAN, SQL) were left out of dth-pc (dth-pc#5, merged into claude/dth-pc-scaffold 2026-10-31; dth-pc pins dpi-h-ra 7aaec92). Run the report with `bun run folio-assistant-core/scripts/glossary-acronyms.ts --folio folio`.

dth-pc "FDA" means the Rwanda Food and Drugs Authority, not the US FDA. It is logged as row 3 of the DTH-PC Contributor Log for an Editor to resolve.

Related: folio-assistant-gdav, folio-assistant-lwuw.
