---
title: "SPDX 3: where it should, could and should not be used"
kind: proposal
bean: folio-assistant-sd5v
summary: >-
  SPDX 3 belongs at trust boundaries, as a GENERATED export: the release SBOM, the kg-to-portal package manifest, licence ids and the notices built from them, and a published instance's dependencies. It does not belong in QA verdicts, health reports or BPMN task logs. SPDX has no verdict class, it requires a timestamp the QA records deliberately omit, and PROV-O already answers "what happened". Includes the impact on 9 existing processes, 7 missing processes or tasks, 10 prerequisite gaps found along the way, and five owner decisions.
---

# SPDX 3: where it should, could and should not be used
{: .no_toc }

**Status:** analysis for review. Bean `sd5v`. **Nothing is built.**

The owner asked, on 2026-10-03:

> *"do deep analysis of where we could/should/should not be using SPDX v3. it
> seems like test results/qa reports/tool definitions etc are places to start.
> please do impact analysis on missing processes/tasks etc. review impact on
> existing process/tasks"*

**Checkout measured:** branch `claude/zealous-gates-3o9ma2`, based on `main` at
`077c3673a`, 2026-10-03. Counts below come with the command that produced
them. **Quote the command, not the number.**

1. TOC
{:toc}

## 1. The answer in one paragraph

Use SPDX 3 **where an artefact leaves this repository and somebody outside
must trust what is in it**:

- the platform release;
- the package `kg-to-portal` signs;
- a published instance's dependency set;
- the licences of everything we redistribute.

In each of these places SPDX should be a **generated view of facts the
repository already holds**, never a second place to author them.

**Do not use it for test results, QA reports or health reports.** That
contradicts the owner's starting guess, so the reasons are in §4 in full. In
short:

- SPDX 3 has no verdict or test-result class.
- It requires a creation timestamp that the QA records omit on purpose
  (bean `y7b3`).
- Its elements are immutable, while a QA sidecar holds many reviewers' verdicts
  over time.
