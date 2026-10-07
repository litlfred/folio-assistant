---
title: Tool releases and profiles — named, versioned, hashed tools with per-tool runtimes, logged in PROV-O, exported as SPDX 3
parent: Proposals
---

# Tool releases and profiles

Issue #2481, bean `3sbm`. **A proposal for owner sign-off; nothing here is built.**

## What the owner asked

2026-10-07, after a local render in PR #2454 produced no PlantUML SVGs because
the container had no `java`. The renderer said "rendered 0", and nothing else
noticed:

> in testing scenarios we will need to load different sets/releases of tools
> easily. SBOM? SPDX? docker/container is one tool but heavy. need
> named/versioned releases + sha of software. it's not a gate per se, but a
> logging of what version of the Tool was used for audit purpose.

> different tools may need different instances of java, so cannot "pin" java
> globally on a diverse tool-chain

The owner chose: **the log is PROV-O, and SPDX 3 is a generated export.**

## What exists, and is reused rather than rebuilt

| need | already here | gap |
|---|---|---|
| a release's identity and digest | `schemas/binary-release.ts`: `ReleaseDigestSchema` (sha256, 64 hex) and `ReleaseIdentitySchema` | written for releases this repo publishes; no record yet for one it **consumes** |
| noticing a newer upstream | `upstream/upstream-pins.json` and `src/upstream/pins.ts` (current / behind / unknown) | covers three pins; reads the version from a file, so it holds no sha |
| a pinned download with a hash check | `PLANTUML {version,url,sha256}` in `scripts/plantuml-render.ts`, cached in `~/.cache/folio-assistant/` | one tool, hard-coded; assumes `java` on the host |
| what a Tool needs | `ToolRequiresSchema.runtime`: free strings, no version (`schemas/tool.ts`) | cannot say which release, so it cannot be checked |
| what ran | `ToolRunRecordSchema` (`folio-tool-run/v1`, `schemas/tool-run.ts`); PROV `ProvActivitySchema` with `prov:used` (`schemas/prov.ts`) | records no tool version and no runtime |
| what is installed | `capabilities.ts` probes and the `check-deps` list | probes presence, not version or hash |
| SBOM vocabulary | `methodologies/spdx-3.md` (ingested, not adopted); proposal `spdx-3-applicability-2026-10-03`, gap **G4** | D1 had no consumer |

## The design

### 1. A tool release: one external tool at one version

A new record kind, `folio-tool-release/v1`, one file per release, in a declared
`tool-releases` graph:

