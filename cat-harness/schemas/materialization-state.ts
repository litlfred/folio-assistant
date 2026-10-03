/**
 * The materialization STATE vocabulary — whether the bytes are here, and how
 * a held copy proves it is unchanged.
 *
 * @module schemas/materialization-state
 * @graphNode schema
 *
 * ## Why only this half lives in the harness
 *
 * Bean `tlat` (placement PR5, owner ruling 2, 2026-09-30, option A): only the
 * VOCABULARY moved down from `folio-assistant-core/schemas/materialization.ts`
 * — the three states and {@link FixitySchema}. The rest of that module stays
 * in core: the five gates (size, restrictions, retention, source loss,
 * copyright), the purposes, and the record that binds them, because each gate
 * is a decision a person makes about CONTENT, and the five-gate process
 * (`sample-import.bpmn`) is where it is asked. Core imports these two names
 * from here and re-exports them, so its own consumers did not change.
 *
 * The split is the harness's own need, not tidiness: the harness already
 * spoke this vocabulary without being able to import it —
 * `schemas/referenced-source.ts` names state `referenced`, `cat-harness.ts`
 * names the three states, and `binary-release.ts` restates the fixity shape —
 * each by prose reference to a module one layer UP.
 *
 * ## Three states, and the third is not a degraded second
 *
 *   - **`referenced`** — the node exists, we know where, we hold no bytes.
 *   - **`materialized`** — the bytes are here.
 *   - **`unknown`** — we have not established which.
 *
 * Collapsing `unknown` into `referenced` is how a catalogue reports a clean
 * scan over content nobody ever looked for. Collapsing `referenced` into
 * `materialized` is worse: `corpus-grep` searches `library/` only, so a
 * referenced-but-not-materialised node reads as ABSENT to every consumer, and
 * a clean grep then means "nobody has done this" when the source is sitting on
 * a server.
 *
 * There is deliberately **no default**. A node that does not declare its state
 * is invalid, not `unknown` — "the author did not say" and "the author said
 * they could not tell" are different facts, and only the second is a finding
 * somebody can act on.
 *
 * ## A remote-KG subscription is a materialization
 *
 * The same ruling's addition. Subscribing to an external knowledge graph
 * (`kg-subscribe`, `subscribe-kg.bpmn`, the `kg-subscription` skill) is not a separate concept with
 * its own state machine: it is a materialization whose MINIMUM is the chosen
 * subgraphs' METADATA, held under `library/<source>/`. The subgraphs chosen
 * are `materialized` as metadata; everything else the remote declares is
 * `referenced`; and a subgraph whose declaration could not be read is
 * `unknown`, never silently `referenced`. Taking more than the metadata — the
 * nodes' bodies, their blobs — is an ordinary materialization of those nodes,
 * with core's five gates, and nothing about having subscribed discharges them.
 * This is recorded as vocabulary, not built: no subscription feature reads it
 * yet.
 */
import { z } from "zod";

/**
 * Whether the bytes are here.
 *
 * Ordered weakest-to-strongest deliberately: a reader scanning the union sees
 * that `unknown` is not a kind of `referenced`.
 */
export const MATERIALIZATION_STATES = ["unknown", "referenced", "materialized"] as const;
export type MaterializationState = (typeof MATERIALIZATION_STATES)[number];

/**
 * Proof that an archived blob is the blob that was archived.
 *
 * Required on anything `archival`. An archive that cannot demonstrate it is
 * unchanged is a copy, and the distinction is the whole point of the purpose:
 * a working copy may be re-fetched if it rots, an archival one cannot, because
 * the thing it would be re-fetched from is what it exists to survive.
 */
export const FixitySchema = z
  .object({
    algorithm: z.literal("sha256"),
    digest: z.string().regex(/^[0-9a-f]{64}$/, "a sha256 digest is 64 lowercase hex characters"),
    /** When the digest was last RE-COMPUTED against the bytes, not when it was recorded. An unverified digest ages. */
    verifiedAt: z.string().min(1).optional(),
  })
  .strict();
export type Fixity = z.infer<typeof FixitySchema>;
