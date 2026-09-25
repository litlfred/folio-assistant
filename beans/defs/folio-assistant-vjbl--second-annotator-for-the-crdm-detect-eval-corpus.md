---
# folio-assistant-vjbl
title: Second annotator for the crdm-detect eval corpus
status: completed
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

- [x] A **blinded view** of the corpus — `number`, `title`, `text` only — so
      inspecting the data cannot leak a label. Trivial to emit; it does not
      exist today
- [x] The diagnosis in `xfoh` and the hard-case list here moved behind a
      pointer the annotator is told **not** to open until after labelling, or
      a stated acceptance that both are contaminating and the annotator must
      come from outside this work plan
- [x] A stated answer to **who** may annotate: a second agent that has read
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


--------

## 2026-09-24 — done blind, owner's choice: **"Fresh blind agent"**

- **Blinded packet** (`scripts/eval-crdm-detect-blind.ts pack`): opaque ids
  (`b01`…), title and text only. crdm-detect.md is included with only the
  paragraph naming corpus issues removed: it stated #187's and #199's labels.
  The key stays apart from the packet.
- **The annotator** was a fresh agent told to read only the three packet
  files. It confirmed it did; its session context held AGENTS.md, which it
  did not use.
- **Result:** 21 true / 6 false. Against the first labels, **23/27 raw,
  Cohen's kappa 0.62** (`agree`). The labels are kept as
  `scripts/eval/crdm-detect-second-annotator.json`, keyed by issue number.

The four disagreements:

| issue | first | second | turns on |
|---|---|---|---|
| #27 | feature | not | the text reads "Delivered… closing as done", so it is a record |
| #187 | not | feature | the owner's 6o1z ruling, "label the action requested", which the blind annotator could not know |
| #222 | not | feature | "document the pipeline", but also "formalize as a DAK .ts content object" |
| #223 | not | feature | "a doc note", but also asks for a repo split and a migration plan |

Adjudicating them is the owner's call. Until that is done, 71% / 63% is a
property of labels two raters agree on at kappa 0.62, not of the skill alone.

## Summary of Changes

The second annotator was produced blind (see above): a packet generator plus a kappa scorer (`eval-crdm-detect-blind.ts`, with tests) and the committed second labels. 23/27 agree, kappa 0.62. Adjudicating the four disagreements is left to the owner.

## Owner adjudication, 2026-09-24: **all four are feature requests**

The owner ticked #27, #187, #222 and #223. #27 was already `true`; #187, #222
and #223 flip to `true`. Each `why` now quotes the adjudication. #187's
supersedes the 6o1z rule, "label the action requested".

`bun run eval:crdm-detect`, with the DATA hash moving `d211c42e` → `2e3ab7fa`:

| | precision | recall | F1 | missed | false alarms |
|---|---|---|---|---|---|
| before | 86% | 100% | 93% | — | #166, #222, #223 |
| after | 95% | 95% | 95% | #187 | #166 |

**Consequence for the detector, left to the owner:** the anchor on
`^proposal:` existed because the unanchored form "cost #187". It now costs
nothing and would catch #187 (recall 100%). The detector is unchanged, since
changing it to fit its own 27-item eval set is tuning to the test.
`crdm-detect-signals.test.ts` and the skill now say so instead of carrying
the old argument.
