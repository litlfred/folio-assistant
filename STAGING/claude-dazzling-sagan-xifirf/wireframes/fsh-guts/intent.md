# Fsh-guts — as-is intent

## Covers

Three surfaces show the `fsh-guts` graph or lead to it:

1. **The page.** `cat-harness/docs/fsh-guts/index.md` is tile `fsh-guts` in `cat-harness/docs/_data/harness.json`, with surfaces `navbar`, `board` and, since #1010, `glass`.
   - Generator: `cat-harness/scripts/gen-fsh-guts-viz.ts`.
   - It is declared `publish: "staging-only"` in `cat-harness.json`, so `compose-docs.ts` includes it only in local builds and `STAGING/<slug>/` previews.
2. **The dead-fish viewer.** Bean `folio-assistant-7vhe` (status in-progress): *"only available under settings at dead fish icon … has counter on icon … dialog to select and display them"*.
   - It is implemented in `cat-harness/docs/assets/js/docs-ui.js` (`FISH_GLYPH`, `fetchDiscarded`, `buildDiscardedView`, `buildDiscardedDetail`, and the Settings view in `buildViews`).
   - It reads `<base>/fsh-guts.json` (the `fa-fsh-guts-src` meta tag in `_includes/head_custom.html`), which `cat-harness/scripts/fsh-guts-export.ts` writes.
