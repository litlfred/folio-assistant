---
layout: default
title: Voices — editorial overlays
parent: Authoring guides
nav_order: 5
---

# Voices — editorial overlays
{: .no_toc }

<details open markdown="block">
  <summary>On this page</summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

## What voices are

Voices are **editorial overlays**, not content adapters or project profiles. The base scholarly standard of the platform is always active, and voices layer on top of this base to enforce specific editorial, grammatical, stylistic, or visual registers. They do not replace the base standard but rather add domain-specific rigor.

## Shipped voices

| Voice | Description | SKILL.md | voice.json |
| --- | --- | --- | --- |
| WHO Editorial Style | Spelling, capitalization, reference layout, non-discriminatory language. | [SKILL.md](../../../who-style-guide/skills/voices/who-editorial/SKILL.md) | [voice.json](../../../who-style-guide/skills/voices/who-editorial/voice.json) |
| WHO Guideline Development | GRADE wording, strength, certainty, justification. | [SKILL.md](../../../who-style-guide/skills/voices/who-guideline-development/SKILL.md) | [voice.json](../../../who-style-guide/skills/voices/who-guideline-development/voice.json) |
| WHO Publication Design | Visual conventions, logo use, typography, accessibility. | [SKILL.md](../../../who-style-guide/skills/voices/who-publication-design/SKILL.md) | [voice.json](../../../who-style-guide/skills/voices/who-publication-design/voice.json) |
| Milnor Exposition Standard | Eight hallmarks of mathematical exposition (H1-H8). | [SKILL.md](../../../folio-assistant-sci/skills/voices/milnor/SKILL.md) | [voice.json](../../../folio-assistant-sci/skills/voices/milnor/voice.json) |

## Activation

To activate voices, list them in your `folio.config.json` under `voices.active[]`.

```json
{
  "voices": {
    "active": [
      "who-editorial",
      "who-guideline-development"
    ]
  }
}
```

Platform docs themselves carry no voice, meaning their `voices.active[]` array is empty or absent.

## The authoring cycle

Voices are designed to be part of the entire document lifecycle:

- **Before writing:** Follow the [voice-authoring-guidance](../../skills/folio-core/voice-authoring-guidance.md) skill. It is much cheaper to honor terminology and stylistic rules as you type than to retrofit them later.
- **After writing:** Use the [voice-overlay-review](../../skills/folio-core/voice-overlay-review.md) skill. This reviews your blocks against the rules of your active voices and places findings on the QA sidecar.

## How voice review works

You can read about the formal review process in the [Voice overlay review BPMN process](../processes/voice-review.html) page.

Every rule inside a voice carries a `source` citation that resolves to a real document or reference. When reviewing, you must open the cited page. The mechanical half of a rule (its patterns or terminology) acts as a question. The reviewer must check the context to decide if the rule truly applies or if it's an exception (the judgement half). If a rule's own citation does not support it, the defect is in the rule itself, not the prose.

You can explore all the active rules and their citations in the interactive viewer at `cat-harness/docs/cat-harness/voices/`.

## Voice details

### WHO Editorial Style
Derived from the WHO Editorial Style Manual, this voice governs spelling, capitalization, reference layout, and non-discriminatory language.
- **Scope:** General editorial house style.
- **Key rules:** Write out journal names in full, rewrite to avoid discriminatory language instead of decorating with "he or she".
- **Counterintuitive items:** Use `-ize` instead of `-ise` (e.g., organize, not organise); avoid eponym genitives (Crohn disease, not Crohn's disease).
- **Source:** [`who-style-guide/skills/voices/who-editorial/`](../../../who-style-guide/skills/voices/who-editorial/)

### WHO Guideline Development
Derived from the WHO handbook for guideline development, this dictates the phrasing of normative statements.
- **Scope:** Recommendations and guideline methodology.
- **Key rules:** Use "should" for strong recommendations, "suggest" for conditional ones. Never say "not recommended" (use "we recommend against"). State certainty on the GRADE scale.
- **Source:** [`who-style-guide/skills/voices/who-guideline-development/`](../../../who-style-guide/skills/voices/who-guideline-development/)

### WHO Publication Design
Governs the visual conventions of WHO (Western Pacific Region) products rather than the prose itself.
- **Scope:** Visual identity and formatting.
- **Key rules:** Never combine red and green or blue and yellow in figures; leave specific exclusion zones around the logo; use the exact brand blue (C95 M25 Y0 K0).
- **Source:** [`who-style-guide/skills/voices/who-publication-design/`](../../../who-style-guide/skills/voices/who-publication-design/)

### Milnor Exposition Standard
A scoring gate derived from John Milnor's "Link Groups" paper covering the hallmarks of mathematical exposition (H1-H8).
- **Scope:** Mathematical and scientific exposition.
- **Key rules:** Economy of introductions, naming the tool's purpose before its definition, linear arguments without excessive lemmas, and measured prose (no superlatives, minimal first-person pronouns except for acknowledgements).
- **Source:** [`folio-assistant-sci/skills/voices/milnor/`](../../../folio-assistant-sci/skills/voices/milnor/)

### Other voices
Beyond the primary voices, note the following specialized voices:
- `folio-assistant-core/skills/voices/` — addressee voices.
- `smart-base/skills/voices/who-digital-health/` — the WHO digital health voice.
- `agent-skills/skills/voices/agent-skill-authoring/` — agent skill authoring voice.
