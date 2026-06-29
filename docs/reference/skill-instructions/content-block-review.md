---
layout: default
title: Content Block Review
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/content-block-review.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/content-block-review.md) — do not edit here.

{% raw %}
# Content Block Review

## Role

Systematically audit content blocks (`.ts` + `.md` + `.lean` triples) against
project requirements and flag everything that does not conform. This is a
**read-only review skill** — it reports problems but does not fix them.

## When to Use

- "review blocks", "audit content", "check blocks", "what's broken"
- Before a release or major merge
- After bulk edits to content objects
- Periodic health checks on the content layer

## Review Checklist

Run every check below for each content block. Report violations grouped by
block, with severity (error / warning / info).

### 1. File triple completeness

| Check | Severity | Rule |
|-------|----------|------|
| `.ts` manifest exists | **error** | Every block must have a manifest |
| `.md` sibling exists | **error** | Every block (except `equation`/`diagram`) needs narrative |
| `.lean` sibling exists for `definition` | **error** | Definitions **require** Lean formalization |
| `.lean` sibling exists for `theorem`/`lemma`/`proposition`/`corollary` | **warning** | Provable blocks should have Lean |
| Sibling files share the same root name | **error** | `foo.ts`, `foo.md`, `foo.lean` — not mismatched names |
| **No orphan `.lean` files** | **error** | Every `.lean` file MUST have a `.ts` manifest sibling. A `.lean` file without a `.ts` is never valid — Lean files are always part of a content triple, never standalone. |

### 2. Label conventions

| Check | Severity | Rule |
|-------|----------|------|
| Label prefix matches kind | **error** | `definition` → `def:`, `theorem` → `thm:`, `lemma` → `lem:`, `proposition` → `prop:`, `corollary` → `cor:`, `conjecture` → `conj:`, `example` → `ex:`, `remark` → `rem:` |
| Label is unique across the paper | **error** | No duplicate labels |
| Labels in `uses[]` resolve to existing blocks | **error** | Dangling cross-references break the dependency graph |

### 3. Lean declaration consistency

| Check | Severity | Rule |
|-------|----------|------|
| `lean.ref` URI in `.ts` matches actual declaration in `.lean` | **error** | The manifest must name the real Lean declaration (parse with `parseLeanRef()`) |
| Declaration lives under the paper's `<Paper>.*` namespace | **warning** | All project declarations should be namespaced |
| Naming convention followed (hyphens → underscores, correct case) | **warning** | See AGENTS.md naming table |
| Block kind matches Lean construct (`definition` → `def`/`structure`/`class`, `theorem` → `theorem`/`lemma`) | **warning** | A `definition` block should not contain a `theorem` in Lean |

### 4. Sorry discipline

| Check | Severity | Rule |
|-------|----------|------|
| Every `sorry` has a preceding `-- Ref: [key]` comment | **error** | Unannotated sorry is always a violation |
| `[key]` in `-- Ref:` exists in `content/schema/references.ts` | **error** | Orphan citation keys break the reference chain |
| No `admit` or `native_decide` (unless justified) | **warning** | These bypass the kernel |
| No `axiom` declarations (unless `Axiom.lean`) | **warning** | Axioms should be centralized |

### 5. Markdown content quality

