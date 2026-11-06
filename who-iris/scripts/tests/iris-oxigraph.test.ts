/**
 * Automated test suite for WHO-IRIS Oxigraph Search Engine MVP
 */
import { describe, expect, test, beforeAll } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
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

    expect(hq?.count).toBe(17);
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

    // 3. Re-run search: immediately resolves joined metadata, and finds
    // exactly what a store loaded whole finds. Compared to the eager load, not
    // to a fixed count: the corpus grows as IRIS items move in (who-iris#107).
    const afterLoad = engine.complexSearch({ subject: 'Guidelines' });
    const eager = new IrisOxigraphEngine();
    eager.load(path.join(TMP_DIST, 'who-iris-dataset.nq'));
    const handles = (rs: { handle: string }[]) => rs.map((r) => r.handle).sort();
    expect(afterLoad.length).toBeGreaterThan(0);
    expect(handles(afterLoad)).toEqual(handles(eager.complexSearch({ subject: 'Guidelines' })));
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
    expect(commIds.length).toBe(3);

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
    for (const p of Object.values(partitions) as { quadCount: number; itemCount: number; fileNq: string; fileGz: string }[]) {
      expect(p.quadCount).toBeGreaterThan(0);
      expect(p.itemCount).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(TMP_DIST, p.fileNq))).toBe(true);
      expect(fs.existsSync(path.join(TMP_DIST, p.fileGz))).toBe(true);
    }
  });
});


