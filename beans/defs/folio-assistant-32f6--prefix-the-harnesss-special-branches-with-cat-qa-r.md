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
