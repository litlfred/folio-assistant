---
# folio-assistant-sj6m
title: 'TOOL NODES ARE UNAUDITED: 69 of them, and `tool` is not a QA subject kind — plus assets, a pre-execution security gate, and subprocess dispatch'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T06:48:03Z
updated_at: 2026-09-22T07:17:42Z
parent: folio-assistant-vke6
---

## The ask, owner 2026-09-22 — verbatim

Quoted rather than paraphrased, because it carries four requirements in three
sentences and a paraphrase would be a second answer free to drift:

| Each tool node needs a QA check and all referenced assets.  Need to check
| before execution if security gates passed.
|
| Note skill.update In general subprocess can be run w/ same agent or
| dispatch one or more

## Measured 2026-09-22 before anything was written

**`tool` is not a QA subject kind at all**, so the gap is structural rather
than a coverage shortfall:

    KG_SUBJECT_KINDS = ["process", "decision", "role", "requirement",
                        "skill", "graph"]        schemas/kg-qa.ts:289

...while `kg-export` mints **69 Tool nodes**. `criteriaFor("tool")` cannot be
written, because the enum has no such member. So `kg:audit` does not report
tools as `n/a` — it never considers them, and reports a clean run over
sixty-nine nodes it structurally cannot judge. That is the `dh4f` shape inside
the audit whose job is catching it.

## The four requirements, and which are one thing

They arrived together and are NOT one piece of work. Recorded separately so a
later reader does not have to re-derive the split:

1. **A QA check per Tool node.** Needs `tool` added to `KG_SUBJECT_KINDS` and
   at least one criterion, or the criterion has nowhere to live. Neighbours:
   `2krx` (QA AXIS), `py74` (QA PROJECTION), `btuv` (qa-criteria registry and
   the platform boundary).
2. **All referenced assets.** A Tool node's assets must be declared and must
   RESOLVE. This is the `blv9` family — a link-shaped value that dereferences
   to nothing — and `check-declared-assets` already exists; whether it reaches
   Tool nodes is **unmeasured** and is the first thing to check. Neighbours:
   `6tkl` (its hardcoded list), `8325` (rendered-asset URLs), `o7eq` (URL
   space).
3. **A pre-execution security gate.** *"Check before execution if security
   gates passed"* — a precondition on RUNNING a tool, not on publishing one.
   Distinct from 1 and 2, which are about the node; this is about the call.
   Nearest existing work is `a58y`, and it is instructive rather than
   duplicate: it measured that the declared `qa-reporting` permission has
   **zero non-test consumers**, so a declaration that reads as a control
   enforces nothing. A security gate nothing consults would be the same
   defect with higher stakes.
4. **Subprocess dispatch — same agent or one or more.** *"In general
   subprocess can be run w/ same agent or dispatch one or more."* This is the
   BPMN subprocess execution model, and it overlaps `0grh` (the
   untainted-dispatch spine, in-progress under `3x2n`) and
   `swarm-management`. **Do not open this as new work before reading `0grh`**
   — its table of producer / checker / adjudicator may already be the answer,
   or may need only the "same agent" case added.

## Open question, not assumed

*"Note skill.update"* is ambiguous and has NOT been guessed at. It may name a
`skill_update` tool that does not yet exist, an existing MCP tool, or the
`skills/` update path as the worked example for 1–3. Left as the owner's to
disambiguate rather than resolved by picking the reading that suits the rest.

## Done when

- [x] `skill.update` is disambiguated — the owner read it as a Tool that
      should exist and does not; filed as #875, not folded into 1–3
- [x] `tool` is a QA subject kind with 7 criteria, 69 nodes reported, and a
      third state for the one question a checkout cannot answer
- [x] Requirement 2 measured — and CORRECTED below: `check-maintained-
      artefacts` covers all 7 `maintains` claims; the gap is closed, not
      doubled, and the first measurement of it was wrong
- [x] The pre-execution gate has a consumer, and a test that fails when the
      consumer stops consulting it — #878, bean `03t9`
- [x] `0grh` read against requirement 4 — it does NOT cover it, and the
      engine has no dispatch concept at all

## Do not

Do not add `tool` to `KG_SUBJECT_KINDS` with no criterion. An enum member with
nothing behind it makes `kg:audit` report tools as considered-and-clean, which
is worse than today: right now the silence is at least visible as absence.

## Requirement 2 measured 2026-09-22 — and it lands on a documented gap

The Done-when said to measure whether `check-declared-assets` reaches Tool
nodes **before** building anything for requirement 2. It does not, and the
answer reframes the requirement.

**`check-declared-assets` is not about Tool nodes at all.** It reads
`declaredAssets(root)`, which returns `decl.assets` — the INSTANCE
declaration's asset array, the `AGENTS.md` case from bean `v8gh`. So this is a
gap in the MECHANISM, not in that check's coverage, and widening it would be
the wrong repair.

