### Schema

Every managed node has a definition — Zod authoritative, JSON Schema and JSON-LD
generated from it — saying what shape it takes and what its fields mean. The
Schema subgraph holds those definitions.

It arrives **empty except for what is self-describing**. A bare harness knows
how to describe a declaration, a directory and a kind; everything else is
contributed by the layer that introduces it. A harness that adds a content kind
adds its Schema in the same change, or the kind is unvalidated and its documents
are told apart by shape — which is the failure
[`directory-conventions`](reference/skill-instructions/directory-conventions.html)
names when it says **the files declare what they are**.

*Used for*: validation at read time, the generated schema reference, and the
`@context` a published KGraph is parsed against.

### Content

Instances of knowledge assets — the authored material a Schema describes and a
Skill governs. Catalogues, documentation pages, themes, boards, translation
sources, artefact indexes. Four subgraphs below are kinds of Content, listed
separately because they are referenced differently, not because they are
something else.

*Used for*: everything a reader or a renderer consumes.

#### Scenarios

Actors, the Roles they can take, and the User Stories those Roles are there to
serve.

An **Actor** is a concrete participant — person, agentic or mechanical — and
persists across Workflows. A **Role** is the swimlane: a persona an Actor takes
on *because of the lane it is acting in*, carrying the Skills that lane needs.
Nothing *is* a reviewer; somebody **acts as** reviewer for the duration of a
lane, and the same Actor is a different Role in the next diagram.

*Used for*: binding a lane to what its occupant is expected to know, and
auditing whether a Role's Skills actually cover its lanes.

#### Workflows

Business process as BPMN, with DMN for the decisions. **Prefer *Workflow* over
*process*** throughout: they were used interchangeably, and the inconsistency
cost more than the synonym bought.

The diagrams are executable rather than illustrative. A lane binds a Role, an
activity names the Skill to run, and a gateway MAY compute its branch from a
DMN table. Instance state is committed, so a sibling session reads the same
position rather than inferring one.

*Used for*: running the work, and being the single answer to "where are we".

#### Skills

The instruction body an Actor needs to perform a Task. A Skill states a
capability **generically**: it is portable across forges, binaries and machines
by construction.

#### Tools

The concrete mechanisms. A Tool names the Skills it satisfies through its
`satisfies` field, and one Skill MAY be satisfied by several Tools — which is
what lets the same capability be tested along the spectrum from fully
deterministic to agentic.

*Used for*: keeping the mechanism out of the instruction. A Skill that names a
vendor, a CLI or an endpoint has swallowed a Tool, and the swallowing is what
makes a layer un-portable.

#### Context

README files, memories, methodologies, recorded confirmations: what changes the
conditions a Workflow executes **in**, without changing during execution.
Applying a set of it deliberately — a **Context Overlay** — is what lets the
same Workflow be run twice and the difference attributed to the context rather
than to chance.

*Used for*: repeatable testing across conditions. Covered in full by
[Managing agent context](managing-agent-context.html).

### Harness

The layer that renders the rest: the JSON-LD export, the visualisers, and the
documentation. Its obligation is stated as three separate requirements because
they fail differently — nothing draws it, nothing says what it is for, nothing
an agent can invoke against it.

*Used for*: making a declared directory something a person can actually look
at. A directory nobody can see is one nobody checks.

### Dynamic state

Beans, todos, Workflow instances, QA sidecars, health results: what is being
worked on and how far it got. Written by processes as they run, committed so it
survives a fresh container.

*Used for*: the work plan, and the evidence that a claim about the corpus was
measured rather than remembered.
