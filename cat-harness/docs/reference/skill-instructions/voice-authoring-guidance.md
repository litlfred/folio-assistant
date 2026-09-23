---
layout: default
title: 'Voice authoring guidance'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/voice-authoring-guidance.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/voice-authoring-guidance.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/voice-authoring-guidance.md){: .fa-edit-source }

{% raw %}
# Voice authoring guidance

## Read the voices before the first sentence, not after the first review

A voice is an editorial register — spelling, punctuation, terminology, how a
normative statement is phrased. Every one of those is cheaper to get right while
drafting than to correct afterwards, because correcting it afterwards means
rewriting prose somebody has already reviewed.

```sh
bun run check:voices          # what this instance ships, and how many rules each carries
```

The active set is in `<name>.config.json`:

```json
{ "voices": { "active": ["milnor"] } }
```

**An empty or absent list means no voice, and that is a real answer.** This
instance activates none: folio-assistant's own documentation carries no voice
(issue #208). Do not add one because a voice exists.

## What to load, and what to do with it

Each voice's rules carry three things you need while writing:

- **`terminology`** — preferred/deprecated pairs. Apply these as you type. They
  are the cheapest rules to honour and the most tedious to fix later, because a
  terminology change ripples into every sentence built around the old word.
- **`patterns`** — what the mechanical check will look for. Knowing the regex is
  not cheating; it is knowing which constructions will be questioned.
- **`judgementOnly: true`** — no lexical check can decide it, so nobody will
  catch it for you. These are the rules to hold in mind rather than fix on a
  later pass.

## The rules most often broken by drafting on instinct

**Read your active voices before drafting, not at review.** The rules worth
knowing in advance are the ones where the instinct is wrong — where a writer
who has never opened the voice will produce something fluent and against house
style, and the fix ripples through every sentence built on it. A terminology
rule is the cheapest to honour and the most tedious to retrofit.

One worked example, from the only voice THIS instance ships:

- **"Clearly" is fine in a mathematical block.** The `milnor` voice measured
  fourteen uses of it in the exemplar paper, every one routing the reader away
  from a routine verification. Do not write around it to appease the checker.

Two further examples stood here, both drawn from another instance's voices, and
they are gone because this is the PLATFORM. A voice's rules belong to the
instance that derived them, where each one carries the publication, page and
verbatim quote it was read from. Restating a rule here reproduced it **without
its citation**, in a subsystem whose whole argument is that a voice is auditable
rather than asserted — and `check-voices.ts` exists because PR #210 shipped ten
plausible rules with `source: null`, one of which asserted the opposite of what
its own source says. The uncited copy is the one a reader meets first, and it is
the one nothing can check.

So: to learn which of your voices' rules are counterintuitive, open the voices.
`bun run check:voices` lists what this instance ships and how many rules each
carries.

## When two active voices disagree

Rules are **unioned**, not merged, and both stand. If honouring one would break
the other, that is a finding for the author and not something to resolve
silently in the prose — say which two rules and which voices, and let the editor
decide. A silent choice hides a genuine conflict between two documents the folio
has adopted.

## Do not

- **Do not apply a voice the folio has not activated.** Applying an unasked-for
  register produces confident findings against prose never written to it, and the
  author has to argue every one back.
- **Do not treat a voice as a substitute for the base house voice.** Voices
  overlay `one-voice-style-guide.md`; they do not replace it.
- **Do not add a rule to a voice while drafting.** A voice rule needs a citation
  that resolves (`check:voices` enforces it) — a rule you inferred from the prose
  you are writing is circular.
{% endraw %}
