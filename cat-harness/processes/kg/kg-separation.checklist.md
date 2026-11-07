<!-- GENERATED from cat-harness/processes/kg/kg-separation.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — A knowledge graph leaves for its own repositories

> **Generated, and not the authority.** This is `cat-harness/processes/kg/kg-separation.bpmn` (process `Process_KgSeparation`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Move part of a knowledge graph into repositories of its own: the content (files to read, no code) and its tools (the code that writes and checks it) separate as a pair, into two repositories, not one.

## Begin — Too large, or readers and cadence differ (`Start_Trigger`)

- Begin here.
- Call `workflow_start` with `process: "Process_KgSeparation"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_Brief` (Brief the work)

### 1. Brief the work (`Task_Brief`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `opening-brief`.
- What: What the work is and why, what is already measured with its provenance, how it will be done, and what would falsify the approach.
- Shared step `GT_Brief`.
- Record it: `workflow_complete` with `node: "Task_Brief"`.
- next: → `Task_Measure` (Measure the signals)

### 2. Measure the signals (`Task_Measure`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `kg-separation`.
- What: Files and bytes per instance, clone cost (`bun run cat health`), gate time, merge contention, the candidate's cohesion and cut (`kg:detangle`), wrong-direction edges, and the would-be tools package's import cone.
- Record it: `workflow_complete` with `node: "Task_Measure"`.
- next: → `Task_Decide` (Separate this graph?)

### 3. Separate this graph? (`Task_Decide`)

- Who: the `Administrator` lane (role `administrator`).
- Skill: `kg-separation`.
- What: The owner decides from the measured signals, and also decides the address base for its identifiers, where verdicts about it live, and what its tools repository owns.
- A subprocess (`Process_AskThePerson`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `End_Stays` (Stays where it is), → `Task_Detangle` (1–3 · Declare, detangle, isolate)

## Done — Stays where it is (`End_Stays`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 4. 1–3 · Declare, detangle, isolate (`Task_Detangle`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `graph-detanglement`.
- What: The graph-detanglement practice, all of its gates: declared in place, zero wrong-direction edges on every axis, and standing alone with its own declaration, namespace and artefact.
- Record it: `workflow_complete` with `node: "Task_Detangle"`.
- next: → `Task_Identity` (4 · Identity: version, iriBase, nodeSchemas)

### 5. 4 · Identity: version, iriBase, nodeSchemas (`Task_Identity`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `kg-separation`.
- What: The declaration carries name, version, iriBase, needs and nodeSchemas.
- Record it: `workflow_complete` with `node: "Task_Identity"`.
- next: → `Task_Hosted` (5 · Move harness output about it to the host)

### 6. 5 · Move harness output about it to the host (`Task_Hosted`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `kg-separation`.
- What: QA verdicts, translation templates, the exported graph and the glossary ledger are harness output ABOUT the graph: they live with the harness (kgQaHomeFor, translationsHomeFor).
- Record it: `workflow_complete` with `node: "Task_Hosted"`.
- next: → `Task_Split` (6 · Split content from tools)

### 7. 6 · Split content from tools (`Task_Split`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `kg-separation`.
- What: Create <name>-tools as a sibling directory and move the code: the Zod source, the generators, the README and diagram writers, the content checks.
- Record it: `workflow_complete` with `node: "Task_Split"`.
- next: → `GW_Closed` (Tools closed, content code-free?)

### Decide — Tools closed, content code-free? (`GW_Closed`)

- Decided by commands, not judgement: `check:tools-closure` (no import leaves the tools directory or names an undeclared package), the content's no-code test, and generated files byte-identical before and after the move.
- Call `workflow_complete` with `node: "GW_Closed"` and `outcome` set to the label that holds:
  - «leaks or stale» → `Task_Split` (6 · Split content from tools)
  - «closed» → `Task_Plan` (7 · Plan publication)

### 8. 7 · Plan publication (`Task_Plan`)

- Who: the `Publication manager` lane (role `publication-manager`).
- Skill: `instance-publication`.
- What: Every identifier the content mints is a file some step publishes: /v<major>/, for what programs read and pages people read alike; the exact release is the pin's.
- Record it: `workflow_complete` with `node: "Task_Plan"`.
- next: → `GW_Ids` (Every identifier its file's path?)

### Decide — Every identifier its file's path? (`GW_Ids`)

- Decided by `check:node-iris`: a published node's own identifier ($id or @id) under the release address must be its file's path.
- Call `workflow_complete` with `node: "GW_Ids"` and `outcome` set to the label that holds:
  - «mismatch» → `Task_Plan` (7 · Plan publication)
  - «every one matches» → `Task_Rehearse` (8 · Rehearse standalone)

### 9. 8 · Rehearse standalone (`Task_Rehearse`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `kg-separation`.
- What: Copy the content and the tools alone into a temporary directory, with nothing else on the path, and run the tools' checks there.
- Record it: `workflow_complete` with `node: "Task_Rehearse"`.
- next: → `GW_Alone` (Green alone?)

### Decide — Green alone? (`GW_Alone`)

- Green with nothing else present goes on.
- Call `workflow_complete` with `node: "GW_Alone"` and `outcome` set to the label that holds:
  - «red: an unseen edge» → `Task_Detangle` (1–3 · Declare, detangle, isolate)
  - «could not run» → `End_Unknown` (UNKNOWN — stop. Not clean)
  - «green» → `Task_Propose` (Report what moves — sizes, what breaks)

## Done — UNKNOWN — stop. Not clean (`End_Unknown`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 10. Report what moves — sizes, what breaks (`Task_Propose`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `deletion-requires-confirmation`.
- What: The agent reports and waits: what would move, how large, what in the parent breaks, and the rollback.
- Shared step `GT_ReportWhatMoves`.
- Record it: `workflow_complete` with `node: "Task_Propose"`.
- next: → `Task_Authorise` (9 · Authorise the extraction)

### 11. 9 · Authorise the extraction (`Task_Authorise`)

- Who: the `Administrator` lane (role `administrator`).
- Skill: `deletion-requires-confirmation`.
- What: A repository cut changes the substrate every other process binds to; that is a person's decision.
- A subprocess (`Process_AskThePerson`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `End_Declined` (Stays in place, ready to leave), → `Task_Create` (Create the repositories)

## Done — Stays in place, ready to leave (`End_Declined`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 12. Create the repositories (`Task_Create`)

- Who: the `Administrator` lane (role `administrator`).
- Skill: `kg-separation`.
- What: The owner creates the content and tools repositories and their Pages.
- Record it: `workflow_complete` with `node: "Task_Create"`.
- next: → `GW_SeedReady` (Ready to seed?)

### Decide — Ready to seed? (`GW_SeedReady`)

- Asked AT SEED TIME, because the tree has moved since `8 · Rehearse`.
- Computed by the DMN table `decisions/seed-readiness-gate.dmn#Decision_SeedReadiness`: call `workflow_complete` with `node: "GW_SeedReady"` and the `facts` it reads — the table returns the branch; pass no `outcome`.
  - «not yet» → `Task_Drain` (Drain: land, close or re-target the open PRs)
  - «unknown» → `End_SeedUnknown` (UNKNOWN — do not seed. Not clean)
  - «settled» → `Task_Seed` (10 · Seed both repositories)

### 13. Drain: land, close or re-target the open PRs (`Task_Drain`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `kg-separation`.
- What: Work the PRs `seed:ready` named until the source settles: land or close the heavy movers and the next layer's PRs, bring the layer's open PRs to five or fewer, and finish any move in flight.
- Shared step `GT_Drain`.
- Record it: `workflow_complete` with `node: "Task_Drain"`.
- next: → `GW_SeedReady` (Ready to seed?)

## Done — UNKNOWN — do not seed. Not clean (`End_SeedUnknown`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 14. 10 · Seed both repositories (`Task_Seed`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `kg-separation`.
- What: Seed main, then bring the content and the tools in as reviewed pull requests with their history, so neither repository's first commit is unreviewable.
- Record it: `workflow_complete` with `node: "Task_Seed"`.
- next: → `Task_Consume` (11 · Parent consumes, additively)

### 15. 11 · Parent consumes, additively (`Task_Consume`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `upstream-version-adoption`.
- What: The parent pins the pair (a commit while staging, a version once released) — a code dependency as a `source.remote` instance in its root `index.config.json` (remote-mount skill), never a submodule — repoints its imports, and keeps its own copy until it is green with the dependency declared.
- A subprocess (`Process_UpstreamAdoption`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `Task_Release` (12 · First release)

### 16. 12 · First release (`Task_Release`)

- Who: the `Publication manager` lane (role `publication-manager`).
- Skill: `package-release`.
- What: Tag each repository, publish /v<major>/.
- Record it: `workflow_complete` with `node: "Task_Release"`.
- next: → `Task_Verify` (Every identifier dereferences)

### 17. Every identifier dereferences (`Task_Verify`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `publish-verification`.
- What: After the release is live, every published identifier resolves to the file it names.
- A subprocess (`Process_PublishVerification`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `Task_Cutover` (13 · Cutover: retire the parent's copy)

### 18. 13 · Cutover: retire the parent's copy (`Task_Cutover`)

- Who: the `Administrator` lane (role `administrator`).
- Skill: `deletion-requires-confirmation`.
- What: The one commit worth reverting, made only after the parent consumes the release and every identifier dereferences.
- Record it: `workflow_complete` with `node: "Task_Cutover"`.
- next: → `Task_CutoverCheck` (Measure the cutover: separation:cutover:check)

### 19. Measure the cutover: separation:cutover:check (`Task_CutoverCheck`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `kg-separation`.
- What: Run `bun run cat separation:cutover:check --site` in the SEPARATED repository (Tool `separation-cutover-check`).
- Record it: `workflow_complete` with `node: "Task_CutoverCheck"`.
- next: → `GW_CutoverComplete` (Cutover complete?)

### Decide — Cutover complete? (`GW_CutoverComplete`)

- Decided by the exit of `separation:cutover:check`: 0 every condition measured and passed, 1 a condition failed, 2 one could not be determined or was not run (without `--site` the answer is never complete).
- Call `workflow_complete` with `node: "GW_CutoverComplete"` and `outcome` set to the label that holds:
  - «complete» → `End_Separated` (Separated)
  - «a condition failed» → `Task_Cutover` (13 · Cutover: retire the parent's copy)
  - «could not determine» → `End_CutoverUnknown` (UNKNOWN — not shown complete. Not clean)

## Done — Separated (`End_Separated`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

## Done — UNKNOWN — not shown complete. Not clean (`End_CutoverUnknown`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
