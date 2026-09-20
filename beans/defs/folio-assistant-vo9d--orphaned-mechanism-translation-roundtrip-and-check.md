---
# folio-assistant-vo9d
title: 'ORPHANED MECHANISM: translation-roundtrip and check-l1-complete have entry points and no callers, while the BPMN asserts the step runs'
status: todo
type: task
priority: high
created_at: 2026-09-20T11:31:09Z
updated_at: 2026-09-20T12:09:38Z
parent: folio-assistant-d308
---

Found 2026-09-20 while measuring `pha7`, whose corrected form asked which of its
24 files the five existing translation Tool nodes actually reach. **Two of
twenty-four.** Two others are reached by nothing at all.

## The finding

| file | entry point | callers |
|---|---|---|
| `content/pipeline/translation-roundtrip.ts` | `import.meta.main` | **none** |
| `scripts/check-l1-complete.ts` | `import.meta.main` | **none** |

For `translation-roundtrip`, "none" was checked four ways:

- no Tool node — the five nodes' `inProcess` all point at
  `src/tools/translation.ts`, which imports only `pot-extract` and `po-inject`
- no `package.json` script
- no GitHub workflow
- **no importer** — `grep "from.*translation-roundtrip"` across the corpus returns
  nothing

Its only two mentions anywhere are a `@see` comment in `schemas/translation.ts`
and a `console.log` in `scripts/translation/simulate-translation.ts` printing
*"then translation-roundtrip.ts with a pair of agents"*.

`check-l1-complete.ts` is the same shape: its sole occurrence outside itself is a
string literal in `repo-partition.ts`'s classification table.

## Why this is a distinct defect and not just dead code

**`Task_RoundTripQA` is a live `serviceTask` on the critical path** of
`skills/workflows/translation-workflow.bpmn`:

```
Task_PoInject → Task_RoundTripQA → Gateway_Drift
```

So three surfaces agree that a step happens which nothing invokes: the diagram
draws it, `translation-manager` is covered by five Tools, and the program exists.
`ingest-l1-completeness-gate · Task_RoundTrip` is the same for `check-l1-complete`.

**This inverts `covered-is-not-reachable`'s third case.** That case is a mechanism
with no entry point (`checkFolioProfile`, bean `0bzg`). This is a mechanism WITH
an entry point and no callers. Both are invisible to `tools:coverage`, and this one
is the harder to notice, because everything a reader checks — the skill, the
diagram, the file — is present.

## Related, and neither covers this

- **`ktt2`** (open, blocked by `68dt`) designs the back-translation capability. It
  is about whether the check is right, not about whether anything runs it.
- **`dw7v`** (completed) removed the simulated round-trip numbers after *"remove
  fake data"*: `simulate-translation.ts` held a hand-written map of 6
  back-translations against 36 msgids, so the 21 "failures" measured absence
  rather than drift.

**A hypothesis, flagged as one rather than asserted:** `dw7v` may be when this path
lost its last caller — removing the simulation removed the only thing that
exercised it. Not verified; it needs the commit history read, and that is a
different piece of work from this measurement.

## Options, with what each costs

1. **An npm script for a person.** Cheapest and honest about what it is: the check
   back-translates **with a pair of agents**, so it cannot run unattended, and a
   script names it without pretending otherwise. Cost: still nothing in CI, so the
   gap persists — it is only now nameable.
2. **A step an agent performs inside the workflow.** Matches reality best — the
   diagram already draws it as a `serviceTask`, and an agent in the translation
   lane is exactly who has the two translation agents. Cost: it fires only while
   somebody is working, which is the objection recorded against option 2 of
   `what-kick-off-means-for-a-ci-watcher`.
3. **A `qa-sweep` axis.** Gets a committed per-block verdict and the
   "never checked" / "checked and clean" distinction. Cost: `qa-sweep` runs
   unattended, and this check cannot, so the axis would have to report
   could-not-determine whenever no agents are available — which is correct but
   makes most runs report nothing.

