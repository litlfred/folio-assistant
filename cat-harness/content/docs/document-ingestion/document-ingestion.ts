import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "document-ingestion",
  title: "Document ingestion",
  navOrder: 7,
  nodes: [
    {
      id: "overview",
      block: "overview",
    },
    {
      id: "uploads-and-library-are-two-stages-of-one-pipeline",
      title: "`uploads/` and `library/` are two stages of one pipeline",
      block: "uploads-and-library-are-two-stages-of-one-pipeline",
    },
    {
      id: "library-is-l1",
      title: "`library/` is L1",
      block: "library-is-l1",
    },
    {
      id: "the-pipeline",
      title: "The pipeline",
      asset: {
        kind: "bpmn",
        source: "processes/document-ingestion.bpmn",
        rendered: "assets/img/workflows/document-ingestion.svg",
        alt: "BPMN swimlane diagram: a contributor drops a file in uploads; the Ingestion Engine detects its media type and mints a doc id, then calls four subprocesses in turn — extract structure, derive content, build the L1 knowledge graph, and the L1 completeness gate; an incomplete result opens a bean on the shared work plan and returns to the derive step, while a complete one is moved into library under its bibliography slug and becomes citeable as an L1 source.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/document-ingestion.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "the-pipeline",
    },
    {
      id: "extract-structure",
      title: "Extract structure",
      level: 3,
      asset: {
        kind: "bpmn",
        source: "processes/ingest-extract-structure.bpmn",
        rendered: "assets/img/workflows/ingest-extract-structure.svg",
        alt: "BPMN diagram: from a binary, an exclusive gateway asks whether there is an embedded text layer; if yes the text layer is extracted, if no the document is OCR'd to per-page text files; both paths split the result into section markdown files carrying a document brief, then write structure.json and extract claim candidates.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/ingest-extract-structure.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "extract-structure",
    },
    {
      id: "derive-content",
      title: "Derive content",
      level: 3,
      asset: {
        kind: "bpmn",
        source: "processes/ingest-derive-content.bpmn",
        rendered: "assets/img/workflows/ingest-derive-content.svg",
        alt: "BPMN diagram: a parallel gateway fans out per asset kind — archive contents manifest, technical file metadata, localized image descriptions, audio transcription and translation, and tabular metadata — then joins, and every generated narrative is stamped with the human or agent that authored it.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/ingest-derive-content.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "derive-content",
    },
    {
      id: "ingest-the-theme",
      title: "Ingest the theme",
      level: 3,
      asset: {
        kind: "bpmn",
        source: "processes/ingest-theme.bpmn",
        rendered: "assets/img/workflows/ingest-theme.svg",
        alt: "BPMN diagram: from a theme source in hand, an exclusive gateway asks whether the theme is served by a deployment or stated by a style guide; the served stylesheet's declarations or the guide's own rules are read, values are mapped onto the shared palette roles, contradictions in the source are recorded, and a gateway asks whether every layout is present — if not the subprocess ends refused as incomplete, if so a theme and UI review produces the Theme node.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/ingest-theme.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "ingest-the-theme",
    },
    {
      id: "build-the-l1-knowledge-graph",
      title: "Build the L1 knowledge graph",
      level: 3,
      asset: {
        kind: "bpmn",
        source: "processes/ingest-build-l1-kg.bpmn",
        rendered: "assets/img/workflows/ingest-build-l1-kg.svg",
        alt: "BPMN diagram: the engine writes a Dublin Core record, then a manifest referencing it, then the assets array with local paths or remote URLs, then binds the folder name to the bibliography slug; the corpus lane links the resulting L1 nodes into the knowledge graph.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/ingest-build-l1-kg.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "build-the-l1-knowledge-graph",
    },
    {
      id: "the-l1-completeness-gate",
      title: "The L1 completeness gate",
      level: 3,
      asset: {
        kind: "bpmn",
        source: "processes/ingest-l1-completeness-gate.bpmn",
        rendered: "assets/img/workflows/ingest-l1-completeness-gate.svg",
        alt: "BPMN swimlane diagram: the engine checks that every derived artefact is present, runs round-trip translation QA, and an exclusive gateway routes drift or bad terminology to a reviewer for adjudication before the L1 completeness verdict is recorded.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/ingest-l1-completeness-gate.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "the-l1-completeness-gate",
    },
    {
      id: "what-is-not-built-yet",
      title: "What is not built yet",
      block: "what-is-not-built-yet",
    },
    {
      id: "how-much-of-this-does-dublin-core-carry",
      title: "How much of this does Dublin Core carry?",
      block: "how-much-of-this-does-dublin-core-carry",
    },
    {
      id: "editing-an-ingested-source",
      title: "Editing an ingested source",
      block: "editing-an-ingested-source",
    },
  ],
});
