**How many BPMN 2.0 files are there? This page no longer says, and that is the
fix rather than an evasion.**

The sentence that used to open here carried a count, and it was wrong five
times in a row — "six", then "nineteen", then "thirty", then "thirty-two, all
under `processes/`", then "thirty-nine" — each for long enough to be
wrong, and each time discovered by somebody who happened to run `ls`. The last
of those was wrong by **sixteen** when it was finally checked: it claimed
thirty-nine against fifty-five.

A count in prose is a claim; a derived index is evidence. So the number lives
in [the derived process index](../cat-harness/docs-auto/index/processes/),
which is generated from the declaration by `bun run docs:auto`, gated in CI,
and cannot drift from the diagrams it counts. **This page's job is the half
that cannot be generated** — what each process is *for*, when you would be in
it, and which neighbouring one you actually want.

That division is the `docs-auto` skill's rule, and this page is the worked
example of it: the index says what exists and what each diagram declares about
itself; everything below says what the index structurally cannot.

**Bootstrap's diagrams are deliberately outside that index**, and their absence
is a fact rather than a gap. `bootstrap/workflows/` is declared by
`bootstrap/bootstrap.json` and *not* by the root, because declaring it there
re-carries bootstrap's process into the root's published graph — which `#432`
removed on purpose and a test still guards. Bean `pve3` holds that choice:
**both halves of bootstrap, or neither.** So the derived index covers what the
root declares, and the three bootstrap diagrams are named in the table below
instead.

