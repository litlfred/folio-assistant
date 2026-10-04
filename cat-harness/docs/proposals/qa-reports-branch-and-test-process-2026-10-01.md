---
title: "QA and test evidence off main"
kind: proposal
issue: 1763
summary: >-
  Derived QA verdicts move to an orphan, commit-keyed `qa-reports` branch; a
  strawperson TestPlan → TestRun → TestReport → certification process reuses
  the same execution record. Workplan, dispatch map and five owner decisions.
---

# QA and test evidence off `main`, and a test process that certifies
{: .no_toc }

**Status:** proposal for review. Issue [#1763](https://github.com/litlfred/folio-assistant/issues/1763).
The owner raised it twice, and both times it was recorded only as a pointer.
Bean `eqxp` says *"the owner's proposal of moving QA reports off `main` to a
content-addressed orphan branch … is written up separately"*. It never was.
`interaction-modality` lists "the orphan branch" among the owner decisions
left open. This document is that write-up, and it adds the test-process half
the owner asked for on 2026-10-01.

**Checkout measured:** `main` at `61b1e747`, 2026-10-01. Every number below
comes from `git ls-files`, `du -sb` or `git log -200` on that checkout, and
the command is named where it matters. **Quote the command, not the number**:
these figures will be stale within a day.

1. TOC
{:toc}

## 1. The problem, measured

### 1.1 The QA graph is small and churns a lot

| | value |
|---|---|
| tracked QA files (`*/test/results/**`, `test/health/results/**`) | 1,146 files, 8.28 MB — **2.1 %** of tracked bytes |
| changed paths in the last 200 commits | 1,189 of 6,284 — **18.9 %** |
| changed lines in the last 200 commits | 88,115 of 253,256 — **34.8 %** |
| non-merge commits touching QA | 68 of 123; **13 touch only QA** |

Where it churns, in `cat-harness/test/results/`:

| subfolder | files | bytes | paths changed / 200 commits |
|---|---|---|---|
| `kg-qa/` | 486 | 762 K | **553** |
| `detangle/` | 40 | 12 K | 92 |
| top-level `*.qa-results.json` | 20 | 221 K | 78 |
| `library-qa/` | 59 | 57 K | 62 |
| `translation-qa/` | 35 | 116 K | 43 |
| `witnesses/` | 163 | 2.31 M | 42 |
| `bootstrap/` | 22 | 43 K | 34 |
| `lsi/` | 5 | 731 K | 30 |
| `tool-runs/` | 3 | 0.6 K | 28 |
| `block-qa/` | 122 | 3.60 M | — |

There are 14 more instances, each with its own `test/results/`. Together they hold
about 190 files: `folio-assistant-sci` has 75, `fhir-harness` 28, `smart-base` 22,
and the rest have 3 to 15 each.

### 1.2 What it costs

- **Merge friction.** PR #1633 went through 22 merge cycles. Over the last three, 24
  of 25 conflicts were in generated files (bean `eqxp`). Bean `520m` counted six
  merges, six conflict sets, all generated and none in authored code. The
  mechanical conflicts *crowd out attention* from the one that needed judgement.
- **`.gitattributes` cannot remove them.** `eqxp` correction 1 showed that `-merge`
  turns markers inside a megabyte into one whole-file conflict. That is tidier,
  but it is still a conflict. **Removing them requires the files not to be on
  `main`.**
- **The stale-check gate pattern is itself a defect source.** `uju6`, `5qq3`,
  `ymsu`, `3ozg` and `i2kp` are each a variant of *"the committed file and the fresh
  run disagree, and something repaired one into the other before the gate looked"*.
  Nine writers have no `:check` twin at all (§4.3). A gate that judges a fresh run
  directly removes that class of defect, because there is no committed copy left
  to drift.

### 1.3 Why the files were committed in the first place, and why that still matters

Bean `520m` recorded the reason: *"a printed verdict is
gone, and this repository wants 'unaudited since it was drawn' distinguishable
from 'broken in the commit under review'."* That requirement **stands**. The
proposal keeps the property and changes only *where* the durable copy lives.
The record stays a commit-keyed git object, just not on `main`.

## 2. Design — part A: the `qa-reports` branch

### 2.1 What moves and what stays

The split follows the subject, as the owner ruled for `py74`. A **derived**
verdict can be regenerated from the tree, so it moves. A **judgement** cannot
be regenerated, so it is authored content and its home is decided in D2.

| class | example | measured | proposal |
|---|---|---|---|
| derived, script reviewer | `kg-qa/**`, `*.qa-results.json`, `lsi/`, `tool-runs/`, `detangle/`, `witnesses/`, `library-qa/` | 5,883 entries | **move** |
| attestation, agent or human reviewer | 11 `block-qa/v1` + 2 `translation-qa/v1` entries (`520m`) | **13 entries** | **D2** |
| criterion *definitions*, schemas, `KG_CRITERIA` | `schemas/kg-qa.ts`, `schemas/block-qa.ts` | — | **stay** (they are code) |
| health report | `test/health/results/repository.health-report.json` | 2 files | **move** (it is already uploaded as an artifact rather than committed by CI) |

### 2.2 The branch

The design reuses the lake-cache write path. It drops the parts that do not fit:
the toolchain key, split tarballs, and force-push.

```
qa-reports  (orphan; never merged; author folio-qa-bot)
├── index.json                         qa-reports-index/v1: newest entry per ref
├── main/<commit-sha>/                 one tree per main commit that ran CI
│   ├── manifest.json                  qa-reports-manifest/v1: inputs, producers, verdict counts
│   └── <instance>/test/results/**     byte-identical to today's layout
└── pr/<number>/<head-sha>/…           same shape, pruned when the PR closes
```

- **Content addressing comes from git itself.** Identical JSON is the same blob,
  so 200 commits whose `kg-qa/` did not change cost one copy of those blobs.
  That is the property the owner's "content-addressed" wording asks for, and it
  needs no extra hashing.
- **The write path never touches a worktree.** It follows `lake-cache.sh cmd_seed`:
  `git hash-object -w` → `git mktree` → `git commit-tree -p <old tip>` → push.
- **Concurrency.** Writers own disjoint paths (`main/<sha>/`, `pr/<n>/<sha>/`). That
  matches feature-staging's case, not the lake cache's one-key-per-branch. So the
  write is a fetch → rebuild-on-new-tip → push loop with `backoff-sleep.ts`, up to
  3 attempts, **never `-f`**. Each writer's tree is spliced onto the current tip,
  so a sibling's entry is never lost.
- **The read path** is a private-ref shallow fetch, as `lake-cache.sh restore`
  does: `git fetch --depth=1 --filter=blob:none origin +qa-reports:refs/qa-reports-read`,
  then `git show` on only the paths needed. Exit codes follow lake-cache:
  0 hit, 1 miss, 2 usage, 3 corrupt. **A miss is never read as clean.**
- **Retention.** Keep every `main/<sha>` for 90 days. After that keep one per
  day; delete `pr/<n>` 7 days after close. The prune job must have a trigger
  that fires. The lake-cache prune is guarded on `push` in a dispatch-only
  workflow, so it has never run.

### 2.3 What a `:check` gate becomes

Today a `:check` gate compares the committed file with a fresh run. After the
move there is no committed file. Every gate becomes **compute and judge**:

| state | old meaning | new meaning |
|---|---|---|
| fresh run has a `critical` finding | exit 1 | exit 1 (unchanged) |
| committed ≠ fresh ("stale") | exit 1, which is the defect source | **gone**. There is nothing committed to be stale. |
| baseline comparison | implicit in the diff | optional `--against <ref>` diffs the fresh run with `qa-reports:main/<merge-base>`, reporting **new** findings separately from inherited ones |
| baseline missing on the branch | n/a | `unknown`, reported as such and never as a pass. It does not fail a PR, because an unwritten baseline is not this PR's defect. |

This makes "broken in the commit under review" *more* precise than today,
because new findings are separated from inherited ones by a stored baseline.

### 2.4 The declaration

The `qa` kind keeps its directory: a writer still writes to
`<instance>/test/results/`, as the working copy. A `ContentDirectory` gains an
optional `storage` field:

```jsonc
{ "id": "qa", "path": "test/results", "graphs": ["qa"],
  "storage": { "branch": "qa-reports", "keyedBy": "commit" } }
```

- The working copy is `.gitignore`d **only** when `storage.branch` is set.
- `audit:coverage` and `check:harness-dirs` read `storage` and stop expecting
  the files in the checkout.
- `folio_init` writes the same declaration, so a folio inherits the behaviour.
  `qou`'s 3,653 sibling verdicts (bean `s3p2`) become the first downstream
  consumer.

## 3. Design — part B: a strawperson test process

### 3.1 The observation

The owner's remark that *"QA reports and test/certification/compliance reports
are very similar"* holds structurally:

| | QA today | test / certification |
|---|---|---|
| what is judged | an artefact (block, skill, process) | a **system under test**: a machine, an agent, a tool, an IG |
| against what | a criterion set (`KG_CRITERIA`, block-qa criteria) | a **test plan**: test cases, each with assertions |
| with what input | the tree at a commit | the tree **plus test data** (fixed or generated: `vm6m`) |
| the run | `qa-report/v1`, `folio-tool-run/v1` | `folio-test-run/v1`, which already has disjoint data and process hashes (`zz0a`) |
| per-item verdict | `{result, reviewer{kind}}` | the same shape |
| rollup | per family, **never one total** (`py74`) | per plan, never across plans |
| decision | adjudication, `qa-review/v1` Decision | **certification**: a Decision by an accountable role, then signed (`qa-report-signing.bpmn`) |

One execution record serves both. The difference is what supplies the
criteria (a registry or a plan) and whether a decision is taken on the rollup.

### 3.2 New nodes (strawperson)

- **`test-plan/v1`** is the platform's own, FHIR-free model. It is *informed by*
  FHIR R5 TestPlan (the source is held, `hl7-2023-fhir-r5-testplan`), but it does
  not depend on it. **[FHIR TestPlan](https://www.hl7.org/fhir/testplan.html) is a
  downstream target in the FHIR context** (owner, 2026-10-01). Once a SMART
  Guidelines IG's content is complete (DAK test scenarios, test cases and test
  data), a fhir-harness export maps `test-plan/v1` onto TestPlan resources. That
  mapping lives in fhir-harness, never in the platform schema. It records `scope` (the system-under-test kind and
  version range), `requirements[]` (`req:` refs), `testCases[]` (id, assertions
  whose ids are criterion ids, `testData` refs, optional Gherkin `.feature`
  link), `dependencies[]`, and `exitCriteria`, the certification rule as a DMN
  reference.
- **`test-data`** follows `vm6m`. A *fixed* set is reviewed and counts as
  evidence. A *generated* set is stored as a template plus parameters plus seed,
  and is never stored in materialised form. Both are hashed into the run's
  `data` hash.
- **`folio-test-run/v1`** gains a `plan` ref and a `sut` ref (actor id, version,
  reach). The run points at the plan, never the reverse.
- **`test-report/v1`** has per-case verdicts plus a per-plan rollup. It is
  **written to `qa-reports`** under `tests/<plan-id>/<sut>/<run-id>/`. A signed
  certification is a separate node (D5).
- **Roles:** `tester` (runs the plan, untainted from the system under test),
  `certifier` (takes the decision; a specialisation of `stakeholder` or
  `programme-manager`), and a `system-under-test` actor facet.
- **`test-plan-execution.bpmn`** has five lanes. *Requester / SUT*: request
  certification against plan P. *Tester*: resolve the plan, bind the test
  data, execute, write the run. *Untainted checker*: re-execute a sample, as
  `untainted-verification` requires. *Certifier*: decide, using the DMN that
  `exitCriteria` names. *Attestation service*: sign. The process reuses
  `qa-report-signing.bpmn` as a call activity.
- **`kg-audit` criteria:** the plan resolves, every case was executed or
  explicitly skipped with a reason, the data hash is present, and the system
  under test never wrote its own verdict.

### 3.3 Dogfood order

1. **`crdm-detect`**, an agent skill. It already has a test run with 27 cases and
   a second-annotator corpus. That becomes plan #1, and nothing new is measured.
2. **An MCP tool.** For example, `workflow_complete` refuses a step that is not
   enabled. That is a machine system under test with crisp assertions.
3. **A FHIR IG** (`smart-immunizations`), using the TestPlan source shape and
   the ITB README. CEN CWA 16408 (GITB) cannot be fetched through the proxy, so
   that step needs the owner to upload the PDF (`y4uj`).

## 4. Workplan

Each item is a bean under the arc epic **`3fva`**. The beans are: `gurh` (0.1), `bo44` (0.3), `yhjr` (0.4), `3ds9` (1.2), `16ei` (Phase 2), `oqe3` (3.1, 3.2), `2ae2` (3.3, 3.4), `7mwa` (3.5, 3.6), `5hox` (3.7), `d6bw` (Phase 4), `ygzh` (5.1, 5.2), `3o5b` (5.4, 5.5) and `ff09` (5.6). **⇉** marks an item an agent can run in
parallel, in its own worktree, with no shared files. **→** marks an item that must
wait for the one named.

### Phase 0: pick up the stalled handover (now, ⇉ all)

| # | item | bean |
|---|---|---|
| 0.1 | `main` is red: 12 consecutive Code-quality failures, Docs site red, watchdog issue #1755. Fallout from the placement moves, by inference. **First: check whether a sibling session already owns it.** | new |
| 0.2 | `check:source-licence` cannot fail on its own content (#1751, draft #1753, 2 checks red) | `i2kp` |
| 0.3 | **The sweep for writer-only gates**: 9 writers with no judge mode (§4.3). This is also step one of part A, because every one of them must be able to judge a fresh run. | new |
| 0.4 | The harness half of bootstrap-tools `SubgraphInput.subdirs` (~49 READMEs) | new |
| 0.5 | Record on #1724 that the `kgho` watchdog fired: #1755 opened itself at 07:24Z. **The owner closes it.** | `kgho` |

### Phase 1: decisions and a spike (→ owner)

| # | item |
|---|---|
| 1.1 | Owner rules on D1–D5 (§5) |
| 1.2 | **Spike, done first because it can falsify the design:** push an orphan `qa-reports` branch from a CI job **and** from a fresh agent container through the proxy, then read one file back. If either fails, part A needs a different medium, such as release assets or an artifact plus index. |

### Phase 2: mechanism (→ 1.2; serial, one agent)

| # | item |
|---|---|
| 2.1 | `qa-store` module: `resolveQaLocation`, `readQa(ref, path)` with four states (hit / miss / corrupt / unknown), `publishQa(ref)`. Every read site switches from `fs` to it. |
| 2.2 | `bun run qa:fetch [--ref main\|<sha>\|pr/<n>]` and `bun run qa:publish` |
| 2.3 | `storage` on `ContentDirectory` (`schemas/cat-harness.ts`), plus `audit:coverage` and `check:harness-dirs` |
| 2.4 | CI: publish after gates on `main` push and on PR. Add a `check-workflows` finding `qa-reports-unretried`. |
| 2.5 | A prune workflow with a schedule trigger that actually fires |

### Phase 3: migrate consumers (→ 2.1; ⇉ per family)

| # | consumer | files |
|---|---|---|
| 3.1 | the 16 stale-check gates → compute and judge, `--against` | `kg-audit*.ts`, `audit-coverage`, `skill-register`, `lsi`, `kg-detangle`, `translation-block-qa`, `check-viewer-nav`, `prov-qaqc`, `reference-direction`, `term-mapping`, `root-scan-census`, `harness-state`, `subgraph-readmes`, `gen-docs-pages` |
| 3.2 | readers of committed sidecars | `check-version-bump.ts`, `check-published-instance-exports.ts` |
| 3.3 | docs site and feature staging: the `assets/qa/` copy, badges, `publish-block-qa.ts`, review heat map | `docs-site.yml:609`, `feature-staging.yml:1089`, `review-heat.ts` |
| 3.4 | MCP tools | `tools/index.ts` (lsi), `src/tools/degradation.ts`, `src/qa-agent-write.ts` |
| 3.5 | retire `qa:resolve-conflicts` and the `test/results` entries in `.gitattributes` | `520m`, `eqxp`, `oxka` |
| 3.6 | the 14 per-instance `test/results/` directories and the `folio_init` template | `qa-sweep` template |
| 3.7 | **`git rm` the moved files from `main`. This step is last, and it needs the owner's explicit go** (`deletion-requires-confirmation`). The branch must already hold an identical copy for `main`'s head, verified by hash. | — |

### Phase 4: skills, processes and docs (⇉ after 2.1)

Skills: `qa-witness`, `prepare-merge` §"Conflicts in `test/results/`",
`audit-coverage`, `directory-conventions`, `content-context-and-state-graphs`,
`skill-registration`, `ci-health`, `untainted-verification`,
`qa-report-signing`, `test-engineer`, `content-test`.
Processes: `code-quality-gates.bpmn` (a publish step), a new `qa-publish.bpmn`, and
`qa-report-signing.bpmn` (its output goes to the branch). Docs: the
`agent-onboarding` QA section and the `AGENTS.md` pointer only.

### Phase 5: the test process (⇉ with Phase 2; registry edits serialised)

| # | item | bean |
|---|---|---|
| 5.1 | `test-plan/v1` schema and kind | new |
| 5.2 | `folio-test-run/v1` gains `plan` and `sut`; add `test-report/v1` | new |
| 5.3 | test data, fixed and generated | `vm6m` |
| 5.4 | the `tester` and `certifier` roles and the system-under-test facet; `test-plan-execution.bpmn`; a certification DMN | new |
| 5.5 | `kg-audit` criteria for plans and runs | new |
| 5.6 | dogfood 1: `crdm-detect` as a plan | new |
| 5.7 | dogfood 2 and 3: an MCP tool, then a FHIR IG. Needs CWA 16408 uploaded (`y4uj`). SME case review stays in `vljz`. WHO SOP criteria stay in `sopq`. | `y4uj`, `vljz`, `sopq` |

### 4.3 The nine writer-only gates (input to 0.3)

`check:wireframes`, `check:layout-norms`, `check:rendered-labels`,
`check:source-licence`, `check:methodology-evidence`,
`check:lane-documentation`, `check:l1-complete`, `kg:export`,
`check:avatar-coverage`. Each one always writes its sidecar, so no gate fails on
its content. `uju6` classified 4 of 103 `check:*` scripts; the handover named this
sweep as "the general form" and it has never been run.

### 4.4 Dispatch map

| wave | agents in parallel | isolation | why it is safe |
|---|---|---|---|
| now | 0.1, 0.2, 0.3, 0.4 | worktree each | disjoint files. 0.1 first checks for an existing owner. |
| now | 5.1 + 5.2 (one agent) | worktree | new files only; one registry edit |
| after the owner rules | 1.2 spike | none (it writes a throwaway branch `qa-reports-spike`) | reversible |
| after the spike | 2.x (one agent, serial) | worktree | one module, everything depends on it |
| after 2.1 | 3.1a (kg-audit family), 3.1b (lsi, detangle, translation), 3.1c (the rest), 3.3, 3.4 | worktree each | one family per agent; a shared `qa-store` API |
| after 3.x is green | 3.7 | — | the owner's go |

This plan stays at or below 5 agents in a wave, which is within this session's
medium size guideline. A larger swarm would be asked for separately
(`swarm-management`).

## 5. Decisions for the owner

> **Ruled by the owner, 2026-10-01:**
>
> - **D1 (a):** the orphan `qa-reports` branch, subject to the `3ds9` spike.
> - **D2 (a):** attestations stay on `main` in `test/attestations/`.
> - **D4 (b) "right away":** the moved files are removed from `main` as soon as
>   every reader is migrated and the branch holds a hash-verified copy. No
>   7-day soak. This is the owner's explicit go for bean `5hox`.
> - **D3 and D5 were not asked.** They proceed on their defaults: (a) and (a).
>
> The options below are kept as the record of what was weighed.

The recommended option is listed first in each. **The default applies if no
answer comes, and the work proceeds on it.**

- **D1. Medium.**
  - (a) **an orphan `qa-reports` branch, commit-keyed (recommended)**: same
    repository, same auth, git deduplicates blobs, and the lake-cache precedent
    exists;
  - (b) GitHub release assets plus an index: no git history, awkward diffs;
  - (c) workflow artifacts: they expire (30–90 days), so the record is gone,
    which fails §1.3;
  - (d) a separate repository: a second token and a second place to look.
  - *Default: (a), subject to the 1.2 spike.*
- **D2. Attestations, the 13 agent/human verdict entries.**
  - (a) **stay on `main`, in a small `test/attestations/` (recommended)**:
    they are judgement, authored and rarely churned, and blind regeneration
    would destroy them (`520m`);
  - (b) move to the branch as signed records: one place to look, but a
    judgement then lives off `main`;
  - (c) move to the branch unsigned.
  - *Default: (a).*
- **D3. PR results.**
  - (a) **published under `pr/<n>/<sha>`, pruned on close (recommended)**: a
    reviewer can open them, as with a staging preview;
  - (b) only as a CI artifact;
  - (c) not kept.
  - *Default: (a).*
- **D4. When to `git rm`.**
  - (a) **after every reader is migrated and green on the branch for 7 days
    (recommended)**;
  - (b) at once, behind `qa:fetch`;
  - (c) never: keep both.
  - *Default: (a). No deletion happens without an explicit go in either case.*
- **D5. Where a signed certification lives.**
  - (a) **on `main` beside attestations (recommended)**: it is an accountable
    decision, the same class as D2(a);
  - (b) on `qa-reports` next to its run;
  - (c) as a release asset.
  - *Default: (a).*

## 6. What would falsify this

- **The 1.2 spike fails** in either direction (CI or agent container). Part A
  then needs another medium (D1 b or c), and §2.2 is rewritten.
- **`qa:fetch` adds more than about 20 s to `bun run gates`** in a fresh
  container. Agents would then skip it, which is the "a setup step nobody ran
  fails open" failure that ruled out the merge driver in `520m`.
- **A reader is found that needs the committed file and cannot take a fetch**,
  for example GitHub's own rendering of a PR diff. Then that family stays on
  `main`, and §2.1 gains a row.

## 7. Not in scope

- Changing what any QA criterion *checks*. This proposal moves records and
  changes how gates read them, not what they judge.
- The `py74` "never one total" ruling. The test rollup is per plan, and QA
  rollups stay per family.
- Merge queue and require-up-to-date (`1hjm`, `kgho`). Those concern red-`main`
  *notice*, not QA placement.
