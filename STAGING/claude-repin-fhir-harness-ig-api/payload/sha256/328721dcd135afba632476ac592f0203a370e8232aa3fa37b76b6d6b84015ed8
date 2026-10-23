---
name: ig-render-jekyll
graph-typologies:
  - ig-pages
  - ig-artifact-jsonld
description: >
  Rendering a FHIR IG's content through the just-the-docs pipeline instead of
  mounting the IG Publisher's finished HTML — the JSON-only representation
  contract, navigation derived from sushi-config.yaml, and the LHS rail. Read
  before adding a representation, a menu entry, or a page kind.
---

# ig-render-jekyll

> Skill id: `ig-render-jekyll` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Beans `jut3`, `kn0t`

Render an IG's pages as **folio pages** — markdown with front matter, through
Jekyll and just-the-docs — populated from the Publisher's structured output,
rather than copying the Publisher's finished HTML into place.

**Whether an IG repository gets this rendering at all is the owner's call,
asked when the repository is adopted, default yes.** The question, and the
manual-only workflow template it installs, are in
[`ig-build-pipeline`](ig-build-pipeline.md) §"Who starts a build".

## Why, in one property

Mounted HTML is **opaque to everything the harness does**. It carries no front
matter, so the navbar, the language bar, the QA badges and the translation
surface all stop at its edge. Rendering through the pipeline makes an IG page an
ordinary folio page and those surfaces reach it for free.

That is not a claim about looks. Bean `hw9g` exists only because a mounted page
got no sidebar, and it was resolved by injecting a rail into HTML that had no
business needing one.

## The three contracts

### 1. JSON only

The render path takes **JSON**, wrapped in JSON-LD / JSON Schema. Not XML, not
Turtle.

The Publisher emits all three per resource. Taking one is a decision, not an
omission: three serialisations of one resource are three chances to disagree
about what the resource says, and the JSON-LD wrapper is what carries the
semantics the other two were being kept for. An instance that genuinely needs
RDF gets it by projecting the JSON-LD, not by shipping the Publisher's `.ttl`.

**Record a refusal rather than silently dropping.** A representation that
arrives and is not taken is reported, so "this IG publishes no Turtle" and "we
ignored its Turtle" stay distinguishable.

**Not linked either.** Owner, 2026-10-23: *"excise XML and ttl everywhere for
now"*. The site does not link the Publisher's `.xml` or `.ttl` copy of a
resource. An artefact's JSON-LD node carries only its JSON encodings, and the
`site.data` artefact variables carry only `url.json`. The refusal record still
counts what each IG published in those forms, so the excision stays visible.

### 2. Navigation is derived, never authored

`sushi-config.yaml` already carries both maps the site needs:

- `pages:` — an **ordered map** of source file to title. That is the page order.
- `menu:` — the grouping, including nested subsections.

Derive the navigation from them. Do not hand-author a nav file, and do not write
entries back into `sushi-config.yaml` to make them visible — that is what
an overlay's pre-processing may do, and it is a round trip through the tool
being removed.

When the config names a page that does not exist, that is a finding, not a
reason to create a placeholder.

### 3. LHS rail, and the theme is captured rather than replaced

Navigation goes in the **left-hand rail**, not the FHIR IG's top bar. The rest
of the IG theme — its CSS, its typography, its resource-page furniture — is
**captured into the theme layer** rather than discarded: the goal is an IG that
reads like an IG, in a shell that behaves like the rest of the site.

Two mechanisms not to conflate: which side the nav is on is a **layout**
decision made once, and what the nav contains is **derived per build**. A change
to one is not licence to change the other.

## Where the variables come from

`generate_smart_liquid.py` in the WHO build already computes
`IG metadata → Liquid variables` from `output/`, naming them
`smart__<ResourceType>__<id>__<category>__<key>` across `url__canonical`,
`url__page`, `url__json`, `text__display`, `link__html` and `elements__<key>`.

