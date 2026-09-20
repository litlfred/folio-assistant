Thirty-three BPMN 2.0 files, and **no longer all in one directory**: thirty-two
under [`skills/workflows/`](https://github.com/litlfred/folio-assistant/tree/main/skills/workflows)
and one under [`bootstrap/workflows/`](https://github.com/litlfred/folio-assistant/tree/main/bootstrap/workflows)
(`bun -e 'console.log((await import("./scripts/known-skills.ts")).workflowFiles(process.cwd()).filter(f=>f.endsWith(".bpmn")).length)'`
on 2026-09-19 — this line said "six", then "nineteen", then "thirty", then
"thirty-two, all under `skills/workflows/`", each for long enough to be wrong,
which is why it now carries the command as well as the date. **The command
changed too, and that is the point:** `ls skills/workflows/*.bpmn` counts one
directory, so it would have gone on reporting thirty-two while a diagram sat
outside it — a literal path answering a question the declaration owns).
Each is a real BPMN 2.0 document with diagram interchange — open it in
[bpmn.io](https://demo.bpmn.io/), Camunda Modeler, or any BPMN tool. The SVGs
throughout the docs are generated from these files by `bun run render:bpmn`;
never hand-edit an SVG.

**Before any of the rest** — the process a person meets first, and the only one
that runs when there is no folio yet:

| Diagram | Answers |
|---------|---------|
| `bootstrap/workflows/bootstrap.bpmn` | An agent has been pointed at a repository and knows nothing. Is this already an instance — load it — or not, in which case what should it become? The only input is an **instance reference**; the harness type, the knowledge graph and the voice are read from *that* instance's declaration. See [`bootstrap/README.md`](https://github.com/litlfred/folio-assistant/blob/main/bootstrap/README.md) and the [proposal](../proposals/bootstrap.html) |
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
| `crdm-signoff.bpmn` | Phase 5: requirements become beans, the BA signs off, the branch is announced on the issue |
| `crdm-deliver.bpmn` | Phase 6: implement, review the increment, share the MVP, take stakeholder findings. One phase, because all three loops route back into implementation |
| `crdm-close.bpmn` | Stakeholder sign-off, BA confirmation, and only then the close — an agent never assumes completion |
| `bean-lifecycle.bpmn` | When does an agent create, edit or scrap a bean — and why is one never deleted? See [Beans and todos](beans-and-todos.html) |
| `activity-log.bpmn` | When does an agent write a log entry, and when is one kept? Persistence is **off by default**, and the gateway reads a three-valued setting — `off`, `on`, `unknown` — rather than assuming. Emptying the log is the one exception to the never-delete rule that governs the rest of `fsh-guts/` |
| `content-change-review.bpmn` | One author's change, from description through staging to review-committee approval |
| `code-change-review.bpmn` | The same loop for a change to the **platform** rather than to content: claim, branch, run the gates, open the PR at the first commit, drive CI green, answer review, merge. Drawn for bean `haya` after an audit found INTEGRATION and VERIFICATION unowned — not for want of vocabulary, but because the diagram above takes a *content* change as its subject. **No deployment lane**: that is the one part whose activities differ per topology |
| `qa-report-signing.bpmn` | Attesting a QA report, by one of **two routes** chosen from declared facts: an API signer where the performing actor can reach out, a human release authority where it cannot. Bean `r0rq`, for the case the owner raised — *"an API wouldnt wokr and a human actor is needed"*. The branch is computed by `decisions/signing-route.dmn`, which reads the actor's **reach** and whether an endpoint is configured; undeclared reach is `unknown` and routes to the person, because a gateway that guessed "connected" would produce an unsigned report that looks signed |
| `actor-role-administration.bpmn` | Changing **who can do what**: add an actor and declare its kind, open or close a role, grant or revoke a permission, retire an actor without deleting it — then audit. Bean `hb2o`: the join is clean (31 of 31 roles bind a lane, no dangling reference), so this was a missing *process*, not a broken one. It **calls** `code-change-review` for the branch, gates and review rather than restating them, and adds the three things specific to editing the substrate every other diagram binds to. The `administrator` role waited for the owner to say administration is a swimlane — a role is never invented to make a diagram drawable |

**Review** — the generic entry and the two specialisms it descends into. They
are separate processes rather than extra skills on the reviewer, because the
subprocess stack is SCOPED: an actor takes on the inner lane's role for that
call path only, where `inherits` would carry both specialisms everywhere.

| Diagram | Answers |
|---------|---------|
| `review-task.bpmn` | What kind of thing changed, and which review does it descend into? |
| `review-narrative.bpmn` | Prose: register and voice, the editorial dependencies a reader needs, translation |
| `review-code.bpmn` | The graph's code nodes: Tool definitions and schema definition nodes — does the node declare what it is, do its references resolve, is the mechanism it advertises the one that runs? |
| `voice-review.bpmn` | Which named editorial voices has this folio ACTIVATED, and does each rule's own citation support the finding it raised? Called from `review-narrative.bpmn`, and it leaves immediately when no voice is active — the default, and this instance's case. |

**Acquisition** — how a resource reaches the queue at all. `document-ingestion`
begins at *"a file lands in `uploads/`"* and calls that its only entry point,
which is true of ingestion and silent on everything before it:

| Diagram | Answers |
|---------|---------|
| `content-acquisition.bpmn` | Something is offered unprompted, or is needed and has to be asked for — and through which channel: `uploads/` is one, the conversation is another, and the set is open |

**Ingestion** — turning an uploaded source document into corpus. The first is
the outer process; the rest are its call activities:

| Diagram | Answers |
|---------|---------|
| `document-ingestion.bpmn` | The whole path from `uploads/` to a citeable L1 knowledge graph |
| `ingest-extract-structure.bpmn` | Text layer, OCR, sections, structure, claim candidates |
| `ingest-derive-content.bpmn` | Archive, technical metadata, images, audio, tabular data, provenance |
| `ingest-build-l1-kg.bpmn` | Dublin Core, manifest, assets, binding, linking |
| `ingest-l1-completeness-gate.bpmn` | Is the derived content complete enough to promote, and who says so? |

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

**Translation and evidence**:

| Diagram | Answers |
|---------|---------|
| `translation-workflow.bpmn` | POT extraction → translation → PO injection → round-trip QA → sign-off → staleness watch |
| `human-translation-workflow.bpmn` | The same cycle when a human translator and an SME reviewer are in it |
| `evidence-retrieval.bpmn` | Framing a question, searching trusted sources, appraising what comes back |

> **This list is checked, not maintained by hand.** `bun run check:workflow-refs`
> fails when a `.bpmn` under `skills/workflows/` is absent from this page. It was
> added because the page opened by counting nineteen files and then listed
> eight — the eleven above were present in the repository and invisible here,
> which is the same defect as a table of contents that stops halfway.
