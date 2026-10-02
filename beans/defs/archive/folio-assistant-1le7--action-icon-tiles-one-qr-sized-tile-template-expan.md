---
# folio-assistant-1le7
title: 'Action-icon tiles: one QR-sized tile template, expandable, for settings / languages / KG viewer / src'
status: completed
type: task
priority: normal
created_at: 2026-09-19T00:23:01Z
updated_at: 2026-09-23T14:55:36Z
parent: folio-assistant-o3xy
---


_2026-09-19T00:23:32Z_ — OWNER, 2026-09-19, verbatim: 'how do you get to there? maybe an icon of a net in top navbar? should also link to the renderd jsopn-ld on staging/main appropraialy on the viewer. that navbar is getting crowded. will need to make expandable set of icon tiles that build out to the size of the QR code. use that as kind of the template size for action icons, settins opens into that tile with poppouts from there if neede, same for languages, smae for this KG graph veiwer and src. light dark mode icon is tile under settings.' READ AS A SPEC: (a) the KG viewer has no entry point at all today — it is published at <base>/kg/ and nothing links to it. A net/graph icon in the top navbar is the proposed way in. (b) The viewer itself should link BACK to the raw JSON-LD it renders, resolved for the context it is served from (staging vs main) — and note the viewer already fetches its sibling relative to its own location, so the correct link is the same relative path it already uses, NOT a composed absolute one. (c) The navbar is crowded, so icons do not simply accumulate. (d) The unit is a TILE whose size is taken from the existing QR code, and that size becomes the template for all action icons. (e) Tiles EXPAND: an icon opens into its tile, and a tile may have popouts if it needs them. (f) Named tiles: settings, languages, KG viewer, src. (g) Light/dark mode is NOT top-level — it is a tile UNDER settings. GATED BY bean gjli: all UI must follow accessibility guidelines, and an expandable icon grid is precisely where that bites — keyboard path into and out of every tile, focus trapped or not trapped deliberately in popouts, accessible names on icon-only controls, target size at least the QR tile (which helps rather than hurts, given the owner's limited hand function), and state announced when a tile opens. An icon-only navbar with no accessible names would be the worst possible outcome of this bean. OPEN QUESTIONS, not yet put to the owner: which repo owns this — the navbar is docs/ (just-the-docs) in folio-assistant, but AGENTS.md says the harness has no renderer of its own and folio is the only renderable graph kind, so a navbar change may belong downstream; and whether the QR code's current rendered size is fixed or responsive, since 'the size of the QR code' is only a template if it is stable.

## Summary of Changes

Closed 2026-09-23 **on evidence, not authorship**. The owner picked this bean as the next task. Checking it showed the work had already landed and the bean had never been closed. Each part of the spec, measured on `main` at `14d53925`:

- **(a) An entry point to the KG viewer.** The launcher has a knowledge-graph tile, and its target comes from `_data/harness.json`, not a hand-written `/kg/` address (bean `udx8`).
- **(b) The viewer links back to the raw JSON-LD.** A "JSON-LD" link is in the viewer's meta line (`wireframes/kg-viewer/intent.md`).
- **(c) The navbar is not crowded.** The header's four buttons became one launcher.
- **(d) Tiles are sized from the QR code.** The panel uses the QR panel's sidebar slot (`.fa-panel-in-sidebar`, 16.5rem), and the grid tiles are about 7rem across (`docs-ui.css`, `.fa-tiles-grid`).
- **(e) Tiles expand into views.** There is Back, and Escape undoes one step at a time.
- **(f) The named tiles exist.** Settings, languages, KG viewer, source, plus Search and QR.
- **(g) Light/dark is a tile under Settings.**
- **The gjli gate.** Every tile has an accessible name that is not just its glyph, the whole launcher works from the keyboard alone, focus moves into each view and back to the tile that opened it, and every tile is well above the 24px SC 2.5.8 floor.

Evidence: `cat-harness/test/action-tiles.e2e.ts`, 22/22 passing on `main` in this session.

The open questions are settled by what shipped. The navbar lives in this repo's `docs/`, and the QR slot's width is fixed at 16.5rem in the sidebar.
