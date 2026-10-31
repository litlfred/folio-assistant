---
# folio-assistant-avcq
$schema: bean/1.0.0
title: 'terminology-sw.js says no request reaches the network, but unanswered cross-origin requests go out'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-31T04:20:00Z
updated_at: 2026-10-31T04:15:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
---

**Category:** correctness · **severity:** minor

**Where:** litlfred/fhir-harness `scripts/terminology-sw.js` header (lines 2-5: "every request to another origin is answered from this site … and none reaches the network") against line 44: `if (!a) return fetch(e.request);`.

**Evidence:** when `faTerminologyMap.answer` has no answer, the service worker forwards the original cross-origin request. Whatever the NLM Form Builder sends (terminology lookups that can carry typed form text) then reaches the third-party host, which the comment and the owner's design note (2026-10-14) say should not happen.

## Done when
- [ ] either unanswered cross-origin requests get a local 404/503 response, or the comment says they are forwarded and why

_2026-10-31T04:20Z_ — Filed by the group C security review, session https://claude.ai/code/session_01Qmmkt67jRwiqwomTe2Sw4b

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).
