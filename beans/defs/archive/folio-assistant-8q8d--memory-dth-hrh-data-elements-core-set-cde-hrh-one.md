---
# folio-assistant-8q8d
$schema: bean/1.0.0
title: 'Memory: DTH-HRH data elements = core set (CDE-HRH) + one extension set per NHWA 2nd-ed module; design doc + cards Q-CDE-1..4 (2026-11-02)'
status: completed
type: task
priority: low
created_at: 2026-11-02T07:16:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-hrh-cde-nhwa-design.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DTH-HRH data elements = core set (CDE-HRH) + one extension set per NHWA 2nd-ed module; design doc + cards Q-CDE-1..4 (2026-11-02)

Thread "Design DTH-HRH core and NHWA data elements" (cmsg_017WNUkNK8kdDziPK58Pv6G9WwtQiEUvdGPQ4efY1dCDAo), started 2026-11-02 07:13Z.
User rule 07:12Z: CDE + per-NHWA-module additional data elements; 2015 MDS not authoritative, external reference only. See folio-assistant-cesa.
NHWA 2nd ed (who-iris library/9789240081291-eng) has 4 modules: 1 Stock and flow (1-01..1-12), 2 Education (2-01..2-07), 3 Finance (3-01..3-05), 4 Working conditions/governance/leadership (4-01,4-02,4-03,4-05; 4-04 missing from ingest?).
Design doc: https://claude.ai/artifact/SEbShvTKJQrXga3xAaq2Lc. Proposal: core = 10 current elements + occupation (ISCO-08) + sex; module 1 adds activity level, subnational unit, facility ownership/type, country of training, entry/exit dates + exit type, contract type; modules 2-4 small optional sets. meta: elementSet, supportsIndicators, relatedExternal.
Builds on dth-hrh#93 (working definitions). Overlaps CS-001 (dth-hrh#53): committee content, never merge, keep issue open.
Cards Q-CDE-1 (structure: ANSWERED A 07:18Z), Q-CDE-2 (core scope: ANSWERED A 07:18Z), Q-CDE-3 (rename labels: ANSWERED A 07:18Z), Q-CDE-4 (ANSWERED A). All A 07:18Z. Draft PR dth-hrh#94 (branch claude/dth-hrh-cde-nhwa, base #93 branch) opened 2026-11-02; committee content, never merge. Issue-comment on #53 was blocked by the auto-mode classifier.
Downstream: dth-hrh#96 (NHWA indicator thread, session_01Qmmkt5qsw6PFDMHdMt43rN) is stacked on #94 and adds ind-nhwa-* blocks after p-ch11-nhwa-mN; reads meta.supportsIndicators. Tell that thread before renaming module blocks or pushing to #94.
Preview (built locally, not from CI): ch11 artifact https://claude.ai/artifact/1ew8W43bweptFoLfKy4AXX from #94 commit c648c09; rebuild via bun run site:document <out> and extract chap:ch11 from index.hydrated.html.
10:12Z user: every data element in the glossary, marked provisional/draft, related links to external glossaries incl WHO MDS 2015 (as related). Mockups https://claude.ai/artifact/4GP3Fcfmte5hvkthiaBfXd. Cards Q-GLD-1 (def source: rec A quote NHWA 2023 glossary else to draft), Q-GLD-2 (rec A status candidate + editorialNote badge), Q-GLD-3 (rec A link who-iris 9789241549226-eng data-element sheet sections, branch claude/hrhis-2015-functional-requirements not yet on who-iris main). Staging: https://litlfred.github.io/dth-hrh/STAGING/claude-dth-hrh-cde-nhwa/ (stage-local.ts). 9431752 added t-ch11-* at-a-glance tables. who-iris nhwa-2023.glossary.json has Sex, Occupation, Activity Level, Facility Type etc.
14:09Z CS-001 E3 'show details': proposed MDS-HRH imprecision wording (4 senses: floor/start, list/spec, record/report, one/many lists) for start of 11.1; sent to log watcher thread for M3 (my Sheets write was blocked by classifier). Waits Editor OK, then add to #94 + restage.
2026-11-08: GLD-1 A, GLD-2 A, GLD-3 C (NO 2015 links anywhere in DTH-HRH). #93 merged; #94 retargeted to main. Added glossary/dth-hrh-data-elements.glossary.json (25 candidate terms; 10 quote nhwa-2023 + closeMatch, editorialNote "Provisional definition, NHWA handbook 2nd ed." / "Definition to draft"); blocks carry meta.glossary; Annex 9 "Data element terms" table t-data-element-terms via core `bun run cat glossary:table --instance . [--check]` (glossary/glossary-tables.json); build_glossary.py keeps that section. Don't add folio scripts named glossary:table (clash with core). Preview URL now /branches/claude-dth-hrh-cde-nhwa/. Card Q-MDS-2 (remove remaining 2015 refs on main: ch07 FR ext-glossary lines, References, dth-hrh.json remoteGraph; rec A keep TWG workbook candidates).
2026-11-08 Q-MDS-2 A: draft PR dth-hrh#109 (branch claude/dth-hrh-drop-2015-refs) removes ch07 FR externalGlossaryReferences to hrhis-registry-2015, References 2015 entry, dth-hrh.json remoteGraph; keeps TWG workbook candidates citing 2015.
2026-11-12 06:08Z Q-109-1 A: merged dth-hrh#109 (69d83be) with corpus-gate red. #94 still draft, committee content (CS-001), never merge.
2026-11-12 06:14Z USER CORRECTION: 2015 MDS may be referenced and must be cross-referenced; it is just not the basis for the core data elements (supersedes GLD-3 C / Q-MDS-2). #109 reverted by other thread's draft #118 (reviewed: exact undo). Card Q-GLD-4 (add 2015 data-element sheet cross-refs to #94 glossary; rec A now).
2026-11-12 user: 'Use SKOS relational terms'. Mapping table /mnt/project-files/dth-hrh-cde-nhwa/skos-2015-crossrefs.md (closeMatch/broadMatch/narrowMatch/related, no exactMatch). who-iris #167 (2015 guide) was REVERTED on main (824b5c7, content PR); lives on branch claude/hrhis-2015-functional-requirements. Card Q-SKOS-1 (rec A: who-iris draft PR re-lands guide + 29 data-element concepts, #94 links IRIs).
Q-SKOS-1 = A (user 06:38Z 11-12): who-iris draft #252 (branch claude/hrhis-2015-data-element-concepts) reapplies #167 + 30 concepts (minimum-data-set, mds-01..10, data-element-<sheet slug>). #94 commit 5f2e26f adds the SKOS links; check:dth-glossary red until #252 merges + who-iris repin (passes with #252 glossary mounted).
