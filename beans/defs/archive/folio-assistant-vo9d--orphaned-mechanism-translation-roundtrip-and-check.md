---
# folio-assistant-vo9d
title: 'ORPHANED MECHANISM: translation-roundtrip and check-l1-complete have entry points and no callers, while the BPMN asserts the step runs'
status: completed
type: task
priority: high
created_at: 2026-09-20T11:31:09Z
updated_at: 2026-09-22T07:23:02Z
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
`processes/translation-workflow.bpmn`:

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

- [x] one of the three chosen for `translation-roundtrip`, by a person — and the
      owner refused the choice: *"1 2 3 are all triggers"*
- [x] `check-l1-complete` gained a caller — the `l1-complete-check` Tool node
- [x] `covered-is-not-reachable` gains this as the INVERSE — **case 5** in its
      table, *"a skill, a mechanism, a command / missing: anything that invokes
      it"*, pointing at §Reachability is PLURAL where it is discussed
- [x] the `dw7v` hypothesis **STRUCK** from history — see below


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



## The pattern is written down — 2026-09-20

`covered-is-not-reachable` gains §"Reachability is PLURAL". It sits in that skill
rather than a new one because it is the same subject from the other side: the three
cases there ask what is MISSING, this asks what shape the question has.

It carries both of the owner's statements verbatim as the evidence that the choice
was refused twice, the trigger-or-Tool table, the `alternativeTo`-stays-empty rule,
and this bean as the worked example — three proposals, two already done or wrong,
one action. Plus the failure underneath: describing a mechanism from its name and
its position in a diagram, then reasoning about what it needs, when the usage string
settles it in one line.


---

## 2026-09-20: `check-l1-complete` gets its Tool node — and the round-trip axis is REFUSED, a third time

### `l1-complete-check`, per the owner's answer (a Tool node, no script)

`satisfies: ["library-ingestion"]`, optional positional entry, `alternativeTo`
empty. A Tool and **not** a script because the thing it reads is a FOLIO's
`library/` tree: a `check:l1-complete` here would sit in `SCRIPT_EXEMPTIONS` as
`no-folio` and never run, which is the cost I argued against for `0bzg`'s first
option. A Tool node reaches downstream, where the tree exists.

`alternativeTo` empty against its two siblings: `ingest-stdlib` and
`ingest-extended` INGEST and are substitutable with each other — the one
genuinely substitutable pair here alongside `beans-cli`/`beans-manual` — and a
completeness check is not a third way to ingest.

**One claim had to be walked back, found by running it.** The output description
first said exit 2 is what a folio-less run gives. It is not: `instanceRootFor`
tries the cwd's instance and then FALLS BACK to the script's own, and
`cat-harness` declares a `library` graph — so invoked from `/tmp` it still finds
this instance's one entry and exits 0. The exit-2 path is real and correctly
written (`checkAll` returns `undefined` for "no declaration anywhere", distinct
from `[]` for "declared and empty") but unreachable while the script sits beside a
declared library. What was measured is the exit-0 path over one real entry: 11
requirements, all met.

### The sweep-side round-trip criterion: NOT built, and the premise was wrong

I proposed it on the claim that *nothing asks whether a block has a round-trip
verdict*. Four measurements say do not build it:

1. **`translation-block-qa.ts` already declares the criterion**, deliberately
   empty, and its header gives the reason: the only offline back-translation is
   the PO's `msgid→msgstr` map read backwards, which returns the source exactly,
   always — *"a verdict with a script's name on it and no content, which is worse
   than the gap: a reader who sees a green round-trip stops asking."*
2. **The capability is LIVE.** The one translation sidecar in the corpus carries
   **two real entries** from 2026-09-18, written by `roundtrip-adjudicator` and
   `roundtrip-back-translator` subagents, with model provenance, the reviewed sha,
   and pages of notes distinguishing real drift from acceptable rewording.
