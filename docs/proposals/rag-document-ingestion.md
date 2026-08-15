# Proposal — a document-ingestion layer, and where RAG actually belongs

**Status:** proposal · **Bean:** `p2en`

The folio has an informal ingestion path: documents land in a flat
`uploads/` directory, an agent opens them one at a time, and what it
learned survives only as a row in a source ledger and whatever prose it
wrote. This proposal assesses the tools that would formalise that path —
RAGFlow, Docling, MinerU, Marker, visual retrievers — and argues for a
particular shape: **route by document class first, and fall through to
generic RAG only when the structured path is unavailable.**

That ordering is the substantive claim here. The obvious design is a
generic RAG front-end with math and SMART-Guidelines specialisations
bolted on downstream. Measured against this corpus, that design does the
most expensive thing first and throws away structure it could have had
for free.

---

## 1. What exists today

Measured on `litlfred/qou` at `73784ff0`, not asserted:

| Fact | Value |
|---|---|
| Documents in `uploads/` | 339 PDFs, 289 MB, flat — no per-document directory |
| Documents whose filename is an arXiv ID | **230 (68 %)** — 147 new-style (`YYMM.NNNNN`), 83 old-style (`YYMMNNN`) |
| Remaining | 109 journal PDFs (Elsevier `1-s2.0-*`, Numdam `AIF_*`/`BSMF_*`, misc scans) |
| Documents with the `document-intake` per-document directory | **1** — the skill's own §"Per-upload state" note concedes this |
| Rows in the source ledger `content/bib-qa-verifications.json` | 432 |
| Open beans that are *manually read this one paper* | **15** |

So the ledger works and the intake convention does not. The 15 beans are
the tell: each is a human-scheduled unit of work to open a PDF and
extract what it says. That is the labour an ingestion layer amortises,
and it is the right thing to measure any candidate against.

Retrieval today is `grep` over `content/` plus an agent reading a whole
PDF into context. There are no embeddings, no chunk store, no index. The
`/api/relevance/*` routes present the ledger; they do not search it.

---

## 2. Three constraints that decide most of this

**(a) Two thirds of the corpus has a LaTeX source, and we are OCR-ing
it.** For 230 documents the authoritative representation — the actual
`.tex` the author wrote, with every macro, every `\label`, every
alignment — is a fetch away from arXiv. Any PDF pipeline, however good,
is reconstructing by inference something we can simply download. No
formula-recognition model beats the source. This is not a RAG problem; it
is an acquisition problem, and it is close to free.

**(b) The deployment host cannot run RAGFlow.** `lean-mcp.config.json`
pins `server_type: cx23` — a Hetzner shared-vCPU instance at **2 vCPU /
4 GB RAM / 40 GB disk**, €3.49/mo. RAGFlow documents a minimum of **4
cores / 16 GB RAM / 50 GB disk**, and its Docker Compose stack brings
Elasticsearch (or Infinity), MySQL, Redis and MinIO. The RAM figure is
not advisory — the vector engine freezes below it. Co-hosting is out.
RAGFlow means a second box at roughly 4× the current hosting cost, or
batch runs on a workstation.

**(c) The folio's retrieval unit is the content block, not a chunk.**
This is the one most likely to be missed. `content/**` is *already*
chunked — by hand, semantically, one claim per file — and each chunk
carries a typed manifest, an editorial `uses[]` edge set, a Lean ref, and
QA sidecars. A generic RAG engine wants to own a corpus: ingest it, chunk
it its own way, embed it, and serve it. Pointed at `content/`, it would
discard a richer structure than it can build, and hold a second copy that
drifts. **The folio does not need a chunker for its own content.** It
needs one for *incoming* documents, which is a much smaller job.

---

## 3. Separate the four jobs "RAG" conflates

Most of the confusion in tool comparisons comes from products that span
different subsets of these. Assessed separately, the choices are clearer.

```
  ACQUIRE  ──▶  PARSE  ──▶  INDEX  ──▶  INGEST
  best available   →structured  →searchable   →content objects
  representation   document                   (folio-specific)
```

| Job | What it means here | Folio status |
|---|---|---|
| **Acquire** | Get the best representation that exists — LaTeX source, publisher XML, DAK spreadsheet — before settling for a PDF | **absent**; PDFs are dropped in by hand |
| **Parse** | Whatever is left as PDF → structured document with layout, tables, formulae | **absent**; agent reads the PDF |
| **Index** | Make 339 documents searchable without loading them into context | **absent** |
| **Ingest** | Structured document → typed content blocks with `uses[]`, labels, citations | **exists** as `document-intake` / `paper-importer` skills; unautomated |

The fourth is the folio-specific one and is not for sale. The first three
are.

---

## 4. Options, by job

### 4.1 Acquire

| Tool | Fit |
|---|---|
| **`arxiv-to-prompt` / arxiv-latex MCP** | Fetches arXiv LaTeX source and flattens it for a model. Directly addresses constraint (a). MIT-ish, tiny, no infrastructure. |
| **LaTeXML** | `.tex` → structured XML/HTML5 with MathML; the engine behind ar5iv. The rigorous route once source is in hand. Heavier, Perl, but battle-tested on all of arXiv. |
| **`paper-search-mcp` / OpenAlex (`alex-mcp`)** | Already named in `document-intake.md §Stage 1` as the preferred fetch path. Gives canonical metadata + PDF in one call, which is also how the ledger's reference join gets populated without hand-typing. |
| Publisher XML (JATS) | Available for some of the 109 non-arXiv items; Numdam and Elsevier both expose it. Worth a probe before OCR. |

**This layer is the highest value per unit of effort in the whole
proposal and needs no RAG engine at all.**

### 4.2 Parse

For what remains as PDF-only — the ~109 journal items, scans, and WHO L1
narrative guidelines.

| Tool | License | Runs on CPU | Math | Tables | Shape |
|---|---|---|---|---|---|
| **Docling** (IBM) | **MIT** | **yes** | formula enrichment → LaTeX | TableFormer, strong | **library**, emits `DoclingDocument`; also `docling-serve`, `docling-mcp` |
| **MinerU** | AGPL-3.0 | GPU strongly preferred | **best in class** (UniMERNet) | good | service/CLI |
| **Marker** (Datalab) | GPL + commercial threshold | GPU preferred | good (Surya/texify) | good | CLI |
| **RAGFlow DeepDoc** | Apache-2.0, but bundled | no (part of the stack) | moderate | good | **inside a product** |
| **Nougat** (Meta) | MIT | GPU | math-native | weak | largely unmaintained; hallucinates |

Docling is the right default: it is MIT, it runs on the CPU we actually
have, and — decisively for this repo — **it is a library that produces a
cached artefact**, which is precisely the shape of the existing
integration contract (§5). MinerU is better at formulae, but constraint
(a) means the documents where formula recognition matters most are the
ones we should not be OCR-ing at all. Keep MinerU as an escalation for a
math-heavy scan with no source.

### 4.3 Index

| Option | Fit |
|---|---|
| **LanceDB** | Embedded, file-backed, no server, no daemon — fits a 4 GB host and commits alongside `.beans/`. Best default for a 339-document corpus. |
| **Qdrant** | Excellent, but a service. Justified only once the corpus outgrows embedded. |
| **`sqlite-vec` / pgvector** | Viable if a SQL store already exists. It doesn't here. |
| **ColPali / ColQwen** (visual late-interaction) | Retrieves over *page images*, no text extraction — so figures, tables and formulae stay intact. Genuinely strong for exactly this corpus. But it is GPU-bound and stores ~1024 patch vectors per page. **Park it**; revisit if text retrieval demonstrably fails on diagram-bearing pages. |

At 339 documents, retrieval quality is not the bottleneck — *having any
index at all* is. Start embedded.

### 4.4 Ingest

Already specified by `document-intake.md` and `paper-importer.md`, and
the block schema is the target. Nothing to buy. What changes is that
Stages 2–3 stop being an agent reading a PDF and become a parse artefact
the agent adjudicates.

---

## 5. How anything enters: the existing contract

`docs/proposals/llm-authoring-tool-integration.md §1` already defines how
an external tool is absorbed, and it applies unchanged:

