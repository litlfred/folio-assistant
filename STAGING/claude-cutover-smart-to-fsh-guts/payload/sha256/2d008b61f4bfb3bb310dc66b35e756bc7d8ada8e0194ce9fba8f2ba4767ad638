---
# folio-assistant-p3zo
title: 'AGENT CONTAINERS RUN THE WRONG BUN: the session-start hook should install .bun-version (1.3.14), not leave the container''s 1.4.2'
status: todo
type: bug
priority: normal
created_at: 2026-10-06T07:51:12Z
updated_at: 2026-10-06T07:51:12Z
parent: folio-assistant-1xhc
---

Follow-up to `3ozg` (completed), which pinned Bun to `.bun-version` (1.3.14) in all 22 CI `setup-bun` sites, **but not in agent containers**.

## The cost, measured 2026-10-06
Three sessions in one morning were caught by it:
- Session A: a false `navbar-assets` failure, chased as a main defect;
- the coordinating session: local gates diverging from CI;
- Session F: about to hold PR #2262 for a "main fix" that wasn't needed.

The container default is Bun **1.4.2**, which minifies `navbar.js` differently, so `navbar-assets.test.ts` fails locally and passes in CI.

## The working install path (`bun.sh` is blocked by the proxy)
```sh
cd /tmp && npm pack @oven/bun-linux-x64@$(cat .bun-version) && tar xzf oven-bun-linux-x64-*.tgz
# then put package/bin first on PATH
```

## Done when
- [ ] the session-start hook (`.claude/settings.json` → `session-start-coord-sweep.sh`, or a sibling script) installs the version in `.bun-version` when `bun --version` differs, through the npm route, and puts it first on PATH for the session
- [ ] it says plainly when it could not install (could-not-determine, never silent), and leaves the container Bun in place
- [ ] a fresh container's `bun --version` equals `.bun-version`, checked in a new session

Owner's default choice, 2026-10-06 (https://claude.ai/code/session_012qoycyCSGidZqW245vXhze): bean it for later, not separation work.
