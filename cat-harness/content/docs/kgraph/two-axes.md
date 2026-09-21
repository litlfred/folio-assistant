Two independent questions get asked about every subgraph, and reading either
answer as the other is the mistake this section exists to prevent.

**What is it about?** Schemas, Skills, Workflows, Roles, Tools, Context,
running state. This is the *topical* axis, and it is what the rest of this page
describes.

**What does a running process do with it?** The declaration answers this in the
`holds` field of the kind: a graph is `content` (a process produces it),
`context` (a process reads it and never writes it), `state` (a process writes it
as it runs), or `derived` (something else computes it). A step that writes to a
`context` graph is a defect rather than an update, which is the whole reason the
field is REQUIRED — a kind that has not decided does not compile.

The two axes are orthogonal. Skills and Schemas are both `content` and are
nothing like each other topically; Memory and Methodologies are both `context`
for entirely different reasons. Asking "is this a Skill?" tells you nothing
about whether a Workflow may write to it, and asking "may a Workflow write to
it?" tells you nothing about what it is for.

**A third meaning is already in circulation**, and it is worth pinning before
it spreads. [Subgraph viewers](subgraph-viewers.html) uses *subgraph* for one
declared directory — the thing a visualiser draws and a skill governs. This
page uses it for a branch of the topical taxonomy. One topical subgraph is
usually several declared directories across several instances, so the two
readings are related but do not count the same things. Where the number
matters, this page says *declared directory* or *graph kind* and leaves
*subgraph* for the taxonomy.
