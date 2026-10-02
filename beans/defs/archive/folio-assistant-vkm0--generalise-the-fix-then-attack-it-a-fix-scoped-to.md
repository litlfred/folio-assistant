---
# folio-assistant-vkm0
title: 'GENERALISE THE FIX, THEN ATTACK IT: a fix scoped to the wrong thing, and the adversarial pass that catches it'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T20:13:37Z
updated_at: 2026-09-23T20:26:56Z
parent: folio-assistant-p5wm
---


Owner, 2026-09-23: *"schema modeling/paper writting/software big fixing skill
update: try to generalize pattern of a fix. adversarty skill, did you
genrealize too much... are you picking up unindeneded things."*

## One skill, not two

The adversary has **no subject until a generalisation exists** — "did you
generalise too much" cannot be asked of nothing. So they are two moves in one
file, in order, rather than two skills that would each be half a thought.

`surprise-to-corpus` is adjacent and answers a different question: what was
unexpected, and does it belong in the corpus. This one asks whether a fix is
aimed at the right class.

## The shape

**Move 1 — what class is this?** Three questions: what was the defect as
opposed to the symptom; what else has this shape (sweep the corpus, do not
guess); is the fix at the right layer.

**Move 2 — the adversary.** One question answered in writing: *what does this
fix now apply to that the defect did not?* Two axes that go wrong
independently, SCOPE (which things) and STATE (when), with four tells and the
rule that a generalisation excusing everything has deleted the check.

**Move 3 — falsify the guard.** Reintroduce the defect, watch the guard fail,
restore. A guard that would not have caught the bug cannot be told from a good
one by reading it.

## Written from five fixes in one session, and both directions are represented

| bean | what it teaches |
|---|---|
| `vfr8` | BOTH axes widened — a rule for one panel applied to the whole sidebar in every state. And the adversarial measurement REVERSED the conclusion: the old value failed the case it was written for, so there was no trade |
| `vq8g` | detector too narrow, and the corpus sweep found a SECOND error direction nobody had reported (`dhvf` counted 10 for 4) — which changed the design to "most structured wins, never summed" |
| `o5qj`, `thux` | findings no permitted action could clear; and `thux` keys on the RELATION (`parent`) rather than the label (`type: epic`) |
| `tcq2` | the constraint was two layers above where the fix felt like it belonged |

## Deliberately not

Not "generalise everything" — *"nothing else has this shape"* is a complete and
common answer, and one example is not a class. Not a replacement for a test:
whether the fix works comes first. And not a licence to decide a trade the
owner should decide — `tcq2`'s corner magnifier under the staging banner is
reported with both options rather than picked.

Schema changes and paper claims get their own section, since the owner named
all three: for a schema, scope is *which records must now satisfy this* and
state is *from when*; for a claim, the generalisation is the hypothesis and the
falsification is the counterexample you look for on purpose.

## Done when

- [x] The two moves are in one file, in order, with the reason stated
- [x] Both error directions are represented, not just over-generalisation
- [x] The four over-reach tells are each tied to a measured example
- [x] "Keep the discrimination" has a worked case that must still fire
- [x] Falsification is a step, not advice
- [x] Schema modelling and paper writing are covered, as the owner asked
- [x] Generated skill docs, kg-audit, docs-auto and detangle regenerated rather than hand-edited

Parent `p5wm`.
