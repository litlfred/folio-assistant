# AGENTS.md — folio-assistant-sci

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). This layer is small, and what it
mostly needs from an agent is that things are put in the right place.

## Source material, not authored content

What lives here is what a folio **reads** in order to formalise mathematics —
not mathematics this repository writes. A proof, a definition or a chapter
belongs in a folio, which is a separate repository. If you are about to author
a mathematical claim here, you are in the wrong place.

## Methodologies are adopted, not authored

`methodologies/` holds external methods for formalising mathematics in Lean,
each rendered from a paper in `library/` and citing it as `evidence`. The
discipline is `methodology-adoption`: render the method, not the paper's tools;
state what the paper measured and did not; state what this platform refuses.
A paper's empirical results are the paper's findings and are reported as such,
never restated as mathematics. Bean `h3rw`.

## The placement rule, and it has already been got wrong once

`milnorlink` sat under `cat-harness/library/` beside three WHO IRIS
publications. It is **not an IRIS item**: no handle, no DSpace UUID, no
collection path, nothing in the catalogue naming it.

> **A repository named for one catalogue is not a place to keep things that
> belong to another.**

Moving it to [`who-iris/`](../who-iris/) would have been the cheaper move and
the wrong one — the next agent looking for the WHO corpus would have found a
mathematics paper in it with no way to tell why. Beans `r1lz` and `frs5`.

So when you add a source, ask which catalogue it belongs to **before** asking
which directory is convenient. If the answer is "none of them", that is a
reason to say so, not a reason to file it under the nearest one.

---

*A declared asset of this instance ([`folio-assistant-sci.json`](folio-assistant-sci.json), role
`agent-instructions`). Issue #592.*

## The skills this layer publishes

<!-- skills:index:begin -->

_70 skills in 7 directories, generated from each skill's front matter. `bun run cat readme:sync` rewrites this list and `readme:sync:check` fails when it is stale. Skills this repository inherits are listed by the repositories that publish them._

**`skills/content/authoring-math/`** (11)

| Skill | What it is for |
|---|---|
| [`formal-accuracy`](skills/content/authoring-math/formal-accuracy.md) | The accuracy checks a content type with a formal-proof layer adds to the harness's scientific-accuracy review: the consequence-versus-axiom audit, formal cross-references, and validation across the… |
| [`formal-layer-editing`](skills/content/authoring-math/formal-layer-editing.md) | The formal-layer half of the harness's editor: the heavy-proof discipline, the routing rows for formal requests, the proof-block workflow and the pre-merge formal audits, for a paper folio with a… |
| [`latex-authoring`](skills/content/authoring-math/latex-authoring.md) | Get a paper folio through LaTeX to a PDF, and keep the TeX a folio's own rather than the platform's. |
| [`lean-formalization`](skills/content/authoring-math/lean-formalization.md) | Take a block whose assertion is a formal mathematical claim and give it a `.lean` sibling that Lean 4 accepts. |
| [`lean-toolchain-contract`](skills/content/authoring-math/lean-toolchain-contract.md) | The contract the `lean-toolchain` role is held to: what a Lean toolchain must answer when a paper folio's formal half is built, and what it must not be asked. |
| [`math-md-authoring`](skills/content/authoring-math/math-md-authoring.md) | The math half of the harness's md-authoring: display and inline math, KaTeX limits, math in titles and table cells, and what the LaTeX pipeline does with tables, for a paper folio's .md blocks. |
| [`math-readability-editing`](skills/content/authoring-math/math-readability-editing.md) | The math half of the harness's readability-editing: math-specific style checks, the blueprint and formal-proof index cross-checks, and the mandatory TeX snippet validation after editing a paper… |
| [`milnor-exposition-standard`](skills/content/authoring-math/milnor-exposition-standard.md) | The eight hallmarks of mathematical exposition, scored 0-2 with sixteen the only passing total, derived from John Milnor's "Link Groups" (1954). |
| [`paper-chapter-complexity`](skills/content/authoring-math/paper-chapter-complexity.md) | The paper-folio half of the harness's chapter-complexity-review and block-density skills: the mathematical block-kind classifier for logical vs. |
| [`paper-voice-audit`](skills/content/authoring-math/paper-voice-audit.md) | The paper-folio half of the harness's one-voice-audit, one-voice-integration-watcher, and one-voice-style-guide: scholarly voice across proof bodies, pdflatex Unicode crash remediation, mathematical… |
| [`proof-verification`](skills/content/authoring-math/proof-verification.md) | Decide, and record, whether a block's formal claim is actually verified — separately from whether it builds. |

