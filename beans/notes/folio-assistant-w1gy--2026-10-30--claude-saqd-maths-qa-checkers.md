---
# note on folio-assistant-w1gy from claude/saqd-maths-qa-checkers
$schema: folio-bean-note/v1
bean: folio-assistant-w1gy
branch: "claude/saqd-maths-qa-checkers"
created: "2026-10-30"
---
## Fresh-clone QA re-run, 2026-10-30

Session https://claude.ai/code/session_01Qmmkt5WaLSwgbVA8urteie (thread "Land GOAL 1 placement moves"). cat-harness passes after three fixes; cat-harness-tools does not pass in the bare sibling layout.

# QA: litlfred/cat-harness (separation stage 5, bean folio-assistant-w1gy)

| | |
|---|---|
| Date | 2026-10-30, 17:30Z to 18:10Z |
| Repository | `litlfred/cat-harness` main. Measured at `4f4e572`, fixed, then re-measured at `e3d1dd28`. |
| Siblings | `bootstrap` `3ce2b5d`, `bootstrap-tools` `b7fb762`, `cat-harness-tools` `49f1696` (each one's main) |
| Layout | Four fresh `git clone --depth 1` checkouts side by side in an empty directory. There is no aggregate root. |
| Runtime | bun 1.4.4. This is the version CI pins today (`layer-pr-checks.yml:463`). The older pin of 1.3.14 is gone. |
| Format | A checks table, then a findings table, the same structure as the 2026-10-20 run. No `QA-bootstrap.md` exists to copy from. |
| Verdict | **PASSING**, after three fixes made during this run (F14, F15, F16). Every check below is green on `e3d1dd28`. |

## Checks

| # | Check | Command (cwd) | Result | Notes |
|---|---|---|---|---|
| 1 | Clone | `git clone https://github.com/litlfred/cat-harness` | PASS | |
| 2 | Frozen install, sibling layout | `bun install --frozen-lockfile` (`cat-harness/`) | PASS | 223 packages, 0 changes. F1 is fixed (#717). |
| 3 | Typecheck | `bunx tsc --noEmit -p .` | PASS on `e3d1dd28` | It was 2 errors at `4f4e572`; see F14, fixed in #769. |
| 4 | Unit tests | `bun test` | **PASS: 1263 pass / 0 fail** (99 files) | It was 1262/1 at `4f4e572`; see F15, fixed in #770. |
| 5 | Generated index | `bun run folio-render/file-list.ts --check` | PASS | `current: folio/index.md` (F4 is fixed, #717). |
| 6 | README links | `bun run ../cat-harness-tools/pipeline/readme-links.ts` | PASS | 0 dead. |
| 7 | Subgraph links | `bun run ../cat-harness-tools/scripts/check-subgraphs.ts --check` | PASS on `09df322` | It was 30 dead at `4f4e572`; see F16, fixed in #776. The 154 links into the published site and the 233 links inside derived graphs are reported as "not a finding" by the checker itself. |
| 8 | Directory READMEs | `bun run cat-harness-tools/scripts/subgraph-readmes.ts --repo cat-harness` | PASS after regenerating | 2 were stale (`skills/README.md`, `validators/README.md`); both are regenerated in #776. |
| 9 | Bootstrap rehearsal | `bun run scripts/rehearse-standalone.ts` (`bootstrap-tools/`) | PASS | 14/14. |
| 10 | Licence files | `ls` | PASS | `LICENSE`, `LICENSE-CONTENT.md` and `NOTICE` are present. F10 was fixed by #511. |

## Findings

| ID | Sev | Status | Where | Finding | Fix |
|---|---|---|---|---|---|
| F1 | H | fixed | `bun.lock` | The workspace was nested, so the frozen install failed. | #717 (`e754db5`) |
| F4 | L | fixed | `folio/index.md` | The generated table was stale. | #717 |
| F5 | M | fixed | `test/README.md` | 86 links pointed at moved e2e files. | #717 |
| F10 | L | fixed | `NOTICE` | It was headed folio-assistant and listed sci's MIT skills. | #511 |
| F14 | H | fixed | `schemas/kg-affordances.test.ts` | `tsc` failed on main: the test imported `tools/folio-init/folio-init.ts` and `tools/declaration-resolution/declaration-resolution.ts`, which #748 (y9r6 step 3) had turned into JSON. #758 added the test after #748. | #769 (`b436055`) reads both definitions with `toolFromJson`. Issue #768. |
| F15 | M | fixed | `schemas/sdlc/adversarial-checklist.ts` | The f8wp regroup broke five `schema:` references (`tool`, `vocabulary`, `kg-qa` ×2, `cat-harness`), and the reference pattern did not allow a group. | #770 (`4a68c56`): the references now read `schema:<group>/<module>`. |
| F16 | M | fixed | 13 skill docs, `schemas/README.md`, `schemas/block-qa-schema/README.md` | 30 links pointed at nothing: 25 at pre-regroup `schemas/<m>.ts`, and 5 at `tools/<t>/<t>.ts` Tool definitions that are now JSON. `skills/README.md` also listed a `framework/` directory that does not exist. | #776 (`09df322`) |
| F17 | M | open | the sibling layout itself | When a higher layer (`folio-assistant-sci`) is cloned beside the four, 10 cat-harness tests fail. Examples: "composition, in whatever checkout this runs", "block kinds are discovered". Sci's `schemas/mathpaper-vocabulary.ts` imports `@litlfred/cat-harness`, which resolves only inside the composed index. With sci removed, all 1263 pass. | Not fixed here. Either sci should resolve `@litlfred/cat-harness` in a sibling layout (a package `exports` entry or a relative import), or those tests should list only the instances the layout names. Needs its own bean. |

Every fix listed here is a commit on cat-harness main.

# QA: litlfred/cat-harness-tools (separation stage 5, bean folio-assistant-w1gy)

| | |
|---|---|
| Date | 2026-10-30, 17:30Z to 18:10Z |
| Repository | `litlfred/cat-harness-tools` main. Tests were run at `4177de1`; checks were re-run at `49f1696`. |
| Siblings | `bootstrap` `3ce2b5d`, `bootstrap-tools` `b7fb762`, `cat-harness` `e3d1dd28` |
| Layout | Four fresh `git clone --depth 1` checkouts side by side in an empty directory. There is no aggregate root. |
| Runtime | bun 1.4.4, the version CI pins. |
| Verdict | **NOT PASSING in the bare sibling layout.** Install and typecheck pass. 323 test failures are not in the standalone baseline; almost all of them need a composed index or a built site (F18). The CI gate that owns this ("Standalone (no new failures)") measures a different layout, so it is not comparable. |

## Checks

| # | Check | Command (cwd) | Result | Notes |
|---|---|---|---|---|
| 1 | Frozen install, sibling layout | `bun install --frozen-lockfile` | PASS | 520 packages, 0 changes (#867). |
| 2 | Typecheck | `bunx tsc --noEmit -p .` | PASS | 0 errors. |
| 3 | Unit tests | `bun test` | **FAIL** | 11965 pass / **731 fail** / 105 skip / 47 errors across 1004 files, in 783 s. Against `scripts/standalone-baseline.json` (426 listed): 392 of the failures are in the baseline, **323 are not**, and 34 listed tests now pass. See F18. |
| 4 | Standalone ratchet | `bun run cat-harness-tools/scripts/check-standalone.ts --layer cat-harness-tools` (root) | UNDETERMINED (exit 2) | `git -C <root> ls-files` fails: the ratchet needs the composition root to be a git checkout (the composed index). This is unchanged since 2026-10-20. |
| 5 | README / subgraph links | `pipeline/readme-links.ts`, `scripts/check-subgraphs.ts --check` run from `cat-harness-tools/` | UNDETERMINED | Both report exactly the same numbers as the cat-harness run (10 links, 3388 nodes). In this layout the tools resolve the root to the sibling directory rather than to the cwd, which is F11 (`run-script.ts` takes the bare parent as root). |
| 6 | Moved-checker tests | `bun test scripts/tests/qa-criterion-source-file.test.ts pipeline/pipeline-plugins.test.ts scripts/tests/lean-lexer-is-the-only-stripper.test.ts` | PASS | 25/0, after #947. Sci's copies are 76/0 against these mains. |
| 7 | Licence files | `ls` | PASS | `LICENSE`, `LICENSE-CONTENT.md` and `NOTICE` are present. |
| 8 | Every `checkoutScripts` check (274) | — | NOT RE-RUN | The 2026-10-20 run found 144/274 non-zero, almost all from the layout (F11). Re-running is not useful until F11 is decided. |

## Findings

| ID | Sev | Status | Finding | Proposed fix |
|---|---|---|---|---|
| F11 | H | open (2026-10-20) | `run-script.ts` and the root detection take the bare parent directory as the composition root. In a sibling layout, root-relative checks therefore read the wrong tree, or none: 144/274 non-zero on 10-20, and #5 above. | Root detection should use the instance that holds the cwd when no `index.config.json` exists. Owner design call, because it changes what "a checkout" means. |
| F12 | M | open (2026-10-20) | `gen-schema-docs.ts` derives the repository from the cwd's git remote, and rewrote 39 files in a sibling clone. | Read the repository from the declaration, not from git. |
| F18 | H | open | 323 failures outside the standalone baseline (284 on 10-20). They group as: 89 open files of a built cat-harness site (`docs/assets/todos/index.json`, `docs/assets/library/index.json`, `docs/en/cat-harness/beans/index.html`, …); 50 open the index's `.github/workflows/*`; 46 are `init-folio` needing the content layer (34) or sci's `paper` templates (12); 9 need `assets/css/themes.css`; the rest read `index.config.json`, `smart-base/…`, `folio-assistant-core/processes/…`, `who-iris/…`. Biggest files: `state-visualizer` 30, `init-folio` 28, `gen-block-jsonld` 11, `jsonld-label-resolution` 11, `todo-index` 10. These are checkout or integration tests that live in the tools layer. | Tag them as checkout tests, so they skip unless an index is composed (the `checkoutScripts` split already exists for scripts), or move them to the index. The standalone baseline should then be re-measured in the sibling layout rather than in the CI layout. |
| F19 | L | open | The standalone baseline is measured in CI's layout (the layer copied out of the composed index), not in a bare sibling layout. So "no new failures" in CI and this report's 323 are not the same measurement. | Measure both, or name the layout in `standalone-baseline.json`'s `_comment`. |

Every fix made during this run is a commit in the new repositories. In cat-harness-tools that is #947 (moved checkers). The cat-harness fixes (#769, #770, #776) are listed in `QA-cat-harness.md`.

Raw test log: `/tmp/claude-0/-home-claude/1be25da6-6812-5b9c-b3d4-becdde56c7a2/scratchpad/qa/cht-test.log` (session scratch; the counts above are taken from it).
