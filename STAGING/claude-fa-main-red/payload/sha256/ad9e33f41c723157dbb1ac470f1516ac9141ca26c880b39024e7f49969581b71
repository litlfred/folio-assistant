---
name: formal-layer-editing
description: >-
  The formal-layer half of the harness's editor: the heavy-proof discipline,
  the routing rows for formal requests, the proof-block workflow and the
  pre-merge formal audits, for a paper folio with a Lean layer.
---

# Formal-layer editing

The harness skill `editor` (`skill_fetch editor`) coordinates any folio's
editing. When the folio carries a formal-proof layer, as a paper folio with
Lean does, the editor also follows this skill. Its rules are **mandatory**
wherever that layer is present.

## Heavy-proof discipline

Whenever you add or modify a formal theorem in a content block, you **MUST**
also add or update a matching `**Proof.**` narrative block in the sibling
`.md` file. See `formalizer` and `proof-narrative-lean-equivalence` for the
canonical format.

Anti-pattern (FORBIDDEN): touching the formal-proof file without touching
`.md`, or vice versa. The formal theorem and the narrative proof move together
in a single coherent change. A `.md` that describes the **claim** but omits
the **proof** is incomplete: the reader must be able to follow the argument
from the `.md` alone.

For every formal theorem `foo` proved in the sibling, the `.md` must contain:

```markdown
**Proposition (formal: `foo`).** <statement>
*Proof.* <narrative sketch citing key lemmas / tactics> $\square$
```

When editing existing blocks, run the `proof-narrative-lean-equivalence` audit
to surface any formal theorems without narrative counterparts and backfill
them.

## Routing rows for formal requests

These rows extend the editor's routing table:

| Request type | Sub-editor(s) | Notes |
|-------------|---------------|-------|
| Fill in / prove / remove proof gap | `formalizer` + domain skill | Formal-layer aware |
| Define / formalize / add structure | `formalizer` + `lean-generation` | Cross-ref narrative ↔ formal |
| Review / check / audit formal source | `lean-proof-review` | Gap audit, coherency |
| Status / tracking / manifest | `proof-status-tracking` | proof-objects manifest |
| Witness staleness | `lean-completeness-audit` | Formal + compute witness audit |
| What next / priority / triage | `proof-triage` | Decision support |
| Fix formal build | `lean-build-fix` | Iterative error diagnosis + fix |
| Simplify proofs | `proof-simplifier` | Clusters of connected proofs |

## Proof workflow (narrative and formal)

Every theorem, lemma, proposition and corollary **must** have a standalone
proof block (`*-proof.ts` + `*-proof.md`), or it will not appear in output.
For every provable block:

1. **Separate statement from proof**: the statement `.md` holds only the
   statement; proof content lives in `*-proof.md`.
2. **Files per proof**: `*-proof.ts` (manifest), `*-proof.md` (narrative),
   optional formal-proof sibling.
3. **Link via `proofs:`** on the parent `.ts`.
4. **List in the chapter manifest** immediately after the parent.
5. **No prose in formal-source files**: narrative belongs in `.md`; formal
   files carry code, brief docstrings, and reference citations.
6. **Witnessed values** in a statement or proof step follow the editor's
   rule (`witnessed-values`).

To create a narrative proof: check for an existing proof block; if none, ask
the author (provide a sketch, or have the agent draft one for review); create
the `.ts` + `.md` pair, link via `proofs[]`, add to the chapter manifest. For
formal proofs: prefer writing the narrative first, then route to the
formalizer with the narrative as context; route existing gap stubs to
`proof-triage`.

## Pre-merge formal audits

Before merging a branch, alongside the editor's own checklist: run the
formal-layer audit (zero uncited gaps, zero trivial truths, every new gap has
a reference citation), and run the formal build if available.