**`skills/content/folio-paper-adapter/`** (53)

| Skill | What it is for |
|---|---|
| [`build-docs`](skills/content/folio-paper-adapter/build-docs.md) | Builds the Lean HTML documentation (doc-gen4) locally in the workspace, for any paper folio's Lean package. |
| [`build-pdf`](skills/content/folio-paper-adapter/build-pdf.md) | Builds a paper folio's PDF locally in the workspace — the monolithic PDF plus split per-chapter PDFs. |
| [`category-theory`](skills/content/folio-paper-adapter/category-theory.md) | Category Theory formalization skill — handles diagram chasing, universal properties, functorial translation, and whiskering in Lean 4. |
| [`chapter-analysis`](skills/content/folio-paper-adapter/chapter-analysis.md) | Thorough analysis and Lean 4 formalization of a single manuscript chapter. |
| [`compute-audit`](skills/content/folio-paper-adapter/compute-audit.md) | Audit compute scripts for a catalogue of correctness and performance antipatterns extracted from a long review of the project's compute history. |
| [`compute-author`](skills/content/folio-paper-adapter/compute-author.md) | Pre-work briefing + durable patterns for anyone writing or modifying compute scripts (or the native crates they call). |
| [`compute-integration-watcher`](skills/content/folio-paper-adapter/compute-integration-watcher.md) | Cross-layer wiring auditor — watches for newly-landed formal/analytic improvements (proofs, propositions, lemmas, axiom→theorem upgrades, witness data) on the default branch AND on open PRs, and… |
| [`content-block-review`](skills/content/folio-paper-adapter/content-block-review.md) | Reviews existing content blocks for adherence to all requirements — structural integrity, Lean proof rules, cross-reference consistency, status accuracy, and naming conventions. |
| [`content-validation`](skills/content/folio-paper-adapter/content-validation.md) | Content Validation Skill |
| [`critical-path-analysis`](skills/content/folio-paper-adapter/critical-path-analysis.md) | Analyse the critical path of the paper's argument chain, audit statement and proof contexts (e.g. |
| [`definition-clarity-audit`](skills/content/folio-paper-adapter/definition-clarity-audit.md) | Definition / statement clarity + concision audit. |
| [`detangler-integration-watcher`](skills/content/folio-paper-adapter/detangler-integration-watcher.md) | Structural-QA integration watcher — watches the default branch + open active PRs + newly-opened PRs for organisational changes (paper / chapter manifest edits, new blocks, edited `uses[]` / `kind` /… |
| [`devils-advocate-paper`](skills/content/folio-paper-adapter/devils-advocate-paper.md) | What the harness's devils-advocate-watcher means for a paper folio: its claim-bearing kinds and formal tree, the Lean vacuity shapes the Formalist lens looks for, and the paper watchers the… |
| [`ffi-roundtrip-audit`](skills/content/folio-paper-adapter/ffi-roundtrip-audit.md) | Audit compute scripts for script ↔ native ping-pong patterns — loops that cross the FFI / subprocess boundary per iteration, instead of one boundary crossing for the whole pipeline. |
| [`formalizer`](skills/content/folio-paper-adapter/formalizer.md) | Lean 4 Formalizer — translates the logical skeleton of narrative mathematical proofs into Lean 4 tactic blocks. |
| [`groebner-basis`](skills/content/folio-paper-adapter/groebner-basis.md) | Compute Gröbner bases and normal forms for (possibly non-commutative) algebraic structures using a CAS (e.g. |
| [`latex-build-cache`](skills/content/folio-paper-adapter/latex-build-cache.md) | LaTeX build performance — findings + what's safe. |
| [`latex-compilation`](skills/content/folio-paper-adapter/latex-compilation.md) | Compile LaTeX source documents into PDF using latexmk and pdflatex, with safe shell-escape isolation across trusted and untrusted environments. |
| [`latex-validation`](skills/content/folio-paper-adapter/latex-validation.md) | LaTeX Validation Skill |
| [`lean-build-fix`](skills/content/folio-paper-adapter/lean-build-fix.md) | Iteratively fix Lean build errors and linter warnings until the build passes cleanly. |
| [`lean-cache-restore`](skills/content/folio-paper-adapter/lean-cache-restore.md) | The Lean build loop — restore a warm cache before working, and contribute your build back when done. |
| [`lean-completeness-audit`](skills/content/folio-paper-adapter/lean-completeness-audit.md) | Audit Lean formalization completeness across all papers: verify Lake project setup, check import coverage, identify missing .lean files for content blocks that require them, report formalization… |
| [`lean-content-test`](skills/content/folio-paper-adapter/lean-content-test.md) | The paper-folio half of the harness's content-test: run Lean proof verification and LaTeX compilation, dispatch the repo's Lean CI, and check how much of the corpus a Lake build reaches before… |
| [`lean-environment-setup`](skills/content/folio-paper-adapter/lean-environment-setup.md) | Sets up and troubleshoots the Lean 4 environment for Claude Code sessions. |
| [`lean-formal-graph`](skills/content/folio-paper-adapter/lean-formal-graph.md) | Build and query the FORMAL dependency graph — what a proof actually invokes, derived from `lean.ref`. |
| [`lean-generation`](skills/content/folio-paper-adapter/lean-generation.md) | Extract theorem-like objects from LaTeX source and generate corresponding Lean 4 stub files with `sorry` placeholders. |
| [`lean-mathlibext-curator`](skills/content/folio-paper-adapter/lean-mathlibext-curator.md) | Curate `<Paper>/MathlibExt.lean` — the staging area for upstream- candidate lemmas (List/sort plumbing, Foldl/foldr at Monoid level, Real-function bridges). |
| [`lean-proof-review`](skills/content/folio-paper-adapter/lean-proof-review.md) | Review Lean 4 proofs for correctness, style, and completeness. |
| [`lean-proof-vacuity-audit`](skills/content/folio-paper-adapter/lean-proof-vacuity-audit.md) | Detect and fix Lean "vacuous proof" anti-patterns — declarations that type-check, are sorry-free and axiom-clean, and whose statement matches the .md, yet carry NO mathematical content (they assume… |
| [`lean-substantive-pass`](skills/content/folio-paper-adapter/lean-substantive-pass.md) | Convert abstract `holds : Prop` / `claim : Prop` placeholder Lean stubs into typed sub-claim contexts with manuscript-semantic field names. |
| [`lean-witness-audit`](skills/content/folio-paper-adapter/lean-witness-audit.md) | Audit computation scripts (typically Python) that produce witness statements for Lean formalization. |
| [`math-render-check`](skills/content/folio-paper-adapter/math-render-check.md) | The math half of the harness's markdown-render-check: grep checks for display math, KaTeX and LaTeX patterns that GitHub's renderer breaks, and the fix recipe for multi-line display equations. |
| [`paper-importer`](skills/content/folio-paper-adapter/paper-importer.md) | Import external papers from PDF, LaTeX, or arXiv into the content object system. |
| [`proof-conciseness`](skills/content/folio-paper-adapter/proof-conciseness.md) | Tighten narrative (human-readable) proofs without changing mathematical content. |
| [`proof-editor`](skills/content/folio-paper-adapter/proof-editor.md) | Coordinator skill for proof review and repair. |
| [`proof-exposition-review`](skills/content/folio-paper-adapter/proof-exposition-review.md) | Paper-wide retrospective review of a single proof block. |
| [`proof-gap-audit`](skills/content/folio-paper-adapter/proof-gap-audit.md) | Audit individual proofs and the network of proofs for gaps. |
| [`proof-integration-watcher`](skills/content/folio-paper-adapter/proof-integration-watcher.md) | Proof-QA integration watcher — watches origin/main + open active PRs + newly-opened PRs for narrative-proof (`.md`) or Lean-proof (`.lean`) changes, runs the proof QA skill suite on every detected… |
| [`proof-narrative-lean-equivalence`](skills/content/folio-paper-adapter/proof-narrative-lean-equivalence.md) | For each content block with both a narrative proof (.md) and a Lean sibling (.lean), verify the two prove the same thing. |
| [`proof-simplifier`](skills/content/folio-paper-adapter/proof-simplifier.md) | Analyse small clusters (2–4) of connected proofs to find simplifications: shared lemmas, redundant constructions, factored abstractions, or shorter proof paths through the dependency graph. |
| [`proof-status-tracking`](skills/content/folio-paper-adapter/proof-status-tracking.md) | Maintain the proof-objects.json manifest tracking formalization status, review records, and LaTeX-to-Lean linkages. |
| [`proof-triage`](skills/content/folio-paper-adapter/proof-triage.md) | Systematically triages and resolves `sorry` stubs across the Lean codebase. |
| [`proposition-consolidation-audit`](skills/content/folio-paper-adapter/proposition-consolidation-audit.md) | Scan a chapter (or the whole paper) for propositions/theorems/lemmas that overlap structurally — same boxed equation under different parametrisations, near-identical proof skeletons, explicit… |
| [`q-usage-watcher`](skills/content/folio-paper-adapter/q-usage-watcher.md) | q-usage integration watcher — detects how each content block treats the substrate parameter $q$ (symbolic / generic-R / real-positive / q > 1 / \|q\| > 1 / unit-circle / root-of-unity / fixed q_0 /… |
| [`remark-audit`](skills/content/folio-paper-adapter/remark-audit.md) | Audit remarks for provable content. |
| [`rendering-auditor`](skills/content/folio-paper-adapter/rendering-auditor.md) | Multi-pass rendering auditor for content blocks. |
| [`rendering-fixes`](skills/content/folio-paper-adapter/rendering-fixes.md) | Quick-fix reference for common rendering errors found by the rendering-auditor. |
| [`semantic-review-scoping`](skills/content/folio-paper-adapter/semantic-review-scoping.md) | Decide what to review FIRST. |
| [`simulator-math-audit`](skills/content/folio-paper-adapter/simulator-math-audit.md) | Audit simulator content objects against the formal mathematics they visualise — formulas and physical constants must be derived from the paper's canonical sources, never hardcoded in the… |
| [`simulator`](skills/content/folio-paper-adapter/simulator.md) | Simulator Skill |
| [`uses-formal-comparison`](skills/content/folio-paper-adapter/uses-formal-comparison.md) | How a paper folio's formal dependency graph (from Lean) relates to the editorial `uses[]` relation the harness's uses-editorial-review audits: why they diverge, why `uses[]` is never populated from… |
| [`verify-local-substrate`](skills/content/folio-paper-adapter/verify-local-substrate.md) | Verify that every result block of a designated class traces back to a designated anchor definition through the uses[] dependency graph. |
| [`witnessed-values`](skills/content/folio-paper-adapter/witnessed-values.md) | Witnessed Values Skill |

**`skills/content/hypothesis-generation/`** (1)

| Skill | What it is for |
|---|---|
| [`hypothesis-generation`](skills/content/hypothesis-generation/hypothesis-generation.md) | Formulate evidence-bounded scientific questions, candidate hypotheses, rival explanations, causal or associational claims, discriminating predictions, measurements, and preregistration-ready… |

**`skills/content/scientific-critical-thinking/`** (1)

| Skill | What it is for |
|---|---|
| [`scientific-critical-thinking`](skills/content/scientific-critical-thinking/scientific-critical-thinking.md) | Evaluate scientific claims and evidence quality. |

**`skills/content/scientific-visualization/`** (1)

| Skill | What it is for |
|---|---|
| [`scientific-visualization`](skills/content/scientific-visualization/scientific-visualization.md) | Create and audit truthful, accessible, publication-ready scientific figures with Matplotlib, Seaborn, or Plotly. |

**`skills/data/`** (1)

| Skill | What it is for |
|---|---|
| [`reference-dataset-ingestion`](skills/data/reference-dataset-ingestion.md) | Ingest a published REFERENCE dataset — a constants table such as CODATA, AME or PDG — into a library entry whose values are addressable in prose as {{ <instance>.library.<entry>.<slug> }}, with… |

**`skills/lean/`** (2)

| Skill | What it is for |
|---|---|
| [`lean-formal-edges`](skills/lean/lean-formal-edges.md) | Extract ELABORATED formal dependencies between a folio's lean.ref declarations — the trustworthy replacement for the lexical `--scan` cache. |
| [`lean-html-docs`](skills/lean/lean-html-docs.md) | Build and publish the visualiser of a folio's declared `lean` directory: the package's doc-gen4 HTML render, staged under the folio's site and wrapped in the harness navbar and rail. |

<!-- skills:index:end -->
