---
layout: default
title: Voice authoring guidance
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/voice-authoring-guidance.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/voice-authoring-guidance.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/voice-authoring-guidance.md){: .fa-edit-source }

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

The active set is in `harness.config.json`:

```json
{ "voices": { "active": ["who-editorial", "who-guideline-development"] } }
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

Three examples from the voices this instance ships, each chosen because the
instinct is wrong:

- **`-ize`, not `-ise`.** It is widely believed that WHO house style is `-ise`.
  The Editorial Style Manual says `-ize` is preferred, on the ground of the Greek
  root. A draft written on the assumption needs every `organisation` changed.
- **Never "not recommended".** The WHO handbook names both readings — "no
  recommendation was made" and "do not implement" — and requires "we recommend
  against intervention X…". A draft that reaches review with "not recommended"
  in a normative statement has an ambiguity in the one sentence readers will act
  on.
- **"Clearly" is fine in a mathematical block.** The `milnor` voice measured
  fourteen uses of it in the exemplar paper, every one routing the reader away
  from a routine verification. Do not write around it to appease the checker.

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
