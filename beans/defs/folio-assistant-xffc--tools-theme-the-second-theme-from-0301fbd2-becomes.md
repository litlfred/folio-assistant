---
# folio-assistant-xffc
title: 'TOOLS THEME: the second theme from 0301fbd2 becomes a KG node, and tools in the KG use it'
status: todo
type: feature
created_at: 2026-09-20T06:05:13Z
updated_at: 2026-09-20T06:05:13Z
parent: folio-assistant-o3xy
---

## The ask, owner 2026-09-20 (verbatim)

> there are exssting 3 layouts for grumpy cat. that is defailt cat-harness
> theme. there are now new theme when talking abuot tools in the KG
> https://github.com/litlfred/folio-assistant/commit/0301fbd24c107d1987d1a15d148fb50242c96217.
> these need to moved into KG appropraitely as a theme. and in on tools in kg
> use this theme.

## What this says, as I read it

Three claims and one instruction:

1. **`grumpy-cat` is the DEFAULT cat-harness theme.** Today
   `schemas/themes.ts` sets `DEFAULT_THEME_ID = "pale-sage"`, described in its
   own docs as *"Provisional against the staging bar … which sage is a question
   only the deployed staging site can settle."* This ruling looks like it
   settles that question differently — grumpy-cat, not a sage. **To confirm
   before changing**, because `iurf` chose a sage deliberately to match the
   staging bar and the owner's earlier ask said *"default is one of the sages
   (to match the staging bar)"*. Two owner statements point opposite ways; the
   later one normally wins, but a default is cheap to get wrong quietly.
2. **The three layouts already exist for grumpy-cat** — confirmed:
   `schemas/themes.ts` gives every shipped theme the shared `LAYOUTS` constant
   (laptop / mobile / card), and `theme.ts` enforces all three or invalid.
3. **A second theme exists in commit `0301fbd2`** and is not yet a KG node.
4. **Tools in the KG should use that second theme** — so a theme becomes
   selectable per *node kind* (or per graph kind), which is new.

## What this bean must NOT assume

Whether the commit's assets are colours, images, CSS, or all three — and
whether anything already lets a node kind pick a theme. `avatars` may be the
existing precedent for "a per-kind visual" (`schemas/avatars.ts`,
`scripts/gen-avatars-css.ts`, `scripts/check-avatar-coverage.ts`), and `5oai`'s
closing note left *"avatars on content nodes reusing `images[].role`"* open as
its other deferred half. If a per-kind visual mechanism exists, this rides it
rather than minting a second vocabulary.

A read-only investigation of the commit was launched 2026-09-20 to answer
exactly those questions before anything is designed.

## Relation to `mggs`

`mggs` (the landing sticky) gave `Theme` a **backdrop** field, named by image
`role` and resolved against the instance's own `images[]`, with a required
`scrim` because ink over art has no computable contrast. If the tools theme
carries imagery, that field is probably the hook it needs and this bean should
not add a second one. `mggs` is in PR #465.

Queued rather than pivoted to, per the owner's standing preference: *"in chats
if I discuss a new task I want you to queue/run in parallel, do not pivot unless
explicitly told so."*

## Done when

- [ ] the commit's contents are reported, with exact paths and colour values
- [ ] the `grumpy-cat`-as-default reading is confirmed or corrected against
      `iurf`'s deliberate sage
- [ ] the second theme exists as a KG node, validated by `ThemeSchema` with all
      three layouts
- [ ] tools in the KG render with it, through whatever per-kind mechanism
      already exists rather than a new one
- [ ] `themes.css` regenerated; `themes:css:check` not left stale
- [ ] contrast measured rather than asserted, as `mggs` did for the scrim
