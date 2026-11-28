<!-- GENERATED from cat-harness/sdlc/processes/stalled-agent-triage.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Stalled-agent triage & bidirectional relay re-entry

> **Generated, and not the authority.** This is `cat-harness/sdlc/processes/stalled-agent-triage.bpmn` (process `Process_StalledAgentTriage`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

When agents stall (quota exhausted, context full, container lost, session timed out) OR when an agent returns on its next turn after another session advanced the repository, execute Bidirectional Relay Continuity: reconcile remote commits and epic write-ahead snapshots, classify open and draft PRs, 

## Begin — Agents stalled, owner asks to pick up work, or agent re-enters (`Start_SAT`)

- Begin here.
- Call `workflow_start` with `process: "Process_StalledAgentTriage"` and the subject this run is about; keep the instance id it returns.
- next: → `A_Footprint` (Audit remote delta, epic relay snapshot & PR classes)

### 1. Audit remote delta, epic relay snapshot & PR classes (`A_Footprint`)

- Who: the `Triage / re-entering agent` lane (role `authoring-agent`).
- Skill: `stalled-agent-triage`, `agent-handoff`.
- What: Steps 1-3 of re-entry reconciliation: fetch origin/<default-branch> and origin/cat/cat-harness/beans, audit git log <last-known-sha>..origin/<default-branch>, read the epic bean's write-ahead Live Relay Snapshot (child beans, active research/compute hypotheses, negative/excluded routes, lease table)
- Record it: `workflow_complete` with `node: "A_Footprint"`.
- next: → `A_Collect` (Inspect worktrees non-destructively, salvage & collect handovers)

### 2. Inspect worktrees non-destructively, salvage & collect handovers (`A_Collect`)

- Who: the `Triage / re-entering agent` lane (role `authoring-agent`).
- Skill: `stalled-agent-triage`, `handover-report`, `prepare-for-handover`.
- What: Step 4 of re-entry reconciliation: inspect every local worktree (git status --short --branch, ahead/behind origin), /tmp overlays, and Cargo/Lean donor caches without ever running git reset --hard; rescue dirty or unpushed stalled work onto a claude/salvage-* branch (and push it) or resume in place,
- Record it: `workflow_complete` with `node: "A_Collect"`.
- next: → `A_Consolidate` (Consolidate into 2-4 themes, with a recommendation each)

### 3. Consolidate into 2-4 themes, with a recommendation each (`A_Consolidate`)

- Who: the `Triage / re-entering agent` lane (role `authoring-agent`).
- Skill: `stalled-agent-triage`.
- What: Group by what the work delivers, not by agent.
- Record it: `workflow_complete` with `node: "A_Consolidate"`.
- next: → `U_Decide` (Decide each theme)

### 4. Decide each theme (`U_Decide`)

- Who: the `User` lane (role `user`).
- A subprocess (`Process_AskThePerson`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `A_Record` (Reconcile epic lease table, write-ahead checkpoint & sibling notes)

### 5. Reconcile epic lease table, write-ahead checkpoint & sibling notes (`A_Record`)

- Who: the `Triage / re-entering agent` lane (role `authoring-agent`).
- Skill: `bean-coordination`, `agent-handoff`, `coordinate`.
- What: Step 5 of re-entry reconciliation: update and push the epic bean's write-ahead Worktree/Branch/Scratch Lease Table, child beans, and active/excluded hypotheses on cat/cat-harness/beans; record a 'triage: <date>' note, claim picked-up work via beans:claim, and post sibling coordination notes if lande
- Record it: `workflow_complete` with `node: "A_Record"`.
- next: → `S_Reroute` (Re-route ready PRs & resume Merge Steward + worker queues)

### 6. Re-route ready PRs & resume Merge Steward + worker queues (`S_Reroute`)

- Who: the `Merge steward` lane (role `session-coordinator`).
- Skill: `coordinate`, `merge-manager-watcher`.
- What: Green ready-to-merge PRs join the Merge Steward queue; active external sibling drafts stay untouched; mid-merge or salvaged stalled branches are re-driven cleanly from their PR or salvage head; owner-fenced PRs hold.
- Record it: `workflow_complete` with `node: "S_Reroute"`.
- next: → `End_SAT` (Relay reconciled; queues and epic lease table live)

## Done — Relay reconciled; queues and epic lease table live (`End_SAT`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
