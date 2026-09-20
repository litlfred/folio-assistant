---
# folio-assistant-d3yq
title: 'TESTING THEME: an engineering grumpy-cat theme and an avatar for testing surfaces'
status: todo
type: feature
priority: normal
created_at: 2026-09-20T06:09:59Z
updated_at: 2026-09-20T06:11:39Z
parent: folio-assistant-o3xy
blocked_by:
    - folio-assistant-xffc
---

## The ask, owner 2026-09-20 (verbatim)

> also when talking about testing specifically, we need avatar and then cats =
> computable adjudication and agentic test harness.       caaat-harness
>     ca&at-harness
>  _c&t-harness
>  c@t-harness
> cat-harness
> cat-harness
>
> this time grumpy cat will be engineering themed.  i will provide 3 layouts in
> a moment

## What it asks for

1. An **avatar** for the testing context, plus the derivation chain.
2. A **third grumpy-cat theme, engineering-themed**, distinct from the default
   `grumpy-cat` and from the tools theme (`xffc`).
3. Applied **when talking about testing specifically** — so theme selection by
   subject/context, the same new capability `xffc` needs for tools.

**BLOCKED, and the block is clean**: the owner says *"i will provide 3 layouts
in a moment."* A theme is invalid without all three (`theme.ts` enforces it and
refuses rather than degrading), so there is nothing to build until the art
arrives. Waiting on: the three layouts. No expiry set — the owner is supplying
them in this session.

## A DIFFERENCE worth resolving before anything is written

The chain in this ask is **not** the chain committed in `cat-harness/harness.json`.

| rung | committed today | in this ask |
|---|---|---|
| 1 | `computable adjudication and agentic test harness` | same, with a trailing `.` |
| 2 | `caaat-harness` | `caaat-harness` |
| 3 | `ca&at-harness` | `ca&at-harness` |
| 4 | **`.c&at-harness`** | **`_c&t-harness`** |
| 5 | ` c@t-harness` (leading NO-BREAK SPACE) | ` c@t-harness` |
| 6 | — | `cat-harness` |
| 7 | — | `cat-harness` |

So rung 4 changes `.c&at-` to `_c&t-` (a different leading character AND a
dropped `a`), and two `cat-harness` rungs are added at the end.

**Not applied, deliberately.** The committed chain is load-bearing in ways a
retype would not show: `kg-node.test.ts` has a test named *"the last rung's
leading character is U+00A0, not a space"*, so the NO-BREAK SPACE is asserted,
and another requires the rungs be separated by BLANK lines rather than single
newlines because that is what survives Jekyll's markdown renderer. A chain typed
into a chat message loses exactly those two properties, and the ask is about a
THEME rather than about editing the description.

**Question for the owner** (asked rather than assumed): is the derivation chain
being revised to the seven-rung form, or was it retyped from memory as context
for the theme? If revised, `harness.json`'s `description` changes and the two
tests above need updating with it — and the landing sticky picks it up for free,
since it reads the description rather than restating it (`mggs`).

## Depends on