| Check | Severity | Rule |
|-------|----------|------|
| `.md` is non-empty | **error** | Empty narrative blocks are placeholders, not content |
| Math delimiters balanced (`$...$`, `$$...$$`) | **warning** | Unbalanced delimiters break LaTeX rendering |
| Cross-refs use `[text](#label)` format | **info** | Ensures `\hyperref` conversion works |
| No raw LaTeX commands outside `` ```tex `` fences | **warning** | Raw `\begin{tikzcd}` in markdown breaks rendering |

### 7. Dependency graph health

| Check | Severity | Rule |
|-------|----------|------|
| `uses[]` entries all resolve | **error** | Bare labels must exist in same paper; qualified `"paper-dir:label"` refs are cross-paper (resolved at folio level) |
| No circular dependencies in `uses[]` | **error** | DAG must be acyclic (cross-paper refs are leaf nodes in the local graph) |
| Lean imports mirror `uses[]` ordering | **info** | Lean import graph should reflect narrative dependencies |
| Blocks with most dependents are formalized first | **info** | Priority guidance, not a hard rule |

### 8. Chapter manifest consistency

| Check | Severity | Rule |
|-------|----------|------|
| Every block file in the directory is referenced in the chapter `.ts` | **warning** | Orphan blocks won't appear in output |
| Chapter `.ts` references only blocks that exist | **error** | Dangling block references break the build |
| Section ordering in chapter `.ts` is consistent | **info** | Sections should follow a logical order |

### 10. Glossary terms (`:defterm` / `:refterm`)

| Check | Severity | Rule |
|-------|----------|------|
| Every slug in `defines: [...]` has a `:defterm[…]{#slug}` in the block's `.md` | **warning** | `defterm-marked` rule (validator) |
| Every `:defterm[…]` slug appears in the block's `defines: [...]` | **error** | `defterm-declared` rule |
| Every `:refterm[…]` resolves to some block's `defines: [...]` | **error** | `refterm-resolves` rule |
| No slug declared by more than one block | **warning** | `defterm-unique` rule; collapse duplicates by adding `interprets:` to the secondary block |
| Bare-text mentions of known slugs are wrapped (`--strict`) | **warning** | `term-mention-coverage` rule; run `bun run validate <paper> --strict` |
| Defined terms are not styled as plain text or `\emph{}` in `.md` | **warning** | Defeats the validator's resolution graph; rewrap with the codemod |

Run `bun run pipeline/build-glossary.ts <paper> --check` as a CI gate
to catch duplicate slugs and out-of-date `glossary.json`. See
`glossary-build` skill.

## Output Format

Report findings as a structured summary:

```
## Content Block Review: <paper-name>

### Errors (must fix)
- **<block-label>** (<file>): <description>
  - Rule: <rule-id>

### Warnings (should fix)
- **<block-label>** (<file>): <description>

### Info (consider)
- **<block-label>** (<file>): <description>

### Summary
- Blocks reviewed: N
- Errors: N | Warnings: N | Info: N
- Blocks fully compliant: N / N
```

## How to Run

### Full paper review

1. List all content blocks: use `content_list` MCP tool or glob
   `content/<paper>/**/*.ts` (exclude chapter/paper manifests)
2. For each block `.ts`, read the manifest and check §1–§8
3. For blocks with `.lean`, read the Lean source and check §3–§4
4. For `uses[]` and label uniqueness, collect all labels first (§2, §7)
5. Cross-check against `content/schema/references.ts` for sorry citations (§4)

### Single chapter review

Same as above but scoped to one chapter directory.

### Quick check (just errors)

Skip severity=info and severity=warning. Only report errors.

### 9. Glossary block compliance

| Check | Severity | Rule |
|-------|----------|------|
| Glossary blocks use `remark` kind | **error** | Glossary entries must be `remark` blocks, not `definition` |
| Glossary blocks have `"glossary"` tag | **warning** | Tag enables filtering and discovery |
| Label follows `rem:glossary-<term>` pattern | **warning** | Consistent naming for glossary entries |
| `.md` includes "Mathlib reference" section | **warning** | Glossary entries must cite the canonical Mathlib type |
| No Lean file exists for glossary blocks | **info** | Glossary blocks are terminological wrappers — Lean formalization is not expected |
| Glossary block does not duplicate a `definition` block | **error** | If the paper introduces new mathematics, it belongs as a `definition`, not a glossary entry |
| Terms used in chapter `.md` files that are Mathlib synonyms have glossary entries | **info** | Completeness check — missing glossary entries for standard terms |

## Integration

- Runs **before** `content-validation` (which does schema + AST validation)
- Complements `lean-proof-review` (which focuses on proof quality, not
  structural compliance)
- Feeds into `proof-triage` (violations of §4–§5 indicate formalization gaps)
- Glossary blocks are reviewed under §9 for terminology consistency
{% endraw %}
