---
layout: default
title: symbiotic-interaction
parent: Skill instructions
---

{: .note }
> Generated from [`src/skills/symbiotic-interaction.md`](https://github.com/litlfred/folio-assistant/blob/main/src/skills/symbiotic-interaction.md) — do not edit here.

# symbiotic-interaction — the three registers of author input

## 0. Why this skill exists

Session transcripts show the author's inputs arriving in three distinct
epistemic registers, and mis-classifying them wastes passes in three
distinct ways: treating a flagged-gap question as a steer produces
sycophantic confirmation; over-verifying a steer wastes the author's
good correction; demanding rigor before cheaply testing an intuition
seed kills the division of labor the methodology depends on. The
formal backbone is **coactive learning** (Shivaswamy–Joachims): the
author's feedback is *α-informative* — an improvement toward the
target, not the gold standard — and convergence speed is governed by
correction quality. See the outreach note
(`docs/outreach/symbiotic-proof-authoring-note.md`
§Socratic steering, §Intuition seeding) for the cited treatment.

## 1. The three registers

| register | seed lexicon (v0 — expanded by transcript mining) | agent protocol |
|---|---|---|
| **steer** (author knows or nearly knows) | "isn't X essentially Y?", "shouldn't this be …", "what about Z here?", "I think the other point is …" | Treat as a correction *near the truth*: update the working proposal toward it, verify cheaply rather than relitigate, and do not require the author to repeat the correction. |
| **gap** (author doesn't know, and says so) | "I don't recall …", "I wish I remembered …", "is it true that …?", "not sure", "?c2?-style typed uncertainty" | The marker REMOVES the presumption of author knowledge: raise the evidence threshold, verify from primary sources or the corpus before adopting, never confirm sycophantically. |
| **seed** (author suspects a novel link) | "tenuous", "hunch", "could A be linked to B?", "feels like", any cross-domain identification offered without a citation (e.g. "the Reeb flow and Julia-set linkages") | Corpus-grep first (is it already known here?); then the **cheapest decisive (in)validation** — a structural argument or a small probe per the formalize-first discipline — reported fast; survivors get rigorized. Record novelty attribution: author-origin, with a literature-absence check. |

The division of labor the third row encodes: the human is the
generator of low-probability / high-value cross-domain hypotheses that
exist in neither the literature nor the model's usable priors; the
machine is the fast validator and rigorizer. Once a tenuous
identification is made, (in)validation is cheap — so the protocol
optimizes for never letting a seed die unexamined and never letting an
unvalidated seed masquerade as a result.

## 2. Measurement spec (new sessions and retroactive)

An **arc** is (initial agent proposal y₀; author inputs u₁…u_T with
register labels; terminal state ŷ). Metrics, computed offline by the
discussion-corpus miner (P2 of
`docs/workplans/2026-06-11-discussion-corpus-meta-analysis.md`) —
agents do not annotate live chat:

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
mapping (the #2115 archiver); no extra ceremony in-session.

## 3. Anti-patterns

1. Treating a gap-marked question as a steer (sycophantic capture).
2. Relitigating a steer the author has already given twice (wasted α).
3. Requiring a derivation before running the cheap probe on a seed —
   or the inverse, promoting an unvalidated seed into prose.
4. Flattening the registers: answering every input at the same
   evidence threshold.

## 4. Lexicon maintenance + migration

Register lexicons above are seeds: the P2 miner's `prompt-lexicon`
records expand them with observed phrasings, usage counts, and
outcomes; updates land as `skills(mining):` PRs citing source
sessions. This skill is adapter-generic and joins the Phase-5 move
list into the folio-assistant skill registry.
