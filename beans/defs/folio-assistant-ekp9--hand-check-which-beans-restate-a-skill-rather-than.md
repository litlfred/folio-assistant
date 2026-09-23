---
# folio-assistant-ekp9
title: 'HAND-CHECK: which beans restate a skill rather than record an outcome — the ground truth `check:bean-restates-skill` is measured against'
status: in-progress
type: task
created_at: 2026-09-23T21:09:53Z
updated_at: 2026-09-23T21:09:53Z
parent: folio-assistant-1swy
---

Read each bean that shares substantial prose with a skill, decide whether the sharing is a
legitimate **outcome record** or a **live restatement** that can drift, and record the verdict.
Ground truth for the sibling session's `check:bean-restates-skill`.

Issue: #1187. Worked example of the correct post-repair shape: `kn0t` on `main`, repaired in #1185.

## Why — the defect, already paid for

`kn0t` held a second copy of the contract in
[`fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md`](../../fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md),
drifted in four places. The worst: the bean's P1 exit criterion read *"navigation matches the
Publisher's for one IG"* where the skill requires the derived navigation be **diffed** against
the Publisher's with the difference **empty or explained entry by entry**. "Matches" is an
impression; a diff is a measurement.

`AGENTS.md`'s banner is the general rule: *where a skill and a copy disagree, the skill wins
and the copy is wrong.*

## The candidate set does not reproduce from the method as stated — RE-DERIVED 2026-09-23

The previous session's recipe, followed as written — lowercase words of length > 2, backticks
and markdown links stripped, every 10-word shingle of every skill under `**/skills/**/*.md`
indexed, `/docs/reference/` excluded as generated — gives **different numbers from the ones it
reported**, and a different ranking. Both runs are recorded because the disagreement is itself
the finding: **the candidate set is not reproducible from its own description.**

| corpus scanned | statuses counted | share >= 1 | share >= 25 |
|---|---|---|---|
| `beans/defs/*.md` | todo + in-progress | 77 | **12** |
| `beans/defs/*.md` | + completed | 212 | **42** |
| `beans/defs/**/*.md` (incl. `archive/`) | todo + in-progress | 77 | **12** |
| `beans/defs/**/*.md` (incl. `archive/`) | + completed | **257** | **51** |
| *previous session* | *"open"* | *254* | *38* |

Two things follow. The previous session's **254** matches the corpus **including `archive/`**
and counting `completed` beans (257 here), so its "open" did **not** mean todo + in-progress —
under that reading the figure is 77. And its **38** matches nothing here at any threshold on
any corpus.

The ranking differs too. All ten beans it named as top hits exist, and every one of them is
`completed` today; the top-matching **skill** agrees for all ten, but no count does:

| bean | skill | previous session | re-derived |
|---|---|---|---|
| `7pdi` | `adjudication` | 119 | 106 |
| `f258` | `surprise-to-corpus` | 102 | 106 |
| `xies` | `kg-to-portal` | 93 | **117** (rank 1, not 3) |
| `9c34` | `incremental-render` | 86 | 98 |
| `augv` | `harness-tiles` | 85 | 87 |
| `hajp` | `interaction-modality` | 78 | 79 |
| `1hvo` | `theme-art-intake` | 77 | 75 |
| `cekz` | `kg-contribution-offer` | 74 | 80 |
| `3nfv` | `session-state-machine` | 66 | 70 |
| `s8mo` | `session-context` | 65 | 67 |

Counts move in both directions, so this is a tokenisation difference and not a corpus
difference. **The skill each bean matches is stable; the number attached to it is not** — which
is the argument for classifying by reading rather than by score, made by the score itself.

**The set worked here is therefore the superset**: `beans/defs/**/*.md` including `archive/`,
every status except `scrapped`, sharing >= 25 ten-word runs — **51 beans**. That covers the
previous session's 38 under every reading of "open" it could have had, and contains all ten
beans it named.

## Method

Comparable claims about the same named object, not similarity. The previous session's
similarity detector produced 134 candidates that were almost entirely backticks and line
wrapping, and scored all three of `kn0t`'s real drifts **below its own 0.55 floor** (0.25,
0.54, 0.33). The shingle overlap is used only to say *where to look*; the verdict is a reading
of both texts.

Verified against `kn0t`: the method must independently re-find its drifts in the pre-repair
text. If it cannot, the method is wrong rather than the corpus.

## Done when

- [ ] all 51 candidates classified, each with a one-line reason
- [ ] every `already drifted` finding quotes **both** sides verbatim, names the skill as
      authoritative, and says what acting on the bean would have cost
- [ ] counts reported per category, never a bare total
- [ ] disagreements with the sibling session's structural rule named explicitly, so the rule is
      what gets fixed
- [ ] repairs **proposed, not applied** in bulk — the owner chooses
