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

**(a) Two thirds of the corpus has a LaTeX source — but the network
often cannot reach it.** For 230 documents the authoritative
representation — the actual `.tex` the author wrote, with every macro and
every `\label` — exists on arXiv, and `qou/.mcp.json` already configures
`paper-search-mcp` and `openalex-paper-search` to fetch it. **In a
sandboxed session that path is dead:** measured 2026-08-15, the egress
proxy returns 403 (organisation policy denial) for `arxiv.org`,
`export.arxiv.org` and `api.openalex.org` alike. PyPI is reachable;
arXiv is not.

The correction this forces is important. Source-first is still right
*when the network allows it*, so it stays the preferred route in §7. But
it cannot be the **only** route, or ingestion stops dead in exactly the
sandboxed sessions where most agent work happens. **The PDF path must be
complete on its own, offline.**

Fortunately the PDF carries more than expected — see §2a-bis.

**(a-bis) The PDFs are in far better shape than "PDF" suggests.**
Measured over all 339 with `pypdf`, **zero read errors across 12,437
pages**:

| Signal | Count | Consequence |
|---|---|---|
| Has a PDF outline (bookmarks) | **194 (57 %)** | the table of contents is *free* — no inference needed |
| …with ≥ 5 entries | 181 (53 %) | deep enough to section the document |
| Has a plausible DocInfo `/Title` | 126 (37 %) | too unreliable to trust — derive from text instead |
| arXiv stamp in page-1 text | ~230 | **identity, version, primary class and date, offline** |

That third row is why metadata must come from the text and not the
DocInfo dictionary. The fourth is the one that rescues constraint (a):
arXiv prints its own stamp down the left margin of page 1, in both eras
(`arXiv:0706.2213v3 [math.GT] 9 Mar 2008` and `arXiv:hep-th/0001202v2`),
so **a blocked network costs us the LaTeX source but not the paper's
identity**. The ledger join still works offline.

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

## 7-bis. Where processed content goes

The single most important design question, and the answer has to be the
same shape for a knot-theory preprint and a WHO L1 guideline.

### The layout

A processed document stops being a flat PDF and becomes the per-document
directory `document-intake.md` already specifies (followed today by 1 of
339 documents — the convention is right, it was just never automated):

```
uploads/<doc-id>/
  original.pdf            the upload, unchanged
  structure.json          pdf-structure/v1 — metadata + TOC + section index
  sections/               ← THE GREPPABLE ARTEFACT
    sec-000-introduction.md
    sec-001-preliminaries.md
    ...
  candidates.json         class-specific extraction (§8, §9) — proposals only
  intake.json             pipeline state
```

`<doc-id>` is derived, not assigned: `arxiv-0706.2213v3` when the stamp is
present, else the slugified filename. So the identifier is stable across
re-uploads and is the join key to `content/bib-qa-verifications.json`.

### Why plain Markdown, and not a vector store

Because **this project's agents find things by grepping.** The qou
`AGENTS.md` corpus-grep checklist is a STRICT gate before any agent may
declare an item open, and it names four paths — `docs/audits/`,
`content/`, `computations/`, `docs/coordination/`. `uploads/` is not one
of them, and cannot be: it is 339 PDFs and 289 MB of binary.

Extracting sections to `.md` **makes `uploads/` a fifth grep path**, which
is a larger practical win than semantic search would be at this corpus
size:

```sh
grep -rn "Reidemeister torsion" uploads/*/sections/
# → uploads/arxiv-0706.2213v3/sections/sec-004-review-on-the-non-abelian.md:42
```

Each section file opens with YAML front-matter naming the document,
section, page range and source SHA, so a grep hit is immediately citable
— which is what the ledger and `-- Ref:` citations need anyway. A vector
index (§4.3) can be layered on top later; it reads the same files. The
files are the substrate, the index is an accelerator.

### Two stages, and the boundary between them matters

```
original.pdf
     │
     ├── STAGE A — pdf-structure          domain-neutral, mechanical
     │        structure.json + sections/*.md
     │        no math logic, no WHO logic
     │
     └── STAGE B — class-specific extractor      routed by §7
              ├─ math paper → candidates.json: claims, theorems,
              │                 formalization candidates
              └─ WHO L1     → candidates.json: recommendations,
                                remarks, GRADE tables
                          │
                          └── ADJUDICATION (agent proposes, human accepts)
                                  → content/<paper>/<block>.ts + .md
```

Stage A is shared and already built (`scripts/pdf-structure.py`). Stage B
is where math and SMART Guidelines diverge, and it emits **candidates,
never content**. That boundary is the anti-laundering rule applied to
ingestion: a sentence extracted from someone else's paper is *a claim
attributed to a source*, not a folio claim. It reaches `content/` only
when an agent or the author promotes it, exactly as
`document-intake.md §Stage 4` already requires.

### Does it need Lean formalization?

That is a Stage-B verdict on a math document, and it must be a
**proposal**, not an action. `candidates.json` carries, per extracted
claim: the section it came from, its page, the claim text, a kind guess
(`definition`/`theorem`/`lemma`), and a `formalization_candidate` flag
with a reason.

What the flag means is narrow and worth stating, because the failure mode
is obvious: **an extracted theorem is not a proved theorem.** It is
someone else's result, and importing it creates a block that must cite
them, not a Lean obligation the folio has discharged. So the routing is:

1. **Relevant + already cited** → the ledger row gains the section
   pointer; nothing else happens.
2. **Relevant + not cited** → `paper-relevance-triage` verdict, then a
   `references.ts` entry and a citation.
3. **Relevant + the folio wants to *use* the result** → a bean, routed to
   `formalizer`. The Lean either states it with `sorry` + `-- Ref:` to
   the source (the honest "imported, not reproved" marker), or proves it.
   Both are governed by the existing Strict Lean Discipline; ingestion
   grants no exemption and creates no Lean by itself.

The generalisation is that Stage B always answers "what does this
document *offer*, and to which downstream skill?" For a math paper the
answer routes to `formalizer`. For an L1 guideline it routes to
`l2-dak-authoring`. Same shape, different registry.

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
generic ingest for L1 only, and no vector store in the loop at all**
until someone wants to search across many guidelines.

### 9.1 The L1 path — narrative guideline → recommendations

This is the one place in the SMART domain where the §7-bis machinery
applies unchanged, and it is worth spelling out because it is the mirror
image of the math path.

**Stage A is identical.** A WHO L1 guideline is a long PDF with a real
table of contents — usually a *better* one than a preprint has, since
these are professionally typeset and almost always carry bookmarks. So
`pdf-structure.py` sections it with no WHO-specific logic at all, and
`uploads/who-<guideline>/sections/*.md` becomes greppable the same way.

**Stage B is a different extractor.** Where the math extractor looks for
theorem environments, the L1 extractor looks for WHO's normative
furniture, which `document-intake.md` already maps:

| Found in the L1 text | Candidate block | Label |
|---|---|---|
| boxed, numbered **Recommendation** | `definition` | `def:who-<g>-rec-<n>` |
| **Remarks** bullets under it | `remark` | `rem:who-<g>-remark-<n>` |
| **Good practice statement** | `proposition` | `prop:who-<g>-gps-<n>` |
| **Research priority** | `conjecture` | `conj:who-<g>-research-<n>` |
| Evidence summary narrative | `prose` | — |
| **GRADE** certainty table | `diagram` + `meta.gradeLevel` | — |

Two things make this harder than the math case, and both argue for
Docling over a plain text extractor at Stage A for this document class:

1. **Recommendations are boxes.** The normative statement is set in a
   ruled box, and its boundary is what separates *the recommendation* from
   the surrounding evidence discussion. Plain text extraction flattens the
   box away and the boundary is lost. Docling's layout model keeps it.
2. **GRADE tables carry the strength/certainty grading** (`strong` /
   `conditional`, `⊕⊕⊕◯`), which the block's `meta` needs. That is table
   structure recognition, which is precisely Docling's TableFormer
   strength and precisely what naive extraction mangles.

