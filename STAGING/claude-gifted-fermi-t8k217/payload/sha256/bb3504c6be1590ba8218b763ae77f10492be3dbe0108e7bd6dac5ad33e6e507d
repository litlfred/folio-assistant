---
# folio-assistant-w1gy
title: 'Separation stage 5: QA both new repositories from fresh sibling clones'
status: todo
type: task
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-01T06:58:02Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-iai8
---

Stage 5 of the split plan: QA from scratch. Fresh clones of bootstrap, bootstrap-tools, cat-harness, cat-harness-tools as siblings in an empty directory: `bun install --frozen-lockfile`, `tsc`, `bun test`, closure, the rehearsal, every `:check` in `cat-harness-tools/package.json`; link audit (0 broken, 0 leaving except declared URLs); names-outside audit (every remaining mention of folio-assistant or a higher instance intentional); licence files. Fixes found go to the new repositories, not back into the staged copies.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] `QA-cat-harness.md` and `QA-cat-harness-tools.md` written in the `QA-bootstrap{,-tools}.md` format, both passing
- [ ] every fix QA found is a commit in the new repository, listed in the QA report
