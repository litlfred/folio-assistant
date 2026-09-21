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
- [ ] **REVISIT GATING at twelve decision records.** `bun run health` →
      `bean-decision-records`; it read **7** on 2026-09-20. This box is the
      trigger, and it is the whole of what makes "gate later" a deferral rather
      than a decision nobody made.

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
