---
# folio-assistant-ho66
title: 'Separation stage 2: rehearse cat-harness + cat-harness-tools standalone (check:cat-harness-standalone)'
status: todo
type: task
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-01T06:58:02Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-vj2p
---

Stage 2 of the split plan: rehearse standalone. New `cat-harness-tools/scripts/rehearse-standalone.ts` (a copy of bootstrap-tools'): copies only the tracked files of `cat-harness/`, `cat-harness-tools/`, `bootstrap/`, `bootstrap-tools/` into an empty temp dir, `git init` each, links `node_modules`, then runs closure, `check:import-direction` scoped to the two instances, every generator's `--check`, `kg:audit:check`, `skill:register:check`, `harness-schema-export --check`, `kg-export --out /dev/null`, `tsc`, `bun test .`. Expected fixes: tools that walk the checkout for higher instances treat "none found" as an empty overlay; test fixtures that live in higher instances. Bootstrap's first run found 2 defects.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] `check:cat-harness-standalone` exists and is a CI step
- [ ] falsifiers: an empty tree exits non-zero; a planted read of `../folio-assistant-core/x` is red
- [ ] the rehearsal is green on main
