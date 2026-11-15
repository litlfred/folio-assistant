---
# folio-assistant-3v15
$schema: bean/1.0.0
title: 'Memory: Owner 21:14Z 11-10 - IG gh-pages must carry resources (resources/<Type>/<id>.json) in the JSON-LD KG; release package.tgz via ig-release caller (si#133)'
status: completed
type: task
priority: low
created_at: 2026-11-10T21:15:41Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `si-resources-on-gh-pages-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner 21:14Z 11-10 - IG gh-pages must carry resources (resources/<Type>/<id>.json) in the JSON-LD KG; release package.tgz via ig-release caller (si#133)

Thread "Shrink SMART IG docs publishing" (cmsg_017WNUkNK8kdDziPK58Pv6G9XqKVGpzpLAbWKjURUeqy2S), 2026-11-10.
- Owner: "we need the resources in the json(ld) KG on gh-pages", "like at least" smart-trust's AST cache `resources/` layout. Reverses "resources only by raw URL" for the site copy.
- Plan (corrected by owner 21:17Z: FHIR convention = site-root <Type>-<id>.json as IG Publisher, e.g. fhir.ch/ig/ch-ems/StructureDefinition-x.json; NOT resources/<Type>/<id>.json): publish root <Type>-<id>.json, artifact/<T>-<id>.jsonld encoding points local first, raw cache + package.tgz as mirrors; index.jsonld links resources/; test every node's file exists.
- Measured si (756 res): verbatim 47 MB (Library ELM base64 ~20 MB), minified no ELM 23 MB, also no text.div 13 MB. Card: A/B(rec)/C.
- Owner "do the package.tgz": si#133 (issue #132) MERGED 21:20Z: ig-release caller (tag v* -> draft release w/ package.tgz). Owner 21:23Z: version bump/tagging is a GOVERNANCE thing -> never tag or suggest tags for IG releases; workflow waits for governance.
- 21:14Z si#131 merged (fhir-harness eef2e574 incl. #358); forced ig-ast-refresh run 42903014012 then republish si root.
**Why:** resources must be crawlable from gh-pages alone, not only via raw.githubusercontent.
**How to apply:** don't drop resource JSON from IG sites again; size cuts come from ELM/narrative/minify per the card.
Related: folio-assistant-o6rs, folio-assistant-ap4q
- 11-10 21:45Z si root republished 13.8 MB (from 33.3). v0.2.0 tagged by owner; draft pre-release built (package.tgz etc.), owner publishes. Card C chosen (no ELM, no narrative); owner 21:52Z "Cql link" -> CQL also url.
- fhir-harness#360 (root reduced <Type>-<id>.json, jsonld local+mirror, ig-release.bpmn, ig-release.ts check catch-up, Tools) + #364 (CQL link) merged. si#137 re-pin merged but LOCK kept fhir-harness eef2 (remote-mount 2nd step silently failed) -> si#138 fixes lock; awaiting owner merge card, then republish (~27 MB). Gotcha: always verify `git show HEAD:index.lock.json` sha after re-pin.
- 11-11 14:40Z si#138 merged (owner card), si republished a5bc635a: 23.9 MB with 756 reduced root resources (10.3 MB), jsonld local+mirror verified live. Only open item: owner publishes v0.2.0 draft release.
