---
layout: default
title: 'Adopting a methodology, and choosing between them'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/methodology-adoption.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/methodology-adoption.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/methodology-adoption.md){: .fa-edit-source }

{% raw %}
# Adopting a methodology, and choosing between them

**A methodology is somebody else's work, adopted whole.** It is not a house
process with a citation bolted on. The graph carries them as a distinct kind so
that adopting one, replacing one and removing one are all ordinary operations.

The owner's framing, 2026-09-20, and it is the whole design:

> these are all judgement methodologies. parallel tracks/ways of achieving same
> process. use of which is contextual dependent. so need to formalize each but
> keep independent so can be incorporated into other skills as sub KGs.

## Parallel, not composable

Two or more methodologies may answer the same question. **Do not blend them.** A
composite — this one's vocabulary, that one's record, a third one's filter — is a
house method that cites nobody, and it inherits none of their authority while
claiming all of it. This exact mistake was made and corrected on 2026-09-20: an
analysis proposed "adopt A's vocabulary + B's record + C's filter", and the answer
was that they are parallel tracks selected by context.

So: **pick one per decision, name it, and follow it.**

## Choosing which applies

Ask in this order. The first yes decides.

1. **Do the criteria recur, with the same inputs having to produce the same
   answer?** → the computable methodology. A one-off tabled as if it recurs
   asserts a repeatability it does not have.
2. **Is the question the certainty of a body of evidence behind a
   recommendation?** → the evidence-grading methodology. Note this is about
   *evidence*, not about a design choice that happens to be uncertain.
3. **Is the context a bean recording a decision?** → the decision-record
   methodology. It constrains the record, not the method, so it composes with (1)
   or (4) rather than competing.
4. **Otherwise — a one-off choice among candidate options** → the
   decision-analysis methodology.

**If none fits, that is a finding, not a licence.** Say which question the
decision is and that no adopted methodology covers it. Do not improvise one and do
not stretch the nearest fit: either is how a house method gets in.

### Why this skill does not name them

**Deliberately.** Naming each methodology here would couple this skill to the set,
and the set is meant to be extractable — the requirement is that a methodology can
be lifted out when the field moves on or an instance needs a different one. A skill
that enumerated them could not be satisfied by a different set without a prose
edit, which would make the independence fake.

So the declared set is **the contents of the `methodology` graph**, read from the
instance's declaration. Ask for it; do not remember it.

## Adopting a new one — the ingestion process

1. **Establish it is external and named.** A methodology has an origin: authors,
   a publication, a standards body. If it has none, it is a house process — write
   it as a skill and do not dress it as an adoption.
2. **Render it faithfully, and say where the rendering stops.** The file carries
   what the method says, not a summary of what we liked. Where this platform
   adopts part of a method and refuses part, **both halves are stated with the
   reason** — a silent omission misrepresents the standard.
3. **Declare its applicability.** `applies-when` in the front matter, phrased so
   the selection question above can reach it, and saying what it is *not* for.
4. **Place it by ownership, not by convenience.** A domain-neutral method belongs
   to the harness; a domain method belongs to the repo that owns the domain. The
   separation plan decides, and the placement must make extraction literal — the
   directory lifts out, its declaration entry goes with it, and nothing else moves.
5. **Declare the directory.** A methodology outside a declared directory is
   invisible to every tool that reads the graph.
6. **State its refusals.** The part of a method a platform must not do is as
   load-bearing as the part it follows, and it is the part a later agent will
   breach first.
7. **Ingest the source and cite it as `evidence`.** `origin` names the work;
   `evidence: library/<bib-slug>` points at a copy a reader can open from this
   checkout. Use [`literature-search`](literature-search.md) to find it and
   [`library-ingestion`](library-ingestion.md) to bring it in. Where the source
   cannot be fetched, that is an outcome to report — a located-but-unreachable
   document, never a missing one — and the node keeps its `origin` with no
   `evidence` until somebody closes the gap.

## An origin nobody can open is not evidence

**Measured 2026-09-22: six methodologies cited an origin and not one of those
sources was in any declared library.** Every citation resolved against nothing
— the shape the retired skill `roles:` field cost 260 dangling values (`qif9`),
on the one kind whose entire justification is being somebody else's named,
external work.

`bun run check:methodology-evidence` is the axis that makes this visible, and
`test/results/methodology-evidence.qa-results.json` is where it is recorded. It
**reports and does not gate**: whether a methodology whose source nobody can
open may still be used is the owner's call, and a gate failing on the whole
corpus at once is one somebody switches off. Two things it does fail on — front
matter that does not validate, and an `evidence` pointing at a bib-slug no
library holds, because a citation that claims to resolve and does not is worse
than none.

**The evidence is an input to SELECTION, not only to adoption.**
`options-analysis.bpmn`'s `A_CheckEvidence` reads it before the chosen
methodology is applied. Adoption happens once; selection happens at every
decision, and a source can stop being reachable in between.

**A contested origin is recorded as contested.** `methodologies/swot.md` is the
worked example: the usual attribution is repeated everywhere and its own source
says no academic reference supports it, so the node declines to name an
inventor. Flattening that into a fact would carry the authority of a citation
while resting on nothing, which is the failure this whole section is about.

## Refusals

- **Never blend two methodologies** into one procedure. Parallel means parallel.
- **Never adopt a methodology by naming it.** A citation with no rendered method
  is an appeal to authority that no reader can check.
- **Never quantify a judgement to make it look measured.** Where a method scores
  and sums, this platform adopts the structure and refuses the arithmetic: a total
  reads as a measurement, and the weights were invented. This is the same rule as
  never quoting a count from prose as though it were evidence.
- **Never let a rejected option go unrecorded.** Whichever methodology was used,
  the alternatives and why they lost are part of the output — the same argument
  `bean-coordination` makes for `scrapped` over deleted.
- **Never write a method from recall and cite a paper nobody fetched.** Read the
  source, or say you read it through another and mark each attribution
  second-hand. See [`literature-search`](literature-search.md) §"Never fill the
  gap with recall".
{% endraw %}
