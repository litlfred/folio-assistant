---
# folio-assistant-p2en
title: 'Formal RAG document-ingestion layer: options assessment + integration contract'
status: in-progress
type: task
priority: normal
created_at: 2026-08-15T15:27:40Z
updated_at: 2026-08-26T21:00:00Z
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

## Granularity decided; QA companion roles widened

Author's decision: content blocks are **fine-grained and self-contained** — a
decision table, a math proposition, a FHIR ValueSet each a block — and
groupings (sections) are built from an *ordered list* of block refs, as in the
QOU chapter/section model. That dissolves the objection that fine-grained
nodes would have no file of their own: the blocks own the files, a section is
a manifest.

Operational definition that settles it: **a content block is what a QA sidecar
runs against** (`qa-utils.ts:810`, `<stem>.qa.json`).

L2/L3 block vocabulary — WHO's own sites (smart.who.int, build.fhir.org) are
403 like who.int, but the repo already carries the canonical lists:
- L2 (`schemas/skills/l2-dak-authoring`): personas, user-scenarios,
  business-processes, data-dictionary, decision-logic, scheduling-logic,
  indicators, functional-requirements, non-functional-requirements
- L3 (`schemas/skills/l3-fhir-authoring`): logical-model, profile,
  questionnaire, cql-library, structure-map, plan-definition, measure,
  test-case, actor-definition, requirements

**The bug this exposed and fixed.** `depends_on` was typed
`Array<"md"|"ts"|"lean">` — the paper adapter's companion set — and it gates
*applicability*, not just freshness. So no criterion could attach to a `.dmn`
or `.fsh`, and worse: every WHO block would hit qa-sweep's hard-coded `.md`
branch and record a clean `n/a` for every axis. QA would report a swept,
healthy corpus it had never read. Same failure shape as the stale
BLOCK_BUILDER_RE that hid 461 blocks.

Now `COMPANION_ROLES` = md, ts, lean, bpmn, dmn, xlsx, fsh, cql. The two
hard-coded `if`s are one `applicabilityGap()` over the criterion's declared
roles. Verified no-op for the paper corpus: `sameScriptVerdict` compares
`notes`, and `missingCompanionNote` reproduces the existing strings byte for
byte, so no sidecar rewrites on the next sweep — pinned by a test.

Two judgement calls recorded:
- **No `json` role.** Compiled FHIR JSON is a SUSHI build output of `.fsh`, not
  an authored companion; it also warns as a Pydantic field (shadows
  `BaseModel.json`) — confirmed against pydantic 2.13.4, not assumed.
- **`xlsx` is not textual.** A ZIP container: hashable, not greppable.

All three cross-language mirrors updated together (TS, canonical JSON Schema,
Python, JS) rather than left to drift.

793 pass / 0 fail, typecheck + lint clean.

**Still open:** adapter-scoped vs globally-tagged BLOCK_KINDS — adding ~19 WHO
kinds to the single global list makes every math axis nominally applicable to
a ValueSet. That is the next fork, and it gates the ingest writer.

## Adapter-scoped block kinds (§12.8)

Took the adapter-scoped call rather than globally-tagged; author said go
without picking and this matches the existing `adapters/paper/` seam.

`CONTENT_ADAPTERS` = paper | dak. `PAPER_BLOCK_KINDS` is an **alias** for
`BLOCK_KINDS` (not a copy — a second hand-maintained list is the exact drift
`block-kinds.ts` exists to prevent), so the compile-time exhaustiveness proof
against the `Block` union is untouched. `DAK_BLOCK_KINDS` adds 19 L2/L3 kinds.
`adapterForKind()` returns `undefined` for an unknown kind rather than
defaulting to paper — defaulting is precisely how a math axis would come to
run against a ValueSet.

QA criteria gained `adapters?`, gated in the sweep **before** the companion
gate. The load-bearing choice is the default: **absent means `["paper"]`, not
"all"**. All ~47 registered criteria are paper axes, so "all" would need every
one edited to stay correct and would misfire silently on any missed. A test
asserts every registered criterion resolves to `["paper"]`, so adding a DAK
criterion without declaring scope fails.

Failure mode this prevents is not a harmless n/a: it is
`voice-scholarly-default: fail` on a decision table, which reads like a real
finding.

**Declared, not authorable.** DAK kinds are not in the `Block` union and have
no builder, Zod schema or viewer registration, so `walkBlocks` cannot discover
one. Pinned by a test so it stays a stated limitation rather than a kind that
looks supported and silently yields nothing. That authoring work is next, and
the ingest writer follows it.

