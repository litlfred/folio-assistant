/**
 * The rendered-impact contract (bean `bnjs`): a build diff, the review list,
 * and checking a cone prediction against a build.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { comparePrediction, diffBuiltSites, RENDERED_IMPACT_TAG, RenderedImpactSchema, reviewList, type RenderedImpact } from "./rendered-impact";

const T = mkdtempSync(join(tmpdir(), "rendered-impact-"));
afterAll(() => rmSync(T, { recursive: true, force: true }));
const put = (rel: string, body: string) => {
  mkdirSync(dirname(join(T, rel)), { recursive: true });
  writeFileSync(join(T, rel), body);
};

put("a/same.html", "x");
put("a/page.html", "old");
put("a/gone.html", "g");
put("a/assets/js/search-data.json", "{1}");
put("a/data/r.json", "{}");
put("b/same.html", "x");
put("b/page.html", "new");
put("b/new.html", "n");
put("b/assets/js/search-data.json", "{2}");
put("b/data/r.json", '{"x":1}');

describe("diffBuiltSites", () => {
  const d = diffBuiltSites(join(T, "a"), join(T, "b"), { renderer: "jekyll" });
  test("every added, changed and removed file, by content, with a role; unchanged files are absent", () => {
    expect(d.method).toBe("build-diff");
    expect(d.files.map((f) => [f.path, f.change, f.role])).toEqual([
      ["assets/js/search-data.json", "changed", "index"],
      ["data/r.json", "changed", "data"],
      ["gone.html", "removed", "content"],
      ["new.html", "added", "content"],
      ["page.html", "changed", "content"],
    ]);
  });
  test("the review list drops index files and nothing else", () => {
    expect(reviewList(d).map((f) => f.path)).toEqual(["data/r.json", "gone.html", "new.html", "page.html"]);
  });
});

describe("comparePrediction", () => {
  const impact = (method: "cone" | "build-diff", files: Array<[string, "content" | "data" | "index"]>): RenderedImpact =>
    RenderedImpactSchema.parse({ $schema: RENDERED_IMPACT_TAG, renderer: "r", method, files: files.map(([path, role]) => ({ path, change: "changed", role })) });

  test("a measured change the cone did not predict is MISSED; a content page whose bytes did not move is only unconfirmed", () => {
    const predicted = impact("cone", [["p.html", "content"], ["d/r.json", "data"]]);
    const measured = impact("build-diff", [["d/r.json", "data"], ["other.html", "content"]]);
    const c = comparePrediction(predicted, measured);
    expect(c.missed).toEqual(["other.html"]);
    expect(c.confirmed).toEqual(["d/r.json"]);
    expect(c.unconfirmed).toEqual([{ path: "p.html", role: "content" }]);
  });

  test("could-not-determine is carried, never read as no change", () => {
    const p = RenderedImpactSchema.parse({ $schema: RENDERED_IMPACT_TAG, renderer: "r", method: "cone", files: [], undetermined: [{ input: "sushi-config.yaml", reason: "site-wide", scope: "all" }] });
    expect(p.files).toEqual([]);
    expect(p.undetermined).toHaveLength(1);
  });
});
