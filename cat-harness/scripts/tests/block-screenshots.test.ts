/** The visual diff Tool's pure parts (bean 0rxe). The browser run is in cat-harness/test/block-screenshots.e2e.ts. */
import { describe, expect, test } from "bun:test";

import { DIFF_RENDERERS } from "../../schemas/diff-renderers.js";
import { VISUAL_KINDS, comparePixels, pageOf, safeName, visualChanges } from "../block-screenshots.js";

const img = (w: number, h: number, rgba: [number, number, number, number]) => ({
  width: w,
  height: h,
  data: Uint8ClampedArray.from({ length: w * h * 4 }, (_, i) => rgba[i % 4]!),
});

describe("comparePixels", () => {
  test("identical pictures: nothing changed", () => {
    expect(comparePixels(img(4, 3, [10, 20, 30, 255]), img(4, 3, [10, 20, 30, 255]), 24).changed).toBe(0);
  });

  test("differences within the tolerance are anti-aliasing, not change", () => {
    expect(comparePixels(img(2, 2, [100, 100, 100, 255]), img(2, 2, [120, 100, 100, 255]), 24).changed).toBe(0);
    expect(comparePixels(img(2, 2, [100, 100, 100, 255]), img(2, 2, [130, 100, 100, 255]), 24).changed).toBe(1);
  });

  test("one changed pixel of four is a quarter, and is marked in the diff", () => {
    const a = img(2, 2, [0, 0, 0, 255]);
    const b = img(2, 2, [0, 0, 0, 255]);
    b.data[4] = 255; // pixel (1,0) goes red
    const r = comparePixels(a, b, 24);
    expect(r.changed).toBe(0.25);
    expect(Array.from(r.diff.slice(4, 8))).toEqual([214, 51, 132, 255]);
    expect(r.diff[0]).toBeGreaterThan(150); // unchanged: faded, not the marker colour
  });

  test("a size change counts the uncovered area as changed", () => {
    const r = comparePixels(img(2, 2, [0, 0, 0, 255]), img(2, 4, [0, 0, 0, 255]), 24);
    expect([r.width, r.height, r.changed]).toEqual([2, 4, 0.5]);
  });

  test("is self-contained, so the page runs exactly this function", () => {
    const again = new Function(`return (${comparePixels.toString()})`)();
    expect(again(img(1, 1, [0, 0, 0, 255]), img(1, 1, [255, 0, 0, 255]), 24).changed).toBe(1);
  });
});

describe("which blocks get a picture", () => {
  const at = (file: string, kind: string) => ({ file, kind });
  test("only visual kinds, on whichever side has the block", () => {
    const got = visualChanges([
      { change: "changed", label: "fig:a", head: at("doc/a.ts", "figure"), base: at("doc/a.ts", "figure") },
      { change: "changed", label: "prose:b", head: at("doc/b.ts", "prose"), base: at("doc/b.ts", "prose") },
      { change: "removed", label: "tbl:c", base: at("doc/c.ts", "table") },
    ]);
    expect(got.map((c) => c.label)).toEqual(["fig:a", "tbl:c"]);
  });

  test("the page is the manifest's first segment, kept to one safe segment", () => {
    expect(pageOf({ file: "handbook/ch1/fig.ts" })).toBe("handbook/index.html");
    expect(pageOf({ file: "../evil/x.ts" })).toBeNull();
    expect(pageOf(undefined)).toBeNull();
    expect(safeName("fig:dose-curve")).toBe("fig_dose-curve");
  });

  test("the visual renderer defaults for exactly the kinds the Tool pictures", () => {
    const visual = DIFF_RENDERERS.find((r) => r.id === "visual")!;
    expect([...visual.defaultFor].sort()).toEqual([...VISUAL_KINDS].sort());
  });
});
