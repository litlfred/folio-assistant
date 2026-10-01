---
# folio-assistant-yhjr
title: 'bootstrap-tools SubgraphInput.subdirs: supply subdirectory descriptions from the harness (~49 READMEs)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:46Z
parent: folio-assistant-3fva
---

Arc `3fva`, proposal §4 item 0.4. This is item 3 of the 2026-10-01 handover.

bootstrap-tools #2 (`9c00c534966`) accepts `SubgraphInput.subdirs`, but nothing supplies it, so no README has changed.

To do: resolve the subdirectory descriptions in `harnessInstances` in `cat-harness/scripts/subgraph-readmes.ts`, using `registry.get(kind)?.declarationFile`. `subgraph: true` already separates promoted directories from table rows, and the two partition. Then bump the submodule.

Risk carried over: 19 bootstrap-tools tests and `check:concepts` could not run without a sibling `bootstrap/` checkout. Run them with the pair checked out.

## Done when
- [ ] the subdirectory rows render from declarations in every affected README
- [ ] the bootstrap-tools tests run with the sibling checkout, and the result is recorded
- [ ] `readme:subgraphs:check` is green
