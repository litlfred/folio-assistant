---
# folio-assistant-hajp
title: 'INTERACTION: the asking rule is enforced by three layers, not remembered'
status: in-progress
type: feature
created_at: 2026-09-20T19:31:09Z
updated_at: 2026-09-20T20:55:00Z
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
