**An actor performs a task in a process as a role, using that role's skills.**

| | | |
|---|---|---|
| **Actor** | *who* | a concrete participant, human, agentic or mechanical; carries permissions across all lanes |
| **Task** | *does what* | an activity in a diagram; names the skill to run and the bean operation to perform |
| **Process** | *where* | an executable BPMN diagram with DMN gateways; its state is committed so sibling sessions agree |
| **Role** | *as whom* | a swimlane; an actor acts as a reviewer only for the length of a lane |
| **Skill** | *knowing how* | the instruction body for the task; lives in the knowledge graph and is inherited across instances |

**Sources:** [platform](../platform.html); the `role-model` skill.

> **Aligned:** the Actor schema spells the three kinds `person`, `agent` and
> `system` (human, agentic and mechanical), and adds a fourth, `external`: a
> participant outside this instance, which is never given a task. The
> `role-model` skill and the schema's own documentation state the same
> mapping. An earlier version of this note called the four values a
> contradiction. That read the enum without its documentation.