**Where it goes** is the same as §7-bis: `candidates.json` proposing
blocks, then adjudication into `content/<guideline>/`. The verdict
question differs — not "does this need Lean?" but "**is this L1
recommendation already represented in the L2 DAK?**" — and it routes to
`l2-dak-authoring` rather than `formalizer`. That is the whole
generalisation: same two stages, same artefacts, a different registry of
what to look for and a different downstream skill.

A useful property falls out for free: once L1 recommendations are
extracted as candidates with stable labels, the gap between an L1
guideline and its L2 DAK becomes **diffable** — recommendations present
in the narrative with no corresponding DAK decision-logic row are exactly
the DAK's coverage gaps. That is a QA axis the existing watcher
infrastructure could carry, and it is not reachable while the L1 document
remains an opaque PDF.

---

## 9-bis. OCR: which engine, and why the choice is not about accuracy

Two document classes defeat text extraction completely, and no amount of
parser work reaches them:

| Class | Symptom | Count in the qou library |
|---|---|---|
| Scan, no text layer | `pypdf` returns 0 characters | 7 |
| Scan, JIS-encoded font, no ToUnicode map | ~1,100 chars/page of `Fs=E2=7k$SL\$Ncolored Jones` | 5 |

The second is the nastier one: it *looks* like text, so every "did we get
characters" test passes and the mojibake flows into the index, the title
and the grep path.

### The choice is made by egress, not by benchmark scores

Every model-based OCR fetches weights on first run, and `huggingface.co`
returns **403** here under organisation policy (§2a). That single fact
eliminates most of the field regardless of how well it reads:

| Engine | Licence | Weights | Works here | Notes |
|---|---|---|---|---|
| **Tesseract 5** | Apache-2.0 | apt (`tesseract-ocr-*`) | **yes** | 100+ languages as distro packages; CPU; what this repo uses |
| **RapidOCR** (`rapidocr-onnxruntime`) | Apache-2.0 | **in the wheel** | **yes** | ONNX, CPU, ~15 MB; the natural second string |
| PaddleOCR | Apache-2.0 | HF / Baidu CDN | no | strongest on dense CJK layout, unreachable |
| docTR | Apache-2.0 | HF | no | |
| Surya | GPL-3.0 / commercial | HF | no | best-in-class reading order; licence also needs review |
| EasyOCR | Apache-2.0 | JAIDED CDN | no | |
| Cloud OCR (Google, AWS, Azure) | — | — | no | egress, and it sends the corpus to a third party |

So the shortlist is **Tesseract** and **RapidOCR**, and Tesseract wins on
language packaging alone: `tesseract-ocr-jpn` is one apt package, and the
Japanese scans are precisely the hard cases here.

### Two things that are easy to get wrong

**`poppler-data` is not optional.** Without it `pdftoppm` fails on CJK
with *"Missing language pack for 'Adobe-Japan1' mapping"*, produces no
image, and **exits 0** — so an OCR pipeline reads nothing and reports
success. `pdf-ocr.py` raises on an empty rasterisation for this reason.

**Language must be detected, not assumed.** A Japanese page read as
`-l eng` returns near-nothing. Tesseract's own script detection
(`--psm 0`) is cheap and does not need the pack for the script it finds;
a detected pack that is not installed is dropped rather than passed
through, because Tesseract exits non-zero and returns nothing at all when
asked for a language it lacks.

### What it recovered

Run over the blocked documents, with page-level caching and
`source.text_source: "ocr"` recorded so a consumer knows the text is a
transcription:

- McMullen — *Braiding of the attractor and the failure of iterative
  algorithms*, Invent. math. **91**, 259–272 (1988). The filename claims
  2013; the paper is 1988.
- Birman — *On Markov's Theorem*, J. Knot Theory Ramifications **11**(3).
- RIMS Kôkyûroku 1172 — 岡本美雪 (Miyuki Okamoto), *二重化結び目の colored
  Jones 多項式の計算方法について*.

### What OCR does not fix

It recovers *text*, not *judgement*. An OCR'd masthead is still a
masthead, and the title/byline separation problems of §7-bis apply
unchanged to the transcribed text — several OCR'd documents still needed
a hand-verified entry in `library-title-overrides.json`. OCR moves a
document from "unreadable" to "readable and subject to the usual
extraction defects"; it does not move it to "registered".

## 10. Recommendation

A staged adoption, cheapest and highest-value first. Each stage is
independently useful and independently abandonable.

> **Ordering revised after the egress measurement (§2a).** An earlier
> draft made network acquisition Stage 1. That was wrong for the sessions
> that matter: with `arxiv.org` 403-blocked, an acquire-first pipeline
> produces nothing in a sandbox. The offline PDF path is now Stage 1, and
> network acquisition is an *enrichment* that runs when it can.

**Stage 1 — Structure, offline (`scripts/pdf-structure.py`, built and
run).** PDF → `structure.json` + `sections/*.md`, pure `pypdf`, no
network, no GPU, no service. Works in every session regardless of egress
policy. Measured over the whole corpus:

| | Result |
|---|---|
| Input | 339 PDFs, 12,166 pages |
| Processed | **332 documents, 0 failures** (7 PDFs collided on derived `doc_id` — duplicate uploads, deduplicated for free) |
| **Output** | **7,313 sections, 24.7 M characters greppable**, 52 MB |
| Title | **321 (96.7 %)** — against DocInfo's 126 (37 %), a 2.6× improvement that justifies deriving from text |
| Authors | 241 (72.6 %) |
| Abstract | 227 (68.4 %) |
| arXiv id | 213 (64.2 %) — matches the 68 % filename estimate, now confirmed from page-1 stamps rather than filenames |
| TOC route | outline 188 · inferred 137 · **none 7** |

The weak cells are the honest part and they define Stage 3's work list:
**7 documents yield no TOC, 17 stay unsectioned, 7 look scanned.** Those
~20 documents are where `pypdf` genuinely runs out and Docling or OCR
earns its place — not the other 312. Author and abstract recall
(73 %/68 %) are the next quality target; both are page-1 layout problems
that Docling would also improve.

**Stage 2 — Acquire, when the network allows (enrichment).** Where
`arxiv.org` is reachable, fetch the LaTeX source for the 230 arXiv
documents and upgrade that document's structure from inferred to
authoritative. The arXiv ID needed to do it is already in
`structure.json`, extracted offline from the page-1 stamp — so Stage 1
prepares Stage 2's work list even when it cannot do it. Also backfills
the ledger's reference join.

**Stage 3 — Parse harder, where it pays (Docling).** Capability probe
`.claude/skills/capabilities/docling.json`, degrading to `n/a` when
absent. Two populations need it and `pypdf` will not serve them: the
scanned/no-text-layer documents Stage 1 flags as `likely_scanned`, and
the **WHO L1 guidelines**, where boxed recommendations and GRADE tables
are layout facts a text extractor destroys (§9.1). Measured work list
from the Stage 1 run: **7 no-TOC, 17 unsectioned, 7 likely-scanned** —
about twenty documents, not the other 312.

> **Blocked in a sandboxed session, for the same reason as Stage 2.**
> Docling's layout, TableFormer and formula models are fetched from
> HuggingFace, and `huggingface.co` / `cdn-lfs.huggingface.co` return the
> same 403 policy denial as `arxiv.org` (measured 2026-08-15). So *both*
> network-dependent stages are unavailable where most agent work happens.
>
> This is the strongest form of the §2a argument. A pipeline whose first
> step needs the network produces nothing in a sandbox; the `pypdf`-only
> Stage 1 produced 7,313 sections there. Stage 3 is therefore a
> **workstation / CI stage** — run it where egress allows, commit the
> artefacts, and let sandboxed sessions consume them. The capability probe
> is what makes that degrade honestly instead of silently.

**Stage 3-bis — Route + Stage B extractors (§7, §7-bis).** The class
router, the candidate extractors, and math normalisation (§8.3) as a
gate rather than a nicety.

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

---

## 12. The schema decision: a JSON-LD graph, one file per node

§§1–11 chose the *tools*. They left the **schema** unaddressed, and the flat
`pdf-structure/v1` artefact is the direct consequence: `sections[]` is a list
with a `level` integer, carrying no figures, no tables, no cross-references
and no parent pointers. This section settles the schema, and the constraints
that decided it were the author's:

