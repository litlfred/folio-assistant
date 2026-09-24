# Methodologies — as-is intent

## Covers

- Declared visualiser ref: `cat-harness/docs/methodologies/index.md` (tile `methodologies`, title "Methodologies", surfaces `navbar`, `board` and `glass`, href `/methodologies/`, theme `analyst`, in `cat-harness/docs/_data/harness.json`).
- Generator: `cat-harness/scripts/gen-methodologies-viz.ts` (graph kind `methodology`; page location read from the `coverage.visualiser` of the directory declaring that kind in `cat-harness.json`). It does not read the graph itself: the rows come from `check-methodology-evidence.ts` (`methodologyNodes`, `checkMethodologyEvidence`).
- Rendered by Jekyll with just-the-docs `v0.12.0` (`remote_theme` in `_config.yml`, `color_scheme: dark`). The page has no `layout:` in its front matter. The chrome comes from `_includes/title.html`, `_includes/nav_footer_custom.html`, `_includes/footer_custom.html`, `assets/js/docs-ui.js` and `assets/css/docs-ui.css`.

I could not build the site here: there is no local just-the-docs, and the published site is not reachable from this session. So the wireframe is drawn from the Markdown (as regenerated in the working tree), the generator and the chrome's templates, JS and CSS. The findings are read off the Markdown and the generator, not measured on a rendered page; the mobile behaviour is the theme's (tables scroll sideways inside its table wrapper).

## Who it is for, and what they need to do

The page's own description: *"The methodologies this repository has adopted — what each is for, where it came from, and whether the source it rests on is held here."* The generator: `applies-when` "is what a selection question matches against", and without a browsable corpus "an agent picks from by resemblance, which is the failure the skill exists to prevent".

- **Reader:** an agent or person choosing a method for a task (a decision, a responsibility matrix, a UI review), and a reviewer checking a methodology's evidence base.
- **Tasks:**
  - pick the methodology whose `applies-when` matches the situation
  - see which instance declares it (`cat-harness`, `smart-base`, `smart-kg`)
  - see where it came from, and whether the source is held here, only cited, or cited and dangling
  - open the ingested source

## What it must show (read off the generator)

- the framing: a methodology is someone else's named external work; one without an origin is a house process
- four stat boxes: adopted methodologies, with the source held here, cited not ingested, instances declaring the graph
- "Choosing one": one row per node — title (link to its section) and name, `applies-when` cut to 150 characters, an evidence badge (source held / cited, not ingested / citation does not resolve), and the declaring instance
- "Where each one came from": the three states explained, then per node the full applies-when, the origin, and its ingested sources or "No ingested source"
- "Files in the graph that are not methodology nodes", reported either way

## Observed on main (Markdown as regenerated in the working tree)

The committed page (HEAD) listed 9 methodologies and failed `gen-methodologies-viz.ts --check`, because `wiregen` was missing. During this drawing the page was regenerated in the working tree (not by this wireframe): it now lists 10 and `--check` passes. The drawing and the findings follow the regenerated page.

Regions in reading order, web (≥ 800 px, drawn at 1280):
1. **Sidebar strip, 56 px at rest** (as on every page). "On this page" would hold 13 rows (3 `h2` + 10 `h3`) inside the opened sidebar.
2. **"▾ Folio" glass handle**, fixed top centre.
3. **Main header** with the theme's search field.
4. **Page title "Methodologies"**, then two framing paragraphs.
5. **Four stat boxes:** **10** adopted methodologies · **4** with the source held here · **6** cited, not ingested · **3** instance(s) declaring the graph.
6. **"Choosing one":** a paragraph, then a 4-column, 10-row table, alphabetical: DIIG (`smart-base`, cited), DMN (cited), GRADE (`smart-kg`, cited), Hybrid LLM/deterministic (held), Kepner-Tregoe (cited), MADR (cited), RACI (held), RASCI (cited), SWOT (held), WireGen (held). Every `applies when` cell ends in "…".
7. **"Where each one came from":** the three-state paragraph, then ten `h3` sections, each: name — declared by — badge; **Applies when.** (full); **Origin.** (full); then **Ingested sources:** as a list of `library/…` slugs, or **No ingested source.** with a pointer to `literature-search`.
8. **"Files in the graph that are not methodology nodes":** "None — every `.md` in the declared directories carries `$schema: folio-methodology/v1`."
9. **Footer:** "Open notes (3)", the licence line, the build stamp.

Mobile (≤ 390): the strip is replaced by the theme's top bar; content runs full width; the stat boxes wrap two to a row; the "Choosing one" table scrolls sideways inside the theme's table wrapper.

## Findings

1. **DIIG contradicts itself.** Its **Origin** says "Ingested at `smart-base/library/9789240010567-eng/`; every citation below resolves to a section there" (that directory exists), but its badge is "cited, not ingested" and its section ends "No ingested source … nothing in this checkout holds it". `smart-base/methodologies/diig.md` has no `evidence:` front-matter field, so the page's three-state rule reports the source as absent while the prose beside it says it is held.
2. **The column the page says to read first is cut on every row.** All ten `applies when` cells are truncated at 150 characters, often mid-word ("…the budget and the moni…", "…Contextu…", "…who answers for this, wh…"). The full text is several screens down in "Where each one came from".
3. **The MADR cell renders a stray backtick.** The cut falls inside inline code — "Not for the decision METHOD (see \`kepner-tregoe…" — leaving an unclosed backtick, which kramdown prints literally.
4. **Ingested sources are code text, not links.** `library/arxiv-2508.05192v2`, `library/dusengumuremyi-2026-ai-mediated-raci`, the two SWOT slugs and `library/arxiv-2312.07755v1` name library entries, but the reader cannot open them from here. "Source held" means "you can open it from this checkout", yet not from this page.
5. **Section anchors sit below their headings.** The table's links go to `<a id>` elements placed after each `### title`, so a jump lands with the heading just above the viewport.
6. **Badges fail contrast on the default dark scheme.** The inline `<style>` fixes `.mv-ingested #0d6e5e`, `.mv-cited #8a6100`, `.mv-dangling #a8200f` on `#27262b`: 2.44, 2.71 and 2.06 to 1 at .72 rem. The words carry the state, but are hard to read.
7. **Mobile: the "Choosing one" table is four columns in a 358 px column.** "origin held?" and "declared by", the evidence state the page is about, start off-screen, and nothing says the table scrolls.
8. **WireGen's origin points at nothing on this page.** It ends "Section numbers below are the paper's", written for the methodology file's own body; on this page nothing follows it but the sources list.
