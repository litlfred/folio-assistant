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

## Thin artefact pages (`--thin`)

The owner, 2026-10-11, option A: *"tiny html w/ dynamic load from json(ld)
KG"*. `gen-ig-pages.ts --thin` writes each artefact page as a thin shell
rather than a folio page. The shell is cat-harness-tools' `thinPageHtml`,
imported and not copied: this layer needs core, which sits above
cat-harness-tools.

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
- **Only artefact pages change.** IG API, JSON-view and tab pages stay full
  pages. Without the flag nothing changes, so an IG opts in by passing it.
- In an IG site the docs root is the site root, so `--compiled-data` is
  `ast-data`. With `../ast-data`, every resource link points one level above
  the site.

## What this does not replace

The Publisher still runs. This skill is about **where pages are rendered**, not
about whether the IG is built: validation, dependency resolution and terminology
expansion are the Publisher's and are not reproducible from cached output. The
phased reduction of the Publisher to AST + QA is bean `kn0t`; until it lands,
assume a full build.
