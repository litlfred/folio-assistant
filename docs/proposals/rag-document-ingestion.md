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
