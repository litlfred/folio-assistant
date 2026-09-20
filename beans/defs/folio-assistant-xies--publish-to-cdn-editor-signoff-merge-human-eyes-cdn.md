---
# folio-assistant-xies
title: 'PUBLISH TO CDN: editor signoff -> merge -> human eyes -> CDN, and GH Pages is a TOOL CHOICE not the design'
status: todo
type: task
priority: high
created_at: 2026-09-20T09:01:32Z
updated_at: 2026-09-20T09:01:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20, naming the pipeline verbatim:

> 'using ghpages as CDN is a tool choice, other tools possible like cloudflare, doucment that in process/BPMNS/skills, part of publication piepleine, internal publication mamgement: (chief) editor signoff -> merge to main -> huamn eyes review last check -> publish to CDN (requires EXTREME care in URL handling) and make accessible from CDN'

FOUR GATES, and the third is the one that is easy to drop because the second looks like an approval:
1. (Chief) editor signoff — EDITORIAL, on the content.
2. Merge to main — the code gate. Already requires explicit human confirmation here.
3. HUMAN EYES, last check — on the RENDERED artefact, after the merge and before the world sees it. `continual-progress` already measured why this cannot be skipped: a human cannot assess a rendered artefact from a description of it (PR #178, 2026-09-16).
4. Publish to CDN, and make accessible — TWO steps, deliberately. Uploading and exposing are separable, and collapsing them removes the only moment at which a bad URL layout can still be caught.

'EXTREME care in URL handling' is the owner's phrase and it is a REQUIREMENT, not an adverb. What it is about, concretely: a published URL is a promise. Once `/<stub>/who-iris/items/<uuid>` is live and cited, moving it breaks every citation, and a CDN caches the old one for as long as its TTL says. `canonicalUrl` exists in `harness.json` for exactly this and nothing enforces a layout against it.

GH PAGES IS A TOOL CHOICE. `publication.host: github-pages` is already declared per instance and already documented as a THIRD STATE ('an instance that has not said is undefined, and must never be read as github-pages'). The process must be written against the declaration, never against Pages' behaviour — Cloudflare has different cache semantics, different redirect handling and different limits.

## Done when
- A BPMN with the four gates as real gateways in the right lanes.
- Host-specific behaviour reached through `publication.host`, never assumed.
- A URL-layout check that runs BEFORE publish and refuses a layout that would move an existing published path.
