---
layout: default
title: Rendering Auditor
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/rendering-auditor.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/rendering-auditor.md) — do not edit here.

{% raw %}
# Rendering Auditor

## Role

Multi-pass linter that catches rendering errors in content blocks before they
reach the HTML viewer or PDF output. Runs five sequential passes, each
progressively more expensive. Early passes catch structural issues cheaply;
later passes catch visual and layout problems that require actual rendering.

## When to Use

- **After editing a content block** — author agents should run at least
  passes 1-3 on the edited block before committing
- **QC report** — run all 5 passes across all blocks (or a chapter)
- **"audit rendering"**, **"check rendering"**, **"rendering issues"**
- **Before a release or merge** — full audit on changed blocks
- **Debugging rendering failures** — targeted pass on the failing block

## Architecture

```
Pass 1: Syntax        (AST-based, fast, catches structural errors)
Pass 2: Notation      (cross-reference check, medium speed)
Pass 3: Compilation   (lightweight TeX→SVG/HTML, catches TeX errors)
Pass 4: Layout        (full pdflatex, catches overfull hbox etc.)
Pass 5: Visual        (render + inspect both pipelines, catches display bugs)
```

Each pass produces diagnostics at three severities: **error**, **warning**,
**info**. Errors in an earlier pass should be fixed before running later
passes (garbage-in-garbage-out).

---

## Pass 1: Markdown + TeX Syntax

**Tools**: remark AST (remark-gfm + remark-math), unified-latex AST, Zod schema
**Speed**: Fast (no compilation)

### Checks

