/**
 * The document bootstrap owes instead of a visualiser: its own graph, as Zod.
 *
 * @module schemas/bootstrap-graph
 * @graphNode schema
 *
 * Bean `n350`. `bootstrap/bootstrap.json`'s `renderExemption.owes` names this
 * document, and until now it had no schema. The emission skill described it
 * in prose, and the code that read it cast (`doc.problems as string[]`). A
 * property stated in prose and read through a cast is not checked anywhere.
 *
 * ## Why it lives here and not in `bootstrap/`
 *
 * For the reason `discussion.ts` gives: bootstrap holds no executable code and
 * "should not know zod at all" (owner, 2026-09-20), and Zod is an authoring
 * tool that lives in cat-harness (owner, 2026-09-24). It was in
 * `bootstrap-tools` until then.
 *
 * ## Which document this describes
 *
 * `gen-bootstrap-graph.ts`'s, which runs as a test subject and publishes
 * nothing. Since 2026-09-30 (owner, bean `xsqm`: "bootstrap.jsonld, should be
 * in bootstrap-tools") the PUBLISHED `bootstrap.jsonld` is written by
 * bootstrap-tools' `scripts/export-graph.ts` in bootstrap's classes and
 * standard properties, and its shape is `GraphExportSchema` in
 * `bootstrap-tools/schemas/graph-export.ts`, not this one. Before then it was
 * `kg-export --instance ./bootstrap` (bean `dyd3`), whose PROV fields are why
 * `generatedAt` and `sourceCommit*` are optional below.
 */

import { z } from "zod";

/** One node of the graph. Only the two keys every node carries are required. */
export const BootstrapGraphNodeSchema = z
  .object({
    "@id": z.string().min(1),
    "@type": z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  })
  .passthrough();

export const BootstrapGraphDocumentSchema = z
  .object({
    "@context": z.unknown(),
    /** Must equal the path the document is published at (bootstrap-graph-publication). */
    "@id": z.string().url(),
    "@type": z.string().min(1),
    /** The instance's declared name. */
    repository: z.string().min(1),
    /**
     * The instance-bound collectors that were NOT run. "Has no tools" and "tools
     * were never looked for" are different facts; this is how the document says
     * which one it means.
     */
    omitted: z.array(z.string().min(1)),
    /** Sources that could not be read, counted rather than silently dropped. */
    problems: z.array(z.string()).optional(),
    counts: z.record(z.string(), z.number().int().nonnegative()).optional(),
    // PROV provenance, added by the publisher and absent from the generator's
    // build. Optional, so both documents parse; see the module doc.
    generatedAt: z.string().optional(),
    sourceCommit: z.string().url().optional(),
    sourceCommitSha: z.string().optional(),
    sourceCommitAt: z.string().optional(),
    sourceTreeDirty: z.boolean().optional(),
    /** Said instead of `sourceCommit*` when the build could not read git. */
    sourceCommitUnavailable: z.unknown().optional(),
    "@graph": z.array(BootstrapGraphNodeSchema),
  })
  .passthrough();

export type BootstrapGraphDocument = z.infer<typeof BootstrapGraphDocumentSchema>;
