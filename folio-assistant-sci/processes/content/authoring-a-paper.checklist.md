<!-- GENERATED from folio-assistant-sci/processes/content/authoring-a-paper.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Authoring a paper

> **Generated, and not the authority.** This is `folio-assistant-sci/processes/content/authoring-a-paper.bpmn` (process `Process_PaperAuthoring`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

How a scientific paper or book folio is authored end to end, with Lean for its formal claims and LaTeX for its typesetting.

## Begin — New paper (`StartEvent_NewPaper`)

- Begin here.
- Call `workflow_start` with `process: "Process_PaperAuthoring"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_Plan` (Plan the paper)

### 1. Plan the paper (`Task_Plan`)

- Who: the `Author (person)` lane (role `author`).
- Skill: `content-plan`.
- What: Scope the paper: chapters, the blocks each needs, what gets formalised.
- Record it: `workflow_complete` with `node: "Task_Plan"`.
- next: → `Call_BeanOpen` (Open the bean)

### 2. Open the bean (`Call_BeanOpen`)

- Who: the `Work plan (beans)` lane (role `work-plan`).
- Skill: `bean-coordination`.
- What: Process_BeanOpen: check before you create, find out whose the bean is, and claim it — or leave it alone when it is someone else's.
- A subprocess (`Process_BeanOpen`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_BeanYours` (Bean claimed?)

### Decide — Bean claimed? (`GW_BeanYours`)

- Reads which end Process_BeanOpen reached.
- Call `workflow_complete` with `node: "GW_BeanYours"` and `outcome` set to the label that holds:
  - «claimed» → `Task_SeedPlan` (Seed the work plan)
  - «not yours» → `End_BeanNotYours` (Not yours: left alone)

### 3. Seed the work plan (`Task_SeedPlan`)

- Who: the `Work plan (beans)` lane (role `work-plan`).
- Skill: `todo-manager`.
- What: The plan becomes beans, so a resumed session or a sibling agent can pick it up.
- Record it: `workflow_complete` with `node: "Task_SeedPlan"`.
- next: → `Task_Scaffold` (Scaffold the folio repo)

## Done — Not yours: left alone (`End_BeanNotYours`)

- The instance completes here: Someone else holds the bean; this run stops without touching it. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 4. Scaffold the folio repo (`Task_Scaffold`)

- Who: the `Authoring agent (system)` lane (role `authoring-agent`).
- Skill: `content-plan`.
- What: Create the folio repository with `bun run cat init-folio` (or the folio_init tool): content/, the document, chapter and first block manifests, the builder shim, AGENTS.md, .mcp.json, the session-start hook and the beans store, with the platform linked rather than copied.
- Record it: `workflow_complete` with `node: "Task_Scaffold"`.
- next: → `Task_AuthorBlocks` (Author blocks)

### 5. Author blocks (`Task_AuthorBlocks`)

- Who: the `Authoring agent (system)` lane (role `authoring-agent`).
- Skill: `content-author`.
- What: Every block edit runs the HCI validation gate — see editing-hci-validation.bpmn.
- Record it: `workflow_complete` with `node: "Task_AuthorBlocks"`.
- next: → `Task_Formalize` (Formalise in Lean)

### 6. Formalise in Lean (`Task_Formalize`)

- Who: the `Lean toolchain (lean-mcp)` lane (role `lean-toolchain`).
- Skill: `lean-formalization`, `proof-verification`.
- What: Give each formal block (definition, theorem, lemma, proposition, corollary, conjecture, proof) a .lean sibling that Lean 4 accepts, in the order lean-formalization sets out.
- Record it: `workflow_complete` with `node: "Task_Formalize"`.
- next: → `Gateway_LeanGreen` (Build green, no sorries?)

### Decide — Build green, no sorries? (`Gateway_LeanGreen`)

- Answered by the Lean build after formalisation: is it green with no `sorry` left?
- Computed by the DMN table `decisions/lean-build-gate.dmn#Decision_LeanBuildGate`: call `workflow_complete` with `node: "Gateway_LeanGreen"` and the `facts` it reads — the table returns the branch; pass no `outcome`.
  - «not yet» → `Task_Formalize` (Formalise in Lean)
  - «green» → `Task_Validate` (Validate)

### 7. Validate (`Task_Validate`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `content-validate`.
- What: Run content validation over the folio: schemas, the content profile (formal kinds only in a paper), cross-block consistency and that the Lean builds.
- Record it: `workflow_complete` with `node: "Task_Validate"`.
- next: → `Task_Render` (Render PDF and HTML)

### 8. Render PDF and HTML (`Task_Render`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `latex-authoring`.
- What: Typeset the paper through LaTeX to PDF and HTML.
- Record it: `workflow_complete` with `node: "Task_Render"`.
- next: → `Call_ReviewPublish` (Review and publish)

### 9. Review and publish (`Call_ReviewPublish`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `content-review`.
- What: Core's shared review-and-publish process (Process_FolioReviewPublish): the reviewer reads the rendered folio and approves it, asks for changes, or sends a working draft to the Authoring Committee.
- A subprocess (`Process_FolioReviewPublish`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_Published` (Published?)

### Decide — Published? (`GW_Published`)

- Reads which end Process_FolioReviewPublish reached.
- Call `workflow_complete` with `node: "GW_Published"` and `outcome` set to the label that holds:
  - «yes» → `Call_BeanClose` (Close the bean)
  - «no» → `Task_AuthorBlocks` (Author blocks)

### 10. Close the bean (`Call_BeanClose`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `todo-manager`.
- What: Process_BeanClose: end the bean in a state that says why — complete and archive it, scrap it with its reasons and archive it, or record the blocker and hand it back.
- A subprocess (`Process_BeanClose`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `EndEvent_Published` (Paper published)

## Done — Paper published (`EndEvent_Published`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
