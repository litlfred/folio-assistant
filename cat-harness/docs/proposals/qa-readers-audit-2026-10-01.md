---
title: "QA readers audit"
kind: proposal
issue: 1763
summary: >-
  Every code path, workflow step, MCP tool, test and skill that reads a
  committed QA result, classified by how it must change when derived QA
  leaves main for the qa-reports branch. Each one records how it fails today
  when the file is absent, measured by moving the results aside. 95 read sites;
  20 of them are false-clean or data-loss, from 11 distinct defects, and three
  of those are live on main today. Then a fix order and a dispatch grouping.
---

# QA readers audit: who reads `test/results/`, and what happens when it is gone
{: .no_toc }

**Status:** audit for arc `3fva`, bean `gxvk`. Companion to
[`qa-reports-branch-and-test-process-2026-10-01.md`](qa-reports-branch-and-test-process-2026-10-01.md),
§4 Phase 3. The owner asked for it on 2026-10-01: *"do an audit report/analysis
on readers and queue up fix them."*

**Checkout measured:** branch `claude/quirky-davinci-ixuymr` at `1541e368`,
which merges `origin/main` `cdb0a018`. Submodules `bootstrap` `f70a56c1` and
`bootstrap-tools` `920c7722`. The commands that produced each number are named
beside it. **Quote the command, not the number.**

1. TOC
{:toc}

## 1. How this was measured

1. **Static search.** `rg` over the whole tree (excluding `node_modules`, the
   results themselves and `docs/reference/`) for `test/results`,
   `"test", "results"`, `QA_RESULTS_DIR`, `KG_QA_RESULTS_DIR`,
   `BLOCK_QA_RESULTS_DIR`, `TRANSLATION_QA_RESULTS_DIR`, `TOOL_RUNS_DIR`,
   `HEALTH_RESULTS_DIR`, `KG_QA_MANIFEST_PATH`, `readQaResult`,
   `qaResultState`, `qaResultPath`, `writeQaResult`, `kgQaSidecarPath`,
   `sweepOrphans`, `kgQaHomeFor`, `existingBlockQaPath`, `blockQaPath`,
   `existingTranslationQaPath`, `translationQaPath`, `readToolRun`,
   `listToolRuns`, `healthReportPath`, `detangleResultsDir`, `readQaGraph`,
   `loadQaReport`, `sameScriptVerdict`, `directoryForGraph(…, "qa")`,
   `assets/qa`, `qa-index`, `data-qa-src`, `lsi/`, `witnesses`, `detangle`,
   `tool-runs`, `library-qa`, `translation-qa`, `health-report`. Every hit was
   opened and classified by hand. **The grep only finds candidates.** Most
   readers never name the path. They reach it through one of the
   path-composing functions in the list, so each function's callers were
   followed too.
2. **Baseline run.** 26 gates were run on the checkout as it is (log:
   `scratchpad/gxvk/runs/baseline/`).
3. **Absent run.** All 15 committed results directories were moved aside: the
   14 `*/test/results/` directories and `cat-harness/test/health/results/`. The
   same 26 gates and 21 test files were then run against the tree, and
   `gen-docs-pages.ts` once in write mode. Afterwards the directories were
   restored and `git status` was clean. A gate is marked **run** below when its
   failure mode comes from that comparison, and **read** when it comes from the
   code alone.

Two things the absent run teaches about the gates themselves, before any reader
is classified:

- **Gates write in `--check` mode.** In the absent run, `check:harness-state:check`
  recreated `cat-harness/test/results/harness-state.qa-results.json`, and
  `skill:register:check` recreated `skill-register.qa-results.json`. In the
  baseline run, `skill:register:check` left the committed
  `skill-register.qa-results.json` modified (` M`, four `current: true → false`).
  The gates that ran after them therefore did not see a fully absent tree.
  CI has the same ordering.
- **`main` is red on half of these gates at baseline.** 13 of the 26 exit 1
  with the files present (`grep -c ' 1$' runs/baseline/summary.txt`). An exit
  code alone therefore separates little. Each row below compares what the gate
  *said* in the two runs.

## 2. What is read: the corpus, measured

| measure | value | command |
|---|---|---|
| committed QA files | 1,155 files, 8,314,227 bytes | `git archive HEAD -- ':(glob)**/test/results/**' ':(glob)**/test/health/results/**'`, then `find -type f \| wc -l` and `du -sb` |
| by `$schema` | `kg-qa/v1` 673 · `qa-witness/v1` 144 · `block-qa/v1` 122 · `qa-results/v1` 76 · `folio-detangle-sidecar/v1` 40 · `translation-qa/v1` 35 · `folio-qa-index/v1` 19 · `kg-qa-manifest/v1` 17 · `folio-lsi-index/v1` 5 · `folio-tool-run/v1` 3 · `folio-test-run/v1` 1 · `viewer-nav-qa/v1` 1 · `health-report/v1` 1 · non-JSON (`README.md`) 15 | a Python walk of the extracted archive, reading each file's `$schema` |
| **unparseable** | **3**, all of them `kg-qa/v1` files containing git conflict markers (§4.1) | same walk |
| `reviewer.kind` entries | `block-qa/v1`: 5,856 script, **11 agent**. `translation-qa/v1`: 105 script, **2 agent**. The 13 agent entries sit in **12 files** | same walk, over every `reviewer` object |
| `pair_attestations` in `kg-qa/v1` | **32 entries in 32 files**: 26 `by: baseline` and **6 `by: agent`**. `voice_reviews`: 0 | same walk |

**The D2 count is low.** The proposal counted ~13 attestations (block-qa and
translation-qa). That count misses the `kg-qa` `pair_attestations`, which carry
the same kind of judgement: 6 agent attestations and 26 first-seen baselines.
`kg-audit` re-derives a baseline only by forgetting the drift it was recording
(§4.1, R22). And all 12 + 32 of these files are **mixed**: each one also holds
script verdicts. So D2 needs a **split** (attestations out to
`test/attestations/`, script verdicts to the branch), not a file move. That
split is an input to `16ei` and to fix beans `F1` and `F4`.

## 3. Summary by class