1. an **independent standard** wherever one exists,
2. a **graph**, not a flat list,
3. **no XML** in the stored form,
4. each content block **standing alone** as its own file.

### 12.1 What is not a standard

`DoclingDocument` was the obvious anchor for the physical layer and it does
not survive constraint (1). It is a set of **Pydantic models** in
`docling-core` — MIT, contributed by IBM to LF AI & Data in April 2025 — with
no specification document, no standards body, and no meaningful non-Python
implementation. LF AI & Data confers neutral *maintenance*, not an independent
*spec*; adopting it would put the artefact format on a library's release
cadence. **Docling stays an input adapter and never the stored schema.**

### 12.2 Tree standards, graph vocabularies

Constraints (2) and (3) turn out to be the same constraint. Every mainstream
*document* standard is XML and therefore a tree — JATS (ANSI/NISO Z39.96),
TEI P5, DocBook (OASIS), Akoma Ntoso (OASIS), FHIR's XML form. Cross-references
in all of them are ID-pointer attributes: edges smuggled through a hierarchy.

TEI deserves its own note because it comes closest and still fails. It has
`@xml:id` with `@target`/`@corresp`/`@ana`, and `<standOff>` puts annotation
graphs outside the transcribed text — so a graph is *expressible*. But a TEI
document is one well-formed XML document, so constraint (4) can only be met by
wrapping every block in its own `<TEI>` with its own `<teiHeader>`, turning
every pointer into a cross-document URI. That is a worse JSON-LD.

The vocabularies, by contrast, are RDF and carry no XML commitment at all:
**DoCO** and **DEO** (SPAR, OWL, permanent `purl.org/spar/*` IRIs),
**Web Annotation**, **PROV-O** and **SKOS** (W3C Recommendations), and FHIR's
JSON and RDF serialisations. So the rule is: **vocabulary from the standards,
model from RDF, serialisation in JSON-LD.** XML formats remain export targets
— JATS for scholarly exchange, FHIR for WHO, AKN for jurisdictional policy —
never stored forms.

Akoma Ntoso survives in one specific and load-bearing respect: its **naming
convention** is a URI scheme, not XML, and its FRBR
Work/Expression/Manifestation split is the only candidate that models a
translation as *the same recommendation* and a national adaptation as a
*derived* one. WHO publishes in six languages and this platform expects other
countries and regions, so that is a requirement rather than a nicety.

### 12.3 Authored blocks: TypeScript stays

Content blocks are **not** migrating to JSON-LD. The `.ts` manifest remains
the authoring surface and the source of truth, because:

- the builders exist for author-time type checking, which no JSON Schema
  matches in an editor;
- `block-module.ts` loads blocks by `import`, and a manifest that throws is
  treated as a *finding* — the import is itself a validation step;
- the doc comments in `BlockBase` are this project's actual specification.

Instead, each block gains a generated **`<block>.jsonld` sibling**, joining
`.md` and `.lean` as one more `Companions` role. Generated, never hand-edited,
gated on drift (`.github/workflows/jsonld-gen-check.yml`), exactly as
`docs/reference/skills/*` already is.

The sibling is committed rather than built into a directory for the same
reason §10 commits parse artefacts: a session with no egress and no toolchain
must still be able to *consume* them, and an external consumer needs a stable
URL. The payoff is that `library/**` nodes and `content/**` blocks become one
population — same `@context`, same `@type` vocabulary, same edge terms — so a
graph loader is one glob rather than two code paths.

### 12.4 The hazard: labels are not compact IRIs

The one genuine trap, recorded because it fails silently.

A folio label has the shape of a JSON-LD compact IRI — `def:foo` reads as
`prefix:reference` — and is not one. `def:` names a **block kind**, not a
namespace, and JSON-LD splits on the **first** colon:

| Reference | Naive JSON-LD reading | Result |
|---|---|---|
| `https://…#def:bar` | absolute IRI | correct |
| `def:quantum-universe` | prefix `def` → per-*kind* namespace | wrong axis |
| `unital-groebner-bases:cor:pbw` | undefined prefix → **valid absolute IRI** with scheme `unital-groebner-bases` | well-formed, meaningless |

The second row is the dangerous one: the same block referenced from inside its
paper and from another would land on **two different IRIs**, so every graph
join under-counts with no error raised anywhere.

The fix is that labels are never emitted as IRIs. `resolveLabel()` mints `@id`
from all three authored forms — including the nested-namespace form
`ns:paper:prop:foo` that `citesProvable` documents — and the authored string is
preserved verbatim in `folio:label` for grep and round-tripping. A reference it
cannot parse returns `undefined` and is **reported**, never emitted as a
plausible-looking IRI. **No content changes.**

Emitted `@id`s are relative (`papers/<paper>/blocks/def-foo`) with `@base` in
the published context, so changing where a folio is deployed does not rewrite
thousands of committed files.

### 12.5 What landed

| Artefact | Purpose |
|---|---|
| `schemas/jsonld.ts` | Namespaces, kind→type maps, `parseReference`/`resolveLabel`, the `@context` value |
| `ns/content/v1.jsonld` | The published context, generated |
| `scripts/gen-jsonld-context.ts` | Emits it; `--check` gates it |
| `content/pipeline/gen-block-jsonld.ts` | Emits `<block>.jsonld`; `--check` gates drift |
| `scripts/tests/jsonld-label-resolution.test.ts` | All three reference tiers + both silent-failure modes |
| `scripts/tests/gen-block-jsonld.test.ts` | Emitter end-to-end over a synthetic paper |
| `.github/workflows/jsonld-gen-check.yml` | The CI drift gate |

The DoCO co-typing is deliberately **partial**: `simulator` has no DoCO
counterpart and gets none. Guessing would put wrong triples in a published
graph, which is worse than leaving a kind untyped.

The same discipline caught a real error while this was being written. The
containment term was first mapped to `doco:contains`, which **does not
exist** — DoCO imports `po:contains` from the Pattern Ontology instead. With
`sparontologies.github.io` egress-blocked from a sandboxed session, the
Pattern Ontology namespace could not be confirmed either, so `contains` maps
to `dcterms:hasPart` — `po:contains`'s documented super-property, and
therefore a sound generalisation rather than a guess. `certainty` is omitted
for the same reason: it must bind to FHIR's GRADE value set, and that
predicate wants checking against a real IG rather than inventing. Both narrow
when the ingest writer lands and the IRIs can be verified.

The general rule this establishes: **a published `@context` never carries an
unverified IRI.** Under-claim with a verified broader term, or leave the term
out.

### 12.6 Still open

- **Ingest node granularity** — section-level nodes, or every theorem, figure,
  table and recommendation as its own file? The latter is ~7,313 sections
  expanding to perhaps 40–60k small files. Section-level nodes with sub-blocks
  as annotations until promoted is the cheaper staging. Unresolved; it affects
  only the ingest writer, not anything in §12.5.
- **`@id` as a public contract** — once anything annotates a block, renaming
  its label breaks that reference. Recommended: readable IDs plus a
  `folio:supersededBy` tombstone on rename. Not yet implemented.
- **`@id` scheme for papers** — AKN's FRBR syntax is native to legal
  instruments; applying it to a preprint is off-label. Proposed: AKN IRIs for
  jurisdictional policy, a parallel `folio:` scheme for papers, same
  Work/Expression/Manifestation pattern.
- **Emit real RDF, or JSON-LD-shaped JSON?** The latter is cheaper, stays
  greppable, and fits a 2 vCPU host. Nothing here forecloses the former.

### 12.7 The MCP read side

§1 recorded that retrieval is `grep` plus an agent reading a whole PDF, and
that the MCP server's `/api/relevance/*` routes present the ledger without
searching it. There was a sharper version of that gap: **MCP was write-only
toward ingestion.** It creates `uploads/<id>/` on import and `get_imports`
lists what was imported, but nothing ever read a `structure.json`, a
`sections/*.md`, or a candidate. The 24.7 M extracted characters were
reachable by `grep` and by nothing else.

`content/pipeline/graph-index.ts` closes it, and is the first thing that
actually spends the `.jsonld` decision. One directory walk over both roots
yields one node map plus **reverse adjacency**, and three tools sit on it:

