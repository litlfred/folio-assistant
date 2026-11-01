---
# folio-assistant-kvd2
$schema: bean/1.0.0
title: 'RECOMMENDATION SCENARIO: every extracted L1 recommendation gets a user-scenario candidate (persona, process, domain), reusing existing vocabulary and warning when none fits'
status: completed
type: feature
priority: high
created_at: 2026-10-10T14:07:07Z
updated_at: 2026-10-23T13:45:00Z
parent: folio-assistant-slw1
---

Owner, 2026-10-10: *"also add to the skills, as part of extracting a recommnedation the scenario (user story,role) get described. i am not sure what the 'process' is, but we need one for a role ... skill is to reuse existing vocabulary if possible ... For the measeles example, the process should be chosen from existint smart-immz processes if possivle. warn if not."*

## Shape (decided in session 2026-10-10: L2 nodes, not L1 fields)

L1 records what the document says, verbatim. A role, a process or a scenario is an interpretation, so it is L2. Each extracted recommendation gets a **user-scenario candidate**. It reuses smart-base `UserScenario` (title, id, description, personas) and the smart-kg L2 edges, unchanged:
- `recommendation implementedBy user-scenario`
- `user-scenario involves persona`
- `business-process realises user-scenario`

The scenario description is written as a user story: "As a <persona>, during <process>, I <act> so that <outcome>". Each link records its source (declared / context / inferred), as intake classifications do, and stays a candidate until a person reviews it.

## Reuse first, warn otherwise

Stop at the first hit.
- **persona:** the guide's own personas → smart-base generic `DAK.Persona.*` (ISCO/CDHI) → glossary candidate + WARNING
- **process:** the guide's own processes → the domain catalogue (clinical / public health / health system; none exists yet, see the catalogue bean) → `could-not-determine` + WARNING. Never invent a process.
- **domain:** the guideline-domain scheme (its own bean)

## Measles worked example (expected)

- routine schedule and contraindications → IMMZ.D Administer vaccine (D2)
- campaigns → IMMZ.B
- catch-up → IMMZ.F / IMMZ.D
- recording → IMMZ.D / IMMZ.I
- WARN: case management C01-C12, outbreak response, surveillance

## Done when

- [x] skill text in smart-base `dak-l1-library` (or a `recommendation-extraction` skill) holding the shape and the precedence
- [x] an output file per document beside the L1 graph, validated against the smart-kg L2 shape
- [ ] the measles position paper in smart-immunizations has a scenario candidate for each of its 75 recommendations, with warnings listed

Related: 8pzh (L1 extraction from ingested PDFs), 55ao (recommendation block kind), and the ontologist, guideline-domain and process-catalogue beans filed the same day.
Sibling beans: 4nfs (ontologist/terminologist), 398x (guideline domain), 2ipj (process catalogues), 96y4 (IMMZ BPMN), n3h9 (harness the smart-* repos).

## 2026-10-11: smart-base#33 merged (71652941)

- **Shipped:** the skill `recommendation-extraction`, `scripts/l1-recommendation-scenarios.ts` (with `--check`, 17 tests), and `scripts/l1-scenario-vocabulary.ts`.
- **Measles run:** 75 candidates, 37 warnings. It is held as a smart-base fixture for now.
- **Left:** the third box. The run belongs in smart-immunizations' library, beside the measles L1 graph; that repository is with the sibling session (session_017QXvm7c7RDYFguWzSxhrMb).

## 2026-10-12: task #23, smart-base#49 (the extraction half as tools)

- **Tool nodes** in `smart-base/tools/index.ts`: `l1-recommendation-candidates` (new) and `l1-recommendation-scenarios` (#33's script, now declared). Both satisfy `recommendation-extraction` and are implemented in `smart-base/scripts/`.
- **Hybrid, made explicit.** The script lists every normative sentence of a `library/` entry (core `l1-coverage`, imported) with hints. The agent records an `l1-recommendation-curation/v1` (the skill's step). The script then gates it (verbatim, known locations, keys) and writes an L1 3.0 graph checked with `kg/src/validate.ts`.
- **Provenance:** both tools write cat-harness `folio-run-context/v1` as `run-context.json` (`scripts/l1-run-context.ts`).
- **Demo** on `smart-base/library/9789240116191-eng` (DTH health product catalogue):
  - 48 candidates → 22 recommendations, 1 remark, 29 proposed exclusions (unsigned; coverage 19/48);
  - 22 scenario candidates, all `could-not-determine` process, 3 glossary-candidate personas; 25 + 30 warnings.
- **Still open:** box 3 (measles in smart-immunizations' library) stays with the sibling session.

## 2026-10-12: new L1 class `implementation-practice` (ruling 1b, smart-base#50, merged 7e2c526)

- `implementation-practice` ("Implementation practice", Concept, `http://smart.who.int/kg/implementation-practice`) is declared in `kg/src/l1-library.ts`. It is what an implementation-guidance or methodology publication prints instead of a recommendation (handbook §1.9).
- Properties: `identifier`, `statement` (verbatim) and `contentHash`. There is no grading.
- Edges: `definedIn`, `presentedIn` x2 and `partOf`.
- **`remark` cannot attach to it.** L1 3.0 mints a remark's IRI under a recommendation, so allowing this needs a change to L1 upstream.
- `l1-recommendation-scenarios.ts` accepts it as input. It warns `practice-implementedBy-unlicensed`, because smart-kg L2 licenses `implementedBy` only from a recommendation.
- The DTH NPC demo now has 22 practices and 26 scenario warnings.

_2026-10-16T10:45:00Z_ — Parented to `slw1` (INGEST) by subject: it had no parent, so it sat under no epic or goal and failed the parent check on main (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

_2026-10-23T13:45:00Z_ — Status synced from `in-progress` to `completed` to match the folio-assistant copy of this bean, which is newer and records the work as done there. Only the status changed; the body here is kept as it was. Owner OK in thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).

## Merged from the folio-assistant copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: ## Done when

```text
- [x] skill text in smart-base `dak-l1-library` (or a `recommendation-extraction` skill) holding the shape and the precedence
- [x] an output file per document beside the L1 graph, validated against the smart-kg L2 shape
- [x] the measles position paper in smart-immunizations has a scenario candidate for each of its 75 recommendations, with warnings listed — verified on `smart-immunizations/examples/l1-recommendation-scenarios/measles/` (mounted on `folio-assistant` `main` via #2594): `candidates/scenario-candidates.l2.json` holds 75 `user-scenario` nodes and 195 edges, and `candidates/scenario-warnings.md` lists the 37 warnings across 75/75 mapped recommendations.

Related: 8pzh (L1 extraction from ingested PDFs), 55ao (recommendation block kind), and the ontologist, guideline-domain and process-catalogue beans filed the same day.
Sibling beans: 4nfs (ontologist/terminologist), 398x (guideline domain), 2ipj (process catalogues), 96y4 (IMMZ BPMN), n3h9 (harness the smart-* repos).
```
