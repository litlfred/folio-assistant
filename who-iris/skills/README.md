<!-- kg:subgraph:begin -->
# who-iris-skills

The who-iris instance's skills. ONE today -- `iris-dspace`, how IRIS uses DSpace and qualified Dublin Core, and what a later tool needs from a record stated as checkable requirements. Deliberately thin, per the owner's 'mionimal tools in who specific stuff': the Dublin Core TYPE is generic and lives in folio-assist-core, the enumeration/subsetting descriptor lives in large-datasets, and OCR stays a cat-harness platform tool. What is WHO-specific is only how IRIS uses those things. The `skills` graph does NOT owe a visualiser: `owesVisualiser` is `!renderable && holds !== "content"`, and `skills` is `content` — *"a graph that stands on its own does not need a viewer to be legible"*. So no gate was failing. What WAS wrong is that the viewer already existed and nothing declared it: `docs-auto` renders one sub-page per skills directory, and `graph-tiles.undeclaredProjections` lists exactly a directory with a published page and no declared visualisation — so all seven read as "no published viewer" in the navbar tiles while being rendered the whole time. `tools` is the same `content` kind and has declared one all along, which is the precedent: declaring a visualiser for a content kind is a courtesy the corpus already extends, not an obligation this invents.

Part of [C@T Harness](../../cat-harness/README.md) 0.1.0, declared as `who-iris-skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`iris-dspace.md`](iris-dspace.md) | How WHO IRIS uses DSpace and qualified Dublin Core — the three identifier systems, MeSH as a controlled vocabulary, bundles, and the containment path. |  |
| [`package-manifest.json`](package-manifest.json) | What a consumer of the WHO Institutional Repository for Information Sharing needs to know about how it is built — DSpace, and qualified Dublin Core. |  |
<!-- kg:subgraph:end -->