| Tool | Answers |
|---|---|
| `search_graph` | "does anything — authored *or* ingested — mention this?" Metadata by default; companion Markdown on request |
| `get_neighbors` | `out`: what must a reader have read first. `in`: **what breaks if this changes** — not otherwise available without a full corpus scan |
| `get_graph_stats` | node/edge counts by provenance and kind, and whether each root exists |

Three properties are deliberate rather than incidental:

- **Honest emptiness.** An absent root reports `present: false`, not zero
  matches. While the ingest writer is unbuilt, a caller must be able to tell
  "that population has not been written yet" from "nothing matched" — the §5
  contract's `n/a`-never-a-false-pass rule applied to retrieval.
- **No silent truncation.** `totalMatches`, `textScanTruncated` and
  `truncated` are all reported. A capped result that looks complete is worse
  than one that says it was capped.
- **A colliding `@id` is a finding.** Two nodes claiming one IRI is recorded
  in `malformed` rather than resolved by picking a winner.

This is not a vector store and does not want to be one yet. §10 Stage 4 still
holds: index once the extractions are known good. What lands here is the
graph-expansion layer an embedding index would sit *under* — a hit returns a
node plus its neighbourhood, which is what an agent needs, and it reads the
same files an embedding pass would.

`content-graph.ts` remains authoritative for the authored editorial + formal
graph: it imports manifests, and that import is a validation step. This index
reads the published projection instead — cheaper, and it spans ingested
documents that `content-graph.ts` cannot see. The CI drift gate is what makes
trusting both at once sound.

Runnable without an MCP client:

```sh
bun run content/pipeline/graph-index.ts --stats
bun run content/pipeline/graph-index.ts --search "torsion" --text
bun run content/pipeline/graph-index.ts --neighbors thm:main --in --hops 2
```

### 12.8 Granularity, and what QA turned out to decide

The open question in §12.6 was node granularity. It is settled, and the
criterion that settled it was not file count.

**Content blocks are fine-grained and self-contained** — a decision table, a
math proposition, a FHIR ValueSet each a block — and groupings are built from
an *ordered list* of block refs, exactly as a chapter holds sections and a
section holds `blocks[]`. That dissolves the objection §12.6 raised: fine
granularity does not leave nodes without files, because the **blocks** own the
files and a section is a manifest.

The operational definition is what makes it decidable: **a content block is
what a QA sidecar runs against.** `qa-utils.ts` computes the sidecar as
`<stem>.qa.json`, so a block is exactly a file stem that carries one. That is
already enforced by machinery rather than convention.

#### The L2/L3 block vocabulary

WHO's own sites are unreachable from a sandboxed session — `smart.who.int` and
`build.fhir.org` return the same 403 policy denial as `who.int` — but the repo
already carries both lists, and they match WHO's standard DAK set:

| Layer | Source of truth in this repo | Kinds |
|---|---|---|
| **L2 DAK** | `schemas/skills/l2-dak-authoring/input.schema.json` | personas, user-scenarios, business-processes, data-dictionary, decision-logic, scheduling-logic, indicators, functional- and non-functional-requirements |
| **L3 FHIR** | `schemas/skills/l3-fhir-authoring/input.schema.json` | logical-model, profile, questionnaire, cql-library, structure-map, plan-definition, measure, test-case, actor-definition, requirements |

These mirror the repo's schemas, **not** the published IG, which could not be
consulted.

#### Two defects this exposed

**(a) `depends_on` was the paper adapter's companion set, and it gates
applicability.** Typed `Array<"md" | "ts" | "lean">`, no criterion could say
"applies to blocks with a `.dmn`" — and worse, every L2/L3 block would take
`qa-sweep`'s hard-coded `.md` branch and record a clean `n/a` for every axis.
QA would report a swept, healthy corpus it had never read. Same failure shape
as the stale `BLOCK_BUILDER_RE` that hid 461 blocks (§12.5's discipline
applied to a different table).

Companion roles are now `md`, `ts`, `lean` (paper) plus `bpmn`, `dmn`, `xlsx`
(L2) and `fsh`, `cql` (L3). Compiled FHIR JSON is deliberately **not** a role:
SUSHI generates it from the `.fsh`, so it is a build output, and a criterion
that cares depends on the source. The two hard-coded gates became one
`applicabilityGap()` over whatever roles a criterion declares.

**(b) One global `BLOCK_KINDS` pool would cross the adapters.** Adding ~19 WHO
kinds to the list that carries a compile-time exhaustiveness proof against the
`Block` union makes every math axis nominally applicable to a ValueSet. The
visible failure would not be a harmless `n/a` but a
`voice-scholarly-default: fail` on a decision table, which reads like a real
finding.

Kinds are therefore **adapter-scoped** — `paper` and `dak`, partitioned, with
`adapterForKind()` returning `undefined` rather than defaulting — and QA
criteria carry an `adapters` scope that the sweep gates on *before* the
companion gate.

#### The default that makes it safe

`adapters` absent means **`["paper"]`, not "all"**. Every criterion in the
registry today is a paper axis, so defaulting to "all" would require editing
all ~47 to stay correct and would misfire silently on any missed. Defaulting
to the adapter they were written for requires none, and a DAK criterion opts
in by saying so. A test asserts every registered criterion still resolves to
`["paper"]`, so adding a DAK criterion without declaring its scope fails.

Both changes are verified no-ops for the existing corpus: `sameScriptVerdict`
compares `notes`, and `missingCompanionNote` reproduces the existing strings
byte for byte, so no sidecar rewrites on the next sweep.

#### Still not built

DAK kinds are **declared, not authorable**. They are not members of the
`Block` union and have no builder, no Zod schema and no viewer registration,
so `walkBlocks` will not discover one. What exists is the vocabulary — enough
for QA to be scoped and for the ingest writer to have names to emit. Authoring
a DAK block is the next piece of work, and the ingest writer follows it.

### 12.9 DAK blocks are now authorable

§12.8 left the WHO kinds *declared but not authorable* — names with no builder,
no schema and no discovery path. That gap is closed: `schemas/dak-blocks.ts`
carries the interfaces, Zod schemas and builders, and `walkBlocks` finds them.

```ts
// content/anc-dak/decision-logic/dt-anc-danger-signs.ts
import { decisionTable } from "folio-assistant/schemas";
export default decisionTable({
  label: "dt:anc-danger-signs",
  title: "ANC danger signs",
  uses: ["de:danger-sign-code"],
  realises: "def:who-anc-rec-12",
});
```

with `dt-anc-danger-signs.dmn` alongside it and `dt-anc-danger-signs.qa.json`
as its sidecar — the same block shape a paper uses, different companion.

#### Two namespaces separate, for the first time

Paper kinds are single lowercase words, so a builder name and a kind string
were the same token and `BLOCK_BUILDER_RE` could alternate over the kinds
themselves. A DAK kind is multi-word and a hyphen is not a valid identifier,
so **the kind stays kebab-case because it is data, and the builder is
camelCase because it is an identifier** — `decision-table` / `decisionTable`.

The regex now alternates over builder names and maps back through
`kindForBuilder`. Getting that wrong is not a compile error: blocks would be
discovered under the kind `decisionTable`, matching no criterion's `appliesTo`
and no adapter — the 461-block disappearance again, in a new place. Pinned by
a test that asserts a DAK manifest is discovered under its *kind*.

#### What the manifests deliberately do not model

Field-level semantics. A `value-set` block carries a label, a title, editorial
edges and a pointer to its `.fsh`; it does not model `ValueSet.compose.include`
or a DMN hit policy. Those belong to the artefact formats, which have
specifications and validators already (`fhir-validation`, `dmn-authoring`), and
a parallel set of fields here would be a second, weaker, drifting copy — the
argument §2c makes against pointing a RAG engine at `content/`, applied to
schemas.

**The manifest's job is identity, editorial edges and QA attachment. The
companion file is the content.** For the same reason a `value-set` block is
typed `folio:ValueSet` rather than `fhir:ValueSet`: the block is the authored
manifest, the FHIR resource is what its companion compiles to, and typing the
manifest as a resource would invite a consumer to read FHIR fields off it.

