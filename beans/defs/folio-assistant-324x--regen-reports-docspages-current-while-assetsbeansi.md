---
# folio-assistant-324x
title: regen reports docs:pages current while assets/beans/index.json is stale
status: todo
type: bug
priority: normal
created_at: 2026-10-04T07:18:41Z
updated_at: 2026-10-04T07:18:41Z
parent: folio-assistant-hfag
---

Measured twice on #1955 (2026-10-04, after main merges that took main's copy of cat-harness/docs/assets/beans/index.json by the site-data pattern): the file lacked `edges` (bean vhqq), check:kind-validators:require-all failed in CI, yet `bun run regen` reported docs:pages:check current. Running `bun run docs:pages` rewrote it with 86 edges each time. So docs:pages:check does not compare this asset, and regen cannot repair what its check does not see.

## Done when
- docs:pages:check fails when assets/beans/index.json differs from what docs:pages writes (or the asset gets its own declared check/writer pair)
- a test pins it
