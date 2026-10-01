---
# folio-assistant-wnhh
title: Run SUSHI + IG Publisher locally (needs packages.fhir.org and tx.fhir.org)
status: todo
type: task
created_at: 2026-10-01T17:11:25Z
updated_at: 2026-10-01T17:11:25Z
parent: folio-assistant-uhkv
---

For a session whose environment allows **`packages.fhir.org`** and **`tx.fhir.org`**. On 2026-10-01 the jut3 session's proxy denied both (403), along with `hl7.org`, `build.fhir.org`, `smart.who.int` and `litlfred.github.io`. Owner: "bean for agent with more open access".

**Already possible without it, so do not ask for more:** GitHub over git (every `gh-pages` branch, and WHO's published releases in `WorldHealthOrganization/smart-html`), GitHub release assets (the Publisher jar), Maven, Java, and the npm registry. Do **not** take FHIR packages from npm: the namespace is squatted (`fhir.base.template` there is npm's `0.0.1-security` placeholder for a removed malicious package). WHO and IHE dependencies can come from their GitHub `gh-pages` / `smart-html` over git. **No new repository for a package cache** (owner, 2026-10-01).

**Why these two hosts.** HL7's own packages (`hl7.fhir.r5.core`, `hl7.terminology.r5`, `hl7.fhir.uv.extensions.r5`, `hl7.fhir.uv.tools.r5`, `fhir.base.template`) come only from `packages.fhir.org`. Without `tx.fhir.org` the Publisher can run with `-tx n/a`, but its ValueSet expansions then differ from CI's, so the render is not equivalent.

## What to run
1. **SUSHI** on `litlfred/smart-trust` and `litlfred/smart-base` (`main`). The owner's FHIR rule is that SUSHI runs clean before any commit there, and today that is checked only by the fork's CI.
2. **The IG Publisher** on the same commits, to produce a local reference render. Compare it with the fork's `gh-pages`: the same page set and the same bytes up to timestamps. This proves a local run is a faithful stand-in for CI.
3. **The AST fork** (`litlfred/fhir-ig-publisher@claude/ast-export`, beans `jut3` P3 and `a9tx`): build it and dump smart-trust's AST, the prerequisite for P3/P4.
4. **Re-ingest smart-base's artefact index** from a fresh `gh-pages`. Its index was read on 2026-09-22 from the stale `schemas/` copies, so its 69 DAK view pages are unverified (bean `g4oc`, PR #1766).

## Done when
- [ ] SUSHI runs clean on both forks, with its output recorded here
- [ ] a local Publisher render of smart-trust `main` matches its `gh-pages`, with the comparison method and result recorded
- [ ] the AST fork builds and emits smart-trust's AST, or the blocker is recorded
- [ ] smart-base re-ingested, and its DAK view pages checked in Chromium against its `gh-pages`
