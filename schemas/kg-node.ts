/**
 * The two labels every knowledge-graph node may carry.
 *
 * A node here is anything the graph names: a declared directory, a role, an
 * actor, a bean-graph node, a skill, a process. They arrived with four
 * different spellings of the same two ideas — `name` + `summary` on a role,
 * `name` + `description` on an actor, bare `summary` on a directory, `title` in
 * a bean's front matter — which is three renames waiting to happen and, worse,
 * three things a consumer has to know before it can print a node.
 *
 * So: **`title` is what a reader sees, `description` is the sentence under it.**
 * Both optional in general; a node type may require either, and several do —
 * `kg-audit` reports a role with no narrative, because a role nobody can
 * describe is a lane nobody can fill.
 *
 * ## `title` is not `id`, and not `name`
 *
 * `id` is the handle other nodes reference. `name` — where a node still has one
 * — is the instance's own identifier, the thing `cat-harness.json` calls
 * `folio-assistant` and publishes artefacts under. `title` is neither: it is
 * display text, it may contain punctuation an identifier could not, and it is
 * **translatable**. `WHO SMART Base` is a title; `smart-base` is a name.
 *
 * **Having one is a decision, and the default is not to.** {@link displayTitle}
 * falls back to `name`, and `cat-harness.ts` requires `name` to be the
 * identifier every artefact is stub-named after — so an instance whose display
 * text should match its repository wants no `title` at all, rather than a
 * `title` repeating the `name` and free to drift from it.
 *
 * This example used to be `c@t-harness` / `folio-assistant`, drawn from this
 * repository's own declaration, and that was the wrong illustration twice
 * over: the title it cited labelled THIS repository with the brand of the
 * harness layer still to be split out of it, and the sidebar showed a name
 * that matched neither the repository nor the URL people arrive at. Removed
 * 2026-09-19; the derivation it named survives in the `description`, which is
 * where a tagline belongs.
 *
 * ## Translatable means extractable
 *
 * {@link KG_NODE_LABEL_FIELDS} is the list a translation extractor reads, so
 * adding a third label later is one edit here rather than a sweep through every
 * extractor. Nothing else in a KG declaration is offered for translation: an
 * id, a path or a graph kind is structure, and translating structure is how a
 * reference goes dangling — the same rule `bpmn-translate.ts` follows.
 *
 * @module schemas/kg-node
 */

import { z } from "zod";

/** The fields a translation pass may offer, in the order a reader meets them. */
export const KG_NODE_LABEL_FIELDS = ["title", "description"] as const;
export type KgNodeLabelField = (typeof KG_NODE_LABEL_FIELDS)[number];

/** What a reader sees, and the sentence under it. */
export interface KgNodeLabels {
  /** Display text. Translatable. Falls back to the node's `name`, then its `id`. */
  title?: string;
  /** One or two sentences. Translatable. */
  description?: string;
}

/**
 * The label fields, as a Zod shape to spread into a node's own object.
 *
 * Spread rather than `.merge()`d so a node type can override either — a role
 * requires both, and saying so should not mean restating the field.
 */
export const kgNodeLabelShape = {
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
};

/**
 * What to print for a node: its title, else its name, else its id.
 *
 * Never returns an empty string for a node that has an id, because a blank
 * label in a sidebar or a table reads as a bug in the renderer rather than as a
 * missing field in the data.
 */
export function displayTitle(node: { id?: string; name?: string; title?: string }): string {
  return node.title || node.name || node.id || "";
}

// ── Images ──────────────────────────────────────────────────────

/**
 * An image the graph names.
 *
 * A mark is not decoration bolted onto a config file — it is a node, with an
 * id other nodes reference and a translatable {@link KgNodeLabels.title}. The
 * docs site, the README and the browser tab all want the same picture, and a
 * node is what stops three consumers each hardcoding a different path to it.
 *
 * **`description` is not alt text**, and wiring it into an `alt` attribute is
 * a mistake this module made and shipped. Alt text is a property of the
 * PLACEMENT, not of the image: the same mark is decorative beside a heading
 * that already names the site, and load-bearing on its own in a README. So
 * `description` describes the node — what the picture is, what it is for, why
 * it looks the way it does — and each consumer decides what to announce.
 * The sidebar announced a paragraph about sub-pixel whiskers until this was
 * fixed; see `docs/_includes/title.html`.
 */
