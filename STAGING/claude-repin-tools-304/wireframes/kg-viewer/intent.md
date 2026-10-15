# KG viewer — as-is intent

## Covers

- **The generated viewer page.** `cat-harness/scripts/kg-viewer.ts` writes `_kg/<stub>/index.html` by default. The page is published at `<base>/cat-harness/` and reads its parent `../cat-harness.jsonld`.
  - It is the target of `links.kg` (`/cat-harness/`, target `cat-harness/index.html`) in `cat-harness/docs/_data/harness.json`.
  - It is reached from the navbar icon row's **Knowledge graph** ⌘ (`navbar.hrefs.kg`) and from the action panel's "Knowledge graph" tile.
- **Its skill:** `cat-harness/skills/ui/ui-core/kg-viewer.md`. Its strings: `cat-harness/scripts/kg-viewer-strings.ts`, and `cat-harness/translations/{ar,es,fr,ru,zh}/kg-viewer.po`.
- It is **not** a just-the-docs page. It is one standalone HTML file with no dependencies, so it has no sidebar, no harness dividers, and no "▾ Folio" handle.

**Drawn from a real render.** I generated the page and the JSON-LD locally (`kg-export.ts --out`, `kg-viewer.ts --out`, both in a scratch directory), served them over HTTP, and drove the page in Chromium at 1280 × 800 and 390 × 844. That covered the initial load, the Tool facet, a Tool node (`discussion`), and a search for and selection of the Skill `wireframe-design-review`.

## Who it is for, and what they need to do

From the skill: *"making that document legible to a person."* It answers the questions people arrive with:
- *What is this node?* A detail panel with every property.
- *What does it point at?* Edges rendered as controls you can follow.
- *What points at it?* Back-links, computed at load.
- *What else is of this kind?* Facets, with counts.

It also has to show:
- provenance: commit, dirty flag, and preview state
- `undeclaredTerms`, `danglingLinks` and `problems`
- three states: loaded, empty, and could-not-fetch
- the boundary of the translation

It must not draw the whole graph as a hairball. A one-hop neighbourhood diagram, capped, is allowed.

- **Reader:** anyone checking what this instance declares — a maintainer, a reviewer or an agent.
- **Tasks:**
  - filter by kind and subgraph
  - search
  - open a node
  - follow its edges and back-links
  - see where the document came from

## Observed on main (edf3a89+)

Web (1280), in reading order:
1. A "Skip to results" link, which becomes visible on focus.
2. **Header.**
   - "cat-harness — knowledge graph"
   - a meta line: "2361 nodes · commit e112deae · tree dirty · 2026-09-23 09:20:45Z · JSON-LD · source commit"
   - the language group is present but hidden (no language offered)
3. **Three columns** (grid `210px 1fr 1.15fr`):
   - **Kind** facets, 15 with counts (All 2361, SequenceFlow 817 … Convention 2), and **Subgraph** facets, 31 unfiltered.
   - **Nodes:** a search field and a list of name plus kind, in document order.
   - **Detail:** "Select a node." until one is chosen. Then the title, the IRI, and a property table in which link-valued properties are links and nested objects collapse behind ▸. Then "← referenced by" back-links, then the one-hop neighbourhood SVG with labels cut at 26 characters.

Mobile (390), below the 860 px breakpoint the grid is a single column. From the top: header, Kind, Subgraph, Nodes, Detail.

## Findings

