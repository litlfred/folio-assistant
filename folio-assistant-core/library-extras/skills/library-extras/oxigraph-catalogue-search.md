---
name: oxigraph-catalogue-search
description: >
  How to compile, partition, distribute via CDN, and query digital library catalogue
  and Qualified Dublin Core metadata using Oxigraph in-memory WebAssembly on the
  static edge. Establishes the 2-tier on-demand loading hierarchy, upstream
  skolemization for zero blank nodes, append-only streaming partition writes, and
  SPARQL 1.1 cross-graph query recipes.
conformsTo:
  - dcmi-terms
  - w3c-rdf
graph-typologies:
  - catalogue
  - skills
---

# Oxigraph Multi-Graph Static Search & Catalog Discovery

This skill defines how to query a library catalogue hierarchy and its
Qualified Dublin Core metadata statically with **Oxigraph** (in-memory
WebAssembly in browsers, native CLI in Node/Bun on build servers). Unlike a
repository search API such as DSpace REST, which answers one keyword or one
facet at a time, SPARQL over the compiled graph can combine conditions across
metadata schemes and join bitstream access rights with Dublin Core properties
in one query.

---

## 1. Architectural Principles

### 1.1 The Binary Asset Invariant
**Binary assets are never stored in the RDF graph.** PDFs, page images and
archive payloads are served from static object storage or CDN routes. The graph
holds only descriptors:
  - Canonical identifier (Handle / DOI)
  - `dspace:fileName`: file name string (e.g. `"report-2024.pdf"`)
  - `dspace:mediaType`: MIME type (e.g. `"application/pdf"`)
  - `dspace:fileBytes`: integer file size in bytes
  - `dspace:copyrightGate`: rights evaluation verdict (`"permitted"`, `"refused"`)
  - `dspace:fixity`: cryptographic checksum algorithm and digest

### 1.2 Zero Blank Nodes via Upstream Skolemization
**Rule**: every compound structure (authors with taxonomy authorities, MeSH
subject concepts, bitstream descriptors) is skolemized at intake into a stable,
content-addressed URI
(`https://<domain>/entity/item/{handle_slug}#{property}_{index}`). Compiled
N-Quads contain no `_:` blank nodes, so merged records cannot collide (`_:b0`
in one record clobbering `_:b0` in another) and git diffs are deterministic.

### 1.3 Append-Only Streaming Partitions
**Rule**: the compiler streams quads straight to the partition files
(`spine.nq`, `community_{id}.nq`) in one linear pass over the intake records,
keeping memory bounded (< 250 MB heap) at 300,000-item scale.

---

## 2. Checkable Architecture Requirements

| # | Requirement | Why, in one line |
|---|---|---|
| **OX-1** | **Skolemize at the extractor** (§1.2) | No blank-node collisions; every node externally addressable; no downstream normalizer pass |
| **OX-2** | **Store zero binary bytes in RDF** (§1.1) | Keeps the WASM store small |
| **OX-3** | **Join across named graphs via explicit `GRAPH` blocks** | Separates archival containment rights from bibliographic description |
| **OX-4** | **Use canonical Handle/DOI URIs as primary subject** (`https://hdl.handle.net/...`) | Identity resolves outside local infrastructure |
| **OX-5** | **Treat bitstream rights as access gates** | Results can be filtered by whether the client may download the PDF |
| **OX-6** | **Partition subgraphs by administrative community** | The edge loads only the community slice it needs |
| **OX-7** | **Never perform whole-corpus text scans in SPARQL** | Full text is indexed via static inverted indexes |
| **OX-8** | **Preserve controlled vocabulary authorities** (`dspace:authority`) | Distinguishes controlled MeSH/thesaurus headings from free keywords |
| **OX-9** | **Append-only streaming partition emission** (§1.3) | Bounded build memory at 300,000 scale |

---

## 3. The 2-Tier On-Demand Loading Topology

So a browser starts in < 200 ms without downloading the whole graph, metadata is partitioned into two tiers:

```
Distribution Directory:
  ├── spine.nq.gz                 [Tier 1: Global Routing Spine]
  ├── subgraph-manifest.json      [Topology Manifest]
  ├── community_{id}.nq.gz        [Tier 2: one per community]
  └── queries.json                [Pre-Compiled Query Manifest]
```

### Tier 1: Global Routing Spine
- **Graph IRI**: `<https://<domain>/graph/spine>`
- **Files**: `spine.nq`, `spine.nq.gz`
- **Scope**: Contains the complete containment tree (`Community` &rarr; `Collection` &rarr; `Item`), item handles, title, primary creator, publication year, and bitstream copyright gate verdicts.
- **Role**: Bootstrap payload (< 20 KB for hundreds of items; ~18–22 MB compressed for 300,000). Enough for catalogue browsing, title keyword search, date-range filtering and open-access filtering.

### Tier 2: Partitioned Community Subgraphs
- **Graph IRI**: `<https://<domain>/graph/community/{id}>`
- **Files**: `community_{id}.nq.gz`
- **Scope**: Contains deep Qualified Dublin Core metadata: taxonomy authorities (`dcterms:subject`, `dspace:authority`), abstracts (`dcterms:abstract`), spatial coverage (`dcterms:spatial`), official government document identifiers, and ISBNs.
- **Role**: Downloaded and mounted additively into the WASM store only when a user opens a community, filters across communities, or queries deep metadata fields.

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
