---
# folio-assistant-ie9l
title: 'READMEs: every instance kind needs its own starting README, driven by the KG rather than listed — and the root README is cat-harness''s by accident'
status: completed
type: task
priority: normal
created_at: 2026-09-20T17:00:50Z
updated_at: 2026-09-21T05:50:43Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-20, verbatim:

> update each instance kind's staring readme (QA check, each harness kind needs
> readme, it is added as a reference to repo's root readme.md to explain what is
> in it).  whwn cat-harness boostrap init takes over it creates README.md if it
> does not exist and add link and overall harness install statue.
>
> the reaadme in repo root should:
>   *   point to the bootstreap md overview of skill/tasks
> * point to kg-navation, instruct them where to find the list of skills in
> materialed corpus (be careful to do this to minimize drift, maybe tool to use
> json/jsonld queries for aaplicable KGs)
> * tell them to determine if active KG (beans/tods) or static (point to process
> on determining context)
> * if active: see agent shoud can determine their role, process, task,
> context/memoty (point to BPMN processes), then check for active beans and
> (new/updated process) priotize and ask use which beans to work on  based on
> judgement.
>
> READMEs should be driven by processs/skills in loaded/referenced KGs
>
> make sure needed skills to step into harness and bootraraps are seen it is
> read by all agents via agents.md or otehr apropraite triggers for mmeories.
> we are treateing README.md like meorty, right?   it should be a declared asset
> of bootstrap/ (and be in json/jsonld)

## Measured 2026-09-20, and one instance is already wrong

| instance | own README | declared | resolves to |
|---|---|---|---|
| repository root | `README.md`, 18,028 B | **declares NO assets at all** | — |
| `bootstrap` | `README.md`, 4,221 B | yes | its own |
| `cat-harness` | **none** | yes, `src: README.md` with **`scope: "repository"`** | **the repo root's** |
| `folio-assist-core` | `README.md`, 1,939 B | yes | its own |

**`cat-harness` has no README of its own and claims the repository's.** So the
root README is simultaneously "what this repository is" and "what the
cat-harness instance is" — the exact conflation this instruction separates,
and `check:declared-assets` reports 0 findings because the asset *does*
resolve. It resolves to the wrong file's job, which is a distinction that
check cannot make.

**And the root declares nothing**, so the file an agent reads first is the one
file no instance owns.

## The six asks, and which are separable

1. **Every instance kind has a starting README** — with a QA check. This is
   the `2krx` shape one level up: a declared instance with no README is as
   unreachable as a declared subgraph with no visualiser.
2. **The root README references each instance's**, to explain what is in it.
3. **Bootstrap init creates `README.md` if absent**, adding the link and the
   overall harness install status.
4. **The root README's content**, four specific pointers (below).
5. **READMEs are driven by the processes/skills in loaded/referenced KGs** —
   generated from the graph, not hand-written.
6. **README is treated as MEMORY**: a declared asset of `bootstrap/`, present
   in the json/jsonld, and reached by every agent through `AGENTS.md` or
   another memory trigger.

## The constraint the owner raised, and it governs the design

> be careful to do this to minimize drift, maybe tool to use json/jsonld
> queries for aaplicable KGs

**A README that lists skills goes stale the day a skill is added.** This
repository has paid for that shape repeatedly — a hardcoded list of instances
in two gates (`6tkl`), a hardcoded `SKILLS_CATEGORIES`, a comment asserting a
committed artefact that was gitignored. So the README must **point at a query,
not carry an answer**: "here is how to ask the graph what skills exist", not
"here are the skills".

The graph is already published as `.jsonld` — `_kg/<stub>.jsonld` per instance
and `bootstrap/bootstrap.jsonld` built at render time — so the query surface
exists. What does not exist is a **tool** that runs such a query, which is
what ask 5 most likely needs and what `d308` (868 code files to Tool nodes) is
about.

## The four pointers, unpacked

- **The bootstrap overview of skills/tasks** — `bootstrap/README.md` already
  exists and is self-documenting on the forge by design.
- **kg-navigation, and where the skill list lives** — `bootstrap-kg-navigation`
  is the cold-start reading skill and already assumes nothing installed. The
  *list* must be a query (above).
- **Decide whether the KG is ACTIVE or STATIC** — active = it has
  `beans/`/`todos/`; static = it does not, and the agent follows a
  context-determining process instead. This is a real distinction and it is
  not currently written down anywhere.
