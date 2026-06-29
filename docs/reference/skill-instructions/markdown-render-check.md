---
layout: default
title: Markdown Render Check
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/markdown-render-check.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/markdown-render-check.md) — do not edit here.

{% raw %}
# Markdown Render Check

## Role

After editing or creating `.md` content blocks, verify the file
renders correctly on GitHub (the canonical view alongside the
LaTeX/HTML pipelines). GitHub's renderer is stricter than the LaTeX
pipeline about a handful of patterns — especially math display blocks
that get hijacked by markdown's list parser. This skill catches those
before the user sees them in the browser.

## When to use

- After editing any `.md` file that contains math (`$...$`, `$$...$$`,
  or fenced ```tex blocks).
- As a final pass when running `prepare-merge` or any review skill on
  content blocks.
- After authoring a new `.md` with multi-line display math, tables,
  or lists adjacent to math.

## Method

### 1. Identify changed `.md` files

```bash
# Files changed vs. the most recent commit
git diff HEAD~1 HEAD --name-only -- '*.md'

# Files changed vs. base branch (when reviewing a PR/branch)
git diff origin/main...HEAD --name-only -- '*.md'
```

### 2. Run the automated grep checks

These patterns are common rendering breaks. Run each grep against the
changed files; any hit is a likely failure.

| Check | Grep | What breaks |
|-------|------|-------------|
| `+` / `-` / `*` at line start inside `$$...$$` | `awk '/^\$\$/{m=!m; next} m && /^[+\-*] /' file.md` | Continuation line of a multi-line display equation gets parsed as a bulleted list, breaking out of math mode. |
| Missing blank line before `$$` | `grep -nB1 '^\$\$' file.md \| awk 'NR%3==1 && $0!~/^--$/ && $0!~/^[[:space:]]*$/' ` | `mdToHtml` regex needs a paragraph break before `$$` to detect display math. |
| `\operatorname{` in math | `grep -n '\\\\operatorname{' file.md` | KaTeX rejects without an extension; use `\mathrm{}`. |
| `\cite{` reference | `grep -n '\\\\cite{' file.md` | OK in this repo (handled by both pipelines), but verify the key exists in `references.ts`. |
| Tab characters in math | `grep -nP '\t' file.md` | Inconsistent rendering; replace with spaces. |
| Bare `_` outside math | `grep -nE '[^$\\][_][^$]' file.md` | LaTeX subscript trigger; wrap identifier in backticks or `$...$`. |

### 3. Manual GitHub verification

For each changed `.md`, hand the user the blob URL on the pushed
branch so they can verify rendering in the browser:

```
https://github.com/<owner>/<repo>/blob/<branch>/<path-to>/<file>.md
```

Always link the `.md` (the rendered view), never a `.ts` or other
sibling — default to the `.md` GitHub link.

If the repo is private, `WebFetch` and `raw.githubusercontent.com`
return 404 unless authenticated. The MCP `mcp__github__get_file_contents`
tool returns raw source only, not the rendered HTML. So *automated*
rendered-view inspection isn't possible from this skill — the
author's eyes on the GitHub blob URL are the ground truth.

## Multi-line display equations — fix recipe

The single most common breakage. **Wrong** (each `+` becomes a bullet):

```md
$$
F(x) = a
+ b
+ c
$$
```

**Right** — operator at end of line, no list trigger:

```md
$$
F(x) = a \;+\;
       b \;+\;
       c
$$
```

`\;` controls the spacing; `,`/`;` after the operator are also fine.
The rule: never start a line inside `$$...$$` with `+`, `-`, or `*`.

## Output

Report each check that failed, with file path and line number, then
list the GitHub blob URLs for the user to eyeball.

If all checks pass, say so explicitly and still print the blob URLs
— the user always wants the link list at the end.

## Cross-references

- `md-authoring` — the authoring conventions this skill verifies.
- `latex-validation` — LaTeX-side render checks (complementary).
- `html-rendering-qc` — HTML viewer (`mdToHtml`) rendering.
- `rendering-auditor` — full pass over rendered LaTeX/HTML output.
{% endraw %}