3. **It is documented**, at `translation-manager` §"The agentic round trip — a PAIR
   of agents, and the separation is the measurement". The sidecar's
   `agent_skill: "translation-manager/agentic-round-trip"` is a skill/SECTION
   reference to it, not a dangling one — I checked for a missing file before
   assuming.
4. **One subject.** There is exactly **1** translation sidecar corpus-wide and it
   carries a verdict, so the criterion would have a single subject, already
   passing. A criterion that cannot discriminate is the zero-subject trap with the
   count changed.

So the question is already answered by the sidecar's own structure: key present
and non-empty means judged, key present and empty means nobody has. Adding a
per-block finding for the empty case would report an expected state as a defect —
and the skill's own argument is that a round-trip tick nobody should trust is
worse than a gap that says it is a gap.

**Also checked and NOT a finding:** the skill says the criterion is *"written with
no entry"*, which reads as contradicting a sidecar that has two. It does not — it
means the SCRIPT writes it empty, and the next section is how agents fill it.

### Three corrections on one bean

This bean has now been wrong three times, each time because a mechanism was
described from its name and position rather than read: it does not perform the
round trip (it records one); the BPMN trigger already existed; and the capability
is live and exercised rather than orphaned. The pattern is written up in
`covered-is-not-reachable` §"Reachability is PLURAL", whose closing line is the
lesson: **a name says what something is for; an argument list says what it does.**

## Done when

- [x] a Tool node over the recorder
- [x] `check-l1-complete` given a Tool node, per "triggers or tools as appropriate"
- [x] ~~a sweep-side criterion for the round-trip verdict~~ — **refused**: already
      answered structurally, capability live, one subject, and the skill argues
      against exactly this
- [x] the one-mechanism-many-dispatch-points pattern written into a skill


---

## CLOSED 2026-09-20 — the `dw7v` hypothesis is struck, and the truth is worse

The hypothesis recorded above, flagged as one rather than asserted:

> `dw7v` may be when this path lost its last caller — removing the simulation
> removed the only thing that exercised it.

**Struck.** Read from history rather than reasoned about:

1. `simulate-translation.ts` before `dw7v` (`git show e23d3b98e6^:…`) contains its
   **own private `roundTripQA()`** at line 117, over a hand-written
   `BACK_TRANSLATIONS` map. It never referenced `translation-roundtrip.ts` at all —
   grepping the pre-commit file for `roundtrip` returns only its own prose and its
   own function.
