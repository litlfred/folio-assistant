/**
 * A sticky theme — named colour roles plus the three layouts, as a graph node.
 *
 * @module schemas/theme
 * @graphNode schema
 *
 * ## Why a theme is a node and not a stylesheet
 *
 * The owner's ask, 2026-09-19: *"try to use named css assets in KG rather than
 * hardcoded colors so themeing is easier."* The reason that matters here is
 * measurable rather than aesthetic — `folio-assistant/docs/assets/css/docs-ui.css`
 * carried **106 hardcoded hex colours against 22 custom properties** when this
 * was written, so changing a theme meant a find-and-replace across the file.
 * That is how one state keeps the wrong shade: the hover, the dark-scheme
 * variant or the focus ring is missed, and nothing reports it.
 *
 * A theme declaring **named roles** fixes the failure rather than the symptom.
 * A rule says `var(--fa-sticky-surface)`; what that resolves to is the theme's
 * business. A rule naming `#8fa58b` has hardcoded a decision at the point of
 * use, where the next person cannot see the other twelve places that made the
 * same one.
 *
 * ## A theme lives in the harness layer, its todos do not
 *
 * The owner, confirming 2026-09-19: cat-harness is *"a layer/home of content"*.
 * So the **type and the themes** are harness-layer nodes, while the todos that
 * reference them stay in the `todos` graph. Moving todo content under the
 * knowledge graph to get it themed would conflate the work plan with the
 * knowledge graph — two stores with one vocabulary is the drift this repository
 * keeps paying for.
 *
 * ## All three layouts, or the theme is invalid
 *
 * The owner: *"themes need all three layouts to be defined to be considered
 * valid."* The three are `laptop`, `mobile` and `card`, which is not a new
 * vocabulary — it is exactly the set `harness.json`'s `images[].layout` already
 * uses, where each carries its own `textRegion` because the crop genuinely
 * differs.
 *
 * **Missing a layout is invalid, never degraded.** There is deliberately no
 * fallback to another layout's geometry: a theme that renders wrong on a phone
 * is worse than one that refuses to load, because the first ships and the
 * second is noticed. Same reason `resolveGraphKind` refuses an unknown kind
 * rather than guessing.
 *
 * ## What the palette may NOT be asked to carry
 *
 * The sticky CSS already records the constraint, and a theme must not break it:
 *
 * > The priority stripe is the only per-card differentiator, and it is a WIDTH
 * > as well as an opacity — colour alone would carry the whole signal, which
 * > SC 1.4.1 forbids and a monochrome reader cannot see at all.
 *
 * So a theme sets the stripe's **hue**; it never sets its width to zero, and
 * {@link ThemeSchema} has no field with which to try. A theme is a palette and
 * a geometry, not a licence to remove a non-colour channel.
 */
import { z } from "zod";

/**
 * The three layouts a theme must define.
 *
 * Not invented here — `harness.json`'s `images[].layout` already uses exactly
 * these, and reusing the vocabulary is the difference between one concept and
 * two spellings of one concept.
 */
export const THEME_LAYOUTS = ["laptop", "mobile", "card"] as const;
export type ThemeLayout = (typeof THEME_LAYOUTS)[number];

/**
 * Geometry for one layout.
 *
 * **Geometry, not colour.** The palette is shared across a theme's three
 * layouts because a sticky is the same sticky on a phone; what changes is how
 * much room it has. Splitting colour per layout would let a theme be legible on
 * a laptop and not on a phone while still passing every check — which is the
 * state this whole node exists to make impossible.
 */
export const ThemeGeometrySchema = z
  .object({
    /** Minimum column width before the grid reflows, as a CSS length. */
    minWidth: z.string().min(1),
    /** Card padding, as a CSS length. */
    padding: z.string().min(1),
    /** Body scale relative to the page, as a unitless multiplier. */
    fontScale: z.number().positive(),
  })
  .strict();
export type ThemeGeometry = z.infer<typeof ThemeGeometrySchema>;

/**
 * The named colour roles a theme supplies.
 *
 * **Every one is a ROLE, not a colour name.** `surface` rather than `pale-sage`,
 * so a rule reads as what it does. A palette keyed by colour name is a palette
 * that cannot be re-themed without renaming every use site, which is the
 * hardcoding this replaces wearing a variable's clothes.
 *
 * `gradientFrom` / `gradientTo` are the owner's *"couple of fading
 * gradations"*. They are **optional in the type and required in practice for a
 * gradated theme**: a theme declaring one without the other is refused, because
 * a gradient with one stop is a flat fill that claims to be a gradient.
 */
