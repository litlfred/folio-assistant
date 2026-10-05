---
# folio-assistant-2vpn
title: who-iris's top LHS navbar mark is the letter 'W', not an icon — and every harness's top mark must come from one mechanism
status: completed
type: bug
priority: high
created_at: 2026-10-04T18:34:12Z
updated_at: 2026-10-05T04:57:30Z
parent: folio-assistant-yg29
---

Owner, 2026-10-04, in session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi, on being asked to sign GOAL 3 off: *"actually no, who-iris is missing top icon on LHS navbar. investigate why and if also try of other harnesses. all needs to be sconsisisten and consolidated"* — with a screenshot of https://litlfred.github.io/folio-assistant/who-iris/ whose `.fa-nav-head` shows a slate tile with the letter **W** beside "WHO IRIS".

## What is known so far

`cat-harness/scripts/lib/navbar.ts` draws the header's `mark` from the instance's avatar when one is supplied and otherwise falls back to the instance's initial (`i.icon ?? i.label.slice(0, 1).toUpperCase()`). That fallback exists on purpose (#1757, owner 2026-10-01: *"each page needs avatar or atleast letter to be clickable"*); the letter is the floor, not the goal. Related, not duplicates: `0w7q` (viewer rail avatar header), `603s` (one themed section per instance), `p5wm` (GOAL 2).

## Done when

- [x] the cause for who-iris is stated with file:line evidence — no declaration, a declaration that does not resolve across the mount, or a caller that never passes the mark — **a caller that never passed it, twice**: `harness-tiles.ts` resolved no glyph mark, and `mount-instance-docs.ts` read `icon` not `mark` (#2121)
- [x] every harness instance's top mark is measured (avatar, glyph, or letter fallback), and the measurement is recorded here — see "Measured 2026-10-04" below
- [x] one mechanism supplies the top mark for every harness; who-iris's top navbar shows a real mark on the published page — confirmed live by the owner, 2026-10-05
- [x] a gate fails when a harness's top mark falls back to its letter, so this cannot recur silently — `check-viewer-nav`'s `declared-mark` flag (#2121)


## Measured 2026-10-04 — every harness's top mark

Before #2121, the committed viewer pages drew an image only for cat-harness (its declared `icon`); every other harness drew its letter, who-iris included, although four of them already had a theme card avatar or a registry glyph.

After #2121 (one resolver in `harness-tiles.ts`: theme avatar, then declared icon, then registry glyph; one reader, `lib/harness-mark.ts`): who-iris draws the WHO emblem (owner, 2026-10-04: restore it); smart-base its glyph; folio-assistant, folio-assistant-core, bootstrap, cat-harness and smart-trust their theme card avatars. The seven with no mark at all — smart-ig, smart-immunizations, folio-assistant-sci, fhir-harness, cat-openapi, cat-harness-tools, bootstrap-tools — get registry glyphs in the follow-up PR, by the owner's choice ("Glyphs I propose"). After it, `harness.json` has no harness without a mark.

Open: box 3's "on the published page" is verified only from the committed pages and gates — github.io cannot be fetched from the measuring container, so the owner's own look at the deployed who-iris page is the last check. Also open, and the owner's: whether smart-trust should keep the generic operations card its theme gives it.

Session: https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi


## Closed, 2026-10-05 — the last box confirmed by the owner

Box 3's remaining half, *who-iris shows a real mark on the published page*, could not be checked from the measuring container (github.io egress is blocked). The owner checked it: asked to look at https://litlfred.github.io/folio-assistant/who-iris/, they confirmed **"GOAL 3: emblem is live"** (session https://claude.ai/code/session_01Ga3HjmX3ag9vTgZWDSmsFi). Every box is now met: one resolver and one reader (#2121), every harness with a mark (#2122, #2127), and the `declared-mark` gate.
