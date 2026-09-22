Every **process** in the docs is BPMN. The diagrams that remain Mermaid are not
processes, and BPMN would be the wrong notation for them — a pool with lanes
implies actors performing activities over time, which none of these have:

| Diagram | Notation | Why |
|---------|----------|-----|
| `README.md`, [home](index.html) — "What it does" | Mermaid | Component / data-flow map of the platform, not a sequence of activities |
| [Architecture](architecture.html) — server and adapters | Mermaid | Deployment and module structure |
| [Skills & roles](skills.html) — how the five concepts compose | Mermaid | Conceptual composition, no time axis |
| [Skills & roles](skills.html) — `viewer → reviewer → author → admin` | Mermaid | An inheritance lattice, not a flow |
| [Home](index.html) — documentation map | Mermaid | Navigation graph |
| [Adding a content type](guides/new-content-type.html) — "What you provide" | Mermaid | What you hand over, not what you do |
| [Writing a paper](guides/writing-a-paper.html) — the Lean session | Mermaid `sequenceDiagram` | An interaction transcript between you, the assistant and the MCP server. BPMN's equivalent — a collaboration with message flows — would add ceremony without adding meaning |

If you add a diagram that *does* have actors, activities and a control flow,
it belongs in `processes/` as BPMN, not in a Mermaid fence.

---
