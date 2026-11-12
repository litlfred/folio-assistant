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
updated_at: 2026-11-09T14:20:00Z
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
- [ ] Port `bundle-cache.sh`, the prepared image, the layers ref and the cone onto the primitive, each by its owner (CI cone ported in `folio-assistant#3010` `2e601643f4ba`; layers ref declared as cache node, gated by `layers:check`, & auto-mounted on fresh clone in `cat-harness-tools#1506` / `folio-assistant#2971` `c5e754827fb3` + `cat-harness-tools#1703` `dd0c48ba2964` + `folio-assistant#3038` `cc9890940e3f`; writer cone git ref in `cat-harness-tools#1707` `839ee5d71862`; `bundle-cache.sh`, `cat-mount-v1-*` fallback steps, and `layer-pr-checks-*` bespoke `actions/cache` steps remain).
- [ ] File a bean for each non-deterministic writer the audit lists (`determinism-audit.yml` run `42344504396` cleared `smart-pages`, `ig-index`, and `render-bpmn` as byte-identical; `kg-export` `_kg/cat-harness/cat-harness.jsonld` `generatedAt` and `qa-working-copy` / `publish-pages` `block-qa` `reviewed_at` + witness sidecars still differ).

## Done when
- [ ] every bespoke cache is on cached-step
- [x] the daily report shows a hit rate per step
- [x] the cache stays under 80 % of 10 GB

_2026-11-05T13:19:32Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk for CI speed 14 (cache-first CI), session https://claude.ai/code/session_01VQDpPeMVBfa2srZmpTnGfi, which holds the claim.

## Verification & Status (2026-11-09)

_2026-11-08T08:38:00Z_ — Verified on `origin/main` by R5-Lane-3 (`651d2ad4-76bb-418a-96eb-f1b84e1f00e0` under `92bff8c9-777d-458a-a380-8dd5bf5cc0f3`).
_2026-11-08T12:04:00Z_ — Updated by R6-Lane-6 (`1a82dfeb-f7cc-4b24-8b0d-e6caf310e87e` under `92bff8c9-777d-458a-a380-8dd5bf5cc0f3`): evicted superseded `cat-mount-v1-*` cache entries, duplicate `codeql-overlay-base-database-1-*` entries, and closed-PR merge-ref entries (`cache-report.sh --prune`) across all four repositories, bringing all four repositories well below `< 80%` of 10 GiB (`1.18%–16.45%`) and satisfying `Done when #3`. Bean remains `in-progress` pending `Done when #1` (remaining bespoke `actions/cache` steps).
_2026-11-09T14:20:00Z_ — Updated by R8-Lane-6 (`1edc40fd-3367-4b1c-957f-2042cf547d73` under `92bff8c9-777d-458a-a380-8dd5bf5cc0f3`): confirmed `litlfred/cat-harness-tools#1707` (`839ee5d71862`, `2026-11-08T11:59:53Z`), `litlfred/cat-harness-tools#1703` (`dd0c48ba2964`, `2026-11-08T13:25:38Z`), and `litlfred/folio-assistant#3038` (`cc9890940e3f`, `2026-11-08T13:25:41Z`) are all merged on `origin/main`, along with release-gated CI (`cat-harness#1158`: `#1159` `1cfec870`, `tools#1721` `6571d3f4`, `tools#1722` `961b4d93`, `fa#3047` `8915622d`).

