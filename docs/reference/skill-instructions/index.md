---
layout: default
title: Skill instructions
nav_order: 6
has_children: true
---

# Skill instructions

The prose **instruction bodies** the LLM loads (via `skill_fetch`) when it
runs a skill. These are generated from the skill source markdowns, so the
published reference always matches what the agent actually reads.

For each skill's *typed input/output contract*, see the
[Skill schema reference](../skills/); for the conceptual overview of skills,
roles, and how they compose with the LLM, see [Skills & roles](../../skills.html).

## Lifecycle skills

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Content Authoring](content-author.html) | `content-author` | [schema](../skills/content-author.html) | Create and develop content artifacts according to the project plan. |
| [Content Feedback Collection](content-feedback.html) | `content-feedback` | [schema](../skills/content-feedback.html) | Gather and triage feedback on published content for future iterations. |
| [Content Planning](content-plan.html) | `content-plan` | [schema](../skills/content-plan.html) | Plan content development by defining scope, team, timeline, and sprint cadence. |
| [Content Publication](content-publish.html) | `content-publish` | [schema](../skills/content-publish.html) | Package, version, and publish approved content. |
| [Content Retirement](content-retire.html) | `content-retire` | — | Deprecate and retire content that is no longer current or needed. |
| [Content Review](content-review.html) | `content-review` | [schema](../skills/content-review.html) | Formal review and approval of validated content before publication. |
| [Content Testing](content-test.html) | `content-test` | [schema](../skills/content-test.html) | End-to-end testing of content artifacts in realistic scenarios. |
| [Content Validation](content-validate.html) | `content-validate` | [schema](../skills/content-validate.html) | Validate authored content against schemas, standards, and clinical accuracy. |

## Agent skills

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Corpus-Grep](corpus-grep.html) | `corpus-grep` | — | > **Disambiguation.** This skill formalizes the **backward** check |
| [Deployment & Auth](deployment-auth.html) | `deployment-auth` | — |  |
| [Editor](editor.html) | `editor` | — | git diff --name-only main...HEAD -- 'content/**/*.ts' 'content/**/*.md' 'content/**/*.lean' |
| [Readability Editing](readability-editing.html) | `readability-editing` | — |  |
| [symbiotic-interaction](symbiotic-interaction.html) | `symbiotic-interaction` | — |  |
| [Todo Review](todo-review.html) | `todo-review` | — | > **Disambiguation:** |

