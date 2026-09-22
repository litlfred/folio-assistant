import { webpage } from "../../../schemas/webpage.ts";

export default webpage({
  slug: "beans-and-todos",
  title: "Beans and todos",
  navOrder: 6,
  nodes: [
    { id: "overview", block: "overview" },
    {
      id: "two-things-one-word",
      title: "Two things that share a word",
      block: "two-things-one-word",
    },
    {
      id: "the-agent-bean-lifecycle",
      title: "The agent bean lifecycle",
      asset: {
        kind: "bpmn",
        source: "processes/bean-lifecycle.bpmn",
        rendered: "assets/img/workflows/bean-lifecycle.svg",
        alt:
          "BPMN swimlane diagram with two lanes. In the agent's lane: durable work is identified, the agent runs an exact-title search before creating anything, then a gateway asks whether the bean already exists. If not, it creates one; if it does, a second gateway asks whose it is. A bean owned by someone else routes to the lower lane — sibling session or human — where the only action is to leave it alone and coordinate, ending there. The agent's own or an unclaimed bean is claimed as in-progress, worked on with the body kept current, and then reaches an outcome gateway with three branches: done goes to complete, not wanted goes to scrap with reasons and never delete, and blocked goes to recording the blocker and handing it back. All three converge on a single end event, state recorded.",
        sourceLinks: [
          { text: "Open the BPMN source", href: "https://github.com/litlfred/folio-assistant/blob/main/processes/bean-lifecycle.bpmn" },
        ],
        linkStyle: "button",
      },
      block: "the-agent-bean-lifecycle",
    },
    {
      id: "never-delete",
      title: "A bean is never deleted",
      block: "never-delete",
    },
    {
      id: "two-layers",
      title: "Engine operations are not CLI calls",
      block: "two-layers",
    },
    {
      id: "human-todos",
      title: "Human todos — not built yet",
      block: "human-todos",
    },
    {
      id: "work-plan-state",
      title: "What the work plan holds right now",
      block: "work-plan-state",
    },
  ],
});