1. **The page scrolls sideways at phone width on first load.** Measured: `scrollWidth` 606 against a 390 viewport before any facet is chosen, and the Kind and Subgraph count badges render off-screen. After choosing a kind (Tool), the track fits again. The single grid track is sized by content (a long list row or facet), not clamped to the viewport.
2. **On mobile the detail is below the whole list.** The order is Kind (15), Subgraph (up to 31), Nodes (a nested scroll box, `max-height: 72vh`), then Detail. With Tool chosen, tapping the first row (`discussion`) put its detail about 630 px further down, below the node list, in a full-page capture 2,063 px tall. Nothing scrolls to it visually. On a phone a swipe inside the 72vh list scrolls the list, not the page, so the reader has to find the edge of the box to get past it. The detail region is `aria-live`, so a screen reader hears it, but a sighted touch reader does not see it.
3. **"No links to or from this node." sits directly under a link.** On Tool `discussion`, `satisfies` renders `skill/discussion` as a followable link, and the next line says the node has no links. The target is `…/bootstrap/bootstrap.jsonld#skill/discussion`, a node in another document. So it is neither a local edge nor listed as dangling, and the short label hides that it leaves this graph.
4. **Two kinds of link look different, and nothing says why.** An IRI outside the document is a plain `<a href>` in the browser's default blue (`kg-viewer.ts` line 925). An edge inside the document is a green in-page button. The styling difference is the only signal that one of them leaves the graph, or the site, and there is no text or icon saying so. The difference in colour is not a contrast failure.
5. **A long list with no alphabetical order.** With All selected, the Nodes list is 2,361 rows in document order (SequenceFlow and ProcessNode together are 1,594 of them). Search is the only practical way in, and the facet counts are the only overview.
6. **Neighbourhood labels are cut to 26 characters**, for example "Produce >= 2 candidates, w" and "Mechanical checks, both vi", and on web the labels crowd the edges of the diagram. The full name is in each neighbour's accessible name and in the back-link list above it, so the cut is visual only.
7. **The language switcher never appears.** `.po` catalogues exist for ar, es, fr, ru and zh, but the group stays `hidden`. The skill says *"offer only what the page can show"*, and all five catalogues have 0 translated `msgstr` entries, so `LOCALES` holds only English and `drawLangs` hides the group. This is correct behaviour, but the translation-boundary note the skill requires never gets a chance to show.
8. **No link back to the docs site.** The page is reached from the docs navbar's ⌘ icon, but it carries none of that chrome and no "back to site" link. Returning depends on the browser's Back button.

## Update, 2026-10-02: findings re-measured and worked (bean `yhcq`, issue #1838)

Re-measured on a local build of `main` cf3e62487, with the viewer generated by `kg-viewer.ts --out <site>/cat-harness/index.html` as `docs-site.yml` does, at 1280×800 and 390×844. Pictures in `rendered-2026-10-02/`. The as-is drawing above is NOT re-drawn.

1. **No longer holds.** At 390 before any facet, `scrollWidth` is 390 and `main` is `390px`. The grid track is clamped now.
2. **Fixed.** Below 860 px, selecting a node scrolls `#detail` into view and focuses it. Measured with the Tool facet and the first row: detail top at 101 px with focus inside, against 1,028 px with no focus before.
3. **Fixed.** A node whose only links lead into another graph document now reads "No links to or from other nodes in this graph. The links above lead out of it."
4. **Fixed.** Every outbound `<a>` in the detail table carries a ↗. A link-valued property whose target is not a node here also says "(in another graph)", so `satisfies skill/discussion` no longer reads as a local edge.
5. **Fixed.** The node list sorts by the shown name, ignoring leading punctuation, with the id as a tie-break.
6. **Fixed.** Neighbour labels wrap to two lines of about 24 characters, with an ellipsis only when two lines cannot hold the name ("Produce >= 2 candidates, / web + mobile").
7. **Still holds, by design.** All five `.po` catalogues have 0 translated entries, so the switcher correctly offers nothing. The three new strings are added to each catalogue as empty stubs. This needs translation work, not a viewer change, and is an open question on the PR.
8. **Fixed.** A "← Docs site" link (`../`) at the top, translated with the rest of the chrome.

## Update, 2026-10-02 (later): finding 7 — the switcher is shown, disabled (bean `w6fu`, issue #1838)

The owner ruled on #1839's question 2: **show the switcher, disabled**, so readers can see translations are planned. Finding 7 is now **fixed** by that ruling rather than held by design.

- Every locale whose `kg-viewer.po` exists and translates nothing is drawn as a dashed, dimmed button in its own language, after English (`switcher-after-*.png`; `switcher-before-*.png` shows the hidden switcher). Measured on the branch build: 5 planned buttons plus English, 32 px tall, `scrollWidth` 1280 and 390.
- A planned button carries `aria-disabled="true"` rather than `disabled`, so it stays in the tab order, and `aria-describedby` points at the visible reason "Translations coming".
- That reason is a `<details>` toggle. It opens on tap, Enter or Space, and pressing a planned language opens it too and moves focus to it (`switcher-after-*-reason-open.png`). The sentence it opens names the planned languages and says the page is shown in English until a translation is ready. There is no hover-only tooltip.
- Which list a language is in is read from the catalogue's contents when the page is generated. A catalogue's first translated string therefore makes its button a real choice with no code change. This is pinned by a unit test that writes a catalogue and fills it, and by the fixture page.
