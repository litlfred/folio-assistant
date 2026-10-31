---
name: math-md-authoring
description: >-
  The math half of the harness's md-authoring: display and inline math,
  KaTeX limits, math in titles and table cells, and what the LaTeX pipeline
  does with tables, for a paper folio's .md blocks.
---

# Math markdown authoring

The harness skill `md-authoring` (`skill_fetch md-authoring`) holds the
markdown conventions every content type shares. A paper folio's `.md` blocks
carry math and go through two renderers, so they follow these rules as well:

1. **HTML viewer** (`ui/app.js` → `mdToHtml()`), with KaTeX for math.
2. **LaTeX pipeline** (`pipeline/render-latex.ts`): remark parse → LaTeX AST.

`math-render-check` (`skill_fetch math-render-check`) is the grep pass that
verifies them after an edit.

## Rules

### 1. Multi-line display math: never start a line with `+`/`-`/`*`

GitHub's markdown renderer parses `+ `, `- `, or `* ` at the start of
a line as a bullet list, even inside a `$$...$$` block. The display
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
and the HTML viewer both break on the second.

### 2. Display math: blank line before `$$`

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

### 3. No `\operatorname{}`: use `\mathrm{}`

KaTeX in the viewer does not support `\operatorname{}` by default.
Use `\mathrm{}` instead:

```md
$\mathrm{Vol}(K)$     ← correct
$\operatorname{Vol}(K)$ ← KaTeX error
```

### 4. No raw LaTeX commands outside math

The markdown → HTML converter only passes through content inside
`$...$` or `` ```tex `` blocks. Bare `\mathrm{...}` outside
delimiters renders as literal text.

### 5. Math in titles is supported

Block titles (in `.ts` manifests) may contain inline math in
`$...$` delimiters. The `escapeLatex()` function preserves these.

### 6. Tables in the LaTeX pipeline

The LaTeX pipeline renders GFM tables as `\begin{tabular}` with `booktabs`
rules (`\toprule`, `\midrule`, `\bottomrule`) via the `remark-gfm` AST, and
reads the `:` alignment markers as `l`, `c` or `r` in the column spec.

**Math in table cells** is fully supported: `$...$` segments pass
through to LaTeX verbatim:

```md
| Entry   | Formula                |
|:-------:|------------------------|
| $(1,1)$ | $q - q^{-1}$          |
| $\det$  | $cd(q-q^{-1}) + d^2$  |
```

**Inline code in table cells** renders as `\texttt{...}` in LaTeX
with special characters escaped.

- **Do not** use raw `&` in table prose: it is the LaTeX column
  separator. Use `\&` in math or restructure the cell.
- **Do not** use bare `_` outside `$...$`: it triggers LaTeX
  subscript mode. Wrap identifiers in backticks or math.

## QC checklist

Alongside `md-authoring`'s checklist:

- [ ] No `\operatorname{}`, replaced with `\mathrm{}`
- [ ] Display math has blank line before `$$`
- [ ] No line inside `$$...$$` starts with `+`, `-` or `*`
- [ ] No raw LaTeX outside `$...$` or `` ```tex `` blocks
- [ ] No raw `&` or bare `_` in table prose
- [ ] No Unicode math symbols that should be in `$...$`
