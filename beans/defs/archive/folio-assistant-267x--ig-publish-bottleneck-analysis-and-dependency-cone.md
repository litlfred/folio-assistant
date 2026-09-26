---
# folio-assistant-267x
title: IG publish bottleneck analysis and dependency-cone incremental build proposal
status: completed
type: feature
priority: high
tags:
    - smart-guidelines
    - ig-publisher
created_at: 2026-09-16T08:33:23Z
updated_at: 2026-09-16T09:04:03Z
---

## Brief

**What, and why.** WHO SMART Guidelines DAK repositories publish their FHIR IG through
`smart-base`'s `ghbuild.yml`: one monolithic `publisher.jar` run per push. Every run
re-derives everything from source — downloads the publisher, installs SUSHI and Python
inside the container, starts from an empty `fhir-package-cache`, loads and parses every
dependency package, regenerates snapshots and expansions, validates every resource,
renders every page, runs Jekyll over the whole site. A one-line edit to one profile costs
the full build. Goal: a bottleneck analysis grounded in the publisher's phase model, and a
design for an intermediary derived-artefact layer with dependency cones, in the shape the
Lean cache already has (restore-first, content-hash keyed, verified seed, resumable phases,
exit codes as the contract), split into three steps the author named: (i) a warm
validator / loaded-AST service exposed over MCP, (ii) re-render only the changed
artefact's cone, (iii) a separate meta-index rebuild.

**What I already know (provenance).** `ghbuild.yml` and `run_ig_publisher.py` fetched
2026-09-16 from `WorldHealthOrganization/smart-base@main`: no `actions/cache`, publisher
jar fetched per run, `npm install -g fsh-sushi` per run, `-package-cache-folder` created
empty per run, no phase flags on the deploy build. The same repo's translation pass
already passes `-generation-off -validation-off`, so the publisher's phase flags exist and
WHO uses them. Lean pattern: `scripts/lake-cache.sh`, `lake-cache-produce.py`,
`reseed-lean-cache.sh`. NOT measured yet: phase timings of a real DAK build
(build.fhir.org and confluence.hl7.org are blocked from this sandbox).

**Plan, gate, falsifier.** Measure SUSHI and the artefact dependency graph on a shallow
clone of `smart-immunizations` (Java 21 + SUSHI 3.20.1 available here); compute forward
cone sizes. Falsifier: if a typical artefact's dependents cone is most of the IG, per-cone
rebuild saves little and the design must lean on phase-level caching instead. Deliverable:
`docs/proposals/ig-incremental-build.md` in house style, ownership per layer (HL7
publisher / smart-base CI / folio-assistant MCP). Gate: `bun test`, `eslint`, docs-only.

**Not doing.** Not editing smart-base's workflow (GitHub Actions is its caller), not
implementing the MCP service in this pass, not touching publisher Java.

## Progress (2026-09-16)

- Issue #181, draft PR #182 on `claude/eager-davinci-adros1`.
- `docs/proposals/ig-incremental-build.md`: as-is pipeline (smart-base `ghbuild.yml`),
  publisher phase model from source (nine `TimeTracker` phases → `qa-time-report.json`;
  `-no-validate`/`-no-narrative` skip lists; experimental `-rapido` differential build),
  validator `server` mode + `SessionCache`, design (three steps, `ig-cache.sh` contract,
  Lean ↔ IG mapping), ownership, five phases with falsifiers.
- `content/pipeline/fsh-cone.ts` + `scripts/tests/fsh-cone.test.ts`: source-level cones,
  `--changed`, `--history`. Measured on `smart-immunizations`: 1,059 nodes / 2,478 edges;
  forward cone median 0, p90 6, p99 241, max 278 (RuleSet `LogicLibrary`); per-commit
  replay over 257 commits: mean rebuild 8.2 % of the IG, bimodal (half ≤ 50 nodes, two in
  five on a hub ≥ 200).
- Traps recorded: every RuleSet in both DAKs is parameterised — key by name or no `insert`
  resolves; `//` comment stripping must not eat `http://` canonicals; CQL `include` of a
  library with no file (FHIRHelpers) is external, not a phantom node.
- Not measured: phase timings (registries, tx.fhir.org, github.io blocked here). Read
  `qa-time-report.json` on a published DAK site.

## Outcome (2026-09-16)

Merged as `c2c0520` (PR #182, issue #181) with CI green. Proposal
`docs/proposals/ig-incremental-build.md` and `content/pipeline/fsh-cone.ts` (+ test)
are on `main`. Follow-ups are separate beans, opened when the author picks one:
Phase 1 (smart-base pins + caches), Phase 2 (warm validator MCP), Phase 3
(cone-restricted run), Phase 4 (`ig-cache.sh` + meta-index), upstream Rapido ask.