```
capability probe          .claude/skills/capabilities/<tool>.json
        ↓                 (detection + `requires`, gates --check-deps)
cached ingest artefact    uploads/<id>/parsed.json  (SHA-stamped)
        ↓
registered criterion      content/pipeline/qa-criteria-registry.ts
        ↓
checker or skill          qa-checkers-*.ts | skills/**/<skill>.md
        ↓
watcher axis              WATCHER_CRITERIA_BY_AXIS → integration-backlog
```

Its four properties are what keep an ingestion layer honest, and two
matter especially here:

- **Absent tool ⇒ `n/a`, never a false pass.** A document nobody parsed
  must not read as a document with nothing in it.
- **Stale cache ⇒ `n/a`.** A parse artefact carries the source PDF's SHA,
  so a re-uploaded or corrected document invalidates its own extraction
  rather than silently serving the old one.

This is also the argument against adopting a product that owns its own
store: RAGFlow's index has no place to record *which* SHA it parsed in
terms the folio's staleness machinery can read.

---

## 6. Where RAGFlow does fit

Not as the primary, but it is not nothing:

- Its **orchestrable ingestion pipeline** (0.22+) treats parsing as
  pluggable, and can call Docling Serve (`DOCLING_SERVER_URL`) or MinerU
  (`MINERU_APISERVER`) as backends. So "RAGFlow *or* Docling" is a false
  choice — RAGFlow is an orchestrator + store + UI over parsers you would
  pick anyway.
- Its **template-based chunking** (one template per document class:
  paper, manual, table, laws) is the right *idea*, and is worth stealing
  even if the engine isn't adopted. It is §7's routing table by another
  name.
- If a **human-facing corpus-browsing UI** over `uploads/` becomes a real
  requirement, RAGFlow supplies one, and that is a genuine argument for
  standing it up on its own box.

What it should not do is become the folio's retrieval layer for
`content/`. That would put a second, weaker copy of the corpus behind an
API and orphan the `uses[]` graph.

---

## 7. Route by document class

The corrective this proposal argues for. Rather than *generic RAG →
specialised*, the router runs **first**, and generic RAG is the fallback:

| Class | Detected by | Route | Falls back to |
|---|---|---|---|
| arXiv paper | arXiv ID in filename or ledger | **fetch `.tex` source** → LaTeXML → blocks | Docling on the PDF |
| Journal paper w/ XML | DOI → publisher JATS | **JATS** → blocks | Docling |
| Journal PDF, no source | — | Docling → blocks | MinerU if formula-dense |
| Scan / photograph | no text layer | Docling OCR, or vision | agent transcription |
| **WHO L2 DAK** | DAK repo structure | **structured extractors** (§9) | — never generic |
| **WHO L1 guideline** | narrative PDF | Docling → recommendation-boxed blocks | — |
| Lean / formal source | `.lean` | Lean Atlas, not a text pipeline | — |

Each row's *first* choice preserves structure the document already has.
Generic RAG is what happens when that fails, not what happens first.

---

## 8. Math-specialised ingest

The specialisation is mostly **not** a model — it is three disciplines:

1. **Prefer source over pixels.** Covered above; 230 documents.
2. **Preserve the label graph.** A `.tex` carries `\label`/`\ref`, which
   is a dependency relation over the *source* document — and folio's
   whole model is a dependency relation over blocks. An ingest that
   flattens a paper to prose throws away the edges that make the imported
   blocks navigable. LaTeXML keeps them; a PDF parser cannot recover them.
3. **Normalise math to one dialect at the boundary.** Blocks are
   KaTeX-rendered, and `AGENTS.md`'s render-QA gate already bans
   `\operatorname{}` and unfenced align-family environments. Imported math
   must pass the same battery, which means the ingest pipeline needs a
   normalisation step — not an afterthought, a gate.

Downstream, the existing Lean-side proposal (`llm-authoring-tool-integration.md`)
already covers premise retrieval via LeanDojo and the formal dependency
graph via Lean Atlas. Those are the math-specific *retrieval* story and
need no duplication here.

**Deliberately not proposed:** a math-aware embedding model. At 339
documents, lexical + structural retrieval over well-parsed LaTeX will
outperform any embedding of mangled PDF text, and costs nothing to run.

