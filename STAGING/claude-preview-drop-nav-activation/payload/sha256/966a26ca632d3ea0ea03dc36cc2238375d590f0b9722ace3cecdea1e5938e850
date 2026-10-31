---
# folio-assistant-zvl0
$schema: bean/1.0.0
title: 'IG staging banner names the PR on a manually dispatched build'
status: completed
type: bug
priority: low
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-24T14:00:00Z
parent: folio-assistant-1xhc
---

Found walking #215 on smart-immunizations-uganda#12 (see lx2s). A `site-publish.yml` run started by `workflow_dispatch` has no PR in its event, so `staging.json` records `"pr": "n/a"` and the banner reads "PR #n/a", even though the branch has an open PR (#12). It falls back to a PR search link.

## Done when
- [x] a dispatched preview looks up the open PR for its branch (REST `pulls?head=owner:branch`) and the banner and `staging.json` name it
- [x] with no open PR, the banner says so in words, not "#n/a"

_2026-10-24T13:45Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx. Plan: fhir-harness `igPreviewData` looks up the branch's open PR over REST; cat-harness-tools' banner says "no open PR" in words when there is none.

_2026-10-24T14:00Z_ — Done: fhir-harness#167 (merged a2e9404) looks the PR up, from a pull_request event's payload or REST `pulls?head=owner:branch`. It had written `"n/a"` on every event, not only on dispatch. cat-harness-tools#750 (merged 483e6a1) makes the banner say "no open PR found". Issue fhir-harness#166. Session https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx
