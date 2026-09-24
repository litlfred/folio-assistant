---
# folio-assistant-vjbl
title: Second annotator for the crdm-detect eval corpus
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T15:07:53Z
parent: folio-assistant-ahvw
---

The `crdm-detect` eval's ground truth is **one annotator's, unblinded** — the
same agent wrote the labels and the scorer. That is the first thing to fix
before quoting 71% / 63% as a property of the skill rather than of this corpus.

Each label in `scripts/eval/crdm-detect-corpus.json` carries a one-line reason,
so a second annotator can disagree with a specific claim rather than the whole
set. The hard cases to look at first are the ones that turn on intent rather
than wording: #187 (asks for a document ABOUT features), #222 (document the
current-state pipeline), #243 (write a code policy).

Blocks treating `xfoh`'s re-measurement as authoritative.

---

## 2026-09-21 — **this bean disqualifies its own reader, and that is a defect in the bean**

session_01AYHimvYMmf8h8e9fFN6dW5 picked this up, got as far as inspecting the
corpus, and **stopped without annotating**. Not blocked by anything external:
by the time the work could start, the agent was no longer independent.

### What contaminates an annotator, and where each piece lives

| source | what it gives away |
|---|---|
| `xfoh`, the sibling this bean blocks | the **diagnosis**: *"5 false alarms: two migration records of completed work, two asks to document an existing pipeline, one bug report"* — five of twenty-seven labels, by kind, with the direction of the error |
| **this bean**, four lines up | three issue numbers named as the hard cases, and what each turns on |
| the corpus file itself | `isFeature` and `why` sit in the same object as `title` and `text`, so **any** structural inspection exposes a label — #243's was read while checking the schema |

That is roughly a fifth of the corpus known by kind, three items flagged, and
one exact label — before a single judgement was made.

### Why this is the bean's problem rather than that agent's

The agent did what this repository requires: read the bean, read the sibling it
blocks, look at the data. **Every one of those steps is contaminating**, and
the order cannot be rearranged to avoid it — the diagnosis lives in the bean
whose authority depends on this one.

So the blind second annotator this bean asks for **cannot be produced by an
agent that prepared for the task properly.** A kappa computed after that
reading would look like validation and be worth less than nothing: it would
agree with labels it had been told the shape of.

### What the bean needs before anyone attempts it again

- [ ] A **blinded view** of the corpus — `number`, `title`, `text` only — so
      inspecting the data cannot leak a label. Trivial to emit; it does not
      exist today
- [ ] The diagnosis in `xfoh` and the hard-case list here moved behind a
      pointer the annotator is told **not** to open until after labelling, or
      a stated acceptance that both are contaminating and the annotator must
      come from outside this work plan
- [ ] A stated answer to **who** may annotate: a second agent that has read
      neither bean is possible; the owner is possible; an agent that has read
      this thread is not

*Recorded without claiming the bean — the work is untouched and remains
available. What changed is that the trap is now written down instead of being
walked into again.*

---

## 2026-09-21 — one hard case is sharper than "turns on intent": `6o1z`

The list above names #187 as turning on intent. Measured while working `9gtc`,
it is not a judgement call at all: **#187 and #199 are the same artefact —
the ask for a change-register write-up, and the write-up — and they carry
opposite labels.** Either both are feature work or neither is.

That is `6o1z`, opened unclaimed because the same session found it and cannot
decide it. It is a narrower and more checkable question than this bean, and
resolving it does not require re-annotating all 27: it requires deciding two
labels *together*.

It also inherits this bean's own defect. Reading `6o1z` gives away two labels,
so the pool of agents who may annotate this corpus shrinks every time somebody
writes down what they found. That is worth saying out loud rather than
discovering a third time.

## 2026-09-24 — `6o1z` decided by the owner: the split stands

The owner, asked to rule on #187 and #199 together, chose **"Keep the split"**:
the corpus labels **the action asked of the agent, not the subject matter**.
#187 asks for a document to be written (`isFeature: false`); #199 *is* the set of
requested platform changes (`isFeature: true`). Both corpus `why` lines now say
so, citing the decision.

So #187 is no longer a hard case "turning on intent", and it does not
"contradict #199": the two differ on exactly the axis the label measures. A
second annotator should treat that axis — action requested vs. subject matter —
as the corpus's stated convention and disagree with it explicitly if they do,
rather than rediscovering the pair. No label flipped; `eval:crdm-detect` stays
at precision 86% / recall 100% / F1 93% over 27.
