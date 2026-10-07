/**
 * WHO-IRIS Oxigraph Search Engine MVP
 *
 * Implements combined complex search and structured Dublin Core queries that
 * DSpace's native discovery API cannot do in a single call:
 * - Cross-graph joins (Catalogue hierarchy + Dublin Core metadata + Bitstream access gates)
 * - Multi-field Boolean search (AND / OR across Creator, Subject, Spatial, Year, Community)
 * - Multi-dimensional faceted aggregation
 * - Dynamic lazy-loading of named subgraphs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import oxigraph from 'oxigraph';

export interface ComplexSearchCriteria {
  text?: string;
  creator?: string;
  subject?: string;
  spatial?: string;
  yearFrom?: number;
  yearTo?: number;
  language?: string;
  community?: string;
  collection?: string;
  hasPdf?: boolean;
  copyrightVerdict?: string;
  govdoc?: string;
  isbn?: string;
}

export interface SearchResultItem {
  handle: string;
  title: string;
  creator?: string;
  issued?: string;
  year?: number;
  community?: string;
  collection?: string;
  subjects: string[];
  languages: string[];
  pdfName?: string;
  pdfBytes?: number;
  copyrightGate?: string;
}

export interface FacetResult {
  facet: string;
  value: string;
  count: number;
}

export class IrisOxigraphEngine {
  public store: oxigraph.Store;
  private loadedGraphs: Set<string> = new Set();

  constructor() {
    this.store = new oxigraph.Store();
  }

  /**
   * Load N-Quads (string or file path, compressed or uncompressed) into the store.
   */
  public load(input: string | Buffer, format: string = 'application/n-quads'): void {
    let content: string;
    if (Buffer.isBuffer(input)) {
      content = input.toString('utf8');
    } else if (typeof input === 'string' && fs.existsSync(input)) {
      if (input.endsWith('.gz')) {
        content = zlib.gunzipSync(fs.readFileSync(input)).toString('utf8');
      } else {
        content = fs.readFileSync(input, 'utf8');
      }
    } else {
      content = input;
    }

    this.store.load(content, { format });
  }

  /**
   * Lazily loads an additional named subgraph on-demand into the store.
   */
  public loadSubgraph(graphIri: string, input: string | Buffer): void {
    if (this.loadedGraphs.has(graphIri)) {
      return; // Already mounted
    }
    this.load(input);
    this.loadedGraphs.add(graphIri);
  }

  /**
   * Complex Combined Search across Dublin Core metadata and Catalogue graphs.
   * Solves DSpace's limitation of only supporting single isolated facet lookups.
   */
  public complexSearch(criteria: ComplexSearchCriteria = {}): SearchResultItem[] {
    const filters: string[] = [];

    // Title / Abstract / Description keyword
    if (criteria.text) {
      const escaped = criteria.text.toLowerCase().replace(/"/g, '\\"');
      filters.push(`(CONTAINS(LCASE(?title), "${escaped}") || CONTAINS(LCASE(COALESCE(?abstract, "")), "${escaped}"))`);
    }

    // Creator / Author
    if (criteria.creator) {
      const escaped = criteria.creator.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?creator), "${escaped}")`);
    }

    // Subject / MESH
    if (criteria.subject) {
      const escaped = criteria.subject.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?subject), "${escaped}")`);
    }

    // Spatial location (Geneva, Manila, etc.)
    if (criteria.spatial) {
      const escaped = criteria.spatial.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?spatial), "${escaped}")`);
    }

    // Date range
    if (criteria.yearFrom) {
      filters.push(`(?year >= ${criteria.yearFrom})`);
    }
    if (criteria.yearTo) {
      filters.push(`(?year <= ${criteria.yearTo})`);
    }

    // Language
    if (criteria.language) {
      const escaped = criteria.language.toLowerCase().replace(/"/g, '\\"');
      filters.push(`(LCASE(?langCode) = "${escaped}" || CONTAINS(LCASE(?langLabel), "${escaped}"))`);
    }

    // Community hierarchy
    if (criteria.community) {
      const escaped = criteria.community.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?commName), "${escaped}")`);
    }

    // Collection hierarchy
    if (criteria.collection) {
      const escaped = criteria.collection.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?collName), "${escaped}")`);
    }

    // Bitstream requirements
    if (criteria.hasPdf) {
      filters.push(`BOUND(?pdfName)`);
    }

    // Copyright gate verdict
    if (criteria.copyrightVerdict) {
      const escaped = criteria.copyrightVerdict.toLowerCase().replace(/"/g, '\\"');
      filters.push(`LCASE(?copyrightGate) = "${escaped}"`);
    }

    // Government document identifier
    if (criteria.govdoc) {
      const escaped = criteria.govdoc.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?govdoc), "${escaped}")`);
    }

    // ISBN
    if (criteria.isbn) {
      const escaped = criteria.isbn.toLowerCase().replace(/"/g, '\\"');
      filters.push(`CONTAINS(LCASE(?isbn), "${escaped}")`);
    }

    const filterClause = filters.length > 0 ? `FILTER (${filters.join(' && ')})` : '';

    const query = `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX dspace: <https://iris.who.int/ns/dspace#>
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX dspaceNs: <https://litlfred.github.io/folio-assistant-core/0.1.0/ns/dspace#>

      SELECT DISTINCT ?handle ?title ?creator ?issued ?year ?spatial ?abstract
                      ?commName ?collName ?pdfName ?pdfBytes ?copyrightGate
                      ?govdoc ?isbn
      WHERE {
        # Graph 1: Dublin Core Metadata
        GRAPH <https://iris.who.int/graph/metadata> {
          ?handle dcterms:title ?title .
          
          OPTIONAL {
            ?handle dcterms:creator ?crNode .
            ?crNode rdf:value ?creator .
          }
          OPTIONAL { ?handle dcterms:issued ?issued }
          OPTIONAL { ?handle dcterms:abstract ?abstract }
          OPTIONAL {
            ?handle dcterms:spatial ?spNode .
            ?spNode rdf:value ?spatial .
          }
          OPTIONAL { ?handle <https://litlfred.github.io/folio-assistant-core/0.1.0/ns/dspace#dc.identifier.govdoc> ?govdoc }
          OPTIONAL { ?handle <https://litlfred.github.io/folio-assistant-core/0.1.0/ns/dspace#dc.identifier.isbn> ?isbn }
          
          # Optional for filter evaluation
          OPTIONAL {
            ?handle dcterms:subject ?sNode .
            ?sNode rdf:value ?subject .
          }
          OPTIONAL {
            ?handle dcterms:language ?lNode .
            ?lNode rdf:value ?langLabel .
            OPTIONAL { ?lNode rdf:value ?langCode }
          }
        }

        # Graph 2: Catalogue hierarchy & bitstream access
        OPTIONAL {
          GRAPH <https://iris.who.int/graph/catalogue> {
            OPTIONAL {
              ?handle dspace:inCommunity ?comm .
              ?comm rdfs:label ?commName .
            }
            OPTIONAL {
              ?handle dspace:inCollection ?coll .
              ?coll rdfs:label ?collName .
            }
            OPTIONAL {
              ?handle dspace:hasBitstream ?bs .
              ?bs dspace:mediaType "application/pdf" ;
                  dspace:fileName ?pdfName .
              OPTIONAL { ?bs dspace:fileBytes ?pdfBytes }
              OPTIONAL { ?bs dspace:copyrightGate ?copyrightGate }
            }
          }
        }

        BIND(IF(BOUND(?issued), xsd:integer(SUBSTR(STR(?issued), 1, 4)), 0) AS ?year)

        ${filterClause}
      }
      ORDER BY DESC(?year) ?title
    `;

    const rawRows = this.store.query(query);
    const itemMap = new Map<string, SearchResultItem>();

    for (const row of rawRows) {
      const handle = row.get('handle').value;
      if (!itemMap.has(handle)) {
        const issued = row.get('issued')?.value;
        const yearVal = row.get('year')?.value;
        itemMap.set(handle, {
          handle,
          title: row.get('title').value,
          creator: row.get('creator')?.value,
          issued,
          year: yearVal ? parseInt(yearVal, 10) : undefined,
          spatial: row.get('spatial')?.value,
          community: row.get('commName')?.value,
          collection: row.get('collName')?.value,
          subjects: [],
          languages: [],
          pdfName: row.get('pdfName')?.value,
          pdfBytes: row.get('pdfBytes')?.value ? parseInt(row.get('pdfBytes').value, 10) : undefined,
          copyrightGate: row.get('copyrightGate')?.value
        });
      }
    }

    // Hydrate subjects and languages for matched handles
    const results = Array.from(itemMap.values());
    for (const item of results) {
      this.hydrateItemMetadata(item);
    }

    return results;
  }

  private hydrateItemMetadata(item: SearchResultItem): void {
    const subjQuery = `
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT DISTINCT ?subject WHERE {
        GRAPH <https://iris.who.int/graph/metadata> {
          <${item.handle}> dcterms:subject ?sNode .
          ?sNode rdf:value ?subject .
        }
      }
    `;
    for (const r of this.store.query(subjQuery)) {
      item.subjects.push(r.get('subject').value);
    }

    const langQuery = `
      PREFIX dcterms: <http://purl.org/dc/terms/>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      SELECT DISTINCT ?lang WHERE {
        GRAPH <https://iris.who.int/graph/metadata> {
          <${item.handle}> dcterms:language ?lNode .
          ?lNode rdf:value ?lang .
        }
      }
    `;
    for (const r of this.store.query(langQuery)) {
      item.languages.push(r.get('lang').value);
    }
  }

  /**
   * Faceted Aggregations: Computes counts across multiple dimensions.
   */
  public facetCounts(facetName: 'subject' | 'creator' | 'community' | 'year' | 'type'): FacetResult[] {
    let query = '';

    if (facetName === 'subject') {
      query = `
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?val (COUNT(DISTINCT ?handle) AS ?count) WHERE {
          GRAPH <https://iris.who.int/graph/metadata> {
            ?handle dcterms:subject ?sNode .
            ?sNode rdf:value ?val .
          }
        }
        GROUP BY ?val ORDER BY DESC(?count) ?val
      `;
    } else if (facetName === 'creator') {
      query = `
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?val (COUNT(DISTINCT ?handle) AS ?count) WHERE {
          GRAPH <https://iris.who.int/graph/metadata> {
            ?handle dcterms:creator ?cNode .
            ?cNode rdf:value ?val .
          }
        }
        GROUP BY ?val ORDER BY DESC(?count) ?val
      `;
    } else if (facetName === 'community') {
      query = `
        PREFIX dspace: <https://iris.who.int/ns/dspace#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?val (COUNT(DISTINCT ?handle) AS ?count) WHERE {
          GRAPH <https://iris.who.int/graph/catalogue> {
            ?handle dspace:inCommunity ?comm .
            ?comm rdfs:label ?val .
          }
        }
        GROUP BY ?val ORDER BY DESC(?count) ?val
      `;
    } else if (facetName === 'year') {
      query = `
        PREFIX dcterms: <http://purl.org/dc/terms/>
        SELECT ?val (COUNT(DISTINCT ?handle) AS ?count) WHERE {
          GRAPH <https://iris.who.int/graph/metadata> {
            ?handle dcterms:issued ?issued .
            BIND(SUBSTR(STR(?issued), 1, 4) AS ?val)
          }
        }
        GROUP BY ?val ORDER BY DESC(?val)
      `;
    } else if (facetName === 'type') {
      query = `
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?val (COUNT(DISTINCT ?handle) AS ?count) WHERE {
          GRAPH <https://iris.who.int/graph/metadata> {
            ?handle dcterms:type ?tNode .
            ?tNode rdf:value ?val .
          }
        }
        GROUP BY ?val ORDER BY DESC(?count) ?val
      `;
    }

    const rows = this.store.query(query);
    const results: FacetResult[] = [];
    for (const row of rows) {
      results.push({
        facet: facetName,
        value: row.get('val').value,
        count: parseInt(row.get('count').value, 10)
      });
    }
    return results;
  }
}

