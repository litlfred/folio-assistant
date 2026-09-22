---
# folio-assistant-xp72
title: 'SCALE FIXTURE: a before/after large-document pair with a golden ChangeSet and a measured performance budget'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-22T21:04:32Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
---

**Why.** Every child can pass on a ten-block fixture and fall over on a real
handbook. Performance, the heat map's legibility at 2,000 cells and the
navigation's usefulness can only be judged at scale.

**Candidates, measured 2026-09-22:**
- `smart-immunizations/`: 748 artefacts indexed, 200 materialised. It is
  **provisional** (nsbb may remove it) and deliberately renders no HTML, so it
  can only feed the structural renderer (child 05, case 4).
- An L1 handbook ingested through child 03. This is the real target, and it
  depends on that child.
- lx2s's "immunization-schedule before/after committee" scenario is the
  end-to-end story to walk.

**What.** One committed fixture pair (a before and an after with a known
ChangeSet: an insert, a move, a rename, an edit and a removal), plus a
performance budget. Proposed budget: the review page is interactive in under
2 s for 2,000 blocks on the CI runner. That number is a proposal to be
measured, not a fact.

## Done when
- [ ] the fixture is committed, with its expected ChangeSet as a golden file
- [ ] the budget is measured and recorded, then enforced in the browser gate
- [ ] the lx2s committee scenario has been walked through the review page, with screenshots on the PR


## Roast correction 2026-09-22 (epic q4jm, R7)

There is no in-repo folio to borrow: `folio-assistant-core/folios/` is a README, and smart-immunizations renders no HTML. The fixture is **synthetic**, or comes from xtpc's ingest.
