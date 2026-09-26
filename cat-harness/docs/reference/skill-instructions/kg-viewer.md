---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Rendering the knowledge graph'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/kg-viewer.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/kg-viewer.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/kg-viewer.md){: .fa-edit-source }

{% raw %}
# Rendering the knowledge graph

`kg-export` serialises the instance's graph to one JSON-LD document. This skill
is the other half of bean `1dfh`: **making that document legible to a person.**
The two are deliberately separate capabilities — serialising is mechanical and
host-agnostic, rendering is a design problem, and posting the result to a host
is a third thing that belongs to the `pages-publish` Tool.

## The page is generated, not committed

The viewer must fetch the graph document, and that document is named after the
repository — `<stub>.jsonld`, never a generic `kg.json`. A committed page would
have to do one of two things, and both are defects this project has already
paid for:

- **Hardcode one instance's stub**, which is the genericity failure `AGENTS.md`
  catalogues — a platform script carrying `quantum-observable-universe` and
  working in exactly one repository.
- **Compose the name at runtime** from the URL or a convention, which is the
  "resolve, do not compose" rule. A consumer should never have to manipulate a
  string to find a document.

So the exporter, which already knows the stub, writes it into the page. The
page resolves nothing.

**It fetches its sibling relative to its own location.** The same bytes work at
`<canonical>/kg/` and at `STAGING/<slug>/kg/` with no configuration, no
`--base-url`, and no build-time branch. A staging build that needed a different
page would be a staging build testing something other than what ships.

## No dependencies, and that is a requirement rather than a preference

No CDN, no framework, no build step — one HTML file.

A page that needs a network fetch to render cannot be opened from a file,
cannot be reviewed offline or from a restricted network, and adds a third party
to the trust boundary of a page whose entire job is to display *this
repository's own data*. The graph is the thing being made trustworthy; loading
it through someone else's script tag is at odds with that.

## Do not draw the whole graph

**The instinct is a force-directed node-link diagram of everything. Resist it.**
Measured on this instance: 1111 nodes and roughly 2000 edges. That renders as a
hairball — it looks like a knowledge graph and answers no question about one,
while costing a layout library and a frame budget.

The questions people actually arrive with are local:

- *What is this node?* → a detail panel with every property.
- *What does it point at?* → edges rendered as controls you can follow.
- *What points at it?* → back-links, **computed at load** rather than published.
  An inverse index stored in the document is a second copy of the edge set that
  can disagree with the first.
- *What else is of this kind?* → facets, with counts from the document's own
  `counts` rather than recounted.

A **one-hop** neighbourhood diagram for the selected node is worth drawing,
because at that scale a picture beats a list. Cap it; a node with two hundred
neighbours is a list, not a diagram.

## Render what the document is missing, in the document's own terms

**The first real consumer of a graph is the right place to surface what the
graph lacks**, and a viewer that quietly displayed everything as though it were
all part of the graph would be hiding exactly what it exists to reveal.

Two things the export reports and the viewer must not swallow:

- **`undeclaredTerms`** — property names absent from the `@context`. Every one
  is *dropped* when the document is processed as the JSON-LD it claims to be.
  It was 34 names and 3583 occurrences on this instance when the viewer was
  written, which is how the gap was found; bean `ovkk` took it to **zero** and
  `kg-export` now exits non-zero rather than publishing a new one. Mark them in
  the detail panel; do not silently show them as ordinary properties. **Keep
  the marking even while the list is empty** — it is the guard that makes the
  next one visible, and a viewer for this instance is a viewer for any
  instance, including one whose export is older or whose context is thinner.
- **`danglingLinks`** and **`problems`** — a link with no target node, and a
  source that could not be read.

## Three states, on the page as everywhere

A document that **could not be fetched** is never drawn as an empty graph. On
screen the two are identical and they mean opposite things: "this instance has
no nodes" versus "I could not read it". Say which. The same applies to a
property that is absent versus one that is present and empty.

## Provenance belongs on the page

