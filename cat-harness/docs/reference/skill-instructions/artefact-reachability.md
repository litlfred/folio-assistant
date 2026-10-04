---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Artefact reachability'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg/kg-core/artefact-reachability.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg/kg-core/artefact-reachability.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg/kg-core/artefact-reachability.md){: .fa-edit-source }

{% raw %}
# Artefact reachability — load is not evaluability, and a test is not a caller

**A declared executable artefact that nothing can reach is indistinguishable,
from outside, from a decision nobody takes.** That sentence is the whole skill.

Run `bun run audit:reachability` before saying a decision table works, before
saying a script has a caller, and before building any reachability report of
your own.

> **It is not wired into CI yet, and that is not the same as passing.** There is
> no `audit:reachability:check` alias and no step in `code-quality-gates.yml`, so
> `gates.ts` does not derive it and `bun run gates` does not run it. Judge it by
> hand with `bun run cat-harness/scripts/audit-reachability.ts --check`. Both the
> alias and the step land in one follow-up pull request, together — splitting a
> gate's NAME from its WIRING is how a check becomes registered-and-never-run
> (`t373`; `1xhc` measured 21 of 33 such scripts), and the workflow file had to
> leave the first change because `merge-main`'s resolution push carries no
> `workflows` scope. Bean `dxqm` holds it.

---

## The two failures this exists to prevent

2026-10-04, found by the merge steward. Both artefacts were declared, both were
documented, and both were past all 217 gates CI runs.

**`cat-harness/scripts/merge-queue.ts`** derived a pull request's facts,
evaluated the reprioritisation table and ordered the merge queue. Its own
docblock said *"a library the merge steward and the tile call."* Nothing called
it — no `package.json` script, no workflow, no command — and the only thing that
imported it was its own test. So the ordering a declared decision table exists
to provide could not be asked for, and the queue was ordered by hand.

**`cat-harness/processes/sdlc/decisions/merge-priority.dmn`** used the FEEL
unary test `not("green")` from the day it was drawn. `unaryTest` **throws** on
`not(...)`, so the table was unevaluable by **any** caller, not merely uncalled.

The second one is the sharper version, and the detail that matters is where it
was hiding: **the committed `kg-qa` sidecar for that table read
`"result": "pass"`.** `kg-audit`'s `decision-outcomes-used` criterion calls
`loadDecisionTable` and `possibleOutcomes`, and **neither of them parses a unary
test** — the loader never looks inside a rule, and `possibleOutcomes` reads the
output column. A gate recorded a clean verdict over something no caller could
evaluate.

That is [`audit-coverage`](audit-coverage.md)'s thesis in a new place:
**coverage is a relation between an instrument and the question it was built
for.** The criterion measured loadability exactly. Loadability was not the
question.

---

## Load is not evaluability — ask the EVALUATOR, never a grep

`unreadableExpressions` in `src/workflow/decision-table.ts` asks the question by
**running the evaluator over a probe**, atom by atom. It lives beside the
grammar rather than in the gate, and that placement is the rule:

> **A checker that restates a grammar is a second spelling of it, free to
> disagree with the first.** Green on a table the engine refuses, or red on one
> it accepts — and nothing says which is wrong.

Three things the walk had to get right, each of them a way to miss a finding:

- **A comma-separated test cannot be handed to `unaryTest` whole.** It is
  `parts.some(…)`, so the first atom that matches ends the walk. `0, [1..5]`
  reports clean if you ask once and `0` is the probe.
- **The probe is the number `0`**, the one value that reaches every branch
  without a type complaint. Under that probe a `DecisionError` is not "wrong
  fact type" — it is a rule that can never evaluate for *any* fact, such as
  `> "a"` — so it is reported rather than swallowed.
- **Output cells count.** `evaluate` calls `literal` on every output column and
  `possibleOutcomes` reads only the first, so an unreadable literal in a second
  output column is invisible to every existing reader.

**Keep `unaryTest` throwing.** Its own comment says why — *"so an expression
this evaluator does not implement can never be mistaken for a rule that simply
did not match"* — and that property is the only reason the defect was findable
at all. An evaluator that returned `false` for what it cannot read would have
made `merge-priority.dmn` route confidently and wrongly, for ever.

**An unevaluable table is a hard failure, not a finding.** It fails
`--check`, which runs on every push. That is a deliberate divergence from
`audit-coverage`, where `--check` fails on staleness alone: there, every finding
is an unmet ambition; here, a table nothing can evaluate is a **broken
artefact**.

---

## A diagram is reachable when the ENGINE's resolver reaches it

