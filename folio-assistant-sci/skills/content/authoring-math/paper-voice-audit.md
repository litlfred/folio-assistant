---
name: paper-voice-audit
description: >-
  The paper-folio half of the harness's one-voice-audit,
  one-voice-integration-watcher, and one-voice-style-guide: scholarly voice
  across proof bodies, pdflatex Unicode crash remediation, mathematical hedging
  patterns, conditional-theorem banners, and paper watcher triggers.
---

# Paper voice audit and watcher rules

The harness skills [`one-voice-audit`](../../../../cat-harness/skills/authoring/authoring-core/one-voice-audit.md),
[`one-voice-integration-watcher`](../../../../cat-harness/skills/authoring/authoring-core/one-voice-integration-watcher.md),
and [`one-voice-style-guide`](../../../../cat-harness/skills/authoring/authoring-core/one-voice-style-guide.md)
govern voice consistency and multi-reviewer `<block>.qa.json` sidecars across any
folio. For a paper folio with LaTeX compilation and a Lean 4 formal layer, apply
these paper-specific rules alongside them (and alongside
[`milnor-exposition-standard`](milnor-exposition-standard.md) and
[`math-readability-editing`](math-readability-editing.md)).

## 1. Proof bodies and mathematical hedging (`one-voice-audit`)

- **Proof bodies share the default scholarly voice.** Both narrative `.md` files
  and proof bodies (`.lean` formal-proof docstrings and expository proof
  comments) must use third-person scholarly register unless the block carries
  `tags: ["non-scholarly-voice-exception"]` with a rationale in `notes`.
- **Mathematical hedging phrases (Criterion 11).** In addition to generic
  hedges, flag paper-specific patches that substitute for a derivation:
  `simplifies the paper`, `provides the (mathematical framework|natural setting|canonical (duality|basis|framework))`,
  and `gives a canonical (functor|grading|ordering)`. Keep a phrase only when it
  is the canonical mathematical term of art (for example `essentially surjective`
  for a functor) or carries the explicit exception tag.
- **Category E — `pdflatex` Unicode crashes.** Characters such as `↦` (U+21A6),
  `⁻` (U+207B), `√` (U+221A), `─` (U+2500), `✅` (U+2705), `·`, and `²` crash
  `pdflatex` unless mapped in the preamble. Replace them with LaTeX math commands
  (`\mapsto`, `^{-1}`, `\sqrt{}`, `\cdot`, `^{2}`) or strip box-drawing
  characters; add `\newunicodechar` to the preamble only when a glyph is used
  corpus-wide.
- **Category H — Conditional-theorem banner exception.** Migrate status banners
  such as `> **Status: theorem (sorry-free)...**` to `authorNotes` on the `.ts`
  manifest, **except** `**Theorem (conditional on [conj:X])**` banners that are
  structural parts of the theorem statement — keep those in prose.
- **Category J — Precision propositions.** Empirical-fit phrasing (`within X%`,
  `matches to Y ppm`) is removed from published blocks unless the block itself
  is a `proposition` whose formal statement establishes a precision bound.
- **Kickbacks and proof trimming.** In expository proofs, phrases like "We have
  shown…" or "It remains to verify…" that serve as proof structure require
  author judgement rather than mechanical deletion. For proofs containing genuine
  work-tracker language disguised as exposition, route to `proof-conciseness`.

## 2. Paper watcher triggers, discovery, and dispatch (`one-voice-integration-watcher`)

- **Trigger filter (`Slot B`):** include `.lean` siblings in the content trigger
  (`^content/.*\.(md|ts|lean)$`).
- **Specialist dispatch (`Slot C`):**
  - When `domain-boundary-correct` fires, run `critical-path-analysis` to trace
    cross-domain dependencies.
  - When `fit-section-chapter` fires on a `remark` block, run `remark-audit` to
    check for dangling or misplaced remarks.
- **Backlog discovery (`Slot G`) and CLI scope:** enumerate paper blocks across
  all paper builders (`definition`, `theorem`, `lemma`, `proposition`,
  `corollary`, `conjecture`, `example`, `remark`, `proof`, `prose`, `equation`,
  `diagram`, `simulator`) and invoke `pipeline/qa-sweep.ts <paper>/<chapter>` and
  `pipeline/qa-staleness.ts <paper> --json`.
- **Per-field staleness (`field_hash`):** include the `"lean"` SHA-256 prefix
  alongside `"md"` and `"ts"` in `<block>.qa.json` reviewer entries whenever the
  block has a `.lean` sibling.
