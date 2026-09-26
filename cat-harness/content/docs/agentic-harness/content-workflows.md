When a request is classified as content work (authoring, review, ingestion),
the agent follows the corresponding BPMN workflow. The existing documentation
pages describe these in detail:

- **[Publication workflow](https://litlfred.github.io/folio-assistant/publication-workflow.html)** —
  the content lifecycle from draft through validation, rendering, and
  publication. Covers roles (author, reviewer, editor), the base processes,
  activities and skills.

- **[Document ingestion](https://litlfred.github.io/folio-assistant/document-ingestion.html)** —
  how a dropped file becomes an L1 source: extract structure, derive content,
  build the L1 knowledge graph, completeness gate.

- **Writing guides:**
  - [Writing a paper](https://litlfred.github.io/folio-assistant/guides-writing-a-paper.html)
  - [Writing a document](https://litlfred.github.io/folio-assistant/guides-writing-a-document.html)
  - [WHO SMART DAK](https://litlfred.github.io/folio-assistant/guides-who-smart-dak.html)
  - [WHO SMART IG](https://litlfred.github.io/folio-assistant/guides-who-smart-ig.html)

The harness does not redefine these workflows. It provides the **entry point** —
classifying the request and routing to the right one — and the **exit point** —
returning to idle state when the workflow completes, or suspending if the user
switches context.
