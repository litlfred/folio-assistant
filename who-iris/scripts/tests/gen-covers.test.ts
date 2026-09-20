/**
 * The covers are OURS, and the catalogue has to say so.
 *
 * @module who-iris/scripts/tests/gen-covers.test
 *
 * DSpace generates a `THUMBNAIL` bundle of its own, so a cover this repository
 * rasterised is filed under the same bundle name as one IRIS produced and
 * nothing downstream can tell them apart from the name. The refusal below is
 * the only thing that keeps them apart, so it is the thing tested — against
 * the REAL catalogue, not a fixture, because a fixture would pass on the day
 * somebody removed the declaration from a real node.
 */
import { describe, expect, it } from "bun:test";
import { createHash } from "crypto";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";

import { coversWanted, nodes, COVER_WIDTH, DERIVED_MARKER } from "../gen-covers.js";

const INSTANCE = resolve(import.meta.dir, "..", "..");

describe("the catalogue asks for the covers, not the script", () => {
  const all = nodes();
  const { covers, problems } = coversWanted(all);

  it("the real catalogue yields covers and no problems", () => {
    expect(problems).toEqual([]);
    expect(covers.length).toBeGreaterThan(0);
  });

  it("every declared cover's bytes exist and match its recorded digest", () => {
    // R13, discharged for the case this script owns. `yl5w` is the general
    // version and is still open: three ORIGINAL bitstreams in this same
    // catalogue claim `materialized` and resolve to nothing, and
    // `check:catalogue` does not look at `localPath` at all.
    for (const c of covers) {
      const abs = join(INSTANCE, c.outPath);
      expect(existsSync(abs)).toBe(true);
      const sha = createHash("sha256").update(readFileSync(abs)).digest("hex");
      expect(c.declaredSha).toBe(sha);
    }
  });

  it("every cover is the declared width, and the height is the page's own", () => {
    // Width is shared so a listing has one column; height is NOT, and that is
    // the point. The three are 2:3, 0.705:1 and a scanned page — a forced
    // height would letterbox or crop two of them.
    const ratios = new Set<string>();
    for (const c of covers) {
      expect(c.declaredW).toBe(COVER_WIDTH);
      expect(c.declaredH).toBeGreaterThan(0);
      ratios.add((c.declaredH! / c.declaredW!).toFixed(3));
    }
    expect(ratios.size).toBeGreaterThan(1);
  });
});

describe("a THUMBNAIL that does not declare itself derived is refused", () => {
  const all = nodes();

  it("stripping the declaration turns a cover into a problem", () => {
    const withCover = all.find((n) => n.bitstreams?.some((b) => b.bundle === "THUMBNAIL"));
    expect(withCover).toBeDefined();

    const stripped = JSON.parse(JSON.stringify(withCover)) as typeof withCover;
    const thumb = stripped!.bitstreams!.find((b) => b.bundle === "THUMBNAIL")!;
    thumb.materialization.note = "a cover";

    const { covers, problems } = coversWanted([stripped!]);
    expect(covers).toEqual([]);
    expect(problems.length).toBe(1);
    expect(problems[0]).toContain("does not declare itself derived");
  });

  it("the marker is a substring of an AUTHORED note, not something generated", () => {
    // If the script wrote the sentence it checks for, the check would be
    // circular and would pass over any node the script had ever touched.
    for (const n of all) {
      const thumb = n.bitstreams?.find((b) => b.bundle === "THUMBNAIL");
      if (!thumb) continue;
      const note = thumb.materialization.note ?? "";
      expect(note).toContain(DERIVED_MARKER);
      // An authored note says more than the marker: which file, which tool,
      // which page, and why `of` is a local URI rather than the Handle.
      expect(note.length).toBeGreaterThan(DERIVED_MARKER.length * 4);
      expect(note).toContain("pdf-cover.py");
    }
  });

  it("no cover claims the Handle as what it was derived FROM", () => {
    // R12, one step on: the Handle identifies the ITEM. Putting it on a
    // rendering asserts IRIS supplied the image.
    for (const n of all) {
      const thumb = n.bitstreams?.find((b) => b.bundle === "THUMBNAIL");
      if (!thumb) continue;
      expect(thumb.materialization.of).toStartWith("local:");
      expect(thumb.materialization.of).not.toContain("iris.who.int");
    }
  });

  it("no cover is archival — a rendering answers no source-loss question", () => {
    for (const n of all) {
      const thumb = n.bitstreams?.find((b) => b.bundle === "THUMBNAIL");
      if (!thumb) continue;
      expect(thumb.materialization.purpose).toBe("working");
      expect(thumb.materialization.gates?.sourceLoss.verdict).not.toBe("permitted");
    }
  });
});
