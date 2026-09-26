import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "guides/writing-a-paper",
  title: "Writing a paper with folio-assistant",
  heading: "Tutorial — writing a paper with folio-assistant",
  parent: "Authoring guides",
  navOrder: 1,
  nodes: [
    {
      id: "overview",
      block: "overview",
    },
    {
      id: "the-end-to-end-workflow",
      title: "The end-to-end workflow",
      asset: {
        kind: "bpmn",
        source: "processes/authoring-a-paper.bpmn",
        rendered: "../assets/img/workflows/authoring-a-paper.svg",
        alt: "BPMN swimlane diagram: the author plans, the plan is seeded as beans, the authoring agent scaffolds the repo and drafts blocks, Lean formalisation loops until the build is green with no sorries, the build pipeline validates and renders, a reviewer either sends it back to authoring or approves it for publication.",
        sourceLinks: [
          { text: "BPMN 2.0 source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/authoring-a-paper.bpmn" },
          { text: "full-size SVG", href: "../assets/img/workflows/authoring-a-paper.svg" },
        ],
        linkStyle: "caption",
      },
      block: "the-end-to-end-workflow",
    },
    {
      id: "before-you-start",
      title: "Before you start",
      block: "before-you-start",
    },
    {
      id: "step-1-plan-the-paper",
      title: "Step 1 — Plan the paper",
      block: "step-1-plan-the-paper",
    },
    {
      id: "step-2-scaffold-the-repository",
      title: "Step 2 — Scaffold the repository",
      block: "step-2-scaffold-the-repository",
    },
    {
      id: "required-gitignore-baseline",
      title: "Required `.gitignore` baseline",
      level: 3,
      block: "required-gitignore-baseline",
    },
    {
      id: "step-3-author-the-content",
      title: "Step 3 — Author the content",
      block: "step-3-author-the-content",
    },
    {
      id: "step-4-formalize-in-lean",
      title: "Step 4 — Formalize in Lean",
      block: "step-4-formalize-in-lean",
    },
    {
      id: "step-5-validate",
      title: "Step 5 — Validate",
      block: "step-5-validate",
    },
    {
      id: "step-6-render",
      title: "Step 6 — Render",
      block: "step-6-render",
    },
    {
      id: "step-7-review-feedback",
      title: "Step 7 — Review & feedback",
      block: "step-7-review-feedback",
    },
    {
      id: "step-8-publish",
      title: "Step 8 — Publish",
      block: "step-8-publish",
    },
    {
      id: "what-you-end-up-with",
      title: "What you end up with",
      block: "what-you-end-up-with",
    },
    {
      id: "where-to-go-deeper",
      title: "Where to go deeper",
      block: "where-to-go-deeper",
    },
  ],
});