**Lift that, do not redesign it.** It is aimed at the Publisher's own Jekyll and
needs re-pointing, which is a smaller change than it looks and is phase P0 of
`kn0t`. Its one defect — the documentation page it writes is processed *on the
next build*, so the variable surface takes two builds to converge — goes away
when variables are computed and consumed in one pass.

Naming: the lifted variables are **not** `smart__`-prefixed at this layer. That
prefix is WHO's, and this layer does not know about WHO.

## What parity means, and what it does not

Parity is a **checklist of asset types and page kinds**, stated before MVP is
declared, not an impression formed by looking at a page. The ceiling is a data
limit rather than an effort one: a page kind whose source data the Publisher does
not emit cannot be rendered at any effort, and belongs on the AST ask rather
than on the parity list.

Declaring MVP against the checklist is the owner's call, not this skill's.

## Thin pages, the default (`--full-pages` to opt out)

The owner, 2026-10-11, option A: *"tiny html w/ dynamic load from json(ld)
KG"*; and 2026-10-12: *"make thin default"*. Every page of an IG site is now
thin unless a build asks for the old pages with `--full-pages`. The shell is
cat-harness-tools' `thinPageHtml`, imported and not copied: this layer needs
core, which sits above cat-harness-tools.

### Artefact pages (`gen-ig-pages.ts`)

- **The address does not move.** The page stays at `artifact/<Type>-<id>.html`
  and names that file as `rel="canonical"`. The IG's artifacts page, the
  narrative's links and the footer's reading order all still land.
- **The asset is a JSON-LD node.** The node, `artifact/<Type>-<id>.jsonld`
  with a `.json` twin, is written by `ig-artifact-jsonld.ts` from the index.
  It uses the FHIR RDF class, dcterms, schema.org and PROV, and mints nothing.
  It is kind `ig-artifact-jsonld`, and its QA is
  `ig-artifact-jsonld.ts check` over the built site. The page names the node
  as `alternate`, and the node names no rendering.
- **One shared renderer.** `assets/ig-artifact.js` fetches the node, then
  the resource the node names as a local copy. It draws the description,
  facts and identity table, the elements, concepts or includes, and then
  hands the narrative and JSON to `ast-resource.js`. The page itself carries
  only its title, its key and a `<noscript>` link to the node and the
  resource.
- **The rail is linked.** The page declares `folio-navbar: linked`, and the
  build's rail pass (`rail-standalone-pages.ts`) links the rail's style and
  scripts instead of inlining them. Measured on the iHRIS 5 IG (182
  artefacts): 168 KB per full page, about 5.6 KB per railed thin page.
