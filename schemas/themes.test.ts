/**
 * The shipped themes satisfy what was asked for, and the accessibility ones
 * actually are accessible.
 *
 * Parsing proves a theme is well-formed. It does not prove the palette is
 * legible, so the contrast ratios are computed here rather than asserted in a
 * comment — a high-contrast theme whose contrast nobody measured is a claim.
 */
import { describe, expect, test } from "bun:test";

import { THEME_LAYOUTS, ThemeSchema } from "./theme.js";
import {
  DEFAULT_THEME_ID,
  GRADATED_THEME_IDS,
  HIGH_CONTRAST_THEME_IDS,
  THEMES,
  themeById,
} from "./themes.js";

/** WCAG relative luminance. */
function luminance(hex: string): number {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe("the corpus is what was asked for", () => {
  test("there are themes to check — otherwise this proves nothing", () => {
    expect(THEMES.length).toBeGreaterThan(4);
  });

  test("every shipped theme parses and defines all three layouts", () => {
    for (const t of THEMES) {
      expect({ id: t.id, ok: ThemeSchema.safeParse(t).success }).toEqual({ id: t.id, ok: true });
      for (const l of THEME_LAYOUTS) expect(`${t.id}:${l}`).toBe(`${t.id}:${l in t.layouts ? l : "MISSING"}`);
    }
  });

  test("ids are unique — the CSS class is built from the id", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("the asked-for families are all present", () => {
    const ids = THEMES.map((t) => t.id);
    expect(ids.some((i) => i.startsWith("pale-sage"))).toBe(true);
    expect(ids.some((i) => i.startsWith("dusty-carolina"))).toBe(true);
    expect(ids).toContain("grumpy-cat");
    expect([...HIGH_CONTRAST_THEME_IDS].every((i) => ids.includes(i))).toBe(true);
  });

  test("a couple of fading gradations exist", () => {
    expect(GRADATED_THEME_IDS.length).toBeGreaterThanOrEqual(2);
  });
});

describe("the default", () => {
  test("it resolves, and it is a sage — the owner asked for one to match the staging bar", () => {
    expect(themeById(DEFAULT_THEME_ID)?.id).toBe(DEFAULT_THEME_ID);
    expect(DEFAULT_THEME_ID.startsWith("pale-sage")).toBe(true);
  });

  // NOT asserted: that it MATCHES the staging bar. The sticky and the banner
  // appear together on exactly one surface — the deployed staging site — so a
  // checkout cannot check it, and a test claiming to would be asserting a
  // number nobody measured against the thing it is supposed to match.
  //
  // It WAS checked, on the staging preview for PR #405, and confirmed by the
  // owner 2026-09-19. That is a human judgement with a date, recorded here so
  // the next reader knows it happened — not a gap, and not something to
  // "fix" by adding an assertion that cannot see the banner.
});

describe("the high-contrast pair really is high contrast", () => {
  test.each([...HIGH_CONTRAST_THEME_IDS])("%s clears WCAG AAA body text (7:1)", (id) => {
    const t = themeById(id)!;
    expect(contrast(t.palette.ink, t.palette.surface)).toBeGreaterThanOrEqual(7);
  });

  test("they carry NO gradient, and that is deliberate", () => {
    // A gradated surface has a RANGE of ratios against its ink, so the worst
    // point governs — and the point of a high-contrast theme is that there is
    // no worst point to go looking for.
    for (const id of HIGH_CONTRAST_THEME_IDS) {
      expect({ id, grad: themeById(id)!.palette.gradientFrom }).toEqual({ id, grad: undefined });
    }
  });
});

describe("every theme is readable, not just the ones that advertise it", () => {
  test.each(THEMES.map((t) => t.id))("%s clears WCAG AA body text (4.5:1)", (id) => {
    // The decorative themes are the ones where this slips: a pale surface and a
    // mid-tone ink look fine to whoever picked them and fail for everyone else.
    const t = themeById(id)!;
    expect(contrast(t.palette.ink, t.palette.surface)).toBeGreaterThanOrEqual(4.5);
  });

  test.each(THEMES.filter((t) => t.palette.gradientFrom).map((t) => t.id))(
    "%s clears AA at BOTH gradient stops, not just the surface",
    (id) => {
      // The failure a flat check misses entirely: a gradient is legible at the
      // top of the card and not at the bottom.
      const t = themeById(id)!;
      expect(contrast(t.palette.ink, t.palette.gradientFrom!)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.palette.ink, t.palette.gradientTo!)).toBeGreaterThanOrEqual(4.5);
    },
  );
});