**Counted from the reader table in §5, not estimated.** There are 95 rows,
`R01`–`R95`. A row is one read site, or one tightly coupled group of sites in
one file. Each row's class comes from its class column (§5.1, §5.2) or its
section (§5.3 C, §5.5 E, §5.6 F, §5.7 G). Each row's mode comes from its
"absent today" cell, with this precedence:

1. FALSE-… or LOSS, or "over the wrong path": **false-clean / loss**;
2. loud or crash: **loud**;
3. unknown, handled or correct: **unknown**;
4. anything else: **other**. That covers a quiet determined-empty, not run
   here, not discriminating because it already fails at baseline, unaffected,
   none committed, and a silent degrade.

| class | meaning | rows | false-clean / loss | loud | unknown | other |
|---|---|---|---|---|---|---|
| A | gate compares committed vs fresh | 20 | 1 | 18 | 1 | 0 |
| B | gate or script reads a committed sidecar as input | 23 | 12 | 3 | 5 | 3 |
| C | render / publish | 13 | 4 | 1 | 6 | 2 |
| D | MCP / runtime | 6 | 2 | 0 | 3 | 1 |
| E | test that reads the committed corpus | 13 | 1 | 8 | 0 | 4 |
| F | skill / agent instruction | 13 | — | — | — | — |
| G | merge tooling | 7 | — | — | — | — |
| **total** | | **95** | **20** | **30** | **15** | **10** |

The 20 false-clean or loss rows come down to **11 distinct defects, C1–C11**,
listed in §4. Three of them (C1–C3) are live on `main` today and owe nothing to
the move. A *false-clean* row passes or reports nothing when its input is gone.
A *loss* row writes back a file that silently drops the entries it could not
read. This repository already treats both as the `dh4f` defect: an empty
input reported as a clean one. F and G rows have no failure mode of their own.
They are instructions and merge mechanics, and they are judged by whether they
still tell the truth after the move.

Three sites the proposal and `2ae2` list as MCP readers are **not readers**
(§5.4), and `check:prov-qaqc`, which `oqe3` lists, does not read
`test/results/` at all (§6).

## 4. CRITICAL: the false-clean and data-loss readers

Every row here is **CRITICAL**. Ordered by blast radius.

### 4.1 Live today, before anything moves

| # | reader | what happens | evidence |
|---|---|---|---|
| **C1** | the three `kg-qa` sidecars below hold **git conflict markers on `main`**. Every reader that tolerates a parse failure treats them as absent | `prose-code-pairs.ts:173` `readAttestations` and `skill-voice-review.ts:131` `readVoiceReviews` `catch` the parse error and return `[]`. So the next `kg:audit` write **re-baselines** these three subjects and drops whatever they held. `readQaGraph` counts them as "3 unreadable" and nothing fails. `kg-qa.test.ts:128` validates only `test/results/kg-qa/**`, and these files live in the *hosted* homes `test/results/bootstrap/` and `test/results/bootstrap-tools/`, so no test sees them | `git grep -c '^<<<<<<<' origin/main -- cat-harness/test/results/bootstrap/kg-qa/skills/ cat-harness/test/results/bootstrap-tools/kg-qa/skills/` → 3 files, 1 each: `bootstrap/kg-qa/skills/initialization-steps`, `bootstrap/kg-qa/skills/human-agent-discussion` and `bootstrap-tools/kg-qa/skills/render-kg-to-github-pages`. Introduced by `48aab0bd` "Merge placement PR1 … onto main", 2026-10-01. The baseline `docs:pages:check` log prints `3 unreadable` |
| **C2** | `check-published-instance-exports.ts:263-267` | the committed-sidecar comparison **never runs**. Both workflow invocations it checks use `export-graph`, which writes no QA sidecar, so `fresh` is `undefined` and `qaSidecar` is skipped. Exit 0 with the files present and with them absent; neither log mentions the sidecar. `kg-export.bootstrap.qa-results.json` therefore has no live producer and no live reader | run: identical output in `runs/baseline/` and `runs/absent/` |
| **C3** | `.github/workflows/health-check.yml:132` | uploads `test/health/results/repository.health-report.json` relative to the repository root. `test/health/run.ts:200` writes `healthReportPath(ROOT)`, where `ROOT` is the **instance** root (`run.ts:54`), so the file is at `cat-harness/test/health/results/…`. With `if-no-files-found: warn`, the "Keep the report" step finds nothing and the job stays green | `gh api repos/litlfred/folio-assistant/actions/runs/36827961155/artifacts` (the 2026-10-01 07:01Z run, `success`) → `total_count: 0` |

### 4.2 Triggered by the move