Same discipline, one layer out. The denominator is every `.bpmn` that any
instance *declares*; the numerator is `processFiles` — the list `workflow_list`
prints and `workflow_start` resolves against.

`processFiles` keys by **file stem** and keeps the first claimant
(`if (!seen.has(stem))`). So a dependency's diagram whose stem collides with the
root's is dropped from the list, and `workflow_start` cannot reach it by stem
*or* by `bpmn:process` id, because the id fallback searches the same list.
Nothing measured that.

It is **clean today** — 86 declared, 86 listed, no stem or id collisions — and
that is the point rather than an anticlimax. `1xhc`'s own conclusion when it
wired fourteen unrun gates was that *"wiring locks in a property the repo HAS
rather than demanding work"*. A reachability guard over a reachable corpus is
exactly that.

**A `calledElement` naming a process no file defines is NOT a finding.** The
loader's own comment settles it: a folio may legitimately call out to a process
it does not host, and the call stays opaque by design. Reporting it would turn a
modelling decision into a permanent red.

### What this does NOT re-answer

| question | whose it is |
|---|---|
| does every activity's `<bootstrap.processes:skill ref>` resolve? | `check:workflow-refs` (hard on a dangling ref), and `kg-audit`'s `skill-*` criteria |
| is any gateway pointing at this decision at all? | `kg-audit`'s `decision-outcomes-used` |
| which audits reach which KIND of node? | [`audit-coverage`](audit-coverage.md) |
| can a node of this kind be TYPED? | `check:kind-validators` |

A third reader of one relation is a third answer free to disagree with the other
two. The reference counts are **recorded in the sidecar and never graded**, so
the measurement is visible without a second verdict being minted.

---

## When a grep fails both ways, narrow the SUBJECT — not the signals

This is the part worth carrying away, because it took two wrong turns to reach
and both of them looked reasonable.

**Attempt 1 — ask the broad question.** *Is any module reached by nothing?*
Answer: **710 of 1834**. Not a findings list; noise. Most were corpora
discovered by directory walk — content blocks under `content/docs/`, schema
modules a registry names, the tests `bun test` globs — and no inference can tell
those from a module nobody can run. A gate with 710 findings is a gate switched
off in a week.

**Attempt 2 — narrow the signals.** Require an invocation verb beside the
mention, so documentation stops counting as a caller. Better, and still **34**
findings, most of them Zod schema modules that a declaration points at. The
noise moved; it did not go.

**What worked was narrowing the subject.** A module with a `#!` shebang or an
`import.meta.main` guard has **said it is runnable**. That is a declaration
inside the file, which is what
[`directory-conventions`](directory-conventions.md) insists a contract must be —
*extension is a coincidence; a declaration inside the file is the contract* —
and *"does anything run this?"* then has one right answer. The corpus is counted on each run and the
sidecar holds the number; a count in prose is the next thing to go stale. `scripts/merge-queue.ts` is one of the six, so this
slice would have caught finding 1 on the day it landed.

`audit-coverage` says *prefer a declaration where inference fails in both
directions*. This adds the move you make when there is **no declaration to
prefer**: find the declaration the corpus already carries, and make that the
subject.

### A mention is not a caller, and that distinction decides everything

Measured: crediting every textual mention credits `scripts/merge-queue.ts`,
because `merge-train.bpmn` and `merge-priority.dmn` both name it in their
`<bpmn:documentation>` prose — and the generated glossary JSON carries that
prose onward into a third file. **A grep over mentions clears the very defect
this tool exists to catch.**

So a mention counts only on a line that also carries an invocation: a runtime, a
spawn, or this repo's own in-process tool dispatch. It is `coversIn`'s rule
again — a parser over text has to tell a **use** from a **mention** — and here
the use has a verb beside it.

Two things that follow, and both were paid for:

- **Read the dot-prefixed callers explicitly.** `gitFiles` excludes every
  dot-prefixed segment, so `.github/workflows/` and `.claude/commands/` — where
  most invocation actually lives — are invisible to a corpus walk. Reading only
  `code-quality-gates.yml` reported `minify-site.ts` and `staging-rotate.ts` as
  run by nothing; `feature-staging.yml` runs both.
- **Exclude your own sidecar.** Its findings QUOTE the paths it reports, so
  reading it credits every module named in a finding with being reached, and the
  report clears itself one run later, permanently. Derive the path from the
  constants that write the file, so a relocation cannot leave the exclusion
  pointing elsewhere. `audit-coverage` states the general rule: **a measurement
  must not be a term in itself.**

### Two unrun states, and one number for both would hide the worse one

