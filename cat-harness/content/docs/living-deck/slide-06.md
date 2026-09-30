An **agent** uses **skills** to execute one or more **tasks** in a **process**.
It works with a knowledge graph of static context (skills, user stories) and
dynamic context. A skill may have zero or more **tools**, used for **test**
execution anywhere on the deterministic-to-agentic spectrum.

- **Role:** played by a human, agentic or mechanical actor; a swimlane in BPMN.
- **Task:** a step in a process; a node in BPMN.
- **Skill:** a gated capability with schema-defined inputs and outputs.
- **Test:** used to compare models, or for author review.
- **Agentic state:** *beans*, which agents use to coordinate and track their
  state within a process ("changes to the vaccination schedule ready for review in
  staging").
- **Human state:** *todos*, attached to process steps or knowledge assets
  ("please review this change in medication").

![Folio lifecycle — one cycle, plan to retire. A BPMN collaboration of six lanes: programme manager, work plan (beans shared by humans and agents), editors and authoring agents, validation and QA, review team and SMEs, publication manager. Tasks in order: plan scope, team and artefacts; seed the work plan; editing and HCI validation; integration test and QA sweep; draft, review and publish; triage published feedback; file feedback as beans; then a gateway, more content, which loops back to editing or ends in retire or archive.](assets/img/workflows/content-lifecycle.svg)

**Sources:** `processes/content-lifecycle.bpmn` (the picture above is generated
from it); [beans and todos](beans-and-todos.html).

> **Aligned:** the snapshot's diagram and today's process have the same six
> lanes and the same eight tasks.
