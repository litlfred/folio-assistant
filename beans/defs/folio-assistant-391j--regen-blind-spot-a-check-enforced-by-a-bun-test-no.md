---
# folio-assistant-391j
title: 'REGEN BLIND SPOT: a :check enforced by a bun test (not a workflow step) is never asked by `bun run regen` — prov-qaqc turned main red'
status: todo
type: bug
created_at: 2026-09-24T06:06:37Z
updated_at: 2026-09-24T06:06:37Z
parent: folio-assistant-1xhc
---

Measured 2026-09-24. Main went red on 10b48aed (the #1246 merge) in `TypeScript — tests, lint, types`: the test `prov-qaqc: the real repository > the committed page and logs are current (what check:prov-qaqc gates)` failed. #1245 had added the report; 172b558d (#1190) then committed a new workflow instance without regenerating it. It was fixed by a pure regeneration in #1249.

**Why `bun run regen` missed it:** `regen-after-merge.ts` asks only the `:check` scripts that `gates.ts` loads from `code-quality-gates.yml`. `check:prov-qaqc` is enforced by a bun TEST, not by a workflow step, so regen never asks it. A branch that merged main and ran `regen` as instructed could still turn main red.

## Done when
- [ ] `regen` asks every `:check` that CI enforces, including those enforced from inside a test (or such checks become workflow steps), and a test covers the case
- [ ] The same audit is run for other test-enforced `:check`s
