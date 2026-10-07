/**
 * Build script for WHO-IRIS Oxigraph Multi-Graph Dataset
 *
 * Ingests:
 * 1. catalogue/nodes/ (Communities, Collections, Items, Bitstreams, Gates)
 * 2. site/dublin-core/ (Qualified Dublin Core JSON-LD records)
 *
 * Emits:
 * 1. Multi-graph N-Quads (.nq) with partitioned named graphs
 * 2. Prepared queries manifest (queries.json) for client-side execution
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import jsonld from 'jsonld';

const WHO_IRIS_ROOT = path.resolve(import.meta.dir, '..');
const NODES_DIR = path.join(WHO_IRIS_ROOT, 'catalogue', 'nodes');
const DC_DIR = path.join(WHO_IRIS_ROOT, 'site', 'dublin-core');
const DIST_DIR = path.join(WHO_IRIS_ROOT, 'dist', 'oxigraph');

export const GRAPH_IRIS_CATALOGUE = 'https://iris.who.int/graph/catalogue';
export const GRAPH_IRIS_METADATA = 'https://iris.who.int/graph/metadata';
export const GRAPH_PREFIX_COMMUNITY = 'https://iris.who.int/graph/community/';

export interface BuildResult {
  totalQuads: number;
  metadataQuads: number;
  catalogueQuads: number;
  skolemizedCount: number;
  outputNqPath: string;
  outputGzPath: string;
  queriesJsonPath: string;
  subgraphs: Record<string, number>;
}

/**
 * Solution A: Skolemization (Mint Deterministic, Content-Addressed URIs)
 *
 * Traverses JSON-LD objects before RDF conversion and assigns globally unique,
 * deterministic URIs to all anonymous compound nodes (creators, subjects, dates,
 * spatial, language, types) based on the parent item handle and property path.
 *
 * URI format: https://iris.who.int/entity/item/{handle_slug}#{property}_{index}
 */
