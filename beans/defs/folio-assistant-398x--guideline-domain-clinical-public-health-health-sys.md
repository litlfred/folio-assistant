---
# folio-assistant-398x
title: 'GUIDELINE DOMAIN: clinical / public health / health system strengthening, as a glossary scheme applied through classifications'
status: todo
type: feature
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-10T14:06:52Z
---

Owner, 2026-10-10: *"these will all need to be a part of a SMART Guideline at some point and are one of clinical health, public health, or health system strengthening guidlines ... In any case these all will be be in the Glossary and can be sorted out later."*

**Measured.** No code exists for this anywhere. The closest is smart-base `KGInterventionType` (DRAFT: `#public-health`, `#health-system`, …), but it classifies the *intervention*, not the guideline. `KGPublicationType` classifies the publication's form.

**Decided (session 2026-10-10).** A small SKOS concept scheme in the glossary (`clinical`, `public-health`, `health-system-strengthening`), applied through intake `classifications` with a source, and to each recommendation-scenario candidate. Promote it to a smart-base CodeSystem when the catalogues exist.

## Done when
- [ ] the scheme in a glossary, with each concept linked to its closest external concept (exactMatch/closeMatch), or a recorded "none found"
- [ ] measles and the HIV guidelines classified, each with a source
