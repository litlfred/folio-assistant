/**
 * The Pagefind prototype's method and fixture — bean `folio-assistant-4pm8`.
 *
 * @module large-datasets/schemas/pagefind.test
 * @graphNode none — a test
 *
 * Three claims:
 *
 * 1. the bench is deterministic given its seed: the corpus, the fixture and
 *    the query sample are the same on every run, and the corpus is the one
 *    `bench-id-lookup.ts` measured, so the two sets of numbers are
 *    comparable;
 * 2. the committed fixture is what the seeded generator makes now, and the
 *    fixture index builds with the pinned Pagefind: one fragment per distinct
 *    URL (Pagefind's key; see below), and the runtime, wasm and meta a search
 *    needs;
 * 3. none of it is vacuous: an empty build is refused, and the query sample
 *    covers every kind it claims to.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { syntheticCorpus, titleWords } from "../scripts/bench-id-lookup.ts";
import {
  buildPagefind,
  corpus,
  FIXTURE,
  FIXTURE_ITEMS,
  fixtureRecords,
  fixtureText,
  kindOf,
  readFixture,
  record,
  recall,
  sampleQueries,
  sizeReport,
  words,
} from "../scripts/bench-pagefind.ts";
import { catalogueNodesDir, referencedEntries, SOURCE } from "../scripts/gen-id-lookup.ts";

describe("the bench is deterministic given its seed", () => {
  test("the corpus is bench-id-lookup's, entry for entry", () => {
    const real = referencedEntries(catalogueNodesDir(SOURCE));
    expect(corpus(500)).toEqual(syntheticCorpus(real, 500, 180, titleWords()));
  });

  test("two builds of the corpus are identical", () => {
    expect(corpus(2000)).toEqual(corpus(2000));
  });

  test("the query sample is identical across runs and covers every kind", () => {
    const c = corpus(3000);
    const a = sampleQueries(c, 50, 10);
    expect(sampleQueries(c, 50, 10)).toEqual(a);
    const kinds = new Map<string, number>();
    for (const q of a) kinds.set(q.kind, (kinds.get(q.kind) ?? 0) + 1);
    expect(Object.fromEntries(kinds)).toEqual({ title: 50, words: 50, uuid: 10, id: 10 });
    // Every query was made from a synthetic item, and its expected url is that item's.
    const urls = new Set(c.filter((e) => e.id.startsWith("item/")).map((e) => e.url));
    for (const q of a) expect(urls.has(q.expect)).toBe(true);
    // A three-word query is three whole words of its item's title, and at least that item matches it.
    for (const q of a.filter((x) => x.kind === "words")) {
      expect(words(q.q).length).toBeGreaterThanOrEqual(1);
      expect(q.matchingItems).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("the committed fixture", () => {
  test("is what the seeded generator makes now", () => {
    expect(readFileSync(FIXTURE, "utf8")).toBe(fixtureText(fixtureRecords()));
  });

  test("holds every real referenced node and the stated number of synthetic items", () => {
    const f = readFixture();
    const real = referencedEntries(catalogueNodesDir(SOURCE));
    expect(real.length).toBeGreaterThanOrEqual(10);
    expect(f.slice(0, real.length)).toEqual(real);
    expect(f.length).toBe(real.length + FIXTURE_ITEMS);
  });

  test("a record indexes the title, and the id only when asked", () => {
    const e = readFixture()[0]!;
    expect(record(e)).toEqual({ url: e.url, content: e.title, language: "en", meta: { title: e.title } });
    expect(record(e, true).meta).toEqual({ title: e.title, id: e.id });
  });
});

describe("the fixture index builds", () => {
  test("with one fragment per record, and what a search loads", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pagefind-fixture-"));
    try {
      const entries = readFixture();
      const t = await buildPagefind(entries, dir);
      const files = readdirSync(t.bundle, { recursive: true, withFileTypes: true }).filter((d) => d.isFile());
      const rel = files.map((d) => join(d.parentPath, d.name).slice(t.bundle.length + 1));
      expect(rel).toContain("pagefind.js");
      expect(rel).toContain("pagefind-entry.json");
      expect(rel.some((f) => kindOf(f) === "wasm")).toBe(true);
      expect(rel.some((f) => kindOf(f) === "meta")).toBe(true);
      expect(rel.some((f) => kindOf(f) === "index")).toBe(true);
      // Pagefind keys a record by its URL, and a later record with the same URL
      // silently replaces an earlier one. Two real collections share their
      // community's URL, so the fixture's 50 records are 48 pages. Asserted, so
      // the day it stops being true is noticed.
      const urls = new Set(entries.map((e) => e.url)).size;
      expect(urls).toBe(entries.length - 2);
      expect(rel.filter((f) => kindOf(f) === "fragment").length).toBe(urls);
      expect(rel.filter((f) => kindOf(f) === "other")).toEqual([]);
      const entry = JSON.parse(readFileSync(join(t.bundle, "pagefind-entry.json"), "utf8")) as { languages: Record<string, { page_count: number }> };
      expect(entry.languages.en?.page_count).toBe(urls);
      const s = sizeReport(t.bundle, entries, t, false);
      expect(s.byKind.fragment!.files).toBe(urls);
      // The UI is Pagefind's optional prebuilt one; a search loads none of it, so it is outside the search total.
      expect(s.search.files + (s.byKind.ui?.files ?? 0)).toBe(rel.length);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);

  test("an empty build is refused", async () => {
    await expect(buildPagefind([], join(tmpdir(), "never"))).rejects.toThrow(/zero records/);
    expect(existsSync(join(tmpdir(), "never", "pagefind"))).toBe(false);
  });
});

test("recall counts the item in the top 10, zero-hit queries, and queries more than 10 items match", () => {
  expect(
    recall([
      { kind: "title", ms: 1, bytes: 0, requests: 0, hits: 3, top10: true },
      { kind: "title", ms: 1, bytes: 0, requests: 0, hits: 0, top10: false },
      { kind: "words", ms: 1, bytes: 0, requests: 0, hits: 40, top10: false, matchingItems: 40 },
      { kind: "words", ms: 1, bytes: 0, requests: 0, hits: 2, top10: true, matchingItems: 2 },
    ]),
  ).toEqual({ title: { n: 2, top10: 1, zeroHits: 1 }, words: { n: 2, top10: 1, zeroHits: 0, over10Matching: 1 } });
});
