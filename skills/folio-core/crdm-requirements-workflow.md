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
[`skills/workflows/crdm-requirements.bpmn`](../../skills/workflows/crdm-requirements.bpmn).

## Every question you put to the BA carries its context first (STRICT)

This process is almost entirely questions. Six phases of them — needs, process,
requirements, impact, sign-off, feedback — and each one is the agent handing a
decision to a person who was not inside the analysis that produced it.

**So the ordering rule in
[`interaction-modality.md` §4.1](interaction-modality.md) governs this whole
workflow, not just its explicit checkpoints: context → options → recommendation
→ question.** Its test applies unchanged:

> **Can the BA answer without opening anything?**

Feature work breaks this in a way content work does not, and the reason is worth
naming. The agent has just done impact analysis, read the schemas, traced the
consumers — and the vocabulary it built doing that is the vocabulary it asks in.
Terms coined during the analysis feel defined, because to the agent they are.
Three specific traps:

- **An option name you invented.** "Prefix-at-rest or prefix-at-install?" names
  two things that exist nowhere outside your own head and your own issue.
  Describe what each one *does* instead, and put the coined name in parentheses
  if it earns its place at all.
- **A question that resolves to "go read the issue".** The issue is where the
  BA goes for depth. It is never where the question's terms are defined — and
  posting a question whose answer requires reading it is how a one-character
  decision becomes a twenty-minute one.
- **Options without their costs.** "A or B" is not a choice; "A, which changes
  nothing here, or B, which rewrites every `folio:skill` ref in the diagrams"
  is. The BA is deciding on the consequences, so the consequences are the
  question.

This applies to **every** surface this workflow uses: the chat, the summary
comment posted to the issue after each round, the PR body, and a bean's
`## Done when`. A question buried in an issue comment with its context two
comments up is the same defect wearing a different hat.

## Phase 1 — Needs assessment

**Input:** the feature request (from chat, issue, discussion, or upload)

1. **Identify the requester** — who is asking?
2. **Identify stakeholders** — who else is affected? Check:
   - `harness.config.json` roles across active folios
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

1. **Find the current workflow** — check `skills/workflows/*.bpmn` for existing
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
4. **Consumer burden** — see below. A requirement that shifts work onto the
   consumer is not done.
5. **Cross-references** — link to related documentation pages under
   `content/docs/`, existing skills, existing workflows

### Consumer burden is a requirement, not a nicety (STRICT)

**Every requirement states what a downstream consumer must do to use the
result — and the target is nothing.**

The standing rule, from the repository owner: *a downstream consumer must never
have to string-manipulate, re-derive, or assume a rule in order to use what we
publish.* If an artefact makes a consumer parse a name, strip a prefix,
substitute a base URL, or know a convention that is written down only in prose,
the requirement is not met.

Ask it in this form, because the failure is always phrased as a saving:

> *"We don't need to emit X — it can be derived from Y."*

That sentence is the smell. It is true and it is the wrong trade. **A rule a
consumer has to know is a rule a consumer can get wrong**, and the cost of
being wrong is paid by someone who cannot see the code that made the
assumption reasonable. Emitting the derivable field costs bytes in an artefact
that is regenerated on every build; the derivation rule costs correctness in
every consumer, forever, including ones not written yet.

Worked example, 2026-09-18. A preview knowledge graph's nodes could link back
to their canonical counterparts by swapping one base URL for another — the
fragment is identical by construction. The recommendation was to document the
rule and emit one link at document level: 1 field instead of 968. **Overruled,
correctly.** The 968 explicit `prov:alternateOf` links shipped, because an
agent consuming the graph should follow a link, not implement a substitution.

Three checks that catch most of it:

- **Would a consumer in another language need our source to understand this?**
  If yes, emit the field.
- **Is the convention stated anywhere a machine can read?** Prose in a skill is
  not machine-readable. A typed term in a `@context` is.
- **Does the artefact answer "what am I?" from itself?** A preview that needs
  an external convention to be told apart from the canonical version fails
  this. Put it in the type, not in a filename or a path segment.

This is also why the declaration file keeps a fixed name while artefacts are
stub-named: a consumer must be able to open a repository it has never seen
without first deriving a filename. See
[`directory-conventions`](directory-conventions.md) §Naming.

**Post to the issue:** structured requirements with acceptance criteria.

## Phase 4 — Impact analysis

**Input:** defined requirements

1. **Schema impact** — which types, constraints, builders change?
2. **Pipeline impact** — which scripts under `content/pipeline/` are affected?
3. **Adapter impact** — paper, document, dak? Does it ripple?
4. **QA impact** — new criteria? Modified criteria? Registry changes?
5. **Folio impact** — which active folios need migration?
6. **Consumer impact** — what must every downstream consumer change, and what
   must it now *know*? An impact analysis that lists only our own files has
   measured half the change. Enumerate: fields added or removed from published
   artefacts, IRIs or filenames that move, conventions a consumer would have to
   learn. **A convention added is an impact**, even when no file changed shape.
7. **Test plan** — what tests to add or update? Include at least one that
   asserts the consumer-facing contract, not only the internal one — a test
   over the emitted artefact, not over the function that built it.
8. **Migration plan** — steps, rollback, what breaks without it

**Post to the issue:** impact assessment and migration plan.

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
- [`interaction-modality.md`](interaction-modality.md) §4.1 — context before the question; the ordering rule this workflow runs on
- [`crdm-detect.md`](crdm-detect.md) — feature-request detection skill
- [`staging-review.md`](staging-review.md) — before/after staging comparison skill
- [`todo-manager.md`](todo-manager.md) — bean creation protocol
- [`bean-coordination.md`](bean-coordination.md) — cross-session bean coordination
- [`coordinate.md`](coordinate.md) — session coordination
- [Publication workflow](https://litlfred.github.io/folio-assistant/publication-workflow.html) — the content lifecycle this fits within
- Issue [#203](https://github.com/litlfred/folio-assistant/issues/203)

