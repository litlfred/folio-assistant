---
name: oxigraph-catalogue-search
description: >
  How to compile, partition, distribute via CDN, and query digital library catalogue
  and Qualified Dublin Core metadata using Oxigraph in-memory WebAssembly on the
  static edge. Establishes the 2-tier on-demand loading hierarchy, upstream
  skolemization for zero blank nodes, append-only streaming partition writes, and
  SPARQL 1.1 cross-graph query recipes.
conformsTo:
  - sparql-1.1-query
  - w3c-n-quads
graph-typologies:
  - catalogue
  - skills
---

# Oxigraph Multi-Graph Static Search & Catalog Discovery

This skill defines the generic, platform-level architecture for querying library catalogue hierarchy and Qualified Dublin Core bibliographic metadata statically using **Oxigraph** (in-memory WebAssembly in browsers, and native CLI in Node/Bun on build servers).

It solves the primary limitation of traditional repository discovery APIs (such as DSpace REST): **traditional search endpoints only support isolated keyword lookups or single-facet queries; they cannot perform combined boolean searches across disparate metadata schemes or join bitstream access rights with Dublin Core properties in a single call.**

---

## 1. Architectural Principles

### 1.1 The Binary Asset Invariant
**Binary assets are never stored in the RDF graph.**
- Scanned PDF documents, TIFF/JPEG page images, and archive payloads are **not** represented as base64 literals or RDF data.
- The RDF graph holds strictly lightweight descriptors:
  - Canonical identifier (Handle / DOI)
  - `dspace:fileName`: file name string (e.g. `"report-2024.pdf"`)
  - `dspace:mediaType`: MIME type (e.g. `"application/pdf"`)
  - `dspace:fileBytes`: integer file size in bytes
  - `dspace:copyrightGate`: rights evaluation verdict (`"permitted"`, `"refused"`)
  - `dspace:fixity`: cryptographic checksum algorithm and digest
- All actual binary file downloads resolve against static object storage or CDN routes.

### 1.2 Zero Blank Nodes via Upstream Skolemization
- Merging multiple JSON-LD records into an RDF triplestore causes blank node collisions (`_:b0` in Document A clobbers `_:b0` in Document B).
- **Rule**: All compound resource structures (authors with taxonomy authorities, MeSH subject concepts, bitstream descriptors) must be deterministically skolemized into stable, content-addressed URIs at intake (`https://<domain>/entity/item/{handle_slug}#{property}_{index}`).
- Guarantees zero blank nodes (`_:`) in compiled N-Quads datasets, external referencability, and deterministic git diffs.

### 1.3 Append-Only Streaming Partitions
- Large institutional repositories (e.g., 300,000 items) cannot accumulate uncompressed graphs in memory without exceeding heap limits.
- **Rule**: The compiler must stream quads directly to partition file streams (`spine.nq`, `partition_{id}.nq`) in a single linear pass over the intake records, guaranteeing an O(1) memory bound (< 250 MB heap).

---

## 2. Checkable Architecture Requirements

| # | Requirement | Why, in one line |
|---|---|---|
| **OX-1** | **Upstream Skolemization at the Extractor (Zero-Pass Minting)** (`https://<domain>/entity/item/{handle}#{prop}_{idx}`) | Eliminates blank nodes entirely at extraction; prevents multi-document collisions, enables external addressability, and avoids expensive downstream normalizer passes |
| **OX-2** | **Store zero binary bytes in RDF** | Avoids WASM memory bloat; binaries are served as static files via CDN |
| **OX-3** | **Join across named graphs via explicit `GRAPH` blocks** | Separates archival containment rights from bibliographic description |
| **OX-4** | **Use canonical Handle/DOI URIs as primary subject** (`https://hdl.handle.net/...`) | Guarantees permanent identity resolution outside local server infrastructure |
| **OX-5** | **Treat bitstream rights as access gates** | Allows filtering search results by whether the client is permitted to download the PDF |
| **OX-6** | **Partition subgraphs by administrative community** | Enables sub-second edge loading by only fetching the needed community slice |
| **OX-7** | **Never perform whole-corpus text scans in SPARQL** | SPARQL is graph pattern matching; full text is indexed via static inverted indexes |
| **OX-8** | **Preserve controlled vocabulary authorities** (`dspace:authority`) | Distinguishes controlled MeSH/thesaurus headings from unstructured keyword literals |
| **OX-9** | **Append-only streaming partition emission** | Single-pass streaming directly to tier partition streams (`spine.nq`, `partition_{id}.nq`); guarantees O(1) memory footprint during build at 300,000 scale |

---

## 3. The 2-Tier On-Demand Loading Topology

To achieve instant startup (< 200 ms) in client browsers without downloading the full multi-gigabyte repository graph, metadata is partitioned into two tiers:

```
Distribution Directory:
  ├── who-iris-spine.nq.gz               [Tier 1: Global Routing Spine (< 20 KB)]
  ├── subgraph-manifest.json             [Topology Manifest]
  ├── iris_who_int_graph_community_1.nq.gz [Tier 2: Community 1 Deep Metadata]
  ├── iris_who_int_graph_community_2.nq.gz [Tier 2: Community 2 Deep Metadata]
  └── queries.json                       [Pre-Compiled Query Manifest]
```