- **identity**: `name`, `version`, `digest` (sha256, reusing
  `ReleaseDigestSchema`), `source` (URL or OCI reference), `licence` (an SPDX
  expression, already validated by `check:source-licence`'s machinery);
- **kind**: `jar | archive | binary | oci-image | toolchain-file`. An OCI image
  is identified by its **digest**, never by its tag;
- **runtime dependencies: per release, never global.** For example,
  `runtimes: [{ release: "temurin-jre@17.0.12+7" }]`. A JRE is itself a
  tool release with its own digest. Two tools may need two different JREs, and
  both live side by side in the cache;
- **how to run it**: an entry template, for example `java -jar {path}`, with
  the runtime resolved for **this** release and injected as `JAVA_HOME` or
  `PATH`, never inherited from the host.

### 2. A profile: a named set of releases

A file `folio-tool-profile/v1` maps tool names to releases, for example
`default`, `ci-2026-10` or `lean-4.12-test`. A test scenario selects a profile.
Runtimes come in transitively through each release's own dependencies, so a
profile never has to name a JRE.

- `bun run cat tools:use <profile>` resolves the profile, downloads each
  missing release into `~/.cache/folio-assistant/tools/<name>/<version>/`,
  verifies its sha256 and refuses on a mismatch.
- `tools:which <tool>` prints the resolved path and the runtime it will use.
- A container is one release kind, pulled by digest only when a profile
  names it.

### 3. The audit log: PROV-O, not a gate

Each run that invokes a tool through the resolver adds to its PROV activity:

- `prov:used` the tool release entity (`name@version`, sha256), and
- `prov:used` each runtime release it resolved.

These are **entities used**, not agents. The adopted `prov-o-provenance`
node does not adopt `prov:SoftwareAgent`, and this design does not stretch
it. `folio-tool-run/v1` gains a `releases[]` field with the same facts, so the
existing run records carry them too.

**Missing is a state, never a silent success.** If a release cannot be
provisioned (no network, a hash mismatch), the run records
`could-not-provision` with the reason. Today's "rendered 0 SVGs" becomes a
logged fact.

Nothing refuses to run because of the log. The only refusal is the existing
one: a downloaded artefact whose hash does not match.

### 4. SPDX 3: an export, generated

`bun run cat tools:sbom <profile|run>` writes an SPDX 3.0.1 JSON-LD document
generated from the records above:

- one `software_Package` per release, with `verifiedUsing` (sha256),
  `packageVersion` and `downloadLocation`;
- `dependsOn` relationships from tool to runtime;
- for a run, a `build_Build` **generated from** its PROV activity, as §4.2 of
  the SPDX proposal requires: never authored beside it.

This closes G4, and gives #1992's D1 the consumer it lacked: audit.

## Decisions for the owner

**Answered by the owner, 2026-10-07:** T1 = (a), *"T1=1"*. T2, T3 and T4 take the
recommended options: *"T2-4 ok"*. The owner also widened the scope: test-plan
execution (the ITB) and internal QA reports must carry the same versioning
information. See §"Scope widened" below.

| | decision | options | recommended | if unanswered |
|---|---|---|---|---|
| **T1** | Where releases and profiles live | (a) **cat-harness, as a declared graph that every layer inherits** · (b) a separate tools repository, mounted like `bootstrap` | **(a) now**; move to (b) if layers start to diverge | (a) |
| **T2** | Where run logs go | (a) **the existing run records and PROV store, unchanged in location** · (b) the `qa-reports` branch | **(a)** | (a) |
| **T3** | Where an SBOM goes | (a) **a generated artefact on request, not committed** · (b) committed per profile | **(a)**, matching the SPDX proposal's D3 | (a) |
| **T4** | First tools | (a) **PlantUML + its JRE, and graphviz**: the case that failed today · (b) all at once, including sushi, latex and lean | **(a)**: prove the shape on one real failure, then add the others | (a) |

## Scope widened: one run context for every run and report

The owner, 2026-10-07: *"test plan execution (the ITB Interoperability Test
Bed, see WHO/WHO-ITB), internal QA reports should also have the same
versioning information attached along with it. how can we consolidate these
various needs into single (small set of) schema(s) referenced by these
processes/skills"*.

### What a survey of the run and report schemas found

Nine families of run and report records exist. Each stores **the same few
facts under different names**, and no sub-schema is shared between the
families:

| fact | spelled as |
|---|---|
| the checker's hash | `script_hash` (kg-qa manifest, block-qa reviewer, qa-script, health-report) |
| the checker's version | `engine_version`, `reviewer.version`, `by.version` |
| the commit under test | `source.commit`, `reviewed_sha`, `script_commit_sha`, `last_run_sha`, the qa-store `source` |
| the input hashes | `inputFingerprint`, `data`/`process.hash`, `source_hash(es)` |

- **Tool versions:** only `qa-report/v1` records any, in its FHIR-specific
  `toolchain` block.
- **Runtimes, platform commit, mounts:** no record holds a runtime (bun,
  node, JRE), the platform commit or the mount-lock digest.
- **PROV:** no record links to a PROV activity.
- **`folio-security-gate/v1`:** records no versioning at all.
- **The ITB:** nothing is implemented. The only ITB material is the GITB
  README held in `fhir-harness/library/`, prose mentions, and beans `y4uj`
  and `18p1`.

### The proposal: three schemas, not one per report

