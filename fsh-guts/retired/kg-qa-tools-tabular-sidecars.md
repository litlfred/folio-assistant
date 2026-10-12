---
$schema: folio-fsh-guts/v1
title: "Dead kg-qa sidecars for tabular-csv and tabular-xlsx"
kind: retired-sidecars
movedOn: 2026-10-12
movedFrom: "cat-harness/test/results/kg-qa/tools/tabular-{csv,xlsx}.kg-qa.json (cat-harness 099e745)"
summary: >-
  Two kg-qa sidecars in cat-harness audited the Tools tabular-csv and
  tabular-xlsx, which moved to folio-assistant-core (bean cat-tools-1wre).
  cat-harness no longer declares those Tools, so the sidecars judged a
  subject cat-harness does not own, and skill:register (kg:audit) failed on
  them, which failed the QA working copy on folio-assistant#2529. Moved
  here on the owner's instruction, 2026-10-12: "move requested files to
  fsh-guts".
---

# Dead tabular kg-qa sidecars, 2026-10-12

`kg-qa-tools-tabular-csv.kg-qa.json` and `kg-qa-tools-tabular-xlsx.kg-qa.json`
beside this file are the two sidecars byte for byte as they stood on
cat-harness `099e745` at `test/results/kg-qa/tools/`. The Tools they audit are
now declared in `folio-assistant-core/tools/index.ts`, whose own audit writes
their sidecars.