| # | reader | absent today | evidence |
|---|---|---|---|
| **C4** | `kg-audit.ts:2721` → `prose-code-pairs.ts:147-149` (`evaluatePairs`) | **FALSE-CLEAN and DATA LOSS.** No prior sidecar means no prior attestation. Every pair is re-baselined (`by: "baseline"`) and judged `pass`. Under `--check`, the `prose-reviewed-since-code-changed` findings go **13 → 0**. In write mode, the 6 agent attestations are replaced by fresh baselines | run: `grep -c prose-reviewed-since-code-changed runs/{baseline,absent}/kg:audit:check.log` → 13, 0 |
| **C5** | `kg-audit.ts:1716` → `test-run-conformance.ts:77` | **FALSE n/a.** With no `*.test-run.json`, `entry(findings, any=false)` (`kg-audit.ts:287`) records `test-run-skill-resolves`, `test-run-conforms` and `test-run-checkable` as `n/a`. The committed result is `pass` for all three (`kg-qa/scenarios/kg.kg-qa.json`). `n/a` is the claim this repository already ranks as the false pass (`check-qa-reviewer-permission.ts` comment, 54 % of entries) | read: `kg-audit.ts:1716-1722`, `:286-289` |
| **C6** | `content/pipeline/orphan-verdict-sweep.ts:76,98` (`check:orphan-verdicts`, CI `code-quality-gates.yml:1853`) | **FALSE-CLEAN.** It prints `✓ no orphaned block verdicts under test/results/block-qa` and exits 0 | run: `runs/absent/check:orphan-verdicts.log` |
| **C7** | `content/pipeline/validate.ts:297-305` (`content_validate`, the MCP tool and the pipeline) | **FALSE-CLEAN by design.** *"An ABSENT mirror directory is a determined zero, not an unknown."* Once the store moves, every directory is absent and the orphan-verdict half of validation stops checking without saying so | read |
| **C8** | `audit-coverage.ts:301` (`census`) | **FALSE-EMPTY (`dh4f`).** The `qa` row goes from `covered`, 278 files and 874 sidecars, to `empty`, 0. `health` goes from `covered` to `empty`. Masked today, because the same run also fails on its own absent self-sidecar (R04); once R04 is migrated, nothing else stands in front of it | run: `grep -E '^\s*\S+\s+(qa\|health)\s' runs/{baseline,absent}/audit:coverage:strict.log` |
| **C9** | `qa-graph-index.ts:172` `readQaGraph`, through `gen-docs-pages.ts:1489-1513` → `docs/assets/qa/index.json` → the navbar tile and `docs/qa/index.html` | **FALSE COUNT.** The projection goes from *"965 document(s), 12 families … 3 unreadable"* to *"2 document(s), 1 family"*. `docs:pages:check` does not fail on it: the projection is existence-gated (*"would be refreshed — not a staleness failure"*). `docs-site.yml:149` runs the generator in write mode, so the published tile would read 2 | run: `grep 'assets/qa/index.json' runs/{baseline,absent}/docs:pages:check.log` |
| **C10** | `docs-site.yml:618` and `feature-staging.yml:1098` (`find cat-harness/test/results -maxdepth 1 -name '*.qa-results.json' -exec cp …`) | **SILENT SHRINK.** The step publishes whatever this build happened to write (`kg-export` writes one file during the build). Of the 20 top-level `*.qa-results.json`, the rest disappear from `/assets/qa/` and the step prints a smaller count and stays green. `cp -rT …/witnesses` on line 612 would crash on an absent directory, but `gen-docs-pages.ts` (line 149) recreates it with 2 files first | read, plus the write-mode run (`runs/absent-docs-pages-write.log`: *"2 QA witness file(s)"*) |
| **C11** | block-qa and translation-qa **read-modify-write** writers: `qa-sweep.ts:415-416` (plus `sameScriptVerdict` at `:580/:632/:664/:720`), `qa-merge-findings.ts:211`, `integration-audit.ts:222-228`, `language-trap-audit.ts:558-559`, `q-usage-audit.ts:292-293`, `proof-narrative-lean-equiv-sweep.ts:515-530`, `content/pipeline/qa-agent-entry.ts:78-79`, `translation-block-qa.ts:831-846` (`mergeCriteria`) | **DATA LOSS.** Each one reads the prior report to keep the entries it does not own, including the 11 + 2 agent verdicts. With the prior absent, each writes a report holding only its own entries. Nothing reports the loss. Under `--check`, `translation:block-qa:check` fails loud (35 stale), but the write path is silent | read; check mode run |

**Near false-clean, flagged HIGH rather than CRITICAL:**

- `check-qa-reviewer-permission.ts:65,132`. With the corpus absent it exits 1,
  but only through its stale-baseline rule, and the remedy it prints is
  *"stale baseline entry, remove it"* (×5). An agent that obeys empties the
  baseline, and the next run passes over **0 entries**. Run:
  `runs/absent/check:qa-reviewer-permission.log`.
- `docs-site.yml:149` `gen-docs-pages.ts`, write mode. All **136** live QA
  badges in 11 generated pages become *"Content QA: not swept"*. That is an honest third
  state rather than a pass, but the deploy is green while the published
  evidence disappears. Run: `git diff` after a write-mode run counted 136
  removed `fa-qa-pending` badges and 0 added; the change was reverted.

## 5. The reader table

Failure mode if the file were absent **today**: **crash**, **loud** (exits
non-zero or prints a finding that names the missing file), **unknown** (a
correct third state), **FALSE-CLEAN** (also: false n/a, false empty, false
count), or **LOSS** (silent data loss on write). *Verified*: **run** = observed
in the absent run; **read** = from the code. *Family*: the fix bean in §7.

### 5.1 Gates (A, B)

