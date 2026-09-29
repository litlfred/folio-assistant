---
# folio-assistant-9udd
title: 'LSI: cross-document link proposals need a minimum cosine and a hub penalty'
status: in-progress
type: task
priority: normal
created_at: 2026-09-29T21:51:12Z
updated_at: 2026-09-29T23:19:05Z
parent: folio-assistant-ansc
---

who-iris corpus: of the 15 strongest LSI cross-document pairs, 4 are real, 3 partial, 8 spurious; WPRO p3 is the nearest cross-document unit for 56 units and HQ p78 for 46 (hubs); median best Handbook->HQ cosine 0.195 — 'nearest' mostly means 'least unlike'. Done when: any cross-document proposal (graph-search --latent, lsi_query across graphs, future uses[] candidates) applies a floor and a hub penalty (e.g. CSLS-style local scaling), measured against these 15 read pairs.

Found 2026-09-29 by the LSI/CA analysis of who-iris (bean ansc, report cat-harness/docs/proposals/lsi-who-iris-2026-09-29.md); lsi:near found no existing bean >= 0.7.