| state | what it means |
|---|---|
| `invoked` | something runs it |
| `declared` | nothing runs it, and it SAYS how it is reached — `@entrypoint` |
| `entry-point-orphan` | nothing runs it and nothing but a test imports it: **it exists only as a claim** |
| `entry-point-latent` | nothing runs it, and it IS a live library: a dead CLI branch on a reached module |

The last two are different pieces of work, and merging them would bury a module
nobody can run inside a list of unused `--help` branches. Same reasoning as
`audit-coverage`'s `typed-only`: a state exists to keep two findings from
collapsing into one.

**A test is not a caller.** A test proves a module works; it does not make it
reachable. That sentence is finding 1 in full.

### `@entrypoint` — say how you ARE reached

```
 * @entrypoint script:merge:steward
 * @entrypoint none — written for the merge-steward tile, not built yet (bean `xxxx`)
 * @entrypoint spawned by scripts/foo.sh
```

Exactly one space, the star, one space — a continuation or an indented example
is a **mention**, for `coversIn`'s reason, and this skill's own code block above
is one. A `script:<name>` claim is **verified** against `package.json`, because
a declaration that can be checked should be; the free-text forms are recorded as
your assertion and not graded. **Under-claiming is recoverable** — the count
says so out loud. Over-claiming looks like reachability, which is the defect.

---

## Three rules for building any reachability report

### Commit the relation, print the census

The sidecar holds which decisions are evaluable, which diagrams the resolver
reaches, which entry points are run, and the gateways pointing at each decision.
It does **not** hold module totals or the 710 figure: a census moves on any
commit that adds a file, and a gate stale by default is one people learn to
regenerate without reading. `audit-coverage` paid for that twice.

### Judge against a baseline; never compare a committed copy

The records live on the `qa-reports` branch (arc `3fva`, owner rulings D1/D4),
so `<instance>/test/results/` is a **working copy** and not a record. A writer
writes it, `qa:publish` pushes the tree once per CI run, and a gate reads the
baseline through `judgeQaResult` — `--against <ref>` for the branch, and a
baseline that cannot be asked is **`unknown`: reported, never a pass, never a
failure.**

Compose the path with `qaResultPath(root, stem)` and nothing else. Bean `id4s`'s
done-when is that **no caller spells `QA_RESULTS_DIR` itself**, so the day the
working copy moves it is one line and a grep that proves it.

**`failOnNew` is how a soft finding bites.** This gate's first version failed on
its own sidecar being STALE, as a proxy for the thing it actually wanted: a new
orphan showing up in a diff. The proxy stopped meaning anything the moment the
records left `main` — there is nothing committed left to be stale — and
`failOnNew` asks the question directly. The standing orphans are inherited and
do not fail; the next one fails on the commit that introduces it. If you find
yourself reaching for staleness to make a backlog visible, reach for this
instead.

### `failOn` is for broken artefacts, and this is the one divergence

`audit:coverage` fails `--check` only on what is **new**, because every finding
it has is an unmet ambition. Here the hard families are **broken artefacts** — a
table nothing can evaluate, a diagram the resolver cannot reach, two diagrams
answering to one name — so they go in `failOn` and fail whether or not a
baseline calls them new. **A defect is not less of one for having been there
yesterday.** `--strict` promotes `entry-point-orphan` to the same footing for
the day the backlog closes.

### A sweep prints its own denominator, and a checker does not write

`generalise-the-fix` §1.2a: a report over zero diagrams passes every assertion
in it. This refuses with *EXAMINED NOTHING* rather than reporting clean.

And `--check` does not write. A checker that repairs the staleness it reports
cannot be falsified — red once, green on the rerun, the file still stale in the
repository.

---

## Adding an artefact

- **A new `.dmn`**: it is examined the moment any instance declares the
  directory it sits in. Expect `unevaluable` until every cell is in the subset
  `decision-table.ts` documents, and **widen the evaluator** rather than
  weakening the gate.
- **A new `.bpmn`**: give it a stem and a `bpmn:process` id nothing else uses.
  Two diagrams answering to one name means `workflow_start` resolves one and
  silently not the other.
- **A new script**: wire it in the same change — a `package.json` script, a
  workflow step, or a command. If it is genuinely latent, say so with
  `@entrypoint` and name the bean. The honest answer is never a shebang and
  silence.

## Provenance

Bean `folio-assistant-dxqm`, under `folio-assistant-1xhc`, written 2026-10-04
from the two failures at the top of this file. Sibling of
[`audit-coverage`](audit-coverage.md) and split from it deliberately rather than
added to it: that skill's subject is a **kind of node** and this one's is a
**kind of artefact**, and it already carries its own warning about growing a
second subject.
{% endraw %}
