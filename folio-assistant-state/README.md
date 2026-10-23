# Folio Assistant (repository state)

The state this repository keeps about **itself**, as distinct from anything a
layer owns. The repository as a whole is described by the
[root README](../README.md); this instance holds only the graphs that are about
`litlfred/folio-assistant` and that nothing else can store.

Today that is one graph:

| Graph | Where it lives | Who writes it |
|---|---|---|
| `health` | the `cat/folio-assistant-state/health` state branch, mounted at `test/health/results/` by `bun run cat state:mount` | the daily sweep, [`health-check.yml`](../.github/workflows/health-check.yml) |

## Why it exists

Each layer keeps its own health graph on its own repository. The daily sweep of
*this* repository runs with a token scoped to this repository, so it could not
write its report to a layer's branch (bean `folio-assistant-kyrg`). The owner
chose, on 2026-10-22, to keep this sweep's reports here, in an instance of the
repository's own.

[`folio-assistant-state.json`](folio-assistant-state.json) is the declaration,
and the list of what is here: a second copy in prose would be free to disagree
with it the day a graph is added.
