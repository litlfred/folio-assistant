---
# folio-assistant-lthi
title: 'S4-c: cat-harness items owed to core, who-iris, smart-base, fhir-harness or the root (~45 rows)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-10T06:07:45Z
parent: folio-assistant-7x5n
---

Story S4 (rfuq). Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — instance=cat-harness, pr 'unplanned', target folio-assistant-core (SPLIT 14, MOVE 1), who-iris (SPLIT 8), smart-base (SPLIT 6, MOVE 6), fhir-harness (SPLIT 4), root (SPLIT 4); plus fhir-harness->smart-base SPLIT 7, core->sci SPLIT 3. SPLIT here mostly means keep the generic item and invert the upward reference.
## Done when
- [ ] every listed row resolved; gates green; merged


2026-10-09: blocker `hx65` is completed — removed (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL). Note: 87 of 91 rows still at their original paths; re-derive against the post-split repos before working it.


## 2026-10-09: the smart-base / fhir-harness rows, re-measured post-split (session https://claude.ai/code/session_01BJNRo4kh8U15HZVFDhYNJL)
Re-derived from `placement-audit-2026-10-01.json` (`pr: unplanned`) against each repo's main.

**fhir-harness → smart-base, 7 rows: done.**
- litlfred/fhir-harness#15 (cc236ac) inverts six: ig-publication, l3-fhir-authoring, terminology-management, ig-build-pipeline, ig-publisher-fork and ig-render-jekyll. Each now has 0 upward ids or links.
- `skill-definitions/l3-fhir-authoring.json` was already 0, fixed by #1767.
- Nothing was lost: smart-base-tools already carried every removed paragraph.

**cat-harness → smart-base, 6 rows: 4 inverted, 2 left as mentions.**
- litlfred/cat-harness#73 (b764edd) and litlfred/smart-base#22 (cc1fc1a) invert four:
  - bpmn-authoring, dmn-authoring and translation-manager: the DAK notes moved to smart-base-tools.
  - harness-tiles.
- graph-detanglement (skill + BPMN) is reworded in past tense, because the example DID lift out.
- `instance-publication.md` is left as is: it uses smart-base and smart-trust as worked examples of identity and staging, which are mentions rather than dependencies.

**cat-harness → fhir-harness, 3 rows:**
- `ig-ast-delta-review.bpmn` is resolved; it now lives in fhir-harness.
- `before-after-preview.md`, pointing to fhir-validation and build-pdf: reader cross-refs, left.
- `requirements/fhir-validation.json` (rule 2, keep a generic stub): left.

**core → fhir-harness:** `quality-control.md` was not looked at.

**Not done:**
- The 6 GRADE code lists (cat-harness → smart-base MOVE). Moving them deletes them from cat-harness, so they wait on the owner.
- The other ~70 rows: core, sci, who-iris and root.

- core → fhir-harness `quality-control.md`: done, litlfred/folio-assistant-core#15 (2c137c5). The header and 'What to run' no longer name fhir-harness processes or skills, and the stale package name is fixed.


**cat-harness → who-iris, 8 rows (+1 bootstrap-tools), re-measured 2026-10-09: no change needed.**
- `docs-auto.md` no longer exists.
- `bootstrap-tools/skills/package-manifest.json` no longer names who-iris.
- The other seven name `who-iris/` only as a WORKED EXAMPLE or a recorded incident. They are mentions, not dependencies:
  - kg-contribution-offer and placement: the docs/ graph example;
  - kg-to-portal: "the worked example";
  - schema-management: URL-layout examples and the draft that almost published there;
  - upload-naming: the measured repoint table;
  - continual-progress: the 404 incident;
  - incremental-render: a projection example.
- Rewording them to hide the instance would lose the evidence, and nothing resolves through them. This is the same standard applied to `instance-publication.md` above.


**cat-harness → folio-assistant-core, 13 rows (2026-10-10):** 2 inverted, 2 for the owner (MOVE), 9 left as mentions.
- **Inverted:** litlfred/cat-harness#80 (merged, 9ca7c32). prepare-merge and staging-review now name core's Tool nodes (`folio-review-coverage`, `folio-changeset`) and their arguments instead of `<platform>/folio-assistant-core/...` paths. The generated reference copies carry the identical change.
- **For the owner:** review-comments.md and glossary-terms.md document core's own scripts, schema and data end to end. The honest fix is to MOVE them to core, which deletes them from cat-harness, so they wait on the owner like the 6 GRADE code lists.
- **Left as mentions:**
  - kg-export: a namespace table row plus overlay history;
  - own-namespaces.json: a registry row;
  - role-model: an example JSON;
  - vocabulary-authority: a Dublin Core shape citation;
  - asset-extraction and library-ingestion: history and a field origin;
  - upload-routes and theme-art-intake: they name the `document-intake` skill ID, not an instance, so it is not an instance-name occurrence under reference-direction.ts.


**cat-harness → folio-assistant-sci, 14 rows (2026-10-10): no change needed.** All 14 name sci skill IDs in backticks (content-validation, compute-audit, proof-triage, …), in tables or prose. None is an instance name or a link, so they are mentions under reference-direction.ts, the same standard as the who-iris rows.

