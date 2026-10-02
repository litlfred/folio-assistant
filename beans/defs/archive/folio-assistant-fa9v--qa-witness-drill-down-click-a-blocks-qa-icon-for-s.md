---
# folio-assistant-fa9v
title: 'QA witness drill-down: click a block''s QA icon for sidecar detail and witnesses'
status: completed
type: task
priority: normal
created_at: 2026-09-18T19:46:50Z
updated_at: 2026-09-18T20:25:26Z
---

Asked on 2026-09-18: in translations, a QA icon on each content block; clicking it shows the detailed QA sidecar data (e.g. semantic roundtrip); opening a criterion shows every witness — which script/model/agent/human ran it, when, staleness, and SHA. Same behaviour for every content QA sidecar, with a different icon per QA family.

Follows bean g6yr (per-block QA icons, shipped #274), which rendered state only: a non-interactive <span> with the counts in its title. The witness data already exists in <block>.qa.json (QaCriterionEntry.reviewer {kind,id,version,script_hash,script_commit_sha,agent_model,agent_session,agent_skill}, reviewed_at, reviewed_sha, field_hash); nothing publishes it to the reader.

## Summary of Changes

Shipped on `claude/fervent-mccarthy-nw4olk`, PR #278. Not merged.

`content/pipeline/qa-witness.ts` projects all four sidecar families into one
`qa-witness/v1` shape; `gen-docs-pages.ts` emits one icon per family that
APPLIES to a node's subjects and publishes the projection under
`docs/assets/qa/`; `docs-ui.js` + `docs-ui.css` open it inline — criteria
worst-first, each expanding to its witnesses.

**Freshness is recomputed against the working tree**, not read from the
sidecar's own header, and `unknown` is never rendered as `fresh`. That found a
live defect on the first run: `what-is-not-built-yet`'s `voice-status-leak:
fail` was measured at 17:33 against an `.md` edited at 19:06 the same day, so
the `●` the site shows is a verdict about an older file. Nothing reported that
before.

Measured: 35 witness files, 11 pages, 516 KB published; sidecars themselves
unpublished. `bun test` 1724 pass / 0 fail · 7 Playwright tests driving the
real `docs-ui.js` against the real published JSON · eslint, tsc,
`gen-docs-pages --check` clean.

## Left open

How it LOOKS is unverified on the deployed site — Pages does not build from
this branch. Screenshotted in Chromium in both themes and sent to the author.
The `script` family renders nowhere, because no `*.script-qa.json` exists in
this repo; covered by unit test only, and stated in the PR rather than hidden.
