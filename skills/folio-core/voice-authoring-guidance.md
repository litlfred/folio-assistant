---
name: voice-authoring-guidance
description: >
  Provides active voice profiles as authoring guidance to agents writing
  content. When a folio has active voices, this skill pre-loads the
  relevant rules and presents them to the authoring agent before it
  begins writing, so the content is voice-compliant from first draft.
roles: [collaborator, owner]
triggers:
  - "write with voice"
  - "apply voice"
  - "WHO style authoring"
  - "voice guidance"
allowed-tools: Read Grep Glob
---

# Voice Authoring Guidance

> **Companion to `voice-overlay-review`.** That skill audits content
> *after* it is written; this skill guides the author *before* writing.
> Both read the same `voices/*.json` profiles; this one front-loads the
> rules so the first draft is voice-compliant.

## When to use

- Automatically invoked by `editor` when the folio has active voices.
- Before drafting any content block in a voiced folio.
- On demand: "apply WHO style", "write with voice".

## How it works

### 1. Load active voices

Same as `voice-overlay-review` §1 — read `folio.config.json` →
`voices.active[]`, load each profile from `voices/<id>.json`.

### 2. Present rules to the authoring agent

For each active voice, extract the rules relevant to the block kind
being authored and present them as a **pre-authoring checklist**:

> **Active voices for this block (`prose` in a WHO guideline folio):**
>
> **WHO Editorial Style** (who-editorial):
> - Use British English spelling (-ise, programme, centre)
> - No periods after courtesy titles (Dr, Mr, Ms)
> - People-first language (person living with HIV, not HIV patient)
> - NLM/Vancouver citation style
> - Spell out abbreviations at first use
> - Numbers: spell out 1-9, figures for 10+, space as thousands separator
> - Dates: 15 March 2024 format
> - Gender-inclusive language
> - No serial (Oxford) comma
>
> **WHO Guideline Development** (who-guideline-development):
> - GRADE terminology: high/moderate/low/very low quality evidence
> - Strong recommendations use 'should'; conditional use 'may be considered'
> - Never use 'must' in a recommendation
> - Evidence from systematic reviews, not individual studies
> - Reference PRISMA flow diagrams

### 3. Agent applies rules while writing

The authoring agent treats these rules as constraints alongside the
base one-voice scholarly standard. It is *pre-authoring* guidance,
not post-hoc review — the goal is zero voice violations in the first
draft.

### 4. Post-draft, invoke `voice-overlay-review`

After the draft is written, the `voice-overlay-review` skill runs to
catch any remaining violations. The two skills form a write-then-check
cycle.

## Voices are not mandatory

A folio with no `voices.active[]` in its config receives no voice
guidance — only the base one-voice scholarly standard. The platform's
own documentation (`content/docs/`) carries no voice. This skill is a
no-op in that case.

## Cross-references

- [`voice-overlay-review`](voice-overlay-review.md) — the post-hoc review.
- [`one-voice-style-guide`](one-voice-style-guide.md) — the base voice.
- [`editor`](editor.md) — invokes this skill as a pre-authoring step.
- `voices/*.json` — the voice profile definitions.
