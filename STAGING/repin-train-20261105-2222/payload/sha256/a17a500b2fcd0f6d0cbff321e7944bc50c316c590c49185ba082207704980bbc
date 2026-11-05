---
# folio-assistant-sbpn
$schema: bean/1.0.0
title: 'smart-ra block panel: left-gutter 📣, greyed section 🔗, filtered public comments (handover bean)'
status: completed
type: task
priority: high
created_at: 2026-11-02T18:28:00Z
updated_at: 2026-11-05T13:45:30Z
parent: folio-assistant-4j43
tags:
    - smart-ra
    - block-panel
    - handover
---

## How to resume (read this first)

Thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9CfR3dCkpEywQvvyu4GcPA6
Page: https://litlfred.github.io/smart-ra/en/dpi-h-ra/index.html (lazy themed page; `index.hydrated.html` is standalone).
Resume prompt: "read bean folio-assistant-sbpn on branch cat/cat-harness/beans of litlfred/folio-assistant and continue the smart-ra block panel work".

## Owner's design (2026-11-02, in order; later wins)

- One small faint 📣 per block opens one panel: copy-link button, suggest / feedback / edit (with one-line explanations), then the block's public comments.
- No right gutter. 📣 sits in the LEFT gutter (the theme's heading-anchor gutter).
- Only one anchor: the theme's own `a.anchor-heading` 🔗, always visible but grey; full colour while the pointer is over the heading OR anywhere in its section. No extra 🔗 on blocks (the panel's copy button covers them).
- Public comments in the panel: PCs only (no change-set links), only the selected block's, filter chips + search when long + "Show more" (card Q-RA-PC-1 closed as A).
- Merge non-content PRs on green ("then merge"). smart-ra publishes ≥15 min apart. Don't push to smart-ra#228 (cascade/re-pin prep thread owns it).
- Bookmark/pin-any-graph-kind-to-folio idea was handed to the coordinator for its own thread.

## Plan

1. [done] core#612 scopeCss fix (merged 17:55Z, `04784f38afb8`).
2. [MERGED 18:57Z] core#616 (issue #615, branch claude/lazy-shell-frame-balance, `3c13890e8ce4`): splitBlocks moves a `.fa-numbered` frame opener into its block; right-gutter CSS removed. Merge on green.
3. [MERGED 19:31Z] cat-harness-tools#1411 (branch claude/single-feedback-trigger, `c6e3d1b9b1c2`) — runtime `src/core/edit-links.ts`: 📣 trigger, unified panel, left-gutter float, greyed heading 🔗 + `.fa-hot` section hover, lazy block-anchor hidden by CSS. cat-harness#981 = regenerated `site-chrome/assets/js/edit-links.js` (`615da9742735`, MERGED 18:50Z). Follow-up asset regen = cat-harness#994 (branch claude/left-gutter-padding, `356ca7a7b071`, MERGED 19:18Z).
4. [MERGED 18:39Z] core#620 (issue #619, `fd225d816575`): comments pane filter + show more, PCs only — branch claude/panel-comments-filter off main, `scripts/public-comment-site.ts` overlaySnippet.
5. After 2–4 merge: tell the cascade/re-pin prep thread (…FDPvN5ktTn4HS2iruRVeZj) so smart-ra#228 takes core ≥ #616 + the comments PR, and tools/cat-harness ≥ #1411/#981. Then republish smart-ra and verify on the live page (screenshot to thread).
6. Resolve the thread when the live page matches.

## Local test rig

`python3 -m http.server 8766` serving /home/claude/srv (sparse gh-pages copy under `smart-ra/`). Test page `smart-ra/en/dpi-h-ra/new.html` with the runtime and comments scripts inlined; regenerate the asset with `bun -e 'import {editLinksAsset} from "./cat-harness-tools/src/core/edit-links.ts"; ...'`. Playwright scripts in /tmp/claude-0/ (lg.js).

## Log

_2026-11-02T18:28Z_ — bean created. Steps 1–3 pushed; step 4 coded, being tested.
_2026-11-02T18:33Z_ — core#620 opened (issue #619). All four PRs (core#616, core#620, tools#1411, cat-harness#981) pushed and tested locally; CI queued. Next: merge on green, then step 5.
_2026-11-02T19:13Z_ — merged core#616, core#620, cat-harness#981. Open: tools#1411 (c0b3191) + cat-harness#994, merge on green; then step 5 (re-pin via cascade thread, republish smart-ra ≥15 min apart, verify). dth-pc duplicated flattened-table blocks (p-ch04-page-041 etc. on claude/dth-pc-scaffold) handed to coordinator for the dth-pc thread. All work committed and pushed.

_2026-11-05T13:34:51Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-05T13:45:30Z_ — Completed on verified evidence across all three repos (`origin/main`): `litlfred/folio-assistant-core#612` (`04784f38afb8a1e3afb248f2300fd7c3b52500cd`), `#616` (`3c13890e8ce4f5d08dcd3cb03992c3289a7b89a4`), and `#620` (`fd225d816575bf571b7b6e78e4fbee78b35ccd50`); `litlfred/cat-harness-tools#1411` (`c6e3d1b9b1c2175122134cff9a340af22e9e15c6`, `2026-11-02T19:31:42Z`); and `litlfred/cat-harness#981` (`615da9742735166d5c6cb72d5f1c4a5cf5f5a87f`) + `#994` (`356ca7a7b07119c5c4ba16ec060405a81fd80f45`, `2026-11-02T19:18:11Z`). Verified `site-chrome/assets/js/edit-links.js` on `cat-harness` `origin/main` and closed `litlfred/cat-harness-tools#1410` with full SHA evidence. (`smart-ra#228` remains owned by the cascade/re-pin prep thread.)
