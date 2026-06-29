---
layout: default
title: Scientific Accuracy
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/scientific-accuracy.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/scientific-accuracy.md) — do not edit here.

{% raw %}
# Scientific Accuracy Skill

## Purpose

Evaluate commits for technical correctness, scientific/scholarly rigor,
and logical consistency. This skill is derived from established
peer-review practices.

## Checks

### 1. Quantitative Verification

- All equations, formulas, and numerical computations are correct.
- Dimensional analysis and unit consistency hold.
- Boundary conditions and edge cases are handled appropriately.
- **Derived/computed values must be cited, not hard-coded.** Any
  numerical literal that the project computes from a canonical source
  (a witness file, a registry, an upstream result) should be referenced
  through the project's value-citation mechanism rather than copied as a
  bare literal. See the value-witnessing skill for the registry
  contract, the directive syntax, and the codemod that rewrites legacy
  literals. Flag any new hard-coded numeral that has (or could have) a
  registry entry as a drift risk.

### 2. Scientific Rigor

- Claims are supported by evidence or sound reasoning.
- Terminology is used correctly and consistently.
- Referenced constants, data, or facts are accurate.
- **Keep results in their most exact / structural form for as long as
  possible.** Carry symbolic or exact-arithmetic expressions through the
  derivation and only evaluate numerically at the final step;
  premature numerical evaluation discards structure that later steps
  rely on. Label any approximation explicitly as such.
- **NO APPROXIMATIONS unless explicitly labeled as such.**
- **NO correction factors, fudge factors, or empirical scaling**
  presented as if derived.
- **NO formulas that are not derived from the project's stated
  foundations.**
- **Distinguish look-alike quantities.** When two measures share a name
  or notation (e.g. two different notions of "degree", "length",
  "dimension", or "volume"), state which one is meant; never silently
  conflate them.
- **EVERY observed/experimental value MUST carry ± uncertainty.** No
  external/measured constant without an error bound; use a single
  source-of-truth registry for such constants.
- **EVERY derived quantity MUST propagate error.** If $f(x)$ depends on
  $x \pm \delta x$, then $\delta f = |f'(x)|\,\delta x$; for products,
  relative errors add in quadrature. Track high-sensitivity
  amplifications explicitly.
- **Do not use $O(\cdot)$ to discard exact structure.** If a quantity is
  an exact count or an exact polynomial degree, state the exact value
  rather than asymptotizing it away.
- **Speculation is OK in conversation** with the author (to explore
  ideas), but **NEVER commit speculative content** without explicit
  author consent. If unsure, ask before committing.
- **Every quantity must trace back to the project's foundational
  definitions.** If a computation cannot be done exactly, say so; do not
  introduce smooth approximations or fitted coefficients and present
  them as derived results.

### 3. Statistical and Methodological Soundness

- Statistical methods are appropriate for the analysis.
- Sample sizes, power calculations, and significance thresholds are
  reasonable.
- Common pitfalls are avoided: p-hacking, multiple comparisons,
  survivorship bias.

### 4. Logical Consistency

- No logical fallacies or unsupported leaps in reasoning.
- Conclusions follow from the presented evidence.
- Internal consistency is maintained across the changeset.

### 4a. Consequence vs. Axiom Audit

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

### 4b. Calibration / input discipline

A project that produces predictions from a small number of external
inputs should declare exactly which inputs are *calibrations* (taken
from outside) and which quantities are *derived*. Every numerical
observable should factor as a derived expression times a fixed power of
the declared calibration inputs, with no hidden additional inputs.
**Flag** as part of accuracy review:

- *Free parameters* beyond the declared calibration set — a hidden extra
  input is a hard audit failure.
- *Coefficient fits* to external data labelled "ad hoc", "approx", or
  "tuned".
- *Numerological substitutions* (round/“magic” numbers asserted as data
  without derivation).
- *Tautologies* where a "derivation" uses its own result as input.
- *Rationalization*: prose arguing *why* a value is right rather than
  *deriving* it.

For active monitoring of derivation discipline across incoming commits
and PRs, route the request to the canonical-derivation watcher. The
classification of a candidate as production / exploratory / numerology
is owned by the `production-vs-exploratory-discipline` skill.

### 5. Reproducibility

- Methods are described with sufficient detail to reproduce.
- Magic numbers are explained or referenced.
- Algorithms are correctly implemented.

### 6. Formalization Cross-References

If the project carries a formal-proof layer alongside the narrative:

- Numerical constants in the manuscript must match the corresponding
  constants in the formal source exactly.
- Every claim citing external data must have a citation whose
  bibliographic entry includes a DOI or URL to the original source.
- Reference annotations on formal-proof gaps must cite the correct
  foundational reference for the gap.
- External reference URLs in formal-source docstrings must resolve.

## Content Object Integration

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

**Glossary terms.** Every term registered in a block's `defines: [...]`
must appear wrapped at every mention — once at the canonical definition
site and as a reference everywhere else. Bare-text or emphasized
mentions of a defined term break the canonical-name → canonical
-definition link the validator relies on and are accuracy violations.
Run the project validator in strict mode to catch term-mention-coverage
warnings.

## Mandatory fallback participation

This skill is invoked automatically by the editor's **content-change
fallback** (see `editor.md § Content-change fallback`). Whenever any
content is modified during a session, the editor triggers a
scientific-accuracy pass before the task is considered complete. When
invoked as a fallback, focus on the changed blocks and their immediate
dependencies.

## Output Format

```
- **Summary**: One-paragraph overall assessment.
- **Issues Found**: Numbered list (severity: critical / major / minor).
- **Suggestions**: Numbered list of improvements.
- **Verdict**: APPROVE, REQUEST_CHANGES, or NEEDS_DISCUSSION.
```
{% endraw %}
