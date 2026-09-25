---
# folio-assistant-huiu
title: 'DUBLIN CORE: a .ts record type in cat-harness, fully worked for the three IRIS examples'
status: completed
type: task
priority: high
created_at: 2026-09-20T08:01:40Z
updated_at: 2026-09-20T18:24:21Z
parent: folio-assistant-kupb
---

Owner: 'break up working bits (like .ts record for dublin core) etc. fully worked for the three examples.'

WHERE IT LIVES IS THE DECISION, and it is not who-iris. Dublin Core is an ISO standard (15836) and DSpace is a platform; neither is WHO-specific. Owner, same message: 'mionimal tools in who specific stuff.' So `schemas/dublin-core.ts` is a cat-harness node and `who-iris/` holds the three RECORDS plus a skill saying how IRIS uses it.

QUALIFIED, not simple. The measured record uses element.qualifier form throughout (`dc.date.accessioned`, `dc.identifier.govdoc`, `dc.subject.mesh`, `dc.description.abstract`), REPEATS four elements (two accessioned, two available, two uri, two mesh) and carries a per-field LANGUAGE qualifier. A flat Record<string,string> loses all three facts. The type must be repeatable-valued and language-tagged or it cannot round-trip the one record we actually have.

## Done when
- `schemas/dublin-core.ts` exists, `@graphNode schema`, with a Zod schema and a JSON-LD projection.
- All three library entries carry a worked record that validates.
- A test asserts the two-`dc.identifier.uri` and two-`dc.subject.mesh` cases round-trip.

## Closed 2026-09-20 — with one divergence, recorded rather than glossed

**The module is at `folio-assistant-core/schemas/dublin-core.ts`, not
`cat-harness/schemas/`.** The bean named cat-harness because
`folio-assistant-core` did not exist when it was written. The bean's actual
*reasoning* — "Dublin Core is ISO 15836 and DSpace is a platform; neither is
WHO-specific, so it is not `who-iris`" — is satisfied and in fact sharpened:
the content layer's own `AGENTS.md` states the rule as *"a schema describing
what a folio HOLDS, where it CAME FROM ... belongs here"*. A metadata record is
exactly that. The file's header still said "Why this is in cat-harness"; fixed
in the same change.

Against the three clauses:

- **Exists, `@graphNode schema`, Zod schema** — was already true on the branch.
- **All three library entries carry a worked record that validates** —
  `check:catalogue` green: 12 nodes, 9 referenced / 3 materialized / 0 unknown.
- **A JSON-LD projection** — **was missing**, and is what this change adds.

### What the projection had to get right

The obvious mapping — every `dc.identifier.*` onto `dcterms:identifier` — is
wrong, and wrong in exactly the way `iris-dspace` R1 and R2 are about. Three
values from three identifier systems collapse into an unordered bag of strings
and "resolve by Handle, treat govdoc as secondary" stops being *expressible*.
Nothing errors; the consumer simply cannot ask. So a **qualified** field gets a
minted IRI keyed on its full `schema.element.qualifier` spelling, and only a
**bare** one of the fifteen simple elements gets the DCMI elements IRI, where
the mapping is exact.

Three further decisions, each with a test:

- **`@list`, not an array.** A JSON-LD array is an unordered set; DSpace stores
  a `place` on repeated fields. A set keeps both `dc.identifier.uri` values
  (R2) but makes "which did the source give first" unanswerable.
- **`@language` is emitted only where asserted** (R4). Both states occur in the
  one record, so this is checked on `dc.title` (tagged) against
  `dc.contributor.author` and `dc.date.issued` (untagged).
- **`@id` is NOT the Handle.** Preferring it is a *judgement*, and this
  module's own header says judgement about which identifier is authoritative
  belongs to the skill, which can say why. `@id` is minted from `rec.id`;
  a caller passes `opts.id` and owns the decision visibly.

### Verification

19 tests, all against the **measured** record rather than an invented fixture,
including the bean's two required round-trips (both `dc.identifier.uri`, both
`dc.subject.mesh` with language tags and authority). Checked by breaking the
code three ways: collapsing qualifiers → 9 fail; defaulting language to `en`
→ 4 fail; plain array instead of `@list` → 8 fail. Restored → 19 pass.

`tsc` and `eslint` clean; `check:schema-nodes`, `kg:schema:check`,
`check:catalogue`, `check:voices` all green.

### Noted in passing, not fixed here

The `_`-prefixed-documentation-key convention is stripped by **four**
independent copies — `role-graph.ts` (generalised), `dak.ts` (hardcoded
`_comment`), `harness-config.ts` (a reviver) and `who-iris/scripts/check-catalogue.ts`
(inline). Pre-existing, found while writing the test loader, and not this
bean's to converge.
