---
# folio-assistant-9ml4
$schema: bean/1.0.0
title: 'Cache-first CI: one cached-step primitive, derived keys, trust classes, budget, hit-rate report'
status: in-progress
type: feature
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T13:19:32Z
updated_at: 2026-11-08T08:38:00Z
parent: folio-assistant-k3vv
---

Every CI step is a pure function of its inputs. The primitive is `.github/actions/cached-step` (litlfred/folio-assistant#2972).

- **Trust classes:**
  - (a) entries that can be verified exactly: committers may publish them with `cache:publish`, and CI only verifies them;
  - (b) verdicts, which go through #2957 and #2958;
  - (c) main-only entries.
- **Daily report:** the hit-rate and budget report runs in `sweeps.yml`.
- **Determinism audit:** builds each producer twice and diffs the bytes.

## Still to do
- [x] cat-harness-tools `cache-key.ts` and the cat-harness skill `cache-first-ci` (merged in `cat-harness-tools#1519` `9afa699c60a0` and `cat-harness#1052` `7102ee5ca858`, re-pinned in `folio-assistant#2985` `da3ca528562a`).
- [ ] Port `bundle-cache.sh`, the prepared image, the layers ref and the cone onto the primitive, each by its owner (CI cone ported in `folio-assistant#3010` `2e601643f4ba`; layers ref declared as cache node & reporting `cached-step 'layers'` summary in `cat-harness-tools#1506` / `folio-assistant#2971` `c5e754827fb3`; `bundle-cache.sh`, `cat-mount-v1-*` in 6 workflows, `writer-cone-*`, and `layer-pr-checks-*` bespoke `actions/cache` steps remain).
- [ ] File a bean for each non-deterministic writer the audit lists (`determinism-audit.yml` run `42344504396` cleared `smart-pages`, `ig-index`, and `render-bpmn` as byte-identical; `kg-export` `_kg/cat-harness/cat-harness.jsonld` `generatedAt` and `qa-working-copy` / `publish-pages` `block-qa` `reviewed_at` + witness sidecars still differ).

## Done when
- [ ] every bespoke cache is on cached-step
- [x] the daily report shows a hit rate per step
- [ ] the cache stays under 80 % of 10 GB

_2026-11-05T13:19:32Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for CI speed 14 (cache-first CI), session https://claude.ai/code/session_01VQDpPeMVBfa2srZmpTnGfi, which holds the claim.

## Verification & Status (2026-11-08)

_2026-11-08T08:38:00Z_ — Verified on `origin/main` by R5-Lane-3 (`651d2ad4-76bb-418a-96eb-f1b84e1f00e0` under `92bff8c9-777d-458a-a380-8dd5bf5cc0f3`). Bean remains `in-progress` because Done-when 1 (remaining bespoke `actions/cache` steps) and Done-when 3 (cache usage `< 80%` of 10 GB) are not yet satisfied on `origin/main`.

### 1. Merged PRs on `origin/main` (0 open PRs matching `9ml4`)

| Repository | PR | Merge Commit SHA | Merged At | Summary |
|---|---|---|---|---|
| `litlfred/cat-harness` | [`#1050`](https://github.com/litlfred/cat-harness/pull/1050) | `0b02116e33c8` | `2026-11-06T00:19:07Z` | `remote-mount`: layers cache ref fast path |
| `litlfred/cat-harness` | [`#1052`](https://github.com/litlfred/cat-harness/pull/1052) | `7102ee5ca858` | `2026-11-06T02:48:08Z` | `sdlc/skills/sdlc-core/cache-first-ci.md` skill |
| `litlfred/cat-harness` | [`#1057`](https://github.com/litlfred/cat-harness/pull/1057) | `cb54ab534d05` | `2026-11-06T03:48:29Z` | `sdlc/processes/cache.bpmn` (`Process_Cache`) |
| `litlfred/cat-harness` | [`#1088`](https://github.com/litlfred/cat-harness/pull/1088) | `24262360d7db` | `2026-11-06T07:06:27Z` | `Process_Cache`: skill annotations & summary |
| `litlfred/cat-harness` | [`#1122`](https://github.com/litlfred/cat-harness/pull/1122) | `d1038b893ce7` | `2026-11-07T14:57:00Z` | Glossary ledger: record `kind/cache` |
| `litlfred/cat-harness-tools` | [`#1508`](https://github.com/litlfred/cat-harness-tools/pull/1508) | `a09409980f2f` | `2026-11-05T17:39:53Z` | `check:schema-nodes` caller scoping in layer PR checks |
| `litlfred/cat-harness-tools` | [`#1551`](https://github.com/litlfred/cat-harness-tools/pull/1551) | `b3a6260a4b3b` | `2026-11-05T21:55:43Z` | `ci-cone`: test run `BUN_OPTIONS` & `state-mount` reference direction |
| `litlfred/cat-harness-tools` | [`#1519`](https://github.com/litlfred/cat-harness-tools/pull/1519) | `9afa699c60a0` | `2026-11-06T01:49:05Z` | `cache` node kind (`schemas/sdlc/cache.ts`), 14 `caches/*.cache.json` nodes, `scripts/cache-key.ts`, `scripts/cache-plan.ts`, `scripts/gen-caches-viz.ts` (`caches:viz:check`) |
| `litlfred/cat-harness-tools` | [`#1523`](https://github.com/litlfred/cat-harness-tools/pull/1523) | `051bc5e04186` | `2026-11-06T02:48:49Z` | Markdown table cell backslash/pipe escaping in `gen-caches-viz.ts` |
| `litlfred/cat-harness-tools` | [`#1512`](https://github.com/litlfred/cat-harness-tools/pull/1512) | `dd1599af606b` | `2026-11-06T02:49:08Z` | `derive-at-publish`: hash `CAT_BUILD_TYPE` and writer skip/record switches |
| `litlfred/cat-harness-tools` | [`#1611`](https://github.com/litlfred/cat-harness-tools/pull/1611) | `26fbb5ec8743` | `2026-11-07T08:21:58Z` | `gen-caches-viz`: usage line `VIEW_FILE` reference |
| `litlfred/folio-assistant` | [`#2971`](https://github.com/litlfred/folio-assistant/pull/2971) | `c5e754827fb3` | `2026-11-06T00:48:39Z` | Layers cache writers publish `refs/cat/layers/<key>` |
| `litlfred/folio-assistant` | [`#2972`](https://github.com/litlfred/folio-assistant/pull/2972) | `43b5de1c3352` | `2026-11-06T04:47:35Z` | `.github/actions/cached-step`, `.github/scripts/cache-report.sh` in `sweeps.yml`, `.github/workflows/determinism-audit.yml`, `.github/cache-inventory/2026-11-05.cache-inventory.json` |
| `litlfred/folio-assistant` | [`#2983`](https://github.com/litlfred/folio-assistant/pull/2983) | `450f43da9a37` | `2026-11-06T04:59:26Z` | `layers-cache.yml`: skip rebuilding verified layers ref |
| `litlfred/folio-assistant` | [`#2990`](https://github.com/litlfred/folio-assistant/pull/2990) | `b01de863f2cd` | `2026-11-06T07:48:53Z` | `determinism-audit`: run records are carried, not compared |
| `litlfred/folio-assistant` | [`#3010`](https://github.com/litlfred/folio-assistant/pull/3010) | `2e601643f4ba` | `2026-11-07T07:33:46Z` | Port CI cone records (`ci-cone-gates-kg`, `ci-cone-gates-docs`, `ci-cone-gates-unrun`) onto `cached-step` (`trust: main-only`, `warm: true`) |
| `litlfred/folio-assistant` | [`#3009`](https://github.com/litlfred/folio-assistant/pull/3009) | `be39d1acfdb9` | `2026-11-07T07:46:28Z` | `determinism-audit`: mount branch-kept graphs once before snapshot |
| `litlfred/folio-assistant` | [`#3013`](https://github.com/litlfred/folio-assistant/pull/3013) | `d70581d1b982` | `2026-11-07T11:39:14Z` | `cached-step` README: record owner's per-passed-check ruling for CI cone |
| `litlfred/folio-assistant` | [`#2985`](https://github.com/litlfred/folio-assistant/pull/2985) | `da3ca528562a` | `2026-11-08T06:42:36Z` | Re-pin `cat-harness-tools` and `cat-harness` into `folio-assistant` (`caches:viz:check` live on `main`) |

### 2. Gate Status & Daily Hit-Rate Report (`Done when` #2 — ✅ Met)

- **Main CI gates**:
  - `litlfred/folio-assistant` `main` (`3a0942bca4c3`): `code-quality-gates.yml` run [`42459982211`](https://github.com/litlfred/folio-assistant/actions/runs/42459982211) (`2026-11-08T07:44:01Z`) passed all hard gates (`conclusion: success`), restoring and saving `cached-step` records for `ci-cone-gates-docs`, `ci-cone-gates-kg`, and `ci-cone-gates-unrun`.
  - `litlfred/cat-harness` `main` (`42d4f1560bc5`): `Push on main` run [`42455859535`](https://github.com/litlfred/cat-harness/actions/runs/42455859535) passed (`conclusion: success`).
  - `litlfred/cat-harness-tools` `main` (`13ebf0015b47` / `34889deab9e3`): `Push on main` run [`42462694368`](https://github.com/litlfred/cat-harness-tools/actions/runs/42462694368) and `PR checks` run [`42461170254`](https://github.com/litlfred/cat-harness-tools/actions/runs/42461170254) passed (`conclusion: success`, including `caches:viz:check`, `cache-key.test.ts`, `cache-plan.test.ts`, `gen-caches-viz.test.ts`, `layers-cache.test.ts`).
- **Daily Hit-Rate Report (`.github/scripts/cache-report.sh --hours 24` in `sweeps.yml`)**:
  - Live 24h window (`2026-11-07T08:35:25Z` → `2026-11-08T08:35:25Z`) on `litlfred/folio-assistant`:
    | step | hit | warm | miss | hit rate |
    |---|---:|---:|---:|---:|
    | `ci-cone-gates-docs` | 0 | 27 | 15 | 0% |
    | `ci-cone-gates-kg` | 0 | 27 | 15 | 0% |
    | `ci-cone-gates-unrun` | 0 | 28 | 14 | 0% |
    *(Note: `ci-cone-*` uses `trust: main-only` with `warm: true`, so prefix restores report as `warm` starts that `ci-cone.ts` verifies per check against its recorded read cone.)*

### 3. Live GitHub Actions Cache Usage (`Done when` #3 — ❌ Not Met, > 80% of 10 GB)

Measured via `gh api repos/litlfred/<repo>/actions/cache/usage` and `actions/caches` on `2026-11-08T08:33Z` (10 GiB limit = `10,737,418,240` bytes; 80% budget ceiling = `8,589,934,592` bytes / 8.00 GiB):

| Repository | `active_caches_size_in_bytes` | Size (GiB) | % of 10 GiB | `active_caches_count` | Top Namespaces by Size | `< 80%` Budget Verdict |
|---|---:|---:|---:|---:|---|---|
| `litlfred/folio-assistant` | `10,553,275,220` | 9.83 GiB | **98.3%** | 23 | `cat-mount-v1` (5 entries, 9,780.6 MiB; 4,041.2 MiB on PR refs), `writer-cone` (3, 98.7 MiB), `codeql-overlay-base-database-1` (4, 88.4 MiB), `bun-*` (1, 48.2 MiB), `setup-ruby-bundler-cache` (2, 42.1 MiB), `cs1-ci` (12, 6.4 MiB) | **FAIL (98.3% > 80%)** |
| `litlfred/cat-harness` | `10,722,416,617` | 9.99 GiB | **99.9%** | 407 | `cat-mount-v1` (4 entries, 8,377.7 MiB), `codeql-overlay-base-database-1` (71, 1,641.8 MiB), `writer-cone` (6, 156.6 MiB), `bun-*` (1, 48.2 MiB), `layer-pr-checks-*` (~380 entries, ~1.2 MiB) | **FAIL (99.9% > 80%)** |
| `litlfred/cat-harness-tools` | `10,697,505,217` | 9.96 GiB | **99.6%** | 21 | `cat-mount-v1` (6 entries, 4,785.9 MiB; 4,542.7 MiB on PR refs), `codeql-overlay-base-database-1` (17, 4,585.8 MiB), `bun-*` (1, 48.2 MiB), `pr-tests-main-v1` (2, 1.6 MiB) | **FAIL (99.6% > 80%)** |
| `litlfred/folio-assistant-core` | `9,513,242,488` | 8.86 GiB | **88.6%** | 449 | `cat-mount-v1` (4 entries, 5,579.2 MiB), `codeql-overlay-base-database-1` (65, 2,571.9 MiB), `layer-pr-checks-results` (15, 453.7 MiB), `writer-cone` (13, 295.6 MiB), `layer-pr-checks-cone` (22, 111.1 MiB) | **FAIL (88.6% > 80%)** |

### 4. Remaining Gaps to Close `folio-assistant-9ml4`

1. **Retire/port remaining bespoke `actions/cache` steps (`Done when` #1 & #3)**:
   - `cat-mount-v1-*` (~1.2–2.0 GiB per entry, accounting for 4.8–9.8 GiB per repo and pushing all four repos over the 80% budget ceiling) is still written by `actions/cache@v6` in `.github/workflows/jsonld-gen-check.yml:140`, `feature-staging.yml:2729,3113`, `merge-train.yml:111`, `post-merge-regen.yml:117`, `repin-train.yml:67`, `staging-publish.yml:68`, and `layer-pr-checks.yml` despite `mount-from-lock.sh` now replaying from the git ref `refs/cat/layers/<key>`.
   - `bundle-cache.sh` (`code-quality-gates.yml:776-988`), `writer-cone-*` (`writer-records.yml:90,151`, `feature-staging.yml:496`), and `layer-pr-checks-*` / `pr-tests-main-v1` are not yet ported onto `cached-step` (or `cached-step` `phase: report`).
2. **Non-deterministic writers from `determinism-audit.yml` (run [`42344504396`](https://github.com/litlfred/folio-assistant/actions/runs/42344504396))**:
   - `smart-pages` (1,452 files), `ig-index` (1,196 files), and `render-bpmn` (142 files) are verified **DETERMINISTIC**.
   - `kg-export` (1/4,113 files: `_kg/cat-harness/cat-harness.jsonld` `"generatedAt"`), `qa-working-copy` (190/9,351 files: `generatedAt` and `block-qa` `"reviewed_at"`), and `publish-pages` (78/12,533 files: `test/results/witnesses/**/*.block.json`) still differ across double builds.
