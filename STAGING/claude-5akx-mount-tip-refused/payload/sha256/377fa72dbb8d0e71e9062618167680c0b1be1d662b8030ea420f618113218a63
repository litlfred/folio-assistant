---
# folio-assistant-9udd
title: 'LSI: cross-document link proposals need a minimum cosine and a hub penalty'
status: completed
type: task
priority: normal
created_at: 2026-09-29T21:51:12Z
updated_at: 2026-09-29T23:23:22Z
parent: folio-assistant-ansc
---

who-iris corpus: of the 15 strongest LSI cross-document pairs, 4 are real, 3 partial, 8 spurious; WPRO p3 is the nearest cross-document unit for 56 units and HQ p78 for 46 (hubs); median best Handbook->HQ cosine 0.195 — 'nearest' mostly means 'least unlike'. Done when: any cross-document proposal (graph-search --latent, lsi_query across graphs, future uses[] candidates) applies a floor and a hub penalty (e.g. CSLS-style local scaling), measured against these 15 read pairs.

Found 2026-09-29 by the LSI/CA analysis of who-iris (bean ansc, report cat-harness/docs/proposals/lsi-who-iris-2026-09-29.md); lsi:near found no existing bean >= 0.7.


## Summary of Changes (2026-09-29) — half the done-when was FALSIFIED, and is not built
- Measured first on the 15 strongest who-iris cross-document pairs a reader labelled (4 real/plausible, 4 weak, 7 spurious), on the soft-hyphen-repaired index: plain cosine separates real from spurious with AUC 0.96; a CSLS-style hub penalty (2cos - r(a) - r(b), r = mean cosine to the K nearest other-document units) made it WORSE, 0.75/0.79/0.75 at K = 5/10/20 — it demoted the best latent-only pair because HQ p36 is genuinely central. So: NO penalty.
- Built: content/pipeline/lsi.ts crossGroupLinks(index, groupOf, {floor, perUnit, hubAt}) with LINK_FLOOR = 0.5 (keeps 4/4 real, drops 5/7 spurious; a house number fitted to 15 examples, stated as such) and hubs REPORTED (units that are the nearest other-group unit for >= 5% of units) for a reader to discount. CLI: bun run lsi links. Tests in lsi.test.ts (never same-group, shared topics found, floor respected).
- who-iris: 12 proposals; 326 of 342 units get none; hubs WPRO p3 (54x), HQ p78 (50x).
- Not applied to graph-search --latent / lsi_query: those are query-to-unit rankings with no ground truth for a floor on folded-in short queries.
