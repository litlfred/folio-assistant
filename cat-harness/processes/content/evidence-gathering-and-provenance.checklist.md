<!-- GENERATED from cat-harness/processes/content/evidence-gathering-and-provenance.bpmn by cat-harness-tools/scripts/bpmn-checklist.ts. Do not edit: change the diagram and regenerate (bun run cat bpmn:checklist). -->

# Checklist — Evidence gathering and provenance

> **Generated, and not the authority.** This is `cat-harness/processes/content/evidence-gathering-and-provenance.bpmn` (process `Process_EvidenceGatheringAndProvenance`) walked as a state machine. The diagram and the workflow engine decide; this list only reads them. Follow the `next:` line of each step rather than the order on the page, and record each step with the call it names, so the engine's committed state — not this list — says which edge was taken.

Five-step research and authoring-provenance workflow executed whenever a research or authoring agent investigates a topic: decompose topic areas and shortlist needed papers and datasets, query accessible scholarly and data APIs (Crossref/DOI, arXiv, PubMed, InspireHEP, OpenAlex, Semantic Scholar, Go

## Begin — Topic research needed (`Start_ResearchNeeded`)

- Begin here: A research or authoring agent begins investigating a topic area before drafting or revising claims.
- Call `workflow_start` with `process: "Process_EvidenceGatheringAndProvenance"` and the subject this run is about; keep the instance id it returns.
- next: → `Task_DecomposeShortlist` (Decompose topics and shortlist sources)

### 1. Decompose topics and shortlist sources (`Task_DecomposeShortlist`)

- Who: the `Research and authoring agent` lane (role `authoring-agent`).
- Skill: `evidence-gathering-and-provenance`.
- What: Write up explicit research topic areas, check declared memory, library, references, and uploads graphs first, and compile a targeted shortlist of needed primary papers, standards, and reference datasets per topic area.
- Record it: `workflow_complete` with `node: "Task_DecomposeShortlist"`.
- next: → `Task_MultiDbSearch` (Query scholarly and data APIs)

### 2. Query scholarly and data APIs (`Task_MultiDbSearch`)

- Who: the `Research and authoring agent` lane (role `authoring-agent`).
- Skill: `literature-search`, `evidence-gathering-and-provenance`, `online-sequence-and-knot-databases`.
- What: Query accessible bibliographic, preprint, biomedical, mathematical-catalogue, and data databases (Crossref/DOI doi.org and api.crossref.org, arXiv export.arxiv.org, PubMed / EuropePMC, InspireHEP, OpenAlex, Semantic Scholar, Google Scholar, OEIS across unit-rescaled / logged / unlogged / factorial-c
- Record it: `workflow_complete` with `node: "Task_MultiDbSearch"`.
- next: → `GW_FetchOutcome` (Source fetched?)

### Decide — Source fetched? (`GW_FetchOutcome`)

- Three-state retrieval check: `fetched` when open-access full text, dataset, or CSL-JSON metadata is retrieved for ingestion; `blocked or missing` when a runtime proxy/paywall blocks transfer or no open-access copy resolves.
- Call `workflow_complete` with `node: "GW_FetchOutcome"` and `outcome` set to the label that holds:
  - «blocked or missing» → `Task_RecordBlockedOrGap` (Record blocked fetch or search gap)
  - «fetched» → `Call_IngestIntoKg` (Ingest into declared KG)

### 3. Record blocked fetch or search gap (`Task_RecordBlockedOrGap`)

- Who: the `Research and authoring agent` lane (role `authoring-agent`).
- Skill: `literature-search`.
- What: Record the full citation, direct download URL, and fetch blocker (so a person can drop the file into uploads/) or log the databases searched and rejected candidates so later sessions never repeat a dead end.
- Record it: `workflow_complete` with `node: "Task_RecordBlockedOrGap"`.
- next: → `GW_AfterIngest`

### 4. Ingest into declared KG (`Call_IngestIntoKg`)

- Who: the `Ingestion engine` lane (role `ingestion-agent`).
- Skill: `library-ingestion`, `evidence-gathering-and-provenance`.
- What: Ingest retrieved CSL-JSON reference nodes (references/), open-access PDFs and sections (uploads/ to library/ via Process_Ingestion), reference datasets, and verification attestations into the instance's declared Knowledge Graph subgraphs.
- A subprocess (`Process_Ingestion`): `workflow_next` reports its own steps; complete those — this call activity itself is not completable.
- next: → `GW_AfterIngest`

### Merge — `GW_AfterIngest`

- Nothing to do or decide: the paths meet here and the engine passes through.
- next: → `Task_AssessRelevancy` (Assess relevancy and claim boundaries)

### 5. Assess relevancy and claim boundaries (`Task_AssessRelevancy`)

- Who: the `Research and authoring agent` lane (role `authoring-agent`).
- Skill: `evidence-gathering-and-provenance`.
- What: Open the ingested library sections or dataset rows and record the exact locator (theorem, section, equation, or table slug), hypotheses and conventions, and claim boundaries (what the source does not establish).
- Record it: `workflow_complete` with `node: "Task_AssessRelevancy"`.
- next: → `Task_RecordProvenanceAndCite` (Record authoring provenance and cite)

### 6. Record authoring provenance and cite (`Task_RecordProvenanceAndCite`)

- Who: the `Research and authoring agent` lane (role `authoring-agent`).
- Skill: `evidence-gathering-and-provenance`.
- What: Record retrieval and verification provenance (database/API, DOI/arXiv/PMID, date, locator, and relevancy summary) in authoring notes and attestations, and wire formal citation edges and Liquid dataset values in authored blocks.
- Record it: `workflow_complete` with `node: "Task_RecordProvenanceAndCite"`.
- next: → `End_ProvenanceLinked` (Evidence ingested and linked)

## Done — Evidence ingested and linked (`End_ProvenanceLinked`)

- The instance completes here: Sources are ingested into the Knowledge Graph, assessed for relevancy, and linked with provenance in the authored content. `workflow_next` then reports nothing enabled — that, not this line, is the record of completion.
