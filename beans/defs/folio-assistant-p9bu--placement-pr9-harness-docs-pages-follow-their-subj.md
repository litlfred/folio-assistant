---
# folio-assistant-p9bu
$schema: bean/1.0.0
title: 'Placement PR9: harness docs pages follow their subject to the owning instance'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-24T08:15:06Z
parent: folio-assistant-iirv
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR9 (follow-up): harness docs-folio pages about moved processes follow their subject — `guides-writing-a-paper` (44) → sci; `guides-who-smart-dak` (17), `guides-who-smart-ig` (23), `ig-publisher` (20), `fhir-content` (20) → smart-base / fhir-harness; `guides-writing-a-document` (43), `content-types` (32), `evidence` (29) → core; `document-ingestion` (38) split per §3. Under `1g4s` a dependent's `docs/` is a named member of `docs`, so nothing leaves the site.

Blocked by PR3 and PR6 (the processes these pages document must have moved).

## Done when
- [ ] `docs:pages:check` and `translated-links:check` green
- [ ] the published site's page count is unchanged

_2026-10-06T06:56:20Z_ — Claimed by claude/docs-follow-subject-p9bu — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## 2026-10-06 — design finding (session H, https://claude.ai/code/session_012dn4UVLnHDxP1qR9xmotSw)
The premise above ("a dependent's `docs/` is a named member of `docs`, so nothing leaves the site") does NOT hold for these pages as measured on `main` `ebc7ee4`: `mount-instance-docs.ts` mounts an instance's `docs/` only as FINISHED HTML after Jekyll, and only when it carries an `index.html`; a Markdown page in `folio-assistant-core/docs/` would never be built. The path that does exist is `compose-docs.ts` `composedInstances()`: a directory declared `composed: true` is copied into the Jekyll source under `/<instance>/` BEFORE the build, with full chrome. So a moved page's URL changes to `/<instance>/<slug>.html`; the page count is unchanged.
Missing piece: `gen-docs-pages.ts` hard-wires its root to cat-harness, so it cannot render a manifest that lives in core or sci. Requested from the coordinator (code lane) 2026-10-06.
Open owner question: redirects from the old URLs, or a clean break (as ruled for smart-trust under `mftp`).

_2026-10-16T06:30:00Z_ — Blocks lifted: `63wl`, `apcg` are completed in every store. Owner ruling 2026-10-16 (item 1): lift the stale blocks on claimed beans whose blocker is closed; the claim itself is untouched. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

## 2026-10-16 — not complete (investigated, Owner ruling 2026-10-16, item 2)

PR litlfred/folio-assistant#2260 merged 2026-10-08 (826dc237), but its only change is this bean file: it recorded the claim and the design finding, and its own status list leaves every move unticked. On cat-harness main on 2026-10-16 the pages are still there: `docs/concepts/content-types.md`, `docs/fhir/ig-publisher.md`, `docs/fhir/fhir-content.md`, `docs/guides/document-ingestion.md`. Neither box can be ticked: `docs:pages:check`/`translated-links:check` green and an unchanged page count are only evidence once the pages have moved. Still open: the multi-root `gen-docs-pages` change, the owner's redirects-or-clean-break question, the move, and then both boxes. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-24T08:15:06Z_: Claimed by the README regen thread (session https://claude.ai/code/session_01FUCxDH4Xeea4eUzZ5TaPL5). Six of the nine pages already moved in M6–M8 (cat-harness#445). The last two, ig-publisher and fhir-content, move in fhir-harness#148, smart-base#149, cat-harness#498 and cat-harness-tools#683, with a clean break as in M6–M8.
