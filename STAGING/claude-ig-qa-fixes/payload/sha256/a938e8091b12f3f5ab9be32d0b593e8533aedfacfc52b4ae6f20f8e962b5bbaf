---
# folio-assistant-wujt
title: 'STAGING EDIT LINKS: on a staging preview, view/edit links go to the previewed branch, not main — for every harness'
status: todo
type: task
priority: normal
created_at: 2026-10-05T18:17:58Z
updated_at: 2026-10-05T18:17:58Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-05 (during bean `mftp`): *"in general (not just for FHIR IGs, but other harneses) edit links on staging, should go to their staging edit links, not main."*

## Measured 2026-10-05
- View/edit links are composed by `sourceLinks(repoUrl, path, branch)` (`cat-harness/schemas/cat-harness.ts`), called by about eight generators (`gen-landing-data`, `gen-docs-pages`, `harness-panel`, `library-links`, `gen-voices-viz`, `gen-external-schemas-viz`, `library-graph`, `gen-site-jsonld`). Each passes the branch itself, `"main"` or a `SOURCE_BRANCH = "main"` constant.
- Their output is COMMITTED and gated (`--check`), so a staging build serves the `main` links. Regenerating at staging time would make the committed artefacts disagree with what the gates expect.

## Proposed
The staging build stamps the branch it was built from (`<meta name="fa-source-branch">`, beside the staging banner). `docs-ui.js` rewrites `https://github.com/<this repo>/(blob|edit)/main/…` to that branch on a staging page. That is one place for every harness, with the generators unchanged.

An IG page's edit links point at the IG's own repository at the commit staged, which is a different repository, so they are not rewritten.

## Done when
- [ ] staging pages' view/edit links to this repository name the previewed branch
- [ ] production pages unchanged
- [ ] a test plants a `main` link on a staging page and sees it rewritten
