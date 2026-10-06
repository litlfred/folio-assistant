---
# folio-assistant-bnjs
title: 'RENDERED IMPACT: a Change Set lists the rendered files it changes — each renderer maps changed inputs to changed outputs through its dependency cone, and review approves against that list'
status: in-progress
type: feature
created_at: 2026-10-06T07:13:23Z
updated_at: 2026-10-06T07:13:23Z
parent: folio-assistant-q4jm
---

Owner, 2026-10-06 (#971): "for a Change Set (generalize/apply concept from Ref Arch) and Issue -> create PR with change set. see a list of rendered justthedocs files (fhir IG, whatever) that changed due to the described changeset. use that as part of review process of changeset PR approval. updates skills and processes." Then: "each renderer should be able to give you from list of input changed files, the list of output changed rendered files ... from the dependency cone". Ruling: generalise the public-comment Change Set (changeset/1.0.0) to any folio; the rendered-change list is one of its fields. Ref Arch: the draft already lives in litlfred/smart-ra folio/dpi-h-ra (284 CS records), library/ holds only the circulated PDF/docx.

Related: q4cm (edit set, accept = approve), c65n (measured FHIR chain), jwox (block ChangeSet).

## Todo
- [x] renderer contract: rendered-impact/v1 schema (files with role content|data|index, undetermined inputs never read as no change) + a build-diff that confirms a prediction
- [x] FHIR IG renderer: changed .fsh/.cql/pagecontent -> fsh-cone forward cone -> fsh-index -> AST pages, data, index pages
- [x] verify the FHIR prediction against the real smart-immunizations build diff (expect the 3 files of c65n)
- [x] Change Set generalised: refs optional, rendered[] field
- [ ] document-folio renderer (block ChangeSet -> page anchors), for smart-ra
- [ ] docs-site renderer (staging-cone, directory -> pages)
- [x] skill rendered-impact; update staging-review, before-after-preview, ig-ast-delta, public-comment change-sets
- [x] process: content-change-review.bpmn names rendered-impact at Compare, Slice and Comment-PR (produce/read/assign)
- [ ] gate: the coverage DMN counts unreviewed rendered pages, missed files and site-wide undetermined inputs, once the staging build publishes rendered-impact.json (an input nothing computes is not added)
- [ ] staging build: run the renderers on the PR's changed files and publish rendered-impact.json + the PR-comment list
- [ ] PR comment + review page show the list

## Rule: the original stays in library/, edits happen in folio/

Owner, 2026-10-06: "original stays in library/. the presumed workflow is then it was materialized to folio/ to make changes on". A Change Set applies to the MATERIALISED folio, never to the library source. smart-ra already works this way: `library/who-dpi-h-reference-architecture-draft-v1/` holds the circulated PDF/docx, `folio/dpi-h-ra/` holds the editable blocks, and `review/public-comment/changesets/` holds the CS records against the folio.

## Progress 2026-10-06
- Contract + FHIR renderer (187869fa0); verified on smart-immunizations: FSH edit 4 predicted / 3 measured / 0 missed (the 1 unconfirmed is the page that loads its data), page edit exact. 0.34 s vs SUSHI 165 s.
- Change Set general (24fed58de): refs default [], rendered[] field; 284 smart-ra CS records validate unchanged.
- Skill rendered-impact registered; content-change-review names it at Compare, Slice and Comment-PR.
