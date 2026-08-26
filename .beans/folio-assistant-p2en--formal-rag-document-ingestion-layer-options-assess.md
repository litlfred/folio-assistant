---
# folio-assistant-p2en
title: 'Formal RAG document-ingestion layer: options assessment + integration contract'
status: in-progress
type: task
priority: normal
created_at: 2026-08-15T15:27:40Z
updated_at: 2026-08-26T15:40:00Z
---


## Assessment landed (PR #119)

`docs/proposals/rag-document-ingestion.md`. Three measured constraints
decided it: 230/339 uploads (68%) are arXiv (source beats OCR); host is
cx23 = 2 vCPU/4 GB vs RAGFlow's 16 GB minimum (no co-hosting); and
`content/**` is already semantically chunked with a `uses[]` graph (a RAG
engine would hold a weaker second copy).

Recommends acquire → parse (Docling) → route-by-class → index (LanceDB,
embedded), with generic RAG as the *fallback* rather than the front door.
For WHO L2 DAK the generic-first ordering is destructive — BPMN/DMN/Excel
have structured extractors in `smart-base` already.

Next: author picks a stage to build (§10) and answers §11 Q1–Q3.

## Stage 1 built and run (scripts/pdf-structure.py)

Egress checked per the author's hunch: the MCP servers DO exist
(`qou/.mcp.json` has paper-search-mcp + openalex-paper-search) but
arxiv.org / export.arxiv.org / api.openalex.org all return 403 policy
denials. PyPI is reachable. So the offline PDF path had to be Stage 1,
not the network acquire — proposal §10 reordered accordingly.

Whole-corpus run: 339 PDFs / 12,166 pages -> 332 docs, 0 failures,
**7,313 sections / 24.7M chars greppable** (52 MB). Title 96.7% (vs
DocInfo 37%), authors 72.6%, abstract 68.4%, arXiv id 64.2% from the
page-1 stamp. TOC: 188 outline / 137 inferred / 7 none.

Residue that defines Stage 3: 7 no-TOC, 17 unsectioned, 7 likely-scanned.
Those ~20 are where Docling earns its place; the other 312 do not need it.

Next: Stage B extractors (candidates.json) — math claims -> formalization
candidates, WHO L1 -> recommendation blocks. Both propose, never write to
content/.

## Follow-ups landed (qou PR #5134)

- corpus-grep checklist gains path 5, `library/*/sections/` — the 24.7M
  chars are now reachable by the discipline that most needs them.
- 43 references.ts entries marked `stage: "missing"` (claimed upload,
  file never committed). Recorded, not repaired.
- 246 uncited library documents queued in
  `docs/audits/2026-08-15-library-uncited-triage.md`, ranked by extracted
  formalizable content (a proxy for offered material, NOT relevance).

## Stage 3 (Docling) is network-blocked, like Stage 2

huggingface.co and cdn-lfs.huggingface.co return the same 403 policy
denial as arxiv.org, and that is where Docling's layout/TableFormer/
formula models come from. So BOTH network-dependent stages are dead in a
sandbox, which is the strongest version of the argument for the
pypdf-only Stage 1. Stage 3 is a workstation/CI stage: run where egress
allows, commit artefacts, let sandboxed sessions consume them.

Work list is ~20 documents (7 no-TOC, 17 unsectioned, 7 scanned).

## L1 extractor: logic tested, real layout still unproven

who.int / iris.who.int / cdn.who.int are 403 like arxiv and huggingface,
and no guideline-like document exists in the library, so validation
against a real WHO L1 PDF is impossible in a sandboxed session. Added
`scripts/tests/who-l1-extractor.test.py` instead: a synthetic fixture
built from document-intake's documented L1 structure, asserting all five
normative elements map to the right block kinds, GRADE + strength are
detected, routing goes to l2-dak-authoring, and no formalization
candidates are emitted.

The negative half of that test found a real bug: RE_GRADE alternated on
bare `\bhigh|moderate|low`, so "high malaria burden" in a nearby
paragraph flagged a recommendation as GRADE-adjacent. Certainty levels
must now bind to a certainty/quality/evidence noun.

`candidates.json` still reports `"validated": false` for who-l1 and must
keep doing so until a real guideline runs through it. Only affects the
who-l1 class; the 332 math-class candidates are unchanged (extract_math
never touches RE_GRADE).

