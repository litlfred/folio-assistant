/**
 * @graphNode schema
 *
 * The positioned TEXT on a page that declares a figure — bean `a8wy`, under
 * `m4xy`. The labels of a figure that is DRAWN rather than placed.
 *
 * ## Why this is not `images.json`
 *
 * `pdf-images.py` recovers the RASTER layer: an image object the PDF places on
 * a page, with a rectangle, a coverage and a role. WHO's conceptual figures —
 * frameworks, maturity models, taxonomies, process flows — are **drawn**, in
 * path operators and text, so there is no image object and nothing for that arm
 * to place. `9789240120747-eng` declares six captioned figures and places zero
 * images; `check-l1-complete` reported *"0 image(s), 0 describable and all
 * described"* over it, which is true about raster and misleading about figures.
 *
 * A vector figure is not a placed raster image, and forcing it into
 * `DocumentImageSchema` would make `role` and `basis` mean two things:
 * there is no rectangle to measure coverage on, no `xref` to dedupe by, and no
 * pixel to inspect. So this is its own sidecar, `vector-labels.json`, and the
 * two are joined by the page number and by nothing else.
 *
 * ## What it refuses to do, and the measurement behind each refusal
 *
 * **It does not decide which labels belong to the figure.** The obvious rule —
 * a text line is figure content when its rectangle intersects a drawing's —
 * was tested before it was rejected. On `9789240120747-eng` page 34 it
 * separates perfectly: of 153 labels, 149 intersect and the four that do not
 * are the running head, the page number, the caption and the source line. On
 * `9789240010567-eng` page 25 it is false for **33 labels of which only three
 * are furniture** — it would drop the four architecture names `SILOED`, `MUD`,
 * `INTEGRATED` and `EXCHANGED`, every line of their glosses, both axis labels
 * (`TECHNICAL DEBT`, `ECONOMIES OF SCALE`, `ALIGNMENT WITH DIGITAL HEALTH
 * STRATEGY`) and the three-entry legend, because those sit in the white space
 * BETWEEN the drawn boxes rather than on them. Rendered and checked by eye,
 * 2026-09-24.
 *
 * So every line on a qualifying page is recorded, and
 * {@link VectorLabelSchema.intersectsDrawing} is stored as the **measurement it
 * is** rather than used as a filter. Same rule this repository applies to any
 * number it prints: reported, never graded.
 *
 * **It does not group.** A label is one MuPDF *line*, and nothing above that.
 * Which labels form a box, which box sits inside which layer, and which arrow
 * runs where are all inference; `m4xy` is explicit that a threshold chosen
 * after seeing this corpus is a number chosen to fit the answer.
 *
 * The line rather than the BLOCK is a correction, not a preference. MuPDF's
 * block segmentation merges labels that are nowhere near each other: on
 * `9789240010567-eng` page 25 one block holds six circled numerals spread over
 * 200 pt across three separate architecture diagrams, and another holds
 * `HEALTH USE CASE` and `HEALTH PROGRAMME` — the titles of two DIFFERENT
 * architectures, 130 pt apart. A consumer reading those blocks' bounding boxes
 * would place both titles in one rectangle spanning half the figure.
 *
 * **It does not claim reading order.** {@link VectorFigurePageSchema.labels} is
 * ordered by top edge then left edge: a deterministic, stated convention so a
 * re-run diffs cleanly, and not a claim about how a reader's eye moves through
 * a diagram that has none.
 *
 * **It does not count.** No ratio of labels to declared figures is computed,
 * for `m4xy`'s reason: declared figures and recovered labels are not
 * commensurable.
 *
 * ## Which pages qualify — and the over-inclusion is chosen
 *
 * A page is recorded when it carries a **line-start `Fig.`/`Figure` + number**
 * that is not a table-of-contents entry, **and has a vector layer at all**.
 * That is looser than `declaredFigureCaptions`, which additionally requires a
 * period and whitespace before the caption text, and the looseness is paid for
 * twice over:
 *
 * - Requiring the period drops **14 of `9789240093362-eng`'s 15 figure pages**,
 *   whose captions read `Fig. 13\t Example decision-support logic matrix` — a
 *   tab, no period.
 * - Not requiring it admits pages whose only match is a cross-reference
 *   (`Fig. 4.5.1 highlights the major considerations`). A false positive costs
 *   a page of prose in the sidecar; a false negative loses a figure's labels
 *   entirely, which is the one thing this arm exists to prevent. The same
 *   asymmetry `document-image.ts` argues for `chrome`.
 *
 * **The table-of-contents guard is structural, not numeric.** A figure-list
 * entry carries a DOT LEADER — two periods separated by nothing but space —
 * and nothing else in this corpus does. Checked against every candidate in the
 * six WHO PDFs: it excludes both of `9789240010567-eng`'s figure-list pages,
 * 42 entries, and no real caption. It is deliberately NOT "the line ends in a
 * number", which drops `Figure 2.13. m4RH monitoring data … August 2010 to
 * April 2012`.
 *
 * Measured 2026-09-24 over the six WHO PDFs under `uploads/`:
 *
 * | document | pages | qualifying | labels | on a drawing |
 * |---|---:|---:|---:|---:|
 * | `9789240010567-eng` | 182 | 44 | 4 071 | 3 145 |
 * | `9789240081949-eng` | 66 | 1 | 124 | 98 |
 * | `9789240093362-eng` | 98 | 15 | 1 926 | 1 424 |
 * | `9789240120747-eng` | 84 | 6 | 783 | 574 |
 * | `9789241509510_eng` | 106 | 3 | 251 | 175 |
 * | `9789241511766-eng` | 144 | 26 | 1 851 | 899 |
 *
 * The two columns on the right are **not** a coverage: see the refusal above.
 *
 * **Known limit, stated rather than left to be discovered:** a figure whose
 * caption sits on the facing page is not recorded at all. That is a page this
 * arm does not reach, not a page it found nothing on.
 */
