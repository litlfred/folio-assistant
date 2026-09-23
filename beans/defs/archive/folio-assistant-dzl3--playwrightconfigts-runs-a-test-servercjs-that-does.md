---
# folio-assistant-dzl3
title: playwright.config.ts runs a test-server.cjs that does not exist — bunx playwright test fails before any test
status: completed
type: bug
priority: normal
created_at: 2026-09-18T17:59:38Z
updated_at: 2026-09-20T16:38:20Z
parent: folio-assistant-1xhc
---

AGENTS.md lists `bunx playwright test` under Commands. It cannot work:
playwright.config.ts has

    webServer: { command: 'node test-server.cjs', port: 8080 }

and test-server.cjs is absent from the repo and not in .gitignore, so the run
dies with MODULE_NOT_FOUND before a single test executes. Confirmed absent on
origin/main, so this is not a local-checkout problem.

Found 2026-09-18 while adding tests/sidebar-panels.spec.ts. Worked around with
playwright.ui.config.ts, which has no webServer because that spec builds its
own DOM via page.setContent — but that is a workaround for server-less specs
only, and any spec that needs a served site is still unrunnable.

Two things to settle: whether test-server.cjs was deleted or never committed
(git log the path), and what it should serve — the built _site, or docs/ raw.

Note also PLAYWRIGHT: the installed @playwright/test wants a
chrome-headless-shell build this image does not carry; it ships Chromium under
PLAYWRIGHT_BROWSERS_PATH. playwright.ui.config.ts sets executablePath
accordingly, overridable via PLAYWRIGHT_CHROMIUM_PATH. The main config does
not, so it would fail on browser launch even once the server exists.

_2026-09-19T00:35:16Z_ — Verified resolved, 2026-09-19 on main at 1a94703. Commit 05f18cc landed test-server.mjs, repointed playwright.config.ts at it, folded the executablePath guard into the main config, and retired playwright.ui.config.ts. Ran 'bunx playwright test' with PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium: 29 passed in 7.8s across kg-viewer, qa-panel, sidebar-panels and a new test-server spec. Both faults this bean named are closed. NOT closing it — not my bean to resolve.


## 2026-09-20 — closed on re-measurement (`0pes`)

`bean-coordination` now says a bean closes on **evidence, not authorship**, so
the *"NOT closing it — not my bean to resolve"* above no longer holds it open.
Re-derived rather than read off that note:

- `test-server.mjs` exists (4637 bytes, 2026-09-18);
- `playwright.config.ts:61` runs `node test-server.mjs`, and its comment cites
  this bean by id — *"referenced here long before it existed — see bean `dzl3`"*;
- the browser half is closed too: the config carries the `executablePath`
  guard, and `playwright.ui.config.ts` is retired;
- the 5 specs in `cat-harness/test/test-server.e2e.ts` pass in `bun run gates --all`,
  including *"refuses to serve outside its root, including percent-encoded traversal"*.

Both faults this bean named are gone.

## CLOSED 2026-09-20 — verified fixed, not assumed

Re-measured before working it, because a bean asserting `bunx playwright test`
cannot run sat beside a session that had run it successfully several times.

    playwright.config.ts:60   command: 'node test-server.mjs'
    ls test-server.mjs        present
    bunx playwright test …    EXIT=0

The config's own comment records the fix and cites this bean: *"`test-server.mjs`
serves the repo root statically. It was referenced here long before it existed
— see bean `dzl3` — so no e2e test in this repo was runnable until it was
written."*

So the file was written and the reference repointed from the `.cjs` that never
existed. Branch `claude/test-server-dzl3` is where it came from. Closed on the
measurement rather than on the comment: the comment says what someone intended,
the exit code says what happens.
