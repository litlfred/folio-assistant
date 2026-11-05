---
# folio-assistant-70hd
$schema: bean/1.0.0
title: cat-harness-file checks run only in the repo that commits the files (owner ruling 2026-11-05)
status: in-progress
type: task
priority: high
tags:
    - stalled-pickup-2026-11-05
created_at: 2026-11-05T13:02:05Z
updated_at: 2026-11-05T16:45:00Z
parent: folio-assistant-4j43
---

**Owner ruling, 2026-11-05 ~13:00Z**, verbatim choice: "Move the checks (Recommended)": checks of cat-harness's own files run only in the repo that commits those files, so other layers stop seeing false new failures.

## Evidence
- `check:schema-nodes` judges the harness's own `schemas/` (cat-harness-tools#1478 left two modules untagged; fixed by #1483 / #1485). Every root that mounts the layer ran it, so smart-ra#228's re-pin listed it as a newly failing gate.
- `compare-gates.py` (cat-harness-tools, layer-pr-checks) counts head exit 78 as NEW FAILURE when main ran the gate and passed (or the cone skipped it as unchanged). It is listed, not counted, only when main did not run it.
- The fa re-pin train (`.github/scripts/repin-train.ts`) counts any non-zero item exit, 78 included, as new unless main's record is non-zero too.

## Fix
- `run-gates.py`: a check whose subject is the declaring layer's own committed files is declared in that layer's `package.json` (`ownFilesChecks`); another layer's root skips it as `other-layer` (the kind standalone rehearsals already use), so it is neither run nor counted there. The owning repo's CI still runs it.
- First declared: `check:schema-nodes`.
- A test.

