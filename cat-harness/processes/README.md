<!-- kg:subgraph:begin -->
# processes

Executable BPMN processes and the DMN tables their gateways compute from. The diagrams are the source of truth, not illustrations of one: a lane binds a Role, an activity names the Skill to run through `<folio:skill ref>`, and `workflow_complete` refuses a step that is not enabled. WHERE A RUNNING INSTANCE GOT TO is not here — that is `beans/workflows/`, kind `workflow-state`, which is `state` rather than `content`. Two questions, two graphs.

Part of [C@T Harness](../README.md) 0.1.0, declared as `processes`, holding `processes`.

| file | what it is | used by |
|---|---|---|
| [`activity-log.bpmn`](activity-log.bpmn) | a Process: Agent activity log |  |
| [`actor-role-administration.bpmn`](actor-role-administration.bpmn) | a Process: Actor and role administration |  |
| [`adjudication.bpmn`](adjudication.bpmn) | a Process: Adjudication | "Content Change and Review", "Criterion adjudication", "Ingestion subprocess — the L1 completeness gate", "Refresh materialized remote content" |
| [`atomic-mass-drift-check.bpmn`](atomic-mass-drift-check.bpmn) | a Process: Is AtomicMass.lean still in sync with its data table? |  |
| [`authoring-a-document.bpmn`](authoring-a-document.bpmn) | a Process: Authoring a document |  |
| [`authoring-a-paper.bpmn`](authoring-a-paper.bpmn) | a Process: Authoring a paper |  |
| [`bean-lifecycle.bpmn`](bean-lifecycle.bpmn) | a Process: Agent bean lifecycle |  |
| [`board-open-close.bpmn`](board-open-close.bpmn) | a Process: Board: open and close content |  |
| [`board-place-note.bpmn`](board-place-note.bpmn) | a Process: Board: place a note |  |
| [`board-relocate.bpmn`](board-relocate.bpmn) | a Process: Board: relocate content to the trashcan |  |
| [`ci-health-watch.bpmn`](ci-health-watch.bpmn) | a Process: Is CI actually working on the default branch? |  |
| [`code-change-review.bpmn`](code-change-review.bpmn) | a Process: Code change and review | "Actor and role administration" |
| [`code-quality-gates.bpmn`](code-quality-gates.bpmn) | a Process: The gates a change must pass before it can merge |  |
| [`content-acquisition.bpmn`](content-acquisition.bpmn) | a Process: Content acquisition |  |
| [`content-change-review.bpmn`](content-change-review.bpmn) | a Process: Content Change and Review |  |
| [`content-lifecycle.bpmn`](content-lifecycle.bpmn) | a Process: Content lifecycle |  |
| [`copy-out-materialized.bpmn`](copy-out-materialized.bpmn) | a Process: Copy out materialized content — to work on somebody else's bytes |  |
| [`crdm-close.bpmn`](crdm-close.bpmn) | a Process: CRDM close-out | "CRDM requirements" |
| [`crdm-data-model.bpmn`](crdm-data-model.bpmn) | a Process: CRDM data model | "CRDM requirements" |
| [`crdm-deliver.bpmn`](crdm-deliver.bpmn) | a Process: CRDM Phase 6 — implement, MVP, acceptance | "CRDM requirements" |
| [`crdm-issue-linking.bpmn`](crdm-issue-linking.bpmn) | a Process: CRDM — link the work to an issue | "CRDM requirements" |
| [`crdm-needs.bpmn`](crdm-needs.bpmn) | a Process: CRDM Phase 1 — needs | "CRDM requirements" |
| [`crdm-requirements-definition.bpmn`](crdm-requirements-definition.bpmn) | a Process: CRDM Phases 2–4 — BPA and requirements | "CRDM requirements" |
| [`crdm-requirements.bpmn`](crdm-requirements.bpmn) | a Process: CRDM requirements |  |
| [`crdm-signoff.bpmn`](crdm-signoff.bpmn) | a Process: CRDM Phase 5 — beans and sign-off | "CRDM requirements" |
| [`criterion-adjudication.bpmn`](criterion-adjudication.bpmn) | a Process: Criterion adjudication | "Prose and the code it describes", "Narrative review", "Voice overlay review", "Wireframe design review" |
| [`docs-site-publish.bpmn`](docs-site-publish.bpmn) | a Process: Publishing the docs site, and keeping the previews alive |  |
| [`document-ingestion.bpmn`](document-ingestion.bpmn) | a Process: Document ingestion — uploads/ to the L1 source knowledge graph | "Adopt a methodology from a source document" |
| [`draft-to-publication.bpmn`](draft-to-publication.bpmn) | a Process: Draft, review and publish | "Content lifecycle" |
| [`editing-hci-validation.bpmn`](editing-hci-validation.bpmn) | a Process: Editing and HCI validation | "Content lifecycle", "Draft, review and publish" |
| [`evidence-retrieval.bpmn`](evidence-retrieval.bpmn) | a Process: Evidence for a recommendation | "Editing and HCI validation" |
| [`feature-staging.bpmn`](feature-staging.bpmn) | a Process: Staging a feature branch preview, and taking it down |  |
| [`getting-started.bpmn`](getting-started.bpmn) | a Process: Getting started |  |
| [`graph-detanglement.bpmn`](graph-detanglement.bpmn) | a Process: A sub-graph wants to leave |  |
| [`human-translation-workflow.bpmn`](human-translation-workflow.bpmn) | a Process: Human Translation Workflow |  |
| [`ig-incremental-build.bpmn`](ig-incremental-build.bpmn) | a Process: Incremental IG build |  |
| [`ingest-build-l1-kg.bpmn`](ingest-build-l1-kg.bpmn) | a Process: Ingestion subprocess — build the L1 knowledge graph | "Document ingestion — uploads/ to the L1 source knowledge graph" |
| [`ingest-derive-content.bpmn`](ingest-derive-content.bpmn) | a Process: Ingestion subprocess — derive content from the assets | "Document ingestion — uploads/ to the L1 source knowledge graph" |
| [`ingest-extract-structure.bpmn`](ingest-extract-structure.bpmn) | a Process: Ingestion subprocess — extract structure | "Document ingestion — uploads/ to the L1 source knowledge graph" |
| [`ingest-l1-completeness-gate.bpmn`](ingest-l1-completeness-gate.bpmn) | a Process: Ingestion subprocess — the L1 completeness gate | "Document ingestion — uploads/ to the L1 source knowledge graph" |
| [`ingest-theme.bpmn`](ingest-theme.bpmn) | a Process: Ingestion subprocess — ingest a theme | "Document ingestion — uploads/ to the L1 source knowledge graph" |
| [`jsonld-drift-check.bpmn`](jsonld-drift-check.bpmn) | a Process: Are the .jsonld siblings still in sync with their .ts manifests? |  |
| [`kg-to-portal.bpmn`](kg-to-portal.bpmn) | a Process: KG to public portal |  |
| [`l2-dak-authoring.bpmn`](l2-dak-authoring.bpmn) | a Process: L2 DAK authoring |  |
| [`l3-fhir-pipeline.bpmn`](l3-fhir-pipeline.bpmn) | a Process: L3 FHIR IG pipeline |  |
| [`materialize-remote.bpmn`](materialize-remote.bpmn) | a Process: Materialize remote content — the shared subprocess | "Sample import into a structured data store" |
| [`methodology-from-source.bpmn`](methodology-from-source.bpmn) | a Process: Adopt a methodology from a source document |  |
| [`narrative-code-review.bpmn`](narrative-code-review.bpmn) | a Process: Prose and the code it describes | "Review task" |
| [`ns.jsonld`](ns.jsonld) | data |  |
| [`options-analysis.bpmn`](options-analysis.bpmn) | a Process: Options analysis | "Content Change and Review", "CRDM Phase 6 — implement, MVP, acceptance", "Editing and HCI validation", "Adopting an upstream version bump", "Wireframe design review" |
| [`pr-checks-present.bpmn`](pr-checks-present.bpmn) | a Process: Which open pull requests have no CI run on their head? |  |
| [`publish-alert.bpmn`](publish-alert.bpmn) | a Process: Alert the publication manager | "Publishing the docs site, and keeping the previews alive" |
| [`publish-verification.bpmn`](publish-verification.bpmn) | a Process: Verify the export before it is deployed | "Publishing the docs site, and keeping the previews alive" |
| [`qa-report-signing.bpmn`](qa-report-signing.bpmn) | a Process: QA report signing |  |
| [`refresh-materialized.bpmn`](refresh-materialized.bpmn) | a Process: Refresh materialized remote content | "Sample import into a structured data store" |
| [`related-work.bpmn`](related-work.bpmn) | a Process: Related work: find, sort, summarize, ask to coordinate | "CRDM — link the work to an issue", "Adopt a methodology from a source document" |
| [`repository-health-watch.bpmn`](repository-health-watch.bpmn) | a Process: Is the repository itself healthy? |  |
| [`review-code.bpmn`](review-code.bpmn) | a Process: Code node review | "Review task" |
| [`review-narrative.bpmn`](review-narrative.bpmn) | a Process: Narrative review | "Review task" |
| [`review-task.bpmn`](review-task.bpmn) | a Process: Review task | "Content Change and Review", "CRDM Phase 6 — implement, MVP, acceptance" |
| [`sample-import.bpmn`](sample-import.bpmn) | a Process: Sample import into a structured data store |  |
| [`session-state-machine.bpmn`](session-state-machine.bpmn) | a Process: Session state machine |  |
| [`staging-render-log.bpmn`](staging-render-log.bpmn) | a Process: Render log — the publish branch keeps its own history |  |
| [`swot-analysis.bpmn`](swot-analysis.bpmn) | a Process: SWOT situation analysis |  |
| [`theme-ui-review.bpmn`](theme-ui-review.bpmn) | a Process: Theme and UI review — at ingestion | "Ingestion subprocess — ingest a theme" |
| [`translation-workflow.bpmn`](translation-workflow.bpmn) | a Process: translation-workflow.bpmn |  |
| [`upstream-pin-watch.bpmn`](upstream-pin-watch.bpmn) | a Process: Watching a pinned upstream dependency |  |
| [`upstream-version-adoption.bpmn`](upstream-version-adoption.bpmn) | a Process: Adopting an upstream version bump | "Watching a pinned upstream dependency" |
| [`voice-review.bpmn`](voice-review.bpmn) | a Process: Voice overlay review | "Narrative review" |
| [`wireframe-design-review.bpmn`](wireframe-design-review.bpmn) | a Process: Wireframe design review |  |
| [`decisions/`](decisions/) | 9 files | |
<!-- kg:subgraph:end -->
