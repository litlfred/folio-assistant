---
name: chapter-complexity-review
roles: [reader, collaborator, owner]
description: >
  Analyse a chapter's internal dependency graph to find backward edges
  (blocks that reference something defined later), compute graph energy,
  and suggest section/block reorderings that minimise complexity.
  Uses Graphviz for visualisation and brute-force permutation search
  for optimal section ordering.
allowed-tools: Read Edit Write Bash Grep Glob Agent
---

# Chapter Complexity Review

## Overview

This skill analyses the **dependency graph energy** of a chapter's content
blocks.  A backward edge occurs when block A `uses` block B, but B appears
*after* A in the manifest ordering — the reader encounters a forward
reference to something not yet defined.

**Energy** = Σ |position(user) − position(dependency)| over all internal
edges.  Lower energy means tighter, more local dependencies.

The skill finds the section ordering (and block-level tweaks) that
minimises backward edges, then optionally applies the changes.

## Severity: logical vs storytelling backward edges (STRICT)

**Not all backward edges are equal.** The same logical-vs-storytelling
distinction that governs cross-chapter forward references applies
intra-chapter:

- A **logical / expository backward edge** is a genuine defect: the
  source block *builds its argument on* the later block — the reader
  cannot follow the exposition in order. This happens iff **both** the
  source and the target carry logical content
  (`definition`/`proposition`/`theorem`/`lemma`/`corollary`/`proof`/
  `conjecture`) AND the edge is a real `uses[]` reliance.
- A **storytelling backward edge** imposes no logical burden: the
  source is narrative (`prose`/`remark`/`example`/`simulator`/
  `equation`/`diagram`/`table`), or it merely *mentions* / *motivates*
  / *interprets* the later block. A remark that foreshadows a later
  result loses the reader nothing. **Benign — do not count as energy.**

When computing energy, **weight logical backward edges heavily and
storytelling backward edges at zero (or near-zero)**. Reordering to
chase a storytelling backward edge churns the manifest for no
expository gain, and can *worsen* a logical edge. Maintain a single
authoritative classifier for the source/target-kind sets
(`LOGICAL_SRC`, `LOGICAL_TGT`, `NARRATIVE_SRC`) and reuse it rather
than re-deriving the kind lists here.

The headline metric is the **logical backward-edge count**, not the
raw backward-edge count. Storytelling and structural (appendix /
framing-chapter) edges are reported for awareness but never gate a
reordering.

## When to Use This Skill

- "review chapter N complexity"
- "optimise chapter ordering"
- "find backward edges in chapter 3"
- "dependency graph energy"
- "reorder sections to reduce forward references"
- "chapter complexity review"

## Prerequisites

- The chapter manifest `.ts` exists with `sections → blocks` structure
- Content block `.ts` files have `label` and `uses` fields
- `graphviz` is available (installed automatically if missing)
- Python 3 available

## Workflow

### 1. Parse the chapter manifest

Read the chapter manifest `.ts` file to extract:
- Section ordering (title, label, blocks[])
- For each block `.ts` file: label and uses[] array

Filter `uses[]` to **internal references only** — bare labels that match
other blocks in the same chapter.  Ignore cross-paper refs (containing
`:` prefix like `paper-dir:label` or URLs).

### 2. Compute current energy

Flatten sections into a single ordered list.  For each block, compute:
- Forward edges: block uses something defined earlier (good)
- Backward edges: block uses something defined later — classify each by
  severity (see §Severity above): **logical** (the real defect) vs
  **storytelling** (benign, weight ≈ 0)
- Total energy: sum of absolute position differences over **logical**
  backward edges (storytelling edges reported separately, not summed)

Report:
```
Energy (logical edges only): <total>
Forward edges: <count>
Backward edges: <count> total — <L> logical / <S> storytelling

Logical backward edges (block → dependency, span):
  <block> → <dep>  span=<N>

Storytelling backward edges (info-only, not gated):
  <block> → <dep>  span=<N>
```

### 3. Find optimal section ordering

