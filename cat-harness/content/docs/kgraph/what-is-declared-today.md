The taxonomy above is what the KGraph is *for*. What the registry can actually
produce is narrower, and the gap is worth stating plainly: a reader who takes
the taxonomy for an inventory will go looking for directories that are not
there.

Measured on this instance, 2026-09-21, by reading the registry and every
instance declaration rather than by counting prose. **Re-derive rather than
quote**: `bun run kg:export` dumps the graph, and `instanceRootsIn` plus
`readDeclaration` give the directory census directly.

| layer (`holds`) | registered kinds |
|---|---|
| `content` | 13 |
| `state` | 12 |
| `context` | 5 |
| `derived` | 1 |

Thirty-one kinds in total, of which exactly **one** — `docs` — is
`renderable`. Renderability is what wires a graph to the site build, so the
number being one is not an oversight: every other graph reaches a reader
through a visualiser the Harness layer builds *over* it, never by being
published directly.

**Three of those kinds were one until 2026-09-21.** `cat-harness` was declared
by 22 directories that between them held Skills, Workflows, Scenarios and
methodologies — four branches of the taxonomy above, indistinguishable to any
consumer filtering on kind. *"Give me the Workflows"* was not a query anybody
could write; it could only be approximated by matching a path, which is the
fragility the graph exists to remove. `skills`, `workflows` and `scenarios` are
now their own kinds and the query works.

**`cat-harness` survives and is not deprecated**, which surprises people twice
over. An alias cannot express a split — `GRAPH_KIND_ALIASES` maps one name to
one name, and this would have to become three. And the kind had a fifth job the
split does not name: on an entry declaring `["schemas", "cat-harness"]` it means
*a schema IS a knowledge-graph node*, which is why the skill scanner tests for
the kind **exactly** rather than for its presence. That job is still real, so
the umbrella stays, now meaning harness knowledge-graph content whose directory
holds more than one part of it — the eight mixed schema entries. A downstream
declaration still saying `["cat-harness"]` keeps parsing and keeps being scanned
for Skills; what it loses is the finer query, which it never had.

**What the split cost, and where it nearly went wrong.** Two directories that
had been reached by *convention* stopped being reached the moment their parent
changed kind: `skills/workflows/` and `methodologies/crdm/workflows/` both sat
inside a `cat-harness` directory and were found by walking it. Each now declares
`workflows` in its own right. The second was caught only because the generated
process index reported it as an **orphan** rather than quietly indexing eight
fewer diagrams — which is the whole argument for a generator that names what it
pruned.

**Two gaps remain**, both already named above:

- **User Stories are not nodes.** A Role's `useCases` is an array of strings.
- **`fsh-guts` is registered `context`**, though it is topically Dynamic State.
  Both readings are defensible — it is read by processes and not written by
  them, which is what `context` asserts — but the two axes disagree here, and a
  disagreement nobody has written down is one that gets rediscovered.

**How a dependent contributes into a shared body of knowledge.** Through the
**kind**, and that is the mechanism rather than a stopgap — settled by the
owner, 2026-09-21. Three instances — `agent-skills`, `cat-harness` and
`who-style-guide` — each declare their own `voices/` directory of kind
`voices`, and the overlay resolves all three together. A fourth instance
wanting to contribute a Voice declares a directory, names the kind, and is
done: no nesting, no subgraph declaration, nothing added to the schema.

The alternative considered and set aside was letting a directory entry declare
nested subgraph directories, so that a shared body would live at a path such as
`skills/voices/` and dependents would add under the same path. It buys a
hierarchy that nothing currently needs, at the cost of a schema change, a
migration of every in-tree declaration, and an alias carried for downstream
ones. The overlay already delivers the outcome, and it is already proven by
three instances.
