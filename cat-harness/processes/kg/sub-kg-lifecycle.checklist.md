<!-- GENERATED from cat-harness/processes/kg/sub-kg-lifecycle.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — A sub-KG is staged in place, then leaves for its own repository

> **Generated, and not the authority.** This is `cat-harness/processes/kg/sub-kg-lifecycle.bpmn` (process `Process_SubKgLifecycle`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Create a knowledge graph inside a harnessed repository as an instance of its own, grow it there, and when it should leave, stage it for separation and move it whole into a new repository.

## Begin — A sub-KG is wanted in this repository (`Start_Wanted`)

- Begin here: A content type's creation skill asked whether the new graph goes in a new repository or inside this one, and the answer was inside this one.
- Call `workflow_start` with `process: "Process_SubKgLifecycle"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_Brief` (Brief the work)

### 1. Brief the work (`Task_Brief`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `opening-brief`.
- What: What the work is and why, what is already measured with its provenance, how it will be done, and what would falsify the approach.
- Shared step `GT_Brief`.
- Record it: `workflow_complete` with `node: "Task_Brief"`.
- next: → `Task_Declare` (1 · Declare it in place, with its seam)

### 2. 1 · Declare it in place, with its seam (`Task_Declare`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `sub-kg-lifecycle`.
- What: `<name>/<name>.json` with name, version, `repository` (the planned home), `livesAt` (where it sits today), `needs`, and only the directories that exist, each declared with its files in one commit.
- Record it: `workflow_complete` with `node: "Task_Declare"`.
- next: → `Task_Grow` (2 · Grow it in place)

### 3. 2 · Grow it in place (`Task_Grow`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `sub-kg-lifecycle`.
- What: The content type's own authoring process runs here, against the staged instance.
- Record it: `workflow_complete` with `node: "Task_Grow"`.
- next: → `Task_DecideLeave` (Should it leave now?)

### 4. Should it leave now? (`Task_DecideLeave`)

- Who: the `Administrator (owner)` lane (role `administrator`).
- Skill: `sub-kg-lifecycle`.
- What: The owner decides, from what is measured, whether the sub-KG starts staging for separation now.
- A subprocess (`Process_AskThePerson`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `End_Stays` (Stays in place), → `Task_PushDown` (3 · Push generic down first)

## Done — Stays in place (`End_Stays`)

- The instance completes here: The sub-KG stays staged in the host. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 5. 3 · Push generic down first (`Task_PushDown`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `graph-detanglement`.
- What: Move what is generic into the harness below before the seam is closed, and consolidate what the sub-KG needs into the harness it instantiates.
- Record it: `workflow_complete` with `node: "Task_PushDown"`.
- next: → `Task_Seam` (4 · Route every climb through platform.ts)

### 6. 4 · Route every climb through platform.ts (`Task_Seam`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `sub-kg-lifecycle`.
- What: Every platform symbol the sub-KG uses is re-exported from `<name>/platform.ts`, so re-pointing the platform is a one-file edit.
- Record it: `workflow_complete` with `node: "Task_Seam"`.
- next: → `GW_Guard` (Guard green, no edge up?)

### Decide — Guard green, no edge up? (`GW_Guard`)

- Decided by commands: instance-separation-imports.test.ts (every instance whose repository differs from its livesAt is covered), and the three direction checks adding nothing.
- Call `workflow_complete` with `node: "GW_Guard"` and `outcome` set to the label that holds:
  - «red» → `Task_Seam` (4 · Route every climb through platform.ts)
  - «green» → `Task_Rehearse` (5 · Rehearse self-contained)

### 7. 5 · Rehearse self-contained (`Task_Rehearse`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `sub-kg-lifecycle`.
- What: `bun run cat seed:ready --layer <name> --rehearse` copies the layer and what it needs into a scratch workspace of sibling directories and runs the tests there.
- Record it: `workflow_complete` with `node: "Task_Rehearse"`.
- next: → `GW_Alone` (Green alone?)

### Decide — Green alone? (`GW_Alone`)

- Green with only the layer and what it needs present goes on.
- Call `workflow_complete` with `node: "GW_Alone"` and `outcome` set to the label that holds:
  - «red: an unseen climb» → `Task_Seam` (4 · Route every climb through platform.ts)
  - «could not run» → `End_Unknown` (UNKNOWN: stop. Not clean)
  - «green» → `Task_Report` (6 · Report what would move, and how it undoes)

## Done — UNKNOWN: stop. Not clean (`End_Unknown`)

- The instance completes here: The rehearsal could not run. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 8. 6 · Report what would move, and how it undoes (`Task_Report`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `deletion-requires-confirmation`.
- What: Before the first outward-facing step the agent reports: the files and bytes that would move, the history that comes with them, what in the host changes, and how each step is undone.
- Record it: `workflow_complete` with `node: "Task_Report"`.
- next: → `Task_ConfirmCreate` (7 · Owner confirms: create the repository)

### 9. 7 · Owner confirms: create the repository (`Task_ConfirmCreate`)

- Who: the `Administrator (owner)` lane (role `administrator`).
- Skill: `deletion-requires-confirmation`.
- What: Creating a repository is visible outside this one and is not undone by a revert.
- A subprocess (`Process_AskThePerson`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `End_Declined` (Staged, ready to leave), → `Task_CreateRepo` (8 · Create the repository)

## Done — Staged, ready to leave (`End_Declined`)

- The instance completes here: Not yet. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 10. 8 · Create the repository (`Task_CreateRepo`)

- Who: the `Administrator (owner)` lane (role `administrator`).
- Skill: `sub-kg-lifecycle`.
- What: The owner creates the repository, or authorises the agent that has the permission to; when that agent is in another environment, the hand-over is one work item and one sentence (agent-handoff).
- Record it: `workflow_complete` with `node: "Task_CreateRepo"`.
- next: → `GW_SeedReady` (Ready to seed?)

### Decide — Ready to seed? (`GW_SeedReady`)

- Asked at seed time, because the tree has moved since the rehearsal: every open pull request over the layer when the copy is taken is orphaned.
- Computed by the DMN table `decisions/seed-readiness-gate.dmn#Decision_SeedReadiness`: call `workflow_complete` with `node: "GW_SeedReady"` and the `facts` it reads — the table returns the branch; pass no `outcome`.
  - «not yet» → `Task_Drain` (Drain: land, close or re-target the open PRs)
  - «unknown» → `End_SeedUnknown` (UNKNOWN: do not seed. Not clean)
  - «settled» → `Task_Seed` (9 · Copy the staged contents in, with history)

### 11. Drain: land, close or re-target the open PRs (`Task_Drain`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `kg-separation`.
- What: Work the PRs `seed:ready` named until the source settles: land or close the heavy movers and the next layer's PRs, bring the layer's open PRs to five or fewer, and finish any move in flight.
- Shared step `GT_Drain`.
- Record it: `workflow_complete` with `node: "Task_Drain"`.
- next: → `GW_SeedReady` (Ready to seed?)

## Done — UNKNOWN: do not seed. Not clean (`End_SeedUnknown`)

- The instance completes here: A readiness criterion could not be decided. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 12. 9 · Copy the staged contents in, with history (`Task_Seed`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `sub-kg-lifecycle`.
- What: `git subtree split --prefix=<name>` in the host, then the split branch added to the new repository on a branch, as a draft pull request, never straight to main.
- Record it: `workflow_complete` with `node: "Task_Seed"`.
- next: → `Task_Repoint` (10 · Re-point: livesAt, seam, mount or subscription)

### 13. 10 · Re-point: livesAt, seam, mount or subscription (`Task_Repoint`)

- Who: the `Platform authoring agent` lane (role `platform-authoring-agent`).
- Skill: `sub-kg-lifecycle`, `upstream-version-adoption`.
- What: In the new repository `livesAt` goes (absent means it sits at the root of `repository`) and `platform.ts` points at where the platform now is.
- Record it: `workflow_complete` with `node: "Task_Repoint"`.
- next: → `Task_FreshClone` (11 · Verify on a fresh clone)

### 14. 11 · Verify on a fresh clone (`Task_FreshClone`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `sub-kg-lifecycle`.
- What: `bun run cat sub-kg:verify-clone --repo <owner>/<name> --ref <branch>` (Tool sub-kg-verify-clone): clone into an empty scratch directory with submodules and any sibling it needs, install, and run its own gates.
- Record it: `workflow_complete` with `node: "Task_FreshClone"`.
- next: → `GW_Fresh` (Green from a fresh clone?)

### Decide — Green from a fresh clone? (`GW_Fresh`)

- Green goes to the owner.
- Call `workflow_complete` with `node: "GW_Fresh"` and `outcome` set to the label that holds:
  - «red» → `Task_Repoint` (10 · Re-point: livesAt, seam, mount or subscription)
  - «could not run» → `End_FreshUnknown` (UNKNOWN: stop. Not clean)
  - «green» → `Task_ConfirmCutover` (12 · Owner confirms: freeze the in-repo copy)

## Done — UNKNOWN: stop. Not clean (`End_FreshUnknown`)

- The instance completes here: The fresh clone could not be verified. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 15. 12 · Owner confirms: freeze the in-repo copy (`Task_ConfirmCutover`)

- Who: the `Administrator (owner)` lane (role `administrator`).
- Skill: `deletion-requires-confirmation`.
- What: The agent reports the files that would move, their size, the new repository and the commit the copy matches, then asks: (1) freeze it in the kept trashcan now, (2) keep in place until the first release, (3) show the file list first.
- A subprocess (`Process_AskThePerson`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `End_Kept` (Consumed; in-repo copy kept), → `Task_Cutover` (13 · Cutover: freeze the copy in the kept trashcan)

## Done — Consumed; in-repo copy kept (`End_Kept`)

- The instance completes here: The host consumes the new repository and keeps its own copy, as the owner chose. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 16. 13 · Cutover: freeze the copy in the kept trashcan (`Task_Cutover`)

- Who: the `Administrator (owner)` lane (role `administrator`).
- Skill: `deletion-requires-confirmation`.
- What: Only on the owner's answer (1) at step 12.
- Record it: `workflow_complete` with `node: "Task_Cutover"`.
- next: → `End_Separated` (Separated)

## Done — Separated (`End_Separated`)

- The instance completes here: The sub-KG lives in its own repository and the host consumes it from there. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
