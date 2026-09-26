---
# folio-assistant-55ao
title: Add a first-class `recommendation` block kind for document folios
status: todo
type: task
priority: normal
created_at: 2026-08-28T15:04:51Z
updated_at: 2026-09-23T22:39:31Z
parent: folio-assistant-0lmb
---


Split out of `ehve`, which added the `document` content type and deliberately
stopped short of this.

## Why

An L1 health-policy guidance note exists to state **recommendations**. A
recommendation is the block readers cite, implementers trace to, and reviewers
sign off individually — it wants a label, a stable identity and a place in the
`uses[]` graph, which is everything a `theorem` has. It is emphatically not a
theorem: nothing proves it, and its authority is the issuing body's.

There is no kind for it, and the repo has been papering over that.
`document-intake.md` maps "Recommendation (numbered, boxed)" onto `definition`
and "Good-practice statement" onto `proposition`. Both are **math** kinds, and
`DefinitionBlock.lean` is *required* — so in a document folio the first mapping
does not merely read oddly, it **cannot validate at all**. `ehve` corrected that
file in place and pointed it at the interim convention; this bean is the real
fix.

## Interim state (works, so this is not urgent)

A labelled, titled `prose` block. `skills/folio-document-adapter/normative-statements.md`
states the convention: one statement per block, strength stated in the prose
(nothing structural encodes it), published number kept out of the label because
numbers are renumbered between editions and the label must survive that.

Structurally that is already correct — a titled, labelled, individually
reviewable node in the editorial graph. What it misses is a kind name that says
what it is, and therefore any criterion that could check it. **A `prose` block
converts by changing one builder call**, so content authored under the interim
convention is not wasted.

## What it costs

~30 files, from grepping `conjecture` across the repo. A new authorable kind is
not a one-line addition:

- `schemas/block-kinds.ts` — `BLOCK_KINDS`, and the `DOCUMENT_BLOCK_KINDS`
  derivation picks it up automatically (it is the complement of
  `MATH_BLOCK_KINDS`), which is the one part that is already right.
- `schemas/types.ts` — the `Block` union member, plus the compile-time
  exhaustiveness proof against `BLOCK_KINDS`.
- `schemas/builders.ts`, `schemas/constraints.ts` (Zod + `appliesTo` rows +
  `KNOWN_LABEL_PREFIXES`), `schemas/jsonld.ts` (`KIND_PREFIXES`),
  `schemas/block-qa.ts`.
- `src/blocks/registry.ts` (viewer), `content/pipeline/render-latex.ts`,
  `content/pipeline/render-markdown.ts` (`KIND_HEADING`),
  `content/pipeline/qa-criteria-registry.ts`, `generate-index.ts`,
  `block-module.ts`, and the several sweeps that switch on kind.

## Design questions to settle first

1. **Label prefix.** `rec:` is the obvious candidate and does not collide with
   the 17 existing prefixes. But the interim convention deliberately says the
   *folio* picks its own — a standards body may have its own grammar. Decide
   whether the platform reserves one or keeps it folio-chosen.
2. **Does it carry `strength` as a field?** Today it is prose. A typed field
   (`must` / `should` / `may` / good-practice) makes it checkable, but the
   grading taxonomy is domain-specific — WHO's GRADE is not IETF's RFC 2119.
   A free-text `grading` beside a small closed `force` enum is what
   `schemas/skills/normative-statements/input.schema.json` already proposes;
   that schema is the design sketch to start from.
3. **Its relation to the DAK side.** `dak-blocks.ts` has `realises`, described
   as "the L1 end of every `realises` edge", and `health-intervention` was added
   as the L1 anchor. A `recommendation` kind in the paper/document adapter and
   `health-intervention` in the DAK adapter are two representations of the same
   thing at different layers — settle whether they relate, and how, before
   minting a second vocabulary for it.

## Do not start this speculatively

It is worth doing when a real L1 folio starts and its authors hit the gap, not
before. The interim carrier works, and question 2 in particular is much easier
to answer against a corpus than in the abstract.

## OWNER'S RULINGS, 2026-09-23 — and a pause on the third

Put as one question each while going through the open beans:

- **Build it, as a block kind plus a skill.** The owner chose "Block kind + skill": a `recommendation` kind in the content model, a skill for authoring one, and a BPMN step where it is drafted and reviewed.
- **Q1, the label prefix: the FOLIO chooses.** The platform reserves none, which keeps the interim convention in `normative-statements.md`. A standards body's grammar is its own.
- **Q2, strength: a reference to a SKOS vocabulary or value set.** It is not a closed enum and not free text. The field names a concept in a declared scheme, so each domain brings its own grading and the check is "resolves in the scheme". **Build on the sibling code-list work:** `claude/magical-archimedes-4qkfxp-codelists` adds `schemas/code-list.ts`, closed code lists authored as nodes and published as a `skos:ConceptScheme` with `notation`, `prefLabel`, `definition` and `dcterms:source`. A strength scheme is one of those. Do not mint a second mechanism.
- **Q3, the relation to the DAK side's `health-intervention`: PAUSED.** The owner said *"needs stakeholder discussion"*.

## Blocked

- **waits on:** a stakeholder decision about how `recommendation` (generic, document adapter) relates to the DAK `health-intervention` (the L1 anchor). The options put were: link without merging, or treat them as one vocabulary. This bean says to settle that before minting a second vocabulary, so the build does not start.
- **since:** 2026-09-23T22:45Z
- **expires:** 14 days, then re-ask the owner whether the discussion has happened.
- **handoff:** Q1 and Q2 are settled above. When Q3 is answered, build in this order: code-list scheme for strength, the block kind (about 30 files, listed above), the skill, then the BPMN step. Also update `content-profiles.md`, which says "deliberately no `recommendation` kind".
