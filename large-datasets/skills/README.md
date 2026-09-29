<!-- kg:subgraph:begin -->
# large-datasets-skills

The `large-datasets` subgraph's instruction bodies. Declared here as well as in its own harness.json for the same reason kg-navigation is: `resolveSkillDirs` has no caller yet, so a nested instance's directories are not reachable from the root. `materialize-remote` lives here and is named by two diagrams in cat-harness/processes/ -- a skill ref resolves across the declared graphs, not within one directory. The `skills` graph does NOT owe a visualiser: `owesVisualiser` is `!renderable && holds !== "content"`, and `skills` is `content` — *"a graph that stands on its own does not need a viewer to be legible"*. So no gate was failing. What WAS wrong is that the viewer already existed and nothing declared it: `docs-auto` renders one sub-page per skills directory, and `graph-tiles.undeclaredProjections` lists exactly a directory with a published page and no declared visualisation — so all seven read as "no published viewer" in the navbar tiles while being rendered the whole time. `tools` is the same `content` kind and has declared one all along, which is the precedent: declaring a visualiser for a content kind is a courtesy the corpus already extends, not an obligation this invents.

Part of [C@T Harness](../../cat-harness/README.md), declared as `large-datasets-skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`copy-out-materialized.md`](copy-out-materialized.md) | Materialized content is read-only. | "Copy out materialized content — to work on somebody else's bytes" |
| [`materialize-on-demand.md`](materialize-on-demand.md) | After bootstrap, a person asks for part of a remote subgraph to be held locally. |  |
| [`materialize-remote.md`](materialize-remote.md) | Landing remote content locally — the five gates, the three states, and the two purposes. | "Materialize remote content — the shared subprocess", "Refresh materialized remote content", "Sample import into a structured data store" |
| [`package-manifest.json`](package-manifest.json) | Taking a usable subset of a corpus this instance will never hold, and refreshing it. |  |
<!-- kg:subgraph:end -->
