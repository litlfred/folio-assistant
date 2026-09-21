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
| `content` | 10 |
| `state` | 12 |
| `context` | 5 |
| `derived` | 1 |

Twenty-eight kinds in total, of which exactly **one** — `docs` — is
`renderable`. Renderability is what wires a graph to the site build, so the
number being one is not an oversight: every other graph reaches a reader
through a visualiser the Harness layer builds *over* it, never by being
published directly.

**One kind is doing the work of four subgraphs.** `cat-harness` is declared by
**22** directories across the checkout, and those directories hold Skills
(`skills/`), Workflows (`skills/workflows/`), Scenarios (`skills/roles/`) and
methodologies (`methodologies/crdm/`, `methodologies/raci/`) — four branches of
the taxonomy above, indistinguishable to any consumer that filters on kind. A
query for "the Workflows" cannot be written today; it can only be approximated
by a path.

That is the single largest gap between this page and the registry, and it is
reported rather than fixed here because splitting a kind changes what every
declaration in every dependent instance says.

**Two smaller ones**, both already named above:

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
