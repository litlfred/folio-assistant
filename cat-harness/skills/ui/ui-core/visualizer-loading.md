---
name: visualizer-loading
description: >
  The general strategy for a complex visualizer: the generated page carries
  identity, layout and a pointer, and its bulky or repeated content is fetched
  from the Knowledge Graph in the browser rather than baked into every page.
  What must stay server-side, how to fetch, how to stay equivalent to the
  render being replaced, and how to verify a page whose content is not in its
  HTML. Read before generating any page that shows a KG node's data at length:
  an IG artefact view, a graph viewer, a schema or sidecar view.
---

# Visualizer loading — the page is layout, the graph is fetched

> Skill id: `visualizer-loading` · Package: `ui-core` · Beans `680p`, `s32v`,
> `jut3`

Owner, 2026-10-01, on the just-the-docs IG render: *"other goals of
justthedocs rendering is to reduce the .html bloat.... lots of it can be loaded
client side from the KG"*, and then: *"should be general strategy for complex
visualizers"*.

## The rule

A generated page for a complex visualizer holds three things:

1. **Identity:** the title, description and front matter that navigation,
   search and a link preview read.
2. **Layout:** headings, tabs and links, arranged by a template
   ([`liquid-templates`](liquid-templates.md)).
3. **A pointer:** the KG file the content comes from, resolved by the generator.

The **content** (a sidecar file, a node's properties at length, a table derived
from the graph) is fetched by the browser from the committed KG artefact. It is
never copied into the page.

Each copy is a second answer, free to drift from the first. Copied into a
thousand pages, it is also most of the site's bytes and most of every staging
preview's size (bean `g196`).

[`kg-viewer`](kg-viewer.md) was the first instance: one page that fetches its
sibling graph document and computes back-links at load. This skill is that
pattern made general.

## What stays server-side

Moving content client-side has costs: a reader without JavaScript loses it, a
search index loses it, and so does the first paint. So these stay in the page:

- **What navigation and search need:** title, description, headings, and the
  link labels a reader scans for.
- **The way to reach the data without JavaScript:** a link to the raw file,
  under `<noscript>` if nowhere else. A view that renders nothing without
  scripts must still say where its content is.
- **Anything short and unique to the page.** A one-line value is not bloat, and
  fetching it costs a request to save a few bytes.

Move a block when it is **large or repeated** and **already a KG file**. A
block that would need a new file published just to be fetched is a design
question for the owner, not a default.

## How to fetch

- **Relative to the page's own location**, never via a configured base URL, so
  the same bytes work in production and in a staging preview ([`kg-viewer`](kg-viewer.md)
  §"The page is generated, not committed").
- **One shared loader per visualizer kind**, published once and referenced by
  every page, never inlined in each page. The DAK view pages share
  `assets/dak-view.js`.
- **No dependencies:** no CDN or framework. Same reason as `kg-viewer`: the
  data is this repository's, and a third party in its trust boundary is at
  odds with that.
- **Three states on the page:** loading, loaded, and *could not load*, which
  names the file and the error. A failed fetch that leaves a blank or a
  permanent "Loading…" is the silent-gap defect in another form.

## Stay equivalent to the render you replace

When the page replaces another renderer's page (the IG Publisher's, under the
owner's invariant that every phase renders equivalent to the standard IG
render, bean `jut3`), compute the display **the same way that renderer does**,
and then check it.

The worked case: the Publisher's DAK view page shows its file as
`JSON.stringify(parsed, null, 2)`, not as the file's own bytes. JavaScript
orders integer-like keys first, so for 3 of smart-trust's 33 files the two
differ. Showing the raw bytes would have looked right and been wrong. The
loader now does what the Publisher's page does.

## Verify in a browser, not in the HTML

A static check cannot see fetched content: the built HTML holds only
"Loading…". Verification therefore means loading each page in a browser
(Playwright, with the pre-installed Chromium) and comparing what it
**displays** against the reference, as [`rendered-verification`](../../sdlc/sdlc-core/rendered-verification.md)
requires of any rendered artefact.

Measured 2026-10-01: all 33 DAK view pages, served from a local Jekyll build,
displayed text identical to the Publisher's pages for the same fork build.

## Finding what to move

That is bean `s32v`: a QA review over a built site.

- **The mechanical half** measures per-page bytes, blocks repeated across
  pages, and blocks matching a committed KG file, and writes a QA sidecar.
- **The agentic half** judges each candidate against §"What stays
  server-side".

Repetition is a measurement, but whether a block may leave the page is a
judgement.

## Do not

- **Bake a KG file's text into a page "for now".** That copy is what the next
  person will have to find and remove.
- **Move navigation or search terms client-side** to save bytes. The saving is
  small and the loss is the page being findable.
- **Add a framework to fetch a JSON file.** `fetch` and `textContent` are the
  whole loader.
