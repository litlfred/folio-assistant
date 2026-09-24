---
layout: default
title: 'Audit coverage'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/audit-coverage.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/audit-coverage.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/audit-coverage.md){: .fa-edit-source }

{% raw %}
# Audit coverage — measured, with denominators

**A sidecar count is a fine measurement of sidecars and says nothing about
gates.** That sentence is the whole skill. Everything below is what it costs to
learn it and how to keep from relearning it.

Run `bun run audit:coverage` before saying a corpus is unaudited, before writing
a criterion for a kind, and before building any coverage report of your own.

---

## The failure this exists to prevent

2026-09-23. An agent counted `kg-qa` sidecars over the bean store, found **zero**,
and reported beans **"effectively unaudited"** — to the owner, as the premise for
choosing what to build next. **Eight gates audit them**: the five `check:bean-*`,
plus `check:ready-to-close`, `check:stale-paths` and `check:harness-dirs`.

The instrument was not broken. `kg-qa` sidecars measure `kg-audit`'s criteria
exactly, and `KG_SUBJECT_KINDS` has no `bean` — so zero was the right answer to
*"how many criteria reach this kind"* and no answer at all to *"is this kind
audited"*. This is
[`covered-is-not-reachable`](covered-is-not-reachable.md) one level out:
**coverage is a relation between an instrument and the question it was built
for**, and the signal in reach is rarely the signal you need.

**It is not a second answer to `check:kind-validators`.** That asks whether a
kind can be *typed* — does it have a validator that loads. This asks who
*judges* it. The two come apart: a kind can be perfectly typed and audited by
nothing, which is exactly the state that got misread, and a validator sweep
reports it as covered.

---

## The gate half is DECLARED, never inferred

A gate names the kinds it covers in its own module docblock:

```
 * @covers bean-defs, beans
 * @covers none — .github/workflows/ is not a declared graph kind
 * @covers computed — it sweeps whichever kinds declare `nodeSchemas`
```

The tempting alternative is to infer it: grep each gate's source for a kind's
name or its declared directory. **It fails in both directions at once.** A gate
that mentions `beans/defs/` in passing scores as auditing beans; a gate that
resolves its directory through `directoriesForGraph` names no path and scores as
auditing nothing. Both answers wrong, neither *looking* wrong — which is
[`directory-conventions`](directory-conventions.md)' `dh4f`:
could-not-determine rendered as clean.

### Five states, because three real gates cannot use a static list

| state | what it means |
|---|---|
| `declared` | names its kinds |
| `none` | has **decided** it audits no declared graph — `check:workflows` reads `.github/workflows/` |
| `computed` | derives its set at run time — `check:kind-validators` sweeps whatever declares `nodeSchemas`, so a literal would go stale silently |
| `no-script` | `bun test`, `eslint`, `tsc` — nothing here to annotate |
| `undeclared` | **has not said** |

`none` and `undeclared` are different facts and collapsing them would leave a
gate that genuinely audits no graph with silence as its only honest answer.
`computed` exists because writing today's answer as a literal is the snapshot
`BASE_GRAPH_KINDS`' own doc refuses for counts in prose.

**An undeclared gate is counted and printed, never zero**, and every "unaudited"
verdict is stated as an **upper bound** while any remain. That is
`check:kind-validators`' state 2, for its reasons.

**That gap is closed as of bean `3srh`** — all 145 gates declare, so
`audit:coverage:require-all` is wired in CI and the findings are verdicts rather
than bounds. The flag is what keeps it closed: a new gate arriving undeclared
turns them back into an upper bound, silently, unless something fails. The
output still states the caveat whenever the count is non-zero, because the day
it reopens is the day a reader needs to be told.

### When you cannot tell, do not annotate — and then go and read it

Eleven gates were left undeclared on purpose at first, because each one's
docblock did not settle which declared kind its subject is, and **a fabricated
`@covers` credits a kind with coverage nobody checked.** Under-claiming is
recoverable — the count says so out loud. Over-claiming looks like coverage.

Resolving them (bean `3srh`) meant reading each one's **scan set**, and that
changed two answers a title would have got wrong: `check:retired-front-matter`
is `computed`, because its set is `kgRoots(instance)` plus the undeclared
`.claude/skills/` convention; and `check:agents-claims` covers `code`, not
`docs`, because it grades the symbols a prose claim names while `AGENTS.md`
itself is a node of no declared graph.

**The finding did not move** when the eleven were declared — the same four kinds,
now a verdict rather than a bound. That is what closing a denominator is for.

---

## Four states per kind, and a single zero cannot tell them apart

| state | what it means | the case that earns the name |
|---|---|---|
| `no-directory` | no instance declares one of this kind | `bean-defs`, declared inside `beans/beans.json`, reached through its parent — and carrying 8 gates |
| `empty` | a directory exists and holds nothing | a determined empty |
| `typed-only` | a declared validator TYPES its nodes; nothing judges them | `health`, `interaction`, `issue-marks`, `todos` |
| `unaudited` | files, and nothing at all — not even a validator | none here, since bean `3oqj` |

`bean-defs` is why the first state is not a gap: it has coverage and no
directory of its own. A report that printed `0` for its directory count and left
the reader to infer would have manufactured a finding.

So every row prints all four counts and **names its state** rather than leaving
it to be read off a zero.

