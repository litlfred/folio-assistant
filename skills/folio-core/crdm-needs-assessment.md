---
name: crdm-needs-assessment
roles: [reader, collaborator, owner]
description: >-
  Facilitate Phase 1 (Needs Assessment) of the CRDM requirements workflow.
  Identify the requester and stakeholders across active folios, gather source
  materials from chat, issues, uploads, and discussions, synthesise a
  jargon-free needs statement in domain language, post it to the linked GitHub
  issue via the gh CLI, and manage the feedback and iteration loop with the BA.
allowed-tools: Read Grep Glob Bash AskUserQuestion Write
---

# CRDM Phase 1 — Needs Assessment (`crdm-needs-assessment`)

> Skill id: `crdm-needs-assessment` · Capability: `requirements` · Package: `folio-core`  
> Process reference: [`crdm-requirements-workflow.md`](crdm-requirements-workflow.md) · BPMN: [`docs/workflows/crdm-requirements.bpmn`](../../docs/workflows/crdm-requirements.bpmn)

## Purpose and core discipline

This skill guides the agent through **Phase 1 (Needs Assessment)** of the Collaborative Requirements Development Methodology (CRDM).

When a feature request is detected (via `crdm-detect.md`), the default instinct of an AI agent is often to jump straight to technical architecture, schema editing, or code. **Do not do this.** Phase 1 exists to understand **what is needed and why** before anyone discusses *how* to build it. Most failed or mismatched software features fail because the solution was engineered before the problem and operational context were properly understood.

### Core rules

1. **No CRDM jargon with the user**: Never tell the user "We are entering Phase 1 of CRDM" or "I am performing a Needs Assessment". Use natural, collaborative language:
   - *"Let's make sure we have a clear picture of what is needed and who is affected before we design a solution."*
   - *"Could you tell me a bit more about how you currently handle this workflow?"*
2. **The agent asks questions; the BA provides domain knowledge**: The agent acts as facilitator and synthesiser. The requester (acting as Business Analyst / BA) provides the domain context, operational realities, and priority judgements.
3. **Never create an issue without BA permission**: Every feature requires a GitHub issue for stakeholder tracking and sign-off, but the agent must scan first and ask explicit permission before creating a new issue.
4. **Domain language only (STRICT)**: The needs statement must be written in the language of the business or content domain (e.g. guidelines, chapters, review matrices, translations), never in technical jargon (schemas, Zod types, ASTs, CLI flags).
5. **Issues are the source of truth**: The final synthesised needs statement belongs in a comment on the linked GitHub issue via `gh`, not buried in conversational chat history.

---

## The three actors in Phase 1

```
Stakeholders ──review/confirm──▶ BA / Requester ──directs/clarifies──▶ Agent
                                                ◀──synthesises/posts──┘
```

| Actor | Role in Phase 1 | Interaction model |
|---|---|---|
| **BA / Feature Requestor** | Identifies the initial need; answers probing questions about current workflows; reviews the synthesised needs statement; coordinates with stakeholders. | Direct interactive dialogue with the agent. |
| **Agent** | Facilitates needs elicitation; probes for root causes; systematically scans for stakeholders; gathers source artifacts; drafts the structured needs statement; posts to GitHub. | Interacts exclusively with the BA. |
| **Stakeholders** | People or teams affected by the proposed change. Confirm whether the needs statement accurately reflects their operational challenges. | Feedback is coordinated through the BA (never interacting with the agent directly). |

---

## Step 1: Identifying the requester and their role

Determine who is asking for the feature and what role they play in the project. The requester's role shapes their perspective, their primary pain points, and which aspects of the platform they interact with:

- **Business Analyst (BA) / Feature Coordinator**: Focuses on workflow completeness, business rules, and multi-stakeholder coordination.
- **Content Author**: Writes chapters, mathematical formulations, or normative guidance. Pain points usually involve friction in authoring, cumbersome markup, or slow feedback loops.
- **Editor / Managing Editor**: Responsible for editorial coherence, terminology compliance, cross-chapter styling, and publication readiness. Pain points usually involve proofreading bottlenecks, reference validation, or multi-format output fidelity.
- **Technical Reviewer / Subject Matter Expert (SME)**: Verifies scientific accuracy, proofs, or clinical validity. Pain points usually involve review tooling, diff inspection, comment tracking, or traceability to external evidence.
- **Programme Lead / Strategic Stakeholder**: Oversees governance, publication deadlines, compliance with organisational standards (e.g., WHO SMART guidelines), and cross-folio reuse. Pain points involve reporting, oversight, audit trails, and interoperability.