## Platform core (folio-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Bean Coordination](bean-coordination.html) | `bean-coordination` | — | The **bean-based work-plan system** — the [`beans`](https://github.com/hmans/beans) |
| [bib-human-review](bib-human-review.html) | `bib-human-review` | — | Status sidecar: `content/schema/references.review.json`. |
| [bib-photo-ingestion-watcher](bib-photo-ingestion-watcher.html) | `bib-photo-ingestion-watcher` | — | The automation half of the [`bib-human-review`](bib-human-review.md) workflow. |
| [Bibliography QA](bib-qa.html) | `bib-qa` | — | pip install paper-search-mcp pyalex |
| [Block Density](block-density.html) | `block-density` | — |  |
| [/canonical-watcher](canonical-watcher.html) | `canonical-watcher` | — | A concrete instance of `local/integration-watcher`. The parent encodes |
| [Chapter Complexity Review](chapter-complexity-review.html) | `chapter-complexity-review` | — |  |
| [Compute Integration Watcher](compute-integration-watcher.html) | `compute-integration-watcher` | — |  |
| [Content Graph](content-graph.html) | `content-graph` | — | cd content && python3 pipeline/content-graph-analysis.py |
| [/continual-progress](continual-progress.html) | `continual-progress` | — | Sibling agents and the author can only coordinate with work they can |
| [/coordinate](coordinate.html) | `coordinate` | — | When several Claude branches are converging on the same long-term goal |
| [Delivery Summary](delivery-summary.html) | `delivery-summary` | — | After completing a feature or edit (i.e., after pushing changes), provide: |
| [deployment-auth](deployment-auth.html) | `deployment-auth` | — | _also in Agent skills (same page)_ |
| [/detangler-integration-watcher](detangler-integration-watcher.html) | `detangler-integration-watcher` | — | A concrete instance of `local/integration-watcher`. The parent encodes |
| [/devils-advocate-watcher](devils-advocate-watcher.html) | `devils-advocate-watcher` | — | A concrete instance of [`integration-watcher`](integration-watcher.md). |
| [Diff](diff.html) | `diff` | — | Show what changed at the content-block level, with viewer links and |
| [Documentation Generation](docs-generation.html) | `docs-generation` | — | cd content && bun run pipeline/build.ts \ |
| [editor](editor.html) | `editor` | — | _also in Agent skills (same page)_ |
| [Glossary Build](glossary-build.html) | `glossary-build` | — |  |
| [HTML Rendering QC](html-rendering-qc.html) | `html-rendering-qc` | — | grep -rn '\\operatorname' content/**/*.md |
| [idle-backlog](idle-backlog.html) | `idle-backlog` | — | Generalises the AGENTS.md §"5-minute idle trigger" / "Work the queue while idle" |
| [/integration-audit](integration-audit.html) | `integration-audit` | — | A maintenance command for the multi-axis QA-sidecar pipeline (`voice`, |
| [/integration-backlog](integration-backlog.html) | `integration-backlog` | — | A workflow skill that turns each integration-watcher's open findings |
| [/integration-watch](integration-watch.html) | `integration-watch` | — | A thin dispatcher in front of [`integration-watcher`](integration-watcher.md) |
| [integration-watcher (abstract parent)](integration-watcher.html) | `integration-watcher` | — | A concrete watcher (this skill's child) **watches incoming activity** |
| [Markdown Render Check](markdown-render-check.html) | `markdown-render-check` | — | git diff HEAD~1 HEAD --name-only -- '*.md' |
| [Markdown Authoring Conventions](md-authoring.html) | `md-authoring` | — |  |
| [One-Voice Audit](one-voice-audit.html) | `one-voice-audit` | — | grep -rEn "[✅❌⚠⏳🔧🚧☑☒]\|✓\|✗\|★" "$CONTENT" --include="*.md" |
| [/one-voice-integration-watcher](one-voice-integration-watcher.html) | `one-voice-integration-watcher` | — | A concrete instance of [`local/integration-watcher`](integration-watcher.md). |
| [One-Voice Style Guide](one-voice-style-guide.html) | `one-voice-style-guide` | — | > **See also:** `one-voice-audit` is the mechanical sweep (greps for |
| [Semantic Ontologist (Ambiguity Detection & Glossary)](ontologist.html) | `ontologist` | — |  |
| [/pending-show](pending-show.html) | `pending-show` | — | Quick status display. Read-only. Run any time to answer "where am I?" |
| [Pickup](pickup.html) | `pickup` | — | Continue work on existing open PRs with minimal wasted tokens. This skill |
| [/prepare-merge-auto](prepare-merge-auto.html) | `prepare-merge-auto` | — | Runs the full `/prepare-merge` workflow PLUS: |
| [Production vs exploratory vs numerology](production-vs-exploratory-discipline.html) | `production-vs-exploratory-discipline` | — | N_TRUNCATION = 5 |
| [readability-editing](readability-editing.html) | `readability-editing` | — | _also in Agent skills (same page)_ |
| [Scientific Accuracy](scientific-accuracy.html) | `scientific-accuracy` | — |  |
| [/session-intent](session-intent.html) | `session-intent` | — | A coordination failure mode recurs whenever agents have no durable |
| [symbiotic-interaction](symbiotic-interaction.html) | `symbiotic-interaction` | — | _also in Agent skills (same page)_ |
| [Test Engineer](test-engineer.html) | `test-engineer` | — | bun test                              # from scripts/tests/ |
| [Session Task Manager (`beans`)](todo-manager.html) | `todo-manager` | — | > **Disambiguation:** |
| [todo-review](todo-review.html) | `todo-review` | — | _also in Agent skills (same page)_ |
| [/watch](watch.html) | `watch` | — | A unified watcher that handles **branches** (poll `git ls-remote`) and |

## Paper adapter (folio-paper-adapter)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Category Theory Formalization](category-theory.html) | `category-theory` | — |  |
| [Chapter Analysis & Formalization](chapter-analysis.html) | `chapter-analysis` | — |  |
| [Compute Audit](compute-audit.html) | `compute-audit` | — | python3 script.py --args ... |
| [Compute-author](compute-author.html) | `compute-author` | — |  |
| [Content Block Review](content-block-review.html) | `content-block-review` | — |  |
| [Content Validation](content-validation.html) | `content-validation` | — | bun run scripts/run-validate.ts content/<paper>   # after setup-folio-assistant.sh |
| [Critical Path Analysis & Context Review](critical-path-analysis.html) | `critical-path-analysis` | — |  |
| [definition-clarity-audit](definition-clarity-audit.html) | `definition-clarity-audit` | — | A content block can be **schema-clean, ref-resolving, proof-backed** and still be |
| [Document Intake](document-intake.html) | `document-intake` | — | > **Bib human-review integration.** Track per-upload ingestion |
| [FFI roundtrip audit](ffi-roundtrip-audit.html) | `ffi-roundtrip-audit` | — | total = mp.mpf(0) |
| [Lean 4 Formalizer (Narrative to Proof)](formalizer.html) | `formalizer` | — |  |
| [Gröbner Basis](groebner-basis.html) | `groebner-basis` | — |  |
| [LaTeX build performance](latex-build-cache.html) | `latex-build-cache` | — | A from-scratch compile re-parses the heavy preamble on **every latexmk |
| [LaTeX Validation](latex-validation.html) | `latex-validation` | — |  |
| [Lean Build Fix](lean-build-fix.html) | `lean-build-fix` | — |  |
| [Lean Completeness Audit](lean-completeness-audit.html) | `lean-completeness-audit` | — | find content/<paper>/lean/ -name '*.lean' -not -path '*/.lake/*' \| sort |
| [Lean Environment Setup](lean-environment-setup.html) | `lean-environment-setup` | — | cd .. && git clone https://github.com/leanprover-community/mathlib4.git |
| [Lean File Generation](lean-generation.html) | `lean-generation` | — | Description here. |
| [`MathlibExt` Curator](lean-mathlibext-curator.html) | `lean-mathlibext-curator` | — |  |
| [Lean Proof Review](lean-proof-review.html) | `lean-proof-review` | — | git diff origin/main...HEAD -- '*.lean' \ |
| [lean-proof-vacuity-audit](lean-proof-vacuity-audit.html) | `lean-proof-vacuity-audit` | — | A proof can be **sorry-free, axiom-clean, and statement-faithful** and still |
| [/lean-substantive-pass](lean-substantive-pass.html) | `lean-substantive-pass` | — | The job of this skill is to take an abstract `class FooContext where |
| [Lean Witness Audit](lean-witness-audit.html) | `lean-witness-audit` | — | python3 witness_base.py check-stale my-computation.witness.json |
| [Paper Importer](paper-importer.html) | `paper-importer` | — | > **Bib human-review integration.** When importing a paper whose |
| [Proof Conciseness](proof-conciseness.html) | `proof-conciseness` | — |  |
| [Proof Editor (Coordinator)](proof-editor.html) | `proof-editor` | — |  |
| [Proof Exposition Review](proof-exposition-review.html) | `proof-exposition-review` | — |  |
| [Proof Gap Audit](proof-gap-audit.html) | `proof-gap-audit` | — |  |
| [/proof-integration-watcher](proof-integration-watcher.html) | `proof-integration-watcher` | — | A concrete instance of [`local/integration-watcher`](integration-watcher.md). |
| [Proof Narrative ↔ Lean Equivalence Audit](proof-narrative-lean-equivalence.html) | `proof-narrative-lean-equivalence` | — | grep -rn ':= by \(rfl\\|trivial\\|True.intro\)' content/**/*.lean |
| [Proof Simplifier](proof-simplifier.html) | `proof-simplifier` | — |  |
| [Proof Status Tracking](proof-status-tracking.html) | `proof-status-tracking` | — |  |
| [Proof Triage & Resolution](proof-triage.html) | `proof-triage` | — | [[require]] |
| [/proposition-consolidation-audit](proposition-consolidation-audit.html) | `proposition-consolidation-audit` | — | grep -lE "^export default (proposition\|theorem\|lemma\|corollary)" \ |
| [Remark Audit](remark-audit.html) | `remark-audit` | — | cd content && grep -rl '"remark"' --include='*.ts' \| sort |
| [Rendering Auditor](rendering-auditor.html) | `rendering-auditor` | — | cd content && bun run pipeline/build.ts <paper>/<paper>.ts \ |
| [Rendering Fixes](rendering-fixes.html) | `rendering-fixes` | — |  |
| [Simulator](simulator.html) | `simulator` | — |  |
| [Verify Anchor Connectivity](verify-local-substrate.html) | `verify-local-substrate` | — |  |
| [Witnessed Values](witnessed-values.html) | `witnessed-values` | — |  |

> The `authoring-math` and `authoring-who-smart-guidelines` packages ship
> skill *definitions* + typed schemas today; their prose instruction bodies
> will appear here as they are authored.
