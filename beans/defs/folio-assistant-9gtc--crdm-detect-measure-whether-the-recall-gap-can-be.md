---
# folio-assistant-9gtc
title: 'crdm-detect: measure whether the RECALL gap can be closed by phrases at all'
status: completed
type: task
priority: normal
created_at: 2026-09-21T16:20:20Z
updated_at: 2026-09-21T16:30:20Z
parent: folio-assistant-ahvw
blocked_by:
    - folio-assistant-vjbl
---

**BASELINE — `main` at `5bca749`, `bun run eval:crdm-detect`.** Whole 27-issue
population: precision **80%**, recall **63%** (12 of 19), F1 **71%**. Re-run it;
do not quote this as a current answer.

Sibling of `xfoh`, which closed the *precision* half. This is the other half and
it is **not the same job**.

## The asymmetry, which is the whole design constraint

`xfoh` narrowed the EXCLUSIONS. Every pattern added there can only turn a false
alarm into a true negative — it cannot cost recall, and the one direction that
could (silencing a true positive) was closed with a corpus-wide test.

Widening the CATEGORIES is the mirror image: **every pattern added there can
only cost precision.** It turns a true negative into a false alarm, never the
reverse. So the acceptance test is not "recall went up":

> recall up **and precision not down**, over the whole population.

A candidate that costs a true negative is rejected unless it buys more than one
miss, and the guard test is written before the patterns.

## The seven misses

`#232` getting started · `#205` RAG ingestion proposal · `#203` business
requirements gathering (CRDM) · `#199` IG incremental build register ·
`#194` IG Publisher micro-asks · `#192` incremental build decisions · `#1` add
assistant framework.

`#203` is the issue that asked for this capability. `#1` is titled *"add
assistant framework"* — three words.

## What would falsify the approach

If the seven share no phrasing the eight true negatives do not also carry, then
**there is no pattern to add**, and the honest outcome is a recorded NEGATIVE
RESULT: the phrase list is at its ceiling on this corpus and recall needs
judgement rather than phrases. That finding is worth as much as a fix and
must be shipped rather than swapped for a pattern tuned to reach a number.

## Done when

- [ ] Each of the seven read, and a candidate signal named or the miss recorded
      as unreachable by phrase, with the reason.
- [ ] Guard test written FIRST: precision does not fall, over the whole corpus.
- [ ] Re-measured against 80/63/71, and the movement reported as precision AND
      recall — never F1 alone, which hides a trade.
- [ ] `bun run gates` green.

## Caveat that rides every number

`vjbl`: the labels are one unblinded annotator's. A "miss" is a miss against a
label nobody has independently confirmed.

---

## Done 2026-09-21 — the falsifier did NOT fire, and the guard I wrote first was wrong

`bun run eval:crdm-detect`, whole 27-issue population:

| | precision | recall | F1 | misses | false alarms |
|---|---|---|---|---|---|
| baseline (`main` @ `5bca749`) | 80% | 63% | 71% | 7 | 3 |
| after | **86%** | **100%** | **93%** | **0** | 3 |

Precision ROSE rather than holding, because the false-alarm set never moved
(#223, #222, #166 — the same three) while true positives went 12 → 19.

### Read this number as a FIT, not as a validation

The four signals were designed by reading the seven misses **in this corpus**,
then measured on it. That is training and testing on the same data. 27 issues is
the whole population here, so there is no held-out set to be had, and none can
be manufactured by splitting — a split of the population is not a sample of
anything wider. **Recall 100% means the phrase list CAN reach every miss here;
it says nothing about an issue written next week.** The only real test is issues
arriving, which is an argument for re-running the eval as the corpus grows, not
for quoting 93% as a property of the skill.

### The four signals, and what each cost

| signal | caught | true negatives lost |
|---|---|---|
| `upstream (asks\|change)` | #199, #194, #192 | none |
| `(the )?agents? (should\|needs to\|will need to\|must)` | #232, #203 | none |
| `^Proposal:` (line-anchored) | #205, #199 | none |
| `design document` | #1 | none |

**The biggest gap was the plainest phrasing.** The skill listed the diffident
form — *"it would be great if the agent COULD …"* — and not *"the agent
should …"*, which is how people actually ask. It caught #203: the issue that
asked for CRDM in the first place was invisible to CRDM's own detector.

`design document` is the weakest of the four — n=1, one phrase found after
reading the one document it catches. Recorded as the most likely to be overfit.

### A sixth category, and it is the mirror of an exclusion

`self-declared-genre`: a document that says what it is in its opening line. The
exclusion side already had one (`"Migration record: …"`), so the detection side
having one is symmetry rather than invention, and the five original categories
are untouched, which keeps every earlier measurement interpretable.

### The same drift, on the other half of the same file

`xfoh` closed exclusion drift and left detection drift open. `categoryDrift`
found one immediately: **`"when any user …"` had been in the prose with nothing
implementing it.** It changes no verdict on this corpus; it is implemented
because the skill says it. The check is ONE-directional for categories and
two-directional for exclusions, and the asymmetry is in the code: the exclusion
list is closed, the detection sections are explicitly open.

### The guard I wrote first did not work, and that is the finding worth keeping

The first gate asserted precision stays at or above the 0.80 floor. Its own
falsification — the unanchored `proposal` candidate, which costs #187 — measures
**82.6%** and sails through, because seven new true positives landed in the same
numerator.

**A guard a rejected candidate passes is not a guard.** It is this bean's own
rule one level down: *never report F1 alone, it hides the trade*. Precision is
an aggregate too and hides the same trade the moment recall moves. The gate is
now the false-alarm SET — no issue may start firing that was not already — and
the floor is kept only as a second, weaker signal with a test recording that it
is not what rejected the candidate.

### #187 and #199 are the same artefact, labelled opposite

Found while measuring, and it is a LABEL finding, not a phrase one. #187 asks
for *"a document that outlines fully the requested changes"*; #199 **is** that
document. One is labelled not-a-feature, the other a feature. Any unanchored
`proposal` pattern must choose between them. The anchor is what keeps the
distinction: a document that MENTIONS a proposal is not one.

Left for whoever is not contaminated (`vjbl`): whether that pair is labelled
right at all. Not re-annotated here.

## Caveat that rides every number

`vjbl`: one unblinded annotator's labels, and the patterns were fitted to the
misses they define.
