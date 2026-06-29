---
layout: default
title: Rendering Fixes
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/rendering-fixes.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/rendering-fixes.md) — do not edit here.

{% raw %}
# Rendering Fixes

## Role

Quick-fix cookbook for common rendering errors in `.md` and `.ts` content
files. Each entry shows the error pattern, why it breaks, and the exact fix.
Agents editing content blocks should check this list before committing.

## Fix Index

| # | Error | Severity | Auto-fixable? |
|---|-------|----------|---------------|
| F1 | Backtick/dollar mismatch | Error | Yes |
| F2 | Bare `\eqref{}` outside math | Error | Yes |
| F3 | Bare TeX in `.ts` title | Error | Yes |
| F4 | Single-line `$$...$$` inside list | Error | Yes |
| F5 | Extra trailing pipe in table | Warning | Yes |
| F6 | `\operatorname` vs `\mathrm` | Error | Yes |
| F7 | `\mathscr` KaTeX compat | Warning | Yes |
| F8 | `$$` without preceding blank line | Error | Yes |
| F9 | `&` in prose outside math | Error | Yes |
| F10 | Raw TeX outside math delimiters | Error | Yes |
| F11 | Wrong notation register | Error | Yes (pattern) |
| F12 | Missing SVG pre-render for fenced tex | Warning | Script |
| F13 | Orphan cross-reference | Error | Manual |
| F14 | Missing bibliography entry | Error | Manual |
| F15 | `$=$` for observed/derived values | Error | Yes |

---

## F1: Backtick/dollar mismatch

**Pattern**: A backtick `` ` `` opens what should be math, but `$` closes it
(or vice versa). Creates an unclosed math environment that swallows
subsequent lines.

```md
<!-- BROKEN: backtick opens, dollar closes -->
$q = 1.10998$ from `Vol(4_1) = 2.02988321281931$ and

<!-- FIXED: consistent delimiters -->
$q = 1.10998$ from $\mathrm{Vol}(4_1) = 2.02988321281931$ and
```

**Detection**: Grep for lines with mismatched `` ` `` and `$` counts.
**Fix**: Replace `` ` `` with `$` (for math) or `$` with `` ` `` (for code).
If the content is mathematical, use `$...$` and wrap function names in
`\mathrm{}`.

---

## F2: Bare `\eqref{}` outside math mode

**Pattern**: `\eqref{eq:label}` used in prose text without `$...$` wrapping.
Works in LaTeX but renders as literal text in the HTML viewer (KaTeX only
processes content inside math delimiters).

```md
<!-- BROKEN: bare \eqref in prose -->
diagram \eqref{eq:some-diagram} from the top-left

