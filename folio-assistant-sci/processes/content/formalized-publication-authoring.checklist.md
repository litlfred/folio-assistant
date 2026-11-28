<!-- GENERATED from folio-assistant-sci/processes/content/formalized-publication-authoring.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Formalized Scientific Publication Authoring

> **Generated, and not the authority.** This is `folio-assistant-sci/processes/content/formalized-publication-authoring.bpmn` (process `Process_FormalizedPublicationAuthoring`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

One mathematical result, from the author's intent to a merged change set.

## Begin — Result intended (`Start_Intent`)

- Begin here.
- Call `workflow_start` with `process: "Process_FormalizedPublicationAuthoring"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_StateIntent` (Set claim)

### 1. Set claim (`Task_StateIntent`)

- Who: the `Author` lane (role `author`).
- Skill: `content-plan`.
- What: The author names the claim, the objects it is about, and the sources it rests on, before any text is drafted.
- Record it: `workflow_complete` with `node: "Task_StateIntent"`.
- next: → `Task_PriorWork` (Search folio and library)

### 2. Search folio and library (`Task_PriorWork`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `deep-document-research`, `literature-search`, `library-ingestion`, `reference-dataset-ingestion`, `evidence-gathering-and-provenance`.
- What: Decompose topic areas, check the folio's blocks, compute, and ingested library, shortlist needed external papers and reference datasets (CODATA, PDG, AME), query accessible scholarly and mathematical databases (Crossref/DOI, arXiv, PubMed, InspireHEP, OpenAlex, Semantic Scholar, Google Scholar, plus
- Record it: `workflow_complete` with `node: "Task_PriorWork"`.
- next: → `GW_AlreadyHeld` (Already proved?)

### Decide — Already proved? (`GW_AlreadyHeld`)

- Decided by the authoring agent from the prior-work search across the folio and its ingested library.
- Call `workflow_complete` with `node: "GW_AlreadyHeld"` and `outcome` set to the label that holds:
  - «yes» → `End_Cited` (Cited, not re-derived)
  - «no» → `Task_DraftTriple` (Draft triple: prose and Lean)

## Done — Cited, not re-derived (`End_Cited`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 3. Draft triple: prose and Lean (`Task_DraftTriple`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `lean-formalization`.
- What: Write the narrative statement and narrative proof in the block's `.md` and the formal statement and proof in its `.lean`.
- Record it: `workflow_complete` with `node: "Task_DraftTriple"`.
- next: → `Task_LeanCheck` (Compile Lean; report axioms)

### 4. Compile Lean; report axioms (`Task_LeanCheck`)

- Who: the `Lean toolchain` lane (role `lean-toolchain`).
- Skill: `proof-verification`.
- What: Compile against the real import cone; record `#print axioms` and `sorry` status for the new declarations.
- Record it: `workflow_complete` with `node: "Task_LeanCheck"`.
- next: → `Task_Mechanical` (Run mechanical checks)

### 5. Run mechanical checks (`Task_Mechanical`)

- Who: the `Build pipeline` lane (role `build-pipeline`).
- Skill: `content-validate`, `lean-proof-vacuity-audit`, `witnessed-values`.
- What: Schema validation, reference and citation resolution, math render, vacuity audit (no `True` conclusions, no empty conjecture classes, no uncited `sorry`), and witness staleness for every quoted number.
- Record it: `workflow_complete` with `node: "Task_Mechanical"`.
- next: → `GW_MechanicalGreen` (Mechanical checks green?)

### Decide — Mechanical checks green? (`GW_MechanicalGreen`)

- Answered deterministically by the build pipeline's exit status over Lean elaboration, schema, reference, math-render, vacuity and witness checks.
- Call `workflow_complete` with `node: "GW_MechanicalGreen"` and `outcome` set to the label that holds:
  - «yes» → `GW_Fork`
  - «no — fix» → `Task_DraftTriple` (Draft triple: prose and Lean)

### Do all of — `GW_Fork`

- Work every branch; none is optional. Branches: → `Task_BlindLeanToProse` (Translate Lean to prose blind), → `Task_BlindProseToLean` (Translate prose to claim blind)
- The engine passes through this gateway itself; there is nothing to record here.

### 6. Translate Lean to prose blind (`Task_BlindLeanToProse`)

- Who: the `Independent reviewers` lane (role `qc-reviewer`).
- Skill: `proof-narrative-lean-equivalence`.
- What: An independent reviewer reads only the `.lean` declaration and proof and states in mathematical prose what hypotheses, quantifiers, objects and conclusion it proves, without seeing the block's `.md` narrative.
- Record it: `workflow_complete` with `node: "Task_BlindLeanToProse"`.
- next: → `GW_Join`

### 7. Translate prose to claim blind (`Task_BlindProseToLean`)

- Who: the `Independent reviewers` lane (role `qc-reviewer`).
- Skill: `proof-narrative-lean-equivalence`.
- What: A second independent reviewer reads only the `.md` narrative statement and proof and writes the formal hypotheses, quantifiers, objects and conclusion it claims, without seeing the `.lean` file.
- Record it: `workflow_complete` with `node: "Task_BlindProseToLean"`.
- next: → `GW_Join`

### Wait for all — `GW_Join`

- Continue only when every one of the 2 incoming branches is done; the engine passes through itself.
- next: → `Task_JudgeEquivalence` (Judge two-way equivalence)

### 8. Judge two-way equivalence (`Task_JudgeEquivalence`)

- Who: the `Independent reviewers` lane (role `qc-reviewer`).
- Skill: `proof-narrative-lean-equivalence`.
- What: Same hypotheses, same quantifier order, same conclusion, same objects, in both directions.
- Record it: `workflow_complete` with `node: "Task_JudgeEquivalence"`.
- next: → `Task_Adversarial` (Challenge the block)

### 9. Challenge the block (`Task_Adversarial`)

- Who: the `Independent reviewers` lane (role `qc-reviewer`).
- Skill: `devils-advocate-paper`.
- What: An independent adversarial reviewer builds the strongest mathematical and formal case that the statement, proof or model framing is false, vacuous, over-claimed or missing a hypothesis.
- Record it: `workflow_complete` with `node: "Task_Adversarial"`.
- next: → `GW_Equivalent` (Equivalent, no open finding?)

### Decide — Equivalent, no open finding? (`GW_Equivalent`)

- Decided from the two-way equivalence judgement and the adversarial review sidecars.
- Call `workflow_complete` with `node: "GW_Equivalent"` and `outcome` set to the label that holds:
  - «yes» → `Task_Merge` (Merge PR)
  - «no» → `GW_Closable` (Finding closable?)

### 10. Merge PR (`Task_Merge`)

- Who: the `Author` lane (role `author`).
- Skill: `content-review`.
- What: The author inspects the block triple, its mechanical verdicts and the independent equivalence and adversarial review records on the pull request, and merges the change set.
- Record it: `workflow_complete` with `node: "Task_Merge"`.
- next: → `End_Merged` (Result published)

### Decide — Finding closable? (`GW_Closable`)

- Decided by the authoring agent from the review finding.
- Call `workflow_complete` with `node: "GW_Closable"` and `outcome` set to the label that holds:
  - «yes» → `Task_DraftTriple` (Draft triple: prose and Lean)
  - «no» → `Task_RecordGap` (Record gap or conjecture)

## Done — Result published (`End_Merged`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 11. Record gap or conjecture (`Task_RecordGap`)

- Who: the `Authoring agent` lane (role `authoring-agent`).
- Skill: `proof-gap-audit`, `handover-report`, `stalled-agent-triage`.
- What: Demote the block to a conjecture, or state the open step with `sorry` and a citation, and write-ahead checkpoint the parent epic (`checkpoint:` / `handover:` / `reentry:` notes on `cat/cat-harness/beans`, active vs excluded proof/compute routes, and the Worktree / `/tmp`-Overlay / `.lake`-Donor Leas
- Record it: `workflow_complete` with `node: "Task_RecordGap"`.
- next: → `Task_LeanCheck` (Compile Lean; report axioms)
