---
# folio-assistant-l1el
$schema: bean/1.0.0
title: 'fhir-core: HL7 published packages are the authority; derive the UML class model'
status: in-progress
type: task
priority: normal
created_at: 2026-11-15T07:05:00Z
updated_at: 2026-11-15T11:15:00Z
tags:
    - fhir-harness
    - fhir-core
---

Owner, 2026-11-15 (stalled CLI session, log gist f2613e4b): "i want to refer to HL7 offiically published .json etc for their resources, just use fhir-harness to derived stuff (e.g. UML) that is not part of core IG publisher" and "reference published hl7. assets as authoratative". Owner cards then: point to HL7 with a cache only; build the UML now; add hl7.org to allowed hosts.

Owner thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9LVYmSvyptUX6bBsZnWL3D9

- [x] Issue litlfred/fhir-harness#436
- [x] Pins name HL7 tarballs (https://hl7.org/fhir/<R>/hl7.fhir.<r>.core.tgz); packages.fhir.org kept as a pinned mirror for the cache only
- [x] Manifests carry HL7 published JSON per definition (all 646 URLs 200); resolve answers with it
- [x] Local bodies are a labelled cache (<release>/cache/CACHE.md), gitignored
- [x] UML class model derived (class-model.json; R4 682, R4B 702, R5 861 classes)
- [x] litlfred/fhir-harness#437 handed to the merge manager with companion litlfred/cat-harness-tools#2294 (fixture copy; the two land together)
- [ ] #437 and #2294 merged (queue behind folio-assistant#3124 and fhir-harness#426)
- [ ] folio-assistant re-pins fhir-harness to the merge commit

Facts: R4B/R5 HL7 tarballs are byte-identical to the registry's. R4's differ (registry carries 3 more non-core SDs), but all 209 core SDs are byte-identical, so manifest sha256 values did not change. The earlier CLI session's local R4 build and its uncommitted v2 edits were lost; this redid them from fhir-harness main 5bf5ff9. The Default cloud environment now allows hl7.org (added 2026-11-15).

_2026-11-15T07:05:00Z_ — Filed by thread "Pin fhir-harness to HL7 core packages", session https://claude.ai/code/session_01Qmmkt9JpGSbzaX8cw6AfPM. Draft PR litlfred/fhir-harness#437 (e83ad97) opened.

_2026-11-15T11:15:00Z_ — Full checks on #437 (attempt 2): the only new failure is cat-harness-tools standalone-fixture byte-equality, fixed by cat-harness-tools#2294 (green). gen:jsonld:check is red on main too. Both PRs got `ready:` comments and were handed to the merge manager thread.
