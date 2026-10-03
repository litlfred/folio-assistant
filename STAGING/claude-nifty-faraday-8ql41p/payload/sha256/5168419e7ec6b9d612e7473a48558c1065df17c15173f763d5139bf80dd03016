---
# folio-assistant-gurh
title: 'MAIN RED 2026-10-01: Code-quality gates 12 consecutive failures since #1725, Docs site red — watchdog issue #1755'
status: todo
type: bug
priority: critical
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:52:00Z
parent: folio-assistant-3fva
---

Arc `3fva`, proposal `cat-harness/docs/proposals/qa-reports-branch-and-test-process-2026-10-01.md` §4 item 0.1. Measured 2026-10-01 at about 07:50Z, main `61b1e747`.

The last green Code-quality run was `27067b3fcb0` (#1725, 07:11Z). Since then main has failed 12 times in a row. The handover's "red from #1743" is out of date: #1725 turned it green, and it went red again from `a43d3b4e297` on.

Failing at head:
- Repository gates: the "workflow skill refs" step.
- End-to-end + accessibility: playwright.
- Skill-registration chain: "the registration chain is current, read unmasked".
- `bun test`:
  - `instance-declaration-gate.test.ts:99` (root does not reach agent-skills)
  - `layout-norms.test.ts:130` (smart-base/methodologies contains .../processes)
  - `skill-coverage.test.ts:195` (`l2-dak-authoring` uncovered)
  - `cat-harness.test.ts:1191` (core-/sci-methodologies were renamed)
  - `processes-viz.test.ts:239` (bootstrap-tools/processes appeared in the renders)
  - `ingest-and-l1.test.ts:405` (8 stale sources)
  - stale `gen-lsi-viz` and `qa-results`

Docs site: the "Regenerate skill instruction pages" step fails.

Inference, not yet verified: this is fallout from the placement merges #1758, #1760 and #1761 (session laughing-thompson, epic `iirv`), plus `a43d3b4`. **First check whether that session or #1747 (cmsl step 3) already owns the fix.** Do not duplicate it.

The watchdog (`kgho`) opened #1755 by itself at 07:24Z. That is the first production evidence that it works.

## Done when
- [x] the owner of the fix is identified, or this bean claims it — PR #1769 (bean `6306`), measured 2026-10-01 ~08:50Z; see Triage below
- [ ] Code-quality gates and Docs site are green on main
- [ ] #1755 is closed by the watchdog when it sees green, and NOT by hand

## Triage, 2026-10-01 ~08:50Z (subagent of session 01LKpuPo, main `cdb0a018`)

**Main is still red at `cdb0a018` (#1721)**: Code-quality run 36834076176 fails Repository gates (step "workflow skill refs"), `bun test`, playwright, and the unmasked registration chain. Docs site run 36834076048 fails at `gen-skill-docs.ts`.

**One root cause explains most of it, and a sibling owns the fix.** Placement PR0 (`ejye`, `9962556c`) removed cat-harness's 20 `scope: "repository"` mirrors of other instances' directories, and made the root `needs` every staged instance. Two later merge resolutions put both back: `aab80f35` (#1744) and `16c02d33` (the #1747 branch's merge of main, carried onto main). So main holds the mirrors again, with `needs: ["folio-assistant-core"]`. Code written after PR0 assumes the PR0 state, and it breaks:
- `check:workflow-refs`: `processes/l2-dak-authoring.bpmn` names `l2-dak-authoring`. PR1 moved that skill to `smart-base/`, which the root no longer reaches. So there are 3 DANGLING refs. `skill-coverage.test` fails for the same reason.
- Docs site: `gen-skill-docs.ts` is keyed by the owners' ids (`core-skills`, `lean-skills`, `data-skills`). The mirror ids came back with the mirrors, so the generator throws on `folio-assistant-{core,sci-lean,sci-data}-skills`.
- `bun test`: placement-PR1 tests ("the checkout knows all of them", role edges), `instance-declaration-gate`, kg-export, materialiseDirectories, and others.

**Owner of the fix: PR #1769** (`claude/fervent-brahmagupta-rbwhzm`, bean `6306`, draft). Its commit `4cded1db` restores PR0's declarations, and `8c84fe63`/`e12b4f10` fix the library-ref red. Its checklist still has "`bun run regen` at a fixed point; `bun run gates`" open. That session says it is consolidating `cmsl`/#1747 too. #1747 (cmsl step 3) separately edits `gen-skill-docs.ts`/`known-skills.ts` and is WIP ("regen pending"). **This bean does not duplicate either.**

**Measured on #1769 merged onto main (local probe branch `gurh-probe-1769`, not pushed):**
- `check:workflow-refs` is green: the l2-dak dangling refs are gone.
- `skill:register:check`: 8 checks are still stale. They are `skills:docs`, `check:glossary`, `docs:auto`, `lsi:skills`, `lsi:viz`, `kg:audit`, `kg:detangle` and `uml:overview`, all derived artefacts that #1769's pending regen step writes.
- `bun test`: 22 fail and 1 error, out of 13603. The failures are almost all stale derived artefacts:
  - LSI viewer, glossary/SKOS, kg-qa sidecars, health report checker hash `55edc157f206`→`d4d64806a93a`, L1 ingest sidecars (`w3c-*`, `hmans-2026-beans-readme`, `mcp-2026-specification-…` stale), and viewer/stale-path pages.
  - Several 5 s timeouts. The machine was under a sibling's concurrent `bun test`, so those need a rerun before anyone reads them as defects.
  - One needs a look after regen: `contentInstanceCode — who-iris` returns `n/a`, not `judged`. The likely cause is that who-iris's code directory is no longer reached once the mirrors go (#1728 flagged that finding as intentionally failing).
- e2e (main): `library-viewer-scope.e2e.ts:91`, "fhir-harness declares 3 library entries on disk and the viewer data holds none". This is a stale viewer projection and is expected to clear with the regen. It was not verified.

**Next, for #1769's owner:** run `bun run skill:register` / `bun run regen` to a fixed point after `4cded1db`, then `bun run gates`. Re-check who-iris `contentInstanceCode` and the fhir-harness library viewer data. Do not close #1755 by hand.