export const ThemePaletteSchema = z
  .object({
    /** The card's own background. */
    surface: z.string().min(1),
    /** Body text on `surface`. */
    ink: z.string().min(1),
    /** Border and rule colour. */
    edge: z.string().min(1),
    /** The priority stripe's hue. Width is NOT a theme's to set — see module docs. */
    accent: z.string().min(1),
    gradientFrom: z.string().min(1).optional(),
    gradientTo: z.string().min(1).optional(),
  })
  .strict()
  .refine((p) => (p.gradientFrom === undefined) === (p.gradientTo === undefined), {
    message: "a gradient needs both stops: declare gradientFrom and gradientTo, or neither",
  });
export type ThemePalette = z.infer<typeof ThemePaletteSchema>;

/** The tag every theme node declares, per the `$schema` convention. */
export const THEME_SCHEMA_TAG = "folio-theme/v1";

export const ThemeSchema = z
  .object({
    $schema: z.literal(THEME_SCHEMA_TAG),
    /** Stable id; what a `ThemedTodo` references and what the CSS class is built from. */
    id: z
      .string()
      .regex(/^[a-z][a-z0-9-]*$/, "a theme id is lowercase kebab-case"),
    /**
     * Display name.
     *
     * **Translatable, and the palette values are not.** The owner asked for
     * translatable themes; what a reader sees is the name, so that is the
     * string that goes through the `.pot` / `.po` pipeline. A colour is not
     * language-dependent, and running one through translation would invite a
     * locale to diverge on a value the CSS has to agree on.
     */
    name: z.string().min(1),
    /** One line for the theme picker. Translatable, same reasoning as `name`. */
    description: z.string().min(1).optional(),
    palette: ThemePaletteSchema,
    /** All three, or invalid. See module docs — there is no fallback by design. */
    layouts: z
      .object({
        laptop: ThemeGeometrySchema,
        mobile: ThemeGeometrySchema,
        card: ThemeGeometrySchema,
      })
      .strict(),
  })
  .strict();
export type Theme = z.infer<typeof ThemeSchema>;

/**
 * Names the missing layouts, for an error a person can act on.
 *
 * `ThemeSchema` already refuses an incomplete theme; this exists so the refusal
 * can say *which* layout is missing rather than only that parsing failed. A
 * gate whose message is "invalid" teaches nobody what to fix.
 */
export function missingLayouts(value: unknown): ThemeLayout[] {
  const layouts = (value as { layouts?: Record<string, unknown> } | null)?.layouts;
  if (layouts === null || typeof layouts !== "object") return [...THEME_LAYOUTS];
  return THEME_LAYOUTS.filter((l) => !(l in layouts));
}

/** The CSS custom-property block a theme contributes, as `--fa-sticky-*` roles. */
export function themeCssVars(theme: Theme): string {
  const p = theme.palette;
  const rows = [
    `--fa-sticky-surface: ${p.surface};`,
    `--fa-sticky-ink: ${p.ink};`,
    `--fa-sticky-edge: ${p.edge};`,
    `--fa-sticky-accent: ${p.accent};`,
  ];
  if (p.gradientFrom && p.gradientTo) {
    rows.push(`--fa-sticky-grad-from: ${p.gradientFrom};`, `--fa-sticky-grad-to: ${p.gradientTo};`);
  }
  return rows.join("\n  ");
}

/**
 * A todo that carries a theme.
 *
 * @see {@link ThemeSchema}
 *
 * **`ThemedTodo` extends `Todo`; it does not replace it.** The same relation
 * `paper` has to `document` and for the same reason: a themed todo IS a todo,
 * so everything that reads a todo keeps working and only the sticky renderer
 * needs to know about themes. Making it a separate kind would have forced every
 * consumer to handle two shapes for one thing.
 *
 * **`theme` is optional, and that is a third state rather than laziness.** A
 * todo with no theme is not a todo with the default theme — it is one nobody
 * has chosen for, which is exactly what the CSS's
 * `.fa-sticky-board:not([data-fa-sticky-theme])` rule renders. Defaulting the
 * field at rest would erase the difference between *unchosen* and *chose the
 * default*, and the day the default changes, every unchosen sticky would
 * silently keep the old one.
 *
 * The id is validated for SHAPE here and not for existence: whether a theme is
 * installed is a question about the instance's theme set, which a todo cannot
 * see. {@link themeById} answers it at render time, where a missing theme
 * degrades to the default rather than failing the page.
 */
export const ThemedTodoFieldsSchema = z
  .object({
    theme: z
      .string()
      .regex(/^[a-z][a-z0-9-]*$/, "a theme id is lowercase kebab-case")
      .optional(),
  })
  .strict();
export type ThemedTodoFields = z.infer<typeof ThemedTodoFieldsSchema>;

/**
 * Every user-facing string a theme contributes, for extraction.
 *
 * The owner asked for translatable themes. What a reader sees is the **name**
 * and the **description**; a palette value is not language-dependent, and
 * running one through translation would invite a locale to diverge on a value
 * the CSS has to agree on across every locale of the same page.
 */
export function themeTranslatableStrings(theme: Theme): string[] {
  return theme.description ? [theme.name, theme.description] : [theme.name];
}
