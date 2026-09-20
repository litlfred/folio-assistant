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
 * ## One EXCEPTION, and it is a convention rather than a derivation
 *
 * The owner, 2026-09-20: *"each harness hould have its own unique theme (by
 * convention)"*, and then the assignment itself: *"cat-harness=gumpy hoddie.
 * test=engineer. bootstrap coming."*
 *
 * That does not reopen what the section below closes, and the difference is
 * exact:
 *
 * | | |
 * |---|---|
 * | **refused** | deriving a theme from a ROLE, process, skill or graph kind — a note's appearance would depend on which lane happened to be reading it |
 * | **this** | a HARNESS picking one theme and keeping it, written in that harness's own declaration |
 *
 * A harness is a fixed thing that owns its declaration, not a lane an actor
 * steps into, so "this harness looks like this" is a choice made once by an
 * author and recorded — which is what the rule below asks for. **Nothing
 * computes it**: `harness.json` still names an id, and no code maps a harness to
 * a theme. The convention lives in the declarations and in this comment.
 *
 * Today: `grumpy-cat` (the sage hoodie) is cat-harness's, `engineer` is reserved
 * for testing surfaces, and bootstrap's is still to come — which is why its
 * sticky is palette-only rather than borrowing somebody else's cat.
 *
 * ## Choosing a theme is an AUTHORING judgement — there is no mapping
 *
 * The owner, 2026-09-20: *"no formal role/theme mapping per se. that is
 * authoring (human/agentic) decision/judgement."*
 *
 * So a theme is picked by whoever writes the note, and **nothing derives one**
 * from a role, a process, a skill or a graph kind. `ThemedTodoFields.theme` and
 * the landing sticky's required `theme` are the whole selection surface: an id,
 * set by an author.
 *
 * **This is a rule, not a gap**, and it is worth saying so because the absence
 * reads like one. It did to this agent twice: shipping the `library` and
 * `analyst` themes, I recorded that "no per-role, per-process or per-kind theme
 * SELECTION exists" and pointed at two beans as the mechanism that would supply
 * it. There is no such mechanism to supply.
 *
 * Three reasons the mapping would be wrong rather than merely absent:
 *
 * 1. **A role is a swimlane, not a property of a thing.** `role-model.md`:
 *    nothing *is* a reviewer; somebody *acts as* one for the duration of a lane,
 *    and the same actor is a different role in another diagram. A theme keyed on
 *    role would make one note's appearance depend on which process happened to
 *    be reading it.
 * 2. **It makes the choice unarguable and invisible.** With a table, "this one
 *    should look different" requires editing something that governs everything
 *    else; without one, it is a field on the note and the argument is local.
 * 3. **It is the conflation this file already refuses.** Themes live in the
 *    harness layer while the todos referencing them stay in `todos/`, and the
 *    owner's *"beans no anchor"* rule keeps a rendering position out of the work
 *    plan. A role→theme table would put presentation back into the role graph.
 *
 * The optional `theme` on {@link ThemedTodoFieldsSchema} already encodes this:
 * absent means *nobody has chosen*, which is a statement about an author rather
 * than about a lookup that failed.
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

/**
 * Artwork behind a sticky's ink, named by the image ROLE it resolves from.
 *
 * The owner, 2026-09-19: *"a note can hold the image as part of its theme."* So
 * the image is the **theme's**, not the note body's — a note references a theme
 * by id and gains the art for free, which is why the 2026-09-20 ask for a
 * *"sticky note with grumpy cat background"* needs no new field on the note.
 *
 * ## A ROLE, never a path — and this is the load-bearing decision
 *
 * The obvious version declares `src: "docs/assets/img/harness/landing-laptop.webp"`
 * on the theme. It was written first, and it is wrong, because **this module is
 * platform code that a downstream folio inherits.** `landing.html` already
 * states the consequence it was guarding against:
 *
 * > a downstream folio should not inherit a grumpy cat it did not choose.
 *
 * A literal path would give every folio depending on this platform a theme
 * pointing at three `.webp`s that exist only here — a guaranteed 404 in any
 * instance that did not happen to copy them, and the *same* defect class as
 * bean `blv9` (link-shaped values nothing checks resolve).
 *
 * Naming a role instead inverts it. The theme says *"my backdrop is whatever
 * this instance declares as its `landing` art"*; `harness.json` says what that
 * is. An instance with its own art gets its own; an instance with none gets no
 * backdrop and renders palette-only, which is an already-tested state rather
 * than a broken one. `5oai` resolved exactly this before the field existed:
 * *"reuse `images[].role` rather than invent an avatar vocabulary … a new
 * parallel field would be two spellings of one concept."*
 *
 * ## `scrim` is REQUIRED, and it is the accessibility mechanism
 *
 * Ink on a flat `surface` has a contrast ratio anybody can compute. **Ink over
 * a photograph does not** — it varies pixel to pixel, so no theme carrying art
 * can state its contrast, and a check over the palette alone would pass a
 * sticky that is unreadable across half of its own background.
 *
 * A scrim is what makes the question answerable again: it sits between art and
 * ink, so the ink's effective ground is the scrim over the art's worst case
 * rather than the art. Requiring it means a themed backdrop **cannot** be
 * declared without the thing that makes it legible — not optional, precisely
 * because "we will add a scrim later" is how the unreadable version ships.
 *
 * Same shape as the constraint this module already records for the priority
 * stripe: a theme may set a hue; it may never remove a non-colour channel.
 */
