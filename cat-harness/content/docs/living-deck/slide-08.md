The harness's own schemas, drawn from the JSON Schemas they are generated from,
in four packages. **test** holds the KG QA report and the test run. **process**
holds the task and the OMG BPMN 2.0 process. **scenario** holds actor, role,
user story, voice and skill. **schema** holds JSON Schema and external schema. An actor
takes on roles, a role carries skills, a task sits in a lane of a role and uses
a skill, a test run tests a skill, and a QA report audits any kind of subject.

![Harness schemas — UML class diagram generated from the JSON Schemas: packages test, process, scenario and schema, with the classes and relations described in the text above.](assets/img/uml/harness-schemas.svg)

**Source:** `bun run uml:overview` regenerates the picture above from the schemas.

> **Misaligned — the snapshot is older:** today's diagram has a **Voice
> Profile** class that slide 8 does not. The picture above is the current one.
> The owner's copy now shows it too: slide 8 carries a fresh render, cropped
> to the same four packages.
