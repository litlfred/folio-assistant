# folio-assistant-sci

Scientific source material used by folios that formalise mathematics, the
methodologies for formalising it in Lean that this layer adopts from that
material, and the paper content adapter, skills, tools and processes a paper
folio works with. `folio-assistant-sci.json` declares every directory; each has
a generated README.

**Contents**

<!-- readme:toc:begin -->

- [What is here](#what-is-here)
- [The platform is not the content](#the-platform-is-not-the-content)
- [How it is reached](#how-it-is-reached)

<!-- readme:toc:end -->

## What is here

The library and the methods adopted from it.

| | |
|---|---|
| `library/milnorlink/` | The source text the derived `milnor-exposition-standard` skill reads (Milnor, *Link Groups*, 1954). |
| `library/arxiv-2601.22554v1/` | Zhu, Monticone, Avigad, Welleck (2026), *LeanArchitect: Automating Blueprint Generation for Humans and AI*. |
| `library/arxiv-2406.01940v2/` | Lu, Wan, et al. (2024), *Process-Driven Autoformalization in Lean 4*. |
| `library/arxiv-2602.16554v1/` | Ren, Li, Qi (2026), *MerLean: An Agentic Framework for Autoformalization in Quantum Computation*. |
| `library/arxiv-2003.08005v1/` | *ScanSSD: Scanning Single Shot Detector for Mathematical Formulas in PDF Document Images*. |
| `library/arxiv-2512.09874v3/` | *Benchmarking Document Parsers on Mathematical Formula Extraction from PDFs*. |
| `library/arxiv-2604.00554v1/` | *LLM-supported document separation for printed reviews from zbMATH Open*. |
| `library/codata-2022/` | *CODATA 2022 Recommended Values of the Fundamental Physical Constants*. |
| `library/image-verdicts.json` | The image-role judgements for the library's documents, each made by opening the image. |
| `methodologies/` | One node per Lean-autoformalization paper above (LeanArchitect, Process-Driven Autoformalization, MerLean) — the METHOD each paper presents for Lean formalization, what it measured and did not, and what this platform refuses from it. This layer's Lean skills point here rather than restating them. |

## The platform is not the content

folio-assistant is the platform, not the content: the library lives here, not in
`cat-harness/`. The pipeline that reads it — OCR, ingestion, the JSON-LD
generator and the L1 completeness gate — stays in `cat-harness/` and reaches
this library through its declaration, not a path.

## How it is reached

`folio-assistant-sci.json` here declares `library/` under the conventional id, so this
instance's own tooling resolves it directly. `cat-harness/cat-harness.json`
additionally declares it as `folio-assistant-sci-library`, repository-scoped,
because the consumers that scan libraries — `check:l1-complete`, the narrative
queue, `gen-library-jsonld`, the MCP server's graph roots — run from that root.
Those consumers fan out over every declared library.
