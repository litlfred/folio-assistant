/**
 * A tile per declared visualisation — derived, never a second list.
 *
 * @module scripts/tests/graph-tiles.test
 */
import { describe, expect, test } from "bun:test";

import {
  graphTiles,
  publishedHref,
  tileFindings,
  tilesOn,
  undeclaredProjections,
  type TiledDirectory,
} from "../graph-tiles.js";
import { SubgraphCoverageSchema, visualisationsOf } from "../../schemas/cat-harness.js";

const dir = (id: string, coverage?: unknown, theme?: string): TiledDirectory => ({
  id,
  ...(coverage === undefined ? {} : { coverage: SubgraphCoverageSchema.parse(coverage) }),
  ...(theme === undefined ? {} : { theme }),
});

describe("a bare string still parses — the widening is additive", () => {
  test("27 declared paths in this repository must not need an edit", () => {
    // A widening that cost each of them one would be a required-field change
    // wearing an optional one's clothes, and every concurrent branch would pay
    // for it. That is the `dependents` lesson, recorded on this very schema.
    const cov = SubgraphCoverageSchema.parse({ visualiser: "docs/x/index.html" });
    expect(visualisationsOf(cov, "x")).toEqual([{ ref: "docs/x/index.html", title: "x" }]);
  });

  test("a list of visualisations parses too", () => {
    const cov = SubgraphCoverageSchema.parse({
      visualiser: [
        { ref: "docs/shelf.html", title: "Shelf" },
        { ref: "docs/map.html", title: "Map" },
      ],
    });
    expect(visualisationsOf(cov, "library").map((v) => v.title)).toEqual(["Shelf", "Map"]);
  });

  test("a title falls back to the directory's id — a tile is never blank", () => {
    const cov = SubgraphCoverageSchema.parse({ visualiser: [{ ref: "docs/x.html" }] });
    expect(visualisationsOf(cov, "library")[0]?.title).toBe("library");
  });

  test("no visualiser is an empty list, which is a real answer", () => {
    // Different from "declares one that does not resolve" — `flh4`'s
    // distinction, checked elsewhere.
    expect(visualisationsOf(undefined, "x")).toEqual([]);
    expect(visualisationsOf(SubgraphCoverageSchema.parse({ docs: "d.md" }), "x")).toEqual([]);
  });
});

describe("a tile is derived from the DECLARATION", () => {
  test("one per declared visualisation, and a directory with several gets several", () => {
    const tiles = graphTiles([
      dir("library", {
        visualiser: [{ ref: "a.html", title: "Shelf" }, { ref: "b.html", title: "Map" }],
      }),
      dir("beans", { visualiser: "beans.html" }),
      dir("nothing"),
    ]);
    expect(tiles.map((t) => t.id)).toEqual(["beans", "library/1", "library/2"]);
    expect(tiles.map((t) => t.title)).toEqual(["beans", "Shelf", "Map"]);
  });

  test("a directory with ONE visualisation gets its own name as the id", () => {
    // The index is part of the id only where it has to be: it is what a reader
    // sees in a URL fragment and what a test addresses it by.
    expect(graphTiles([dir("beans", { visualiser: "b.html" })])[0]?.id).toBe("beans");
  });

  test("a directory declaring none gets no tile — silence is not a tile", () => {
    expect(graphTiles([dir("qa"), dir("health", { docs: "d.md" })])).toEqual([]);
  });

  test("the order is the declaration's, so the artefact is generated and not a snapshot", () => {
    const tiles = graphTiles([
      dir("zed", { visualiser: "z.html" }),
      dir("alpha", { visualiser: "a.html" }),
    ]);
    expect(tiles.map((t) => t.directory)).toEqual(["alpha", "zed"]);
  });

  test("the tile carries the ref EXACTLY as declared — it opens the existing viewer", () => {
    // "those should open their exisiting visualzaiton". Nothing here builds a
    // viewer, and a tile that recomposed the path could reach a different one.
    const ref = "cat-harness/docs/beans/index.html";
    expect(graphTiles([dir("beans", { visualiser: ref })])[0]?.ref).toBe(ref);
  });
});

describe("surfaces: one declaration, per-surface visibility", () => {
  test("absent means BOTH — a tile that states nothing is complete", () => {
    expect(graphTiles([dir("x", { visualiser: "x.html" })])[0]?.surfaces).toEqual([
      "navbar",
      "board",
    ]);
  });

  test("a declared surface is the only one it appears on", () => {
    const tiles = graphTiles([
      dir("navbar-only", { visualiser: [{ ref: "a.html", surfaces: ["navbar"] }] }),
      dir("board-only", { visualiser: [{ ref: "b.html", surfaces: ["board"] }] }),
      dir("both", { visualiser: "c.html" }),
    ]);
    expect(tilesOn(tiles, "navbar").map((t) => t.directory)).toEqual(["both", "navbar-only"]);
    expect(tilesOn(tiles, "board").map((t) => t.directory)).toEqual(["board-only", "both"]);
  });

  test("ONE declaration drives both surfaces — never two lists to disagree", () => {
    // Q11. Two registries would be free to disagree about what a tile IS, and
    // the disagreement would be invisible.
    const tiles = graphTiles([dir("x", { visualiser: [{ ref: "a.html", title: "T" }] })]);
    for (const s of ["navbar", "board"] as const) {
      expect(tilesOn(tiles, s)[0]?.title).toBe("T");
      expect(tilesOn(tiles, s)[0]?.ref).toBe("a.html");
    }
  });
});