| Check | Severity | How |
|-------|----------|-----|
| Math delimiters balanced (`$...$`, `$$...$$`) | **error** | remark-math parse — unmatched delimiters produce parse errors |
| Display math `$$` on own line with preceding blank line | **error** | Regex: `$$` not preceded by blank line causes mixed `\[`/`$$` in rendered output |
| Braces balanced inside math | **error** | unified-latex parse of each math snippet |
| `\begin{env}` matches `\end{env}` in `` ```tex `` blocks | **error** | unified-latex environment balance check |
| No raw LaTeX commands outside `$...$` or `` ```tex `` | **error** | Grep for `\mathrm`, `\textbf`, `\emph`, `\begin` etc. outside math context — renders as literal text |
| No `$$...$$` with content on same line as delimiters | **error** | Pipeline splits opening `\[` from closing `$$`, producing mixed-delimiter LaTeX error |
| No bare `\eqref{}` outside math mode | **error** | Renders as literal text in HTML; use `[text](#label)` cross-ref instead |
| Markdown list syntax correct (`1.` / `-` with proper indentation) | **warning** | remark AST — malformed lists produce paragraph nodes instead |
| Markdown table syntax valid (pipe-delimited, header separator) | **warning** | remark-gfm AST parse — invalid tables render as plain text; valid tables become `\begin{tabular}` with booktabs |
| Bare `_` in table cells outside math/code | **error** | Underscores trigger LaTeX subscript; wrap in backticks or `$...$` |
| Table cells with bare identifiers (Lean decls etc.) | **error** | Must use backtick inline code: `` `Paper.Foo.bar_baz` `` → `\texttt{Paper.Foo.bar\_baz}` |
| Block `.ts` manifest validates against Zod schema | **error** | `BlockSchema.safeParse()` |
| Title math preserved in `$...$` delimiters (not bare TeX) | **error** | Check `.ts` title field for bare `\mathrm{}` etc. without `$` wrapping |
| Fenced code blocks have language tag | **info** | `` ``` `` without `tex` tag won't pass through correctly |
| `&` outside math mode | **error** | Ampersands in prose become column separators in LaTeX, breaking compilation |

### Running Pass 1

```bash
cd content && bun run pipeline/validate.ts <paper>/<chapter>/<block>.ts
```

Or for remark + unified-latex AST on the `.md` directly:

```bash
cd content && bun run pipeline/validate-tex.ts <paper>/<chapter>/<block>.md
```

### Manual inspection (when tools unavailable)

1. Read the `.md` file
2. Extract all math snippets (between `$...$`, `$$...$$`, `` ```tex ``...`` ``` ``)
3. Check brace balance in each snippet
4. Check for raw TeX commands in prose (outside delimiters)
5. Verify markdown table formatting (consistent column counts, separator row)
6. Check that display math has blank line before `$$`

---

## Pass 2: Notation Consistency

**Tools**: Grep, glossary.json, references.ts, AGENTS.md notation register
**Speed**: Medium (cross-reference lookups)

### Checks

| Check | Severity | How |
|-------|----------|-----|
| All math symbols used are defined in the paper or glossary | **warning** | Extract symbols from math AST, cross-ref against glossary.json and notation remarks |
| Notation register compliance (project AGENTS.md notation section) | **error** | Verify each symbol's font/register matches the project's notation register; a symbol used with the wrong font/register (e.g. plain where the register calls for fraktur, bold, or calligraphic) should match the project's notation register defined in the project's AGENTS.md notation section |
| No notation collisions | **error** | Flag a single symbol used for two distinct concepts, or a concept written with a symbol that the notation register reserves for something else |
| Category notation conventions | **error** | Flag font/register used for categories that the notation register reserves for another role (e.g. a calligraphic letter reserved for sheaves/bundles being used for a category) |
| Observed/derived values use `$\approx$` not `$=$` | **error** | Numerical predictions must use `$\approx$` unless an `$O(\cdot)$` error term is present |
| Defined terms wrapped in `:defterm` / `:refterm` | **error / warning** | Every slug in any block's `defines[]` must be wrapped at every mention. Run `bun run validate <paper> --strict` to fire `term-mention-coverage` warnings on bare-text mentions of known slugs. Bare `\emph{}` of a defined term is a register violation. |
| `\cite{key}` keys resolve to references.ts | **error** | Every citation key must exist in the bibliography |
| Cross-ref labels `[text](#label)` resolve | **error** | Labels in `uses[]` and markdown cross-refs must point to existing blocks |
| Undefined macros (custom commands not in preamble) | **warning** | Extract `\commandname` tokens, check against main.tex preamble and standard LaTeX/amsmath |

### Symbol extraction procedure

1. Parse `.md` with remark-math to get all math nodes
2. From each math node, extract macro names (`\commandname`) and single-letter
   variables (Latin and Greek)
3. Cross-reference each against:
   - The notation register in the project's AGENTS.md (font/register compliance)
   - `glossary.json` (term is defined)
   - The block's `uses[]` dependencies (symbol comes from a referenced block)
   - Standard LaTeX/amsmath commands (no check needed for `\frac`, `\int`, etc.)
4. Flag anything that doesn't appear in any of these sources

### Common notation violations

The project's notation register (in AGENTS.md) defines the canonical
font/symbol for each concept — which font/register each role uses, and which
symbols are reserved for which concepts. The auditor flags deviations from that
register: wrong-font symbols, reserved symbols used for the wrong role, and
symbol collisions. Treat the project's notation register as the source of truth
and report any mismatch against it.

---

## Pass 3: Compilation Check

**Tools**: KaTeX (for HTML), lightweight TeX compilation (for LaTeX)
**Speed**: Medium (per-snippet compilation, no full document build)

### Purpose

Validate that every math snippet and TeX block actually compiles, without
running the full pdflatex pipeline. This catches TeX errors early.

### Checks

| Check | Severity | How |
|-------|----------|-----|
| Every `$...$` snippet renders in KaTeX without error | **error** | Call KaTeX `renderToString()` in strict mode |
| Every `$$...$$` snippet renders in KaTeX display mode | **error** | KaTeX display mode rendering |
| Every `` ```tex `` block compiles standalone | **error** | Wrap in minimal document, compile with pdflatex or latex→svg |
| tikzcd diagrams compile | **error** | Standalone compilation with tikz-cd package |
| Custom macros from `main.tex` preamble are available | **warning** | Include preamble definitions in test compilation |
| No KaTeX unsupported commands used without fallback | **warning** | Some valid LaTeX doesn't work in KaTeX (e.g. `\operatorname` → use `\mathrm`) |
| `\operatorname{}` → `\mathrm{}` | **error** | Some markdown/KaTeX renderers reject `\operatorname`; project convention is `\mathrm` |
| `\mathscr{}` KaTeX compatibility | **warning** | Needs KaTeX >=0.16; consider `\mathcal{}` fallback |

### KaTeX-specific issues to check

| Pattern | Issue | Fix |
|---------|-------|-----|
| `\operatorname{X}` | KaTeX may error | Use `\mathrm{X}` |
| `\DeclareMathOperator` | Not available in KaTeX | Pre-define in preamble or use `\mathrm` |
| `\newcommand` in math | Not available in KaTeX | Define in preamble |
| `\mathscr` | Needs font extension | Use `\mathcal` or configure KaTeX macros |
| `\tikzcd` | Not available in KaTeX | Render as SVG, embed as image |

### Running Pass 3

For HTML pipeline validation:
```bash
cd content && bun run pipeline/validate-tex.ts --katex <block>.md
```

For LaTeX snippet compilation:
```bash
cd content && bun run pipeline/validate-tex.ts --compile <block>.md
```

### Manual check (when compilation tools unavailable)

1. Read the `.md` file
2. For each math snippet, check against the KaTeX supported functions list
3. For `` ```tex `` blocks, verify all packages are loaded in `main.tex`
4. Flag `\operatorname`, `\DeclareMathOperator`, `\newcommand` in inline contexts

---

## Pass 4: Layout Check

**Tools**: pdflatex with `-interaction=nonstopmode`, log parsing
**Speed**: Slow (full or partial pdflatex compilation)

### Purpose

Catch layout and formatting issues that only appear in the PDF output:
overfull/underfull boxes, float placement problems, page breaks in bad
locations, and other pdflatex warnings.

### Checks

| Check | Severity | How |
|-------|----------|-----|
| No `Overfull \hbox` warnings | **warning** | Parse pdflatex log for `Overfull \\hbox` |
| No `Underfull \hbox` warnings (badness > 5000) | **info** | Parse log; only flag severe underfull |
| No `Overfull \vbox` warnings | **warning** | Parse log |
| No missing font warnings | **error** | Parse log for `Font ... not found` |
| No missing package warnings | **error** | Parse log for `Package ... not found` |
| Float placement (`[h]`, `[t]`, `[H]`) consistent | **info** | Grep for float specs in rendered `.tex` |
| No orphan/widow lines | **info** | Parse log for `Underfull \\vbox (badness 10000)` at page breaks |
| Label multiply defined warnings | **error** | Parse log for `multiply defined` |
| Reference undefined warnings | **error** | Parse log for `Reference.*undefined` |
| Citation undefined warnings | **error** | Parse log for `Citation.*undefined` |

### Running Pass 4

```bash
# Build the chapter's .tex file
cd content && bun run pipeline/build.ts <paper>/<paper>.ts \
  --out-dir ../chapters/

# Compile with nonstopmode and capture log
cd <repo-root> && pdflatex -interaction=nonstopmode -file-line-error main.tex 2>&1 | tee build.log

# Parse log for issues
grep -n 'Overfull\\|Underfull\\|Warning\\|Error\\|undefined\\|multiply defined' build.log
```

### Common layout fixes

| Issue | Typical fix |
|-------|------------|
| Overfull hbox in equation | Add `\allowbreak` or split into `align` environment |
| Overfull hbox in text | Rephrase or add `\-` hyphenation hints |
| Overfull hbox in tikzcd | Increase `column sep` |
| Float too far from reference | Use `[H]` (requires `float` package) or restructure |
| Orphan/widow | Add `\needspace{4\baselineskip}` before block |

---

## Pass 5: Visual Verification

**Tools**: HTML rendering (mdToHtml + KaTeX), PDF rendering (pdflatex),
visual inspection
**Speed**: Slowest (requires rendering + inspection of output)

### Purpose

Verify that rendered output looks correct in both pipelines. Catches issues
that pass compilation but produce wrong visual output.

### Checks

| Check | Severity | How |
|-------|----------|-----|
| No unrendered TeX visible in HTML (e.g. `\blah` as text) | **error** | Inspect HTML output for literal backslash sequences outside `<code>` |
| No KaTeX error boxes (red text) in HTML | **error** | Search rendered HTML for `class="katex-error"` |
| Display math renders as centered block (not inline) | **warning** | Verify `$$...$$` produces display-mode KaTeX spans |
| Inline math stays inline (not block-level) | **warning** | Verify `$...$` produces inline-mode KaTeX spans |
| Markdown tables render as HTML tables | **warning** | Verify `<table class="md-table">` in output |
| Markdown tables have correct column count per row | **error** | Check rendered table for ragged columns |
| Bold/italic renders correctly (not literal `**` or `*`) | **warning** | Check for literal asterisks in rendered output |
| Cross-refs render as links (not raw `[text](#label)`) | **warning** | Check for `<a class="uref">` in output |
| Lists render as `<ol>`/`<ul>` (not raw numbers/dashes) | **warning** | Check for proper list elements in output |
| tikzcd diagrams visible (not blank or error) | **error** | Check for rendered SVG or image in both pipelines |
| PDF equations match HTML equations | **info** | Visual comparison of key equations |
| No overlapping text in PDF | **error** | Check for text collisions in dense sections |
| Fenced `` ```tex `` blocks with pre-rendered SVGs display correctly | **warning** | Verify SVG embed or image fallback is present |

### Viewer-specific checks (discovered 2026-04-02 audit)

| Check | Severity | How |
|-------|----------|-----|
| Multi-line inline `$...$` renders in list items | **error** | The viewer `parseMd()` joins list continuation lines; `inl()` must handle escaped braces `\{`/`\}` (skip `\` + next char, don't count as depth) |
| Title math in `$...$` renders (not raw) | **error** | `mkBlockHeader()` calls `inl(title)` then `renderMath(div)`; if KaTeX is not yet loaded or macros empty, math shows as raw — verify KaTeX loads before block rendering |
| Simulator blocks validate against current schema | **error** | `SimulatorBlock` requires `html: string` + `defaultView: SimulatorView`; deprecated `simulator: {type, source}` field causes Zod parse failure |
| Content blocks in correct chapter directory | **error** | Block `.ts`/`.md` must be in the chapter directory that references them in its manifest |
| `\{` and `\}` in inline math don't break `$` parser | **error** | The `inl()` brace-depth tracker must skip `\{`/`\}` (escaped braces); otherwise the closing `$` is never found and math shows as raw text |

### HTML visual verification procedure

1. Build the paper JSON:
   ```bash
   cd content && bun run pipeline/export-json.ts
   ```

2. For each content block in the output, check:
   - **Math rendering**: No literal `\` sequences visible outside code blocks
   - **Table rendering**: Pipe characters `|` should not be visible (should be HTML table)
   - **List rendering**: Numbers and dashes should be proper list items
   - **Cross-refs**: `[text](#label)` should be clickable links
   - **Display math**: Centered and on its own line
   - **Inline math**: Flows with surrounding text

3. Grep for rendering failures:
   ```bash
   # Find unrendered LaTeX in HTML output
   grep -Pn '(?<!\\)\\[a-zA-Z]+\{' output.html | grep -v 'class="katex"'

   # Find KaTeX errors
   grep -n 'katex-error' output.html

   # Find literal markdown in HTML
   grep -Pn '(?<!\w)\*\*[^*]+\*\*(?!\w)' output.html
   ```

### PDF visual verification procedure

1. Compile the document:
   ```bash
   pdflatex -interaction=nonstopmode main.tex && pdflatex main.tex
   ```

2. For each content block, check:
   - **Equation rendering**: All symbols display correctly
   - **Diagram rendering**: tikzcd arrows and labels visible
   - **Cross-references**: No `??` placeholders
   - **Citations**: No `[?]` placeholders
   - **Page layout**: No text running off page margins

---

## Output Format

### Per-block report

```
## Block: def:my-structure (my-structures)

### Pass 1: Syntax ✓
No issues.

### Pass 2: Notation
- WARNING line 12: symbol used with the wrong font/register — should match the project's notation register
- WARNING line 18: Symbol $\xi$ not found in glossary or notation register

### Pass 3: Compilation ✓
All snippets compile in KaTeX and pdflatex.

### Pass 4: Layout
- WARNING: Overfull \hbox (12.3pt too wide) in equation at line 24
- INFO: Underfull \hbox (badness 2100) at line 31

### Pass 5: Visual ✓
HTML and PDF rendering verified.

**Summary: 0 errors, 2 warnings, 1 info**
```

### QC summary report

```
# Rendering Audit — Chapter 3
Date: 2026-03-29
Blocks audited: 24
Passes run: 1-5

| Severity | Count |
|----------|-------|
| Error    | 3     |
| Warning  | 11    |
| Info     | 5     |

## Errors (fix before merge)
1. def:some-definition line 8: Unbalanced braces in display math
2. thm:some-theorem line 22: \operatorname{Ad} — KaTeX compilation failure
3. rem:some-remark: Dangling remark — no `interprets` field

## Warnings (fix before release)
1. prop:some-proposition line 15: symbol used with the wrong font/register → should match the notation register
2. ...
```

---

## Integration with Author Workflow

### After editing a block

Author agents should run passes 1-3 automatically after modifying a content
block. Add to the edit workflow:

```
1. Edit .md and/or .ts file
2. Run Pass 1 (syntax) — fix any errors
3. Run Pass 2 (notation) — fix register violations
4. Run Pass 3 (compilation) — fix TeX errors
5. Commit
```

Passes 4-5 are optional per-edit but required for QC reports.

### QC report trigger

Run all 5 passes when:
- Preparing a release
- Reviewing a chapter
- Responding to "audit rendering" or "QC report" requests
- After bulk imports (paper-importer, document-intake)

### Relation to other skills

| Skill | Overlap | Division of responsibility |
|-------|---------|--------------------------|
| `latex-validation` | Pass 1 (syntax), Pass 4 (layout) | latex-validation focuses on `.tex` files; rendering-auditor works on `.md` content blocks through both pipelines |
| `html-rendering-qc` | Pass 3 (KaTeX), Pass 5 (visual HTML) | html-rendering-qc documents known limitations; rendering-auditor actively checks for them |
| `content-validation` | Pass 1 (schema), Pass 2 (cross-refs) | content-validation checks structural integrity; rendering-auditor checks rendering correctness |
| `content-block-review` | Pass 1-2 (some overlap) | content-block-review is broader (Lean, sorry discipline, etc.); rendering-auditor is deeper on rendering |
| `md-authoring` | Pass 1 (conventions) | md-authoring defines conventions; rendering-auditor enforces them |
| `scientific-accuracy` | Pass 2 (notation) | scientific-accuracy checks mathematical correctness; rendering-auditor checks notation register compliance |

### Escalation

If rendering-auditor finds issues it cannot diagnose:
- **Structural/schema issues** → defer to `content-validation`
- **Lean-related issues** → defer to `lean-generation` or `lean-build-fix`
- **Scientific notation questions** → defer to `scientific-accuracy` + `ontologist`
- **Complex layout problems** → defer to `latex-validation` with the specific `.tex` output
{% endraw %}
