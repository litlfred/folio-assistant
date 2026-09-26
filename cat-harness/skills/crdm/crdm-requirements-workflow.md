---
name: crdm-requirements-workflow
graph-kinds:
  - proposals
  - requirements
---

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

[`processes/crdm-requirements.bpmn`](../../processes/crdm-requirements.bpmn)
is the outer process — detection, the `Feature?` decision, then six phases, each
a real subprocess in its own file:

| phase | file | what happens |
|---|---|---|
| Link the work to an issue | `crdm-issue-linking.bpmn` | scan, then link or ask; never create without permission |
| Phase 1 — needs | `crdm-needs.bpmn` | stakeholders, needs statement, loop until recognised |
| Phases 2–4 — BPA + requirements | `crdm-requirements-definition.bpmn` | current workflow, requirements, impact, loop until approved |
| Phase 4b — prioritization | *(inline in Phase 4 exit)* | dependency-order capability areas, formalize-first rule, BA confirms |
| Phase 5 — beans + sign-off | `crdm-signoff.bpmn` | requirements become beans, BA signs off, branch announced |
| Phase 6 — implement + acceptance | `crdm-deliver.bpmn` | implement, review increment, share MVP, take findings |
| Close-out | `crdm-close.bpmn` | stakeholder sign-off, BA confirmation, then the close |

**Nothing about running it changes.** Step ids are unchanged, so
`workflow_complete` still takes `A_Implement`, `A_Close`, `BA_Signoff` by name;
the interpreter enters a phase by itself and `workflow_next` tells you which one
you are in (`inside: Phase 6 Implement + acceptance`). You cannot complete a
phase — a phase is done when its steps are.

**Phase 6 is one subprocess and not three** because the loops say so: a rejected
increment, an MVP that is not ready, and stakeholder findings all route back into
implementation. A subprocess has one exit and cannot be re-entered once finished,
so splitting that region would have changed what the diagram says.

## Every question you put to the BA carries its context first (STRICT)

This process is almost entirely questions. Six phases of them — needs, process,
requirements, impact, sign-off, feedback — and each one is the agent handing a
decision to a person who was not inside the analysis that produced it.

**So the ordering rule in
[`interaction-modality.md` §4.1](../../skills/folio-core/interaction-modality.md) governs this whole
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
  nothing here, or B, which rewrites every `bootstrap.processes:skill` ref in the diagrams"
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
   - `<name>.config.json` roles across active folios
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

1. **Find the current workflow** — check `processes/*.bpmn` for existing
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
[`directory-conventions`](../../skills/folio-core/directory-conventions.md) §Naming.

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

### When the analysis yields more than one viable approach

Phase 4 often ends with a **choice** rather than a plan, and that is the moment
the BA is handed a decision. Not a list of approach names with the analysis
linked: a **comparison**, per
[`decision-comparison`](../../skills/folio-core/decision-comparison.md) — per option its pro, its con,
what it changes **downstream** and how reversible it is, laid out where the rows
can be read against each other, then one recommendation and a stated default.

Items 1–6 above have just enumerated the downstream question for the change as a
whole; per option is that same question once per row, so an agent that leaves
the column empty is discarding work it has already done. And this phase breaks
the rule more than any other, because the vocabulary it just built *feels*
defined to the agent and is new to everybody else.
## Phase 4b — Prioritization and dependency ordering

**Input:** impact analysis complete, possibly multiple capability areas identified

When a feature request decomposes into **more than one capability area** (as
most non-trivial requests do), the agent must explicitly order them before
creating beans. This is not optional — skipping it produces a flat bean list
with no implementation sequence, and the first session that picks it up will
either guess the order (often wrong) or ask the BA (wasting their time on a
question the analysis already answered).

### The prioritization protocol

1. **Identify capability areas** — each is a coherent cluster of requirements
   that can be implemented and reviewed independently. Name them.

2. **Map dependencies** — draw the dependency graph:
   - Does area A define concepts that area B assumes?
   - Does area A produce artefacts that area B consumes?
   - Does area A change structure that area B builds on?
   If yes, A must precede B.

3. **Apply the formalize-first rule** — within the dependency order:
   - **Structural/organizational** work first (taxonomies, indexes, schemas)
   - **Process/policy** formalization second (skills, workflows, conventions)
   - **Implementation** third (code, pipelines, tools)
   - **Visualization/UI** last (dashboards, pages, views)

   This is not arbitrary — a visualization built before the process is
   formalized will be rebuilt; a process formalized before the structure is
   organized will reference the wrong paths.

4. **Present the order to the BA** — as a dependency chain, not a list:
   ```
   Area 5 (structure) → Area 2 (process) → Area 3 (review) → Area 4 (planning) → Area 1 (visualization)
   ```
   With one sentence per arrow explaining **why** the dependency exists.