### Tier 1: Global Routing Spine
- **Graph IRI**: `<https://<domain>/graph/spine>`
- **Files**: `spine.nq`, `spine.nq.gz`
- **Scope**: Contains the complete containment tree (`Community` &rarr; `Collection` &rarr; `Item`), item handles, title, primary creator, publication year, and bitstream copyright gate verdicts.
- **Role**: Lightweight bootstrap payload (< 20 KB for hundreds of items; ~18–22 MB compressed for 300,000 items). Enables immediate catalog browsing, keyword search in titles, date range filtering, and open-access rights filtering.

### Tier 2: Partitioned Community Subgraphs
- **Graph IRI**: `<https://<domain>/graph/community/{id}>`
- **Files**: `community_{id}.nq.gz`
- **Scope**: Contains deep Qualified Dublin Core metadata: taxonomy authorities (`dcterms:subject`, `dspace:authority`), abstracts (`dcterms:abstract`), spatial coverage (`dcterms:spatial`), official government document identifiers, and ISBNs.
- **Role**: Lazily downloaded and mounted additively into the WASM store only when a user navigates to a community, activates cross-community facet filtering, or queries deep metadata fields.

### Topology Manifest (`subgraph-manifest.json`)
The manifest catalogues all available partitions:
```json
{
  "version": "1.0.0",
  "generatedAt": "2026-10-07T19:07:39Z",
  "tiers": {
    "tier1_spine": {
      "iri": "https://<domain>/graph/spine",
      "fileNq": "spine.nq",
      "fileGz": "spine.nq.gz",
      "quadCount": 89,
      "itemCount": 3
    },
    "tier2_communities": {
      "partitions": {
        "comm-hq": {
          "id": "comm-hq",
          "name": "Headquarters",
          "iri": "https://<domain>/graph/community/comm-hq",
          "fileGz": "community_comm-hq.nq.gz",
          "quadCount": 99,
          "itemCount": 2
        }
      }
    }
  }
}
```

---

## 4. SPARQL 1.1 Query Recipes

### Recipe 1: Complex Multi-Condition Search
Find items in a specific community published after a given year, matching a subject, having a bitstream permitted for download:

```sparql
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dspace: <https://<domain>/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?handle ?title ?creator ?issued ?pdfName WHERE {
  # 1. Join Spine (Catalogue & Access Clearance)
  GRAPH <https://<domain>/graph/spine> {
    ?handle a dspace:Item ;
            dcterms:title ?title ;
            dspace:inCommunity ?comm ;
            dspace:hasBitstream ?bs .
    ?comm rdfs:label ?commLabel .
    ?bs dspace:mediaType "application/pdf" ;
        dspace:fileName ?pdfName ;
        dspace:copyrightGate "permitted" .
    OPTIONAL { ?handle dcterms:creator ?creator }
    OPTIONAL { ?handle dcterms:issued ?issued }
  }

  # 2. Join Mounted Community Detailed Metadata
  GRAPH ?communityGraph {
    ?handle dcterms:subject ?sNode .
    ?sNode rdf:value ?subject .
  }
  FILTER (STRSTARTS(STR(?communityGraph), "https://<domain>/graph/community/"))

  BIND(IF(BOUND(?issued), xsd:integer(SUBSTR(STR(?issued), 1, 4)), 0) AS ?year)
  FILTER (
    CONTAINS(LCASE(?subject), "guidelines") &&
    CONTAINS(LCASE(?commLabel), "headquarters") &&
    (?year >= 2000)
  )
}
ORDER BY DESC(?year)
```

---

## 5. Client-Side WASM Execution Pattern

In modern edge/browser static web applications:

```typescript
import oxigraph from 'oxigraph';
import pako from 'pako';

// 1. Instantiate in-memory store
const store = new oxigraph.Store();

// 2. Parallel bootstrap: fetch Tier 1 Spine and Topology Manifest
const [spineResp, manifestResp] = await Promise.all([
  fetch('/dist/oxigraph/spine.nq.gz'),
  fetch('/dist/oxigraph/subgraph-manifest.json')
]);

const spineBuffer = await spineResp.arrayBuffer();
const spineNquads = new TextDecoder().decode(pako.ungzip(spineBuffer));
const manifest = await manifestResp.json();

// 3. Load Tier 1 Spine (< 20 KB)
store.load(spineNquads, { format: 'application/n-quads' });

// 4. Lazily mount community partition on demand
async function mountCommunity(commId: string) {
  const partition = manifest.tiers.tier2_communities.partitions[commId];
  if (!partition) return;

  const commResp = await fetch(`/dist/oxigraph/${partition.fileGz}`);
  const commBuffer = await commResp.arrayBuffer();
  const commText = new TextDecoder().decode(pako.ungzip(commBuffer));

  // Additive mounting into existing store without clobbering
  store.load(commText, { format: 'application/n-quads' });
}

// 5. Execute prepared SPARQL query locally in < 5ms
const results = store.query(sparqlQuery);
for (const row of results) {
  console.log(row.get('title').value);
}
```
