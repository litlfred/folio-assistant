---
# folio-assistant-5o5c
$schema: bean/1.0.0
title: Root-dependent platform outputs judged on a foreign content root (translation:obsolete, state:visualizer, processes:render)
status: completed
type: bug
priority: high
parent: folio-assistant-1xhc
tags:
    - ci
    - gates
created_at: 2026-10-21T15:37:07Z
updated_at: 2026-10-23T09:00:00Z
---

Measured on litlfred/smart-immunizations#66 (run 39619275196, every layer at main, 2026-10-21). Three gates fail on a content root for platform artefacts that only the DECLARING checkout produces, so no data PR can make them pass everywhere — committing what smart-immunizations' root builds makes folio-assistant's own run stale, and the reverse.

Same family as cat-tools-x5e0 (a content index's gate judging state only the declaring checkout has).

## Cases
1. **`translation:obsolete:check`** — `cat-harness/translations/{ar,zh}/process/publication-workflow.po`, 19 stale of 207. The stale msgids are the per-page "✎ Edit docs/source/process-publication-workflow/…" links, which are built per root. Against cat-harness main's own `docs/process/publication-workflow.md` the same catalogues are 0 stale (checked 15:30Z).
2. **`state:visualizer:check`** — `docs/en/cat-harness/qa/smart-immunizations/index.html` stale, `code/smart-immunizations/index.html` missing, `code/index.html` stale. `cat-harness.json` declares these `because: "checkout"` (one page per instance in the checkout), yet cat-harness tracks them.
3. **`smart-base:processes:render:check`** (possibly separate): 6 SVGs stale on the runner but unchanged when re-rendered locally against bootstrap-tools main dc87778 (lane S). Either root-dependence or renderer install drift; decide which.

## Options
- A: a gate run on a foreign root skips (with reason) outputs declared `because: "checkout"` / root-built, judging them only on the declaring repo's own run.
- B: stop committing checkout-dependent pages; build them at publish (as cat-harness#363 did for library pages).
- C: make the outputs root-independent (edit links relative to the instance, not the root).

## Done when
smart-immunizations#66's head (all layers at main) shows none of cases 1–3 as NEW, and folio-assistant's own gates stay green.

## 2026-10-22 — case 2 fixed in litlfred/cat-harness#410

`qa/smart-immunizations/`, `code/smart-immunizations/` and `code/index.html` are now declared `builtAtPublish` (`because: "checkout"`) beside their siblings, gitignored, and no longer tracked. Cases 1 (`translation:obsolete`, root-built edit links) and 3 (`smart-base:processes:render`) are still open; options A–C above stand for them.

## 2026-10-22 — case 3 diagnosed (lane B2): renderer install drift, not root dependence

`bpmn-js` 18.31.1 was published 2026-10-21, the same day as run 39619275196. `bootstrap-tools` declares `"bpmn-js": "^18.25.1"`, a range, while it pins `playwright` exactly. folio-assistant's `bun.lock` pins 18.31.0, but smart-immunizations commits no `bun.lock`, so its CI install takes the newest release.

Measured with smart-base 16cc526 in the index:
- **18.31.0:** all 6 SVGs are current, matching lane S's local result.
- **18.31.1:** the same 6 are stale: diig-investment-path, SGAuthoring.DAKLifecycle, dak-l3-ig, l2-component-edit-review, l2-dak-authoring and smart-guideline-end-to-end.
- **What changes:** label placement only. External labels are re-centred with wider boxes; for example `StartEvent_L2Ready_label` moves from x 246 to 225 and its width from 69 to 110.
- **Same version, either root:** both checkout roots draw identical bytes, because the renderer resolves `bpmn-js` from wherever bootstrap-tools resolves it.

Proposed remedies:
1. (recommended) Pin `bpmn-js` exactly in `bootstrap-tools/package.json`, as `playwright` already is. At 18.31.0 every committed SVG stays current; moving to 18.31.1 would need a re-render PR wherever SVGs are committed.
2. smart-immunizations commits a `bun.lock`. This fixes only that root.
3. Both.

Option 1 lives in litlfred/bootstrap-tools, which this lane's session cannot write to.

## 2026-10-22 — case 1 fixed (owner ruling C): edit links name the declared repository

`gen-docs-pages` took each edit link's `data-repo` and href from the generating checkout's `origin` (`REPO_WEB`). That rendered line is a msgid in `cat-harness/translations/{ar,zh}/process/publication-workflow.po`, so the catalogue was obsolete under every other root. Separately, the link was dead: `docs/source/…` is instance-relative. `declaredEditLocation` now links the declared `repository` of the instance whose root holds the file. Tools: litlfred/cat-harness-tools#555. Data (17 pages, 19 verbatim chrome msgids obsoleted, no translation lost): litlfred/cat-harness#415. The order is tools PR, then data PR, then index re-pin. Verified from an index checkout: `translation:obsolete:check`, `translation:pot:check` and `docs:pages:check` all pass.

_2026-10-22T16:44:00Z_ — Case 3 fix merged: litlfred/bootstrap-tools#33 (3d5e5dc) pins bpmn-js at exactly 18.31.0. Lane C carries it in the next index re-pin. Lane S re-runs smart-immunizations#66 afterwards to confirm all three cases. Session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6.

_2026-10-22T17:11:00Z_ — Case 1, tools half merged: litlfred/cat-harness-tools#555 as merge commit 98b63b1 (second parent c481a84, which index #2628 pins). The data half, litlfred/cat-harness#415, waits for #2628 on index main. Recorded by the coordinator.

_2026-10-23T08:00:00Z_ — Follow-up comment fix `litlfred/cat-harness-tools#567` (`2c98050da7`) merged; `litlfred/cat-harness#415` (`dba6944dd6`) and index re-pin `litlfred/folio-assistant#2632` (`8d8ef63b57`, superseding `#2628`) are open in CI.

_2026-10-23T08:28:00Z_ — Case 1 data half merged: litlfred/cat-harness#415 as merge commit f68c495 (second parent dba6944, pinned by index #2628). Tools half: #555 (98b63b1) plus #567 (2c98050). Case 3: bootstrap-tools#33 (3d5e5dc). All three are in #2628. Once it merges, lane S re-runs smart-immunizations#66, and that run is the done-when. Recorded by the coordinator.

## Summary of Changes (completed 2026-10-23)

All three cases are fixed. The done-when run, smart-immunizations#66 at b89d8ca, is green: "No new failures (tests and gates)" passes with every layer at main (cat-harness f68c495, tools 05fa7f1, bootstrap-tools c39448f, smart-base 4065d9e). Lane S verified it at 08:58Z.
- **Case 1** (`translation:obsolete` root-dependent): owner ruling C, root-independent edit links. tools#555 (98b63b1) and #567 (2c98050) make `gen-docs-pages` name the declaring instance's repository. cat-harness#415 (f68c495) regenerates the pages and drops 19 verbatim chrome msgids.
- **Case 2** (`state:visualizer`): cat-harness#410 builds those pages at publish.
- **Case 3** (`processes:render`): owner option 1. bootstrap-tools#33 (3d5e5dc) pins bpmn-js at exactly 18.31.0.

Coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6.