**A Tool node's asset reference is `maintains`** — *"the artefacts this Tool is
authoritative for, as the URLs they are actually served at"* (`collectTools`,
`kg-export.ts`), with `maintainsFrom` carrying the repo-relative source.

**And the gap is already documented, by a COMPLETED bean.** `6f1x` narrowed
`kg:schema:check`'s `unproduced` reconciliation to artefacts whose declaring
Tool invokes `bun run kg:schema`, and stated the cost outright:

> *"Coverage of every other producer's artefacts is now ABSENT, not narrower.
> An artefact maintained by a Tool that some other command produces can rot to
> a 404 and nothing notices. Today that is two artefacts; it will be more as
> `d308` proceeds."*

### The count, and `6f1x`'s prediction held

| | |
|---|---|
| Tool nodes | 69 |
| ...declaring `maintains` | 7 (7 artefacts claimed) |
| ...covered by `kg:schema:check` | 3 |
| **...covered by nothing** | **4** |

`6f1x` said two. It is **four**, so the prediction was right and the gap has
doubled. The uncovered claims:

    assets/css/themes.css        assets/css/avatars.css
    ns/vocabulary.jsonld         ns/content/v1.jsonld

### All four currently resolve — so this is unchecked, not broken

Checked rather than assumed, because "uncovered" and "already a 404" are
different findings and only one is urgent:

- `ns/vocabulary.jsonld` and `ns/content/v1.jsonld` are written by
  `docs-site.yml` (`ns-export --out`, and a `cp` of the content context).
- `themes.css` and `avatars.css` appear NOWHERE in that workflow — not even
  by basename — but both are committed under `cat-harness/docs/assets/css/`
  and Jekyll copies `docs/` wholesale, so they publish.

No live `blv9`. What is missing is that nothing would notice if a generator
stopped writing one.

### The mechanism `6f1x` said it lacked now exists

`6f1x`'s blocker was that the script *"cannot see whether the site build wrote
a file into `_site/`"*. Bean `dyd3` built exactly that reader:
`siteOutputs()` in `scripts/tests/bootstrap-graph.test.ts` extracts every
`--out` path from a workflow and expands its `print-stub` captures.

**Coverage needs BOTH halves**, which the measurement above is what shows:

1. artefacts written by a workflow `--out` — `siteOutputs` reads these today
2. artefacts committed under `docs/` and copied verbatim by Jekyll — the two
   CSS files, invisible to a workflow scan

A check built on (1) alone would report the two CSS claims as unproduced and
be wrong about both, which is the same over-narrow reading `6f1x` was opened
to correct, in the opposite direction.

## Requirement 4 read against `0grh` — it does NOT cover it, and the engine has no dispatch at all

The Done-when said to read `0grh` against requirement 4 and either defer to it
or record what it does not cover. **It does not cover it**, and the reason is
worth stating rather than glossing: the two are about different questions, and
on the one point they touch they say OPPOSITE things.

`0grh` is about **verification** dispatch — producer / checker / adjudicator —
and its rule 3 is *"One agent doing both halves is not this check."* That
FORBIDS the same-agent case. Requirement 4 says a subprocess **may** run in the
same agent. So `0grh` is not the general model; it is a constraint that binds
one KIND of subprocess (a verification one). Deferring requirement 4 to it
would have imported a prohibition into the general case, which is the one
reading the owner's sentence rules out.

### What the engine actually does — measured, not inferred

| | |
|---|---|
| call activities in the `.bpmn` corpus | **26** |
| ...carrying `folio:skill` | 14 |
| ...carrying `folio:link` | 4 |
| ...saying **who runs them** | **0** |
| `bpmn:multiInstanceLoopCharacteristics` in the repo (diagrams + parser) | **0** |

`enterSubprocesses` (`src/workflow/instance.ts`) starts every child **in
process**, as a nested `InstanceState` under the parent's `state.children`,
inheriting `subject` and `bean`. There is no actor, agent, or dispatch field on
the child, and `ACTIVITY_TYPES` in `process-model.ts` knows `bpmn:CallActivity`
without any loop characteristics.

So the owner's sentence names **three** states — same agent, dispatch one,
dispatch more than one — of which the engine implements exactly one, *by never
asking the question*. And the absence is silent in the `dh4f` way: a diagram
cannot EXPRESS the other two, so no diagram is wrong and nothing reports a gap.

**The nearest existing declaration is `folio:fulfilment`, and it is not this.**
`<folio:fulfilment kinds="person agent" reason="…"/>` says which actor KINDS
may perform an activity. It answers *what sort of thing* runs a step, never
*how many* or *in whose context*. Reaching for it would give an answer to a
question nobody asked.

