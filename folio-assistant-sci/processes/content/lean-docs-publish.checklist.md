<!-- GENERATED from folio-assistant-sci/processes/content/lean-docs-publish.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Publish a folio's Lean render with the harness chrome

> **Generated, and not the authority.** This is `folio-assistant-sci/processes/content/lean-docs-publish.bpmn` (process `Process_LeanDocsPublish`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Build the visualiser of a folio's declared `lean` directory — the Lake package's doc-gen4 HTML render — and put it inside the folio's built site with the harness navbar and rail.

## Begin — The folio's Lean sources or its site changed (`Start_Changed`)

- Begin here.
- Call `workflow_start` with `process: "Process_LeanDocsPublish"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_Build` (Build the doc-gen4 render over the warm cache)

### 1. Build the doc-gen4 render over the warm cache (`Task_Build`)

- Who: the `Lean toolchain` lane (role `lean-toolchain`).
- Skill: `lean-html-docs`.
- What: Tool `lean-html-docs` (`adapters/paper/lean/lean-docs-build.sh --lake-root <pkg> --lib <Lib>`).
- Record it: `workflow_complete` with `node: "Task_Build"`.
- next: → `GW_Built` (Is there a render?)

### Decide — Is there a render? (`GW_Built`)

- Answered by Task_Build's exit code: 0 and a render directory, or a refusal (2: a guard; 3: no warm cache) or a failed build (1).
- Call `workflow_complete` with `node: "GW_Built"` and `outcome` set to the label that holds:
  - «yes — built» → `Task_Publish` (Stage the render under the site and rail every page)
  - «no» → `End_NoRender` (No render — refused or failed; nothing published)

### 2. Stage the render under the site and rail every page (`Task_Publish`)

- Who: the `CI/CD Pipeline` lane (role `build-pipeline`).
- Skill: `lean-html-docs`.
- What: Tool `lean-render-publish` (`adapters/paper/lean/lean-render.ts --docs <render> --site <site>`).
- Record it: `workflow_complete` with `node: "Task_Publish"`.
- next: → `GW_Railed` (Every page railed or declined?)

## Done — No render — refused or failed; nothing published (`End_NoRender`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### Decide — Every page railed or declined? (`GW_Railed`)

- Answered by Task_Publish's own closing assertion: a staged page carrying neither the harness rail nor the `folio-navbar: none` opt-out fails it (exit 1).
- Call `workflow_complete` with `node: "GW_Railed"` and `outcome` set to the label that holds:
  - «yes» → `End_Ready` (Lean pages ready for the chrome check and deploy)
  - «no» → `End_Unrailed` (Pages without chrome — not published)

## Done — Lean pages ready for the chrome check and deploy (`End_Ready`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

## Done — Pages without chrome — not published (`End_Unrailed`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