---

## 9. SMART-Guidelines-specialised ingest

Here the "generic RAG first" ordering is not merely suboptimal — it is
**destructive**, and this is the strongest instance of §7.

A WHO Digital Adaptation Kit is *already machine-readable*. Its L2
artefacts are structured by construction:

| L2 artefact | Native form | Correct extractor |
|---|---|---|
| Data dictionary | Excel | `smart-base` DAK extraction scripts |
| Decision-support logic | DMN / tables | DMN parser → `dmn-authoring` skill |
| Business processes | **BPMN XML** | BPMN parser → `bpmn-authoring` skill |
| Indicators | structured | DAK extractors |
| Terminology | CodeSystem / ValueSet | FHIR terminology tooling |
| Personas, scenarios, requirements | DAK components | DAK API logical models |

WHO's `WorldHealthOrganization/smart-base` ships these extraction scripts
under `input/scripts/` (slated to move to a dedicated repo), and the
**DAK API** publishes logical models for the components. Running a BPMN
file or a data-dictionary spreadsheet through a PDF-oriented RAG parser
converts a graph and a table into prose — it is lossy in exactly the
dimension that matters, and folio already has `l2-dak-authoring`,
`bpmn-authoring`, `dmn-authoring` and `fhir-validation` skills expecting
the structured form.

**Generic ingest has exactly one job in this domain:** the **L1 narrative
guideline PDF** — the published recommendations document that a DAK is
derived *from*. That is unstructured prose with boxed recommendations and
GRADE tables, and `document-intake.md` already specifies the mapping
(recommendation → `definition`, remark → `remark`, good-practice
statement → `proposition`, research priority → `conjecture`). Docling's
table handling is the relevant strength there, because GRADE tables are
the part a naive extractor mangles.

So the SMART-Guidelines answer is: **structured extractors for L2/L3,
Docling for L1 only, and no vector store in the loop at all** until
someone wants to search across many guidelines.

---

## 10. Recommendation

A staged adoption, cheapest and highest-value first. Each stage is
independently useful and independently abandonable.

**Stage 1 — Acquire (no new infrastructure).** Add an `acquire` step that
resolves each `uploads/` document to its best available representation:
arXiv source for the 230, publisher XML where available, PDF otherwise.
Write the result into the per-document directory `document-intake.md`
already specifies, and backfill the ledger's reference join from the
fetched metadata. *This is the stage that pays for itself.*

**Stage 2 — Parse (Docling).** Capability probe
`.claude/skills/capabilities/docling.json`, a cached SHA-stamped
`parsed.json` per document, degrading to `n/a` when absent. Covers the
109 PDF-only items and the WHO L1 path.

**Stage 3 — Route (§7).** The class router, plus math normalisation
(§8.3) as a gate rather than a nicety.

**Stage 4 — Index (LanceDB, embedded).** Only once Stages 1–2 have
produced clean text worth embedding. Indexing bad extractions is how RAG
systems get a reputation for confident wrongness.

**Stage 5 — reassess RAGFlow.** With Stages 1–4 done, the open question
is narrow and answerable: *is a browsing UI over the corpus worth a
second VPS?* Ask it then, with the parse quality already known, rather
than now.

**Not recommended now:** ColPali/ColQwen (GPU, premature at this corpus
size), a math-specific embedding model (§8), and pointing any RAG engine
at `content/**` (§2c).

---

## 11. Open questions for the author

1. Should the parse artefacts be **committed** (reproducible, greppable,
   but adds tens of MB) or **gitignored and rebuilt** (clean tree, but a
   fresh container re-parses)? The Lean cache precedent suggests
   committing to an orphan branch.
2. Is a **human browsing UI** over `uploads/` actually wanted? It is the
   only thing that would justify RAGFlow's footprint, and the answer
   changes Stage 5 entirely.
3. Does the SMART-Guidelines side want ingest of **WHO's published DAKs**
   (consuming `smart-base` extractors) or authoring support for **new**
   DAKs (producing artefacts those extractors read)? The skills package
   suggests the latter; §9 assumed both.
