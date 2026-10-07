/**
 * Automated test suite for WHO-IRIS Oxigraph Search Engine MVP
 */
import { describe, expect, test, beforeAll } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import { buildIrisDataset, GRAPH_IRIS_CATALOGUE, GRAPH_IRIS_METADATA } from '../build-iris-oxigraph.ts';
import { IrisOxigraphEngine, bound, selectRows } from '../iris-oxigraph-search.ts';

const TMP_DIST = path.resolve(import.meta.dir, '..', '..', 'dist', 'oxigraph');

describe('WHO-IRIS Oxigraph Multi-Graph MVP', () => {
  beforeAll(async () => {
    await buildIrisDataset(TMP_DIST);
  });

  test('builds multi-graph N-Quads dataset and prepared queries catalog', () => {
    const nqPath = path.join(TMP_DIST, 'who-iris-dataset.nq');
    const gzPath = path.join(TMP_DIST, 'who-iris-dataset.nq.gz');
    const queriesPath = path.join(TMP_DIST, 'queries.json');

    expect(fs.existsSync(nqPath)).toBe(true);
    expect(fs.existsSync(gzPath)).toBe(true);
    expect(fs.existsSync(queriesPath)).toBe(true);

    const nqContent = fs.readFileSync(nqPath, 'utf8');
    expect(nqContent).toContain(GRAPH_IRIS_CATALOGUE);
    expect(nqContent).toContain(GRAPH_IRIS_METADATA);

    const queries = JSON.parse(fs.readFileSync(queriesPath, 'utf8'));
    expect(queries).toHaveProperty('discoverySearch');
    expect(queries).toHaveProperty('facetCounts');
  });

  test('Solution A Skolemization: asserts zero blank nodes in compiled N-Quads dataset', () => {
    const nqPath = path.join(TMP_DIST, 'who-iris-dataset.nq');
    const lines = fs.readFileSync(nqPath, 'utf8').split('\n').filter(Boolean);

    // Assert no blank node subject or object identifiers exist in entire dataset
    const blankNodes = lines.filter(line => /(^|\s)_:[a-zA-Z0-9_-]+/.test(line));
    expect(blankNodes.length).toBe(0);

    // Assert compound nodes are skolemized into deterministic https://iris.who.int/entity/item/ URIs
    const skolemizedNodes = lines.filter(line => line.includes('https://iris.who.int/entity/item/'));
    expect(skolemizedNodes.length).toBeGreaterThan(10);
  });

  test('complex search: multi-condition filter combining Subject, Community, and Copyright Gate', () => {
    const engine = new IrisOxigraphEngine();
    engine.load(path.join(TMP_DIST, 'who-iris-dataset.nq'));

    // Query: Subject contains 'Guidelines' AND Community contains 'Western Pacific' AND hasPdf = true
    const results = engine.complexSearch({
      subject: 'Guidelines',
      community: 'Western Pacific',
      hasPdf: true,
      copyrightVerdict: 'permitted'
    });

    expect(results.length).toBe(1);
    const item = results[0];
    expect(item.handle).toBe('https://hdl.handle.net/10665/332098');
    expect(item.title).toBe('Publication and information products style guide');
    expect(item.creator).toBe('World Health Organization. Regional Office for the Western Pacific');
    expect(item.spatial).toBe('Manila');
    expect(item.year).toBe(2020);
    expect(item.pdfName).toBe('WPR-RDO-2020-003-eng.pdf');
    expect(item.copyrightGate).toBe('permitted');
  });

  test('complex search: Date range filter (1990 <= Year <= 2000) with Spatial="Geneva"', () => {
    const engine = new IrisOxigraphEngine();
    engine.load(path.join(TMP_DIST, 'who-iris-dataset.nq'));

    const results = engine.complexSearch({
      spatial: 'Geneva',
      yearFrom: 1990,
      yearTo: 2000
    });

    expect(results.length).toBe(1);
    expect(results[0].handle).toBe('https://hdl.handle.net/10665/36842');
    expect(results[0].title).toBe('WHO editorial style manual');
    expect(results[0].year).toBe(1993);
    expect(results[0].languages).toContain('it');
    expect(results[0].languages).toContain('en');
  });

  test('facet rollups: aggregate counts across subjects and communities', () => {
    const engine = new IrisOxigraphEngine();
    engine.load(path.join(TMP_DIST, 'who-iris-dataset.nq'));

    const subjectFacets = engine.facetCounts('subject');
    const guidelinesFacet = subjectFacets.find(f => f.value === 'Guidelines as Topic');
    const publishingFacet = subjectFacets.find(f => f.value === 'Publishing');

    expect(guidelinesFacet).toBeDefined();
    expect(guidelinesFacet?.count).toBe(2);
    expect(publishingFacet?.count).toBe(2);

    const commFacets = engine.facetCounts('community');
    const hq = commFacets.find(f => f.value.includes('Headquarters'));
    const wpro = commFacets.find(f => f.value.includes('Western Pacific'));

    expect(hq?.count).toBe(2);
    expect(wpro?.count).toBe(1);
  });

  test('dynamic / lazy loading: incrementally mount subgraphs without store clobbering', () => {
    const engine = new IrisOxigraphEngine();

    // 1. Initially load ONLY the catalogue graph
    const catalogueNq = path.join(TMP_DIST, 'iris_who_int_graph_catalogue.nq');
    expect(fs.existsSync(catalogueNq)).toBe(true);
    engine.load(catalogueNq);

    // Initial search for metadata title returns 0 items because metadata graph is not yet mounted
    const beforeLoad = engine.complexSearch({ subject: 'Guidelines' });
    expect(beforeLoad.length).toBe(0);

    // 2. Lazily mount the metadata graph
    const metadataNq = path.join(TMP_DIST, 'iris_who_int_graph_metadata.nq');
    engine.loadSubgraph(GRAPH_IRIS_METADATA, metadataNq);

    // 3. Re-run search: immediately resolves joined metadata
    const afterLoad = engine.complexSearch({ subject: 'Guidelines' });
    expect(afterLoad.length).toBe(2);
  });

  test('prepared queries manifest execution', () => {
    const engine = new IrisOxigraphEngine();
    engine.load(path.join(TMP_DIST, 'who-iris-dataset.nq.gz')); // Test loading gzipped directly!

    const queries = JSON.parse(fs.readFileSync(path.join(TMP_DIST, 'queries.json'), 'utf8'));
    const sparql = queries.discoverySearch.sparql;

    const rows = selectRows(engine.store, sparql);
    expect(rows.length).toBeGreaterThan(0);

    const handles = rows.map(r => bound(r, 'handle'));
    expect(handles).toContain('https://hdl.handle.net/10665/332098');
  });

  test('2-Tier Architecture: Tier 1 spine fast discovery search without partitions', () => {
    const engine = new IrisOxigraphEngine();
    const spineGz = path.join(TMP_DIST, 'who-iris-spine.nq.gz');
    expect(fs.existsSync(spineGz)).toBe(true);

    engine.loadSpine(spineGz);
    expect(engine.isSpineLoaded()).toBe(true);
    expect(engine.getLoadedCommunities().length).toBe(0);

    // Fast search over Tier 1 spine: finds items matching title, creator, community, and copyright gate
    const results = engine.searchSpine({
      community: 'Western Pacific',
      hasPdf: true,
      copyrightVerdict: 'permitted'
    });

    expect(results.length).toBe(1);
    expect(results[0].handle).toBe('https://hdl.handle.net/10665/332098');
    expect(results[0].title).toBe('Publication and information products style guide');
    expect(results[0].creator).toBe('World Health Organization. Regional Office for the Western Pacific');
    expect(results[0].pdfName).toBe('WPR-RDO-2020-003-eng.pdf');
    expect(results[0].copyrightGate).toBe('permitted');

    // Deep metadata (subjects, spatial) is empty because Tier 2 partitions are not yet mounted
    expect(results[0].subjects.length).toBe(0);
  });

  test('2-Tier Architecture: Dynamic on-demand loading of community partition', () => {
    const engine = new IrisOxigraphEngine();
    const spinePath = path.join(TMP_DIST, 'who-iris-spine.nq');
    engine.loadSpine(spinePath);

    const manifestPath = path.join(TMP_DIST, 'subgraph-manifest.json');
    expect(fs.existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const wproCommId = 'ebd3b191-c322-4754-9415-469a1a0eb0c3';
    expect(manifest.tiers.tier2_communities.partitions[wproCommId]).toBeDefined();

    // 1. Prior to mounting WPRO partition, complex search for WPRO specific govdoc or spatial yields no deep tags
    const beforeResults = engine.complexSearch({ spatial: 'Manila' });
    expect(beforeResults.length).toBe(0);

    // 2. User browses to or activates search on WPRO community -> triggers lazy load
    const partitionFile = path.join(TMP_DIST, manifest.tiers.tier2_communities.partitions[wproCommId].fileGz);
    expect(fs.existsSync(partitionFile)).toBe(true);
    engine.loadCommunity(wproCommId, partitionFile);
    expect(engine.isCommunityLoaded(wproCommId)).toBe(true);

    // 3. Re-run search: now resolves spatial, abstract, and MeSH subjects for WPRO
    const afterResults = engine.complexSearch({ spatial: 'Manila' });
    expect(afterResults.length).toBe(1);
    expect(afterResults[0].handle).toBe('https://hdl.handle.net/10665/332098');
    expect(afterResults[0].spatial).toBe('Manila');
    expect(afterResults[0].govdoc).toBe('WPR/RDO/2020/003');
    expect(afterResults[0].subjects).toContain('Guidelines as Topic');
  });

  test('2-Tier Architecture: Multi-community dynamic mounting and active cross-community search', () => {
    const engine = new IrisOxigraphEngine();
    engine.loadSpine(path.join(TMP_DIST, 'who-iris-spine.nq'));

    const manifest = JSON.parse(fs.readFileSync(path.join(TMP_DIST, 'subgraph-manifest.json'), 'utf8'));
    const commIds = Object.keys(manifest.tiers.tier2_communities.partitions);
    expect(commIds.length).toBe(2);

    // Batch load multiple community partitions dynamically via resolver directory
    engine.loadCommunities(commIds, TMP_DIST);
    for (const cId of commIds) {
      expect(engine.isCommunityLoaded(cId)).toBe(true);
    }

    // Active cross-community search with multi-community selection
    const multiResults = engine.complexSearch({
      subject: 'Guidelines',
      communities: ['Western Pacific', 'Headquarters']
    });

    expect(multiResults.length).toBe(2);
    const handles = multiResults.map(r => r.handle);
    expect(handles).toContain('https://hdl.handle.net/10665/332098'); // WPRO item
    expect(handles).toContain('https://hdl.handle.net/10665/145714'); // HQ item
  });

  test('2-Tier Architecture: Subgraph manifest integrity and partition files exist', () => {
    const manifestPath = path.join(TMP_DIST, 'subgraph-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(manifest.version).toBe('1.0.0');
    expect(manifest.tiers.tier1_spine.fileNq).toBe('who-iris-spine.nq');
    expect(fs.existsSync(path.join(TMP_DIST, manifest.tiers.tier1_spine.fileNq))).toBe(true);
    expect(fs.existsSync(path.join(TMP_DIST, manifest.tiers.tier1_spine.fileGz))).toBe(true);

    const partitions = manifest.tiers.tier2_communities.partitions;
    for (const p of Object.values(partitions) as any[]) {
      expect(p.quadCount).toBeGreaterThan(0);
      expect(p.itemCount).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(TMP_DIST, p.fileNq))).toBe(true);
      expect(fs.existsSync(path.join(TMP_DIST, p.fileGz))).toBe(true);
    }
  });
});

