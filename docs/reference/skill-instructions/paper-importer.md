---
layout: default
title: Paper Importer
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/paper-importer.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/paper-importer.md) — do not edit here.

{% raw %}
# Paper Importer

> **Bib human-review integration.** When importing a paper whose
> results back a `references.ts` entry, place the formalisation in a **per-paper
> Lean package** (wrap, don't duplicate, any overlap with the main paper's results)
> and drive the ref's status through [`bib-human-review`](bib-human-review.md)
> (`source-in-repo` once the cited passage is identified → `validated` after
> source-match + bib validation). The on-photo automation lives in
> [`bib-photo-ingestion-watcher`](bib-photo-ingestion-watcher.md).

## Overview

This skill imports external mathematical papers into the content object
system. It handles three input formats:

1. **PDF upload** — stored in `uploads/<paper-id>/`, OCR/text-extracted
2. **LaTeX source upload** — stored in `uploads/<paper-id>/`, parsed directly
3. **arXiv reference** — fetched via arXiv API, source downloaded to `uploads/`

The output is a new paper directory under `content/` with properly typed
content objects (.ts + .md triples), ready for formalization.

## When to Use This Skill

- User says "import paper", "add paper from arXiv", "upload PDF/LaTeX"
- User provides an arXiv ID (e.g. `2301.12345`) or URL
- User wants to incorporate external results into the formalization
- Proof-writer skills need to reference external theorems

## Import Pipeline

### Phase 1: Acquisition

| Source | Action |
|--------|--------|
| PDF file | Store in `uploads/<paper-id>/original.pdf` |
| LaTeX file(s) | Store in `uploads/<paper-id>/` preserving structure |
| arXiv ID | Fetch metadata via API, download source tarball to `uploads/<paper-id>/` |

**Preferred fetch path:** when the session
network allows `arxiv.org`, use the `paper-search-mcp` MCP server
rather than raw `curl` / `WebFetch`:

| Tool | Use for |
|------|---------|
| `paper-search-mcp.search_arxiv(query=…)` | resolve an author/title to an arxiv ID + canonical metadata (title, authors, year, abstract, primary category) — feeds `import-meta.json` |
| `paper-search-mcp.download_arxiv(arxiv_id, output_dir="uploads/<paper-id>/")` | fetch the PDF to `uploads/` with the canonical arxiv-id-named filename — single call, no shell |
| `paper-search-mcp.read_arxiv_paper(arxiv_id)` | parsed text body for downstream environment extraction (Phase 2) — useful when PDF OCR is brittle |
| `openalex-paper-search.get_work(doi=…)` | metadata-only path for papers without an arxiv preprint (paywalled or pre-arxiv era) — fills the same `import-meta.json` shape |

