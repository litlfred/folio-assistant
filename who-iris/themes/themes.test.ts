/**
 * Tests for the two WHO themes, bean `j66n`.
 *
 * ## These read the SOURCES, not a copy of the constants
 *
 * A theme test that compares `IRIS_WEB.palette.accent` against `"#008dc9"`
 * tests nothing: both sides move together in one edit. So every colour, column
 * width and page dimension below is re-read from the artefact it was measured
 * from — `client-theme.css` out of the committed capture zip, and the style
 * guide's own ingested page text — and the theme is asserted to agree.
 *
 * That makes the tests a **freshness** check as well as a correctness one. If
 * the capture is re-taken and IRIS has re-skinned, these fail rather than the
 * theme going on describing a site that no longer looks like that.
 *
 * @module who-iris/themes/themes.test
 */
import { describe, expect, it } from "bun:test";
import { execFileSync } from "child_process";
import { readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";

import {
  RECORDED_CONTRADICTIONS,
  THEME_INSTANCE,
  WHO_THEMES,
  WPRO_PRIMARY_PALETTE,
  whoThemeById,
} from "./themes.js";
import { ResolvedThemeSchema, themeKey } from "../../cat-harness/schemas/theme.js";

const INSTANCE = resolve(import.meta.dir, "..");
const CAPTURE = join(
  INSTANCE,
  "uploads/wpr-rdo-2020-003-eng/iris-capture",
  "Publication and information products style guide_files.zip",
);
const SECTIONS = join(INSTANCE, "library/wpr-rdo-2020-003-eng/sections");

/**
 * `client-theme.css`, read out of the committed zip.
 *
 * Unzipped at read time rather than extracted into the repository: the capture
 * is the artefact of record and a second copy on disk is a thing that can
 * drift from it. 570 KB, read once.
 */
function clientThemeCss(): string {
  return execFileSync(
    "unzip",
    ["-p", CAPTURE, "Publication and information products style guide_files/client-theme.css"],
    { encoding: "utf-8", maxBuffer: 8 * 1024 * 1024 },
  );
}

/** One `--custom-property: value` declaration, as the stylesheet spells it. */
function cssVar(css: string, name: string): string | undefined {
  const m = css.match(new RegExp(`--${name}\\s*:\\s*([^;!}]+)`));
  return m?.[1].trim();
}

function page(n: number): string {
  return readFileSync(join(SECTIONS, `page-${String(n).padStart(3, "0")}.md`), "utf-8");
}

const CSS = clientThemeCss();
const IRIS = whoThemeById("iris-web")!;
const PUB = whoThemeById("who-wpro-publication")!;

describe("both themes exist and resolve", () => {
  it("resolves two themes, one of each screen/print kind", () => {
    expect(WHO_THEMES.map((t) => t.id).sort()).toEqual(["iris-web", "who-wpro-publication"]);
    expect(IRIS.kind).toBe("webpage");
    expect(PUB.kind).toBe("publication");
  });

  it("each passes the platform's RESOLVED schema, where requiredness lives", () => {
    for (const t of WHO_THEMES) expect(() => ResolvedThemeSchema.parse(t)).not.toThrow();
  });

  it("is keyed by instance, because ids are not unique across instances", () => {
    expect(themeKey(THEME_INSTANCE, IRIS.id)).toBe("who-iris:iris-web");
  });
});

describe("iris-web is what the captured stylesheet actually says", () => {
  it("the capture is present and is the DSpace theme", () => {
    expect(CSS.length).toBeGreaterThan(500_000);
    expect(CSS).toContain("--ds-header-logo-height");
  });

  it("`accent` is `--primary`, NOT the prettier `--blue`", () => {
    // The one substantive judgement in this theme. `--blue` is a Bootstrap
    // SCALE entry; `--primary` is the ROLE. DSpace sets them differently here
    // on purpose, and taking the brand-looking one would be the hardcoding
    // `theme.ts` exists to end.
    expect(cssVar(CSS, "primary")).toBe("#008dc9");
    expect(cssVar(CSS, "blue")).toBe("#2B4E72");
    expect(IRIS.palette.accent).toBe("#008dc9");
    expect(IRIS.palette.accent).not.toBe(cssVar(CSS, "blue"));
  });

  it("`edge` is the navbar's own bottom border", () => {
    expect(cssVar(CSS, "ds-header-navbar-border-bottom-color")).toBe("#ced4da");
    expect(IRIS.palette.edge).toBe("#ced4da");
  });

  it("`ink` and `surface` are the body's declared colour and background", () => {
    const body = CSS.match(/body\{margin:0;[^}]*\}/)?.[0] ?? "";
    expect(body).toContain("color:#212529");
    expect(body).toContain("background-color:#fff");
    expect(IRIS.palette.ink).toBe("#212529");
    expect(IRIS.palette.surface).toBe("#ffffff");
  });

  it("declares no gradient, because the source declares none", () => {
    expect(IRIS.palette.gradientFrom).toBeUndefined();
    expect(IRIS.palette.gradientTo).toBeUndefined();
  });

  it("`minWidth` values are real COLUMN widths, not breakpoints", () => {
    // A breakpoint is a viewport; minWidth is documented as a column width.
    // The widest `.container` max-width and the named sidebar width are
    // columns; 992px is not, and must not appear here.
    const containers = [...CSS.matchAll(/\.container\{max-width:(\d+)px\}/g)].map((m) => m[1]);
    expect(containers).toEqual(["540", "720", "960", "1140"]);
    expect(IRIS.layouts).toMatchObject({ laptop: { minWidth: "1140px" } });

    expect(cssVar(CSS, "ds-sidebar-items-width")).toBe("250px");
    expect(IRIS.layouts).toMatchObject({ card: { minWidth: "250px" } });

    const widths = Object.values(IRIS.layouts).map((l) => (l as { minWidth: string }).minWidth);
    expect(widths).not.toContain("992px");
  });

  it("`padding` is the theme's one declared content spacing", () => {
    expect(cssVar(CSS, "ds-content-spacing")).toBe("1.5rem");
    for (const l of Object.values(IRIS.layouts)) {
      expect((l as { padding: string }).padding).toBe("1.5rem");
    }
  });

  it("`fontScale` is 1 everywhere, and that is MEASURED — the source declares no per-breakpoint scale", () => {
    expect(CSS).toContain("font-size:1rem");
    for (const l of Object.values(IRIS.layouts)) {
      expect((l as { fontScale: number }).fontScale).toBe(1);
    }
  });
});

