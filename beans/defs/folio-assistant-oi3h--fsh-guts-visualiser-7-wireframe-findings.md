---
# folio-assistant-oi3h
title: 'fsh-guts visualiser: 7 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-fsh-guts
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/fsh-guts/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **The two surfaces disagree about the count.** The page says 19 files. The fish shows 9, which is `@graph` nodes plus any locally discarded todos. `fsh-guts-export.ts` skips files that declare no `$schema`, so the 6 undeclared scripts and the 4 sidecar-described scripts are absent from the viewer. Neither surface explains the other's number.
2. **Names are shown with raw Markdown.** The viewer renders node names and bodies as text, on purpose (no sanitiser). So "`SkillDefinition.roles` — retired" and "The `roles:` field in SKILL front matter …" appear with literal backticks (seen in the render), and bodies show `#` and `**`. (→ `folio-assistant-mylx`)
3. **The viewer is three interactions deep, behind an unlabelled glyph, and there is now a second, nearer "Settings" that is the wrong one.** The path is still ▦ → Settings → Discarded. The fish tile has a good accessible name, but nothing on the page says discarded items exist until that Settings is opened, and the count is fetched only then. Since #1010, every page also has a ⚙ **Settings** tile on the glass's bottom strip, larger and labelled. It does not hold the fish, and it does not point to the Settings that does. The bean's *"under settings at dead fish icon"* now matches one of two Settings.
4. **The declaration-state tags fail contrast on the default dark scheme.** The inline style sets `.fg-ok #0d6e5e`, `.fg-side #6b5b95` and `.fg-gap #a8430f`. On `#27262b` I computed 2.44, 2.54 and 2.48 to 1, at 12 px. The "undeclared" gap state is the one the page wants noticed, and it has the same weight as the others. (→ `folio-assistant-rtuo`)
5. **Every file link leaves the site for github.com, and nothing marks this.** The page states it indexes rather than republishes, but the links are ordinary links. In the viewer, the same item is readable in place, but only through Settings.
6. **Possible dead link on the canonical site.** This is narrowed, not fixed. The committed `_data/harness.json` gives the fsh-guts folder `path: "/fsh-guts/"` with no "staging only" note. The **tiles**, including the new glass-strip tile, are filtered by `publish: "staging-only"` against `fa-staging`, and the render confirms the glass tile disappears off-staging. The **Folders** list and the C@T Harness divider are not filtered that way. If the deploy does not regenerate that file, they link to a page the canonical deploy withholds. I could not check this against the live site, because the proxy refuses `litlfred.github.io`.
7. **Mobile.** The page's three-column file tables scroll sideways inside the table wrapper at 390 px. The Settings panel stacks vertically and the Discarded list fits at that width (rendered). The detail was read, not rendered. There are still two different back controls in one panel: "‹ All actions" in the head, which from Discarded skips past Settings to the grid, and "‹ All discarded items" in the detail. (→ `folio-assistant-2r2n`)

Related: `folio-assistant-7vhe`

When fixed, re-draw `cat-harness/docs/wireframes/fsh-guts/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
