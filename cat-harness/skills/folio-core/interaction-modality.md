---
name: interaction-modality
description: Establish how to talk to the person in front of you before deciding what to say — audio, ordinary chat, selectable options for limited hand function, large-type for low vision, plain language — and hold that choice durably so every later session and sibling agent honours it. Covers the accessibility rules a conversational agent can actually keep, the settings surface in the published site, and how to drive a question set from DMN so the SAME logic serves every modality. Use at first contact with a new user, when a user reports difficulty answering, whenever a question is about to be asked, and before any long free-text prompt.
user_invocable: true
satisfies:
  - "req:agent-workflow#context-before-question"
---

# /interaction-modality — ask in a form the person can answer

Process: [`processes/getting-started.bpmn`](../../processes/getting-started.bpmn),
`Task_DetectModality` and `Task_AskIntent`.
Preferences: `interaction/interaction.json` (committed, read at session start).

## 0. The failure this prevents

An agent that asks a good question in an unusable form has asked nothing. The
usual shape of it: a long open prompt — *"Tell me about the folio you have in
mind, what content types you expect, and how you'd like it organised"* — sent to
somebody for whom typing is slow and painful. The reply comes back short, the
agent reads shortness as low engagement, and asks another open question.

This is not hypothetical here. **@litlfred, this repository's owner, has very
limited hand function.** Every question put to that user is to be answerable by
*selecting*, not by typing: numbered or lettered options, a recommended default
stated first, and the work proceeding on that default when no answer comes. Free
text is always *available* and never *required*.

Generalise the rule rather than special-casing the person:

> **A question's cost is paid by the person answering it.** Design the question
> so the cheapest possible answer is still a complete one.

## 1. The modality profiles

Four axes, independent — a user can be on more than one.

| profile | what changes | detection signal |
|---|---|---|
| `low-dexterity` | Every question is a selection. Options numbered. One recommended default, first, marked. Never more than ~4 options. Batch decisions so one answer covers several. Long-running work is announced, not confirmed. | user says so; very short replies to open questions; typos of a kind that cost effort to fix; voice input artefacts |
| `low-vision` | Large type in anything rendered. No information carried by colour alone. Short lines. Tables kept narrow or replaced by lists. ASCII diagrams avoided — they do not survive a screen reader or a 200 % zoom. | user says so; requests to enlarge; screen-reader artefacts |
| `audio` | Answers read aloud cleanly: no code fences in prose, no tables, no "see the diagram", spell out identifiers on first use, one idea per sentence. Questions asked one at a time. | the channel is voice; the user is dictating |
| `plain-language` | Shorter sentences, domain jargon expanded on first use, no nested clauses. Independent of disability — it is also the right default for a second-language reader. | user asks for simpler wording; the folio's audience |

The default profile — nobody has said anything — is **ordinary chat with
selectable options wherever there is a genuine choice**. That is not a
concession; it is a better question than an open one for almost everybody, and
it costs nothing to the user who would rather type.

## 2. Detecting it without an interrogation

The detection must not itself be an unusable question. So:

1. **Read `interaction/interaction.json` first.** If it says, you are done. Never
   re-ask what is recorded.
2. **Read the channel.** A voice session is `audio` without asking. A terminal
   session is not.
