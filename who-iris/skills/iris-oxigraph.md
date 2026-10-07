---
name: iris-oxigraph
description: >
  How to compile, validate, distribute, and query WHO IRIS catalogue and Qualified
  Dublin Core metadata using Oxigraph in-memory WebAssembly and CLI pipelines.
  Enables combined complex queries, multi-dimensional faceted rollups, and lazy-loaded
  named subgraphs on the static edge.
conformsTo:
  - sparql-1.1-query
  - w3c-n-quads
graph-typologies:
  - catalogue
  - skills
---

# Oxigraph Multi-Graph Search & Discovery for WHO IRIS

This skill defines how to use **Oxigraph** (in-memory WASM on the client, and native in Bun/Node on the build server) to query WHO IRIS knowledge graphs statically.

It solves the primary limitation of the public DSpace Discovery API: **DSpace only supports isolated keyword searches or distinct single-facet queries; it cannot perform combined boolean searches across disparate metadata schemes or join bitstream access rights with Dublin Core properties.**

---

## 1. Multi-Graph Architecture

The WHO IRIS RDF model is partitioned across distinct **named graphs** within a single N-Quads dataset:

| Graph IRI | Purpose | Typologies / Schemas |
| :--- | :--- | :--- |
| `<https://iris.who.int/graph/catalogue>` | Communities, collections, item hierarchy, and bitstream access gates | `dspace:Community`, `dspace:Collection`, `dspace:Item`, `dspace:Bitstream` |
| `<https://iris.who.int/graph/metadata>` | Full Qualified Dublin Core bibliographic metadata | `dcterms:`, `dc:`, MeSH Authorities |
| `<https://iris.who.int/graph/community/{id}>` | Subgraph partition per regional office / community | Slice of `metadata` for lazy loading |

### The Binary Asset Invariant
**Binary assets are never stored in the graph.** 
- PDF documents, JPEG/PNG cover captures, and asset archives are **not** represented as base64 literals or RDF data.
- The graph stores strictly:
  - `dspace:fileName`: file name string (e.g., `"WPR-RDO-2020-003-eng.pdf"`)
  - `dspace:mediaType`: MIME type (e.g., `"application/pdf"`)
  - `dspace:fileBytes`: integer file size in bytes
  - `dspace:copyrightGate`: rights evaluation verdict (`"permitted"`, `"refused"`)
- All actual binary file downloads are resolved against the static CDN asset route.

---

## 2. Checkable Requirements

| # | Requirement | Why, in one line |
|---|---|---|
| **OX-1** | **Skolemize anonymous compound nodes into deterministic URIs** (`https://iris.who.int/entity/item/{handle}#{prop}_{idx}`) | Eliminates blank nodes entirely; prevents cross-document collisions and enables direct external URI addressability |
| **OX-2** | **Store zero binary bytes in RDF** | Avoids WASM memory bloat; binaries are served as static files via CDN |
| **OX-3** | **Join across named graphs via explicit `GRAPH` blocks** | Separates archival containment rights from bibliographic description |
| **OX-4** | **Use canonical Handle URIs as primary subject** (`https://hdl.handle.net/...`) | Guarantees permanent identity resolution outside local server infrastructure |
| **OX-5** | **Treat bitstream rights as access gates** | Allows filtering search results by whether the client is permitted to download the PDF |
| **OX-6** | **Partition subgraphs by administrative community** | Enables sub-second edge loading by only fetching the needed community slice |
| **OX-7** | **Never perform whole-corpus text scans in SPARQL** | SPARQL is graph pattern matching; full text is indexed via static inverted indexes |
| **OX-8** | **Preserve controlled vocabulary authorities** (`dspace:authority`) | Distinguishes controlled MeSH headings from unstructured keyword literals |

---

## 3. SPARQL Query Recipes

### Recipe 1: Complex Multi-Condition Search (DSpace API Impossible)
*Problem:* Find all items published in the **Western Pacific** region after year **2000**, with subject **"Guidelines"**, having a **PDF bitstream** that is **cleared for open access** (`copyrightGate = 'permitted'`).

```sparql
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dspace: <https://iris.who.int/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?handle ?title ?creator ?issued ?pdfName WHERE {
  # 1. Join Dublin Core Metadata
  GRAPH <https://iris.who.int/graph/metadata> {
    ?handle dcterms:title ?title ;
            dcterms:creator ?crNode ;
            dcterms:subject ?sNode .
    ?crNode rdf:value ?creator .
    ?sNode rdf:value ?subject .
    OPTIONAL { ?handle dcterms:issued ?issued }
  }

  # 2. Join Catalogue Hierarchy & Access Gates
  GRAPH <https://iris.who.int/graph/catalogue> {
    ?handle dspace:inCommunity ?comm ;
            dspace:hasBitstream ?bs .
    ?comm rdfs:label ?commLabel .
    ?bs dspace:mediaType "application/pdf" ;
        dspace:fileName ?pdfName ;
        dspace:copyrightGate "permitted" .
  }

  # 3. Multi-Field Filter Evaluation
  BIND(IF(BOUND(?issued), xsd:integer(SUBSTR(STR(?issued), 1, 4)), 0) AS ?year)
  FILTER (
    CONTAINS(LCASE(?subject), "guidelines") &&
    CONTAINS(LCASE(?commLabel), "western pacific") &&
    (?year >= 2000)
  )
}
ORDER BY DESC(?year)
```

---

### Recipe 2: Multi-Dimensional Facet Rollup
*Problem:* Compute real-time distribution counts across all MeSH subject terms and their authoritative terminology systems.

```sparql
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dspaceNs: <https://litlfred.github.io/folio-assistant-core/0.1.0/ns/dspace#>

SELECT ?subject (COUNT(DISTINCT ?handle) AS ?itemCount) ?authority WHERE {
  GRAPH <https://iris.who.int/graph/metadata> {
    ?handle dcterms:subject ?sNode .
    ?sNode rdf:value ?subject .
    OPTIONAL { ?sNode dspaceNs:authority ?authority }
  }
}
GROUP BY ?subject ?authority
ORDER BY DESC(?itemCount) ?subject
```

---

## 4. Client-Side WASM Execution Pattern

In a static browser environment, Oxigraph runs completely inside WebAssembly:

```typescript
import oxigraph from 'oxigraph';

// 1. Initialize empty in-memory store
const store = new oxigraph.Store();

// 2. Fetch compressed catalogue graph from CDN
const resp = await fetch('/who-iris/dist/oxigraph/iris_who_int_graph_catalogue.nq.gz');
const buffer = await resp.arrayBuffer();
const nquadsText = new TextDecoder().decode(pako.ungzip(buffer));

// 3. Load catalogue quads
store.load(nquadsText, { format: 'application/n-quads' });

// 4. Lazily fetch and mount a specific community when selected by user
async function mountCommunity(commId: string) {
  const commResp = await fetch(`/who-iris/dist/oxigraph/iris_who_int_graph_community_${commId}.nq.gz`);
  const commText = new TextDecoder().decode(pako.ungzip(await commResp.arrayBuffer()));
  
  // Appends new named graph to store without clobbering existing quads
  store.load(commText, { format: 'application/n-quads' });
}

// 5. Execute prepared query
const results = store.query(myPreparedQuery);
for (const binding of results) {
  console.log(binding.get('title').value);
}
```