### How to identify:
1. If in an interactive session, observe the user's role and context from the discussion. If unclear, ask naturally:
   - *"To make sure we address the right workflow: in this folio, are you primarily authoring, editing, or managing the review process?"*
2. If working from a GitHub issue, check the author's profile, prior issues, and their stated role in the repository.

---

## Step 2: Systematic stakeholder identification

A change to the platform rarely affects only the person who asked for it. A change in block kinds, import mechanisms, rendering pipelines, or QA criteria ripples to other authors, downstream consumers, and reviewing bodies.

Systematically identify affected stakeholders using four discovery mechanisms:

### 1. Check `folio.config.json` roles across active folios
Examine active folio configurations (in the current repo and linked submodules or siblings):
```bash
# Search for declared roles in folio configurations
git grep -n "roles" -- "**/folio.config.json" "folio.config.json"
```
Look for:
- Declared project roles: `authors`, `editors`, `reviewers`, `contributors`, `affiliations`.
- Document profiles: Does the change impact document folios, paper folios, or DAK folios?
- Designated translators or regional focal points.

### 2. Check GitHub `CODEOWNERS`
Inspect `.github/CODEOWNERS` in the repository:
```bash
# Check code ownership for platform components affected
cat .github/CODEOWNERS
```
Identify:
- Owners of affected subsystems (e.g., pipeline scripts, adapters, schema definitions, documentation, CI workflows).

### 3. Check recent activity on related issues and PRs
Look for people who recently worked on or commented on the affected functionality:
```bash
# Search recent issues and PRs for the affected topic
gh issue list --search "<keyword>" --state all --limit 10
gh pr list --search "<keyword>" --state all --limit 10
```
Note the assignees, reviewers, and commenters.

### 4. Ask the BA directly
No repository scan catches institutional and organizational stakeholders. Always ask the BA:
- *"Who else is affected by this change?"*
- *"Who will need to review or use the output once this capability is added?"*
- *"Are there external review committees (e.g., SAG, guideline steering group) or downstream IT teams that need to sign off on this?"*

### Stakeholder categorisation
Summarise identified stakeholders into three operational categories:
1. **Decision makers & Approvers**: Those whose formal sign-off is required before adoption (e.g., Guideline Review Committee, Programme Director, Lead Architect).
2. **Direct operators**: People who will directly use the feature (e.g., Authors, Editors, Translators, Ingestion Operators).
3. **Downstream consumers**: People or systems that consume the output (e.g., Country adaptation teams, Clinical end users, Readers of generated PDFs/HTML, Publishing platforms).

---

## Step 3: Gathering source material

Requirements rarely arrive as clean, comprehensive specifications. They arrive in fragments across multiple channels. Gather and inspect all relevant sources before drafting the needs statement.

### Source channels and handling:

1. **Chat messages in the current session**:
   - Inspect conversational prompts, ad-hoc expressions of frustration, and descriptions of manual workarounds.
   - Note specific quotes that describe the problem.

2. **GitHub issue body and comments**:
   - Read the full issue discussion using the `gh` CLI:
     ```bash
     gh issue view <issue-number> --comments
     ```
   - Extract problem descriptions, user stories, and constraints raised by participants.

3. **Uploaded documents in `uploads/`**:
   - Users frequently upload source files representing the problem or content to be processed (e.g. Word `.docx`, PDF, Excel `.xlsx`, CSV, images).
   - Inspect the file metadata and contents:
     ```bash
     ls -la uploads/
     ```
   - Extract sample structures, formatting challenges, and volume expectations.

4. **Referenced documents in `library/`**:
   - Check background reference standards, published guidelines, or existing source materials:
     ```bash
     ls -la library/
     ```
   - Understand the formal context (e.g., WHO SMART Guidelines, DAK specifications).

5. **Attachments to GitHub issue comments**:
   - Check if the issue mentions external attachments, spreadsheets, mockups, or survey results.
   - Download or review attachments if accessible.

6. **Teams / email discussions pasted by the BA**:
   - Review pasted discussion transcripts for consensus points, dissenting opinions, and operational requirements.

