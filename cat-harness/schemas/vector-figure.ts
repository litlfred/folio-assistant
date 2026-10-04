/**
 * @graphNode schema
 *
 * A DRAWN figure, assembled and rendered — bean `ay3x`, under `m4xy`. The step
 * above `vector-labels.json` that `a8wy` stopped short of, built on the
 * owner's ruling of 2026-10-03: *"Yes, build it."*
 *
 * ## Where it sits
 *
 * | | measurement, machine-derived | judgement, someone looked |
 * |---|---|---|
 * | raster | `<entry>/images.json` | `<library>/image-verdicts.json` |
 * | vector labels | `<entry>/vector-labels.json` | `<library>/figure-descriptions.json` |
 * | vector figures | `<entry>/vector-figures.json` + `figures/*.png` | `<library>/image-verdicts.json`, keyed `vfig-pNNN` |
 *
 * The figures share the RASTER verdict file rather than gaining a fourth,
 * because the call made about them is the raster call — figure or furniture,
 * and if figure, what it shows. `apply-image-verdicts.ts` writes both, through
 * the same `inspection` basis, so the two kinds of image cannot come to be
 * judged by different rules.
 *
 * ## The basis is ALWAYS present, and the extractor never assigns a role
 *
 * `d5f1` closed a silently placed image: an image whose role nobody could
 * account for. A render is the same risk with a new source, so every entry
 * carries a basis naming who or what looked:
 *
 * - `assembly` — `pdf-vector-figures.py` grouped the page and rendered it. It
 *   names itself, and it **assigns no role**: `role` is `undetermined`. That
 *   is the whole of the refusal `m4xy` makes — no coverage threshold separates
 *   a figure from furniture across this corpus (`j820`, 29 documents), so the
 *   arm does not pretend one does.
 * - `inspection` — somebody looked at the render and said what it is. The
 *   raster schema's own {@link InspectionBasisSchema}, reused rather than
 *   restated.
 *
 * So `undetermined` ⇔ `assembly`, structurally. Unlike `images.json`, where
 * `undetermined` means NO basis, here it means "the machine looked and decided
 * nothing" — which is a different fact, and recorded as one.
 *
 * ## `shows` is how a figure is reached, and it is the inspector's to set
 *
 * {@link VectorFigureSchema.captionLabels} are CANDIDATES: every line-start
 * `Fig. N` on the page, cross-references included, the same lower bound
 * `vector-labels.json` keeps. A page that mentions Fig. 4 in passing does not
 * show Fig. 4. Only an inspector, looking, can say which figure the render
 * holds — so `image-descriptions` counts a declared figure as reached by this
 * arm only through `shows` on an inspected entry, never through a candidate.
 *
 * ## The assembly is structure, not prose
 *
 * Groups are connected components of touching drawing rectangles; boxes are
 * closed shapes holding a label, with `parent` by containment; connectors are
 * open strokes whose two ends land in labelled boxes. Every rule is a fact
 * about the drawing — the only length used is the stroke's own width — and
 * `pdf-vector-figures.py` carries each, with the page it was checked on.
 * A connector end that lands in no box is `null`, not snapped to the nearest:
 * `a8wy`'s Annif case shows a relation guessed from layout reading wrong on
 * every row.
 */
import { z } from "zod";

import { AttributionSchema } from "./attribution.ts";
import { DESCRIBABLE_ROLES, IMAGE_ROLES, InspectionBasisSchema } from "./document-image.ts";
import { NarrativeSchema } from "./narrative.ts";
import { BBoxSchema } from "./vector-labels.ts";

/** What the extractor did. Names itself; asserts no role. */
export const AssemblyBasisSchema = z
  .object({
    method: z.literal("assembly"),
    /** The script, as a `script` attribution — what looked. */
    by: AttributionSchema,
    page: z.number().int().positive(),
  })
  .strict();

export const VectorFigureBasisSchema = z.discriminatedUnion("method", [
  AssemblyBasisSchema,
  InspectionBasisSchema,
]);