3. **Offer once, as options.** At first contact and not again:

   > How would you like me to ask you things?
   > 1. **Options I can pick from** (recommended — fewest keystrokes)
   > 2. Ordinary chat
   > 3. Read aloud / voice
   > 4. Large type
   >
   > (No answer is fine — I'll use 1.)

4. **Watch for the signal you were not given.** Consistently one-word answers
   to open questions, or an explicit "hard to type", moves the user to
   `low-dexterity` **and is recorded**, so no future session re-learns it.

Never ask a user to name a disability. Ask what form they want the conversation
to take. The profile is about the interface, not about them.

## 3. Where the preference lives

`interaction/interaction.json`, committed, beside `beans/workflows/` and for the same
reason: a preference that lives in one agent's context is re-learned by every
sibling session, and re-learning it means asking again.

```json
{
  "$schema": "https://litlfred.github.io/folio-assistant/schemas/interaction.json",
  "users": {
    "litlfred@ibiblio.org": {
      "profiles": ["low-dexterity"],
      "note": "Very limited hand function. Every question selectable; never require typing.",
      "source": "stated by the user"
    }
  },
  "default": { "profiles": [] }
}
```

`source` is required and is one of `stated by the user`, `inferred from
behaviour`, or `set in the site settings`. An inferred profile is honoured and
is **labelled as inferred**, so it can be corrected without an argument about
who decided it.

## 4. Asking a question well

Two halves, and the first is the one that gets skipped. §4.1 is what the
question has to *contain*; §4.2 is what shape it has to *take*. A question can
pass every item in §4.2 — selectable, four options, recommended default marked —
and still be unanswerable, because none of those say what the options mean.

### 4.1 Context before the question (STRICT)

**Order matters, and it is: context → options → recommendation → question.**
Never the question first with the explanation available on request.

The test is one sentence, and it is checkable in a single pass:

> **Can the reader answer without opening anything?**

If answering needs them to open an issue, a file, a diff or a scrollback, the
question is not ready. A link is where somebody goes for *more*; it is never
where the terms are defined.

**And when a link IS the right thing — a rendered page the reader has to see
for themselves — it points at the page, not at the site it is on.** Owner,
2026-09-21, after three turns of being handed a staging root while being asked
about one page on it: *"next time give appropraite link
…/STAGING/<branch>/who-iris/"*. Linking the root hands the reader a route the
agent already knew, and hands it to somebody who types with difficulty. Full
rule, with the failure it also hides:
[`continual-progress`](continual-progress.md) §"Link the PAGE, never the site
root".

Six parts, in order:

1. **What is being decided**, in plain words — stated as what will *differ*
   depending on the answer, not as the name of the decision.
2. **Every identifier expanded on first use.** A bean id, an option name you
   coined, a field, a Lean declaration, a file path: all opaque without their
   gloss. An option name you invented three paragraphs ago in another document
   is the worst case, because it *feels* defined to you.
3. **The options, compared** — what each does, its pro, its con, what it
   changes **downstream**, and how reversible it is. Laid out here, in the
   prose, where the rows can be read against each other; a selection tool shows
   one option at a time, so trade-offs written into its labels are not a
   comparison. [`decision-comparison`](decision-comparison.md) carries the
   columns, why cost and downstream impact are different things, and when a
   decision is too small to deserve a table.
4. **Your recommendation, and why**, stated first and marked. See §4.2.
5. **What happens if they say nothing.** Then do that.
6. **The question itself**, last.

**This binds every place a decision is handed to the person**, not only an
explicit question tool: the end-of-turn "next" line, a bean's `## Done when`, a
PR body asking the author to choose, a comment on an issue. Those are where it
is most often broken, because they feel like reporting rather than asking.

**Feature work breaks this more than content work, and for a specific reason:
the agent has just finished an impact analysis, and the vocabulary it built
doing that *feels* defined.** It is not. The names you coined an hour ago inside
an issue are the ones most likely to reach the reader undefined, precisely
because you can no longer see them as new.

#### The prose does not travel — the question object must stand alone (STRICT)

The six parts above assume the reader is **in the conversation**, reading the
prose that precedes the question. Often they are not. A question asked by a
background session, a cloud session, a subagent or a scheduled run reaches the
person through a channel that carries **only the structured fields** — the
question text, the option labels, the option descriptions. Everything written
around the call stays in a transcript the person would have to go and open.

So the test grows one clause:

> **Can the reader answer without opening anything — including the session that
> asked?**

**Measured here, 2026-09-22.** Two of four consolidation streams blocked on an
`AskUserQuestion` and both containers then disconnected. Their reasoning was in
their own transcripts. A sibling session relaying the block to the owner had to
**reconstruct** the context from session metadata, PR bodies and bean files —
and the owner read *the relay's* reconstruction rather than the asker's. The
askers had done the analysis; none of it travelled. One of the four questions
would have committed to a different repository, so the reconstruction was
load-bearing.

**Put in the structured fields everything needed to choose:**

| field | carries |
|---|---|
| the question | what will **differ** depending on the answer, with every identifier expanded. Never a bare noun phrase — *"`kupb` scope"* is a topic, not a question. |
| each option's description | that option's own consequence and **how reversible** it is. A reader comparing two options must be able to do it from the two descriptions alone. |
| **one** option's description | **what happens if they say nothing**, marked as the default and phrased as what you will then do. |

**The comparison table still belongs in the prose**, where rows can be read
against each other — a selection tool shows one option at a time, so a table is
genuinely better there. What changes is that **nothing may be load-bearing
*only* in the prose**. The prose is where a comparison is easier to read; the
fields are where it survives.

Two things this rules out, both of which read as complete to their author:

- **A question whose context sits in the paragraph above the call.** Correct in
  a live conversation, invisible through a relay.
- **An option label carrying the trade-off and a description carrying nothing**
  — or the reverse. A label is a handle; the description is the argument.

And when you are the one **relaying** somebody else's blocked question: say
that you are relaying, and say where the answer has to be given. An answer
typed at the relay does not reach the asker.

#### Worked example — a real failure, 2026-09-18

Ending a turn, this agent wrote:

> **next** `x4mt` — Cross-agent skill install + `fa-` prefix (#247). Unstarted,
> and I'd want your call on prefix-at-rest vs prefix-at-install before writing
> anything.

Every content word in the actual question is undefined. "prefix-at-rest" and
"prefix-at-install" are terms the agent had coined *in the issue*, so answering
meant opening #247 and reading it — which the author had to do, and which is a
real cost for somebody who types with difficulty. It also states no cost for
either option and gives no recommendation, so even after reading the issue there
is nothing to choose between except two phrases.

The same decision, askable:

> **Next up is #247** — installing this platform's skills into whichever agent
> is running (Claude Code, Gemini CLI, Cursor), so each one can actually load
> them. Skills would get an `fa-` prefix so their names cannot collide with the
> host agent's own commands: `/fa-beans-tui` rather than `/beans-tui`.
>
> One decision shapes everything else — **where the prefix gets applied:**
>
> 1. **When a skill is installed into an agent** *(recommended)* — files in this
>    repo keep their plain names, and the prefix is added as they are emitted.
>    Nothing here has to change, and the collision is solved where collisions
>    actually happen.
> 2. **In this repository itself** — rename every skill file. That touches the
>    package manifests, every `<folio:skill ref>` in the BPMN diagrams, two doc
>    generators and every cross-reference between skill bodies. It is the kind
>    of change that is painful to reverse.
>
> Say nothing and I will take (1) when I start.

Same information, same length, and the second can be answered by typing one
character.

#### A pending question is not a STATUS — ask it (STRICT)

Owner, 2026-09-22, after four sessions sat blocked while this agent reported
that they were blocked: *"show the questions!!!!!!!! why are you not. dont say
a unansnwered question is a blocker, ask a question."*

**"Stream 3 is blocked on four questions" is not a report. It is a question you
declined to ask.** Naming a block, linking to where it lives, and summarising
what it is about all *feel* like diligence — the information is accurate and
the person is informed. They still cannot answer, because nothing was put to
them in a form that takes a click.

The failure has a specific shape, and it is seductive because each step is
defensible:

1. A sibling session blocks on a question it cannot deliver.
2. You notice, and correctly judge it worth surfacing.
3. You describe it — what it asks, why it matters, where to answer it.
4. **You stop there**, because the question "belongs to" the other session.

Step 4 is the error. **Whoever can put the question to the person owns asking
it.** If you can act on the answer — and an agent with repository access
usually can — the question is yours to ask, not merely to relay. If you truly
cannot act, ask anyway and carry the answer back; an answer you can hand over
is worth more than a pointer the person has to follow.

**Pointing somewhere is the failure mode, not the fix.** *"Answer it in that
session"* asks the person to navigate, load, read and choose. For somebody who
types with difficulty that is not a small ask — it is the whole cost of the
decision, moved onto them. Reserve it for what genuinely cannot be done from
here, and say plainly that it cannot.

**When several are pending and they do not fit one ask**, ask the most
consequential in full and say **how many remain and what they are about** in one
line each. Do not ask *"which question would you like me to ask?"* — that is a
turn spent on nothing, and it is still not a question they can act on. Choose,
ask, and say what is queued behind it. §"More than one decision pending" below
carries the rest of that rule.

#### More than one decision pending — ask ONE, count the rest

The six parts above are per decision, and nothing said what to do when three are
open at once. Stating all three in full is a wall; naming all three compactly is
the teaser the rule forbids. Neither is the answer.

**Ask the one that is actually next, in full. For the others, give a COUNT and
no option names.**

> Two other decisions are waiting; I will put each properly when it is next.

A count is honest and costs the reader nothing: it says work is queued without
inviting them to answer a question they cannot see the terms of. An option name
without its cost invites exactly that, which is why the compact list is worse
than silence.

**There is no "just listing what's open" exemption.** A wrap-up that names a
decision has handed it over, whatever the framing sentence says. Either the
options and their costs are there, or the name comes out and a count goes in.

#### Enforced, not remembered — the three layers added 2026-09-20

This section was STRICT and complete on 2026-09-20, and was broken the same day
by the agent implementing its neighbours. The owner: *"ask specific questiosn w/
context/ recommendations/pros/cons (see skills, why not invoked?)"* — and the
"why not" is mechanical rather than a lapse of care. The rule lives here, in the
knowledge graph; `AGENTS.md` carries a **summary** of it; the summary omits the
clause that was broken (the comparison goes in the prose, not in the selection
tool's labels); and nothing sat between the agent and the question tool.

**A rule that depends on being remembered is not enforced.** So:

| layer | what it does | what it cannot do |
|---|---|---|
| `.claude/skills/interaction-modality/` | makes this skill **offerable by name**, which it was not — an agent looking for the rule found only the summary | triggering is probabilistic; it helps an agent already thinking about asking well |
| `PreToolUse` on `AskUserQuestion` → `scripts/ask-well.sh` | prints the six parts at the one moment the rule certainly applies, on every agent and every session | it sees the tool call, not the prose written before it, so it REMINDS and never blocks — a gate that cannot tell must not refuse |
| `schemas/decision-request.ts` | makes the comparison **unomittable**: no optionals, so a decision with two options and one comparison does not parse, and `renderDecision` emits the prose table and the selection from ONE object so they cannot drift | it cannot tell a good `con` from a lazy one, and does not try — it checks that the question was asked, never that the answer is honest |

None of the three is sufficient and the omissions are stated rather than
implied, which is the same three-state discipline the rest of this skill asks
for. `bun test cat-harness/scripts/tests/decision-request.test.ts` asserts each
refusal, because a schema whose refusals are untested quietly stops refusing.

##### The posture, and the condition that revisits it

**The owner chose, 2026-09-20: *"reminder now, gate later."*** The third layer
does **not** block. Asked as: should the `PreToolUse` hook refuse
`AskUserQuestion` until a validated {@link DecisionRequest} has been rendered?

The argument against gating *today* is not that gating is wrong. It is that
`decision-request.ts` was written in one sitting against four questions its own
author had got wrong — **a sample of one author, and a biased one**. A gate that
refused a well-formed question because the schema turned out too narrow would
cost the person the one channel they use to correct an agent, and the day it was
written is the day that channel mattered.

So the posture is:

1. **The hook reminds.** It never blocks, and a question always reaches the
   person, well-formed or not.
2. **`renderDecision` is the house style** for any decision with more than two
   options, or any decision whose options differ in cost rather than only in
   kind. Write the object, render the prose, then offer the selection.
3. **Gating is revisited on EVIDENCE, not on a date.**

> **The condition: twelve RENDERED decision records.** `bun run health` reports
> **`bean-rendered-decision-records`** — beans whose decision actually went
> through {@link renderDecision}, detected from the five-row table it emits. At
> twelve, a person can read them and answer the question the schema cannot
> answer about itself: does this shape fit the decisions this repository
> actually has?

*Superseded, kept as provenance and NOT as the condition:* this said
**`bean-decision-records`** — beans carrying an `## Options` heading — reading
**7** on 2026-09-20. **Corrected 2026-09-21 on the owner's ruling** (*"C —
require `renderDecision`, then revisit"*, bean `hajp`, [#645](https://github.com/litlfred/folio-assistant/issues/645)).
The two metrics count different populations: `bean-decision-records` had grown
7 → 10 in a day **without anyone adopting anything**, because this store writes
considered-options sections as ordinary practice, while
`bean-rendered-decision-records` stood at **1** — `hajp` itself. So the old
condition would have reached twelve on schedule and delivered **none** of the
evidence the deferral was granted to buy, which is evidence about whether
`DecisionRequestSchema` is too narrow, and only a decision that went through it
can supply that. `checks.test.ts` states the distinction it missed: *"an
`## Options` heading is NOT a rendered decision"*.

**Two things the correction does not change.** The counter is still a
**health metric over `beans/`**, not a second store: a parallel store of
decision objects would be a count free to disagree with `bean-store`'s — the
`beans`/`todos` confusion one level along. And the record still goes in the
**bean it belongs to**, under `## Options`, where `madr.md`'s two-option floor
and `bean-thin-decision-records` already govern it. `renderDecision` composes
the chat message; the bean keeps the record.

**The unit is BEANS, not decisions**, and whoever reads this at the revisit
needs to know it: `hasRenderedDecision` is a per-bean boolean, so a bean
carrying five rendered decisions contributes **one**. Twelve therefore means
twelve different beans. Recorded rather than changed, because moving the unit
without moving the number is a silent re-calibration (bean `hajp`).

**A deferral with no trigger is not a deferral**, which is the defect class this
whole section is about: it is a rule with no home, indistinguishable a month
later from a decision nobody made. The trigger is named, it is measured by a
command, and it is carried as an open Done-when on bean `hajp`.

### 4.2 Form — the checklist

Before any question, all five:

- [ ] **Could this be a selection?** If the answer set is finite, make it one.
- [ ] **Is there a recommended option, and is it first and marked?** A user who
      does not want to decide should be able to pick the first thing and be
      right.
- [ ] **Is it four options or fewer?** Beyond that, split the question.
- [ ] **Does no answer have a safe meaning?** Say what you will do if they say
      nothing, then do that. Silence must never block the work.
- [ ] **Is it blocking at all?** Do everything that does not depend on the
      answer first, and ask at the point where the answer is actually needed.

And the negative rule: **do not ask a question whose answer you could look up.**
Every fact `getting-started` reads from the filesystem is a question not asked.
This is the largest accessibility win available, and it is invisible.

### 4.3 After the answer — a ruling is a skill edit, not just an applied answer

The asking is half the loop. The answer comes back, and if it settles how a
*kind* of thing is decided rather than only this one, it is a rule and it is
written into the skill that governs it **in the same turn**, quoted and dated.
Otherwise the next session asks again, which is this skill's §0 failure arriving
a week late.

**The rule, the three questions that identify a rule-level answer, and why it
needs no permission**: [`symbiotic-interaction`](symbiotic-interaction.md) §2.
It applies to any author correction, not only to answers to questions asked
here.

## 5. Driving the questions from DMN — one logic, four surfaces

The ask in issue #232 — *force agentic Q&A into guided questions following DMN
logic, supporting multiple modalities* — decomposes into two separable things,
and keeping them separate is the whole design:

**What to ask next** is a decision. It belongs in a DMN table alongside
`folio-intent.dmn`: inputs are the facts known so far, output is the next
question's id (or `none`, when enough is known). It is authored by whoever owns
the process, is reviewable as a table, and is the same for every user.

**How to render the question** is the modality. Options as a numbered list in
chat, as spoken alternatives one at a time over audio, as large-type radio
buttons on the site. The DMN table never learns about any of this.

```
 facts ──▶ [ next-question.dmn ] ──▶ question id ──▶ renderer(profile) ──▶ user
   ▲                                                                        │
   └──────────────────── answer recorded as a new fact ─────────────────────┘
```

Four properties this buys, each of which is the reason to prefer it over an
agent improvising the interview:

1. **The question set is finite and reviewable.** You can read the table and
   know every question the agent can ask.
2. **It terminates.** A table whose output can be `none` has a stopping
   condition; an improvising agent does not.
3. **Asking becomes obligatory rather than optional.** This is the trick
   `folio-intent.dmn` already uses: `ask` is an *outcome of the table*, so the
   agent cannot route past it. An agent that decides for itself whether to ask
   will, under pressure to be helpful, decide not to.
4. **A question skipped is auditable.** The facts are recorded; you can replay
   the table and see which rule fired.

The limits, stated so nobody is surprised: the FEEL subset this repo implements
covers equality, comparison and one-of — no ranges, no `not()`, no function
calls (`src/workflow/decision-table.ts`). A genuinely open question — "what is
this paper about?" — is not a decision and does not belong in a table. And
conversation is not a wizard: a user must always be able to say something the
table did not anticipate, which is what option 5 of the intent question is for.

## 6. Grounding — what this follows

The rules above are the subset of published accessibility guidance that a
*conversational agent* can actually keep. Named so they can be checked rather
than taken on trust:

- **WCAG 2.2 AA** is the baseline for anything rendered — the docs site, the
  viewer, a generated PDF. The success criteria that bite hardest here:
  1.4.4 Resize text (200 % without loss), 1.4.3 Contrast, 1.4.1 Use of Colour
  (never colour alone), 2.4.7 Focus Visible, 3.3.2 Labels or Instructions.
- **WCAG 2.2's newer criteria are the dexterity ones** and are the reason this
  skill exists in the form it does: 2.5.7 Dragging Movements, 2.5.8 Target Size
  (Minimum) — 24 × 24 CSS px — and 3.3.7 Redundant Entry, which says do not make
  someone enter the same information twice. §3's committed preferences file is
  3.3.7 applied to a conversation.
- **Cognitive accessibility (WCAG 3.1, and W3C's COGA guidance)** is what §4's
  "four options or fewer" and plain-language profile come from.
- **EN 301 549** is the procurement standard that makes WCAG AA a legal
  requirement in EU public-sector contexts; Section 508 does the same in the US.
  A WHO SMART Guideline published from a folio lands in exactly those contexts.
- **Authoring Tool Accessibility Guidelines (ATAG 2.0)** is the one most often
  missed: it covers tools that *produce* content, which is what folio-assistant
  is. Part A is the tool being usable; Part B is the tool helping the author
  produce accessible output. The alt-text and heading-order checks a folio's QA
  sweep should carry are Part B.

## 7. The settings surface

The published site carries a settings control (gear, top right) writing the same
four profiles to `localStorage`, so a reader who is not the author still gets
large type or reduced motion. It is per-viewer and per-browser by construction —
it never reaches an agent. `interaction/interaction.json` is the agent-facing record
and the site control is the reader-facing one; conflating them would mean a
reader's font choice silently reconfiguring how an agent talks to the author.

## 8. Anti-patterns

0. **The question first, the context on request.** The single most common
   shape, and the one §4.1 exists to kill: an agent that has spent an hour
   inside a problem asks in the private vocabulary it built along the way, and
   the reader has to reconstruct that vocabulary before they can answer at all.
   "Happy to explain if useful" does not repair it — it moves the work back onto
   the person the question is for.
1. **Asking someone to describe their disability.** Ask about the interface.
2. **Re-asking what `interaction/interaction.json` records.** That is WCAG 3.3.7
   violated in the least excusable way, since the file is right there.
3. **A "quick open question" because the option list felt like overkill.** The
   list is cheaper for the person answering, which is the only budget that
   counts.
4. **Blocking on an answer with no default.** State the default, act on it.
5. **Treating an inferred profile as a diagnosis.** It is a rendering choice,
   labelled `inferred from behaviour`, and the user overrules it.
6. **Accessibility as a rendering concern only.** The largest win is §4's last
   rule — not asking at all — and no stylesheet delivers it.
