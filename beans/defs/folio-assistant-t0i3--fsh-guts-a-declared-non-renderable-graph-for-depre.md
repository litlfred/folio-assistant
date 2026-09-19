---
# folio-assistant-t0i3
title: 'FSH-GUTS: a declared non-renderable graph for deprecated and throwaway content'
status: in-progress
type: feature
priority: high
created_at: 2026-09-19T10:48:00Z
updated_at: 2026-09-19T12:43:12Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-19:

> do not pollute the KG with SDLC churn.... if you need to keep it, make a
> folder called fsh-guts/ that you can put structured content in but that does
> not enter into main render pipeline. [...] it is the trashcan that does not
> get rendered but can where deprecated, throwaway stuff goes. [...] do not
> delete unless explicit confirm. goes to fsh-guts. jsonld accessible via
> <base-url>/fsh-guts.jsonld

## What it is

A declared graph kind whose defining property is **`renderable: false` and
meant**. Every other non-renderable kind here is a graph a tool reads;
`fsh-guts` is the one that exists so content can be KEPT WITHOUT BEING
PUBLISHED. It is addressable, exported and greppable, and it is not on the
site.

Three things it holds: deprecated content, throwaway structured content, and
**anything that would otherwise be deleted**.

## Why the delete rule needs a destination

`AGENTS.md` already says never delete a bean — scrap it, with reasons,
because "a scrapped bean records that something was considered and rejected,
which is what stops the next agent re-entering the same dead end; a deleted
one leaves a sibling unable to tell abandonment from accident."

That argument was only ever written down for beans. It is general, and until
now there was nowhere for the general case to go: an agent deleting a page, a
diagram or a script had only `rm`. **`fsh-guts` is the destination that makes
the rule enforceable for everything else.** Delete becomes relocate, and
relocate is reversible.

## The name

`fsh-guts`, exactly as the owner typed it, confirmed after I raised the
collision. **`.fsh` is FHIR Shorthand in this codebase** — `schemas/dak.ts`,
`jsonld.ts`, `translation-tools.ts`, `block-qa.ts` and one schema JSON all
carry it, and the WHO SMART folios this platform targets are full of `.fsh`
files. Recorded here so the next agent meets the overlap as a known fact
rather than rediscovering it and proposing a rename.

## Done when

- [x] `fsh-guts` is a registered graph kind, `renderable: false`, and the
      site build demonstrably skips it — a test, not an assumption
- [ ] `<base>/fsh-guts.jsonld` is exported alongside the other renderings
- [x] the four existing proposals are moved into it
- [x] `docs/` carries no design proposal — the directory no longer exists

## Not in this bean

The viewer (dead fish icon, counter, dialog) is its own bean — it is UI work
with a different shape and should not hold up the store.

## Render exclusion is now checked, not reasoned

`scripts/tests/fsh-guts-not-rendered.test.ts`. The earlier claim was an
argument — root directory, Jekyll source is `docs/<stub>`, therefore safe —
and that is the kind of reasoning that stops being true silently. **The site
root already moved once this month** (`x4a6`, `docs/` to `docs/<stub>`);
a future move putting the two in one tree would have republished the
trashcan with nothing complaining.

Six assertions, and two of them exist so the suite cannot pass vacuously:
that the directory exists at all, and that at least one workflow still
declares a Jekyll `source:` for the regex to find. Without those, a
renamed workflow key would make every other assertion pass over an empty
list — the `pzdv` shape.

**Proven to fail:** copied `fsh-guts/` into `docs/folio-assistant/` and
both containment assertions fired; removed it and all six pass.

Two further assertions cover the store's own contract: every node declares
`$schema: folio-fsh-guts/v1`, and every moved node records `movedFrom`.
The second is what stops a node here being an orphan.

Remaining: `<base>/fsh-guts.jsonld`. Not done in this pass.


---

**Parented to `zzmr` (KG: structure, declaration and publication),
2026-09-19.** Exact fit rather than a convenient one: this bean IS a declared
graph kind plus the `<base>/fsh-guts.jsonld` endpoint that publishes it, and
those are the epic's two stated subjects. Its three UI children (`7vhe`,
`d1r6`, `4kj4`) moved to `o3xy` at the same time, since a feature cannot
parent a feature; each records its dependency on this bean in prose.


## `<base>/fsh-guts.jsonld` exists (commit `8d1c8f27`)

`scripts/fsh-guts-export.ts` → published by `docs-site.yml`, with the `.json`
alias every rendering here needs because Pages serves `.jsonld` as
octet-stream. 5 nodes from the committed corpus.

**A separate document, not a subgraph** — folding these nodes into the main
export would have undone the strip in one step. Reachable by name and by no
edge; a test asserts the main graph still contains zero `fsh-guts` mentions.

**Logs excluded by DECLARATION.** `.gitignore` keeping them off a CI machine
is a property of the build, not of the export. Verified by writing a real log
entry into the tree and re-exporting.

### Two gates caught me

- `schemas/fsh-guts.ts` is emitted as a Schema node, so the published graph
  named the trashcan again. `isPublishedSchemaModule` is the **fourth** strip
  site; the gap was latent from the day the strip was written.
- `ns:check` refused four terms, one of which I had minted where the main
  export maps to `rdfs:label`.

### Also, and worth knowing

`fsh-guts` summaries use `summary: >-`, and `agent-memory.ts`'s parser has no
block-scalar support — it would have read every summary as the literal `>-`
and dropped the prose. Extracted to `schemas/front-matter.ts` rather than
writing a second hand-rolled YAML parser.

### What remains on this bean

Nothing in the store itself. `7vhe` (the dead-fish viewer) now has a document
to read, which was the blocker.