**Recommendation: option 2.** The diagram already asserts an agent performs this
step, so wiring it there makes the existing assertion true rather than adding a
new claim. Option 1 leaves CI exactly as blind as it is now; option 3 promises
unattended checking that this particular check cannot deliver.

**Deliberately not chosen here.** Wiring a `serviceTask` to a mechanism changes
what the workflow engine will hand an agent, and `ktt2` is still open on whether
the check itself is designed right — committing a caller before that is settled
would bind the process to a check that may change shape.

## Also worth deciding

`check-l1-complete.ts` is smaller and probably just wants an npm script beside
`check:corpus-gate`, but it is a folio-tree check, so it would sit in
`SCRIPT_EXEMPTIONS` as `no-folio` and never run here. Same question as `0bzg`
option 1.

## If nothing is decided

Status quo: both programs stay in the tree, unreachable, while the diagram and
the skill coverage both read as though the step happens. Nothing regresses — the
gap is simply now written down instead of inferable only by grepping for callers.

## Done when

- [ ] one of the three chosen for `translation-roundtrip`, by a person
- [ ] `check-l1-complete` either gains a caller or is recorded as deliberately manual
- [ ] `covered-is-not-reachable` gains this as the INVERSE of its third case —
      entry point present, callers absent
- [ ] the `dw7v` hypothesis either confirmed from history or struck


---

## DECIDED 2026-09-20 — the question was wrong, not just the answer

Owner, asked to choose between the three options: **"1 2 3 are all triggers"**,
then **"all for triggers or tools as appropriate"**.

**The options were not alternatives.** I framed them as a choice — script, or
workflow step, or `qa-sweep` axis — and that framing was the error. There is ONE
mechanism (`translation-roundtrip.ts`) and there are SEVERAL dispatch points, each
of which is either a **trigger** (something fires it) or a **Tool** (something can
invoke it), whichever fits:

| dispatch point | trigger or tool | why that one |
|---|---|---|
| a named command | **Tool node** | a caller invokes it; that is what a Tool node IS |
| the BPMN `serviceTask` | **trigger** | the process fires it at `Task_RoundTripQA` |
| a `qa-sweep` axis | **trigger** | the sweep fires it per block |

So all three, and `alternativeTo` stays empty between them for the same reason it
does on the five translation nodes: they are not substitutable arms, they are
different ways the same work gets started.

### This is the same answer the owner gave once before

From `what-kick-off-means-for-a-ci-watcher`, on the two CI-watcher dispatch points:
*"kick off if like task or workflow initation or bean roast"*. Three dispatch
points there too, and the same refusal to pick one. **That is a general pattern
about this harness and it should be written down somewhere durable** rather than
rediscovered each time an agent presents a mechanism as needing "a" caller.

The shape: asking "which caller should this have?" presumes one. The question worth
asking is "what should be able to start this, and is each of those a trigger or a
Tool?"

### What this changes about my recommendation

I recommended the workflow step alone, on the argument that it "makes the existing
assertion true rather than adding a new claim". That argument survives — but it
argued for the workflow step being NECESSARY, not for it being sufficient, and I
read it as the latter. The `qa-sweep` axis objection I raised (most runs would
report could-not-determine when no agents are available) is not an objection at
all: could-not-determine IS the correct verdict when the check cannot run, and
recording it is better than recording nothing. I had the third-state rule in hand
and argued against it.

## Done when — REVISED

- [x] the dispatch model settled: all three, each as trigger or Tool as fits
- [ ] a Tool node over `translation-roundtrip.ts` with an honest `satisfies`
- [ ] `Task_RoundTripQA` carries `<folio:skill ref>` so `workflow_next` hands an
      agent the mechanism rather than only a step name
- [ ] a `qa-sweep` axis that reports could-not-determine when no agent pair is
      available, rather than passing or being absent