- **`mggs`** (PR #465) — gave `Theme` a `backdrop` named by image `role` with a
  required `scrim`. Three layouts of engineering art declared as `images[]` with
  a shared role is exactly that field's shape, so this should need no new one.
- **`xffc`** — the tools theme. Both this and that need *theme selection by
  context*, which does not exist yet. Whichever is built first should introduce
  the mechanism and the other should use it, not a second one.
- **Avatars** — `schemas/avatars.ts`, `scripts/gen-avatars-css.ts`,
  `scripts/check-avatar-coverage.ts` exist. "we need avatar" probably rides
  those rather than being new; `5oai` left *"avatars on content nodes reusing
  `images[].role`"* open as its other deferred half.

## Done when

- [ ] the three layouts have arrived
- [ ] the derivation-chain question is answered
- [ ] an `engineering` grumpy-cat theme exists as a KG node, all three layouts,
      contrast measured rather than asserted (as `mggs` did for the scrim)
- [ ] an avatar for the testing context, through the existing avatar mechanism
- [ ] testing surfaces select it, through the same mechanism `xffc` uses
- [ ] `themes.css` and the avatars CSS regenerated; neither `:check` left stale


_2026-09-20_ — COMMIT `0301fbd2` INVESTIGATED, and the headline is that it contains **no theme code at all**. It is three raw PNGs uploaded through the GitHub web UI, at the **repository root**, with spaces and commas in their names:

| file | pixels | nearest declared `landing` layout |
|---|---|---|
| `ChatGPT Image Sep 20, 2026, 07_59_54 AM.png` | 1254x1254 | `landing-card` (1254x1254) — exact |
| `ChatGPT Image Sep 20, 2026, 08_00_03 AM.png` | 1672x941 | `landing-laptop` (declared **1671**x941) — 1px wider |
| `ChatGPT Image Sep 20, 2026, 08_00_13 AM.png` | 942x1670 | `landing-mobile` (declared **941**x1670) — 1px wider |

So: three layouts, matching the card/laptop/mobile set, as PNG where the instance declares `.webp`.

**A CORRECTION I AM RECORDING RATHER THAN QUIETLY FIXING, because acting on the wrong version would have been destructive.** An automated pass over these images — a 16x16 average-colour grid — concluded they were *"a regeneration of the existing `landing`-role art"*, matching `harness.json`'s own prose about *"a grumpy cat in a sage hoodie"*. **That is wrong, and I only found out by opening the image.** The cat is wearing a **hi-vis engineering work vest** — orange and yellow reflective stripes, rust-stained, with the c@t mark as a chest patch — not a sage hoodie. A coarse colour grid cannot tell a costume from a costume; both are cat-plus-cloud-plus-green at 16x16.

The consequence had it gone unchecked: *"replacements for `landing-{card,laptop,mobile}.webp`"* was the recommendation, and `grumpy-cat` is the only theme with a backdrop and it names the role `landing`. Dropping these in place would have **silently re-skinned the default theme and the landing sticky**, with no theme edit anywhere to show why — and falsified two `images[].width` values by 1px on the way.

**These are NEW ART FOR A NEW THEME.** They must be declared as their own `images[]` entries under their own `role`, never as `landing`.

## What does NOT exist, and both this bean and its sibling need it

**There is no per-kind or per-context theme selection anywhere.** Measured across `schemas/theme.ts`, `schemas/themes.ts`, `schemas/kg-node.ts` and `scripts/gen-themes-css.ts`:

- `ThemeSchema` is keyed by `id` alone. No `kind`, `graphKind` or `nodeKind` field.
- The only selector is `ThemedTodoFieldsSchema` — an optional `theme` id on a **todo** — plus the required `theme` on the landing sticky. Both are per-NODE, chosen by whoever built the node.
- The generated CSS emits `[data-fa-sticky-theme="<id>"]` only, and `docs-ui.js` sets `data-fa-kind` on avatars while never setting `data-fa-sticky-theme`. The two vocabularies do not meet.

**Avatars ARE the existing precedent for a per-kind visual**, and `tools` already has one: `schemas/avatars.ts` declares `tools: { glyph: <a spanner>, tone: 250, reads: "a spanner — a Tool definition, the thing that does the work" }`, rendered to `avatars.css` at `hsl(250 46% 34%)` light / `hsl(250 42% 72%)` dark. But it is a hue and a glyph mask in a separate registry and stylesheet; nothing bridges `AVATARS[kind].tone` to a `Theme`, and no theme names a kind.

So *"use this theme on tools in the KG"* needs a **bridge that does not exist**. Whichever of this bean and `d3yq` is built first should introduce it, and the other should use it rather than minting a second.

**Also worth knowing: there is no rendered tools page.** `docs/reference/` holds `skills/` and `skill-instructions/` only; Tools appear as prose. Every consumer of `tools/index.js` is non-visual (`check-tools`, `kg-export`, `harness-schema-export`, `tool-coverage`, the MCP projection). So "tools use this theme" may need a surface to exist before it can have a theme.

## A gap the assets themselves expose

The three PNGs are **undeclared, at a path no gate scans.** `check-declared-assets.ts` walks declared→disk only, and its `DECLARED_INSTANCES` is `["cat-harness", "bootstrap"]` — the repository root is deliberately not an instance since the move. There is no reverse "a file on disk that nothing declares" check for images. So these three are invisible to every declaration gate, and would have stayed invisible indefinitely. Worth its own bean.
