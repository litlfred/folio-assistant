<!-- GENERATED from folio-assistant-core/processes/content/review-log-watch.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Review-log watch

> **Generated, and not the authority.** This is `folio-assistant-core/processes/content/review-log-watch.bpmn` (process `Process_ReviewLogWatch`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

One poll of one review log (a drafting Contributor Feedback sheet, or a public-comment sheet's Review Change Sets) and its folio repository.

## Begin — Every 3 minutes (`StartEvent_Poll`)

- Begin here: The watcher's poll: a chain of 3-minute delayed wakes, each queuing the next, with an hourly scheduled task that restarts the chain if it breaks.
- Call `workflow_start` with `process: "Process_ReviewLogWatch"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_ReadSheet` (Read the Contributor Feedback tab)

### 1. Read the Contributor Feedback tab (`Task_ReadSheet`)

- Who: the `Log watcher (authoring agent)` lane (role `authoring-agent`).
- Skill: `review-log-watch`.
- What: Reads Watch!F1:I1, the hash of the person-set cells that the sheet script writes on every refresh, and Contributor Feedback's header row and Issue column (a public-comment log: Review Change Sets' header row and Change-set column), and saves them as JSON for the check.
- Record it: `workflow_complete` with `node: "Task_ReadSheet"`.
- next: → `Task_RunCheck` (Run the review-log-watch check)

### 2. Run the review-log-watch check (`Task_RunCheck`)

- Who: the `Log watcher (authoring agent)` lane (role `authoring-agent`).
- Skill: `review-log-watch`.
- What: Runs Tool review-log-watch with the folio repository, the saved values and the log's state file.
- Record it: `workflow_complete` with `node: "Task_RunCheck"`.
- next: → `Gateway_Changed` (Sheet or issues changed?)

### Decide — Sheet or issues changed? (`Gateway_Changed`)

- The tool's status.
- Call `workflow_complete` with `node: "Gateway_Changed"` and `outcome` set to the label that holds:
  - «changed» → `Task_AppendRows` (Append rows for new issues; hide closed ones)
  - «unchanged» → `EndEvent_NoWork` (Nothing changed)

### 3. Append rows for new issues; hide closed ones (`Task_AppendRows`)

- Who: the `Log watcher (authoring agent)` lane (role `authoring-agent`).
- Skill: `review-log-watch`.
- What: For each row in the tool's append list (one per issue that no row's Issue cell links yet), appends it below the last row of Contributor Feedback: Title is the issue's title, the first Contributor Feedback column @login (#N): the issue's first paragraph, Issue its URL.
- Record it: `workflow_complete` with `node: "Task_AppendRows"`.
- next: → `Task_AgentPass` (Agent pass on the changed rows)

## Done — Nothing changed (`EndEvent_NoWork`)

- The instance completes here: No agent work: the next wake is queued and the poll ends. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 4. Agent pass on the changed rows (`Task_AgentPass`)

- Who: the `Log watcher (authoring agent)` lane (role `authoring-agent`).
- Skill: `review-sheet-script`.
- What: For each changed row, the agent pass of Contributor feedback on a working draft: Ready for agent = Yes gets its edit, Ready for merge = Yes its merge, and a Blue answer to a Decision needed question is taken up.
- A subprocess (`Process_ContributorFeedback`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `Task_Accept` (Accept the new state)

### 5. Accept the new state (`Task_Accept`)

- Who: the `Log watcher (authoring agent)` lane (role `authoring-agent`).
- Skill: `review-log-watch`.
- What: Runs the check again with --accept, so the state file holds what was just handled and the next poll compares against it.
- Record it: `workflow_complete` with `node: "Task_Accept"`.
- next: → `EndEvent_Done` (Changes handled)

## Done — Changes handled (`EndEvent_Done`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
