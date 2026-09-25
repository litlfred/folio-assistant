import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "content-types",
  title: "Content types",
  documents: ["folio"],
  navOrder: 4,
  nodes: [
    {
      id: "overview",
      block: "overview",
    },
    {
      id: "the-content-lifecycle",
      title: "The content lifecycle",
      asset: {
        kind: "bpmn",
        source: "processes/content-lifecycle.bpmn",
        rendered: "assets/img/workflows/content-lifecycle.svg",
        alt: "BPMN swimlane diagram of one folio cycle: the programme manager plans, the plan is seeded as beans, editing and HCI validation runs per proposed change, an integration test and QA sweep follows, then draft-review-publish; feedback is triaged and filed as beans, and the cycle either repeats or the folio is retired.",
        sourceLinks: [
          { text: "BPMN 2.0 source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/content-lifecycle.bpmn" },
          { text: "full-size SVG", href: "assets/img/workflows/content-lifecycle.svg" },
        ],
        linkStyle: "caption",
      },
      lead: "the-content-lifecycle-lead",
      block: "the-content-lifecycle",
    },
    {
      id: "documents-policy-guidance",
      title: "Documents & policy guidance",
      asset: {
        kind: "bpmn",
        source: "processes/authoring-a-document.bpmn",
        rendered: "assets/img/workflows/authoring-a-document.svg",
        alt: "BPMN swimlane diagram of document authoring: the author plans, the plan is seeded as beans, an agent scaffolds the folio and authors blocks, the build pipeline checks the declared profile before validating and rendering to Markdown, HTML and PDF, and a reviewer gates publication.",
        sourceLinks: [
          { text: "BPMN 2.0 source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/authoring-a-document.bpmn" },
          { text: "full-size SVG", href: "assets/img/workflows/authoring-a-document.svg" },
        ],
        linkStyle: "caption",
      },
      lead: "documents-policy-guidance-lead",
    },
    {
      id: "carrying-a-normative-statement",
      title: "Carrying a normative statement",
      level: 3,
      block: "carrying-a-normative-statement",
    },
    {
      id: "scientific-papers-books",
      title: "Scientific papers & books",
      block: "scientific-papers-books",
    },
    {
      id: "who-smart-guidelines-daks-l2",
      title: "WHO SMART Guidelines DAKs (L2)",
      asset: {
        kind: "bpmn",
        source: "processes/l2-dak-authoring.bpmn",
        rendered: "assets/img/workflows/l2-dak-authoring.svg",
        alt: "BPMN swimlane diagram of L2 DAK authoring: a parallel gateway fans out personas, BPMN processes, DMN decision logic, the data dictionary and indicators across the business-analyst lane alongside the terminologist's bindings, then clinical SME validation gates assembly of the DAK.",
        sourceLinks: [
          { text: "BPMN 2.0 source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/l2-dak-authoring.bpmn" },
          { text: "full-size SVG", href: "assets/img/workflows/l2-dak-authoring.svg" },
        ],
        linkStyle: "caption",
      },
      lead: "who-smart-guidelines-daks-l2-lead",
      block: "who-smart-guidelines-daks-l2",
    },
    {
      id: "who-smart-implementation-guides-l3",
      title: "WHO SMART Implementation Guides (L3)",
      asset: {
        kind: "bpmn",
        source: "processes/l3-fhir-pipeline.bpmn",
        rendered: "assets/img/workflows/l3-fhir-pipeline.svg",
        alt: "BPMN swimlane diagram of the L3 pipeline: map L2 to L3, author FSH, SUSHI compile, validate against profiles with a loop back to FSH on failure, QC gates that file findings as beans, IG Publisher build, and publication of the IG site.",
        sourceLinks: [
          { text: "BPMN 2.0 source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/l3-fhir-pipeline.bpmn" },
          { text: "full-size SVG", href: "assets/img/workflows/l3-fhir-pipeline.svg" },
        ],
        linkStyle: "caption",
      },
      lead: "who-smart-implementation-guides-l3-lead",
      block: "who-smart-implementation-guides-l3",
    },
    {
      id: "others-extending-folio-assistant",
      title: "Others — extending folio-assistant",
      block: "others-extending-folio-assistant",
    },
  ],
});
