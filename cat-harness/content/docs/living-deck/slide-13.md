**An actor performs a task in a process as a role, using that role's skills.**

| | | |
|---|---|---|
| **Actor** | *who* | a concrete participant, human, agentic or mechanical; carries permissions across all lanes |
| **Task** | *does what* | an activity in a diagram; names the skill to run and the bean operation to perform |
| **Process** | *where* | an executable BPMN diagram with DMN gateways; its state is committed so sibling sessions agree |
| **Role** | *as whom* | a swimlane; an actor acts as a reviewer only for the length of a lane |
| **Skill** | *knowing how* | the instruction body for the task; lives in the knowledge graph and is inherited across instances |

**Sources:** [platform](platform.html); the `role-model` skill.

> **Misaligned — inside the KG:** the slide and the `role-model` skill give
> three actor kinds (human, agentic, mechanical). The Actor schema's `kind` has
> four values (`person | agent | system | external`), and `external` has no
> counterpart in the prose. The slide is not what is wrong here: the schema and
> the skill disagree with each other.
