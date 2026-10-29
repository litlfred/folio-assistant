---
name: html-rendering-qc
---

# HTML Rendering QC

## Role

Audit `.md` content files for patterns that cause rendering failures
in the HTML viewer (`ui/app.js`). Report issues with specific file
paths and line numbers.

## Renderer: `mdToHtml()`

Located in `ui/app.js`. Processing order:

1. Display math `$$...$$` → KaTeX display spans (content types with math)
2. Inline math `$...$` → KaTeX inline spans (content types with math)
3. Fenced code blocks `` ```lang `` → `<pre>` or `<div class="txb">`
4. Tables `|...|` → `<table class="md-table">`
5. Headings `##`, `###` → `<h3>`, `<h4>`
6. Bold `**...**` → `<strong>` (multiline OK)
7. Italic `*...*` → `<em>` (single line only)
8. Inline code `` `...` `` → `<code>`
9. Citations `\cite{key}` → `<span class="cite">[key]</span>`
10. En/em dash `--`/`---` → `–`/`—`
11. Cross-refs `[text](#label)` → `<a class="uref">`
12. List items `1.` / `-` → `<li>`
13. Paragraphs `\n\n` → `</p><p>`

## Known limitations

| Pattern | Issue | Fix |
|---------|-------|-----|
| `*italic*` spanning lines | Won't match (single-line regex) | Keep italic on one line |
| Nested lists | Not supported | Flatten or use prose |
| `\cite{key}` | No bibliography lookup | Accept `[key]` display |

A content type with math adds its own rows: for a paper folio, the science
layer's `math-render-check` (`skill_fetch math-render-check`, "In the HTML
viewer") lists the KaTeX, display-math and TeX ones.

## Interactive features

### Hover preview

Cross-ref links (`a.uref`) show a popup on hover with the
referenced block's content. The popup has:
- Expand (⛶) → fullscreen modal
- Close (×)

### Copy button

Blocks whose status the content type marks as a stub (for example
`stated` or `not_started`) show a 📋 button on hover. Copies block
metadata + markdown + the stub the content type supplies.

### Index page

Index entries are clickable — expands the definition inline in the
table row. Click again to collapse. Does not navigate away.

## Audit procedure

1. Run `bun run pipeline/export-json.ts` to build the folio JSON
2. Serve locally and inspect in browser
3. For bulk checking, grep `.md` files for the known problem patterns of
   the table above and of the content type's own skill. Unclosed bold or
   italic needs manual review: a regex can't reliably detect it.

## Sidebar behavior

The sidebar collapses to a strip showing tab letters. Hovering
expands it to full width.

- **☰** button: hides sidebar completely
- **⇔** button: toggles wide mode
- Both preferences persist to localStorage

## Diff view

Diff computation can be expensive. The diff fetch:
- Shows a cancel button during loading
- Aborts the fetch if the user switches to another mode
- Uses `AbortController` for clean cancellation