- "What ran and who answered for it" already has an owner-chosen standard:
  **PROV-O** (issue #1180).

**Tool definitions are a "could", not a "should".** A Tool has no version, no
content hash and no licence today. Exporting it would publish a package that
SPDX cannot identify, so that gap comes first (§6, G4).

## 2. What SPDX 3 is, and what it is not

Only the properties that decide placement are listed here.

| property | consequence here |
|---|---|
| **Model.** Element-based: everything has an absolute-IRI `spdxId` and a `CreationInfo` (`specVersion`, `created`, `createdBy`, `createdUsing`). | Every element needs an **absolute IRI** and a **timestamp**. |
| **Serialisation.** JSON-LD native, with a published remote `@context`. | It aligns with [`json-ld-serialisation`](../methodologies/json-ld-serialisation.md). The context must be **vendored**, since that methodology forbids network context fetches (`localLoader`). |
| **Profiles in 3.0.1.** Core, Software, Security, SimpleLicensing, ExpandedLicensing, Dataset, AI, Build, Lite. | §3 maps them. |
| **Relationships.** A closed vocabulary: `dependsOn`, `generates`, `hasInput`, `hasOutput`, `hasEvidence`, `hasTest`, `testedOn`, `trainedOn`, `usesTool`, `hasDeclaredLicense`, `hasConcludedLicense`, and others. | Edges such as skill `satisfies` have no SPDX term and stay KG edges. |
| **No verdict class.** A test result can only be an `Annotation` (free text) or a `hasEvidence` / `hasTest` edge pointing at an artefact. | §4.1. |
| **Licences.** `NOASSERTION` / `NONE` and `LicenseRef-` ids. | This repo's third licence state, `unknown` **with `searched[]`** (`check:source-licence`), has no SPDX equivalent. `NOASSERTION` would discard the search log. |
| **Versions.** 3.0.1 is stable. 3.1 had its first release candidate on 2026-01-26, adding profiles (Hardware, Safety, Operations, Supply Chain and others). A final 3.1 could not be confirmed on 2026-10-03. | Target 3.0.1 and watch 3.1 through `upstream-pins` (D2). |

**Not held.** No SPDX specification is in `cat-harness/library/`. This
platform adopts a standard **from a held source** (precedent: beans `f1qz` and
`6306` ingested ODRL, PROV-O and JSON-LD before their methodology nodes). So
the first task is to ingest the spec (§7, M1). Everything in this table was
read from memory and the SPDX site, **not from a held copy**, and is
provisional until M1.

## 3. Surface by surface

Rating key:
- **S** = should: a consumer outside the repo needs it, and the facts exist.
- **C** = could: it fits, but the payoff is weak or a prerequisite is missing.
- **N** = should not.

| # | surface | today | SPDX 3 target | rating | why |
|---|---|---|---|---|---|
| 1 | **Platform release** (`release-folio-assistant.yml`: tgz, GitHub Release, GitHub Packages) | No SBOM. The release is dispatch-only and **unmodelled in BPMN**. | `software_Sbom` (`sbomType: build`) with one `software_Package` per entry in `bun.lock` and `python-deps.ts`, purls `pkg:npm` / `pkg:pypi`, `dependsOn` edges | **S** | This is the use SPDX exists for, and downstream regulation increasingly asks for it. All the inputs exist. **Blocker:** `requirements*.txt` are unpinned, so Python versions are not exact (G5). |
| 2 | **`kg-to-portal` package** ("files plus a manifest of digests", then sign, then verify) | A house digest manifest | `SpdxDocument` → `software_Package` → `software_File` with `verifiedUsing: Hash(sha256)`; the signature stays separate | **S** | The strongest structural fit in the repo. The manifest of digests **is** an SBOM of files, and the GDHCN / WHO SMART Trust side gains a format it can read without knowing ours. |
| 3 | **Licence ids** (`library/*/licence.json`, `schemas/source-licence.ts`) | `id` is a free string ("SPDX where one exists"). Values include `W3C-20150513` and the `LicenseRef-W3C-Document-License` / `LicenseRef-OMG-Specification` refs. | `simplelicensing_LicenseExpression`, validated against a **pinned** SPDX License List | **S** | Cheap, and it makes an existing claim checkable. Keep `unknown` + `searched[]` as the house field it is, and emit `NOASSERTION` **only in exports**. |
| 4 | **NOTICE / THIRD-PARTY-NOTICES.md** | Hand-written; THIRD-PARTY-NOTICES has licence texts pasted in | **Generated** from item 3, plus the release SBOM's concluded licences | **S** | Today the same fact is written in two places with nothing tying them. That is exactly what `generalise-the-fix` names a class defect. |
| 5 | **Path-scoped dual licence** (`LICENSE` Apache-2.0 for code, `LICENSE-CONTENT.md` CC-BY-3.0 for prose, by path) | Prose rule only. One file in the tree has an `SPDX-License-Identifier` header (`grep -rl SPDX-License-Identifier --include=*.ts .`). | **`REUSE.toml`** (path globs to SPDX expression), **not** per-file headers | **S** (with REUSE) | One declaration, no corpus sweep, and machine-readable. Per-file headers across thousands of files would be churn with no single source. |
| 6 | **Published instance dependencies** (`<instance>.json` `needs[]`, `dependencies.folioAssistant`, `schemas/depends-on.ts` FHIR `{packageId, version, uri}`) | Three spellings of one graph | SPDX `dependsOn` **generated** from whichever one #592 makes authoritative | **S**, after #592 | Without #592 settled this becomes a **fourth** authored copy. The order matters more than the format. |
| 7 | **Tool nodes** (`schemas/tool.ts`, `cat-harness/tools/*.ts`, MCP served by `cat-harness-tools/`) | `id`, `invoke`, `io`, `maintains`, `downstream`. **No version, hash or licence.** | `software_Package` (served tool) or `software_File` (`inProcess.module`), with `generates` for `maintains` | **C** | It fits, but only inside the release SBOM (row 1), as components of the shipped package. A standalone tool SBOM has no consumer. G4 first. |
| 8 | **Skill packages** (`package-manifest.json`; `skills/remote-packages/*.json` with full-SHA `ref`; `sync-remote-skills.ts` records sha256 fixity) | Versions present (count with `ls */skills/**/package-manifest.json`). **No licence on any manifest.** `upstreamLicence()` finds the LICENSE file but stores no id. | `software_Package` + `hasDeclaredLicense` | **C** → **S** for remote packages | Redistributed third-party skills (`claude-scientific-skills`, MIT) are a licence obligation **now**. Recording their SPDX id at sync time is item 3 applied to a second corpus. |
| 9 | **Library sources and reference datasets** (`manifest.jsonld` `meta.source_sha256`; materialisation `fixity`; CODATA; who-iris catalogue; `fhir-artifact-index`) | Three sha256 vocabularies (G2). Origin URL and retrieval date are often prose in `licence.json` `note`. | `dataset_DatasetPackage` (reference datasets) or `software_File` + `Hash` (documents) | **C** | Useful **when a dataset is republished** (e.g. a folio ships a CODATA-derived table). Internally, PROV `wasDerivedFrom` plus Dublin Core already covers it. |
| 10 | **`folio-tool-run/v1`, `folio-test-run/v1`, `attribution.ts`** (`toolchain`, `sourceRevision`, `inputDigest`) | House run records with full 64-hex fingerprints | `build_Build` **inside a release SBOM only** | **C** | The mapping is close, but it competes with PROV `Activity` (row 13). Use it only where a release consumer wants "how was this built" in SPDX terms. |
| 11 | **Dependency advisories** (`check:dependency-advisories`: `bun audit`, warn-only; Dependabot) | Advisory output, not recorded | `security_Vulnerability` + VEX (`VexAffected` / `VexNotAffected`…) linked to row 1's packages | **C**, after row 1 | VEX lets a person record "not affected, because…" as data. That is a **decision**, and it needs a lane (M6). |
| 12 | **QA verdicts**: `qa-results/v1`, `block-qa/v1` (`*.qa.json`), `kg-qa/v1`, `qa-attestations/v1`, script sidecars `qa-script/v1` | House schemas, 12-hex hashes, no timestamps by design, four-state freshness | — | **N** | §4.1. |
| 13 | **BPMN task runs** (`schemas/prov.ts`, `src/workflow/prov-record.ts`, `docs/assets/prov/*.prov.jsonld`) | PROV-O / PROV-JSONLD, owner-chosen | — | **N** | §4.2. |
| 14 | **Health report** (`health-report/v1`) | Judges the repository itself | — | **N** | Its subject is not an artefact. SPDX has nothing to describe. |
| 15 | **QA witnesses** (`qa-witness/v1`, published at `/assets/qa/`) | A derived projection of sidecars | — | **N** | A derived view of a derived view. If anything, it is an **output** listed in a release SBOM, never evidence. |
| 16 | **Agent authorship** (block attribution `kind: agent`, `agent_model`) | House attribution, PROV-shaped | — | **N** (AI profile) | `ai_AIPackage` describes a **model distributed as a package** (its training, its energy use, its limits). We distribute no model. Who wrote a block is provenance, and PROV is the standard for that. |
| 17 | **Authored KG content** (blocks, skills, processes) | KG nodes | — | **N** | It is the content itself, not a description of a package. SPDX may *list* these files in a release (row 1), but must never *be* them. |

## 4. The three "should not"s, argued

### 4.1 Test results and QA reports

The owner suggested starting here, so the reasons are given in full. Each one
is independent of the others.

1. **No class to hold a verdict.** In SPDX 3 a result can be an
   `Annotation` (`annotationType: review`, with free-text `statement`) or a
   `hasEvidence` / `hasTest` edge from the artefact to a file. Neither holds
   `{criterion, result, reviewer, field_hash}`. We would serialise our schema
   into a string inside theirs, and lose validation on both sides.
2. **A required timestamp we refuse on purpose.** `CreationInfo.created` is
   mandatory. `qa-results/v1` has *"No `updated_at`, on purpose (bean
   `y7b3`)"*, and `kg-qa` sidecars record no time either, because a time makes
   every re-run a diff. The class of defect is recorded four times already:
   `mcdj` (one auditor edit rewrote 21 files), `oq57` (`engine_version` made
   gates unpassable), `3ozg` (`bun test` rewrote 72 sidecars) and `cflw`.
   SPDX would reintroduce it by specification.
