---
name: md-authoring
roles: [reader, collaborator, owner]
---

# Markdown Authoring Conventions

## Role

Enforce authoring conventions for `.md` content files so they render
correctly in both the HTML viewer (KaTeX + `mdToHtml`) and the LaTeX
pipeline. Flag violations before they reach the viewer.

## Rendering pipeline

Content `.md` files are rendered by two pipelines:

1. **HTML viewer** (`ui/app.js` → `mdToHtml()`) — KaTeX for math,
   custom regex for markdown → HTML.
2. **LaTeX pipeline** (`content/pipeline/render-latex.ts`) —
   remark parse → LaTeX AST.

Both pipelines have limitations. These conventions ensure content
works in both.

## Rules

### 1. Bold and italic may span lines

The HTML renderer supports `**bold**` and `*italic*` spanning
multiple lines. This is the standard pattern for wrapped prose:

```md
the **central limit
theorem** (CLT).
```

### 2. `\cite{key}` renders as `[key]` in HTML

The HTML viewer converts `\cite{key}` to a bracketed reference
`[key]`. The LaTeX pipeline handles it natively. Both work, but
be aware the HTML rendering is simple — no bibliography lookup,
no hyperlinks, just `[key]`.

### 3. Use `--` for en-dash, `---` for em-dash

The HTML renderer converts `--` → `–` and `---` → `—`.
**Do not** use Unicode en/em dash characters directly — they work
but are less portable.

### 3a. Multi-line display math: never start a line with `+`/`-`/`*`

GitHub's markdown renderer parses `+ `, `- `, or `* ` at the start of
a line as a bullet list — even inside a `$$...$$` block. The display
math then breaks open and the continuation lines render as raw LaTeX
with bullets. Always put the binary operator at the **end** of the
preceding line:

```md
$$
F(x) = a \;+\;
       b \;+\;
       c
$$
```

**Wrong** (each `+ ` line becomes a bullet item on GitHub):

```md
$$
F(x) = a
+ b
+ c
$$
```

The LaTeX pipeline tolerates either form, but the GitHub blob view
and the HTML viewer both break on the second. Verified by the
`markdown-render-check` skill.

### 4. Display math: blank line before `$$`

The `mdToHtml` regex for display math requires `$$` to be preceded
by a paragraph break (blank line) to reliably detect it as display
rather than inline:

```md
The defining tuple is

$$
  (\mathbf{C},\; \theta,\; G,\; \mathcal{S}).
$$
```

**Wrong** (may render inline or break):
```md
The defining tuple is
$$
  ...
$$
```

### 5. No `\operatorname{}` — use `\mathrm{}`

KaTeX in the viewer does not support `\operatorname{}` by default.
Use `\mathrm{}` instead:

```md
$\mathrm{Vol}(K)$     ← correct
$\operatorname{Vol}(K)$ ← KaTeX error
```

### 6. No raw LaTeX commands outside math

The markdown → HTML converter only passes through content inside
`$...$` or `` ```tex `` blocks. Bare `\mathrm{...}` outside
delimiters renders as literal text.

### 7. Math in titles is supported

Block titles (in `.ts` manifests) may contain inline math in
`$...$` delimiters. The `escapeLatex()` function preserves these.

### 8. Tables use GFM pipe syntax

```md
| Header 1 | Header 2 |
|----------|----------|
| cell     | cell     |
```

Tables are rendered by **two pipelines**:

- **HTML viewer**: `<table class="md-table">` via regex.
- **LaTeX pipeline**: `\begin{tabular}` with `booktabs` rules
  (`\toprule`, `\midrule`, `\bottomrule`) via `remark-gfm` AST.

**Alignment**: Use `:` in the separator row to control column
alignment. The LaTeX pipeline reads these and sets `l`, `c`, or `r`
in the `tabular` column spec:

```md
| Left   | Center | Right |
|:-------|:------:|------:|
| text   | text   | text  |
```

**Math in table cells** is fully supported — `$...$` segments pass
through to LaTeX verbatim:

```md
| Entry   | Formula                |
|:-------:|------------------------|
| $(1,1)$ | $q - q^{-1}$          |
| $\det$  | $cd(q-q^{-1}) + d^2$  |
```

**Inline code in table cells** renders as `\texttt{...}` in LaTeX
with special characters escaped. Use backticks for identifiers:

```md
| Label | Declaration                  |
|-------|------------------------------|
| def:x | `Project.Namespace.some_decl`|
```

**Rules for table content:**

- **Do not** use raw `&` in table prose — it is the LaTeX column
  separator. Use `\&` in math or restructure the cell.
- **Do not** use bare `_` outside `$...$` — it triggers LaTeX
  subscript mode. Wrap identifiers in backticks or math.
- **Do not** nest tables.
- **Always** include the separator row (`|---|---|`).
- Keep cell content concise — wide tables overflow in PDF.

### 9. Headings use `##` and `###`

In `.md` content files, `## Heading` renders as `<h3>` and
`### Heading` as `<h4>`. `# Heading` is reserved for chapter titles.

### 10. Lists

Ordered (`1. item`) and unordered (`- item`) lists are supported.
Nested lists are not yet supported by `mdToHtml`.

### 11. Cross-references

Use `[text](#label)` for cross-references. These become clickable
`<a class="uref">` links with hover preview in the viewer.

### 12. Inline code

Use backticks for inline code: `` `code` ``. Rendered with
monospace font and subtle background.

### 13. Glossary terms (`:defterm` / `:refterm`)

Defined terms are wrapped via `remark-directive` syntax — never plain
text or `**bold**` once the slug is registered in any block's
`defines: [...]`:

| Form | Use when | Example |
|------|----------|---------|
| `:defterm[Visible]{#slug}` | Canonical defining occurrence (exactly one block per slug) | `:defterm[rigid monoidal category]{#rigid-monoidal-category}` |
| `:defterm[term]` | Same, when slug = sluggified label | `:defterm[quantum connection]` |
| `:refterm[Visible]{#slug}` | Every other mention, anywhere in the project | `:refterm[rigid monoidal category]{#rigid-monoidal-category}` |
| `:refterm[term]` | Short form when slug = sluggified label | `:refterm[quantum connection]` |

Rendering: viewer → dotted underline; PDF → plain text with invisible
hyperlink target. The validator (`bun run validate <paper>`) enforces
declaration, resolution, and uniqueness; the codemod
(`bun run pipeline/codemod-refterm.ts`) backfills `:refterm[…]` from
bare-text mentions of known slugs. See `glossary-build`.

## QC checklist

When reviewing `.md` content, check:

- [ ] No `\operatorname{}` — replaced with `\mathrm{}`
- [ ] Display math has blank line before `$$`
- [ ] No raw LaTeX outside `$...$` or `` ```tex `` blocks
- [ ] `\cite{}` keys match entries in `content/schema/references.ts`
- [ ] Cross-refs `[text](#label)` point to valid labels
- [ ] Bold/italic delimiters are properly closed
- [ ] Tables have separator row (`|---|---|`)
- [ ] No Unicode math symbols that should be in `$...$`
- [ ] Defined terms (slugs in any block's `defines[]`) wrapped in
      `:defterm` / `:refterm` directives, not plain text or `\emph{}`
