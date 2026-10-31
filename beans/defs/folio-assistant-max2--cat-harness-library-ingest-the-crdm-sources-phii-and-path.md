---
# folio-assistant-max2
$schema: bean/1.0.0
title: 'cat-harness library: ingest the CRDM sources (PHII 2023 web page, PATH 2012 common requirements)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-31T01:56:00Z
updated_at: 2026-10-31T02:02:00Z
---

Owner, 2026-10-31 01:54Z (card "What should I do with the SDLC alignment findings?", option A): add the SDLC alignment to the PHC workplan and fetch the CRDM sources. Owner 01:53Z: "cat-harness CRDM should be referencing PHII and PATH CRDM".

The PHC handbook (who-iris 9789240093362-eng, sec-006) says its method "leverages the Collaborative Requirements Development Methodology (CRDM)" and cites:

- ref 20: Collaborative Requirements Development Methodology (CRDM). Public Health Informatics Institute (PHII) [website]; 2023. https://phii.org/crdm/
- ref 50: Taylor C, Luchitsky A, Lubinski D, Peloso L, Wilson K. Common requirements for maternal health information systems: produced with the collaborative requirements development methodology. Seattle (WA): PATH; 2012. https://www.path.org/resources/common-requirements-for-maternal-health-information-systems-produced-with-the-collaborative-requirements-development-methodology

Neither is in any library (checked cat-harness, smart-base, who-iris, smart-ra at their tips, 2026-10-31). Sandboxes cannot reach phii.org or path.org (HTTP 000), so agy fetches them.

- [ ] agy: fetch the PHII CRDM page(s) and any PHII CRDM PDF it links; fetch the PATH 2012 PDF
- [ ] ingest each as a cat-harness library entry (library-ingestion skill), with sha256 and provenance
- [ ] add the two entries to the PHC workplan cross-references (litlfred/dth-phc#1)

Blocks folio-assistant-llxa. Thread: "Plan primary health care handbook KG". Working note: /mnt/project-files/dth-l2-ingest-2026-10-31/phc-sdlc-alignment.md

_2026-10-31T02:02:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
