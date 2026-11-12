---
# folio-assistant-lm5l
$schema: bean/1.0.0
title: 'Memory: Syntax-colored JSON across harnessed sites — issue cat-harness#1241, PR #1242, Q-JSON-1 = B (highlight.js, dynamic load)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `colored-json.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Syntax-colored JSON across harnessed sites — issue cat-harness#1241, PR #1242, Q-JSON-1 = B (highlight.js, dynamic load)


User (11-11) wants JSON displays colored on all sites. JSON is mostly filled in the browser (fhir-harness ig-pages resource-json.js, ig-api-view.js; cat-harness site-chrome docs-ui.js tool outputs), so Rouge can't reach it. IG sites compose cat-harness site-chrome, so one fix there covers all.

Q-JSON-1 = B, "dynamic load" (user 10:49Z 11-11). Built: site-chrome/assets/js/code-highlight.js (MutationObserver; lazy-loads vendor/highlight/highlight.min.js = hljs 11.11.1 core+json+xml, ~9 KB gz, + assets/css/code-highlight.css only on pages with blocks). PR cat-harness#1242 MERGED 19:37Z 11-11 (full tier green). Not covered: cat-harness-tools paper viewer, raw .json links. Thread cmsg_017WNUkNK8kdDziPK58Pv6G9GFo3mVUhNDgAht9V8LF2yf.
