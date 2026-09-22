---
# folio-assistant-yg29
title: 'GOAL 3: showing who-iris with its existing materialised assets, through a themed harness'
status: in-progress
type: milestone
priority: high
created_at: 2026-09-20T18:48:29Z
updated_at: 2026-09-20T18:48:29Z
---

The owner's words, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), kept verbatim:

> showing who-iris w/ existing materialized assets with themed harness.

Created on the owner's ruling for bean `wqht`: *"wqht - milesotne"*.

## Epics under this milestone

| epic | why |
|---|---|
| `kupb` | IRIS CATALOGUE — a referenced import of who-iris into the KG, its themes, and the SDLC that tests a sample import. Landed on main with #477. |

## What already exists, which is more than the beans admit

Measured 2026-09-20, after #477 merged:

| | |
|---|---|
| materialised L1 documents | three WHO items, full `manifest.jsonld` + per-page `.md`/`.jsonld` |
| catalogue | 12 nodes — 9 referenced, 3 materialized, 0 unknown |
| themes | 12 shipped, `THEME_KINDS` already `sticky \| webpage \| publication` |
| navbar avatar source | the WHO logo, already extracted from the IRIS capture |

**The missing piece is a page.** `who-iris/` has no `docs/`, and no instance
yet renders on its own theme's ground.

## Shortest path

1. Close the three beans that are built but still read open — `z7ev`
   (cross-instance library reference), `lzbw` (the IRIS/DSpace skill),
   `huiu` (Dublin Core records) — verifying `check:voices` is green across
   the who-style-guide → who-iris boundary, which is `kupb`'s own falsifier.
2. `j66n`'s two themes. `iris-web`'s source is already on disk in the IRIS
   capture; `who-wpro-publication`'s source is the style guide's own rules.
3. The rendering: `jbx2` (`library/` per slug, ingestion as three states) and
   `809i` (*"the just-the-docs rendering distinguishes the three visually"*).
4. `kupb` closes.

**This goal depends on goal 2 and on `o7eq`**: who-iris is shown *through* a
navbar section at `<baseurl>/who-iris/...`, so the URL rule and the navbar
are its delivery mechanism, not separate work.

## Blocked on the owner

- **waits on:** the owner — `hqku`, and the disposition of `xffc` / `d3yq`
- **since:** 2026-09-20
- **expires:** 2026-09-29 — a REVIEW date, not a takeover date; see the handoff
- **handoff:** on expiry, re-raise. NOTE: `hqku` is already `completed` on main, so the stated blocker has partly happened — re-derive before assuming this is still waiting on it.


`hqku` (*"is `library/` active content a sweep should judge, or derived
material it should skip?"* — it bears directly on the rendering), and the
disposition of `xffc` and `d3yq`, whose premise the owner withdrew with
*"no formal role/theme mapping per se. that is authoring (human/agentic)
decision/judgement."*

## Done when

- [ ] The rendered site shows the IRIS hierarchy, with the three materialised
      items distinguished from the referenced ones and the distinction
      explained
- [ ] It renders on the IRIS theme rather than the default
- [ ] `check:voices` is green across the instance boundary
