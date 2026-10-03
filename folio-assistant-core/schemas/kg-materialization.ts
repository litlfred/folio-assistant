/**
 * The record of ONE materialised part of a subscribed Knowledge Graph — a
 * subgraph, or a single asset — copied at the subscription's pin. Issue
 * #1719, epic bean `fnx4`, slices 5 and 6 of
 * `cat-harness/docs/proposals/kg-subscriptions.md`.
 *
 * @module schemas/kg-materialization
 * @graphNode schema
 *
 * ## A wrapper around `MaterializationSchema`, not a second one
 *
 * The proposal: *"the state lives on the materialisation record, and the
 * subscription holds only the choice and the pin."* So every part carries a
 * {@link MaterializationSchema} record, unchanged — three states, the five
 * gates, purpose, fixity, expiry — and this file adds only what that record
 * cannot say about itself: WHICH subscription and pin it belongs to, which
 * part of the substrate it is, and, for a subgraph, one record per file.
 *
 * Per-file records are the shape `check:materialized-fixity` already walks
 * (the `sync-remote-skills` precedent), so every held byte is verified by the
 * gate that already exists. The part's own record is a DIRECTORY record for a
 * subgraph — that gate reports it `covered-by-parts` — and carries a tree
 * digest (`treeDigest` in `cat-harness/scripts/kg-subscribe.ts`), which is
 * what catches a file ADDED under the tree, the one edit a per-file check
 * cannot see. `kg:materialize:check` holds that digest.
 *
 * ## A part that stayed referenced still has a record
 *
 * `Process_MaterializeRemote` ends in one of two places, and both write:
 * *"A refusal is written down with the same weight as a success"*. But
 * `MaterializationSchema` forbids gates on anything not materialised —
 * *"a gate verdict on a `referenced` node claims a decision nobody had to
 * make"*. Here somebody DID have to make it, and refused or could not; so the
 * verdicts go in {@link KgRefusalSchema}, beside a `referenced` record rather
 * than inside it. The inner record stays valid, and the decision is not lost.
 */
import { z } from "zod";

import { KG_PART_RECORD_SCHEMA } from "../../cat-harness/schemas/substrate-snapshot.ts";
import { RepoFullNameSchema } from "../../cat-harness/schemas/repo-full-name.ts";
import { GatesSchema, MaterializationSchema } from "./materialization.ts";

export { KG_PART_RECORD_SCHEMA };

const RelPathSchema = z
  .string()
  .min(1)
  .refine((p) => !p.startsWith("/") && !p.split("/").some((s) => s === "" || s === "." || s === ".." || s.startsWith(".")), {
    message: "a repository-relative POSIX path, with no empty, `.`/`..` or dot-prefixed segment",
  });

/** Which part of the substrate this is. A subgraph is named by the substrate's own `directories[].id`. */
export const KgPartSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("subgraph"), id: z.string().min(1), path: RelPathSchema }).strict(),
  z.object({ kind: z.literal("asset"), path: RelPathSchema }).strict(),
]);
export type KgPartRecord = z.infer<typeof KgPartSchema>;

/** One held file: the shape `check:materialized-fixity` walks. */
export const KgFileRecordSchema = z
  .object({
    id: z.string().min(1),
    /** Path relative to the part's `tree/` (or the licence's own name). */
    name: z.string().min(1),
    materialization: MaterializationSchema,
  })
  .strict();

const GATE_NAMES = ["size", "restrictions", "retention", "sourceLoss", "copyright"] as const;

/** Why a chosen part stayed referenced: every gate's answer, and which of them stopped it. */
export const KgRefusalSchema = z
  .object({
    gates: GatesSchema,
    refused: z.array(z.enum(GATE_NAMES)),
    unanswered: z.array(z.enum(GATE_NAMES)),
    /** A purpose is asked FIRST; a part with none cannot have its gates judged. */
    purposeMissing: z.boolean().optional(),
  })
  .strict();

export const KgMaterializationRecordSchema = z
  .object({
    $schema: z.literal(KG_PART_RECORD_SCHEMA),
    /** The `subscriptions[].id` this part belongs to. */
    subscription: z.string().min(1),
    repository: RepoFullNameSchema,
    /** The pin the part was asked at — the subscription's `ref` when it was written. */
    ref: z.string().regex(/^[0-9a-f]{40}$/),
    part: KgPartSchema,
    materialization: MaterializationSchema,
    /** A held SUBGRAPH: one record per file under `tree/`. */
    files: z.array(KgFileRecordSchema).optional(),
    /** The upstream licence, copied beside the tree so its notice travels with the copy. */
    licence: KgFileRecordSchema.optional(),
    /** Present iff the part stayed referenced. */
    refusal: KgRefusalSchema.optional(),
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const held = r.materialization.state === "materialized";
    const issue = (message: string): void => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (r.materialization.state === "unknown") {
      issue("a part record is written by the process that decided it, so it is never `unknown`: held, or referenced with why");
    }
    if (held && r.refusal) issue("a held part carries no `refusal`: its gates are on its materialization record");
    if (!held && !r.refusal) issue("a part that stayed referenced records why, in `refusal`");
    if (!held && (r.files?.length || r.licence)) issue("a part that stayed referenced holds no files");
    if (held && r.materialization.upstreamVersion !== r.ref) {
      issue("a held part's `materialization.upstreamVersion` is the pin it was copied at, `ref`");
    }
    if (held && !r.materialization.fixity) issue("a held part carries `fixity` — a tree digest for a subgraph, the file's digest for an asset");
    if (held && r.part.kind === "subgraph" && !r.files?.length) issue("a held subgraph lists its files, one record each");
    if (r.part.kind === "asset" && r.files?.length) issue("an asset is one file; its digest is on the part's own record");
  });
export type KgMaterializationRecord = z.infer<typeof KgMaterializationRecordSchema>;

/**
 * What the SUBSCRIBER decides before anything is copied — the lane
 * `Process_MaterializeRemote` gives a person. Purpose first, then four of the
 * five gates. `size` is not here: it is the one gate a service answers, by
 * measuring what would be taken against `maxBytes`.
 *
 * Absent is not permitted. A gate this file does not answer is `unknown`, and
 * `unknown` on any gate keeps the part referenced — *"an unanswered gate
 * counts as a refusal"* (`Gateway_Gates`).
 */
export const KgDecisionsSchema = z
  .object({
    purpose: z.enum(["working", "archival", "both"]).optional(),
    /** The size budget, in bytes. Absent: {@link DEFAULT_MAX_BYTES}. */
    maxBytes: z.number().int().positive().optional(),
    /** When the copy expires; recorded as `expiresAt`. */
    expiresAt: z.string().min(1).optional(),
    gates: z
      .object({
        restrictions: GatesSchema.shape.restrictions.optional(),
        retention: GatesSchema.shape.retention.optional(),
        sourceLoss: GatesSchema.shape.sourceLoss.optional(),
        copyright: GatesSchema.shape.copyright.optional(),
      })
      .strict()
      .optional(),
    /** Who decided, applied to every gate that does not name its own `decidedBy`. */
    decidedBy: z.string().min(1).optional(),
  })
  .strict();
export type KgDecisions = z.infer<typeof KgDecisionsSchema>;

/** 50 MiB: a subgraph is prose and schemas, and anything larger is a dataset that deserves the question asked. */
export const DEFAULT_MAX_BYTES = 50 * 1024 * 1024;
