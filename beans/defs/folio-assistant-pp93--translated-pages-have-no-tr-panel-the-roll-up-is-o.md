---
# folio-assistant-pp93
title: 'TRANSLATED PAGES HAVE NO TR PANEL: the roll-up is over blocks, and the locale index pages have none'
status: completed
type: task
priority: normal
created_at: 2026-09-21T11:23:21Z
updated_at: 2026-09-21T12:02:00Z
parent: folio-assistant-bzyu
---

The page-level translation roll-up (PR #691, issue #687) reaches the 12 generated pages, whose blocks can carry translation sidecars.

The 5 hand-authored translated pages — docs/{ar,es,fr,ru,zh}/index.md — get the corrected counts and the language bar, but no TR panel: their source docs/index.md carries no block triples, so there is nothing to roll up.

## Done when

- (docs page, locale) pairs are swept the way translation-block-qa.ts sweeps (block, locale) pairs, over the three deterministic criteria;
- their sidecars have a results-tree write path, so a .translation-qa.json does not land in the published Jekyll site;
- sidecarPaths('translation', ...) reads the results tree first and the sibling second — the same read-both/prefer-new/write-new asymmetry qa-paths.ts already argues for;
- the 5 translated pages carry a TR badge that opens.
