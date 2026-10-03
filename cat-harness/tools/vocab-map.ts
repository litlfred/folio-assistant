/**
 * The Tool node for applying a vocabulary mapping table.
 *
 * Bean `k74z`. The owner, 2026-09-23: *"need Tools for this type of ETL
 * procedure depending on source / target content type and other metadata"*;
 * ruled 2026-10-02: option 1, mapping tables as KG data applied by ONE
 * in-process Tool. This is that Tool. The tables are the `vocab-mapping`
 * graph (`vocab-mappings/`); the function is `applyVocabMapping` in
 * `schemas/vocab-mapping.ts`, and its ConceptMap boundary is
 * `schemas/vocab-mapping-fhir.ts`.
 *
 * Its own module for the reason `sessions.ts` gives: `mcp.ts` holds the tools
 * this instance already serves over MCP, and this one is not served.
 *
 * @module tools/vocab-map
 */
import { defineTool, type ToolDefinition } from "../schemas/tool.js";
import type { ToolTypeName } from "../schemas/tool-types.js";

/** Mint the IRI for one shared type against the publication base. */
type TypeIri = (name: ToolTypeName) => string;

/** The Tool nodes for vocabulary mapping. */
export function vocabMapTools(t: TypeIri): ToolDefinition[] {
  return [
    defineTool({
      id: "vocab-map",
      title: "Apply a vocabulary mapping table",
      description:
        "Carry one source record into a target vocabulary by a declared `folio-vocab-mapping/v1` table: each source field becomes the predicate its row names, in the table's order, with a DERIVED target (such as `dcterms:title` rendering `skos:prefLabel`) copied from its authoritative one so the two cannot drift. A table is shaped like a FHIR ConceptMap: an existing ConceptMap, R4 or R5, is representable as one without loss (`fromConceptMap`), and a table can be produced as a ConceptMap (`toConceptMap`), which returns every loss rather than dropping anything silently. First consumer: `glossary-export`.",
      install: { none: true },
      invoke: {
        inProcess: { module: "schemas/vocab-mapping.ts", register: "applyVocabMapping" },
      },
      io: {
        inputs: [
          {
            name: "table",
            schema: t("Slug"),
            required: true,
            description: "The table's id, resolved from this instance's declared `vocab-mapping` directories. An unknown id is an error naming the directories searched, never an empty result.",
          },
          {
            name: "record",
            schema: t("Text"),
            required: true,
            description: "The source record, as a JSON object whose keys are the table's element codes. An absent, null, empty-string or empty-array value writes nothing.",
          },
        ],
        outputs: [
          {
            name: "properties",
            schema: t("Text"),
            description: "The mapped properties as a JSON object, keyed by each target's JSON term. Two rows writing one key is refused, not resolved.",
          },
        ],
      },
      satisfies: ["vocabulary-authority"],
      requires: { network: false },
    }),
  ];
}
