---
# folio-assistant-2yeq
$schema: bean/1.0.0
title: 'Memory: L1 requirement ingestion design (2026-11-01): requirements are Stage-B candidates.json typed blocks using existing kinds; 2015 HRHIS MDS guide = func...'
status: completed
type: task
priority: low
created_at: 2026-11-01T23:34:49Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `l1-requirement-ingestion.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: L1 requirement ingestion design (2026-11-01): requirements are Stage-B candidates.json typed blocks using existing kinds; 2015 HRHIS MDS guide = functional requirements only, inspirational, never a data model


Thread "Ingest functional requirements in L1 ingestion" (cmsg_017WNUkNK8kdDziPK58Pv6G9MzQpc26tsYwzKvRWEvTqXn), started 2026-11-01.

- USER RULE (refined 2026-11-01 23:42Z, supersedes 23:33Z 'ignore it'): the WHO 2015 HRHIS minimum data set guide (9789241549226-eng) is ingested as L1 + SKOS in who-iris (thread cmsg_017WNUkNK8kdDziPK58Pv6G9BpF54vEx8SD6tGvJBGDxAQ). Use ONLY its functional requirements for types of systems, structured, as a non-definitional, inspirational reference for dth-hrh ('not definitional but contribute to a definition'). NEVER use the MDS as a data model and never make it computable.
- User: requirement extraction from source docs is a general part of L1 ingestion for DAK and DTH; ids must come from the source, never invented (dth-hrh FR-xx ids were agent-invented, commit 85a6ea7).
- User: requirement schemas come in several styles (core `recommendation`; smart-base `functional-requirement`, `non-functional-requirement`, `indicator`). Pick the existing kind that fits; add no new schema.
- Mechanism already exists: cat-harness-tools `scripts/extract-candidates.py` (Stage B, per-layer `scripts/extractors/*.py`, one class per doc) writes `candidates.json`; `pipeline/gen-library-jsonld.ts` turns each candidate into `library/<doc>/blocks/<prefix>-<seckey>-NN.jsonld` (+ `.md` verbatim), `derivedFrom` the section, `provenance: ingested`.
- Gaps found: gen-library-jsonld calls `typesForKind(kind)` without the contribution registry, so smart-base kinds get no @type; smart-base `who-l1.py` maps recommendations to `definition` (core skill says never). `l1:coverage` (core tools/l1-coverage) flags uncaptured normative sentences.
- NHWA case (dth-hrh thread): 12 registry indicators in /mnt/project-files/dth-hrh-nhwa-requirements-2026-11-01/nhwa-registry-indicators.json, to go into who-iris library/9789240081291-eng as kind `indicator` candidates.
- PRs (2026-11-01): cat-harness-tools#1357 (issue #1356) aspects + typing; folio-assistant-core#580 (issue #579) skills; smart-base#282 (fork; Q-FRI-2 A 2026-11-02 06:09Z: open + merge on green). Q-FRI-1 A (2026-11-02 06:13Z): always run, plus coverage check. TODO: coverage check is not yet an automatic arm (skill says run l1:coverage by hand); add an ingest arm after #1357 merges. Q-FRI-3 A (2026-11-02 06:09Z): #1357/#580 marked ready + merge on green. Merge order: #1357 before smart-base#282 matters only at pin time.
- MERGED 2026-11-02 07:03Z: cat-harness-tools#1357 (435b53a5), cat-harness#955 baseline (0cbf35c5), smart-base#282 (85dcfdab); commits sent to both who-iris threads. core#580 merged 07:54Z (0cc2966d) (fixed reference-direction: core skills must not name smart-base/who-iris, say 'the DAK layer').
- (done) On #1357 merge: send the merge commit to the dth-hrh thread (cmsg_017WNUkNK8kdDziPK58Pv6G98q7ycpNcyZETyhTTp9ETxW) for the who-iris#165 re-pin, and to the HRHIS thread (…BpF54vEx8SD6tGvJBGDxAQ) for #167.
- 2026-11-02: cat-harness-tools#1394 (issue #1393) fixes libraryInstanceOf for concern-grouped entries (library/<group>/<slug>); without it a regen of cat-harness/library writes relative manifest IRIs. Do NOT regen before it merges. Card asked ready+merge.