describe('WHO-IRIS Oxigraph over exported DSpace records (#104)', () => {
  test('builds sorted, byte-identical partitions from exported records and keeps unchanged partitions identical when another community changes', async () => {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'ox-export-test-'));
    const recDir = path.join(tmpBase, 'records');
    const out1 = path.join(tmpBase, 'out1');
    const out2 = path.join(tmpBase, 'out2');
    const out3 = path.join(tmpBase, 'out3');
    try {
      fs.mkdirSync(path.join(recDir, 'communities'), { recursive: true });
      fs.mkdirSync(path.join(recDir, 'collections', '10665'), { recursive: true });
      fs.mkdirSync(path.join(recDir, '10665'), { recursive: true });

      const commWpro = {
        uuid: 'e1b206b7-fd4c-4b93-972a-be07850a1cdd',
        handle: '10665/1637',
        name: 'Regional Office for the Western Pacific',
        type: 'community',
      };
      const commHq = {
        uuid: '5bff2c18-6c2b-4658-9087-93811d2399c0',
        handle: '10665/1',
        name: 'Headquarters',
        type: 'community',
      };
      fs.writeFileSync(path.join(recDir, 'communities', 'wpro.json'), JSON.stringify(commWpro));
      fs.writeFileSync(path.join(recDir, 'communities', 'hq.json'), JSON.stringify(commHq));

      const collWpro = {
        uuid: 'a3d14b58-af81-489e-93be-c3b9e5325fc9',
        handle: '10665/382262',
        name: 'WPRO Publications',
        parentCommunity: { uuid: commWpro.uuid, handle: commWpro.handle, name: commWpro.name },
        type: 'collection',
      };
      const collHq = {
        uuid: '43c3b8d5-432d-4e1b-a5bf-3cc6129d7266',
        handle: '10665/26723',
        name: 'HQ Technical Documents',
        parentCommunity: { uuid: commHq.uuid, handle: commHq.handle, name: commHq.name },
        type: 'collection',
      };
      fs.writeFileSync(path.join(recDir, 'collections', '10665', '382262.json'), JSON.stringify(collWpro));
      fs.writeFileSync(path.join(recDir, 'collections', '10665', '26723.json'), JSON.stringify(collHq));

      const itemWpro = {
        uuid: '6e96b393-5419-4127-9818-a0ecdc174b70',
        handle: '10665/387974',
        lastModified: '2026-10-31T02:23:11.326+00:00',
        withdrawn: false,
        owningCollection: { uuid: collWpro.uuid, handle: collWpro.handle, name: collWpro.name },
        bitstreams: [
          {
            uuid: 'f9f3d78c-ca9d-42a3-ad0f-313a6f4f416b',
            name: 'B09925-eng.pdf',
            bundle: 'ORIGINAL',
            sizeBytes: 1369210,
            checkSum: { checkSumAlgorithm: 'MD5', value: '72de613d5abf364b1f3d412f1fa7a327' },
            copyrightGate: 'permitted',
          },
        ],
        metadata: {
          'dc.title': [{ value: 'Western Pacific guidance on health systems', language: 'en' }],
          'dc.contributor.author': [{ value: 'World Health Organization. Regional Office for the Western Pacific', language: 'en' }],
          'dc.date.issued': [{ value: '2025-10-20' }],
          'dc.coverage.spatial': [{ value: 'Manila', language: 'en' }],
          'dc.subject.mesh': [{ value: 'Health Systems Plans', language: 'en', authority: 'D006295' }],
          'dc.identifier.govdoc': [{ value: 'WPR/2025/001' }],
        },
      };

      const itemHq = {
        uuid: 'd0b4c4be-0cb6-4f16-ba71-28deb47d4986',
        handle: '10665/387973',
        lastModified: '2026-10-31T02:23:11.179+00:00',
        withdrawn: false,
        owningCollection: { uuid: collHq.uuid, handle: collHq.handle, name: collHq.name },
        bitstreams: [
          {
            uuid: 'c5af585f-732e-4514-b88e-a02721b07c41',
            name: 'HQ-2025.pdf',
            bundle: 'ORIGINAL',
            sizeBytes: 512000,
            checkSum: { checkSumAlgorithm: 'MD5', value: '43070ec9a734460571ff2dd95dc21423' },
            copyrightGate: 'permitted',
          },
        ],
        metadata: {
          'dc.title': [{ value: 'Global surveillance framework', language: 'en' }],
          'dc.contributor.author': [{ value: 'World Health Organization', language: 'en' }],
          'dc.date.issued': [{ value: '2025-05-01' }],
          'dc.coverage.spatial': [{ value: 'Geneva', language: 'en' }],
          'dc.subject.mesh': [{ value: 'Public Health Surveillance', language: 'en' }],
        },
      };

      fs.writeFileSync(path.join(recDir, '10665', '387974.json'), JSON.stringify(itemWpro));
      fs.writeFileSync(path.join(recDir, '10665', '387973.json'), JSON.stringify(itemHq));

      await buildIrisDataset(out1, { recordsDir: recDir });
      await buildIrisDataset(out2, { recordsDir: recDir });

      // Every emitted file is byte-identical across repeated builds
      for (const fname of fs.readdirSync(out1)) {
        expect(fs.readFileSync(path.join(out1, fname))).toEqual(fs.readFileSync(path.join(out2, fname)));
      }

      // Lines inside who-iris-dataset.nq and who-iris-spine.nq are sorted and have zero blank nodes
      const spineLines = fs.readFileSync(path.join(out1, 'who-iris-spine.nq'), 'utf8').trim().split('\n');
      expect(spineLines).toEqual([...spineLines].sort());
      const datasetLines = fs.readFileSync(path.join(out1, 'who-iris-dataset.nq'), 'utf8').trim().split('\n');
      expect(datasetLines).toEqual([...datasetLines].sort());
      expect(datasetLines.filter(l => /(^|\s)_:[a-zA-Z0-9_-]+/.test(l)).length).toBe(0);

      // Querying via IrisOxigraphEngine works across Tier 1 Spine and Tier 2 Community partitions
      const engine = new IrisOxigraphEngine();
      engine.loadSpine(path.join(out1, 'who-iris-spine.nq.gz'));
      expect(engine.searchSpine({ community: 'Western Pacific', hasPdf: true }).map(r => r.handle)).toEqual(['https://hdl.handle.net/10665/387974']);

      engine.loadCommunity(commWpro.uuid, path.join(out1, `iris_who_int_graph_community_${commWpro.uuid}.nq.gz`));
      const deep = engine.complexSearch({ spatial: 'Manila', govdoc: 'WPR/2025/001' });
      expect(deep.length).toBe(1);
      expect(deep[0].handle).toBe('https://hdl.handle.net/10665/387974');

      // Modifying HQ item changes HQ partition and spine, while WPRO partition stays byte-identical (no churn)
      itemHq.metadata['dc.title'] = [{ value: 'Global surveillance framework (revised)', language: 'en' }];
      fs.writeFileSync(path.join(recDir, '10665', '387973.json'), JSON.stringify(itemHq));
      await buildIrisDataset(out3, { recordsDir: recDir });

      const wproGz1 = fs.readFileSync(path.join(out1, `iris_who_int_graph_community_${commWpro.uuid}.nq.gz`));
      const wproGz3 = fs.readFileSync(path.join(out3, `iris_who_int_graph_community_${commWpro.uuid}.nq.gz`));
      expect(wproGz3).toEqual(wproGz1);

      const hqGz1 = fs.readFileSync(path.join(out1, `iris_who_int_graph_community_${commHq.uuid}.nq.gz`));
      const hqGz3 = fs.readFileSync(path.join(out3, `iris_who_int_graph_community_${commHq.uuid}.nq.gz`));
      expect(hqGz3).not.toEqual(hqGz1);
    } finally {
      fs.rmSync(tmpBase, { recursive: true, force: true });
    }
  });
});
