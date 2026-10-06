---
# folio-assistant-r93y
title: 'IG artefact pages: one footer, same facts and links as the IG site pages (#1901 follow-up)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T12:15:12Z
updated_at: 2026-10-06T12:15:29Z
parent: folio-assistant-uhkv
---

Follow-up to #1901 / #2264. The artefact pages (gen-ig-pages) draw their own JS footer from assets/ig-footer.json: it lacks the © year (copyrightYear is in sushi-config.yaml, not the package) and its Table of Contents link points at the site root instead of toc.html. Goal: the artefact pages' footer matches the IG site pages' footer exactly — same facts from one source, same links, each link only where its target exists.

## Done when
- [ ] artefact pages and IG site pages draw the footer from one source of facts and one link decision
- [ ] a test asserts both footers carry identical facts and links
- [ ] before/after screenshots of a smart-trust artefact page footer and index.html footer from a local staged build
- [ ] draft PR open, CI green

## Collision review, 2026-10-06 (coordinate §"Starting new work"), before any edit

Checked: every open PR's changed files (REST pulls/{n}/files, 13 open PRs) intersected with gen-ig-pages.ts, build-ig-site.ts, stage-ig-sites.ts, ig-footer*, templates/ig-*, smart-*/docs/assets and smart-*/scripts/tests; in-progress beans searched for footer, gen-ig-pages, build-ig-site, ig site, 1901, artefact.

- #2276 (bean n7f8, diagram pan/zoom, same session family) changes build-ig-site.ts and build-ig-site.test.ts, not the footer. This work does NOT edit either file: the new parity tests go in their own file.
- branch claude/awesome-fermi-ua31th-foreign-site-data (bean ky3r, #2263): compose-docs / foreign-site-scope / folio-site translation. No shared file.
- m025 (the original footer bean) is completed; mftp / 4tts are in-progress on the IG site but record no holder and their work is merged.
No overlap on the files this touches: fhir-harness/scripts/gen-ig-pages.ts, fhir-harness/scripts/templates/ig-site/ig-footer.liquid, fhir-harness/scripts/templates/ig-pages/ig-footer.js, fhir-harness/scripts/ig-footer.ts, the regenerated smart-*/docs pages, smart-trust/scripts/tests/pages-markdown.test.ts.