807 pass / 0 fail, typecheck + lint clean. Verified no-op for the existing
corpus: every kind `walkBlocks` can encounter resolves to paper, and every
registered criterion admits every paper kind.

## DAK blocks authorable (§12.9)

`schemas/dak-blocks.ts` — 19 interfaces, `DakBlock` union with its own
exhaustiveness proof against `DAK_BLOCK_KINDS`, Zod schemas with label-prefix
enforcement, builders, `layerForKind` deriving L2/L3 from one table. Exported
via `schemas/index.ts`; smoke-tested through the package root.

**The subtle bit:** builder name and kind string separate for the first time.
Paper kinds are single words so `BLOCK_BUILDER_RE` alternated over kinds
directly; `decision-table` cannot be an identifier, so builders are camelCase
and `kindForBuilder` maps back. Left unmapped, blocks would be discovered under
kind `decisionTable` — matching no criterion and no adapter, i.e. the 461-block
disappearance in a new place, with no compile error. Pinned by a test that a
DAK manifest is discovered under its KIND.

Prefixes: 19 new, none colliding with the 17 paper/structural ones, canonical
in `block-kinds.ts` so `KNOWN_LABEL_PREFIXES` and `KIND_PREFIXES` both derive
from one list — the existing sync assertion still passes.

Deliberately not modelled: field-level semantics. A `value-set` block has a
label, edges and a `.fsh` pointer, not `ValueSet.compose.include`. Those
belong to the artefact formats, which have validators already; a parallel copy
would drift. Same reason it is typed `folio:ValueSet` not `fhir:ValueSet`.

`realises` added as the L1→L2→L3 traceability edge, which makes DAK coverage a
graph query via `get_neighbors` rather than a bespoke script.

832 pass / 0 fail, typecheck + lint clean.

**Next: the ingest writer.** Every dependency now exists. Also worth noting: no
`dak`-scoped QA criterion has been written, so that mechanism is live with
nothing registered in it.

## First DAK QA axes (§12.10) — and a wiring hole they found

Five criteria in `qa-checkers-dak.ts`: companion-present, bpmn-has-process,
dmn-has-decision-table, fsh-declares-kind, label-prefix-matches-kind. All
`adapters: ["dak"]`. Structural presence and well-formedness only — semantic
conformance needs the real validators (fhir-validation, SUSHI, a DMN engine)
and a grep-level reimplementation would disagree with the authoritative verdict.

`dak-companion-present` is the interesting one: it catches a missing `.dmn`, so
it must NOT list `.dmn` in `depends_on` (which gates applicability and would
n/a exactly the blocks it is for). Depends on `ts`, declares the artefacts under
`also_invalidated_by`. First criterion to need that documented distinction.

**Hole this exposed in my own §12.8 work.** `qa-sweep` built
`const paths = { md, ts, lean }` and passed it to both `hashBlockFiles` and the
checker. So the types and the applicability gate knew about `.dmn`/`.fsh`, but
the sweep still hashed three files — a DAK verdict could never go stale when
its decision table changed. My companion-role tests covered `hashBlockFiles`
and `entryIsFresh` in isolation and passed; they did not cover the call site.
Fixed: `paths = block.companions`, checker signature is `CheckerPaths`.

Added `ADAPTER_COMPANION_ROLES` + `incompatibleCompanions()` so a
paper-criterion-depends-on-.dmn mismatch is checkable rather than showing up as
a permanently-n/a criterion that looks registered.

Four guard tests from the previous commit correctly failed (they asserted the
registry was all-paper) and were rewritten to the stronger invariant rather
than relaxed. One stale test comment corrected — it still claimed DAK kinds had
no builder or Zod schema, which §12.9 made false.

852 pass / 0 fail, typecheck + lint clean.

**Next: real-corpus run.** Everything on this branch is still fixtures.

## Real-corpus run (§12.11) — two defects fixtures could not find

Cloned litlfred/qou @ a5e9957, symlinked the platform to reproduce the real
embedding. 5 papers, 3692 .ts files.

**3550 blocks emitted, 0 load failures. 3550 nodes / 7631 edges, 0 malformed.
Second run --check clean (deterministic).**

