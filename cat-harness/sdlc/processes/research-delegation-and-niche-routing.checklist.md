<!-- GENERATED from cat-harness/sdlc/processes/research-delegation-and-niche-routing.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Research delegation and niche routing

> **Generated, and not the authority.** This is `cat-harness/sdlc/processes/research-delegation-and-niche-routing.bpmn` (process `Process_ResearchDelegationAndNicheRouting`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Keeps foreground discussion turns unblocked whenever answering or analysing exceeds a brief ~15-20 s lookup, immediately reporting scope, ETA, potential outcomes with implications, and any upfront clarification card while routing the background work either to an active deep-niche specialist, across 

## Begin — Topic arrives (`Start_QuestionArrives`)

- Begin here: A user question, design option, or research sub-problem arrives in foreground discussion or research coordination.
- Call `workflow_start` with `process: "Process_ResearchDelegationAndNicheRouting"` and the subject this run is about; keep the instance id it returns.
- next: → `GW_ExceedsBriefLookup` (Exceeds ~15-20 s lookup?)

### Decide — Exceeds ~15-20 s lookup? (`GW_ExceedsBriefLookup`)

- `No` when a single-step local lookup answers within ~15-20 s; `Yes` whenever multi-step search, proof checking, computation, or literature synthesis would block the foreground turn past ~15-20 s.
- Call `workflow_complete` with `node: "GW_ExceedsBriefLookup"` and `outcome` set to the label that holds:
  - «No» → `Task_AnswerInline` (Answer inline in foreground)
  - «Yes» → `Task_ReportNonBlockingDispatch` (Post scope, ETA, outcomes and card)

### 1. Answer inline in foreground (`Task_AnswerInline`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `turn-reporting`.
- What: Perform the single-step lookup and reply directly in the foreground turn with exact file links and evidence.
- Record it: `workflow_complete` with `node: "Task_AnswerInline"`.
- next: → `End_AnsweredInline` (Answered inline)

### 2. Post scope, ETA, outcomes and card (`Task_ReportNonBlockingDispatch`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `turn-reporting`, `interaction-modality`.
- What: Keep the foreground turn open for user input: report (a) what is being investigated in the background, (b) expected duration (ETA), (c) potential outcomes and their implications, and (d) any upfront structured clarification card (with full chat context written first).
- Record it: `workflow_complete` with `node: "Task_ReportNonBlockingDispatch"`.
- next: → `GW_NicheRoute` (Niche routing mode?)

## Done — Answered inline (`End_AnsweredInline`)

- The instance completes here: Brief single-step lookup answered directly without background delegation. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### Decide — Niche routing mode? (`GW_NicheRoute`)

- Selects `same niche` when a standing specialist already owns this domain, `cross-niche bridge` when the question spans an interface between two or more active niches, or `new niche` when no active specialist covers the topic.
- Call `workflow_complete` with `node: "GW_NicheRoute"` and `outcome` set to the label that holds:
  - «same niche» → `Task_RouteSameSpecialist` (Route to standing niche specialist)
  - «cross-niche bridge» → `Task_FanOutBridge` (Fan bridging query across niches)
  - «new niche» → `Task_SpawnNicheSpecialist` (Spawn specialist for new niche)

### 3. Route to standing niche specialist (`Task_RouteSameSpecialist`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `research-manager`.
- What: Send the follow-up question to the active specialist for that niche so accumulated domain vocabulary, theorem inventory, and negative-result memory are preserved.
- Record it: `workflow_complete` with `node: "Task_RouteSameSpecialist"`.
- next: → `GW_DispatchJoin`

### 4. Fan bridging query across niches (`Task_FanOutBridge`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `research-manager`, `dispatch-agent`.
- What: Dispatch the interface question in parallel to multiple standing niche specialists so independent domain lenses test whether a concrete structural connection or theorem emerges.
- Record it: `workflow_complete` with `node: "Task_FanOutBridge"`.
- next: → `GW_DispatchJoin`

### 5. Spawn specialist for new niche (`Task_SpawnNicheSpecialist`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `dispatch-agent`, `research-manager`.
- What: Claim a child work item and launch a fresh background specialist dedicated to the new niche with the mandatory skill launch briefing and progress contract.
- Record it: `workflow_complete` with `node: "Task_SpawnNicheSpecialist"`.
- next: → `GW_DispatchJoin`

### Merge — `GW_DispatchJoin`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `Task_WriteAheadEpicCheckpoint` (Write-ahead checkpoint epic & lease table)

### 6. Write-ahead checkpoint epic & lease table (`Task_WriteAheadEpicCheckpoint`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `research-manager`, `agent-handoff`, `handover-report`.
- What: At dispatch time (never waiting for post-merge, and never mutating a claimed child executor bean's .md file), write-ahead checkpoint the parent epic body and/or a branch-keyed `checkpoint: <epic/wave> <UTC>` note on cat/cat-harness/beans with newly opened child bean IDs, canonical 3-slot dispatch li
- Record it: `workflow_complete` with `node: "Task_WriteAheadEpicCheckpoint"`.
- next: → `Call_EvidenceAndResearch` (Investigate niche and ingest KG evidence)

### 7. Investigate niche and ingest KG evidence (`Call_EvidenceAndResearch`)

- Who: the `Niche research specialists` lane (role `authoring-agent`).
- Skill: `evidence-gathering-and-provenance`, `online-sequence-and-knot-databases`.
- What: Specialists investigate the question within their deep niche and execute Process_EvidenceGatheringAndProvenance (including online sequence, knot-census, number-theory, and >= 80 dps constant-recognition lookups across OEIS, KnotInfo/LinkInfo/SnapPy/Regina, and LMFDB whenever sequences, series coeffi
- A subprocess (`Process_EvidenceGatheringAndProvenance`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `Task_SynthesizeAndUpdateUser` (Synthesize agreements, tensions and report)

### 8. Synthesize agreements, tensions and report (`Task_SynthesizeAndUpdateUser`)

- Who: the `Foreground coordinator` lane (role `session-coordinator`).
- Skill: `research-manager`, `turn-reporting`.
- What: Promptly on background completion, synthesize single-specialist results or cross-niche agreements and tensions, state concrete implications, and offer any follow-up research paths on a decision card.
- Record it: `workflow_complete` with `node: "Task_SynthesizeAndUpdateUser"`.
- next: → `End_UserUpdated` (Foreground updated with findings)

## Done — Foreground updated with findings (`End_UserUpdated`)

- The instance completes here: User receives synthesized findings, provenance links, and any follow-up path cards without foreground blocking. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