- **If active**: determine role, process, task, context/memory from the BPMN;
  then check active beans, prioritise, and **ask the user which to work on**.
  Note this last step is an interaction rule, and
  `interaction-modality` §4.1 governs how it is asked.

## Open questions for the author

1. **Is the root README generated, or authored with generated sections?** The
   repository already has `readme-sections.ts`, which writes a generated
   section ONLY where the README carries its marker pair — that machinery
   exists and is the obvious fit, and it would make "driven by the KG" true
   without taking the file away from a human.
2. **Does `cat-harness` get its own README, or does the root's stop being
   cat-harness's?** Both fix the conflation; they differ in whether the root
   file keeps a second job.
3. ~~**"README as memory" — which trigger?**~~ **ANSWERED**, across three
   owner messages, and the answer is sharper than the question:

   > we are treateing README.md like meorty, right?
   >
   > maybe not "short" memotry, but fuctionally the same? its static content
   > at process runtime and treated as an asset like memories.
   >
   > these are agent-instructions i guess. dont have as much length
   > restictoins

   **It is a `context` asset, delivered as `agent-instructions`.** Both halves
   are existing machinery, not new design:

   - **`context` is the graph layer** — `holds: "context"` means READ at
     session start and never written by a running process. `memory` and
     `interaction` already carry it; `beans` and `todos` are `state`. "Static
     content at process runtime" is that classification word for word.
   - **`agent-instructions` is the asset role**, and it already exists —
     `bootstrap` and `cat-harness` both declare `AGENTS.md` under it. A README
     is the same kind of thing: a file an agent READS, not a payload injected
     into its context window.

   **That distinction is what lifts the length restriction, and it is
   mechanical rather than a matter of taste.** Agent memory is injected —
   `MEMORY.md`'s first 200 lines, *with the overflow dropped silently*, and
   `agent-memory.md` records one file sitting at 189 of its 200. An asset read
   as a file has no such budget: nothing truncates it, because nothing is
   splicing it into a prompt. So "functionally the same, without the length
   restriction" is exactly right, and the reason is the delivery path.

   ### And it resolves an apparent contradiction in the asks themselves

   Ask 3 says bootstrap init **creates** `README.md` if absent — a write. Ask
   6 says it is an asset **like memories** — `context`, never written by a
   process. Both hold, because **initialisation is not process runtime.** The
   file is created once when the harness is installed, read every session
   after, and never written by a running process. That is the same line
   `interaction/` sits on, and it should be stated wherever this lands rather
   than left for somebody to trip over.

## Done when

- [x] A QA check reports any instance with no starting README of its own —
      `check:subgraph-coverage`, `readmeFinding` + `agentInstructionsFinding`
      (PR #593). **0 of 11 instances are mute, from 8.**
- [~] The root README points to the four things, by query rather than by list
      — the INSTANCES table is generated from the declarations (PR #593); the
      four POINTERS are not there. → bean `76sa`
- [ ] Bootstrap's init creates a root README when absent, with install status
      → bean `7sfm`, **not started**
- [~] README is a declared asset present in the published json/jsonld — it is
      declared on all eleven and present in the `.jsonld`; `layer: context` is
      not declared. → bean `7syd`
- [~] Reached by every agent as a FILE rather than an injection — the rule is
      in `agent-memory` and the purposes are in `ASSET_ROLE_PURPOSE`; it is
      named but **not tested**. → bean `7syd`
- [ ] Wherever this lands, it states that creation at INITIALISATION is not a
      process write → bean `7sfm`, **not written anywhere** (grepped
      `skills/` and `docs/`, 2026-09-21)

## Scored honestly on close, 2026-09-21

**One box done, three partial, two untouched** — and the session working this
had been reporting "two of six asks remain", which counted the ASKS list
above rather than these boxes. The boxes are the contract; the asks are the
prose. Scoring against the friendlier of two lists is how a handover loses
work, so the remainder is carved into `7sfm`, `76sa` and `7syd` rather than
absorbed by closing the issue.

The core of this bean did land: every instance owns a README and an
`AGENTS.md`, the root indexes them from a generated section, and a QA
criterion keeps it true.

## `aazi` is this README's top section

The owner's later instruction puts a status dashboard at the TOP of the root
README on active KG repos. It shares this bean's unresolved `active` vs
`static` definition — the obvious reading is *an instance is active if it
declares a `state` graph* (`beans`, `todos`, `workflow-state`), which is
already declared and checkable rather than a new flag. **Both beans need that
confirmed; neither should invent it separately.**
