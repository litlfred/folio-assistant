---
# folio-assistant-ay33
$schema: bean/1.0.0
title: 'CI image: prepared container image replaces per-job setup'
status: completed
type: task
priority: high
created_at: 2026-11-05T11:55:31Z
updated_at: 2026-11-08T07:17:00Z
parent: folio-assistant-k3vv
---

Sibling 'CI speed: prepared image' (launched by session_01VQDpPffYARDQ8juksAZScf). Build ghcr.io/litlfred/folio-assistant-ci once per hash of index.lock.json + bun.lock + tool versions, holding mounted layers, node_modules, Chromium + deps, Java/PlantUML, Ruby/Jekyll. Jobs restore via .github/actions/ci-setup and only verify mounts (mount:lock:check); fall back to today's steps when no image exists. Owns: ci-image workflow, .github/actions/ci-setup, setup steps of code-quality-gates.yml and feature-staging.yml jobs.

## Done when
[x] ci-image workflow builds and pushes on main/dispatch only, minimal perms, pinned actions
[x] ci-setup composite restores from the image, falls back cleanly
[x] setup seconds measured before/after with run IDs
[x] job-collapse proposal written

## Progress (2026-11-05)

- #2961 (infra): ci-image.yml, .github/ci-image/*, .github/actions/ci-setup. The PR test job was green on run 42024357472: build, then push to a throwaway registry, then a streamed restore with `mount:lock:check`, `bun install` and a Chromium launch, all in 7 s on a runner. The image is 7 zstd layers, about 700 MB compressed.
- #2964 (wiring, stacked): changes only the setup steps of 13 CQG jobs and FS `stage`. The 4 jobs that run platform `.ts` directly keep a visible `mount-from-lock` step for check:workflow-submodules. A generic fix in cat-harness-tools (follow local composite actions) would remove those steps; this session was not granted access to that repo.
- Baseline is CQG run 42012108138: 1742 s of setup out of 6344 s of job time. The in-scope part is about 870 s: mount cache 347, IG 131, layer mount 105, chromium 92, install 62, checkout 53, artifacts 43, setup-bun 35.
- Owner decision pending: whether the GHCR package goes public or jobs get `packages: read`. Until then jobs fall back to today's steps.

## Job-collapse proposal (once setup is ~10 s plus state:mount after cat-harness-tools#1489)

The fixed cost per job falls from about 100 s to about 15 s. After that, the reason to keep a job separate is parallel wall time, not setup cost. Candidates:
1. `hygiene` + `typescript-static` + `verdict-reuse`: three short jobs (2–4 min each) that share no artifact. Merging them into one saves 2 runner requests per run.
2. `gates-standalone` + `gates-unrun`: both build their own IG indexes. Merging them saves 1 request and one `ig-index:build` (about 11 s).
3. The bun-test shards: re-tune the shard count against the new fixed cost. With 15 s setup, fewer shards may still meet the same wall time.
4. Keep the e2e shards and `qa-working-copy` separate, since they are on the critical path.
These need the siblings that own `if:` and work steps (CI speed 2/3/7/10).

## Cache-First CI alignment (2026-11-05, integrator CI speed 14, decision 2a)