<!-- FIX OPTION 1: markdown cross-ref (preferred) -->
diagram [above](#eq:some-diagram) from the top-left

<!-- FIX OPTION 2: wrap in math (if equation number needed) -->
diagram $\eqref{eq:some-diagram}$ from the top-left
```

**Detection**: `grep -n '\\eqref' *.md | grep -v '\$'`
**Fix**: Convert to `[text](#label)` cross-ref (works in both pipelines).

---

## F3: Bare TeX in `.ts` title field

**Pattern**: Title contains TeX like `d_q^2` without `$...$` wrapping.
The `escapeLatex()` function escapes `_` and `^` as `\_` and
`\textasciicircum{}`, producing garbled output.

```ts
// BROKEN: bare TeX — renders as "d\_q\textasciicircum{}2"
title: "d_q^2 does not vanish",

// FIXED: wrapped in $...$
title: "$d_q^2$ does not vanish",
```

**Detection**: Grep `.ts` title fields for `_` or `^` outside `$...$`.
**Rule**: Any TeX in a title MUST be inside `$...$` delimiters.

---

## F4: Single-line `$$...$$` inside list items

**Pattern**: Display math `$$...$$` written on a single line (or spanning
2 lines with both `$$` at line boundaries) inside a markdown list item.
The pipeline may convert the opening `$$` to `\[` but leave the closing
`$$` as-is, producing a mixed-delimiter error.

```md
<!-- BROKEN: single-line display math in list -->
3. Define the Chern classes:
   $$c_i(X) := c_i(\tau(X)) \in H^{2i}_{\mathrm{dR}}(\mathrm{Spec}\,R),$$

<!-- FIXED: display math on separate lines -->
3. Define the Chern classes:

   $$
   c_i(X) := c_i(\tau(X)) \in H^{2i}_{\mathrm{dR}}(\mathrm{Spec}\,R),
   $$
```

**Detection**: Grep for `$$` that starts and ends on the same line.
**Fix**: Put `$$` on its own line, with a blank line before the opening `$$`.

---

## F5: Extra trailing pipe in markdown table

**Pattern**: Table rows have more `|` separators than the header row,
creating an extra empty column.

```md
<!-- BROKEN: trailing | | creates extra column -->
| Red | $S_3^{(r)}$ | $c_r = w_2 - z$ | |
| Green | $S_3^{(g)}$ | $c_g = w_3 - z$ | |

<!-- FIXED: consistent column count -->
| Red | $S_3^{(r)}$ | $c_r = w_2 - z$ |
| Green | $S_3^{(g)}$ | $c_g = w_3 - z$ |
```

**Detection**: Count `|` per row; flag rows with more than header.
**Caveat**: `|` inside `$...$` (absolute values) creates false positives.

---

## F6: `\operatorname` vs `\mathrm`

**Pattern**: `\operatorname{Vol}` may break in some markdown/KaTeX
renderers. Project convention is `\mathrm{Vol}`.

```md
<!-- INCONSISTENT (works but non-standard for project) -->
$\operatorname{Vol}(K)$

<!-- PREFERRED -->
$\mathrm{Vol}(K)$
```

**When to use `\operatorname`**: Only for operators that need special
spacing (like `\lim`, `\sup`). For named functions, use `\mathrm{}`.

---

## F7: `\mathscr` KaTeX compatibility

**Pattern**: `\mathscr{L}` may not render in older KaTeX versions.

```md
<!-- RISKY: needs KaTeX >=0.16 -->
$\mathscr{L}_q$

<!-- SAFE: always renders -->
$\mathcal{L}_q$
```

**Fix**: Use `\mathcal{}` unless the script font distinction is
semantically necessary.

---

## F8: `$$` without preceding blank line

**Pattern**: Display math `$$` immediately follows text without a blank
line. The pipeline may produce mixed `\[`/`$$` delimiters, breaking
LaTeX compilation.

```md
<!-- RISKY: may parse as inline -->
The formula is:
$$
  x = y
$$

<!-- SAFE: blank line forces display -->
The formula is:

$$
  x = y
$$
```

**Fix**: Add a blank line before `$$`.

---

## F9: Ampersand in prose

**Pattern**: `&` in prose text (outside `$...$` or `` ```tex `` blocks)
becomes a column separator in LaTeX, causing compilation errors.

```md
<!-- BROKEN in LaTeX -->
groups & rings form categories

<!-- FIXED -->
groups and rings form categories
```

**Exception**: `&` inside math mode is fine (matrix/alignment separators).

---

## F10: Raw TeX outside math delimiters

**Pattern**: LaTeX commands like `\mathrm{}`, `\textbf{}`, `\emph{}`,
`\frac{}{}` used in prose without `$...$` wrapping. Renders as literal
text in both pipelines.

```md
<!-- BROKEN: raw TeX in prose -->
the group \mathrm{SU}(2) acts on

<!-- FIXED: wrapped in math -->
the group $\mathrm{SU}(2)$ acts on
```

**Detection**: Grep for `\commandname{` on lines without `$`.

---

## F11: Notation register violations

The project defines a **notation register** (in AGENTS.md) that assigns a
canonical font/symbol to each concept. The most common fix is rewrapping a
symbol in the correct font for its concept per that register.

```md
<!-- WRONG: if the project's register reserves calligraphic for sheaves/bundles -->
the category $\mathcal{C}$

<!-- RIGHT: bold for categories -->
the category $\mathbf{C}$
```

**Fix**: Check the symbol's concept against the register in AGENTS.md and
rewrap it in the font/symbol that register specifies.

---

## F12: Missing SVG pre-render for fenced tex blocks

**Pattern**: A `.md` file contains a `` ```tex `` fenced block (typically
tikzcd) but the corresponding `.ts` manifest has no `rendered:` array.
The block shows as raw LaTeX in the HTML viewer.

**Fix**: Run the pre-render pipeline:
```bash
cd content && bun run render-tex
```

Then add the generated SVG paths to the `.ts` manifest:
```ts
rendered: [
  { mime: "image/svg+xml", url: "rendered/block-name-0.svg", blockIndex: 0, hash: "..." },
],
```

---

## F13: Orphan cross-reference

**Pattern**: `[text](#label)` in `.md` or `\hyperref[label]{}` in rendered
`.tex` points to a label that doesn't exist. Renders as `??` in PDF.

**Causes**:
- Block was deleted but references remain
- Label was renamed without updating `uses[]`
- Cross-paper ref in single-paper build (expected)

**Fix**: Search for the label; if it was renamed, update the reference.
If the block doesn't exist yet, create it or remove the reference.

---

## F14: Missing bibliography entry

**Pattern**: `\cite{key}` in `.md` or `-- Ref: [key]` in `.lean` refers
to a key not in `content/schema/references.ts`.

**Fix**: Add a `ref()` entry in `references.ts`:
```ts
ref({
  id: "author2024",
  type: "article-journal",
  title: "Paper title",
  author: [{ family: "Author", given: "A." }],
  issued: { "date-parts": [[2024]] },
  DOI: "10.xxxx/xxxxx",
}),
```

Then run `bun run export-bibtex` and `bun run validate-refs`.

---

## F15: `$=$` for observed/derived values

**Pattern**: Numerical or derived values written with `$=$` instead of
`$\approx$`. Implies exact equality, which is false for derived quantities.

```md
<!-- WRONG — implies exact -->
$x(q_0) = 1.234$

<!-- RIGHT — approximation -->
$x(q_0) \approx 1.234$
```

**Exception**: `$=$` is allowed when an explicit error term is present:
```md
<!-- OK — error term present -->
$x(q_0) = 1.234 + O(10^{-3})$
```

**Not affected**: Exact algebraic identities like `$f(q) = 1/(q-1)$` —
these hold for all `$q$` and use `$=$`.

**Detection**: Flag `= <number>` patterns in numerical-result contexts
that lack a neighbouring `\approx` or `O(` error term.

---

## F16: Multi-line inline math in viewer

**Pattern**: Inline math `$...$` spans multiple lines in the `.md` source.
The viewer's `parseMd()` joins paragraph lines with spaces, so multi-line
inline math works — but the `inl()` function's `$`-parser must correctly
track brace depth to find the closing `$`. Escaped braces `\{` and `\}`
must be skipped (they don't change nesting depth).

**Authoring rule**: Multi-line inline math is valid per AGENTS.md.
No source change needed. If rendering fails, the bug is in the viewer's
parser (see `inl()` function in `viewer/index.html`).

**Common pitfalls**:
- `\{` and `\}` (literal braces) treated as depth changes → **fixed in viewer**
- Continuation lines in list items not joined properly → check indentation is 2+ spaces
- `$...$` inside bold `**...**` — the bold regex in `inl()` runs first and may split the math token

---

## F17: Simulator block schema mismatch

**Pattern**: A `simulator()` block uses a deprecated field format instead of
the current `SimulatorBlock` schema. The build fails with Zod validation
errors about missing `html`, `defaultView`, or `ref` fields.

**Old format** (deprecated):
```ts
simulator: { type: "html", source: "file.html" }
```

**Current format** (required):
```ts
html: "folio-assistant/simulators/file.html",
defaultView: {
  name: "default",
  title: "Default view",
  params: { ... },
},
```

**Fix**: Replace the `simulator:` field with `html:` + `defaultView:`.
Use an existing simulator block (e.g. `<simulator-name>.ts`) as a template.

---

## F18: Orphaned content block (wrong chapter directory)

**Pattern**: A content block's `.ts` and `.md` files are in one chapter
directory but referenced from a different chapter's manifest. The build
fails with "Cannot find module" because it looks for the file relative
to the manifest.

**Fix**: Move the block files to the chapter directory that references them,
or update the manifest to point to the correct location.

---

## F19: tikzcd/gathered blocks showing as raw LaTeX in HTML viewer

**Pattern**: A ````tex` fenced block containing `\begin{tikzcd}` or
`\begin{gathered}` shows as raw LaTeX text in the HTML viewer. This
happens because:
1. The `rendered[]` field in the `.ts` manifest is empty (no pre-rendered SVG)
2. KaTeX cannot render tikzcd environments
3. The viewer falls back to displaying raw source text

**Fix** (preferred): Run the pre-rendering pipeline:
```bash
cd content && bun run render-tex
```
This generates SVGs and updates `.ts` manifests with `rendered[]` entries.

**Fix** (when pdflatex unavailable): The viewer now shows a styled
placeholder with a "[Commutative diagram]" label and collapsible source
instead of raw text. This is automatic — no content change needed.

---

## Pre-commit checklist (for agents editing content)

Before committing changes to a content block, verify:

- [ ] All `$...$` delimiters are balanced (no mixed backtick/dollar)
- [ ] Display math `$$` is on its own line with blank line before
- [ ] No raw TeX commands outside math delimiters
- [ ] `.ts` title fields wrap TeX in `$...$`
- [ ] Markdown tables have consistent column counts
- [ ] No `\eqref{}` outside math — use `[text](#label)` instead
- [ ] Notation register compliance (per AGENTS.md)
- [ ] `\cite{key}` keys exist in `references.ts`
- [ ] `uses[]` labels resolve to existing blocks
- [ ] Fenced `` ```tex `` blocks have `rendered:` SVGs in manifest
- [ ] Observed/derived values use `$\approx$` not `$=$` (unless `$O(\cdot)$` error term present)
{% endraw %}