3. **Immutable elements versus a living record.** A `block-qa` sidecar keeps
   many reviewers' verdicts per criterion, and staleness is computed by
   matching `field_hash` against the present source. An SPDX element is
   immutable and carries one `CreationInfo`. Mapping one onto the other means
   either one document per verdict (a file explosion, on the graph #1763
   measured as the churn hot spot) or mutating "immutable" elements.
4. **Four-state freshness has no home.** `current | stale | absent |
   unreadable`, and the rule that *could-not-determine is never rendered as
   clean*, cannot be expressed in SPDX.
5. **The test process in #1763 already has a downstream target.**
   [QA and test evidence off `main`](qa-reports-branch-and-test-process-2026-10-01.html)
   §3.2 makes `test-plan/v1` and `test-report/v1` house models, with **FHIR
   TestPlan / TestReport** as the export in the FHIR context. Adding SPDX gives
   a third shape for one report.

**What to do instead**, if an external consumer ever needs test evidence about
a *release*: an **in-toto attestation** (test-result predicate) whose subject
is the release SBOM's package digest. That is the supply-chain standard for
"this artefact passed these tests", and it points **at** SPDX rather than
living inside it. Nobody needs this today, so it is listed and not proposed.

### 4.2 BPMN task runs and the execution log

PROV-O was chosen by the owner for logging (2026-09-23). SPDX `build_Build`
carries `buildType`, `buildStartTime`/`EndTime`, `parameter`,
`configSourceDigest` and `environment`. That is a narrower "activity". Emitting
both would give two answers to "what ran". Where a release SBOM needs to say
how it was built, it should carry an `externalRef` to the PROV bundle, or a
`build_Build` **generated from** the PROV record, never authored beside it.