## Requirement 3 — the mechanism already exists, and it is `a58y` again

The bean's own Done-when warned that *"a security gate nothing consults would
be the same defect with higher stakes"*. Measured today, that is not a risk to
design against — **it is already the state of the nearest mechanism**.

`<folio:precondition>` is *"what must hold BEFORE the start event"* (bean
`lv3j`), parsed into `ProcessModel.preconditions`, three-valued with
`could-not-determine` as a first-class verdict, and a `checkable` kind carrying
`check: { kind, ref }`. It is exactly the shape requirement 3 asks for, one
level up: a precondition on RUNNING rather than on publishing.

| | |
|---|---|
| processes declaring a precondition | **1** (`bootstrap/processes/initialize-harness.bpmn`) |
| preconditions declared | 4 — 3 `stated`, 1 `checkable` |
| **non-test callers of `evaluatePreconditions`** | **0** |

`workflow_start` does not consult it. The mechanism is written, tested against
the one real diagram that uses it, and **run by nothing**. That is `a58y`'s
finding — a declaration that reads as a control and enforces nothing — in the
component requirement 3 would otherwise have been built on top of.

The order this implies is the opposite of the obvious one: **give
`evaluatePreconditions` a consumer before extending it to tools.** Extending an
unconsulted check to 69 more subjects widens the silence rather than the
coverage.

## CORRECTION 2026-09-22 — the requirement 2 measurement above is WRONG

Everything under *"Requirement 2 measured"* that says the gap is open is
false, and it was false when written. Left standing rather than edited away,
because a measurement that was published and acted on should show its own
correction.

**`cat-harness/scripts/check-maintained-artefacts.ts` has existed since
2026-09-20** — two days before that measurement — and is wired into
`docs-site.yml` as *"Every maintained artefact is in the published tree"*,
running after `_site/` is assembled. It iterates:

    for (const t of tools()) for (const m of t.maintains ?? [])

No narrowing. **All 7 claims are checked**, with a third state: exit 2 on
could-not-determine, distinct from exit 1 on a real absence.

| | claimed | actual |
|---|---|---|
| …covered by nothing | **4** | **0** |

`6f1x`'s gap is CLOSED, by its own follow-up work.

### How the error happened, which matters more than the number

The question asked was *"which artefacts does `kg:schema:check` reconcile?"*.
The answer, 3, was then read as *"the other 4 are covered by nothing"* —
**without searching for other consumers of `maintains`.** There are eleven;
one was checked.

That is the `dh4f` shape — a clean verdict over a corpus the tool never
looked at — committed while measuring for a bean whose whole subject is that
shape. The check that would have caught it is one `grep`, and it was run only
after the claim had shipped in a merged PR.

**The rule this earns: a "covered by nothing" finding is not established by
one consumer coming back empty.** Enumerate the consumers first, name them,
and say how many were examined.

## Requirement 1 delivered — as a PROJECTION, on the owner's ruling

The correction cost requirement 1 its intended criterion: `tool-maintains-
produced` would now be a second answer to a question `check-maintained-
artefacts` already answers, free to disagree with it.

Measured instead: Tool nodes are **already checked** — `check-tools.ts`,
`tools.test.ts` and `check-maintained-artefacts.ts` cover `satisfies`, invoke
paths, io IRIs, unsafe args, alternatives, contracts and `maintains`. The
bean's *"69 unaudited"* is true of `kg:audit` and false of the repository.

Owner's ruling 2026-09-22: **project the existing checks into per-tool
sidecars.** So `tool` is now a `KG_SUBJECT_KIND` with 7 criteria that REPORT
those verdicts and reach none of their own. What it buys is the thing a script
cannot — a committed sidecar per Tool, so "unbound since it was drawn" and
"broken in the commit under review" stop looking identical.

Two results that are not `pass`, both guarded and both falsified:

- **`n/a`** where the property does not apply — a Tool declaring no
  `alternativeTo` has no alternative to dangle, and 60-odd non-answers counted
  as passes is how a projection reads as more coverage than it has.
- **`unknown`**, always, for `tool-maintains-in-tree`: presence in the
  published tree is a fact about `_site/`, which no checkout has. `pass` there
  would be green exactly where nobody built the site — `xom7`.

`tool-maintains-in-tree` is `minor` **not** because a rotted artefact is small
but because it can only ever be `unknown` here, `unknown` counts toward
`worstSeverity`, and at `major` the 7 Tools declaring `maintains` would put
`kg:audit:strict` permanently beyond reach with nothing able to clear it —
`nested-instance-audited`'s precedent exactly.

Verified `kg:audit:check` still exits 0, and that `kg:audit:strict` already
exited 1 before this change, so no green gate was taken away.
