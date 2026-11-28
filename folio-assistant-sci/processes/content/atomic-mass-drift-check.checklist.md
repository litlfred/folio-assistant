<!-- GENERATED from folio-assistant-sci/processes/content/atomic-mass-drift-check.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Is AtomicMass.lean still in sync with its data table?

> **Generated, and not the authority.** This is `folio-assistant-sci/processes/content/atomic-mass-drift-check.bpmn` (process `Process_AtomicMassDrift`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Check that `AtomicMass.lean` is still in sync with the data table it is generated from: the job regenerates and diffs, and any difference fails.

## Begin — Pull request, push to main, or dispatch (`Start_Change`)

- Begin here.
- Call `workflow_start` with `process: "Process_AtomicMassDrift"` and the subject this run is about; keep the instance id it returns.
- next: → `Call_Drift` (Check AtomicMass.lean is in sync)

### 1. Check AtomicMass.lean is in sync (`Call_Drift`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- What: Run gen_atomic_mass.py --check: regenerate AtomicMass.lean from the data table and diff it against the committed file.
- A subprocess (`Process_GeneratedFileDrift`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `End_Checked` (Checked)

## Done — Checked (`End_Checked`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