### Discovery probing: "Begin with the end in mind"
When gathering source materials, probe beyond the surface request to uncover the real pain point:
- *Distinguish symptom from cause*: If the request is "We need to import Word files", probe for why: Is it because public consultation feedback arrives in Word? Or because external medical specialists don't use Git?
- *Identify manual workarounds*: Ask: *"How are you currently doing this today?"* Look for tedious copy-pasting, out-of-band email chains, or spreadsheet tracking.
- *Establish volume and scale*: Ask: *"How often does this happen, and at what scale?"* (e.g., 5 comments vs. 500 comments; 1 chapter vs. 50 documents).

---

## Step 4: Synthesising a needs statement

Consolidate all gathered material into a structured, jargon-free **Needs Statement**.

### Structural format:

1. **Current state**: What exists today. How the process or workflow is executed right now, including any manual workarounds, pain points, or complete lack of tooling.
2. **Gap**: What is missing, broken, or inadequate. The exact friction point where the current workflow falls short.
3. **Desired outcome**: What should happen after the capability is implemented. What success looks like from the perspective of the people doing the work (not the code).
4. **Who benefits and how**: A clear summary of the identified stakeholders and the concrete benefit or efficiency gain each will experience.
5. **Workflow rationale**: How this capability ties into a larger concrete workflow (e.g., guideline development, document ingestion, peer review, translation).

### The "No Jargon" discipline (STRICT)

The needs statement is for **business stakeholders and domain experts**, not compiler engineers.

| ❌ Technical specification (DO NOT USE) | ✅ Domain language (USE THIS) |
|---|---|
| "Add a Zod schema validator and an AST parser for `.docx` tables in `content/pipeline/ingest.ts`" | "Enable the platform to read tabular review feedback directly from Word documents submitted during public consultation." |
| "Implement an MCP tool that executes pandoc with Lua filters and outputs JSON sidecars" | "Provide a tool that converts submitted review matrices into structured feedback items ready for editorial review." |
| "Register a new block kind in `BLOCK_KINDS` with required `lean` fields" | "Allow authors to create formal mathematical definition blocks backed by machine-checked proofs." |
| "Add a CLI flag `--strict-refs` to fail the build if citation count is 0" | "Alert editors when a recommended clinical guideline does not cite supporting primary evidence." |

---

## Step 5: Associating with and posting to the GitHub issue

All CRDM deliverables live on a GitHub issue, which acts as the single source of truth for stakeholders.

### 1. Associate with an issue
Before posting, ensure an issue exists:
```bash
# Scan for matching open issues
gh issue list --search "<keywords>" --state open

# If no open match, check closed issues
gh issue list --search "<keywords>" --state closed --limit 5
```

- **If an open matching issue exists**: Confirm with the BA:
  - *"This looks related to issue #<number> ('<title>'). Should we record our needs assessment there?"*
- **If no matching issue exists**:
  - **CRITICAL RULE**: **NEVER create an issue without explicit permission from the BA.**
  - Propose the issue title and brief summary to the BA:
    - *"There is currently no open issue for this feature. Would you like me to create an issue titled '[Feature]: <clear domain title>'?"*
  - Only run `gh issue create` after receiving explicit consent:
    ```bash
    gh issue create --title "Feature: <Title>" --body "<Initial description>" --label "enhancement"
    ```

### 2. Post the needs statement via `gh`
Post the synthesised statement as a comment on the linked issue using `gh`:

```bash
# Post comment using a temporary file to avoid shell escaping issues
cat << 'EOF' > /tmp/needs-statement.md
## CRDM Phase 1: Needs Assessment

### 1. Requester & Context
- **Requester:** @<username> (<Role>, e.g. Managing Editor)
- **Folio / Area:** <affected folio or platform capability>
- **Trigger:** <Chat discussion / Issue #NN / Ingested document>

### 2. Stakeholders Identified
| Stakeholder / Group | Role in Workflow | Affected By |
|---|---|---|
| **<Group/Person 1>** | Approver / Governance | Final sign-off on guideline changes |
| **<Group/Person 2>** | Direct Operator | Authors entering content |
| **<Group/Person 3>** | Downstream Consumer | Translation teams adapting guidance |

### 3. Needs Statement
- **Current State:** <What exists today and how the work is currently performed, including manual workarounds.>
- **Gap:** <The specific breakdown, missing capability, or operational bottleneck.>
- **Desired Outcome:** <What the workflow should look like once resolved, and how success is measured.>
- **Who Benefits & How:** <Clear statement of value delivered to each stakeholder group.>

### 4. Workflow Rationale
<How this connects to the broader publication, clinical, or editorial process.>

### 5. Source Materials Gathered
- <Item 1: e.g. Chat discussion on 2026-09-25 regarding public consultation delays>
- <Item 2: e.g. Uploaded file uploads/consultation_matrix_v2.docx>
- <Item 3: e.g. Related discussion in Issue #197>

---
*Status: Drafted by Agent · Awaiting BA & Stakeholder review*
EOF

gh issue comment <issue-number> --body-file /tmp/needs-statement.md
rm /tmp/needs-statement.md
```