Hold the first 2 sections (foundations) and last 2 sections (capstone)
fixed.  Brute-force all permutations of the middle sections
(typically 8! = 40,320 — runs in seconds).

For each permutation, compute backward edge count, then energy as
tiebreaker.  Report the best ordering.

If there are more than 10 middle sections, use topological sort with
max-dependents-first heuristic instead of brute force.

### 4. Block-level fixes

After finding the optimal section ordering, scan for remaining backward
edges and suggest:

| Type | Fix |
|------|-----|
| Intra-section backward edge | Swap the two blocks within the section |
| Small-span cross-section (≤3) | Accept — adjacent section refs are natural |
| Large-span cross-section | Suggest moving the target block to an earlier section, or accept if the block is architecturally bound |

### 5. Generate Graphviz visualisation

Generate two DOT files and render to SVG:

1. **Section-level graph** — nodes are sections, red edges are backward
   cross-section dependencies, gray edges are forward dependencies.
   Shows edge count and total span on each edge.

2. **Block-level backward edges** — only blocks involved in backward
   edges, grouped by section in subgraph clusters.  Red edges with
   span labels.

Output files:
- `/tmp/<chapter>_section_deps.svg`
- `/tmp/<chapter>_blocks_backward.svg`

### 6. Apply changes (if requested)

Rewrite the chapter manifest `.ts` with:
- Sections in the optimal order
- Block-level swaps within sections
- Comments explaining why sections were reordered

Preserve all section metadata (title, label) and block lists.

### 7. Verify

Re-run the energy computation on the modified manifest to confirm:
- Backward edge count decreased
- No blocks were lost or duplicated
- The ordering is now optimal (brute-force confirms identity permutation)

## Section dependency analysis

Build a section-level adjacency matrix:
```
Section → depends on sections {S1, S3, ...}
  Forward deps (dep section comes before): normal
  Backward deps (dep section comes after): ⚠️
```

This quickly reveals which section moves will have the most impact.

## Interpreting results

Assess on the **logical** backward-edge count (storytelling edges are
benign and excluded — see §Severity):

| Logical backward edges | Assessment |
|------------------------|------------|
| 0 | Perfect — fully topological order |
| 1–4 | Good — remaining edges are likely architectural |
| 5–10 | Moderate — section reordering likely helps |
| 10+ | High complexity — major restructuring needed |

A chapter with many *storytelling* backward edges but zero *logical*
ones is healthy: it is well-connected narratively (remarks foreshadow,
examples point ahead) without imposing any out-of-order logical burden.
Do not reorder to suppress storytelling edges.

Irreducible backward edges typically fall into these categories:
- **Architectural cross-cut**: A section references a remark in a
  conceptually-paired section (or vice versa).  These are architectural
  and should be accepted.
- **Circular conceptual deps**: Two sections genuinely need each other.
  Consider extracting shared definitions into a "Preliminaries" section.
- **Span-1 adjacent**: A block references the very next section.  Trivial.

## Python implementation

The core algorithm is a standalone Python script that:
1. Parses `.ts` manifests with regex (no Node.js dependency)
2. Builds adjacency lists from `uses[]` fields
3. Computes energy via position lookup
4. Tries all section permutations (middle sections only)
5. Generates DOT files and renders via `graphviz`

Key functions:
- `parse_manifest(path)` → sections[], block_data{} (capture each
  block's `kind` so backward edges can be severity-classified)
- `compute_energy(ordering, block_data)` → (energy, backward[], forward[])
  where `energy` sums **logical** backward edges only
- `classify_edge(src_kind, tgt_kind, is_uses)` → "logical" | "storytelling"
  (reuse the shared `LOGICAL_SRC` / `LOGICAL_TGT` / `NARRATIVE_SRC` sets)
- `optimize_sections(sections, block_data)` → best_order[] (minimise
  logical backward-edge count first, energy as tiebreaker)
- `generate_dot(ordering, block_data, filename)` → svg_path (render
  logical edges solid-red, storytelling edges dashed-gray)
