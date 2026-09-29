<!-- kg:subgraph:begin -->
# who-iris-docs

The viewer for this instance's docs, BUILT BY cat-harness — the owner's rule that a harness which instantiates a directory makes a visualiser for it. Declared HERE, in this instance's own file, rather than in the root's: `compose-docs.docsLayers` treats every docs-kind entry in `cat-harness.json` as a COMPOSITION LAYER, so declaring this directory there would overlay this instance's `index.md` onto the site's own. Measured — `compose-docs.test.ts` failed exactly that way when tried. The ref resolves because `injectRails` measures against the BUILT instance's docs prefix (cat-harness's), not the declaring instance's, which is the same reason `who-iris-library`'s cat-harness-built ref resolves today. This directory IS mounted verbatim at `/docs/who-iris/` as well, and the two are different things: the mount is a byte-for-byte copy of the directory, this is an index OF it. The rail links here, which is what `visualiserHref` exists to make happen.

Part of [WHO IRIS](../README.md), declared as `who-iris-docs`, holding `docs`.

| file | what it is | used by |
|---|---|---|
| [`index.html`](index.html) | a file |  |
| [`ingestion-notes.html`](ingestion-notes.html) | a file |  |
| [`kg-to-portal.html`](kg-to-portal.html) | a file |  |
| [`assets/`](assets/) | 1 file | |
<!-- kg:subgraph:end -->
