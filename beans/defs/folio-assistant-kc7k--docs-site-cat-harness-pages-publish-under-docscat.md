---
# folio-assistant-kc7k
title: 'Docs site: cat-harness pages publish under /docs/cat-harness/, not the site root (#2188)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T14:02:31Z
updated_at: 2026-10-05T14:03:34Z
parent: folio-assistant-0lmb
---

Owner ruling 2026-10-05: cat-harness docs move from the site root to /docs/cat-harness/, a clean break with no redirects, so they cannot collide with instance mounts, graph-kind directories, locales or exports at the root (108 root entries; architecture and skills already share a page and a directory stem). Issue #2188. Supersedes the open question in 8h42. Done when: the published site serves cat-harness pages under /docs/cat-harness/; the root has only a landing page plus the non-doc exports; inbound absolute links are rewritten; the docs build and gates are green.
