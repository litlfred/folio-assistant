---
# folio-assistant-0om7
$schema: bean/1.0.0
title: 'IG previews publish outline.json and rendered-impact.json for the review page'
status: completed
type: feature
priority: low
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-30T17:36:00Z
parent: folio-assistant-1xhc
---

Found walking #215 on smart-immunizations-uganda#12 (see lx2s). The IG route's review page says "No outline on this build: the folio's build did not publish outline.json" and "This build published no rendered-impact.json, so which rendered pages the change alters is not known". The folio route publishes both; the IG route (fhir-harness#158) does not yet.

## Done when
- [x] an IG preview publishes `outline.json` over its narrative pages, and the review page shows the outline (`fhir-harness#169` @ `341fbc7b`; verified on `litlfred/smart-immunizations-uganda` `gh-pages` @ `bc8f03ed`, `STAGING/claude-sample-215-hpv-9y-do-not-merge/outline.json` and `review/index.html`)
- [x] an IG preview publishes `rendered-impact.json`, and the review page lists the rendered pages each change alters (`fhir-harness#169` @ `341fbc7b`; verified on `litlfred/smart-immunizations-uganda` `gh-pages` @ `bc8f03ed`, `STAGING/claude-sample-215-hpv-9y-do-not-merge/rendered-impact.json` and `review/index.html`)

_2026-10-24T13:55Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx. Plan: fhir-harness `igChangeSet` also derives `outline.json` (the IG's pages, then its sources) and a `cone` `rendered-impact.json` (narrative pages with their anchors; other sources listed as undetermined, since the Publisher renders them).

_2026-10-24T13:53Z_ — fhir-harness#169 merged (341fbc7): IG previews write `outline.json` and `rendered-impact.json`. Its CI skipped the test shards, so the tests ran locally only (9 pass). Left open: the boxes need the next Uganda preview to confirm that the review page shows the outline and the page list. Issue fhir-harness#168.

_2026-10-30T12:00Z_ — Code merged: fhir-harness#169 (341fbc7, `scripts/ig-review-data.ts`), pinned in folio-assistant. The 10-24 claim is stale, so this goes back to todo until one Uganda IG preview built since then shows the outline and page list. Then close with fhir-harness#168. (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)

_2026-10-30T17:36:00Z_ — Verified and completed:
- Repinned `fhir-harness` to `341fbc7b7ee1ffcd3b9dd804762723e6faf1ead5` (`fhir-harness#169`, `fhir-harness#167`) on `litlfred/smart-immunizations-uganda` branch `claude/sample-215-hpv-9y-do-not-merge` (`aac7600`) and opened PR `litlfred/smart-immunizations-uganda#17` (`d65ce4c`) for `main`.
- Ran `site-publish.yml` on `claude/sample-215-hpv-9y-do-not-merge` (GitHub Actions run `41098150723` -> `gh-pages` commit `bc8f03ed5a930f8708478956b5eea838e5af9165`):
  - Published `STAGING/claude-sample-215-hpv-9y-do-not-merge/outline.json` (`Immunizations - Uganda adaptation (draft)`, with `Pages` and `Sources` chapters) and `STAGING/claude-sample-215-hpv-9y-do-not-merge/rendered-impact.json` (`rendered-impact/v1`, method `cone`, renderer `fhir-ig-pages`).
  - Verified `STAGING/claude-sample-215-hpv-9y-do-not-merge/review/index.html` in headless Chromium (Playwright): the Outline pane renders the full IG narrative & source outline with per-section change badges (`Adapted and added tables 1 changed`, `Data model notes 1 changed`, `Children 1 changed`, `testing 1 changed`, plus 5 source directories) and the 9-row section heatmap; the Rendered-impact section lists the 4 altered narrative pages (`decision-logic.html › adapted-and-added-tables`, `differences.html`, `schedule.html › children`, `testing.html`) and explicitly reports the 5 Publisher-rendered source inputs under `Not known`.
