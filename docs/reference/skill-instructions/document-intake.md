---
layout: default
title: Document Intake
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/document-intake.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/document-intake.md) — do not edit here.

{% raw %}
# Document Intake

> **Bib human-review integration.** Track per-upload ingestion
> status in `uploads/intake.json` (identified passage, formalised?, matched?) and
> link each upload to the `references.ts` entry it sources. An upload that
> supplies a cited source moves that ref to `source-in-repo` (agent-identified
> passage; no human photo) and then through the
> [`bib-human-review`](bib-human-review.md) ladder to `validated`. Existing
> `uploads/` follow the same agent-sourced path.

## Overview

This skill manages the `uploads/` directory as an intake pipeline for
converting raw documents into structured content objects. It handles:

1. **Scanned PDFs / images** — OCR extraction → text → blocks
2. **LaTeX source** — environment extraction → blocks
3. **Structured / normative guidelines** — normative structure → blocks
4. **arXiv papers** — fetched source → blocks (delegates to paper-importer)
5. **Arbitrary documents** — best-effort structural analysis

The key distinction from `paper-importer`: this skill owns the full
lifecycle of `uploads/`, including tracking processing state, partial
extractions, and multi-pass refinement. Paper-importer focuses on the
final content-object generation step.

## When to Use This Skill

- User says "upload", "scan", "process document", "intake"
- User drops a file into `uploads/`
- User mentions a guideline, standard, or normative document
- User wants to convert a raw document into content objects
- Files appear in `uploads/` that haven't been processed yet

## uploads/ Directory Convention

```
uploads/
  <document-id>/
    intake.json                  ← processing state + metadata
    original.pdf                 ← raw upload (PDF, scan, etc.)
    original.tex                 ← or LaTeX source
    extracted-text.md            ← OCR or parser output (intermediate)
    extracted-blocks.json        ← structured extraction (intermediate)
    mapping.json                 ← label/section mapping decisions
    README.md                    ← human notes about the document
```

### intake.json schema

```json
{
  "id": "example-doc-2016",
  "title": "Title of the Document",
  "source": {
    "type": "pdf",
    "url": "https://...",
    "fetchedAt": "2026-03-25T..."
  },
  "format": "pdf|latex|scan|html|docx",
  "pipeline": {
    "stage": "uploaded|extracted|structured|mapped|generated",
    "extractedAt": null,
    "structuredAt": null,
    "generatedAt": null,
    "errors": []
  },
  "classification": {
    "type": "guideline|paper|report|standard",
    "domain": "health|physics|math|...",
    "normativeLevel": "L1|L2|L3|null"
  },
  "chapters": [],
  "blockCount": 0,
  "targetPaper": "content/<paper-id>/"
}
```

## Pipeline Stages

### Stage 1: Upload (→ `uploaded`)

Place raw files in `uploads/<document-id>/`. Create `intake.json`
with source metadata. Files are committed to git for reproducibility.

Supported formats:
- **PDF** — academic papers, scanned guidelines, reports
- **LaTeX** — `.tex` source bundles
- **HTML** — web-published guidelines, standards
- **DOCX** — Word documents
- **Images** — scanned pages (PNG, JPG, TIFF)

