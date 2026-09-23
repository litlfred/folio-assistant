---
name: methodology-adoption
description: >
  How a named external methodology enters the knowledge graph, and how an agent
  picks which one applies. Read before following a judgement method, before
  adopting a new one, and before writing a house method instead of adopting one.
---

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

## Node, skill, or both? — the question RACI made somebody ask

An adopted methodology can produce up to two artefacts, and which ones is not
obvious. Settled by the owner 2026-09-22 (bean `2xfl`), after `raci` spent
months as a skill with no node and the methodology graph could not see the one
methodology this repository uses on every diagram.

| you are writing | it is a **node** in the `methodology` graph | it is a **skill** |
|---|---|---|
| what the method IS — its vocabulary, its constraints, what it refuses | ✅ | ❌ |
| how to PERFORM it here — the extension element, the gate, the procedure | ❌ | ✅ |
| a house process with no external origin | ❌ | ✅ — and do not dress it as an adoption |

**Most adoptions produce both, and the split is the same every time:** the node
is the method, the skill is this platform's application of it. The skill names
the node and does not restate it, because two files carrying one definition is
two copies free to drift.

Three worked cases, each a different answer:

- **`raci`** — both. The four letters and the one-Accountable rule are the
  method (node); reading R from the BPMN lane, the `folio:raci` element and
  `check:raci` are this platform's application (skill).
- **`crdm`** — skill only, and correctly so. It is a house method with no
  external origin, and §"Adopting a new one" step 1 says such a thing is a
  skill. A node for it would be the dressing that rule forbids.
- **`swot`** — both, written that way from the start.

**A methodology in use with no node is invisible to the graph**, which is what
`2xfl` recorded: `check:methodology-evidence` counted the nodes and RACI was
not among them, so a reader asking "what methodologies does this repository
adopt?" got an answer that omitted one they had just used.

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

## Extract the PROCESS, not the paper's tools

**A source that presents a method through an implementation is presenting two
things, and only one of them is the methodology.** The owner, 2026-09-23, on
ingesting a tool paper:

> do not need to match tools in paper, start with process, determine most
> appropriate tools (known or which can be added)

So the order is: render the method, *then* ask what this platform should use to
perform it. A node that adopted the source's tool stack would be adopting an
implementation and calling it a method — and it would be unfalsifiable in the
worst way, because the tools would work and the method would never be examined.

`hybrid-llm-deterministic` is the worked case. Its source demonstrates the
method in one tool with one model and one expression language; the node renders
the rule/result inversion, the five safeguards and the bounded-truncation
technique, and §"Where this rendering stops" names every tool it declined to
adopt and why. The method survives replacing all of them, which is the test of
whether you extracted a method at all.

**Ask it as: what would still be true if they had built it differently?** What
survives is the methodology. What does not is their engineering, and it belongs
in the skill if anywhere — where this platform's own tool choices already live.

**And say what the source does NOT establish.** A demonstration is not an
evaluation. Where a paper shows an approach working once, with no baseline and
no measurement, the node records that no performance claim rests on it. Doing
otherwise manufactures a finding the authors did not make — the same failure as
§"Never quantify a judgement to make it look measured", arriving through a
citation instead.

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
