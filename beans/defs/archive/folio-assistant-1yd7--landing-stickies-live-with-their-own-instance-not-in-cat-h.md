---
# folio-assistant-1yd7
$schema: bean/1.0.0
title: 'LANDING STICKIES: each instance''s sticky lives in its own folio/, not in cat-harness/folio/'
status: completed
type: task
priority: normal
created_at: 2026-10-07T21:46:20Z
updated_at: 2026-10-12T17:00:00Z
parent: folio-assistant-7x5n
---

## What

`cat-harness/folio/` holds the landing stickies (`folio-landing-sticky/v1`) for
other instances, beside its own `cat-harness.json`:
`who-iris.json`, `bootstrap.json`, `folio-assist-core.json` and `folio-assistant.json`.
Measured on main 33bf3d2, 2026-10-07.

Each sticky belongs in the `folio/` directory of the instance it describes.

## Why now

The separation (ar1s) moves instances to their own repositories and remote-mounts them.
With the stickies left where they are:
- who-iris's sticky would ship in the cat-harness repository, not in who-iris;
- cat-harness, the platform, would carry content about the layers above it.
That points upward, the direction the separation exists to remove.

Note also: `ensure-landing-sticky.ts:393` says `cat-harness/folio/folio-assistant.json`
was pruned on 2026-09-30, but the file is present on main. Find out which is right.

## Done when

- [x] Each instance's sticky sits in its own declared `folio/` directory, declaring one where
  missing, and only if the instance renders a landing.
- [x] The landing composition (`gen-landing-data`, `ensure-landing-sticky`) reads stickies from
  every instance's `folio/`, mounted ones included, and not from cat-harness's only.
- [x] For a mounted instance, the sticky arrives with the mount.
- [x] The route `<base>/cat-harness/folio/` (the folio graph viewer) still shows cat-harness's
  own folio graph.

## Closed 2026-10-09

Committed in `cat-harness` as `54826e6e` (`feat(folio): landing stickies live in their own instance folio directory (1yd7)`):
- `stickyPathForContribution`: reads stickies from each declaring instance's own declared `folio/` directory (`instanceRoot`), supporting remote-mounted and local nested instances.
- `ensureLandingSticky`: writes stickies to each local instance's own folio directory; skips writing to remote-mounted instances (`isMounted`) where the sticky arrives with the mount; prunes foreign stickies from `cat-harness/folio/`.
- Pruned foreign stickies (`who-iris.json`, `folio-assist-core.json`, `bootstrap.json`, `folio-assistant.json`) from `cat-harness/folio/` and moved them to their respective instance directories (`who-iris/folio/`, `folio-assistant-core/folios/`, `bootstrap/folio/`).
- Updated `index.config.json` with `"site": { "landing": "cat-harness" }` to resolve the site landing instance.
- Updated `scripts/tests/ensure-landing-sticky.test.ts` to assert stickies are written to and read from each instance's own folio directory.
- Regenerated `docs/_data/stickies.json`, `docs/assets/folio/index.json`, and `docs/cat-harness/folio/index.html`.
- Verification evidence:
  - `bun test scripts/tests/ensure-landing-sticky.test.ts`: 36 pass, 0 fail (106 expect() calls)
  - `bun run scripts/ensure-landing-sticky.ts --check`: pass (✓ folio declared at folio/, 2 sticky/ies up to date)
  - `bun run scripts/gen-landing-data.ts --check`: pass (stickies.json is up to date (2 sticky/ies))
  - `bun run scripts/gen-folio-viz.ts --check`: pass (1 sticky(ies) across 1 declared director(ies))
  - `bun cat-harness/scripts/run-script.ts check:harness-dirs`: pass (consistent)

## Provenance

Owner, 2026-10-07, in session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92, asked
whether `<base>/folio/` and `<base>/cat-harness/folio/` were duplicates. They are not: only
the second is published. The answer surfaced the misplaced stickies, and the owner chose to
open this bean and tell the separation session.


## 2026-10-09 — the who-iris half (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)