import { z } from "zod";

/** A rectangle in PDF user space: `[x0, y0, x1, y1]`, origin top-left. */
export const BBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const VectorLabelSchema = z
  .object({
    /** The line's text: its spans concatenated, since a span break is a style change and not a word break. */
    text: z.string().min(1),
    /**
     * The line's rectangle **in the visible frame** — rotation already applied.
     *
     * See {@link VectorFigurePageSchema.rotation}. `intersectsDrawing` is
     * computed in the unrotated frame where MuPDF reports both layers; this is
     * the frame a reader sees.
     */
    bbox: BBoxSchema,
    /**
     * Whether this block's rectangle intersects any vector drawing's.
     *
     * **A measurement, not a verdict.** See the module docblock: on
     * `9789240010567-eng` page 25 this is `false` for 33 labels of which only
     * three are furniture; the other 30 are plainly part of the figure. Nothing here filters on it, and a consumer
     * that does is asserting a coverage this arm did not establish.
     */
    intersectsDrawing: z.boolean(),
    /** Font names on the line's spans, deduplicated and sorted. */
    fonts: z.array(z.string()).min(1),
    /** Point sizes on the line's spans, deduplicated and sorted ascending. */
    sizes: z.array(z.number()).min(1),
  })
  .strict();

export const VectorFigurePageSchema = z
  .object({
    /** 1-based, matching `DocumentImage`'s `basis.page` so the two join. */
    page: z.number().int().positive(),
    /**
     * The page's rotation in degrees, as the PDF declares it.
     *
     * Recorded because it is the reason {@link VectorLabelSchema.bbox} needed
     * a decision at all: MuPDF reports text and drawings in the UNROTATED page,
     * and every figure page of `9789240010567-eng` is landscape by a 90-degree
     * rotation. A consumer that ignores this and re-derives coordinates from
     * the PDF will disagree with the sidecar by a quarter turn.
     */
    rotation: z.number().int(),
    /** Vector drawing operations MuPDF reports on the page. Reported, never graded. */
    drawings: z.number().int().nonnegative(),
    /**
     * Raster images the page also places.
     *
     * Not an exclusion. `9789240010567-eng` page 92 is the flagship case for
     * `m4xy`: five component logos were extracted by the raster arm and
     * Fig. 5.6.2, the diagram they sit inside, was not. A page can need both
     * arms, so this says which other arm also has something to say.
     */
    rasterImagesOnPage: z.number().int().nonnegative(),
    /**
     * Verbatim line-start `Fig.`/`Figure` matches on the page, table-of-contents
     * entries removed. A lower bound, and it deliberately includes
     * cross-references — plural, and never asserted to be the page's figure.
     */
    captionCandidates: z.array(z.string()).min(1),
    labels: z.array(VectorLabelSchema),
  })
  .strict();

export const VECTOR_LABELS_SCHEMA_ID = "folio-vector-labels/v1";

export const VectorLabelsSidecarSchema = z
  .object({
    $schema: z.literal(VECTOR_LABELS_SCHEMA_ID),
    doc_id: z.string().min(1),
    /**
     * `null` is could-not-determine and is NOT an empty list.
     *
     * An empty list is the determined finding that no page in the document
     * declares a figure over a vector layer. `null` says no
     * page geometry could be read at all — the same third state
     * `ImagesSidecarSchema` keeps, and for the same reason: a consumer that
     * cannot tell "looked, found none" from "could not look" reports a clean
     * run over an unread document (bean `dh4f`).
     */
    pages: z.array(VectorFigurePageSchema).nullable(),
    undetermined_reason: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.pages === null && !s.undetermined_reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["undetermined_reason"],
        message:
          "pages is null, so a reason is required — an undetermined result with no reason " +
          "cannot be told from a bug, which is the `nso8` failure",
      });
    }
    if (s.pages !== null && s.undetermined_reason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["undetermined_reason"],
        message: "pages was determined, so undetermined_reason must be absent",
      });
    }
    const seen = new Set<number>();
    for (const [i, p] of (s.pages ?? []).entries()) {
      if (seen.has(p.page)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pages", i, "page"],
          message: `page ${p.page} recorded twice — one entry per page`,
        });
      }
      seen.add(p.page);
    }
  });

export type VectorLabel = z.infer<typeof VectorLabelSchema>;
export type VectorFigurePage = z.infer<typeof VectorFigurePageSchema>;
export type VectorLabelsSidecar = z.infer<typeof VectorLabelsSidecarSchema>;

/** The sidecar's filename inside a `library/<bib-slug>/` entry. */
export const VECTOR_LABELS_FILE = "vector-labels.json";