export const VectorBoxSchema = z
  .object({
    id: z.string().regex(/^b\d+$/),
    bbox: BBoxSchema,
    /** The smallest other labelled box containing this one, or null. */
    parent: z.string().regex(/^b\d+$/).nullable(),
    labels: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const VectorConnectorSchema = z
  .object({
    /** Box the stroke starts in, or null when it lands in none. */
    from: z.string().regex(/^b\d+$/).nullable(),
    to: z.string().regex(/^b\d+$/).nullable(),
    bbox: BBoxSchema,
  })
  .strict();

export const VectorAssemblySchema = z
  .object({
    /** Drawing operations on the page. Reported, never graded. */
    drawings: z.number().int().nonnegative(),
    /** Of those, page-sized backgrounds that joined no component. */
    background: z.number().int().nonnegative(),
    groups: z.array(
      z
        .object({
          bbox: BBoxSchema,
          drawings: z.number().int().positive(),
          /** Touches the page boundary — chapter tabs, bleed bands. A fact, not a verdict. */
          pageEdge: z.boolean(),
          /** Inside the rendered crop. Edge groups are left out when anything else is labelled. */
          rendered: z.boolean(),
          labels: z.array(z.string().min(1)).min(1),
        })
        .strict(),
    ),
    boxes: z.array(VectorBoxSchema),
    /** Closed shapes holding no label — arrowheads, bullets, swatches. Counted, not listed. */
    unlabelledClosedShapes: z.number().int().nonnegative(),
    connectors: z.array(VectorConnectorSchema),
    /** Lines inside the region but in no component — the white space `a8wy` found real labels in. */
    between: z.array(z.string().min(1)),
    /** Lines outside the rendered region: furniture, and sometimes figure titles. The crop's stated limit. */
    outside: z.number().int().nonnegative(),
  })
  .strict();

export const VectorFigureSchema = z
  .object({
    /** `vfig-p034` — one per qualifying page; a verdict keys on it. */
    id: z.string().regex(/^vfig-p\d{3,}$/),
    /** The render, relative to the entry; null when nothing was rendered, with the reason. */
    file: z.string().min(1).nullable(),
    unrendered_reason: z.string().min(1).optional(),
    role: z.enum(IMAGE_ROLES),
    basis: VectorFigureBasisSchema,
    page: z.number().int().positive(),
    rotation: z.number().int(),
    /** Figure numbers from the page's caption candidates — candidates, not claims. */
    captionLabels: z.array(z.string().min(1)),
    /** The rendered rectangle, visible frame. */
    region: BBoxSchema.nullable(),
    assembly: VectorAssemblySchema,
    /** Which declared figures the render shows. Inspection only — see the module docblock. */
    shows: z.array(z.string().min(1)).min(1).optional(),
    narrative: NarrativeSchema.optional(),
  })
  .strict()
  .superRefine((f, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    if (f.basis.page !== f.page) issue(["basis", "page"], "basis.page must be the figure's page");
    if (f.basis.method === "assembly") {
      if (f.role !== "undetermined") {
        issue(
          ["role"],
          "an assembly basis assigns no role — figure-vs-furniture is decided by looking, " +
            "since no threshold separates them on this corpus (beans m4xy, j820, ay3x)",
        );
      }
      if (f.basis.by.kind !== "script") issue(["basis", "by", "kind"], "an assembly basis names a script");
      if (f.shows) issue(["shows"], "`shows` is an inspector's claim and needs an inspection basis");
      if (f.narrative) issue(["narrative"], "a narrative needs somebody to have looked");
    } else if (f.role === "undetermined") {
      issue(["role"], "an inspection that decided nothing should not replace the assembly basis");
    }
    if (f.role === "furniture") {
      // No threshold reaches a render: the vector arm takes no cutoff, and an
      // inspector who finds furniture says `decorative` with the reason.
      issue(["role"], "`furniture` comes only from a caller-supplied raster threshold");
    }
    if (f.basis.method === "inspection" && f.file === null) {
      issue(["file"], "nothing was rendered, so nothing could have been inspected");
    }
    if (f.narrative && !DESCRIBABLE_ROLES.includes(f.role)) {
      issue(["narrative"], `a ${f.role} carries no narrative`);
    }
    if ((f.file === null) !== (f.unrendered_reason !== undefined)) {
      issue(["unrendered_reason"], "an unrendered figure must say why, and a rendered one must not");
    }
    if (f.page !== Number(f.id.slice(6))) issue(["id"], "the id names the page");
  });

export const VECTOR_FIGURES_SCHEMA_ID = "folio-vector-figures/v1";

export const VectorFiguresSidecarSchema = z
  .object({
    $schema: z.literal(VECTOR_FIGURES_SCHEMA_ID),
    doc_id: z.string().min(1),
    /** `null` is could-not-determine, never "draws no figures" — the `dh4f` rule. */
    figures: z.array(VectorFigureSchema).nullable(),
    undetermined_reason: z.string().min(1).optional(),
  })
  .strict()
  .refine((s) => (s.figures === null) === (s.undetermined_reason !== undefined), {
    message:
      "`figures: null` means COULD NOT DETERMINE and must say why; an empty array is the " +
      "determined finding that no caption page carries a vector layer",
    path: ["undetermined_reason"],
  });

export type VectorFigure = z.infer<typeof VectorFigureSchema>;
export type VectorFiguresSidecar = z.infer<typeof VectorFiguresSidecarSchema>;

/** The sidecar's filename inside a `library/<bib-slug>/` entry. */
export const VECTOR_FIGURES_FILE = "vector-figures.json";
/** Where the renders land inside the entry. */
export const VECTOR_FIGURES_DIR = "figures";

/** Is this verdict id a vector figure's rather than a raster image's? */
export function isVectorFigureId(id: string): boolean {
  return /^vfig-p\d{3,}$/.test(id);
}
