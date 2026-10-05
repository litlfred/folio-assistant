# External schemas — as-is intent

## Covers

- Declared visualiser ref: `cat-harness/docs/external-schemas/index.md` (tile `external-schemas`, title "External schemas", surfaces `navbar`, `board` and `glass`, href `/external-schemas/`, in `cat-harness/docs/_data/harness.json`).
- Generator: `cat-harness/scripts/gen-external-schemas-viz.ts` (graph kind `external-schema`; page location read from the `coverage.visualiser` of the directory declaring that kind in `cat-harness.json`). It reads the registry through `external-schemas.ts` (`loadSpecs`, `namespacesInUse`) and folio-assistant-core's `undeclaredNamespaces` / `unusedNamespaces`. `--check` reports the committed page current (4 specifications).
- Rendered by Jekyll with just-the-docs `v0.12.0` (`remote_theme` in `_config.yml`, `color_scheme: dark`). The page has no `layout:` in its front matter. The chrome comes from `_includes/title.html`, `_includes/nav_footer_custom.html`, `_includes/footer_custom.html`, `assets/js/docs-ui.js` and `assets/css/docs-ui.css`.

I could not build the site here: there is no local just-the-docs, and the published site is not reachable from this session. So the wireframe is drawn from the committed Markdown, the generator and the chrome's templates, JS and CSS. Nothing below is a measurement of the rendered Jekyll page; the findings are read off the Markdown and the generator, and the mobile behaviour is the theme's (tables scroll sideways inside its table wrapper).

## Who it is for, and what they need to do

The page's own description: *"The specifications this repository depends on — the edition of each, what would move if one bumped, and the terms it actually branches on."* The generator's gap statement: four records, "and no way to see any of it short of opening four JSON files".

- **Reader:** someone about to bump, or asked about, an external specification (BPMN, DD, DCMI, SKOS), and a reviewer checking that the registry still describes the repository.
- **Tasks:**
  - find which edition of a specification is in use, and open it at the authority
  - see what in this repository depends on it (the blast radius of a bump), and whether each declared dependent still exists
  - see which of its terms this repository actually branches on
  - see namespaces used in the corpus but not declared, and declared but not used

## What it must show (read off the generator)

- the "referenced, not held" framing, with the owner's two quotes
- four stat boxes: specifications, operative terms in the graph, declared dependents, dependents that no longer resolve
- "The specifications": one row per spec (title linking to its section, id, authority, edition linking to the spec, `use` with its meaning)
- "Does every declared dependent still exist?": the three `usedBy` states (resolves / not a path / not in this checkout) and a verdict or a table of missing ones
- "Namespaces the corpus uses against the ones it declares": undeclared and unused IRIs, reported either way
- "Each specification": per spec its namespaces, note, dependents with a state tag, and the operative-terms table (or "a determined zero")

## Observed on main (committed Markdown)

Regions in reading order, web (≥ 800 px, drawn at 1280):
1. **Sidebar strip, 56 px at rest** (as on every page: site mark, ☰, the icon row, the harness dividers, ⌂). "On this page" would hold 8 rows (4 `h2` + 4 `h3`) inside the opened sidebar.
2. **"▾ Folio" glass handle**, fixed top centre.
3. **Main header** with the theme's search field.
4. **Page title "External schemas"**, then two framing paragraphs.
5. **Four stat boxes:** **4** specifications · **53** operative terms in the graph · **14** declared dependents · **0** dependents that no longer resolve.
6. **"The specifications":** a 4-column, 4-row table — DCMI Metadata Terms `dcmi-terms` DCMI 2020-01-20 `reads`; Business Process Model and Notation (BPMN) `omg-bpmn-2.0` OMG 2.0 `conforms`; Diagram Definition (DD) `omg-dd-1.0` OMG 1.0 `conforms`; SKOS … Reference `w3c-skos` W3C 2009-08-18 `conforms`.
7. **"Does every declared dependent still exist?":** two paragraphs, then "Every one of the **8** entries spelled as a path resolves in this checkout. **6** name a set or carry a note and were not checked."
8. **"Namespaces the corpus uses against the ones it declares":** **5** IRIs in use; **1 in use and not declared** (`https://litlfred.github.io/folio-assistant/bpmn`); **3 declared and not in use** (`http://purl.org/dc/elements/1.1/`, `http://purl.org/dc/terms/`, `http://www.w3.org/2004/02/skos/core#`).
9. **"Each specification":** four `h3` sections. DCMI: 2 namespaces, a long note, 3 dependents (2 resolve, 1 not a path), 22 operative terms. BPMN: 2 namespaces, note, 3 dependents (all "not a path"), 22 terms. DD: 2 namespaces, note, 2 dependents (both "not a path"), "No operative terms … a determined zero". SKOS: 1 namespace, no note, 6 dependents (all resolve), 9 terms each with a written meaning.
10. **Footer:** "Open notes (3)" (collapsed by `docs-ui.js`), the licence line, the build stamp.

Mobile (≤ 390): the strip is replaced by the theme's top bar (title, ◐, ⊕, ▦, ☰ Menu); content runs full width; the stat boxes wrap two to a row; every table scrolls sideways inside just-the-docs' table wrapper.

## Findings

1. **44 of the 53 operative terms say nothing.** Every DCMI term (22) and every BPMN term (22) reads "derived from the corpus; what this repository does with it is not yet described". The page's third question — "which of its terms this repository branches on" — is answered by 44 rows of the same sentence; only SKOS's 9 terms carry a meaning. The stat box counts them as "operative terms in the graph" without saying so.
2. **The "0 dependents that no longer resolve" box covers 8 of 14.** Six dependents are "not a path" and were not checked, including all three for BPMN and both for DD. The stat grid shows 0 with no hint that the two specifications this repository `conforms` to most directly have no checkable dependent at all; that is only in the prose of region 7.
3. **The namespace check reports DCMI and SKOS as "declared and not in use" by construction.** The in-use set is "read from the BPMN and DMN files themselves", so a namespace used only in `.dc.json` records or JSON-LD exports can never be in use. Three of the page's five declared-namespace findings are this artefact, while the one real gap (`…/folio-assistant/bpmn`, used and undeclared) is a list item mid-page, not in the stat grid.
4. **"Resolves" dependents cannot be opened.** The generator defines *resolves* as "a path in this checkout, openable", but each is rendered as `code` text in a table cell. The reader copies the path to follow it.
5. **Section anchors sit below their headings.** The spec table links to `#dcmi-terms` etc., which are `<a id>` elements placed *after* each `### title`. A jump lands with the heading scrolled just above the viewport (and under the fixed "▾ Folio" handle on top of that).
6. **State tags fail contrast on the default dark scheme.** The page's inline `<style>` fixes `.xs-ok #0d6e5e`, `.xs-na #5b5f66`, `.xs-missing #a8200f` on just-the-docs' dark body `#27262b`: 2.44, 2.34 and 2.06 to 1 at .72 rem. The words carry the state, so colour is not the only channel, but the words are hard to read.
7. **Mobile: the spec table is four columns in a 358 px column.** "edition" and "how it is used" start off-screen, and nothing says the table scrolls. The 22-row term tables are two columns and fit, but each row repeats the same sentence at 390 px, making the DCMI and BPMN sections several screens of it.
8. **The notes are single long paragraphs in capitals for emphasis** ("THE TRANSCRIPTION CAME FIRST AND THAT WAS THE DEFECT", "NO XSD IS HELD"). The DCMI note is about 900 characters in one block.
