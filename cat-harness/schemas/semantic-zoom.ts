/**
 * When a card stops rendering its words and becomes its avatar.
 *
 * @module schemas/semantic-zoom
 * @graphNode schema
 *
 * ## The requirement, and the question it does not answer
 *
 * R2 of issue #602: *"As the board shrinks, a card SHALL stop rendering its
 * words and render its avatar instead. The threshold SHALL be declared data,
 * not a literal in the renderer."*
 *
 * That says the number must be declared. It does not say **whose** number it
 * is, and the answer is not obvious: `data-modelling`'s disappearance test —
 * *would this fact still be true if the entity went away?* — cuts both ways.
 * The number survives any one board and any one kind, which argues for the
 * folio; but *"when does **this** become unreadable"* is plainly a fact about
 * the thing being read.
 *
 * ## The owner's ruling, 2026-09-20 (CRDM Q4)
 *
 * > **Folio default, a kind may override.**
 *
 * Which is this repository's own inheritance rule applied unchanged: *inherit
 * everything, override anything; a variant states only what it CHANGES.* So
 * the folio always has a number, every kind resolves to one, and a kind that
 * states nothing is **complete rather than invalid** — requiredness is checked
 * after resolution, never on the declaration.
 *
 * ## An override CITES WHY, and the resolver says where the number came from
 *
 * `because` is required on an override, and {@link zoomThresholdFor} returns
 * the `source` alongside the value. Both exist for the same reason, which
 * `data-modelling` states outright: *an inherited value is still a fact
 * somebody must be able to trace.* A resolver that returned a bare number
 * would record what the value is and lose where it came from — and a reviewer
 * looking at a card that flipped too early could not tell a deliberate
 * override from the default landing somewhere it does not fit.
 *
 * **It is not an entity.** ZoomThreshold has no identifier of its own and
 * cannot exist apart from the folio or the kind that states it, which is the
 * test that also demoted `NoteAnchor` and `Avatar` to attributes.
 *
 * ## PIXELS, and why the unit is not board units
 *
 * `board-positions.ts` stores positions in board units precisely so a file
 * does not bake in the viewport it was written on. This is the opposite kind
 * of fact: legibility is a property of what reaches the reader's eye, so the
 * threshold is the card's RENDERED width in CSS pixels, after zoom. A card at
 * 40 board units is legible or not depending on the scale, and the scale is
 * what the reader is changing.
 */
import { z } from "zod";

/** The document's own declaration of what it is, inside the file. */
export const SEMANTIC_ZOOM_SCHEMA_TAG = "folio-semantic-zoom/v1";

/**
 * One kind's override.
 *
 * `because` is not documentation — it is the trace. See the module docs.
 */
export const KindZoomSchema = z
  .object({
    /** Rendered card width, in CSS pixels, below which this kind shows its avatar. */
    belowPx: z.number().positive().finite(),
    /** Why this kind differs from the folio's default. Required on every override. */
    because: z.string().min(1),
  })
  .strict();
export type KindZoom = z.infer<typeof KindZoomSchema>;

/** A folio's semantic-zoom declaration: one default, and any number of overrides. */
export const SemanticZoomSchema = z
  .object({
    $schema: z.literal(SEMANTIC_ZOOM_SCHEMA_TAG),
    /** The folio's default, in CSS pixels. Required — so nothing is ever unstated. */
    belowPx: z.number().positive().finite(),
    /** Overrides, keyed by kind. A kind absent here takes the default. */
    byKind: z.record(z.string().min(1), KindZoomSchema).default({}),
  })
  .strict();
export type SemanticZoom = z.infer<typeof SemanticZoomSchema>;

/** The file's name inside the graph directory it is declared in. */
export const SEMANTIC_ZOOM_FILE = "semantic-zoom.json";

/** Where a resolved threshold came from. */
export type ZoomSource = "folio" | "kind";

/** A resolved threshold, with its provenance. */
export type ResolvedZoom = {
  belowPx: number;
  source: ZoomSource;
  /** Present exactly when `source` is `"kind"` — an override always cites why. */
  because?: string;
};

/**
 * The threshold for one kind, resolved, with where it came from.
 *
 * **A bare number would have been the wrong return type** and the module docs
 * say why: an inherited value is still a fact somebody must be able to trace.
 * A reviewer looking at a card that flipped too early needs to know whether
 * somebody decided that or whether the folio's default landed somewhere it
 * does not fit, and those are different bugs with different fixes.
 */
export function zoomThresholdFor(zoom: SemanticZoom, kind: string): ResolvedZoom {
  const override = zoom.byKind[kind];
  if (override === undefined) return { belowPx: zoom.belowPx, source: "folio" };
  return { belowPx: override.belowPx, source: "kind", because: override.because };
}

/**
 * Whether a card of this kind renders its avatar at this rendered width.
 *
 * Strictly below, so the declared number is the last width that still shows
 * words. A boundary stated one way in a comment and the other way in the
 * renderer is the kind of disagreement nobody notices until a card flickers.
 */
export function rendersAvatar(zoom: SemanticZoom, kind: string, widthPx: number): boolean {
  return widthPx < zoomThresholdFor(zoom, kind).belowPx;
}
