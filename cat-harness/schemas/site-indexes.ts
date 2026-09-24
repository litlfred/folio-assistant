/**
 * The published index files the site's viewers read — each `$schema` family
 * typed, so the graph-kind registry names a validator instead of the script
 * that writes it (#1168 B6b, bean `dv8v`).
 *
 * Until then each family was registered as `writtenBy: "scripts/…"`: the
 * registry, a `@general` node, naming its dependent, and the file checked by
 * nothing. Every schema here was taken from what its writer emits — the object
 * literal serialised by the generator — and cross-checked against the
 * committed file, so it describes the file as written rather than as intended.
 *
 * Two conventions hold throughout, because the writers share them:
 *
 * - `JSON.stringify` drops `undefined`, so a TypeScript `x?: T` is an ABSENT
 *   key, never `null`. Where the file does carry `null` it is modelled as
 *   `.nullable()`, and nowhere else.
 * - `tile` is the navbar count every generated index carries, typed once by
 *   {@link TileCountsSchema} and reused here.
 *
 * Objects are `.strict()`: these files are generated, so a key nobody declared
 * is a writer that changed without its schema.
 *
 * @graphNode schema
 * @module schemas/site-indexes
 */
import { z } from "zod";

import { SUMMARY_STATUSES } from "./block-summary.js";
import { TileCountsSchema } from "./tile-count.js";

/** A generated-index envelope: its `$schema` tag and the navbar count. */
const envelope = <T extends string>(tag: T) => ({
  $schema: z.literal(tag),
  tile: TileCountsSchema,
});

const StringList = z.array(z.string());
const Count = z.number().int().nonnegative();

// ── folio-bean-index/v1 — scripts/gen-docs-pages.ts → assets/beans/index.json ──

/** One work-plan bean, as the board and the work-plan viewer read it. */
export const BeanIndexItemSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    status: z.string(),
    type: z.string(),
    priority: z.string(),
    /** `""` when the bean has no parent. */
    parent: z.string(),
    blocking: StringList,
    blockedBy: StringList,
    createdAt: z.string(),
    updatedAt: z.string(),
    /** The body, trimmed to its first 400 characters. */
    preview: z.string(),
    /** Repository-relative path of the bean file. */
    file: z.string().min(1),
  })
  .strict();

