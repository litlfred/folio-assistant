---
# folio-assistant-1wue
$schema: bean/1.0.0
title: 'Memory: Thin HTML pages declare their KG node (RDFa + JSON-LD stub, generic kg-render.js, extensionless kind/id IRIs); Q-THIN-1..4, tools#1830/#1833'
status: completed
type: task
priority: low
created_at: 2026-11-11T00:10:10Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `thin-html-node-linking-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thin HTML pages declare their KG node (RDFa + JSON-LD stub, generic kg-render.js, extensionless kind/id IRIs); Q-THIN-1..4, tools#1830/#1833

Thread "Make thin HTML pages self-describing" (cmsg_017WNUkNK8kdDziPK58Pv6G9JUYkFEpA2dkxbquPXVJpQw). Write-up: /mnt/project-files/thin-html-node-linking-2026-11-10/analysis.md.

Before: Family 1 thin pages (tools scripts/thin-page.ts; archimate, openapi, library, todo; fhir-harness ig-artifact-page) = rel=alternate JSON-LD + private `<script type=application/json id=<family>>` + per-family loader; IRI not in page (IRI = .jsonld address). Family 2 (kg-export subject pages, core glossary) = extensionless `…/<kind>/<id>` IRI, page at IRI, full JSON-LD embedded.

User 2026-11-11 00:00Z: Q-THIN-1 = C (RDFa resource/typeof/prefix) COMBINED with B (JSON-LD stub); Q-THIN-2 = A (extensionless kind/id IRIs, clean break). Custom XML must use proper namespaces.

Done: issue tools#1830; draft PR tools#1833 (branch claude/thin-page-node-rdfa, 177de97): ThinPage.node/prefixes/renderer, nodeAttrs, pageNodeOf/pageNodeProblems, scripts/templates/kg-render.js (dispatch by class or namespace, window.kgRenderers queue), ArchiMate migrated (data-kg-model/svg on mount, isArchimatePage). Cost ~+310 B/page. Subscribed to #1833.
01:57Z 11-11: Q-THIN-3 = A (small stub <dir>/<id>.html at IRI: RDFa+stub+alternate+canonical/meta-refresh to rendering, no script; nodeStubPageHtml), Q-THIN-4 = A (singular element/ view/ relationship/). Pushed cf14a4e to #1833 (~0.9 KB stub/node). 02:07Z Q-THIN-5 = B: #1833 stays draft until all families migrated. 02:5xZ pushed 396bca4: OpenAPI (<doc>/operation/<op>), library (data-kg-* on .lib-page, entry pages declare node; entry IRI still assets/library/jsonld/.../manifest.jsonld), todo (<site>/todo/<id>, kg-render at site assets/). Companion cat-harness#1229 (todo-page.js registers for ical:Vtodo, backward compatible; draft, subscribed). Open: library IRI move (content regen) + order (fhir-harness IG after tools merge).
Local test: siblings /home/user/{bootstrap-tools,cat-harness}, node_modules/@litlfred symlinks, /home/user/node_modules -> tools node_modules; install by temporarily removing the two @litlfred deps. 5 openapi/coverage tests fail on main too (need smart-trust).
Related: folio-assistant-c63o folio-assistant-8azk
02:23Z 11-11: Q-THIN-6 = B (move library entry IRI to kind/id inside #1833, with content regen). Q-THIN-7 = A (land in steps: cat-harness#1229 -> merge manager; then #1833 re-pins cat-harness; then fhir-harness IG PR). CodeQL fixes pushed: tools 3cb44745, cat-harness 4e369f4e1.
- Q-THIN-8 = A (02:27Z 11-11): library entry IRI = …/assets/library/jsonld/<layer>/source/<id>; data <IRI>.jsonld, stub <IRI>.html, entry files under <IRI>/. Old-IRI manifests in cat-harness(42), core(12), sci(6), fhir-harness, dth-hrh, smart-immunizations-uganda, who-iris(131), qou(805; math repo, ask before PR).
02:4xZ 11-11: #1229 merged. Regen PRs (branch claude/library-source-iri, drafts, subscribed): cat-harness#1230, core#734, sci#193, fhir-harness#369, dth-hrh#112, smart-imm-uganda#25, who-iris#228. Merge manager trains them with tools#1833 (couldn't mark #1833 ready: permission denied). Q-THIN-9 (qou regen PR) card open. Pins live in the index lock, not in tools.
04:35Z 11-11: tools#1833 + all regen PRs + qou#7816 MERGED (02:45-02:53Z). fhir-harness#370 (IG artefact pages via kg-render, extensionless artifact/<Type>-<id>, CodeQL fixed) blocked only on folio-assistant pinning tools >= 99d6991d (re-pin fa#3069, subgraph thread); then re-run checks + merge manager. core/sci main PR checks were still running at 04:33Z, with nothing red.
14:33Z 11-11: fhir-harness#370 MERGED. Thin-HTML arc complete (all families on RDFa + kg-render).
