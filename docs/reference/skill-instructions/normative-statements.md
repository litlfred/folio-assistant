---
layout: default
title: normative-statements
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-document-adapter/normative-statements.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-document-adapter/normative-statements.md) — do not edit here. Typed contract: [schema reference](../skills/normative-statements.html).

{% raw %}
# normative-statements

Carry a **recommendation, requirement or rule** in a document folio — the
thing an L1 health-policy guidance note, a standard, or a terms-of-reference
document exists to state.

## The problem this addresses

A normative statement is not prose. It is the block readers cite, implementers
trace to, and reviewers sign off individually. It wants a label, a stable
identity, and a place in the dependency graph — everything a `theorem` has,
and nothing a paragraph of `prose` has.

It is also **not a theorem**. Nothing proves it. Its authority is the issuing
body's, not a proof's.

## What to do today

Use a **`prose` block with a label and a title**, and state the normative
force in the first sentence.

```ts
// content/<slug>/<chapter>/rec-cold-chain-audit.ts
import { prose } from "@folio/schemas/builders";

export default prose({
  label: "rec:cold-chain-audit",
  title: "Audit the cold chain quarterly",
  uses: ["rec:scope", "prose:cold-chain-terms"],
});
```

The block's `.md` holds the statement itself, and its label becomes the anchor
every cross-reference targets (`[see](#rec:cold-chain-audit)`).

- `label` — a `rec:`-style prefix of your folio's own choosing, kept
  consistent across the corpus. The platform does not reserve one, so pick it
  once and write it down in the folio's own AGENTS.md.
- `title` — the short form the document's index and any cross-reference will
  show.
- `uses[]` — the blocks a reader must have read to act on this one:
  definitions of terms it uses, the scope statement it sits under, the
  evidence summary it rests on. This is what makes "what else changes if this
  recommendation changes?" answerable.

State the strength explicitly in the prose (*should*, *must*, *is
recommended*, and the grading system the issuing body uses), because nothing
in the block structure encodes it.

Keep **one statement per block**. A block holding three recommendations cannot
be cited, reviewed, superseded or traced individually, and splitting it later
means renumbering everything that referenced it.

## What not to do

- **Do not use `definition`.** It is a math kind: its `lean` field is
  *required*, so the block will not validate in a document folio at all.
  Earlier guidance in `document-intake` suggested mapping guideline
  recommendations onto `definition` — that predates the document profile and
  is wrong for a document folio.
- **Do not use `theorem` or `proposition`** for a good-practice statement.
  They are outside this profile and `content_profile_check` rejects them.
- **Do not encode the recommendation number in the label alone.** Numbers are
  renumbered between editions; the label must survive that. Put the published
  number in the title or the prose.

## The gap, stated plainly

There is no first-class `recommendation` block kind. Adding one means a
builder, a Zod schema, a label prefix, viewer registration, constraint rows
and QA criteria — roughly thirty files — and it is tracked separately rather
than half-done here. Until it lands, a labelled `prose` block is the honest
carrier: it is structurally correct (a titled, labelled, individually
reviewable node in the `uses[]` graph) and only misses a kind name that says
what it is.

If you are choosing between waiting for that kind and writing the folio: write
the folio. A `prose` block converts to a `recommendation` block by changing
one builder call.
{% endraw %}