#### Traceability comes free

`DakBlockBase.realises` is the L1 → L2 → L3 edge, parallel to
`RemarkBlock.interprets`. Once populated it makes DAK coverage a graph query
rather than a bespoke script: an L1 recommendation nothing realises, or an L2
`decision-table` with no L3 `plan-definition` realising it, is a gap — the
property §9.1 predicted would fall out, now reachable through `get_neighbors`.

#### Still not built

The **ingest writer**. Every piece it needs now exists: the vocabulary, the
authorable kinds, the JSON-LD projection, the graph index and adapter-scoped
QA. What remains is the code that turns `structure.json` + `candidates.json`
into `library/<doc>/blocks/*.jsonld` and section manifests — and no DAK QA
criterion has been written yet, so `dak`-scoped axes exist as a mechanism with
nothing registered in it.

### 12.10 The first DAK QA axes — and a wiring hole they exposed

§12.8 made QA adapter-aware and §12.9 made DAK blocks authorable, but nothing
was registered in the `dak` scope. That left a corpus that would sweep **clean
by default**: every paper criterion correctly `n/a`, and no DAK criterion to
take its place. A corpus reporting no findings because nothing was asked is the
same false pass as one reporting `n/a` because the gate was wrong.

Five axes now ask something, in `qa-checkers-dak.ts`:

| Criterion | Catches |
|---|---|
| `dak-companion-present` | a manifest whose artefact is missing — a label and a title that look like content in every listing |
| `dak-bpmn-has-process` | a `.bpmn` that parses but declares no `<process>` |
| `dak-dmn-has-decision-table` | a `<decision>` with no `<decisionTable>` — logic expressing no decision |
| `dak-fsh-declares-kind` | a `value-set` block whose `.fsh` declares a `Profile`; both files individually valid, only the pairing wrong |
| `dak-label-prefix-matches-kind` | a manifest hand-edited past its builder's validation |

They check **structural presence and well-formedness, not semantic
conformance**. Whether a profile validates against its base, whether CQL
compiles, whether a decision table is complete over its inputs — those need the
real validators and belong to the L3 pipeline. A grep-level reimplementation
would produce a second, weaker verdict that disagrees with the authoritative
one: §2c's argument against a second copy of the corpus, applied to validation.

#### The `depends_on` trap, walked around deliberately

`dak-companion-present` exists to flag a missing `.dmn`, so it must **not**
list `.dmn` in `depends_on` — which gates applicability and would `n/a`
precisely the blocks it is for. It depends on `ts` and declares the artefacts
under `also_invalidated_by`. That is the distinction `QaCriterionDefinition`
documents, and this is the first criterion to need it.

#### The hole this work exposed

Writing the checkers surfaced a defect in §12.8's own wiring. `qa-sweep`
constructed `const paths = { md, ts, lean }` — the paper triple — and passed it
to both `hashBlockFiles` and the checker. So the type system and the
applicability gate had learned about `.dmn` and `.fsh`, but **the sweep still
hashed three files**: a DAK block's verdict could never go stale when its
decision table changed, and a cached `pass` would outlive the logic it judged.

The companion-role tests covered `hashBlockFiles` and `entryIsFresh` in
isolation and passed; they did not cover the sweep's call site. `paths` is now
`block.companions`, and the checker signature is `CheckerPaths` — every present
companion, keyed by role.

`ADAPTER_COMPANION_ROLES` and `incompatibleCompanions()` were added alongside,
so "a paper criterion depends on `.dmn`" is now a *checkable* mistake rather
than one that manifests as a criterion which is permanently `n/a` and looks
registered.

### 12.11 First run against the real corpus

Everything through §12.10 was exercised by fixtures. Run against `litlfred/qou`
at `a5e9957` — 5 papers, 3,692 `.ts` files — three things came back that
fixtures could not have produced.

| | Result |
|---|---|
| Blocks emitted | **3,550**, 0 load failures |
| Graph | **3,550 nodes, 7,631 edges**, 0 malformed |
| Determinism | second run: `--check` clean, 0 rewritten |
| Dangling references | 41 → **33** after the fix below |

#### (a) `alg:` and `prose:` were never registered label prefixes

`LABEL_PREFIXES` maps `algorithm → "alg:"`, and 16 algorithm blocks and 18
prose blocks carry such labels — but `KNOWN_LABEL_PREFIXES` listed neither. So
`isCrossPaperRef("alg:markov-trace")` returned **true for a block's own
same-paper label**.

The consequence was silent and user-visible. `render-latex.ts:866` renders a
cross-paper reference as plain text rather than `\hyperref`, so **9 in-paper
markdown links lost their hyperlink in the PDF**; and `build.ts:295` excludes
cross-paper labels from `referencedLabels`, so a dangling link to an algorithm
would never have been reported as an undefined reference. Both prefixes are now
registered.

This is a pre-existing defect, not one this work introduced. It had simply
never been asked the question that exposes it.

#### (b) A collision in this work's own generator

`blockToJsonLd` fell back to `papers/<paper>/blocks/UNRESOLVED` when a block's
own label had no kind prefix. Every such block therefore got **the same
`@id`** — and the graph index, correctly refusing to let one node overwrite
another, dropped **12 real blocks** while the generator reported success.

Fixed by `mintNodeId`, which never fails: a prefix-less label becomes its own
IRI segment. The asymmetry against `resolveLabel` is deliberate and worth
stating — **a block's own label is its identity and cannot be wrong; a
reference is a claim that must resolve**. Making `resolveLabel` equally
forgiving would mask every typo.

Every fixture label had a prefix, which is exactly why fixtures missed it.

#### (c) What the graph is actually for, on real data

```
$ graph-index.ts --neighbors "def:quantum-universe" --in --hops 1
25 dependents, spanning `uses` and `interprets`
```

"What breaks if this changes?" answered in one call against 3,550 nodes —
the query that previously required a full corpus scan.

#### Still outstanding

The 33 remaining dangling references are qou content defects: labels with no
kind prefix at all (`tm-interactions`, `tm-knot-pairs`, `tm-notation`, …)
referenced from `uses[]`. They are reported, not repaired — repairing another
repo's content is that repo's call.

The MCP tool handlers remain typechecked but undriven by any test, and no DAK
corpus exists yet to exercise the `dak` axes against.

### 12.12 The ingest writer, and the graph closed

`gen-library-jsonld.ts` turns Stage A/B artefacts into graph nodes. Run against
the real corpus — 443 documents, 435 with Stage A output:

| | Result |
|---|---|
| Documents ingested | **435** (8 skipped, no `structure.json` — reported, not counted as empty) |
| Blocks emitted | **16,669** |
| **One graph** | **29,780 nodes · 85,016 edges · 0 malformed** |
| Split | 3,550 authored · 26,230 ingested |

That is §1's gap closed. Retrieval was `grep` plus an agent reading a whole PDF
into context; the extracted corpus was reachable by `grep` alone and MCP was
write-only toward it. It is now one graph, queryable by either population:

```
search_graph  "Seifert surface", provenance: ingested   → 61 matches, with snippets
get_neighbors "def:quantum-universe", direction: in     → 25 dependents
get_graph_stats                                          → 29,780 / 85,016
```

#### Blocks own the files; a section is a manifest

A section node carries no text — its `contains` is an **ordered** list of block
ids. The section's prose becomes one `prose` block whose `text` points at the
*existing* `sections/<sid>.md`, so nothing is copied and the 24.7 M characters
stay exactly where the corpus-grep checklist already looks.

Extraction is therefore incremental: whatever Stage B recognises becomes a
typed block, the rest stays prose, and as extractors improve prose shrinks
without any section's `@id` changing.

#### Attribution, kept sharp

`candidates.json` says of itself *"proposals only … nothing here is folio
content and nothing here creates Lean"*. Every emitted node carries
`provenance: "ingested"` and an attribution to its source document, and the
extractor's disposition string is carried **verbatim** onto the manifest rather
than paraphrased. A query can always separate *what this paper claims* from
*what the folio claims*; promotion into `content/` stays the deliberate act
`document-intake` Stage 4 describes.

#### Two more things the real run found

