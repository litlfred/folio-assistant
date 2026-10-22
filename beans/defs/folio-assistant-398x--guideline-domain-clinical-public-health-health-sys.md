---
# folio-assistant-398x
$schema: bean/1.0.0
title: 'GUIDELINE DOMAIN: clinical / public health / health system strengthening, as a glossary scheme applied through classifications'
status: todo
type: feature
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-16T10:45:00Z
parent: folio-assistant-0lmb
---

Owner, 2026-10-10: *"these will all need to be a part of a SMART Guideline at some point and are one of clinical health, public health, or health system strengthening guidlines ... In any case these all will be be in the Glossary and can be sorted out later."*

**Measured.** No code exists for this anywhere. The closest is smart-base `KGInterventionType` (DRAFT: `#public-health`, `#health-system`, …), but it classifies the *intervention*, not the guideline. `KGPublicationType` classifies the publication's form.

**Decided (session 2026-10-10).** A small SKOS concept scheme in the glossary (`clinical`, `public-health`, `health-system-strengthening`), applied through intake `classifications` with a source, and to each recommendation-scenario candidate. Promote it to a smart-base CodeSystem when the catalogues exist.

## Done when
- [ ] the scheme in a glossary, with each concept linked to its closest external concept (exactMatch/closeMatch), or a recorded "none found"
- [ ] measles and the HIV guidelines classified, each with a source

_2026-10-16T10:45:00Z_ — Parented to `0lmb` (CONTENT MODEL) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

## 2026-10-20..2026-10-21 — scheme authored (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

`litlfred/folio-assistant-core#162` (`a2b6524bd5`) and `#168` (`f35c1daff7`) add `glossary/guideline-domain.glossary.json` (`clinical`, `public-health`, `health-system-strengthening`) and `.pot` templates across 5 locales; `litlfred/cat-harness#379` (`d22ac7f699`) adds its generated SKOS JSON-LD (`cat-harness/docs/assets/glossary/folio-assistant-core--guideline-domain.skos.jsonld`). Box 1 is HALF done: the scheme exists, but no external match is recorded — `id.nlm.nih.gov` refused this environment (403) and no IRI was written from memory; each term's `scopeNote` says so. Candidate for the network-access agent (bean `53rv`). Box 2 (classify measles and HIV guidelines) not started.

Found on the way: `check:glossary` is red on folio-assistant main at the 2026-10-20 pins — 27 committed generated glossary files stale (measured in a clean worktree). Carried by `34cm` / `oqe3` (now resolved via `builtAtPublish`).
