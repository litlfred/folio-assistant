/**
 * Content-type-specific translation tool registry.
 *
 * Each content adapter declares the translation formats it handles and
 * the scripts/extractors for each format. This schema is the bridge
 * between the generic translation pipeline (pot-extract, po-inject,
 * po-resolve) and the content-type-specific scripts ported from
 * smart-base.
 *
 * ## Architecture (issue #223 separation of concerns)
 *
 * ```
 * adapters/<type>/tools/translation.ts  — adapter-specific extract/inject
 * content/pipeline/pot-extract.ts       — generic Markdown extraction
 * content/pipeline/po-inject.ts         — generic Markdown injection
 * content/pipeline/po-resolve.ts        — PO source resolution (4-step)
 * scripts/translation/*.py             — smart-base Python originals
 * ```
 *
 * The generic pipeline handles Markdown (every content type has it).
 * Adapter-specific translation tools extend it with format-specific
 * extractors (PlantUML, SVG, ArchiMate, FHIR, FSH, LaTeX, etc.).
 *
 * ## Content type → format mapping
 *
 * | Content type | Formats | Smart-base source |
 * |---|---|---|
 * | document | Markdown | extract_translations.py L633–856 |
 * | paper | Markdown + LaTeX | (no smart-base; Lean terms stay English) |
 * | dak (WHO L2) | Markdown + PlantUML + SVG + ArchiMate + Excel | extract_translations.py full |
 * | ig (WHO L3) | Markdown + FSH + FHIR JSON | inject_translations.py FHIR section |
 *
 * @module schemas/translation-tools
 * @graphNode schema
 */

import { z } from "zod";

// ── Format extractors ───────────────────────────────────────────

/**
 * A translatable format that a content type can declare.
 *
 * Each format maps to an extraction function (source → POT entries)
 * and an injection function (PO entries → target source).
 */
export const TranslatableFormatSchema = z.object({
  /** Format identifier. */
  id: z.string(),
  /** Human-readable name. */
  name: z.string(),
  /** File extensions this format applies to. */
  extensions: z.array(z.string()),
  /** Smart-base Python script that handles this format (reference). */
  smartBaseScript: z.string().optional(),
  /** Smart-base function/line range for extraction. */
  smartBaseExtractRef: z.string().optional(),
  /** Smart-base function/line range for injection. */
  smartBaseInjectRef: z.string().optional(),
  /** TypeScript module that implements extraction (relative to repo root). */
  extractModule: z.string().optional(),
  /** TypeScript module that implements injection (relative to repo root). */
  injectModule: z.string().optional(),
  /**
   * Notes about translating THIS format specifically, as distinct from
   * `ContentTypeTranslation.notes`, which describes the content type as a
   * whole. "Lean 4 terms stay in English" and "the diagram is re-rendered
   * after injection" are properties of the format, not of the folio.
   */
  notes: z.string().optional(),
});

export type TranslatableFormat = z.infer<typeof TranslatableFormatSchema>;

/**
 * Content-type translation capability declaration.
 *
 * Each content adapter registers one of these to declare what
 * formats it can translate and what scripts handle each format.
 */
export const ContentTypeTranslationSchema = z.object({
  /** Content type identifier (matches adapter name). */
  contentType: z.string(),
  /** Human-readable name. */
  name: z.string(),
  /** Translatable formats this content type supports. */
  formats: z.array(TranslatableFormatSchema),
  /** Whether RTL rendering is supported. */
  rtlSupported: z.boolean().default(false),
  /** BPMN diagrams that need re-rendering for translation. */
  bpmnDiagrams: z.array(z.string()).optional(),
  /** Additional notes about translation for this content type. */
  notes: z.string().optional(),
});

export type ContentTypeTranslation = z.infer<typeof ContentTypeTranslationSchema>;

// ── Registry ────────────────────────────────────────────────────

/**
 * Built-in content type translation declarations.
 *
 * These map each content type to the formats it handles and the
 * scripts that extract/inject translations for each format.
 */
