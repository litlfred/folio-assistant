---
# folio-assistant-w1gy
$schema: bean/1.0.0
title: 'Separation stage 5: QA both new repositories from fresh sibling clones'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-30T18:10:00Z
parent: folio-assistant-iirv
---

Stage 5 of the split plan: QA from scratch. Fresh clones of bootstrap, bootstrap-tools, cat-harness, cat-harness-tools as siblings in an empty directory: `bun install --frozen-lockfile`, `tsc`, `bun test`, closure, the rehearsal, every `:check` in `cat-harness-tools/package.json`; link audit (0 broken, 0 leaving except declared URLs); names-outside audit (every remaining mention of folio-assistant or a higher instance intentional); licence files. Fixes found go to the new repositories, not back into the staged copies.

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [ ] `QA-cat-harness.md` and `QA-cat-harness-tools.md` written in the `QA-bootstrap{,-tools}.md` format, both passing
- [ ] every fix QA found is a commit in the new repository, listed in the QA report

## State 2026-10-09
The repositories exist and are seeded (`iai8`, #2517), so this stage is now unblocked and is QA of the live repositories.
- `bun run cat check:cat-harness-standalone` run by me 2026-10-09 in the index checkout (cat-harness mounted at bd72c68, cat-harness-tools at 3ce5100, TMPDIR clean): **exit 1** — the 15-entry baseline (cat-harness-tools#16, after cat-harness#52) holds except **one new failure**: `scripts/tests/gen-slice-sqlite.test.ts > gen-slice-sqlite — kg > the whole-repo KG slices green, its pointers resolve to the COMMITTED payloads, and it stays under the budget`. That is the missing `harness-tiles` KG payload cat-harness-tools#16 already named as a defect of cat-harness main after #46/#49 that needs a payload regen in cat-harness.
- The ratchet runs in the index CI (`gates-standalone` job in `code-quality-gates.yml`); neither litlfred/cat-harness nor litlfred/cat-harness-tools runs CI of its own (each has only `release-npm.yml`).
- Neither `QA-cat-harness.md` nor `QA-cat-harness-tools.md` exists.
Remaining: (1) regenerate the KG payload in cat-harness so the ratchet is green again; (2) the fresh-clone QA of both repositories as written (install, tsc, bun test, link and names-outside audits, licence files) and the two QA reports; (3) fixes as commits in the new repositories. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-15T16:49Z_ — Block lifted: `iai8` is completed (cutover PR #2517 merged 2026-10-08). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

## 2026-10-20 — QA run; both reports written; neither passes (drain coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Both reports are in this bean's note (`beans/notes/folio-assistant-w1gy--2026-10-20--claude-amazing-einstein-2v47a4.md`): fresh sibling clones of bootstrap, bootstrap-tools, cat-harness (d22ac7f), cat-harness-tools (7cc65a0). No `QA-bootstrap{,-tools}.md` exists anywhere to copy the format from; a checks table + findings table was used.

- **cat-harness:** tsc 0 errors; bun test 1067/0; frozen install FAILS in the sibling layout (stale nested `bootstrap-tools/` in bun.lock); release-npm would fail at install (`@litlfred/bootstrap-tools` on no registry); 124 broken links (86 in `test/README.md`, moved e2e files); library blocks typed with core's vocabulary (~2,800) — a layering design question.
- **cat-harness-tools:** tsc 0; frozen install passes in the sibling layout; bun test 11404 pass / 700 fail (401 in the standalone baseline, 284 not — mostly checkout tests reading the composed index); standalone ratchet grew by 35; `run-script.ts` takes the bare parent as root, so 144 of 274 checks are non-zero in the sibling layout; `gen-schema-docs.ts` derives the repository from the cwd's git remote and rewrote 39 files in a sibling clone.
- **bootstrap-tools:** 301/1 — a comment in `harness-pr-checks.yml:8` names cat-harness-tools (also in bootstrap).

Box 2 started: the one-line cat-harness fixes are litlfred/cat-harness#382 (url-space @graphNode, a dead package script, two wrong-direction comments). The larger findings are listed per repo in the note.

## OWNER, 2026-10-20 (owner, structured question, 2026-10-20 ~18:00Z; session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6) — the release finding

On cat-harness's `release-npm.yml` failing because `@litlfred/bootstrap-tools` is on no registry: **"Publish bootstrap-tools"** to GitHub Packages like the other layers, then regenerate cat-harness's lockfile in the sibling layout.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-checked the 2026-10-20 findings against cat-harness main `e4238567`: F3 (dead `check:adversarial-review` script), F8 (two wrong-direction comments) and F13 (`url-space.ts` @graphNode) are fixed. Still open: F1 (bun.lock nested bootstrap-tools workspace), F5 (`test/README.md` still has 81 links to moved e2e files), F10 (NOTICE still headed folio-assistant and lists sci's claude-scientific-skills; package.json has no `license`). Also found: folio-assistant-sci has no LICENSE or NOTICE although it carries those MIT skills; asked the owner.

## OWNER, 2026-10-24 08:06Z (structured question in the separation drain thread, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

On folio-assistant-sci having no LICENSE or NOTICE while it carries the MIT claude-scientific-skills packages: **give sci the same Apache-2.0 LICENSE, CC BY content licence and a NOTICE, and move the MIT entry there; open the PR for owner review, do not auto-merge.**

_2026-10-24T08:16Z_ — Claimed by the separation drain thread (session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e). Open PRs: litlfred/folio-assistant-sci#68, litlfred/cat-harness#511 (licence, owner review).

_2026-10-29T07:35Z_ — F10 merged: litlfred/folio-assistant-sci#68 and litlfred/cat-harness#511. Lane A (session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo) merged them under the owner's 2026-10-29 07:20Z rule, "merge all ready and then deal with aftermath", which supersedes the 10-24 "do not auto-merge". Still open: F1 (bun.lock nested bootstrap-tools) and F5 (test/README.md links to moved e2e files), plus the sci#68 witness gate (`readme:subgraphs` finds an uncommitted `guides-writing-a-paper/the-end-to-end-workflow.kg.json`).

## 2026-10-30 — re-measured in fresh sibling clones; PRs opened for F1, F4, F5, and sibling bootstrap rehearsal

Fresh sibling clones of `bootstrap` (`3ce2b5d`), `bootstrap-tools` (`fdceeca`), `cat-harness` (`e60e8283`), and `cat-harness-tools` (`8262eba`) under pinned `bun 1.3.14`:

- **bootstrap & bootstrap-tools:** `F9` (`harness-pr-checks.yml:8` comment naming `cat-harness-tools`) is already fixed on `main` in both repositories. `bun install --frozen-lockfile`, `tsc`, `bun test` (312 pass / 0 fail across 25 files), `check:closure`, `check:node-iris`, `check:concepts`, `subgraph-readmes --check` (0 stale in both), and `bootstrap-tools/scripts/rehearse-standalone.ts` (14/14 pass) are all green.
- **cat-harness (`litlfred/cat-harness#717`, commit `8363264c`):**
  - `F1` (`bun.lock`): regenerated in the sibling layout on `bun 1.3.14` (`"../bootstrap-tools"` workspace key and current `bootstrap-tools` manifest); `bun install --frozen-lockfile` passes (226 installs across 244 packages, 0 changes).
  - `F5` (`test/README.md`): replaced the stale generated `cat-harness-tests` table (86 dead relative links to moved `*.e2e.ts` and `test-server.mjs` files) with a concise README of the four subdirectories `cat-harness/test/` holds (`attestations/`, `fixtures/`, `plans/`, `results/`); all relative links resolve inside `cat-harness`.
  - `F4` (`folio/index.md`): regenerated via `bun run folio:render`; `bun run folio:render:check` passes.
  - `readme:subgraphs`: regenerated the 10 stale directory READMEs (`docs/`, `docs/guides/`, `docs/process/`, `docs/proposals/`, `docs/source/`, `processes/`, `site-chrome/`, `test/attestations/`, `tools/`, `validators/`) via `subgraph-readmes.ts --repo`; `subgraph-readmes.ts --repo <cat-harness> --check` passes with 0 stale across all 45 directory READMEs.
  - Verified in the sibling layout: `bun install --frozen-lockfile` (0 changes), `tsc` (0 errors), `bun test` (1258 pass / 0 fail across 100 files), `folio:render:check` (current), `check:schema-nodes` (pass), `check:declared-assets` (0 findings), `readme:audit` (0 dead), `check:subgraphs` (0 dangling links).
- **cat-harness-tools (`litlfred/cat-harness-tools#867`, commit `c9f8e73`):**
  - `F5` companion (`test/README.md`): regenerated `test/README.md` via `subgraph-readmes.ts --repo` from `cat-harness-tools-tests` so it lists all moved `*.e2e.ts` and `test-server.mjs` files.
  - `bun.lock`: regenerated on `bun 1.3.14` (`"lockfileVersion": 1` and `../bootstrap-tools` `bpmn-js: 18.31.0`) so `bun install --frozen-lockfile` passes under the pinned `bun 1.3.14` in the sibling layout (525 installs across 542 packages, 0 changes).
  - `scripts/rehearse-bootstrap-standalone.ts`: falls back to `bootstrap-tools/node_modules` when the parent directory has no `node_modules`, so `check:bootstrap-standalone` passes all 14 checks in the sibling layout.
  - Verified in the sibling layout: `bun install --frozen-lockfile` (0 changes), `tsc` (0 errors), `check:bootstrap-standalone` (14/14 pass).


_2026-10-15T16:49Z_ — Block lifted: `iai8` is completed (cutover PR #2517 merged 2026-10-08). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-16T06:30:00Z_ — The note above is mirrored from the folio-assistant store (commit 0b8d249), where this edge was lifted on 2026-10-15; lifted here too (Owner ruling 2026-10-16, item 9). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-checked the 2026-10-20 findings against cat-harness main `e4238567`: F3 (dead `check:adversarial-review` script), F8 (two wrong-direction comments) and F13 (`url-space.ts` @graphNode) are fixed. Still open: F1 (bun.lock nested bootstrap-tools workspace), F5 (`test/README.md` still has 81 links to moved e2e files), F10 (NOTICE still headed folio-assistant and lists sci's claude-scientific-skills; package.json has no `license`). Also found: folio-assistant-sci has no LICENSE or NOTICE although it carries those MIT skills; asked the owner.

## OWNER, 2026-10-24 08:06Z (structured question in the separation drain thread, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

On folio-assistant-sci having no LICENSE or NOTICE while it carries the MIT claude-scientific-skills packages: **give sci the same Apache-2.0 LICENSE, CC BY content licence and a NOTICE, and move the MIT entry there; open the PR for owner review, do not auto-merge.**

_2026-10-24T08:16Z_ — Claimed by the separation drain thread (session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e). Open PRs: litlfred/folio-assistant-sci#68, litlfred/cat-harness#511 (licence, owner review).

_2026-10-30T17:15:00Z_ — https://github.com/litlfred/cat-harness-tools/pull/867 (739fdc0) and https://github.com/litlfred/cat-harness/pull/717 (e754db5) merged: F1 bun.lock, F5 test/README.md, sibling boot. Left: the two QA reports and the licence PRs. Session https://claude.ai/code/session_01Qmmkt5WaLSwgbVA8urteie (thread "Land GOAL 1 placement moves").

_2026-10-30T18:10:00Z_ — Fresh-clone QA re-run (note folio-assistant-w1gy--2026-10-30--claude-saqd-maths-qa-checkers.md). cat-harness PASSES on e3d1dd28 after https://github.com/litlfred/cat-harness/pull/769, https://github.com/litlfred/cat-harness/pull/770 and https://github.com/litlfred/cat-harness/pull/776. cat-harness-tools does NOT pass in the bare sibling layout: 323 failures outside its baseline, mostly checkout or site-build tests (F18), plus root detection (F11), gen-schema-docs reading the git remote (F12) and a baseline measured in a different layout (F19). Stays in-progress. Session https://claude.ai/code/session_01Qmmkt5WaLSwgbVA8urteie.

_2026-10-30T19:40Z_ — Claimed by thread "Finish GOAL 1 code-move beans" (session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp). The placement-move beans stay with "Finish GOAL 1 beans".

_2026-10-30T20:10Z_ — cat-harness-tools QA re-run (report rewritten at /mnt/project-files/w1gy-qa-2026-10-30/QA-cat-harness-tools.md): 13368 pass / 576 fail; outside the baseline 323 -> 182. Fixes: tools#987 (F19, merged), tools#981 + cat-harness#793 (F12), tools#998 (stale pre-8lcl schema paths), tools#1001 (F20, new: frozen install links 18 of 46 deps, fixed by `linker = "hoisted"`); tools#986 closed (same fix as #983). Licence PRs cat-harness#511 and sci#68 both merged. Owner card pending on F18 (guards + triage of the 88), F11 (composed checkout; minimal root follow-up) and F17 (sci bean). Both boxes stay open. Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp.

_2026-10-30T20:15Z_ — Owner card 2026-10-30 20:07Z, "A. Apply all three". F18: guard composed-only inputs with `notApplicableAlone`, add a "site not built" guard that skips only in standalone, and triage the 88 unexplained failures file by file (agents working). F11: keep the behaviour, so "every :check" needs a composed checkout; as a follow-up, the sibling QA writes a minimal aggregate root (agent working). F17: filed as folio-assistant-ygge (sci resolves cat-harness in a sibling layout). Since 20:10Z merged: tools#981 + cat-harness#793, tools#998, tools#1001. Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp.

_2026-10-30T20:40Z_ — F11 follow-up C measured with draft cat-harness-tools#1004 (`sibling:root`). Of 288 checks, 145 were non-zero with no root and 144 with the root (it fixes 7 and breaks 5 that expect a real index). In a layout of real git clones, instance `needs` never resolve (`siblingScopeFor` stops at an instance with its own `.git`, ruling 68k7: 22 checks), and 21 more need a git parent. Under the owner card of 20:07Z (F11 A: "every :check" needs a composed checkout) these count as composed-only, and root detection is not changed. #1004 stays draft. About 10 checks look like real findings in any layout; an agent is fixing them. Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp.

_2026-10-30T21:10Z_ — F18 under owner card A (20:07Z). Merged: tools#1013 (`siteNotBuilt` guard plus 85 built-site, higher-instance and generated-include guards), #1014 (stale 8lcl/y9r6 paths; leaves one real red test, retired `roles` in bpmn/dmn-authoring, with an owner card pending), #1015 (pair-cover `judged`), #1016 (empty tools dir fails), #1017 (14 higher-instance guards), #1020 (21 site guards), cat-harness#802 (safeHref, merge-to-main.pot). Ready: tools#1022 (the last 28 guards and 4 real fixes; also fixes the duplicate-import tsc break on main). Also merged: tools#1010, cat-harness#801 (stale generated outputs), tools#1011 (the 8lcl `belowOf` regression; bootstrap-tools is below the harness again), fa#2793 (docs-site injection). Left: about 9 tests that depend on root detection (kept by owner decision), 4 fixture-typology tests (need a design call), and 3 owner questions on a card (subscriptions readOnly, workflow_complete activities, fhir-validation actor). Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp.
