---
# folio-assistant-w1gy
$schema: bean/1.0.0
title: 'Separation stage 5: QA both new repositories from fresh sibling clones'
status: todo
type: task
priority: normal
created_at: 2026-10-01T06:58:02Z
updated_at: 2026-10-15T16:49:44Z
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
