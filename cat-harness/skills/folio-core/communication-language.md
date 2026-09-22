---
name: communication-language
description: >-
  Determine the language an agent SPEAKS IN — the language of a turn, as
  against the language of content. Covers the four inputs and their order, why
  a model's own languages are never the answer, the boundary between speaking
  to the person and writing durable artefacts, where the determination is
  recorded so a sibling session does not re-ask, and when to re-ask.
capability: interaction
package: folio-core
---

# The language you communicate in

## Why this exists

The owner, 2026-09-21: *"part of agent first task is to determine appropriate
language when speaking/communicating regardless of context"*.

Searched before this skill was written: this repository had a great deal about
the language its **content** is in — [`translation-manager`](translation-manager.md),
`defaultLocale`, per-locale `.po` resolution, coverage badges — and **nothing
at all** about the language an agent SPEAKS IN.

So the language of every turn was decided by accident. The skills are written
in English, the corpus is English, and an agent therefore answered in English
without ever having asked whether that was right for the person in front of
it. **A default masquerading as a decision** — the same shape as every other
defect this repository names, where the absence of a determination is
indistinguishable from a determination that happened to agree.

**"Regardless of context" is load-bearing.** This is not "detect the language
of the request and mirror it". That answers the easy case and fails silently
for the person who writes a terse instruction in one language while wanting
the report in another, or who can type a language more easily than they can
read a wall of it.

## Make the determination before the first substantive turn

Beside the other opening steps — the session-start sweep and
[`opening-brief`](opening-brief.md). The sweep prints the interaction
preferences **first**, before the work plan, because they change the form of
every question that follows; this is the same argument one step further.

## Four inputs, and the order is not negotiable

| rank | input | where it lives |
|---|---|---|
| 1 | the person's **stated preference** | `interaction/interaction.json`, per user |
| 2 | the **language of their own turns** | the conversation |
| 3 | the **model's declared languages** | `bootstrap/models/models.json` |
| 4 | the instance's **`defaultLocale`** | `harness.config.json` → `translation.defaultLocale` |

**A stated preference wins outright.** It is the only input that is a
*decision* rather than a signal, and a person who has said it once must not be
asked again — that is WCAG 2.2 SC 3.3.7 (Redundant Entry), and for a user who
types with difficulty "just ask again" is not a small cost.

**Their own turns rank above the model's languages**, and this is the rule an
implementation gets backwards. The owner was explicit: *"the model's languages
are an INPUT, never the determination"*. A model strong in a language the
person cannot read is **worse** than the fallback, not better. Rank 3 exists
to say *"this pairing may be better served by something other than the
corpus's language"* — it never selects one on its own.

**Only `human-validated` entries are read at all.** `validatedLanguages()` in
`bootstrap/schemas/model-registry.ts` returns nothing for `self-reported` or
`unverified`, because a model's own claim about which languages it handles
well is a generated assertion about a generated system. `self-reported` is not
a weaker `human-validated`; it is a different kind of claim.

## The boundary: SPEAKING versus WRITING

The rule above governs **what you say to the person**. It does **not** govern
what you write into the repository.

| artefact | language |
|---|---|
| chat replies, questions, status reports | **the determination** |
| commit messages, PR bodies, issue comments | the instance's source language |
| code comments, skills, beans, schemas | the instance's source language |
| folio CONTENT | [`translation-manager`](translation-manager.md), not this skill |

The reason is the reader, not the author. A commit message has reviewers, a
future bisector and an agent six months from now; an issue comment has
everyone subscribed. Writing those in one person's preferred language narrows
who can read the record to the person who least needed it written down.

**This boundary is stated because it will otherwise be read as covering
everything**, and an agent that translated its commit messages would be
obeying the letter of a rule that never meant it.

## Record it where a sibling session reads it

`interaction/interaction.json`, in the user's entry, beside `profiles`:

```jsonc
"someone@example.org": {
  "profiles": ["low-dexterity"],
  "language": "fr",
  "note": "…",
  "source": "stated by the user"
}
```

`source` already carries the declared-versus-assumed distinction, so a
language recorded there says both *what* and *on what authority*. The
session-start sweep prints the whole entry, so the next session reads it
rather than re-deriving it.

**Never write a preference the person did not state.** The file is `context`
— read at session start, never written by a process. An inferred language
recorded as though stated is worse than no record: it is a wrong answer
wearing the authority of a right one, and the next session will not re-ask.

## When to re-ask

- **Never, on a recorded preference**, unless the person changes it.
- **When the person's turns move to another language** and no preference is
  recorded — ask once, offer to record it, and proceed on the observed
  language if no answer comes.
- **When a determination was never made** — the sweep reports that, and it is
  a finding rather than a silence.

## What "could not determine" looks like

`defaultLocale`, said out loud. An agent that falls through to rank 4 says so
once rather than presenting the fallback as a choice — the third-state rule
this repository applies everywhere: an unknown rendered as a determination is
indistinguishable from a real one.

## Related

- [`interaction-modality`](interaction-modality.md) — the FORM a question
  takes; this is the LANGUAGE it takes. Both are read from the same file.
- [`translation-manager`](translation-manager.md) — the language of content,
  which this skill does not govern.
- `bootstrap/schemas/model-registry.ts` — why a model's own word is not
  evidence.
