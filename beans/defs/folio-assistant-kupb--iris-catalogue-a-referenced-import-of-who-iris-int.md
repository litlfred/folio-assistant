---
# folio-assistant-kupb
title: 'IRIS CATALOGUE: a referenced import of who-iris into the KG, its themes, and the SDLC that tests a sample import'
status: in-progress
type: epic
priority: high
created_at: 2026-09-20T08:01:14Z
updated_at: 2026-09-23T02:45:00Z
parent: folio-assistant-yg29
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

---

## Narrowed to IRIS-catalogue work, 2026-09-23 — owner's ruling

Owner, 2026-09-22, choosing **"re-parent the non-catalogue five"** over keeping
them, narrowing this bean's Done-when, or a per-bean review.

**The problem this solves.** `kupb`'s Done-when is *"Every child is closed"*,
and it had **12 open children**. GOAL 3 (`yg29`) cannot close until `kupb`
does, so Pagefind, CDN publication, compiled-artefact caching, detangle and the
large-datasets skill family were each holding *"who-iris is shown through a
themed harness"* open — for reasons that have nothing to do with who-iris.

### Moved out — eight, not seven

| bean | to | why it is not catalogue work |
|---|---|---|
| `4pm8` | `5a3l` | Pagefind is a search-**engine** choice — deployment/topology |
| `eof6` | `5a3l` | *"build it on release, never on staging refresh"* — a release-pipeline rule |
| `xies` | `5a3l` | *"GH Pages is a TOOL CHOICE"* — its own body says topology |
| `54rk` | `5a3l` | caching + on-demand materialisation is an operating mode |
| `gpdo` | `5a3l` | `.olean` caching, the same shape as `54rk` |
| `j79e` | `zzmr` | detangle measures whether a subgraph is cohesive — KG structure |
| `w5bn` | `zzmr` | subsetting a corpus you do not own — a KG skill family |
| **`rtrg`** | `ahvw` | **beyond the named set** — BPMN `targetNamespace` drift across the *workflow* corpus is process hygiene, and is not catalogue work by any reading |

**`rtrg` is flagged because it is an addition, not an application.** The ruling
named five and allowed two more; this is an eighth, moved on the ruling's stated
principle — *"kupb keeps only IRIS-catalogue work"* — rather than on its list.
If that reading is wrong, this is the one line to reverse.

### Staying — four, and each earns it

| bean | why |
|---|---|
| `j66n` | theme ingestion for who-iris; GOAL 3 names it on its own path |
| `hfwl` | SAMPLE-IMPORT SDLC — testing an import into a KG |
| `hpax` | MATERIALIZE REMOTE CONTENT — its own body says *"shared by catalogue import"* |
| `v048` | ROAST — an adversarial pass over the catalogue-import design itself |

**Nothing was closed, scrapped or deleted, and no moved bean's own work
changed** — not a status, not a Done-when, not a line above the note each now
carries. Only the question *"whose goal does finishing this serve?"* is answered
differently.

**`kupb` still does not close**: four open children remain, and they are the
four this epic is actually about. What changed is that GOAL 3 is now reachable
by finishing IRIS-catalogue work, instead of waiting on a CDN.

## 2026-09-24 — three children added from the `v048` roast, by the owner's choice

`v048` recorded 13 objections, 10 open. Asked where the three that matter
most should go, the owner chose **"Under kupb"**: GOAL 3 stays open until
publication respects the licence gates, referenced pointers survive the
host, and a sample import has actually run. The alternatives offered were a
new epic beside `kupb`, which would have let GOAL 3 close now, or filing
nothing. This reverses the direction of the 09-22 narrowing on purpose, and
this note exists so the next reader does not "fix" it.
