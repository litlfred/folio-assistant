/**
 * A theme is valid only with all three layouts, and the check must be able to fire.
 *
 * The owner's rule, 2026-09-19: *"themes need all three layouts to be defined
 * to be considered valid."* A validity rule nothing exercises is a comment, so
 * the first thing asserted here is a theme missing one layout being REFUSED —
 * not that a good one passes, which a schema that checked nothing would also do.
 */
import { describe, expect, test } from "bun:test";

import {
  THEME_LAYOUTS,
  THEME_SCHEMA_TAG,
  ThemeSchema,
  missingLayouts,
  themeCssVars,
} from "./theme.js";

const GEOM = { minWidth: "17rem", padding: "0.7em 0.8em", fontScale: 1 };

function theme(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $schema: THEME_SCHEMA_TAG,
    id: "pale-sage",
    name: "Pale sage",
    palette: {
      surface: "#e8eee6",
      ink: "#1d221c",
      edge: "#c2cdbd",
      accent: "#7d9a72",
    },
    layouts: { laptop: GEOM, mobile: GEOM, card: GEOM },
    ...over,
  };
}

describe("all three layouts, or invalid", () => {
  test("a complete theme parses", () => {
    expect(ThemeSchema.safeParse(theme()).success).toBe(true);
  });

  test.each([...THEME_LAYOUTS])("a theme missing `%s` is REFUSED, not degraded", (layout) => {
    // The assertion that matters. There is deliberately no fallback to another
    // layout's geometry: a theme that renders wrong on a phone SHIPS, while one
    // that refuses to load is noticed.
    const layouts: Record<string, unknown> = { laptop: GEOM, mobile: GEOM, card: GEOM };
    delete layouts[layout];
    expect(ThemeSchema.safeParse(theme({ layouts })).success).toBe(false);
  });

  test("the refusal can say WHICH layout is missing", () => {
    // A gate whose message is "invalid" teaches nobody what to fix.
    expect(missingLayouts(theme({ layouts: { laptop: GEOM, card: GEOM } }))).toEqual(["mobile"]);
    expect(missingLayouts({})).toEqual([...THEME_LAYOUTS]);
    expect(missingLayouts(null)).toEqual([...THEME_LAYOUTS]);
  });

  test("a complete theme names none", () => {
    expect(missingLayouts(theme())).toEqual([]);
  });
});

describe("the palette is roles, and a gradient needs both stops", () => {
  test("one gradient stop is refused", () => {
    // A gradient with one stop is a flat fill claiming to be a gradient — it
    // renders, which is exactly why nothing would catch it later.
    const one = theme({
      palette: { surface: "#fff", ink: "#000", edge: "#ccc", accent: "#7d9a72", gradientFrom: "#fff" },
    });
    expect(ThemeSchema.safeParse(one).success).toBe(false);
  });

  test("both stops, or neither, are fine", () => {
    const both = theme({
      palette: {
        surface: "#fff", ink: "#000", edge: "#ccc", accent: "#7d9a72",
        gradientFrom: "#fff", gradientTo: "#e8eee6",
      },
    });
    expect(ThemeSchema.safeParse(both).success).toBe(true);
    expect(ThemeSchema.safeParse(theme()).success).toBe(true);
  });

  test("an unknown palette key is refused rather than ignored", () => {
    // `.strict()`. A typo'd role that parses is a role that silently never
    // reaches the CSS — the same class of defect as an undeclared @context term
    // being dropped.
    const typo = theme({
      palette: { surface: "#fff", ink: "#000", edge: "#ccc", accent: "#7d9a72", surfase: "#fff" },
    });
    expect(ThemeSchema.safeParse(typo).success).toBe(false);
  });
});

describe("ids and names", () => {
  test("an id is lowercase kebab-case, because the CSS class is built from it", () => {
    expect(ThemeSchema.safeParse(theme({ id: "Pale Sage" })).success).toBe(false);
    expect(ThemeSchema.safeParse(theme({ id: "dusty-carolina-blue" })).success).toBe(true);
  });

  test("a theme must declare its $schema tag", () => {
    expect(ThemeSchema.safeParse(theme({ $schema: undefined })).success).toBe(false);
  });
});

describe("the CSS a theme contributes is roles, not colour names", () => {
  test("every emitted property is an `--fa-sticky-*` role", () => {
    const css = themeCssVars(ThemeSchema.parse(theme()));
    for (const line of css.split("\n")) {
      expect(line.trim().startsWith("--fa-sticky-")).toBe(true);
    }
  });

  test("a theme without a gradient emits no gradient properties", () => {
    // Otherwise a consumer gets `--fa-sticky-grad-from: undefined`, which CSS
    // silently ignores — a value that looks set and is not.
    expect(themeCssVars(ThemeSchema.parse(theme()))).not.toContain("grad-from");
  });

  test("a gradated theme emits both stops", () => {
    const g = ThemeSchema.parse(theme({
      palette: {
        surface: "#fff", ink: "#000", edge: "#ccc", accent: "#7d9a72",
        gradientFrom: "#fff", gradientTo: "#e8eee6",
      },
    }));
    expect(themeCssVars(g)).toContain("--fa-sticky-grad-from: #fff;");
    expect(themeCssVars(g)).toContain("--fa-sticky-grad-to: #e8eee6;");
  });
});
