/**
 * Build script for WHO-IRIS Oxigraph Multi-Graph Dataset
 *
 * Implements 2-Tier Architecture:
 * - Tier 1: Global Routing Spine (<https://iris.who.int/graph/spine>)
 *   Lightweight, fast discovery across all items and catalogue hierarchy.
 *   Emitted as `who-iris-spine.nq` and `who-iris-spine.nq.gz`.
 *
 * - Tier 2: Partitioned Community Subgraphs (<https://iris.who.int/graph/community/{id}>)
 *   Detailed Qualified Dublin Core entities (MeSH subjects, authorities, abstracts,
 *   spatial coverage, full bitstream fixity records).
 *   Emitted per-community as `community_{id}.nq` and `community_{id}.nq.gz`.
 *
 * - Manifest: `subgraph-manifest.json` describing tiers, subgraphs, quad counts,
 *   and file mappings for edge dynamic loading.
 *
 * - Solution A Skolemization: Converts all compound anonymous nodes to globally
 *   scoped, deterministic URIs. Asserts zero blank nodes in the entire dataset.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import jsonld from 'jsonld';

const WHO_IRIS_ROOT = path.resolve(import.meta.dir, '..');
const NODES_DIR = path.join(WHO_IRIS_ROOT, 'catalogue', 'nodes');
const DC_DIR = path.join(WHO_IRIS_ROOT, 'site', 'dublin-core');
const DIST_DIR = path.join(WHO_IRIS_ROOT, 'dist', 'oxigraph');

export const GRAPH_IRIS_SPINE = 'https://iris.who.int/graph/spine';
export const GRAPH_IRIS_CATALOGUE = 'https://iris.who.int/graph/catalogue';
export const GRAPH_IRIS_METADATA = 'https://iris.who.int/graph/metadata';
export const GRAPH_PREFIX_COMMUNITY = 'https://iris.who.int/graph/community/';

export interface SubgraphPartitionInfo {
  id: string;
  name: string;
  iri: string;
  fileNq: string;
  fileGz: string;
  quadCount: number;
  itemCount: number;
}

export interface SubgraphManifest {
  version: string;
  generatedAt: string;
  tiers: {
    tier1_spine: {
      iri: string;
      fileNq: string;
      fileGz: string;
      quadCount: number;
      itemCount: number;
      description: string;
    };
    tier2_communities: {
      description: string;
      partitions: Record<string, SubgraphPartitionInfo>;
    };
  };
}

export interface BuildResult {
  totalQuads: number;
  spineQuads: number;
  metadataQuads: number;
  catalogueQuads: number;
  skolemizedCount: number;
  outputNqPath: string;
  outputGzPath: string;
  outputSpineNqPath: string;
  outputSpineGzPath: string;
  queriesJsonPath: string;
  manifestJsonPath: string;
  subgraphs: Record<string, number>;
  manifest: SubgraphManifest;
}

/**
 * Upstream Extractor Skolemization Helper (Zero-Pass Minting)
 *
 * Mints a stable, deterministic, content-addressed URI for a Dublin Core entity
 * at the point of ingestion/extraction, preventing blank node generation.
 *
 * URI format: https://iris.who.int/entity/item/{handle_slug}#{property}_{index}
 */
