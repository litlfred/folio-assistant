<!-- kg:subgraph:begin -->
# code-lists

Closed sets of codes, one `"$schema": "folio-code-list/v1"` file per list, each code carrying a label, a definition, a source and, where it stands for one, a value. Owner, 2026-09-23: "we need an expandable option, not just declared in code. list of codes and corresponding narrative desc and source should be part of a node/asset", and SKOS as the published form. Two consumers today: adjudication steps name the list their `codes` come from (`<folio:adjudication list="…">`, checked when a diagram loads), and `schemas/namespaces.ts` reads every namespace this project mints from `own-namespaces.json` instead of carrying them as constants. Exported as SKOS concept schemes to `_kg/<stub>-code-lists.jsonld` by `scripts/glossary-export.ts`, beside the swimlane glossary. `dependents: skip` — a dependent INHERITS these through the dependency overlay (`codeListDirs`), and declares its own directory only when it has a list of its own.

Part of [C@T Harness](../README.md) 0.1.0, declared as `code-lists`, holding `code-list`.

| file | what it is | used by |
|---|---|---|
| [`adjudication-content-finding.json`](adjudication-content-finding.json) | Disputed review finding outcomes |  |
| [`adjudication-criterion.json`](adjudication-criterion.json) | Criterion adjudication outcomes |  |
| [`adjudication-materialized-conflict.json`](adjudication-materialized-conflict.json) | Materialized-copy conflict outcomes |  |
| [`adjudication-translation-drift.json`](adjudication-translation-drift.json) | Round-trip drift outcomes |  |
| [`adjudication-translation-passage.json`](adjudication-translation-passage.json) | Flagged translation passage outcomes |  |
| [`grade-certainty.json`](grade-certainty.json) | GRADE certainty of evidence |  |
| [`grade-etd-criterion.json`](grade-etd-criterion.json) | GRADE Evidence-to-Decision criteria |  |
| [`grade-rating-down.json`](grade-rating-down.json) | GRADE reasons to rate certainty down |  |
| [`grade-rating-up.json`](grade-rating-up.json) | GRADE reasons to rate certainty up |  |
| [`grade-recommendation-direction.json`](grade-recommendation-direction.json) | GRADE recommendation direction |  |
| [`grade-recommendation-strength.json`](grade-recommendation-strength.json) | GRADE recommendation strength |  |
| [`own-namespaces.json`](own-namespaces.json) | Namespaces this project mints |  |
<!-- kg:subgraph:end -->