Sandboxed sessions (Claude-Code-on-the-web with the github-only
allowlist) cannot reach `arxiv.org` / `api.openalex.org`; the MCP
servers stay configured but fail soft. In those sessions, queue
the actual fetch onto `scripts/upload-bib-papers.sh` running on a
normal-network machine (handoff documented in
[`bib-qa.md §Batch intake pipeline`](bib-qa.md#batch-intake-pipeline)).

All uploads are committed to the repo under `uploads/` for reprocessing.
Metadata is stored in `uploads/<paper-id>/import-meta.json`:

```json
{
  "source": "arxiv",
  "arxivId": "2301.12345",
  "url": "https://arxiv.org/abs/2301.12345",
  "title": "...",
  "authors": ["..."],
  "fetchedAt": "2026-03-22T...",
  "format": "latex",
  "files": ["main.tex", "macros.tex", "..."]
}
```

### Phase 2: Environment Extraction

Scan LaTeX source (or extracted text from PDF) for formal environments:

```
\begin{theorem} ... \end{theorem}       → TheoremBlock
\begin{definition} ... \end{definition} → DefinitionBlock
\begin{proposition} ... \end{proposition} → PropositionBlock
\begin{lemma} ... \end{lemma}           → LemmaBlock
\begin{corollary} ... \end{corollary}   → CorollaryBlock
\begin{conjecture} ... \end{conjecture} → ConjectureBlock
\begin{example} ... \end{example}       → ExampleBlock
\begin{remark} ... \end{remark}         → RemarkBlock
\begin{proof} ... \end{proof}           → ProofBlock
```

Also extract:
- `\label{}` → used for cross-references
- `\ref{}` / `\cite{}` → mapped to `uses[]` dependencies
- Sectioning (`\section{}`, `\chapter{}`) → chapter/section structure
- Custom theorem environments (`\newtheorem{thm}` etc.)

**Important**: This phase requires user interaction. Present extracted
blocks to the user for review before committing:
- Show count of each kind found
- Let user preview, rename, skip, or re-classify blocks
- Let user define the paper ID and chapter structure

### Phase 3: Content Object Generation

For each confirmed block, generate:

1. **`.ts` manifest** — using `content/schema/builders.ts`:
   ```typescript
   import { theorem } from "../../schema/builders";
   export default theorem({
     label: "thm:imported-main-result",
     title: "Main Theorem (Smith 2024)",
     uses: ["def:imported-widget"],
     tags: ["imported", "arxiv:2301.12345"],
     meta: {
       source: "arxiv:2301.12345",
       originalLabel: "thm:main",
       originalSection: "3.2",
       importedAt: "2026-03-22T..."
     }
   });
   ```

2. **`.md` content** — the environment body converted from LaTeX to
   project markdown conventions:
   - Inline math: `$...$` (preserved)
   - Display math: `$$...$$`
   - Complex TeX: fenced ` ```tex ` blocks
   - Cross-refs: `[text](#label)` with imported prefix

### Phase 4: Lean Stub Generation (Optional, User-Confirmed)

User selects which blocks to formalize. For each:

1. Generate `.lean` file with declaration stub + `sorry`:
   ```lean
   -- Imported from: arXiv:2301.12345, Section 3.2
   -- Ref: [smith2024] https://doi.org/10.xxxx/xxxxx

   /-- Main theorem from Smith (2024). -/
   theorem imported_main_result : ... := by
     sorry
   ```

2. Update `.ts` manifest (use the package-qualified `ref` URI; see
   `folio-assistant/schemas/lean-packages.ts` for package names):
   ```typescript
   lean: { ref: "<paper-pkg>:<Paper>.Imported.Smith2024.imported_main_result" },
   status: "stated"
   ```

3. Every `sorry` MUST have a `-- Ref:` comment citing the source paper.

### Phase 5: Todo Suggestions (NOT Auto-Created)

The importer **suggests** todos to the user but does NOT create them
automatically. Suggestions are presented in the UI for user confirmation:

- "Formalize proof of [thm:imported-X]" — when a theorem has no .lean
- "Verify statement of [def:imported-Y]" — for all imported definitions
- "Connect [thm:imported-Z] to existing [thm:main-result]" — when
  dependency analysis suggests a relationship
- "Add CSL-JSON entry for [source]" — if citation not in references.ts

Only when the user explicitly confirms a suggestion does it become a todo
in the feedback system.

## Integration with Proof-Writer Skills

### How proof-writers use imported papers

The `formalizer`, `proof-triage`, and `category-theory` skills can:

1. **Search imported blocks** via `tags: ["imported"]` filter
2. **Reference imported theorems** in `uses[]` of main paper blocks
3. **Look up original context** via `meta.source` and the upload files
4. **Cite sorry'd proofs** with the imported paper's reference

### Cross-paper dependency tracking

When a block in one paper `uses` a block from another paper, use
**qualified references** with the target paper's directory name:

```typescript
// In the main paper, referencing another paper in the folio
export default proposition({
  label: "prop:some-derived-result",
  uses: [
    "rem:some-local-remark",                  // same paper (bare label)
    "other-paper:cor:foo",                    // cross-paper (paper-dir:label)
  ],
});
```

**Syntax:**
- Same paper: bare label (`"def:foo"`)
- Same folio: `"paper-dir:label"` (`"other-paper:cor:foo"`)
- External folio: full URL (`"https://folio.example.org/viewer/#/view/paper-id"`)

The validation pipeline (`uses-resolve` in `constraints.ts`) skips
qualified refs — they are resolved at folio level, not per-paper.

### Folio registration and viewer URL

Every imported paper must be registered in `content/folio.ts`:

```typescript
paperRef({
  dir: "other-paper",
  title: "Title of the Imported Paper",
  url: "/viewer/#/view/other-paper",  // viewer route
  tags: ["algebra"],
}),
```

The `url` field enables:
- Cross-paper link resolution in the viewer
- CSL-JSON `URL` field for folio-hosted citations
- Read-only import of external folios for referencing

### Bibliography integration for imported papers

When the imported paper has a folio viewer URL, include the URL
in its CSL-JSON entry in `content/schema/references.ts`:

```typescript
ref({
  id: "smithjones2004",
  type: "article-journal",
  author: [
    { family: "Smith", given: "Alice" },
    { family: "Jones", given: "Bob" },
  ],
  title: "On the structure of widgets",
  issued: { "date-parts": [[2004]] },
  URL: "https://arxiv.org/abs/math/0409565",
}),
```

The dependency graph links across papers. Proof-writers can traverse
this to understand what external results are being relied upon.

### Imported theorem discovery

Proof-writers should check imported papers when:
- Stuck on a sorry → search imported blocks for relevant lemmas
- Planning formalization → check if imported results provide shortcuts
- Writing proofs → `uses[]` chain may lead to an imported theorem

Use the tag filter: `tags.includes("imported")` on any block search.

## arXiv Integration

### Fetching papers

```
GET https://export.arxiv.org/api/query?id_list=2301.12345
```

Returns Atom XML with title, authors, abstract, categories.

### Source download

```
GET https://arxiv.org/e-print/2301.12345
```

Returns `.tar.gz` of LaTeX source (when available).

### Metadata extraction

Parse the Atom response for:
- Title, authors, abstract
- DOI (if available)
- Categories (math.AG, hep-th, etc.)
- Published/updated dates

## Bibliography Integration

When importing, check `content/schema/references.ts` for existing entry:
- If found, use that citation key
- If not found, add a `ref()` entry (user confirms)
- After adding, run `bun run export-bibtex` to regenerate `references.bib`

Generated CSL-JSON entry in `references.ts`:
```typescript
ref({
  id: "smith2024",
  type: "article-journal",
  title: "On the Structure of Widgets",
  author: [
    { family: "Smith", given: "Alice" },
    { family: "Jones", given: "Bob" },
  ],
  "container-title": "arXiv preprint",
  issued: { "date-parts": [[2024]] },
  note: "arXiv:2301.12345",
}),
```

## File Organization

```
uploads/
  <paper-id>/
    import-meta.json          ← source metadata
    original.pdf              ← uploaded PDF (if applicable)
    main.tex                  ← LaTeX source (if applicable)
    *.tex                     ← additional source files
    extracted-blocks.json     ← extraction results (cached)

content/
  <paper-id>/
    <paper-id>.ts             ← paper manifest
    imported-<source>/
      imported-<source>.ts    ← chapter manifest
      <block-name>.ts         ← content object manifests
      <block-name>.md         ← content markdown
      <block-name>.lean       ← Lean stubs (when requested)
```

## Checklist

Before completing an import:

- [ ] Source files stored in `uploads/<paper-id>/` with `import-meta.json`
- [ ] User has reviewed and confirmed extracted blocks
- [ ] All `.ts` manifests use correct builders and label prefixes
- [ ] All `.md` files follow project markdown conventions
- [ ] All blocks tagged with `["imported", "<source-ref>"]`
- [ ] `meta.source` populated on every imported block
- [ ] CSL-JSON entry exists in `content/schema/references.ts` (or suggested to user)
- [ ] Any `.lean` files have `sorry` with `-- Ref:` citations
- [ ] `.ts` manifests have `lean.ref` URI set for definition blocks
- [ ] Todo suggestions presented to user (NOT auto-created)
- [ ] Chapter manifest references all blocks in order
- [ ] Paper manifest added to `content/folio.ts` (or existing paper updated)
{% endraw %}