**The text-scan cap was 6× too tight, and biased.** `searchGraph` defaulted to
400 companion files. Measured: scanning all 20,191 takes **1.6 s** and finds
322 matches for "Reidemeister" where the cap found 55. Worse, iteration reaches
authored nodes first, so the ingested population — the entire reason full-text
search exists here — was never scanned. Default is now 50,000, a backstop
rather than a budget.

**The MCP handlers were untestable, and that was the pattern.** They lived in a
nested function inside a request handler, covered by `tsc` and nothing else —
which is precisely where §12.11's two defects were hiding, both of which
typechecked. They now live in `adapters/mcp-server/tools/graph.ts` and are
driven directly by tests, including against the real corpus. One behaviour
changed while extracting: an unknown edge term was silently filtered out, which
answers a narrower question than the caller asked; it is now reported.

#### What remains

- The five `dak` axes have **never run against real content** — no DAK corpus
  exists to point them at.
- The 33 dangling references in qou are content defects there, reported and
  unrepaired.
- Promotion (`library/` node → `content/` block) is still manual, as designed.

### 12.13 The DAK axes against real WHO content

§12.12 closed with the `dak` axes exercised only by fixtures. Run against three
real repositories — `smart-dak-immz` (`3fe6a17`), `smart-dak-bds` (`6953ede`),
and `smart-immunizations` (`12ec2fc`, the L3 side).

#### The model was not imposed; WHO already uses it

The strongest result is one I did not expect to be able to state. In
`smart-immunizations` there are **279 `.cql` files and 279 `.fsh` `Library`
instances, pairing 1:1 by file stem**. That is exactly the block/companion
model — one stem, several artefacts — already present in published WHO content.
Likewise 8 business processes as 8 `.bpmn` files.

#### The checkers that could run, did

| Axis | Real input | Result |
|---|---|---|
| `dak-bpmn-has-process` | 8 real WHO `.bpmn` | **8 pass / 0 fail** |
| `dak-fsh-declares-kind` | 739 real WHO `.fsh` | **739/739 verdicts agree with ground truth** |

#### A design error the real content exposed

`REQUIRED_COMPANION` mapped `decision-table` and `scheduling-logic` to `.dmn`,
on the strength of this repo's own `dmn-authoring` skill and the "Decision
logic · DMN tables" activity in `docs/workflows/l2-dak-authoring.bpmn`.

**There are zero `.dmn` files across all three repositories.** WHO authors
decision-support logic as a spreadsheet —
`input/decision-logic/IMMZ DAK_decision-support logic.xlsx`. The requirement
would have failed every `decision-table` block for a missing artefact WHO does
not produce.

The deeper reason is structural, not a matter of swapping one extension for
another: **one workbook holds many blocks.** A single decision-support
spreadsheet covers every decision table, one dictionary every data element, one
indicators file every indicator. A per-block companion does not exist until an
extraction stage splits them — the DAK counterpart of Stage B, and not built.
Those six kinds are now recorded in `WORKBOOK_BACKED_KINDS` and require no
companion, so the exemption reads as a measurement rather than an oversight.

#### A check the real content told me *not* to strengthen

`dak-fsh-declares-kind` maps five kinds to `Instance:` and so cannot tell a
PlanDefinition from a Measure. Strengthening it to read `InstanceOf:` was the
obvious next move. Real content says no: `InstanceOf` names a **profile URL**
far more often than a resource type — 138 `cpg-recommendationdefinition`, 41
`proportion-measure-cqfm`, against 279 bare `Library`. A check keyed on
resource-type names would have produced **138 false failures on a
correctly-formed corpus**. Discriminating properly means resolving profiles to
their bases, which is SUSHI's job. The check stays coarse on purpose.

#### What still cannot be exercised

Three of the five axes — `dak-companion-present`, `dak-fsh-declares-kind`
end-to-end, and `dak-label-prefix-matches-kind` — check the relationship
between a **folio manifest** and its artefact. Real WHO repositories have the
artefacts and no folio manifests, so only the artefact-reading half could be
validated (which is what the 739/739 figure measures). Exercising them fully
means authoring DAK blocks over this content, which is the next piece of work.

`dak-dmn-has-decision-table` is correct where a `.dmn` exists and, on this
evidence, may never fire against WHO content. It is kept for folios that author
DMN directly, per `dmn-authoring`.

Also observed and not yet modelled: WHO ships `CodeSystem` (6) and `ConceptMap`
(3) FSH resources, which have no corresponding DAK block kind.

### 12.14 A DAK has several representations, and some are generated

Three facts from the author, each confirmed against the real repositories, and
together they change the model rather than refine it.

#### (a) DAK content has a FHIR IG representation

`smart-dak-immz` is described as L2 and carries 536 `.fsh` files. That is not a
contradiction: the L2 DAK *is itself published as a FHIR IG*, and its
`input/fsh/` subdirectories map almost one-to-one onto the DAK components —
`models`, `plandefinitions`, `activitydefinitions`, `requirements`,
`scenarios`, `actors`, `measures`, `questionnaires`, `valuesets`,
`codesystems`, `conceptmaps`, `libraries`.

#### (b) Some of that FHIR is generated from the L2 sources

Measured, from the files themselves:

| Repository | `.fsh` | Explicitly marked generated |
|---|---|---|
| `smart-dak-immz` (L2 + IG rep) | 536 | **266** — 262 requirements, 4 terminology |
| `smart-immunizations` (L3 IG) | 739 | **0** — authored |

The marker names its source row:

```
//functional requirment instance generated from row 73
Instance: IMMZ.FXNREQ.075.D
InstanceOf: SGRequirements
```

So `IMMZ DAK_functional and non-functional requirements.xlsx` row 73 becomes
`input/fsh/requirements/IMMZ.FXNREQ.075.D.fsh`.

#### (c) A PDF representation is intended, and does not exist yet

#### What this means

**A DAK block is one Work with several Expressions.** The L2 spreadsheet row,
the FHIR IG resource, and the future PDF section are three representations of
*the same content block*, not three different blocks and not three companions
of one authored file. That is the FRBR pattern §12.2 already argued for on
multilingual and jurisdictional grounds; it now has a second, independent
motivation arriving from the WHO side, which is a good sign for the choice.

**Generated artefacts must not be QA'd as authored content.** A finding on
`IMMZ.FXNREQ.075.D.fsh` is unactionable: the fix lives in the spreadsheet row
or in the generator, and a `fail` recorded against the artefact points at
neither. `isGeneratedArtefact()` detects the marker and the checkers return
`n/a` **with a reason** rather than a verdict — the same rule this repo already
applies to its own generated files. Validated against real content: 266/536 and
0/739, matching the ground-truth grep exactly.

Detection is deliberately conservative — only an explicit marker counts.
Inferring "generated" from a path or naming convention would silently exempt
authored content from review, which is the costlier mistake. (The marker regex
matches WHO's spelling `requirment` verbatim, because a normalised pattern
would stop matching if they fix the typo.)

#### A correction to §12.13, one section old

§12.13 concluded that workbook-backed kinds have no per-block artefact until an
extraction stage is built. That is true of the **source** and false of the DAK
as published: WHO's tooling already splits the workbook, one FHIR instance per
row. A `functional-requirement` block does get a per-block artefact — a
*generated* one. It still must not be *required*, because it is a derived
representation rather than the authored source, but the reason has changed and
the note now says so.

#### Open, and now better posed

The block model needs a **representation** axis distinct from its companion
axis: `source` (the authored artefact), `generated` (derived, drift-gated), and
`rendered` (the PDF, when it exists). Companions answer *what files does this
block have*; representations answer *which of them is authoritative*. Building
that before the PDF representation exists would be guessing at a third case, so
it is deferred — but the two cases that do exist are now distinguishable, which
is what stops QA reporting unactionable findings today.

### 12.15 The target: block as source, everything else as render

The author's statement of where this is going, which inverts the current
direction and reframes much of §§12.8–12.14:

> The DAK content block should be used to render both a PDF document (and some
> Excels) and the "DAK" IG. The source, PDF and Excel documents should be in
> the DAK repos. Currently those are produced by hand and we extract them into
> computable artifacts. We want to get to the other way around — use the folio
> assistant to build up the components and edit them, and then the rendering
> packages them together.