1. **`folio-tool-release/v1`** (§1 above): one external tool at one version.
2. **`folio-tool-profile/v1`** (§2 above): a named set of tool releases.
3. **`folio-run-context/v1`, new**: *what this run ran on*, stated once:
   - `platform`: the commit SHA of the checkout that ran;
   - `mounts`: the mount-lock digest, plus each mounted instance's pinned SHA,
     reusing `CommitShaSchema` and `LockedInstanceSchema`;
   - `profile`: the tool profile's name and digest;
   - `releases[]`: every tool and runtime release that was resolved, as
     `name@version` plus sha256, reusing `ReleaseDigestSchema`. The
     `could-not-provision` state from §3 applies here too;
   - `invoker`: the script, model or person that ran it, as `kind`, `id`,
     `version` and `script_hash`. This one field replaces the four spellings
     in the table above;
   - `inputs[]`: hash bases, reusing `HashBasisSchema` from `test-run.ts`;
   - `prov`: the id of the PROV activity, which records the context as
     `prov:used`.

**Every run and report record carries one optional field,
`runContext: { sha256 }`**, a reference to its context by digest:
- `folio-tool-run`;
- `folio-test-run` and `test-report`;
- the `kg-qa` manifest;
- `block-qa` and `qa-script`;
- `health-report`;
- the `qa-reports` manifest;
- `folio-security-gate`.

**The context itself is written once per run.** A run-level record (a tool
run, a test run, the `qa-reports` manifest) holds it. One sweep writes
thousands of `block-qa` sidecars, and they all cite one context rather than
each repeating it.

**The ITB is an export, like SPDX.** A test run maps to a GITB TestResult /
TAR, with the run context in the report's context section, and is generated
by a `test:itb-export`. Nothing is authored beside it. This follows from the
owner's PROV-first ruling, and from the fact that GITB reads only TAR, not
these schemas. `qa-report/v1`'s `toolchain` block becomes a projection of
the run context: it is read from the context, not written separately.

**Migration is additive.** The existing fields stay valid. A checker that
supplies a run context may drop its own copies in a later version bump. Each
schema's `$schema` id stays unchanged until then, so no stored record is
invalidated.

### Decisions on the widened scope

| | decision | options | recommended | if unanswered |
|---|---|---|---|---|
| **C1** | How a report carries the context | (a) **by reference: `runContext: {sha256}`, with the context written once per run** · (b) embedded in full in every record · (c) only through a PROV link | **(a)**: deduplicates thousands of sidecars, and stays checkable | (a) |
| **C2** | The ITB | (a) **a generated GITB TAR export from `folio-test-run`** · (b) a native `itb-result` schema | **(a)**: TAR is GITB's own format, so authoring a second one would be a parallel record | (a) |
| **C3** | Which record kinds come first | (a) **tool-run, test-run and the qa-reports manifest**, the three run-level records · (b) every family at once | **(a)**: the others then cite those contexts | (a) |

## Order of work, if signed off

1. Schemas `folio-tool-release/v1` and `folio-tool-profile/v1`, reusing
   `ReleaseDigestSchema`, plus their graph typology and validator.
2. The resolver and cache (`tools:use`, `tools:which`). Port
   `plantuml-render.ts` onto it, with PlantUML getting its own JRE.
3. `prov:used` and `folio-tool-run` `releases[]` from every resolved
   invocation, including `could-not-provision`.
4. `tools:sbom` (SPDX 3.0.1 export).
5. More tools: graphviz, sushi (Node), the latex image by digest, and the lean
   toolchain file.
6. `upstream-pins` gains tool releases, so "behind" is reported per release.
7. `folio-run-context/v1` and the optional `runContext` reference, written by
   the three run-level records (C3), then cited by the report families.
8. `test:itb-export`: a GITB TAR generated from `folio-test-run`.

## What would change this

- If a downstream auditor needs SPDX as the **primary** record, the order
  flips: SPDX first, PROV generated from it. The owner has ruled the other
  way, so this is recorded only as a possibility.
- If the cloud environment's network policy blocks the download hosts
  (Maven, Adoptium, GitHub releases), provisioning needs a mirror, or releases
  committed through git LFS. That would be measured in step 2, not assumed.
