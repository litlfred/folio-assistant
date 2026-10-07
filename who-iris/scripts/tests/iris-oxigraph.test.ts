/**
 * Automated test suite for WHO-IRIS Oxigraph Search Engine MVP
 */
import { describe, expect, test, beforeAll } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import { buildIrisDataset, GRAPH_IRIS_CATALOGUE, GRAPH_IRIS_METADATA } from '../build-iris-oxigraph.ts';
import { IrisOxigraphEngine } from '../iris-oxigraph-search.ts';

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

    const rows = Array.from(engine.store.query(sparql));
    expect(rows.length).toBeGreaterThan(0);

    const handles = rows.map(r => r.get('handle').value);
    expect(handles).toContain('https://hdl.handle.net/10665/332098');
  });
});
