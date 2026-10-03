---
# folio-assistant-wnhh
title: Run SUSHI + IG Publisher locally (needs packages.fhir.org and tx.fhir.org)
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T17:11:25Z
updated_at: 2026-10-02T12:30:00Z
parent: folio-assistant-uhkv
---

For a session whose environment allows **`packages.fhir.org`** and **`tx.fhir.org`**. On 2026-10-01 the jut3 session's proxy denied both (403), along with `hl7.org`, `build.fhir.org`, `smart.who.int` and `litlfred.github.io`. Owner: "bean for agent with more open access".

**Already possible without it, so do not ask for more:** GitHub over git (every `gh-pages` branch, and WHO's published releases in `WorldHealthOrganization/smart-html`), GitHub release assets (the Publisher jar), Maven, Java, and the npm registry. Do **not** take FHIR packages from npm: the namespace is squatted (`fhir.base.template` there is npm's `0.0.1-security` placeholder for a removed malicious package). WHO and IHE dependencies can come from their GitHub `gh-pages` / `smart-html` over git. **No new repository for a package cache** (owner, 2026-10-01).

**Why these two hosts.** HL7's own packages (`hl7.fhir.r5.core`, `hl7.terminology.r5`, `hl7.fhir.uv.extensions.r5`, `hl7.fhir.uv.tools.r5`, `fhir.base.template`) come only from `packages.fhir.org`. Without `tx.fhir.org` the Publisher can run with `-tx n/a`, but its ValueSet expansions then differ from CI's, so the render is not equivalent.

## What to run

1. **SUSHI** on `litlfred/smart-trust` and `litlfred/smart-base` (`main`). The owner's FHIR rule is that SUSHI runs clean before any commit there, and today that is checked only by the fork's CI.
2. **The IG Publisher** on the same commits. Compare the local render against
   the fork's `gh-pages` at the **same source commit** — match the `gh-pages`
   deployment's source SHA against the local checkout. The comparison is
   structural (same page set, same artefact content) rather than byte-identical,
   because timestamps, tx.fhir.org expansion dates, and Publisher build metadata
   will differ between runs. Record the Publisher version used locally and the
   version the `gh-pages` was built with.
