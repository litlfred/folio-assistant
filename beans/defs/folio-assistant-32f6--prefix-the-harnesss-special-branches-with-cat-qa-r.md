---
# folio-assistant-32f6
title: Prefix the harness's special branches with cat- (qa-reports, lake-cache/*, state); gh-pages unchanged
status: in-progress
type: task
created_at: 2026-10-02T18:07:50Z
updated_at: 2026-10-02T18:07:50Z
parent: folio-assistant-fs43
---

Owner, 2026-10-02, verbatim: "need to prefix 'special' branches with cat-, cat-qa-reports, cat-fhir-ast, cat-lean-cacje (or whatever), not sure if any more. gh-pages stays as is" — and later: "(need to /coordinate and rename active branches)".

Parent: fs43, not 7x5n — fs43 is the arc whose subject is the special branches (its P7, rva2, declares every special branch with one field); 7x5n is the separation workplan this was asked from.

## Done when
- [ ] Inventory of special branches with references and writers (PR body)
- [ ] One declared source of truth for the names (cat-harness/special-branches.json) with a gate that every copy agrees
- [ ] Readers and writers resolve new-then-legacy name, so nothing breaks across the rename
- [ ] Collision review recorded: #1764/#1801 (qa-reports), #1816 (fhir-ast), state branch session
- [ ] Owner approves the renames; renames done through the rename API (keeps a redirect), never delete
- [ ] Follow-up bean for removing the legacy fallback

## Collision review (coordinate §"Before a platform refactor"), 2026-10-02, before the first edit

Open PRs scanned: all 29 (REST diffs; #1764, #1766, #1799, #1801 too large for the diff API, read from fetched branches).

| sibling | PRs | session | shared subject | files shared with this branch |
|---|---|---|---|---|
| arc 3fva (qa-reports) | #1764, #1801 (`heavy-mover`) | session_01LKpuPotV3Ve5Za75DQ3AQR | the `qa-reports` branch: `storage.branch` in 13 instance JSONs, `qa-store.ts` `DEFAULT_QA_BRANCH` | **none** — qa-reports code is not on main; its rename is listed for that owner |
| wnhh (fhir-ast) | #1816 | session_01PricYFhYhFA5DuMJaWo3CE | the `fhir-ast/<ig>` family, `ig-cache.sh`; also edits the `lean-cache-restore` skill | **none** — the skill prose is left for that owner |
| fs43 (state branch) | no PR; beans 8ez4, 2h76, rva2 | session_01KC89Knbbj8V6YL6Hrr7kk1 | the `state` branch (seeded, not authoritative) | **none** — no code reads it yet |

Phases: lake-cache/* (this branch) touches no sibling file, so it went ahead. qa-reports, fhir-ast and state renames wait on their owners.
