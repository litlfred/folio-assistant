---
# folio-assistant-398x
$schema: bean/1.0.0
title: 'GUIDELINE DOMAIN: clinical / public health / health system strengthening, as a glossary scheme applied through classifications'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-24T07:50:00Z
parent: folio-assistant-0lmb
---

Owner, 2026-10-10: *"these will all need to be a part of a SMART Guideline at some point and are one of clinical health, public health, or health system strengthening guidlines ... In any case these all will be be in the Glossary and can be sorted out later."*

**Measured.** No code exists for this anywhere. The closest is smart-base `KGInterventionType` (DRAFT: `#public-health`, `#health-system`, …), but it classifies the *intervention*, not the guideline. `KGPublicationType` classifies the publication's form.

**Decided (session 2026-10-10).** A small SKOS concept scheme in the glossary (`clinical`, `public-health`, `health-system-strengthening`), applied through intake `classifications` with a source, and to each recommendation-scenario candidate. Promote it to a smart-base CodeSystem when the catalogues exist.

## Done when
- [x] the scheme in a glossary, with each concept linked to its closest external concept (exactMatch/closeMatch), or a recorded "none found" (`litlfred/folio-assistant-core#185`, verified against live `id.nlm.nih.gov/mesh/`: `clinical` -> `D017065` *Practice Guideline*, `D015510` *Clinical Medicine*; `public-health` -> `D011634` *Public Health*, `D015980` *Public Health Practice*; `health-system-strengthening` -> `D003695` *Delivery of Health Care*, `D057191` *Capacity Building* with recorded note that MeSH has no single pre-coordinated descriptor)
- [x] measles and the HIV guidelines classified, each with a source (`litlfred/smart-immunizations#73` classifying `uploads/WER9217-205-227/intake.json` from WHO IRIS `10665/255377`; `litlfred/smart-hiv#20` classifying all 5 HIV guidelines/DAK `uploads/*/intake.json`)

_2026-10-16T10:45:00Z_ — Parented to `0lmb` (CONTENT MODEL) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

## 2026-10-20..2026-10-21 — scheme authored (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

`litlfred/folio-assistant-core#162` (`a2b6524bd5`) and `#168` (`f35c1daff7`) add `glossary/guideline-domain.glossary.json` (`clinical`, `public-health`, `health-system-strengthening`) and `.pot` templates across 5 locales; `litlfred/cat-harness#379` (`d22ac7f699`) adds its generated SKOS JSON-LD (`cat-harness/docs/assets/glossary/folio-assistant-core--guideline-domain.skos.jsonld`). Box 1 is HALF done: the scheme exists, but no external match is recorded — `id.nlm.nih.gov` refused this environment (403) and no IRI was written from memory; each term's `scopeNote` says so. Candidate for the network-access agent (bean `53rv`). Box 2 (classify measles and HIV guidelines) not started.

Found on the way: `check:glossary` is red on folio-assistant main at the 2026-10-20 pins — 27 committed generated glossary files stale (measured in a clean worktree). Carried by `34cm` / `oqe3` (now resolved via `builtAtPublish`).

## 2026-10-23 — MeSH links verified live & Measles + HIV guidelines classified (connected agent)
- **Box 1 (`litlfred/folio-assistant-core#185`, `ac9b9dd`):** Queried live NLM MeSH RDF API (`https://id.nlm.nih.gov/mesh/`) and added `skos:closeMatch` IRIs + updated `.pot` files for all 3 concepts in `glossary/guideline-domain.glossary.json`:
  - `clinical`: `http://id.nlm.nih.gov/mesh/D017065` (*Practice Guideline*, `meshv:PublicationType`) and `http://id.nlm.nih.gov/mesh/D015510` (*Clinical Medicine*).
  - `public-health`: `http://id.nlm.nih.gov/mesh/D011634` (*Public Health*) and `http://id.nlm.nih.gov/mesh/D015980` (*Public Health Practice*).
  - `health-system-strengthening`: `http://id.nlm.nih.gov/mesh/D003695` (*Delivery of Health Care*, entry terms *Health Care Systems* / *Healthcare Systems*) and `http://id.nlm.nih.gov/mesh/D057191` (*Capacity Building*), with `scopeNote` recording that MeSH has no single pre-coordinated descriptor for "health system strengthening".
- **Box 2 (`litlfred/smart-immunizations#73`, `c2b56b93`; `litlfred/smart-hiv#20`, `3b170b52`):**
  - Resolved the `IMMZ.D2.DT.Measles.xlsx` handle typo (`10665/255705` -> real WHO IRIS handle `https://iris.who.int/handle/10665/255377`, *Measles vaccines: WHO position paper – April 2017*, WER 92(17):205–227), ingested `uploads/WER9217-205-227/`, and classified it under `guideline-domain` (`public-health`, `clinical`, `health-system-strengthening`) and `https://smart.who.int/kg/layer` (`l1`) with sources (`litlfred/smart-immunizations#73`).
  - Classified all 5 HIV `uploads/*/intake.json` records (`9789240085138-eng`, `9789240031593-eng`, `9789241549684_eng`, `9789241550581-eng`, `9789240124233-eng`) under `guideline-domain` and `https://smart.who.int/kg/layer` with sources (`litlfred/smart-hiv#20`).

_2026-10-24T07:50:00Z_ — PR status: all three PRs are still OPEN. `litlfred/folio-assistant-core#185` had a conflict with main (the `.pot` templates, after main moved to `v0` namespace IRIs); merged main and pushed `299117c`. `litlfred/smart-immunizations#73` and `litlfred/smart-hiv#20` write the scheme as `.../folio-assistant-core/0.1.0/ns#glossary/guideline-domain`, but main now uses `.../v0/ns#...`; the fix is ready locally, held because sushi cannot run in this environment (packages.fhir.org refused). Session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU.
