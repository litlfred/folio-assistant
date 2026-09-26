---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'The Milnor exposition standard'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/milnor-exposition-standard.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/milnor-exposition-standard.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/milnor-exposition-standard.md){: .fa-edit-source }

{% raw %}
# The Milnor exposition standard

**Three files sent readers here for this section and it did not exist.**
`skills/folio-core/exposition-swarm-drain.md` cited "one-voice style guide →
'The Milnor exposition standard'" three times, one of them naming a
`.claude/skills/local/one-voice-style-guide.md` that is not on disk. The eight
hallmarks lived only inside the `expo-milnor-clarity` criterion's description —
eight words, no rubric — while that criterion is a **strict gate passing only on
a perfect 16/16**. Scoring against eight bare words is how eight reviewers
produce eight different sixteens. Bean `bfmf`.

**It is now derived from the paper, not from the name.** The source is
[`folio-assistant-sci/library/milnorlink/`](../../../folio-assistant-sci/library/milnorlink/)
— John Milnor, *Link Groups*,
Annals of Mathematics, Second Series, 59(2), March 1954, pp. 177–195
([JSTOR 1969685](http://www.jstor.org/stable/1969685)), ingested at journal-page
granularity so a citation to "p. 179" resolves to
`folio-assistant-sci/library/milnorlink/sections/page-179.md`.

The path moved with the corpus (bean `frs5`): the platform holds no content,
so `milnorlink` went to the science instance. This link went on pointing at
`cat-harness/library/` for a day and nothing reported it — `check:subgraphs`
only began walking this directory once `main` added its zero-dangling
assertion, which is what finally surfaced it. Every rule in
[`milnor`'s voice skill](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-sci/skills/voices/milnor/voice.json) quotes a page. 8899 words, 496
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
the `milnor` voice skill with its page.

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
- **Do not fail a block for `clearly` before a routine verification.** The
  checker no longer does either — bean `2t41` narrowed it, and the exemplar now
  scores exactly one `voice-editorializing` finding (p194's *"Unfortunately these
  invariants are not strong enough"*, which is real). What remains yours is the
  distinction no regex makes: `clearly` before a check the reader can perform is
  correct; `clearly` on a claim they cannot verify is the author asserting where
  they should be proving.
- **Do not fix H4 by renaming symbols across a chapter** without checking what
  else binds them. Notation is shared.
- **Do not treat a 16 as a licence.** The gate is necessary, not sufficient: a
  block can be perfectly expounded and wrong.
{% endraw %}