- **The tab views are thin pages too.** Owner, 2026-10-14, answering
  whether the IG Publisher's per-artefact tab views are rendered: *"3. Render
  them too"*. This supersedes "IG API, JSON-view and tab pages stay full
  pages". Wherever the site serves the artefact's JSON, its views are written
  beside its page under `artifact/`. That JSON is either a compiled copy
  (`--compiled-data`, which `ig-site:compose` passes as `ast-data`: the
  AST's copy) or the Publisher's own `<Type>-<id>.json` carried as data
  (`--publisher-data <dir>`).
  Each view keeps the Publisher's file name:
  - `-definitions`: the element table, from the snapshot, with the
    differential's elements marked;
  - `-mappings`: the `mapping` declarations, each with the elements that map
    to it;
  - the JSON view, `.profile.json` for a StructureDefinition and `.json` for
    anything else, drawn by `ast-resource.js` (`data-ast-view="json"`);
  - `-examples`: for every StructureDefinition, listing from the index node
    the instances that claim it in their `meta.profile` (see below).

  Each is the same shell (`thinArtifactView`) and the same renderer
  (`assets/ig-artifact.js`, the config's `view`). The artefact's page links
  them in a tab bar of plain links. The narrative's links to those file
  names are relinked the same way as its links to the artefact pages. A full
  tab page at the same address is replaced. The change history, testing,
  XML and Turtle views are not rendered, and none of them is published. The
  IG API view pages stay full pages.
- **Every profile gets its examples view** (owner, 2026-10-14: *"1a"*). Each
  StructureDefinition gets `-examples`, as the Publisher writes it. Where no
  instance of the IG claims the profile, the page says there are no examples.
- **Nothing under `comparison-v*/` is published** (owner, 2026-10-14:
  *"2a"*). The Publisher's version comparisons are not rendered, and
  `ig-site:publisher-pages` copies none of their files: it serves the AST's
  data and reads no Publisher output at all.
- In an IG site the docs root is the site root, so `--compiled-data` is
  `ast-data`. With `../ast-data`, every resource link points one level above
  the site.

### The artefact list and the table of contents (`build-ig-site.ts`)

- **One index node.** Beside the artefact nodes, `artifact/index.jsonld`
  (family `folio-ig-artifact-index-jsonld/v1`, same kind) lists every artefact
  once, in the Publisher's order, each entry naming its node and carrying
  only what a list row shows. `check` holds the list to the artefact index
  and each entry to its node: key, class, canonical, profiles and code.
- **`artifacts.html` is a thin shell** over that node, drawn by the same
  renderer: a jump list of categories, a filter, then every category OPEN
  with its table. The owner could not find artefacts behind collapsed
  `<details>`, so nothing is collapsed. Category anchors are the full page's
  (`#artifacts-<slug>`), so old links still land.
- **What a list draws, and what it does not** (owner, 2026-10-12):
  - **The IG's own ImplementationGuide resource is "This guide"**, drawn
    first with its description and a link (`#artifacts-this-guide`), never
    as a "Not categorised" row at the end. It is the guide, not one of its
    artefacts; the toc lists it first the same way.
  - **A category that mixes resource types is sub-headed by type**
    (`#artifacts-<category>-<type>`; the Publisher's "Other": Basic,
    Questionnaire, DocumentReference…), and the jump list counts each type.
  - **A table draws only the columns its rows fill.** No row with a
    description: no Description column. An instance (an artefact with no
    canonical URL) has no description, so the index carries what the
    resource states instead, copied, never looked up: its `meta.profile`
    (`dcterms:conformsTo`, drawn as the profile's last path segment, linked
    when it is an artefact of the same IG) and its `code`
    (`dcterms:subject`). A definition's core profile (`shareablevalueset`)
    is not written: on a phone it cost a column for nothing.
- **`toc.html` is a thin shell.** The IG's own pages (`sushi-config.yaml`
  `pages:`, the landing page first) stay in its HTML: they are the page's
  structure. The artefacts under each category are drawn from the index node.
- Both are written by `stageIgSite` when `StageOptions.artifacts.index` is
  given, which `stage-ig-sites.ts` does unless `--full-pages`. A site whose
  artefact pages were generated with `--full-pages` has no index node, and
  staging it thin is refused rather than shipping two pages that draw nothing.

### The narrative pages (`composeIgSite`)

- The IG's own prose stays in the HTML, rendered by Jekyll as before. What
  changes is the layout: an IG page composed into a host site wears
  `thinIgLayout` (`_layouts/ig-thin-<instance>.html`) instead of the host's
  layout, so none of the host's chrome (the harness bar, the inline SVG
  sprite, the sidebar nav, the inline scripts) is written into it.
- Everything around the prose is LINKED: the shared `assets/ig-artifact.css`,
  the top bar's `assets/ig-topbar.css`, the edit and source-link runtimes as
  `assets/ig-source-links.js`, and the rail through `folio-navbar: linked`.
  The IG's top bar, edit links, footer and its TOC declaration for the rail
  stay. Measured on iHRIS 5: `index.html` 182 KB to about 11 KB.
- What the host's chrome added and the thin page does not: the host's search
  box and the QA badges. The thin page has its own search box instead, and
  the language picker's block (below).