**(a) Pre-existing repo bug.** `alg:` and `prose:` were absent from
KNOWN_LABEL_PREFIXES though LABEL_PREFIXES maps `algorithm -> "alg:"` and 16
alg + 18 prose blocks use them. So isCrossPaperRef returned TRUE for a block's
own same-paper label. Effect: render-latex emits cross-paper refs as plain text
not \hyperref, so 9 in-paper links lost hyperlinks in the PDF; and build.ts
excluded them from undefined-reference warnings. Registered both. Not caused by
this work — just never asked the question that exposes it.

**(b) My own generator's collision.** `blockToJsonLd` fell back to
`.../blocks/UNRESOLVED` for a prefix-less own-label, so ALL such blocks shared
one @id — the index correctly refused to overwrite and 12 real blocks vanished
while the generator reported success. Fixed with `mintNodeId` (never fails;
prefix-less label becomes its own segment). Asymmetry vs resolveLabel is
deliberate: a block's own label is identity and cannot be wrong, a reference is
a claim that must resolve. Every fixture label had a prefix — which is exactly
why fixtures missed it.

Reverse query works on real data: `--neighbors def:quantum-universe --in` → 25
dependents across uses + interprets.

33 dangling refs remain — qou content defects (labels with no prefix at all).
Reported, not repaired; another repo's content is its own call.

856 pass / 0 fail, typecheck + lint clean.

**Still open:** MCP handlers untested; no DAK corpus to exercise the dak axes.

## Ingest writer landed; graph closed (§12.12)

`gen-library-jsonld.ts`. Real run: 443 docs → **435 ingested, 16,669 blocks**.
Combined graph **29,780 nodes / 85,016 edges, 0 malformed** (3,550 authored +
26,230 ingested). §1's retrieval gap is closed — the extracted corpus is now
queryable, not just greppable.

Model as decided: blocks own files, a section is an ordered manifest of block
refs and carries no text. Section prose becomes one `prose` block pointing at
the EXISTING `sections/<sid>.md` — no copy, so 24.7M chars stay where the
corpus-grep checklist looks. Extraction is incremental: better extractors turn
prose into typed blocks without changing any section's @id.

Attribution kept sharp: every node `provenance: "ingested"` + `sourceDocument`,
and the extractor's own disposition string ("proposals only … nothing here is
folio content") carried verbatim onto the manifest rather than paraphrased.

**Two more real-run findings:**
- `searchGraph`'s 400-file text cap was 6x too tight AND biased: a full scan of
  20,191 files takes 1.6s and finds 322 matches vs 55, and iteration hits
  authored nodes first so the ingested population — the whole reason full-text
  search exists — was never scanned. Default now 50,000.
- MCP handlers were in a nested function inside a request handler, covered by
  tsc and nothing else — exactly where §12.11's two defects hid, both of which
  typechecked. Extracted to `adapters/mcp-server/tools/graph.ts`, now driven by
  14 tests and verified against the real corpus. One behaviour change: an
  unknown edge term was silently filtered (answering a narrower question than
  asked); now reported.

888 pass / 0 fail, typecheck + lint clean. CI gate + npm scripts extended.

**Still open:** the five dak axes have never run on real content (no DAK corpus
exists); 33 dangling refs are qou content defects; promotion library→content
remains manual by design.

## DAK axes vs real WHO content (§12.13)

Three real repos: smart-dak-immz 3fe6a17, smart-dak-bds 6953ede,
smart-immunizations 12ec2fc (L3).

**Best result:** the block/companion model is not imposed — WHO already uses
it. 279 .cql ↔ 279 .fsh Library instances pairing 1:1 by stem; 8 business
processes as 8 .bpmn.

Checkers that could run: `dak-bpmn-has-process` 8/8 pass on real WHO BPMN;
`dak-fsh-declares-kind` 739/739 verdicts agree with ground truth.

**Design error found.** REQUIRED_COMPANION mapped decision-table and
scheduling-logic to `.dmn`, following this repo's own dmn-authoring skill and
the l2-dak-authoring BPMN. **Zero .dmn across all three repos** — WHO ships
decision-support logic as .xlsx. Would have failed every decision-table block
for an artefact WHO doesn't produce. Deeper cause is structural: ONE WORKBOOK
HOLDS MANY BLOCKS (one spreadsheet covers every decision table, one dictionary
every data element), so a per-block companion doesn't exist until an extraction
stage splits them — the DAK counterpart of Stage B, not built. Six kinds now in
WORKBOOK_BACKED_KINDS, exempt by measurement.

**A strengthening the data vetoed.** Was about to key dak-fsh-declares-kind on
`InstanceOf:` to discriminate the five Instance-mapped kinds. Real WHO FSH names
PROFILE URLs, not resource types: 138 cpg-recommendationdefinition, 41
proportion-measure-cqfm vs 279 bare Library. Would have caused 138 false
failures on a correct corpus. Stays coarse; resolving profiles is SUSHI's job.

