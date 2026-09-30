/**
 * The shape of `bootstrap.jsonld`, the graph bootstrap owes in place of a
 * visualiser — as `scripts/export-graph.ts` writes it.
 *
 * @module bootstrap-tools/schemas/graph-export
 *
 * Loose on purpose where RDF is open: a node carries whatever standard
 * properties apply to it. What is fixed is what a consumer relies on — every
 * node has an `@id` and a bootstrap type, the document names itself and says
 * it is generated, and what the build could not read is counted rather than
 * dropped.
 */
import { z } from "zod";

export const GraphExportNodeSchema = z
  .object({
    "@id": z.string().url(),
    "@type": z.string().regex(/^bootstrap:[A-Z][A-Za-z]*$/, "a bootstrap class, e.g. bootstrap:Skill"),
  })
  .passthrough();

export const GraphExportSchema = z
  .object({
    "@context": z.record(z.string(), z.unknown()),
    "@id": z.string().url(),
    "@type": z.array(z.string()).refine((t) => t.includes("bootstrap:KnowledgeGraph"), "is a bootstrap:KnowledgeGraph"),
    label: z.string().min(1),
    /** Says it is generated, and by what (owner, 2026-09-30). */
    comment: z.string().min(1),
    wasAttributedTo: z.string().url(),
    versionInfo: z.string(),
    /** PROV, only when built with `--provenance`: the publish build, never the tests. */
    generatedAtTime: z.string().optional(),
    wasDerivedFrom: z.string().optional(),
    "@graph": z.array(GraphExportNodeSchema),
    /** Subgraphs declared but whose contents were not read — never an unexplained empty. */
    omitted: z.array(z.string().min(1)),
    counts: z.record(z.string(), z.number().int().nonnegative()),
    problems: z.array(z.string()),
  })
  .passthrough();

export type GraphExport = z.infer<typeof GraphExportSchema>;
