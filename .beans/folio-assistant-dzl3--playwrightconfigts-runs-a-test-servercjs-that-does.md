---
# folio-assistant-dzl3
title: playwright.config.ts runs a test-server.cjs that does not exist — bunx playwright test fails before any test
status: todo
type: bug
created_at: 2026-09-18T17:59:38Z
updated_at: 2026-09-18T17:59:38Z
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
