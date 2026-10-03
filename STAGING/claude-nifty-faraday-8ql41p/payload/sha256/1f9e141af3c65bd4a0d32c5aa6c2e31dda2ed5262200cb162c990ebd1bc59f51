---
# folio-assistant-pyds
title: 'Separation stage 0: preconditions — PR0/PR1 landed, boundary gates watched red, baseline recorded'
status: todo
type: task
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-01T06:58:00Z
parent: folio-assistant-iirv
---

Stage 0 of the split plan (`kg-separation` stage 0): preconditions, **no moves**.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30"). Owner rulings, 2026-10-01 (split plan): D1–D6 apply; record them in `w2gr` as the plan's first step.

**Waits on (not linkable yet — not on main):** placement PR0 `ejye` (checkout aggregates, PR0a = `cmsl` steps 2–3, #1704) and PR1 `ybwt` (content-type packages up). Also merge #1728 (who-iris generic DSpace code into `cat-harness/scripts`) first, or the 1a codemod picks it up on rebase.

## Done when
- [ ] `w2gr` claimed with `bun run beans:claim`; D1–D6 recorded in it (body-append)
- [ ] `ejye` and `ybwt` merged; `classify.py` re-run on main reports ABOVE = 0, and `cat-harness/cat-harness.json` holds no `scope: repository` entry
- [ ] `check:import-direction` watched RED on a planted `cat-harness → cat-harness-tools` import, and `check:tools-closure` generalised to take an instance name and watched red on a planted violation (falsifier: a planted violation that stays green → stop and fix the gate)
- [ ] baseline recorded in this bean: `bun test` pass count, `mcp:capture` tool list, every generator's `--check` output hash, the `knownSkills` set
- [ ] the two plan documents committed under `cat-harness/docs/proposals/` (or `fsh-guts/`) so the scratchpad is not the only copy
