---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
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

## Content authoring and editorial review (authoring-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Block Density](block-density.html) | `block-density` | — |  |
| [/canonical-watcher](canonical-watcher.html) | `canonical-watcher` | — | A concrete instance of `local/integration-watcher`. The parent encodes |
| [Chapter Complexity Review](chapter-complexity-review.html) | `chapter-complexity-review` | — |  |
| [Compute Integration Watcher](compute-integration-watcher.html) | `compute-integration-watcher` | — |  |
| [Content Graph](content-graph.html) | `content-graph` | — | cd content && python3 pipeline/content-graph-analysis.py |
| [Content types](content-profiles.html) | `content-profiles` | — | A **document** folio is structured prose: policy guidance, a standard, a report. |
| [/detangler-integration-watcher](detangler-integration-watcher.html) | `detangler-integration-watcher` | — | A concrete instance of `local/integration-watcher`. The parent encodes |
| [/devils-advocate-watcher](devils-advocate-watcher.html) | `devils-advocate-watcher` | — | A concrete instance of [`integration-watcher`](integration-watcher.md). |
| [Editor](editor.html) | `editor` | — |  |
| [Evidence review](evidence-review.html) | `evidence-review` | — | > Skill id: `evidence-review` · Package: `folio-core` |
| [/exposition-swarm-drain](exposition-swarm-drain.html) | `exposition-swarm-drain` | — | Bring every narrative block up to the **Milnor exposition standard** |
| [/integration-audit](integration-audit.html) | `integration-audit` | — | A maintenance command for the multi-axis QA-sidecar pipeline (`voice`, |
| [Markdown Authoring Conventions](md-authoring.html) | `md-authoring` | — |  |
| [The Milnor exposition standard](milnor-exposition-standard.html) | `milnor-exposition-standard` | — | **Three files sent readers here for this section and it did not exist.** |
| [One-Voice Audit](one-voice-audit.html) | `one-voice-audit` | — | grep -rEn "[✅❌⚠⏳🔧🚧☑☒]\|✓\|✗\|★" "$CONTENT" --include="*.md" |
| [/one-voice-integration-watcher](one-voice-integration-watcher.html) | `one-voice-integration-watcher` | — | A concrete instance of [`local/integration-watcher`](integration-watcher.md). |
| [One-Voice Style Guide](one-voice-style-guide.html) | `one-voice-style-guide` | — | > **See also:** `one-voice-audit` is the mechanical sweep (greps for |
| [Production vs exploratory vs numerology](production-vs-exploratory-discipline.html) | `production-vs-exploratory-discipline` | — | N_TRUNCATION = 5 |
| [Readability Editing](readability-editing.html) | `readability-editing` | — |  |
| [Review comments](review-comments.html) | `review-comments` | — | > Skill id: `review-comments` · Package: `folio-core` |
| [Review heat map](review-heatmap.html) | `review-heatmap` | — | > Skill id: `review-heatmap` · Package: `folio-core` · Bean: `qbfi` · Epic: `q4jm` |
| [Scientific Accuracy](scientific-accuracy.html) | `scientific-accuracy` | — |  |
| [Technical documentation](technical-documentation.html) | `technical-documentation` | — | The register is an SDO's — W3C, IHE. The reader is an implementer who was not |
| [Todo Review](todo-review.html) | `todo-review` | — | > **Disambiguation:** |
| [`uses[]` Editorial Review](uses-editorial-review.html) | `uses-editorial-review` | — |  |
| [Voice authoring guidance](voice-authoring-guidance.html) | `voice-authoring-guidance` | — |  |
| [Voice editorial review](voice-editorial-review.html) | `voice-editorial-review` | — |  |
| [Voice overlay review](voice-overlay-review.html) | `voice-overlay-review` | — |  |

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
| [Evidence Appraisal](evidence-appraisal.html) | `evidence-appraisal` | — | Appraise and grade a **body of evidence** against the grading system the folio |

## Agent conduct (conduct-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Subagent memory](agent-memory.html) | `agent-memory` | — | A subagent declaring project memory gets its own directory; the first **200 |
| [The language you communicate in](communication-language.html) | `communication-language` | — |  |
| [A confirmation can be waived](confirmation-waiver.html) | `confirmation-waiver` | — | Several rules here stop an agent and hand a decision back: merging to `main`, |
| [The comparison goes BEFORE the question, not inside the options](decision-comparison.html) | `decision-comparison` | — | [`interaction-modality`](interaction-modality.md) §4.1 fixes the *order* — |
| [Deletion requires explicit confirmation](deletion-requires-confirmation.html) | `deletion-requires-confirmation` | — | **One rule, and it has no exceptions worth the word:** |
| [/getting-started](getting-started.html) | `getting-started` | — | Process: [`folio-assistant-core/processes/conduct/getting-started.bpmn`](../../processes/getting-sta |
| [/interaction-modality](interaction-modality.html) | `interaction-modality` | — | Process: [`folio-assistant-core/processes/conduct/getting-started.bpmn`](../../processes/getting-sta |
| [/repo-conversion](repo-conversion.html) | `repo-conversion` | — | Process: [`folio-assistant-core/processes/conduct/getting-started.bpmn`](../../processes/getting-sta |
| [A falling-off retry rate, on every error](retry-backoff.html) | `retry-backoff` | — | Owner, 2026-09-20: **"as rule, use logarithmic fall-off on all errors. core |
| [symbiotic-interaction](symbiotic-interaction.html) | `symbiotic-interaction` | — |  |
| [Untrusted input](untrusted-input.html) | `untrusted-input` | — | One defect, three substrates. In every case something **substitutes a value |
| [Never encode a constraint you have not verified](unverified-constraints.html) | `unverified-constraints` | — | Owner, 2026-09-19: **"dont encode rules against a working setup."** |
| [Where does this go?](where-does-this-go.html) | `where-does-this-go` | — | > Skill id: `where-does-this-go` · Package: `folio-core` |

## Security — values crossing a boundary (security)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Injection](injection-boundaries.html) | `injection-boundaries` | — |   run: \| |
| [Path containment](path-containment.html) | `path-containment` | — | `src/core/safe-path.ts` is the implementation. This is when to reach for which, |
| [Security](security.html) | `security` | — | > **This value came from outside. What may I do with it?** |

## Platform core (folio-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Covered is not reachable](covered-is-not-reachable.html) | `covered-is-not-reachable` | — | **A skill can be satisfied by the *neighbours* of its mechanism while the |
| [MCP assembly](mcp-assembly.html) | `mcp-assembly` | — | [`mcp-projection`](mcp-projection.md) maps **one** Tool node to one MCP tool. |
| [MCP contract](mcp-contract.html) | `mcp-contract` | — | [`mcp-projection`](mcp-projection.md) emits a server. This checks the emitted |
| [MCP projection](mcp-projection.html) | `mcp-projection` | — | **The harness does not require MCP. It knows how to emit it.** That distinction |
| [Skills and Tools](skills-and-tools.html) | `skills-and-tools` | — | **A skill is a capability stated generically. A Tool content node is one |

## Graph management (graph-management)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Domain fencing](domain-fencing.html) | `domain-fencing` | — | > Skill id: `domain-fencing` · Package: `graph-management` |
| [Edge kinds and blast radius](edge-kinds-and-blast-radius.html) | `edge-kinds-and-blast-radius` | — | > Skill id: `edge-kinds-and-blast-radius` · Package: `graph-management` |
| [Graph detanglement](graph-detanglement.html) | `graph-detanglement` | — | > Skill id: `graph-detanglement` · Package: `graph-management` |
| [Graph rendering: one set of rules for every drawn graph](graph-rendering.html) | `graph-rendering` | — | > Skill id: `graph-rendering` · Package: `graph-management` |
| [Knowledge Graph separation](kg-separation.html) | `kg-separation` | — | > Skill id: `kg-separation` · Package: `graph-management` |
| [LSI indexing](lsi-indexing.html) | `lsi-indexing` | — | **The method is the node, not this file.** [`lsi`](https://github.com/litlfred/folio-assistant/blob/ |
| [Sub-KG lifecycle](sub-kg-lifecycle.html) | `sub-kg-lifecycle` | — | > Skill id: `sub-kg-lifecycle` · Package: `graph-management` |

## Knowledge graph — declaration, placement, export, audit (kg-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Artefact reachability](artefact-reachability.html) | `artefact-reachability` | — | **A declared executable artefact that nothing can reach is indistinguishable, |
| [Associate a harness](associate-harness.html) | `associate-harness` | — | The owner, 2026-09-23, on the ihris folio: |
| [Audit coverage](audit-coverage.html) | `audit-coverage` | — | **A sidecar count is a fine measurement of sidecars and says nothing about |
| [Code node review](code-node-review.html) | `code-node-review` | — |  |
| [Content, context and state graphs](content-context-and-state-graphs.html) | `content-context-and-state-graphs` | — | An instance declares directories, and each says what **kind** of graph it |
| [Corpus-Grep](corpus-grep.html) | `corpus-grep` | — | > **Disambiguation.** This skill formalizes the **backward** check |
| [Data modelling](data-modelling.html) | `data-modelling` | — | **One question, and everything else follows from it:** |
| [Directory conventions](directory-conventions.html) | `directory-conventions` | — | Every instance carries a **declaration** at its repository root — a `*.json` whose `name` field equa |
| [Flushable containers](flushable-containers.html) | `flushable-containers` | — | **A flushable container is a named store whose whole point is that it keeps |
| [`fsh-guts/`](fsh-guts.html) | `fsh-guts` | — | **Delete means relocate.** Nothing in this repository is removed with `rm` |
| [Harness requirements](harness-requirements.html) | `harness-requirements` | — | **Declaring a directory is a promise.** It says this instance holds a graph of |
| [Instance kinds](instance-kinds.html) | `instance-kinds` | — | Two different things are called a "kind" here, and a reader who conflates them |
| [instance-publication](instance-publication.html) | `instance-publication` | — | > Skill id: `instance-publication` · Package: `folio-core` · Instance: |
| [Offering the knowledge graph](kg-contribution-offer.html) | `kg-contribution-offer` | — | Owner, 2026-09-20: *"update CRDM process that when a user is done with |
| [KG export](kg-export.html) | `kg-export` | — | **`agentic-harness` has no renderer.** `folio` is the only `renderable` graph |
| [KG → package → distribution → portal](kg-to-portal.html) | `kg-to-portal` | — | A knowledge graph is in a repository. A portal — a Moodle site, a ministry's |
| [Placement](placement.html) | `placement` | — | **One question, answered before the first file exists:** |
| [Managing a schema](schema-management.html) | `schema-management` | — | **This skill does not restate where schemas live or how they are laid out.** |
| [Adding a](skill-registration.html) | `skill-registration` | — | One command, before you commit: |
| [Skill voice review](skill-voice-review.html) | `skill-voice-review` | — |  |
| [Surprise to corpus](surprise-to-corpus.html) | `surprise-to-corpus` | — | > Skill id: `surprise-to-corpus` · Package: `folio-core` |
| [UML overview: generated from declarations and schemas, never drawn](uml-overview.html) | `uml-overview` | — | **Every UML diagram here is generated.** Nothing in a class box is typed by |
| [Vocabulary authority](vocabulary-authority.html) | `vocabulary-authority` | — | > Skill id: `vocabulary-authority` · Package: `folio-core` |

## Knowledge-graph navigation (tooled)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Reading the knowledge graph](kg-navigation.html) | `kg-navigation` | — | You are in a fresh container. You have a task, a filesystem, and no memory of |

## Large data sets (subsetting, materializing, publishing)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Working on materialized content](copy-out-materialized.html) | `copy-out-materialized` | — | **Materialized content is a copy of somebody else's bytes, and this repository |
| [Subscribing to a knowledge graph](kg-subscription.html) | `kg-subscription` | — | Owner, 2026-09-30 (issue #1719): *"a way for a folio instance (or cat-harness |
| [Materialize on demand](materialize-on-demand.html) | `materialize-on-demand` | — | Bootstrap brings an agent to a working harness. It does **not** bring the |
| [Materializing remote content](materialize-remote.html) | `materialize-remote` | — | **One process, and this repository already ran it twice before naming it.** |
| [Sample import](sample-import.html) | `sample-import` | — | The SDLC for trying out a remote source before committing to it: take a |

## Library and information management (library-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Adopt a methodology from a source document](adopt-methodology-from-source.html) | `adopt-methodology-from-source` | — | The adoption **rules** are [`methodology-adoption`](methodology-adoption.md). This skill is the **op |
| [Asset extraction](asset-extraction.html) | `asset-extraction` | — | A container arrives in `uploads/`: a zip of a saved web page, a PDF, a |
| [Code lists](code-lists.html) | `code-lists` | — | Owner, 2026-09-23: *"we need an expandable option, not just declared in code. |
| [Acquisition is the step before ingestion, and it had no home](content-acquisition.html) | `content-acquisition` | — | `document-ingestion.bpmn` begins at **`StartEvent_Dropped` — "a file lands in |
| [Glossary terms](glossary-terms.html) | `glossary-terms` | — | The owner, 2026-09-23: *"put glossary into folio-assistant-core"*, *"it should |
| [Library ingestion](library-ingestion.html) | `library-ingestion` | — | `uploads/` and `library/` are two stages of **one** pipeline. `uploads/` is the |
| [Literature search](literature-search.html) | `literature-search` | — | A node cites a source. Nothing in any declared library holds it. This skill is |
| [Term disagreement](term-disagreement.html) | `term-disagreement` | — | > Skill id: `term-disagreement` · Package: `library-core` |
| [Translation manager](translation-manager.html) | `translation-manager` | — | > Skill id: `translation-manager` · Package: |
| [Upload naming](upload-naming.html) | `upload-naming` | — | > **Lives in `library-core`, not `folio-core`.** It was written into |
| [Two mechanisms and a persona](upload-routes.html) | `upload-routes` | — | [`content-acquisition`](content-acquisition.md) decides *what channel* a |
| [Watching the queue](uploads-watch.html) | `uploads-watch` | — | `uploads/` is the acquisition queue — |

## Process model — roles, authorization, methodology (process-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Compiled Artefact Cache](compiled-artefact-cache.html) | `compiled-artefact-cache` | — | This skill documents the generalisable pattern for caching compiled artefacts (such as Lean caches a |
| [Decision methodology selector](decision-methodology-selector.html) | `decision-methodology-selector` | — | **Input**: a decision context — what is being decided, how many alternatives, |
| [Adopting a methodology, and choosing between them](methodology-adoption.html) | `methodology-adoption` | — | **A methodology is somebody else's work, adopted whole.** It is not a house |
| [Roles are swimlanes](role-model.html) | `role-model` | — | One sentence carries the whole model: |
| [Swimlane Glossary](swimlane-glossary.html) | `swimlane-glossary` | — |  |
| [Running a SWOT scan](swot-analysis.html) | `swot-analysis` | — | **The method is not in this file.** It is the `swot` node in the `methodology` |
| [Task authorization](task-authorization.html) | `task-authorization` | — | > **Before an actor performs a task or answers a decision, the BPMN executor |

## RACI involvement model (skills/process/raci)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [RACI](raci.html) | `raci` | — | **The method is not in this file.** It is the `raci` node in the `methodology` |

## Workflow & process (workflow)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [bpmn-authoring](bpmn-authoring.html) | `bpmn-authoring` | [schema](../skills/bpmn-authoring.html) | > Skill id: `bpmn-authoring` · Package: `workflow` · |
| [Processes are BPMN, and the diagrams are executable](bpmn-processes.html) | `bpmn-processes` | — | **The `.bpmn` file is the source of truth.** The rendered SVGs are generated — |
| [Branch freshness](branch-freshness.html) | `branch-freshness` | — | A feature branch that drifts from `main` accumulates three kinds of debt: |
| [Code review process](code-review-process.html) | `code-review-process` | — | Code review is a **quality gate**, not a release gate. It happens at the |
| [The deterministic-to-agentic spectrum](deterministic-and-agentic.html) | `deterministic-and-agentic` | — | > **A spectrum of deterministic vs agentic BPMN state management / workflow |
| [dmn-authoring](dmn-authoring.html) | `dmn-authoring` | [schema](../skills/dmn-authoring.html) | > Skill id: `dmn-authoring` · Package: `workflow` · |
| [Process state](process-state.html) | `process-state` | — | An agent working a BPMN process holds **nested state**: a *task*, inside a |
| [Release epic planning](release-epic-planning.html) | `release-epic-planning` | — | A release epic groups all the work for a specific release version. |
| [Release lifecycle](release-lifecycle.html) | `release-lifecycle` | — | This skill governs **when and why** to create releases. For the **how** |
| [Render a Knowledge Graph to a CDN](render-kg-to-cdn.html) | `render-kg-to-cdn` | — | Owner, 2026-09-30: *"render content of a KG (or list of subgraphs within) for |
| [Session context](session-context.html) | `session-context` | — | A **session** is one actor working, from the moment it picks up until it stops. |
| [Playing a state machine](session-state-machine.html) | `session-state-machine` | — | > **An agent could also play a (non-deterministic) state machine as a tool. |
| [Specification-compiled agents](specification-compiled-agents.html) | `specification-compiled-agents` | — | Renders [`methodologies/specification-compiled-agents.md`](https://github.com/litlfred/folio-assista |
| [State in a running process](workflow-state.html) | `workflow-state` | — | A process instance is not self-contained. It walks a diagram that lives |

## CRDM requirements methodology (skills/sdlc/crdm)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [CRDM](crdm-data-model.html) | `crdm-data-model` | — | **This skill says WHEN and WITH WHOM. It does not say how to model.** That is |
| [Feature-request detection (CRDM trigger)](crdm-detect.html) | `crdm-detect` | [schema](../skills/crdm-detect.html) | Detect when a user request is a **feature request** (platform capability change) |
| [Phase 4](crdm-impact-analysis.html) | `crdm-impact-analysis` | — | This skill expands the Phase 4 summary in `crdm-requirements-workflow.md`. |
| [Phase 1](crdm-needs-assessment.html) | `crdm-needs-assessment` | — | This skill expands the Phase 1 summary in `crdm-requirements-workflow.md`. |
| [Phase 3](crdm-requirements-template.html) | `crdm-requirements-template` | — | This skill expands the Phase 3 summary in `crdm-requirements-workflow.md`. |
| [CRDM requirements workflow](crdm-requirements-workflow.html) | `crdm-requirements-workflow` | — | Once a feature request is detected (see `crdm-detect.md`), the agent follows |

## Software delivery practice — work plan, review, merge, CI, coordination (sdlc-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Activity log](activity-log.html) | `activity-log` | — | **Write an entry when you start a task, when you end one, and whenever you |
| [Adjudication](adjudication.html) | `adjudication` | — | > Skill id: `adjudication` · Package: `sdlc-core` |
| [One task, two agents, one human between them](agent-handoff.html) | `agent-handoff` | — | Two agents, two environments: the **coordinator** can see the work, but it |
| [Blocking is a claim about the work, not a mood](bean-blocking.html) | `bean-blocking` | — | `blocked` is the most expensive status a bean can carry, because a blocked bean |
| [Bean Coordination](bean-coordination.html) | `bean-coordination` | — | The **bean-based work-plan system** — the [`beans`](https://github.com/hmans/beans) |
| [/before-after-preview](before-after-preview.html) | `before-after-preview` | — | > Skill id: `before-after-preview` · Package: `sdlc-core` · Issue: #1710 · |
| [Branch archaeology: what each branch holds that main does not](branch-archaeology.html) | `branch-archaeology` | — | The question sounds like `git branch -r --no-merged`, and that command answers |
| [CI health](ci-health.html) | `ci-health` | — | **A workflow's outcome is invisible from the working tree.** Nothing in a |
| [/continual-progress](continual-progress.html) | `continual-progress` | — | Sibling agents and the author can only coordinate with work they can |
| [/coordinate](coordinate.html) | `coordinate` | — | When several Claude branches are converging on the same long-term goal |
| [A decision is not a finding, and neither is a substitute for the other](decision-audit.html) | `decision-audit` | — | A **finding** is an observation — a checker, an agent or a person saw something. |
| [Delivery Summary](delivery-summary.html) | `delivery-summary` | — | After completing a feature or edit (i.e., after pushing changes), provide: |
| [Deployment & Auth](deployment-auth.html) | `deployment-auth` | — |  |
| [Diff](diff.html) | `diff` | — | Show what changed at the content-block level, with viewer links and |
| [/dispatch-agent](dispatch-agent.html) | `dispatch-agent` | — | The expensive failure mode of multi-agent dispatch is **going dark**: you |
| [Feature-branch staging](feature-staging.html) | `feature-staging` | — |  |
| ["NOT clean" is a verdict about the RUN, not about your diff](gate-tree-mutation.html) | `gate-tree-mutation` | — | `bun run gates` snapshots the tree before the first gate and after every one, so |
| [Generalise the fix, then attack the generalisation](generalise-the-fix.html) | `generalise-the-fix` | — | A fix that repairs one instance and leaves its siblings is half a fix. A fix |
| [Reading GitHub state](github-state-inspection.html) | `github-state-inspection` | — | > Skill id: `github-state-inspection` · Package: `sdlc-core` |
| [Goal review](goal-review.html) | `goal-review` | — | Authored 2026-09-20 from a live session (bean `mgta`, issue #578): the owner |
| [Handover report](handover-report.html) | `handover-report` | — | An agent's state lives in three places that do not survive it: the chat, its |
| [idle-backlog](idle-backlog.html) | `idle-backlog` | — | Generalises a 5-minute idle-trigger / work-the-queue-while-idle policy that |
| [/integration-backlog](integration-backlog.html) | `integration-backlog` | — | A workflow skill that turns each integration-watcher's open findings |
| [/integration-watch](integration-watch.html) | `integration-watch` | — | A thin dispatcher in front of [`integration-watcher`](integration-watcher.md) |
| [integration-watcher (abstract parent)](integration-watcher.html) | `integration-watcher` | — | A concrete watcher (this skill's child) **watches incoming activity** |
| [Working an issue](issue-working.html) | `issue-working` | — | Two rules. Both exist because **your view of an issue and everyone else's |
| [Merge-conflict patterns](merge-conflict-patterns.html) | `merge-conflict-patterns` | — | `bun run merge:main` is the command; `processes/sdlc/merge-base.bpmn` is the |
| [Merge queue](merge-queue.html) | `merge-queue` | — | `processes/sdlc/merge-train.bpmn` is the process. The ORDER is computed by |
| [Does the prose say what the code does?](narrative-asserts-code.html) | `narrative-asserts-code` | — | Issue #1042, feature bean `flbx`, stage C. The owner, 2026-09-21: *"need to see |
| [Opening brief](opening-brief.html) | `opening-brief` | — | Split out of `todo-manager.md` on 2026-09-19 (bean `tdmg`), which had reached |
| [Cutting a package release](package-release.html) | `package-release` | — | A **release** is a version number that one commit keeps from then on: a tag, |
| [/pending-show](pending-show.html) | `pending-show` | — | Quick status display. Read-only. Run any time to answer "where am I?" |
| [Pickup](pickup.html) | `pickup` | — | Continue work on existing open PRs with minimal wasted tokens. This skill |
| [The platform's own gates](platform-gates.html) | `platform-gates` | — | **One command:** |
| [pr-description](pr-description.html) | `pr-description` | — | Owner, 2026-10-02, on litlfred/fhir-ig-publisher#8: *"PR should be readable |
| [Prepare for a handover](prepare-for-handover.html) | `prepare-for-handover` | — | When a session stalls, what survives is what is **on the remote**: commits on |
| [/prepare-merge-auto](prepare-merge-auto.html) | `prepare-merge-auto` | — | Runs the full `/prepare-merge` workflow PLUS: |
| [Prepare-merge](prepare-merge.html) | `prepare-merge` | — | Canonical, repo-agnostic skill for taking a `claude/*` (or any feature) branch |
| [Publish verification, and the one alert](publish-verification.html) | `publish-verification` | — | Bean `vigi`. Owner, 2026-09-23: *"a set of post processing tools for |
| [QA report signing](qa-report-signing.html) | `qa-report-signing` | — | A QA report becomes **evidence** when a third party can establish what was |
| [QA reports](qa-reports.html) | `qa-reports` | — | **A QA result is either reproducible or it is not, and that decides where it |
| [QA witnesses](qa-witness.html) | `qa-witness` | — | A **QA witness** is what a reader sees when they open the QA badge beside a |
| [Ref stewardship](ref-stewardship.html) | `ref-stewardship` | — | A **watched ref** is a long-lived branch that several processes write and that |
| [Related work: find it, sort it, ask](related-work-coordination.html) | `related-work-coordination` | — | Owner, 2026-09-23 (issue #1023): *"when CRDM is initiated/updated through human agent chat discussio |
| [/rendered-verification](rendered-verification.html) | `rendered-verification` | — | [`continual-progress`](continual-progress.md) argues that **a human cannot |
| [/session-intent](session-intent.html) | `session-intent` | — | A coordination failure mode recurs whenever agents have no durable |
| [Staging review](staging-review.html) | `staging-review` | — | > Skill id: `staging-review` · Package: `sdlc-core` |
| [Stalled-agent triage](stalled-agent-triage.html) | `stalled-agent-triage` | — | A stall is not an event anyone records. The agent simply stops, and what it |
| [Swarm management](swarm-management.html) | `swarm-management` | — | A swarm is several agents working one goal in parallel. It is the most |
| [Test Engineer](test-engineer.html) | `test-engineer` | — | bun test                              # from scripts/tests/ |
| [Running a test plan](test-plan-execution.html) | `test-plan-execution` | — | > Skill id: `test-plan-execution` · Package: `sdlc-core` · Process: |
| [Session Task Manager (`beans`)](todo-manager.html) | `todo-manager` | — | > **Disambiguation:** |
| [Turn reporting](turn-reporting.html) | `turn-reporting` | — | Split out of `todo-manager.md` on 2026-09-19 (bean `tdmg`), which had reached |
| [Untainted verification](untainted-verification.html) | `untainted-verification` | — | > Skill id: `untainted-verification` · Package: `sdlc-core` |
| [Adopting an upstream version bump](upstream-version-adoption.html) | `upstream-version-adoption` | — | An unpinned dependency is an unreviewed commit from a stranger, merged on every |
| [Visual diff](visual-diff.html) | `visual-diff` | — | > Skill id: `visual-diff` · Package: `sdlc-core` · Bean: `0rxe` · Epic: `q4jm` |
| [/watch](watch.html) | `watch` | — | A unified watcher that handles **branches** (poll `git ls-remote`) and |
| [Where a proposal goes](where-a-proposal-goes.html) | `where-a-proposal-goes` | — | **A design proposal is a comment on the issue it is for.** Not a page in |
| [Restructuring a work plan](work-plan-restructure.html) | `work-plan-restructure` | — | [`lsi-indexing`](lsi-indexing.md) §"Epic filing" |

## Spec Kit spec-driven development (skills/sdlc/spec-kit)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Spec Kit](spec-kit.html) | `spec-kit` | — |  |

## Theming (theming)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Create a sticky note](create-sticky-note.html) | `create-sticky-note` | — | A sticky note is a **carried note**: something a person or agent sticks onto the |
| [Site presentation assets](site-presentation-assets.html) | `site-presentation-assets` | — | **A visual fact has one home, and it is a node in the knowledge graph.** A |
| [Theme art intake](theme-art-intake.html) | `theme-art-intake` | — | Art arrives — three crops for a theme or an avatar — and the answer is either |
| [Per-artefact specialisation](theme-artefacts.html) | `theme-artefacts` | — | **This is level 3 of the axis, and it is deliberately the narrowest.** The |
| [Contrast: measured over the darkest thing that could be there](theme-contrast.html) | `theme-contrast` | — | **Consumer stage.** `generation` emits the ink; this says what the ink has to |
| [Declaring a theme](theme-declaration.html) | `theme-declaration` | — | **Producer stage.** Intake decides whether art may enter; this decides what is |
| [Generating a theme's CSS](theme-generation.html) | `theme-generation` | — | **Consumer stage.** `declaration` says what a theme is; this says what a |
| [Theming, split on the stage it fails at](theming.html) | `theming` | — | **Every file here is named for the skill it declares, and that is load-bearing |

## Rendering, UI and publication surfaces (ui-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [auto-docs](auto-docs.html) | `auto-docs` | — | `<base>/<handler>/auto-docs/<auto-doc-type>/<sub-graph>/` is an index of what |
| [Relationship first, visualisation later](board-diagram-interchange.html) | `board-diagram-interchange` | — | **One sentence, and it is the owner's:** |
| [Start in the avatar, open into a window](board-windows.html) | `board-windows` | — | The owner, 2026-09-20 and 2026-09-21: |
| [Documentation Generation](docs-generation.html) | `docs-generation` | — | cd content && bun run pipeline/build.ts \ |
| [A tile is the harness's, not the node's](harness-tiles.html) | `harness-tiles` | — | The owner, 2026-09-20, correcting the question rather than answering it: |
| [HTML Rendering QC](html-rendering-qc.html) | `html-rendering-qc` | — | grep -rn '\\operatorname' content/**/*.md |
| [Incremental render](incremental-render.html) | `incremental-render` | — | Owner, 2026-09-20, bean `9c34`: |
| [Rendering the knowledge graph](kg-viewer.html) | `kg-viewer` | — | `kg-export` serialises the instance's graph to one JSON-LD document. This skill |
| [Liquid templates](liquid-templates.html) | `liquid-templates` | — | Two engines run Liquid here, and they produce different kinds of output. Know |
| [Markdown Render Check](markdown-render-check.html) | `markdown-render-check` | — | git diff HEAD~1 HEAD --name-only -- '*.md' |
| [Inline PDF viewer](pdf-inline-viewer.html) | `pdf-inline-viewer` | — | > Skill id: `pdf-inline-viewer` · Package: `ui-core` · Bean |
| [A folio's README](readme-sections.html) | `readme-sections` | — | Two tools divide the file between them, and **between them no link in a folio |
| [Render logging](render-logging.html) | `render-logging` | — | Owner, 2026-09-20: *"a specialised Logger skill for the gh-pages rendering |
| [Render order](render-order.html) | `render-order` | — | Two things live here, and they are deliberately one skill: **the general |
| [Serving a rendering](serving-renderings.html) | `serving-renderings` | — | A **rendering** is what an instance publishes about itself. Running it produces |
| [At ingestion, and only at ingestion](theme-ui-review.html) | `theme-ui-review` | — | **The owner, 2026-09-23 and 2026-09-24**, settling bean `9fdi`: |
| [All UI must follow accessibility guidelines](ui-accessibility.html) | `ui-accessibility` | — | This is a **rule**, stated as one by the owner, and it binds every surface this |
| [Visualizer loading](visualizer-loading.html) | `visualizer-loading` | — | > Skill id: `visualizer-loading` · Package: `ui-core` · Beans `680p`, `s32v`, |
| [Wireframe design review](wireframe-design-review.html) | `wireframe-design-review` | — | Method: [`wiregen`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/methodologies/ |

## Content layer (folio-assistant-core)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Deep document research](deep-document-research.html) | `deep-document-research` | — | Renders `methodologies/doc-researcher.md` — Dong et al., arXiv:2510.21603v1 — |

## Content lifecycle refinements (content-lifecycle-ext)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [quality-control](quality-control.html) | `quality-control` | [schema](../skills/quality-control.html) | > Skill id: `quality-control` · Package: `authoring-who-smart-guidelines` · |

## Document adapter (folio-document-adapter)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [document-authoring](document-authoring.html) | `document-authoring` | [schema](../skills/document-authoring.html) | Author a **document** folio: policy guidance, a standard, a report, a |
| [document-publishing](document-publishing.html) | `document-publishing` | [schema](../skills/document-publishing.html) | Take a document folio from corpus to published artifact — without a TeX |
| [document-structure](document-structure.html) | `document-structure` | [schema](../skills/document-structure.html) | Decide and maintain the chapter/section skeleton of a document folio. |
| [normative-statements](normative-statements.html) | `normative-statements` | [schema](../skills/normative-statements.html) | Carry a **recommendation, requirement or rule** in a document folio — the |
| [public-comment](public-comment.html) | `public-comment` | — | > Skill id: `public-comment` · Package: `folio-document-adapter` · Process: |

## Catalogue records — Dublin Core renderings (catalogue)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Dublin Core renderings](dublin-core-renderings.html) | `dublin-core-renderings` | — | Bean `7eak`. The owner, 2026-09-30: *"do we render the proper xml for dublin |

## Cataloguing methods (cataloguing)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Materializing from arXiv](archiving-arxiv.html) | `archiving-arxiv` | — | arXiv is the easiest case to get *nearly* right, which is why it is worth its |
| [Archiving a web page](archiving-web-pages.html) | `archiving-web-pages` | — | **A URL is not an archive.** It is a request you hope somebody else keeps |
| [bib-human-review](bib-human-review.html) | `bib-human-review` | — | Status sidecar: `content/schema/references.review.json`. |
| [bib-photo-ingestion-watcher](bib-photo-ingestion-watcher.html) | `bib-photo-ingestion-watcher` | — | The automation half of the [`bib-human-review`](bib-human-review.md) workflow. |
| [Bibliography QA](bib-qa.html) | `bib-qa` | — | cd content && bun run pipeline/bib-qa.ts --check-urls |
| [Filing a source: what Dublin Core carries, and what it does not](filing-dublin-core.html) | `filing-dublin-core` | — | This is the **librarian's** half of intake, not the ingestion engine's. A file |
| [Glossary Build](glossary-build.html) | `glossary-build` | — |  |
| [Semantic Ontologist (Ambiguity Detection & Glossary)](ontologist.html) | `ontologist` | — |  |

## Document ingestion methods (ingestion)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Document Intake](document-intake.html) | `document-intake` | — | > **Bib human-review integration.** Track per-upload ingestion |
| [L1 document ingestion](l1-document-ingestion.html) | `l1-document-ingestion` | — | **This is a refinement, not the entry point.** The harness's |
| [Tabular metadata](tabular-metadata.html) | `tabular-metadata` | — | **The model is CSVW and nothing custom.** Bean `ulqj`, decided by the owner: |

## FHIR IG authoring (fhir-ig-authoring)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [fhir-validation](fhir-validation.html) | `fhir-validation` | [schema](../skills/fhir-validation.html) | > Skill id: `fhir-validation` · Package: `fhir-ig-authoring` · |
| [ig-publication](ig-publication.html) | `ig-publication` | [schema](../skills/ig-publication.html) | > Skill id: `ig-publication` · Package: `fhir-ig-authoring` · |
| [l3-fhir-authoring](l3-fhir-authoring.html) | `l3-fhir-authoring` | [schema](../skills/l3-fhir-authoring.html) | > Skill id: `l3-fhir-authoring` · Package: `fhir-ig-authoring` · |
| [terminology-management](terminology-management.html) | `terminology-management` | [schema](../skills/terminology-management.html) | > Skill id: `terminology-management` · Package: `fhir-ig-authoring` · |

## FHIR client & SMART launch (fhir-harness/skills/fhir-client)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [fhir-client-operations](fhir-client-operations.html) | `fhir-client-operations` | — | > Skill id: `fhir-client-operations` · Package: `fhir-client` · Instance: |
| [smart-launch](smart-launch.html) | `smart-launch` | — | > Skill id: `smart-launch` · Package: `fhir-client` · Instance: |

## FHIR IG build (fhir-harness/skills/fhir-ig-base)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [fhir-ig-create](fhir-ig-create.html) | `fhir-ig-create` | — | > Skill id: `fhir-ig-create` · Package: `fhir-ig-base` · Instance: `fhir-harness` |
| [ig-ast-delta](ig-ast-delta.html) | `ig-ast-delta` | — | > Skill id: `ig-ast-delta` · Package: `fhir-ig-base` · Instance: |
| [ig-binary-artefacts](ig-binary-artefacts.html) | `ig-binary-artefacts` | — | > Skill id: `ig-binary-artefacts` · Package: `fhir-ig-base` · Instance: |
| [ig-build-pipeline](ig-build-pipeline.html) | `ig-build-pipeline` | — | > Skill id: `ig-build-pipeline` · Package: `fhir-ig-base` · Instance: |
| [ig-publisher-fork](ig-publisher-fork.html) | `ig-publisher-fork` | — | > Skill id: `ig-publisher-fork` · Package: `fhir-ig-base` · Instance: |
| [ig-publisher-reduction](ig-publisher-reduction.html) | `ig-publisher-reduction` | — | > Skill id: `ig-publisher-reduction` · Package: `fhir-ig-base` · Instance: |
| [ig-render-jekyll](ig-render-jekyll.html) | `ig-render-jekyll` | — | > Skill id: `ig-render-jekyll` · Package: `fhir-ig-base` · Instance: |
| [ig-site-links](ig-site-links.html) | `ig-site-links` | — | > Skill id: `ig-site-links` · Package: `fhir-ig-base` · Instance: |
| [ig-site-theme](ig-site-theme.html) | `ig-site-theme` | — | > Skill id: `ig-site-theme` · Package: `fhir-ig-base` · Instance: |

## WHO IRIS (catalogue instance)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [IRIS, DSpace and Dublin Core](iris-dspace.html) | `iris-dspace` | — | **Every claim here was read off one captured record** — the DSpace full item |

## Mathematical authoring (authoring-math)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [latex-authoring](latex-authoring.html) | `latex-authoring` | [schema](../skills/latex-authoring.html) | > Skill id: `latex-authoring` · Package: `authoring-math` · |
| [lean-formalization](lean-formalization.html) | `lean-formalization` | [schema](../skills/lean-formalization.html) | > Skill id: `lean-formalization` · Package: `authoring-math` · |
| [proof-verification](proof-verification.html) | `proof-verification` | [schema](../skills/proof-verification.html) | > Skill id: `proof-verification` · Package: `authoring-math` · |

## Paper adapter (folio-paper-adapter)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [/build-docs](build-docs.html) | `build-docs` | — | Builds the Lean HTML documentation using `doc-gen4` locally, to save CI |
| [/build-pdf](build-pdf.html) | `build-pdf` | — | Builds the PDF locally to save CI minutes: the monolithic `main.pdf` and |
| [Category Theory Formalization](category-theory.html) | `category-theory` | — |  |
| [Chapter Analysis & Formalization](chapter-analysis.html) | `chapter-analysis` | — |  |
| [Compute Audit](compute-audit.html) | `compute-audit` | — | python3 script.py --args ... |
| [Compute-author](compute-author.html) | `compute-author` | — |  |
| [Content Block Review](content-block-review.html) | `content-block-review` | — |  |
| [Content Validation](content-validation.html) | `content-validation` | — | bun run cat-harness/content/pipeline/validate.ts content/<paper>   # after setup-folio-assistant.sh |
| [Critical Path Analysis & Context Review](critical-path-analysis.html) | `critical-path-analysis` | — |  |
| [definition-clarity-audit](definition-clarity-audit.html) | `definition-clarity-audit` | — | A content block can be **schema-clean, ref-resolving, proof-backed** and still be |
| [FFI roundtrip audit](ffi-roundtrip-audit.html) | `ffi-roundtrip-audit` | — | total = mp.mpf(0) |
| [Lean 4 Formalizer (Narrative to Proof)](formalizer.html) | `formalizer` | — | The base ring rule, import ordering, and library synthesis. Read before |
| [Gröbner Basis](groebner-basis.html) | `groebner-basis` | — |  |
| [LaTeX build performance](latex-build-cache.html) | `latex-build-cache` | — | ``` |
| [LaTeX Validation](latex-validation.html) | `latex-validation` | — |  |
| [Lean Build Fix](lean-build-fix.html) | `lean-build-fix` | — |  |
| [Lean cache: the authoring loop](lean-cache-restore.html) | `lean-cache-restore` | — | > This is an instantiation of the general compiled-artefact-cache pattern. See `cat-harness/skills/p |
| [Lean Completeness Audit](lean-completeness-audit.html) | `lean-completeness-audit` | — | find content/<paper>/lean/ -name '*.lean' -not -path '*/.lake/*' \| sort |
| [Lean Environment Setup](lean-environment-setup.html) | `lean-environment-setup` | — | A proven workaround for one specific failure: `lake exe cache get` returning |
| [Lean formal dependency graph](lean-formal-graph.html) | `lean-formal-graph` | — | bun run content/pipeline/content-graph.ts content/<paper> |
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
| [Proof Narrative ↔ Lean Equivalence Audit](proof-narrative-lean-equivalence.html) | `proof-narrative-lean-equivalence` | — | > **Specialises [`narrative-asserts-code`](narrative-asserts-code.md)** |
| [Proof Simplifier](proof-simplifier.html) | `proof-simplifier` | — | bun run content/pipeline/refactor-strategy.ts --lean 4.24.0 --applicable |
| [Proof Status Tracking](proof-status-tracking.html) | `proof-status-tracking` | — |  |
| [Proof Triage & Resolution](proof-triage.html) | `proof-triage` | — | [[require]] |
| [/proposition-consolidation-audit](proposition-consolidation-audit.html) | `proposition-consolidation-audit` | — | grep -lE "^export default (proposition\|theorem\|lemma\|corollary)" \ |
| [/q-usage-watcher](q-usage-watcher.html) | `q-usage-watcher` | — | > **Folio-optional axis.** The `q-usage` criteria encode a substrate |
| [Remark Audit](remark-audit.html) | `remark-audit` | — | cd content && grep -rl '"remark"' --include='*.ts' \| sort |
| [Rendering Auditor](rendering-auditor.html) | `rendering-auditor` | — | cd content && bun run pipeline/build.ts <paper>/<paper>.ts \ |
| [Rendering Fixes](rendering-fixes.html) | `rendering-fixes` | — |  |
| [Semantic review scoping](semantic-review-scoping.html) | `semantic-review-scoping` | — |  |
| [Simulator Math Audit](simulator-math-audit.html) | `simulator-math-audit` | — |  |
| [Simulator](simulator.html) | `simulator` | — |  |
| [Verify Anchor Connectivity](verify-local-substrate.html) | `verify-local-substrate` | — |  |
| [Witnessed Values](witnessed-values.html) | `witnessed-values` | — |  |

## Synced from claude-scientific-skills (pinned, read-only)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Scientific Visualization](scientific-visualization.html) | `scientific-visualization` | — | Build figures that preserve scientific meaning before optimizing appearance. Separate universal prin |

## Synced from claude-scientific-skills (pinned, read-only)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Scientific Visualization](scientific-visualization.html) | `scientific-visualization` | — | Build figures that preserve scientific meaning before optimizing appearance. Separate universal prin |

## Synced from claude-scientific-skills (pinned, read-only)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Scientific Visualization](scientific-visualization.html) | `scientific-visualization` | — | Build figures that preserve scientific meaning before optimizing appearance. Separate universal prin |

## Science layer: Lean tooling (folio-assistant-sci)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Lean formal edges (elaborated)](lean-formal-edges.html) | `lean-formal-edges` | — | bun run folio-assistant-sci/content/pipeline/formal-edges.ts \ |

## Science layer: reference data (folio-assistant-sci)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [Reference dataset ingestion](reference-dataset-ingestion.html) | `reference-dataset-ingestion` | — |  |

## WHO SMART Guidelines (authoring-who-smart-guidelines)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [dak-postprocessing](dak-postprocessing.html) | `dak-postprocessing` | — | > Skill id: `dak-postprocessing` · Package: `authoring-who-smart-guidelines` · |
| [dak-preprocessing](dak-preprocessing.html) | `dak-preprocessing` | — | > Skill id: `dak-preprocessing` · Package: `authoring-who-smart-guidelines` · |
| [grade](grade.html) | `grade` | — | > Skill id: `grade` · Package: `authoring-who-smart-guidelines` · The grading |
| [ig-artifact-ingestion](ig-artifact-ingestion.html) | `ig-artifact-ingestion` | — | > Skill id: `ig-artifact-ingestion` · Package: `authoring-who-smart-guidelines` · |
| [l2-dak-authoring](l2-dak-authoring.html) | `l2-dak-authoring` | [schema](../skills/l2-dak-authoring.html) | > Skill id: `l2-dak-authoring` · Package: `authoring-who-smart-guidelines` · |
| [smart-base Toolchain](smart-base-tools.html) | `smart-base-tools` | — | > Skill id: `smart-base-tools` · Package: |
| [smart-guideline-create](smart-guideline-create.html) | `smart-guideline-create` | — | > Skill id: `smart-guideline-create` · Package: `authoring-who-smart-guidelines` |
| [smart-stack-layering](smart-stack-layering.html) | `smart-stack-layering` | — | > Skill id: `smart-stack-layering` · Package: `authoring-who-smart-guidelines` |
| [toolchain-ownership](toolchain-ownership.html) | `toolchain-ownership` | — | > Skill id: `toolchain-ownership` · Package: `authoring-who-smart-guidelines` · |

## Local skills (.claude/skills/local)

| Skill | Id | Schema | Summary |
|-------|----|--------|---------|
| [bean-coordination](local-bean-coordination.html) | `bean-coordination` | — | **This is a stub. The skill lives in the `kg` graph, not here.** |
| [/language-trap-agent-audit](local-language-trap-agent-audit.html) | `language-trap-agent-audit` | — | The mechanical scanner (`content/pipeline/language-trap-audit.ts`) |
| [todo-manager](local-todo-manager.html) | `todo-manager` | — | **This is a stub. The skill lives in the `kg` graph, not here.** |

> The `authoring-math` and `authoring-who-smart-guidelines` packages ship
> skill *definitions* + typed schemas today; their prose instruction bodies
> will appear here as they are authored.
