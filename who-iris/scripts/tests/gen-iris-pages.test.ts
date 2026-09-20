/**
 * The generated pages must not depend on directory-read order.
 *
 * `readdirSync` returns entries in whatever order the filesystem gives, and it
 * is not stable across machines. Several of these pages render LISTS of
 * catalogue nodes, so the HTML inherited that order — a generator producing
 * different bytes from identical inputs. It was green on the machine that
 * wrote the pages and `iris:pages:check` was RED in CI, with exactly the two
 * list-rendering pages stale (`index.html`, `community-list.html`) while the
 * four per-node pages passed. That asymmetry is what identified it.
 *
 * This is the ratchet. It asserts the ORDER IN THE RENDERED OUTPUT rather than
 * the sort call, because a test that re-reads the sort is a test that passes
 * the day somebody renders a list from an unsorted copy.
 *
 * @module who-iris/scripts/tests/gen-iris-pages.test
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

import { OWNED } from "../gen-iris-pages.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const NODES = join(INSTANCE, "catalogue", "nodes");
const DOCS = join(INSTANCE, "docs");

/** Every node id in the catalogue, sorted the way the generator sorts them. */
function sortedIds(): string[] {
  return readdirSync(NODES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(NODES, f), "utf-8")).id as string)
    .sort((a, b) => a.localeCompare(b, "en"));
}

/** The item slugs a page links to, in the order it first links to each. */
function itemOrderIn(page: string): string[] {
  const html = readFileSync(join(DOCS, page), "utf-8");
  const seen: string[] = [];
  for (const m of html.matchAll(/item-(item-[a-z0-9-]+)\.html/g)) {
    if (!seen.includes(m[1]!)) seen.push(m[1]!);
  }
  return seen;
}

/** The generator's slug function, restated — the PAGES are the subject, not it. */
const slug = (id: string) => id.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

describe("rendered lists are in a deterministic order", () => {
  const expected = sortedIds()
    .filter((id) => id.startsWith("item/"))
    .map(slug);

  it("there are items to order — otherwise everything below passes vacuously", () => {
    expect(expected.length).toBeGreaterThan(1);
  });

  it("community-list.html lists items in catalogue-id order", () => {
    expect(itemOrderIn("community-list.html")).toEqual(expected);
  });

  it("index.html lists items in the same order", () => {
    // The two pages that were stale in CI. If they ever disagree with each
    // other, one of them is rendering from an unsorted copy again.
    expect(itemOrderIn("index.html")).toEqual(expected);
  });

  it("both pages agree with each other, not merely with the sort", () => {
    expect(itemOrderIn("index.html")).toEqual(itemOrderIn("community-list.html"));
  });
});

describe("the generator owns its filenames, and prunes only those", () => {
  it("every .html committed under docs/ is one the generator would write", () => {
    // The orphan guard, asserted against the COMMITTED tree rather than a
    // temp dir. Re-keying two items on 2026-09-20 left
    // `item-item-local-*.html` behind — nine files where seven were wanted,
    // two of them serving a record the catalogue no longer describes, and
    // `--check` was blind because it only inspected what it was about to
    // write. This fails if that recurs.
    const html = readdirSync(DOCS).filter((f) => f.endsWith(".html"));
    expect(html.length).toBeGreaterThan(3);
    const items = sortedIds().filter((id) => id.startsWith("item/")).map((id) => `item-${slug(id)}.html`);
    const colls = sortedIds().filter((id) => id.startsWith("collection/")).map((id) => `collection-${slug(id)}.html`);
    const wanted = new Set(["index.html", "community-list.html", ...items, ...colls]);
    expect(html.filter((f) => !wanted.has(f))).toEqual([]);
    expect([...wanted].filter((f) => !html.includes(f))).toEqual([]);
  });

  it("OWNED matches what the generator emits", () => {
    for (const f of readdirSync(DOCS).filter((f) => f.endsWith(".html"))) {
      expect(OWNED.test(f)).toBe(true);
    }
  });

  it("OWNED spares what the generator did NOT write", () => {
    // The other half, and the one that makes pruning safe to run at all:
    // `deletion-requires-confirmation` is about artefacts an agent did not
    // create, so the pattern must not reach them. Checked by name rather than
    // by deleting anything.
    for (const f of ["hand-authored.html", ".nojekyll", "README.md", "assets", "index.json"]) {
      expect(OWNED.test(f)).toBe(false);
    }
  });
});