#### Two eras, opposite arrows

```
TODAY          hand-authored .xlsx / .bpmn ──extract──▶ FHIR IG      (+ PDF, absent)
TARGET         content blocks ──render──▶ PDF · Excel · FHIR IG
```

That is exactly the paper adapter's shape, which is the reassuring part: blocks
are the source, `render-latex` / `generate-block-tex` / `generate-main-tex`
produce `.tex`, latexmk produces the PDF, `export-json` produces the viewer.
Nobody hand-writes the `.tex` and then extracts blocks from it. The DAK adapter
wants the same chain with three outputs instead of two.

#### What this work already serves, and what it does not

| Built | Standing in the target |
|---|---|
| Block model, adapter scoping, DAK kinds + builders | **Load-bearing** — this is the authored source |
| Companion roles, adapter-scoped QA | **Load-bearing** |
| JSON-LD projection, graph index, MCP read side | **Load-bearing** — one graph over whatever exists |
| `gen-library-jsonld.ts` (the ingest writer) | **Transitional.** It is the extract arrow. It stays necessary while DAKs are hand-made, and the target reverses it |
| `REQUIRED_COMPANION`'s FHIR rows | **Era-dependent — see below** |

The ingest writer is not wasted by the inversion: 435 documents and 26,230
nodes of existing hand-made material still have to become computable, and that
is a migration, not a dead end. But it should be read as the on-ramp rather
than the architecture.

#### The check that will invert with the arrow

`dak-companion-present` currently requires a `.fsh` of every FHIR-kind block.
Today that is right — the `.fsh` *is* the authored source of the L3 IG. In the
target state it is a **render output**, and requiring an authored block to
carry its own rendering is the analogue of requiring a paper block to ship its
own `.tex`.

The split the target implies:

| | Companions |
|---|---|
| **Authored source** | `.md`, `.ts`, `.bpmn`, `.dmn`, `.cql` |
| **Rendered output** | `.fsh`, `.xlsx`, PDF |

`.bpmn` and `.dmn` stay authored — a business process is genuinely written as
BPMN, and this repo authors its own workflows that way. `.fsh` and `.xlsx`
cross the line.

This is recorded rather than acted on. Changing the check now would enforce a
state that does not exist, against corpora that are correctly formed for the
state that does. The flag is what matters: **when the renderer lands, this
check inverts**, and `isGeneratedArtefact` (§12.14) is the mechanism that
already knows the difference.

#### What is missing to reach it

A **DAK renderer** — the analogue of `render-latex.ts`, fanning out to three
targets:

- block → FSH → SUSHI → FHIR IG
- block → `.xlsx` (the DAK workbooks, as WHO publishes them)
- block → PDF

And the **representation axis** deferred in §12.14 stops being speculative: its
three cases are now named by the target itself — `source` (authored),
`generated` (rendered by us), `extracted` (pulled from hand-made material,
pending promotion). The PDF is no longer a third guess; it is one render target
among three.

### 12.16 `smart-base`: what exists, and what should migrate

Surveyed `litlfred/smart-base` at `5891a22` — **54 Python scripts, 24,775
lines**, plus XSLT and XSD under `input/scripts/includes/`.

#### The PDF renderer does not exist

Confirmed. The only PDF dependency in the toolchain is `pdfplumber`, used by
`extractpr.py` to **read** PDFs when extracting personas. There is no
block → PDF path, no LaTeX, no HTML-to-PDF converter. The PDF representation
§12.15 calls for has to be built.

#### Two of the target-direction pieces already exist

`input/scripts/includes/bpmn2fhirfsh.xsl` (720 lines) transforms **BPMN → FHIR
FSH**, and `dmn2html.xslt` (161) renders DMN to HTML. Those are already the
*render* arrow: an authored source artefact producing a published
representation. They are the closest thing to a working precedent for the
renderer §12.15 wants, and the least speculative starting point.

#### The inventory, by arrow

| Group | Scripts | ≈ lines | Standing |
|---|---|---|---|
| **Extract** — spreadsheet/BPMN/PDF → computable | `dd_`, `dt_` (1,305), `req_`, `bpmn_`, `svg_`, `extractpr`, `isco08_`, `DHI`, `extractor`, `extract_dak` | ~3,500 | Transitional, same as this branch's ingest writer |
| **Render / generate** | `bpmn2fhirfsh.xsl`, `dmn2html.xslt`, `dmn_questionnaire_generator`, `transform_dmn`, `generate_jsonld_vocabularies` (738), `generate_*_schemas` (2,315), `generate_smart_liquid`, `generate_dak_from_sushi`, `generate_dak_api_hub` (3,823) | ~9,000 | **The valuable half** — target-direction |
| **Translation** | `extract_translations` (1,158), `inject_translations` (933), `pull_*` ×4, `translation_config`, `register_translation_project`, `translation_report`, `translation_security`, … | ~5,500 | See below |
| **IG build / CI** | `run_ig_publisher` (1,360), `create_package_release`, `inject_build_banner`, `stamp_deploy*`, `prune_branches`, `resolve_branch`, `pr_comment_*` | ~4,000 | Belongs with the IG, not the platform |

#### The translation subsystem is bigger news than expected

~5,500 lines wiring Weblate, Crowdin and Launchpad, with string extraction,
injection, per-project registration and a completeness report. That is the
**multilingual axis** §12.2 argued for on FRBR grounds — WHO publishing in six
official languages, a translation being *the same recommendation in another
Expression* — and it turns out to be an established subsystem rather than a
future requirement.

It substantially raises the stakes on the representation model: a DAK block has
representations along **two** axes at once, format (source / IG / Excel / PDF)
and language. That is exactly Work → Expression → Manifestation, and it is the
strongest argument yet for adopting the FRBR pattern rather than approximating
it.

#### An independent convergence worth recording

`smart-base` already generates JSON-LD (`generate_jsonld_vocabularies.py`, 738
lines) with a declared `@context`. Its namespace IRIs and folio's, chosen
separately:

| Prefix | smart-base | folio (§12.5) |
|---|---|---|
| `prov` | `http://www.w3.org/ns/prov#` | **identical** |
| `fhir` | `http://hl7.org/fhir/` | **identical** |

Both pin `@version: 1.1`. The vocabularies do not overlap otherwise — theirs
covers ValueSet enumeration semantics (`schema:`, `rdfs:`), mine document
structure (`doco:`, `deo:`) — so they compose rather than compete. WHO also
stamps `prov:generatedAtTime`, which is a stronger generated-artefact signal
than the source-comment marker `isGeneratedArtefact` currently keys on, and
worth preferring where present.

#### Correction: do not migrate — load

The migration order this section originally proposed was wrong, and the author
corrected it: **the scripts are needed where they are.** The DAK repositories'
own GitHub Actions invoke them, so `smart-base` stays their authoritative home.
Vendoring copies into this platform would produce exactly the second, drifting
copy §2c argues against — this time of a toolchain rather than a corpus.

The real need is the opposite: folio-assistant should **load** from smart-base,
and package what it finds as **agentic skills**.

That is the mechanism this repo already has, and §5's integration contract is
its statement:

```
capability probe   .claude/skills/capabilities/smart-base.json
       ↓           (detection + `requires`, resolved from SMART_BASE_HOME)
skill              .claude/skills/local/smart-base-tools.json
       ↓           (requiredCapabilities + degradation)
absent ⇒ n/a, never a false pass
```

Both are added. The capability resolves `SMART_BASE_HOME`, defaulting to
`/opt/smart-base`, and requires `python3`; the skill declares it with
`degradation: "skip"`, so a session without a checkout degrades honestly rather
than reporting a clean run over a toolchain it never had.

#### A gap this exposed: nothing ran the probes

`.claude/skills/capabilities/*.json` has always declared *how* to detect each
tool, and **nothing executed them.** `--check-deps` carried its own hardcoded
list, and `src/tools/check-deps.ts` carried a second. So the probes were
documentation, and a skill's `requiredCapabilities` had nothing to check
against.

That is not a tidiness problem. §5's contract rests on *absent tool ⇒ `n/a`,
never a false pass* — a document nobody parsed must not read as a document with
nothing in it. An unexecuted probe cannot deliver that.