### 1. Merged PRs on `origin/main`

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
| `litlfred/cat-harness-tools` | [`#1707`](https://github.com/litlfred/cat-harness-tools/pull/1707) | `839ee5d71862` | `2026-11-08T11:59:53Z` | `writer-records-ref`: publish `build/writer-cone/` records to `refs/cat/writer-records/*` (`publish:writer-records` gate) |
| `litlfred/cat-harness-tools` | [`#1703`](https://github.com/litlfred/cat-harness-tools/pull/1703) | `dd0c48ba2964` | `2026-11-08T13:25:38Z` | `layers:check`: re-pinner publishes `refs/cat/layers/<key>`, PR gate checks it |
| `litlfred/folio-assistant` | [`#2971`](https://github.com/litlfred/folio-assistant/pull/2971) | `c5e754827fb3` | `2026-11-06T00:48:39Z` | Layers cache writers publish `refs/cat/layers/<key>` |
| `litlfred/folio-assistant` | [`#2972`](https://github.com/litlfred/folio-assistant/pull/2972) | `43b5de1c3352` | `2026-11-06T04:47:35Z` | `.github/actions/cached-step`, `.github/scripts/cache-report.sh` in `sweeps.yml`, `.github/workflows/determinism-audit.yml`, `.github/cache-inventory/2026-11-05.cache-inventory.json` |
| `litlfred/folio-assistant` | [`#2983`](https://github.com/litlfred/folio-assistant/pull/2983) | `450f43da9a37` | `2026-11-06T04:59:26Z` | `layers-cache.yml`: skip rebuilding verified layers ref |
| `litlfred/folio-assistant` | [`#2990`](https://github.com/litlfred/folio-assistant/pull/2990) | `b01de863f2cd` | `2026-11-06T07:48:53Z` | `determinism-audit`: run records are carried, not compared |
| `litlfred/folio-assistant` | [`#3010`](https://github.com/litlfred/folio-assistant/pull/3010) | `2e601643f4ba` | `2026-11-07T07:33:46Z` | Port CI cone records (`ci-cone-gates-kg`, `ci-cone-gates-docs`, `ci-cone-gates-unrun`) onto `cached-step` (`trust: main-only`, `warm: true`) |
| `litlfred/folio-assistant` | [`#3009`](https://github.com/litlfred/folio-assistant/pull/3009) | `be39d1acfdb9` | `2026-11-07T07:46:28Z` | `determinism-audit`: mount branch-kept graphs once before snapshot |
| `litlfred/folio-assistant` | [`#3013`](https://github.com/litlfred/folio-assistant/pull/3013) | `d70581d1b982` | `2026-11-07T11:39:14Z` | `cached-step` README: record owner's per-passed-check ruling for CI cone |
| `litlfred/folio-assistant` | [`#2985`](https://github.com/litlfred/folio-assistant/pull/2985) | `da3ca528562a` | `2026-11-08T06:42:36Z` | Re-pin `cat-harness-tools` and `cat-harness` into `folio-assistant` (`caches:viz:check` live on `main`) |
| `litlfred/folio-assistant` | [`#3038`](https://github.com/litlfred/folio-assistant/pull/3038) | `cc9890940e3f` | `2026-11-08T13:25:41Z` | Fresh clone: `bun run cat` mounts locked layers automatically from `refs/cat/layers/<key>` |

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

### 3. Live GitHub Actions Cache Usage (`Done when` #3 — ✅ Met, `< 80%` of 10 GB across all 4 repos)

10 GiB limit = `10,737,418,240` bytes; 80% budget ceiling = `8,589,934,592` bytes (`8.00 GiB`).

#### Before Eviction (`2026-11-08T08:33Z`, R5-Lane-3 measurement)

| Repository | `active_caches_size_in_bytes` | Size (GiB) | % of 10 GiB | `active_caches_count` | Top Namespaces by Size | `< 80%` Budget Verdict |
|---|---:|---:|---:|---:|---|---|
| `litlfred/folio-assistant` | `10,553,275,220` | 9.83 GiB | **98.3%** | 23 | `cat-mount-v1` (5 entries, 9,780.6 MiB; 4,041.2 MiB on PR refs), `writer-cone` (3, 98.7 MiB), `codeql-overlay-base-database-1` (4, 88.4 MiB), `bun-*` (1, 48.2 MiB), `setup-ruby-bundler-cache` (2, 42.1 MiB), `cs1-ci` (12, 6.4 MiB) | **FAIL (98.3% > 80%)** |
| `litlfred/cat-harness` | `10,722,416,617` | 9.99 GiB | **99.9%** | 407 | `cat-mount-v1` (4 entries, 8,377.7 MiB), `codeql-overlay-base-database-1` (71, 1,641.8 MiB), `writer-cone` (6, 156.6 MiB), `bun-*` (1, 48.2 MiB), `layer-pr-checks-*` (~380 entries, ~1.2 MiB) | **FAIL (99.9% > 80%)** |
| `litlfred/cat-harness-tools` | `10,697,505,217` | 9.96 GiB | **99.6%** | 21 | `cat-mount-v1` (6 entries, 4,785.9 MiB; 4,542.7 MiB on PR refs), `codeql-overlay-base-database-1` (17, 4,585.8 MiB), `bun-*` (1, 48.2 MiB), `pr-tests-main-v1` (2, 1.6 MiB) | **FAIL (99.6% > 80%)** |
| `litlfred/folio-assistant-core` | `9,513,242,488` | 8.86 GiB | **88.6%** | 449 | `cat-mount-v1` (4 entries, 5,579.2 MiB), `codeql-overlay-base-database-1` (65, 2,571.9 MiB), `layer-pr-checks-results` (15, 453.7 MiB), `writer-cone` (13, 295.6 MiB), `layer-pr-checks-cone` (22, 111.1 MiB) | **FAIL (88.6% > 80%)** |

#### After Eviction (`2026-11-08T12:03Z`, R6-Lane-6 measurement via `actions/cache/usage` & `cache-report.sh --prune`)

| Repository | `active_caches_size_in_bytes` | Size (GiB) | % of 10 GiB | `active_caches_count` | Remaining Namespaces by Size | `< 80%` Budget Verdict |
|---|---:|---:|---:|---:|---|---|
| `litlfred/folio-assistant` | `159,200,938` | 0.15 GiB | **1.48%** | 14 | `bun-*` (1, 48.2 MiB), `setup-ruby-bundler-cache` (2, 42.1 MiB), `writer-cone` (1, 32.9 MiB), `codeql-overlay-base-database-1` (1, 22.0 MiB), `cs1-ci` (12, 6.6 MiB) | **PASS (1.48% < 80%)** |
| `litlfred/cat-harness` | `126,705,791` | 0.12 GiB | **1.18%** | 74 | `bun-*` (1, 48.2 MiB), `codeql-overlay-base-database-1` (2, 45.8 MiB), `writer-cone` (1, 26.4 MiB), `layer-pr-checks-*` / `derive-cache` (~70, 0.5 MiB; 34 closed-PR merge-ref entries pruned) | **PASS (1.18% < 80%)** |
| `litlfred/cat-harness-tools` | `655,950,762` | 0.61 GiB | **6.11%** | 6 | `codeql-overlay-base-database-1` (2, 572.0 MiB), `bun-*` (1, 48.2 MiB), `pr-tests-main-v1` (3, 2.4 MiB) *(live `actions/caches` with active PR runs: 14 entries, `1,766,583,100` bytes / 1.65 GiB / **16.45%**)* | **PASS (6.11% / 16.45% < 80%)** |
| `litlfred/folio-assistant-core` | `1,042,842,302` | 0.97 GiB | **9.71%** | 317 | `layer-pr-checks-results` (8, 453.7 MiB), `writer-cone` (12, 295.6 MiB), `layer-pr-checks-cone` (17, 111.1 MiB), `codeql-overlay-base-database-1` (2, 82.5 MiB), `bun-*` (1, 48.2 MiB) *(170 closed-PR merge-ref entries pruned; live `actions/caches`: 172 entries, `1,037,319,469` bytes / 0.97 GiB / **9.66%**)* | **PASS (9.71% < 80%)** |

### 4. Recently Merged Git-Ref Cache PRs & Remaining Gaps to Close `folio-assistant-9ml4`

1. **Merged PRs retiring `cat-mount-v1-*` and `writer-cone-*` from Actions cache**:
   - [`litlfred/cat-harness-tools#1703`](https://github.com/litlfred/cat-harness-tools/pull/1703) (`layers:check: the re-pinner publishes the layers ref, a PR gate checks it`, merged as `dd0c48ba2964` at `2026-11-08T13:25:38Z`): adds `bun run cat layers:check` (`mount-from-lock.ts --check-layers [--changed-from <rev>]`) and the `layers-ref` PR gate in `layer-pr-checks.yml` so every `index.lock.json` update is guaranteed to have `refs/cat/layers/<key>` published by the re-pinner (never built on a GitHub runner), plus `.github/layers-url` shared cache fallback in `templates/root-bootstrap/mount-from-lock.sh`. Because `mount-from-lock.ts` returns early when `refs/cat/layers/<key>` hits (`layDownFrom(root, inst, absent, shared)` at line 862 before `saveToMountCache`), guaranteeing `refs/cat/layers/<key>` on every lock pin prevents `cat-mount-v1-*` from being populated.
   - [`litlfred/folio-assistant#3038`](https://github.com/litlfred/folio-assistant/pull/3038) (`Fresh clone: bun run cat mounts the layers itself`, merged as `cc9890940e3f` at `2026-11-08T13:25:41Z`): wires `.github/cat.ts` so `bun run cat <script>` automatically mounts locked layers from `refs/cat/layers/<key>` on a fresh clone.
   - [`litlfred/cat-harness-tools#1707`](https://github.com/litlfred/cat-harness-tools/pull/1707) (`Writer records: re-pinner publishes them to a git ref, a gate checks them (#1702)`, merged as `839ee5d71862` at `2026-11-08T11:59:53Z`): moves `build/writer-cone/` records into `refs/cat/writer-records/<commit>` and `refs/cat/writer-records/main` (`scripts/writer-records-ref.ts`, `caches/writer-records-ref.cache.json`) with incremental recording and the `publish:writer-records` verification gate.
2. **Retire/port remaining bespoke `actions/cache` steps (`Done when` #1)**:
   - Remove or port the legacy `cat-mount-v1-*` `actions/cache@v6` steps in `.github/actions/ci-setup/action.yml:104,112`, `.github/workflows/jsonld-gen-check.yml:140`, `feature-staging.yml:2700,3078`, `merge-train.yml:107`, `post-merge-regen.yml:117`, `repin-train.yml:67`, `staging-publish.yml:61`, and `cat-harness-tools/.github/workflows/layer-pr-checks.yml:694` / `pr-tests.yml:176`.
   - Port `bundle-cache.sh` (`code-quality-gates.yml:776-988`) and `layer-pr-checks-*` / `pr-tests-main-v1` onto `cached-step` (or `cached-step` `phase: report`).
3. **Non-deterministic writers from `determinism-audit.yml` (run [`42344504396`](https://github.com/litlfred/folio-assistant/actions/runs/42344504396))**:
   - `smart-pages` (1,452 files), `ig-index` (1,196 files), and `render-bpmn` (142 files) are verified **DETERMINISTIC**.
   - `kg-export` (1/4,113 files: `_kg/cat-harness/cat-harness.jsonld` `"generatedAt"`), `qa-working-copy` (190/9,351 files: `generatedAt` and `block-qa` `"reviewed_at"`), and `publish-pages` (78/12,533 files: `test/results/witnesses/**/*.block.json`) still differ across double builds.
