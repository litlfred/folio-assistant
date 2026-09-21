A reference has a direction, and the direction is what makes the graph
answerable. Every edge below is carried by a named field in a schema, so it can
be followed mechanically rather than inferred:

| from | field | to |
|---|---|---|
| Actor | `roles` | Role |
| Role | `skills` | Skill |
| Role | `lanes` | a BPMN lane, by name |
| Role | `voice` | Voice |
| Workflow activity | `<folio:skill ref>` | Skill |
| Workflow lane | lane binding | Role |
| Workflow activity | `<folio:bean op>` | a work-plan operation |
| Tool | `satisfies` | Skill |
| Test | exercises | Skill |
| any content node | `$schema` | Schema |
| Folio | the board layer | Board, then Position, then Note |

Three properties of that table are worth stating, because each one is a
decision that could have gone the other way.

**Skill is a sink.** Roles point at Skills, Workflow activities point at Skills,
Tools point at Skills, Tests point at Skills — and a Skill points at none of
them. It names a Capability and does not know who holds it, what runs it, or
what measures it. That is what lets one Skill serve several Roles, be satisfied
by several Tools and be exercised by several Tests without editing the Skill.

It is also why the chain reads **Test → Skill → Task** rather than Test → Tool.
A Test that names a Tool directly has jumped the sink and is measuring a
mechanism instead of a Capability — which is exactly the comparison the several
Tools per Skill allowance exists to make possible.

**The Harness points at everything and nothing points back.** A board is a
diagram *of* a folio in the OMG sense that a `BPMNDiagram` is a diagram of a
`bpmn:process`: the folio carries what is true, the layout layer carries where
it was drawn, and the arrow runs folio → board → position → note and never
back. A folio is complete with no board. The same asymmetry holds for every
visualiser: removing the rendering layer loses the picture and no content.

**Workflows reference Context and never write it.** The `holds` field makes
that enforceable rather than conventional — a step writing into a `context`
graph is a defect, not an update. This is the edge that makes a Context Overlay
possible at all: if a run could mutate its own conditions, replaying it under
the same conditions would not be a thing you could ask for.

The one edge that does **not** work this way today is **User Story**. CRDM
produces Workflows, User Stories and Roles, and Scenarios is where the User
Stories belong — but a Role's `useCases` is an array of free-text strings, not
references to nodes. So a User Story cannot be pointed at, counted, or traced
to the Workflow it justifies. It is described here as the taxonomy intends and
flagged in the next section as not yet declared, because a page that showed it
as an edge would be describing a graph the registry cannot produce.