### `typed-only` is a finding, and that is the whole reason it exists

Bean `3oqj`. Before this state, `health` and `todos` read `unaudited` — and that
**over-reported**. Both declare a validator, and `check:kind-validators` parses
their nodes against it; they looked unreached only because the gate that types
them declares `@covers computed`, which this report counts as neither coverage
nor gap.

The temptation is to call them covered. **Do not.** `--strict` fails on
`typed-only` as its own family, because typing is not judging — a kind can parse
perfectly against its schema while nothing has an opinion about what it *says*.
A state that turned a finding into a pass would be `dh4f` wearing this report's
own design, and it would contradict the paragraph above about
`check:kind-validators`.

What the state buys is telling two different pieces of work apart: *a schema
parses these nodes and no criterion reads them* is not *nothing whatsoever
reaches this kind*.

### The two kinds that were genuinely untyped

`interaction` and `issue-marks` declared no validator at all, and the cost was
measured rather than supposed: `interaction/interaction.json` is read at the
start of **every** session by jq inside a shell script whose failure branch
prints `(could not parse … — read it by hand)`. A malformed node does not fail;
it degrades to a line nobody acts on, in the one file every sibling session
reads first.

Two things that surfaced while fixing it, both worth the pattern:

- **`interaction`'s `schema` pointed at the wrong module.** It named
  `harness-config.ts`, which holds the *path* to the node, not its shape. A
  pointer to where a fact is **not** written is worse than none: a reader who
  follows it concludes the shape is undeclared on purpose.
- **`saveSeen` was not writing `$schema`.** Consumers route a node by its tag and
  skip a file that has none, so every mark the mechanism produced would have been
  passed over by the very check a new schema exists to feed — leaving the two
  hand-written files as the only ones ever validated. **A validator over the nodes
  nobody produces is not coverage.**

---

## Three rules for building any coverage report

Each was paid for by this one, and none is specific to it.

### A measurement must not be a term in itself

The report's own sidecar lives in the `qa-results` graph, so the `qa` row counted
it, so writing it changed the next run's answer — for ever. The gate could only
be satisfied by running the writer **twice**.

Exclude your own output, **derive the path from the constants that write it** so
a relocation cannot leave the exclusion pointing elsewhere, and test that one run
converges.

### Commit the RELATION, print the census

The first version recorded `files` and `sidecars`. Two costs, and the second is
the one that kills a gate:

1. Regenerating a QA sidecar under `library/` turned the **coverage** gate red — a
   writer in one graph breaking another graph's gate.
2. A file count moves whenever anybody adds a page under `docs/`, so the gate was
   **stale by default** — and a gate that is stale by default is one people learn
   to regenerate without reading.

What belongs in the sidecar is what defines coverage: declared directories,
criteria reaching the kind, gates declaring it, the state. Those move when
coverage moves, which is when a reviewer needs the diff. One bit of the census —
`hasFiles` — is all the states need, because they turn on whether a directory
holds anything at all rather than on how much.

**And that is this skill's own thesis applied to its own design.** A sidecar count
is not a coverage measurement; committing one would have made the report depend on
the signal it exists to replace.

### A docblock that documents a tag necessarily contains the tag

`coversIn` read `audit-coverage.ts`' own worked examples of `@covers` as
declarations, crediting the coverage report with auditing the bean store. Any
parser over docblocks has to tell a **use** from a **mention**, and indentation is
the distinction JSDoc already provides: `^ \* @covers `, exactly one space either
side of the star.

---

## What `--check` fails on, and what it does not

`--check` fails on a **stale sidecar** and **does not write**. The falsification
pass caught the first version repairing the staleness it reported: red once, green
on the rerun, the file still stale in the repository. **A checker that mutates its
own subject cannot be falsified**, which is the one property
[`generalise-the-fix`](generalise-the-fix.md) Move 3 asks a guard to have.

The findings are reported and do not fail. `--strict` fails on an unaudited kind
and `--require-all` on an undeclared gate, for the day each gap is meant to close.
A gate that refused every push until somebody wrote criteria for `interaction/`
is a gate that gets switched off within a week.

## Adding a kind, or a gate

- **A new gate**: add `@covers` in the same change. If you cannot tell which kind
  its subject is, leave it off — the count is the honest answer.
- **A new graph kind**: it appears in the report the moment it is registered,
  because the denominator is the registry. Expect it to read `unaudited` until it
  declares a validator and `typed-only` until something judges it — and say in
  the sidecar why it needs nothing if that is the answer, never by letting the
  row read clean.
- **A relocation**: nothing to update. Directories resolve through
  `directoriesForGraph`, which is the reason the report survived three layout
  changes that broke prose in `AGENTS.md`.

## Provenance

Bean `folio-assistant-xutg`, written 2026-09-24 after the failure at the top of
this file. Split out of
[`covered-is-not-reachable`](covered-is-not-reachable.md) the same day: added
there as a fifth case, it took that skill to 321 lines against a corpus p75 of
279 and turned its own `skill-is-brief` criterion from a pass into a fail. That
skill's footer already says what to do — *"the remedy for a skill that has grown
a second subject is to split it, not to quiet the finding"* — and the subject
here is different: a **kind of node**, not a mechanism.

`3oqj` carries the four unaudited kinds; `3srh` the ten undeclared gates.
{% endraw %}
