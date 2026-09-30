/**
 * The LSI viewer page works for its reader, over the REAL committed indexes —
 * not only that it is current (`lsi:viz:check` asks that), but that what it
 * says resolves: every unit it names is a file in this checkout, every
 * committed index has its section, every declared prose graph has a verdict
 * row, and every table row has the columns its header promises.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { render } from "../gen-lsi-viz.ts";
import { proseGraphs } from "../lsi.ts";

const REPO = resolve(import.meta.dir, "../../..");
const page = render();

function sidecarFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) sidecarFiles(p, out);
    else if (e.name.endsWith(".lsi.json")) out.push(p);
  }
  return out;
}

describe("the LSI viewer page", () => {
  test("is exactly what is committed", () => {
    expect(readFileSync(join(REPO, "cat-harness/docs/lsi/index.md"), "utf8")).toBe(page);
  });

  test("has a section for every committed index", () => {
    const files = sidecarFiles(join(REPO, "cat-harness/test/results/lsi"));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const s = JSON.parse(readFileSync(f, "utf8"));
      expect(page).toContain("## " + s.instance + " / " + s.graph);
    }
  });

  test("has a verdict row for every declared prose graph", () => {
    for (const t of proseGraphs()) expect(page).toContain("| `" + t.instance + "/" + t.id + "` |");
  });

  test("every unit it names is a file in this checkout", () => {
    const named = [...page.matchAll(/`([^`\s]+\/sections\/[^`\s]+\.md|[^`\s]+\.md)`/g)].map((m) => m[1]).filter((p) => p.includes("/"));
    expect(named.length).toBeGreaterThan(0);
    for (const p of named) if (!p.startsWith("scripts/")) expect(existsSync(join(REPO, p))).toBe(true);
  });

  test("every table row has as many cells as its header", () => {
    let cols = 0;
    for (const line of page.split("\n")) {
      if (!line.startsWith("|")) { cols = 0; continue; }
      const cells = line.replace(/\\\|/g, "").split("|").length - 2;
      if (cols === 0) cols = cells;
      else expect(cells).toBe(cols);
    }
  });
});
