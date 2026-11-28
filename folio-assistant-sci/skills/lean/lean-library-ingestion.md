---
name: lean-library-ingestion
user_invocable: true
description: >
  Ingest a Lean 4 library (a mathlib top-level library, or any Lake package)
  as the knowledge graph it already is, and linearise it into a textbook
  paper under folio/: one paper per library, chapters and sections in an
  order the import graph allows, each section citing the module it narrates.
  Use when a folio is given Lean content rather than prose, when asked to
  "harness" a Lean repository as a KG, or to write the narrative of a formal
  library.
allowed-tools: Bash Read Write
---

# Lean library ingestion: from a formal library to a textbook

## What this is for

A Lean library is already a knowledge graph: modules are nodes, `import`s are
edges, declarations are the claims, and docstrings are an author's narration
of them. What it lacks is a **reading order** and **prose**. This skill gives
it both, without inventing either: the order is computed from the graph, and
the prose is grounded in the library's own docstrings and formal statements.

What it does not ingest: tactic frameworks, metaprogramming, linters, file IO
and test scaffolding. For mathlib those are `Tactic`, `Util`, `Lean`,
`Testing`, `Deprecated` and `Control`, passed as `--exclude`.

## Steps

1. **Extract the graph** (Tool `lean-library-ingest`, deterministic, no build):

   ```sh
   bun run folio-assistant-sci/scripts/lean-library-ingest.ts \
     --root <lake-root> --lib Mathlib --libraries \
     --exclude Tactic,Util,Lean,Testing,Deprecated,Control --out folio/lean-ingest
   ```

   Per library it writes `kg.json` (modules, imports, module and declaration
   docstrings, declaration headers, `[Key2020]` citations, authors, revision)
   and `outline.md`; across libraries it writes `libraries.md`, the order of
   the libraries in the treatise.

2. **Linearise** (the same tool). The rule, stated so a reviewer can check it:
   - **libraries** are ordered by the median size of their modules'
     transitive import closure, elementary first. Top-level libraries import
     from one another in both directions, so no order respects every import;
     each forward import is listed, and the narrative announces it.
   - **chapters** are a library's immediate subdirectories (a top-level file
     joins the directory of the same name), in a topological order of the
     chapter-level import DAG, ties broken by the heaviest prerequisite.
   - **sections** are modules, in a topological order of the import DAG, ties
     broken elementary first (smaller closure), then by path.
   - **subsections** are the headings of the module's own docstring, less the
     conventional ones (`Main definitions`, `References`, …).

   The import graph is coarser than the elaborated formal graph
   ([`lean-formal-edges`](lean-formal-edges.md)): an import is a
   permission to use, not evidence of use. The outline is therefore a
   proposal, and an author may reorder within what the imports allow, writing
   down why.

3. **Review the outline with the owner** before writing prose. The structural
   references are the library's own curriculum maps (`docs/undergrad.yaml`,
   gathered from the French agrégation syllabus, and `docs/overview.yaml`) and
   the textbook-structure sources the voice cites.

4. **Narrate** in the [`lean-textbook`](../voices/lean-textbook/SKILL.md)
   voice together with [`milnor`](../voices/milnor/SKILL.md). Each section is
   a content block whose provenance is its module; definitions, theorems and
   proofs are blocks of the `mathpaper` kinds whose `lean.ref` names the
   declaration, so the block's formal sibling is the library itself and
   nothing is re-formalised.

5. **Round-trip QA** (`lean-narrative-roundtrip`), two directions:
   - **Lean to narrative (coverage):** every declaration a module docstring
     lists under *Main definitions / results / statements* is stated in the
     section, or excluded with a reason.
   - **Narrative to Lean (fidelity):** every stated definition and result
     names a `lean.ref` that resolves at the pinned revision, and an
     independent reader, given only the formal statement, agrees the prose
     says the same thing (hypotheses included). A proof step must correspond
     to a lemma the formal proof invokes.

   Both directions write their verdicts into the block's `.qa.json` sidecar,
   like every other QA criterion.

6. **Translate** from the English narration (the source text), through the
   harness's translation round trip (forward translation, back-translation,
   adjudication). A source document in another language is cited in that
   language.

## Anti-patterns

1. Ordering sections alphabetically, or by directory listing.
2. Stating a theorem by its Lean identifier.
3. Re-formalising a result the library already proves: point `lean.ref` at it.
4. Treating the import graph as the proof graph.