- [ ] `check-l1-complete` given the same treatment, or recorded as deliberately manual
- [ ] the general pattern (one mechanism, several dispatch points) written into a
      skill, since this is the second time the owner has had to say it


---

## CORRECTED and PARTLY BUILT 2026-09-20 — I had the mechanism wrong

Reading `translation-roundtrip.ts` properly, before building the three dispatch
points, overturned three things this bean asserted.

### 1. It does not PERFORM the round trip. It RECORDS one.

```
usage: translation-roundtrip.ts --payload <file.json>
```

The payload carries a verdict a pair of translation agents already produced;
`recordRoundTrip` writes it into the block's existing
`<block>.<locale>.translation-qa.json` under criterion
`translation-semantic-roundtrip`. It **refuses** when no sidecar is there, and the
refusal states the principle:

> *"a round trip cannot be the thing that decides this block is translated"*

`translation-block-qa.ts` decides that — and it HAS an npm script
(`translation:block-qa`). This adds a judgement on top of an existing verdict.

So "the mechanism has no caller while the BPMN asserts the step runs" was the wrong
reading. The *recorder* had no declared caller. The back-translation itself was
never a program in this repository at all — it is agent work, which is exactly what
the `console.log` was telling a person.

### 2. `Task_RoundTripQA` ALREADY names a skill

```xml
<serviceTask id="Task_RoundTripQA" name="Round-trip translation QA (back-translate)">
  <extensionElements><folio:skill ref="translation-manager"/></extensionElements>
```

So `workflow_next` already hands an agent the skill at that step. My "Done when"
asked for this and it was already true. And `<folio:skill>` names a SKILL, never a
script, so it was never going to hand over the mechanism — that is what a Tool node
is for.

### 3. A `qa-sweep` axis would be WRONG, not merely awkward

I recommended against it for a bad reason (that most runs would report
could-not-determine, which I then correctly retracted as not being an objection).
The real reason is different: **the sweep cannot back-translate, and the verdict
originates outside it.** A sweep-side criterion would answer a DIFFERENT question —
*does this block have a round-trip verdict?* — which is worth having and is not
this mechanism under another trigger.

### What was actually missing, and is now built

**A Tool node**: `translation-roundtrip-record`, `satisfies: ["translation-manager"]`,
required `--payload`, exit 2 measured on a missing argument. `alternativeTo` empty,
because a recorder and a decider are not two ways to do one thing.

Its output description carries the behaviour worth knowing: an **agent** entry
REPLACES a previous agent entry — a re-run is a re-measurement of the same pair on
the same text, not another line in a log — while a **human** ruling already
recorded is kept, because this process does not supersede one.

Recorded on the node too: `translation-manager` has no input contract, so
`check-tools` cannot verify the edge. The clean run does not mean the edge was
tested.

### The pattern, again

Fourth time this session that reading the mechanism overturned something I had
already written down. The move each time is the same: I describe a mechanism from
its *name and its position in a diagram*, then reason about what it needs. Here
"round-trip QA, a serviceTask with no caller" produced three proposals, two of
which were already done or wrong, and the usage string settled it in one line.

## Done when — REVISED AGAIN

- [x] the dispatch model settled: triggers or tools as appropriate
- [x] a Tool node over the recorder, with an honest `satisfies`
- [x] ~~`Task_RoundTripQA` carries `<folio:skill ref>`~~ — it already did
- [x] ~~a `qa-sweep` axis for the round trip~~ — REFUSED: the sweep cannot
      back-translate and the verdict comes from outside it
- [ ] a sweep-side criterion for the different question — does this block HAVE a
      round-trip verdict? — which is worth having on its own terms
- [ ] `check-l1-complete` given the same treatment, or recorded as deliberately manual
- [ ] the general pattern (one mechanism, several dispatch points) written into a
      skill, since the owner has now had to say it twice
