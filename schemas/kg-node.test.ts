/**
 * Landing backdrops: one logical image is several files, and a renderer must
 * be able to tell which one it got.
 *
 * @module schemas/kg-node.test
 */
import { describe, expect, test } from "bun:test";

import {
  ImageRegionSchema,
  KgImageSchema,
  imagesForRole,
  pickLayout,
  displayTitle,
  type KgImage,
} from "./kg-node";

describe("displayTitle", () => {
  test("title, else name, else id — never blank for a node with an id", () => {
    // A blank label in a sidebar reads as a renderer bug, not a missing field.
    expect(displayTitle({ id: "x", name: "n", title: "t" })).toBe("t");
    expect(displayTitle({ id: "x", name: "n" })).toBe("n");
    expect(displayTitle({ id: "x" })).toBe("x");
  });
});

describe("landing backdrops — layout variants", () => {
  const laptop: KgImage = {
    id: "landing-laptop", src: "a.webp", role: "landing", layout: "laptop",
    width: 1671, height: 941, textRegion: { x: 0.205, y: 0.285, w: 0.625, h: 0.235 },
  };
  const mobile: KgImage = { id: "landing-mobile", src: "b.webp", role: "landing", layout: "mobile" };
  const mark: KgImage = { id: "mark", src: "m.svg", role: "mark" };

  test("variants are grouped by role and keyed by layout", () => {
    const m = imagesForRole([laptop, mobile, mark], "landing");
    expect([...m.keys()].sort()).toEqual(["laptop", "mobile"]);
  });

  test("a layout-independent image is not a variant of anything", () => {
    // An SVG mark is the same file everywhere and must not be handed back as
    // though it were cut for a viewport.
    expect(imagesForRole([mark], "mark").size).toBe(0);
  });

  test("an exact layout match reports NO substitution", () => {
    const p = pickLayout([laptop, mobile], "landing", "mobile");
    expect(p.image?.id).toBe("landing-mobile");
    expect(p.substituted).toBeUndefined();
  });

  test("a missing layout falls back AND says which it used", () => {
    // A phone served the laptop crop is a real degradation: that crop's text
    // region is wrong for it, so the overlay lands somewhere nobody chose. A
    // renderer that cannot tell it happened will ship that.
    const p = pickLayout([laptop], "landing", "mobile");
    expect(p.image?.id).toBe("landing-laptop");
    expect(p.substituted).toBe("laptop");
  });

  test("no variant at all is a THIRD state, not a substitution", () => {
    const p = pickLayout([mark], "landing", "laptop");
    expect(p.image).toBeUndefined();
    expect(p.substituted).toBeUndefined();
  });

  test("a region running off the edge is rejected, not clamped", () => {
    // Clamping silently moves the text somewhere nobody chose — the exact
    // failure this field exists to prevent.
    expect(() => ImageRegionSchema.parse({ x: 0.8, y: 0.1, w: 0.5, h: 0.2 })).toThrow();
    expect(() => ImageRegionSchema.parse({ x: 0.1, y: 0.9, w: 0.2, h: 0.5 })).toThrow();
    expect(ImageRegionSchema.parse({ x: 0.205, y: 0.285, w: 0.625, h: 0.235 })).toBeTruthy();
  });

  test("a zero-width region is rejected", () => {
    expect(() => ImageRegionSchema.parse({ x: 0, y: 0, w: 0, h: 0.2 })).toThrow();
  });

  test("the declared laptop variant parses with its region", () => {
    expect(KgImageSchema.parse(laptop)).toBeTruthy();
  });
});

describe("this instance's own declaration", () => {
  test("the laptop backdrop is declared, with a region inside the cloud", async () => {
    // Guards the numbers that were found by rendering candidates and looking
    // at them — a later re-crop of the image must not silently keep a region
    // measured against the old one.
    const { readDeclaration } = await import("./cat-harness");
    const decl = readDeclaration(new URL("..", import.meta.url).pathname);
    const p = pickLayout(decl?.images, "landing", "laptop");
    expect(p.image?.src).toContain("landing-laptop");
    expect(p.image?.textRegion).toEqual({ x: 0.205, y: 0.285, w: 0.625, h: 0.235 });
  });
});
