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