describe("who-wpro-publication is what the style guide's own pages say", () => {
  it("`accent` is the WPRO logo blue, and pages 6 and 12 agree on the RGB", () => {
    expect(page(6)).toContain("R: 0 G: 147 B: 213");
    expect(page(12)).toContain("B: 213");
    expect(PUB.palette.accent).toBe("#0093D5"); // 0, 147, 213
  });

  it("the three PRINT formats are page 18's, in the source's own units", () => {
    const p18 = page(18);
    expect(p18).toContain("Frequently used formats and specs");
    expect(p18).toContain("21 cm x 29.7 cm");
    expect(p18).toContain("14.8 cm x 21 cm");
    expect(PUB.layouts).toEqual({
      a4: { width: "21cm", height: "29.7cm", margin: "1cm", fontScale: 1 },
      a5: { width: "14.8cm", height: "21cm", margin: "1cm", fontScale: 1 },
      a5Landscape: { width: "21cm", height: "14.8cm", margin: "1cm", fontScale: 1 },
    });
  });

  it("`margin` is the 1 cm logo EXCLUSION ZONE from page 7, not an invented page margin", () => {
    expect(page(7)).toContain("at least 1cm");
    for (const l of Object.values(PUB.layouts)) {
      expect((l as { margin: string }).margin).toBe("1cm");
    }
  });

  it("the guide states NO rule, border or divider colour — which is why `edge` is a choice", () => {
    // The claim the `edge` decision rests on, checked rather than asserted.
    // If a future ingestion surfaces one, this fails and `edge` should become
    // a measurement instead.
    // Every page the ingestion produced, globbed rather than assumed: the
    // guide is 33 pages, and a hardcoded range is how a sweep silently stops
    // covering the pages somebody added.
    const pages = readdirSync(SECTIONS).filter((f) => f.endsWith(".md"));
    expect(pages.length).toBe(33);
    let found = "";
    for (const f of pages) {
      const t = readFileSync(join(SECTIONS, f), "utf-8").toLowerCase();
      for (const w of ["rule colour", "border colour", "divider", "line colour"]) {
        if (t.includes(w)) found += `${f}:${w} `;
      }
    }
    expect(found).toBe("");
  });

  it("`edge` is nonetheless INSIDE the palette the guide does state", () => {
    expect(WPRO_PRIMARY_PALETTE).toContain(PUB.palette.edge);
    expect(PUB.palette.edge).toBe("#74CEE2");
  });

  it("the primary palette is twelve colours, and page 12 carries all twelve RGB triples", () => {
    expect(WPRO_PRIMARY_PALETTE).toHaveLength(12);
    const p12 = page(12);
    for (const hex of WPRO_PRIMARY_PALETTE) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      expect(p12).toContain(`B: ${b}`);
      expect(p12).toContain(`G: ${g}`);
      expect(p12).toContain(`R: ${r}`);
    }
  });

  it("`fontScale` is 1 on every format — page 14 gives all four typefaces at 10pt, with no per-format size", () => {
    const p14 = page(14);
    for (const face of ["News Gothic MT", "DIN OT", "PT Sans", "Calibri"]) {
      expect(p14).toContain(face);
    }
    expect(p14).toContain("(10pt)");
    for (const l of Object.values(PUB.layouts)) {
      expect((l as { fontScale: number }).fontScale).toBe(1);
    }
  });
});

