---
name: formal-accuracy
description: >-
  The accuracy checks a content type with a formal-proof layer adds to the
  harness's scientific-accuracy review: the consequence-versus-axiom audit,
  formal cross-references, and validation across the .ts / .md / formal
  triple.
---

# Formal accuracy

The harness skill `scientific-accuracy` reviews any scholarly content for
correctness, rigor and reproducibility. A folio whose content type carries a
formal-proof layer (a paper folio, with Lean beside the narrative) needs more,
and those checks are here, in the layer that ships that content type. They
lived in `scientific-accuracy` until 2026-10-24 and moved out under bean
`syiq`, so the harness names no formal layer and this skill links down to it.

Run this skill alongside `scientific-accuracy`, never instead of it, and
report in its output format.

## Consequence versus axiom audit

- When a condition inside a definition looks like it might follow from
  other axioms or from the ambient structure, investigate before
  restructuring:
  1. Identify the **hypotheses** the candidate consequence would need.
  2. Check whether those hypotheses are already supplied by the other
     axioms in the definition or by the ambient structure.
  3. If the condition is **genuinely independent**, leave it in the
     definition. If it is **derivable**, extract it into a proposition
     or lemma with a proof.
- When multiple objects across chapters share similar-sounding names,
  verify they refer to the same object before renaming. Trace the home
  of each.

## Formal cross-references

If the project carries a formal-proof layer alongside the narrative:

- Numerical constants in the manuscript must match the corresponding
  constants in the formal source exactly.
- Every claim citing external data must have a citation whose
  bibliographic entry includes a DOI or URL to the original source.
- Reference annotations on formal-proof gaps must cite the correct
  foundational reference for the gap.
- External reference URLs in formal-source docstrings must resolve.

## Validation across the content-object triple

When the project uses a content-object triple architecture (a `.ts`
manifest + `.md` narrative + a formal-proof sibling), use it for
cross-validation:

- The formal-reference URI in each `.ts` manifest names the
  corresponding formal declaration. Verify the declaration exists, that
  its type signature matches the statement in `.md`, and that numerical
  constants agree across files.
- For `definition` blocks, all sibling files should exist and be
  consistent; for `theorem`/`lemma` blocks, a missing formal sibling is
  a warning.
- The `uses[]` dependency graph helps trace which upstream definitions a
  claim relies on — verify those are formalized too.