**Root R6 rows:** the 4 cat-harness rows are already fixed on main (no `../../../../` link remains).
- The sci row is fixed in litlfred/folio-assistant-sci#6 (merged, de2508f).
  - q-usage-watcher's AGENTS.md §7c link now goes to formalizer/conventions.md §"Base ring convention" in the same package.
  - Its five `cat-harness/content/pipeline/` links now go to `cat-harness-tools/content/pipeline/`, where the files moved.
- **Found while doing it, not fixed:** sci has 94 references to `cat-harness/content/pipeline/…` and `cat-harness/scripts/…`, including code imports in content/pipeline/*.ts, tools/index.ts and scripts/tests/*. These are separation fallout. I asked session_017QXvm7c7RDYFguWzSxhrMb (#2518's gates pass) whether it already has them, to avoid double-building.


**sci → cat-harness-tools fallout, fixed: litlfred/folio-assistant-sci#7 (merged, 0045292).** The user said 'go' after the sibling session gave no answer.
- **What:** 90 references, including 47 import statements, moved from cat-harness/{content/pipeline,scripts,src,test} to cat-harness-tools. History notes are kept as written.
- **Measured** in a scratch index layout:
  - before: 22 pass / 13 fail / 35 tests;
  - after: 60 pass / 7 fail / 67 tests.
  - The remaining 7 fail on uninstalled third-party packages and the absent core mount, which is folio-assistant#2518's hoisted install. None fails on a cat-harness path.


**70lx follow-through, 2026-10-10** (split with session_017QXvm7c7RDYFguWzSxhrMb, which keeps folio-assistant#2518 on pre-70lx pins):
- **fhir-harness#22** (merged, 600f60c): 14 imports moved to cat-harness-tools. bun test scripts: 123/9 of 132 → 238/1 of 239. The 1 failure is remark, not installed in that layout.
- **smart-base#24** (merged, 585aa86): 4 imports in platform/index.ts. On main the module failed to load; now it loads (60 exports).
- **folio-assistant-core:** already done in core#18/#19 by another session; Bun.resolveSync finds no unresolved cat-harness import.
- **Post-70lx re-pin set**, handed to the #2518 session: sci 0045292, fhir-harness 600f60c, smart-base 585aa86, core 7705b1a.


**Non-code 70lx paths:** fhir-harness#23 (template, 41ecdac) and #24 (243e56e); smart-base#25 (263ce0b, smart-base-tools commands); who-iris#24 (90c044a: package.json landing:sticky, iris-dspace.md, oxigraph doc).
- Left on purpose: 'moved from' history notes, generated provenance (vector-figures.json producer ids, catalogue nodes), and the forks' folio-site.yml (48a6, pin-coupled).
- **Placement finding, not acted on:** cat-harness-tools holds instance-specific files: scripts/smart-base-transform.py (smart-base) and test/who-iris-search.e2e.ts (who-iris).


**Remaining small rows (2026-10-10):**
- **smart-base → smart-trust (ig-artifact-ingestion):** inverted.
  - fhir-harness#25 (ddff3f2): ig-render-jekyll claims the ig-pages kind.
  - smart-base#26 (c88ba0d): drops `governs: smart-trust/smart-trust-docs`. That directory is ig-pages, and the kind claim reaches every instance that depends on fhir-harness.
- **core → fhir-harness (quality-control):** already done in core#15.
- **core → sci (document-intake):** a skill-ID mention, left.
- **core document-authoring and document-publishing:** SPLIT. Moving their sci bodies to sci deletes them from core, so they are for the owner, with review-comments, glossary-terms and the GRADE lists.
- **bootstrap-tools rows:** contract-semver's `release-lifecycle` is an ID mention. package-manifest.json no longer names who-iris (re-measured 2026-10-09).

**lthi 'unplanned' rows now:** every row is inverted, left as a mention with its reason, or waiting on an owner MOVE decision (6 GRADE code lists; review-comments.md; glossary-terms.md; the core document-authoring and document-publishing sci split).


## Owner 'merge and go' (2026-10-10): the MOVE items

- **review-comments, glossary-terms:** cat-harness → core.
  - core#20 (ebb2545) added them: content-lifecycle-ext/review-comments.md and library/cataloguing/glossary-terms.md, with their manifests.
  - Then cat-harness#81 (616df69) removed them, with their manifests and kg-qa entries.
  - 9 inbound cat-harness links became bare skill-id mentions; the generated copies match.
  - **Follow-up for the index (#2518 session):** .claude/commands/review-comments.md still links the old cat-harness path.
- **6 GRADE code lists:** cat-harness → smart-base. smart-base#27 (3f2b8a0) added a new smart-base-code-lists directory with byte-identical copies, then cat-harness#82 (1c88871) removed them with their README rows.
- **core document-authoring and document-publishing → sci: NOT moved, and this is a finding, not a deferral.**
  - Every paper, Lean or LaTeX mention in them states the DOCUMENT type's boundary: not the seven paper kinds; change contentType if you need a theorem; never fall back to LaTeX.
  - The audit's 'sci terms 14 vs harness 3' word count counts those boundary statements as sci content, so it is a false positive of the vocabulary heuristic. There is no sci body to move.

**lthi 'unplanned' rows: none remain open.** Each is inverted, a stated mention, moved, or a recorded false positive.