export const CONTENT_TYPE_TRANSLATIONS: ContentTypeTranslation[] = [
  {
    contentType: "document",
    name: "Document (generic prose)",
    formats: [
      {
        id: "markdown",
        name: "Markdown",
        extensions: [".md"],
        smartBaseScript: "extract_translations.py",
        smartBaseExtractRef: "L633–856 (extract_markdown)",
        smartBaseInjectRef: "inject_translations.py L56–818",
        extractModule: "content/pipeline/pot-extract.ts",
        injectModule: "content/pipeline/po-inject.ts",
      },
    ],
    rtlSupported: true,
    notes: "Base content type. All other types inherit Markdown translation.",
  },

  {
    contentType: "paper",
    name: "Scientific papers & books",
    formats: [
      {
        id: "markdown",
        name: "Markdown",
        extensions: [".md"],
        extractModule: "content/pipeline/pot-extract.ts",
        injectModule: "content/pipeline/po-inject.ts",
      },
      {
        id: "latex",
        name: "LaTeX",
        extensions: [".tex"],
        notes: "Lean 4 terms and formal math stay in English. Only prose sections are translated.",
      },
    ],
    rtlSupported: false,
    notes: "LaTeX translation is manual — the pipeline extracts prose from " +
           "\\section{}, \\paragraph{}, and \\text{} commands but leaves math " +
           "and Lean terms untouched.",
  },

  {
    contentType: "dak",
    name: "WHO SMART Guidelines DAK (L2)",
    formats: [
      {
        id: "markdown",
        name: "Markdown",
        extensions: [".md"],
        extractModule: "content/pipeline/pot-extract.ts",
        injectModule: "content/pipeline/po-inject.ts",
      },
      {
        id: "plantuml",
        name: "PlantUML diagrams",
        extensions: [".puml", ".plantuml"],
        smartBaseScript: "extract_translations.py",
        smartBaseExtractRef: "L1–200 (extract_plantuml)",
        smartBaseInjectRef: "inject_translations.py L820–933 (inject_plantuml)",
      },
      {
        id: "svg",
        name: "SVG diagrams",
        extensions: [".svg"],
        smartBaseScript: "extract_translations.py",
        smartBaseExtractRef: "L200–400 (extract_svg)",
        smartBaseInjectRef: "inject_translations.py (inject_svg)",
      },
      {
        id: "archimate",
        name: "ArchiMate models",
        extensions: [".archimate"],
        smartBaseScript: "extract_translations.py",
        smartBaseExtractRef: "L400–633 (extract_archimate)",
        smartBaseInjectRef: "inject_translations.py (inject_archimate)",
      },
      {
        id: "excel",
        name: "Data dictionaries (Excel)",
        extensions: [".xlsx"],
        notes: "Data dictionary translation uses openpyxl. " +
               "Column headers and cell values in translatable columns.",
      },
      {
        id: "bpmn",
        name: "BPMN process diagrams",
        extensions: [".bpmn"],
        extractModule: "content/pipeline/bpmn-translate.ts",
        injectModule: "content/pipeline/bpmn-translate.ts",
        notes: "Element names and <documentation>. Ids, sourceRef/targetRef, " +
               "calledElement and the folio: extensions are NEVER offered for " +
               "translation — a translated id disconnects the graph and a " +
               "translated skill ref is exactly the dangling reference " +
               "check:workflow-refs exists to catch. Re-render with " +
               "`bun run render:bpmn` after injection. On overflow: measured " +
               "2026-09-18, a French set ~18% longer with every authored " +
               "&#10; break dropped re-wrapped to the same 3 lines, 42px of " +
               "an 80px task box, because bpmn-js re-wraps regardless. The " +
               "authored breaks are not load-bearing; if a diagram does " +
               "overflow, the fix is its shape bounds, not the string.",
      },
    ],
    rtlSupported: true,
    bpmnDiagrams: [
      // Was "processes/publication-workflow.bpmn", which has never
      // existed — `docs/publication-workflow.md` is a PAGE that embeds three
      // diagrams, and no .bpmn of that name was ever written. The publication
      // process itself is draft-to-publication ("From corpus to published
      // folio"), so that is what this entry meant. A path that does not
      // resolve makes the re-render silently skip it, which reads exactly
      // like a diagram that needed no work. `check:workflow-refs` now fails
      // on it.
      "processes/draft-to-publication.bpmn",
      "processes/translation-workflow.bpmn",
      "processes/human-translation-workflow.bpmn",
    ],
    notes: "Full smart-base translation coverage. PlantUML, SVG, and " +
           "ArchiMate extractors are the Python originals; TypeScript " +
           "ports are planned.",
  },

  {
    contentType: "ig",
    name: "WHO SMART Implementation Guide (L3)",
    formats: [
      {
        id: "markdown",
        name: "Markdown (narrative)",
        extensions: [".md"],
        extractModule: "content/pipeline/pot-extract.ts",
        injectModule: "content/pipeline/po-inject.ts",
      },
      {
        id: "fsh",
        name: "FSH (FHIR Shorthand)",
        extensions: [".fsh"],
        notes: "FSH translation targets Description, Title, and " +
               "designation fields. Uses FHIR translation extension.",
      },
      {
        id: "fhir-json",
        name: "FHIR JSON resources",
        extensions: [".json"],
        smartBaseScript: "inject_translations.py",
        smartBaseInjectRef: "FHIR resource translation section",
        notes: "Injects translations as FHIR translation extensions " +
               "on Coding.display, CodeableConcept.text, etc.",
      },
    ],
    rtlSupported: true,
    notes: "IG Publisher handles some translation via its own PO " +
           "mechanism. This pipeline handles narrative and FSH.",
  },
];

/**
 * Look up translation capabilities for a content type.
 */
export function getContentTypeTranslation(
  contentType: string,
): ContentTypeTranslation | undefined {
  return CONTENT_TYPE_TRANSLATIONS.find((ct) => ct.contentType === contentType);
}

/**
 * Get all translatable formats across all content types.
 */
export function allTranslatableFormats(): TranslatableFormat[] {
  return CONTENT_TYPE_TRANSLATIONS.flatMap((ct) => ct.formats);
}

/**
 * Check if a file extension is translatable for a given content type.
 */
export function isTranslatable(
  contentType: string,
  extension: string,
): boolean {
  const ct = getContentTypeTranslation(contentType);
  if (!ct) return false;
  return ct.formats.some((f) => f.extensions.includes(extension));
}
