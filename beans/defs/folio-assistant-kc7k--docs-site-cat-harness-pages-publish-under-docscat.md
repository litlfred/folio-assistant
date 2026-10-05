---
# folio-assistant-kc7k
title: 'Docs site: cat-harness pages publish under /docs/cat-harness/, not the site root (#2188)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T14:02:31Z
updated_at: 2026-10-05T18:34:45Z
parent: folio-assistant-0lmb
---

Owner ruling 2026-10-05: cat-harness docs move from the site root to /docs/cat-harness/, a clean break with no redirects, so they cannot collide with instance mounts, graph-kind directories, locales or exports at the root (108 root entries; architecture and skills already share a page and a directory stem). Issue #2188. Supersedes the open question in 8h42. Done when: the published site serves cat-harness pages under /docs/cat-harness/; the root has only a landing page plus the non-doc exports; inbound absolute links are rewritten; the docs build and gates are green.


## Progress 2026-10-05 (implementation session)

Commits on claude/docs-under-docs-cat-harness: 467069e607a9 (mechanism: docs-route, hoist, root landing, workflows), d2e1d97dcacc (consumers), 265add1345bd (docs/skills/link rewrites), ca63971a0d3c (checks/tests), ab51fe054aa3 (regenerated artefacts), feed2b5d6102 (cross-base link fixes found by the preview link check).

Verified: preview:site builds docs/cat-harness/architecture.html, root architecture.html absent, 584 @id-addressed JSON-LD documents hoisted to the root, root landing lists docs/cat-harness and docs/who-iris. Not verifiable locally: TypeDoc, the kg viewer, the STAGING build, the remote theme.