Each is a real BPMN 2.0 document with diagram interchange — open it in
[bpmn.io](https://demo.bpmn.io/), Camunda Modeler, or any BPMN tool. The SVGs
throughout the docs are generated from these files by `bun run render:bpmn`;
never hand-edit an SVG.

**Before any of the rest** — the process a person meets first, and the only one
that runs when there is no folio yet.

This table named `bootstrap/workflows/bootstrap.bpmn` until 2026-09-20 — **a
file that does not exist**, renamed to `initialize-harness.bpmn` long before —
while all three real diagrams went unnamed. A dangling reference hiding behind a
directory nothing scanned, which is exactly what the not-indexed check exists to
catch and could not, because it could not see the directory either (bean `7u3g`).

The rows are correct now. **The diagrams are still invisible to the tooling**,
and deliberately so pending a decision: `bootstrap/workflows/` is declared by
`bootstrap/bootstrap.json` but not by the root, and declaring it there re-carries
bootstrap's process into the root's published graph — which `#432` removed on
purpose and a test still guards. Bean `pve3` holds that choice: **both halves of
bootstrap, or neither.**

| Diagram | Answers |
|---------|---------|
| `bootstrap/workflows/bootstrap.bpmn` | An agent has been pointed at a repository and knows nothing. Is this already an instance — load it — or not, in which case what should it become? The only input is an **instance reference**; the harness type, the knowledge graph and the voice are read from *that* instance's declaration. See [`bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/README.md) and the [proposal](../proposals/bootstrap.html) |
| `bootstrap/workflows/initialize-harness.bpmn` | An agent has been pointed at a repository and knows nothing. **The only process in bootstrap an actor STARTS** — an Initiator that has read `bootstrap/README.md` is at its start event and has nowhere else to begin. Three lanes: Initiator, Requestor, and the Knowledge Graph Data Store. See [`bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/README.md) and the [proposal](../proposals/bootstrap.html) |
| `bootstrap/workflows/discussion.bpmn` | Two facts have **no answer in any file an Initiator can reach** — which harness this repository should become, and which repositories are read from and written to. They are judgements held by whoever asked for the harness, so no instruction body produces them. Entered from within `initialize-harness` when such a fact is needed, which is why bootstrap holds a second process at all: it is *presupposed* by every task rather than indicated by one |
| `bootstrap/workflows/log-message.bpmn` | **A sub-process, never an entry point** — reached by a call activity, never started, which is why bootstrap's README can still say there is one process you begin. Callable optionally from any task (an actor logging what it is doing needs no permission) or required by a diagram that draws the call explicitly; same sub-process either way, and the difference is whether the caller drew it. It lives in bootstrap rather than the harness because bootstrap may not import the harness, so a logger defined upstream would be unusable by the actor with the most need to say what it is doing |
| `getting-started.bpmn` | Somebody said "create a folio". Which of the five things did they mean, and what has to be true before anything is written? |

Its intent gateway is *computed*, not chosen: `decisions/folio-intent.dmn`
returns the branch, and `ask` is one of the outcomes it can return — which is
what makes the question obligatory rather than a courtesy. See
[Getting started](getting-started.html).

**Content-agnostic** — these three apply to every folio, and the outer ones
reference the inner ones as **call activities**, so each process is described
once and reused:

| Level | Diagram | Answers |
|-------|---------|---------|
| 1 | [Content lifecycle](#content-lifecycle-overview) — `content-lifecycle.bpmn` | One cycle of a folio, plan → retire |
| 2 | [Draft → publication](#from-corpus-to-published-folio) — `draft-to-publication.bpmn` | How the corpus becomes an officially published folio |
| 3 | [Editing & HCI validation](#editing-and-the-hci-validation-gate) — `editing-hci-validation.bpmn` | What happens to **one** proposed change to **one** content block |

**Content-type specific** — how a particular kind of folio is authored. These
sit *inside* level 3's `Draft the block edit`, and live with their guides:

| Diagram | Content type | Where it is shown |
|---------|--------------|-------------------|
| `authoring-a-document.bpmn` | Documents & policy guidance | [Writing a document](guides/writing-a-document.html) |
| `authoring-a-paper.bpmn` | Scientific papers & books | [Writing a paper](guides/writing-a-paper.html#the-end-to-end-workflow) |
| `l2-dak-authoring.bpmn` | WHO SMART Guidelines DAK (L2) | [Authoring a WHO SMART DAK](guides/who-smart-dak.html#the-l2-artifacts) |
| `l3-fhir-pipeline.bpmn` | WHO SMART Implementation Guide (L3) | [Authoring a WHO SMART IG](guides/who-smart-ig.html#the-l3-pipeline) |
| `ig-incremental-build.bpmn` | WHO SMART IG (L3) — the build lane, incremental by dependency cone (proposed) | [Making the build incremental](guides/who-smart-ig.html#making-the-build-incremental) · [the overview](proposals/ig-incremental-build-overview.html) |

**Agent process** — how an agent works, rather than how content is authored.
These run alongside the content processes rather than inside them:

| Diagram | Answers |
|---------|---------|
| `crdm-requirements.bpmn` | A feature request arrived. How is it turned into agreed requirements, and who signs off? The outer process; its six phases are the call activities below. See [CRDM methodology](crdm-methodology.html) |
| `crdm-issue-linking.bpmn` | Scan for a matching issue, then link or ask — an issue is never created without the BA's permission |
| `crdm-needs.bpmn` | Phase 1: identify stakeholders, synthesise the needs statement, loop until it is recognised |
| `crdm-requirements-definition.bpmn` | Phases 2–4: map the current workflow, define requirements and their impact, loop until approved |
| `crdm-data-model.bpmn` | Between requirements and sign-off: entities from the BPA and the requirements, cardinalities stated both ways, looping until the BA recognises the entities AND the stakeholders have answered every cardinality |
| `crdm-signoff.bpmn` | Phase 5: requirements become beans, the BA signs off, the branch is announced on the issue |
| `crdm-deliver.bpmn` | Phase 6: implement, review the increment, share the MVP, take stakeholder findings. One phase, because all three loops route back into implementation |
| `crdm-close.bpmn` | Stakeholder sign-off, BA confirmation, and only then the close — an agent never assumes completion |
| `diig-investment-path.bpmn` | WHO's Digital Implementation Investment Guide as a process: nine chapters from forming the team to the value proposition, with the Guide's OWN progress checks at 4.5 and 8.5 as gateways rather than gates added here. Chapter 3 builds on CRDM, which is why it sits beside the diagrams above. Lives in `smart-base`, because a domain method belongs to the repository that owns the domain |
| `bean-lifecycle.bpmn` | When does an agent create, edit or scrap a bean — and why is one never deleted? See [Beans and todos](beans-and-todos.html) |
| `session-state-machine.bpmn` | An agent **playing** a state machine, keeping a session's context current across a discussion. The shape is strict — the interpreter supports nine element types and throws on the rest — and what varies is **which enabled branch the agent takes**. Both gateways carry `folio:judgement`, the marker added with this diagram so that "no table because this is somebody's call" stops being indistinguishable from "no table yet". The machine **records** that a bean was claimed; it never claims one |
| `activity-log.bpmn` | When does an agent write a log entry, and when is one kept? Persistence is **off by default**, and the gateway reads a three-valued setting — `off`, `on`, `unknown` — rather than assuming. Emptying the log is the one exception to the never-delete rule that governs the rest of `fsh-guts/` |
| `content-change-review.bpmn` | One author's change, from description through staging to review-committee approval |
| `code-change-review.bpmn` | The same loop for a change to the **platform** rather than to content: claim, branch, run the gates, open the PR at the first commit, drive CI green, answer review, merge. Drawn for bean `haya` after an audit found INTEGRATION and VERIFICATION unowned — not for want of vocabulary, but because the diagram above takes a *content* change as its subject. **No deployment lane**: that is the one part whose activities differ per topology |
| `qa-report-signing.bpmn` | Attesting a QA report, by one of **two routes** chosen from declared facts: an API signer where the performing actor can reach out, a human release authority where it cannot. Bean `r0rq`, for the case the owner raised — *"an API wouldnt wokr and a human actor is needed"*. The branch is computed by `decisions/signing-route.dmn`, which reads the actor's **reach** and whether an endpoint is configured; undeclared reach is `unknown` and routes to the person, because a gateway that guessed "connected" would produce an unsigned report that looks signed |
| `actor-role-administration.bpmn` | Changing **who can do what**: add an actor and declare its kind, open or close a role, grant or revoke a permission, retire an actor without deleting it — then audit. Bean `hb2o`: the join is clean (31 of 31 roles bind a lane, no dangling reference), so this was a missing *process*, not a broken one. It **calls** `code-change-review` for the branch, gates and review rather than restating them, and adds the three things specific to editing the substrate every other diagram binds to. The `administrator` role waited for the owner to say administration is a swimlane — a role is never invented to make a diagram drawable |
| `graph-detanglement.bpmn` | Part of a repository wants to leave — size, or a semantic reason. **The four stages are gates rather than advice, and that is the whole reason this is a diagram**: `graph-detanglement.md` says "nothing moves until the stage before it measures zero" in prose, and prose is what an agent under pressure talks itself past. All three gateways are DMN-backed, so completion refuses a hand-supplied outcome and the branch is computed from counts a tool already produced. The sharpest is `Detangled?`, and it is sharp because of its RULE ORDER — `unassignedEdges > 0` returns `unknown` before the cross-edge rule is ever reached, so a zero cross-edge count over an unjudged corpus cannot be read as a pass. Every gate has a third state and none of them renders it as clean: both `unknown` paths are a REFUSAL to advance rather than a warning. `Authorise the extraction` sits in the **Administrator** lane because moving durable artefacts out of a repository is a person's decision — the agent reports what would move and waits, per `deletion-requires-confirmation` |

**Review** — the generic entry and the two specialisms it descends into. They
are separate processes rather than extra skills on the reviewer, because the
subprocess stack is SCOPED: an actor takes on the inner lane's role for that
call path only, where `inherits` would carry both specialisms everywhere.

| Diagram | Answers |
|---------|---------|
| `review-task.bpmn` | What kind of thing changed, and which review does it descend into? |
| `review-narrative.bpmn` | Prose: register and voice, the editorial dependencies a reader needs, translation |
| `review-code.bpmn` | The graph's code nodes: Tool definitions and schema definition nodes — does the node declare what it is, do its references resolve, is the mechanism it advertises the one that runs? |
| `options-analysis.bpmn` | A decision with alternatives: which adopted methodology applies here, what were the options, and why did the rejected ones lose? Called as a subprocess, and its trigger is `opening-brief`'s — **irreversibility and surprise, not size** — so a reversible choice leaves at the first task and an irreversible one cannot skip it. It does not decide: it produces the options and a recommendation, and the authorisation belongs to the calling step. |
| `swot-analysis.bpmn` | Situation analysis before a decision: what is true about a subject's own attributes (strengths, weaknesses) and about its environment (opportunities, threats), crossed into the SO/WO/ST/WT candidate strategies. **No path through it decides anything** — that is the `swot` methodology's own stated refusal, drawn so it cannot be skipped, and every completed run either records a situation or hands the unranked candidates to `options-analysis`. External is scanned before internal, per Weihrich as the ingested source reports him. It does not rank what it finds, because the method has no way to. |
| `voice-review.bpmn` | Which named editorial voices has this folio ACTIVATED, and does each rule's own citation support the finding it raised? Called from `review-narrative.bpmn`, and it leaves immediately when no voice is active — the default, and this instance's case. |
| `adjudication.bpmn` | The review reached no mechanical or consensus agreement, so a **judgement** is needed — and what it must leave behind. Entered only when a criterion's reviewer entries DISAGREE, which `block-qa/v1` makes computable, so the first gateway leaves rather than guessing: one reviewer and no checker is a review, one checker and no reviewer is a gate. Drawn for bean `7pdi` after the shape was found implemented **seven times** — five adjudicate activities across `processes/`, plus `/api/relevance/adjudicate` and `bib-verification.ts`, which share no code with the diagrams and reached the same rule anyway. Advisory, because a judgement cannot be gated; `Write the entry that LEADS` and `Grant a dispensation, with its reason` are **not relaxable**, because a judgement nobody wrote down is indistinguishable from a checker that was never run |
| `narrative-code-review.bpmn` | A change touched **both sides of a declared prose ↔ code pair** — a diagram and the workflow it implements, a skill and the code beside it — so `review-task` sends it here, the only branch that reads the two against each other. The machine has already run (`prose-reviewed-since-code-changed` and `prose-claims-resolve` on the sidecar); the reviewer settles only what those left open, one of three ways: attest with a reason, raise a finding against the wrong side, or — on a disagreement with a checker — call adjudication. Drawn for issue #1042, stage C; the Lean case is `proof-narrative-lean-equivalence`, not this diagram |
| `wireframe-design-review.bpmn` | What should this user interface look like, and which candidate wins? The `wiregen` methodology made executable (#1023): a written design intent, at least two mid-fidelity candidates each with a **web and a mobile** layout, mechanical checks at both viewports (`wireframe-check`), a blind per-criterion review, then `adjudication.bpmn` where reviewers disagree and `options-analysis.bpmn` for the choice. The same checks back the as-is wireframe every declared visualiser owes (`check:wireframes`) |
| `related-work.bpmn` | Before new work takes shape, what does it touch? Search beans, issues and open PRs; categorize and summarize every hit; ask the user whether and how to coordinate. Judgement sorts the hits and the user decides (#1023). Called from `crdm-issue-linking.bpmn` when a requirement is initiated or updated in chat, and from `methodology-from-source.bpmn` |
| `methodology-from-source.bpmn` | Somebody shared a paper or standard and wants its method used: origin and licence, ingestion (`document-ingestion.bpmn`), related work (`related-work.bpmn`), the method rendered with its adopted and refused parts, placement by ownership, integration by calling existing processes, a Tool for every tool it uses, and the owner's review. Written while adopting WireGen (#1023) |

**Boards** — a board is a **diagram of** a folio, in the OMG sense: the folio
carries what is true, `board-positions.json` carries where it was drawn, and
the arrow runs one way. All three exist because the discipline is a property a
future edit breaks silently — two mechanisms that look like one, a control that
looks like a delete, and two writes that look like one.

| Diagram | Answers |
|---------|---------|
| `board-open-close.bpmn` | A reader opens a card and closes it again. **Two mechanisms the diagram exists to keep apart**: semantic zoom is automatic and driven by SIZE, while open and close are a person's, so an open window survives a zoom-out and only `[x]` closes it. `Leave a reachable way back` is a task rather than a courtesy — bean `l4zi`, an action whose inverse is not reachable is not a toggle. Advisory: refusing a step here would refuse a click |
| `board-relocate.bpmn` | The fishbone. It **looks** like a delete and is not one: the content MOVES into `fsh-guts/`, keeping its identity, so every reference still resolves and the reader who hit the wrong control lost a location rather than a node. **Strict**, unlike the two above, because it edits the folio — the reader is asked first, and the question names what will move and where it lands, per `deletion-requires-confirmation` |
| `board-place-note.bpmn` | Creating a sticky and placing one are **two writes to two graphs**, and the common bug is to make them one. The note goes into the folio carrying no coordinate; the coordinate goes into the layout layer, keyed by board and then by note — which is why one note may sit on several boards without arbitrating between them. The gateway exists because a dragged existing card takes only the second path |

**Acquisition** — how a resource reaches the queue at all. `document-ingestion`
begins at *"a file lands in `uploads/`"* and calls that its only entry point,
which is true of ingestion and silent on everything before it:

| Diagram | Answers |
|---------|---------|
| `content-acquisition.bpmn` | Something is offered unprompted, or is needed and has to be asked for — and through which channel: `uploads/` is one, the conversation is another, and the set is open |

**Ingestion** — turning an uploaded source document into corpus. The first is
the outer process; the rest are its call activities — except
`ingest-theme.bpmn`, which is conditional and not yet wired in, for the reason
given under the table:

| Diagram | Answers |
|---------|---------|
| `document-ingestion.bpmn` | The whole path from `uploads/` to a citeable L1 knowledge graph |
| `ingest-extract-structure.bpmn` | Text layer, OCR, sections, structure, claim candidates |
| `ingest-derive-content.bpmn` | Archive, technical metadata, images, audio, tabular data, provenance |
| `ingest-build-l1-kg.bpmn` | Dublin Core, manifest, assets, binding, linking |
| `ingest-l1-completeness-gate.bpmn` | Is the derived content complete enough to promote, and who says so? |
| `ingest-theme.bpmn` | Does this artefact carry a theme, and what are its palette roles and layouts? |

`ingest-theme.bpmn` is **not** a call activity of `document-ingestion.bpmn`
today, and that is a stated gap rather than an oversight (bean `j66n`, whose
"Done when" asks for the link). Most ingested documents carry no theme. Making
theme ingestion an unconditional step in the chain would assert that every one
does, and a step that no-ops for almost every document is a step a reader stops
believing. The honest wiring is a gateway — *is this artefact a theme source?* —
and which artefacts answer yes is a judgement nobody has made yet: a captured
site obviously qualifies, a style guide qualifies because it **states** rules,
and whether an arbitrary branded PDF does is exactly the open question.

**Remote content** — landing something that lives somewhere else, and keeping it
current. Named on 2026-09-20 after this repository had been running the process
twice without a word for it: `who-iris` taking three items out of a 361.55 GB
catalogue, and `bootstrap` fetching a harness and landing it locally, with
`upstream-pins.json` as half of that second one's refresh.

| Diagram | Answers |
|---------|---------|
| `materialize-remote.bpmn` | May we hold a local copy, what does holding it cost, and for what purpose — `working` or `archival`? Five gates, three states, and a refusal leaves the node `referenced` rather than failing |
| `refresh-materialized.bpmn` | What changed upstream, what changed locally, and what to do when both. An **archival** copy is never refreshed — re-fetching discards the state it exists to keep — so it gets a fixity check instead |
| `copy-out-materialized.bpmn` | Somebody wants to change content this repository holds a copy of. Materialized content is read-only, so the answer is a copy into their own `folio/` that records, in `provenance.local`, which original it came out of — the edge nothing downstream can reconstruct once it is missing |

**Post-MVP review** — what the delivered thing actually looks like, once
stakeholders have accepted it and there is a render to judge:

| Diagram | Answers |
|---------|---------|
| `theme-ui-review.bpmn` | Does what shipped read legibly, consistently and in every declared language? Accessibility measured rather than asserted, branding against the instance's own declaration, languages extracted and laid out. Called from `crdm-deliver.bpmn` on the single edge out of stakeholder acceptance — there is no role-to-theme mapping, so nothing could have been checked earlier |

**Upstream dependencies** — what happens when somebody else's release changes
what we ship. The first is the watcher and the second is the reusable
subprocess it calls; any pinned dependency enters the second the same way, so a
new tenant is a row in `upstream-pins.json` rather than a third diagram:

| Diagram | Answers |
|---------|---------|
| `upstream-pin-watch.bpmn` | Has a pinned dependency fallen behind a release, and what happens when the check cannot tell? Mechanical throughout, and it maintains ONE tracking issue rather than sending mail nobody reads |
| `upstream-version-adoption.bpmn` | A candidate version exists. What of ours binds it, what does the MVP build prove, and who is allowed to say yes? The accept is a `userTask` in a person-only lane, and no package may relax it |

**The CI workflows themselves** — `.github/workflows/*.yml` are processes
too, with triggers, gateways and compensation paths, and until 2026-09-20 none
was drawn. `bun run check:workflow-coverage` measures how many are, in three
states; a diagram declares its subject with
`<folio:implements workflow="…"/>` rather than being matched on its filename,
because a mention is not coverage.

**Coverage alone would not have been worth having.** Bean `7yvd`: *"a diagram
that is drawn once and then drifts is worse than none, because it is
consulted."* So the node standing for a job declares it —
`<folio:job name="stage"/>` — and the same check compares the two sets in
**both** directions: a job with no node is a diagram that has gone stale, a
node naming a job the workflow does not have is one that was stale already.
Both exit 1, in the same tier as a dangling `<folio:implements>`, because
both mislead a reader who follows them.

Declaring is opt-in per diagram, and a covered workflow whose diagram names
no job is reported as **undeclared** rather than as fully drifted: "nobody has
said yet" and "said, and wrong" are different answers, and only the second is
a finding. What is never allowed is a diagram declaring *some* of a
workflow's jobs and reading as complete.

| Diagram | Answers |
|---------|---------|
| `feature-staging.bpmn` | The lifecycle of a review preview: staged on a push, taken down on a close, or removed by an explicit dispatch. **Both gateways are three-state** — a merge confirms a removal on its own while a close without one still needs the label (bean `1feu`), and the dispatch preflight refuses on a live signal AND on could-not-tell. Every path that changes `STAGING/` writes to the render log, and the two removal paths write the record in the SAME commit as the removal |
| `upstream-pin-watch.bpmn` | Also `upstream-pins.yml` — see **Upstream dependencies** below. The declaration was added when the coverage check was written; the diagram already documented that workflow step for step |
| `docs-site-publish.bpmn` | Publishing `gh-pages` is a **full replace**, so anything on that branch this build did not produce is gone unless something puts it back — bean `plj1`, every open PR's preview deleted by an unrelated merge, silently, for months. The restore and the after-the-fact verification are a **pair**: a restore nobody checks is one that can quietly stop working, which is how the original defect lasted. Both gateways refuse rather than warn, and the second is three-state |
| `code-quality-gates.bpmn` | **Five independent jobs, and nothing in the YAML says so in one place.** No job declares `needs:`, so the workflow's wall-clock cost is the slowest job rather than the sum — the single most useful thing to know before adding a gate. Four are hard and one (`rust-wildcard`) is warn-only, so the gateway after the join asks specifically about the HARD ones; drawing five equal boxes would be a lie a reader would act on |
| `ci-health-watch.bpmn` | Is CI actually working on `main`? **Only `unknown` fails the job** — a red `main` records the issue and this workflow stays green, which is invisible from the run list. `Could we tell?` is not simply the exit code: `bun` exits 1 on a crash too, so the REPORT FILE separates "found something red" from "crashed" |
| `repository-health-watch.bpmn` | The same shape one level out — the repository rather than the workflows. **It reports and never acts**: there is no removal task on the diagram, and its absence is `deletion-requires-confirmation` being followed rather than an omission |
| `jsonld-drift-check.bpmn` | Are the `.jsonld` siblings still in sync with their `.ts` manifests? **Deliberately small, and says so**: one job, no branch, nothing the YAML does not already show. It earns a diagram for drift detection — without one it carries no `<folio:job>`, so a job added here would tell nobody — not for exposition |
| `atomic-mass-drift-check.bpmn` | Is `AtomicMass.lean` still in sync with its data table? The smallest workflow here and the one whose output a proof depends on: part company, and a Lean file that compiles is carrying numbers nothing produced. Same minimal-by-design note as above |
| `pr-checks-present.bpmn` | Which open pull requests have **no CI run on their head** — bean `3pqn`. Measured 2026-09-20: two of six had none. The **15-minute age gate** is the difference between useful and ignored, since a head pushed moments ago legitimately has no run and reporting those is how a sweep gets muted. Only `unknown` fails the job; a finding records itself and the workflow stays green. Two channels: the issue **edited in place**, the PR comment **once per (PR, head sha)** |

**Out to a public portal** — the stage after publishing, and the one this
repository had built twice without naming. A portal that is not this
repository — a Moodle site, a ministry intranet, a department page — needs the
graph's contents, and the path there is six stages rather than a deploy:

| Diagram | Answers |
|---------|---------|
| `kg-to-portal.bpmn` | How a knowledge graph reaches readers the repository never hears about: select → serialize → package → sign → distribute → verify. **`GW_Transport` has no default branch on purpose** — the owner stated the ingestion method as undetermined, so the diagram reaches a decision and stops; drawing one branch as the obvious one would record a decision nobody made. **A CDN is not a lane**: it is what `A_Distribute` may put in front of the origin, because modelling a cache as a participant makes its URL look like the published one, and a published URL is a promise (bean `xies`, *"EXTREME care in URL handling"*). Two gateways refuse rather than warn — over budget is an end event, not a warning, and a failed verification serves the **previous** version rather than nothing, since a portal that goes blank has turned an integrity problem into an outage |

The verify stage is the one that gets dropped, and the reason is structural:
every other stage produces something visible and this one produces nothing when
it passes. A package that is signed and never verified is a package whose
signature is decoration. Where the portal cannot verify, `unknown` is the
answer — a portal nobody asked is not a portal that checked.

**The publish branch** — what is on `gh-pages`, and what happened to it. The
branch has six publishers and one of them is a full replace, so "the preview
is gone" has never had an answer a reader could look up:

| Diagram | Answers |
|---------|---------|
| `staging-render-log.bpmn` | A preview was published, removed, carried across a full-replace deploy, or **considered for removal and kept** — which of those happened, and why? Append-only: a `removed` entry never erases the `rendered` one before it, and `retained` exists so a preview still standing because a liveness signal fired leaves a trace. Bean `plj1` is the case it answers — every open PR's preview deleted by an unrelated merge, silently, for months |

**Translation and evidence**:

| Diagram | Answers |
|---------|---------|
| `translation-workflow.bpmn` | POT extraction → translation → PO injection → round-trip QA → sign-off → staleness watch |
| `human-translation-workflow.bpmn` | The same cycle when a human translator and an SME reviewer are in it |
| `evidence-retrieval.bpmn` | Framing a question, searching trusted sources, appraising what comes back |

> **This list is checked, not maintained by hand.** `bun run check:workflow-refs`
> fails when a `.bpmn` under `processes/` is absent from this page. It was
> added because the page opened by counting nineteen files and then listed
> eight — the eleven above were present in the repository and invisible here,
> which is the same defect as a table of contents that stops halfway.