**Honest limit:** 3 of 5 axes check manifest↔artefact relationships, and real
WHO repos have artefacts but no folio manifests. Only the artefact-reading half
is validated. Full exercise needs DAK blocks authored over this content.

Also unmodelled: WHO ships CodeSystem (6) and ConceptMap (3) FSH resources with
no corresponding DAK block kind.

891 pass / 0 fail, typecheck + lint clean.

## DAK representations + generated FHIR (§12.14)

Author's three facts, all confirmed against the real repos:

1. **DAK content has a FHIR IG representation.** smart-dak-immz is "L2" yet has
   536 .fsh — because the L2 DAK is itself published as a FHIR IG. Its
   input/fsh/ subdirs map ~1:1 onto DAK components (models, plandefinitions,
   activitydefinitions, requirements, scenarios, actors, measures,
   questionnaires, valuesets, codesystems, conceptmaps, libraries).
2. **Some of that FHIR is autogenerated from L2.** Measured: 266 of 536 .fsh in
   smart-dak-immz carry an explicit marker; 0 of 739 in smart-immunizations (L3
   IG, authored). Marker names the source row:
   `//functional requirment instance generated from row 73` →
   IMMZ.FXNREQ.075.D.fsh from the requirements xlsx.
3. **A PDF representation is intended, not built.**

**Model consequence:** a DAK block is ONE WORK with SEVERAL EXPRESSIONS — the
L2 spreadsheet row, the FHIR IG resource, the future PDF section. Not three
blocks, not three companions. That is the FRBR pattern §12.2 already argued for
on multilingual/jurisdictional grounds, now independently motivated from the
WHO side.

**Built:** `isGeneratedArtefact()` + checkers returning `n/a` WITH A REASON for
generated artefacts. A finding on a generated .fsh is unactionable — the fix is
the spreadsheet row or the generator. Validated on real content: 266/536 and
0/739, matching ground-truth grep exactly. Conservative by design: only an
explicit marker counts, since silently exempting authored content is the
costlier error. Regex matches WHO's typo `requirment` verbatim on purpose.

**Corrected §12.13, one section old:** I said workbook-backed kinds have no
per-block artefact until an extraction stage exists. True of the SOURCE, false
of the published DAK — WHO's tooling already splits it, one FHIR instance per
row. Still not *required* (derived, not authored), but the reason changed.

**Open, better posed:** the block model needs a REPRESENTATION axis distinct
from companions — source / generated / rendered. Companions answer "what files
does this block have"; representations answer "which is authoritative".
Deferred until the PDF representation exists rather than guessing a third case.

895 pass / 0 fail, typecheck + lint clean.

## Target architecture stated (§12.15) — the arrow inverts

Author: the DAK content block should render BOTH a PDF (+ some Excels) AND the
DAK IG; source/PDF/Excel live in the DAK repos. Today those are hand-made and
we extract computable artifacts from them; the goal is the reverse — build and
edit components in folio-assistant, then rendering packages them together.
("deck"/"lock" were voice-recognition for DAK/block; confirmed.)

```
TODAY   hand .xlsx/.bpmn --extract--> FHIR IG   (PDF absent)
TARGET  content blocks --render--> PDF · Excel · FHIR IG
```

This is exactly the paper adapter's shape — blocks are source, render-latex /
generate-block-tex / generate-main-tex produce .tex, latexmk the PDF. Nobody
hand-writes .tex and extracts blocks from it. DAK wants the same chain, three
outputs.

**Re-assessment of what I built:**
- Load-bearing at the target: block model, adapter scoping, DAK kinds+builders,
  companion roles, adapter-scoped QA, JSON-LD projection, graph index, MCP read
  side. All of it is "authored source" infrastructure.
- **Transitional:** `gen-library-jsonld.ts` IS the extract arrow. Not wasted —
  435 docs / 26,230 nodes of hand-made material still must become computable —
  but it is the on-ramp, not the architecture. Labelled as such.
- **Inverts:** `REQUIRED_COMPANION`'s FHIR rows. Today .fsh is the authored
  source of the L3 IG so requiring it is right; at the target it is a RENDER
  OUTPUT, and requiring an authored block to carry its own .fsh is the analogue
  of requiring a paper block to ship its own .tex. Split: .md/.ts/.bpmn/.dmn/.cql
  stay authored; .fsh/.xlsx/PDF cross the line. FLAGGED, not changed —
  enforcing a state that doesn't exist would report defects in correct corpora.