5. **BA confirms or reorders** — the agent proposes, the BA decides. The BA
   may override the dependency order (e.g. "I need the visualization first
   even if it's throwaway") — that's a legitimate business decision, and
   the agent records it as such rather than arguing.

### What this step produces

- A numbered list of capability areas in implementation order
- A dependency rationale for each ordering decision
- An estimate of scope per area (bean count)
- A recommendation for which areas constitute the MVP release

**Post to the issue** alongside the impact analysis. This becomes the
input to Phase 5's bean creation — beans are created in dependency order,
not in the order the BA mentioned them.

### Cross-domain applicability

This step applies identically to code features, paper milestones, and
project deliverables. The formalize-first rule is domain-independent:
a paper's structure (chapter order, block kinds) must precede its
content (prose), which must precede its presentation (PDF layout).

## Phase 5 — Sign-off and bean creation

**Input:** requirements + impact analysis reviewed and approved by stakeholders

1. **Post sign-off summary** on the issue — what was agreed, what was deferred
2. **Create beans** for each implementation unit:
   - Follow the check-before-create protocol (see `todo-manager.md`)
   - Scope to a single PR-sized unit
   - Reference the parent issue in each bean
3. **Offer the knowledge-graph destinations** for the agreed set — `A_OfferKg`,
   `BA_ChooseKg`, `A_RecordKg` in `crdm-signoff.bpmn`. **This step is not
   optional and its default creates nothing.** See below.

### The agreed set is an ASSET, and Phase 5 is where it gets a home

Owner, 2026-09-21, on a run where this step had been reached and the offer left
`docs/` out of it:

> this is a memory asset as part of design, so it goes into docs/ […] if it is
> realated to some harness/feature/tool that detailed infromation/design/
> planning/etc go into that harness' docs/

**Requirements are produced while BUILDING, and they are not the thing built.**
Without this step they end as an issue and a conversation — which is how the
output of the process that exists to produce durable requirements becomes the
one thing the knowledge graph never learns.

Three rules, and the first is the one a run skips:

- **Ask; never pick silently.** The destinations are DERIVED from the owning
  instance's declared graphs at the time of asking, `none` is a listed answer,
  and if nobody answers **nothing is created** and *"asked, answered none"* is
  recorded. `kg-contribution-offer` carries the option set and the question
  that identifies a design-memory asset.
- **It goes in the OWNING instance's `docs/`** — a `cat-harness` feature's
  reasoning in `cat-harness/docs/`, a folio's subject matter not in the
  platform at all. `placement` decides where inside it: `architecture/` for why
  it is shaped this way, `guides/` for how a person does something with it,
  `reference/` for generated material that is never hand-edited.
- **Not `fsh-guts`.** That is the declared non-rendered trashcan and its
  content may be thrown away or lost. A design record's whole value is that it
  survives the conversation that produced it.

**What separates the record from the skills the same phase produces:** a skill
carries what a competent practitioner needs *in order to do* the task;
everything past that line — background, options not taken, how to reach a data
source, an API's full surface when the task touches three calls — is
documentation. Both directions fail silently, so state which one you are
writing before you write it.

### A harness feature's documents: proposed in `docs/proposals/`, filed in `docs/requirements/` (STRICT)

Owner, 2026-09-23 (issue #1164): when the feature is **the harness's own**, the
documents this process produces (initial analysis, MVP, the options, the
agreed requirements) **live and are updated under `docs/`**, in two declared
sub-graphs of it.

| stage | where | what it is | checked by |
|---|---|---|---|
| Phases 1–5, and while building | `docs/proposals/<slug>.md` | the argument: needs, options, MVP, what was agreed | — |
| the feature ships | `docs/requirements/<slug>.md` | the promise: its front matter is a `Requirement` | `check:requirements` |

Both kinds, `proposals` and `requirements`, declare `within: "docs"`. Every
list of kinds (the navbar's Folders among them) therefore draws them inside
the Docs row, **folded shut until the reader opens it**. That is general
behaviour for any kind declaring `within`, not a special case for these two.

**One proposal per feature, updated in place, never forked.** A later phase
edits the same page rather than writing a second one, so the history of the
argument is `git log` on one file.

**Filing on ship is a MOVE, never a copy.** In Phase 6, once the owner has said
to merge:

1. `git mv docs/proposals/<slug>.md docs/requirements/<slug>.md`, so
   `git log --follow` walks the requirement back through its argument.
2. Add the `Requirement` fields to its front matter, from
   `bootstrap/schemas/requirement.schema.json`:
   - `id: req:<slug>`. The id IS the file name.
   - `status: in-force`
   - `proposedIn`: the old path.
   - `actors`, `description`.
   - `statements`: one per agreed requirement, each with a `key`, a
     `conformance` level (`SHALL`, `SHOULD`, `MAY` or `SHALL NOT`) and one
     `requirement` sentence a reviewer can say yes or no to. A `functional`
     statement may add `activity`, `capability` ("I want") and `benefit`
     ("so that"). A `non-functional` one may add a `category`.
   Keep the body: the reasoning stays with the promise it produced.
3. Point the feature's test runs at the statements they check, in
   `folio-test-run/v1`'s `requirements` array, as `req:<slug>#<key>`. **The test
   points at the requirement, never the reverse.**
4. `bun run check:requirements`. It refuses a slug that is in both sub-graphs
   (a copy, or a proposal landing on an existing requirement), an id that is
   not its file name, and front matter the schema rejects.

**The schema names no outside concept.** It lives in bootstrap, so every
harness has it, and `check:bootstrap-concepts` fails if any bootstrap schema
names a derivative's content model, layer names, organisation or interchange
standard. A harness that follows a particular standard maps that standard's
fields onto these fields **in its own layer**, never in the base.

**Not yet decided, and not to be improvised:** how filed requirements are
*organised* beyond one page per feature: grouping, numbering across features,
traceability between requirements, retirement. The owner asked for a process
and methodologies, and those wait on the literature search (bean `qh1s`) and on
the assessment of open requirements standards (bean `1gf7`). Until then, file
one page per shipped feature and use no further structure.

**A folio's features are not filed here.** This applies to the harness's own
feature work. A folio's subject matter lives in the folio, as Phase 5 already
says.

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
   uses the staging preview URLs. When the change touches a **folio's
   blocks**, the page a reviewer opens is the preview's **review page**,
   `STAGING/<slug>/review/`: every changed block before and after, with the
   heat map and outline. The review itself runs through
   `content-change-review.bpmn`. The review coordinator slices the change and
   assigns the slices, reviewers work them in `review-task`, disagreements go
   to `adjudication`, and the coverage gate must pass before sign-off.
7. **Ask user for explicit confirmation before merging to main**
8. **Update documentation** — the OWNING instance's `docs/` pages and the
   workflow BPMNs. For the harness's own feature, **file its proposal as its
   requirements** once the merge is agreed: see *"A harness feature's
   documents"* above. If Phase 5's offer chose a `docs/` destination, this is
   where that page is written and kept true; if the implementation diverged
   from what was agreed, the divergence is recorded there rather than
   smoothed.
9. **Staging cleanup** — **a merged PR's preview goes away on its own**
   (owner, 2026-09-20): the merge is the confirmation, since the main site
   now shows the same thing. Everything else is retained by default. While a
   PR that will not be merged is open, the user adds the `staging:cleanup`
   label; **once it is closed the label can no longer reach it**, and removal
   is a `feature-staging.yml` dispatch the user runs with `cleanup_slug` and a
   matching `cleanup_confirm` (see [`staging-review`](../../skills/folio-core/staging-review.md)).
   **Never remove a staging preview any other way, and never on your own
   initiative.**

### Theme and UI review is NOT a Phase 6 step — it happens at ingestion

This section used to put [`theme-ui-review`](../../skills/folio-core/theme-ui-review.md)
on the single edge out of MVP acceptance in `crdm-deliver.bpmn`. **That call was
removed on 2026-09-24.** The owner ruled that theme review happens *"at
ingestion of graphical assets in context of website or app design"*, and, asked
whether that meant only there: *"Yes only at ingestion"* (bean `9fdi`).

So `GW_StakeholderOK`'s `accepted` branch now closes the phase directly. The
review runs when the graphical assets arrive, from `ingest-theme.bpmn`, where a
finding is a decision about what the assets will be rather than a defect in
something that shipped. If you are looking for where accessibility, branding and
locales get checked for a UI, look there — not here.

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
- [`interaction-modality.md`](../../skills/folio-core/interaction-modality.md) §4.1 — context before the question; the ordering rule this workflow runs on
- [`crdm-detect.md`](crdm-detect.md) — feature-request detection skill
- [`staging-review.md`](../../skills/folio-core/staging-review.md) — before/after staging comparison skill
- [`todo-manager.md`](../../skills/folio-core/todo-manager.md) — bean creation protocol
- [`bean-coordination.md`](../../skills/folio-core/bean-coordination.md) — cross-session bean coordination
- [`coordinate.md`](../../skills/folio-core/coordinate.md) — session coordination
- [Publication workflow](https://litlfred.github.io/folio-assistant/publication-workflow.html) — the content lifecycle this fits within
- Issue [#203](https://github.com/litlfred/folio-assistant/issues/203)