### 4.3 The AI profile

The AI profile describes models as **supplied components**: autonomy type,
training data, energy consumption, limitations. The platform *uses* models
through agents and ships none. Recording `agent_model` as an `ai_AIPackage`
would assert that we distribute a model. Revisit this only if a folio ever
packages a fine-tuned or local model (the `models` graph kind exists, holding
nothing of that sort today).

## 5. The rule that decides placement

> **SPDX is an export at a trust boundary. It is generated from facts held
> elsewhere, and committed nowhere those facts already live.**

This is the same rule `upstream-pins.json` states about versions (*"a registry
with its own copy would be a second answer to 'what are we running'"*), and the
rule `binary-release` follows (*"never the bytes"*). It decides every row
above. Where the facts exist, SPDX is a view (rows 1–6). Where a fact is
missing, the gap is fixed in the house model first (rows 7–8). Where SPDX would
become the store, it is refused (rows 12–17).

## 6. Prerequisite gaps found on the way

These are worth fixing **whether or not SPDX is adopted**. Each one would
otherwise surface as a malformed SPDX document.

| | gap | where | matters for |
|---|---|---|---|
| G1 | **Hashes are truncated to a 12-hex prefix** (`script_hash`, `field_hash`, `source_hash`, `deps_hash`). The `kg-qa` comment says "sha256 of the audited file" but the values are 12 characters. | `scripts/qa-results.ts` `sourceHashOf`, `content/pipeline/qa-utils.ts:53`, `schemas/kg-qa.ts` | SPDX `Hash` expects a full digest. This is fine internally, but nothing truncated may cross a boundary. |
| G2 | **Three sha256 vocabularies** for one fact: `source_sha256`, `fixity{algorithm,digest}`, `binary-release` `sha256` | `gen-library-jsonld.ts`, `materialization.ts`, `binary-release.ts` | One `Hash`-shaped type would serve all three, and SPDX later. |
| G3 | **Licence `id` is unvalidated.** NOTICE and THIRD-PARTY-NOTICES are hand-written duplicates. | `schemas/source-licence.ts`, root files | Rows 3–4 |
| G4 | **A Tool has no `version`, no content hash and no licence.** Skill `package-manifest.json` has no licence. | `schemas/tool.ts`, `schemas/skill-package.ts` | Rows 7–8. It also matters for `tool-downstream-fresh`. |
| G5 | **Python requirements are unpinned** (no `==`), while `bun.lock` is exact | `requirements*.txt`, generated from `schemas/python-deps.ts` | Row 1. A build SBOM cannot name an exact version that was never fixed. Related to the supply-chain bean `j41m`. |
| G6 | **Reviewer actors do not resolve**: 0 of 5,896 `block-qa` reviewer entries name a declared actor (recount: the actor-resolution report in `qa-readers-audit`) | `schemas/block-qa.ts` `QaReviewer.actor` | Any export naming who judged anything, in SPDX or PROV |
| G7 | **No QA artefact links to PROV.** `grep -l 'prov' cat-harness/scripts/qa-*.ts cat-harness/schemas/*qa*.ts` finds none. No Activity `generated` a sidecar. | QA writers | §4.2: the PROV record is what a release SBOM would point at for "how" |
| G8 | **Bean `mcdj` is marked done, but regressed.** It says *"no kg witness carries `scriptHash` at all now"*. `content/pipeline/qa-witness.ts:597` still writes `scriptHash: auditor?.script_hash`, and 21 `*.kg.json` witnesses carry it (`grep -l '"scriptHash"' cat-harness/test/results/witnesses/**/*.kg.json`). | | Not SPDX. Found in passing, and reported because a completed bean is now false. |
| G9 | **The SPDX spec is not held** | `cat-harness/library/` | M1, and every claim in §2 |
| G10 | **JSON-LD friction.** (a) SPDX's remote `@context` must be vendored into `localLoader`. (b) A `spdx` prefix fails `check:context-emission` unless emitted or `FORWARD_DECLARED`. (c) `spdxId` must be an absolute IRI, while house `@id` is the file path (`check:node-iris`). | `scripts/publish-verify.ts`, `schemas/jsonld.ts` | Any SPDX output. (c) is settled by minting `spdxId`s under the **release URL**, not the repo path. SPDX documents are not KG nodes. |

## 7. Missing processes and tasks

| | missing | shape | modelled on |
|---|---|---|---|
| M1 | **Ingest SPDX 3.0.1** into `library/`, then write a `spdx-3` methodology node with `applies-when` and what it refuses | `library/methodology-from-source.bpmn`, as-is | beans `f1qz` → `6306` (ODRL, PROV-O, JSON-LD) |
| M2 | **A release process.** `release-folio-assistant.yml` runs today with **no BPMN**. Tasks: resolve the version (`check:version-bump`), build, **generate the SBOM**, **validate it**, attach both, record digests, sign (optional, D3) | new `sdlc/release.bpmn`, lanes CI/CD, Publication manager | `docs-site-publish.bpmn` and `qa-report-signing.bpmn` (as a call activity) |
| M3 | **An `sbom_export` Tool plus a `sbom-generation` skill.** One generator serves rows 1, 2 and 6. Validation uses the SPDX JSON-LD shape with the vendored context (G10). | `defineTool()` in `cat-harness/tools/`. The skill registers through `skill:register`. | `kg-export` (already emits `prov:wasDerivedFrom` and `dependsOn`) |
| M4 | **Licence-id validation.** Pin the SPDX License List (`upstream-pins.json` entry: repo `spdx/license-list-data`, `pinnedIn` a vendored JSON), and make `check:source-licence` refuse an id that is neither on the list nor `LicenseRef-`. | a task inside the existing ingest processes, plus a pin watched by `upstream-pin-watch.bpmn` | `check:source-licence` three-state discipline |
| M5 | **Notices generation.** `gen:notices` writes NOTICE and THIRD-PARTY-NOTICES from `licence.json` plus remote-package licences plus the release SBOM; `gen:notices:check` gates staleness. Plus `REUSE.toml` for row 5. | a generator and a gate | `readme:sync` / `readme:sync:check` |
| M6 | **VEX triage** (later, after M2). A human or agent lane decides each advisory, `affected` or `not_affected` with a justification, recorded as VEX. | a decision task with a DMN for the justification codes | `decision-audit` |
| M7 | **Graph kind `sbom`**: only if D3 chooses committing. `holds: "derived"`, `renderable: false`, with schema and validator. | `graph-kind-registry.ts` | `binary-release` (but that is `state`, because re-running yields new bytes. A regenerable SBOM is `derived`, which is why D3 recommends not committing it). |

## 8. Impact on existing processes and tasks

Size: **S** = a task edited or added inside the diagram. **M** = a new
activity with a skill and a gate. **—** = deliberately unchanged.

| process | change | size |
|---|---|---|
| `kg/kg-to-portal.bpmn` | "Package: files plus a manifest of digests" emits an `SpdxDocument` (via M3) in place of, or generated beside, the house manifest. "Verify what arrived" validates it. "Sign" signs the SPDX document's digest. | **M** |
| `sdlc/upstream-version-adoption.bpmn` | "Move the pin and open the PR" regenerates the SBOM. The **SBOM diff** becomes impact evidence for the Reviewer/SME lane (which packages moved, which licences changed). | **S** |
| `sdlc/upstream-pin-watch.bpmn` | Gains the SPDX License List pin (M4), and an SPDX spec pin for 3.1 (D2). No diagram change: it is data-driven by `upstream-pins.json`. | **—** (data only) |
| `sdlc/code-quality-gates.bpmn` | Adds `check:source-licence` validation (M4) and `gen:notices:check` (M5). "Dependency advisories (WARN-ONLY)" stays warn-only until M6 exists. **Not** an SBOM gate on every PR (D3). | **S** |
| `library/document-ingestion.bpmn`, `library/materialize-remote.bpmn`, `library/methodology-from-source.bpmn`, `library/sample-import.bpmn` | "Establish the licence" must produce a **valid** SPDX id or `LicenseRef-` (M4). `unknown` + `searched` is unchanged. | **S** each |
| `library/copy-out-materialized.bpmn`, `library/refresh-materialized.bpmn` | None now. Fixity unifies with G2 if that is done. | **—** |
| `sdlc/qa-report-signing.bpmn` | Unchanged. When M2 calls it, the **subject** of the signature may be the SBOM digest. | **—** |
| `sdlc/docs-site-publish.bpmn`, `process/render-kg-to-cdn.bpmn`, `sdlc/publish-verification.bpmn` | Unchanged. A docs site is not a package (row 17). | **—** |
| `sdlc/merge-train.bpmn`, `sdlc/merge-base.bpmn`, `prepare-merge` | Unchanged, **deliberately**: an SBOM per merge is churn on `main` with no consumer. | **—** |
| `remote-packages` sync (no BPMN; `scripts/sync-remote-skills.ts`) | Record the upstream licence as an SPDX id at sync time (row 8). | **S** |
| QA family: `kg-audit`, `qa-sweep`, `block-qa`, witness pipeline, #1763 test process | **Unchanged.** §4.1. | **—** |

**Gates and registrations an adoption touches.** Add `check:sbom` /
`gen:notices:check` as steps in `.github/workflows/code-quality-gates.yml`,
because `gates.ts` derives the gate set from there. `audit:coverage` will report
any new kind as unaudited until a criterion or gate declares it. Proposed
`kg-audit` criteria: `licence-id-valid`, `notices-current` and
`release-has-sbom` (on the release process, not on every node). Other
touchpoints: `check:context-emission` and `check:node-iris` (G10), and
`skill:register` for M3.

## 9. Decisions for the owner

| | decision | options | recommended | if unanswered |
|---|---|---|---|---|
| **D1** | Scope | (a) **boundaries only: rows 1–6, generated** · (b) broadly, including QA and tools · (c) not at all | **(a)** | nothing is built; this stays a proposal |
| **D2** | Version | (a) **3.0.1 now, watch 3.1 via `upstream-pins`** · (b) wait for 3.1 final | **(a)** | (a) |
| **D3** | Where an SBOM lives | (a) **a release asset, plus its digest in a `binary-release`-style record; not committed** · (b) committed on `main` (needs M7) · (c) on the `qa-reports` branch (#1763) | **(a)** | (a) |
| **D4** | Licences | (a) **validate ids + generate notices + `REUSE.toml`** · (b) validate only · (c) per-file headers | **(a)** | (b), the smallest safe step |
| **D5** | Test evidence | (a) **house schemas + PROV now; in-toto attestation over the SBOM only when a consumer asks** · (b) SPDX Annotations | **(a)** | (a) |

## 10. Order of work, if D1 = (a)

1. **M1:** ingest SPDX 3.0.1 and write the methodology node. This retires the
   provisional status of §2.
2. **M4 + G3:** validate licence ids against the pinned list. This is cheap,
   and it is useful even if everything else stops here.
3. **M5:** generate NOTICE and THIRD-PARTY-NOTICES, and add `REUSE.toml`.
4. **G5:** pin Python, then **M3 + M2:** the release SBOM. This is the first
   SPDX document.
5. **Row 2:** `kg-to-portal` emits its package manifest as SPDX.
6. **Row 6:** after #592 settles the authoritative dependency record.
7. **M6:** VEX, only once a release SBOM exists for it to reference.

## 11. What would change this analysis

- **A consumer asking for SPDX-shaped test evidence** would reopen §4.1, and
  even then the answer is more likely in-toto than SPDX.
- **SPDX 3.1 adding a first-class test or verification-result class** would
  reopen §4.1 on its merits. The 3.1 RC's new profiles (Safety, Operations)
  should be read for this once ingested.
- **A folio packaging a model** would reopen §4.3.
- **The owner choosing to commit derived artefacts on `main` after all** (D3
  b) brings in M7 and the churn classes in §4.1 point 2.
