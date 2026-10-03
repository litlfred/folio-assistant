# Tools — as-is intent

## Covers

- Declared visualiser ref: `cat-harness/docs/tools/index.md` (tile `tools`, title "Tools", surfaces `navbar` and `board`, in `cat-harness/docs/_data/harness.json`; `navbar.hrefs` has no `tools` icon, but the Folders list and the C@T Harness divider link `/tools/`).
- Generator: `cat-harness/scripts/gen-tools-viz.ts` (graph kind `tools`, page location read from the `coverage.visualiser` of the `tools` directory in `cat-harness.json`).
- Rendered by Jekyll with just-the-docs `v0.12.0` (`remote_theme` in `_config.yml`). The page has no `layout:` in its front matter and relies on the github-pages default layout. The chrome comes from `_includes/title.html`, `_includes/nav_footer_custom.html`, `_includes/footer_custom.html`, `assets/js/docs-ui.js` and `assets/css/docs-ui.css`.

I could not build the site here: there is no local just-the-docs, and `litlfred.github.io` is refused at the proxy. So the wireframe is drawn from the committed Markdown, the generator and the chrome's templates, JS and CSS.

## Who it is for, and what they need to do

The page's own description: *"The Tool nodes this instance declares — how each is installed and invoked, and which skill it satisfies."* The generator header gives the purpose: keep **tools and skills separate** (owner, 2026-09-21), and render `satisfies` from the tool side.

- **Reader:** someone (a person, or an agent reading the site) who needs to know which concrete mechanism exercises a skill.
- **Tasks:**
  - find a tool by id or title
  - see how it is invoked (shell / inProcess / mcp / manual) and installed
  - see which skills it satisfies and how many inputs and outputs it has
  - check that every `satisfies` resolves

## What it must show (read off the generator)

- totals: 71 Tool nodes, 52 skills satisfied, 53 shell, 22 MCP
- invocation and installation counts
- the `satisfies` resolution verdict
- one row per tool: id + title, description, invocation tags, satisfied skills, i/o port count

## Observed on main (re-checked against main 0bcf94bd)

Re-checked against the page as regenerated in this checkout. The template, the chrome and the tag colours are unchanged. Only the counts moved: one new Tool, `context-prefixes` (JSON-LD prefix check, satisfies `kg-export`), and `kg-graph-export` now satisfies three skills (`bootstrap-graph-emission`, `bootstrap-graph-publication`, `kg-export`). The drawing is updated to match: invocation shell 53, installation `none` 66, and the verdict "all 52 skills named across 71 tools resolve".

Regions in reading order, web (≥ 800 px, drawn at 1280):
1. **Sidebar strip, 56 px at rest.** It shows marks only:
   - the site mark
   - the action launcher ▦ and the ☰ "Keep navigation open" toggle
   - the icon row: Todos, Beans, Processes, Knowledge graph, More
   - the five instantiated harness dividers as initials: smart-trust, WHO IRIS, Folio Assistant, C@T Harness, Bootstrap
   - ⌂ home, at the bottom

   It opens to 264 px on hover, on focus or with ☰.
2. **"▾ Folio" glass handle.** `position: fixed`, top centre, over the page.
3. **Main header.** The theme's search field (moved there by `docs-ui.js`).
4. **Page title "Tools"** and two framing paragraphs.
5. **Four stat boxes:** 71 / 52 / 53 / 22.
6. **"How they are invoked, and installed":** two small tables.
7. **"Does every `satisfies` name a skill that exists?":** a one-sentence verdict.
8. **"Every tool":** a 71-row, 5-column table.
9. **Footer:**
   - "Open notes (3)", the no-JS todo listing, collapsed by `docs-ui.js`
   - the licence line
   - the build stamp

Mobile (≤ 390):
- The strip is replaced by the theme's top bar: title, ◐ scheme, ⊕ language, ▦ actions, and the theme's ☰ Menu.
- Content runs full width.
- The tool table scrolls sideways inside just-the-docs' table wrapper.

## Findings

1. **No way to find one tool among 71 except page search.** The only way in is a flat alphabetical table. It has no filter by invocation or by skill, and the stat boxes and invocation counts are not links into the rows they count.
2. **Skills and tool ids are not links.** `satisfies` is rendered as `code` text. A reader who wants the skill has to copy the name and search for it. This is the very join the page exists to show.
3. **Invocation tags fail contrast on the default dark scheme.** The page's inline `<style>` sets fixed hex colours: `.tg-shell #0d6e5e`, `.tg-mcp #6b5b95`, `.tg-inproc #1d5fa8`, `.tg-manual #a8430f`. On just-the-docs' dark body (`#27262b`, and `color_scheme: dark` in `_config.yml`), I computed 2.44, 2.54, 2.33 and 2.48 to 1, all at 11.5 px. That is below the 4.5:1 floor. The tag text carries the meaning, so colour is not the only channel, but the text itself is hard to read.
4. **Mobile: the main table is 5 columns wide in a 358 px column.** Below 800 px, "invoked", "satisfies" and "i/o" are off-screen until the reader scrolls the table sideways. Nothing on screen says the table scrolls, and each row is several screens tall because the description column wraps to about 20 characters.
5. **The "▾ Folio" handle overlaps the top of the content column at both widths.** It is fixed at top centre (`.fa-glass-handle`, `min-height: 3.25rem`). At 390 px it sits over the theme's top bar.
6. **"On this page" (4 entries) exists only in the opened sidebar.** At rest the strip hides the page index, so on a page this long the section list is two interactions away.
