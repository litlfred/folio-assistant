---
# folio-assistant-cesa
$schema: bean/1.0.0
title: 'Memory: WHO 2015 HRHIS MDS (9789241549226): never use the data set as a model or make it computable; ingest ONLY its functional requirements as inspirational...'
status: completed
type: task
priority: low
created_at: 2026-11-01T23:42:33Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `no-2015-mds.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: WHO 2015 HRHIS MDS (9789241549226): never use the data set as a model or make it computable; ingest ONLY its functional requirements as inspirational L1 reference

Owner rule, refined 2026-11-01 23:42Z (thread "Ingest WHO 2015 registry guide as L1", cmsg_017WNUkNK8kdDziPK58Pv6G9BpF54vEx8SD6tGvJBGDxAQ):
- Do NOT use the 2015 "HRHIS minimum data set for health workforce registry" data set as a data model and do NOT make it computable.
- DO ingest it into who-iris as L1 (regular + SKOS), but ONLY the functional requirements for types of systems, structured, as an inspirational, non-definitional reference the DTH-HRH handbook may cite. "Not definitional but contribute to a definition."
- Earlier 23:33Z rule ("DO NOT USE 2015 MDS. IGNORE IT", Q-NHWA-1) is superseded by this narrower one.

**Why:** owner says the doc "is not well structured AT ALL"; only its FR content is useful.
**How to apply:** NHWA handbook 2nd ed (who-iris 9789240081291-eng) stays the source for HRH data/indicators. Any dth-hrh link to these FRs stays draft. Related: folio-assistant-2yeq, folio-assistant-wyqi.

Done 2026-11-01: who-iris#166 / draft PR #167 (branch claude/hrhis-2015-functional-requirements): library/9789241549226-eng + 59 functional-requirement candidates + SKOS glossary/hrhis-registry-2015.glossary.json (FR concepts broader = system type: health-workforce-registry or hrh-information-system; no skos:definition). No catalogue node (iris.who.int blocked by proxy). Local ingest needs mounts INSIDE who-iris at index.lock pins with their .git removed.
Follow-up: cat-harness-tools#1357 (435b53a) + cat-harness#955 (0cbf35c) merged 2026-11-02 07:04Z; after who-iris re-pins to them, re-run `gen-library-jsonld --entry library/9789241549226-eng` to add smart-base @type + meta.source_kind to the FR blocks (IRIs unchanged). Q-HRHIS-1 A: #167 merges on green full checks.
USER RULE 2026-11-02 07:10Z (cmsg_017WNUkNK8kdDziPK58Pv6G9CPkKntXRXYgaet9PKSL6Ej): DTH-HRH must NOT reference the 2015 MDS. Terms/definitions may stay in DTH-HRH as working definitions; where a source is needed, cite the ingested who-iris glossary (hrhis-registry-2015 SKOS) as an external source, not the 2015 MDS document or its library blocks.
2026-11-02 ~08:30Z: #167 blocked — who-iris CI judges with folio-assistant main's index (fa 41bbb14 pins cat-harness-tools f92092eb, smart-base ce2ee669, pre-#1357), so FR blocks can't pass. Asked re-pin train thread to re-pin fa. After that: regenerate the 59 blocks in fa layout (smart-base types them smart-base:FunctionalRequirement), re-run, merge. Pushed 666aff8f (candidates.json `_schema` key).
2026-11-03 05:00Z: #167 MERGED by litlfred at 666aff8f (issue #166 closed). FR blocks still typed cat-harness:Block; in fa layout with smart-base they regenerate as smart-base:FunctionalRequirement — whoever re-pins who-iris in fa may need to regen library/9789241549226-eng.

**CORRECTION (user 2026-11-12 06:14Z, thread cmsg_017WNUkNK8kdDziPK58Pv6G9485GDkaugFAYVaNMpCMzaR):** "not correct = no reference to the 2015 MDS anywhere in DTH-HRH. there can be references, its just not the basis for the core data elements. we must cross-reference." This overrides the 11-02 07:10Z and 11-08 (GLD-3 C / Q-MDS-2) readings. dth-hrh#109 (merged 11-12 06:08Z) removed cross-references and is being restored.
