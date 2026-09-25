# CRDM requirements workflow

Once a feature request is detected (see `crdm-detect.md`), the agent follows
this workflow to gather, validate, and implement requirements collaboratively.

## Actors

| Actor | Role | Swim lane |
|---|---|---|
| **BA / Feature Requestor** | The person who identified the need and coordinates the CRDM process. Acts as Business Analyst: interacts with the agent, reviews increments, translates stakeholder feedback into agent-actionable direction. May be an author, editor, programme lead, or reviewer. | BA / Feature Requestor |
| **Agent** | The LLM agent running in the folio-assistant harness. Facilitates the process, synthesises inputs, implements on feature branches, posts summaries to the issue. Interacts with the **BA only**, not with stakeholders directly. | Agent |
| **Stakeholders** | The people affected by the feature who must review and approve it. They participate at defined checkpoints (needs confirmation, requirements approval, MVP testing, feature sign-off) — not in the day-to-day development loop. Examples: review committee, country programme managers, IT teams, end users. | Stakeholders |

## BPMN reference

The full process is diagrammed in
[`docs/workflows/crdm-requirements.bpmn`](../../docs/workflows/crdm-requirements.bpmn).

## Phase 1 — Needs assessment

**Input:** the feature request (from chat, issue, discussion, or upload)

1. **Identify the requester** — who is asking?
2. **Identify stakeholders** — who else is affected? Check:
   - `folio.config.json` roles across active folios
   - GitHub CODEOWNERS
   - Recent activity on related issues
3. **Gather source material** — the request may come from:
   - Chat messages in the current session
   - A GitHub issue body or comment
   - An uploaded document (Word, PDF) in `uploads/`
   - A referenced document in `library/`
   - An attachment to a GitHub issue comment
4. **Synthesise a needs statement** — write a clear, jargon-free statement of
   what is needed and why, with rationale linking to a concrete workflow
5. **Post to the issue** — the synthesised needs statement goes on the GitHub
   issue as a comment, not in chat
6. **Request feedback** — ask the requestor and stakeholders to review

**Loop:** iterate until the needs statement is approved.

## Phase 2 — Business process analysis

**Input:** approved needs statement

1. **Find the current workflow** — check `docs/workflows/*.bpmn` for existing
   process diagrams that cover the affected area
2. **Map the gap** — where in the current workflow does the need appear?
   Identify the specific activity or decision point
3. **Document current state** — if no BPMN exists, document the as-is workflow
   in prose or create a new BPMN fragment
4. **Identify bottlenecks** — probe for the real pain point behind the stated
   request

**Post to the issue:** current-state workflow description with gap identified.

## Phase 3 — Requirements definition

**Input:** current-state analysis with identified gap

For each requirement:

1. **Functional requirement** — stated as "SHALL" / "SHOULD" / "MAY"
2. **Proposed implementation:**
   - Skill file (name, location, description)
   - MCP tool registration (if applicable)
   - Schema changes (Zod types, block kinds, constraints)
   - Pipeline changes (validators, renderers, scripts)
3. **Acceptance criteria** — testable conditions
4. **Cross-references** — link to related documentation pages under
   `content/docs/`, existing skills, existing workflows

**Post to the issue:** structured requirements with acceptance criteria.
See [`crdm-requirements-template.md`](crdm-requirements-template.md) for the
specification schema, conversational elicitation guide, and checklist template.

## Phase 4 — Impact analysis

**Input:** defined requirements

1. **Schema impact** — which types, constraints, builders change?
2. **Pipeline impact** — which scripts under `content/pipeline/` are affected?
3. **Adapter impact** — paper, document, dak? Does it ripple?
4. **QA impact** — new criteria? Modified criteria? Registry changes?
5. **Folio impact** — which active folios need migration?
6. **Test plan** — what tests to add or update?
7. **Migration plan** — steps, rollback, what breaks without it

**Post to the issue:** impact assessment and migration plan.
See [`crdm-impact-analysis.md`](crdm-impact-analysis.md) for the seven-dimension
scan methodology, migration planning, and structured issue template.

## Phase 5 — Sign-off and bean creation

**Input:** requirements + impact analysis reviewed and approved by stakeholders

1. **Post sign-off summary** on the issue — what was agreed, what was deferred
2. **Create beans** for each implementation unit:
   - Follow the check-before-create protocol (see `todo-manager.md`)
   - Reference the parent issue in each bean
   - Scope to a single PR-sized unit

## Phase 6 — Iterative development

**Input:** beans

For each bean:

1. **Create feature branch** — always, no exceptions
2. **Implement** — following the accepted requirements
3. **Open PR** — link to the bean and the parent issue
4. **Deploy staging preview** — the `feature-staging.yml` workflow
   auto-deploys to `STAGING/<branch-slug>/` on `gh-pages`. The magenta
   "FEATURE BRANCH" banner at the top of every page links to the source
   branch and provides a "compare with main" link.
5. **Post before/after comparison to issue** — use the `staging-review`
   skill. Every changed page gets a before (main) and after (staging)
   URL pair in a Markdown table. See `schemas/staging.ts` for the
   `StagingComparison` schema:
   ```
   | Page | Before (main) | After (staging) | What changed |
   |---|---|---|---|
   | Landing | [main](…) | [staging](…) | Added badge |
   ```
6. **Iterate on PR feedback** — code review is on the PR; visual review
   uses the staging preview URLs
7. **Ask user for explicit confirmation before merging to main**
8. **Update documentation** — content/docs/ pages, workflow BPMNs
9. **Staging cleanup** — staging previews are retained by default. To
   remove, the user must add the `staging:cleanup` label to the PR.
   **Do not remove staging without this label.**

When a round of implementation is complete (one or more beans resolved):
1. **Post a round summary comment on the issue** — addressed to the BA and
   stakeholders, containing:
   - What was accomplished in this round
   - What remains to be accomplished (open beans)
   - Links to updated content for review (staging URLs, docs pages)
   - Before/after comparison table for changed pages
2. **Never close the issue without explicit authorization** — the BA or
   stakeholder closes it, or the agent closes it only when the BA
   explicitly says to. An agent must never assume completion.

## Cross-references

- [CRDM methodology page](https://litlfred.github.io/folio-assistant/crdm-methodology.html) — the documentation page for users
- [`crdm-detect.md`](crdm-detect.md) — feature-request detection skill
- [`crdm-requirements-template.md`](crdm-requirements-template.md) — requirements definition template and guide (Phase 3)
- [`crdm-impact-analysis.md`](crdm-impact-analysis.md) — impact analysis and migration planning skill (Phase 4)
- [`staging-review.md`](staging-review.md) — before/after staging comparison skill
- [`todo-manager.md`](todo-manager.md) — bean creation protocol
- [`bean-coordination.md`](bean-coordination.md) — cross-session bean coordination
- [`coordinate.md`](coordinate.md) — session coordination
- [Publication workflow](https://litlfred.github.io/folio-assistant/publication-workflow.html) — the content lifecycle this fits within
- Issue [#203](https://github.com/litlfred/folio-assistant/issues/203)

