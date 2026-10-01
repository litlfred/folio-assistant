/**
 * The LSI viewer page works for its reader, over the REAL committed indexes —
 * not only that it is current (`lsi:viz:check` asks that), but that what it
 * says resolves: every unit it names is a file in this checkout, every
 * committed index has its section, every declared prose graph has a verdict
 * row, and every table row has the columns its header promises.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { readIndexes, renderFrom } from "../gen-lsi-viz.ts";
import { proseGraphs } from "../lsi.ts";

const REPO = resolve(import.meta.dir, "../../..");
// Read once, from the checkout or (with no index directory in it) from the
// qa-reports branch. Not `render()`: that throws when nothing could be read,
// and a throw at load would fail this file without saying which test, or why.
const read = readIndexes();
const drawn = renderFrom(read);
const page = drawn.state === "hit" ? drawn.page : "";
// The tests below are about a page. With none drawn they are SKIPPED, not
// passed, and the first test fails with the read's state and reason, so the
// one cause is reported once rather than as five unrelated-looking failures.
const onPage = test.if(drawn.state === "hit");

describe("the LSI viewer page", () => {
  test("could be drawn — a miss is reported with its reason, never as an empty page", () => {
    expect(drawn.state === "hit" ? "hit" : `${drawn.state}: ${drawn.reason}`).toBe("hit");
  });

  onPage("is exactly what is committed", () => {
    expect(readFileSync(join(REPO, "cat-harness/docs/lsi/index.md"), "utf8")).toBe(page);
  });

  onPage("has a section for every index it read", () => {
    const files = read.state === "hit" ? read.files : [];
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const s = JSON.parse(read.state === "hit" ? read.src.read(relative(REPO, f))! : "{}");
      expect(page).toContain("## " + s.instance + " / " + s.graph);
    }
  });

  onPage("has a verdict row for every declared prose graph", () => {
    for (const t of proseGraphs()) expect(page).toContain("| `" + t.instance + "/" + t.id + "` |");
  });

  onPage("every unit it names is a file in this checkout", () => {
    const named = [...page.matchAll(/`([^`\s]+\/sections\/[^`\s]+\.md|[^`\s]+\.md)`/g)].map((m) => m[1]).filter((p) => p.includes("/"));
    expect(named.length).toBeGreaterThan(0);
    for (const p of named) if (!p.startsWith("scripts/")) expect(existsSync(join(REPO, p))).toBe(true);
  });

  onPage("every table row has as many cells as its header", () => {
    let cols = 0;
    for (const line of page.split("\n")) {
      if (!line.startsWith("|")) { cols = 0; continue; }
      const cells = line.replace(/\\\|/g, "").split("|").length - 2;
      if (cols === 0) cols = cells;
      else expect(cells).toBe(cols);
    }
  });
});
