/**
 * Bean `qgjh`: the catalogue page's rows lead somewhere. A collection or item
 * links to the replica page this generator writes for it; a "held as" library
 * id links to the library viewer opened on it. Asserted over the COMMITTED
 * page, since what a reader follows is what was published.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { siteDirFor } from "../../platform.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const REPO = resolve(INSTANCE, "..");
const HARNESS = join(REPO, "cat-harness");
const PAGE = join(HARNESS, siteDirFor(HARNESS), "cat-harness", "catalogue", "who-iris", "index.html");
const html = existsSync(PAGE) ? readFileSync(PAGE, "utf-8") : "";
// Matched by TEXT, not by exact markup: the rail step gives an id-less heading
// an id (#1757), so `<h2>Every node</h2>` is `<h2 id="…">Every node</h2>`.
const table = html.slice(html.search(/<h2\b[^>]*>Every node<\/h2>/));
const nodes = table.slice(0, table.indexOf("</table>"));

describe("the catalogue's rows lead somewhere (qgjh)", () => {
  it("links every replica page it names, and each is a page this repository writes", () => {
    const pages = [...nodes.matchAll(/href="[^"#]*\/((?:item|collection)-[^"]+\.html)"/g)].map((m) => m[1]!);
    // The premise: a table with no links would pass the loop below.
    expect(pages.length).toBeGreaterThan(0);
    // `site/` since bean `2b5s`: the replica left `library/`, which is corpus only.
    for (const p of pages) expect(existsSync(join(INSTANCE, "site", p)), p).toBe(true);
  });

  it("links a held-as library id to the viewer page, which exists", () => {
    const viewers = [...nodes.matchAll(/href="([^"#]*)#[^"]+"><code>/g)].map((m) => m[1]!);
    expect(viewers.length).toBeGreaterThan(0);
    for (const v of new Set(viewers)) {
      expect(existsSync(join(PAGE, "..", v, "index.html")), v).toBe(true);
    }
  });
});
