/**
 * The themes this instance ships, and the default.
 *
 * @module schemas/themes
 * @graphNode schema
 *
 * The owner's list, 2026-09-19: *"grumpy-cat, white black (and whatever needed
 * accessability), a couple pale sages and dusty carolina blues, in a couple of
 * fading gradations"*, with the default *"one of the sages (to match the
 * staging bar)"*.
 *
 * ## The high-contrast pair is the accessibility answer, not a decoration
 *
 * `high-contrast-light` and `high-contrast-dark` are the "whatever needed
 * accessibility" clause, and they are listed as a **pair** rather than one
 * theme, because a single high-contrast theme forces a choice that the reader's
 * own scheme preference has already made. Both clear WCAG AA on body text
 * against their own surface by construction — pure black on pure white, and the
 * reverse.
 *
 * **They deliberately carry no gradient.** A gradated surface has a *range* of
 * contrast ratios against its ink, so the worst point governs, and the whole
 * point of a high-contrast theme is that there is no worst point to find.
 *
 * ## The default is provisional until somebody looks at staging
 *
 * `DEFAULT_THEME_ID` is a sage because the owner asked for one that matches the
 * staging bar. **That match cannot be verified from a checkout** — the sticky
 * and the staging banner appear together on exactly one surface, the deployed
 * staging site, and picking a value from a palette in isolation is how a
 * default ends up almost-matching. The value here is a starting point to be
 * looked at, not a measurement.
 */
import { THEME_SCHEMA_TAG, ThemeSchema, type Theme } from "./theme.js";

/** Geometry shared by every shipped theme: the sticky is the same sticky. */
const LAYOUTS = {
  laptop: { minWidth: "17rem", padding: "0.7em 0.8em", fontScale: 1 },
  mobile: { minWidth: "100%", padding: "0.8em 0.9em", fontScale: 1.05 },
  card: { minWidth: "13rem", padding: "0.6em 0.7em", fontScale: 0.95 },
} as const;

const RAW = [
  {
    $schema: THEME_SCHEMA_TAG,
    id: "pale-sage",
    name: "Pale sage",
    description: "The default. Matches the staging banner.",
    palette: {
      surface: "#e9efe6", ink: "#1c211b", edge: "#c3cebe", accent: "#6f8c64",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    id: "pale-sage-fade",
    name: "Pale sage, fading",
    description: "The sage with a soft vertical gradation.",
    palette: {
      surface: "#e9efe6", ink: "#1c211b", edge: "#c3cebe", accent: "#6f8c64",
      gradientFrom: "#eef3ec", gradientTo: "#dde7d9",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    id: "dusty-carolina",
    name: "Dusty Carolina blue",
    palette: {
      surface: "#e3ebf2", ink: "#181e25", edge: "#b9c8d6", accent: "#5b82a6",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    id: "dusty-carolina-fade",
    name: "Dusty Carolina blue, fading",
    description: "The blue with a soft vertical gradation.",
    palette: {
      surface: "#e3ebf2", ink: "#181e25", edge: "#b9c8d6", accent: "#5b82a6",
      gradientFrom: "#eaf1f6", gradientTo: "#d5e2ed",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    id: "grumpy-cat",
    name: "Grumpy cat",
    description: "Warm greys and a sage accent, after the mark.",
    palette: {
      surface: "#edeae4", ink: "#221f1b", edge: "#cbc5bb", accent: "#7d8a6e",
    },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    id: "high-contrast-light",
    name: "High contrast, light",
    description: "Black on white. No gradation, by design.",
    palette: { surface: "#ffffff", ink: "#000000", edge: "#000000", accent: "#000000" },
    layouts: LAYOUTS,
  },
  {
    $schema: THEME_SCHEMA_TAG,
    id: "high-contrast-dark",
    name: "High contrast, dark",
    description: "White on black. No gradation, by design.",
    palette: { surface: "#000000", ink: "#ffffff", edge: "#ffffff", accent: "#ffffff" },
    layouts: LAYOUTS,
  },
] as const;

/** Every shipped theme, parsed — so a malformed one fails at import, not at render. */
export const THEMES: readonly Theme[] = RAW.map((t) => ThemeSchema.parse(t));

/**
 * The default.
 *
 * Provisional against the staging bar — see the module docs. It is a sage
 * because that is what was asked for; *which* sage is a question only the
 * deployed staging site can settle.
 */
export const DEFAULT_THEME_ID = "pale-sage";

/** The themes carrying a gradation, for the "couple of fading gradations" ask. */
export const GRADATED_THEME_IDS = THEMES.filter((t) => t.palette.gradientFrom).map((t) => t.id);

/** The high-contrast pair, which the accessibility clause requires to exist. */
export const HIGH_CONTRAST_THEME_IDS = ["high-contrast-light", "high-contrast-dark"] as const;

export function themeById(id: string): Theme | undefined {
  return THEMES.find((t) => t.id === id);
}