export const BeanIndexSchema = z
  .object({
    ...envelope("folio-bean-index/v1"),
    repoWeb: z.string().min(1),
    items: z.array(BeanIndexItemSchema),
    findings: z.array(
      z
        .object({
          kind: z.enum(["blocked-without-expiry", "blocker-closed", "blocking-unknown"]),
          bean: z.string(),
          blocks: z.string(),
          detail: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

// ── folio-translation-status/v1 — scripts/gen-translation-status.ts ──

export const TranslationStatusSchema = z
  .object({
    ...envelope("folio-translation-status/v1"),
    /** `YYYY-MM-DD`: the day the counts last changed. */
    changedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** The translations directory counted, repository-relative. */
    scope: z.string(),
    locales: z.array(
      z
        .object({
          locale: z.string().min(1),
          templates: Count,
          catalogues: Count,
          entries: Count,
          translated: Count,
          fuzzy: Count,
          untranslated: Count,
          unreadable: StringList,
        })
        .strict(),
    ),
  })
  .strict();

// ── folio-schema-graph/v1 — scripts/gen-schema-viz.ts ──

const DECL_KINDS = [
  "zod-object", "zod-union", "zod-enum", "zod-array", "zod-record", "zod-scalar",
  "interface", "type-alias", "undetermined",
] as const;

export const SchemaGraphIndexSchema = z
  .object({
    ...envelope("folio-schema-graph/v1"),
    roots: StringList,
    modules: z.array(
      z
        .object({
          module: z.string(),
          instance: z.string(),
          name: z.string(),
          graphNode: z.enum(["schema", "none", "undeclared"]),
          reason: z.string().optional(),
          summary: z.string().optional(),
          isTest: z.boolean(),
        })
        .strict(),
    ),
    decls: z.array(
      z
        .object({
          id: z.string(),
          name: z.string(),
          module: z.string(),
          kind: z.enum(DECL_KINDS),
          note: z.string().optional(),
          doc: z.string().optional(),
          fields: z.array(
            z
              .object({
                name: z.string(),
                type: z.string(),
                optional: z.boolean(),
                array: z.boolean(),
                doc: z.string().optional(),
              })
              .strict(),
          ),
          extendsNames: StringList,
          values: StringList,
          refs: StringList,
          unresolved: StringList,
          external: StringList,
          exported: z.boolean(),
        })
        .strict(),
    ),
    edges: z.array(
      z
        .object({
          from: z.string(),
          to: z.string(),
          via: z.string(),
          kind: z.enum(["field", "member", "extends", "id-ref"]),
          optional: z.boolean(),
          array: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();

// ── folio-library-index/v1 and folio-library-entry/v1 — scripts/gen-library-viz.ts ──

const PageNumber = z.number().int().nullable();

export const LibraryIndexEntrySchema = z
  .object({
    id: z.string().min(1),
    instance: z.string(),
    dir: z.string(),
    title: z.string(),
    provenance: z.string(),
    rung: z.enum(["paged", "tabular", "none"]),
    docId: z.string(),
    sourceFile: z.string(),
    sourceSha256: z.string(),
    arxiv: z.string(),
    doi: z.string(),
    documentClass: z.string(),
    sections: Count,
    blocks: Count,
    images: Count,
    ocrPages: Count,
    hasOcr: z.boolean(),
    hasManifest: z.boolean(),
    hasStructure: z.boolean(),
    hasImagesJson: z.boolean(),
    pageStart: PageNumber,
    pageEnd: PageNumber,
    words: Count,
    chars: Count,
    bytes: Count,
    upload: z.enum(["match", "differs", "absent", "unknown"]),
    uploadInstance: z.string(),
    /** Absent means the reference scan did not run — a third state, not "none". */
    referencedBy: z
      .array(z.object({ kind: z.string(), instance: z.string(), from: z.string(), count: Count }).strict())
      .optional(),
    avatar: z.object({ href: z.string(), src: z.string(), source: z.enum(["cover", "figure"]) }).strict().optional(),
    summaries: z
      .object({
        prose: Count,
        summarised: Count,
        backlog: Count,
        draft: Count,
        confirmed: Count,
        stale: Count,
        rejected: Count,
        notSummarised: Count,
        unreadable: Count,
        empty: Count,
      })
      .strict()
      .optional(),
  })
  .strict();

export const LibraryIndexSchema = z
  .object({
    ...envelope("folio-library-index/v1"),
    entries: z.array(LibraryIndexEntrySchema),
    uploads: z.array(
      z
        .object({
          file: z.string(),
          kind: z.enum(["file", "intake"]),
          instance: z.string(),
          path: z.string(),
          bytes: Count,
          ext: z.string(),
          ingestedBy: z.string(),
          docId: z.string(),
          title: z.string(),
          declaredFiles: Count,
        })
        .strict(),
    ),
    queues: z.array(
      z.object({ instance: z.string(), dir: z.string(), total: Count, ingested: Count, uningested: Count }).strict(),
    ),
    refScan: z.object({ filesRead: Count, unreadable: StringList }).strict().optional(),
  })
  .strict();

/** A block summary as the library viewer shows it; optional keys are omitted when empty. */
export const BlockSummaryViewSchema = z
  .object({
    status: z.enum(SUMMARY_STATUSES),
    text: z.string().optional(),
    state: z.string().optional(),
    draftedBy: z.object({ kind: z.string(), id: z.string(), model: z.string().optional() }).strict().optional(),
    draftedAt: z.string().optional(),
    confirmedBy: z.string().optional(),
    rejectionReason: z.string().optional(),
  })
  .strict();

export const LibraryEntrySchema = z
  .object({
    $schema: z.literal("folio-library-entry/v1"),
    id: z.string().min(1),
    blocks: z.array(
      z
        .object({
          id: z.string(),
          types: StringList,
          kind: z.string(),
          title: z.string(),
          pageStart: PageNumber,
          pageEnd: PageNumber,
          target: z.string().nullable(),
          narrative: z.string().nullable(),
          content: z.string().nullable(),
          truncated: z.boolean(),
          provenance: z.string(),
          summary: BlockSummaryViewSchema.nullable(),
        })
        .strict(),
    ),
  })
  .strict();

// ── folio-voices-index/v1 — scripts/gen-voices-viz.ts ──

export const VoicesIndexSchema = z
  .object({
    ...envelope("folio-voices-index/v1"),
    directories: z.array(
      z.object({ instance: z.string(), dir: z.string(), present: z.boolean(), voices: StringList }).strict(),
    ),
    voices: z.array(
      z
        .object({
          id: z.string().min(1),
          title: z.string(),
          description: z.string(),
          instance: z.string(),
          path: z.string(),
          provenance: z.string(),
          overlaySeverity: z.string(),
          criterion: z.string(),
          sources: z.array(z.object({ title: z.string(), year: z.number().int().optional() }).strict()),
          hasInstructions: z.boolean(),
          provenanceFlags: z.array(
            z
              .object({ code: z.literal("declared-outside-cites-inside"), ruleIds: StringList, detail: z.string() })
              .strict(),
          ),
          rules: z.array(
            z
              .object({
                id: z.string(),
                title: z.string(),
                description: z.string(),
                category: z.string(),
                severity: z.string(),
                patterns: Count,
                terminology: Count,
                judgementOnly: z.boolean(),
                citation: z.enum(["library", "kg-node", "none"]),
                cites: z.string().optional(),
                citesInstance: z.string().optional(),
                pages: z.string().optional(),
                quote: z.string(),
                counterintuitive: z.boolean().optional(),
                commonError: z.string().optional(),
              })
              .strict(),
          ),
        })
        .strict(),
    ),
    totals: z
      .object({ voices: Count, rules: Count, citingLibrary: Count, citingKgNode: Count, mechanical: Count })
      .strict(),
  })
  .strict();

// ── folio-graph-projection/v1 — scripts/gen-folio-viz.ts ──

export const FolioGraphProjectionSchema = z
  .object({
    ...envelope("folio-graph-projection/v1"),
    directories: z.array(z.object({ dir: z.string(), present: z.boolean(), nodes: Count }).strict()),
    nodes: z.array(
      z
        .object({
          id: z.string(),
          summary: z.string(),
          theme: z.string().nullable(),
          /** `"<kind>:<page>"`, or null when the note is anchored to nothing. */
          anchor: z.string().nullable(),
          declaredIn: z.string().nullable(),
          links: z.array(z.object({ label: z.string(), href: z.string() }).strict()),
          chars: Count,
          file: z.string(),
        })
        .strict(),
    ),
  })
  .strict();

// ── folio-qa-index/v1 — scripts/gen-docs-pages.ts → test/results/witnesses/<slug>/qa-index.json ──

/** A QA badge's verdict: the roll-up state and the counts behind it. */
export const QaIndexBadgeSchema = z
  .object({
    state: z.enum(["fail", "warn", "pass", "unswept"]),
    counts: z.object({ fail: Count, warn: Count, pass: Count, na: Count, unknown: Count }).strict(),
  })
  .strict();

export const QaIndexSchema = z
  .object({
    $schema: z.literal("folio-qa-index/v1"),
    /** The page's slug. */
    page: z.string().min(1),
    /** Keyed `<nodeId>.<family>` or `page.<family>`; may be empty. */
    badges: z.record(z.string().min(1), QaIndexBadgeSchema),
  })
  .strict();
