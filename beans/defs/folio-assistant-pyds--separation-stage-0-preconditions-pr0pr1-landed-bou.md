---
# folio-assistant-pyds
title: 'Separation stage 0: preconditions — PR0/PR1 landed, boundary gates watched red, baseline recorded'
status: in-progress
type: task
priority: normal
tags:
    - mvp
created_at: 2026-10-01T06:58:00Z
updated_at: 2026-10-04T14:43:15Z
parent: folio-assistant-iirv
---

Stage 0 of the split plan (`kg-separation` stage 0): preconditions, **no moves**.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30"). Owner rulings, 2026-10-01 (split plan): D1–D6 apply; record them in `w2gr` as the plan's first step.

**Waits on (not linkable yet — not on main):** placement PR0 `ejye` (checkout aggregates, PR0a = `cmsl` steps 2–3, #1704) and PR1 `ybwt` (content-type packages up). Also merge #1728 (who-iris generic DSpace code into `cat-harness/scripts`) first, or the 1a codemod picks it up on rebase.

## Done when
- [ ] `w2gr` claimed with `bun run beans:claim`; D1–D6 recorded in it (body-append)
- [ ] `ejye` and `ybwt` merged; `classify.py` re-run on main reports ABOVE = 0, and `cat-harness/cat-harness.json` holds no `scope: repository` entry
- [ ] `check:import-direction` watched RED on a planted `cat-harness → cat-harness-tools` import, and `check:tools-closure` generalised to take an instance name and watched red on a planted violation (falsifier: a planted violation that stays green → stop and fix the gate)
- [x] baseline recorded in this bean: `bun test` pass count, `mcp:capture` tool list, every generator's `--check` output hash, the `knownSkills` set
- [x] the two plan documents committed under `cat-harness/docs/proposals/` (or `fsh-guts/`) so the scratchpad is not the only copy

_2026-10-04T14:43:11Z_ — Claimed by claude/dazzling-sagan-xifirf — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-04 — PR #2101 (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi)

- **Baseline recorded** in `cat-harness-tools/scripts/split-baseline.json`, not in this body, so 70lx can compare mechanically (`bun run split:baseline:check`): 20 MCP tools with their inputs, 307 skills, and `bun test` = **21575 pass, 0 fail, 48 skip** from CI run 37212271689 on `993eb9e`. Generator output is NOT hashed: the generated files are committed, so the tree at that sha is the generator baseline (`git diff 993eb9e -- <paths>` after a regen).
- **Plan documents** are on main: `cat-harness/docs/proposals/cat-harness-tools-split-2026-10-01.md` and `separation-arc-2026-10-01.md`.
- **Box 3, first half done:** `check:import-direction --all` watched RED on a planted `cat-harness/src` import of `cat-harness-tools` (exit 1, edge named) and green once removed; `check-import-direction.test.ts` now plants it in a scratch tree carrying the REAL `needs`. **Second half open:** `check:tools-closure` lives in the `bootstrap-tools` submodule (a separate repo), and `check:import-direction --all` already gates every instance by its `needs`. Whether generalising it is still wanted is the owner's call.
- **Box 2:** #1758/#1760 merged, and `cat-harness.json` has 0 `scope: repository` entries. `classify.py` was never committed, so "ABOVE = 0" cannot be re-run as written.
- **Box 1 not touched:** `w2gr` is in-progress under its own claim.

