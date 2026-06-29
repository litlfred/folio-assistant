---
layout: default
title: Block Density
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/block-density.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/block-density.md) — do not edit here.

{% raw %}
# Block Density — Topic Coherence and Table Extraction Skill

## Purpose

Every content block should be **atomic**: one topic, one concept, one
result.  This skill detects blocks that violate atomicity and proposes
concrete splits.

## When to Use

- "block density" / "block audit" / "topic coherence"
- "split blocks" / "oversized blocks" / "long blocks"
- "extract tables" / "large tables" / "table audit"
- Before a release or after bulk content creation
- When reviewing new or significantly changed content

## Rules

### R1 — Single-topic blocks

A block should address **one** logical unit:
- A definition defines one thing.
- A proposition states one result.
- A remark interprets one statement.

If a block's `.md` content addresses multiple distinct topics (detectable
by keyword analysis showing stronger affinity to a *different* chapter
than its home chapter), it should be split.  The child blocks may belong
in different chapters.

**Example**: A block in `chapter-a/` that spends 3 paragraphs on topic A
and 5 paragraphs on an unrelated topic B should be split: the topic-A
material stays in `chapter-a`, the topic-B material moves to the chapter
and section where topic B is the primary subject.

### R2 — Block length limit

Blocks exceeding **40 non-blank lines** (~2/3 of a printed page) are
candidates for splitting.  This is a soft limit — some blocks (worked
examples, long proofs) legitimately need more space.  But any block
over 40 lines should be reviewed.

### R3 — Table extraction (STRICT)

Tables with more than **5 data rows** (excluding header and separator)
**must not** be inlined in a `remark`, `proposition`, `theorem`,
`definition`, or `example` block.  Instead:

1. Extract the table to a new `table` block with `kind: "table"`.
2. Give it a label like `tbl:<parent-block>-data`.
3. Add an `.md` file containing the table content.
4. Reference the table from the parent block via `uses: ["tbl:..."]`.
5. Add the new table block to the same section in the chapter manifest.

**Rationale**: Large tables break the reading flow of formal statements.
They should be independently labelled and cross-referenceable.

**Exceptions**:
- Index and appendix tables that are inherently tabular — those may
  remain as-is or be converted to `table` blocks.
- Blocks whose `kind` is already `"table"` are exempt.

### R4 — Placement of split children

When splitting a block, each child block should be placed in the chapter
and section where its content **topically belongs**, not necessarily
where the parent lived.  Use the content-graph skill's forward-reference
analysis to find the optimal placement.

## Analysis Script

```bash
cd content && python3 pipeline/block-density-audit.py [paper-dir]
```

The script reports three categories:
1. **Large tables** (HIGH) — tables >5 rows inside non-table blocks
2. **Oversized blocks** (MEDIUM) — blocks >40 non-blank lines
3. **Multi-topic blocks** (LOW) — blocks with stronger keyword affinity
   to a different chapter than their home

## Workflow

1. Run the audit script.
2. Triage findings by severity (HIGH → MEDIUM → LOW).
3. For each HIGH finding (large table), propose a `table` block extraction.
4. For each MEDIUM finding (oversized), review content and propose split
   if multiple topics are present.
5. For each LOW finding (multi-topic), check whether the block should
   move or split.
6. Get user approval before making changes.
7. After changes, re-run the audit to confirm improvement.

## Integration

| After this skill | Use next |
|-----------------|----------|
| Before creating a block | `content-graph` PR1–PR7 — placement checklist |
| Feature branch ready to merge | `/prepare-merge` (slash command) — upstream check + density audit + one-voice |
| Split a block | `content-validation` (check new blocks validate) |
| Move a child block | `content-graph` (check forward refs improved) |
| Extract a table | `content-validation` + `rendering-auditor` |
{% endraw %}
