---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'W3C N-Quads Dataset Packaging & Subgraph Distribution'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/kg/graph-management/nquads-distribution.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/kg/graph-management/nquads-distribution.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/kg/graph-management/nquads-distribution.md){: .fa-edit-source data-fa-link="edit" data-src="cat-harness/skills/kg/graph-management/nquads-distribution.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# W3C N-Quads Dataset Packaging & Subgraph Distribution

This skill governs the compilation, subgraph partitioning, packaging, and distribution of RDF datasets formatted as **W3C N-Quads** (`application/n-quads`) paired with audited, pre-compiled SPARQL 1.1 named queries.

It provides a single source of truth across CLI, MCP tools, and static client-side web applications, enabling sub-second multi-graph query evaluation without running dynamic database servers.

---

## 1. Architectural Principles

### 1.1 W3C N-Quads Standards Conformance
* **Specification**: Conforms strictly to [W3C RDF 1.1 N-Quads](https://www.w3.org/TR/n-quads/) (`w3c-n-quads`).
* **Format**: Line-based statement serialization: `subject predicate object graphLabel? .`
* **Zero Engine Lock-in**: Oxigraph is the execution engine; the data format is strictly vendor-neutral W3C RDF. Any conforming triplestore/quadstore (Jena, Comunica, GraphDB) can consume these files directly.

### 1.2 Upstream Skolemization (Zero Blank Nodes)
* Blank nodes (`_:b0`) clobber each other across distributed documents and cannot be referenced across partitions.
* **Rule**: Every compound node (e.g. Dublin Core qualified statements, MeSH authorities, bean notes) must be deterministically skolemized at intake into a stable URI: `https://<domain>/entity/<id>#<property>_<index>`.
* **Invariant**: The dataset contains zero blank nodes (`_:`).

### 1.3 2-Tier Subgraph Partitioning
To prevent browser V8 heap exhaustion on edge devices, datasets are never delivered as a single monolithic multi-gigabyte dump. They are partitioned into two tiers:
1. **Tier 1: Global Routing Spine** (`<dataset>/spine`):
   * Contains the top-level hierarchy, IDs, titles, primary categories, and access gate verdicts.
   * Target payload: < 50 KB gzipped. Loaded instantly on application bootstrap.
2. **Tier 2: Subgraph Partitions** (`<dataset>/subgraph/<id>`):
   * Contains detailed entity graphs (e.g. full Dublin Core metadata per DSpace community, or historical task audit logs).
   * Loaded additively and on demand when an agent or user accesses that domain.

### 1.4 Partition Size Budget
* **Budget Ceiling**: No partition may exceed **50,000 quads** or **5 MB gzipped** (enforced by `MAX_RECOMMENDED_PARTITION_BYTES` in [`schemas/nquads-distribution.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/nquads-distribution.ts)).
* Protects mobile Safari and Chromium from OOM crashes during WASM decompression.

### 1.5 Git Hygiene: No Binaries in Repo
* Compiled `.nq` and `.nq.gz` files are **never committed to Git**.
* They are generated during CI build or local execution into an ephemeral output directory, and served to GitHub Pages via `mount-instance-docs` through `"served": true`.

---

## 2. Checkable Requirements

| # | Requirement | Why, in one line |
|---|---|---|
| **NQ-1** | **Strict W3C N-Quads Compliance** | Prevents proprietary dialect lock-in; interoperable with any RDF store |
| **NQ-2** | **Zero Blank Nodes via Deterministic Minting** | Blank nodes collide across document boundaries; stable URIs join cleanly |
| **NQ-3** | **Zero Binary Bytes in Quads** | Keeps the graph lightweight; PDFs/images live in static CDN storage |
| **NQ-4** | **Partition Budget Cap (< 5 MB gzipped / 50k quads)** | Prevents V8 heap exhaustion on mobile and edge devices |
| **NQ-5** | **Topology Manifest (`subgraph-manifest.json`)** | Informs clients of partition quad counts, item counts, and relative URLs |
| **NQ-6** | **Pre-compiled Named Queries (`queries.json`)** | Replaces arbitrary runtime queries with audited, injection-proof SPARQL |
| **NQ-7** | **Served via Instance Declaration (`served: true`)** | `mount-instance-docs.ts` publishes files to `_site/` without manual copy steps |
| **NQ-8** | **Single Source of Truth** | CLI, MCP tools, and web browsers consume the exact same `.nq.gz` files |

---

## 3. Concrete Implementations

### Implementation A: WHO-IRIS Library Catalogue
* **Compiler**: `who-iris/scripts/build-iris-oxigraph.ts`
* **Spine Graph**: `<https://iris.who.int/graph/spine>` $\to$ `who-iris-spine.nq.gz` (DSpace communities, collections, handles, titles, copyright gates).
* **Subgraph Partitions**: `<https://iris.who.int/graph/community/{id}>` $\to$ `community_{id}.nq.gz` (Qualified Dublin Core, MeSH descriptors, spatial coverage).
* **Queries**: `search_by_mesh`, `filter_by_community`, `licensed_bitstreams`.
* **Declared Served Directory**: `who-iris/dist/oxigraph/` with `"served": true` in `who-iris.json`.

### Implementation B: Folio Assistant Beans Work Plan
* **Compiler**: `cat-harness/scripts/beans-query.ts`
* **Spine Graph**: `<https://folio-assistant.org/graph/beans>` $\to$ `beans-spine.nq.gz` (all 1,600+ beans with IDs, status, parents, and dependency edges).
* **Subgraph Partitions**: `<https://folio-assistant.org/graph/beans/claims>` $\to$ `claims.nq.gz` (session claims, burndown history, and audit records).
* **Queries**: `safe_drain_candidates`, `actionable_leaves`, `critical_path_blockers`, `rollup_invariant_violations`, `circular_blockers`.
* **Declared Served Directory**: `beans/dist/` with `"served": true` in `beans.json`.
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Package and distribute partitioned W3C N-Quads and named queries](../../processes/nquads-distribution.html)**.

<img src="../../assets/img/workflows/nquads-distribution.svg" alt="BPMN diagram: Package and distribute partitioned W3C N-Quads and named queries" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Package and distribute partitioned W3C N-Quads and named queries](../../processes/nquads-distribution.html) | Extract & Skolemize RDF Dataset; Stream W3C N-Quads into Subgraph Partitions; Report Budget Finding; Refine Subgraph Splitting; Declare Distribution Manifest & Named Queries; Publish Distribution via 'served: true' to Pages |