- The image is a Class A cache. `key.sh` stays the mount-free implementation of its key, because the key must be computable before anything is mounted.
- [x] (sent to CI speed 14 for cat-harness-tools#1519, placement (c): instance cat-harness-tools) Once cat-harness-tools ships the `cache` node kind: declare the image's `cache` node (inputs index.lock.json, bun.lock, package.json, .github/ci-image/*, .github/actions/ci-setup/*, bun version, ImageOS; trust class A; location ghcr.io/<owner>/<repo>-ci) so that `cache:key --check image` agrees with key.sh.
- [x] After #2961 merges, CI speed 14 copies ci-setup and the ci-image scripts into cat-harness-tools as a shared action and repoints them. This repo's copy then calls the shared one.
- Done: the image name is derived from the repo, hit/miss/why goes to the step summary, and the workspace-only restore bug is fixed (52670b8).
- The layers ref (CI speed 13, cat-harness-tools#1506 / #2971) is picked up through mount-from-lock with no edit here.

## Measured after (2026-11-06)

- #2961 merged (3955a14). The first image was published by run 42139743524: key 4d80b37e…, 7 layers, 670 MiB. Pulled from GHCR it restored in 5.6 s and mount:lock:check was OK. The package is public by inheritance (an anonymous manifest fetch returns 200), so the owner did not need to act.
- On #2964 (run 42139985103) the jobs hit the image. TypeScript lint/types (job 127637605921): setup 40 s → 7 s; the whole job 2:32 → 1:24, which includes state:mount 49 → 17 s from cat-harness-tools#1489. Import hygiene (job 127637605474): restore 3.9 s.
- The baseline is CQG run 42012108138, job 127193424738.
- Remaining: #2964 merge; repoint to the shared cat-harness-tools action (CI speed 14, #1552); drop the 4 visible replays once a re-pin carries #1498.

## Follow-up queued (2026-11-06)

- [x] After #2964 merges AND a re-pin moves cat-harness-tools to ≥ 4641d2b (cat-harness-tools#1552, the shared actions): repoint the jobs to `litlfred/cat-harness-tools/.github/actions/ci-setup@<lock sha>` and ci-image.yml to `.../ci-image@<lock sha>` (op key|build|fetch); delete `.github/ci-image` and `.github/actions/ci-setup`. Pins must equal the lock's cat-harness-tools commit (check:workflow-pins, `# index.lock.json`). Expect a key change, so the first publish after the repoint makes a new tag.
- [x] In the same follow-up, if the re-pin carries cat-harness-tools#1498: drop the 4 visible mount-from-lock steps (gates-docs, gates-unrun, qa-publish, stage) — superseded by #2999 switching to the remote action `litlfred/cat-harness-tools/.github/actions/ci-setup@<lock sha>`.
- #2964 fix 04aed59: browser jobs keep a visible `playwright install --with-deps` (gates.ts installsBrowser reads job steps); ci-setup uses `chromium: browser`.
- #2999 (draft, stacked on #2985): repoints the jobs to the shared ci-setup/ci-image at the lock sha and deletes the local copies. The 3 visible mount-from-lock steps stay until a tools re-pin carries cat-harness-tools#1594 (check:workflow-submodules reads a remote action from the whole mount at the lock sha).
- [x] After a re-pin carrying #1594: audited the 4 visible `mount-from-lock` steps (`gates-docs`, `gates-unrun`, `qa-publish` in `code-quality-gates.yml` and `stage` in `feature-staging.yml`) at `cat-harness-tools` `4e79324d5d36` (which includes `cat-harness-tools#1594` `4427caf7e2c9`). They remain required by `check:workflow-submodules` because `cat-harness-tools/.github/actions/ci-setup/action.yml` delegates to `$GITHUB_ACTION_PATH/mount.sh` rather than inlining `mount:lock:check` or `mount-from-lock.sh --root .` in `action.yml`; at runtime after a warm image restore, the step is a 2 s no-op verification (e.g. job `128657569485` and `128657569534`).
- 2026-11-07: #2999 was merged by the owner into #2985's branch (2f4e9a1), so it lands with #2985. The coordinator was asked to run `workflow-pins --write` there (the lock is at tools 9a4ccd9; the calls named 8e7ad11).
- [x] After #2985 lands: verify the ci-image publish on main makes the new tag (new key) and that jobs hit it.
- [x] After a re-pin carrying cat-harness-tools#1594: audited visible `mount-from-lock` steps (see above).

## Verification on `main` after `#2985` (2026-11-08)

- `#2985` (carrying `#2999` `2f4e9a1dbf8f`) merged to `litlfred/folio-assistant` `main` as `da3ca528562a` (`2026-11-08T06:42:36Z`), pinning `cat-harness-tools` to `4e79324d5d3637bbc592b657f71f1ec3b6b86797` (248 commits ahead of `cat-harness-tools#1594` `4427caf7e2c9`), repointing all CQG jobs and Feature Staging `stage` to `litlfred/cat-harness-tools/.github/actions/ci-setup@4e79324d5d3637bbc592b657f71f1ec3b6b86797 # index.lock.json` and `ci-image.yml` to `litlfred/cat-harness-tools/.github/actions/ci-image@4e79324d5d3637bbc592b657f71f1ec3b6b86797 # index.lock.json`, and deleting `.github/actions/ci-setup` and `.github/ci-image/*`.
- `ci-image.yml` run `42455857490` (job `128654595871`, `2026-11-08T06:42:40Z`–`06:45:02Z`, `success`) on `da3ca528562a` computed the new key `1a036cac63c3fefc0dbffa416736a783a53979cbd2452d6042d307488c5eb301`, built and pushed `ghcr.io/litlfred/folio-assistant-ci:1a036cac63c3fefc0dbffa416736a783a53979cbd2452d6042d307488c5eb301@sha256:a00af8a72618e0804ea4b507803cf939589008c7ebf6f0a78ad882557b9f66e4` (7 layers, 672 MiB compressed), and verified restore into a fresh checkout (`mount:lock:check` OK).
- CQG run `42455857557` (`main`, `da3ca528562a`) jobs that started after the image publish at `06:44:54Z` hit the new tag `1a036cac63c3…`:
  - Job `128657569479` (`Repository gates — workflows, skills, knowledge graph (hard)`, `success`): restored `ghcr.io/litlfred/folio-assistant-ci:1a036cac63c3…` in `4.4 s`, verified all 12 mounted instances (`mount:lock --check: 12 instance(s) — OK`, `duration_ms=7015`), and skipped fallback cache/mount/install steps (`HIT: true`, `source=image`).
  - Jobs `128657569485` (`gates-unrun`), `128657569534` (`gates-docs`), and `128657569562` (`skill-registration-chain`) likewise restored from the prepared CI image in 7–8 s.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.
_2026-11-08T07:17:00Z_ — Completed by agy (R4 Lane 6, 67102a1e-8fb4-42a5-a0c5-0047ffb976b0): verified `ci-image.yml` run `42455857490` published `1a036cac63c3…` on `main` (`da3ca528562a`) and CQG run `42455857557` (job `128657569479`, `4.4 s` restore) hit it.
