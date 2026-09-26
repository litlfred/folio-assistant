---
# folio-assistant-wjfu
title: 'SMART-TRUST PAGES: 674 ingested artefacts had no reader-facing surface — a docs graph, generated from index.json'
status: in-progress
type: feature
priority: high
created_at: 2026-09-21T13:18:01Z
updated_at: 2026-09-21T13:23:30Z
parent: folio-assistant-yj32
---

The owner asked where `https://litlfred.github.io/folio-assistant/smart-trust` was. It did not exist, and that is a gap left by qsf5 rather than a bug: `fhir-artifact-index` is registered `renderable: false`, and `smart-trust/` declares exactly one directory of exactly that kind, so nothing was generated for it.

Only 2 of 29 graph kinds are renderable — `docs` and `folio`. `who-iris/` publishes because it declares a `docs/` directory alongside its `catalogue/`; `smart-trust/` had none.

THE URL THE OWNER ASKED FOR IS CORRECT. `withRoutes` in `cat-harness/scripts/mount-instance-docs.ts` publishes an instance at `/<kind>/<instance>/` for every renderable kind AND once at `/<instance>/` — its themed root. So a `docs` graph here serves BOTH `/docs/smart-trust/` and `/smart-trust/`. The mount is declaration-driven (any directory whose graphs include `docs`), and it copies FINISHED HTML rather than running Jekyll, because Jekyll's source is hardcoded to `cat-harness/docs`.

Owner's scope, 2026-09-21, options 1 AND 3: a generated index over ALL 674 grouped by the 7 `artifacts.html` categories, PLUS dedicated per-artefact pages for the 19 that carry DAK sidecars.

Precedent: `who-iris/scripts/gen-iris-pages.ts` — instance-local generator, static HTML, committed, gated by `iris:pages:check`. Generated from the KG, never transcribed.

## Done when
- [ ] `smart-trust/docs/` declared as kind `docs` with `instanceRoot: true`, so which kind answers at the root is DECLARED rather than alphabetical
- [ ] a generator writes it from `index.json`, never by hand
- [ ] overview page: census, provenance, and the 7 categories
- [ ] all 674 artefacts listed with canonical URL and representation links
- [ ] per-artefact pages for the 19 DAK artefacts, exposing schema/displays/openapi/jsonld
- [ ] a `--check` gate, wired, so the pages cannot go stale against the index
- [ ] gates green

## Not verifiable here
`litlfred.github.io` is 403 policy-denied by this environment's egress proxy, so the published result CANNOT be confirmed from this session. Local generation and the gate are the evidence; seeing it live is the owner's.
