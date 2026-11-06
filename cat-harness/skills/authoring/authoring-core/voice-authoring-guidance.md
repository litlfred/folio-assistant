---
name: voice-authoring-guidance
description: >
  Load the active voices' rules BEFORE writing, so a block is drafted in the
  register it will be reviewed against. The authoring half of the voice overlay;
  `voice-overlay-review` is the half that runs after.
allowed-tools: Read Edit Bash Grep Glob
graph-typologies:
  - voices
---

# Voice authoring guidance

## Read the voices before the first sentence, not after the first review

A voice is an editorial register — spelling, punctuation, terminology, how a
normative statement is phrased. Get it right while drafting; correcting it
afterwards means rewriting prose somebody has already reviewed.

```sh
bun run cat check:voices          # what this instance ships, and how many rules each carries
```

The active set is in the instance's config, its `index.config.json` entry:

```json
{ "voices": { "active": ["milnor"] } }
```

**An empty or absent list means no voice, and that is a real answer.** The
platform's own documentation activates none. Do not add one because a voice
exists.

## What to load, and what to do with it

Each voice's rules carry three things you need while writing:

- **`terminology`** — preferred/deprecated pairs. Apply these as you type; a
  terminology change ripples into every sentence built around the old word.
- **`patterns`** — what the mechanical check will look for, i.e. which
  constructions will be questioned.
- **`judgementOnly: true`** — no lexical check can decide it, so nobody will
  catch it for you. These are the rules to hold in mind rather than fix on a
  later pass.

## The rules most often broken by drafting on instinct

The rules worth knowing in advance are the ones where instinct is wrong. For
example, under the science layer's `milnor` voice, **"clearly" is fine in a
mathematical block** when it routes the reader away from a routine
verification; do not write around it to appease the checker.

This skill restates no voice's rules: each rule belongs to the instance that
derived it, with the publication, page and verbatim quote it was read from,
and a copy here would lose that citation — and the uncited copy is the one a
reader meets first and nothing can check. To learn which of your voices' rules
are counterintuitive, open the voices.

## When two active voices disagree

Rules are **unioned**, not merged, and both stand. If honouring one would break
the other, that is a finding for the author and not something to resolve
silently in the prose — say which two rules and which voices, and let the editor
decide. A silent choice hides a genuine conflict between two documents the
folio has adopted.

## Do not

- **Do not apply a voice the folio has not activated.** An unasked-for
  register produces confident findings against prose never written to it.
- **Do not treat a voice as a substitute for the base house voice.** Voices
  overlay `one-voice-style-guide.md`; they do not replace it.
- **Do not add a rule to a voice while drafting.** A voice rule needs a citation
  that resolves (`check:voices` enforces it) — a rule you inferred from the prose
  you are writing is circular.
