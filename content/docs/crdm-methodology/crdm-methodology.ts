import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "crdm-methodology",
  title: "CRDM methodology",
  navOrder: 5,
  nodes: [
    {
      id: "overview",
      block: "overview",
    },
    {
      id: "what-is-crdm",
      title: "What is CRDM?",
      block: "what-is-crdm",
    },
    {
      id: "why-crdm-for-folio-assistant",
      title: "Why CRDM for folio-assistant",
      block: "why-crdm-for-folio-assistant",
    },
    {
      id: "when-crdm-activates",
      title: "When the CRDM workflow activates",
      block: "when-crdm-activates",
    },
    {
      id: "the-process",
      title: "The process",
      asset: {
        kind: "bpmn",
        source: "docs/workflows/crdm-requirements.bpmn",
        rendered: "assets/img/workflows/crdm-requirements.svg",
        alt: "BPMN swimlane diagram: three lanes — Requestor/stakeholder, Agent, and Platform. The requestor submits a request; the agent detects whether it is a feature, scans for matching issues, identifies stakeholders, synthesises needs (Phase 1), maps the current workflow (Phase 2), defines requirements and impact analysis (Phases 3–4), creates beans after sign-off (Phase 5), implements on feature branches with PR review loops (Phase 6), posts summaries to the issue, and closes on feature sign-off.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "workflows/crdm-requirements.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "the-process",
    },
    {
      id: "phase-1-needs-assessment",
      title: "Phase 1 — Needs assessment",
      block: "phase-1-needs-assessment",
    },
    {
      id: "phase-2-business-process-analysis",
      title: "Phase 2 — Business process analysis",
      block: "phase-2-business-process-analysis",
    },
    {
      id: "phase-3-requirements-definition",
      title: "Phase 3 — Requirements definition",
      block: "phase-3-requirements-definition",
    },
    {
      id: "phase-4-impact-analysis",
      title: "Phase 4 — Impact analysis and migration planning",
      block: "phase-4-impact-analysis",
    },
    {
      id: "phase-5-sign-off-and-beans",
      title: "Phase 5 — Sign-off and bean creation",
      block: "phase-5-sign-off-and-beans",
    },
    {
      id: "phase-6-iterative-development",
      title: "Phase 6 — Iterative development and review",
      block: "phase-6-iterative-development",
    },
    {
      id: "agent-skills-and-tooling",
      title: "Agent skills and tooling",
      block: "agent-skills-and-tooling",
    },
    {
      id: "what-is-not-built-yet",
      title: "What is not built yet",
      block: "what-is-not-built-yet",
    },
  ],
});
