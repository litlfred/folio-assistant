<!-- kg:subgraph:begin -->
# smart-trust-docs

The reader-facing pages, generated from `fhir-artifact-index/index.json` by `smart-trust:pages`. THE REASON THIS EXISTS: `fhir-artifact-index` is registered `renderable: false`, and until 2026-09-21 this instance declared only that kind — so 674 ingested artefacts were reachable at no URL, which is how the owner found it, by asking where `/smart-trust` was. Only `docs` and `folio` are renderable, and `mount-instance-docs.ts` copies any declared `docs` directory as FINISHED HTML (Jekyll's source is hardcoded to `cat-harness/docs`, so an instance's own pages are built by nothing). `instanceRoot: true` is what makes THIS kind answer at `/smart-trust/` rather than the choice falling to sort order — the defect `withRoutes` documents. It is the only renderable kind here today, so nothing is ambiguous yet; declaring it now means adding a second one later cannot silently move the root. Generated, never authored: `smart-trust:pages:check` is the gate. The viewer for this instance's docs, BUILT BY cat-harness — the owner's rule that a harness which instantiates a directory makes a visualiser for it. Declared HERE, in this instance's own file, rather than in the root's: `compose-docs.docsLayers` treats every docs-kind entry in `cat-harness.json` as a COMPOSITION LAYER, so declaring this directory there would overlay this instance's `index.md` onto the site's own. Measured — `compose-docs.test.ts` failed exactly that way when tried. The ref resolves because `injectRails` measures against the BUILT instance's docs prefix (cat-harness's), not the declaring instance's, which is the same reason `who-iris-library`'s cat-harness-built ref resolves today. This directory is NOT mounted: `mount-instance-docs` skips a docs directory with no `index.html`, and this one has none. The viewer is real regardless — `docs-auto` indexes the 20 pages it holds and publishes that page. "No verbatim mount" and "no viewer" are different facts, and declaring this is what stops the second being inferred from the first.

Part of [smart-trust](../README.md), declared as `smart-trust-docs`, holding `docs`.

| file | what it is | used by |
|---|---|---|
| [`index.md`](index.md) | "All 674 artefacts of the WHO SMART Trust IG 1.8.0, reconstructed from its published output." |  |
| [`artifact/`](artifact/) | 674 files | |
| [`category/`](category/) | 1 file | |
| [`menu/`](menu/) | 5 files | |
<!-- kg:subgraph:end -->
