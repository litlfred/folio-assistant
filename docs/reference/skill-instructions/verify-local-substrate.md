---
layout: default
title: Verify Anchor Connectivity
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/verify-local-substrate.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/verify-local-substrate.md) — do not edit here.

{% raw %}
# Verify Anchor Connectivity

## Overview

This skill checks a key structural invariant of the paper: **every
result block of a designated class must trace back to a designated
anchor definition** through the `uses[]` dependency DAG. The anchor is
typically the bridge definition between the project's foundational layer
and its downstream predictions. A result block that does not connect to
the anchor is either:

1. Missing dependency declarations in its `uses[]` array, or
2. Genuinely independent of the anchor (rare — flag for review).

Configure two things per project: the **anchor label** (the definition
every claim must reach) and the **result class** (which block kinds /
tags are required to connect).

## Scope

The verification covers the configured result class, for example:

| Block kinds checked | Where to look |
|--------------------|---------------|
| `proposition`, `conjecture` | the results chapters |
| `remark` with a configured observational tag | all chapters |
| `definition` with a configured tag | wherever introduced |

## Algorithm

### Step 1: Collect result blocks

Scan all `.ts` manifest files under the paper directory for blocks
matching the configured class — provable blocks in the results chapters,
or any block whose `tags` include a configured tag.

### Step 2: Trace each block's dependency chain

For each result block, do a breadth-first traversal of `uses[]`,
resolving labels to `.ts` files and reading their `uses[]` in turn.
Stop when:

- the anchor label is found → **CONNECTED**;
- a leaf (empty `uses[]` or already-visited node) is reached without
  finding the anchor → continue to the next branch;
- all branches exhausted → **GAP**.

Set a maximum traversal depth a couple hops beyond the deepest known
chain.

### Step 3: Classify results

| Status | Meaning | Action |
|--------|---------|--------|
| CONNECTED | traces to the anchor | none |
| GAP | no path found | add a missing `uses[]` entry or flag for review |
| ISOLATED | empty `uses[]` on a result block | add dependencies |

### Step 4: Report

Output a table:

```
| Block label | Kind | Status | Shortest path | Action needed |
```

For GAPs, suggest which intermediate block should be added to `uses[]`
to restore connectivity. Common fix patterns: a result about
external/measured data → add the anchor directly; a result about a
derived quantity → add the relevant intermediate definition; a
conjecture about structure → check whether a known foundational
definition provides the link.

## Known dependency chains

Maintain, per project, a table of the verified paths from key result
blocks to the anchor (direct 1-hop connections and the longer indirect
chains). This serves as the regression baseline: a path that was
CONNECTED and becomes a GAP signals a dropped `uses[]` edge. Record the
anchor's own upstream chain to the foundational axioms too, so the
anchor itself is grounded.

## Tabulated-data connectivity

Data tables (formula tables, periodic/summary tables) are result blocks
too — they tabulate predicted quantities derived through the anchor.
Every such table must trace to the anchor. Record the known table blocks
and their connection paths in the same baseline table.

## Checklist

- [ ] All provable blocks of the result class trace to the anchor
- [ ] All blocks carrying a configured result tag trace to the anchor
- [ ] No result block has an empty `uses[]` array
- [ ] The report table is complete with a shortest path for each block
- [ ] GAPs have suggested fixes with specific `uses[]` entries to add
{% endraw %}