export interface KgImage extends KgNodeLabels {
  /** Stable id, referenced by {@link KgNodeLabels} carriers such as `icon`. */
  id: string;
  /** Repo-relative path to the file. */
  src: string;
  /**
   * What this image is FOR.
   *
   * `browser-icon` is the one with a hard constraint — it has to survive
   * 16&nbsp;px — so it is named rather than left to a consumer to guess from
   * the filename. Open string: an instance may have marks this vocabulary has
   * not met.
   */
  role?: string;
  /**
   * Which viewport this variant is cut for.
   *
   * One logical image — the landing backdrop, say — is several files: a wide
   * one for a laptop, a tall one for a phone, a square-ish one for a card. All
   * share a `role`; `layout` is what tells them apart, so a consumer picks by
   * the pair rather than by parsing a filename.
   *
   * Open string, and **absent means layout-independent** — an SVG mark is the
   * same file everywhere and should not have to claim a viewport.
   */
  layout?: string;
  /** Intrinsic width in pixels, so a renderer can reserve space. */
  width?: number;
  /** Intrinsic height in pixels. */
  height?: number;
  /**
   * Where text may safely be drawn ON this image, as fractions of its size.
   *
   * **This is authored data, not a derived property**, and it has to be: it
   * says where the picture is *quiet*, which is a judgement about the
   * composition. The laptop backdrop here has a thought-cloud whose lower
   * interior is clear, an @ mark occupying its top third, and a cat's ear
   * rising into its lower left — a box that avoids all three was found by
   * rendering candidates and looking at them, and no amount of pixel analysis
   * substitutes for that.
   *
   * It differs per {@link layout} by necessity: the same cloud sits in a
   * different place in a portrait crop.
   *
   * **Absent means no region is declared**, which a renderer must treat as "do
   * not overlay text" rather than as "anywhere is fine". Text placed by
   * guesswork lands on the cat.
   */
  textRegion?: ImageRegion;
}

/**
 * A rectangle on an image, in fractions of its width and height.
 *
 * Fractions rather than pixels so the declaration survives the image being
 * re-exported at another size — which is exactly what happens when a variant
 * is regenerated.
 */
export interface ImageRegion {
  /** Left edge, 0–1. */
  x: number;
  /** Top edge, 0–1. */
  y: number;
  /** Width, 0–1. */
  w: number;
  /** Height, 0–1. */
  h: number;
}

export const ImageRegionSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().gt(0).max(1),
    h: z.number().gt(0).max(1),
  })
  // A region running off the edge is rejected rather than clamped: clamping
  // silently moves the text somewhere nobody chose, which is the failure this
  // field exists to prevent.
  .refine((r) => r.x + r.w <= 1 && r.y + r.h <= 1, {
    message: "textRegion extends past the edge of the image",
  });

export const KgImageSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  role: z.string().min(1).optional(),
  layout: z.string().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  textRegion: ImageRegionSchema.optional(),
  ...kgNodeLabelShape,
});

/**
 * The variants of one role, by layout.
 *
 * Returns a map rather than a list so a caller asks for the layout it is
 * rendering. A layout with no variant is **absent from the map**, never
 * substituted — see {@link pickLayout} for the one place a fallback is
 * chosen, and said out loud.
 */
export function imagesForRole(
  images: readonly KgImage[] | undefined,
  role: string,
): Map<string, KgImage> {
  const out = new Map<string, KgImage>();
  for (const i of images ?? []) {
    if (i.role === role && i.layout !== undefined) out.set(i.layout, i);
  }
  return out;
}

/** What {@link pickLayout} did, so a caller can report a substitution. */
export interface LayoutPick {
  image?: KgImage;
  /** The layout actually used, when it is not the one asked for. */
  substituted?: string;
}

/**
 * The variant for a layout, falling back along a declared order.
 *
 * The fallback is **reported**, not silent. A phone served the laptop crop is
 * a real degradation — the text region is wrong for it, so the overlay lands
 * somewhere nobody chose — and a renderer that cannot tell it happened will
 * ship that. `substituted` is what lets it say so, or decline to overlay.
 *
 * An empty result means no variant of this role exists at all, which is a
 * third state and not the same as a substitution.
 */
export function pickLayout(
  images: readonly KgImage[] | undefined,
  role: string,
  wanted: string,
  order: readonly string[] = ["laptop", "mobile", "card"],
): LayoutPick {
  const byLayout = imagesForRole(images, role);
  const exact = byLayout.get(wanted);
  if (exact) return { image: exact };
  for (const l of order) {
    const alt = byLayout.get(l);
    if (alt) return { image: alt, substituted: l };
  }
  return {};
}