export const ThemeBackdropSchema = z
  .object({
    /**
     * The declared image `role` this theme's art comes from — `landing` for the
     * three `landing-*` entries an instance declares.
     *
     * Resolved against the instance's own `images[]` at render time by
     * {@link resolveThemeBackdrop}, never composed into a path here.
     */
    imageRole: z.string().min(1),
    /**
     * The layer between art and ink, as a CSS colour — normally a translucent
     * form of `surface`. Required; see module docs.
     */
    scrim: z.string().min(1),
    /**
     * What the art is FOR, for an author reading the theme.
     *
     * **Not translatable, and not announced.** `landing.html` records the
     * reasoning and it carries over unchanged: the backdrop is decorative,
     * every word it carries is in the sticky's own markdown as real text, and
     * announcing a paragraph about composition to somebody who already has the
     * content is the mistake `title.html` shipped once. The rendered image is
     * `alt=""`; this is authoring metadata.
     */
    description: z.string().min(1).optional(),
  })
  .strict();
export type ThemeBackdrop = z.infer<typeof ThemeBackdropSchema>;

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
    /**
     * Artwork behind the ink, when the theme has any.
     *
     * **Optional, and absence is the common case rather than an omission.** Most
     * themes are a palette. A backdrop is what `grumpy-cat` has and what
     * `high-contrast-light` / `high-contrast-dark` must never be given — art
     * behind ink is the thing those two exist to remove, and a scrim strong
     * enough to make a photograph safe at their ratios would hide the
     * photograph anyway.
     */
    backdrop: ThemeBackdropSchema.optional(),
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
  // The scrim, and NOT the art. A custom property can carry a colour the
  // stylesheet composites; it cannot carry the per-layout `<picture>` swap,
  // which has to be markup because the breakpoint chooses the FILE. A single
  // `--fa-sticky-art: url(...)` would serve one crop to every viewport — the
  // bug `landing.html` records shipping once, where the mobile image loaded and
  // the laptop's geometry stayed.
  if (theme.backdrop) rows.push(`--fa-sticky-scrim: ${theme.backdrop.scrim};`);
  return rows.join("\n  ");
}

/**
 * The minimal shape of a declared image this module needs.
 *
 * **Structural on purpose, rather than importing `KgImage`.** `theme.ts` imports
 * nothing but `zod`, and that is worth keeping: `kg-node.ts` is reached from
 * `cat-harness.ts`, which is the module a theme may end up being read *by*, and
 * this module's own sibling `block-kinds.ts` exists entirely because one
 * schema module importing another at module scope produced a runtime cycle
 * whose symptom was an `undefined` import during initialisation.
 *
 * `KgImage` satisfies this shape, so a caller passes `decl.images` unchanged
 * and the compiler checks the join.
 */
export interface DeclaredImage {
  role?: string | undefined;
  layout?: string | undefined;
  src: string;
  width?: number | undefined;
  height?: number | undefined;
  /**
   * The quiet interior a sticky's words sit in, in fractions of this image.
   *
   * Declared per LAYOUT, because the cloud is in a different place in each crop
   * — that is what the three regions on the `landing` role record, and why the
   * owner's instruction names *"the various clouds positions … across three
   * layouts"* rather than one.
   *
   * Structural here, like the rest of this interface, so `KgImage` satisfies it
   * without this module importing `kg-node.ts` and risking the cycle the doc
   * above describes.
   */
  textRegion?: { x: number; y: number; w: number; h: number } | undefined;
}

/** What {@link resolveThemeBackdrop} found, so a caller can REPORT a gap. */
export interface ResolvedBackdrop {
  /** The art per layout. Complete, or empty — never partial; see below. */
  art: Map<ThemeLayout, DeclaredImage>;
  /**
   * The layouts the instance does not supply for this theme's role.
   *
   * Non-empty means `art` is **empty**: an incomplete backdrop is refused
   * wholesale rather than served partially, because the failure of a partial
   * one is silent. A phone handed the laptop crop shows the art's quiet area in
   * the wrong place, and nothing reports it — which is exactly the substitution
   * `pickLayout` exists to make visible, and the reason this module's `layouts`
   * field has no fallback either.
   */
  missing: ThemeLayout[];
  /** `true` when the theme declares no backdrop at all — not a gap. */
  none: boolean;
}

/**
 * Resolve a theme's backdrop against an instance's declared images.
 *
 * Three outcomes, and the third is why this returns a record rather than a map:
 *
 * | | meaning |
 * |---|---|
 * | `none` | the theme declares no backdrop. Palette-only, and ordinary. |
 * | `missing` non-empty | the theme wants art this instance does not declare. |
 * | `art` complete | all three layouts resolved. |
 *
 * **`none` and `missing` are different facts and must not collapse.** A
 * palette-only theme is a choice; a theme whose role resolves to two of three
 * crops is a declaration bug in the *instance*. Returning a bare empty map for
 * both would make the second unreportable — the shape of the `targetLabel`
 * conflation `note-anchor.ts` was written to undo.
 */
export function resolveThemeBackdrop(
  theme: Theme,
  images: readonly DeclaredImage[] | undefined,
): ResolvedBackdrop {
  if (!theme.backdrop) return { art: new Map(), missing: [], none: true };
  const role = theme.backdrop.imageRole;
  const byLayout = new Map<ThemeLayout, DeclaredImage>();
  for (const i of images ?? []) {
    if (i.role !== role || i.layout === undefined) continue;
    const l = THEME_LAYOUTS.find((t) => t === i.layout);
    // The FIRST entry for a layout wins, the same rule `imageForRole` uses for
    // a repeated role: deterministic, and left to the declaration's own
    // validation to complain about rather than silently preferring the last.
    if (l !== undefined && !byLayout.has(l)) byLayout.set(l, i);
  }
  const missing = THEME_LAYOUTS.filter((l) => !byLayout.has(l));
  return missing.length > 0
    ? { art: new Map(), missing, none: false }
    : { art: byLayout, missing: [], none: false };
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
