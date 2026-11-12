---
# folio-assistant-9y9s
$schema: bean/1.0.0
title: 'Memory: How to reach a staging preview''s review (diff) page, and the banner link (cat-harness-tools#1318, merged)'
status: completed
type: task
priority: low
created_at: 2026-11-01T21:20:22Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `staging-review-link.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How to reach a staging preview's review (diff) page, and the banner link (cat-harness-tools#1318, merged)

A staging preview's review page lives at `<root>/review/` (FHIR IG, e.g. smart-trust) or `<root>/<locale>/review/` (folio), where root is `…/STAGING/<branch>/`.

Thread "Link staging pages to their review diff" (cmsg_017WNUkNK8kdDziPK58Pv6G9NFzNe3gVZNMjzbGDNudwWS). Q-REV-1 A (user tap 21:19Z): bold "🔍 Review changes" link in the green banner after the branch chip, found by HEAD probe (the staging service worker only intercepts GET). cat-harness-tools#1318 MERGED 2026-11-01 21:20Z as be9d8b0 (issue #1317). Shows on a site once it re-pins cat-harness-tools and restages; smart-trust re-pin handed to the re-pin train thread (…MmDK4fGPz89Zs2mtVYEY36). smart-trust has no standing-repin caller.

github.io is blocked from the sandbox; check deployed files with `git fetch --depth 1 --filter=blob:none origin gh-pages` and `git ls-tree FETCH_HEAD`.
Related: folio-assistant-q9rj, folio-assistant-y63k.
