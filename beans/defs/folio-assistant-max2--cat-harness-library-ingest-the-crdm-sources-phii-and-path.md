---
# folio-assistant-max2
$schema: bean/1.0.0
title: 'cat-harness library: ingest the CRDM sources (PHII 2023 web page, PATH 2012 common requirements)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-31T01:56:00Z
updated_at: 2026-10-31T06:42:00Z
parent: folio-assistant-dthl
---

Owner, 2026-10-31 01:54Z (card "What should I do with the SDLC alignment findings?", option A): add the SDLC alignment to the PHC workplan and fetch the CRDM sources. Owner 01:53Z: "cat-harness CRDM should be referencing PHII and PATH CRDM".

The PHC handbook (who-iris 9789240093362-eng, sec-006) says its method "leverages the Collaborative Requirements Development Methodology (CRDM)" and cites:

- ref 20: Collaborative Requirements Development Methodology (CRDM). Public Health Informatics Institute (PHII) [website]; 2023. https://phii.org/crdm/
- ref 50: Taylor C, Luchitsky A, Lubinski D, Peloso L, Wilson K. Common requirements for maternal health information systems: produced with the collaborative requirements development methodology. Seattle (WA): PATH; 2012. https://www.path.org/resources/common-requirements-for-maternal-health-information-systems-produced-with-the-collaborative-requirements-development-methodology

Neither is in any library (checked cat-harness, smart-base, who-iris, smart-ra at their tips, 2026-10-31). Sandboxes cannot reach phii.org or path.org (HTTP 000), so agy fetches them.

- [x] agy: fetch the PHII CRDM page(s) and any PHII CRDM PDF it links; fetch the PATH 2012 PDF
- [ ] ingest each as a cat-harness library entry (library-ingestion skill), with sha256 and provenance
- [ ] add the two entries to the PHC workplan cross-references (litlfred/dth-phc#1)

Blocks folio-assistant-llxa. Thread: "Plan primary health care handbook KG". Working note: /mnt/project-files/dth-l2-ingest-2026-10-31/phc-sdlc-alignment.md

_2026-10-31T02:02:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-31T02:11:00Z_ — Fetched by `agy` and committed to `litlfred/cat-harness` branch `agy/crdm-sources` at commit `54e658667e0c49bc48f15c56aa095d6957599fc0` under `uploads/crdm/` (not yet ingested into `library/`, no PR opened, `litlfred/dth-phc#1` untouched, awaiting owner OK for Claude thread ingestion):
- **PATH 2012 (`MCHN_mhis_crdm.pdf`):**
  - Landing URL: `https://www.path.org/resources/common-requirements-for-maternal-health-information-systems-produced-with-the-collaborative-requirements-development-methodology` (301 → `https://www.path.org/our-impact/resources/common-requirements-for-maternal-health-information-systems-produced-with-the-collaborative-requirements-development-methodology/`)
  - PDF URL: `https://media.path.org/documents/MCHN_mhis_crdm.pdf`
  - `uploads/crdm/MCHN_mhis_crdm.pdf` (1,695,428 bytes, 36 pages) — `sha256: 40dd61b6915da7fb92cc1c23a645414d144cd3dacbb7c4d9d77633e8297e384e`
  - `uploads/crdm/path-2012-landing.html` (115,907 bytes) — `sha256: f681543eeca59748203944e7324ae1f9e31d60bded7fec157d2e5af47bbd9743`
- **PHII 2023 (`https://phii.org/crdm/`):**
  - Page URL: `https://phii.org/crdm/` (WordPress page ID `12947`; WP REST API: `https://phii.org/wp-json/wp/v2/pages/12947`)
  - Attached media (`parent=12947`): `https://phii.org/wp-content/uploads/2021/08/CRDM-Columns-with-white-margins.png`
  - Companion PHII requirements guide PDF on `phii.org` referencing `http://phii.org/crdm/defining-requirements.html`: `https://phii.org/wp-content/uploads/2021/07/Defining-and-Validating-Requirements-Guide_0.pdf`
  - Note on embedded videos: `https://phii.org/crdm/` embeds 7 YouTube videos (`youtu.be/nTAg7dLD-3A`, `T4uzx34Ywsg`, `51VDZkKe3pI`, `yTp503ctaQo`, `dZsOppNWVW4`, `s5y_UJvfRAk`, `paqXqjSzVFo`) and 1 Vimeo player iframe (`https://player.vimeo.com/video/1235973604`), which returns a Cloudflare connection-verification block in headless Chrome; PHII hosts the same video on YouTube at `https://youtu.be/Kx8pBdr-gC0` (`https://phii.org/resources/defining-the-work-of-public-health-together/`), and both URLs are preserved in `phii-crdm-2023.pdf`.
  - `uploads/crdm/phii-crdm-2023.pdf` (569,470 bytes, 10 pages, Headless Chrome `Page.printToPDF`) — `sha256: 873a50591ddd8d1e6d23efa836b3cd314618ddaae6878c60b7c21132f6d00bf0`
  - `uploads/crdm/phii-crdm-2023.html` (154,381 bytes) — `sha256: 7eedd9fbba28934c7717bc9bcd66dd949a13458aafe6f367bc287bd2e0affb59`
  - `uploads/crdm/phii-crdm-wp-page-12947.json` (33,486 bytes) — `sha256: 93b42ad88f1bcc17fccc3ec3289e297ba7bb508081bd243ea669d0d4080d941b`
  - `uploads/crdm/CRDM-Columns-with-white-margins.png` (457,599 bytes, 2300×1840) — `sha256: 0380ddf45a1a7d0a6857ca36cb9dbc0c84d106774e77ab7b086e414d948be808`
  - `uploads/crdm/Defining-and-Validating-Requirements-Guide_0.pdf` (675,122 bytes, 6 pages) — `sha256: d79258a2b2bb70155d37d707ac241f7432f7e55804ad40dd11abe7f0d1e93df4`
  - `uploads/crdm/SHA256SUMS` (657 bytes) — `sha256: d3f993be6ee53214807c67312e5fd61329f012bc15238e0bc88f590024604618`