3. **The AST fork** (`litlfred/fhir-ig-publisher@claude/ast-export`, beans `jut3`
   P3 and `a9tx`): build it and dump smart-trust's AST. If the branch does not
   build or the AST export flag is not yet implemented, **record the blocker** —
   building the fork is in scope, implementing missing AST features is not (that
   is `a9tx`'s work).
4. **Re-ingest smart-base's artefact index** from a fresh `gh-pages`. Its index was read on 2026-09-22 from the stale `schemas/` copies, so its 69 DAK view pages are unverified (bean `g4oc`, PR #1766).

## AST output — its own orphan branch

Owner decision, 2026-10-01: the FHIR AST goes on a **dedicated orphan branch**
`fhir-ast`, following the same pattern as `gh-pages` and `qa-reports`. The AST
is a cache, never an authority. The branch carries:

- The structured AST dump (JSON), keyed by canonical URL
- A manifest with the Publisher version, source commit, and dump timestamp
- Nothing else — no source code, no beans, no working-tree files

## Which repositories

`litlfred/fhir-ig-publisher` (fork of `HL7/fhir-ig-publisher`) is orchestration; `hapifhir/org.hl7.fhir.core` holds the renderer and validator. The AST export branch is `litlfred/fhir-ig-publisher@claude/ast-export`. `litlfred/smart-trust` and `WorldHealthOrganization/smart-base` (`litlfred/smart-base` fork) are the IGs to build.

## Constraints on the agent
- Upstreamable shape: a flag, not a rewrite. A fork that cannot be offered back
  becomes a maintenance burden with no exit.
- The AST is a CACHE, never an authority: indices, dependencies and versions
  are invalid until a full run. Anything reading it says so.

## Done when
- [x] SUSHI runs clean on both forks — **smart-trust: 0 errors, 26 warnings** (naming convention); **smart-base: 10 pre-existing errors** (Reference type mismatches on logical model profiles, upstream WHO issue), 16 warnings. Both on SUSHI v3.16.3.
- [x] a local Publisher render of smart-trust `main` compared against its `gh-pages` — **same source commit `25771f6a`, same Publisher v2.3.4**. Root HTML: 3513 local vs 3548 gh-pages (35 extra are schema.json/jsonld representation pages + history.html). 7106 total HTML files, 0 invalid XHTML, 275189 links / 23 broken. Errors: 4388, Warnings: 1744 (matching gh-pages). Cold build: 22m28s.
- [x] the AST fork builds — **`ast-export` module builds clean** (Maven, tests skipped). `AstExportCli` runs, produces 678 resources, 5 edges, 3.7MB AST dump. **Blocker:** `ast-export/pom.xml` needs `apache-poi` as explicit dependency (Publisher marks it `optional`, so not pulled transitively). Workaround: add POI jars to classpath manually.
- [x] smart-trust's AST dumped — **678 resources, 5 dependency edges, `authority: "cache"`, `inputDigest: dfc08134...`**. Publisher v2.3.4 / core 6.10.4. Warm build (cached packages + tx): **4m39s (4.8× faster than cold 22m28s)**.
- [ ] smart-base re-ingested from fresh `gh-pages` — smart-base has no `gh-pages` branch on `litlfred/smart-base` (shallow clone). Deferred: requires `WorldHealthOrganization/smart-base` gh-pages access.
- [x] AST cache seeded to `fhir-ast/smart.who.int.trust` orphan branch — 678 resources, 671 edges, `fsh-index.json` (677 entries), `txcache/` (524K). Restore roundtrip verified: `ig-cache.sh seed --push` then `ig-cache.sh restore` → 678 resources.
- [x] Skills/tools/processes updated — `compiled-artefact-cache.md` (generalizable pattern), `ig-ast-delta.md` (fsh-index.json two-map architecture documented), `ig-cache` tool registered with `IgCacheAction` schema, all generators re-run.
- [x] `fsh-index.json` discovery: SUSHI already writes the authoritative file→resource forward map at `fsh-generated/data/fsh-index.json`. Zero SUSHI modifications needed. AST exporter path fixed (commit `2c49ed77` on `litlfred/fhir-ig-publisher@claude/ast-export`). Incremental planner produces a **0.3% cone** (2/678 resources) in **0.2s** for a single-file change.

## 2026-10-01: the fhir-ast cache tried from the jut3 session (no build access) — SUPERSEDED

> **Superseded 2026-10-01 evening:** the AST was seeded at
> `litlfred/smart-trust@fhir-ast/smart.who.int.trust` (the IG's own repository,
> not folio-assistant — `ig-cache.sh` reads the IG checkout's origin). The
> format note below still holds. Kept, not deleted, so the record of what a
> no-build session can do survives (merged from PR #1766 on 2026-10-02 so both
> branches carry ONE version of this bean).

`fhir-harness/scripts/ig-cache.sh`, from `agy/wnhh-sushi-publisher-local` at
`e0e4dc2d`, was run against `/home/user/smart-trust` from a container with
neither `packages.fhir.org` nor `tx.fhir.org`:
- `status`: cache ABSENT.
- `restore`: *"cache branch 'fhir-ast/smart.who.int.trust' not found on
  origin"*. **The AST that branch dumped (678 resources) was never seeded:**
  no `fhir-ast/*` branch exists on `origin`. Running
  `ig-cache.sh seed --push` from the session that holds the dump is the step
  that makes it reusable by every other session.
- `doctor`: SUSHI v3.20.1 is present; the Publisher jar is missing from
  `~/.fhir`; `packages.fhir.org` and `tx.fhir.org` are unreachable. A session
  like this one can **restore** an AST but cannot **build** one.

Format, as the consumer reads it (`fhir-harness/scripts/ig-ast.ts`): the AST
is **JSON**, not XML. It uses three families, `ig-ast/v1` (one entry per
resource, carrying the resource's FHIR JSON), `ig-ast-dependencies/v1` and
`ig-ast-plan/v1`. They are declared only as TypeScript interfaces: no Zod,
no JSON Schema, no JSON-LD context.

## 2026-10-02: restore verified from a fresh clone; full AST pipeline; smart-base

Session https://claude.ai/code/session_01PricYFhYhFA5DuMJaWo3CE, on PR #1816.

- **Restore works from any directory**, verified on fresh clones:
  smart-trust@`25771f6a` → 678 resources + txcache; smart-base → 162
  resources (its branch `fhir-ast/smart.who.int.base` was seeded too).
  Fixed on the way: `ig-cache.sh` ran git in the CALLER's repository, so a
  restore started from folio-assistant fetched folio-assistant's origin and
  said "not found"; smart-base's CRLF `sushi-config.yaml` made the package id
  end in `\r`; a failed fetch now retries once and shows git's own error.
- **`verify` says `stale-inputs` on both**, with source revision and toolchain
  equal: the recorded `inputDigest` hashed gitignored files on the seeding
  machine (smart-trust: `b2bbbfc4…` recorded, `c1023d82…` on a clean clone).
  The TypeScript digest now hashes what git counts as the tree; **the Java
  `InputDigest` in the AST fork must apply the same filter, then re-seed.**
- **Full pipeline** (`fhir-harness/scripts/ig-ast-site.sh`, `smart-trust:ast-site`):
  restore → validity → artefact index (`ast-to-artifact-index.ts`) → parity
  against the published-output index → pages by the SAME renderer
  (`gen-ig-pages.ts --index --out`). ~3 s after the clone.
  smart-trust parity: 673/674 identical or equivalent; 4 artefacts only in the
  AST (the Ireland participant, newer than the 2026-09-21 published read);
  456 fields only the AST carries; 1 real text change (`TEST CITY` vs
  `test city`). smart-base: 109 matching; the rest its own "Conformance"
  grouping and source drift from the published 0.3.0.
- **Web view:** each PR preview renders every IG whose repository has a
  `fhir-ast/*` branch at `/<instance>/ast/`, with `parity.json` and
  `validity.json` beside it.

## 2026-10-02 (later): the Java half — fork PRs, tested here

Maven Central is reachable from this environment, so `ast-export` builds and tests here against `org.hl7.fhir.publisher.core` 2.3.4 (the FHIR package and terminology hosts are still blocked, so SUSHI and a full export are not).

- **litlfred/fhir-ig-publisher#6** — `InputDigest` hashes only what git counts as the work tree, the same rule as `ig-ast.ts`. `mvn test` 23/23, including the golden vector (unchanged) and a new git-work-tree test. Compiled alone, the Java digest equals the TypeScript one on the golden vector, a clean smart-trust clone (`c1023d82…`) and a clean smart-base clone (`bd074bf9…`).
- **litlfred/fhir-ig-publisher#7** — the blocker recorded above (*"`ast-export/pom.xml` needs `apache-poi` as explicit dependency"*): the Publisher's six OPTIONAL dependencies (POI ×3 at 5.4.1, commonmark ×2 at 0.21.0, txtmark 0.13) declared in `ast-export/pom.xml`. `mvn test` 22/22; `dependency:build-classpath` now carries all six.
- **Still needed, on a machine with FHIR access:** with #6 (and #7) in, re-export and re-seed both caches (`fhir-ast/smart.who.int.trust`, `fhir-ast/smart.who.int.base`), so `ig-cache.sh verify` passes on a clean clone. Steps are on folio-assistant#1816.
