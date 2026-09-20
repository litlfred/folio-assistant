---
# folio-assistant-81t5
title: 'TOOL 8/13: ingest-extract-structure — document ingestion (15 files, 7 entry points)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T04:34:56Z
updated_at: 2026-09-20T16:38:42Z
parent: folio-assistant-d308
---

Group 8 of 13 in `d308`. **15 files, 7 entry points.**

`pdf-extract`, `pdf-ocr`, `pdf-pages`, `pdf-structure`, `pdf-tables`,
`split-pdf-by-chapter`, `extract-candidates`, `tabular-records`,
`archive-contents`, `ingest-document`, `scan-repo-content`,
`smart-base-transform`, `_pdf_doc_id`, `_pypdf_compat`, `_tech_meta`,
`pypdf_safe`.

**BPMN:** `ingest-extract-structure · Task_ExtractText · Task_Ocr ·
Task_Candidates` — three `serviceTask`s. Also `document-ingestion` and
`ingest-derive-content`.

**Target repo (#223):** `folio-assist-core`.

**Partly done already, and that is the point:** `main` added `ingest-stdlib` and
its paired Tool on 2026-09-19 with a measured dependency posture (three installs
to reach a working image extractor: `pypdf`, then `cffi` — whose absence makes
`cryptography` panic on IMPORT under pyo3 — then `Pillow`). So this group has a
worked example of the split-by-dependency-boundary pattern IN the graph already.
This bean is the rest of it, not the start of it.

## Done when
- [ ] the remaining entry points reachable through a Tool node
- [ ] `alternativeTo` wired to the existing ingest pair where the arms genuinely overlap
- [ ] `requires.runtime` honest about Python deps, per bean `68dt`
- [ ] `tool-coverage` reflects it


---

## MEASURED 2026-09-20 — the ingest pipeline has a MISSING MIDDLE

Two findings, and neither is "add a Tool node to the remaining entry points" as
this bean framed it. A third — nine broken `invoke.shell` paths, including this
bean's own two nodes — became `jqv4` and is done.

### 1 — Stage B has no caller, and Stage C requires its output  ⟵ BLOCKER

The pipeline as `gen-library-jsonld.ts` documents it, in its own words:

> `pdf-structure.py` produces `structure.json` + `sections/*.md`, and
> **`extract-candidates.py` produces `candidates.json`**. … `candidates.json`
> **Stage B (input)**

Measured:

| stage | mechanism | called by |
|---|---|---|
| A | `pdf-structure.py` | `ingest-document.ts` ✓ |
| **B** | `extract-candidates.py` | **nothing** — not `ingest-document.ts`, not `package.json`, not any workflow. Only its own test |
| C | `gen-library-jsonld.ts` | requires Stage B's `candidates.json` as an INPUT |

So a consumer declares an input whose only producer is reachable from nothing.
`ingest-document.ts` does not contain the string `candidate` at all.

**The question is a design one and it is the owner's:** is Stage B meant to be
**operator-invoked** between A and C — in which case it wants a Tool node and
nothing says so — or should `ingest-document.ts` run it, making the ingest
entry point produce all three artefacts? Those are different flows, and guessing
would either invent an operator step nobody asked for or change what a single
`ingest` run does.

Not decided here. What is certain is that the pipeline as declared cannot
complete in this repository without someone running Stage B by hand, and nothing
records that as the intent.

### 2 — `extract-lean-blocks.py` is a folio's content living in the platform

20,662 bytes, born 2026-09-17 in the bulk import, referenced by **nothing** — not
a caller, not a test, not a workflow. And its own docstring says what it reads:

> Reads **`content/quantum-observable-universe/lean/`** source files, maps
> declarations to content blocks, and writes individual `.lean` files alongside
> their `.ts`/`.md` siblings.

That is **one named folio's path, hardcoded**, in the repository whose own
`AGENTS.md` opens with *"folio-assistant is the platform, not the content … If you
are about to write subject matter here, you are either in the wrong repo or
writing something that belongs in the folio as data."* `content/` does not exist
here at all.

So this is not a Tool-node question. It is a boundary question, and the two
answers are different acts: **move it to `litlfred/qou`**, where its subject
lives and where it might still run, or **retire it to `fsh-guts/`** as spent.
I am not moving a 20 KB script into another repository unasked, and `fsh-guts`
would be the wrong call if it is still wanted over there.

### What is NOT a finding

`pdf-extract.py` and `pdf-structure.py` are both reached — `pdf-structure` from
`ingest-document.ts` directly, `pdf-extract` through `pypdf_safe.py`,
`pdf-pages.py` and `pdf-tables.py`. This bean's criterion *"the other files in the
group reachable only through it"* is satisfied for those, which is why they get no
node of their own.

### Done when

- [x] the nine broken `invoke.shell` paths fixed and gated — `jqv4`
- [ ] **Stage B: operator-invoked with a Tool node, or run by `ingest-document.ts`?**
      — the owner's call
- [ ] **`extract-lean-blocks.py`: move to `litlfred/qou`, or retire to `fsh-guts`?**
      — the owner's call
- [x] `requires.runtime` honest about Python deps, per bean `68dt` — the two ingest
      nodes already declare it
