---
# folio-assistant-kupb
title: 'IRIS CATALOGUE: a referenced import of who-iris into the KG, its themes, and the SDLC that tests a sample import'
status: in-progress
type: epic
priority: high
created_at: 2026-09-20T08:01:14Z
updated_at: 2026-09-20T08:01:14Z
---

Owner ask, 2026-09-20, three messages in one session.

SOURCES, both uploaded to the repo root by the owner and both measured this session:
- `549fb04` — a saved DSpace ITEM PAGE. The HTML declares `saved from url=https://iris.who.int/items/18892cf3-5a4f-42a4-923c-a93f4a594dec`; the sidecar zip carries `client-theme.css`, `styles.e55b0c9926626404.css`, `who_logo.svg`, `who_logo_white.svg`, `iris_logo.svg`. That is the IRIS WEB THEME, not the publication.
- `9a60f6f` — the FULL ITEM RECORD (`-info.pdf`), qualified Dublin Core. Extracted with pdftotext: `dc.identifier.govdoc = WPR/RDO/2020/003`, two `dc.identifier.uri` handles (`10665/332098`, legacy `10665.1/14518`), `dc.subject.mesh` x2 (Publishing; Guidelines as Topic), per-field language qualifiers, bitstream `WPR-RDO-2020-003-eng.pdf` 2.68 MB, collection path Home -> Regional Office for the Western Pacific -> Information products.

THE LOOP CLOSES ON ITSELF. That bitstream is ALREADY in the corpus as `library/wpr-rdo-2020-003-eng`. The artefact whose style guide defines the PUBLICATION theme is the same artefact whose IRIS page defines the WEBPAGE theme. That is what makes it the worked example rather than an arbitrary one.

OWNER DECISIONS, 2026-09-20, verbatim where short:
- two staged top-level dirs: `who-iris/` (the catalogue instance) and `who-style-guide/` (the three voices).
- `git mv` the three WHO library entries now, re-wire consumers in the same PR.
- ONE `Theme` node with a `kind` discriminator (sticky | webpage | publication), not three node kinds.
- 'keep OCR as platform tool of cat-harness. mionimal tools in who specific stuff.'
- 'mock up the full iris catalog as having been in the KG (by referenced, not slurped up, its 361.55 GB)'
- 'break up working bits (like .ts record for dublin core) etc. fully worked for the three examples'
- 'stub out their hierachy (collections, etc,) and put this in there. as if this is test import.'
- 'this is also a SDLC process to be developed for testing a sample import into a KG (or generally structued data store), issues of data size, retention - what happens if data srouce goes away, copyright'

REVISES bean `r1lz`, which recorded the owner's 2026-09-19 decision as one repo (`who-style-guide`, 3 docs + KG + skills). The catalogue is now the separate thing and the voices are derived FROM it.

## Done when
Every child is closed, `check:voices` is green ACROSS the instance boundary, and the just-the-docs rendering shows the IRIS hierarchy with three materialised items and the rest referenced.
