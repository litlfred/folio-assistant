---
# folio-assistant-f6r1
title: 'IG fork sites: artefact JSON, JSON Schema and JSON-LD from the AST route, with the AST cache built and seeded in CI'
status: in-progress
type: task
created_at: 2026-10-11T06:49:52Z
updated_at: 2026-10-11T06:49:52Z
---

Owner, 2026-10-11: "fix: Artefact pages still link JSON to WHO, and have no JSON-LD or JSON Schema links. Use AST route. make sure it is fullly working w/ branch caches etc". Follows 48a6 (fork site drift).

Landed: fhir-harness#38 (ast-to-artifact-index --sidecars; ig-cache keeps expansions.json), #39 (--keep-published-grouping; description links rebased); smart-base#42 (smart-base:dak-ast-sidecars runs WHO's DAK generators over the AST). folio-assistant staging pins 2932ee5 (branch claude/fork-site-ast-pins, on #2529's head).

Open: smart-trust#25, smart-immunizations#20, smart-base#43 (folio-site AST route: restore/validity, build+seed on miss/stale on the deploy branch, sidecars, pages --compiled-data). Trial runs on claude/ast-route build each AST in CI. fhir-harness template change (claude/ig-repo-site-ast-route) waits for those to pass.

## Done when
- each fork's live artefact pages link JSON, JSON Schema and JSON-LD on its own site;
- each fork has a seeded cat/fhir-harness/fhir-ast/<package> cache carrying expansions.json, and a re-run reports the cache valid and skips the build;
- the fhir-harness ig-repo-site template carries the same route.
