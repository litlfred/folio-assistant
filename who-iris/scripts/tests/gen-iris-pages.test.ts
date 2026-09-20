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
