---
# folio-assistant-2coi
$schema: bean/1.0.0
title: 'IG fork sites: artefact JSON, JSON Schema and JSON-LD from the AST route, with the AST cache built and seeded in CI'
status: completed
type: task
priority: normal
created_at: 2026-10-11T07:17:27Z
updated_at: 2026-10-11T12:25:41Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-11: "fix: Artefact pages still link JSON to WHO, and have no JSON-LD or JSON Schema links. Use AST route. make sure it is fullly working w/ branch caches etc". Follows 48a6 (fork site drift).

Landed: fhir-harness#38 (ast-to-artifact-index --sidecars; ig-cache keeps expansions.json), #39 (--keep-published-grouping; description links rebased); smart-base#42 (smart-base:dak-ast-sidecars runs WHO's DAK generators over the AST). folio-assistant staging pins 2932ee5 (branch claude/fork-site-ast-pins, on #2529's head).

Open: smart-trust#25, smart-immunizations#20, smart-base#43 (folio-site AST route: restore/validity, build+seed on miss/stale on the deploy branch, sidecars, pages --compiled-data). Trial runs on claude/ast-route build each AST in CI. fhir-harness template change (claude/ig-repo-site-ast-route) waits for those to pass.

## Done when
- each fork's live artefact pages link JSON, JSON Schema and JSON-LD on its own site;
- each fork has a seeded cat/fhir-harness/fhir-ast/<package> cache carrying expansions.json, and a re-run reports the cache valid and skips the build;
- the fhir-harness ig-repo-site template carries the same route.

Re-keyed 2026-10-11 from folio-assistant-f6r1, an id that collided with the completed translation-catalogues bean (check:bean-front-matter DUPLICATE ID; reported by session_0152Nknwuu7QA2mPXnbPtRyP). Same bean, same work; only the id changed.


## Done, 2026-10-11 (verified on the published gh-pages branches)
- smart-immunizations, smart-trust and smart-base each built their IG in CI, seeded cat/fhir-harness/fhir-ast/<package> (748 / 678 / 162 resources) with expansions.json (5.1 MB / 275 KB / 1.2 MB), and published.
- Artefact pages link json (../ast-data/…), JSON Schema and JSON-LD (../fhir-artifact-index/sidecars/…) on the site itself; a logical model's schema binds by title (IMMZC4 -> IMMZ_C4_Create_client_record).
- A re-run with a current cache restored it, judged it valid, skipped every build step, and published in under 2 minutes (smart-trust 38120531027).
- Template: fhir-harness#40 (ddae496).
- Two defects found on the way, both fixed: AstExportCli refuses a relative -ig; and it never sets a terminology server (the Publisher CLI defaults -tx to production), so the first builds ran with none and smart-immunizations crashed rendering a ConceptMap.

Left: the forks pin folio-assistant 2932ee5 (branch claude/fork-site-ast-pins, on #2529's head); re-pin to #2529's merge when it lands (48a6). The exporter is built against Publisher 2.3.4; 2.3.5 / 3.0.0 moved core packages (8 compile sites), a port for later.
