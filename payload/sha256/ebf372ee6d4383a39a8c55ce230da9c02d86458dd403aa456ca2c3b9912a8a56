---
# folio-assistant-ay33
$schema: bean/1.0.0
title: 'CI image: prepared container image replaces per-job setup'
status: in-progress
type: task
priority: high
created_at: 2026-11-05T11:55:31Z
updated_at: 2026-11-05T11:55:31Z
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
- [ ] After #2961 merges, CI speed 14 copies ci-setup and the ci-image scripts into cat-harness-tools as a shared action and repoints them. This repo's copy then calls the shared one.
- Done: the image name is derived from the repo, hit/miss/why goes to the step summary, and the workspace-only restore bug is fixed (52670b8).
- The layers ref (CI speed 13, cat-harness-tools#1506 / #2971) is picked up through mount-from-lock with no edit here.

## Measured after (2026-11-06)

- #2961 merged (3955a14). The first image was published by run 42139743524: key 4d80b37e…, 7 layers, 670 MiB. Pulled from GHCR it restored in 5.6 s and mount:lock:check was OK. The package is public by inheritance (an anonymous manifest fetch returns 200), so the owner did not need to act.
- On #2964 (run 42139985103) the jobs hit the image. TypeScript lint/types (job 127637605921): setup 40 s → 7 s; the whole job 2:32 → 1:24, which includes state:mount 49 → 17 s from cat-harness-tools#1489. Import hygiene (job 127637605474): restore 3.9 s.
- The baseline is CQG run 42012108138, job 127193424738.
- Remaining: #2964 merge; repoint to the shared cat-harness-tools action (CI speed 14, #1552); drop the 4 visible replays once a re-pin carries #1498.

## Follow-up queued (2026-11-06)

- [ ] After #2964 merges AND a re-pin moves cat-harness-tools to ≥ 4641d2b (cat-harness-tools#1552, the shared actions): repoint the jobs to `litlfred/cat-harness-tools/.github/actions/ci-setup@<lock sha>` and ci-image.yml to `.../ci-image@<lock sha>` (op key|build|fetch); delete `.github/ci-image` and `.github/actions/ci-setup`. Pins must equal the lock's cat-harness-tools commit (check:workflow-pins, `# index.lock.json`). Expect a key change, so the first publish after the repoint makes a new tag.
- [ ] In the same follow-up, if the re-pin carries cat-harness-tools#1498: drop the 4 visible mount-from-lock steps (gates-docs, gates-unrun, qa-publish, stage).
- #2964 fix 04aed59: browser jobs keep a visible `playwright install --with-deps` (gates.ts installsBrowser reads job steps); ci-setup uses `chromium: browser`.