### Search and the language picker (owner, 2026-10-15)

Layout "C", chosen from wireframes: the folio rail stands in for the theme's
side menu (`#site-nav` is dropped by ruling, `IG_DROPPED` in
`stage-local-ig.ts`), and the IG's top bar carries a search box over the
IG's pages and artefacts (`ig-search.ts`):

- `ig-repo-site.ts compose` writes the index, `assets/ig-search.json` (each
  of the IG's own pages, its title and its whole text — owner, 2026-10-15,
  "index whole pages", where it had been cut at 6000 characters;
  each artefact, its title, id, name, key, canonical and description), and
  the client, `assets/ig-search.js`, under the docs root. The index is
  fetched on the first focus of the box, never on page load.
- The box (`form.ig-search`, input `#search-input`) is in the composed
  pages' `.ig-topbar` and in the thin pages' `header.iga-top` (artefact
  pages, their tab views, `artifacts.html`, `toc.html`). It is not `.search`,
  so docs-ui leaves it in the top bar rather than moving it into its band.
  A build that does not write the files (`gen-ig-pages` without `--search`,
  `StageOptions.search` unset) writes no box.
- Every other built page without a box gets one: `publisher-pages` puts a
  bar at the top of its body (`header.ig-search-top`: the IG's name, the
  box, the picker's slot) with its own styles and the client, paths relative
  to the page (`stampSearchBox`, `withSearchBar`). These are the pages a
  layer above or below writes outside the IG's bar, such as an IG API hub
  page and `openapi/index.html` (owner, 2026-10-15). The pass is keyed on
  what a page lacks, never on its name, so this layer names none of them;
  it skips `assets/` and does nothing when the site serves no index. The
  pages' writers are left alone: cat-harness-tools, below, may not import
  the box, and the overlay above would have to repeat it per page kind.
- The language picker sits in the bar, beside the box (owner, 2026-10-15:
  "move the language picker into the IG top bar"). The box is followed by
  an empty `<span data-fa-slot="locale">`; docs-ui fills the first such slot
  on a page and, on a page with none, keeps the picker in its own band. So
  a folio site with no IG bar is unchanged, and this layer knows nothing of
  the picker beyond the place it offers.
- *"what happened to search/language select at top of display window?"*:
  docs-ui draws the language picker from a page's `fa-translation-meta`
  block, which only a theme-laid-out page carried. `publisher-pages` writes
  the platform's block for a page Jekyll never laid out
  (cat-harness-tools `lib/translation-meta.ts`) into every built page that
  lacks one, from the IG checkout's translation declaration. The site
  build's `set-html-lang.ts` reads it afterwards.

The root parity guard (cat-harness-tools `site-parity.ts`) requires both:
a build without the search box or the language block is not published over
a root that had them.

### The opt-out

`gen-ig-pages.ts --full-pages` and `stage-ig-sites.ts --full-pages` build the
pages as before 2026-10-12 (`composeIgSite(…, { fullPages: true })`). Pass
both or neither. `gen-ig-pages --thin` is still accepted and changes nothing;
`--thin --full-pages` is refused. Removing the full path is a separate
decision.

## What this does not replace

**Which AST the pages are drawn from.** An IG repository's site is drawn from
the AST on its cache branch, `cat/fhir-harness/fhir-ast/<package id>`. The
publish refuses one that is not valid for the commit, and is never drawn from
the Publisher's HTML. The cache is refreshed by a Publisher run on a runner.
[`ig-build-pipeline`](ig-build-pipeline.md) §"The AST cache lifecycle" has the
rule and the workflow.

The Publisher still runs. This skill is about **where pages are rendered**, not
about whether the IG is built: validation, dependency resolution and terminology
expansion are the Publisher's and are not reproducible from cached output. The
phased reduction of the Publisher to AST + QA is bean `kn0t`; until it lands,
assume a full build.
