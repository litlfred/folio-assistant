---
# folio-assistant-nsbb
title: 'IG PIPELINE LAYERING: a bare FHIR IG pipeline is the base; DAK and SMART are overlays on it, not the thing itself'
status: todo
type: task
priority: high
created_at: 2026-09-21T15:37:14Z
updated_at: 2026-09-21T15:37:14Z
parent: folio-assistant-yj32
---

Owner, 2026-09-21, verbatim:

> 'that should be the basic bare FHIR IG (not DAK, not SMART) pipeline= running fhir IG, no pre-post processing and outpuing to gh-pages (how smart-guidelines generated before pre/post peocess) for those what are not WHO specfic.... those can be upgraded to do pre/post, but would need chnages/overlays .'

## The layering

**Base — generic, not WHO.** Run the FHIR IG Publisher, NO pre-processing and NO post-processing, output to gh-pages. This is how SMART Guidelines were generated BEFORE pre/post processing was added, so it is a shape that demonstrably worked rather than a design being invented. It serves any IG that is not WHO-specific.

**Overlay — WHO / SMART / DAK.** Pre-processing (DAK) and post-processing (wrap JSON/JSON-LD around the IG's generated JSON resources, index in JSON-LD) are an UPGRADE on the base, requiring changes/overlays. They are not part of the base and must not be assumed by it.

This matches the instance/overlay model the harness already has — an instance inherits its dependencies' directories, and overrides match on an entry's `id` rather than its path.

## Why this matters, from the same session

The owner's related direction: the pipeline is
`(DAK preprocessing, skill tools) -> IG Publisher -> (post-processing, skill tools) -> wrap JSON/JSON-LD around IG-generated JSON resources`, indexed in JSON-LD and moved to `gh-pages/smart-guideline`, all under a NEW `smart-base` harness producing a `smart-guideline` page — and **no `smart-trust` harness, because it adds no new functionality**. The DAK/IG pipeline belongs in IG base.

That contradicts what is on main today: `smart-trust/` IS its own harness instance (#690) and its `docs/` graph IS generated HTML (#717). Resolving that is the work, and the layering above is the frame for it.

## Measured this session, and it argues for the split

Using the IG Publisher's CURRENT metadata exports as a proxy for an AST extract:

| export | smart-trust | smart-immunizations |
|---|---|---|
| `valueset-ref-list.json` ValueSet->CodeSystem edges | 17 over 14 | 431 over 252 |
| `codesystem-ref-list.json` `uses` populated | 0 of 15 | 0 of 14 |
| `usage-stats.json` extension->path | 6 | 35 (+5 profiles) |

Two findings:

1. **`uses` is declared and never populated, in BOTH IGs** — the second field that day found declared-but-empty, after `logicalModelUrl` (0 of 11 in smart-immunizations).
2. **Nothing exports dependencies among Libraries, PlanDefinitions or Measures** — 279 + 138 + 41 = 458 artefacts, 61% of smart-immunizations, the CQL/decision-logic core, with no dependency edges at all.

So the proxy reaches TERMINOLOGY dependencies and structurally cannot reach the logic layer. That is the measured case for the upstream AST ask (`hpo0` §8.4-A: extend `recordOutcome()`'s per-file report, call `loadDependencyList` in every mode, record `fragmentUses` and a `toolchain` object), and the owner's aspiration to fork the IG Publisher to emit the AST behind a flag. Both `HL7/fhir-ig-publisher` and `hapifhir/org.hl7.fhir.core` are git-reachable from this environment.

## Done when
- [ ] the bare FHIR IG pipeline is defined as the base, with no WHO/DAK/SMART assumption in it
- [ ] pre/post processing are expressed as overlays on that base, not baked in
- [ ] the base is shown running for a non-WHO IG
- [ ] the contradiction with #690 / #717 is resolved rather than left standing

Related: qrnz (second-IG findings), hpo0 (IG Publisher micro-asks), rna3 (IG incremental build), gpdo (compiled-artefact caching).