## Schema layer decided and built (§12)

The landed assessment chose *tools* and left the *schema* open, which is why
`pdf-structure/v1` is a flat `sections[]` with a `level` int. Author's
constraints settled it: an independent standard where one exists, a graph not
a flat list, no XML stored, each block standing alone as a file.

`DoclingDocument` fails the first — it is Pydantic models in `docling-core`,
no spec, no standards body, LF AI & Data hosting is maintenance not
specification. Demoted to input adapter. TEI fails the fourth: XML is a tree,
and a standalone block needs its own `<TEI>` + header, turning every pointer
into a cross-document URI.

Resolution: vocabulary from the standards (DoCO/DEO, Web Annotation, PROV-O,
SKOS, FHIR), model from RDF, serialisation JSON-LD. XML formats stay export
targets only. Akoma Ntoso survives as its *naming convention* — FRBR
Work/Expression/Manifestation is the only candidate modelling a translation as
the same recommendation and a national adaptation as a derived one, which WHO
+ other jurisdictions requires.

Authored blocks keep TypeScript. Each gains a generated `.jsonld` sibling
(one more `Companions` role), committed and drift-gated.

**The hazard worth remembering:** a folio label looks like a JSON-LD compact
IRI and is not one. `def:` names a kind, not a namespace, and JSON-LD splits
on the first colon — so `def:foo` and `paper:def:foo` would resolve to two
different IRIs for one block, and `unital-groebner-bases:cor:pbw` becomes a
*valid* absolute IRI with scheme `unital-groebner-bases`. Both fail silently
and under-count every join. Fixed by minting `@id` in `resolveLabel()` and
never emitting labels as IRIs; unresolvable refs are reported, not emitted.
No content changes.

Also caught while writing: `doco:contains` does not exist (DoCO imports
`po:contains` from the Pattern Ontology). Mapped to the verified
super-property `dcterms:hasPart` instead, and `certainty` omitted pending a
checkable FHIR predicate. Rule recorded in §12.5: a published `@context`
never carries an unverified IRI.

Landed: `schemas/jsonld.ts`, `ns/content/v1.jsonld`,
`scripts/gen-jsonld-context.ts`, `content/pipeline/gen-block-jsonld.ts`,
two test files (30 tests), `.github/workflows/jsonld-gen-check.yml`.
740 pass / 0 fail, typecheck + lint clean.

Still open: ingest node granularity (section-level vs every theorem/figure/
table as its own file) — affects only the ingest writer; `@id` rename policy
once anything annotates a block; whether to emit real RDF.

## MCP read side landed (§12.7)

The sharper form of the §1 retrieval gap: MCP was **write-only toward
ingestion**. It creates `uploads/<id>/` on import and `get_imports` lists what
was imported, but nothing ever read a `structure.json`, a `sections/*.md` or a
candidate. 24.7M extracted chars reachable by grep and nothing else.

`content/pipeline/graph-index.ts` is the first thing that spends the `.jsonld`
decision: one directory walk over `content/` + `library/` yields one node map
plus **reverse adjacency**. Three MCP tools on it — `search_graph`,
`get_neighbors`, `get_graph_stats`.

`get_neighbors --in` is the one nothing else provides: "what breaks if this
changes?" today needs a full corpus scan.

Three properties held deliberately: absent root reports `present: false` (not
zero matches) so "not built yet" is distinguishable from "nothing matched";
every cap reports itself (`totalMatches`, `textScanTruncated`, `truncated`);
a colliding `@id` is recorded in `malformed` rather than resolved by picking
a winner.

`content-graph.ts` stays authoritative for authored content — it imports
manifests and that import is a validation step. The index reads the published
projection instead, which is cheaper and spans ingested docs. The CI drift
gate is what makes trusting both at once sound.

Also runnable without an MCP client:
`bun run content/pipeline/graph-index.ts --stats|--search|--neighbors`.

773 pass / 0 fail, typecheck + lint clean. Real run in folio-assistant
correctly reports content present/0 nodes, library absent.

**Not verified:** the three MCP tool handlers are typechecked but not
exercised by a test — no test drives the server's request path. And no run
against a real corpus has happened; the folio repo is where that has to occur.
