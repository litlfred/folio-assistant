<!-- GENERATED from cat-harness/processes/kg/named-query-execution.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Execute audited named queries over partitioned W3C N-Quads distributions

> **Generated, and not the authority.** This is `cat-harness/processes/kg/named-query-execution.bpmn` (process `Process_NamedQueryExecution`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Universal execution of audited named SPARQL queries against W3C RDF 1.1 N-Quads distributions across CLI, MCP, and Web runtimes.

## Begin — Named query requested (`Start_QueryRequest`)

- Begin here.
- Call `workflow_start` with `process: "Process_NamedQueryExecution"` and the subject this run is about; keep the instance id it returns.
- next: → `A_ValidateParams` (Validate Arguments against Parameter Schema)

### 1. Validate Arguments against Parameter Schema (`A_ValidateParams`)

- Who: the `Query Caller (CLI / MCP / Web)` lane (role `authoring-agent`).
- Skill: `named-query-execution`.
- What: Look up query definition by queryId in distribution manifest.
- Record it: `workflow_complete` with `node: "A_ValidateParams"`.
- next: → `GW_ValidParams` (Arguments valid?)

### Decide — Arguments valid? (`GW_ValidParams`)

- Call `workflow_complete` with `node: "GW_ValidParams"` and `outcome` set to the label that holds:
  - «Valid» → `A_CheckSubgraphs` (Check Graph Availability Guard (requiredSubgraphs))
  - «Invalid» → `A_RejectInvalidArgs` (Reject Request with ValidationError)

### 2. Check Graph Availability Guard (requiredSubgraphs) (`A_CheckSubgraphs`)

- Who: the `Universal Query Engine Runtime` lane (role `build-pipeline`).
- Skill: `named-query-execution`.
- What: Inspect query definition requiredSubgraphs list.
- Record it: `workflow_complete` with `node: "A_CheckSubgraphs"`.
- next: → `GW_SubgraphsLoaded` (All required subgraphs loaded in store?)

### 3. Reject Request with ValidationError (`A_RejectInvalidArgs`)

- Who: the `Query Caller (CLI / MCP / Web)` lane (role `authoring-agent`).
- Skill: `named-query-execution`.
- What: Abort execution immediately with detailed validation error describing missing or ill-typed arguments.
- Record it: `workflow_complete` with `node: "A_RejectInvalidArgs"`.
- next: → `End_InvalidParams` (Query rejected on invalid arguments)

### Decide — All required subgraphs loaded in store? (`GW_SubgraphsLoaded`)

- Call `workflow_complete` with `node: "GW_SubgraphsLoaded"` and `outcome` set to the label that holds:
  - «All loaded» → `A_BindExecute` (Bind Typed Parameters & Execute SPARQL)
  - «Missing» → `GW_AutoFetch` (Auto-fetch enabled & source reachable?)

## Done — Query rejected on invalid arguments (`End_InvalidParams`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 4. Bind Typed Parameters & Execute SPARQL (`A_BindExecute`)

- Who: the `Universal Query Engine Runtime` lane (role `build-pipeline`).
- Skill: `named-query-execution`.
- What: Safely bind validated parameters into the audited SPARQL template with escaping.
- Record it: `workflow_complete` with `node: "A_BindExecute"`.
- next: → `A_FormatResponse` (Format Universal Result Response Envelope)

### Decide — Auto-fetch enabled & source reachable? (`GW_AutoFetch`)

- Call `workflow_complete` with `node: "GW_AutoFetch"` and `outcome` set to the label that holds:
  - «Can fetch» → `A_FetchPartitions` (Fetch & Ingest Missing Subgraphs (.nq.gz))
  - «Cannot fetch» → `A_RaiseMissingPartition` (Raise MissingPartitionError (Fail-Closed Guard))

### 5. Format Universal Result Response Envelope (`A_FormatResponse`)

- Who: the `Universal Query Engine Runtime` lane (role `build-pipeline`).
- Skill: `named-query-execution`.
- What: Serialize query results into NamedQueryResponseSchema envelope: queryId, executionTimeMs, rowCount, bindings (for SELECT), boolean (for ASK), or quads (for CONSTRUCT).
- Record it: `workflow_complete` with `node: "A_FormatResponse"`.
- next: → `End_Success` (Query completed with verified result)

### 6. Fetch & Ingest Missing Subgraphs (.nq.gz) (`A_FetchPartitions`)

- Who: the `Universal Query Engine Runtime` lane (role `build-pipeline`).
- Skill: `named-query-execution`.
- What: Fetch missing partition payloads over HTTP (servedRoute) or local files, decompress gzip streams, and ingest quads directly into store.
- Record it: `workflow_complete` with `node: "A_FetchPartitions"`.
- next: → `A_BindExecute` (Bind Typed Parameters & Execute SPARQL)

### 7. Raise MissingPartitionError (Fail-Closed Guard) (`A_RaiseMissingPartition`)

- Who: the `Universal Query Engine Runtime` lane (role `build-pipeline`).
- Skill: `named-query-execution`.
- What: Fail execution fast: throw MissingPartitionError naming the required subgraphs that are absent.
- Record it: `workflow_complete` with `node: "A_RaiseMissingPartition"`.
- next: → `End_GuardFailed` (Query aborted on missing partition)

## Done — Query completed with verified result (`End_Success`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

## Done — Query aborted on missing partition (`End_GuardFailed`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
