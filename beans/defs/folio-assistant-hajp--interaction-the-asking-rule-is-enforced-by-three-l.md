---
# folio-assistant-hajp
title: 'INTERACTION: the asking rule is enforced by three layers, not remembered'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-20T19:31:09Z
updated_at: 2026-09-21T05:29:17Z
parent: folio-assistant-ahvw
---

The owner, 2026-09-20, after four questions that broke the rule:

> *"ask specific questiosn w/ context/ recommendations/pros/cons (see skills,
> why not invoked?)"*
>
> *"fix skills so interaction modality would be triggered"*
>
> *"can we struture schema better to help enforce?"*

## The measurement

`interaction-modality` §4.1 was STRICT and complete, and was broken the same day
by the agent implementing its neighbours. Four questions were asked through a
selection tool; each option carried a sentence of context, which **felt** like a
comparison and was not one. The skill says why in as many words: *"a selection
tool shows one option at a time, so trade-offs written into its labels are not a
comparison"*. One question marked no recommendation, and none said what would
happen if the owner said nothing.

**The "why not invoked" is mechanical, not a lapse of care.** Four facts, each
checkable:

1. The rule is in the `kg` graph at `skills/folio-core/interaction-modality.md`.
2. `AGENTS.md` carries a **summary** of it, and the summary omits the clause
   that was broken.
3. The skill was **not offerable to the agent by name** — nothing under
   `.claude/skills/` exposed it, so `Skill` could not load it and no search
   surfaced it.
4. Nothing sat between an agent and `AskUserQuestion`.

**A rule that depends on being remembered is not enforced.**

## Three layers, and each one's limit is stated

| layer | does | cannot |
|---|---|---|
| `.claude/skills/interaction-modality/SKILL.md` | makes the rule offerable by name, with a triggering description | triggering is probabilistic |
| `PreToolUse` on `AskUserQuestion` → `cat-harness/scripts/ask-well.sh` | prints the six parts at the one moment the rule certainly applies | sees the tool call, not the prose before it — so it reminds and never blocks |
| `schemas/decision-request.ts` | **no optionals**: two options with one comparison does not parse; `renderDecision` emits the prose table and the selection from ONE object | cannot tell a good `con` from a lazy one, and does not try |

## Two schema gaps found by building it

1. **`HookEventSchema` had no `PreToolUse`** — only `SessionStart`,
   `PostToolUse`, `PreCommit`, `PostCommit`, `UserPromptSubmit`. So the one
   lifecycle point where this rule applies was **unrepresentable**, and the
   hook was live in `.claude/settings.json` while the generated skill registry
   refused it. The gate catching it is the right order; the gap is still real.
2. **`.claude/settings.json`'s `SessionStart` hook pointed at
   `$CLAUDE_PROJECT_DIR/scripts/session-start-coord-sweep.sh`**, which does not
   exist after the split. `b963` in a config file: the hook that installs the
   `beans` CLI and prints the work-plan sweep had been a **silent no-op for
   every session since the split**, and a hook that fails looks exactly like a
   hook that ran and found nothing to say. `check:command-paths` now reads
   `.claude/settings.json`'s `command` fields, and the falsifier was run.

## Done when

- [x] `interaction-modality` is offerable by name and triggers on asking
- [x] A `PreToolUse` hook fires the rule at the moment it applies
- [x] A schema makes the five-column comparison unomittable, with the refusals tested
- [x] `HookEventSchema` can express `PreToolUse`
- [x] `check:command-paths` covers hook commands in `.claude/settings.json`
- [x] A check asserts the `.claude/skills/` stub's links resolve (`check:command-paths` covers `.claude/skills/`)
- [ ] **REVISIT GATING at twelve RENDERED decision records.** `bun run health`
      → **`bean-rendered-decision-records`**; it read **1** on 2026-09-21, and
      the one was this bean. This box is the trigger, and it is the whole of
      what makes "gate later" a deferral rather than a decision nobody made.

      *Corrected 2026-09-21, owner's option C. It named `bean-decision-records`
      — a different metric, which counts any bean carrying a considered-options
      section and had grown 7 → 10 in a day without anyone adopting anything.
      It would have reached twelve on ordinary practice and delivered none of
      the evidence this deferral was set to buy, which by its own recorded
      reasoning is whether `renderDecision` works for authors other than the
      one who wrote it. `checks.test.ts` states the distinction: "an `## Options`
      heading is NOT a rendered decision".*

## Options

The owner was asked, 2026-09-20, how hard the rule should bite. Rendered
through `renderDecision` from a validated `DecisionRequest` — the first real
use of the mechanism, which is why it is recorded here.

