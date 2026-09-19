---
layout: default
title: One-Voice Style Guide
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/one-voice-style-guide.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/one-voice-style-guide.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/one-voice-style-guide.md){: .fa-edit-source }

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

## The Milnor exposition standard

**Three files sent readers here for this section and it did not exist.**
`skills/folio-core/exposition-swarm-drain.md` cites "one-voice style guide →
'The Milnor exposition standard'" at three places, one of them naming a
`.claude/skills/local/one-voice-style-guide.md` that is not on disk at all. The
eight hallmarks were named only inside the `expo-milnor-clarity` criterion's
description string in `content/pipeline/qa-criteria-registry.ts` — eight words,
no rubric — while the criterion is a **strict gate that passes only on a perfect
16/16**. Scoring against eight bare words is how eight reviewers produce eight
different sixteens. Bean `bfmf`.

**What the standard is, and what it is not.** It is a house standard *named
after* the qualities of John Milnor's mathematical exposition. It is not an
extract from his writing, and nothing here is attributed to him. If you want the
original, read *Morse theory* or *Topology from the differentiable viewpoint* and
notice what they do not do.

### The eight hallmarks, and what 0 / 1 / 2 looks like

Each hallmark scores **0, 1 or 2**. Sixteen is the only passing total, so a 1 is
a finding: "acceptable" is not the bar.

| | hallmark | 0 | 1 | 2 |
|---|---|---|---|---|
| **H1** | **Economy** — every sentence carries weight | Paragraphs that could be deleted with no loss | Sentences that restate their neighbours, or a closing line that summarises what was just said | Nothing can be removed without losing content |
| **H2** | **Concrete before abstract** — the instance precedes the generalisation | Opens on the general definition and never lands | An example arrives, but after the abstraction it was meant to motivate | The reader meets a specific object first and the generalisation reads as inevitable |
| **H3** | **Why before what** — the reason precedes the machinery | The construction appears with no indication of what it is for | The motivation is present but buried after the construction | The reader knows what problem is being solved before seeing the tool |
| **H4** | **Uncluttered notation** — symbols earn their place | Notation introduced and used once; collisions; decorated symbols where a word would do | More indices or subscripts than the argument needs | Every symbol is used enough to be worth naming, and none is overloaded |
| **H5** | **Linear argument** — the reader never has to hold two threads | Forward references to results not yet stated | One aside the reader must park and return to | Read once, top to bottom, and it follows |
| **H6** | **Prose carries the argument** — the display is evidence, not the reasoning | The argument exists only in the equations; the prose says "we compute" | Prose narrates the steps without saying why they follow | A reader who skipped every display would still follow the argument |
| **H7** | **Right-tool framing** — the method is chosen, and the choice is visible | A heavy method deployed with no indication why | The right tool, used without saying what the alternative would have cost | The reader can see why this tool and not the obvious other one |
| **H8** | **Respect for the reader** — no flattery, no hedging, no performance | Tells the reader what is beautiful, surprising or important | Hedges a claim the text can actually support | States what is true and lets the reader judge |

### Where H8 and the `voice-*` axis meet

H8 is the hallmark with a mechanical counterpart: `voice-editorializing` matches
the phrase lists H8 fails a block for. The mechanical half and this one disagree
in both directions and neither overrides the other — a block can score 2 on H8
and still trip the checker on a comparative (`merely` in "authoritative rather
than merely cited" is a degree marker, bean `nwus`), and a block can pass the
checker while performing at the reader in words no phrase list contains.

### Scoring one block

1. **Read it whole, once, without scoring.** H5 and H6 are properties of the
   reading and cannot be recovered from a second pass that already knows the
   argument.
2. **Score H1–H8 and write the evidence for every score below 2** — the line, and
   what the 2 would have been. A bare number is not a finding.
3. **`milnor-brevity` is the companion and its resolve discipline is STRICTER.**
   A repeat may be deleted only where the two occurrences are semantically
   identical. Where the content differs you may not delete, and you never delete
   maths — a diagram, an equation or a derivation. Where de-duplication would
   lose distinct content, keep it, or split the block if that helps explication.

### Do not

- **Do not score from a diff.** Every hallmark is a property of the block as a
  reader meets it, not of what changed.
- **Do not fix H4 by renaming symbols across a chapter** without checking what
  else binds them. Notation is shared.
- **Do not treat a 16 as a licence.** The gate is necessary, not sufficient: a
  block can be perfectly expounded and wrong.

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
