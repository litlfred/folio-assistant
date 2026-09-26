---
# folio-assistant-xb4p
title: 'skills-index visualiser: 7 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-skills-index
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/skills-index/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Horizontal scroll at phone width.** At 390 px the `cat-harness` page is still 421 px wide (`scrollWidth` 421, table 402 px). The description column's text runs past the viewport from the very first rows ("no description in the artefact" is cut to "…artefac"), so the right edge of every description is cut until the reader pans. The three one- and two-row siblings do not overflow. (→ `folio-assistant-2r2n`)
2. **One very long flat list.** 240 rows run to 20,126 px at 1280 and 40,578 px at 390. The page has no folder headings (the folder is visible only inside each path), no search and no filter. Finding `wireframe-design-review` among 137 folio-core skills means scrolling or using the browser's find. (→ `folio-assistant-0fua`)
3. **50 of 240 skills say *no description in the artefact***, among them `latex-authoring`, `fhir-validation`, all nine content-lifecycle skills, all four new folio-document-adapter skills and `dmn-authoring`.
4. **Long descriptions are cut at 220 characters, with no way to read the rest here.** 31 descriptions end in "…", for example `wireframe-design-review` ("…mechanical checks at both vie…"). Only the GitHub source has the full text.
5. **Markdown shows through.** 22 descriptions have literal backticks, for example "Pointer to the bean-based session work-plan system (the \`beans\` CLI flat-file issue tracker, data under \`beans/\`)". (→ `folio-assistant-mylx`)
6. **The phone layout favours the path.** At 390 px the name and path column takes 147 px on `cat-harness` and the path breaks at any character (`cat-harness/skil / ls/authoring-mat / h/latex-authorin / g.md`). On the one-row siblings it is worse: the path column takes 260 px and the description column is 92 px, so "How a cold agent finds and loads the skill that governs its task." wraps to one or two words a line.
7. **The small siblings get the same heavy page shell.** `kg-navigation` and `who-iris-skills` have one row each, but they repeat the full lede, note and four-row sibling list above it. At 390 px their only row starts at y ≈ 655.

When fixed, re-draw `cat-harness/docs/wireframes/skills-index/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