1. **Reminder only** — what was built. Fires everywhere with no failure mode,
   but can only remind: it sees the tool call, not the prose written before it,
   so a rushed agent reads the reminder and still asks badly. Nothing
   accumulates that a later check could audit.
2. **Gate on a rendered decision** — the hook refuses `AskUserQuestion` until a
   validated `DecisionRequest` exists. Makes the comparison genuinely
   unskippable and leaves an auditable record. **But a blocking hook can strand
   the person**: if the validator is wrong or the scratch path breaks in a fresh
   container, the agent cannot ask anything at all, including "the gate is
   broken". Easy to revert, painful while wrong, because the failure removes
   the escape hatch.
3. **Reminder now, gate once records accumulate** *(chosen)* — keep the
   reminder; `renderDecision` becomes house style for any decision with more
   than two options; revisit gating at twelve records. Buys the evidence the
   gate needs, at the cost of leaving the window open meanwhile.

**Chosen: 3.** The owner, 2026-09-20: *"reminder now, gate later"*.

The reasoning put to them, and it is the reason the condition is evidence
rather than a date: `decision-request.ts` was written in one sitting against
four questions its own author had got wrong — a sample of one author, and a
biased one. A gate that refused a well-formed question because the schema was
too narrow would cost the owner the one channel they use to correct an agent,
and the day it was written is the day that channel mattered.

**Why the counter is `bean-decision-records` and not a new one.** A second
store of decision objects would be a parallel count free to disagree with
`bean-store`'s — the `beans`/`todos` confusion one level along. A decision
worth keeping goes into the bean it belongs to, under `## Options`, where
`madr.md`'s two-option floor and `bean-thin-decision-records` already govern
it. `renderDecision` composes the chat message; the bean keeps the record.

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5.* — **The threshold was counting the wrong population, and the evidence it waited for was zero.**

`bean-decision-records` counts beans with an `## Options` heading. It has
nothing to do with `DecisionRequestSchema`. Measured today:

| counted | value |
|---|---|
| beans with an `## Options` heading | **10** |
| beans carrying a decision put THROUGH the schema | **0** |

So "revisit gating at twelve records" names a set containing none of the
evidence the wait was chosen to buy — evidence about whether
`DecisionRequestSchema` is too narrow, which only a decision that went
through it can supply. The store would have reached twelve and the condition
would have read as met.

**`renderDecision` had produced zero durable records in a day of heavy
decision-making**, including on this bean, which described its own decision
in prose. `bean-rendered-decision-records` now counts the right population,
detected from the five-row table the renderer emits rather than from a marker
somebody has to remember to write — the same reason `check:bean-bodies` reads
the body rather than trusting front matter.

**The gate would have caught two of the three breaches I committed this
session** — a missing recommendation and a missing "if you say nothing" are
both required fields. It would NOT have caught the third, the comparison put
in the tool's option labels instead of the prose, because the hook sees the
call and never the prose written before it. So a gate is worth something and
is not sufficient.

## Options

`hajp` deferred gating the asking rule until twelve decision records had accumulated. Measured today, the store holds 10 beans with an `## Options` heading and **0** carrying a decision actually put through the schema — so the threshold counts a population containing none of the evidence it was chosen to buy. The counter is now split into two metrics; this decides what to do about the threshold itself.

- **the gate** — a PreToolUse hook that refuses `AskUserQuestion` until a validated `DecisionRequest` exists
- **the reminder** — what ships today — it fires on every `AskUserQuestion` and can only remind
- **rendered record** — a decision put through `DecisionRequestSchema` and left in a bean as the five-row table

| | **make-evidence-accumulate** *(recommended)* | gate-now-fail-open | drop-the-threshold |
|---|---|---|---|
| **What it does** | Keep the reminder. The new `bean-rendered-decision-records` metric now counts the right population, so revisit gating at twelve of THOSE. | Turn the reminder into a gate immediately, but fail OPEN on infrastructure error: a missing scratch path or a crashing validator allows the call through. | Delete the twelve-record condition as unmeetable, keep the reminder indefinitely, and record on the bean that the window stays open by choice. |
| **Pro** | The threshold finally measures the thing it names, and this turn makes it 1. Nothing blocks anyone meanwhile. | Directly answers the one risk that caused the deferral — the agent can never be left unable to ask anything. Catches 2 of the 3 rule breaches I actually committed this session. | Honest. Stops a condition sitting in the store that would have been read as met by the wrong counter. |
| **Con** | Evidence only accrues if agents actually use renderDecision, which is house style and unenforced — 0 uses in a day of heavy decision-making is not encouraging. | The schema was written by one author against their own four mistakes. A well-formed question refused by a too-narrow schema costs you the channel you use to correct an agent. | Leaves the rule enforced only by an agent's attention — which is exactly what failed this session. |
| **Downstream** | If the count is still near 0 in a week, that IS the evidence: the mechanism is not being used voluntarily and only a gate would change it. So the wait has a defined end rather than being open-ended. | Every session's questions change shape at once, with no prior evidence about the schema's narrowness. | `hajp` closes with the reminder as the permanent answer; any future gate needs a fresh decision. |
| **Reversibility** | Fully reversible — it is a metric and a note. | One settings edit to revert, but painful while wrong. | Fully reversible. |