`54826e6e` emptied `cat-harness/folio/` of other instances' cards; who-iris never took its own. Two defects, both fixed:
- **cat-harness** (`ensure-landing-sticky`, branch `claude/mount-render-md`): run from a separated instance's repository the script resolved its root from its own location — the REMOTE MOUNT — so it wrote cards into gitignored mounts and never declared a folio graph in who-iris. It now takes an instance directory, and a mounted layer's card is reported `mounted`: never written, not counted by `--check`. Tests watched red on the old script.
- **who-iris** (`c211186`): `folio/` declared (surgical splice) and `folio/who-iris.json` written by that tool; `landing:sticky[:check]` scripts. Declaring `folio` changes no mount route (checked).
- Done-when 2 and 3 (landing reads every instance's folio, mounted ones arrive with the mount) hold through `stickyPathForContribution`; 4 (`/cat-harness/folio/` shows cat-harness's own) is cat-harness's site, untouched.
- Remaining: merge, then the who-iris pin move.

## 2026-10-09 — who-iris's half is LIVE; the bean is not done (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)

who-iris declares `folio/` and holds `folio/who-iris.json` (litlfred/who-iris #22), and its site is published from it (gh-pages `9255288`, Pages run 37977615950 success; `landing:sticky:check` exits 0 in the build). Still open: done-when 1 covers EVERY instance that renders a landing — `ensure-landing-sticky --check` run from who-iris's checkout reported folio-assistant-core's card (`folios/folio-assist-core.json`) and bootstrap's (`folio/bootstrap.json`) missing in their own trees; those land in their repositories. Done-when 4 (`/cat-harness/folio/` on cat-harness's site) not re-measured.

## 2026-10-11 — core's card in core's tree; bootstrap's is a ruling question (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)
- **folio-assistant-core#59 (merged, 672f30f):** adds `folios/folio-assist-core.json`, written by `ensure-landing-sticky.ts .`. Its `--check` exits 0. The card now arrives with the mount.
- **smart-ra:** renders a landing since 2026-10-11, and `ensure-landing-sticky . --check` exits 0 there (3 stickies, mounted).
- **bootstrap: left open for the owner.** `--check` on bootstrap reports no folio declared, no folio/ and no sticky. But ensure-landing-sticky's header records the ruling *"a bare bootstrap instance gets no folio and no cat"*, and bootstrap does publish gh-pages. Either bootstrap's site is not "a landing" in done-when 1's sense, or the ruling yields here. The owner decides which.
- **Not re-measured:** done-when 4 (`/cat-harness/folio/` on cat-harness's site).

## 2026-10-12 — the two loose ends measured; only the bootstrap ruling remains (session https://claude.ai/code/session_017fFnGmbJcfqqrHXz9oqxdG)
- **"Find out which is right" (the `pruned` comment): the comment is right now.** `cat-harness/folio/folio-assistant.json` was removed by `54826e6e` (2026-10-09). On cat-harness main `16b79f6c`, `folio/` holds `README.md`, `cat-harness.json`, `index.md` and `render/` only. The comment is now at cat-harness-tools `scripts/ensure-landing-sticky.ts:410`.
- **Done-when 4, re-measured: it holds for every rendering, and no live site carries the route.** `folio/index.md` (generated by `folio/render/file-list.ts`) lists 2 files, `README.md` and `cat-harness.json`, so any rendering of `cat-harness/folio/` shows cat-harness's own folio only. The route `<base>/cat-harness/folio/` is published only on folio-assistant's gh-pages (`47e7468`, 2026-10-07). That page renders `cat-harness/folio` (meta `renders`), but it was published BEFORE the 2026-10-09 move and has not been republished since. litlfred/cat-harness has no gh-pages, and who-iris's site (`402af64`) does not mount the route. The live github.io page could not be fetched: the proxy refuses `*.github.io`. So this was read from the gh-pages trees.
- **Bootstrap is unchanged and still the owner's call.** litlfred/bootstrap main `7d7d754` (2026-10-08) declares no folio and has no `folio/` and no sticky. It does publish gh-pages. The question stands as written on 2026-10-11: either bootstrap's gh-pages is not "a landing" in done-when 1's sense, so the box is met, or the ruling *"a bare bootstrap instance gets no folio and no cat"* yields and bootstrap gets `folio/bootstrap.json`.
- Status stays **in-progress** until the owner rules on bootstrap.

## Owner ruling 2026-10-12: A1 — closed

Owner, session_017fFnGmbJcfqqrHXz9oqxdG 2026-10-12, answering the 2026-10-12 re-measurement's decision: **"A1"** — bootstrap's gh-pages is not "a landing" in done-when 1's sense, so the ruling "a bare bootstrap instance gets no folio and no cat" stands and the box is met. Every other done-when was already measured met (see the 2026-10-12 section above). Closed.
