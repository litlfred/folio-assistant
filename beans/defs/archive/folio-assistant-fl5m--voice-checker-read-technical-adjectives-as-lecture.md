---
# folio-assistant-fl5m
title: 'voice checker read technical adjectives as lecturer interjections: ''Right'' was 21/22 wrong'
status: completed
type: task
priority: normal
created_at: 2026-08-24T19:12:33Z
updated_at: 2026-08-24T19:17:48Z
---

Opened retroactively: the `Right` half was fixed and pushed in `ede90c4`
without a bean, which was the omission. Auditing the rest of the rule then
found the same defect an order of magnitude larger.

`checkScholarlyDefault`'s `LECTURER_OPENER_RE` is the only `^`-anchored rule
in the voice family, it produces a **major**-severity `fail`, and it scans a
block's `.md` prose plus the docstrings of whatever `.lean` its `lean.ref`
names. Four separate false-positive mechanisms, all measured against the qou
corpus (3,579 `.md`, 3,049 `.lean`) on 2026-08-24:

| # | mechanism | corpus hits | genuine |
|---|---|---|---|
| 1 | bare `Right,?\b` read as the interjection | 22 | 1 |
| 2 | bare `So (?:...\|the)` on every "So the ..." | 246 | **0** |
| 3 | no `\b`: `the` glued through `there`/`they`/`these` | 12 (of the 246) | 0 |
| 4 | `/i` made `(?:we\|I)` match the `i` of "is" | 2 | 0 |
| 5 | wrap continuations scanned as sentence starts | 1 | 0 |

**Total: 261 hits -> 6, and all 6 remaining are real** — three second-person
("which bound you get", "Which one you see", "you find"), two "Now that ..."
draft narrations, and "Right now we encode", which mechanism 1's fix
deliberately kept.

### #2 is the one that mattered

`So the sum is well-defined`, `So the two sides line up`, `So the only
bar-asymmetric step is the /q3` — conclusion-drawing, which is what "so"
is for in mathematical prose. 94 % of every hit the criterion produced, over
18 `.md` and 190 `.lean` files, and **not one** of the 246 was the draft
narration the alternative was written for. Narrowed to the narration nouns it
was actually after (`So the plan/idea/point/upshot/thing/trick/...`), which
still catches 0 today — correctly, because the corpus contains none.

### What it was costing

**69 of the 71** blocks whose committed sidecar records a
`voice-scholarly-default: fail` pass under the fixed checker. The 2 survivors
are the same line in `HyperbolicVolumeTranscendence.lean:259` reached by two
blocks. So the criterion was reporting ~97 % noise, at `major`, to anyone
reading a QA sidecar.

### Why nothing caught it

The criterion never fired on a block until a `lean.ref` pointed at a file with
such a docstring, and a `fail` on a `major` advisory reads as a to-do rather
than a bug in the checker. The `Right` instance surfaced only because a brand
new block (`rem:tetraplectic-su2-gauge-reading`, qou bean `qou-wy6d`) became
the first to name `QuaternionicElectroweak.lean`.

### Fixes

* `Right(?:,|\s+now\b)` — the interjection always carries a comma, and
  "Right now" is lecturer cadence in its own right (`ede90c4`).
* `So the (?:plan|idea|point|upshot|deal|thing|trick|takeaway|story|moral|gist)\b`.
* `\b` on every bare-word alternative in both the `So (...)` and `Now (...)`
  groups, including after `(?:we|I)`.
* `startsSentence(prev)` — a new guard, applied at both call sites, rejecting
  wrap continuations. A line opens a sentence iff nothing precedes it, the
  previous line is blank or structural, or it ends in terminating punctuation.

16 tests added (37 pass in the file, 0 fail); full suite 724 pass / 33 skip /
0 fail; eslint clean.

### Not done

The other voice criteria were swept in the same audit and are NOT in the same
state: `voice-editorializing` produced 124 hits that are real adverbs
("merely", "trivially", "effortlessly", "cleanly"), i.e. an over-eager
advisory rather than a broken pattern. Left alone deliberately — judging those
is an authoring call, not a regex bug.

---

## CORRECTION 2026-08-24 — the impact figure was 66 -> 2, not 69 of 71

The "69 of the 71 blocks whose committed sidecar records a fail" line above
counted wrong, and the error is worth recording because it is easy to repeat.

A `.qa.json` criterion holds a **history** of entries, not one verdict. My
selector was "any entry has `result: fail`", which counts July's superseded
failures alongside current ones. `prop:joint-galois-braid-discharged`, for
instance, carries a `fail` from 2026-07-13 **and** a `pass` from 2026-07-19 —
its current verdict is pass, and it should never have been in the denominator.

Measured properly, taking the latest entry by `reviewed_at`:

    voice-scholarly-default, CURRENT verdict
      before the fix:  66 blocks failing
      after the fix:    2 blocks failing
      cleared:         64

The 2 survivors are the same genuine line —
`HyperbolicVolumeTranscendence.lean:259`, "Now that `vol_B3 = 8 · catalan_G`
symbolically, ..." — reached by `prop:volume-tower-decomposition` and
`prop:cs-evaluation-faithfulness`. That part of the original claim was right.

Everything else in this bean stands: the 261 -> 6 corpus hit count came from
running the checker, not from reading sidecars, and is unaffected.

## Sidecars refreshed, and what the refresh surfaced

The 71 selected blocks were re-swept in qou (`5951b6c26f`+). Re-running every
script criterion at its current version also flipped 11 other stale verdicts
to pass — `detangler-no-forward-ref` (3), `detangler-no-dependency-cycle` (2),
`uses-editorial-hygiene` (2), `bib-cite-resolves`, `compute-prop-has-probe`,
`compute-prop-has-consumer`, `voice-editorializing` — and revealed **four real
failures that had been hiding behind passing verdicts stamped July**. Those
are qou bean `qou-h1p7`, not fixed here: one is a Lean declaration claimed by
two statement-bearing blocks, which needs an owner decision.

