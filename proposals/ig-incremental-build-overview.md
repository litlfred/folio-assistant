# Overview — the incremental IG build: the requested changes, why, and where each sits in the review and publish pipeline

**Status:** companion to [`ig-incremental-build.md`](ig-incremental-build.md), which is
the analysis and carries the evidence. This page is the map: what changes, why, and at
which stage of the review and publish pipeline each change runs.
**Bean:** `temq` · **Issue:** [#187](https://github.com/litlfred/folio-assistant/issues/187)
· builds on [#181](https://github.com/litlfred/folio-assistant/issues/181) /
[#182](https://github.com/litlfred/folio-assistant/pull/182)

How to read it. §1 shows the pipeline as it runs today, in the two forms a reader already
knows — smart-base's GitHub workflows and this repo's BPMN processes. §2 is the **change
register**: every requested change, numbered, with what it is, why, where it runs, who
owns it, and how you know it worked. §3 is the **map**: the review path and the publish
path stage by stage, today versus with the changes, and the BPMN activity each change
attaches to. §4 walks one incremental run with its exit codes and fallbacks. §5 is the
roll-out order and what each phase buys the reviewer and the publication manager. §6
lists the decisions only the author can take.

---

## 1. The pipeline as it is: two paths, six triggers, one build

### 1.1 What actually runs (smart-base, read at `main` on 2026-09-16)

Every DAK repository's `.github/workflows/ghbuild.yml` is a one-line call to
`WorldHealthOrganization/smart-base/.github/workflows/ghbuild.yml@main`. That reusable
workflow is the build. Everything below ends up in it.

| Path | Trigger | Workflow | What runs | What comes out |
|---|---|---|---|---|
| **Review** | push to a PR branch | `pr-preview.yml` — `pull_request_target`, paused at the `pr-preview` environment until a collaborator approves, then `ghbuild.yml` on the PR head | the full build | a preview site on `gh-pages` under the branch's path, a PR comment |
| **Review** | `/validate` in a PR comment | `pr-validate-slash.yml` → dispatches `ghbuild.yml` for the PR branch | the full build | a PR comment |
| **Review** | `/deploy` in a PR comment | `pr-deploy-slash.yml` → dispatches `ghbuild.yml` for the PR branch | the full build, deployed | the preview site |
| **Review** | push / PR | `fhirbuild.yml` → HL7's auto-builder | the full build on HL7's infrastructure | `build.fhir.org/ig/…` |
| **Publish** | push to the default branch | `ghbuild.yml` | the full build, deployed | the `gh-pages` site (the CI build) |
| **Publish** | a GitHub release is created | `release.yml` → when `publication-request.json` exists, `WorldHealthOrganization/smart-html`'s release workflow | the publication request | the WHO publication |

Six triggers, one build, and it is always the whole one. What that build re-derives
from scratch every time, and why none of it survives a run, is
[`ig-incremental-build.md` §1](ig-incremental-build.md#1-what-runs-today-and-what-it-throws-away):
an unpinned publisher, a template pinned to `#current`, an empty package cache,
SUSHI reinstalled, the terminology cache written to `<repo>/txCache` and never kept,
no phase flags.

### 1.2 Where the same build appears in this repo's processes

The BPMN under `docs/workflows/` describes the same thing from the roles' side.
These are the activities the changes attach to in §3.3.

| Process | Activities today | What they are, for an IG |
|---|---|---|
| `editing-hci-validation.bpmn` — one proposed change to one block | `Task_DraftEdit` → `Task_SchemaValidate`, `Task_SyntaxSpell`, `Task_BuildGates` → `Task_ReviewFindings` → `Task_Commit` | the agent drafts FSH; "build and QA gates" means SUSHI plus the validator over the **whole** tank, or nothing until CI |
| `l3-fhir-pipeline.bpmn` — L2 DAK to published IG | `Task_AuthorFsh` → `Task_Sushi` → `Task_Validate` → `Gateway_Valid` → `Task_QcGates` → `Gateway_QcPass` → `Task_QcBeans` / `Task_IgPublisher` → `Task_PublishIg` | the build lane is the publisher run; QC reads its `qa.html` |
| `draft-to-publication.bpmn` — one release | `Task_BuildDraft` → `Task_PublicationQa` → review fork → `Task_AuthorizeRelease` → `Task_PublishRelease` | "build the draft publication" is, for an IG, the full build again |
| `content-lifecycle.bpmn` | `CallActivity_Editing`, `Task_Test`, `CallActivity_Publication` | the outer loop; unchanged by this work |

---

## 2. The change register

Eleven changes. The first three remove the **fixed per-run cost**; the next five are
the **cone**; the rest are wiring. Phases are the proposal's §7. "Where" names the
pipeline path, the smart-base step, and the BPMN activity.

| # | Change | Why (evidence) | Where it runs | Owner | Phase |
|---|---|---|---|---|---|
| R1 | **Pin the toolchain** — publisher version, template version, SUSHI version recorded | unpinned `releases/latest` and `#current` make two runs of one commit differ, and make no content-addressed key possible ([§1.2](ig-incremental-build.md#12-what-is-derived-from-scratch-on-every-run), [§5.1](ig-incremental-build.md#51-the-key)) | every trigger: `ghbuild.yml` publisher step; `ig.ini` in the DAK | smart-base, the DAK | 1 |
| R2 | **Persist derived state between runs** — terminology cache, package cache; later `temp/` and the Rapido tracker | every CI run is cold against tx.fhir.org and re-downloads every dependency ([§1.2](ig-incremental-build.md#12-what-is-derived-from-scratch-on-every-run)) | restore at the start of **every** build; save only after a green build of the default branch | smart-base (workflow), this repo (`ig-cache.sh`) | 1 → 4 |
| R3 | **The toolchain slug and per-artefact trace** — the content-addressed key | a cache without a key that names the publisher, template, SUSHI, dependency versions and tx server cannot be honest ([§5.1](ig-incremental-build.md#51-the-key)) | computed at the start of every build; stamped in every record; compared by `ig-cache doctor` | this repo | 4 (R1 is its precondition) |
| R4 | **The dependency cone** — `content/pipeline/fsh-cone.ts`, landed in #182 | the median artefact has 0 dependents, p90 6; replayed over 257 commits, an incremental build does an eighth of the per-artefact work ([§3.3](ig-incremental-build.md#33-dependency-cones-at-source-level), [§3.5](ig-incremental-build.md#35-what-real-commits-would-have-rebuilt)) | authoring loop (`--changed` before validating); review (the cone report on the PR); publish (selects the rebuild set) | this repo (done); wiring: smart-base | 0 done, wiring 3 |
| R5 | **The warm validator as an MCP service** — `fhir_context_load`, `fhir_validate`, `fhir_snapshot`, `fhir_expand`, `fhir_narrative`, `fhir_context_status` over the validator's `server` mode; a real `fhir-validator` capability probe | the loaded object model exists only in a warm process and is never serialised ([§2.4](ig-incremental-build.md#24-the-validator-already-runs-as-a-service), [§5.3](ig-incremental-build.md#53-step-1--the-warm-validator-and-what-cache-the-binary-ast-means-in-practice)) | authoring loop: validate one resource in seconds; review `/validate`: validate the cone; publish: `Task_Validate` restricted to the cone | this repo | 2 |
| R6 | **The cone-restricted publisher run** — `-no-validate` / `-no-narrative` complements today; Rapido's differential build once its tracker is persisted | per-artefact cost scales with the IG; the cone attacks exactly that ([§4](ig-incremental-build.md#4-where-the-time-goes-and-what-a-cone-can-and-cannot-do-about-it), [§5.4](ig-incremental-build.md#54-step-2--re-render-only-the-cone)) | `Task_IgPublisher`, the `ghbuild.yml` publisher step, both paths | this repo (orchestrator), smart-base (wiring), HL7 (Rapido) | 3 |
| R7 | **Per-artefact records and `ig-cache.sh`** — `restore · seed · verify · doctor`, exit 0 / 1 / 2 / 3 like `lake-cache.sh` | the Lean shape, and the third state: a miss is a normal outcome, never a silent rebuild ([§5.2](ig-incremental-build.md#52-the-per-artefact-record-the-olean), [§5.6](ig-incremental-build.md#56-the-cache-service)) | restore: first step of every build; seed: last step of a green default-branch build; verify inside seed; doctor on a slug mismatch | this repo | 4 |
| R8 | **The meta-index rebuild as its own step** — `ig_metaindex_rebuild`, including the QA aggregate from records | the whole-IG aggregates are the only genuinely global work; it must never re-derive an artefact ([§5.5](ig-incremental-build.md#55-step-3--the-meta-index-rebuild)) | after R6 in every build; alone when only pages or the menu changed; feeds `Task_QcGates` and `Task_PublicationQa` through `qa.json` | this repo | 4 |
| R9 | **Incremental site assembly and deploy** — Jekyll over byte-identical fragments, deploy only what changed | the residual whole-site cost after everything else is per-artefact ([§5.5](ig-incremental-build.md#55-step-3--the-meta-index-rebuild)) | the end of every build; the deploy steps of `ghbuild.yml` | smart-base, the WHO template | 4 / 5 — least certain |
| R10 | **Housekeeping in this repo** — retire the four dangling script references in the SMART skills; register the new tools as skills so BPMN activities can carry a `folio:skill ref` | `ig-publication`, `fhir-validation`, `l3-fhir-authoring` and `quality-control` reference scripts that do not exist ([§1.3](ig-incremental-build.md#13-what-this-repo-says-it-has-and-does-not)) | `.claude/skills/local/*.json`, `--check-deps`, `docs/workflows/` | this repo | 2 |
| R11 | **Upstream asks** — keep the loaded context across Rapido watch iterations; make the tracker's location a parameter | Rapido starts cold every CI run because its tracker lives beside the unpersisted terminology cache ([§2.3](ig-incremental-build.md#23-upstream-is-already-halfway-there-rapido-mode)) | the publisher itself; unblocks R6's second route | HL7 (Zulip) | 5 |

### What each change is, in a few lines

**R1 — pin the toolchain.** Replace `releases/latest/download/publisher.jar` with a
version tag, and `who.template.root#current` with a version. Record the SUSHI version
the container installs. Done when two builds of the same commit report the same
toolchain slug in their logs. This costs nothing and is a prerequisite for every other
row: until it lands, no two runs share a key.

**R2 — persist derived state.** Restore the package cache and `txCache/` at the start
of every `ghbuild` run, from GitHub Actions' cache keyed by the slug, or from the record
store once R7 exists. Save only after a green build of the default branch, so a PR can
never poison what the next publish restores. Done when the publisher's own
`qa-time-report.json` shows `loading` falling and `Terminology Cache is at` names a
warm directory. This is the change with the best ratio of effect to effort, and the
one whose effect §3.1 of the proposal could not measure from the sandbox — measure it
first, on one DAK, before and after.

**R3 — the key.** `toolchain slug = publisher · template · SUSHI · sha256(sorted
dependencies) · tx identity`; `artefact trace = sha256(source · slug · traces of the
backward cone)`. A `git mv` or a whitespace commit is a hit; a dependency bump is a
whole-cache reseed, as a `lean-toolchain` bump is for `lake-cache/<pkg>-<slug>`. Done
when `ig-cache doctor` names *which* component moved.

**R4 — the cone.** Already on `main`. `fsh-cone.ts <ig-root> --changed <files>` prints
what to rebuild and what to check out; `--history N` replays the graph over the DAK's
own history. Three uses, one per pipeline stage: the authoring agent runs `--changed`
before it validates, so it validates the cone and not the tank; the review path posts
the cone report on the PR, so the reviewer sees *scope* — "37 artefacts, the Patient
profile is a hub" — before the build even finishes; the publish path uses the same cone
to select R6's rebuild set.

**R5 — the warm validator.** `java -jar validator_cli.jar server <port> -version 4.0
-ig <deps> -ig <ig-root> -txCache <dir>` behind six MCP tools. The authoring loop is
the win here: an agent editing a profile validates it in the time one resource takes.
In CI the same service validates the cone. Cold start loads the *derived* FHIR — the
IG's own StructureDefinitions with snapshots present, `expansions.json`, the
terminology cache — instead of regenerating it. Done when validating one changed
profile after warm-up takes seconds, and `--check-deps` reports `fhir-validator` from
a real probe.

**R6 — the cone-restricted run.** Given the forward cone C: restore `temp/`,
`txCache/` and the package cache; SUSHI on the restricted checkout; run the publisher
with `-no-sushi` and `-no-validate` / `-no-narrative` set to everything **not** in C
(the `Type/*` and `*/id` wildcards keep the lists short). Fragment generation still
runs for all resources — `-generation-off` is all-or-nothing — which is this route's
measured ceiling and §7 Phase 3's falsifier; Rapido's differential build lifts it once
its tracker persists (R11).

**R7 — the records and the cache service.** One directory per artefact — the
compiled resource with snapshot, the expansion, the validation outcome, the narrative,
the fragments, and a `.trace` — FHIR-native, readable by anything that reads FHIR.
`ig-cache.sh` with `lake-cache.sh`'s contract verbatim: **0** usable, **1** miss (a
full build follows, and that is normal), **2** environment, **3** present but the
toolchain moved. `seed` is safe by default: it writes to `<branch>-test`, verifies a
restore from a clean clone, and promotes only then.

**R8 — the meta-index.** Inputs: every record, restored or rebuilt, plus the IG
resource. Outputs: `ImplementationGuide.definition.resource[]`, `artifacts`, `toc`,
`searchform`, `canonicals.json`, `expansions.json`, `package.tgz`, `full-ig.zip`,
`definitions.*.zip`, `validator.pack`, `usage-stats.json`, `.index.json`, and
`qa.json` / `qa.html` as the aggregate of per-artefact outcomes. One rule: it never
re-derives an artefact. A missing record is exit 1, "build required".

**R9 — site assembly and deploy.** `jekyll build --incremental` over a `temp/` in
which unchanged fragments are byte-identical, and a deploy that pushes only changed
files instead of the whole `output/` tree. This is the least certain row: it depends
on the WHO template as much as on the pipeline, and it is where a page-level renderer
would eventually replace Jekyll.

**R10 — housekeeping.** Four skill definitions in this repo reference
`scripts/sushi-build.sh`, `scripts/ig-publisher-build.sh`, `scripts/create-release.sh`
and `scripts/run-qa.sh`; none exists, and the package manifest claims a
`fhir-validator` capability with no probe behind it. Retire the references, add the
probe, and register `fsh-cone`, the validator tools, `ig-cache` and
`ig_metaindex_rebuild` as skills so the BPMN activities in
`ig-incremental-build.bpmn` can carry `folio:skill ref`s instead of tool names in
parentheses.

**R11 — upstream.** Two asks to Grahame on Zulip, with §3.3's numbers in hand: keep
the loaded context across watch iterations (today every iteration constructs a fresh
`PublisherFields` and re-runs `Load IG`), and make the tracker's location a parameter
so CI can persist it.

---

## 3. The map

### 3.1 The review path — one proposed change, one PR

| Stage | Today | With the changes | Changes |
|---|---|---|---|
| The author edits FSH or CQL (person or agent) | SUSHI and a full validator run locally, or nothing until CI | `fsh-cone --changed` names the cone; `fhir_validate` checks it against the warm context in seconds | R4 R5 |
| The PR is opened or pushed | `pr-preview.yml` waits at the approval gate; nothing tells the reviewer what the change reaches | the cone report is posted on the PR: how many artefacts, which, and whether a hub is touched — before any build | R4 |
| `/validate` | `ghbuild.yml`, the full build | restore → cone → SUSHI on the restricted checkout → validate the cone → aggregate QA; the PR comment carries the cone's QA rows first | R2 R4 R5 R8 |
| Preview build (`pr-preview` approval, or `/deploy`) | the full build, deployed to the branch path | the cone-restricted run → merge records → meta-index → site → deploy the preview. **A preview never seeds the cache** | R6 R7 R8 R9 |
| QC gates / human review (`Task_QcGates`, `Task_ReviewDraft`) | the reviewer reads `qa.html` of a full build and works out the scope by hand | the reviewer reads the cone report and the cone's QA rows, then the aggregate; findings go to beans as today (`Task_QcBeans`) | R4 R8 |
| Approve and merge | — | unchanged | — |
| HL7 auto-build (`fhirbuild.yml`) | the full build on `build.fhir.org` | unchanged — HL7's infrastructure, out of scope | — |

### 3.2 The publish path — one push to the default branch, one release

| Stage | Today | With the changes | Changes |
|---|---|---|---|
| Push to the default branch → `ghbuild.yml` | the full build, deployed | restore the last seeded state → cone against it → R6 → R8 → R9 → deploy → **seed** the cache from this green build | R1–R9 |
| `Task_IgPublisher` → `Task_PublishIg` (`l3-fhir-pipeline`) | the publisher run, then publish | the incremental run of §4; publish unchanged | R6 R7 R8 |
| A release is created → `release.yml` → publication request | `smart-html`'s release workflow | trigger unchanged. The release build is a **full** build from a clean restore (`ig-cache verify`), and its records are promoted as the new baseline | R7 verify / promote |
| `Task_BuildDraft`, `Task_PublicationQa` (`draft-to-publication`) | full build; QA read from it | restore + incremental; `qa.json` from the aggregate | R2 R6 R8 |
| `Task_AuthorizeRelease`, `Task_PublishRelease` | manual, then the full build | the toolchain slug is recorded in the release; `doctor` is clean before authorisation | R1 R3 |

### 3.3 Activity by activity

The BPMN activity a change attaches to, so the diagrams and the register agree.
`ig-incremental-build.bpmn` (§4) is the new process; the rows below say what changes
in the *existing* ones.

| Process · activity | Changes | What changes there |
|---|---|---|
| `editing-hci-validation` · `Task_DraftEdit` | R4 | the agent computes the cone of its own edit before it validates |
| `editing-hci-validation` · `Task_SchemaValidate`, `Task_BuildGates` | R5 | for an IG, "build and QA gates" becomes: validate the cone against the warm context, not the tank |
| `l3-fhir-pipeline` · `Task_Sushi` | R4 R6 | SUSHI runs on the restricted checkout (backward cone) |
| `l3-fhir-pipeline` · `Task_Validate`, `Gateway_Valid` | R5 R6 | the cone only; the gateway is unchanged |
| `l3-fhir-pipeline` · `Task_QcGates`, `Gateway_QcPass`, `Task_QcBeans` | R4 R8 | inputs are the cone report and the aggregated `qa.json`; the bean step is unchanged |
| `l3-fhir-pipeline` · `Task_IgPublisher` | R2 R3 R6 R7 R8 R9 | becomes the sub-process of §4: restore → cone → build the cone → merge → index → site |
| `l3-fhir-pipeline` · `Task_PublishIg` | R7 R9 | deploy, then seed on the default branch or a release |
| `draft-to-publication` · `Task_BuildDraft` | R2 R6 R7 | restore first; incremental build |
| `draft-to-publication` · `Task_PublicationQa` | R8 | reads the aggregate |
| `draft-to-publication` · `Task_AuthorizeRelease`, `Task_PublishRelease` | R1 R3 R7 | slug recorded; `verify` then `promote` |
| `content-lifecycle` · all | — | unchanged |

---

## 4. One run, with its exit codes

The process below is `docs/workflows/ig-incremental-build.bpmn`; the SVG is generated
from it by `bun run render:bpmn`.

<div class="bpmn-figure" id="figure-ig-incremental-build">
  <img src="../assets/img/workflows/ig-incremental-build.svg"
       alt="BPMN swimlane diagram: a source change restores the derived state; if the cache is usable the build computes the change's dependency cone, posts the cone report for the reviewer, checks out and compiles only the cone, validates it against the warm validator service, re-renders the cone's records, merges them with the restored ones, rebuilds the meta-index and assembles the site; a cache miss or a moved toolchain falls back to a full publisher build; QC gates run on the aggregate QA and file findings as beans; a PR branch deploys a preview and never seeds, while main or a release deploys the site and seeds the cache from the green build.">
</div>

[BPMN 2.0 source](../workflows/ig-incremental-build.bpmn) · [full-size SVG](../assets/img/workflows/ig-incremental-build.svg)

1. **Restore** (`ig-cache restore`) — records, `txCache/`, package cache, `temp/`, for
   this toolchain slug. Exit **0**: continue. Exit **1** (miss) or **3** (toolchain
   moved): step 11. Exit **2**: stop; the environment is broken, and that is not a
   build failure to paper over.
2. **Cone** (`fsh-cone --changed`) — the changed files since the seeded baseline →
   the forward cone C (rebuild) and the backward cone of C (checkout).
3. **Cone report** — on a PR, a comment: what C contains and whether a hub is in it.
   On the default branch, a log line.
4. **Restricted checkout** — the backward cone's files plus `sushi-config.yaml`,
   `ig.ini` and the alias files.
5. **SUSHI** on that tank.
6. **Warm context** (`fhir_context_load`) — reuse the running validator, or cold-start
   it from the restored derived FHIR.
7. **Validate C** (`fhir_validate`). Invalid → findings on the bean, back to the author.
8. **Re-render C** — narrative and fragments for the cone only.
9. **Merge** restored and rebuilt records; **meta-index** (`ig_metaindex_rebuild`) —
   a missing record here is exit **1**, not a rebuild; **site** — template and Jekyll.
10. **QC gates** on the aggregate QA. Findings → beans. Clean → deploy: a **preview**
    for a PR branch, the **site** for the default branch or a release.
11. **Full build** — the fallback for a miss or a moved toolchain: today's publisher
    run, whose outputs become the records the next seed writes.
12. **Seed** (`ig-cache seed`) — default branch or release only, from a green build,
    to `<branch>-test`, verified by a restore from a clean clone, then promoted.

Two tunables the author decides (§6): whether a very large cone — a shared RuleSet or
CQL library, a quarter of the IG — should short-circuit to step 11 for simplicity, and
whether previews may ever restore from a PR-specific cache.

---

## 5. Roll-out: what each phase buys, and for whom

| Phase | Lands | The reviewer gets | The publication manager gets |
|---|---|---|---|
| 0 (done) | R4 | `fsh-cone --changed` on any DAK checkout | `--history` on the DAK's own commits |
| 1 | R1, R2 (Actions cache) | previews that skip the toolchain and terminology cold start | reproducible builds; the first measured drop in `qa-time-report.json` |
| 2 | R5, R10 | agents that validate one resource in seconds while drafting | a real `fhir-validator` probe; no dangling scripts |
| 3 | R6, cone report wiring | scope on the PR before the build; validation of the cone only | `validation` and `narrative generation` phases collapse to the cone |
| 4 | R3, R7, R8, R9 | previews built from records; QA rows per artefact | the cache with `doctor`, verified seeds, the meta-index as one step |
| 5 | R11 | — | Rapido's differential build usable in CI |

Phase 1 is the one to do first and measure. It touches the cost the cone cannot, it is
two workflow edits and two pins, and its falsifier is a number in a file every DAK
already publishes.

---

## 6. Decisions for the author

Each is a short answer; none blocks Phase 1.

1. **Cache store.** An orphan branch per DAK (`ig-cache/<pkg>-<slug>`, split under 100
   MB, durable) · GitHub Actions cache (7-day eviction, 10 GB) · both, Actions as the
   first tier. Proposed: both.
2. **Who may seed.** Only green builds of the default branch and releases · also
   approved previews. Proposed: default branch and releases only.
3. **The terminology cache.** Commit `txCache/` to the DAK repositories · keep it only
   in the cache store. Proposed: the cache store, so the repository stays content.
4. **Hub edits.** Always incremental (a 275-node cone still saves three quarters) ·
   short-circuit to a full build above a threshold. Proposed: always incremental, with
   the threshold as a flag.
5. **Where the orchestrator lives.** `smart-base/input/scripts/` (with the other DAK
   CI scripts, loaded not vendored) · `folio-assistant/scripts/` behind the MCP tools.
   Proposed: the cache service and MCP tools here, the workflow wiring in smart-base —
   the same split as `smart-base-tools`.
6. **HL7's auto-build.** Leave `fhirbuild.yml` as it is. Proposed: yes; it is not ours.

## Not verified

Nothing in this document was run against a live DAK build: the workflow behaviour in §1
is read from smart-base's sources at `main`, and no phase timing is quoted, for the
reason [`ig-incremental-build.md` §3.1](ig-incremental-build.md#31-what-could-not-be-measured-here-and-where-to-get-it)
gives. The BPMN in §4 is a proposed process, not one the MCP interpreter has run an
instance of.
