A Harness does not only *hold* directories. It **harnesses** them — and a
datastore such as a git repository is harnessed the same way, **through
Tools**: the Harness names the Skills that reach the store, and a Tool supplies
the mechanism. That indirection is what lets the same Harness be driven against
a different store without rewriting a Skill.

Where a Harness harnesses a directory, it takes on two obligations:

1. It **MUST** ensure a `<dir>.json` or `<dir>.jsonld` is rendered, containing
   or describing the content.
2. It **MUST** provide a visualisation of that content.

> **Neither is enforced by a gate today.** What `check:subgraph-coverage`
> checks is a *different and overlapping* set: a declared directory's
> `coverage` may name a `visualiser`, a `docs` entry and a governing `skill`.
> So obligation 2 has a carrier and a checker; obligation 1 has neither. Read
> the two as one and you will conclude the rendering requirement is covered
> because the coverage check is green.

**Both fail differently, which is why they are two requirements rather than
one.** Without the rendered JSON-LD there is nothing for a machine to consume:
the directory is in the graph by declaration and absent from it in practice.
Without the visualisation there is nothing for a person to look at — and a
directory nobody can see is one nobody checks. Measured on this instance,
2026-09-20: **19 declared subgraphs had no way to look at them**, and the two
most depended on were among them.

A Harness **SHOULD** also carry a `docs/` directory documenting itself, and
every Harness **SHOULD** have one. `cat-harness` renders its own through the
plain documentation path — no extensions, no JavaScript where it can be
avoided — which is the reason it is the one layer that owns a renderable kind
at all: **a layer owns the kinds it can render.**

The `cat-bootstrap` exemption is the rule in its true form rather than a hole
in it. It cannot render, so it does not own the renderable kind; what it owes
instead is its own `.json` and `.jsonld` — obligation 1 without obligation 2,
declared in `renderExemption` rather than assumed.