**For academic papers, prefer the MCP fetch path:**
when the session network allows the upstream host, use
`paper-search-mcp` (arxiv / PubMed / bioRxiv / medRxiv) or
`openalex-paper-search` (alex-mcp; OpenAlex catalog) rather than
`curl`/`WebFetch`. The MCP tools return canonical metadata and the
PDF in one call, eliminating the OCR-then-extract-then-name dance.
See [`paper-importer.md §Phase 1`](paper-importer.md#phase-1-acquisition)
for the per-tool routing table. Sandboxed Claude-Code-on-the-web
sessions (github-only allowlist) cannot reach those hosts; in
those sessions, queue the fetch onto a normal-network machine
per [`bib-qa.md §Batch intake pipeline`](bib-qa.md#batch-intake-pipeline).

### Stage 2: Extraction (→ `extracted`)

Convert raw format to `extracted-text.md`:

**For PDFs, always start with
[`scripts/pdf-extract.py`](../../scripts/pdf-extract.py)** — do not reach for a
Python PDF library directly. It walks a fallback ladder (`pdftotext` → `pypdf` →
`pdfminer.six` → a zero-dependency content-stream extractor → OCR) and, when it
cannot read a file, **tells you which rung failed and why** instead of returning
an empty string:

```bash
python3 scripts/pdf-extract.py FILE.pdf -o extracted-text.md
python3 scripts/pdf-extract.py FILE.pdf --diagnose   # structure only
```

Exit `0` = text; **exit `2` = no text layer (a scan)**; exit `3` = a parser
problem on a file that does have text.

Two failure modes it exists to prevent, both observed in practice:

* **A silent empty extraction reads exactly like a scan, a broken library, and
  a malformed PDF.** The script separates them by inspecting the PDF structure
  (`CCITTFaxDecode` / `JBIG2Decode` / `DCTDecode` counts against `/Font`), so
  "swap libraries" vs "you need OCR" is decided by evidence rather than guessed.
* **A broken native extension kills the whole pipeline.** `pypdf` and
  `pdfminer.six` both fail via pyo3 `PanicException` when `cryptography`'s Rust
  bindings are broken — and that is a `BaseException`, so an ordinary
  `except Exception` does **not** catch it. Every rung is guarded accordingly.
  The zero-dependency rung exists precisely for this case; in the container this
  was written in it was the only rung that worked.

| Format | Extraction method |
|--------|-------------------|
| PDF (text) | `scripts/pdf-extract.py` (ladder; `pdftotext` when available) |
| PDF (scan) | `scripts/pdf-extract.py` → exit 2, then Tesseract OCR / Claude vision |
| LaTeX | Direct parse (strip preamble) |
| HTML | Readability + turndown |
| DOCX | Pandoc → markdown |
| Images | Claude vision API |

For scanned documents the script's OCR rung fires automatically **if**
`tesseract` and `pdftoppm` are installed (`apt-get install -y tesseract-ocr
poppler-utils`); it names whichever is missing. Where OCR is unavailable, or
where layout carries meaning (headings, lists, tables, boxes), fall back to
Claude's vision capability, which reads structure that OCR flattens.

**Output**: `extracted-text.md` — raw markdown with preserved structure.

### Stage 3: Structural Analysis (→ `structured`)

Analyze extracted text for formal environments and document structure.

#### For academic papers:
Same as paper-importer Phase 2 — detect theorem/definition/lemma
environments, sections, cross-references.

#### For structured / normative guidelines:

Many guideline and standards documents have a recurring normative
structure that maps onto content-block kinds:

| Guideline element | Content block kind | Notes |
|------------------|-------------------|-------|
| **Recommendation** (numbered, boxed) | `definition` | Normative statement |
| **Evidence / rationale summary** | `prose` | Supporting narrative |
| **Remarks** | `remark` | Implementation notes |
| **Good-practice statement** | `proposition` | Consensus-based |
| **Research priority** | `conjecture` | Open questions |
| **Background** | `prose` | Context sections |
| **Evidence-quality table** | `diagram` | Quality assessment |

When a document distinguishes *normative levels* (e.g. L1 = what to do,
L2 = how to do it), map the normative statement to a `definition` block
and the implementation guidance to a `prose` block tagged with the level
(e.g. `["implementation", "L2"]`). The exact level taxonomy is
domain-specific; record it in `intake.json.classification.normativeLevel`.

> Domain-specific guideline handling (e.g. a particular standards body's
> recommendation grammar) belongs in a domain adapter bundle, not the
> generic paper adapter. This skill detects the *shape* and hands off the
> domain-specific mapping rules to the relevant adapter.

**Output**: `extracted-blocks.json` — array of detected blocks with
provisional kinds, titles, and content.

### Stage 4: Mapping (→ `mapped`)

Interactive step — present extracted blocks to user for review:

1. Show block count by kind
2. Let user rename, reclassify, skip, or merge blocks
3. Let user define chapter/section structure
4. Let user set the target paper ID
5. Generate `mapping.json` with confirmed decisions

### Stage 5: Content Generation (→ `generated`)

Generate content objects under `content/<paper-id>/`:

1. **`.ts` manifests** via `content/schema/builders.ts`
2. **`.md` content** in project markdown conventions
3. **Chapter `.ts` manifests** with section structure
4. **Paper `.ts` manifest** (new or updated)

Tag all generated blocks with:
```typescript
tags: ["imported", "source:<document-id>"]
```

Add `meta.source` referencing the upload:
```typescript
meta: {
  source: "uploads/<document-id>",
  originalSection: "3.2",
  importedAt: "2026-03-25T..."
}
```

## Structured-Document Processing

### Detecting normative structure

Normative guidelines often follow predictable patterns:

```
RECOMMENDATION N:
<recommendation text in bold/box>

Remarks:
- Implementation note 1
- Implementation note 2

Summary of evidence:
<narrative text>

Evidence-quality table:
<quality assessment>
```

### Label conventions for guidelines

| Element | Label pattern | Example |
|---------|--------------|---------|
| Recommendation | `def:<doc>-rec-<N>` | `def:example-rec-1` |
| Evidence summary | `prose:<doc>-evidence-<N>` | — |
| Remark | `rem:<doc>-remark-<N>` | `rem:example-remark-1` |
| Good practice | `prop:<doc>-gps-<N>` | `prop:example-gps-1` |
| Research priority | `conj:<doc>-research-<N>` | `conj:example-research-1` |

### Cross-referencing recommendations

Recommendations often reference each other and external evidence.
Map these to `uses[]` in content objects:

```typescript
export default definition({
  label: "def:example-rec-3",
  title: "Recommendation 3: ...",
  uses: ["def:example-rec-1"],  // references Rec 1
  tags: ["imported", "source:example-doc-2016", "L1", "normative"],
  meta: {
    source: "uploads/example-doc-2016",
    strength: "strong",
    quality: "moderate",
  }
});
```

## Integration with Other Skills

| Skill | Integration point |
|-------|-------------------|
| `paper-importer` | Delegates Phase 5 generation for academic papers |
| `content-validation` | Validates generated content objects |
| `editor` | Reviews generated narrative content |
| `scientific-accuracy` | Checks extracted statements |
| `ontologist` | Maps terminology to glossary |

## Resuming Partial Processing

The `intake.json` pipeline stage tracks where processing stopped.
To resume:

1. Read `intake.json` → check `pipeline.stage`
2. Skip completed stages
3. Continue from the current stage
4. Update `intake.json` after each stage

This allows multi-session processing of large documents.

## Checklist

Before marking intake complete:

- [ ] Raw files committed to `uploads/<document-id>/`
- [ ] `intake.json` has complete metadata
- [ ] `extracted-text.md` reviewed for OCR errors
- [ ] `extracted-blocks.json` reviewed and confirmed by user
- [ ] All content objects generated with correct builders
- [ ] Blocks tagged with `["imported", "source:<document-id>"]`
- [ ] Chapter/section structure matches document
- [ ] Cross-references mapped to `uses[]`
- [ ] `intake.json` stage set to `generated`
- [ ] Content validation passes (`content_validate`)
```
{% endraw %}
