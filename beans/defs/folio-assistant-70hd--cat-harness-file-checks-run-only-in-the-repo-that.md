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
updated_at: 2026-11-06T06:20:00Z
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
- [x] PR in litlfred/cat-harness-tools merged (green, or only main's own reds) — #1508, a094099
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

_2026-11-05T17:30:00Z_ — Owner card "Next batch" option 1 (validators next). Batch 4 = https://github.com/litlfred/cat-harness-tools/pull/1533 (stacked on #1508 → #1521 → #1529): check:reference-direction (scopeReport), check:process-index, check:ci-invocations, translate-bpmn --check. #1508 standalone failure was this PR's own test assuming the tools layer is in the harness corpus; fixed in 295afe2 (reproduced with the harness laid out alone). Remaining: check:materialized-fixity is folio-assistant-core's (needs a core PR); generator checks await the owner. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T17:45:00Z_ — Owner card "Remaining" option 1 (materialized-fixity). Fix written for litlfred/folio-assistant-core (commit 2f35a33 on local branch claude/materialized-fixity-own-files, off core main 09bcfa8; patch kept in this session's scratchpad): collect() reads only records in files the caller owns (gateOwnsFile). Measured: 130 artefacts unscoped, 45 own=who-iris, 0 own=folio-assistant-core; new test 2/2. NOT pushed: add_repo push for folio-assistant-core refused by the session permission check. It must merge after core re-pins cat-harness-tools past #1529 (it imports lib/gate-own.ts). Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T18:00:00Z_ — Owner (relayed by session_01VQDpPfGantMCt7AV4LCCK2, ~16:20Z): generator checks "Scope them too". Batch 5 = https://github.com/litlfred/cat-harness-tools/pull/1534 (stacked on #1533): publish-check.ts (render:bpmn, uml:overview, glossary:page), bpmn:checklist, library:viz, branch:readme judge only the caller's output. Measured: bpmn-checklist 15→4 (cat-harness)→0 (smart-base); library:viz 547→547→0; render:bpmn 51 missing→0 for smart-base; branch:readme 1→0. Left: core (materialized-fixity written, kg:materialize, glossary:pot), who-iris dc:render, bootstrap-tools iri:sync. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T18:10:00Z_ — Owner card "Core fix" option 1: the core materialized-fixity patch was sent in full to session_01VQDpPfGantMCt7AV4LCCK2 (which can attach repos), to open in litlfred/folio-assistant-core after core re-pins cat-harness-tools past #1529. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T17:40:00Z_ — #1521 standalone red: declared-paths ratchet counted the "library/" literal in a check-tabular-stubs message; fixed in 1fab7a0 (words, not path literals), merged forward to #1529/#1533/#1534. #1508 head 295afe2: all head jobs green, main comparison running. Core fix handed to session_01VQDpPcbpLjEo8EuzFLVq5Z (waits on #1529). Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T17:42:00Z_ — **Merged** litlfred/cat-harness-tools#1508 (a094099) on all-green CI, incl. Tests/Index gates/Standalone (no new failures). Next #1521 → #1529 → #1533 → #1534. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T18:10:00Z_ — **Merged** litlfred/cat-harness-tools#1521 (6f373ef) on all-green verdicts. Next #1529 → #1533 → #1534. Core fix applied and tested by session_01VQDpPcbpLjEo8EuzFLVq5Z (5d43ed2, local), waiting on #1529. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T18:15:00Z_ — #1529 had never re-run CI since 15:50: it conflicted with main in scripts/check-subgraphs.ts (main restructured it for the two-phase move rule, bean tsh9), and GitHub runs no pull_request workflow on a conflicted PR. Merged main in (6600d73), re-applied the scope to the new LinkContext structure; PR checks run 42081945867 started. #1533 (a4b95c8) and #1534 (e0210e2) carry it, clean against main. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T18:42:00Z_ — #1529 went all-green (incl. all three no-new-failures verdicts) but the merge was refused: main moved (#1535, #1536, #1538, #1540) and conflicted in check-command-paths.ts (main added `moved` to the report). Merged main in (5304398), kept both; 75 tests pass, tsc 0 errors. #1533 846de32, #1534 8885482 carry it, clean vs main. CI re-running. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T19:04:00Z_ — **Merged** litlfred/cat-harness-tools#1529 (fc768f6) on all-green verdicts; told session_01VQDpPcbpLjEo8EuzFLVq5Z (core fix) it can go once core re-pins past fc768f6. Next #1533 → #1534. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T19:06:00Z_ — **Merged** litlfred/cat-harness-tools#1533 (711e078) on all-green verdicts. Last: #1534 (8885482), head test shards 4/4 green, verdicts pending. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T19:20:00Z_ — #1534: Tests and Index gates green; Standalone red on src/tools/degradation.test.ts "the real join" (machine capability probe, 30 s; untouched by the diff; 17/17 locally). Re-ran run 42086434439 once; comment on the PR. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T19:35:00Z_ — **All five cat-harness-tools PRs merged**, each on all-green verdicts (Tests, Index gates, Standalone (no new failures)):
- #1508 a094099: check:schema-nodes
- #1521 6f373ef: methodology-evidence, tabular-stubs, translation-officiality, waivers
- #1529 fc768f6: command-paths, subgraphs, concern-groups
- #1533 711e078: reference-direction, process-index, ci-invocations, translate-bpmn --check
- #1534 ee88ead: generator checks (publish-check, bpmn:checklist, library:viz, branch:readme); Standalone needed one re-run, its first run failed on src/tools/degradation.test.ts, a machine capability probe the diff does not touch.
Still open under this bean: the folio-assistant-core materialized-fixity PR (session_01VQDpPcbpLjEo8EuzFLVq5Z, after core re-pins tools past fc768f6); not started: core kg:materialize / glossary:pot, who-iris dc:render, bootstrap-tools iri:sync. The effect on downstream false failures shows once each layer re-pins cat-harness-tools past ee88ead. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T19:40:00Z_ — Owner card "Next step" option 1: confirm it worked. Re-count of false cross-layer failures scheduled for ~22:10Z, after the next re-pin train brings cat-harness-tools past ee88ead (before: 22 cross-layer false failures across 4 repos; see the 16:45Z note). Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T20:12:00Z_ — Core fix opened by session_01VQDpPcbpLjEo8EuzFLVq5Z: https://github.com/litlfred/folio-assistant-core/pull/651 (materialized-fixity scope + re-pin of core's cat-harness-tools e09d815 → 8205c6a). Local: new test 2/2, typecheck and gate clean; that session merges on green. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-05T22:50:00Z_ — Re-count 1 (owner card "Next step" option 1): **nothing measurable yet in the layers.**
- smart-immunizations' last PR run, 42091639142, used tools 42cc850, which is before ee88ead. who-iris has had no run since 17:02Z.
- Both callers pin layer-pr-checks.yml to a SHA, not @main. So the new run-gates.py (the CAT_GATE_OWN_* env) reaches a layer only when that layer re-pins its workflow AND its cat-harness-tools to ≥ ee88ead.
- fa re-pin trains past ee88ead:
  - #2979 (pin 5639d93) had 2 NEW on scoped gates, neither cross-layer. reference-direction caught a real tools defect (state-mount.ts → who-iris, fixed in ee5f440 / tools#1551). bpmn:checklist had a cat-harness checklist out of step with the new tools, which is index-owned.
  - #2980 (pin 55b1925) was pending.
- Second re-count is scheduled for ~00:50Z. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-06T00:50:00Z_ — Re-count 2 (the last scheduled one): **still nothing measurable in the layers.**
- smart-immunizations: main ca8a812 pins both layer-pr-checks.yml and the cat-harness-tools lock at 42cc850.
- who-iris: main 90bb3f5 pins both at 42af00b.
- Both pins are older than ee88ead, and neither repo has had a PR run since. The scoping cannot act until they re-pin both the workflow and tools to ≥ ee88ead.
- fa train #2980 (pin 55b1925): ❌ with 1 NEW on a scoped gate. bpmn:checklist:check flags two cat-harness checklists as stale. That is index-owned output, not cross-layer; the run judged the whole index (`scoped: null`).
- Before, measured earlier: about 22 cross-layer false NEW across 4 repos. After: not yet measurable.
Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk

_2026-11-06T05:45:00Z_ — **Merged** litlfred/folio-assistant-core#651 (d9e0836) on all-green CI (typecheck, 10 shards, No new failures), owner approved on a card. Core check:materialized-fixity now judges only the caller's own records; core pins cat-harness-tools 8205c6a. Session https://claude.ai/code/session_01VQDpPcbpLjEo8EuzFLVq5Z

_2026-11-06T05:58:00Z_ — Re-pin PRs open (all layers to current mains, owner cards "Re-pin how" 2 / "Re-pin OK?" 1): litlfred/smart-immunizations#115 and litlfred/who-iris#185. #115's compare job ("No new failures (tests and gates)") is red at 20bbcef and under analysis; these measure the scoping effect on layer PRs. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk
- _2026-11-06T06:00:19Z_ — Re-pinned both sites to mains (owner cards "Re-pin how" 2 / "Re-pin OK?" 1): cat-harness 7321322, cat-harness-tools a944727, folio-assistant-core e072ec2, smart-base 5fdcf6c (smart-immunizations), bootstrap 12fa6d5, bootstrap-tools 9f478d4 (who-iris). AFTER: 0 NEW on the 18 scoped gates in both compare jobs (BEFORE ≈10 cross-layer). who-iris#185 green, merged (9929b1f). smart-immunizations#115 open: 1 NEW on an unscoped gate, check:artefact-verification, because caches:viz:check (new in cat-harness-tools a944727) has no verification declaration. The fix is upstream in cat-harness-tools, then re-pin.

_2026-11-06T06:20:00Z_ — **Measured:** after re-pinning past the scoping PRs, 0 NEW on the 18 scoped gates in both smart-immunizations#115 and who-iris#185 (before ≈10 cross-layer). who-iris#185 merged (9929b1f). #115 had one other NEW red: check:artefact-verification "caches:viz:check has no declaration" (a tools gap). Owner card "#115" option 1, fix at the source: https://github.com/litlfred/cat-harness-tools/pull/1575 declares it; then re-pin #115's cat-harness-tools and merge. Session https://claude.ai/code/session_01VQDpPbqnwyoWW5d3Rc1vEk
- 2026-11-06 07:15Z: cat-harness-tools#1575 merged (306a4d6), declaring caches:viz:check. smart-immunizations#115 re-pinned to it (587b858), only cat-harness-tools moved; waiting on its verdicts. Core #657 (kg:materialize, glossary:pot scoped) opened by session_01VQDpPcbpLjEo8EuzFLVq5Z. Left: who-iris dc:render, bootstrap-tools iri:sync.
- 2026-11-06 08:12Z: #115 at 587b858: check:artefact-verification now passes (fixed by #1575). One NEW: cat-harness-tools:uml:overview:check (red on main too, +2 errors), against main's CACHED answer; the gate counts files under the mounted smart-base, which this PR moved. Re-ran all jobs once so main is recomputed exactly (as the workflow advises).

_2026-11-06T08:25:00Z_ — **Merged** litlfred/folio-assistant-core#657 (344abb2) on all-green CI, owner approved on a card: core kg:materialize:check and glossary:pot:check judge only the caller's own files (kg 12 instances -> 1 with core as caller; a stale cat-harness .pot is ignored in core's run, caught in cat-harness's). Left: who-iris dc:render, bootstrap-tools iri:sync. Session https://claude.ai/code/session_01VQDpPcbpLjEo8EuzFLVq5Z
- 2026-11-06 08:36Z: Re-run recomputed main exactly; uml:overview NEW was the cached main answer, not this PR. #115 all green, merged (26558d2). core#657 merged (344abb2) by session_01VQDpPcbpLjEo8EuzFLVq5Z. Left: who-iris dc:render, bootstrap-tools iri:sync.
- 2026-11-06 08:45Z: Owner card "Last two" 1 (do both now). bootstrap-tools iri:sync -> https://github.com/litlfred/bootstrap-tools/pull/80 (restates gateOwnsFile in scripts/gate-own.ts; 6 tests). who-iris dc:render code is core scripts/dc-render.ts: patch (54 lines, 3 tests, verified in the who-iris checkout) sent to session_01VQDpPcbpLjEo8EuzFLVq5Z to open in core.
- 2026-11-06 08:45Z: Owner, first-hand in this session: "repin as needed. merge when green and ready for all your PRs within 6hr window" (until 14:45Z). Plan: merge bootstrap-tools#80 on green; when it and the core dc:render PR are merged, re-pin smart-immunizations and who-iris to them in one PR each and merge on green.

_2026-11-07T05:27:00Z_ — **Merged** litlfred/folio-assistant-core#659 (ecccd22) on all-green CI under the owner's merge-on-green window: core dc:render:check skips another layer's catalogue instance in layer PR checks (F's patch, applied by session_01VQDpPcbpLjEo8EuzFLVq5Z). All core items under this bean are on core main: materialized-fixity (#651), kg:materialize + glossary:pot (#657), dc:render (#659). Session https://claude.ai/code/session_01VQDpPcbpLjEo8EuzFLVq5Z
- 2026-11-07 05:35Z: Owner, first-hand: "repin + merge open 12 hrs" (until ~17:25Z). core#659 (dc:render scoped) merged (ecccd22) by session_01VQDpPcbpLjEo8EuzFLVq5Z. bootstrap-tools#80 was red on its own NEW: check:reference-direction flagged gate-own.ts for naming cat-harness-tools (a lower layer naming a higher one). Fixed in 240f0e1 (no layer named; pin unchanged); verified locally with the check. Next: merge #80 on green, then re-pin smart-immunizations and who-iris to bootstrap-tools and core mains.

_2026-11-07T06:05:00Z_ — Re-count 3 (owner, this session: "re-count smart-ra/base"):
- smart-ra: main acaf6ce still pins cat-harness-tools 42cc850, which predates ee88ead. Not measurable until it re-pins.
- smart-base: main took cat-harness-tools 64f0aa0 (≥ ee88ead) only at 2026-11-07T05:36Z (#309 merged, f9fc15d). Its core pin is still f0b3ccb, before #651/#657/#659.
- AFTER sample = 1 run, #309's compare job 127807509685 (head pinned 64f0aa0):
  - 0 own NEW, 0 cross-layer NEW from the tools-scoped gates.
  - 1 unclassified NEW: check:artefact-verification, "stale declaration … smart-base:processes:render:check". Per #309's commit message this is cat-harness-tools' baseline, dropped by tools#1579, so probably cross-layer.
  - Core gates: materialized-fixity and kg:materialize "failing on main too" (core not re-pinned); glossary:pot and who-iris dc:render pass.
  - BEFORE in smart-base was ≈6 cross-layer NEW (16:45Z note).
- Too small a sample to call. Next measurable run: smart-base#315 (branched after the re-pin).
Bean stays open: bootstrap-tools#80 (iri:sync, F's) is still open. Session https://claude.ai/code/session_01VQDpPcbpLjEo8EuzFLVq5Z
- 2026-11-07 06:45Z: Owner rules relayed by the parent: NO SELF-MERGES; the merge manager is session_01VQDpPffYARDQ8juksAZScf; a 6-line "ready"; pacing. bootstrap-tools#80 at 240f0e1 is full-tier green and mergeable clean. Marked ready, and the 6-line "ready" was sent to the merge manager and the parent. Next, after it lands: re-pin smart-immunizations and who-iris to the bootstrap-tools and core mains (a re-pin link), then send "ready".
