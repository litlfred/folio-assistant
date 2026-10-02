---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Dublin Core renderings'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/library/catalogue/dublin-core-renderings.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/library/catalogue/dublin-core-renderings.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/library/catalogue/dublin-core-renderings.md){: .fa-edit-source }

{% raw %}
# Dublin Core renderings

Bean `7eak`. The owner, 2026-09-30: *"do we render the proper xml for dublin
core? it should be in rendering ppiple as skill and tool … and then pushed to
gh-pages"*, and *"(and who-iris should link to json and xml renderings)"*.

| piece | where |
|---|---|
| the mapping (the code this skill governs) | `folio-assistant-core/schemas/dublin-core-render.ts` |
| the script, with `--check` | `folio-assistant-core/scripts/dc-render.ts <instance-root>` |
| the Tool node | `dublin-core-render` in `folio-assistant-core/tools/index.ts` |
| the gate | `bun run dc:render:check` (a step in `code-quality-gates.yml`) |
| the record model it reads | `folio-assistant-core/schemas/dublin-core.ts` (`folio-dublin-core/v1`) |

## Which records get a rendering

**Exactly the records a catalogue ITEM names through `metadataRef`.** That is
the record the item's page describes, so a rendering of it has a page to sit
next to.

- A record that no item names gets no rendering, because it would sit next to
  no page.
- A `metadataRef` that does not resolve is reported by `check:catalogue`, not
  here. That is one finding with one owner.

## Where they go

`<published root>/dublin-core/<stem>.dc.xml` and `<stem>.dc.jsonld`.

- The **published root** is the directory the instance declares with
  `instanceRoot: true`. For who-iris that is `site/`, which is served at
  `/who-iris/`. The mount copies that directory whole, so the renderings are
  published next to the item pages with no extra pipeline step.
- `<stem>` is the record's own filename without `.dc.json`.
- An instance that declares no published root is **refused**, not given a
  guessed one.

The item page links both files, and links them only when they exist. A link to
a rendering that was never written looks exactly like a working one.

## Two renderings, and why the existing projection is not one of them

`dublinCoreToJsonLd` in `dublin-core.ts` is the **lossless** DSpace graph:

- every qualified field goes to a minted `dspace:` predicate;
- every value sits in an `@list`.

Both choices are right for what that projection is for. Both are wrong for
something a stranger reads:

- A DCMI-aware consumer would find no `dcterms:issued`.
- `dcterms:title` would point at an RDF list instead of a literal.

So the renderings are a second projection with a different job, and the first
one is left alone.

### DC XML: qualified DC, per DCMI's XML guidelines

The XML form is **qualified Dublin Core**, following DCMI's *Guidelines for
implementing Dublin Core in XML* (2003-04-02):

- `dc:` and `dcterms:` elements inside one namespaced container (`metadata`,
  in the content layer's DSpace namespace);
- `xml:lang` for a value's language;
- `xsi:type="dcterms:<Scheme>"` for an encoding scheme.

It is **not `oai_dc`**, the simple-DC form an OAI-PMH endpoint serves. That form
needs the OAI namespace and an endpoint, and nobody has asked for either. If
one is wanted, it is a third rendering, not a change to this one.

### JSON-LD: bound to DCMI Terms, following the `linked-data` voice

- The context is **inline**, so nothing is fetched to read the document.
- `@base` sits in that inline context, and only when the item has a Handle.
  The subject `@id` is then the Handle, relative to `https://hdl.handle.net/`.
- A link-valued property is a **term** with `"@type": "@id"` (`memberOf`,
  `authority`), and the document uses the term, never a prefixed key.

## The mapping, and the rule behind each row

One table, `DCTERMS_MAP`, maps the qualified DSpace field name to the DCMI term
it is. Each row records two facts DCMI Metadata Terms (2020-01-20) states about
that term.

**First fact: is the range a literal or a resource?** This comes from reading
the vocabulary, not from the value's shape.

- Agent, Location, LinguisticSystem, and terms DCMI says are "intended to be
  used with non-literal values" are **resources**.
- The record holds a resource's value as text with no IRI. The JSON-LD
  therefore emits a node with the text as `rdf:value`. That is DCMI's own
  "value string" pattern, from *Expressing Dublin Core metadata using RDF*
  (2008).
- Emitting the bare string would make the creator a literal. Minting an IRI
  would invent an address. Both are worse.

**Second fact: which encoding scheme, if any.**

- The scheme is asserted only when the **field name** says it:
  - `uri` → `dcterms:URI`
  - `mesh` → `dcam:memberOf dcterms:MESH`
  - `iso` → `dcterms:RFC4646`
- Dates get `dcterms:W3CDTF` only when the value actually matches W3CDTF.
- A typed value cannot also carry a language tag in JSON-LD. The scheme wins,
  because it says what the string IS. The XML keeps both.

Every value is the record's own string, verbatim and in source order. Repeats
are kept. The record's `_comment` annotations are stripped, as
`check:catalogue` strips them: they are notes for a person, not metadata.

**A field with no DCMI term is not forced onto the nearest one.** Each of the
following is deliberately absent from the table:

| field | why it has no row |
|---|---|
| `dc.date.accessioned` | It is when the repository took the item in. That is not `dateAccepted` ("date of acceptance of the resource"), however close the words are. |
| `dc.identifier.isbn`, `dc.identifier.govdoc` | DCMI defines no scheme for either. Collapsing them onto `dcterms:identifier` would lose the three-identifier-systems distinction that `iris-dspace` R1 exists for. |
| `dc.title.release`, `dc.subject.meshqualifier` | DCMI defines no term for either. |

What happens to such a field depends on the form:

- **JSON-LD:** it keeps the minted predicate `dcPredicate` gives it, so both
  projections agree on every field DCMI does not define.
- **XML:** it is reduced to its DCMI element (the DCMI dumb-down principle),
  with the original field name next to it in a comment.
- **A non-`dc` schema** (`who.relation.languageVersion`) has no DCMI element to
  reduce to. It is listed in a header comment as not expressible. It is never
  silently dropped.

## The gate

`bun run dc:render:check` fails on three things:

- a rendering that is **missing**;
- a rendering that is **stale**, meaning its bytes differ from a fresh render;
- an **orphan**, meaning a file in the directory that no record produces. The
  item it described is gone, but a reader would still find it.

`bun run dc:render` regenerates. Renderings are generated files: never edit
one by hand.

## Changing the mapping

Add or change a row in `DCTERMS_MAP` only with the DCMI term's definition open.
The row's `range` is a claim about that definition. Then:

1. `bun run dc:render`.
2. Commit the regenerated files.
3. Run the tests in `dublin-core-render.test.ts`. They expand the JSON-LD with
   jsonld.js and assert that a resource-ranged term never expands to a bare
   literal.
{% endraw %}
