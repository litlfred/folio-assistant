---
# folio-assistant-wnhh
title: Run SUSHI + IG Publisher locally (needs packages.fhir.org and tx.fhir.org)
status: todo
type: task
priority: normal
created_at: 2026-10-01T17:11:25Z
updated_at: 2026-10-01T17:53:00Z
parent: folio-assistant-jut3
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
- [ ] SUSHI runs clean on both forks, with its output recorded here
- [ ] a local Publisher render of smart-trust `main` compared against its `gh-pages`, with the Publisher versions, source SHAs, and comparison method recorded
- [ ] the AST fork builds, or the blocker is recorded with the specific failure
- [ ] if the AST fork builds: smart-trust's AST dumped to the `fhir-ast` orphan branch with a manifest
- [ ] smart-base re-ingested from fresh `gh-pages`, and its DAK view pages checked against its `gh-pages`


## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.
