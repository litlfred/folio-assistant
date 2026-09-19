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
## The voice comes from the ROLE, not from this file

Before writing or auditing a block, resolve its audience and read that role's
`persona`, `voice` and `useCases` in `skills/roles/roles.json`.

**A block sits in a lane; the lane is a role; the role is who the prose is
for.** The audience is not restated per block — copying it onto every block
invites the two to disagree, and a per-block audience contradicting its lane
is worse than none because it looks authoritative.

```ts
import { readRoleGraph, roleForLane } from "./schemas/role-graph";
const role = roleForLane(readRoleGraph("skills")!, laneName, explicitRef);
role?.persona   // who this reader is
role?.voice     // the register to address them in
role?.useCases  // what they came to do
```

**This file is the default, not the answer.** Where a role declares a `voice`,
that wins. The guidance here applies when no role has been resolved.

**Why the role carries the voice rather than this file inferring it.** Voice
does not follow from persona: the same reader is addressed differently in a
normative standard and in a tutorial. Naming it on the role is what lets the
authoring agent and the QA agent judge against the *same* string — otherwise a
voice finding is one agent's taste against another's, which is unreviewable.

`bun run kg:audit` reports a reader role missing any of the three
(`role-has-persona`, `role-declares-voice`, `role-has-use-cases`). System,
external and acted-upon roles are `n/a`: nothing in them reads prose.
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
`skills/folio-core/exposition-swarm-drain.md` cited "one-voice style guide →
'The Milnor exposition standard'" three times, one of them naming a
`.claude/skills/local/one-voice-style-guide.md` that is not on disk. The eight
hallmarks lived only inside the `expo-milnor-clarity` criterion's description —
eight words, no rubric — while that criterion is a **strict gate passing only on
a perfect 16/16**. Scoring against eight bare words is how eight reviewers
produce eight different sixteens. Bean `bfmf`.

**It is now derived from the paper, not from the name.** The source is
[`library/milnorlink/`](../../library/milnorlink/) — John Milnor, *Link Groups*,
Annals of Mathematics, Second Series, 59(2), March 1954, pp. 177–195
([JSTOR 1969685](http://www.jstor.org/stable/1969685)), ingested at journal-page
granularity so a citation to "p. 179" resolves to
`library/milnorlink/sections/page-179.md`. Every rule in
[`voices/milnor.json`](../../voices/milnor.json) quotes a page. 8899 words, 496
sentences; measured 2026-09-19.

### What the measurement found, including where WE are wrong

Three findings contradict rules stated elsewhere in this very file or in the
`voice-*` criteria, and the paper wins:

**`clearly` is proof economy, not editorializing.** `voice-editorializing` lists
"clearly", "obviously" and "trivially" and fails a block for them. Milnor uses
*clearly* **fourteen times** in 8899 words, and every one routes the reader's
effort away from a verification that is routine — *"Clearly the relation of
homotopy is reflexive, symmetric and transitive"*, *"The inclusion map … is
clearly a homotopy equivalence"*, *"This is clear for the case n = 0"*. Not once
does it mean "this is remarkable". Editorializing spends the reader's attention
on the author's opinion; this spends none and saves some. In a mathematical
block, *clearly* before a check the reader can perform is correct, and a finding
against it should be overruled with a reviewer entry. *Clearly* attached to a
claim the reader cannot verify in their head is the real defect — and no phrase
list separates the two.

**"Never `I`" is too blunt.** §"Author Voice Profile" above says *"we" for joint
reasoning with the reader, never "I"*. Milnor's split is sharper than a
prohibition: exactly **one** first-person singular in the paper — *"I am indebted
to R. H. Fox for assistance in the preparation of this paper"*, at the end of §1
— against **twenty** uses of *we*, every one joint reasoning. Zero *our*, zero
*the author*, zero *you*. So: a personal debt is stated personally, in one
sentence; the mathematics is done with the reader.

**Concrete-before-abstract is a property of the PAPER, not the section.** Read §2
alone and it opens on pure abstraction — *"Let M be an open 3-dimensional
manifold which possesses a regular triangulation. Let C be a circle."* A
per-section rubric scores that 0. It is a 2, because §1 already gave the picture
in words a reader can hold. Never score H2 on a definitions section in
isolation.

Two more numbers worth having: **no superlatives at all** (zero *surprisingly*,
*remarkably*, *interestingly*, *beautiful*, *elegant*), and **one hedge** in the
whole paper — *"a (possibly redundant) list"* — which qualifies a mathematical
fact rather than the author's confidence. Median sentence **17 words**, 90th
percentile 29, longest 52.

### The eight hallmarks, and what 0 / 1 / 2 looks like

Each scores **0, 1 or 2**. Sixteen is the only passing total, so a 1 is a
finding: "acceptable" is not the bar. Every row's evidence is in
`voices/milnor.json` with its page.

| | hallmark | 0 | 1 | 2 |
|---|---|---|---|---|
| **H1** | **Economy** — the opening is a *Summary*, not an Introduction | A paragraph could be deleted with no loss | Sentences restate their neighbours, or a closing line summarises what was just said | Nothing can be removed without losing content |
| **H2** | **Concrete before abstract** — scored over the unit a reader reads through | Opens on the general definition and never lands | An example arrives, but after the abstraction it was meant to motivate | The informal instance precedes the formal definition |
| **H3** | **Why before what** — the tool's purpose precedes the tool | The construction appears with no indication of what it is for | The motivation is present but buried after the construction | The reader knows what problem is being solved first |
| **H4** | **Uncluttered notation** — a symbol is introduced where it is needed | Notation used once; collisions; decoration where a word would do | More indices than the argument needs | Every symbol earns its name and none is overloaded |
| **H5** | **Linear argument** — routine verification is dispatched in a sentence | A forward reference to a result not yet stated | One aside the reader must park and return to | Read once, top to bottom, and it follows |
| **H6** | **Strategy before execution** — say what the proof will build and why that finishes it | The argument exists only in the displays; the prose says "we compute" | Prose narrates the steps without saying why they follow | A reader who skipped every display would still follow |
| **H7** | **Right-tool framing** — say what the method requires, in a clause | A heavy method with no indication why | The right tool, with no sense of what the alternative would cost | The reader sees why this tool and not the obvious other |
| **H8** | **Respect for the reader** — countable: no superlatives, no hedging, no second person | Tells the reader what is beautiful, surprising or important | Hedges a claim the text can support | States what is true and lets the reader judge |

**H6 is the most transferable of the eight.** Lemma 3's proof opens by saying
what will be built and why that finishes the job — *"A natural isomorphism …
will be constructed for i = 0, 1. Since a homotopy … induces a homotopy
equivalence …, this will complete the proof"* — and only then constructs it. The
reader knows the destination before the first step, so no step is a surprise
(p. 179).

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
- **Do not fail a block for `clearly` before a routine verification.** See above;
  the exemplar does it fourteen times.
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
