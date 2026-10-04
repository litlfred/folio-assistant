---
# folio-assistant-ho66
title: 'Separation stage 2: rehearse cat-harness + cat-harness-tools standalone (check:cat-harness-standalone)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-03T09:48:05Z
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


## Holder 2026-10-03
Started by the Parcel B session (https://claude.ai/code/session_01SmeBn6QZsDFaNQ4GtuC2sd), owner: "start ho66". Claimed on its branch (claude/lucid-shannon-o8zop1-ho66), NOT through beans:claim, which pushes straight to main.

**Plan, and what changed against the plan above:**
- **No third rehearsal implementation.** bootstrap-tools/scripts/rehearse-standalone.ts has a check list hardwired to bootstrap. #1896's `probeStandalone` (seed:ready) is already the generic one: it lays out a layer's closure as siblings and runs `bun test`. `check:cat-harness-standalone` becomes a thin CLI over it, rather than the copy of bootstrap-tools' script proposed above.
- **One defect in that probe to fix first:** it does not `git init` each copied layer, but a real clone IS a git repository. Tests that ask git for the corpus therefore fail as an artefact of the rehearsal, which inflates the measured 469.
- Then: the full failure list grouped by cause, and fixes in batches. The fixing direction is to point a test at its own layer's corpus or move it to the layer that owns its subject; loosening the assertion is not the fix.
- `blocked_by: vj2p` (self-contained outputs) is noted; the measurement and the check do not need it, only the final green does.


## 2026-10-03 — the check, as a ratchet (#1977)
Owner's question on sequencing went unanswered; the stated default (option 3) was taken: build only the CI check now, leave the relocation for later. **#1977** (stacked on #1896): `check:cat-harness-standalone` judges `probeStandalone` against `cat-harness/scripts/standalone-baseline.json` — a new standalone failure is red, a fixed one is red until `bun run standalone:baseline` lowers the list. Probe now `git init`s each layer; failures keyed `<file> > <test>`. Both falsifiers are tests through the real probe. Baseline 459, identical across two runs. Boxes 1–2 tick when #1977 merges; box 3 (green on main) is the relocation program.