---

## Step 6: Requesting feedback and stakeholder coordination

Once posted to the issue, prompt the BA to review:

1. **Inform the BA**: Provide a direct link to the posted comment on GitHub.
2. **Ask targeted, non-jargon validation questions**:
   - *"I have posted the draft needs statement to issue #<number>. Could you review it to make sure it captures the real problem accurately?"*
   - *"Does the 'Current State' match your everyday experience?"*
   - *"Is the 'Desired Outcome' what you actually need, or is there an edge case we missed?"*
   - *"Are there any other teams, committees, or reviewers who should be tagged on the issue to take a look?"*
3. **BA coordinates with stakeholders**:
   - The BA shares the issue link with external stakeholders, steering groups, or team members.
   - Stakeholders post feedback on the issue or communicate through the BA.
   - The agent waits for the BA's guidance and does not reach out to external stakeholders directly.

---

## Step 7: Iteration and the approval gate

Requirements development is an iterative loop.

```
       ┌─────────────────────────────────────────────────┐
       ▼                                                 │
[Gather Materials] ──▶ [Draft Needs] ──▶ [Post to Issue] │
                              │                          │
                              ▼                          │
                     [BA/Stakeholder Review]             │
                              │                          │
                     Needs revision? ────────────────────┘
                              │
                         Approved!
                              ▼
                 [Transition to Phase 2 (BPA)]
```

### Handling feedback
- If the BA or stakeholders propose additions, point out omissions, or correct assumptions:
  1. Acknowledge the feedback and clarify any ambiguities.
  2. Update the needs statement.
  3. Post an updated comment to the GitHub issue (or edit the previous comment) clearly stating what was revised:
     - *"Updated per stakeholder feedback from @username: broadened scope to include Excel matrices in addition to Word files."*
- Repeat until consensus is reached.

### The Phase 1 exit gate
**Do not advance to Phase 2 (Business Process Analysis) until the BA explicitly approves the needs statement.**

When the BA gives approval:
1. Note the approval on the issue:
   ```bash
   gh issue comment <issue-number> --body "✅ **Needs Assessment Approved by BA (@<username>)**. Proceeding to Phase 2 (Business Process Analysis)."
   ```
2. Inform the BA in chat that the needs assessment is locked and you are ready to map the business process (Phase 2).

---

## Summary checklist for Phase 1

- [ ] Identified requester and their specific role in the project.
- [ ] Systematically checked stakeholders via `folio.config.json`, `CODEOWNERS`, issue activity, and direct inquiry.
- [ ] Gathered and inspected all source materials (chat, issues, uploads, library, external discussions).
- [ ] Probed for root causes ("begin with the end in mind") rather than accepting surface solutions.
- [ ] Synthesised needs statement in domain language (Current State, Gap, Desired Outcome, Who Benefits, Rationale).
- [ ] Ensured NO technical jargon or implementation details are present in the statement.
- [ ] Associated with an existing issue or received explicit permission to create a new one.
- [ ] Posted needs statement to the GitHub issue via `gh` CLI.
- [ ] Requested review from the BA and supported their coordination with stakeholders.
- [ ] Iterated based on feedback and received explicit approval before moving to Phase 2.

---

## Cross-references

- [`crdm-detect.md`](crdm-detect.md) — Feature-request detection trigger
- [`crdm-requirements-workflow.md`](crdm-requirements-workflow.md) — The complete 6-phase CRDM workflow
- [`staging-review.md`](staging-review.md) — Staging preview and before/after comparisons (Phase 6)
- [`todo-manager.md`](todo-manager.md) — Session task tracking and bean discipline (Phase 5 & 6)
- [`docs/workflows/crdm-requirements.bpmn`](../../docs/workflows/crdm-requirements.bpmn) — BPMN 2.0 workflow process definition
- [`content/docs/crdm-methodology/`](../../content/docs/crdm-methodology/) — Documentation source pages
- [CRDM Methodology Guide](https://litlfred.github.io/folio-assistant/crdm-methodology.html) — Published methodology guide
- Issue [#203](https://github.com/litlfred/folio-assistant/issues/203) — CRDM methodology integration
