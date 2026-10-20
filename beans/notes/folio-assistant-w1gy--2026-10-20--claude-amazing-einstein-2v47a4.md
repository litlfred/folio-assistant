---
# note on folio-assistant-w1gy from claude/amazing-einstein-2v47a4
$schema: folio-bean-note/v1
bean: folio-assistant-w1gy
branch: "claude/amazing-einstein-2v47a4"
created: "2026-10-20"
---
## Fresh-clone QA of cat-harness and cat-harness-tools, 2026-10-20

Session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6 (drain coordinator; QA run by a sub-agent from fresh sibling clones). Format note: no `QA-bootstrap{,-tools}.md` exists anywhere searched (both bootstrap repos, all branches, index history, fsh-guts, code search); the structure below is a checks table + findings table. **Neither repository passes.** No fixes are in this note; fixes go to the new repositories as commits.

## QA — litlfred/cat-harness (separation stage 5, bean `folio-assistant-w1gy`)

| | |
|---|---|
| Date | 2026-10-20 |
| Repository | `litlfred/cat-harness` @ `d22ac7f699d05b10a2aefb0fa52c68c6f05e80dc` (main, 2026-10-20 18:49 +0200) |
| Siblings | `bootstrap` @ `ebce7b7`, `bootstrap-tools` @ `3f5b43c`, `cat-harness-tools` @ `7cc65a0` (each one's main at the time of cloning) |
| Layout | four fresh `git clone`s side by side in an empty directory, with no aggregate root (that root is not a git repository and has no `package.json` or `index.config.json`) |
| Runtime | bun 1.4.2. **The repository pins 1.3.14** in `.bun-version` and CI, so results that depend on the bun version (`navbar:assets`) are not authoritative. |
| Format | The `QA-bootstrap.md` and `QA-bootstrap-tools.md` format was **not found**. I searched both repositories (all remote branches), the index's git history (`git log --all -S QA-bootstrap`), the `fsh-guts` mount including its `separated/` archive, and GitHub code search across `user:litlfred`. The only mention is `cat-harness/docs/proposals/cat-harness-tools-split-2026-10-01.md:370`, the plan that cites the format. This report therefore uses a fallback structure: a checks table, then findings. |
| Verdict | **NOT PASSING**: the frozen-lockfile install fails, one package script points to a file that moved, a generated file is stale, and the link and names-outside audits fail. |

## Checks

| # | Check | Command (from) | Result | Notes |
|---|---|---|---|---|
| 1 | Clone | `git clone https://github.com/litlfred/cat-harness` (empty dir) | PASS | All four clones succeeded. |
| 2 | Frozen install, sibling layout | `bun install --frozen-lockfile` (`cat-harness/`) | **FAIL** | `error: lockfile had changes, but lockfile is frozen`. See F1. |
| 3 | Unfrozen install, sibling layout | `bun install` (`cat-harness/`) | PASS | 223 packages. It rewrites `bun.lock` (11 lines): the workspace key changes `bootstrap-tools` to `../bootstrap-tools`, and bootstrap-tools devDeps change from `typescript: npm:@typescript/typescript6@6.0.2` to `typescript 6.0.3` plus `playwright 1.63.0`. |
| 4 | Lone-clone install, no siblings | `bun install --frozen-lockfile` (fresh clone alone in its own dir) | **FAIL** | `GET https://registry.npmjs.org/@litlfred%2fbootstrap-tools - 404`. `npm view @litlfred/bootstrap-tools` also returns 404. See F2. |
| 5 | Typecheck | `bunx tsc --noEmit -p tsconfig.json` (`cat-harness/`) | PASS | 0 errors in 9 s. |
| 6 | Unit tests | `bun test` (`cat-harness/`, TMPDIR isolated) | PASS | **1067 pass / 0 fail**, 2424 expects, 80 files, 1.96 s. All 80 `*.test.ts` files ran (78 in `schemas/`, 1 in `folio-render/`, 1 in `openapi/`). |
| 7 | Package script `folio:render:check` | `bun run folio:render:check` (`cat-harness/`) | **FAIL** | `stale: folio/index.md`. Regenerating changes only the `README.md` row, from 1.1 KB to 1.2 KB. See F4. |
| 8 | Package script `check:adversarial-review` | `bun run check:adversarial-review` (`cat-harness/`) | **FAIL** | `Module not found "scripts/check-adversarial-review.ts"`. cat-harness has no `scripts/` directory. See F3. |
| 9 | Standalone ratchet, composed index | `bun run cat check:cat-harness-standalone` (`/home/user/folio-assistant`, TMPDIR clean) | PASS (exit 0) | `held: 0 failing standalone, exactly the baseline.` The baseline for `cat-harness` is now 0 (`failed: 0, failing: []`). It was 15 entries plus 1 new failure on 2026-10-09. Caveat: the index measures its **pinned** cat-harness `5f17a92` (`index.lock.json`), not main `d22ac7f`. |
| 10 | Standalone ratchet, sibling layout | `bun scripts/run-script.ts check:cat-harness-standalone` (`cat-harness-tools/`) | UNDETERMINED (exit 2) | `the rehearsal could not be set up: git -C <root> ls-files` fails because the probe needs a git repository at the composition root. |
| 11 | Bootstrap rehearsal | `… check:bootstrap-standalone` (sibling layout) | FAIL (exit 1) | 1 of 14 fails: the bootstrap-tools unit tests. The cause is in `bootstrap` (F9), not in cat-harness. |
| 12 | Closure (bootstrap-tools, which this layer `needs`) | `bun run check:closure` (`bootstrap-tools/`) | PASS | `imports only itself, zod, liquidjs, @playwright/test and the runtime (61 files)`. `check:node-iris` and `check:concepts` also pass. |
| 13 | Every `:check` / `check:` in `cat-harness-tools/package.json#checkoutScripts` | `bun scripts/run-script.ts <name>` (`cat-harness-tools/`, 180 s each, pushes disabled) | 274 run: 129 exit 0, 94 exit 1, 50 exit 2, 1 exit 78 | Most non-zero results come from the layout, not from cat-harness: the composition root is not git, there is no `index.config.json` or index `.github/workflows`, `beans`/`todos`/`fsh-guts`/`health` are unmounted, no content layer is present, and no site is built. Full table: `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/check-results.tsv`. Logs: `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/checks/`. Findings below that are independent of the layout are marked as such. |
| 14 | Link audit (`*.md`; relative targets; links leaving the repository) | custom walker, `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/tools/linkaudit.ts` | **FAIL** | 3483 md files, 4912 links. 981 unresolved: 486 are site-rendered `.html` with an existing `.md` source (OK on the site); 257 are verbatim upstream text in `library/` (exempt); **124 are broken**; 114 are site links whose source is not in the repository. **33 links leave the repository**: 8 go down into `bootstrap`/`bootstrap-tools` and resolve in the sibling layout; 25 go **up** into `folio-assistant-core`/`folio-assistant-sci` and do not resolve. See F5 and F6. |
| 15 | External links | same walker | INFO | 1638 http(s) links. 1023 go to `github.com/litlfred/folio-assistant` (edit/blob links to monorepo paths such as `edit/main/content`, `blob/main/processes`, `blob/main/cat-harness`), 116 to `litlfred.github.io`, and 91 to `github.com/litlfred/bootstrap-tools`. I found no list of declared URLs to judge them against. See F7. |
| 16 | Names-outside (folio-assistant, -core, -sci, smart-*, who-iris, fhir-harness, and cat-harness-tools, which is the layer **above**) | `git grep` and classifier, `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/tools/names.ts` | **FAIL** | 41,796 occurrences. Mostly intentional or data (see the table below), but with real defects (F8). The repository's own `check:reference-direction` reports **4 wrong-direction** occurrences (2 in cat-harness, plus 1 each in bootstrap and bootstrap-tools). In the sibling layout it sees only 4 instances, so it cannot grade names of core/sci/smart-*/who-iris/fhir-harness at all. |
| 17 | Licence files | `ls` | PASS, with notes | `LICENSE` (Apache-2.0, 202 lines), `LICENSE-CONTENT.md` (CC BY 3.0) and `NOTICE` are present. `THIRD-PARTY-NOTICES.md` is absent (the index has one). See F10. |
| 18 | CI of its own | `.github/workflows/` | INFO | `harness-pr-checks.yml` (reusable from cat-harness-tools), `post-merge-regen.yml`, `publish-context.yml`, `release-npm.yml`. The bean's 2026-10-09 note "only release-npm.yml" is out of date. No workflow exercises the sibling layout: PR checks run inside the composed index. |

## Findings

Severity: **H** blocks a fresh clone from working or being released, **M** is a wrong or misleading artefact, **L** is cosmetic or bookkeeping. "1-line" means the fix is a single-line edit or a single regenerate-and-commit.

| ID | Sev | Where | Finding | Proposed fix | 1-line? |
|---|---|---|---|---|---|
| F1 | H | `bun.lock:51` (`"bootstrap-tools": {`), `:63`, `:82` | `bun install --frozen-lockfile` fails in the sibling layout. The lockfile records the bootstrap-tools workspace at a **nested** `bootstrap-tools/` and a bootstrap-tools manifest that no longer exists (`typescript: npm:@typescript/typescript6@6.0.2`). cat-harness-tools' lockfile already uses `../bootstrap-tools`. | Run `bun install` in the sibling layout and commit `bun.lock` (an 11-line diff). | yes (regenerate) |
| F2 | H | `package.json` (`"@litlfred/bootstrap-tools": "0.1.0"`); `.github/workflows/release-npm.yml:22,52` | Outside the sibling layout the dependency cannot be resolved: `@litlfred/bootstrap-tools` 404s on npmjs, and bootstrap-tools is `"private": true`, so it can never be published. `release-npm.yml` checks out cat-harness alone and runs `bun install --frozen-lockfile`, so a release run would fail. `README.md:177` says to run `bun install` "at the checkout root" and, unlike cat-harness-tools' README, has no "plain clone" section naming the siblings. | (a) Check out `bootstrap-tools` as a sibling in `release-npm.yml` (and `bootstrap` too if the tests need it). (b) Port cat-harness-tools' "Working on it from a plain clone" section into the README. (c) Decide whether bootstrap-tools is published: un-private it and release it, or make the dependency a `git+https` / `workspace:` reference. | no |
| F3 | M | `package.json` (scripts: `"check:adversarial-review": "bun run scripts/check-adversarial-review.ts"`) | The script points to a file that moved to `cat-harness-tools/scripts/check-adversarial-review.ts`, and that file is already declared in cat-harness-tools' `checkoutScripts`. | Delete the line. | yes |
| F4 | L | `folio/index.md:22` | Stale generated table (README.md 1.1 KB, now 1.2 KB). `folio:render:check` fails on main. | `bun run folio:render` and commit. | yes (regenerate) |
| F5 | M | `test/README.md:13-98` | 86 relative links to `*.e2e.ts` and fixtures that moved to `cat-harness-tools/test/`. The README stayed behind. | Move the README's table to `cat-harness-tools/test/README.md` (which exists), or turn the entries into URLs. | no |
| F6 | M | `docs/concepts/{es,fr,ru,ar}/agentic-harness.md:66-72`, `docs/concepts/zh/agentic-harness.md:54-60` | 25 relative links go **up** to `../../../../folio-assistant-core/processes/content/*.bpmn` and `folio-assistant-sci/...`: they leave the repository and point at a higher layer. The English `docs/concepts/agentic-harness.md:67-73,268` links to `../../processes/*.bpmn`, which does not exist (the diagrams are `processes/process/crdm-requirements.bpmn` or live in core/sci). | Point at the published URLs of core/sci, or drop the list from the harness page. Then regenerate the translations. | no |
| F7 | M | `docs/source/**` (e.g. `docs/source/concepts-agentic-harness/interaction-states.md:19-25`, `consolidated-skill-references.md:7-17`); `docs/guides/agent-onboarding.md:75,174`; `docs/concepts/tool-graph.md:100`; `docs/sage-mcp.md:30`; `home_page/index.md:12-22` | 38 more broken relative links. `docs/source/*` links are one level too shallow (`../../skills/...` from `docs/source/<page>/`). `docs/reference/skill-instructions/` is not committed. `home_page/index.md` links to `papers/quantum-observable-universe/*`, `blueprint.pdf` and `lean/`, which belong to a sci folio. | Fix the depth in the docs/source generator. Make `home_page/index.md` a harness landing page or drop it. | no |
| F8 | M | names-outside, see the table below | Real upward references: `schemas/kg-qa.ts:734` (comment naming cat-harness-tools); `.github/workflows/harness-pr-checks.yml:8` (comment `cat-harness-tools#406, #411`). These are the 2 items `check:reference-direction` grades as wrong-direction. Also: `schemas/jsonld.ts:127` (content context IRI under `litlfred.github.io/folio-assistant/ns/...`), `home_page/index.md` (F7), and `library/**/blocks/*.jsonld`, which type harness library entries with the **core** vocabulary (`"folio-assistant-core": "https://litlfred.github.io/folio-assistant-core/0.1.0/ns#"`, `folio-assistant-core:Figure`, about 2,800 occurrences). That inverts the layers that core's AGENTS.md states ("core owns content vocabulary"). | Reword the two comments (one line each). Move library typing to a harness-owned or bootstrap-owned term, or move `library/` up. Re-base the `derivedFrom` URLs (`litlfred.github.io/folio-assistant/assets/library/jsonld/cat-harness/...`, about 10,500) once cat-harness publishes its own site. | 2 × yes; rest no |
| F9 | L (sibling repo) | `bootstrap/.github/workflows/harness-pr-checks.yml:8` (and the same line in `bootstrap-tools`) | Same comment as F8. In bootstrap it fails the test `bootstrap-tools/schemas/graph.test.ts:266` ("nothing in bootstrap/ names anything above it", bean `iwtn`), so bootstrap-tools' `bun test` is 301 pass / 1 fail and `check:bootstrap-standalone` is red. | Reword the comment without naming the repository, e.g. "(see the reusable workflow's issues #406, #411)". | yes |
| F10 | L | `NOTICE:1,4,26-34`; `LICENSE-CONTENT.md:5,24`; `package.json` | NOTICE is headed `folio-assistant` and lists `claude-scientific-skills` under `folio-assistant-sci/skills/...`, which is not in this repository. LICENSE-CONTENT.md says "the prose in folio-assistant". `NOTICE:30` cites `scripts/vendor-graphviz-wasm.ts`, which is in cat-harness-tools, not here. `package.json` has **no `license` field** although `"private": false`. Its `files` list omits `NOTICE` and `LICENSE-CONTENT.md`; Apache-2.0 §4(d) needs NOTICE shipped. | Retitle to cat-harness, drop the sci entry, point the graphviz line at cat-harness-tools, add `"license": "Apache-2.0"`, and add both files to `files`. | 3–4 one-line edits |
| F11 | M | `docs/reference/skills/*.md` (13 files) and the generator `cat-harness-tools/scripts/gen-schema-docs.ts:31,89` | The committed links go to `github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/...`, a monorepo path that is no longer tracked there. Running cat-harness-tools' `bun test` in the sibling layout **rewrote these 13 files in the sibling cat-harness clone**, with the repository taken from the working directory's git remote: `litlfred/cat-harness-tools/blob/main/cat-harness/...`, which is wrong too. It also rewrote 26 `test/results/witnesses/*` files. | The generator should take the repository from the instance declaration's `repository` and the prefix relative to the instance root. Then regenerate. A tools test must not write into a sibling (see QA-cat-harness-tools F5). | no |
| F13 | L | `schemas/url-space.ts:1-15` (added in `5f17a92`, #376) | `check:schema-nodes` fails because the leading docblock has no `@graphNode` tag, so the module is absent from the published graph. The same failure reproduces regardless of layout. | Add `@graphNode schema` (or `@graphNode none — <reason>`) to the docblock. | yes |
| F12 | L | `cat-harness.json` (61 lines naming core/sci/smart-base/who-iris/fhir-harness, e.g. `docs/en/folio-assistant-core/`, `docs/assets/glossary/who-iris--*.skos.jsonld`) | The declaration lists generated paths for higher instances. This is intentional while cat-harness builds the composed site, but it is names-outside. | Move it to the composer's or index's declaration when the site moves. | no |

Findings independent of the layout from the check sweep (#13) that bear on cat-harness. They should be re-confirmed in the index on bun 1.3.14:

- `glossary:check`: `glossary/glossary-ledger.json is stale`.
- `library:keywords:check`: 58 `keywords.json` stale.
- `themes:css:check`, `landing:data:check` (`docs/_data/stickies.json`), `translation:index:check` (`docs/_data/translations.json`), `agent-memory:check`, `lsi:skills:check`, `external-schemas:check` (3 records).
- `skill:commands:check`: `.claude/commands/*.md` declare `user_invocable` with no command.
- `check:kind-validators`: `validators/computation-witness.json`.

Several of these may change only because the content layers are absent, so none of them is filed as a finding until it reproduces in the index.

### Names-outside, classified (cat-harness)

| Class | Count (approx.) | Verdict | Example |
|---|---|---|---|
| `library/**` JSON-LD: `litlfred.github.io/folio-assistant/assets/...` `derivedFrom`, plus `folio-assistant-core` ns/CURIEs | ~19,000 | **defect (design)**, F8 | `library/omg-2024-spdx-3-0/blocks/figure-img-p178-1.jsonld:6,11` |
| `test/results/**` committed QA sidecars naming `smart-base/…`, `who-iris/…`, `cat-harness-tools/…` checkers | ~9,400 | intentional as a record, but results computed in the composed index (bean `5hox` moves them to `qa-reports`) | `test/results/audit-coverage.qa-results.json:174` |
| `docs/proposals/**` dated decision records | ~5,000 | intentional (exemption X5) | `docs/proposals/cat-harness-tools-split-2026-10-01.md` |
| `docs/**` edit/blob URLs into `github.com/litlfred/folio-assistant` | ~1,000 links | defect (stale since the cutover), F7/F11 | `docs/guides/*`, `docs/process/*` |
| `translations/**` prose "folio-assistant" and generator strings | ~1,350 | intentional (product name), but `translations/fr/index.ts:24` titles the page "Accueil — folio-assistant" | `translations/*/kg-viewer.ts:25` |
| bean ids `folio-assistant-xxxx` in comments | 362 | intentional (the bean prefix of record) | `schemas/actor-reach.ts:5` |
| `schemas/graph-typology-registry.ts:1001,1004,1722,1847,1849,2077,2541` shapes `cat-harness-tools:<path>` | 7 | intentional (exemption X4, "definition naming its implementation") | — |
| comments naming cat-harness-tools or core paths in `schemas/*.ts` | ~60 | mostly intentional (X4); `schemas/kg-qa.ts:734` is graded wrong-direction | `schemas/cat-harness.ts:852,878,3606` |
| `home_page/index.md:12-22` (QOU paper, Lean blueprint) | 6 | **defect** | — |
| `.github/workflows/harness-pr-checks.yml:8` | 1 | **defect** (graded) | — |

## Commands run

```sh
S=/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/w1gy; mkdir -p $S; cd $S
for r in bootstrap bootstrap-tools cat-harness cat-harness-tools; do git clone -q https://github.com/litlfred/$r; done
(cd bootstrap-tools && bun install --frozen-lockfile)           # ok
(cd cat-harness && bun install --frozen-lockfile)               # FAIL: lockfile had changes
(cd cat-harness-tools && bun install --frozen-lockfile)         # ok (links ../cat-harness, ../bootstrap-tools)
(cd cat-harness && bun install)                                 # ok, rewrites bun.lock
## lone clone: git clone $S/cat-harness <empty>/cat-harness && bun install --frozen-lockfile   -> 404
npm view @litlfred/bootstrap-tools version                      # 404
(cd cat-harness && bunx tsc --noEmit -p tsconfig.json)           # 0 errors
(cd cat-harness && TMPDIR=<iso> bun test)                       # 1067 pass / 0 fail
(cd cat-harness && bun run folio:render:check)                  # FAIL stale folio/index.md
(cd cat-harness && bun run check:adversarial-review)            # FAIL module not found
(cd bootstrap-tools && bun run check:closure && bun run check:node-iris && bun run check:concepts)   # ok
for r in ...; do git -C $r remote set-url --push origin DISABLED-for-QA; done
(cd cat-harness-tools && GH_TOKEN=disabled-for-qa TMPDIR=<iso> timeout 180 bun scripts/run-script.ts <each of 274 check names>)
bun tools/linkaudit.ts $S/cat-harness links-cat-harness.json; bun tools/classify.ts ...
bun tools/names.ts $S/cat-harness cat-harness names-ch.json
cd /home/user/folio-assistant && TMPDIR=<clean> bun run cat check:cat-harness-standalone   # held, exit 0
```

No commit or push was made. The scratch clones had their push URLs disabled. The clones were reset after the test and check runs had written into them (F11 and the `test/results/*` sidecars).

## Fix commits

None yet. The bean asks for every fix to be a commit in the new repository, listed here. That is outstanding.

## QA — litlfred/cat-harness-tools (separation stage 5, bean `folio-assistant-w1gy`)

| | |
|---|---|
| Date | 2026-10-20 |
| Repository | `litlfred/cat-harness-tools` @ `7cc65a0cfe35f2d216f23c35d34abe52ec3785f7` (main, 2026-10-20 17:13Z) |
| Siblings | `bootstrap` @ `ebce7b7`, `bootstrap-tools` @ `3f5b43c`, `cat-harness` @ `d22ac7f` (each one's main) |
| Layout | four fresh `git clone`s side by side in an empty directory, with no aggregate root |
| Runtime | bun 1.4.2. The repository's workflows pin **1.3.14**, so results that depend on the bun version are not authoritative. |
| Format | The `QA-bootstrap{,-tools}.md` format was **not found**. I searched both bootstrap repositories (all branches), the index's git history, the `fsh-guts` mount and GitHub code search. This report uses a fallback structure: a checks table, then findings. |
| Verdict | **NOT PASSING**. Install and typecheck pass in the sibling layout. `bun test` fails 700 tests (plus 46 errors). The index's standalone ratchet **grew** by 35. Checkout scripts mostly cannot run in a sibling layout, and the names-outside audit fails. |

## Checks

| # | Check | Command (from) | Result | Notes |
|---|---|---|---|---|
| 1 | Clone | `git clone https://github.com/litlfred/cat-harness-tools` | PASS | |
| 2 | Frozen install, sibling layout | `bun install --frozen-lockfile` (`cat-harness-tools/`) | PASS | 520 packages. `node_modules/@litlfred/{cat-harness,bootstrap-tools}` are symlinks to the siblings through the workspace globs `../cat-harnes[s]` and `../bootstrap-tool[s]`. |
| 3 | Lone-clone install, no siblings | `bun install --frozen-lockfile` (clone alone) | **FAIL**, as expected | `GET https://registry.npmjs.org/@litlfred%2fbootstrap-tools - 404` and `@litlfred%2fcat-harness - 404`. `npm view` of all three `@litlfred/*` packages returns 404. The 404 is documented in `README.md:36-55` ("Working on it from a plain clone"). Finding F1 covers release. |
| 4 | Typecheck | `bunx tsc --noEmit -p tsconfig.json` | PASS | 0 errors in 39 s. |
| 5 | Unit tests | `bun test` (TMPDIR isolated; finished inside the 15-min budget) | **FAIL** | **11404 pass / 700 fail / 123 skip / 46 errors**. 12227 tests across 981 files in 645 s. 685 distinct failing tests. **401** of them are in the committed standalone baseline (`scripts/standalone-baseline.json`, layer `cat-harness-tools`, 432 entries). **284 are not** in the baseline. 31 baseline entries pass here. |
| 6 | Standalone ratchet, composed index | `bun run cat check:cat-harness-tools-standalone` (`/home/user/folio-assistant`, TMPDIR clean) | **FAIL (exit 1, grew)** | 827 s. **35 tests fail standalone that the baseline does not list.** 2 listed tests now pass. Measured on the index's **pinned** `38e106c`, not main `7cc65a0`. The list is in the appendix. |
| 7 | `check:cat-harness-standalone` (index) | as above | PASS | `held: 0 failing standalone, exactly the baseline.` See QA-cat-harness #9. |
| 8 | Bootstrap rehearsal | `bun scripts/run-script.ts check:bootstrap-standalone` (sibling) | FAIL | 1 of 14: the bootstrap-tools unit tests. The cause is `bootstrap/.github/workflows/harness-pr-checks.yml:8` naming cat-harness-tools (QA-cat-harness F9). |
| 9 | Closure (bootstrap-tools) | `bun run check:closure` | PASS | 61 files. |
| 10 | Import direction | `… check:import-direction` (sibling) | PASS (exit 0) | |
| 11 | Reference direction | `… check:reference-direction` (sibling) | FAIL (exit 1) | 4 wrong-direction occurrences, all of them **pointing at** this repository from below: `cat-harness/schemas/kg-qa.ts:734` and `{cat-harness,bootstrap,bootstrap-tools}/.github/workflows/harness-pr-checks.yml:8`. It also lists **11 stale PENDING entries** for `fhir-harness/*` and `smart-base/*`, which are hard-coded in this repository and should be deleted (the check's own message). 1438 occurrences are exempt under 13 stated exemptions. |
| 12 | Every `:check` / `check:` in `package.json#checkoutScripts` (275, minus tools-standalone which ran in #6) | `GH_TOKEN=disabled TMPDIR=<iso> timeout 180 bun scripts/run-script.ts <name>` (`cat-harness-tools/`, pushes disabled) | 274 run: **129 exit 0, 94 exit 1, 50 exit 2** (could not determine), 1 exit 78 (not applicable) | Most non-zero results come from the layout. `run-script.ts` takes `REPO = dirname(HARNESS_ROOT)`, the bare parent directory, which is not a git repository and has no `index.config.json`, `.github/workflows`, `AGENTS.md`, root `README.md` or state mounts. Table: `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/check-results.tsv`. Logs: `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/checks/`. See F2. |
| 13 | Link audit (`*.md`) | `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/tools/linkaudit.ts` | **FAIL** (leaving) | 345 md files, 419 links, **0 broken**. **11 links leave the repository**, all in `beans/defs/*.md`: 9 into `../../../cat-harness/skills/...` (resolve as siblings) and 2 into `../../../fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md` (a higher instance; does not resolve): `beans/defs/folio-assistant-ekp9--….md:21`, `beans/defs/folio-assistant-8v0y--….md:21`. External: 22 to `github.com/litlfred/bootstrap-tools`, 21 to `github.com/litlfred/folio-assistant` (issues and PRs cited in beans, intentional). |
| 14 | Names-outside | `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/tools/names.ts` | **FAIL** | 5,290 occurrences. Breakdown below. Most are intentional (bean ids, test fixtures, tests that are coupled to the checkout). Runtime code defects: F4. |
| 15 | Licence files | `ls` | PASS, with notes | `LICENSE` (Apache-2.0), `LICENSE-CONTENT.md` (CC BY 3.0) and `NOTICE` are present, and `package.json` has `"license": "Apache-2.0"`. See F6. |
| 16 | Package `exports` / `files` targets exist | `jq` and `ls` | PASS | Every `exports` target and every `files` entry exists. |
| 17 | Tree mutation by tests | `git status` in all four clones after `bun test` | **FAIL** | `bun test` here left **39 modified files in the sibling `cat-harness` clone**: 13 `docs/reference/skills/*.md` and 26 `test/results/witnesses/**`. It left none in itself. See F5. The `check:*` sweep wrote another 9 `cat-harness/test/results/*.qa-results.json` (sidecar writers, by design). |

### `bun test` failures grouped by cause (700 fails across 251 files)

Each failure is classified by the first error line before it. Grouping script: `/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/tools/cat.py`.

| Cause | Fails | Files | Typical error |
|---|---|---|---|
| A. Reads the composed index root | 63 | 29 | `ENOENT <root>/.github/workflows/{docs-site,code-quality-gates,feature-staging,publish}.yml`, `<root>/index.config.json`, `<root>/AGENTS.md`, `<root>/.gitignore`, `git ls-files` failing at the root |
| B. Needs built (gitignored) site artefacts in cat-harness | 74 | 19 | `ENOENT cat-harness/docs/en/cat-harness/{beans,qa,uploads-queue}/index.html`, `docs/assets/{todos,library,schemas}/index.json`, `docs/_includes/generated/navbar-footer.html`, `docs/_data/harness.json` |
| C. Needs a higher content instance | 61 | 23 | `init-folio: a document folio needs the content layer, and none is composed` (32); `smart-base/library/...`, `smart-trust/smart-trust.json`, `fhir-harness/scripts/ig-cache.sh` |
| D. State branch not mounted | 29 | 13 | `"beans" is on cat/cat-harness/beans and is not mounted`; `scripts/todos.ts could not resolve its todo directory`; `scandir cat-harness/fsh-guts` |
| F. Diagram not declared | 6 | 4 | `no declared diagram named getting-started.bpmn / editing-hci-validation.bpmn under cat-harness` |
| E. Assertion failures, mostly in tests coupled to the checkout | 452 | 197 | Top files: `scripts/tests/state-visualizer.test.ts` (30), `init-folio.test.ts` (21), `test/coordinator/gates-workflows.test.ts` (16), `gen-block-jsonld.test.ts` (11), `jsonld-label-resolution.test.ts` (11), `test/coordinator/todos-repo-root.test.ts` (11), `test/coordinator/voice-criteria-checkout.test.ts` (10). 127 failures are in `test/coordinator/*-checkout*`, which by name require the index. |

Tests that are not in the baseline (284) are concentrated in: `state-visualizer` 30, `init-folio` 19, `jsonld-label-resolution` 11, `gen-block-jsonld` 11, `todo-index` 10, `qa-checkers-ids` 8, `qa-sweep-content-only` 7 and `gen-navbar-include` 7. Most read site artefacts that are built but gitignored (cause B). The index probe evidently has them on disk; a fresh clone does not.

## Findings

Severity and the "1-line" column mean the same as in QA-cat-harness.md.

| ID | Sev | Where | Finding | Proposed fix | 1-line? |
|---|---|---|---|---|---|
| F1 | H | `package.json` (`"@litlfred/cat-harness": "0.1.0"`, `"@litlfred/bootstrap-tools": "0.1.0"`); `.github/workflows/release-npm.yml:22,52` | Neither dependency is on any registry (npmjs 404), and bootstrap-tools is `"private": true`. `release-npm.yml` checks out this repository alone and runs `bun install --frozen-lockfile`, so a release fails at install. A published `@litlfred/cat-harness-tools` would be uninstallable for the same reason. | Check out `cat-harness` and `bootstrap-tools` as siblings in the release job. Decide how the two dependencies are distributed: publish both (un-private bootstrap-tools) or use `git+https` references. | no |
| F2 | H | `scripts/run-script.ts` (`REPO = resolve(dirname(HARNESS_ROOT))`) and the checkout scripts in general | Stage 5 asks for "every `:check` from fresh sibling clones". In that layout **144 of 274** checks are non-zero, and 50 of those cannot determine anything. They assume the composition root is a git checkout with `index.config.json`, the index's `.github/workflows`, state mounts and a content layer. Examples: `check:declared-dirs`, `check:harness-dirs`, `check:instance-graph` ("`bootstrap-tools`, named in cat-harness-tools's `needs`, matches no instance"), `separation:cutover:check` ("layers sit beside the root with no index.config.json"), `check:script-placement` ("538 script(s) in the wrong manifest"). | Either define a minimal composed root for the sibling QA (`git init` + `index.config.json` with local sources), and document it in README "plain clone", or have `run-script.ts` refuse up front when the root is not a composed checkout. | no |
| F3 | H | `scripts/standalone-baseline.json` (layer `cat-harness-tools`) | The index ratchet **grew by 35** (exit 1), e.g. `scripts/tests/agentic-gate-promotion.test.ts > (load-time error) ENOENT reading "merge-review.ts"`, `merge-base/merge-leftover/merge-overlap/merge-train` (12), `check-node-kinds` (3) and `resolution-across-needs` (3). The `gates-standalone` CI job in the index must be red at this pin. | Fix or relocate the 35 tests. Lower the list for the 2 tests that now pass (`bun run cat-harness-tools/scripts/check-standalone.ts --layer cat-harness-tools --update`, only after the fixes). | no |
| F4 | M | `adapters/mcp-server/server.ts:1296-1297` | `VIEWER_DIR = resolve(REPO_ROOT, "folio-assistant/viewer")` and `ASSISTANT_DIR = resolve(REPO_ROOT, "folio-assistant/ui")` assume the old layout, where folio-assistant is a submodule of the folio. The viewer and UI now ship in this repository (`viewer/`, `ui/`), and `viewer/` and `ui/` are also missing from `package.json#files`. | `resolve(TOOLS_ROOT, "viewer")` and `resolve(TOOLS_ROOT, "ui")`; add both to `files`. | 2 lines + `files` |
| F5 | M | the test suite and `scripts/gen-schema-docs.ts:31,89` | `bun test` rewrites 39 committed files in the **sibling** cat-harness. `gen-schema-docs.ts` derives the link repository from `detectRepoUrl(process.cwd())` and the prefix from `repoRootFor(INSTANCE_ROOT)`, which gives `github.com/litlfred/cat-harness-tools/blob/main/cat-harness/schemas/...`. The correct link is `github.com/litlfred/cat-harness/blob/main/schemas/...`. | Take the repository from the instance declaration (`cat-harness.json#repository`). Make the test that drives the writer use a temporary copy. Find it by bisecting `scripts/tests/{skill-docs-links,skill-doc-source-links,skill-md-generated,site-dir-single-answer}.test.ts` and `pipeline/derive-po.test.ts`. | no |
| F6 | L | `NOTICE:1,4,22-23,26-34`; `LICENSE-CONTENT.md:5,24`; `package.json#files` | NOTICE is headed `folio-assistant`. It lists `docs/assets/js/vendor/qrcode.js`, which **does not exist** in this repository; it is in cat-harness `site-chrome/assets/js/vendor/`. It lists `claude-scientific-skills` under `folio-assistant-sci/...`, which is not here. It omits `@hpcc-js/wasm-graphviz`, although `scripts/vendor-graphviz-wasm.ts` is here. `files` omits `NOTICE` and `LICENSE-CONTENT.md`. | Retitle to cat-harness-tools, remove the qrcode and sci entries, keep or move the graphviz line correctly, and add both files to `files`. | 3–4 one-line edits |
| F7 | L | `scripts/repin-standing.ts:17,19` | `check:command-paths`: the usage comment names `index.config.json → bootstrap/index.config.json` and `index.lock.json → cat-harness/index.lock.json`, which do not exist. | Correct the paths in the comment. | yes |
| F8 | L | `scripts/state-on-main-baseline.json:13-16` | Baseline entries `folio-assistant-core::beans{,/defs,/notes,/workflows}` name a higher instance, and `check:state-on-main` reports them as stale ("no longer a state directory on `main`. Delete the line"). | Delete the 4 lines. | yes (×4) |
| F9 | L | `scripts/check-reference-direction.ts` (PENDING list) | 11 PENDING entries for `fhir-harness/*` and `smart-base/*` no longer qualify (the check's own message). They are also names-outside. | Delete them. | yes (one block) |
| F10 | M | `beans/defs/folio-assistant-ekp9--….md:21`, `beans/defs/folio-assistant-8v0y--….md:21` | Relative links into `../../../fhir-harness/...`, a higher instance, that do not resolve. 9 more bean links go into `../../../cat-harness/...` (resolvable only as siblings). This repository also keeps `beans/` **tracked on main** (330 files), whereas cat-harness keeps its beans on a state branch. | Turn these into URLs. Decide whether tools' beans move to a `cat/cat-harness-tools/beans` state branch, to match. | no |
| F11 | L | `AGENTS.md:37-41` | "The HTTP server and the rest of `cat-harness/src/` arrive in step 3b; until then this declaration names only what exists". `src/`, `pipeline/`, `viewer/` and more are already here. | Update the paragraph. | yes |
| F12 | M | `scripts/partition/instance-rules.ts:86-88`; `scripts/smart-base-transform.py`; `scripts/init-folio.ts:62,957,1328`; `pipeline/derive-po.ts:301-325`; `scripts/lib/harness-rail.ts:212,548-591`; `deploy/docker-compose.yml:33-111` | Runtime names-outside. Hard-coded higher instances (`folio-assistant-sci`, `smart-base`). A smart-base-specific transform lives in the tools layer. `init-folio` still adds folio-assistant as a submodule through `litlfred/folio-assistant/.github/workflows/folio-staging.yml@main`. PO headers and navbar labels say "folio-assistant". | Read instance names from `index.config.json`. Move `smart-base-transform.py` up to fhir-harness or smart-base. Parameterise the product name. | no |

### Names-outside, classified (cat-harness-tools)

| Class | Count | Verdict |
|---|---|---|
| bean ids `folio-assistant-xxxx` (beans, tests, comments) | 1,167 | intentional (the bean prefix of record) |
| `beans/**` prose and URLs naming folio-assistant issues and PRs | ~1,280 | intentional (history); 2 broken relative links are defects (F10) |
| `scripts/tests/**`, `test/coordinator/**` naming who-iris, smart-base, smart-trust, core, sci | ~2,860 | intentional as fixtures. Those that read the real directories are what make the standalone run fail (cause C) and should be re-homed to the index or to the content layer. |
| `.github/workflows/**` (`layer-pr-checks.yml` 10, `layer-post-merge-regen.yml` 5, `layer-publish-context.yml` 4, `verdict-check.yml` 3, `pr-tests.yml` 3) | 70 | intentional: the reusable workflows check out `litlfred/folio-assistant` as the index |
| runtime code: `server.ts`, `instance-rules.ts`, `init-folio.ts`, `derive-po.ts`, `harness-rail.ts`, `smart-base-transform.py`, `beans-query.ts:15-263` (`https://folio-assistant.org/vocab/bean#` namespace and `folio-assistant-` id prefix) | ~120 | **defect** where a path or instance is hard-coded (F4, F12); product-name strings and the bean namespace are intentional pending a rename decision |
| `scripts/check-reference-direction.ts` PENDING list | 11 | stale (F9) |
| `scripts/state-on-main-baseline.json:13-16` | 4 | stale (F8) |

## Appendix — the 35 new standalone failures (index ratchet, pinned `38e106c`)

The tests are named as `<file> > <describe> > <test>`. Spelled out:

- `pipeline/pot-for-pages.test.ts`: the derived set is a SUBSET of what the module owns.
- `pipeline/translation-drift.test.ts`: no NEW drift, and nothing unreadable.
- `scripts/tests/agentic-gate-promotion.test.ts`: a load-time error, ENOENT reading `merge-review.ts`.
- `scripts/tests/check-node-kinds.test.ts`: 3 tests (DAY ONE; NEW unkinded family; combined build).
- `scripts/tests/ci-cone.test.ts`: a check that writes inside the checkout records nothing (strace).
- `scripts/tests/compose-docs.test.ts`: 2 tests (REAL tree).
- `scripts/tests/declared-paths.test.ts`: no literal names an existing file the witness list does not record.
- `scripts/tests/ensure-landing-sticky-mounted.test.ts`: the CLI composes the instance it is GIVEN.
- `scripts/tests/gen-navbar-include.test.ts`: the writer is a fixpoint.
- `scripts/tests/glossary-export.test.ts`: the committed ledger is CURRENT.
- `scripts/tests/instance-harnesses.test.ts`: the instance comes first.
- `scripts/tests/latex-exit2-contract.test.ts`: generate-main-tex exits 2.
- `scripts/tests/merge-base.test.ts`: 3 tests.
- `scripts/tests/merge-leftover.test.ts`: 3 tests.
- `scripts/tests/merge-overlap.test.ts`: 3 tests.
- `scripts/tests/merge-train.test.ts`: 3 tests.
- `scripts/tests/navbar-assets.test.ts`: `navbar.js` (bun-version sensitive).
- `scripts/tests/resolution-across-needs.test.ts`: 3 tests.
- `scripts/tests/state-visualizer.test.ts`: ON THE REAL CORPUS.
- `test/coordinator/library-source-links-checkout.test.ts`: `--site <dir>`.
- `test/coordinator/skill-doc-source-links-checkout.test.ts`: every source and edit link resolves.
- `test/coordinator/tools-viewer-checkout.test.ts`: one current page per instance.

Two listed tests now pass:

- `scripts/tests/nav-names.test.ts`: on the RAIL.
- `test/coordinator/subgraphs-checkout.test.ts`: the dangling category.

## Commands run

```sh
S=/tmp/claude-0/-home-user/e7c51cbd-739a-586a-b8a7-57caf98aa07d/scratchpad/w1gy; cd $S
for r in bootstrap bootstrap-tools cat-harness cat-harness-tools; do git clone -q https://github.com/litlfred/$r; done
(cd cat-harness-tools && bun install --frozen-lockfile)                 # ok, 520 pkgs, sibling symlinks
## lone clone: git clone $S/cat-harness-tools <empty>/cat-harness-tools && bun install --frozen-lockfile  -> 404 x2
npm view @litlfred/cat-harness version; npm view @litlfred/cat-harness-tools version   # 404
(cd cat-harness-tools && bunx tsc --noEmit -p tsconfig.json)             # 0 errors
(cd cat-harness-tools && TMPDIR=<iso> timeout 900 bun test)             # 11404 pass / 700 fail / 123 skip / 46 errors, 645 s
for r in ...; do git -C $r remote set-url --push origin DISABLED-for-QA; done
(cd cat-harness-tools && bun scripts/run-script.ts --list)              # 538 checkoutScripts, 275 checks
(cd cat-harness-tools && GH_TOKEN=disabled-for-qa GITHUB_TOKEN= TMPDIR=<iso> timeout 180 bun scripts/run-script.ts <name>)  # x274, 3-way parallel
cd /home/user/folio-assistant && TMPDIR=<clean> bun run cat check:cat-harness-tools-standalone   # exit 1, +35, 827 s
bun tools/linkaudit.ts $S/cat-harness-tools links-cat-harness-tools.json
bun tools/names.ts $S/cat-harness-tools cat-harness-tools names-cht.json
```

No commit or push was made, and nothing under `/home/user/` was modified. The index runs wrote only to an isolated TMPDIR.

## Fix commits

None yet. Per the bean, each fix must be a commit in this repository, listed here.