**Missing to reach the target:** a DAK renderer (block → FSH → SUSHI → IG;
block → .xlsx; block → PDF), the analogue of render-latex.ts.

The §12.14 representation axis is no longer speculative — the target names its
three cases: source / generated / extracted. PDF is one render target, not a
third guess.

895 pass / 0 fail.

## smart-base survey (§12.16)

litlfred/smart-base @ 5891a22: **54 Python scripts, 24,775 lines** + XSLT/XSD.

**PDF renderer confirmed absent.** Only PDF dependency is `pdfplumber`, used by
extractpr.py to READ pdfs for persona extraction. No block→PDF path at all.

**Two target-direction pieces already exist:** `includes/bpmn2fhirfsh.xsl` (720
lines, BPMN → FHIR FSH) and `dmn2html.xslt` (161, DMN → HTML). Closest working
precedent for the §12.15 renderer, and the least speculative starting point.

**Inventory by arrow:** extract ~3,500 (dd/dt/req/bpmn/svg/personas — dt_extractor
alone is 1,305); render+generate ~9,000 (the valuable half); translation ~5,500;
IG build/CI ~4,000 (belongs with the IG, not the platform).

**Translation subsystem is bigger news than expected** — ~5,500 lines wiring
Weblate/Crowdin/Launchpad with extraction, injection, per-project registration,
completeness reporting. That IS the multilingual axis §12.2 argued for on FRBR
grounds, and it's established rather than future. Raises the stakes on the
representation model: a DAK block varies along TWO axes at once — format
(source/IG/Excel/PDF) and language. Work→Expression→Manifestation, exactly.

**Independent convergence:** smart-base already emits JSON-LD
(generate_jsonld_vocabularies.py, 738 lines). Its namespace IRIs vs mine,
chosen separately: prov `http://www.w3.org/ns/prov#` IDENTICAL, fhir
`http://hl7.org/fhir/` IDENTICAL, both `@version: 1.1`. Vocabularies otherwise
complementary (theirs schema:/rdfs: for ValueSet enumeration semantics, mine
doco:/deo: for document structure). They also stamp `prov:generatedAtTime` —
a stronger generated-artefact signal than the source-comment marker
isGeneratedArtefact keys on; worth preferring where present.

**Migration order recommended, not attempted** (24,775 lines is a programme):
XSLT pair first (smallest, proves the chain) → generate_* schemas/jsonld (IRIs
already align) → extractors (pair with gen-library-jsonld) → translation
(largest, needs the representation axis decided first).

## Correction: load smart-base, don't migrate it

Author corrected my §12.16 migration recommendation: the scripts are **needed
where they are** — the DAK repos' GitHub Actions invoke them. Vendoring copies
would be the second drifting copy §2c argues against, this time of a toolchain.
Real need: folio-assistant LOADS from smart-base, and packages what it finds as
agentic skills.

Added, using the mechanism the repo already has:
- `.claude/skills/capabilities/smart-base.json` — resolves SMART_BASE_HOME
  (default /opt/smart-base), requires python3
- `.claude/skills/local/smart-base-tools.json` — degradation "skip"
- registered in the authoring-who-smart-guidelines package manifest
Both validate against CapabilityDefinitionSchema / SkillDefinitionSchema.

**Gap this exposed:** `.claude/skills/capabilities/*.json` declared HOW to
detect every tool and **nothing ever executed them**. `--check-deps` had its own
hardcoded list; `src/tools/check-deps.ts` a second. So probes were documentation
and skills' `requiredCapabilities` had nothing to check against — which breaks
§5's "absent tool ⇒ n/a, never a false pass", since an unexecuted probe can't
deliver it.

Built `src/tools/capabilities.ts` (loader + probe + requires resolution) and
wired it into `--check-deps`. The requires resolution pays immediately: reports
`lean-atlas — requires lean-toolchain` and `plantuml — requires graphviz`
distinctly from a bare probe failure; those need different fixes. A dependent's
own probe is NOT run when a prerequisite is unmet (would fail confusingly or
succeed and hide the break). Verified smart-base flips ○→✓ with
SMART_BASE_HOME set to the real checkout.

**Not done:** the two hardcoded dep lists remain; unifying them is a separate
change with its own blast radius. --check-deps now labels which mechanism each
line comes from.

913 pass / 0 fail, typecheck + lint clean.