3. **The folio glass** (`mountGlass`, #1010). The fsh-guts page tile sits on the glass's bottom strip, and the glass has its own ⚙ Settings, which does not hold the fish.

### How this was drawn

The site could not be built here: there is no just-the-docs gem, and the proxy refuses `litlfred.github.io`. The page is drawn from its Markdown and the just-the-docs chrome.

I ran `fsh-guts-export.ts --out <scratch>/fsh-guts.json`, which still gives 9 nodes in `@graph`. Then I rendered the viewer and the glass with Playwright (`/opt/pw-browsers/chromium`, at 1280×800 and 390×844) on a static harness page, served from `cat-harness/docs` through `page.route`. The harness page carries the metas `head_custom.html` emits (`fa-tiles` from `_data/harness.json`, `fa-fsh-guts-src` pointing at that export, `fa-todo-src`, `fa-zoom-src`, and `fa-staging` empty, then set) and loads the committed `docs-ui.css`, `themes.css`, `avatars.css` and `docs-ui.js`. On it I opened ▦ Actions → Settings → Discarded, and I pulled the glass down.

## Who it is for, and what they need to do

From the page and the bean:
- **Readers:** a maintainer or agent who wants to see what was thrown away instead of deleted, so that nobody re-enters a dead end, and so that an item can be restored.
- **Tasks:**
  - see how much is kept, and in which group
  - see whether each file declares itself (`folio-fsh-guts/v1`)
  - open one item and read what it was, where it was, when it moved and why
  - get to its source
  - restore a todo discarded in this browser (viewer only)

## What it must show

Page:
- file count and groups
- the declared / via sidecar / undeclared census
- per group, one row per file with its first heading and its declaration state

Viewer:
- a count on the icon, announced in the accessible name
- a list of nodes (name and kind)
- the detail: Was at, Moved, Kind, Issue, description, body as text, and a link to the source
- "could not be read" kept distinct from "nothing discarded"

## Observed (current checkout: main with #1010 `zrvt` merged)

Page (`/fsh-guts/`), unchanged since the last draw, in reading order, inside the standard chrome. The chrome is the strip (mark, ☰, five icons, ⌂; the harness initials left it when #1022 folded the Harnesses group), the "▾ Folio" handle, search and footer.
1. H1 "fsh-guts — the trashcan that is kept".
2. The staging-only notice, the rule, and "19 file(s) across 2 group(s)".
3. "Does each file declare itself?": declared 9, via sidecar 4, undeclared 6.
4. "retired": 3 rows.
5. "scripts": 16 rows. Each file name links to `github.com/…/blob/main/fsh-guts/…`.

Viewer, on every page (rendered):
1. ▦ Actions → Settings. The Settings view holds:
   - the scheme tile (Dark / Light)
   - the four reading-preference checkboxes
   - "Saved in this browser only. It is not sent anywhere."
   - the **Discarded** tile (dead-fish glyph, count 9, accessible name "Discarded items — 9 items")
   - the **Declared kinds** fan
   Its back control is "‹ All actions".
2. Discarded → a list of 9 buttons, each a name plus a kind. If the reader discarded todos in this browser, a "todos you discarded" section with Restore buttons comes first. The view's own back control is also "‹ All actions", and it returns to the action grid, not to Settings.
3. Choosing an item hides the list and shows the detail. "‹ All discarded items" returns to the list.

On web the panel mounts in the sidebar column (`mountPanelInSidebarColumn`). On mobile it opens from the ▦ in the theme's top bar.

The glass (rendered): pulled down, its bottom strip holds ☑ Todos, ⚙ Settings and the declared `glass` tiles.
- With `fa-staging` empty, as on a local or canonical build, **fsh-guts is not on the strip**.
- With `fa-staging` set, as on a STAGING preview, it is, and it opens the page, not the viewer.
- The glass's ⚙ "Folio settings — theme, avatars, opacity" holds theme, avatars, opacity, blur, "Tidy the glass" and "Back to the default glass". It has **no Discarded tile**.

## Findings

1. **The two surfaces disagree about the count.** The page says 19 files. The fish shows 9, which is `@graph` nodes plus any locally discarded todos. `fsh-guts-export.ts` skips files that declare no `$schema`, so the 6 undeclared scripts and the 4 sidecar-described scripts are absent from the viewer. Neither surface explains the other's number.
2. **Names are shown with raw Markdown.** The viewer renders node names and bodies as text, on purpose (no sanitiser). So "`SkillDefinition.roles` — retired" and "The `roles:` field in SKILL front matter …" appear with literal backticks (seen in the render), and bodies show `#` and `**`.
3. **The viewer is three interactions deep, behind an unlabelled glyph, and there is now a second, nearer "Settings" that is the wrong one.** The path is still ▦ → Settings → Discarded. The fish tile has a good accessible name, but nothing on the page says discarded items exist until that Settings is opened, and the count is fetched only then. Since #1010, every page also has a ⚙ **Settings** tile on the glass's bottom strip, larger and labelled. It does not hold the fish, and it does not point to the Settings that does. The bean's *"under settings at dead fish icon"* now matches one of two Settings.
4. **The declaration-state tags fail contrast on the default dark scheme.** The inline style sets `.fg-ok #0d6e5e`, `.fg-side #6b5b95` and `.fg-gap #a8430f`. On `#27262b` I computed 2.44, 2.54 and 2.48 to 1, at 12 px. The "undeclared" gap state is the one the page wants noticed, and it has the same weight as the others.
5. **Every file link leaves the site for github.com, and nothing marks this.** The page states it indexes rather than republishes, but the links are ordinary links. In the viewer, the same item is readable in place, but only through Settings.
6. **Possible dead link on the canonical site.** This is narrowed, not fixed. The committed `_data/harness.json` gives the fsh-guts folder `path: "/fsh-guts/"` with no "staging only" note. The **tiles**, including the new glass-strip tile, are filtered by `publish: "staging-only"` against `fa-staging`, and the render confirms the glass tile disappears off-staging. The **Folders** list and the C@T Harness divider are not filtered that way. If the deploy does not regenerate that file, they link to a page the canonical deploy withholds. I could not check this against the live site, because the proxy refuses `litlfred.github.io`.
7. **Mobile.** The page's three-column file tables scroll sideways inside the table wrapper at 390 px. The Settings panel stacks vertically and the Discarded list fits at that width (rendered). The detail was read, not rendered. There are still two different back controls in one panel: "‹ All actions" in the head, which from Discarded skips past Settings to the grid, and "‹ All discarded items" in the detail.

## What PR #1010 (bean `zrvt`, merged) changed

- **The fish did not move.** The ▦ Actions → Settings view, with the Discarded tile, is unchanged. That means screen 2's path is unchanged, and so is its count of 9.
- **The glass gained its own ⚙ Settings** (theme, avatars, opacity, blur, tidy, defaults). It is a separate panel and holds no Discarded tile. It is drawn as screen 3, and it is the cause of the second half of finding 3.
- **The fsh-guts tile gained the `glass` surface**, so the page is on the glass's bottom strip, on STAGING previews only (finding 6). This answers the owner's *"where are the todo, fsh guts etc tiles on bottom of glass?"* for the page, not for the viewer.
- The `/fsh-guts/` page itself is generated and was not touched.

Also in this checkout, from #1022: the strip at rest lost its harness initials, because the Harnesses group now arrives folded. The chrome in screen 1 is redrawn to match.
