<!-- GENERATED from folio-assistant-sci/processes/content/lean-docs-publish.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Publish a folio's Lean render with the harness chrome

> **Generated, and not the authority.** This is `folio-assistant-sci/processes/content/lean-docs-publish.bpmn` (process `Process_LeanDocsPublish`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Build a folio's Lean render — the doc-gen4 HTML of the Lake packages the folio holds — keep it on its own branch store, and publish it inside the folio's site with the harness navbar and rail.

## Begin — Lean sources changed (`Start_Changed`)

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
  - «yes» → `Task_Store` (Write the KG render to the Lean branch store)
  - «no» → `End_NoRender` (No render — refused or failed; nothing stored)

### 2. Write the KG render to the Lean branch store (`Task_Store`)

- Who: the `Lean toolchain` lane (role `lean-toolchain`).
- Skill: `lean-html-docs`.
- What: Tool `lean-kg-publish` (`adapters/paper/lean/lean-kg-publish.ts --doc-data <pkg>/.lake/build/doc-data --site <checkout> --route <store path> --no-rail`) writes the viewer page and its `data/` shards into the mounted store's path (the folio's declared `lean` graph, e.g.
- Record it: `workflow_complete` with `node: "Task_Store"`.
- next: → `GW_Stored` (Did the store take it?)

## Done — No render — refused or failed; nothing stored (`End_NoRender`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### Decide — Did the store take it? (`GW_Stored`)

- Answered by `branch-store.ts push`: `pushed` (or `current`) continues; a `conflict` or a failed push stops here, and the previous render on the branch stays what a site build mounts.
- Call `workflow_complete` with `node: "GW_Stored"` and `outcome` set to the label that holds:
  - «yes» → `Task_Mount` (Mount the Lean branch store)
  - «no» → `End_NotStored` (Not stored — the previous render stands)

### 3. Mount the Lean branch store (`Task_Mount`)

- Who: the `CI/CD Pipeline` lane (role `build-pipeline`).
- Skill: `lean-html-docs`.
- What: `bun run cat state:mount` (or `branch-store.ts mount --id <id>`) at the start of the site build, as for `beans/`: puts the branch tip on disk at the declared path.
- Record it: `workflow_complete` with `node: "Task_Mount"`.
- next: → `GW_Mounted` (Is the render on disk?)

## Done — Not stored — the previous render stands (`End_NotStored`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### Decide — Is the render on disk? (`GW_Mounted`)

- Answered by `state:mount`'s row for the store: `mounted` continues; a `miss` (no such branch) or any failure stops here.
- Call `workflow_complete` with `node: "GW_Mounted"` and `outcome` set to the label that holds:
  - «yes» → `Task_Publish` (Publish the render at its route, railed)
  - «no» → `End_NoMount` (No mounted render — Lean pages not published)

### 4. Publish the render at its route, railed (`Task_Publish`)

- Who: the `CI/CD Pipeline` lane (role `build-pipeline`).
- Skill: `lean-html-docs`.
- What: A site step of the folio's declared build (`site.build.siteSteps`).
- Record it: `workflow_complete` with `node: "Task_Publish"`.
- next: → `GW_Railed` (Every page railed or declined?)

## Done — No mounted render — Lean pages not published (`End_NoMount`)

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
