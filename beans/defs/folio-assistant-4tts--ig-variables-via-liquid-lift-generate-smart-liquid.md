---
# folio-assistant-4tts
title: 'IG VARIABLES via Liquid: lift generate_smart_liquid.py into site.data and render IG pages from Jekyll/Liquid templates in one pass'
status: in-progress
type: feature
created_at: 2026-10-01T12:36:15Z
updated_at: 2026-10-01T12:36:15Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01: *"make use of jekyll/liquid templates in justthedocs pipeline. bean should be there on variable substitution"*.

No bean tracked this before. It was P0's stated **open half** in two skills:
- `ig-publisher-reduction` §"P0 is a re-point";
- `ig-render-jekyll` §"Where the variables come from".

**Settled design (from the skills; not redesigned here):**
- **Lift** WHO's `generate_smart_liquid.py`. It computes IG metadata → Liquid variables per artefact: `url__canonical`, `url__page`, `url__json`, `text__display`, `link__html`, `elements__<key>`.
- **Drop the `smart__` prefix** at the fhir-harness layer, because it is WHO's.
- **Compute and consume in one pass.** The script's defect is that its page is processed on the *next* build, so the variable surface takes two builds to converge.
- **Serve through `site.data`**, which fhir-harness passes through to Jekyll (`kott`, `bamf`). Pages then use `{{ site.data… }}` in Liquid templates.

**And the owner's widening:** use Jekyll/Liquid **templates** in the pipeline. Pages are rendered by Jekyll from data plus a template, not written out as finished markdown by TypeScript generators.

Related:
- **Completed:** `kott` (namespaced values, one resolver), `6dvy` (just-the-docs substitution), `bamf` (`site.data.fhir`).
- **Blocks:** `jut3` (P0's variables half).

## Done when
- [ ] `generate_smart_liquid.py` read from the owner's `litlfred/smart-base` fork; variable families and inputs listed
- [ ] the lifted variables written to the IG site's `_data/` in the same build that consumes them
- [ ] at least one Publisher-generated page kind rendered from a Liquid template over that data, instead of from a TS string generator
- [ ] the Publisher-equivalence invariant (owner, 2026-10-01) checked on that page kind against the Publisher's render