// CLI interactive runner
if (import.meta.main) {
  const engine = new IrisOxigraphEngine();
  const defaultNq = path.resolve(import.meta.dir, '..', 'dist', 'oxigraph', 'who-iris-dataset.nq');

  if (!fs.existsSync(defaultNq)) {
    console.error(`Dataset not found at ${defaultNq}. Run build-iris-oxigraph.ts first.`);
    process.exit(1);
  }

  engine.load(defaultNq);
  console.log(`Loaded WHO-IRIS dataset into Oxigraph (${engine.store.size} quads)\n`);

  // Run complex search test
  console.log('=== 1. Combined Complex Search: Subject="Guidelines" AND Community="Western Pacific" ===');
  const res1 = engine.complexSearch({ subject: 'Guidelines', community: 'Western Pacific' });
  console.log(JSON.stringify(res1, null, 2));

  console.log('\n=== 2. Combined Complex Search: Spatial="Geneva" AND Year <= 2000 ===');
  const res2 = engine.complexSearch({ spatial: 'Geneva', yearTo: 2000 });
  console.log(JSON.stringify(res2, null, 2));

  console.log('\n=== 3. Subject Facets (Multi-dimensional count) ===');
  const subjects = engine.facetCounts('subject');
  for (const s of subjects) {
    console.log(`- ${s.value}: ${s.count}`);
  }

  console.log('\n=== 4. Community Facets ===');
  const comms = engine.facetCounts('community');
  for (const c of comms) {
    console.log(`- ${c.value}: ${c.count}`);
  }
}
