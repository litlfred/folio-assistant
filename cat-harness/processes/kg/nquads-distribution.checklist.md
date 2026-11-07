<!-- GENERATED from cat-harness/processes/kg/nquads-distribution.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Package and distribute partitioned W3C N-Quads and named queries

> **Generated, and not the authority.** This is `cat-harness/processes/kg/nquads-distribution.bpmn` (process `Process_NQuadsDistribution`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Extract, partition, package, and distribute knowledge graph datasets as W3C RDF 1.1 N-Quads with pre-compiled named SPARQL queries.

## Begin — Corpus or graph requires distribution (`Start_Dataset`)

- Begin here.
- Call `workflow_start` with `process: "Process_NQuadsDistribution"` and the subject this run is about; keep the instance id it returns.
- next: → `A_ExtractSkolemize` (Extract & Skolemize RDF Dataset)

### 1. Extract & Skolemize RDF Dataset (`A_ExtractSkolemize`)

- Who: the `Knowledge Graph Engineer` lane (role `platform-authoring-agent`).
- Skill: `nquads-distribution`.
- What: Extract the target RDF triples and ensure strict upstream skolemization: transform every blank node into a deterministic IRI under the dataset namespace.
- Record it: `workflow_complete` with `node: "A_ExtractSkolemize"`.
- next: → `A_PartitionQuads` (Stream W3C N-Quads into Subgraph Partitions)

### 2. Stream W3C N-Quads into Subgraph Partitions (`A_PartitionQuads`)

- Who: the `Knowledge Graph Engineer` lane (role `platform-authoring-agent`).
- Skill: `nquads-distribution`.
- What: Serialize lines conforming to W3C RDF 1.1 N-Quads (subject predicate object graphIri .).
- Record it: `workflow_complete` with `node: "A_PartitionQuads"`.
- next: → `GW_PartitionBudget` (All partitions under 5 MB / 50k quads budget?)

### Decide — All partitions under 5 MB / 50k quads budget? (`GW_PartitionBudget`)

- Enforce partition size ceiling: verify that no partition exceeds MAX_RECOMMENDED_PARTITION_BYTES (5 MB gzipped) or 50,000 quads.
- Call `workflow_complete` with `node: "GW_PartitionBudget"` and `outcome` set to the label that holds:
  - «Under budget» → `A_DeclareManifest` (Declare Distribution Manifest & Named Queries)
  - «Over budget» → `A_ReportBudgetExcess` (Report Budget Finding; Refine Subgraph Splitting)

### 3. Declare Distribution Manifest & Named Queries (`A_DeclareManifest`)

- Who: the `Knowledge Graph Engineer` lane (role `platform-authoring-agent`).
- Skill: `nquads-distribution`, `named-query-execution`.
- What: Write subgraph-manifest.json conforming to folio-nquads-distribution/v1.
- Record it: `workflow_complete` with `node: "A_DeclareManifest"`.
- next: → `A_VerifyQueries` (Verify Queries via CLI & Test Graph Availability)

### 4. Report Budget Finding; Refine Subgraph Splitting (`A_ReportBudgetExcess`)

- Who: the `Knowledge Graph Engineer` lane (role `platform-authoring-agent`).
- Skill: `nquads-distribution`.
- What: Record the oversized partition on the coordinating bean.
- Record it: `workflow_complete` with `node: "A_ReportBudgetExcess"`.
- next: → `End_BudgetStopped` (Stopped on partition budget)

### 5. Verify Queries via CLI & Test Graph Availability (`A_VerifyQueries`)

- Who: the `Knowledge Graph Engineer` lane (role `platform-authoring-agent`).
- Skill: `named-query-execution`.
- What: Execute named queries using scripts/nquads-query.ts and the nquads-query MCP tool.
- Record it: `workflow_complete` with `node: "A_VerifyQueries"`.
- next: → `A_GateCheck` (Audit the manifest and schemas)

## Done — Stopped on partition budget (`End_BudgetStopped`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

### 6. Audit the manifest and schemas (`A_GateCheck`)

- Who: the `CI/CD Pipeline` lane (role `build-pipeline`).
- Skill: `named-query-execution`.
- What: Validate that subgraph-manifest.json conforms to NQuadsDistributionManifestSchema, all referenced partitions exist, and external schema w3c-n-quads is satisfied.
- Record it: `workflow_complete` with `node: "A_GateCheck"`.
- next: → `GW_CiGreen` (Gate passes?)

### Decide — Gate passes? (`GW_CiGreen`)

- Call `workflow_complete` with `node: "GW_CiGreen"` and `outcome` set to the label that holds:
  - «Green» → `A_DeployPages` (Publish Distribution via 'served: true' to Pages)
  - «Red» → `End_CiFailed` (CI Gate Failed)

### 7. Publish Distribution via 'served: true' to Pages (`A_DeployPages`)

- Who: the `CI/CD Pipeline` lane (role `build-pipeline`).
- Skill: `nquads-distribution`.
- What: Publish distribution directory to _site/ via mount-instance-docs.ts respecting 'served: true' declaration.
- Record it: `workflow_complete` with `node: "A_DeployPages"`.
- next: → `End_Distributed` (Dataset and queries served universally)

## Done — CI Gate Failed (`End_CiFailed`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.

## Done — Dataset and queries served universally (`End_Distributed`)

- The instance completes here. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
