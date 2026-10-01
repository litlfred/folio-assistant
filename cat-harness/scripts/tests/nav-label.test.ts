/**
 * `lib/nav-label.ts`: the one source of every navigation label.
 *
 * Owner, 2026-10-01, bean `ob3m` finding 6, option 1 of 4, "One name
 * everywhere". Each test below pins a way the same page came to carry two
 * names before the module existed, measured on PR #1762's head:
 *
 * - the rail printed the kind WORD (`docs`, `methodology`) where the glass
 *   printed a title ("Docs — cat-harness", "Methodologies");
 * - a tile with no declared title fell back to its DIRECTORY id (`root-docs`);
 * - two kinds drawn by one viewer (`schemas`, `cat-harness`) were two names
 *   for one page;
 * - the harness was folded INTO the base name ("Docs — cat-harness") rather
 *   than appended beside it.
 */
import { describe, expect, test } from "bun:test";

import {
  harnessTitle,
  kindTitle,
  labelText,
  labelVisualisations,
  normaliseDestination,
  stripQualifier,
  tileLabel,
} from "../lib/nav-label.js";
import { GraphKindRegistry } from "../../schemas/graph-kind-registry.js";

describe("a kind is called by its display name, never its kind word", () => {
  test("the registered title is used", () => {
    expect(kindTitle("docs")).toBe("Docs");
    expect(kindTitle("methodology")).toBe("Methodologies");
    expect(kindTitle("external-schema")).toBe("External schemas");
    expect(kindTitle("skills")).toBe("Skills");
  });

  test("a kind with no title is capitalised, with hyphens read as spaces", () => {
    const reg = new GraphKindRegistry();
    reg.register("probe-kind", { renderable: false, holds: "content", summary: "x" });
    expect(kindTitle("probe-kind", reg)).toBe("Probe kind");
    expect(kindTitle("never-registered", reg)).toBe("Never registered");
  });
});

describe("a harness is its declared title", () => {
  test("title first, name when there is none", () => {
    expect(harnessTitle({ name: "cat-harness", title: "C@T Harness" })).toBe("C@T Harness");
    expect(harnessTitle({ name: "smart-trust" })).toBe("smart-trust");
    expect(harnessTitle({ name: "x", title: "  " })).toBe("x");
  });
});

describe("the harness is a qualifier, not part of the base name", () => {
  test("a harness suffix is stripped from a declared title", () => {
    expect(stripQualifier("Docs — cat-harness", ["cat-harness"])).toBe("Docs");
    expect(stripQualifier("Skills - who-iris", ["who-iris"])).toBe("Skills");
  });

  test("a dash that is part of the title's meaning stays", () => {
    expect(stripQualifier("Thinking about it — wide", ["cat-harness"])).toBe("Thinking about it — wide");
    expect(stripQualifier("Latent semantic indexes")).toBe("Latent semantic indexes");
  });

  test("label and qualifier read as one line where both are text", () => {
    expect(labelText({ label: "Skills", qualifier: "C@T Harness" })).toBe("Skills · C@T Harness");
    expect(labelText({ label: "Skills" })).toBe("Skills");
  });
});

describe("a tile's label", () => {
  test("an undeclared title takes the directory's first kind, NEVER the directory id", () => {
    // `root-docs` was the tile's title on the glass while the rail said `docs`.
    expect(tileLabel({ id: "root-docs", graphKinds: ["docs"] }, undefined)).toBe("Docs");
  });

  test("a declared title wins, with any harness suffix stripped", () => {
    expect(tileLabel({ id: "qa", graphKinds: ["qa"] }, "Latent semantic indexes")).toBe("Latent semantic indexes");
    expect(tileLabel({ id: "docs", graphKinds: ["docs"] }, "Docs — cat-harness", ["cat-harness"])).toBe("Docs");
  });
});

describe("two kinds on one page share one name", () => {
  test("both rows take the name of the kind the directory declares first, and the second is marked", () => {
    const rows: { kind: string; path?: string; label?: string; sameAs?: string }[] = [
      { kind: "cat-harness", path: "/cat-harness/schemas/cat-harness/" },
      { kind: "docs", path: "/docs/" },
      { kind: "schemas", path: "/cat-harness/schemas/cat-harness/" },
      { kind: "code" },
    ];
    labelVisualisations(rows, [{ graphKinds: ["docs"] }, { graphKinds: ["schemas", "cat-harness"] }, { graphKinds: ["code"] }]);
    expect(rows.map((r) => r.label)).toEqual(["Schemas", "Docs", "Schemas", "Code"]);
    expect(rows.map((r) => r.sameAs)).toEqual(["schemas", undefined, undefined, undefined]);
  });

  test("a row with no page is named for its own kind", () => {
    const rows: { kind: string; path?: string; label?: string }[] = [{ kind: "waiver" }, { kind: "memory" }];
    labelVisualisations(rows, [{ graphKinds: ["memory", "waiver"] }]);
    expect(rows.map((r) => r.label)).toEqual(["Waivers", "Memory"]);
  });
});

describe("a destination is compared by its normalised href", () => {
  test("baseurl, index.html and doubled slashes do not make two destinations", () => {
    expect(normaliseDestination("/folio-assistant/tools/index.html", "/folio-assistant")).toBe("/tools/");
    expect(normaliseDestination("tools//")).toBe("/tools/");
  });

  test("the fragment is kept, because a landing section is not the landing", () => {
    expect(normaliseDestination("/#harness-cat-harness")).toBe("/#harness-cat-harness");
    expect(normaliseDestination("/")).toBe("/");
  });

  test("an external URL is not a destination here", () => {
    expect(normaliseDestination("https://github.com/litlfred/folio-assistant")).toBeUndefined();
    expect(normaliseDestination("")).toBeUndefined();
  });
});
