---
# folio-assistant-cep2
$schema: bean/1.0.0
title: 'Memory: smart-fp XML IG converted to sushi/FSH (litlfred/smart-fp#3, Q-FP-1 card); JSON match results and how it was checked'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:14:31Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-fp-sushi-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-fp XML IG converted to sushi/FSH (litlfred/smart-fp#3, Q-FP-1 card); JSON match results and how it was checked

Thread "Convert smart-fp to sushi" (cmsg_017WNUkNK8kdDziPK58Pv6G98UERBkphEj357Ss5QsbWzt), 2026-11-10, option C of the WHO forks card (see folio-assistant-lwdn).
- Draft PR litlfred/smart-fp#3, branch claude/sushi-convert. GoFSH + hand fixes, sushi 0 errors. Harness wiring copied from smart-dak-pnc#3. Content: merge needs owner card Q-FP-1.
- User rule (19:52Z): generated JSON must match the original. Result: 15 VS + extension identical; CodeSystem only count added; 25/26 profile snapshots identical (fhir-snapshot-generator, both sides); rest is representation only.
- Kept as JSON: deliverymethod extension (Extension.extension 0..1 + value, sushi refuses), 2 VS with duplicate codes. Original defects reproduced via ^min/^max/^binding caret rules, not fixed.
- Report + scripts: /mnt/project-files/smart-fp-sushi-2026-11-10/.
- Snapshot tool gotchas: mirror's .fpi.index.json lacks `derivation` (delete it); extensions.r4 5.3.0 needs terminology 7.1.0 (not mirrored; repoint to 7.4.0 for the check).
- 20:18Z Q-FP-1 = B: #3 MERGED (e9e6223). Follow-ups: #4 (report page input/pagecontent/sushi-conversion.md, linked from Home; user asked 20:19Z "put diff doc in KG and link from home") and #5 (claude/fix-fp-defects: 12 loosening ^min/^max removed, deliverymethod -> FSH with extension 0..0). Merge of #4 refused by classifier [Merge Without Review] -> card Q-FP-2. Card Q-FP-3: integer binding, device.type, duplicate VS codes (left as-is pending).
- 20:27Z Q-FP-2 = A: #4 + #5 MERGED. Q-FP-3 = B: draft #6 (claude/fp-meaning-fixes): integer binding -> min/maxValueInteger 1..4; new Device profile who-fp-device-contraceptive-method carries the type binding; duplicate VS codes merged with ' / ' displays. Card Q-FP-4 asks to merge.
- 20:29Z Q-FP-4 = A: #6 MERGED. All smart-fp work done; next step is the owner running Site publish on master.
- 20:35Z user asked: document all changes, linked, semantic changes at top -> #7 (claude/conversion-changelog) rewrites sushi-conversion.md; merge refused by classifier -> card Q-FP-5. Site publish dispatch refused by classifier [Production Deploy]: user must run it; then ask for Pages once gh-pages exists (user rule).
- 20:31Z Q-FP-5 = A: #7 MERGED. Waiting on owner to run Site publish (classifier blocks dispatch); then ask for Pages once gh-pages exists.
- 20:40Z Site publish run 42896076528 failed at stage-local: needs a workflow calling fhirbuild.yml/ghbuild.yml (XML IG had none). Fix #8 (claude/ig-build-workflow) copies pnc's by-hand ghbuild.yml; card Q-FP-6.
- 20:54Z Q-FP-6 = A: #8 MERGED. Owner to re-run Site publish; check at 21:02Z trigger.
- 21:18Z forks thread dispatched Site publish run 42903648439 (d3b80b5) and owns the Pages ask + jtd compose from here. This thread resolved.
