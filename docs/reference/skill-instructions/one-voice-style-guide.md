---
layout: default
title: One-Voice Style Guide
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/one-voice-style-guide.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/one-voice-style-guide.md) — do not edit here.

{% raw %}
# One-Voice Style Guide — Author Voice Profile

> **See also:** `one-voice-audit` is the mechanical sweep (greps for
> status markers / TODOs / first-person work tone). This file is the
> *style profile* agents follow when *writing* prose; the audit is what
> runs *after*.

Reference this skill when authoring or editing narrative content (`.md`
files). It ensures the project speaks with a single, consistent voice
across all chapters, sections, and any running example.

## Author Voice Profile

The project is written with **precision in the service of clarity**.
Set the project's voice profile here; the defaults below are a strong
starting point:

- **Authoritative and precise**: no hedging, no editorializing, no
  personal asides. Every sentence carries weight.
- **Collaborative**: "we" for joint reasoning with the reader, never
  "I". The reader discovers alongside the author.
- **Object-focused**: prioritize what structures *do* over what they
  *are*.
- **Economical**: no filler, no rhetoric. If a result is striking, the
  content shows it; the prose does not comment on it.

### Sentence patterns

- **"Not assumed; derived"**: distinguish derivation from stipulation.
- **"Forced by"**: structures are forced by the stated foundations, not
  by assumption.
- **"Equivalent viewpoints"**: not competing descriptions but
  equivalent viewpoints.
- **"Precisely" language**: exactness is paramount.
- **Never begin a sentence with a symbol**: always "The operator $X$",
  not "$X$ is…".

### Pacing

Layered introduction, repeated at every scale (paragraph, section,
chapter):

1. Accessible observation or motivation
2. Precise statement
3. Formal definition or theorem
4. Consequence or example (the running example)

## Project-Level Voice Rules

| Rule | Standard | Violation example |
|------|----------|-------------------|
| **Person** | First-person plural ("we") | "the author shows", "one can see", "it is shown" |
| **Referent** | the project's chosen self-referent (e.g. "this paper") | inconsistent self-reference |
| **Tense** | Present ("we define", "the theorem states") | Past ("we defined", "the theorem stated") |
| **Tone** | Direct, declarative, no editorializing | "surprisingly", "remarkably", "interestingly" |
| **Voice** | Active for new definitions; passive for established terms | mixing active/passive for the same concept |
| **Reader address** | Never address the reader directly | "you can verify", "the reader will note" |

## Title Conventions (chapter / section / subsection)

Titles are the table-of-contents face of the project's story. Three
rules, enforced by the project's section-title audit (machine pass)
plus an agent coherence pass:

1. **Short and concise.** A title is a noun phrase naming the section's
   *one* governing idea — not a sentence, and not a comma-list of every
   concept in the section. Three-plus comma-joined concepts and
   over-long titles are flagged.

2. **Ownership hierarchy.** The project is responsible for its chapter
   titles, each chapter for its section titles, each section for its
   subsection titles. A title is judged coherent *read against its
   responsible parent*: it must make sense in that container without
   outside context, and distinguish itself from its sibling sections.

3. **Title from the story, not the label.** Read the section's content
   blocks (the intro block states the arc) and title it by what the
   section *does* — never by mechanically de-slugging its `label`.

**Never ship an auto-split artifact title** — a trailing ` : <tag>`
left by a restructure migration is meaningless out of context and is a
hard defect. Run the section-title audit before committing
chapter-manifest changes.

## Chapter Context Snippets

Maintain, per chapter, a short snippet capturing the chapter's intent,
its place in the project's arc, and the voice it requires. Use these
snippets when writing or reviewing content for a specific chapter. A
useful snippet records:

- **Context** — what the chapter establishes and how it sits in the arc.
- **Intent** — what the chapter must convince the reader of or derive.
- **Voice** — the rhythm and register appropriate here (e.g.
  definition–theorem–example for foundational chapters; data-driven with
  error bounds for results chapters; clearly-marked speculation for
  forward-looking chapters).
- **What a writer should know** — any chapter-specific conventions,
  required companion blocks, or notation cautions.

Keep these snippets in the project's style register and update them when
a chapter's role changes.

## Running Example Consistency

If the project carries a running example, it must maintain consistent
notation and voice across all chapters. Maintain a table mapping each
element of the example to its notation and the chapter where it was
first introduced. When extending the example in later chapters, always
reference back ("Continuing the example from §1…") or use an
`interprets` link to the earlier block.

## Terminology Consistency

Maintain a project terminology table mapping each concept to its
correct term/notation and the incorrect forms to avoid. Treat the
notation register as the authority; the editor and rendering auditor
consult it.

## Editorializing Blacklist

The following phrases and patterns must never appear:

- "surprisingly", "remarkably", "interestingly", "notably"
- "perhaps the most surprising/important/significant"
- "it is worth noting that"
- "the reader will appreciate"
- "it turns out that" (just state the result)
- "one might expect" (state what happens, not what was expected)
- "a beautiful result" / "an elegant proof"
- Any commentary on the importance or surprise value of results

Results speak for themselves.

## Pre-Commit Checklist

Before committing any `.md` content, verify:

1. [ ] **Person**: all narrative uses "we" (first-person plural)
2. [ ] **Referent**: the project's chosen self-referent, used consistently
3. [ ] **Tense**: present tense for definitions and theorems
4. [ ] **Tone**: no editorializing phrases (check blacklist above)
5. [ ] **Notation**: all symbols match the notation register
6. [ ] **Terminology**: correct terms per the terminology table
7. [ ] **Example thread**: running-example notation is consistent
8. [ ] **Cross-chapter**: terms introduced earlier are referenced, not
       re-defined
9. [ ] **Chapter voice**: content matches the chapter context snippet

## Procedure

1. **Read** the target `.md` file(s).
2. **Identify** the chapter and section context (see snippets above).
3. **Check** each rule in the pre-commit checklist.
4. **Flag** violations with file path, line number, and fix.
5. **If ambiguous** — if you are unsure whether a passage should be
   active or passive, concrete or abstract, or what the author's intent
   is — **ask the author** using AskUserQuestion before making changes.
6. **Fix** all clear violations.
7. **Report** a summary of changes made.
{% endraw %}
