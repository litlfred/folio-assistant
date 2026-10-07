/**
 * A SUBSTRATE SNAPSHOT: the root declaration of a subscribed Knowledge Graph,
 * cached at the commit the subscription pins. Issue #1719, epic bean `fnx4`,
 * slice 4 of `docs/proposals/kg-subscriptions.md`.
 *
 * @module schemas/substrate-snapshot
 * @graphNode schema
 *
 * ## Why a wrapper and not a copy of `<name>.json`
 *
 * A bare copy of the substrate's `<name>.json` would carry a `name` equal to
 * its file stem, and that is exactly the rule bootstrap and this harness use
 * to recognise a directory's declaration (`declarationFileIn`,
 * `findDeclarationFile`). A cached copy would then BE a declaration to every
 * scanner that walks the tree: a second instance nobody installed, with the
 * substrate's directories resolving into a checkout that does not hold them.
 * So the snapshot declares what it is (`$schema`), and the upstream bytes sit
 * in `raw`, untouched, where no scanner reads them as a declaration.
 *
 * ## Why `raw` and a digest, not a parsed object
 *
 * Somebody else's bytes, pinned: the `sync-remote-skills` rule. The digest is
 * over `raw` exactly as fetched, so "is this still what the pin says" is a
 * question a re-fetch can answer byte for byte. `summary` is the part a reader
 * or the visualizer needs without parsing `raw`, and it is DERIVED from `raw`
 * by the same code that judged it, so the two cannot disagree at write time.
 */
import { z } from "zod";

import { RepoFullNameSchema } from "./repo-full-name.js";

export const SUBSTRATE_SNAPSHOT_SCHEMA = "folio-substrate-snapshot/v1";

/**
 * The tag on a MATERIALISED PART's record — a subgraph or asset of a
 * subscribed substrate, copied at the pin (slices 5 and 6). The record's full
 * schema is `folio-assistant-core/schemas/kg-materialization.ts`, because it
 * embeds core's `MaterializationSchema`, which this instance may not import.
 * The tag lives HERE so the readers below core — the subscriptions page, and
 * `check:materialized-fixity`'s walk — recognise a record without importing up.
 */
export const KG_PART_RECORD_SCHEMA = "folio-kg-materialization/v1";

/**
 * The tag on a METADATA-MODE record (`kg:materialize --nodes`, bean `c1m4`):
 * one subgraph's `index.hydrated.jsonld`, fetched at the pin, with its sha256.
 * Full schema: `KgNodesRecordSchema` in
 * `folio-assistant-core/schemas/kg-materialization.ts`; the tag lives here for
 * the same reason as {@link KG_PART_RECORD_SCHEMA}.
 */
export const KG_NODES_RECORD_SCHEMA = "folio-kg-nodes/v1";

/** The graph typology of the directory an instance keeps its snapshots in. Found through the declaration, never by path. */
export const SNAPSHOT_GRAPH_TYPOLOGY = "substrate-snapshot";

/** A snapshot's filename: `<subscription id>.substrate.json`. */
export const SNAPSHOT_SUFFIX = ".substrate.json";

/**
 * What KIND of Knowledge Graph a subscription is to — owner, 2026-10-06.
 *
 * - `substrate` — bootstrap's definition, unchanged: the declaration declares
 *   at least one harness (a Subgraph holding Skills, Roles or Processes). Its
 *   harnesses may be CHOSEN and instantiated.
 * - `content` — the declaration declares Subgraphs and NO harness: a FHIR IG,
 *   a document corpus. Its Subgraphs may be referenced and materialised; it
 *   contributes no skills, processes or roles to any harness overlay, so a
 *   content subscription chooses no harness and its snapshot lists none.
 *
 * ABSENT means `substrate` on both the subscription and the snapshot, so every
 * record written before the kind existed reads as what it was. A content
 * record always carries `kind: "content"` — never inferred from an empty list.
 */
export const SUBSCRIPTION_KINDS = ["substrate", "content"] as const;
export type SubscriptionKind = (typeof SUBSCRIPTION_KINDS)[number];
export const SubscriptionKindSchema = z.enum(SUBSCRIPTION_KINDS);

/** A record's kind, with absent read as `substrate`. */
export function subscriptionKindOf(x: { kind?: SubscriptionKind | undefined }): SubscriptionKind {
  return x.kind ?? "substrate";
}

export const SubstrateSnapshotSchema = z
  .object({
    $schema: z.literal(SUBSTRATE_SNAPSHOT_SCHEMA),
    /** The `subscriptions[].id` this snapshot belongs to. */
    subscription: z.string().min(1),
    /** See {@link SUBSCRIPTION_KINDS}. Absent: `substrate`. Written only as `content`. */
    kind: SubscriptionKindSchema.optional(),
    repository: RepoFullNameSchema,
    /** The pinned commit the bytes were read at — a full SHA, never a branch. */
    ref: z.string().regex(/^[0-9a-f]{40}$/),
    /**
     * The upstream file, relative to the substrate's repository root:
     * `<name>.json` at the root, or `<upstreamPath>/<name>.json` when the
     * declaration is nested (bean `437w`). Its directory is the
     * subscription's `upstreamPath`, and `kg:subscribe:check` holds the two
     * equal.
     */
    file: z.string().regex(/^(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[^/]+\.json$/),
    /** The upstream bytes, exactly as fetched. */
    raw: z.string().min(1),
    fixity: z.object({ algorithm: z.literal("sha256"), digest: z.string().regex(/^[0-9a-f]{64}$/) }).strict(),
    /** What the judgement found, derived from `raw`. */
    summary: z
      .object({
        name: z.string().min(1),
        title: z.string().optional(),
        version: z.string().optional(),
        subgraphs: z.array(z.object({ id: z.string().min(1), graphTypologies: z.array(z.string().min(1)) }).strict()),
        /** At least one for a `substrate`; none for `content` — the schema holds the kind and the list together. */
        harnesses: z.array(z.string().min(1)),
      })
      .strict(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((s, ctx) => {
    const kind = subscriptionKindOf(s);
    if (kind === "substrate" && s.summary.harnesses.length === 0) {
      ctx.addIssue({ code: "custom", path: ["summary", "harnesses"], message: "a substrate snapshot lists at least one harness; one with none is `kind: \"content\"`" });
    }
    if (kind === "content" && s.summary.harnesses.length > 0) {
      ctx.addIssue({ code: "custom", path: ["summary", "harnesses"], message: "a content snapshot lists no harness — a content Knowledge Graph contributes none" });
    }
  });

export type SubstrateSnapshot = z.infer<typeof SubstrateSnapshotSchema>;