## Done when
- [ ] PR in litlfred/cat-harness-tools merged (green, or only main's own reds)
- [ ] a downstream root lists `check:schema-nodes` as skipped `other-layer`

Parent: 4j43. Related: tsh9 (two-phase move rule), k3vv (CI speed II).

_2026-11-05T13:40:00Z_ — Fix written and tested; **not yet pushed**: this session's `add_repo` for litlfred/cat-harness-tools (push) was refused by the permission classifier, so the owner must allow it. Commit 0bc6057 on branch `claude/own-files-checks` (off tools main c1c1d53), local to session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk.
- Finding: `check:schema-nodes` is not cat-harness-only. It walks every declared `schemas/` in the root, the caller's own included (core, smart-base, fhir-harness, sci commit `schemas/*.ts`). Skipping it outright in other layers would stop judging theirs. So the move is a SCOPE, not a skip: `run-gates.py` sets `CAT_GATE_OWN_INSTANCES` to the caller's own instances; the check audits only their `schemas/`; a caller with no `schemas/*.ts` exits 0 ("nothing of its own"), never 2 or 78, which `compare-gates.py` would count as new against a base that passed.
- cat-harness's own `schemas/` holds no `.ts` since bean 8lcl, so cat-harness CI needs no new gate.
- Measured on this checkout: own=cat-harness-tools reproduces the #1478 red (mount pinned before #1483); own=core/smart-base/fhir-harness/sci green; others "nothing of its own".
- 23 tests pass (new `test/gate-own-files.test.ts` + `layer-pr-checks-gate-inputs`); eslint and tsc clean on the changed files.
- Not changed: `compare-gates.py` still counts head 78 vs base 0 as NEW; `repin-train.ts` counts any non-zero item. Other checks of lower-layer files can adopt `lib/gate-own.ts` one by one.

_2026-11-05T13:50:00Z_ — Owner allowed push (card "Tools push", option 1: merge on green). PR https://github.com/litlfred/cat-harness-tools/pull/1508 opened (rebased on tools main 06d9615) and subscribed. Merge on green or with only main's own reds. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T14:05:00Z_ — Owner: "start on the other gate-own checks". Batch 2 = https://github.com/litlfred/cat-harness-tools/pull/1521 (stacked on #1508): shared `gateDirectoriesForGraph` in lib/gate-own.ts; scopes the SUBJECTS of check:methodology-evidence (citations still resolve corpus-wide; scoped run skips the committed QA doc), check:tabular-stubs, check:translation-officiality, check:waivers. Remaining: command-paths, subgraphs, concern-groups (need more than a call swap); generator --check halves need a separate decision. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T14:40:00Z_ — Batch 3 = https://github.com/litlfred/cat-harness-tools/pull/1529 (stacked on #1508, #1521): gateOwnsFile + CAT_GATE_OWN_PATHS/FOREIGN_PATHS; scopes check:command-paths, check:subgraphs, check:concern-groups. Measured: check:subgraphs --check red unscoped and for own=cat-harness (dangling links in cat-harness), green for core/smart-trust. Merge order #1508 → #1521 → #1529. Open: generator --check halves need an owner call. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T14:45:00Z_ — Owner card "Generators", option 1 (measure first). Measured over 13 fa re-pin train verdicts (#2925–#2968) and a gate-name search of all 32 trains since 2026-10-29: of the 16 generator/other candidates only `upload-step:docs:check` was NEW from a lower layer, once (fa#2935, job 126587875492: `cat-harness/docs/reference/upload-step/index.md is stale`, gone by #2937). The likely shape is a lower layer's generator changing its output (tools 7a9371a), not an unconfirmed diff. 15 gates at zero. Not visible: the layer PR-check compare tables (they run only in smart-ra, smart-base, smart-immunizations, who-iris…, outside this session's scope), so this undercounts. Also NEW in trains, not on the list: kg:materialize:check, agent-memory:check, bpmn:checklist:check, kind:register:check, check:prov-qaqc, committed-output tests; their shapes are unsorted. Recommendation: no change to generator checks for now.

_2026-11-05T15:20:00Z_ — Owner card "Generators" option 3 (re-measure with access). smart-immunizations and who-iris attached; smart-ra and smart-base refused twice by the session's permission classifier, not counted. Eight layer-PR compare jobs read (3 in full, 5 cut off by the log tail; lower bound). NEW gates by cause (s1 = a lower layer's committed file, s2 = a lower layer's generator output stale, s3 = own output moved because lower code changed):
- Removed by the open scoping PRs: check:schema-nodes ×1 (s1, #1508); check:subgraphs ×1 (#1529; tail cut, shape unconfirmed).
- Still s2 after them: folio-assistant-core:check:glossary ×3; bpmn:checklist:check, branch:readme:check, library:viz:check, translate-bpmn:bootstrap:check ×2 each; render:bpmn:check, glossary:pot:check, who-iris:dc:render:check ×1 each.
- Still s1: check:process-index ×2, check:reference-direction(:strict) ×3, check:materialized-fixity, kg:materialize:check, uml:overview:check, check:state-on-main ×1 each.
- Lower-layer code defects: check:qa-reviewer-permission (exit 78 counted as failing), publish:derive:publish (uml:overview writer exit 2).
- s3/own: check:harness-state:check, translate-bpmn:check, check:declared-dirs; translation:* unclassified.
Unread: 17 smart-immunizations and 5 who-iris failed runs (ids in the session). Conclusion: generator --check gates DO produce false NEW failures (s2 is the largest group); scoping validators alone is not enough.

_2026-11-05T16:45:00Z_ — smart-ra + smart-base counted by the parent session (session_01VQDpPfGantMCt7AV4LCCK2, which could attach them): 26 NEW rows on 21 PRs (2026-11-01..05). Classified here by whose files the output names:
- **Cross-layer, clear (10):** cat-harness-tools-standalone ×4 (smart-ra#213, tools' own tests); translate-bpmn:bootstrap ×1 (cat-harness .pot in smart-ra#228); processes:render ×1 (smart-base SVGs in smart-ra#213); check:materialized-fixity ×1 (who-iris nodes in smart-ra#228); check:reference-direction ×1 (core files in smart-base#298); check:ci-invocations ×1 (tools scripts in smart-base#291); iri:sync ×1 (cat-harness docs in smart-ra#223).
- **Cross-layer, likely (2):** translation:block-qa ×2 (smart-base#307/#308, the cat-harness onboarding guide's translation QA).
- **Own repo (9):** dth-terms ×3, corpus-gate ×3, translation:pot/obsolete ×2 (smart-ra's own translations), check:subgraphs ×1 (./FORMS.md, a root file).
- **Unclassified (5):** kg:materialize, split:baseline, branch:readme (no paths); kind:json-schemas, gen:jsonld (mixed paths).
Across all four repos, the gates with cross-layer false failures that the open scoping PRs do NOT cover: reference-direction (×4), materialized-fixity (×2), translate-bpmn:bootstrap (×3), processes/render:bpmn (×2), process-index (×2), ci-invocations, iri:sync, kg:materialize, glossary (×3), bpmn:checklist (×2), library:viz (×2), uml:overview, state-on-main.