export function skolemizeJsonLd(node: any, handleClean: string, prefix = 'entity'): any {
  if (Array.isArray(node)) {
    return node.map((item, idx) => {
      if (item && typeof item === 'object' && !item['@id'] && !item['@value']) {
        const mintedId = `https://iris.who.int/entity/item/${handleClean}#${prefix}_${idx + 1}`;
        return skolemizeJsonLd(
          { '@id': mintedId, ...item },
          handleClean,
          `${prefix}_${idx + 1}`
        );
      }
      return skolemizeJsonLd(item, handleClean, `${prefix}_${idx + 1}`);
    });
  } else if (node && typeof node === 'object') {
    const res: Record<string, any> = {};
    for (const [key, val] of Object.entries(node)) {
      if (key === '@context') {
        res[key] = val;
        continue;
      }
      const propClean = key.replace(/^.*[:#]/, '').replace(/[^a-zA-Z0-9]/g, '_');
      res[key] = skolemizeJsonLd(val, handleClean, propClean);
    }
    return res;
  }
  return node;
}

export async function buildIrisDataset(outDir: string = DIST_DIR): Promise<BuildResult> {
  fs.mkdirSync(outDir, { recursive: true });

  const subgraphQuads: Record<string, string[]> = {
    [GRAPH_IRIS_CATALOGUE]: [],
    [GRAPH_IRIS_METADATA]: [],
  };

  // Map item handle -> community ID for subgraph partitioning
  const handleToCommunity: Record<string, string> = {};

  // 1. Process catalogue nodes
  const nodeFiles = fs.readdirSync(NODES_DIR).filter(f => f.endsWith('.json'));
  for (const f of nodeFiles) {
    const node = JSON.parse(fs.readFileSync(path.join(NODES_DIR, f), 'utf8'));

    if (node.kind === 'container' && node.id.startsWith('community/')) {
      const commUri = `<https://iris.who.int/${node.id}>`;
      subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
        `${commUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Community> <${GRAPH_IRIS_CATALOGUE}> .`,
        `${commUri} <http://www.w3.org/2000/01/rdf-schema#label> ${JSON.stringify(node.title)} <${GRAPH_IRIS_CATALOGUE}> .`,
        `${commUri} <https://iris.who.int/ns/dspace#communityId> ${JSON.stringify(node.id)} <${GRAPH_IRIS_CATALOGUE}> .`
      );
    } else if (node.kind === 'container' && node.id.startsWith('collection/')) {
      const collUri = `<https://iris.who.int/${node.id}>`;
      subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
        `${collUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Collection> <${GRAPH_IRIS_CATALOGUE}> .`,
        `${collUri} <http://www.w3.org/2000/01/rdf-schema#label> ${JSON.stringify(node.title)} <${GRAPH_IRIS_CATALOGUE}> .`,
        `${collUri} <https://iris.who.int/ns/dspace#collectionId> ${JSON.stringify(node.id)} <${GRAPH_IRIS_CATALOGUE}> .`
      );
      if (node.parents && node.parents[0]) {
        const parentComm = node.parents[0].find((p: string) => p.startsWith('community/'));
        if (parentComm) {
          subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
            `${collUri} <https://iris.who.int/ns/dspace#parentCommunity> <https://iris.who.int/${parentComm}> <${GRAPH_IRIS_CATALOGUE}> .`
          );
        }
      }
    } else if (node.kind === 'item' && node.handle) {
      const handleUri = `<https://hdl.handle.net/${node.handle}>`;
      subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
        `${handleUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Item> <${GRAPH_IRIS_CATALOGUE}> .`,
        `${handleUri} <https://iris.who.int/ns/dspace#handle> ${JSON.stringify(node.handle)} <${GRAPH_IRIS_CATALOGUE}> .`
      );

      if (node.parents && node.parents[0]) {
        for (const p of node.parents[0]) {
          if (p.startsWith('collection/')) {
            subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
              `${handleUri} <https://iris.who.int/ns/dspace#inCollection> <https://iris.who.int/${p}> <${GRAPH_IRIS_CATALOGUE}> .`
            );
          }
          if (p.startsWith('community/')) {
            subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
              `${handleUri} <https://iris.who.int/ns/dspace#inCommunity> <https://iris.who.int/${p}> <${GRAPH_IRIS_CATALOGUE}> .`
            );
            handleToCommunity[node.handle] = p.replace('community/', '');
          }
        }
      }

      if (Array.isArray(node.bitstreams)) {
        for (const b of node.bitstreams) {
          const bsId = b.fixity?.digest || b.name;
          const bsUri = `<https://iris.who.int/bitstream/${bsId}>`;
          subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
            `${handleUri} <https://iris.who.int/ns/dspace#hasBitstream> ${bsUri} <${GRAPH_IRIS_CATALOGUE}> .`,
            `${bsUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Bitstream> <${GRAPH_IRIS_CATALOGUE}> .`,
            `${bsUri} <https://iris.who.int/ns/dspace#fileName> ${JSON.stringify(b.name)} <${GRAPH_IRIS_CATALOGUE}> .`,
            `${bsUri} <https://iris.who.int/ns/dspace#mediaType> ${JSON.stringify(b.mediaType || 'application/octet-stream')} <${GRAPH_IRIS_CATALOGUE}> .`,
            `${bsUri} <https://iris.who.int/ns/dspace#fileBytes> "${b.bytes}"^^<http://www.w3.org/2001/XMLSchema#integer> <${GRAPH_IRIS_CATALOGUE}> .`
          );

          if (b.materialization?.gates?.copyright?.verdict) {
            subgraphQuads[GRAPH_IRIS_CATALOGUE].push(
              `${bsUri} <https://iris.who.int/ns/dspace#copyrightGate> ${JSON.stringify(b.materialization.gates.copyright.verdict)} <${GRAPH_IRIS_CATALOGUE}> .`
            );
          }
        }
      }
    }
  }

  // 2. Process Dublin Core JSON-LD records with Solution A Skolemization
  let skolemizedCount = 0;
  const dcFiles = fs.readdirSync(DC_DIR).filter(f => f.endsWith('.dc.jsonld'));
  for (const f of dcFiles) {
    const raw = JSON.parse(fs.readFileSync(path.join(DC_DIR, f), 'utf8'));
    const handle = raw['@id'] ? raw['@id'].replace('https://hdl.handle.net/', '') : '';
    const handleClean = handle.replace(/[^a-zA-Z0-9]/g, '_');
    const commId = handleToCommunity[handle];
    const commGraph = commId ? `${GRAPH_PREFIX_COMMUNITY}${commId}` : GRAPH_IRIS_METADATA;

    if (!subgraphQuads[commGraph]) {
      subgraphQuads[commGraph] = [];
    }

    // Solution A: Skolemize anonymous compound nodes before toRDF conversion
    const skolemized = skolemizeJsonLd(raw, handleClean);
    const nquadsText = await jsonld.toRDF(skolemized, { format: 'application/n-quads' });
    const lines = nquadsText.split('\n').filter(Boolean);

    for (let line of lines) {
      // W3C RDF 1.1 fallback skolemization for any residual blank nodes
      if (/_:[a-zA-Z0-9_-]+/.test(line)) {
        skolemizedCount++;
        line = line.replace(/_:(b[0-9a-zA-Z_-]+)/g, `<https://iris.who.int/.well-known/genid/item_${handleClean}_$1>`);
      }

      // Line is a triple in default graph: `<s> <p> <o> .` -> assign to GRAPH_IRIS_METADATA and commGraph
      const quadMetadata = line.replace(/\s*\.\s*$/, ` <${GRAPH_IRIS_METADATA}> .\n`);
      subgraphQuads[GRAPH_IRIS_METADATA].push(quadMetadata.trim());

      if (commGraph !== GRAPH_IRIS_METADATA) {
        const quadComm = line.replace(/\s*\.\s*$/, ` <${commGraph}> .\n`);
        subgraphQuads[commGraph].push(quadComm.trim());
      }
    }
  }

  // Assemble full dataset
  const allQuads: string[] = [
    ...subgraphQuads[GRAPH_IRIS_CATALOGUE],
    ...subgraphQuads[GRAPH_IRIS_METADATA],
  ];

  // Assert Solution A: Zero Blank Nodes Invariant (Skolemization)
  const residualBnodes = allQuads.filter(q => /(^|\s)_:[a-zA-Z0-9_-]+/.test(q));
  if (residualBnodes.length > 0) {
    throw new Error(`Skolemization check failed: ${residualBnodes.length} blank node(s) detected in dataset output.`);
  }

  const outNq = path.join(outDir, 'who-iris-dataset.nq');
  fs.writeFileSync(outNq, allQuads.join('\n') + '\n', 'utf8');

  // Gzip compression for CDN delivery simulation
  const outGz = path.join(outDir, 'who-iris-dataset.nq.gz');
  fs.writeFileSync(outGz, zlib.gzipSync(Buffer.from(allQuads.join('\n') + '\n')));

  // Write separate per-community and metadata subgraphs for lazy loading
  for (const [graphUri, qlines] of Object.entries(subgraphQuads)) {
    const safeName = graphUri.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const subNq = path.join(outDir, `${safeName}.nq`);
    fs.writeFileSync(subNq, qlines.join('\n') + '\n', 'utf8');
    fs.writeFileSync(`${subNq}.gz`, zlib.gzipSync(Buffer.from(qlines.join('\n') + '\n')));
  }

  // Write prepared queries catalog (queries.json)
  const queries = {
    "discoverySearch": {
      "description": "Cross-graph join: Match author/creator, MESH subject, year range, and open access bitstream across metadata and catalogue graphs",
      "sparql": `
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dspace: <https://iris.who.int/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?handle ?title ?creator ?issued ?commTitle ?pdfName ?copyright WHERE {
  GRAPH <https://iris.who.int/graph/metadata> {
    ?handle dcterms:title ?title ;
            dcterms:creator ?crNode .
    ?crNode rdf:value ?creator .
    OPTIONAL { ?handle dcterms:issued ?issued }
  }
  GRAPH <https://iris.who.int/graph/catalogue> {
    ?handle dspace:inCommunity ?comm ;
            dspace:hasBitstream ?bs .
    ?comm rdfs:label ?commTitle .
    ?bs dspace:fileName ?pdfName ;
        dspace:mediaType "application/pdf" .
    OPTIONAL { ?bs dspace:copyrightGate ?copyright }
  }
}
ORDER BY DESC(?issued)
      `.trim()
    },
    "facetCounts": {
      "description": "Multi-dimensional aggregation: return counts by Subject, MESH Authority, and Language",
      "sparql": `
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX dspace: <https://litlfred.github.io/folio-assistant-core/0.1.0/ns/dspace#>

SELECT ?subject (COUNT(DISTINCT ?handle) AS ?count) WHERE {
  GRAPH <https://iris.who.int/graph/metadata> {
    ?handle dcterms:subject ?sNode .
    ?sNode rdf:value ?subject .
  }
}
GROUP BY ?subject
ORDER BY DESC(?count)
      `.trim()
    },
    "regionalComparison": {
      "description": "Group items by Regional Office Community and Publication Type",
      "sparql": `
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dspace: <https://iris.who.int/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?communityName ?title ?issued WHERE {
  GRAPH <https://iris.who.int/graph/catalogue> {
    ?handle dspace:inCommunity ?comm .
    ?comm rdfs:label ?communityName .
  }
  GRAPH <https://iris.who.int/graph/metadata> {
    ?handle dcterms:title ?title .
    OPTIONAL { ?handle dcterms:issued ?issued }
  }
}
ORDER BY ?communityName ?issued
      `.trim()
    }
  };

  const queriesJsonPath = path.join(outDir, 'queries.json');
  fs.writeFileSync(queriesJsonPath, JSON.stringify(queries, null, 2), 'utf8');

  const subgraphCounts: Record<string, number> = {};
  for (const [k, v] of Object.entries(subgraphQuads)) {
    subgraphCounts[k] = v.length;
  }

  return {
    totalQuads: allQuads.length,
    metadataQuads: subgraphQuads[GRAPH_IRIS_METADATA].length,
    catalogueQuads: subgraphQuads[GRAPH_IRIS_CATALOGUE].length,
    skolemizedCount,
    outputNqPath: outNq,
    outputGzPath: outGz,
    queriesJsonPath,
    subgraphs: subgraphCounts
  };
}

if (import.meta.main) {
  buildIrisDataset().then(res => {
    console.log(`✓ Built WHO-IRIS Oxigraph dataset with ${res.totalQuads} quads.`);
    console.log(`  - Metadata quads: ${res.metadataQuads}`);
    console.log(`  - Catalogue quads: ${res.catalogueQuads}`);
    console.log(`  - Emitted: ${res.outputNqPath} (${fs.statSync(res.outputNqPath).size} bytes)`);
    console.log(`  - Emitted Gz: ${res.outputGzPath} (${fs.statSync(res.outputGzPath).size} bytes)`);
    console.log(`  - Queries catalog: ${res.queriesJsonPath}`);
  }).catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
