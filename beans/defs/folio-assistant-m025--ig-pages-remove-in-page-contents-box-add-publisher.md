---
# folio-assistant-m025
title: 'IG pages: remove in-page Contents box; add Publisher footer from package metadata (#1901)'
status: completed
type: task
priority: normal
created_at: 2026-10-04T05:35:04Z
updated_at: 2026-10-04T06:05:02Z
parent: folio-assistant-uhkv
---

Follow-up to #1970 on #1901. Owner 2026-10-02: TOC only in the LHS rail (done in #2020), so remove the Contents box #1970 added. Owner 2026-10-02 scope addition: Publisher footer — prev/top/next row; band 'IG © <publisher> ↗. Package <id>#<version> based on FHIR <v> ↗. Generated <date>'; Links: Table of Contents | QA Report | Version History | License. Values from the IG's own metadata (package.tgz package.json / ImplementationGuide), never hard-coded; links to absent targets left out.

- [x] remove contentsBox + .ig-toc CSS, update tests
- [x] footer data written once per instance (assets/ig-footer.json), drawn client-side
- [x] prev/top/next per page
- [x] regen smart-trust pages, gates


Progress: contentsBox and .ig-toc removed; footer = ig-footer.ts (data from package.json / ImplementationGuide, fallback to index) + templates/ig-pages/ig-footer.js loader + assets/ig-footer.json per IG; prev/next through index → artefacts; tests in ig-footer.test.ts and pages-markdown.test.ts. QA Report and Version History links left out: no target page here (owner: omit rather than 404). © year left out: sushi-config copyrightYear is not in the package.


## Summary of Changes

Landed in #2041 (merge 37d7c6c): Contents box removed from the IG index body; Publisher footer added on every IG page (prev/top/next through index → artefacts; publisher/package/FHIR/build-date band; Table of Contents | License links), data from the IG's own package via fhir-harness/scripts/ig-footer.ts, written once as assets/ig-footer.json and drawn by templates/ig-pages/ig-footer.js. QA Report / Version History links and the © year omitted: no target / not in the package.