export function mintSkolemUri(handleClean: string, property: string, index: number): string {
  const propClean = property.replace(/^.*[:#]/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `https://iris.who.int/entity/item/${handleClean}#${propClean}_${index}`;
}

/**
 * Solution A: Skolemization (Mint Deterministic, Content-Addressed URIs)
 *
 * Traverses JSON-LD objects before RDF conversion and assigns globally unique,
 * deterministic URIs to all anonymous compound nodes (creators, subjects, dates,
 * spatial, language, types) based on the parent item handle and property path.
 *
 * Serves as both downstream normalizer and verification standard for upstream
 * extractor minting.
 *
 * URI format: https://iris.who.int/entity/item/{handle_slug}#{property}_{index}
 */
export function skolemizeJsonLd(node: any, handleClean: string, prefix = 'entity'): any {
  if (Array.isArray(node)) {
    return node.map((item, idx) => {
      if (item && typeof item === 'object' && !item['@id'] && !item['@value']) {
        const mintedId = mintSkolemUri(handleClean, prefix, idx + 1);
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

  const spineQuads: string[] = [];
  const subgraphQuads: Record<string, string[]> = {
    [GRAPH_IRIS_SPINE]: spineQuads,
    [GRAPH_IRIS_CATALOGUE]: [],
    [GRAPH_IRIS_METADATA]: [],
  };

  const communityMetadata: Record<string, { id: string; name: string; itemCount: number }> = {};
  const handleToCommunity: Record<string, string> = {};
  let totalItemsCount = 0;

  // 1. Process catalogue nodes
  const nodeFiles = fs.readdirSync(NODES_DIR).filter(f => f.endsWith('.json'));
  for (const f of nodeFiles) {
    const node = JSON.parse(fs.readFileSync(path.join(NODES_DIR, f), 'utf8'));

    if (node.kind === 'container' && node.id.startsWith('community/')) {
      const commId = node.id.replace('community/', '');
      if (communityMetadata[commId]) {
        communityMetadata[commId].name = node.title;
      } else {
        communityMetadata[commId] = { id: commId, name: node.title, itemCount: 0 };
      }
      const commUri = `<https://iris.who.int/${node.id}>`;
      const commQuads = [
        `${commUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Community>`,
        `${commUri} <http://www.w3.org/2000/01/rdf-schema#label> ${JSON.stringify(node.title)}`,
        `${commUri} <https://iris.who.int/ns/dspace#communityId> ${JSON.stringify(node.id)}`
      ];

      for (const q of commQuads) {
        subgraphQuads[GRAPH_IRIS_CATALOGUE].push(`${q} <${GRAPH_IRIS_CATALOGUE}> .`);
        spineQuads.push(`${q} <${GRAPH_IRIS_SPINE}> .`);
      }
    } else if (node.kind === 'container' && node.id.startsWith('collection/')) {
      const collUri = `<https://iris.who.int/${node.id}>`;
      const collQuads = [
        `${collUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Collection>`,
        `${collUri} <http://www.w3.org/2000/01/rdf-schema#label> ${JSON.stringify(node.title)}`,
        `${collUri} <https://iris.who.int/ns/dspace#collectionId> ${JSON.stringify(node.id)}`
      ];

      if (node.parents && node.parents[0]) {
        const parentComm = node.parents[0].find((p: string) => p.startsWith('community/'));
        if (parentComm) {
          collQuads.push(`${collUri} <https://iris.who.int/ns/dspace#parentCommunity> <https://iris.who.int/${parentComm}>`);
        }
      }

      for (const q of collQuads) {
        subgraphQuads[GRAPH_IRIS_CATALOGUE].push(`${q} <${GRAPH_IRIS_CATALOGUE}> .`);
        spineQuads.push(`${q} <${GRAPH_IRIS_SPINE}> .`);
      }
    } else if (node.kind === 'item' && node.handle) {
      totalItemsCount++;
      const handleUri = `<https://hdl.handle.net/${node.handle}>`;
      const itemQuads = [
        `${handleUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Item>`,
        `${handleUri} <https://iris.who.int/ns/dspace#handle> ${JSON.stringify(node.handle)}`,
        `${handleUri} <http://purl.org/dc/terms/title> ${JSON.stringify(node.title)}`
      ];

      if (node.parents && node.parents[0]) {
        for (const p of node.parents[0]) {
          if (p.startsWith('collection/')) {
            itemQuads.push(`${handleUri} <https://iris.who.int/ns/dspace#inCollection> <https://iris.who.int/${p}>`);
          }
          if (p.startsWith('community/')) {
            itemQuads.push(`${handleUri} <https://iris.who.int/ns/dspace#inCommunity> <https://iris.who.int/${p}>`);
            const cId = p.replace('community/', '');
            handleToCommunity[node.handle] = cId;
            if (!communityMetadata[cId]) {
              communityMetadata[cId] = { id: cId, name: cId, itemCount: 0 };
            }
            communityMetadata[cId].itemCount++;
          }
        }
      }

      if (Array.isArray(node.bitstreams)) {
        for (const b of node.bitstreams) {
          const bsId = b.fixity?.digest || b.name;
          const bsUri = `<https://iris.who.int/bitstream/${bsId}>`;
          itemQuads.push(
            `${handleUri} <https://iris.who.int/ns/dspace#hasBitstream> ${bsUri}`,
            `${bsUri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://iris.who.int/ns/dspace#Bitstream>`,
            `${bsUri} <https://iris.who.int/ns/dspace#fileName> ${JSON.stringify(b.name)}`,
            `${bsUri} <https://iris.who.int/ns/dspace#mediaType> ${JSON.stringify(b.mediaType || 'application/octet-stream')}`,
            `${bsUri} <https://iris.who.int/ns/dspace#fileBytes> "${b.bytes}"^^<http://www.w3.org/2001/XMLSchema#integer>`
          );

          if (b.materialization?.gates?.copyright?.verdict) {
            itemQuads.push(`${bsUri} <https://iris.who.int/ns/dspace#copyrightGate> ${JSON.stringify(b.materialization.gates.copyright.verdict)}`);
          }
        }
      }

      for (const q of itemQuads) {
        subgraphQuads[GRAPH_IRIS_CATALOGUE].push(`${q} <${GRAPH_IRIS_CATALOGUE}> .`);
        spineQuads.push(`${q} <${GRAPH_IRIS_SPINE}> .`);
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

    // Extract primary creator & issued date for Tier 1 Spine
    const handleUri = `<https://hdl.handle.net/${handle}>`;
    if (Array.isArray(raw['dcterms:creator']) && raw['dcterms:creator'][0]?.value?.['@value']) {
      const cr = raw['dcterms:creator'][0].value['@value'];
      spineQuads.push(`${handleUri} <http://purl.org/dc/terms/creator> ${JSON.stringify(cr)} <${GRAPH_IRIS_SPINE}> .`);
    }
    if (Array.isArray(raw['dcterms:issued']) && raw['dcterms:issued'][0]?.['@value']) {
      const issued = raw['dcterms:issued'][0]['@value'];
      spineQuads.push(`${handleUri} <http://purl.org/dc/terms/issued> ${JSON.stringify(issued)} <${GRAPH_IRIS_SPINE}> .`);
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

      // Assign to global metadata graph and partitioned community graph
      const quadMetadata = line.replace(/\s*\.\s*$/, ` <${GRAPH_IRIS_METADATA}> .\n`);
      subgraphQuads[GRAPH_IRIS_METADATA].push(quadMetadata.trim());

      if (commGraph !== GRAPH_IRIS_METADATA) {
        const quadComm = line.replace(/\s*\.\s*$/, ` <${commGraph}> .\n`);
        subgraphQuads[commGraph].push(quadComm.trim());
      }
    }
  }

  // Assemble full reference dataset
  const allQuads: string[] = [
    ...subgraphQuads[GRAPH_IRIS_CATALOGUE],
    ...subgraphQuads[GRAPH_IRIS_METADATA],
  ];

  // Assert Solution A: Zero Blank Nodes Invariant across all graphs
  const allCombined = [...allQuads, ...spineQuads];
  const residualBnodes = allCombined.filter(q => /(^|\s)_:[a-zA-Z0-9_-]+/.test(q));
  if (residualBnodes.length > 0) {
    throw new Error(`Skolemization check failed: ${residualBnodes.length} blank node(s) detected in dataset output.`);
  }

  // 1. Emit Full Combined Dataset
  const outNq = path.join(outDir, 'who-iris-dataset.nq');
  fs.writeFileSync(outNq, allQuads.join('\n') + '\n', 'utf8');
  const outGz = path.join(outDir, 'who-iris-dataset.nq.gz');
  fs.writeFileSync(outGz, zlib.gzipSync(Buffer.from(allQuads.join('\n') + '\n')));

  // 2. Emit Tier 1 Global Routing Spine
  const spineNq = path.join(outDir, 'who-iris-spine.nq');
  fs.writeFileSync(spineNq, spineQuads.join('\n') + '\n', 'utf8');
  const spineGz = path.join(outDir, 'who-iris-spine.nq.gz');
  fs.writeFileSync(spineGz, zlib.gzipSync(Buffer.from(spineQuads.join('\n') + '\n')));

  // 3. Emit Tier 2 Community Subgraphs
  const manifestPartitions: Record<string, SubgraphPartitionInfo> = {};
  for (const [graphUri, qlines] of Object.entries(subgraphQuads)) {
    if (graphUri === GRAPH_IRIS_SPINE) continue;
    const safeName = graphUri.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const subNq = path.join(outDir, `${safeName}.nq`);
    fs.writeFileSync(subNq, qlines.join('\n') + '\n', 'utf8');
    fs.writeFileSync(`${subNq}.gz`, zlib.gzipSync(Buffer.from(qlines.join('\n') + '\n')));

    if (graphUri.startsWith(GRAPH_PREFIX_COMMUNITY)) {
      const cId = graphUri.replace(GRAPH_PREFIX_COMMUNITY, '');
      const meta = communityMetadata[cId] || { id: cId, name: cId, itemCount: 0 };
      manifestPartitions[cId] = {
        id: cId,
        name: meta.name,
        iri: graphUri,
        fileNq: `${safeName}.nq`,
        fileGz: `${safeName}.nq.gz`,
        quadCount: qlines.length,
        itemCount: meta.itemCount,
      };
    }
  }

  // 4. Emit Subgraph Manifest
  const manifest: SubgraphManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    tiers: {
      tier1_spine: {
        iri: GRAPH_IRIS_SPINE,
        fileNq: 'who-iris-spine.nq',
        fileGz: 'who-iris-spine.nq.gz',
        quadCount: spineQuads.length,
        itemCount: totalItemsCount,
        description: 'Global routing spine: hierarchy, item handles, title, creator, year, bitstream access clearance'
      },
      tier2_communities: {
        description: 'On-demand partitioned community subgraphs containing detailed Dublin Core metadata, MeSH authorities, abstracts, spatial tags',
        partitions: manifestPartitions
      }
    }
  };

  const manifestJsonPath = path.join(outDir, 'subgraph-manifest.json');
  fs.writeFileSync(manifestJsonPath, JSON.stringify(manifest, null, 2), 'utf8');

  // 5. Emit Prepared Queries Catalog
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
    "tier1DiscoverySearch": {
      "description": "Fast Tier 1 search over global routing spine: matches title, creator, year, and open-access clearance",
      "sparql": `
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dspace: <https://iris.who.int/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT ?handle ?title ?creator ?issued ?commTitle ?pdfName ?copyright WHERE {
  GRAPH <https://iris.who.int/graph/spine> {
    ?handle a dspace:Item ;
            dcterms:title ?title ;
            dspace:inCommunity ?comm .
    ?comm rdfs:label ?commTitle .
    OPTIONAL { ?handle dcterms:creator ?creator }
    OPTIONAL { ?handle dcterms:issued ?issued }
    OPTIONAL {
      ?handle dspace:hasBitstream ?bs .
      ?bs dspace:fileName ?pdfName ;
          dspace:mediaType "application/pdf" .
      OPTIONAL { ?bs dspace:copyrightGate ?copyright }
    }
  }
}
ORDER BY DESC(?issued)
      `.trim()
    },
    "tier2CommunitySearch": {
      "description": "Tier 2 cross-graph search combining global routing spine with mounted community detailed metadata (MeSH authorities, abstracts, spatial tags)",
      "sparql": `
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX dspace: <https://iris.who.int/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT DISTINCT ?handle ?title ?creator ?subject ?issued ?commName ?pdfName ?copyright WHERE {
  GRAPH <https://iris.who.int/graph/spine> {
    ?handle a dspace:Item ;
            dcterms:title ?title ;
            dspace:inCommunity ?comm .
    ?comm rdfs:label ?commName .
    OPTIONAL {
      ?handle dspace:hasBitstream ?bs .
      ?bs dspace:fileName ?pdfName .
      OPTIONAL { ?bs dspace:copyrightGate ?copyright }
    }
  }
  GRAPH ?communityGraph {
    ?handle dcterms:subject ?sNode .
    ?sNode rdf:value ?subject .
    OPTIONAL {
      ?handle dcterms:creator ?crNode .
      ?crNode rdf:value ?creator .
    }
    OPTIONAL { ?handle dcterms:issued ?issued }
  }
  FILTER (STRSTARTS(STR(?communityGraph), "https://iris.who.int/graph/community/"))
}
ORDER BY DESC(?issued)
      `.trim()
    },
    "facetCounts": {
      "description": "Aggregate count of items grouped by community hierarchy and bitstream clearance",
      "sparql": `
PREFIX dspace: <https://iris.who.int/ns/dspace#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?communityName ?copyright (COUNT(DISTINCT ?handle) AS ?count) WHERE {
  GRAPH <https://iris.who.int/graph/spine> {
    ?handle a dspace:Item ;
            dspace:inCommunity ?comm .
    ?comm rdfs:label ?communityName .
    OPTIONAL {
      ?handle dspace:hasBitstream ?bs .
      OPTIONAL { ?bs dspace:copyrightGate ?copyright }
    }
  }
}
GROUP BY ?communityName ?copyright
ORDER BY ?communityName
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
    spineQuads: spineQuads.length,
    metadataQuads: subgraphQuads[GRAPH_IRIS_METADATA].length,
    catalogueQuads: subgraphQuads[GRAPH_IRIS_CATALOGUE].length,
    skolemizedCount,
    outputNqPath: outNq,
    outputGzPath: outGz,
    outputSpineNqPath: spineNq,
    outputSpineGzPath: spineGz,
    queriesJsonPath,
    manifestJsonPath,
    subgraphs: subgraphCounts,
    manifest,
  };
}

if (import.meta.main) {
  buildIrisDataset().then(res => {
    console.log(`✓ Built WHO-IRIS Oxigraph 2-Tier dataset:`);
    console.log(`  - Tier 1 Spine quads: ${res.spineQuads}`);
    console.log(`  - Tier 2 Metadata quads: ${res.metadataQuads}`);
    console.log(`  - Emitted Spine: ${res.outputSpineNqPath} (${fs.statSync(res.outputSpineNqPath).size} bytes)`);
    console.log(`  - Emitted Spine Gz: ${res.outputSpineGzPath} (${fs.statSync(res.outputSpineGzPath).size} bytes)`);
    console.log(`  - Subgraph Manifest: ${res.manifestJsonPath}`);
    console.log(`  - Partitions: ${Object.keys(res.manifest.tiers.tier2_communities.partitions).length} communities`);
  }).catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });
}
