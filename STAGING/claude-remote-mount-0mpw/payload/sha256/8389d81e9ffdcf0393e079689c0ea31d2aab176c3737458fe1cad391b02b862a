---
# folio-assistant-4tts
title: 'IG VARIABLES via Liquid: lift generate_smart_liquid.py into site.data and render IG pages from Jekyll/Liquid templates in one pass'
status: completed
type: feature
priority: normal
created_at: 2026-10-01T12:36:15Z
updated_at: 2026-10-06T19:30:00Z
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
- [x] `generate_smart_liquid.py` read from the owner's `litlfred/smart-base` fork; variable families and inputs listed
- [x] the lifted variables written to the IG site's `_data/` in the same build that consumes them
- [x] at least one Publisher-generated page kind rendered from a Liquid template over that data, instead of from a TS string generator
- [x] the Publisher-equivalence invariant (owner, 2026-10-01) checked on that page kind against the Publisher's render

## 2026-10-01: first slice — variables lifted; `artifacts` rendered by a Liquid template

- **Read** `generate_smart_liquid.py` (`litlfred/smart-base` `e151a4d`). It writes `{% assign smart__<Type>__<id>__<family>__<key> %}` into `_includes/smart.liquid`, plus a page processed on the *next* Publisher build.
- **Lifted** the variables as `site.data.fhir.artifacts.<Type>__<id>.{url.canonical, url.page, url.json, url.xml, url.ttl, text.display, link.html, elements.*}`.
  - Same families and keys, no `smart__` prefix.
  - Written to `_data/fhir.json` by `build-ig-site.ts` in the build that reads them, so it converges in one pass.
  - `elements` holds only what the index has (`name`, `title`, `description`, `version`). The other eight keys are reported as not sourced and never written empty.
- **Template:** `artifacts.md` is now `ARTIFACTS_TEMPLATE`, a Liquid template over `site.data.fhir` that **Jekyll renders**. No artefact data is baked into the page.
- **Equivalence (owner, 2026-10-01).** Built locally with Jekyll 4.4.1 from `litlfred/smart-trust` at `25771f6`, the rendered `artifacts.html` lists the **same 677 artefacts, in the same sequence, under the same 7 categories in the same order** as the Publisher's `artifacts.html` on the fork's `gh-pages`. All 677 links resolve and no Liquid is left in the output.
- **What equivalence required:**
  1. Uncategorised artefacts are left off the page, because category comes *from* that page (the ImplementationGuide itself).
  2. A new optional `listedAt` field in `folio-fhir-artifact/v1`: the ingest records each artefact's position on `artifacts.html`, which was previously parsed and thrown away. The index was re-ingested.

## 2026-10-01: the template moved to a declared `.liquid` file

`liquid-templates` refuses an inline template in a `.ts` file and puts
computation in the generator. The artifacts template is now
`fhir-harness/scripts/templates/ig-site/artifacts.liquid` (directory declared
as `fhir-ig-scripts`); `artifactVariables` computes `artifacts_listed` and
`text.label`, so the template neither counts nor escapes. Re-verified by a
Jekyll build: 677 artefacts, same sequence and 7 categories as the
Publisher's `artifacts.html`.

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3 (7x5n sweep of in-progress beans whose work has landed). Every Done-when box was already ticked by its holder. That was NOT taken as the evidence: the measurement below was re-run on main at 24b221415 (2026-10-06), and no open PR names this bean.

- `fhir-harness/scripts/templates/ig-site/artifacts.liquid` is on main (box 3: a Publisher page kind rendered from a Liquid template). The holder's Jekyll re-verification is recorded above: 677 artefacts, same sequence and 7 categories as the Publisher's `artifacts.html`.
