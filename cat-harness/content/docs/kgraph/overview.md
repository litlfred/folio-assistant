Everything this harness knows about itself is one graph. The Schemas that
describe its content, the Skills an agent reads, the Workflows those Skills are
invoked from, the Roles that own a lane in a Workflow, the Tools that carry out
a Skill concretely, and the running record of what is being worked on — all of
it is authored as nodes, declared by the instance that holds them, and exported
together. That graph is the **KGraph**.

It is not one directory. An instance declares the directories it scans and the
**kind** of graph each holds, in its `<name>.json` root declaration; a
dependent instance inherits those declarations and may add its own. So the
KGraph of a checkout is the union of what every instance in it declares — which
is why "where is the KGraph" has no filesystem answer, and why a consumer asks
for a kind rather than opening a path.

This page says what the subgraphs are, which way the references between them
run, and how each is used. It does not restate the declaration mechanism
itself: that is
[`directory-conventions`](reference/skill-instructions/directory-conventions.html),
and the schema is
[`schemas/cat-harness.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/cat-harness.ts).