`src/tools/capabilities.ts` now executes them, resolving `requires` first, and
`--check-deps` reports both mechanisms. The `requires` resolution earns its
place immediately: against this container it distinguishes

```
○ lean-atlas    — requires lean-toolchain
○ plantuml      — requires graphviz
○ smart-base    — probe failed
```

from a bare failure, and those call for different fixes. A dependent's own
probe is deliberately **not** run when a prerequisite is unmet — it would
either fail confusingly or succeed and hide the break.

The two hardcoded lists remain. Unifying them is a separate change with its own
blast radius, and `--check-deps` now says which mechanism each line comes from.

#### What to package next

Skills wrapping the target-direction scripts, in the order the evidence
suggests — `bpmn2fhirfsh.xsl` and `dmn2html.xslt` first, since they are the
smallest and already render rather than extract, then the `generate_*` family
whose JSON-LD `@context` already shares this branch's `prov` and `fhir` IRIs.
The IG build and CI scripts want no skill at all: they orchestrate the
publisher, and GitHub Actions is their caller.

### 12.17 The first smart-base-backed skill, and the render arrow proven

`smart-base-tools` wraps the two XSLT transforms, loading them from a checkout
rather than vendoring them. Run against real WHO content:

| | Result |
|---|---|
| Inputs | 8 real WHO `.bpmn` (`smart-dak-immz`) |
| Emitted | **313 FSH files, 0 failures** |
| Distinct paths | **201** |
| Collisions | **112**, all named on stderr |

That is the render arrow working end to end for the first time: an authored
source artefact (BPMN) producing a published representation (FSH). It is the
smallest existence proof that §12.15's direction is buildable, and it is WHO's
own stylesheet doing the work.

#### Three things the real run taught the wrapper

**The output is an envelope, not a document.** `bpmn2fhirfsh.xsl` emits
`<files><file name="…">…</file>…</files>`, one entry per artefact — 157 of them
for `IMMZ.D.Administer Vaccine` alone. A wrapper that treated the result as a
single document would have written one file and lost 156.

**Do not serialise and re-parse.** One real process emits FSH text containing an
`xsl:`-prefixed attribute that is well-formed inside the result tree and not
well-formed once round-tripped through a string — `XMLSyntaxError: Namespace
prefix xsl on attribute is not defined`. lxml hands back an already-parsed
tree; the wrapper reads that and never re-parses.

**Outputs collide.** 313 emitted at 201 distinct paths, because shared actors
and two near-duplicate copies of one process name the same files. Silently
overwriting would report 313 successes and leave 201 files — quiet arithmetic
of exactly the kind this work keeps finding. Every collision is now counted and
named, so a reader decides whether it is a duplicate input to remove or two
processes legitimately contributing the same actor.

#### Degradation, checked both ways

Without a checkout, `--check` exits non-zero and names `SMART_BASE_HOME`; a
transform attempt exits 3 and says why. Neither reports a clean run. That is
the §5 contract — absent tool ⇒ `n/a`, never a false pass — reaching the
toolchain layer, and it is what the capability probe added in the previous
commit now actually enforces.

#### Not wrapped

The extractors, the `generate_*` family and the translation subsystem. The IG
build and CI scripts want no skill at all: GitHub Actions is their caller.

### 12.18 A DAK PDF exists

§12.16 established that no DAK PDF renderer exists anywhere — `smart-base`'s
only PDF dependency is `pdfplumber`, which *reads* PDFs. `scripts/dak-pdf.ts`
is the first thing that writes one, completing the third of §12.15's three
render targets.

Run against all three real repositories:

| Repository | Sections | Result |
|---|---|---|
| `smart-dak-immz` | 35 | **43-page PDF, 231 KB, valid trailer** |
| `smart-dak-bds` | 33 | PDF |
| `smart-immunizations` | 34 | PDF |

Titles come from each repo's `sushi-config.yaml` ("SMART DAK IMMZ", "WHO
Immunization Implementation Guide"), narrative from `input/pagecontent/*.md`
through remark, and the whole document is printed by the Chromium already
installed for Playwright.

#### What it does not render, and why that is in the document

It renders narrative, a business-process index, and a decision-logic index. It
does **not** render BPMN diagrams (8 processes are listed, not drawn — there is
no diagram renderer and `input/images/` is empty), or the workbooks (5 in
`smart-dak-immz`), which is where most of a DAK's substance actually lives.

Those omissions are printed **inside the PDF**, in a "Not included in this
rendering" section, not only in the run log. A PDF that silently dropped the
decision tables would look complete to exactly the reader least able to notice,
and that reader never sees stdout. It is the same discipline as the graph
index's truncation reporting and the transform's collision counting: the number
that is missing has to travel with the artefact.

#### A container detail worth recording

The installed `playwright` expects `chromium_headless_shell-1228`; this
container ships `-1194` under `PLAYWRIGHT_BROWSERS_PATH`. Re-downloading is
deliberately blocked, so the renderer probes for the real binary and passes it
as `executablePath`. Without that it fails with "Executable doesn't exist",
which reads like a missing browser rather than a version skew.

#### Where the blocks come in

This renders the *current* hand-authored `pagecontent/`, because that is what
exists. §12.15's target is block → PDF, and `pagecontent/` is precisely the
seam where authored DAK blocks replace hand-written narrative: the assembler
takes a list of sections with titles, HTML and a source, which is what a block
sequence already is.

### 12.19 Diagrams drawn, and WHO's own styling

Two corrections to §12.18, both prompted by the author.

#### The styling already existed, in a directory I had not searched

§12.16 surveyed `input/scripts/` and concluded there was no PDF styling. That
was under-searched. `smart-base/local-template/package/` carries
`content/assets/css/dmn.css` — the WHO palette (`--dmn-who-blue: #0093d0`),
light/dark theming, and decision-table rules — injected by the IG template via
`_append.fragment-css.html`, alongside Liquid fragments for actors and
functional requirements and `templates/liquid/{Measure,Library,PlanDefinition,
Group,ActivityDefinition}.liquid`.

The first cut invented its own generic serif CSS, which is the second-weaker-copy
mistake this work keeps finding in other people's code. `dak-pdf.ts` now loads
`dmn.css` from the checkout when `SMART_BASE_HOME` resolves, and says so in the
HTML when it cannot.

(There is still no `@media print` or `@page` anywhere in `smart-base` — the
styling is for the IG's HTML, not for a PDF. But it is WHO's, and reusing it
beats inventing.)

#### Business processes are now drawn

`scripts/bpmn-render.ts` renders BPMN to SVG with bpmn-js inside the same
Chromium. **8 of 8 real WHO processes, 0 failures.** The PDF grew from 231 KB
to 308 KB and its BPMN omission is gone.

This works only because the files carry Diagram Interchange — bpmn-js renders a
layout, it does not compute one. All 8 do, with 20–264 `BPMNShape` elements
each.

#### A correction I made mid-flight, and the real cause

`IMMZ.D.Administer Vaccine` failed with `element <IMMZ.D17> already exists`. My
first reading — a duplicate id in WHO's file — was **wrong**: the file has no
duplicate ids at all. The actual cause is that `IMMZ.D17` appears both as a
shape in the top-level diagram *and* as the root of its own drilled-down
sub-process plane. That is legal BPMN, and a plain bpmn-js Viewer refuses it at
`importXML`, before anything renders. Drilldown is a Modeler feature.

My second attempt — a fresh viewer per diagram — also failed, for the same
reason: the rejection is at import, not at render.

`keepPrimaryPlane()` strips every `BPMNDiagram` after the first before import
and returns how many it removed, so the top-level process draws and the
sub-process count is reported (`IMMZ.D` has 7). Catching the failure instead
would have meant no diagram at all for that file. The strip is a text operation
on the serialised XML on purpose: re-serialising risks rewriting the namespace
prefixes the DI references depend on.

#### Still not in the PDF

The 5 workbooks — the data dictionary, indicators and requirements — which is
where most of a DAK's substance lives. That needs an `.xlsx` reader and a
decision about which sheets belong in a printed document; the second half is
the author's, not something to infer.
