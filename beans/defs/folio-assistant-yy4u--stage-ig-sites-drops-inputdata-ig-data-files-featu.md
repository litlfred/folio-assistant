---
# folio-assistant-yy4u
title: 'stage-ig-sites drops input/data/: IG data files (features.yaml) never reach Jekyll _data, so site.data.features renders blank'
status: completed
type: bug
priority: high
created_at: 2026-10-09T15:38:22Z
updated_at: 2026-10-09T17:02:18Z
parent: folio-assistant-uhkv
---

Root cause of the blank links found 2026-10-09 (see the strict-variables bean):
smart-immunizations defines `site.data.features.github.{repo_owner,repo_name}` in
`input/data/features.yaml` — the IG Publisher copies `input/data/*` into Jekyll's
`_data/` — but `fhir-harness/scripts/stage-ig-sites.ts` never stages
`input/data/`, so in the just-the-docs build `site.data.features` does not exist
and `testing.html` renders `https://raw.githubusercontent.com///main/…` (×4).

Any IG data file under `input/data/` is affected the same way, in every smart-*
IG built by `folio-site.yml`.

## Plan

Stage `input/data/**` (yaml/json/csv, as the Publisher does) into the composed
site's `_data/`, keyed by file stem. Collision rule to decide and test: a file
named `fhir.*` must NOT overwrite what `ig-site-data.ts` writes for
`site.data.fhir` — refuse and report, rather than silently pick one.

## Done when

- [x] `stage-ig-sites.ts` copies `input/data/*` into `_data/`, with a test
- [x] ~~a collision with a harness-written data file is refused and reported~~ — superseded by the owner's 2026-10-09 ruling below (flag, not refuse)
- [x] smart-immunizations' `testing.html` renders a resolved `https://raw.githubusercontent.com/<owner>/<repo>/main/…` — see the note below on WHICH repo
- [x] the four links checked by building the site, not by reading the template


## 2026-10-09 — owner: flag overwrites in QA

Owner: *"can we have QA flag if overwrite"*. So a collision (an `input/data/<stem>` that a harness-written `_data/<stem>` — e.g. `fhir` from `ig-site-data` — also claims) is a QA FINDING in a sidecar, naming both sources and which one won, rather than a refusal or a silent pick. Supersedes the "refused and reported" line above.

- [x] every overwrite of a `_data/` key is recorded as a QA finding (sidecar), with both sources named


2026-10-09: implemented in https://github.com/litlfred/fhir-harness/pull/7 (bd68788) — staged, overwrites in stage log + test/results/ig-data-overwrites.qa-results.json.


## Closed 2026-10-09 — verified on a built site

Evidence: fhir-harness#7 merged (b54fbd6; bd68788 staging + overwrite QA, unit-tested). Then `build-ig-site.ts --ig-src` over litlfred/smart-immunizations main + `jekyll build`: stage log says `IG data staged into _data/ (site.data.*): features.yaml`, and `testing.html` now carries four resolved links (no `///`).

**They resolve to `WorldHealthOrganization/smart-empty`** — because the IG's own `input/data/features.yaml` says `repo_name: "smart-empty"`, a template default never updated upstream. That is the IG's content, rendered as the Publisher would; not a pipeline defect. Whether to fix it in the IG (upstream WorldHealthOrganization/smart-immunizations, or the litlfred fork) is the owner's call — recorded, not acted on.
