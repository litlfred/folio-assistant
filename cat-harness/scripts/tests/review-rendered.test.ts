/**
 * The review page's rendered list (bean `bnjs`): the model it is drawn from.
 */
import { describe, expect, test } from "bun:test";

import { renderedModel } from "../review-rendered.js";

const impacts = [
  {
    $schema: "rendered-impact/v1",
    renderer: "document-site",
    method: "cone",
    files: [
      { path: "outline.json", change: "changed", role: "index", via: [] },
      { path: "dpi-h-ra/index.html", change: "changed", role: "content", via: [], anchors: ["prose:a", "prose:b"] },
      { path: "dpi-h-ra/media/f.png", change: "added", role: "data", via: [] },
    ],
    undetermined: [{ input: "dpi-h-ra.config.json", reason: "site-wide", scope: "all" }],
  },
];

describe("renderedModel", () => {
  const m = renderedModel(impacts, "https://x.github.io/smart-ra");

  test("one row per anchor, linked on the preview and on the before side, index files counted not listed", () => {
    expect(m.rows.map((r) => [r.path, r.anchor ?? null, r.after, r.before ?? null])).toEqual([
      ["dpi-h-ra/index.html", "prose:a", "../dpi-h-ra/index.html#prose%3Aa", "https://x.github.io/smart-ra/dpi-h-ra/index.html#prose%3Aa"],
      ["dpi-h-ra/index.html", "prose:b", "../dpi-h-ra/index.html#prose%3Ab", "https://x.github.io/smart-ra/dpi-h-ra/index.html#prose%3Ab"],
      // An ADDED file has no before side to link.
      ["dpi-h-ra/media/f.png", null, "../dpi-h-ra/media/f.png", null],
    ]);
    expect(m.indexCount).toBe(1);
    expect(m.renderers).toEqual(["document-site"]);
  });

  test("an input no renderer could place is carried as not known, with its scope", () => {
    expect(m.unknown).toEqual([{ renderer: "document-site", input: "dpi-h-ra.config.json", reason: "site-wide", scope: "all" }]);
  });

  test("a single impact object is accepted as well as an array; no main site means no before links", () => {
    const one = renderedModel(impacts[0], null);
    expect(one.rows.length).toBe(3);
    expect(one.rows.every((r) => r.before === undefined)).toBe(true);
  });
});
