---
# folio-assistant-c5fm
title: 'Instantiate folio-assistant-core: config at root so the navbar lists it; declare its docs/'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T14:53:55Z
updated_at: 2026-10-05T14:54:07Z
parent: folio-assistant-0lmb
---

Issue #2196. Owner 2026-10-05 asked whether folio-assistant-core/ is staged and why it is missing from the navbar Harnesses list between WHO IRIS and C@T Harness. Rule: gen-navbar-include.ts lists harnesses with instantiated===true; harness-tiles.ts sets instantiated from <name>.config.json at the root. Core has a declaration but no config.
