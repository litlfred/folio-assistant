---
# folio-assistant-vsv4
title: 'voices visualiser: 7 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-voices
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/voices/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **The citations cannot be opened.** The page tells the reader to "uphold a finding by opening the citation", but a citation such as `who-pub-tps-931#page-014, p14` is plain text in a `<span class="cite">`. The page has **no links at all** (checked on `voices/` and `voices/who-style-guide/`). `who-pub-tps-931` is the slug of an entry on the library page, and nothing here leads to it. (→ `folio-assistant-qgjh`)
2. **The summary counts do not follow the filter.** On `voices/who-style-guide/` (preset to that instance, 3 voices showing), and after choosing an instance on `voices/`, the chips still read "7 voice(s) · 66 rule(s) · …". A per-instance page opens by reporting the whole repository's totals.
3. **No rule is visible until a card is opened, and on a phone the first card starts below the first screen.** All 7 cards start closed. At 390×844 the first card starts at y = 851. Opened, its first rule is at y ≈ 1437, about 1.7 screens down. Closed cards are 357 to 683 px tall at 390 px (169 to 232 px at 1280), because each summary carries the full description paragraph and the metadata line.
4. **Headings sit inside the disclosure control.** Each voice's `h2` is inside its `<summary>` (7 of 7), which assistive technology exposes as a button. Heading navigation and the button's name both then carry the whole summary text, including the description and the metadata line.
5. **The ▸/▾ marker is detached from the title.** It sits alone on a line above the heading, at the card's top-left, and is small, so on a phone it does not read as the thing to tap. The whole summary is in fact the target.
6. **Markdown shows through as raw text.** Descriptions show literal backticks ("an override under \`vendors/\`, declaring this voice in its \`extends\` field"). (→ `folio-assistant-mylx`)
7. **The directory table breaks words at 390 px.** "agent- / skills", "folio- / assistant- / core", and the monospace directory paths wrap mid-segment ("folio-assistant- / core/skills/voices").

When fixed, re-draw `cat-harness/docs/wireframes/voices/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
