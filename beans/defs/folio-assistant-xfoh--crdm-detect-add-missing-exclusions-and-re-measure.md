---
# folio-assistant-xfoh
title: 'crdm-detect: add missing exclusions and re-measure against the 71/63 baseline'
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-21T14:18:21Z
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
