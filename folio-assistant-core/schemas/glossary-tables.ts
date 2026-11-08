/**
 * `folio-glossary-tables/v1`: which document blocks show which glossary as a
 * table, read by the Tool `glossary-table` (`scripts/glossary-table.ts`).
 *
 * ```json
 * { "$schema": "folio-glossary-tables/v1",
 *   "tables": [{ "glossary": "glossary/x.glossary.json", "block": "folio/doc/glossary/t.md", "kind": "terms" }] }
 * ```
 *
 * Paths are relative to the instance root. The file lives at
 * `<instance>/glossary/glossary-tables.json`, inside the `glossary` kind's
 * directory, so the kind lists this family beside `folio-glossary/v1`
 * (`typologies/glossary.json`) and `validators/glossary-tables.json` names
 * this schema as its validator. It lives here, not in the script, so a
 * validator node can name it the way every other one names a `schemas/` file.
 *
 * @module folio-assistant-core/schemas/glossary-tables
 * @graphNode schema
 */
import { z } from "zod";

export const GLOSSARY_TABLES_SCHEMA_ID = "folio-glossary-tables/v1" as const;

const RelPath = z
  .string()
  .min(1)
  .refine((f) => !f.startsWith("/") && !f.split("/").includes(".."), "relative to the instance root, without `..`");

export const GlossaryTablesSchema = z
  .object({
    $schema: z.literal(GLOSSARY_TABLES_SCHEMA_ID),
    tables: z
      .array(
        z
          .object({
            glossary: RelPath.refine((f) => f.endsWith(".json"), "a .json glossary"),
            block: RelPath.refine((f) => f.endsWith(".md"), "a document block, a .md file"),
            kind: z.enum(["terms", "acronyms"]),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type GlossaryTables = z.infer<typeof GlossaryTablesSchema>;
