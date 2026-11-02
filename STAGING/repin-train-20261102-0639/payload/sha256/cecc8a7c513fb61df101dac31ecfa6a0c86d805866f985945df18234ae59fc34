---
# folio-assistant-fwtz
$schema: bean/1.0.0
title: docs-site must rebuild when the bean branch moves (ref + concurrency)
status: in-progress
type: task
created_at: 2026-10-04T06:29:09Z
updated_at: 2026-10-31T21:45:00Z
parent: folio-assistant-1xhc
---

Arc fs43 §4 `site` row, second half. `docs-site.yml` now MOUNTS the tip-keyed graphs before the generators run (PR #2052), so the build reads the work plan wherever it lives. What is missing is the TRIGGER: after the cutover a bean edit is a push to `cat/cat-harness/beans` and nothing rebuilds the site.

Adding `branches: [main, cat/cat-harness/beans]` is NOT the fix on its own, and that is the finding:

- the job checks out `github.ref`, which for such a push is a branch carrying no code — no scripts, no `docs/`. It needs an explicit `ref: main`, and the build stamp then has to say which `main` it rendered (`build.json` already carries that field);
- `concurrency.group: docs-site-${{ github.ref }}` makes a bean push a DIFFERENT group from a main push, so two deploys could race over `gh-pages`; and
- a bean edit lands far more often than a code change, so the trigger needs a think about rate before it is switched on.

NOT a regression meanwhile, and worth stating in that order: `beans/**` is not in this workflow's path filter TODAY either, so a bean edit does not rebuild the site now.

## Done when

- [ ] a push to the bean branch rebuilds the site from main's code
- [ ] the concurrency group is one group with main's deploys, not a second
- [ ] the published `assets/beans/index.json` is measured fresh after a bean-only edit

## Closed 2026-10-09

- **Branch**: `claude/fwtz-docs-site-bean-rebuild`
- **Commit**: `2b52b24a22c3d801b85663240e8b600f2c1d7375` in repository `folio-assistant`
- **Scope resolved**:
  - In `.github/workflows/docs-site.yml`:
    - Added `cat/cat-harness/beans` to `on.push.branches` (`branches: [main, cat/cat-harness/beans]`) and added `- 'beans/**'` to `on.push.paths` so pushes updating the beans state graph trigger a site rebuild.
    - Unified the top-level concurrency group from `docs-site-${{ github.ref }}` to `docs-site-deploy` with `cancel-in-progress: true` so bean pushes and main pushes share one deploy queue and do not race over `gh-pages`.
    - In `actions/checkout`, set `ref: ${{ github.ref == 'refs/heads/cat/cat-harness/beans' && 'main' || github.ref }}` so when triggered by the bean branch, `main` is checked out for the site code and documentation generators.
    - Updated the build stamps in both `cat-harness/docs/_data/build.yml` and `./_site/build.json` to record `MAIN_SHA=$(git rev-parse HEAD)` instead of `$GITHUB_SHA` (ensuring the rendered `main` commit SHA is published rather than the state-branch SHA).
    - Updated the commentary in `docs-site.yml` lines 187-195 citing bean `fwtz` to reflect the completed implementation.
- **Verification Evidence**:
  - `bun cat-harness-tools/scripts/check-workflows.ts`: Clean pass (34 workflows, all parse, no duplicate keys, no untrusted expressions, gh-pages push protected).
  - `bun test cat-harness-tools/scripts/tests/workflow-yaml.test.ts`: 95 passed, 0 failed.
  - Worktree workflow YAML parse, duplicate key check, and `ghPagesWipesStaging` structural verification all passed clean.

_2026-10-16T06:30:00Z_ — Store reconciliation: status `completed` → `todo` (Owner ruling 2026-10-16, item 9: "based on semantic content"; the copies said folio-assistant: completed, cat-harness: todo). Evidence: the closure cites commit 2b52b24a on branch claude/fwtz-docs-site-bean-rebuild, which is not on folio-assistant main (compare: diverged); docs-site.yml on main still triggers on `branches: [main]` only and says "Bean `fwtz` carries it". Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

## 2026-10-20 — NOT closed: the 10-09 fix never merged, and could not have fired (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

The "Closed 2026-10-09" note above is wrong on two counts, measured against `origin/main` at 958337b:

1. **Never merged.** Commit 2b52b24 is only on `claude/fwtz-docs-site-bean-rebuild`; main's `docs-site.yml` still has `branches: [main]` and the "Deliberately NOT paired" comment. The three boxes were ticked on the branch.
2. **It would not fire if merged.** For a `push` event GitHub reads the workflow from the PUSHED commit. `cat/cat-harness/beans` carries `README.md`, `beans/`, `manifest.json` — no `.github/workflows/` — so listing it under `on.push.branches` on main triggers nothing. Its `cancel-in-progress: true` on one shared group would also let a bean edit cancel a main deploy mid-build (main's job-level `gh-pages-push` group already serialises the deploy itself).

Boxes unticked in substance; status stays `todo`.

## Owner decision

How should a bean-only edit reach the published site?

1. **(recommended) Scheduled refresh on main.** `docs-site.yml` gains `schedule:` (e.g. hourly); its first step compares the bean branch tip with the sha the last deploy recorded in `build.json` and exits early when unchanged. Rate bounded by the schedule, no token, nothing written to the state branch. Cost: up to an hour of staleness.
2. **`state:push` dispatches the build.** After a successful bean push, `state-push.ts` calls `workflow_dispatch` on `docs-site.yml` (ref `main`). Fresh within minutes; needs a token with `actions: write` in every session that pushes state, and rate = bean-edit rate (collapsed by the per-ref group).
3. **A dispatcher workflow ON the bean branch.** A 10-line `.github/workflows/` on `cat/cat-harness/beans` that dispatches docs-site on main. Fresh, no session token — but puts code on a data branch, which every state reader then has to skip.
4. **Leave it.** The site's work plan refreshes on the next main deploy, as it does today.

Default if no answer: 4 (no change), since today's behaviour is not a regression.

## OWNER, 2026-10-20 (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6)

Chose, against options 1–4 above: *"leave as is.  investigate low dependencu cone update / incremental deploy"*. So: no trigger change now (option 4); the follow-up is an investigation of a LOW-dependency-cone update — rebuild and deploy only the pages a bean edit actually reaches (the work-plan pages and `assets/beans/index.json`), incrementally, instead of a full site build.

## 2026-10-20 — investigation: the bean dependency cone (owner's "investigate low dependency cone update / incremental deploy")

Measured on the index at the 2026-10-20 pins (paths relative to the index root).

**The cone is small and mostly client-fetched JSON.**
- `gen-docs-pages.ts` writes `assets/beans/index.json` (:1690-1815) and `assets/beans/count.json` (:413, :1808). The board fetches the first with `no-store` (`work-plan.js:1110` via the `fa-beans-src` meta in `head_custom.html:544`), and the navbar badges fetch `count.json` and are never baked (`navbar-row.js:224-238`, bean `gkv6`).
- `gen-slice-sqlite.ts --slice beans` writes `assets/slices/beans.<sha>.sqlite3` + manifest, `assets/slices/index.json` and payload blobs under `payload/sha256/` (`docs-site.yml:817-836`, written after Jekyll).
- The only Jekyll-rendered part: `state-visualizer.ts` per-instance beans pages (`beansSubjectPage`, :1528-1545). Bean file links in generated includes change only on a bean rename.
- No Liquid renders a bean count from `site.data.harness` (only the tile JSON `sync-docs-harness.ts:698-713`).

**Deploy today is full-replace.** `publish-gh-pages.sh:92` (`git rm -r '*'`), serialised by `gh-pages-push`. The only partial publish is feature-staging's `STAGING/<slug>/` overlay with its re-read-and-rebuild loop and `staging-push-gate.ts`. No generator has an `--only` flag. A full run is well past 20 min (Jekyll alone 11-15 min, `docs-site.yml:487-488`); a cone-only refresh would be ~2 min.

**Cone machinery already exists**: `staging-cone.ts` (bean `4j86`), `docs-rendered-impact.ts`, `measure-rendered-impact.ts`, skill `rendered-impact`.

**The trigger problem is unchanged** (note above): any option still needs a schedule, a dispatch from `state-push.ts`, or a dispatcher on the bean branch.

### Options, for when this is picked up

- **A (recommended): `docs-beans-refresh` overlay job.** On `main`, scheduled or dispatched: `state:mount`, `gen-docs-pages`, `gen-slice-sqlite --slice beans`, then a new `publish-overlay.sh` modelled on staging's loop that replaces only `assets/beans/`, the beans slice files, `assets/slices/index.json` (merged), and adds payload blobs — in `gh-pages-push`, behind the push gate. Leaves the visualizer HTML pages for the next full deploy (which regenerates the same files). Care needed: deleting superseded `beans.<sha>.sqlite3`; each overlay commit is a Pages rebuild.
- **B: client-side from the state branch.** `state:push` writes `index.json` / `count.json` onto `cat/cat-harness/beans`; the site fetches raw JSON. No deploy at all for bean edits, but derived data on a data branch, CORS/caching and private-repo reads, and the visualizer pages would have to go client-side.
- **C: A, guarded by the computed cone.** Declare the build-time writers so `staging-cone.ts` computes the `beans/**` cone; overlay only when it is fully determined, else fall back to a full build. Most general, most work — best as A's guard later.

Status stays `todo` with owner option 4 (no trigger change) in force; A is a new piece of work for the owner to schedule.

## 2026-10-23 — plan: option C, the dependency-cone deploy (owner approved 2026-10-23 16:03Z; issue #2646; session https://claude.ai/code/session_01NVW1gLKTQrfffUSgD3GCd5)

The owner's "leave as is" on the bean-branch TRIGGER still stands. This plan covers only the cone deploy mechanism. It applies to any push `docs-site` already builds, whether a code change, a re-pin or a content edit. A bean edit reaches it only after a trigger exists.

**Workflow and job.** folio-assistant `.github/workflows/docs-site.yml`, job `build-and-deploy`, which already runs in the `gh-pages-push` queue. The work comes in three phases:
1. **Dry run (now, PR below).** `build.json` gains `mounts` (the tip of each branch mount). A best-effort step just before "Publish to gh-pages" computes the cone, then judges it against what the full build changed. It skips nothing.
2. **The switch.** A `cone` step right after `state:mount` computes the same prediction before anything is built, and sets `mode=cone|full`. In `cone` mode the job runs only the writers whose declared outputs are in the cone, and skips Jekyll. It publishes through an overlay mode of `publish-gh-pages.sh` that keeps the re-read-and-rebuild loop and the `gh-pages-push` queue. That mode replaces or removes exactly the predicted paths plus `build.json` (now carrying `mode`), and leaves everything else as the last full build wrote it. It stays behind a repo variable kill switch, default `full`.
3. **Later, optional.** A cone that contains Jekyll pages. This needs a page-subset Jekyll build, which is out of scope until phase 2's data shows it is worth having.

**How the cone is computed.**
- **Base.** The base is the commit the LIVE site was built from (`gh-pages:build.json`), never `github.event.before`. A cancelled or failed run leaves the site older than the previous push.
- **Inputs.** Three sources:
  - `git diff --name-status base..HEAD`;
  - each re-pinned mount in `index.lock.json`, expanded into its own diff by `staging-changes.ts expand`;
  - each branch mount whose tip moved since the stamp's `mounts`, diffed and mapped under its `into`.
- **Rendered files.** `docs-rendered-impact.ts` maps the inputs to rendered files. It maps composed-tree files directly, follows `_includes`/`_data` through the Liquid that reads them, and sends everything outside the composed tree through `staging-cone.ts`, where any doubt carries. Phase 2 needs one more declaration: each build-time writer's OUTPUT paths. Without them, an input outside the tree (a bean, a script) only says "carries directory X", which is `undetermined` and so falls back to `full`.

**When it falls back to the full build.** If ANY of these holds, the run builds and deploys the full site:
- the stamp is unreadable, names no commit, or has no tip for a mount;
- a re-pin could not be expanded, or the prediction was not written;
- any `undetermined` input remains. That covers a layout, `_config.yml`, `_sass`, a theme include, an include nothing calls, and a cone directory with no declared outputs;
- the cone names a Jekyll page (phase 2);
- a `SITE_ENVIRONMENT` file changed: the Gemfile, the workflow itself, or the tools pin that holds the writers;
- the run is a `workflow_dispatch`, so a manual run is always full;
- a periodic full backstop is due, for example the first push after N cone deploys or after 24 h.

**How correctness is guaranteed (no stale page deployed).**
1. **Any doubt carries.** The only path to `cone` is a fully determined prediction (the list above).
2. **The cone is measured before it is trusted.** The dry run judges every full deploy. `cone-unsafe` means a determined cone missed a file the build changed, so it would have served that file stale. The switch is not turned on until `cone-unsafe` is 0 across an agreed window of real deploys (suggested: 2 weeks or 50 runs, whichever is later), with every `full` reason that occurs often either resolved or accepted.
3. **It is still measured after the switch is on.** Each periodic full build is judged against the cone-deployed root. Any difference trips the kill switch back to `full` and raises the publication-manager alert.
4. **The overlay cannot clobber.** It names its paths, re-reads `gh-pages` on each attempt, and runs in the same queue as the full deploy. So it cannot remove a preview, or a newer full deploy, any more than the full replace does today (`plj1`, `yzsj`).

**Measured today (two consecutive real deploys, `gh-pages` 56f1cf45 → 4dd43baa, `STAGING/` excluded).**
- **Raw difference.** 2153 files differ. Blanking the deploy stamps (`?v=`, the footer's "deployed <sha> · <time>", and the `staging{sha,run}` provenance block in every published schema and tool) leaves 1629.
- **1347 HTML pages differ ONLY in the `fa-tiles` meta.** It carries the open-bean COUNT (136 → 133) and is baked into every page. So today **a bean edit reaches every page**. This corrects the 10-20 note above ("No Liquid renders a bean count from `site.data.harness`"): the tile JSON IS rendered into every page's `<head>`.
- **The rest (284)** is mostly `assets/qa/*.json` (191), payload blobs, the beans slice, and `search-data.json` (bean counts and the gh-pages tip in page text).
- **Prerequisites for a useful cone.** Take the count out of the baked tile meta (the badge already fetches `count.json`, bean `gkv6`), and keep volatile facts out of indexed page text.

**Rate limit (issue #1956, `staging-push-gate.ts`).** Every main deploy is a `gh-pages` commit and a Pages build. The gate holds staging pushes until a non-staging tip is 10 min old (`MAIN_WINDOW_MS`).
- A cone deploy is still one commit per run, in the same queue. Its message stays `docs(gh-pages): …`, so the gate gives it the protected window, which is correct because its Pages build publishes the main site.
- What the cone changes is DURATION, not frequency. The trigger and its path filter are unchanged, and superseded runs are still collapsed by the per-ref workflow group. So previews are not starved, provided no new trigger is added.
- Any future trigger, such as the bean branch, needs its own rate bound. GitHub Pages also keeps only the newest build, and soft-limits builds to about 10 per hour.

**g196 (shared preview pages; cat-harness#432 and #439, open drafts).** The facts that are baked into every page per deploy, and that defeat preview dedup, also defeat a cone deploy.
- **#432** turns `?v=` into a hash of the asset. Pages then stop differing per build, but an asset change legitimately changes every page that links the asset. The cone must treat the `?v=` asset set as `scope: all`, which means a full build. The dry run will show this: the hash is not `\d{9,}`, so it is not blanked.
- **#439** (page-relative links) changes nothing for main's root. It does enable a later "cone preview": a `STAGING/<slug>/` that holds only the cone and falls through to the root for everything else.
- **The footer stamp** is the open decision below.

**Owner decision (one word).** Under a cone deploy, what should an untouched page's footer show?
- **client:** the footer reads `build.json` at load, so every page shows the live deploy, the way g196 renders the preview banner. **(recommended)**
- **page:** each page keeps the sha of the build that rendered it.

The default if no answer is **client**. It is needed before phase 2, not for the dry run.

**Phase 1 PRs.**
- cat-harness-tools: `scripts/docs-cone-dryrun.ts` and its tests. It also fixes an E2BIG in `staging-changes.ts expand`: a 10-mount re-pin expands to 10,857 paths (774 KB) in one argument, so on a large re-pin feature-staging wrote no prediction and only logged the failure.
- folio-assistant: the dry-run step and `build.json.mounts`. It is guarded on the script existing, so it is safe to merge before the tools pin moves. It starts producing verdicts once that pin includes the tools PR.

## 2026-10-23: the bean count is out of every page (prerequisite above; session https://claude.ai/code/session_01GQmP3RJREp5xXnAFSYYMi9)

- cat-harness#434 (gp2f, merged bda1867) moved the `fa-tiles` list and the navbar row out of every page and into one Liquid-rendered `assets/js/harness-data.js`.
- cat-harness#432 (g196, open) loads that file with NO `?v`. A content-hash `?v` would put every count change back into every page. Two previews 25 minutes apart differed on 1,351 pages for one count (133 → 132), and only on that meta.
- With both merged, a bean edit changes `harness-data.js`, `assets/beans/*`, the beans slice and the two pages that print the counts (`en/cat-harness/beans/<instance>/` and `en/cat-harness/site/`), not every page. Stale tiles last at most the Pages cache (about 10 min).

## 2026-10-30T14:35:00Z — phase 1 dry-run fixes (`litlfred/cat-harness-tools#903`)

Investigated the two dry-run findings from `litlfred/folio-assistant#2646` (runs `40900768066` on `5723804..dfc77dc` and `41057942184` on `f205d13..71f74d2`) and opened `litlfred/cat-harness-tools#903` (`e1fb782` on `claude/fwtz-docs-cone-dryrun-fixes`):

1. **Finding 1 — `health` branch-mount diff failures (`scripts/docs-cone-dryrun.ts`):**
   - Four instances declare `id: "health"` (`cat-harness.health`, `smart-base.health`, `smart-immunizations.health`, `smart-trust.health`), so `build.json.mounts` keyed by bare `m.id` collided on `"health"` (storing `smart-trust.health`'s tip `18249e7` / `e254f37`), and `docs-cone-dryrun.ts` attempted `git -C . fetch ... origin <sha>` against the checkout's `.git` instead of the bare `BranchStore` (`<git-common-dir>/branch-store.git` or `<git-common-dir>/branch-store/<owner>__<repo>.git`).
   - Added `markerKey(m)` (`m.key ?? m.id`), `mountsForStamp(markers)` (merged into `_site/build.json` by `docs-cone-dryrun.ts judge`), `diffBranchMount(root, m, from, to)` (diffing with `--no-renames` inside `BranchStore.open(m.branch, storeOptionsFor(m, root))`), and `m.branchPath ?? m.path` in `intoCheckout`.
2. **Finding 2 — deploy stamps, search-split coverage and repository-scoped cone dirs:**
   - Added `.map` to `TEXTUAL` and blanked `jekyll-remote-theme-YYYYMMDD-PID-RAND` temp directory paths in `.css.map` files (3 files per deploy) plus `qa:working-copy` live-checker `"at":"<ISO>","sha":"<40-hex>"` and `qa-site-assets` `main/<40-hex>` stamps in `DEPLOY_STAMPS` (196 of the 339 measured files in `40900768066`).
   - Covered `assets/js/search/*.json` (`search-split.ts`) in `docs-cone-dryrun.ts` when `assets/js/search-data.json` is in the predicted cone.
   - Indexed non-HTML templates with YAML front matter (`.liquid`, `.json`, such as `assets/js/harness-data.liquid` -> `assets/js/harness-data.js` and `assets/harness/tiles.json`) as `role: "data"` in `scripts/docs-rendered-impact.ts`.
   - Fixed `readTree` in `scripts/check-derived-from.ts` to resolve `d.scope === "repository"` directory paths against `repoRoot` (`beans/`, `todos/`, `test/health/results/`) rather than `<instance>/<path>` (`cat-harness/beans/`), so `coneByFile` carries `cat-harness/beans` when `beans/defs/*` changes.
3. **Also in `litlfred/cat-harness-tools#903`:** synced `beans/defs/cat-tools-tk99--programme-progress-an-epic-burn-down-and-a-math-pr.md` to `status: completed` (`updated_at: 2026-10-29T07:38:35Z`) from `folio-assistant-hf2q` (`9bea5ab737`).

_2026-10-30T19:45:00Z_ — litlfred/cat-harness-tools#903 merged as `aabd721` (owner card 19:40Z), after merging main and resolving import conflicts. Still open: the three live checks above, which need folio-assistant re-pinned past `aabd721` and a bean-only push to observe. Session https://claude.ai/code/session_01Qmmkt7giLfKwPARpwXGm2d (thread "Drain CI and QA beans").

_2026-10-30T21:29:30Z_ — Checked `litlfred/folio-assistant` `main` `index.lock.json` and `docs-site.yml` runs after `litlfred/cat-harness-tools#903` (`aabd721`, merged `19:40Z`):
1. **Re-pin verification**: `litlfred/folio-assistant` `main` re-pinned `cat-harness-tools` past `aabd721` in Wave F (`a6e58846b9` at `19:45:57Z`), Wave G (`164908f486` at `19:57:26Z`, pinning `cat-harness-tools` `15939bf565e3`), Wave H (`110d1d59f6` at `20:03:40Z`), Wave I (`27d72c8d91` at `20:33:11Z`, pinning `97fc483d19a2`), and Wave J (`578dcc34cd` at `20:55:57Z`, pinning `f918daaf96ec`).
2. **Why `docs-site.yml` runs stopped before Step 55 (`Dependency-cone deploy, dry run (bean fwtz)`)**:
   - Run `41118050306` (Wave F `a6e58846b9`) failed at Step 10 (`Refresh QA working copy`) before `#2765` landed.
   - Runs `41119437676` (Wave G `164908f486`), `41120272139` (Wave H `110d1d59f6`), `41124135870` (Wave I `27d72c8d91`), `41125150958` (`#2793` `e0d4a39ae5`), and `41127097484` (Wave J `578dcc34cd`) all passed `qa:working-copy` (Step 10) and failed at Step 11 (`Release security gate`, `bun run cat security:gate`) on two newly introduced workflow checks:
     - `check:workflow-injection`: `docs-site.yml` line 1097 (`--base-path "/${{ github.event.repository.name }}"`, added in `#2771` `9885507564`) interpolated `github.event.repository.name` directly in `run:`. Fixed on `folio-assistant` `main` in [`litlfred/folio-assistant#2793`](https://github.com/litlfred/folio-assistant/pull/2793) (`e0d4a39ae5` at `20:41:13Z`) by moving `github.event.repository.name` to `env: REPO_NAME`.
     - `action-sha-pinning`: `.github/workflows/cancel-on-close.yml:16` (`#2768`) and `.github/workflows/main-qa.yml:35` (`#2770`) call `litlfred/cat-harness-tools/.github/workflows/layer-{cancel-on-close,main-qa}.yml@main`, which `cat-harness-tools/scripts/pin-actions.ts` rejected because `FIRST_PARTY` only named `litlfred/folio-assistant`.
3. **Unblocking fixes merged in `litlfred/cat-harness-tools`**:
   - [`litlfred/cat-harness-tools#1009`](https://github.com/litlfred/cat-harness-tools/pull/1009) (merged as `121bed1de787` at `21:01Z`): added `litlfred/cat-harness-tools` to `FIRST_PARTY_REPOS` in `scripts/pin-actions.ts` (with regression test in `test/security-gate.test.ts`) so `litlfred/cat-harness-tools/.github/workflows/layer-*.yml@main` reusable workflows pass `action-sha-pinning`.
   - [`litlfred/cat-harness-tools#1021`](https://github.com/litlfred/cat-harness-tools/pull/1021) (merged as `948747762569` at `21:29Z`): removed the temporary `"docs-site.yml (run): github.event.repository.name"` baseline entry from `scripts/workflow-injection-baseline.json` after `litlfred/folio-assistant#2793` (`e0d4a39ae5`) moved `github.event.repository.name` to `env: REPO_NAME` on `folio-assistant` `main`. (See also [`litlfred/folio-assistant#2790`](https://github.com/litlfred/folio-assistant/pull/2790), open, which SHA-pins those two reusable workflow calls in `.github/workflows/{cancel-on-close,main-qa}.yml` directly.)
4. **Next**: Once `litlfred/folio-assistant` `main` merges `#2790` or re-pins `cat-harness-tools` past `948747762569` (`#1021`), `Release security gate` (Step 11) in `docs-site.yml` will pass and Step 55 (`Dependency-cone deploy, dry run (bean fwtz)`) will execute and report its cone verdict.

_2026-10-31T01:15:00Z_ — Live check after the first deploy since #903. `docs-site.yml` run `41150189192` (`51690a5`) deployed (gh-pages `db3f36f`, 00:59Z) and step 55 `Dependency-cone deploy, dry run (bean fwtz)` ran for the first time: **full** · `71f74d2..51690a5` · predicted 340 · measured 16610 · missed 16519 · over-carried 275 · Jekyll pages in the cone 42. Not eligible, with five fallback reasons: four branch mounts (`cat-harness.health`, `cat-harness-tools.health`, `folio-assistant-core.health`, `who-iris.health`) had no tip in the old stamp, and `smart-trust-phw` was newly mounted. That is expected for a first run against a stamp written before #903; this deploy writes `mounts`, so the next run measures a real cone. Box 3: `assets/beans/index.json` on gh-pages was fresh at deploy (it carries `k6nw` `completed`, a bean edit at 00:28Z), but that came from a main push; a bean-only edit still rebuilds nothing, by the owner's 2026-10-20 "leave as is". Boxes 1 and 2 stay open under that ruling. Session https://claude.ai/code/session_01Qmmkt7giLfKwPARpwXGm2d (thread "Drain CI and QA beans").

_2026-10-31T04:12:00Z_ — Measured the four subsequent post-`#903` `docs-site.yml` Step 55 (`Dependency-cone deploy, dry run (bean fwtz)`) runs on `litlfred/folio-assistant` and opened [`litlfred/cat-harness-tools#1084`](https://github.com/litlfred/cat-harness-tools/pull/1084) (`f55ab2b` on `claude/fwtz-deploy-stamps-and-burndown-pin`):

| Run | `main` range | `gh-pages` commit | `inputs` doubts | Verdict | Predicted | Measured | Missed | Over-carried | Jekyll pages |
|---|---|---|---|---|---:|---:|---:|---:|---:|
| `41150189192` | `71f74d2..51690a5` | `db3f36f5` (`00:59Z`) | `4` (pre-`#903` stamp) | `full` | 340 | 16610 | 16519 | 275 | 42 |
| `41151975027` | `51690a5..1783b00` | `af27288a` (`01:31Z`) | `0` | `full` | 0 | 285 | 285 | 0 | 0 |
| `41157057132` | `1783b00..7c9a579` | `50ec43de` (`02:20Z`) | `0` | `full` | 21 | 212 | 180 | 14 | 20 |
| `41159867361` | `7c9a579..2a8ba97` | `58263b64` (`02:48Z`) | `0` | `full` | 0 | 5871 | 5871 | 0 | 0 |
| `41161331133` | `2a8ba97..949a3bc` | `cd63a2ac` (`03:19Z`) | `0` | `full` | 0 | 294 | 294 | 0 | 0 |
| `41164686924` | `949a3bc..24a29d7` | `fc97586d` (`04:03Z`) | `0` | `full` | 0 | 146 | 146 | 0 | 0 |

Findings and fixes in [`litlfred/cat-harness-tools#1084`](https://github.com/litlfred/cat-harness-tools/pull/1084) (`f55ab2b`):
1. **Branch-mount stamp doubts resolved (`0 doubt(s)`)**: Once `41150189192` (`db3f36f5`) wrote disambiguated `mounts` keys (`cat-harness.health`, `cat-harness-tools.health`, `folio-assistant-core.health`, `who-iris.health`, `beans`, `todos`, etc.) into `build.json`, all five subsequent runs (`41151975027`..`41164686924`) reported `0 doubt(s)` from `docs-cone-dryrun.ts inputs`.
2. **Per-deploy stamps in untouched instance graph exports and workflow visualizer pages (`DEPLOY_STAMPS` / `BUILD_STAMPS`)**:
   - Inspecting the `Measured, not predicted` files across `41151975027`..`41164686924` showed that all 26 `<instance>/<stub>.json` and `<instance>/<stub>.jsonld` files (from `instance-exports.ts` / `kg-export.ts` and `bootstrap-tools/scripts/export-graph.ts`) changed on every deploy even for untouched instances because they stamp the index checkout's `HEAD` commit (`"sourceCommit"`, `"sourceCommitSha"`, `"sourceCommitAt"`, `"wasDerivedFrom": "git:<sha>"`, `"generatedAtTime"`).
   - Similarly, all 17 workflow visualizer HTML pages (`en/cat-harness/beans/**/workflows/**/index.html`, written by `state-visualizer.ts`) changed on every deploy solely in `measured at <ISO> (when this page was built)`, `Measured at <ISO>, when this page was built`, and `data-wv-built="{&quot;at&quot;:&quot;<ISO>&quot;,...}"`.
   - Added these patterns to `DEPLOY_STAMPS` (`scripts/docs-cone-dryrun.ts`) and `generatedAtTime` to `BUILD_STAMPS` (`schemas/ui/rendered-impact.ts`), verified against live `gh-pages` blobs between `cd63a2ac` and `fc97586d`.
3. **Pin `fetchBeanHistory` (`assets/beans/burndown.json`) to the mounted `beans` tip (`scripts/bean-burndown-feed.ts`)**:
   - In run `41151975027` (`51690a5..1783b00`), `build.json.mounts.beans` was unchanged (`349f62f4ef1b`), yet `assets/beans/burndown.json` changed because `fetchBeanHistory` fetched `+refs/heads/cat/cat-harness/beans` live from `origin` later in the build after commit `dfb92c303b78` landed mid-run.
   - `fetchBeanHistory` now reads `mountedTipFor(root, opts.branch)` from `<git-dir>/branch-mounts/*.json` and updates `refs/cat-burndown/<branch>` to the mounted tip when present, keeping `assets/beans/burndown.json` aligned with `assets/beans/index.json` and `build.json.mounts.beans`.

_2026-10-31T12:55:00Z_ — Audited the next five `docs-site.yml` runs on `litlfred/folio-assistant` (`41168944281`..`41197669669`) and the first `writer-records.yml` run (`41199539193`), and opened [`litlfred/cat-harness-tools#1129`](https://github.com/litlfred/cat-harness-tools/pull/1129) (`9b48bb1` on `claude/fwtz-post-1084-stamps-and-writer-trace`):

| Run | `main` range | `cat-harness-tools` pin | `gh-pages` commit | `inputs` doubts | Re-pinned mounts | Verdict | Predicted | Measured | Missed | Over-carried | Jekyll pages |
|---|---|---|---|---|---|---|---:|---:|---:|---:|---:|
| `41168944281` | `33153b0..68fc69c` | `f07c534` (pre-`#1084`) | `122d48e2` (`05:11Z`) | `0` (51 inputs, 180 changed) | 9 (`cat-harness`, `cat-harness-tools`, `fhir-harness`, `folio-assistant-core`, `folio-assistant-sci`, `smart-base`, `smart-immunizations`, `smart-trust`, `who-iris`) | `full` | 0 | 469 | 469 | 0 | 0 |
| `41191483628` | `68fc69c..6a47cb2` | `f07c534` (pre-`#1084`) | `cc01b543` (`10:49Z`) | `0` (40 inputs, 72 changed) | 1 (`folio-assistant-core` `789f854..ebff26c`) | `full` | 0 | 383 | 383 | 0 | 0 |
| `41193661095` | `6a47cb2..18b6d4c` | `f07c534` (pre-`#1084`) | `64e2f1a3` (`11:21Z`) | `0` (3 inputs, 6 changed) | 1 (`cat-harness` `ef4750e..7ebb69c`) | `full` | 2 | 2342 | 2340 | 0 | 0 |
| `41196991700` | `18b6d4c..aa19343` | `67742ad` (**first post-`#1084`**, plus `#1102`, `#1104`, `#1109`, `#1113`) | `806c1d06` (`12:05Z`) | `0` (6 inputs, 75 changed) | 3 (`cat-harness`, `cat-harness-tools`, `fhir-harness`) | `full` | 1 | 2637 | 2636 | 0 | 0 |
| `41197669669` | `aa19343..c27093c` | `97490ca` (post-`#1084`/`#1104`/`#1109`/`#1113`/`#1115`) | `0486e13b` (`12:35Z`) | `0` (5 inputs, 11 changed) | 2 (`cat-harness` `7ebb69c..6351cfc`, `cat-harness-tools` `67742ad..97490ca`) | `full` | 1 | **31** | **31** | 1 | 0 |

Findings and fixes in [`litlfred/cat-harness-tools#1129`](https://github.com/litlfred/cat-harness-tools/pull/1129) (`9b48bb1`):
1. **Verification of `#1084`, `#1104`, `#1109`, and `#1113` in `41197669669` (`aa19343..c27093c`)**:
   - `41196991700` (`18b6d4c..aa19343`) was the transition deploy that first re-pinned `cat-harness-tools` past `#1084`/`#1104`/`#1109`/`#1113` and rewrote `blob/HEAD` links (`data-fa-pin`), split search scopes, and updated `docs-ui.js`/`avatars.css` (`?v=<12-hex>`).
   - On the very next deploy, `41197669669` (`aa19343..c27093c`), `measured` dropped to **31 files**! All 26 untouched `<instance>/<stub>.json(ld)` exports and all 17 untouched `state-visualizer.ts` workflow pages were eliminated from `measured`, and only `assets/js/search/cat-harness(.idx).json` moved (instead of all 25 search scopes).
   - Breakdown of the 31 measured files in `41197669669`:
     - **14 files** from the `cat/cat-harness/beans` move (`folio-assistant-e0jh`): `assets/beans/{burndown,count,index}.json`, `assets/harness/tiles.json`, `assets/js/harness-data.js`, `assets/slices/{beans.<new>.sqlite3,beans.<old>.sqlite3,beans.sqlite3.json,index.json}`, `en/cat-harness/beans/cat-harness/index.html`, `assets/js/search-data.json`, and `assets/js/search/{cat-harness.idx.json,cat-harness.json,manifest.json}`.
     - **6 files** from the `cat-harness-tools` `67742ad..97490ca` (`#1115`) repin: `en/cat-harness/code/cat-harness-tools/index.html`, `assets/qa/audit-coverage.qa-results.json`, and `payload/sha256/{8c793ba4...,acee817c...}(.json)`.
     - **11 remaining per-deploy stamp files** (now blanked by `#1129` in `scripts/docs-cone-dryrun.ts`): `pins.json` (`".": "<head-sha>"` self-repo SHA), `index.json` and `index.jsonld` (`root-index.ts` `"bytes"` and `"sha256"` over stamped `<instance>/<stub>.jsonld`), `en/cat-harness/site/index.html` (`gen-site-viz.ts` pre-deploy `gh-pages` `Tip`, `_render-log/` count, and `STAGING/` preview table), `assets/qa/availability.json` (`checkout` vs `fetched` race when `expected`/`published` counts match), and `smart-base`, `smart-trust`, `smart-trust-phw` `fhir-artifact-index/{package.tgz,index.json}` (ustar member header `mtime`/`chksum` in `package.tgz` and its compressed `bytes` in `fhir-artifact-index/index.json`).
2. **Assets hashed by `| fa_asset_version` (`scripts/docs-rendered-impact.ts`)**:
   - In `41193661095` (`6a47cb2..18b6d4c`), editing `assets/js/docs-ui.js` and `assets/css/narrow-viewport.css` changed `?v=<12-hex>` in `_includes/head_custom.html` across ~2,200 HTML pages while `docs-rendered-impact.ts` only predicted the 2 asset files. `indexSite` now records `| fa_asset_version` references in `assetReaders` so versioned asset edits propagate through `reachedPages` (`scope: "all"` when hashed in `head_custom.html`).
3. **First `writer-records.yml` run (`41199539193` on `c27093c`, Option B / `litlfred/cat-harness-tools#400`)**:
   - `writer-records.yml` run `41199539193` completed in 820s and uploaded `writer-records` (`13042795831`): **19 of 43** publish-time writers were recorded (`handler:index`, `smart-base:document-kinds`, `theme:viz`, `document-kinds:viz`, `node-kinds`, `bibliography:page`, `smart-trust-phw:pages`, `smart-trust:pages`, `smart-base:l1-extraction:pages`, `translation:status`, `openapi:viz`, `schema:viz`, `subscriptions:viz`, `navbar:include`, `kind:table`, `avatars:css`, `themes:css`, `folio:viz`, `kg:viewer`).
   - Of the 24 unrecorded writers: **6** (`node-kind:pages`, `smart:pages`, `jsonld:contexts`, `smart-base:pages`, `auto:docs`, `lsi:viz`) failed with `the writer reads <dir> and then rewrites it` on an existing directory because `mkdirSync(dir, { recursive: true })` calls `mkdir(dir) = -1 EEXIST` after `stat(dir) = 0`, and **2** (`glossary:page`, `state:visualizer`) failed with `unparsed trace line: ???( <detached ...>` on thread exit. Both trace-parser bugs are fixed in `scripts/ci-cone.ts` by `#1129` (+8 writers -> 27/43). The remaining 16 unrecorded writers are: 12 reaching a `traced` input site (`9` on `git-refs: git`, `2` on `process-presentations: computed load`, `1` on `branch-store`), 3 running non-replayable git subcommands (`ig-index:build` `git ls-remote`, `uml:overview` `git hash-object --stdin-paths`, `slice:sqlite` `git status`), and 1 exceeding `MAX_TRACE_BYTES` (`subgraph:jsonld` at 309 MB > 256 MB).
- **Deterministic IG `package.tgz` Fix (`litlfred/fhir-harness#250`, commit `12548af`):** Updated `packFromAst` in `fhir-harness/scripts/build-ig-indexes.ts` to build a deterministic POSIX.1-1988 `ustar` archive + `zlib.gzipSync` with zeroed `mtime`/`MTIME`, eliminating the 6 per-deploy `fhir-artifact-index/{package.tgz,index.json}` diffs and preventing downstream `writer-cone.ts` IG writer digest invalidation.

_2026-10-31T15:35:00Z_ — Follow-up updates on Option B writer-records, preview writer-skipping, and deterministic IG archives:
- **[`litlfred/cat-harness-tools#1129`](https://github.com/litlfred/cat-harness-tools/pull/1129) updated to `186a652`** (`57d0c53` + `49a8e8f` + merges of `origin/main` through `73436998` at `17:49Z`):
  - In addition to the +8 `ci-cone.ts` trace-parser fixes (`9b48bb1`), commit `57d0c53` makes the remaining 14 `derive:publish` writers recordable under `writer-cone` (+22 writers total in `#1129`):
    - `scripts/ci-cone.ts`: raises `MAX_TRACE_BYTES` from 256 MiB to 512 MiB and iterates trace lines without splitting into an array (unblocking `subgraph:jsonld`, whose trace is ~309 MB), and allows read-only `git remote get-url` with in-checkout `-C <dir>` path folding via `repoRelative(roots, ...)`.
    - `src/core/git-refs.ts`: runs `git -C <root> remote get-url origin` directly in `detectRepoUrl` as a replayable `tree` site instead of calling the traced `publishedPaths` `git()` helper (unblocking 9 writers: `library:viz`, `voices:viz`, `uploads:viz`, `skills:docs`, `tools:viz`, `methodologies:viz`, `external-schemas:viz`, `docs:pages`, `docs:harness`).
    - `scripts/process-presentations.ts` & `pipeline/json-manifest.ts`: moves `inputSiteReached("json-manifest: computed load")` onto the legacy `.ts` fallback in `loadManifestValue` so `.json` manifests reach no traced site (unblocking `render:bpmn` and `processes:viz`).
    - `scripts/kg-export.ts`, `scripts/gen-slice-sqlite.ts`, `scripts/gen-subgraph-jsonld.ts`: adds `provenance: false` to `buildExport` for `@graph`-only callers so they do not spawn `git status --porcelain` under `strace` or record `HEAD` (unblocking `slice:sqlite` and `subgraph:jsonld`).
    - `scripts/derive-at-publish.ts` & `scripts/qa-working-copy.ts`: passes `QA_WORKING_COPY_BUILDING=1` to child writers when the QA working copy stamp is current so `uml:overview` does not spawn `git hash-object --stdin-paths` inside `strace`.
- **Open [`litlfred/fhir-harness#250`](https://github.com/litlfred/fhir-harness/pull/250) (`12548af` on `fix/fwtz-400-deterministic-ig-package-tgz`)**:
  - Replaces external `tar -czf` in `packFromAst` (`scripts/build-ig-indexes.ts`) with a byte-for-byte deterministic POSIX `ustar` archive builder (sorted entries, zeroed `mtime`/`uid`/`gid`/`uname`/`gname`, normalized `gzipSync` header `MTIME = 0`, `OS = 0x03`), eliminating per-deploy `smart-*/fhir-artifact-index/{package.tgz,index.json}` diffs and downstream `writer-cone.ts` IG writer invalidation.
- **Merged on `main` (`litlfred/cat-harness-tools` & `litlfred/folio-assistant`)**:
  - [`litlfred/folio-assistant#2841`](https://github.com/litlfred/folio-assistant/pull/2841) (`08a3a88`), [`#2842`](https://github.com/litlfred/folio-assistant/pull/2842) (`c453f26`), [`#2846`](https://github.com/litlfred/folio-assistant/pull/2846) (`facc291`), [`#2848`](https://github.com/litlfred/folio-assistant/pull/2848) (`11ffff6`, re-pinning `cat-harness-tools` to `f62a1d9`, where `writer-records.yml` run `41205872016` recorded **27 of 43** writers), [`#2849`](https://github.com/litlfred/folio-assistant/pull/2849) (`c8cf761`, `writerVerdicts` in `build.json`), and [`#2850`](https://github.com/litlfred/folio-assistant/pull/2850) (`c520883`, `writerVerifyLog` in `build.json`).
  - [`litlfred/cat-harness-tools#1147`](https://github.com/litlfred/cat-harness-tools/pull/1147) (merged as `8cad4dd`: allows writers re-reading their own declared outputs for 8 writers and raises `MAX_RECORDS_PER_WRITER` to 200,000 for 4 large-tree writers), re-pinned in [`litlfred/folio-assistant#2852`](https://github.com/litlfred/folio-assistant/pull/2852) (`e9dc3ba`).
  - [`litlfred/cat-harness-tools#1149`](https://github.com/litlfred/cat-harness-tools/pull/1149) (merged as `0644c19`: `CAT_WRITER_SKIP=1` in `derive:publish` to skip writers whose records match in previews), wired in [`litlfred/folio-assistant#2853`](https://github.com/litlfred/folio-assistant/pull/2853) (`d2243e9`: caches `build/writer-cone` from `main` in `writer-records.yml` and skips unchanged `derive:publish` writers in `staging-preview.yml`).
  - [`litlfred/folio-assistant#2854`](https://github.com/litlfred/folio-assistant/pull/2854) (`04a7043`: times each command of the KG export step in `docs-site.yml`).
  - [`litlfred/cat-harness-tools#1156`](https://github.com/litlfred/cat-harness-tools/pull/1156) (merged as `10ebb8b`: `rail-standalone-pages` computes each page's rail once per owner and depth, ~30x faster), re-pinned in [`litlfred/folio-assistant#2858`](https://github.com/litlfred/folio-assistant/pull/2858) (merged as `66c527d`, head `6aa82ae`, stamping KG export step times).
  - [`litlfred/folio-assistant#2860`](https://github.com/litlfred/folio-assistant/pull/2860) (merged as `2243eb7c`): previews publish `STAGING/<slug>/writer-skip.txt` with the writer-skip header, every skipped writer, and the reason each of the remaining writers ran.
  - [`litlfred/cat-harness-tools#1168`](https://github.com/litlfred/cat-harness-tools/pull/1168) (merged as `73436998`): `parseTrace` (`scripts/ci-cone.ts`), `readTraceFile` (`scripts/writer-cone.ts`), and `scripts/derive-at-publish.ts` add `rewriteAsInput` so when a writer (`node-kind:pages`, `glossary:page`, `smart:pages`, `docs:pages`) reads a committed file and rewrites it and no writer declares that file as an output, it is kept as an input (`rewritten`) with its state after the run (and dropped if another writer also writes or rewrites that file). Merged cleanly into [`litlfred/cat-harness-tools#1129`](https://github.com/litlfred/cat-harness-tools/pull/1129) at `186a652`.
  - [`litlfred/cat-harness-tools#1172`](https://github.com/litlfred/cat-harness-tools/pull/1172) (merged as `6a9a5b3`, `claude/skip-shared-digests`): `derive:publish` times each writer (`run` line + duration) and shares a single digest memo across skip decisions; wired into previews in [`litlfred/folio-assistant#2861`](https://github.com/litlfred/folio-assistant/pull/2861) (merged as `77afed97`, head `f23ef92c`, `claude/preview-writer-times-fwtz`).
  - [`litlfred/folio-assistant#2839`](https://github.com/litlfred/folio-assistant/pull/2839) (merged as `4f8d2c74`, head `5f725f8b`, `claude/preview-drop-nav-activation`): re-pins `cat-harness-tools` to `b03f70f` (`#1107`) to drop the dead `site-bar` nav activation style in previews.
  - [`litlfred/cat-harness-tools#1193`](https://github.com/litlfred/cat-harness-tools/pull/1193) (merged as `2a198372` at `2026-10-31T21:49:45Z`): `derive:publish` puts back every file a skipped writer actually wrote when skipped, preventing downstream steps from missing outputs of skipped writers. All 17 open PRs in `litlfred/cat-harness-tools` (including `#1129`, `#1157`, `#1159`, `#1165`, `#1176`) remain `MERGEABLE` / `CLEAN`.
  - [`litlfred/cat-harness#839`](https://github.com/litlfred/cat-harness/pull/839) (`d80077a0` / `4885d43d`: cross-instance `builtAtPublish` artefacts and refreshed ledger/translations), [`litlfred/cat-harness#870`](https://github.com/litlfred/cat-harness/pull/870) (`92fdb3a9` / `7f06480d`), [`litlfred/cat-harness#872`](https://github.com/litlfred/cat-harness/pull/872) (`d9223fb7` / `3d453854`), [`litlfred/cat-harness-tools#1175`](https://github.com/litlfred/cat-harness-tools/pull/1175) (`3217855c` / `9274bedc`), [`litlfred/cat-harness-tools#1182`](https://github.com/litlfred/cat-harness-tools/pull/1182) (`f284ab7e` / `c29ea22e`), [`litlfred/folio-assistant-core#442`](https://github.com/litlfred/folio-assistant-core/pull/442) (`360558a3` / `32219681`), [`litlfred/fhir-harness#247`](https://github.com/litlfred/fhir-harness/pull/247) (`43a84f0e` / `e0c907b4`), [`litlfred/smart-base#257`](https://github.com/litlfred/smart-base/pull/257) (`ce2ee669` / `3017d04a`), [`litlfred/who-iris#145`](https://github.com/litlfred/who-iris/pull/145) (`0d541d55` / `3728eb03`), [`litlfred/who-iris#146`](https://github.com/litlfred/who-iris/pull/146) (`9d4bff45` / `81e0a951`), [`litlfred/cat-harness#876`](https://github.com/litlfred/cat-harness/pull/876) (`4635a8af`), [`litlfred/cat-harness#877`](https://github.com/litlfred/cat-harness/pull/877) (`6789d7fe`), [`litlfred/cat-harness-tools#1177`](https://github.com/litlfred/cat-harness-tools/pull/1177) (`3005dede` / `5132c11`), [`litlfred/cat-harness-tools#1189`](https://github.com/litlfred/cat-harness-tools/pull/1189) (`eba0dfcb`), [`litlfred/cat-harness-tools#1190`](https://github.com/litlfred/cat-harness-tools/pull/1190) (`f6126b2f`), [`litlfred/cat-harness-tools#1192`](https://github.com/litlfred/cat-harness-tools/pull/1192) (`19330c41`), [`litlfred/cat-harness-tools#1193`](https://github.com/litlfred/cat-harness-tools/pull/1193) (`2a198372`), [`litlfred/folio-assistant-core#447`](https://github.com/litlfred/folio-assistant-core/pull/447) (`f77716f0`), [`litlfred/folio-assistant-core#449`](https://github.com/litlfred/folio-assistant-core/pull/449) (`580d1db4`), and [`litlfred/folio-assistant#2861`](https://github.com/litlfred/folio-assistant/pull/2861) (`77afed97` / `f23ef92c`) merged on `main`; [`litlfred/cat-harness#873`](https://github.com/litlfred/cat-harness/pull/873) (`01a44776`, `fix/bpmn-svgs-bootstrap-tools-72344e1`) rebased onto `6789d7fe` (`#877`).
  - [`litlfred/cat-harness-tools#1198`](https://github.com/litlfred/cat-harness-tools/pull/1198) (merged as `6417b9d`, `claude/kg-audit-test-runs-1191`, `kg:audit:check` computes mounted harness test runs and prints failing findings last), [`litlfred/folio-assistant-core#450`](https://github.com/litlfred/folio-assistant-core/pull/450) (`344e5b35`, `claude/committee-label-fix`), [`litlfred/folio-assistant-core#452`](https://github.com/litlfred/folio-assistant-core/pull/452) (`13f2d884`, `claude/confirm-yes-no-only`, with `#343` `4d78bb9` and `#349` `b86a0af` cleanly updated), and [`litlfred/fhir-harness#249`](https://github.com/litlfred/fhir-harness/pull/249) (`45e42a76`, `claude/ig-index-pinned-clone`, `#248`) merged on `main`; [`litlfred/folio-assistant-core#454`](https://github.com/litlfred/folio-assistant-core/pull/454) (`06ab5e9`, `fix/448-agent-record-corpus-gate-workflow`) opened for `#448`.

_2026-11-01T20:50Z_ — Moved under folio-assistant-1xhc: the old epic closes (owner card Q-DQ-1 A). Session https://claude.ai/code/session_01Qmmkt7h4RWc6UwiBW5kbZ2
