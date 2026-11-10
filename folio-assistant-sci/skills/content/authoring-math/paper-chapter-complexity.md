---
name: paper-chapter-complexity
description: >-
  The paper-folio half of the harness's chapter-complexity-review and
  block-density skills: the mathematical block-kind classifier for logical vs.
  storytelling backward edges, cross-paper uses[] filtering, and table-extraction
  and density rules for formal statement blocks.
---

# Paper chapter complexity and block density

The harness skills [`chapter-complexity-review`](../../../../cat-harness/skills/authoring/authoring-core/chapter-complexity-review.md)
(`skill_fetch chapter-complexity-review`) and
[`block-density`](../../../../cat-harness/skills/authoring/authoring-core/block-density.md)
(`skill_fetch block-density`) govern intra-chapter dependency-graph energy and
single-topic block atomicity for any folio. In a paper folio, where mathematical
claim kinds carry formal proof obligations and chapters cross-reference across
papers, apply the rules below alongside them.

## 1. Logical vs. storytelling block-kind sets (`chapter-complexity-review`)

A paper folio classifies each internal `uses[]` backward edge using the
mathematical and narrative block-kind sets:

- **Logical / expository source and target kinds** (`LOGICAL_SRC`, `LOGICAL_TGT`):
  `definition`, `proposition`, `theorem`, `lemma`, `corollary`, `proof`,
  `conjecture`. An edge is a **logical backward edge** (the genuine defect that
  contributes to chapter energy) iff **both** endpoints are in this set and the
  edge is a real `uses[]` reliance.
- **Narrative source kinds** (`NARRATIVE_SRC`):
  `prose`, `remark`, `example`, `simulator`, `equation`, `diagram`, `table`.
  A backward edge from one of these kinds (for example a remark foreshadowing a
  later theorem, or an example motivating a later definition) is a
  **storytelling backward edge** and is weighted at zero in the energy sum.

Reuse the single authoritative classifier (`LOGICAL_SRC`, `LOGICAL_TGT`,
`NARRATIVE_SRC`) in `classify_edge(src_kind, tgt_kind, is_uses)` rather than
re-deriving the kind lists per script.

## 2. Filtering cross-paper references (`chapter-complexity-review`)

When parsing a paper chapter manifest `.ts` (`sections → blocks`) and each
block's `uses[]` array, filter `uses[]` to **internal chapter references only**:
bare labels that match another block in the same chapter. Ignore cross-paper
references prefixed with a paper directory (`<paper-dir>:<label>`) as well as
external URLs.

## 3. Paper block atomicity and table extraction (`block-density`)

When running `block-density` on a paper folio:

- **R1 — Single-topic formal blocks:** a `definition` defines one object or
  property; a `proposition`, `theorem`, `lemma` or `corollary` states one
  result; a `remark` interprets one statement.
- **R2 — Length exceptions:** the 40-non-blank-line soft limit admits worked
  `example` blocks and long `proof` blocks that genuinely require uninterrupted
  derivation space, provided they address a single result.
- **R3 — Table extraction from formal blocks (STRICT):** tables with more than
  **5 data rows** (excluding header and separator) **must not** be inlined inside
  a `remark`, `proposition`, `theorem`, `definition`, or `example` block.
  Extract the table to a dedicated `table` block (`kind: "table"`, label
  `tbl:<parent-block>-data`), reference it via `uses: ["tbl:..."]` on the parent
  block, and place it in the same section of the chapter manifest.

Run the density audit against the paper directory:

```bash
cd content && python3 pipeline/block-density-audit.py [paper-dir]
```

After splitting a block or extracting a table in a paper folio, run
`content-validation` and `rendering-auditor` (in addition to `content-graph`) to
confirm that every new block triple and its TeX/SVG rendering validate cleanly.
