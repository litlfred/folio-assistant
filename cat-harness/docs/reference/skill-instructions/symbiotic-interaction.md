---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'symbiotic-interaction'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/symbiotic-interaction.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/symbiotic-interaction.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/symbiotic-interaction.md){: .fa-edit-source }

{% raw %}
# symbiotic-interaction — the three registers of author input

## 0. Why this skill exists

Session transcripts show the author's inputs arriving in three distinct
epistemic registers, and mis-classifying them wastes passes in three
distinct ways: treating a flagged-gap question as a steer produces
sycophantic confirmation; over-verifying a steer wastes the author's
good correction; demanding rigor before cheaply testing an intuition
seed kills the division of labor the methodology depends on. The formal
backbone is **coactive learning** (Shivaswamy–Joachims): the author's
feedback is *α-informative* — an improvement toward the target, not the
gold standard — and convergence speed is governed by correction
quality.

## 1. The three registers

| register | seed lexicon (v0 — expanded by transcript mining) | agent protocol |
|---|---|---|
| **steer** (author knows or nearly knows) | "isn't X essentially Y?", "shouldn't this be …", "what about Z here?", "I think the other point is …" | Treat as a correction *near the truth*: update the working proposal toward it, verify cheaply rather than relitigate, and do not require the author to repeat the correction. |
| **gap** (author doesn't know, and says so) | "I don't recall …", "I wish I remembered …", "is it true that …?", "not sure", typed uncertainty markers | The marker REMOVES the presumption of author knowledge: raise the evidence threshold, verify from primary sources or the corpus before adopting, never confirm sycophantically. |
| **seed** (author suspects a novel link) | "tenuous", "hunch", "could A be linked to B?", "feels like", any cross-domain identification offered without a citation | Corpus-grep first (is it already known here?); then the **cheapest decisive (in)validation** — a structural argument or a small probe per the formalize-first discipline — reported fast; survivors get rigorized. Record novelty attribution: author-origin, with a literature-absence check. |

The division of labor the third row encodes: the human is the generator
of low-probability / high-value cross-domain hypotheses that exist in
neither the literature nor the model's usable priors; the machine is the
fast validator and rigorizer. Once a tenuous identification is made,
(in)validation is cheap — so the protocol optimizes for never letting a
seed die unexamined and never letting an unvalidated seed masquerade as
a result.

## 2. A steer that corrects a RULE lands in the SKILL — same turn (STRICT)

§1's steer row ends *"do not require the author to repeat the correction."*
Applied to the **artefact alone**, that clause is broken — just not within the
session where it looks kept. The proposal is fixed, the rule that produced the
proposal is not, and the next session is a fresh context that never saw the
chat. It produces the same proposal, and the author corrects it again.

**Requiring the correction twice is requiring it repeatedly.** The only thing
the chat-only fix changed is the interval between the repeats, and an author
who has to re-teach a rule every session is paying the cost this whole skill
exists to lower. For an author with limited hand function that cost is keystrokes
([`interaction-modality`](interaction-modality.md) §0).

The owner stated it as a rule on 2026-09-21: *"update skills in fedback like
this."*

> **A steer that corrects a rule is not applied — it is WRITTEN DOWN: in the
> skill that governs the thing corrected, in the same turn, with the author's
> words quoted and dated.**

### Is this steer rule-level? Three questions

A steer about the artefact in front of you is an edit. A steer about **how that
kind of artefact is decided** is a rule, and the difference is not tone — the
author says both in the same register, often in the same sentence. Ask:

1. **Would an agent with no memory of this chat make the same mistake again?**
   If the correction lives only in a file that agent will not read as a *rule*,
   yes.
2. **Does it generalise past this artefact?** *"Call it `voices/` here"* is an
   edit. *"Voices belong to the instance that owns them semantically"* decides
   every future placement.
3. **Is there already a rule that this CONTRADICTS?** Then the edit is not
   optional and not additive: the old rule is wrong and stays wrong until it is
   replaced. A correction filed beside a rule it contradicts is worse than not
   filing it, because the next agent finds two answers and picks one.

Any yes makes it rule-level. A **gap** or a **seed** (§1) never is — a flagged
unknown is not a ruling, and treating one as a rule is §3's first anti-pattern
with a durable artefact attached.

### Same turn, quoted, dated

- **Same turn.** Not "noted for later" and not a bean saying the skill should be
  updated. A bean that records a rule is a rule in the wrong graph: `beans/` is
  `state`, the skills are `context`, and a reader looking up how something is
  decided reads the skill.
- **Quoted.** The author's own words, verbatim, typos included — they are the
  primary source, and a paraphrase is the agent's reading of them standing in
  for the ruling itself. `schema-management` §"Where a viewer publishes"
  is the shape: the quote, then the table it produced.
- **Dated.** A rule with no date cannot be told from a rule that was superseded,
  and this repository supersedes its own rules often enough that the
  distinction is load-bearing.

### You do NOT ask permission to fix a rule the author just corrected

[`kg-contribution-offer`](kg-contribution-offer.md) says the agent never picks a
destination silently, and that is about **manufacturing a node** from agreed
requirements — work whose shape nobody has ruled on. This is the opposite case:
the node exists, it is wrong, and the author has just said so. Asking *"shall I
write that into the skill?"* asks them to repeat the correction, which is the
failure at the top of this section.

The two do not overlap, and the line is: **does the rule already have a home?**
If yes, the correction goes there now. If the correction implies a skill that
does not exist, that is a new node and `kg-contribution-offer` governs it —
except where the author said outright it should be one, as in the first worked
example below.

### Worked examples — three from 2026-09-21

| the steer | where it landed | why there |
|---|---|---|
| *"THAT should be a skill, collision=coordinate, potentail colliosn by looking at beans = coordinate"* | [`coordinate`](coordinate.md), two new triggers | rule-level on all three questions, and the author named the destination outright — no offer to make |
| *"voices should be associated to appropriate home semantically/by judgement"* | `schemas/voice-skill.ts`, replacing the ownership rule | question 3: it **contradicted** a standing mechanical rule (the instance that *derived* a voice owns it), which the corpus had already falsified twice. Additive filing would have left two answers |
| *"harness handler wins."* | `gen-handler-index.ts`'s module doc and bean `8h42` — **and nowhere else, which was the defect** | question 2: it settles a collision between the TWO PATH RULES, so it belongs in [`schema-management`](schema-management.md) §"Where a viewer publishes" beside them. It was filed as a fact about one generator instead. Found by writing this section, and fixed in the same change |

A fourth, made **after** this section existed and the first to be governed by
it rather than reconstructed: asked to settle a voice's `provenance`, the owner
refused the recommended option and gave the reason —

> voices may be comprised of many composite voices w/ unclear attribution.
> attrinution by rule makes no sense in a collaborative/synethsizing process.

The *decision* was one field left alone. The **reason** is a durable claim
about what a voice is, and it is what stops the next agent proposing the same
refactor from the same corpus measurement. It went into
`schemas/voices.ts`'s `VOICE_PROVENANCE` gloss, quoted and dated, in that turn.

**A refusal is a ruling.** An answer that declines your recommendation carries
at least as much rule as one that accepts it — usually more, because it tells
you something about the domain your analysis did not have.

The third row is the honest one. It is not a counter-example showing where the
rule stops — it is this rule catching, on its first application, a case the
agent that wrote it had got wrong four hours earlier. A rule whose first use
finds nothing is a rule that was already being followed.

## 3. Measurement spec (new sessions and retroactive)

An **arc** is (initial agent proposal y₀; author inputs u₁…u_T with
register labels; terminal state ŷ). Metrics, computed offline by a
discussion-corpus miner — agents do not annotate live chat:

- **T** — author turns to acceptance.
- **α̂** — mean fractional gap closed per steer (successive-proposal
  distance toward ŷ; the miner's distance proxy is recorded with the
  estimate). This is the empirical constant of the coactive bound.
- **outcome** ∈ {converged, abandoned, diverged}.
- **gap-honored?** — after a gap marker, did the agent verify
  independently before adopting?
- **seed metrics** — validation latency (turns to verdict), verdict ∈
  {validated→rigorized, refuted, undecidable-cheaply}, and the
  literature-absence check for novelty attribution.

Linkage to artifacts is via the existing commit-trailer ↔ session
mapping; no extra ceremony in-session.

## 4. Anti-patterns

1. Treating a gap-marked question as a steer (sycophantic capture).
2. Relitigating a steer the author has already given twice (wasted α).
3. Requiring a derivation before running the cheap probe on a seed —
   or the inverse, promoting an unvalidated seed into prose.
4. Flattening the registers: answering every input at the same
   evidence threshold.
5. **Applying a rule-level steer to the artefact and not to the rule**
   (§2). It looks like compliance for one turn and guarantees the
   author re-teaches the same rule in the next session — the
   cross-session form of anti-pattern 2.
6. **Filing a rule-level steer as a bean** instead of editing the
   skill. A bean says work is outstanding; the work here is the edit,
   and it takes less time than the bean.

## 5. Lexicon maintenance

Register lexicons above are seeds: a corpus miner's `prompt-lexicon`
records expand them with observed phrasings, usage counts, and outcomes;
updates land as mining PRs citing source sessions. This skill is
adapter-generic.
{% endraw %}
