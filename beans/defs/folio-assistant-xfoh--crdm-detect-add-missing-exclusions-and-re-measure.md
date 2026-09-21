---
# folio-assistant-xfoh
title: 'crdm-detect: add missing exclusions and re-measure against the 71/63 baseline'
status: completed
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-21T15:29:13Z
parent: folio-assistant-ahvw
blocked_by:
    - folio-assistant-vjbl
---

**BASELINE — measured 2026-09-18 on `main`, command `bun run eval:crdm-detect`.**
Do not quote as a current answer; re-run it.

All 27 issues in the repo (whole population, not a sample):
precision **71%**, recall **63%**, F1 **67%**.

The failure pattern is worth more than the score:
- 7 misses, including **#203 itself** — the issue that asked for the capability
  — and #1, the framework design.
- 5 false alarms: two migration **records** of completed work, two asks to
  **document** an existing pipeline, one bug report.

**Diagnosis.** `skills/folio-core/crdm-detect.md`'s "what is NOT a feature
request" list excludes CONTENT tasks (write a section, fix a typo, review a
chapter) and says nothing about records of completed work or documentation
about a feature — which is exactly what it confuses here.

**Work:** add those two exclusions, then re-run against this baseline to show
movement. Deliberately not done in the measuring commit, so a baseline exists.

---

*Claimed 2026-09-21 by session_01AYHimvYMmf8h8e9fFN6dW5, claim pushed BEFORE the work.*

**Scope note.** `vjbl` blocks treating this re-measurement as AUTHORITATIVE — not
the work itself; its own words are *"Blocks treating `xfoh`'s re-measurement as
authoritative."* Adding the two exclusions and re-running the scorer is
mechanical and produces no labels, so it proceeds with that caveat stated in
every number it reports.

The same session recorded on `vjbl` that it is **contaminated and cannot be the
second annotator**: this bean's own diagnosis gives away five of twenty-seven
labels by kind. That disqualification is for ANNOTATING, not for this.

---

## Done 2026-09-21 — 71/63/67 → **80/63/71**, and ONE of the two exclusions

Issue [#728](https://github.com/litlfred/folio-assistant/issues/728) · draft PR
[#729](https://github.com/litlfred/folio-assistant/pull/729) · session
`session_01AYHimvYMmf8h8e9fFN6dW5`.

`bun run eval:crdm-detect`, whole population, same 27 issues:

| | precision | recall | F1 | false alarms |
|---|---|---|---|---|
| baseline (re-run on claiming, reproduces exactly) | 71% | 63% | 67% | 5 |
| after | **80%** | 63% | **71%** | **3** |

`#202` and `#201` stop firing. **No true positive was silenced** — that is a
test over the whole corpus (`crdm-detect-signals.test.ts`), not an inspection,
because an exclusion that buys precision by suppressing a real detection is a
worse rule than the one it replaced.

### The bean asked for two exclusions. One shipped, and the refusal is the finding

**Shipped:** `"Migration record: …"` — a record of work already DONE. Uncontested:
both issues carry the phrase in the title, a source commit hash and *"Migrated
from"*. The pattern is deliberately narrow — `migration record` and nothing
else — because widening it to guess at other record-shaped titles would be an
exclusion with no prose behind it and no measurement either.

**Declined:** *"documentation about an existing feature"*, aimed at `#222` and
`#223`. Both labels are contestable — `#222` also says *"we also need to
reorient what is considered authoritative source vs rendered content"*, which
reads like a platform change — and `vjbl` says the labels are one unblinded
annotator's. Writing a rule to chase a label I do not believe is over-fitting
to five texts I had just read. They stay as false alarms.

### The larger defect, found while doing it

`EXCLUSIONS` sat in `scripts/eval-crdm-detect.ts` under the comment *"The
skill's explicit exclusions"* — a **hand transcription** of prose in
`methodologies/crdm/crdm-detect.md`. It had already drifted: seven bullets,
five patterns. The `jijc` shape, one fact written twice with nothing watching.

The dropped bullet was `"What does this block kind mean?"`. Falsified first —
the test was written against the shipped list and named that bullet before a
line was fixed.

The signals are now `src/crdm/detect-signals.ts`, and the transcription is
**checked in both directions**: every quoted bullet must be matched by a
pattern, and every pattern must have a bullet. The second direction is the
dangerous one — a pattern suppressing real detections with no prose to justify
it — and it had no guard at all.

### The third state: what a phrase matcher structurally cannot do

The skill's bullets are not one kind of thing. Six carry a quoted example
utterance; one states a CATEGORY — *"Bug reports about existing features"* —
that no phrase names. The runner had silently implemented the quoted ones and
reported a clean implementation of a list it had only partly implemented.

It now prints them: *"NOT IMPLEMENTABLE BY PHRASE — 1 of 8"*. So `#166`'s false
alarm is a **declared limit** of the mechanical lower bound rather than an
unexplained defect in it. `dh4f` in miniature.

**Recall did not move, and was never going to** — every one of the 7 misses is
a feature request whose phrasing the list does not carry. That is the next
bean's work, not this one's, and quoting 71% F1 as an improvement in DETECTION
rather than in PRECISION would be the overclaim.

*Numbers above are this corpus's, one unblinded annotator's (`vjbl`), not the
skill's.*

**Merged 2026-09-21** as [#729](https://github.com/litlfred/folio-assistant/pull/729)
(`5bca749dd0`), CI green on `700f6dd`, `bun run gates` 89 of 89 on the merged
tree. Issue [#728](https://github.com/litlfred/folio-assistant/issues/728) stays
OPEN — an agent does not close one on its own say-so, and its recall half is
untouched.

**What is left, and it is not this bean's.** Recall stands at 63%: seven feature
requests the phrase list does not carry, among them #203, the issue that asked
for the capability, and #1, the framework design. Widening the CATEGORIES is a
different risk from narrowing the exclusions — every pattern added there can
only cost precision — so it wants its own baseline and its own bean.