describe("the source's contradictions are recorded, not resolved away", () => {
  it("both are still declared", () => {
    expect(RECORDED_CONTRADICTIONS.map((c) => c.id).sort()).toEqual([
      "black-logo-k100-vs-rgb-100",
      "logo-blue-c95-vs-c90",
    ]);
  });

  it("page 6 really does state BOTH readings of the black logo", () => {
    const p6 = page(6);
    expect(p6).toContain("K: 100");
    expect(p6).toContain("R: 100 G: 100 B: 100");
    // We took K:100. The theme says #000000 and not #646464, and says why.
    expect(PUB.palette.ink).toBe("#000000");
  });

  it("pages 6 and 12 really do give different CYAN for the one logo blue", () => {
    expect(page(6)).toContain("C: 95 M: 25");
    expect(page(12)).toContain("C: 90");
    expect(page(12)).toContain("M: 25");
  });

  it("each contradiction says where it is, what the problem is, and what we took", () => {
    for (const c of RECORDED_CONTRADICTIONS) {
      expect(c.where.length).toBeGreaterThan(5);
      expect(c.problem.length).toBeGreaterThan(30);
      expect(c.weTook.length).toBeGreaterThan(30);
    }
  });
});

describe("j66n's fourth clause: a missing layout stays INVALID, never degraded", () => {
  it("refuses a publication theme missing a format rather than filling it in", () => {
    const { a5Landscape: _dropped, ...twoOfThree } = PUB.layouts as Record<string, unknown>;
    expect(() => ResolvedThemeSchema.parse({ ...PUB, layouts: twoOfThree })).toThrow();
  });

  it("refuses a webpage theme missing a viewport", () => {
    const { card: _dropped, ...twoOfThree } = IRIS.layouts as Record<string, unknown>;
    expect(() => ResolvedThemeSchema.parse({ ...IRIS, layouts: twoOfThree })).toThrow();
  });

  it("refuses print geometry on a webpage theme, and viewports on a publication theme", () => {
    expect(() => ResolvedThemeSchema.parse({ ...IRIS, layouts: PUB.layouts })).toThrow();
    expect(() => ResolvedThemeSchema.parse({ ...PUB, layouts: IRIS.layouts })).toThrow();
  });
});
