# Fsh-guts — as-is intent

## Covers

Two surfaces show the `fsh-guts` graph:

1. **The page.** `cat-harness/docs/fsh-guts/index.md` is tile `fsh-guts` in `cat-harness/docs/_data/harness.json`, with surfaces `navbar` and `board`.
   - Generator: `cat-harness/scripts/gen-fsh-guts-viz.ts`.
   - It is declared `publish: "staging-only"` in `cat-harness.json`, so `compose-docs.ts` includes it only in local builds and `STAGING/<slug>/` previews.
2. **The dead-fish viewer.** Bean `folio-assistant-7vhe` (status in-progress): *"only available under settings at dead fish icon … has counter on icon … dialog to select and display them"*.
   - It is implemented in `cat-harness/docs/assets/js/docs-ui.js` (`FISH_GLYPH`, `fetchDiscarded`, `buildDiscardedView`, `buildDiscardedDetail`, and the Settings view in `buildViews`).
   - It reads `<base>/fsh-guts.json` (the `fa-fsh-guts-src` meta tag in `_includes/head_custom.html`), which `cat-harness/scripts/fsh-guts-export.ts` writes.

The site could not be built here. The page is drawn from its Markdown and the just-the-docs chrome. I ran `fsh-guts-export.ts` locally to get the viewer's node list: 9 nodes in `@graph`.

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

## Observed on main (edf3a89+)

Page (`/fsh-guts/`), in reading order, inside the standard chrome (strip, "▾ Folio" handle, search, footer):
1. H1 "fsh-guts — the trashcan that is kept".
2. The staging-only notice, the rule, and "19 file(s) across 2 group(s)".
3. "Does each file declare itself?": declared 9, via sidecar 4, undeclared 6.
4. "retired": 3 rows.
5. "scripts": 16 rows. Each file name links to `github.com/…/blob/main/fsh-guts/…`.

Viewer, on every page:
1. ▦ Actions → Settings. The Settings view holds:
   - the scheme tile (Dark / Light)
   - the four reading-preference checkboxes
   - the **Discarded** tile (dead-fish glyph, count 9)
   - the **Declared kinds** fan (24 kinds)
2. Discarded → a list of 9 buttons, each a name plus a kind. If the reader discarded todos in this browser, a "todos you discarded" section with Restore buttons comes first.
3. Choosing an item hides the list and shows the detail. "‹ All discarded items" returns to the list.

On web the panel mounts in the sidebar column (`mountPanelInSidebarColumn`). On mobile it opens from the ▦ in the theme's top bar.

## Findings

1. **The two surfaces disagree about the count.** The page says 19 files. The fish shows 9, which is `@graph` nodes plus any locally discarded todos. `fsh-guts-export.ts` skips files that declare no `$schema`, so the 6 undeclared scripts and the 4 sidecar-described scripts are absent from the viewer. Neither surface explains the other's number.
2. **Names are shown with raw Markdown.** The viewer renders node names and bodies as text, on purpose (no sanitiser). So "`SkillDefinition.roles` — retired" and "The `roles:` field in SKILL front matter …" appear with literal backticks, and bodies show `#` and `**`.
3. **The viewer is three interactions deep, behind an unlabelled glyph.** The path is ▦ → Settings → Discarded. The fish tile has a good accessible name ("Discarded items — 9 items"), but nothing on the page says discarded items exist until Settings is opened. The count is fetched only when Settings opens.
4. **The declaration-state tags fail contrast on the default dark scheme.** The inline style sets `.fg-ok #0d6e5e`, `.fg-side #6b5b95` and `.fg-gap #a8430f`. On `#27262b` I computed 2.44, 2.54 and 2.48 to 1, at 12 px. The "undeclared" gap state is the one the page wants noticed, and it has the same weight as the others.
5. **Every file link leaves the site for github.com, and nothing marks this.** The page states it indexes rather than republishes, but the links are ordinary links. In the viewer, the same item is readable in place, but only through Settings.
6. **Possible dead link on the canonical site.** The committed `_data/harness.json` gives the fsh-guts folder `path: "/fsh-guts/"` with no "staging only" note. `harness-tiles.ts` has an `inertNote("staging-only")` wording for exactly this case. If the deploy does not regenerate that file, the Folders list and the C@T Harness divider on the canonical site link to a page the canonical deploy withholds. I could not verify this against the live site, because the proxy refuses `litlfred.github.io`.
7. **Mobile.** The page's three-column file tables scroll sideways inside the table wrapper at 390 px. The Settings panel stacks vertically, and the list/detail swap works at that width, but "‹ Back" and "‹ All discarded items" are two different back controls in one panel.

## What PR #1010 (bean `zrvt`) will change

The PR is titled *"the folio glass gets a bottom tile strip, a todo panel, settings, and book avatars"*. From the title alone, **Settings** moves or changes. The dead-fish tile lives inside Settings, so screen 2 of this wireframe (the path ▦ → Settings → Discarded) is the part most likely to be redrawn after it merges. The `/fsh-guts/` page is generated and is not named by that PR.
