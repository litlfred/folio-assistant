---
# folio-assistant-ehve
title: 'Add the document content type: a paper is a document plus Lean blocks'
status: completed
type: task
priority: normal
created_at: 2026-08-28T14:15:45Z
updated_at: 2026-08-28T15:04:11Z
---


## Landed

`document` content type, on the reading that a paper IS a document plus
Lean-bearing blocks.

**Vocabulary** (`schemas/block-kinds.ts`). A *profile* axis, deliberately
distinct from the adapter axis. Adapters partition kinds into disjoint
namespaces and `adapterForKind` is what QA criterion scoping reads; profiles
nest. Making `document` a third CONTENT_ADAPTER would have made
`adapterForKind` ambiguous on all eight shared kinds and forced a re-scope of
every criterion in the registry — the exact regression `adapter-scoping.test.ts`
exists to prevent. `MATH_BLOCK_KINDS` is written out (7); `DOCUMENT_BLOCK_KINDS`
is its derived complement (8), so a kind added to `BLOCK_KINDS` cannot go
unclassified.

The split's sharpest point is machine-checkable and pinned by a test that reads
`types.ts`: `DefinitionBlock.lean` is **required**, not optional, so a document
folio could not hold one even if the profile allowed it. Every other kind's
`lean` is optional — which is why rule 1 (kind in profile) needed rule 2 (no
`lean` field, no `.lean` sibling): `remark`, `example`, `algorithm` and
`simulator` all declare one, so the type permits what the profile forbids.

**Adapter.** `PaperContentAdapter` was 1042 lines of which sixteen mentioned
Lean, all reading an optional field. Moved to `adapters/document/index.ts` as
`DocumentContentAdapter`; `adapters/paper/index.ts` is now a ~55-line subclass.
Tool registration split into a generic half and an overridable content half, so
a subclass cannot forget `registerDepsTools` and its three siblings.

**Render.** `content/pipeline/render-markdown.ts` — a separate *assembler*, not
a second renderer to keep in sync with `render-latex.ts`. Block `.md` is already
Markdown, so routing it through the LaTeX translator and back would only lose
information. Shares inputs with the LaTeX path and nothing else.

**Enforcement.** `content/pipeline/profile-check.ts`, on every
`content_validate`. Catches what schema validation structurally cannot: a
`theorem` is a valid `theorem` in any folio, and `constraints.ts` cannot read
`folio.config.json`.

### The bug the tool-surface audit found

Registering the shared tool modules wholesale gave a document folio 21 tools
that could only ever report clean — `lean_build`, `content_build`,
`proof_status`, ten `.tex`/`.lean` audits. None would *error*; each would find
nothing and say so. Split render/audit/QA/build/transform into halves. Verified
over the wire: document 34, paper 55, document ⊆ paper, and nothing the paper
adapter offered before this branch is gone.

Rule for classifying a new tool, written where the tables are: **if it reads a
`.tex` file, a `.lean` file, or a kind in `MATH_BLOCK_KINDS`, it is paper-only.**

### Deliberately not done

**No `recommendation` block kind.** It is the one vocabulary item an L1 policy
folio actually wants, and `document-intake.md` has been papering over its
absence by mapping recommendations onto `definition` — which cannot validate in
a document folio, since `definition.lean` is required. Adding a real kind means
a builder, a Zod schema, a label prefix, viewer registration, constraint rows,
QA criteria and the exhaustiveness proof: ~30 files. Half-doing it alongside
this would have been worse than the honest gap.

The interim carrier is a labelled, titled `prose` block —
`skills/folio-document-adapter/normative-statements.md` states the convention
and its limits, and `document-intake.md` now carries the correction. A `prose`
block converts to a `recommendation` block by changing one builder call, so
nothing authored now is wasted. **Follow-up bean worth opening if a real L1
folio starts.**

Gates: 1107 pass / 0 fail, tsc clean, eslint clean, render:bpmn:check 7/7,
check:workflow-policy 2 legal relaxations, validate-skills 73/0,
gen:jsonld:check clean, gen-schema-docs + gen-skill-docs no diff.