| id | file:line | reads | why | class | absent today | verified | migration action | family |
|---|---|---|---|---|---|---|---|---|
| R01 | `cat-harness/scripts/kg-audit.ts:2751` | every `kg-qa/**` sidecar (`--check`) | staleness: committed text ≠ fresh | A | loud: 488 stale (baseline: 2) | run | compute and judge; `--against qa-reports:main/<merge-base>` for new vs inherited | F1 |
| R02 | `kg-audit.ts:2620-2623` | `kg-qa.manifest.json` (own, or hosted) | auditor identity | A | loud (in the 488) | run | manifest goes to the branch with the run | F1 |
| R03 | `cat-harness/scripts/kg-audit-all.ts` (spawns R01 per instance) | 17 instances' `kg-qa` trees | same, across instances | A | loud (17 failing either way) | run | follows R01 | F1 |
| R04 | `cat-harness/scripts/audit-coverage.ts:538` | `audit-coverage.qa-results.json` | own sidecar current | A | loud: "no committed sidecar" | run | compute and judge | F2b |
| R05 | `cat-harness/scripts/root-scan-census.ts:246-249` | `root-scan-census.qa-results.json` | own sidecar current | A | loud: exit 0 → 1 | run | compute and judge | F2b |
| R06 | `cat-harness/scripts/check-reference-direction.ts:936-939` | `reference-direction.qa-results.json` | recorded states current | A | loud: "no committed sidecar" | run | compute and judge; keep the recorded/graded split | F2b |
| R07 | `cat-harness/scripts/check-term-mapping.ts:424` | `term-mapping.qa-results.json` | own sidecar current | A | loud: "does not exist" | run | compute and judge | F2b |
| R08 | `cat-harness/scripts/subgraph-readmes.ts:155-160` | `subgraph-readmes.qa-results.json` | own sidecar current (`!prior` → stale) | A | loud | run | compute and judge; also stop counting `test/results/` READMEs as absent directories (the absent run reported 14) | F2b |
| R09 | `cat-harness/scripts/check-viewer-nav.ts:75,161-189` | `viewer-nav/viewer-nav.qa.json` | own sidecar current | A | loud on missing; **stale exits 0** (advisory, both runs) | run | compute and judge | F2b |
| R10 | `cat-harness/scripts/check-l1-complete.ts:1288-1300` (`--check`) | `library-qa/*.qa-results.json` | each sidecar current | A | loud: "no sidecar" | run | compute and judge | F2b |
| R11 | `cat-harness/scripts/skill-register.ts:665` + its verify chain (`:500-515`) | `skill-register.qa-results.json`; it runs R01, R13, R14 and others | the chain is at a fixed point | A | loud. It **writes its sidecar in `--check`** (baseline left it modified, `git status` M) | run | compute and judge; never write in check | F2b |
| R12 | `cat-harness/skills/kg/graph-management/kg-detangle.ts:466-479,546-611` | `detangle/**.detangle.json` | pinned fields current; orphan sweep | A | loud: every group STALE | run | compute and judge; orphan sweep against the branch | F3 |
| R13 | `cat-harness/scripts/lsi.ts:66,341-348` (`check`) | `lsi/<inst>/<graph>.lsi.json` | index fingerprint current | A | loud: "needs an index … and has none" | run | compute, or fetch the index by ref | F3 |
| R14 | `cat-harness/scripts/gen-lsi-viz.ts:43-62` (`--check`) | every `lsi/**.lsi.json` → `docs/lsi/index.md` | the viewer page current | A/C | loud, but already stale at baseline, so the run does not discriminate | run | read the indexes through `qa-store` | F3 |
| R15 | `cat-harness/content/pipeline/translation-block-qa.ts:831-856` (`--check`) | `translation-qa/**` | sidecars current | A | loud: 35 stale (baseline: exit 0) | run | compute and judge; split out the attestations (D2) | F4 |
| R16 | `cat-harness/scripts/gen-docs-pages.ts:260,350,981,1585` (`--check`) | `witnesses/**`, the `qa` tree | generated pages current | A/C | loud: 12 generated files stale | run | pages carry structure only; witnesses come from the branch at build | F6 |
| R17 | `cat-harness/scripts/check-version-bump.ts:233-234` | `kg-export.qa-results.json` via `qaResultState` | committed vs fresh export | A | unknown: prints `? … ABSENT`, exits 0. **STALE also exits 0**: this half is advisory | run | `--against` | F2a |
| R18 | `cat-harness/scripts/check-published-instance-exports.ts:263-267` | `kg-export.<stub>.qa-results.json` | committed vs fresh export | A | **FALSE-CLEAN (C2)**: never compared | run | decide whether the comparison has a subject at all; if it does not, delete it (with the owner's go) and say why | F2a, F8b |
| R19 | `cat-harness/scripts/gen-uml-overview.ts:567-578`, plus its directory listing of the `qa` graph | detangle numbers; the `qa` directory | overview diagrams | A/C | loud: overview SVGs stale (baseline: current) | run | read the detangle numbers through `qa-store`; draw `qa` as stored on the branch | F3 |
| R20 | `folio-assistant-core/scripts/glossary-page.ts:595` (`check:glossary`) | `term-mapping.qa-results.json` | glossary mapping column | A/C | loud (more pages stale); the page says "the check has not run": a correct unknown | run | `readQa(ref, …)` | F2b |
| R21 | `cat-harness/scripts/check-harness-state.ts:151-161` | `repository.health-report.json` | the health producer is current | B | unknown: exit 2, "NOT a clean run". **Writes `harness-state.qa-results.json` in `--check`** | run | read the report through `qa-store`; never write in check | F2b |
| R22 | `kg-audit.ts:2721` → `cat-harness/scripts/prose-code-pairs.ts:173-181` | `pair_attestations` | drift since the last attestation | B | **FALSE-CLEAN + LOSS (C4)** | run | attestations to `test/attestations/` (D2); a missing store is `unknown`, never a re-baseline | F1 |
| R23 | `kg-audit.ts:2738` → `cat-harness/scripts/skill-voice-review.ts:131-139` | `voice_reviews` | voice review currency | B | none committed today (0), so the 207 findings are identical in both runs; the same `[]`-on-missing shape as R22 | run | same as R22 | F1 |
| R24 | `kg-audit.ts:1716` → `cat-harness/scripts/test-run-conformance.ts:77` | `crdm-detect-eval.test-run.json` | test runs conform to the skill contract | B | **FALSE n/a (C5)** | read | `readQa`; absent → `unknown` | F1 |
| R25 | `kg-audit.ts:1348` → `cat-harness/scripts/downstream-runs.ts` → `lsi.ts:348` `readToolRun` | `tool-runs/lsi-index/**` | `tool-downstream-fresh` | B | unknown/loud: not-run → fail (findings 6 → 7) | run | `readQa` | F3 |
| R26 | `downstream-runs.ts:101` `listToolRuns` (`cat-harness/schemas/tool-run.ts:116-136`) | every `tool-runs/**` record | undeclared-downstream check | B | quiet determined-empty (no records → nothing to flag); low risk | read | `readQa` listing | F3 |
| R27 | `kg-audit.ts:2671,2780` `sweepOrphans` / `relocateSidecars` (`cat-harness/schemas/kg-qa.ts:272`) | the `kg-qa` tree | orphans; relocation | B | quiet: 0 orphans, nothing moved | read | orphans judged against the fetched tree; relocation becomes a branch concern | F1 |
| R28 | `cat-harness/scripts/check-qa-reviewer-permission.ts:65,132,206` | every `*.json` under `cat-harness/test/results` | a reviewer holds `qa-reporting` | B | loud, but only through the stale baseline, and the remedy it prints leads to a vacuous pass (HIGH, §4.2) | run | read through `qa-store`; refuse on 0 examined (`vacuity-refusal.ts`) | F5 |
| R29 | `cat-harness/content/pipeline/orphan-verdict-sweep.ts:76,98` | `block-qa/**` | an orphan verdict | B | **FALSE-CLEAN (C6)** | run | read through `qa-store`; refuse on 0 examined | F5 |
| R30 | `cat-harness/content/pipeline/validate.ts:297-305` | the `block-qa` mirror dir | orphan verdicts during validation | B/D | **FALSE-CLEAN (C7)** | read | `unknown` when the store is not fetched | F5 |
| R31 | `cat-harness/scripts/audit-coverage.ts:301` `census` | the `qa` and `health` directories | files per kind | B | **FALSE-EMPTY (C8)** | run | honour `storage` (proposal §2.4) | F2b |
| R32 | `cat-harness/scripts/check-declared-paths.ts:514-557` + `declared-path-baseline.json:46,49,57,116,128` | declared literals that name `test/results` files | a literal resolves | B | loud: 6 literals no longer resolve (exit 0 → 1) | run | rebaseline as the literals move to `qa-store` | F5 |
| R33 | `cat-harness/scripts/eval-crdm-detect.ts:141,171` | the prior `crdm-detect-eval.test-run.json` | churn guard and reproduction check | B (writer reading prior) | unknown: `try`/`catch`, treated as changed | read | `readQa`; the run itself goes to the branch (test process, proposal §3) | F1 |
| R34 | `cat-harness/scripts/qa-results.ts:171-184` `writeQaResult` | each `<stem>.qa-results.json` | skip an unchanged write | B (writer reading prior) | unknown: absent → writes. 22 callers | read | becomes `publishQa` | F2a |
| R35 | `cat-harness/scripts/qa-results.ts:209,255` `readQaResult` / `qaResultState` | any `qa-results` | four-state compare | B | unknown: `absent` / `unreadable` | read | becomes `readQa` (hit/miss/corrupt/unknown) | F2a |

### 5.2 Block and translation verdicts: read-modify-write (B, D)

| id | file:line | reads | class | absent today | verified | migration action | family |
|---|---|---|---|---|---|---|---|
| R36 | `cat-harness/content/pipeline/qa-utils.ts:975,1097` (`loadQaReport`, block discovery) | `block-qa/**` | B | unknown (`undefined`) | read | `readQa`; the attestation half comes from `test/attestations/` | F4 |
| R37 | `content/pipeline/qa-sweep.ts:415-416,580,632,664,720` | the prior block report; `sameScriptVerdict` | B | **LOSS (C11)** | read | read the prior from the branch; attestations from main | F4 |
| R38 | `content/pipeline/qa-merge-findings.ts:186-211` | the prior block report | B | **LOSS (C11)** | read | as R37 | F4 |
| R39 | `content/pipeline/integration-audit.ts:222-228` | the prior block report | B | **LOSS (C11)** | read | as R37 | F4 |
| R40 | `content/pipeline/language-trap-audit.ts:346,558-559` | the prior block report | B | **LOSS (C11)** | read | as R37 | F4 |
| R41 | `content/pipeline/q-usage-audit.ts:292-293,453` | the prior block report | B | **LOSS (C11)** | read | as R37 | F4 |
| R42 | `content/pipeline/proof-narrative-lean-equiv-sweep.ts:515-530` | the prior block report | B | **LOSS (C11)** | read | as R37 | F4 |
| R43 | `content/pipeline/qa-agent-entry.ts:78-79` | the prior block report | D | **LOSS (C11)** | read | an agent verdict is an attestation: write to `test/attestations/` | F4 |
| R44 | `content/pipeline/translation-block-qa.ts:831-846` (write path, `mergeCriteria`) | the prior translation report | B | **LOSS (C11)**: the 2 agent entries | read | as R37 | F4 |
| R45 | `content/pipeline/qa-staleness.ts:131-136` (MCP `qa_staleness`, `folio-assistant-core/adapters/document/tools/audit.ts:53`) | `block-qa/**` | D | unknown: `[NO-QA] … missing-sidecar`, exit 0 by design | run | `readQa`; a miss stays `missing`, never fresh | F4 |
| R46 | MCP `qa_sweep` (`folio-assistant-core/adapters/document/tools/qa.ts:39-54`) → R37 | `block-qa/**` | D | **LOSS** (through R37) | read | follows R37 | F4 |
| R47 | `content/pipeline/qa-agent-drain-queue.ts:89` | `block-qa/**` | D | unknown | read | `readQa` | F4 |
| R48 | `content/pipeline/semantic-cone.ts:193` | `block-qa/**` | D | unknown | read | `readQa` | F4 |
| R49 | `content/pipeline/proof-axis-dashboard.ts:128` | `block-qa/**` | C | unknown | read | `readQa` | F4 |
| R50 | `cat-harness/src/qa-agent-write.ts:163,181,225` | **`${base}.qa.json` beside the block**, the LEGACY path, not `test/results/` | D | pre-existing defect: it reads and writes a path the results tree replaced, so an agent verdict lands where `existingBlockQaPath` (which prefers the results tree) never looks | read | write attestations to `test/attestations/` | F4, F8b |

### 5.3 Render and publish (C)

| id | file:line | reads | absent today | verified | migration action | family |
|---|---|---|---|---|---|---|
| R51 | `.github/workflows/docs-site.yml:149` (`gen-docs-pages.ts`, write) | block, translation and kg sidecars → page badges and witnesses | silent degrade: 136 → 0 live badges (HIGH, §4.2) | run | `qa:fetch --ref main/<sha>` before the generator | F6 |
| R52 | `docs-site.yml:612` `cp -rT cat-harness/test/results/witnesses` | `witnesses/**` | crash if the directory is absent; masked by R51, which recreates it | read + run | copy from the fetched tree | F6 |
| R53 | `docs-site.yml:618` `find … *.qa-results.json` | top-level `qa-results` | **FALSE-CLEAN (C10)** | read | copy from the fetched tree; fail when the count drops below the manifest's | F6 |
| R54 | `.github/workflows/feature-staging.yml:1089-1099` | the same two copies | **FALSE-CLEAN (C10)** | read | as R52 and R53, with `--ref pr/<n>/<sha>` | F6 |
| R55 | `cat-harness/scripts/preview-site.sh:184-188` | `witnesses/**`, `qa-results` | unknown: guarded by `[ -d … ]`; badges then render `unknown` | read | `qa:fetch` first, and say so when it misses | F6 |
| R56 | `cat-harness/content/pipeline/qa-witness.ts:304,326,342,565` | block, translation, kg sidecars; `KG_QA_MANIFEST_PATH` | unknown: "not swept" | run (via R51) | `readQa` | F6 |
| R57 | `cat-harness/content/pipeline/qa-graph-index.ts:172` via `gen-docs-pages.ts:1489-1513` | the `qa` tree census | **FALSE COUNT (C9)** | run | census the fetched tree; `unknown` on a miss | F6 |
| R58 | `cat-harness/scripts/state-visualizer.ts:298,761,792` | `docs/assets/qa/index.json` (R57's output) → `docs/qa/index.html` | unaffected directly; inherits C9 on the next regeneration | run (`state:visualizer:check` exit 0 in both) | none beyond R57 | F6 |
| R59 | `cat-harness/docs/_includes/head_custom.html:282-283`, `cat-harness/docs/assets/js/docs-ui.js:9360,9516` | `/assets/qa/**` in the browser | unknown: a 404 renders `unknown` | read | none, if R51–R54 publish | F6 |
| R60 | `cat-harness/scripts/publish-block-qa.ts:170` (`folio-staging.yml:315`, tool `folio-block-qa-summary`) | a folio's `block-qa/**` | unknown: "unaudited" | read | `qa:fetch` the folio's ref | F6 |
| R61 | `cat-harness/scripts/review-heat.ts:56,231`, `cat-harness/scripts/gen-review-page.ts:390` | `block-qa.json` (R60's output) | unknown: "not published" | read | none beyond R60 | F6 |
| R62 | `.github/workflows/health-check.yml:132` | the health report (upload) | **FALSE-CLEAN (C3)**, live today | `gh api` | fix the path now; publish to the branch later | F8b |

### 5.4 MCP / runtime (D): three that are not readers

The proposal and `2ae2` list three MCP sites as readers. **They are not**, and
migrating them would be wasted work:

| site | why it is not a reader |
|---|---|
| `cat-harness/tools/index.ts:1846,1852` (lsi) | a Tool *declaration*: it names `output: "cat-harness/test/results/lsi/"`. Nothing reads through it |
| `cat-harness/src/tools/lsi-query.ts:31` (`lsi_query`) | builds the index in memory from the graph on every call (`buildLsi(units, …)`). It never opens `test/results/lsi/` |
| `cat-harness/src/tools/degradation.ts:244-262` | since bean `ymsu` it reads the source **before** importing, so it no longer runs `kg-detangle.ts` and no longer touches `test/results/detangle/` |

The real D-class readers are R43, R45–R48 and R50 above. R30 (`content_validate`) is also reachable as an MCP tool, and is counted under B.

### 5.5 Tests that read the committed corpus (E)

Measured: the same 21 test files were run with the corpus present
(`runs/baseline-tests.log`: 8 failures, none of them about a missing file) and
with it absent (`runs/absent-tests.log`: 20 failures). **15 tests fail only
when the corpus is absent, in 6 files**. Command: `comm -13` over the sorted
`(fail)` lines of the two logs. One test does the opposite, and it is a
false-clean at test level: `kg-qa.test.ts` *"no critical criterion is failing
on main"* **fails with the corpus present and passes with it absent**,
because it iterates over zero files. Only the sibling *"there are some"* guard
stops the file from going green.

| id | file:line | reads | absent today | migration action |
|---|---|---|---|---|
| R63 | `cat-harness/scripts/tests/qa-results.test.ts:40` | the declared `qa` directory exists | loud (1 test) | assert the declaration, not the directory |
| R64 | `qa-results.test.ts:119,269,298,369` | `witnesses/**`, `qa-index.json`, the badge tree | loud (4 tests) | build the tree the way the site does, from a fetch or a fixture |
| R65 | `cat-harness/schemas/kg-qa.test.ts:128` | `kg-qa/**` | loud (`there are some`), and **vacuously green** on *"no critical criterion"* | validate the fetched tree; **also walk the hosted homes** (C1 is invisible to it) |
| R66 | `kg-qa.test.ts:328` | the hosted `bootstrap/kg-qa.manifest.json` | loud (1 test) | fixture |
| R67 | `cat-harness/schemas/kind-validator.test.ts:224` | the first `kg-qa/v1` node under `test/results` | loud (1 test) | fixture |
| R68 | `cat-harness/scripts/tests/tool-qa-subjects.test.ts:53` | `kg-qa/tools/*.kg-qa.json` | loud (4 tests) | run the audit in-process |
| R69 | `cat-harness/scripts/tests/gen-lsi-viz.test.ts:33` | `lsi/**` | loud (2 tests; a third fails at baseline too) | fixture |
| R70 | `cat-harness/schemas/test-run.test.ts:232` | `crdm-detect-eval.test-run.json` | loud (1 test) | fixture, or `readQa` |
| R71 | `qa-results.test.ts:60`, `cat-harness/scripts/tests/subgraphs.test.ts` (entanglement, the `../` count), `cat-harness/scripts/tests/audit-coverage.test.ts` (fixpoint) | `kg-export.qa-results.json`; the declared directories; `audit-coverage.qa-results.json` | **not discriminating**: all 4 tests already fail at baseline | re-check after `gurh` turns `main` green |
| R72 | `cat-harness/test/qa-badge.e2e.ts:49` | `witnesses/publication-workflow/qa-index.json` | not run here (Playwright); it reads the corpus at load | fixture (memory: *never assert on a QA verdict from the published corpus*) |
| R73 | `cat-harness/test/qa-panel.e2e.ts:46,181` | two witness files | not run here; it reads the corpus | fixture |
| R74 | `cat-harness/scripts/tests/e2e-corpus-coupling.test.ts:165-214` | nothing: it guards against R72 and R73 | passes | keep; extend its corpus pattern to the fetched tree |
| R75 | `cat-harness/test/health/workflow.test.ts:122` | the upload path in `health-check.yml` | passes in both runs, **and over the wrong path** (C3): it only checks `toContain("repository.health-report.json")` | assert that the path equals `healthReportPath`'s output |

`cat-harness/test/translation-badges.e2e.ts:370` names a sidecar path inside a
fixture and reads nothing, so it is not counted. `gitattributes.test.ts` and
`qa-resolve-conflicts.test.ts` are merge tooling, counted under G (§5.7).

### 5.6 Skills and agent instructions (F)

These do not fail; they go **false**. Every one tells an agent that
`test/results/**` is committed, or to *"run X and commit it"*. The paths come
from `rg -l 'test/results|kg-qa sidecar|qa-results\.json' -g '*.md'`; the
per-file counts are `rg -c` on the same pattern.

| id | file | count | migration action |
|---|---|---|---|
| R76 | `cat-harness/skills/sdlc/sdlc-core/qa-witness.md` | 7 | `d6bw` |
| R77 | `cat-harness/skills/kg/kg-core/directory-conventions.md` | 6 | `d6bw` |
| R78 | `cat-harness/skills/kg/graph-management/lsi-indexing.md` | 4 | `d6bw` (**not in its list**) |
| R79 | `cat-harness/skills/sdlc/sdlc-core/prepare-merge.md` (§"Conflicts in `test/results/`", `:321`) | 3 | `d6bw` + `7mwa` |
| R80 | `cat-harness/skills/sdlc/sdlc-core/platform-gates.md` | 2 | `d6bw` (**not in its list**) |
| R81 | `cat-harness/skills/sdlc/sdlc-core/decision-audit.md` | 2 | `d6bw` (**not in its list**) |
| R82 | `cat-harness/skills/kg/kg-core/skill-voice-review.md` | 2 | `d6bw` (**not in its list**); it must name `test/attestations/` |
| R83 | `wireframe-design-review.md`, `readme-sections.md`, `liquid-templates.md`, `gate-tree-mutation.md`, `coordinate.md`, `adjudication.md`, `role-model.md`, `methodology-adoption.md`, `skill-registration.md`, `domain-fencing.md`, `deletion-requires-confirmation.md` (all under `cat-harness/skills/`) | 1 each | `d6bw` (only `skill-registration` is in its list) |
| R84 | `AGENTS.md` | 3 | pointer only (`d6bw`) |
| R85 | `cat-harness/scripts/init-folio.ts:433,451` (the `folio_init` AGENTS template: *"Commit …"*) | 2 | `7mwa` |
| R86 | `cat-harness/test/README.md`, `cat-harness/test/results/README.md`, `cat-harness/test/health/results/README.md` | 1 each | `readme:subgraphs` after `storage` lands |
| R87 | `memory/never-assert-on-a-qa-verdict-from-the-published-corpus.md`, `memory/derive-the-gate-list-from-the-workflow.md`, `.claude/agent-memory/ci-health-watcher/MEMORY.md` | 1 each | memory owners, in the same change as the skill |
| R88 | `cat-harness/docs/proposals/*.md`, `cat-harness/docs/*.md`, `cat-harness/docs/{ar,es,fr,ru,zh}/**` | — | generated or historical; regenerate, do not hand-edit |

### 5.7 Merge tooling (G)

| id | file:line | what it does with the files | migration action |
|---|---|---|---|
| R89 | `cat-harness/scripts/qa-resolve-conflicts.ts:221-254,325` | reads conflicted QA files and resolves them | retire (`7mwa`) |
| R90 | `.gitattributes:7-77` (`-diff -merge` on `audit-coverage.qa-results.json` and `tool-runs/…/skills.tool-run.json`) | merge attributes | retire (`7mwa`) |
| R91 | `cat-harness/scripts/regen-after-merge.ts:131` | regenerates `term-mapping.qa-results.json` and others after a merge | drop the `test/results` writers (`7mwa`) |
| R92 | `cat-harness/scripts/gate-tree-guard.ts:8` | flags a gate that mutates `test/results/detangle/**` | still useful: it catches R11 and R21, which write in check |
| R93 | `cat-harness/templates/document/github/workflows/qa-sweep.yml:114` (the template `folio_init` writes) | `find … test/results -name '*.qa.json'`, refusing on 0 | correct today (it refuses an empty walk); switch to `qa:fetch` (`7mwa`) |
| R94 | `.github/workflows/folio-staging.yml:315` (calls R60) | a folio's block-qa | follows R60 |
| R95 | `cat-harness/scripts/tests/qa-resolve-conflicts.test.ts`, `cat-harness/scripts/tests/gitattributes.test.ts:40-135` | resolver fixtures; named `test/results` paths and their merge attributes | retire with R89 and R90 |


## 6. What the absent run changed, gate by gate

| gate (CI step) | baseline | absent | what changed in the output |
|---|---|---|---|
| `kg:audit:check` (`code-quality-gates.yml:813`) | 1 | 1 | stale 2 → 488; **`prose-reviewed-since-code-changed` 13 → 0**; `tool-downstream-fresh` 6 → 7 |
| `kg:audit:all:check` (:830) | 1 | 1 | 17 failing either way |
| `audit:coverage:require-all` / `:strict` (:856, :907) | 1 | 1 | "disagrees" → "no committed sidecar"; **`qa` and `health` rows `covered` → `empty`** |
| `check:harness-state:check` (:888) | 1 | **2** | could not determine; and it wrote its sidecar |
| `lsi:skills:check` (:796) | 1 | 1 | stale → "has none" |
| `lsi:viz:check` (:799) | 1 | 1 | unchanged (stale at baseline) |
| `kg:detangle:check` (:916) | 1 | 1 | orphans → every group STALE |
| `translation:block-qa:check` (:1920) | **0** | 1 | 35 stale |
| `skill:register:check` (:789, :2266) | 1 | 1 | wrote its sidecar in both runs |
| `readme:subgraphs:check` (:1125) | 1 | 1 | 3 → 6 stale; 14 declared directories absent |
| `root-scan-census:check` (:872) | **0** | 1 | "no committed sidecar" |
| `check:term-mapping` (:534) | 1 | 1 | stale → "does not exist" |
| `check:viewer-nav` (:2011) | **0** | 1 | stale (advisory) → missing (fatal) |
| `check:prov-qaqc` | 0 | 0 | **not a reader**: writes `docs/assets/prov/`. `oqe3` lists it by mistake |
| `check:reference-direction:check` | 1 | 1 | "different STATES" → "no committed sidecar" |
| `docs:pages:check` (:1229, :1966) | **0** | 1 | 12 files stale; the projection goes from 965 to 2 documents and is not graded |
| `check:version-bump` (:1762) | 0 | 0 | `STALE` → `ABSENT`, both advisory |
| `check:published-instance-exports` (:1794) | 0 | 0 | **identical: the comparison never runs (C2)** |
| `check:qa-reviewer-permission` (:1694) | **0** | 1 | five "stale baseline entry, remove it" lines |
| `check:orphan-verdicts` (:1853) | 0 | **0** | **identical `✓` (C6)** |
| `check:glossary` (:523) | 1 | 1 | more pages stale |
| `uml:overview:check` (:1619) | **0** | 1 | overview SVGs stale |
| `state:visualizer:check` | 0 | 0 | not a direct reader |
| `check:portable-paths` | 0 | 0 | not a reader |
| `check:declared-paths` (:1602) | **0** | 1 | 6 witnessed literals stopped resolving |
| `check:l1-complete -- --check` (:1586) | not run | 1 | "no sidecar" (run on its own, absent only) |

## 7. Fix families, order and dispatch

### 7.1 Families → beans

| family | readers | bean |
|---|---|---|
| **F1** kg-audit and its carried state | R01–R03, R22–R24, R27, R33 | new; see §7.4 |
| **F2a** the `qa-results.ts` core and the export comparison | R17, R18, R34, R35 | new |
| **F2b** the self-sidecar gates | R04–R11, R20, R21, R31 | new |
| **F3** detangle, LSI and tool runs | R12–R14, R19, R25, R26 | new |
| **F4** block and translation read-modify-write, and the D2 split | R15, R36–R50 | new |
| **F5** corpus walkers that go vacuous | R28–R30, R32 | new |
| **F6** publish, badges and the heat map | R16, R51–R61 | new; refines `2ae2` |
| **F7** tests that read the corpus | R63–R74 (R75 goes to F8b) | new |
| **F8a** conflict markers on `main` (C1) | — | new, **not blocked**: live today |
| **F8b** other defects that are live today (C2, C3, R50, gates writing in `--check`) | R18, R50, R62, R75; the write-in-check half of R11 and R21 | new, **not blocked** |
| F skills | R76–R84, R86–R88 | existing `d6bw`; the files missing from its list are appended |
| G merge tooling | R85, R89–R95 | existing `7mwa` |

### 7.2 Fix order

1. **Now, not blocked:** F8a, which repairs the 3 conflict-marked sidecars and
   makes the hosted homes visible to `kg-qa.test.ts`; and F8b, the
   health-artifact path, the dead export comparison, `qa-agent-write`'s legacy
   path and the gates that write in check. Neither waits for the branch, and
   C1 is corrupting data on `main` now.
2. **First after `16ei`:** F1 and F4. They carry the D2 **split**. Until the
   attestations are out of the mixed files, any deletion (`5hox`) destroys
   them silently (C4, C11). **`5hox` must name F1 and F4 among its blockers.**
3. **Then F6 and F5**, which hold the remaining false-cleans (C6, C7, C9,
   C10).
4. **Then F2a, F2b and F3.** These fail loud today, so the cost of waiting
   is a red gate, not a wrong answer.
5. **F7 last.** Its fixtures follow the APIs the families above settle.
   Then `7mwa`, `d6bw`, `5hox`.

### 7.3 Dispatch grouping: one family per agent, with no file overlap

| wave | agents | files each owns | why it is safe |
|---|---|---|---|
| now | F8a; F8b | F8a: the 3 sidecars, `kg-qa.test.ts`. F8b: `health-check.yml`, `workflow.test.ts`, `check-published-instance-exports.ts`, `src/qa-agent-write.ts`, `skill-register.ts` and `check-harness-state.ts` (their write-in-check only) | disjoint |
| after `16ei` | F1; F4; F6; F5; F2a+F2b (one agent) | F1: `kg-audit.ts`, `kg-audit-all.ts`, `prose-code-pairs.ts`, `skill-voice-review.ts`, `test-run-conformance.ts`, `eval-crdm-detect.ts`, `schemas/kg-qa.ts`. F4: `content/pipeline/qa-*.ts`, `qa-paths.ts`, the sweeps, `translation-block-qa.ts`, `src/qa-agent-write.ts`. F6: `docs-site.yml`, `feature-staging.yml`, `folio-staging.yml`, `gen-docs-pages.ts`, `qa-witness.ts`, `qa-graph-index.ts`, `preview-site.sh`, `publish-block-qa.ts`. F5: `orphan-verdict-sweep.ts`, `validate.ts`, `check-qa-reviewer-permission.ts`, `declared-path-baseline.json`. F2: `qa-results.ts`, `check-version-bump.ts`, `check-published-instance-exports.ts`, `audit-coverage.ts`, `root-scan-census.ts`, `check-reference-direction.ts`, `check-term-mapping.ts`, `subgraph-readmes.ts`, `check-viewer-nav.ts`, `check-l1-complete.ts`, `skill-register.ts`, `check-harness-state.ts`, `glossary-page.ts` | five agents, within the medium-swarm guideline. Shared reads only: `qa-witness.ts` (F6) calls `qa-paths.ts` (F4), so F6 consumes F4's API and does not edit it. F8b's edits to `skill-register.ts`, `check-harness-state.ts`, `check-published-instance-exports.ts` and `src/qa-agent-write.ts` land in the wave before, so F2 and F4 start from them |
| after that | F3; F7 | F3: `kg-detangle.ts`, `detangle-sidecar.ts`, `gen-uml-overview.ts`, `lsi.ts`, `gen-lsi-viz.ts`, `tool-run.ts`, `downstream-runs.ts`. F7: the test files in §5.5 not owned by a family | F3 is independent but fails loud, so it can wait a wave. F7 follows the APIs |
| then | `7mwa`, `d6bw`, then `5hox` | — | as in the proposal |

### 7.4 Bean ids

The bean ids are recorded in bean `gxvk`'s `## Summary of Changes` and appended
to `oqe3`, `2ae2`, `d6bw` and `7mwa`. They are left out of this page so that
the page holds no fact that a bean store holds better.

## 8. What this audit did not do

- **It changed no code** and moved no file permanently. Every directory moved
  aside was restored, the one committed file a gate modified
  (`skill-register.qa-results.json`) was restored, and the docs a write-mode
  generator run changed were restored. `git status` was clean afterwards.
- **It did not run Playwright.** R72 and R73 are classified from the code.
- **It did not audit downstream folios** (`qou`, `s3p2`'s 3,653 verdicts).
  Those are a separate repository; `7mwa` covers them.
- **It did not decide D2's open edge:** whether the 26 `by: baseline` pair
  entries are attestations or derived. They are machine-written. But they can
  only be regenerated by forgetting the drift they record, so a regenerated
  baseline would pass C4 vacuously. The recommendation is to treat them as
  attestations, with the other 6, and the owner may rule otherwise.