2. `translation-roundtrip.ts` does not appear in `dw7v`'s changed-file list.
3. At its **birth** commit `4997840` (*"the agentic round trip — two agents, and
   the separation is the measurement"*), the only references to it anywhere in the
   tree were its own `@module` tag, its own `usage:` string, and one line of
   `translation-manager.md` prose telling a human what to type.

**A path cannot lose a caller it never had.** It was born callerless.

### Why that is the worse finding

"Lost a caller" is a regression — something used to work. "Born callerless" is
this skill's own **mechanism-inlined-in-prose** failure committed at the moment the
mechanism was written, and it survived every subsequent check because the skill
*did* document the command. A reader checking the skill, the diagram and the file
finds all three present.

So `dw7v` is exonerated, and `4997840` is where the gap was introduced — which is
worth having straight, because the three dispatch points proposed for this bean
were all framed as *restoring* something.

### Recorded in the skill as case 5, not as a fifth section

The table row plus a pointer, rather than another worked section, for a stated
reason: the useful question for this shape is not *what is missing* but **how many
dispatch points it should have**, which §Reachability is PLURAL already answers
with the owner's own words. A second section would have said it twice, and the
skill is at 260 lines against a 280-line `skill-is-brief` threshold.

---

## Two sessions met on this bean — both records kept, and the sibling is right

Merged 2026-09-20. I marked this **completed** at 14:12; a sibling marked it
**in-progress** at 14:23 and re-measured. **Their status stands**, because their
re-measurement found an item my four checkboxes did not cover — an *aggregate*
round-trip question, distinct from the per-block one — and a bean closed over an
open item sends the next agent past real work.

The two records do not overlap and neither supersedes the other:

- **mine** strikes the `dw7v` hypothesis from history (criterion 4), which their
  pass does not address;
- **theirs** corrects this bean's OWN OPENING MEASUREMENT — `check-l1-complete.ts`
  already had a caller when the bean was filed (`ingest-document.ts` imported
  `checkEntry` from it since `0dc6c492a7`, thirty-two minutes earlier) — and
  names the one item still open.

Worth noting what the two findings have in common, since they were reached
independently: **both are corrections to a claim this bean made about history.**
Mine, that a caller was lost; theirs, that there was none to begin with at the
moment of filing. The bean was wrong about its subject's past in two different
directions, and neither error was visible from the file.

---

## Re-measured 2026-09-20, and FOUR of the five remaining items were already done

Not by me. Checked against the code and dated against this bean (filed
**11:31:09**), because four stale checkboxes is a bean that sends the next
agent to work that exists.

| item | state | evidence |
|---|---|---|
| Tool node over the recorder | **done** | `11d43ce4fb` (12:14) — `translation-roundtrip-record`, `satisfies: ["translation-manager"]` |
| `Task_RoundTripQA` carries a skill ref | **done** | it already did |
| a `qa-sweep` axis for the round trip | **refused, correctly** | the sweep cannot back-translate |
| `check-l1-complete` given the same treatment | **done** | `ca5ec3e373` (12:58) — Tool `l1-complete-check`, plus `check:l1-complete` in `package.json` |
| the pattern written into a skill | **done** | [`covered-is-not-reachable`](../../../cat-harness/skills/folio-core/covered-is-not-reachable.md) §"one mechanism, several dispatch points" (line 145), citing this bean at 168 |

**And this bean's own opening measurement was already wrong when it was
filed.** It lists `check-l1-complete.ts` as having "none" for callers;
`scripts/ingest-document.ts` has imported `checkEntry` from it since
`0dc6c492a7` at **10:59:25**, thirty-two minutes earlier. The table's column
is headed *callers of the entry point*, so the narrow reading — nothing
dispatches its `import.meta.main` — was true and is the one the fix answered.
Worth writing down, because the wide reading is the one a skim takes.

## The one item genuinely open, and what already exists for it

> a sweep-side criterion for the different question — does this block HAVE a
> round-trip verdict?

**Partly answered already, per block.** `translation-semantic-roundtrip` is
declared in `TRANSLATION_CRITERIA` and deliberately carries **no entry**, so
the panel reads *"no witness recorded — nobody has ruled on it"*. That IS the
per-block third state, and `translation-block-qa.ts` argues at length why a
script-computed score there would be worse than the gap: reversing the PO's own
msgid→msgstr map returns the source exactly, always — a similarity of 1.0 that
measures the lookup table.

So what is missing is not the per-block question but an **aggregate**: across
the corpus, how many translated blocks carry a round-trip verdict and how many
do not. Left unbuilt rather than guessed at — the bean says "worth having on
its own terms" without saying which shape, and inventing scope here is the
failure this session has already met several times.

## Closed on re-derived evidence, 2026-09-22

Every `## Done when` item was ticked while the bean stayed open. Re-derived
against `main` at `2ce66fc`:

| claim | evidence |
|---|---|
| `check-l1-complete` gained a caller | the `l1-complete-check` Tool node is present in `cat-harness/tools/index.ts` |
| `covered-is-not-reachable` gains the inverse as case 5 | that skill names both `translation-roundtrip` and `check-l1-complete` |

The owner's *"1 2 3 are all triggers"* ruling is recorded in the body above and
is not reopened here — `3vc6` deliberately did not revisit it.

Closed by **evidence, not authorship** — `bean-coordination` §"Closing a bean
whose work has already landed".