**Recommendation: make-evidence-accumulate** — The deferral was chosen to buy evidence about whether the schema is too narrow, and that evidence has never been recorded anywhere — so waiting bought nothing, but the fix is one metric rather than abandoning the plan. It now has a falsifiable end: if rendered records stay near zero, that result argues for the gate better than any count of twelve would have.

**If you say nothing:** I take make-evidence-accumulate: the two metrics ship, `hajp` records that the threshold now reads the rendered count, and nothing starts blocking.

2 other decisions are waiting; I will put each properly when it is next.

Which way on the gate?

*Issue link, recorded 2026-09-21.* **[#645](https://github.com/litlfred/folio-assistant/issues/645)** — the decision-record metrics.

Written down because `check:bean-issue-links` found it missing, and the defect is this epic's own: an issue was opened FROM this bean and the link was never carried back, so the work plan could not reach the issue from the bean. `oh78` names exactly that, and it happened four times in the session working `oh78`.

---

## 2026-09-21 — the trigger is readable, and it counts the wrong thing

**Correcting the first version of this entry, which said the trigger "cannot be
read". That was wrong.** `bean-decision-records` exists as a health metric and
reads **10** today, up from the **7** this bean recorded on 2026-09-20. It is
readable, it has moved, and it is 10 of 12. The error was mine: I looked for the
metric in the findings list, where only findings appear, instead of in the
measurements the report writes.

### What survives, and it is the sharper finding

| metric | today | 2026-09-20 |
|---|---|---|
| `bean-decision-records` — **what the trigger counts** | **10** | 7 |
| `bean-rendered-decision-records` — **what the deferral was waiting for** | **1** | — |
| `bean-thin-decision-records` | 0 | 0 |

**The trigger counts one thing and the reasoning wanted another.** The box will
fire when `bean-decision-records` reaches 12 — a count of beans carrying a
considered-options section, which this store writes as a matter of ordinary
practice and which has grown 7 → 10 in a day without anyone adopting anything.

But the reason the deferral was granted, recorded on this bean, is about
`renderDecision`:

> decision-request.ts was written in one sitting against four questions its own
> author had got wrong — a sample of one author

The evidence that would answer that is **`bean-rendered-decision-records`**, and
it stands at **1** — this bean's own record. `renderDecision` has been used by
nobody but its author.

So the trigger will fire on schedule and deliver none of the evidence it was
set to buy. `checks.test.ts` already states the distinction the trigger misses:

> an `## Options` heading is NOT a rendered decision — the gating condition it
> was read against wanted decisions put THROUGH `DecisionRequestSchema`

### And the mechanism has no moment that asks for it

`ask-well.sh` fires on every `AskUserQuestion` and teaches the six parts of
§4.1. **It never mentions `renderDecision`.** So the one enforced moment in the
whole loop — the moment the rule certainly applies — says nothing about leaving
a record, which is why records do not accrue.

Measured on this session: **five multi-option questions asked today, zero
rendered decisions written.** House style that nothing asks for is not followed,
which is this bean's own thesis applied to its own remedy — *a rule that
depends on being remembered is not enforced.*

**Owner's ruling, 2026-09-21: option C** — make `renderDecision` required at the
moment of asking so records accrue, and keep the twelve-record revisit.

## Options — the gating revisit, 2026-09-21

**Chosen: C.** The owner, 2026-09-21: *"C — require renderDecision, then
revisit"*.

Rendered through `renderDecision` from a validated `DecisionRequest`, which is
the point of recording it here: the bean's own trigger now measures
`renderDecision` adoption, and a decision ABOUT that trigger that was
hand-written would be the same defect it exists to catch. The source object is
in the session; what follows is its output, unedited.

Whether `hajp`'s deferral keeps waiting on a count that will arrive on its own, and what changes at the moment an agent asks a multi-option question. Nothing about the hook's blocking behaviour differs between these — the owner settled that on 2026-09-20 and none of them reopens it.

- **`hajp`** — the bean holding the asking rule's three enforcement layers; its last open box is a revisit trigger
- **`renderDecision`** — `cat-harness/schemas/decision-request.ts` — turns one validated object into both the prose comparison and the offered choices, so the two cannot drift
- **`bean-decision-records`** — health metric counting beans with a considered-options section. Read 10 on 2026-09-21, up from 7 on 09-20
- **`bean-rendered-decision-records`** — health metric counting beans whose decision went through `renderDecision`. Read 1 — `hajp` itself
- **`ask-well.sh`** — the PreToolUse hook on AskUserQuestion; the one enforced moment in the loop. It taught §4.1's six parts and never named `renderDecision`

| | **C — require renderDecision, then revisit** *(recommended)* | A — fix the trigger's wording, keep deferring | B — drop the condition, decide gating now | Record it and move on |
|---|---|---|---|---|
| **What it does** | Names `renderDecision` in `ask-well.sh` at the moment of asking, and re-points the trigger at `bean-rendered-decision-records`. Keeps the twelve-record revisit. | Re-points the trigger at the strict metric and changes nothing else. | Abandons the twelve-record trigger and settles blocking-or-not on present grounds. | Leaves the trigger as written; the measurement stays on the bean. |
| **Pro** | Treats the measured cause. Adoption is zero rather than slow — 1 record in a day and a half, and five multi-option questions asked the same day by an agent that had just read the bean — so nothing accrues because nothing at the asking moment requests it. | Honest and the cheapest of the three; the original reasoning stands untouched. | Ends a deferral whose condition is not being met, and forces the real question. | No new mechanism, and the numbers are durable whichever way it is settled later. |
| **Con** | A fourth enforcement layer before the decision it is meant to inform, and it still cannot tell a good record from a perfunctory one. | At 1 record in a day and a half the threshold may never arrive, so the deferral becomes indefinite and the window `hajp` opened to close stays open. | Decides without the evidence that was the entire point of waiting. `hajp` recorded the risk: a blocking hook that misfires removes the escape hatch, leaving the agent unable even to report that the gate is broken. | The trigger keeps counting the wrong metric, so it fires on schedule and delivers none of the evidence it was set to buy — a deferral that expires without answering anything. |
| **Downstream** | The trigger starts measuring what the deferral was actually waiting for, so twelve becomes evidence about `renderDecision` rather than about ordinary `## Options` sections. | The same question returns, with the same numbers, at an unpredictable date. | If it lands on blocking, a bad validator can strand the person with no way to say so. | Twelve arrives on ordinary practice and the gating question is reopened with nothing new. |
| **Reversibility** | Trivial. Two text edits — a paragraph in a shell heredoc and a metric name in a checkbox. | Trivial — one metric name. | Easy to revert and painful while wrong — the failure mode removes the channel you would use to report it. | Nothing to revert. |

**Recommendation: C — require renderDecision, then revisit** — The measurement says the deferral is not stalled on time but on nothing requesting the mechanism, and waiting longer under the same conditions produces the same number. It is also `hajp`'s own thesis — a rule that depends on being remembered is not enforced — applied to `hajp`'s own remedy.

**If you say nothing:** Record the measurement on the bean, change no code, and leave the trigger naming a metric that will reach twelve without answering the question.

3 other decisions are waiting; I will put each properly when it is next.

How should the deferral be resolved?

---

## The metric counts BEANS, not decisions — found by exercising it

Writing the record above was meant to move
`bean-rendered-decision-records` from 1 to 2, as `renderDecision`'s first use
by an author other than the one who wrote it. **It did not move.** This bean
now carries TWO rendered decisions and the metric still reads **1**, because
`hasRenderedDecision` is a per-bean boolean and `checks.ts` counts
`beans.filter((b) => b.renderedDecision === true)`.

So the trigger — *"twelve RENDERED decision records"* — actually requires
**twelve different beans**. A bean that makes five decisions contributes one.

### Why that is not a nit

It is the same defect this bean was corrected for an hour ago, one level in.
The trigger was re-pointed from `bean-decision-records` to
`bean-rendered-decision-records` so it would measure what the deferral waits
for. It now measures the right KIND of thing and the wrong UNIT — and the
error runs the same direction, under-counting adoption rather than over-.

If `renderDecision` becomes house style, decisions will cluster on the beans
that already have one, and the metric will lag real adoption by however much
clustering there is. Twelve could be met late, or not at all, while the
mechanism is in daily use.

### Not fixed here, and the reason is not caution

Changing the metric to count decisions rather than beans changes what **12**
means — the threshold was set against a bean count, and moving the unit without
moving the number is a silent re-calibration. That is a decision, and this bean
already carries two.

**Recorded for the revisit**, which is the moment it matters: whoever reads the
trigger then needs to know it is counting beans.
