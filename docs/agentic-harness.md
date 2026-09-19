---
layout: default
title: Agentic harness
nav_order: 5
lang: en
---

# Agentic harness
{: .no_toc }

<details open markdown="block">
  <summary>On this page</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

_This page is generated from [`content/docs/agentic-harness/`](https://github.com/litlfred/folio-assistant/tree/main/content/docs/agentic-harness) — each section below links to its own source._

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/overview.md){: .fa-node-edit title="Edit content/docs/agentic-harness/overview.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/overview.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

The **agentic harness** is the interaction model that folio-assistant runs on —
the rules, states, and workflows that govern how an agent and a user collaborate
inside this platform. Much of this behaviour is already described across
individual skills and guidance documents; this page consolidates it into one
reference so that an agent entering a session can look up the expected behaviour
rather than reconstructing it from scattered rules.

This is not about the agent's internal architecture. It is about the
**observable contract** between the agent and the user: what states the
interaction can be in, how requests are classified, which workflow the agent
enters for each class, and what the user should expect at each stage.

---

## Interaction states
{: #interaction-states }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/interaction-states.md){: .fa-node-edit title="Edit content/docs/agentic-harness/interaction-states.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/interaction-states.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

A user–agent interaction is always in exactly one of two states:

### Idle state

The agent has no active workflow. It is waiting for a user request. On receiving
one, it classifies the request (see [Request classification](#request-classification))
and transitions into the appropriate workflow state.

### Workflow state

The agent is executing a named workflow — each represented by a BPMN process
diagram with the agent and user in separate swim lanes. The active workflow
determines what the agent does next and what it expects from the user.

Active workflows in this platform:

| Workflow | BPMN source | Entered when |
|---|---|---|
| **Authoring (paper)** | [`authoring-a-paper.bpmn`](../../skills/workflows/authoring-a-paper.bpmn) | User requests content authoring in a paper folio |
| **Authoring (document)** | [`authoring-a-document.bpmn`](../../skills/workflows/authoring-a-document.bpmn) | User requests content authoring in a document folio |
| **Content lifecycle** | [`content-lifecycle.bpmn`](../../skills/workflows/content-lifecycle.bpmn) | Content moves through validate → render → publish |
| **Document ingestion** | [`document-ingestion.bpmn`](../../skills/workflows/document-ingestion.bpmn) | User drops a file in `uploads/` |
| **Draft to publication** | [`draft-to-publication.bpmn`](../../skills/workflows/draft-to-publication.bpmn) | Content moves from draft to published |
| **CRDM requirements** | [`crdm-requirements.bpmn`](../../skills/workflows/crdm-requirements.bpmn) | Agent detects a feature request |
| **Evidence retrieval** | [`evidence-retrieval.bpmn`](../../skills/workflows/evidence-retrieval.bpmn) | Agent searches for evidence to support a claim |

**State transitions:** a workflow can be **suspended** when the user asks to
switch context. The agent records where it was (the current BPMN activity) and
can resume later. Only one workflow is active at a time, but suspended workflows
form a stack — the most recent is resumed first.

The key rule: **the agent always knows which workflow it is in**. If it does
not, it is in the idle state, and the next request starts a new workflow.

## Session lifecycle
{: #session-lifecycle }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/session-lifecycle.md){: .fa-node-edit title="Edit content/docs/agentic-harness/session-lifecycle.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/session-lifecycle.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

Every agent session follows the same lifecycle:

1. **Start** — run the session-start sweep (`beans prime`, `beans list`,
   `scripts/session-start-coord-sweep.sh`). This surfaces the current
   work-plan, how far the default branch has moved, and recent sibling branch
   activity. See `AGENTS.md § At session start`.

2. **Classify** — each user request is classified (see next section) and
   routed to the appropriate workflow.

3. **Execute** — the agent works within the active workflow, following its
   BPMN process. Each turn reports the bean being worked on and what is next.

4. **Commit** — every meaningful unit of work gets its own commit and push.
   PRs are opened at the first commit, not the end. See
   `AGENTS.md § Commit early, commit often, always PR`.

5. **Handoff** — when the session ends (user leaves, context limit, token
   exhaustion), the agent's durable state is:
   - Committed and pushed code
   - Beans updated with status and notes
   - Issue comments with summaries of what was accomplished
   - The chat is ephemeral; everything else survives

## Request classification
{: #request-classification }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/request-classification.md){: .fa-node-edit title="Edit content/docs/agentic-harness/request-classification.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/request-classification.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

Every user request is classified into one of these categories. The
classification determines which workflow the agent enters.

| Category | Description | Workflow entered |
|---|---|---|
| **Content authoring** | Write, edit, extend folio content (chapters, blocks, sections) | Authoring workflow (paper or document) |
| **Content review** | Review, validate, provide feedback on existing content | Content lifecycle / editing-HCI workflow |
| **Content ingestion** | Ingest a source document into the folio | Document ingestion workflow |
| **Feature request** | Request new platform capability (see [crdm-detect](../../skills/folio-core/crdm-detect.md)) | CRDM requirements workflow |
| **Information request** | Ask about the platform, content, or process | No workflow — answer directly |
| **Tool invocation** | Run a specific tool (`content_validate`, `qa_sweep`, etc.) | No workflow — execute and report |
| **Work-plan management** | Create, update, or query beans | No workflow — execute and report |
| **Bug report** | Report broken behaviour in existing features | Triage: fix directly if small, CRDM if redesign needed |

### The feature-request detection rule

The critical classification boundary is between **content authoring** and
**feature request**. The `crdm-detect` skill
([`skills/folio-core/crdm-detect.md`](../../skills/folio-core/crdm-detect.md))
provides the detailed detection signals. The summary rule:

> If implementing the request would require changes to **folio-assistant**
> (the platform repository) rather than to a **folio repository**, the request
> is a feature, and the agent should enter the CRDM workflow.

When uncertain, the agent asks: "This sounds like it might need a platform
change — is that right, or is this something I can do within the current
content model?"

## Content workflows
{: #content-workflows }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/content-workflows.md){: .fa-node-edit title="Edit content/docs/agentic-harness/content-workflows.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/content-workflows.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

When a request is classified as content work (authoring, review, ingestion),
the agent follows the corresponding BPMN workflow. The existing documentation
pages describe these in detail:

- **[Publication workflow](https://litlfred.github.io/folio-assistant/publication-workflow.html)** —
  the content lifecycle from draft through validation, rendering, and
  publication. Covers roles (author, reviewer, editor), the base processes,
  activities and skills.

- **[Document ingestion](https://litlfred.github.io/folio-assistant/document-ingestion.html)** —
  how a dropped file becomes an L1 source: extract structure, derive content,
  build the L1 knowledge graph, completeness gate.

- **Writing guides:**
  - [Writing a paper](https://litlfred.github.io/folio-assistant/guides-writing-a-paper.html)
  - [Writing a document](https://litlfred.github.io/folio-assistant/guides-writing-a-document.html)
  - [WHO SMART DAK](https://litlfred.github.io/folio-assistant/guides-who-smart-dak.html)
  - [WHO SMART IG](https://litlfred.github.io/folio-assistant/guides-who-smart-ig.html)

The harness does not redefine these workflows. It provides the **entry point** —
classifying the request and routing to the right one — and the **exit point** —
returning to idle state when the workflow completes, or suspending if the user
switches context.

## Feature-request workflow (CRDM)
{: #feature-request-workflow }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/feature-request-workflow.md){: .fa-node-edit title="Edit content/docs/agentic-harness/feature-request-workflow.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/feature-request-workflow.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

When a request is classified as a feature request, the agent enters the
**CRDM requirements workflow**
([full documentation](https://litlfred.github.io/folio-assistant/crdm-methodology.html),
[BPMN](../../skills/workflows/crdm-requirements.bpmn)).

The feature-request workflow is where this harness document adds the most
value, because it describes a behaviour that was previously implicit. The
authoring and review workflows have been documented for months; the
requirements workflow existed only as ad-hoc conversation.

### How the agent enters CRDM

The detection logic is in [`skills/folio-core/crdm-detect.md`](../../skills/folio-core/crdm-detect.md).
Three scenarios:

**New session, first request is a feature:**
→ Acknowledge, explain you will help work through requirements first, enter
Phase 1.

**Existing session, already in CRDM:**
→ Incorporate the new request into the current requirements document, continue.

**Existing session, doing content work:**
→ Synthesise the feature need, ask user whether to pause content work and
address it now or bean it for later.

### What the user sees

The agent does **not** say "entering CRDM mode" or use methodology jargon.
Instead:

> "This sounds like a platform change — something we'd need to add to
> folio-assistant itself. Before I build anything, let me help you work through
> exactly what's needed so we get it right. I'll document the requirements on
> the issue so others can weigh in."

### How the agent exits CRDM

The CRDM workflow exits when:
- All beans from the signed-off requirements are resolved, OR
- The user explicitly defers the remaining work

On exit, if a content workflow was suspended, the agent resumes it.

## User-provided content and sources
{: #user-provided-content }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/user-provided-content.md){: .fa-node-edit title="Edit content/docs/agentic-harness/user-provided-content.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/user-provided-content.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

Users provide content and source material through multiple channels. The agent
should accept all of them and route them into the appropriate pipeline:

| Channel | Example | Routed to |
|---|---|---|
| **`uploads/` directory** | User drops a Word doc, PDF, Excel file | Document ingestion pipeline |
| **`library/` references** | User references an already-ingested L1 source | Direct citation in content |
| **`content/` edits** | User edits a `.md` block directly | Content authoring workflow |
| **GitHub issue attachments** | User attaches a file to an issue comment | Agent downloads and processes |
| **Chat upload** | User uploads a file in the LLM chat interface | Agent saves to `uploads/` or processes inline |
| **URL reference** | User pastes a link to a document | Agent fetches and ingests if appropriate |

### For CRDM specifically

During requirements gathering, user-provided content is **input to
requirements**, not content to author. The agent should:

1. Read and understand the provided material
2. Extract requirements-relevant information
3. Synthesise it into the needs statement or requirements document
4. Reference the source in the issue comment (with link or attachment)

Example: a user uploads a public consultation feedback Excel spreadsheet. The
agent does not try to ingest it as folio content; it reads the feedback items
and synthesises them into requirements for the review triage tool.

## Issue and bean discipline
{: #issue-and-bean-discipline }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/issue-and-bean-discipline.md){: .fa-node-edit title="Edit content/docs/agentic-harness/issue-and-bean-discipline.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/issue-and-bean-discipline.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

Feature work must be linked to a GitHub issue. Content work uses beans. The
two are related but not synonymous.

### Issues vs beans

| | GitHub issue | Bean |
|---|---|---|
| **Scope** | A feature, requirement set, or user story | A single PR-sized unit of work |
| **Audience** | Stakeholders, requestor, BA | Agent, developer |
| **Lifecycle** | Open → requirements → sign-off → implementation → close | Created → in-progress → resolved |
| **Relation** | One issue has many beans | Each bean references its parent issue |

### Rules for agents

1. **Feature work → issue first.** Before implementing, check:
   - Is there an existing open issue? Search by keywords.
   - If no open match, check recently closed issues.
   - If no match at all, ask the user to create one. **Do not create an issue
     without user permission.**

2. **Always feature branch + PR.** No exceptions for feature work. The branch
   name should reference the issue number (e.g. `feat/197-word-import`).

3. **Always ask before merging to main.** The user must explicitly confirm.
   This is stricter than the general `AGENTS.md` rule for content work,
   because feature changes affect the platform.

4. **Post round summaries to the issue.** After each round of implementation
   (one or more beans resolved), post a comment on the linked issue containing:
   - What was accomplished in this round
   - What remains to be accomplished (open beans)
   - Links to updated content for review (staging URLs, docs pages)
   - Before/after comparison table for changed pages

5. **Never close an issue without explicit authorization.** The BA or
   stakeholder closes it. The agent closes it only when the BA explicitly
   says to. An agent must never assume completion.

6. **Requirements may span multiple issues.** The agent should link to all
   relevant issues and note the relationships.

7. **Beans are not issues.** `beans create` is for work-plan items. Issues are
   for stakeholder-facing requirements. Do not conflate them.

## Consolidated skill references
{: #consolidated-skill-references }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/consolidated-skill-references.md){: .fa-node-edit title="Edit content/docs/agentic-harness/consolidated-skill-references.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/consolidated-skill-references.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

The behaviour described on this page draws from skills and guidance documents
scattered across the repository. This section maps the consolidated behaviour
back to its authoritative sources.

| Behaviour | Source skill / document | Location |
|---|---|---|
| Session start sweep | `AGENTS.md § At session start` | [`AGENTS.md`](../../AGENTS.md) |
| Bean protocol | `todo-manager.md`, `bean-coordination.md` | [`skills/folio-core/`](../../skills/folio-core/) |
| Commit and PR discipline | `AGENTS.md § Commit early, commit often` | [`AGENTS.md`](../../AGENTS.md) |
| Feature-request detection | `crdm-detect.md` | [`skills/folio-core/crdm-detect.md`](../../skills/folio-core/crdm-detect.md) |
| CRDM requirements workflow | `crdm-requirements-workflow.md` | [`skills/folio-core/crdm-requirements-workflow.md`](../../skills/folio-core/crdm-requirements-workflow.md) |
| Content authoring (paper) | authoring-math skills | [`skills/authoring-math/`](../../skills/authoring-math/) |
| Content authoring (document) | folio-document-adapter skills | [`skills/folio-document-adapter/`](../../skills/folio-document-adapter/) |
| Content lifecycle | content-lifecycle skills | [`skills/content-lifecycle/`](../../skills/content-lifecycle/) |
| Document ingestion | `docs-generation.md` | [`skills/folio-core/docs-generation.md`](../../skills/folio-core/docs-generation.md) |
| Dispatch and coordination | `dispatch-agent.md`, `coordinate.md` | [`skills/folio-core/`](../../skills/folio-core/) |
| Content types and adapters | `AGENTS.md § Content types` | [`AGENTS.md`](../../AGENTS.md) |
| BPMN diagram authoring | `bpmn-authoring` skill | [`skills/folio-core/`](../../skills/folio-core/) |

**When a skill and this page disagree, the skill wins.** This page is a
consolidation, not a new authority. If you find a discrepancy, fix this page.

## What is not built yet
{: #what-is-not-built-yet }

[✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/content/docs/agentic-harness/what-is-not-built-yet.md){: .fa-node-edit title="Edit content/docs/agentic-harness/what-is-not-built-yet.md" } <span class="fa-qa-badges"><button type="button" class="fa-qa-badge fa-qa-pass fa-qa-fam-block" data-qa-family="block" data-qa-src="{{ '/assets/qa/agentic-harness/what-is-not-built-yet.block.json' | relative_url }}" aria-expanded="false" title="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses" aria-label="Content QA: 0 fail, 0 warn, 22 pass, 26 n/a — open for witnesses"><span class="fa-qa-tag">QA</span><span class="fa-qa-glyph" aria-hidden="true">✓</span></button> <span class="fa-qa-badge fa-qa-unswept fa-qa-fam-translation" title="Translation QA: not swept — no sidecar for this block" aria-label="Translation QA: not swept — no sidecar for this block"><span class="fa-qa-tag">TR</span></span></span>

- **Workflow state persistence** — the harness describes workflow suspension
  and resumption, but there is no mechanism to persist the agent's workflow
  state across sessions. Today this relies on beans and issue comments as
  proxies.

- **Automated request classification** — the classification table is a
  reference for agents to read; there is no classifier tool that routes
  automatically.

- **BPMN for beans lifecycle** — the beans work-plan has a lifecycle (create →
  claim → in-progress → resolve) that is discussed in `AGENTS.md` and the
  todo-manager skill but has no BPMN diagram.

- **BPMN for the agentic harness itself** — a top-level BPMN diagram showing
  the idle/workflow state machine and the classification routing is not yet
  authored.

- **Session handoff protocol** — the rules for what to commit before a session
  ends are in `AGENTS.md`, but there is no structured handoff artefact that a
  new session can read to resume exactly where the previous one left off.

**Tracked in:** [#203](https://github.com/litlfred/folio-assistant/issues/203)
