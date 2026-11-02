---
# folio-assistant-sbpn
$schema: bean/1.0.0
title: 'smart-ra block panel: left-gutter 📣, greyed section 🔗, filtered public comments (handover bean)'
status: in-progress
type: task
priority: high
created_at: 2026-11-02T18:28:00Z
updated_at: 2026-11-02T18:28:00Z
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

1. [done] core#612 scopeCss fix (merged 17:55Z).
2. [pushed] core#616 (issue #615, branch claude/lazy-shell-frame-balance): splitBlocks moves a `.fa-numbered` frame opener into its block; right-gutter CSS removed. Merge on green.
3. [pushed] cat-harness-tools#1411 (branch claude/single-feedback-trigger) — runtime `src/core/edit-links.ts`: 📣 trigger, unified panel, left-gutter float, greyed heading 🔗 + `.fa-hot` section hover, lazy block-anchor hidden by CSS. cat-harness#981 = regenerated `site-chrome/assets/js/edit-links.js` (same branch name). Merge both together on green.
4. [in progress] core: comments pane filter + show more, PCs only — branch claude/panel-comments-filter off main, `scripts/public-comment-site.ts` overlaySnippet. Needs issue + PR, local browser check, merge on green.
5. After 2–4 merge: tell the cascade/re-pin prep thread (…FDPvN5ktTn4HS2iruRVeZj) so smart-ra#228 takes core ≥ #616 + the comments PR, and tools/cat-harness ≥ #1411/#981. Then republish smart-ra and verify on the live page (screenshot to thread).
6. Resolve the thread when the live page matches.

## Local test rig

`python3 -m http.server 8766` serving /home/claude/srv (sparse gh-pages copy under `smart-ra/`). Test page `smart-ra/en/dpi-h-ra/new.html` with the runtime and comments scripts inlined; regenerate the asset with `bun -e 'import {editLinksAsset} from "./cat-harness-tools/src/core/edit-links.ts"; ...'`. Playwright scripts in /tmp/claude-0/ (lg.js).

## Log

_2026-11-02T18:28Z_ — bean created. Steps 1–3 pushed; step 4 coded, being tested.