The export carries `sourceCommitSha`, `sourceCommitAt`, `sourceTreeDirty` and,
for a preview, a `PreviewGraph` type and a `canonicalDocument` link. Show them.
A reader looking at a staged graph must be able to tell it is staged **from the
data**, not from an injected banner that a JSON file would not carry anyway —
and `sourceTreeDirty` is the difference between a graph a SHA reproduces and
one it does not.

## Translate the chrome from the GENERATOR, never from the page

A generated artefact is not a translation source. Its generator is.

Run an extractor over the emitted HTML and the `.pot` fills with the
generator's OUTPUT: regenerate for any reason — a new node kind, a changed
commit line — and every reference churns while no string has changed, and
every sign-off is invalidated by the regeneration rather than by an edit.

So the viewer's own words live in a **declared table in the source**
(`scripts/kg-viewer-strings.ts`): the English text, which IS the `msgid` as
everywhere else here, plus the translator comment naming where it appears and
what each `{placeholder}` will hold. `bun run translate-kg-viewer --extract`
turns the table into `translations/<locale>/kg-viewer.pot` through the shared
`formatPot`, and the generator reads each `.po` back through the shared
`parsePo` and embeds the catalogues. **There is no inject step**: generating
the page is the injection, and a second artefact would serve nothing.

`--check` separates two things that look alike. **Drift fails**: a `.pot` that
no longer matches the table, a translation that dropped a `{placeholder}`, an
entry for a string the page no longer says. **Coverage only reports**: a string
nobody has translated is the ordinary state of a translation in progress, and
the page falls back to English string by string.

## Say where the translation stops

**Chrome-only translation is half a translation, and the half that is missing
is the half the reader came for.** Node titles, descriptions and property names
arrive in the graph document in whatever language the corpus is written in; no
catalogue in the viewer can reach them.

Draw that boundary **on the page**, in the language the reader chose. A screen
that is two-thirds translated and silent about it is worse than one that states
its edge: the reader cannot tell a missing translation from a corpus that is
simply English, and will read the gap as a defect or as a claim, depending on
which way they guess.

The same rule that governs an unreadable document governs this: three states,
never two.

## A language switcher is a UI control

It is bound by [`ui-accessibility`](ui-accessibility.md) like everything else,
and four things are easy to get wrong:

- **Label each option in ITS OWN language** — Français, العربية, 中文 — and set
  `lang` on the control. That is what a reader scanning for their language
  looks for, it leaves no accessible name to mistranslate, and it is what lets
  a screen reader switch voice.
- **Translate the accessible names too.** A page whose visible text is Spanish
  and whose `aria-label`s are English is a page that is translated for sighted
  readers only, and nothing on screen says so.
- **Announce the change.** The panel is rewritten in place and the reader's
  cursor has not moved.
- **Turn the page, not just the words.** A right-to-left language needs `dir`
  on the document, and the layout has to be checked in it — axe over an RTL
  render catches what an LTR one cannot.

**Do not invent a second locale mechanism.** The docs site already stores the
reader's choice in the `fa-locale` key; read that, let a `lang` query parameter
override it for a shared link, and fall back to the browser's own preference.

**Offer only what the page can show.** A catalogue with nothing translated is
not a language the viewer can render, and listing it would promise a
translation the reader would not get.

## Verifying it

**A rendered artefact is not verified by reading its source.** `AGENTS.md` is
explicit that a human cannot assess a rendering from a description of it; the
same holds for the agent that wrote it. "The HTML looks right" is not evidence
that the document loads, that an edge is clickable, or that a failed fetch says
so.

Drive the real page in a real browser. `test/kg-viewer.e2e.ts` is the worked
example, and it asserts against the *generated* artefacts rather than a fixture,
so a test cannot agree with a stand-in while disagreeing with what ships. It
generates them if absent, so the suite runs from a clean checkout.

**Look at it, too.** Collapsing nested objects behind a disclosure was not a
design decision made in advance — it came from taking a screenshot and seeing
that a Tool's `io`, ~900 characters of JSON rendered inline, pushed `satisfies`
and the neighbourhood diagram off the bottom of the screen. The most
interesting property on the node was the one making the node unreadable, and no
test would have said so.
{% endraw %}