describe("visibility and theme default, and may be overridden", () => {
  test("hidden defaults to false and is declarable", () => {
    // Q9: declared default, reader may override. Only the DECLARED half is
    // here; a reader's hiding is theirs alone and is committed nowhere.
    expect(graphTiles([dir("x", { visualiser: "a.html" })])[0]?.hidden).toBe(false);
    expect(
      graphTiles([dir("x", { visualiser: [{ ref: "a.html", hidden: true }] })])[0]?.hidden,
    ).toBe(true);
  });

  test("a tile's theme falls back to the directory's, then to nothing", () => {
    // The same inherit-and-override rule `semantic-zoom.ts` encodes: a tile
    // that states nothing is complete, and absent means the instance's.
    expect(graphTiles([dir("x", { visualiser: "a.html" }, "library")])[0]?.theme).toBe("library");
    expect(
      graphTiles([dir("x", { visualiser: [{ ref: "a.html", theme: "own" }] }, "library")])[0]?.theme,
    ).toBe("own");
    expect(graphTiles([dir("x", { visualiser: "a.html" })])[0]?.theme).toBeUndefined();
  });
});

describe("a live projection with no declaration is a FINDING — `flh4`'s third state", () => {
  const dirs = [
    dir("uploads", { visualiser: "u.html" }),
    dir("beans"),
    dir("qa"),
  ];
  const published = (id: string) => id === "uploads" || id === "beans";

  test("it is reported, not silently given a tile", () => {
    // A tile appearing without a declaration would make the audit that reports
    // the gap look wrong.
    expect(undeclaredProjections(dirs, published)).toEqual(["beans"]);
    expect(graphTiles(dirs).map((t) => t.directory)).toEqual(["uploads"]);
  });

  test("a directory with neither is NOT a finding — nothing is missing there", () => {
    expect(undeclaredProjections(dirs, published)).not.toContain("qa");
  });

  test("a directory with both is not a finding either", () => {
    expect(undeclaredProjections(dirs, published)).not.toContain("uploads");
  });

  test("the finding names the repair, not the symptom", () => {
    const [f] = tileFindings("cat-harness", dirs, published);
    expect(f).toContain("beans");
    expect(f).toContain("coverage.visualiser");
    expect(f).toContain("Declare it");
  });
});

describe("a declared path is NOT a published URL — `prc5` one layer down", () => {
  const SITE = "cat-harness/docs";

  test("the site directory's prefix is stripped and `index.html` becomes the route", () => {
    // The mistake already paid for: a tile carrying `docs/assets/…` 404'd for
    // every reader, because the build copies the site directory's CONTENTS to
    // the mount and the declared prefix is exactly what a URL does not carry.
    expect(publishedHref(SITE, "cat-harness/docs/beans/index.html")).toBe("/beans/");
    expect(publishedHref(SITE, "cat-harness/docs/cat-harness/schemas/x/index.html")).toBe(
      "/cat-harness/schemas/x/",
    );
  });

  test("a page that is not `index.html` keeps its filename", () => {
    expect(publishedHref(SITE, "cat-harness/docs/guides/x.html")).toBe("/guides/x.html");
  });

  test("A NAMED MARKDOWN PAGE BECOMES `.html`, because Jekyll serves no `.md`", () => {
    // The half the first fix missed. `index.md` was rewritten to the directory
    // route on 2026-09-21, when `fsh-guts` became the first markdown viewer —
    // and a viewer named anything else kept its `.md`, which is the identical
    // 404 the comment above argues against.
    //
    // Measured 2026-09-22: `processes-index.md` produced `href:
    // "/processes-index.md"`, a tile pointing at a SOURCE file. `pb04` — a
    // dead link is worse than no link.
    expect(publishedHref(SITE, "cat-harness/docs/processes-index.md")).toBe("/processes-index.html");
    expect(publishedHref(SITE, "cat-harness/docs/guides/x.md")).toBe("/guides/x.html");
  });

  test("...and the directory form still wins where both would apply", () => {
    // `index.md` must reach `/x/`, not `/x/index.html`: two spellings of one
    // page are two entries in a reader's history, which is why the directory
    // rewrite exists at all. The `.md` mapping must not undo it.
    expect(publishedHref(SITE, "cat-harness/docs/processes/index.md")).toBe("/processes/");
    expect(publishedHref(SITE, "cat-harness/docs/tools/index.md")).toBe("/tools/");
  });

  test("a ref OUTSIDE the site gets no href rather than a guessed one", () => {
    // `pb04`: a tile with no href is not a link, which is better than a link
    // to nowhere. Guessing would turn a viewer this site does not serve into a
    // 404 that reads as a broken page.
    expect(publishedHref(SITE, "elsewhere/viewer.html")).toBeUndefined();
    expect(publishedHref(SITE, "cat-harness/docsomething/x.html")).toBeUndefined();
  });

  test("tiles carry the href only when a site directory is supplied", () => {
    const dirs = [dir("beans", { visualiser: "cat-harness/docs/beans/index.html" })];
    expect(graphTiles(dirs)[0]?.href).toBeUndefined();
    expect(graphTiles(dirs, SITE)[0]?.href).toBe("/beans/");
  });

  test("an unservable ref leaves the tile unlinked but still present", () => {
    // The tile is what says the visualisation was DECLARED. Dropping it would
    // lose that; linking it would lie about where it goes.
    const tiles = graphTiles([dir("x", { visualiser: "elsewhere/v.html" })], SITE);
    expect(tiles.length).toBe(1);
    expect(tiles[0]?.href).toBeUndefined();
    expect(tiles[0]?.ref).toBe("elsewhere/v.html");
  });
});
