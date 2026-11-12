# Apps — as-is intent

## Covers

- Declared visualiser `cat-harness/apps` (cat-harness `visualisers`, `renderedBy: web-app-build`, `coversKinds: ["web-app"]`).
- Generator: the Tool `web-app-build` (`bun run cat web-apps:build`). It writes the index at `<base>/<locale>/cat-harness/apps/` and each app's own build at `apps/<id>/`. Both are built at publish.
- Drawn from the index the generator writes (`indexHtml`). It shows one built app and one that failed, plus the empty state.

## Who it is for, and what they need to do

- **Reader:** anyone looking for the interactive apps a site carries, such as a game or a simulation.
- **Tasks:** find an app, see which layer it comes from, its languages and its size, and open it.

## What it must show (read off the generator)

- an `h1` "Apps" and one sentence saying that each app opens on its own page without the site's frame, and loads only when opened
- one entry per declared `web-app` directory: its title, linked relatively to `<id>/`, then its description, its layer, its languages and the size of its build
- an app over its `sizeBudgetMB`, flagged in words ("over its N MB budget")
- an app that did not build, named with the reason and **no link**
- with nothing declared, a sentence saying so, never an empty list

## Observed

Regions in reading order: strip; title; framing sentence; the list of apps.

Mobile (≤ 390): entries stack, and long codes break inside their text.

## Findings

1. **The app pages carry no site chrome.** The index links out to them, and each app page is marked with the navbar opt-out, so the chrome stops at the index.
