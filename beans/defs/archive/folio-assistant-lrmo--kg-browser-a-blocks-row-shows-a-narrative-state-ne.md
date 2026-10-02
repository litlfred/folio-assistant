---
# folio-assistant-lrmo
title: 'KG BROWSER: a block''s row shows a narrative STATE, never the content — no way to read what was extracted'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T19:59:19Z
updated_at: 2026-09-23T20:12:56Z
parent: folio-assistant-0lmb
---


Found by the owner on first use of the block browser `7nvr` shipped:

| *"i expected to be able to see narrative content of extracted node"*
| *"like dropdown expand panel or so"*

The row carried a narrative STATE — `draft`, `not-authored` — which says a
description exists without saying what it is. For the arXiv paper whose
colourbars were corrected this morning, that means the reader sees `draft`
three times and cannot read one word of what was written.

## Two kinds carry content differently, and the sizes decide the design

| kind | source | measured | carried |
|---|---|---|---|
| figure | `narrative.text`, authored here | 404 figures, **128 KB total** | whole |
| prose | the section `.md` it points at | **3.25 MB**, worst entry 508 KB | excerpt |

Carrying prose whole would make opening one entry cost half a megabyte, which
is the same argument that put the blocks in a per-entry file rather than the
index. 600 characters is a paragraph — enough to tell one section from another
while BROWSING, which is what this view is for. Reading the section is a
different act and the file is right there.

**Truncation is declared, never inferred from length.** `truncated: boolean`
on the block, and the panel says so. A reader who cannot tell a short section
from a cut one is being shown a claim about the document that the data does
not support — the same defect as a silent skip anywhere else here.

## Why `<details>` rather than a scripted panel

It expands, collapses and takes keyboard focus with no JavaScript at all, so
there is one less thing to get wrong and one less thing to test (`gjli`). The
styles use the existing theme tokens, so the panel follows light and dark
rather than hardcoding either.

## Todo

- [x] `content` and `truncated` on `LibraryBlock`
- [x] figure narratives whole, prose excerpted at a DERIVED bound
- [x] `<details>` panel, native, themed from tokens
- [x] "no content carried" said plainly — a determined answer, not a blank
- [x] `bun run gates` green

## Not this bean

Publishing the full section text for `agent-skills` entries. who-iris and
smart-base publish theirs; agent-skills does not, and whether other
publishers' document text belongs on a public site is a licensing question
for the owner, not a rendering one.

## Follow-up, 2026-09-24

Prose blocks now get agent summaries too, BESIDE the extract rather than in place of it, kept in a `summaries.json` sidecar that uses this narrative state machine. Bean `x80s`.
