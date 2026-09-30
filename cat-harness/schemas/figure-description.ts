/**
 * @graphNode schema
 *
 * What a person or agent SAYS a drawn figure shows — bean `a8wy`, under
 * `m4xy`. The judgement half of the vector arm.
 *
 * ## Why this is a third file
 *
 * The corpus already keeps measurement and judgement apart for raster images,
 * and this is the same split one layer over:
 *
 * | | measurement, machine-derived | judgement, someone looked |
 * |---|---|---|
 * | raster | `<entry>/images.json` | `<library>/image-verdicts.json` |
 * | vector | `<entry>/vector-labels.json` | `<library>/figure-descriptions.json` |
 *
 * `vector-labels.json` records where every text line sits and whether it
 * intersects a drawing. Putting a narrative in it would make one file both the
 * measurement and the opinion about the measurement, which is exactly what
 * `image-verdicts.json` exists to avoid — and it would be overwritten on the
 * next extraction, since the arm opens its sidecar with `"w"`.
 *
 * It is NOT `images.json`, either, for a blunter reason: a drawn figure places
 * no image object, so there is no entry to hang a narrative on. That absence
 * is the whole of `m4xy`.
 *
 * ## `basis` is required, and it is the point of the schema
 *
 * Bean `a8wy` describes one figure from its labels alone and then renders the
 * page. Measured on `arxiv-2504.19675v2` Figure 2: every proper name, heading
 * and run number came out right, and the RELATION came out wrong on all three
 * rows — the labels line up as a table reading "one ensemble per base
 * project", while the drawn arrows cross, as the paper's own prose says. A
 * whole column of cylinder glyphs carried no text at all, so it was invisible
 * below its heading.
 *
 * So a labels-only description is safe as an INVENTORY and unsafe as an
 * ACCOUNT, and a reader has to be able to tell which one they are holding.
 * {@link FigureDescriptionSchema.basis} makes that structural rather than a
 * convention somebody remembers.
 *
 * ## Only a human confirms
 *
 * Same rule as every other narrative here: the state machine is
 * {@link NarrativeSchema}'s, `confirmed_by.kind` must be `"human"`, and an
 * agent cannot confirm its own draft. This file carries the draft and the
 * basis; nothing in it is settled until a person says so.
 */
import { z } from "zod";

import { AttributionSchema } from "./attribution.ts";
import { NarrativeSchema } from "./narrative.ts";

/**
 * How much the describer actually looked at.
 *
 * - `labels-only` — read from `vector-labels.json` and nothing else. Trust the
 *   nouns; distrust every relation, multiplicity and anything drawn without
 *   text. Glyph-only content is invisible at this basis and its absence is
 *   not evidence of absence.
 * - `labels-and-render` — the page was rendered and looked at beside the
 *   labels. Arrows, nesting and glyph columns are in scope.
 *
 * There is no third value and no default. A description whose basis nobody
 * recorded is one a reader cannot weigh, which is the `nso8` failure.
 */
export const DESCRIPTION_BASES = ["labels-only", "labels-and-render"] as const;
export type DescriptionBasis = (typeof DESCRIPTION_BASES)[number];

export const FigureDescriptionSchema = z
  .object({
    /** 1-based, matching `VectorFigurePage.page` so the two join. */
    page: z.number().int().positive(),
    /**
     * The figure as the document names it — `"Figure 2"`, `"Fig. 8.4(a)"`.
     *
     * Optional, because a page may draw a figure the text never labels, and
     * inventing a number to fill the field would assert a citation that does
     * not exist.
     */
    figure: z.string().min(1).optional(),
    basis: z.enum(DESCRIPTION_BASES),
    /** Who looked, and when. */
    described_by: AttributionSchema,
    described_at: z.string().min(1),
    /**
     * The description itself, in the standard narrative state machine.
     *
     * An agent writes `draft`; only a human may move it to `confirmed`.
     */
    narrative: NarrativeSchema,
    /**
     * What the describer could NOT read, in their own words.
     *
     * Required at `labels-only` and optional otherwise — at that basis there
     * is always something, and saying "nothing" is the claim the measurement
     * cannot support. At `labels-and-render` an empty gap list is a real
     * finding rather than an omission.
     */
    unread: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.basis === "labels-only" && !d.unread) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unread"],
        message:
          "a labels-only description must say what it could not read — arrows, nesting and " +
          "glyph-only content are invisible at this basis, and silence about them reads as " +
          "their absence (bean a8wy)",
      });
    }
  });

export const FIGURE_DESCRIPTIONS_SCHEMA_ID = "folio-figure-descriptions/v1";

export const FigureDescriptionsFileSchema = z
  .object({
    $schema: z.literal(FIGURE_DESCRIPTIONS_SCHEMA_ID),
    /** Free prose about this file as a whole, as `image-verdicts.json` carries. */
    _comment: z.string().optional(),
    /** doc-id → the figures described in that document. */
    descriptions: z.record(z.string().min(1), z.array(FigureDescriptionSchema).min(1)),
  })
  .strict()
  .superRefine((f, ctx) => {
    for (const [doc, list] of Object.entries(f.descriptions)) {
      const seen = new Set<string>();
      for (const [i, d] of list.entries()) {
        // One description per (page, figure). A page may draw two figures, so
        // the page alone is not the key — `9789240010567-eng` page 92 is the
        // case that makes this concrete.
        const key = `${d.page}\u0000${d.figure ?? ""}`;
        if (seen.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["descriptions", doc, i],
            message: `page ${d.page}${d.figure ? ` / ${d.figure}` : ""} described twice`,
          });
        }
        seen.add(key);
      }
    }
  });

export type FigureDescription = z.infer<typeof FigureDescriptionSchema>;
export type FigureDescriptionsFile = z.infer<typeof FigureDescriptionsFileSchema>;

/** The file's name at a library's root, beside `image-verdicts.json`. */
export const FIGURE_DESCRIPTIONS_FILE = "figure-descriptions.json";
