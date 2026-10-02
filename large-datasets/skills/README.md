<!-- kg:subgraph:begin -->
# large-datasets-skills

The instructions for working with large datasets: one [Skill](https://github.com/litlfred/bootstrap/blob/main/schemas/README.md#skill) per file.

Part of [large-datasets](../README.md) 0.1.0, declared as `large-datasets-skills`, holding `skills`.

| file | what it is | used by |
|---|---|---|
| [`copy-out-materialized.md`](../../cat-harness/skills/library/large-datasets/copy-out-materialized.md) | Materialized content is read-only. | "Copy out materialized content — to work on somebody else's bytes" |
| [`kg-subscription.md`](../../cat-harness/skills/library/large-datasets/kg-subscription.md) | Subscribing a folio or harness to an external knowledge graph — a substrate — and walking its parts from referenced to materialised, one at a time and only t… | "Subscribe to an external knowledge graph" |
| [`materialize-on-demand.md`](../../cat-harness/skills/library/large-datasets/materialize-on-demand.md) | After bootstrap, a person asks for part of a remote subgraph to be held locally. |  |
| [`materialize-remote.md`](../../cat-harness/skills/library/large-datasets/materialize-remote.md) | Landing remote content locally — the five gates, the three states, and the two purposes. | "Materialize remote content — the shared subprocess", "Refresh materialized remote content", "Sample import into a structured data store", "Subscribe to an external knowledge graph" |
| [`package-manifest.json`](../../cat-harness/skills/library/large-datasets/package-manifest.json) | Taking a usable subset of a corpus this instance will never hold, and refreshing it. |  |
| [`sample-import.md`](../../cat-harness/skills/library/large-datasets/sample-import.md) | Testing an import of a SAMPLE of a remote source into a knowledge graph or other structured store: scope it, let materialize-remote gate it, land it in the l… | "Sample import into a structured data store" |
<!-- kg:subgraph:end -->
