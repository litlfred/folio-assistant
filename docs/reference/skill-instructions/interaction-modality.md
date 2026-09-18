---
layout: default
title: /interaction-modality
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/interaction-modality.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/interaction-modality.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/interaction-modality.md){: .fa-edit-source }

{% raw %}
# /interaction-modality — ask in a form the person can answer

Process: [`docs/workflows/getting-started.bpmn`](../../docs/workflows/getting-started.bpmn),
`Task_DetectModality` and `Task_AskIntent`.
Preferences: `.folio/interaction.json` (committed, read at session start).

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

1. **Read `.folio/interaction.json` first.** If it says, you are done. Never
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

`.folio/interaction.json`, committed, beside `.folio/workflow/` and for the same
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

## 4. Asking a question well — the checklist

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
it never reaches an agent. `.folio/interaction.json` is the agent-facing record
and the site control is the reader-facing one; conflating them would mean a
reader's font choice silently reconfiguring how an agent talks to the author.

## 8. Anti-patterns

1. **Asking someone to describe their disability.** Ask about the interface.
2. **Re-asking what `.folio/interaction.json` records.** That is WCAG 3.3.7
   violated in the least excusable way, since the file is right there.
3. **A "quick open question" because the option list felt like overkill.** The
   list is cheaper for the person answering, which is the only budget that
   counts.
4. **Blocking on an answer with no default.** State the default, act on it.
5. **Treating an inferred profile as a diagnosis.** It is a rendering choice,
   labelled `inferred from behaviour`, and the user overrules it.
6. **Accessibility as a rendering concern only.** The largest win is §4's last
   rule — not asking at all — and no stylesheet delivers it.
{% endraw %}
