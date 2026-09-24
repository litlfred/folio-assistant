/**
 * How a person wants to be asked — the `interaction` graph's one node kind.
 *
 * @module schemas/interaction
 * @graphNode schema
 * @covers none — a schema module, not a gate. `check:kind-validators` is what
 *   runs it, and this file is the thing it runs.
 *
 * ## Why this needed a runnable schema, measured rather than supposed
 *
 * `interaction/interaction.json` is read at the start of every session, and the
 * reader is **jq inside a shell script** — `scripts/session-start-coord-sweep.sh`,
 * whose failure branch prints `(could not parse … — read it by hand)`. So a
 * malformed node does not fail: it degrades to a line nobody acts on, in the one
 * file every sibling session reads before doing anything. Bean `46uh` already
 * records that whole section silently not printing after the repository split,
 * for a different reason and with the same shape.
 *
 * The kind declared `schema: "schemas/harness-config.ts"` and that was wrong in
 * a way worth naming: `harness-config.ts` holds the PATH to this file
 * (`interaction: z.string().default("interaction/interaction.json")`), not its
 * shape. A pointer to where a fact is *not* written is worse than none, because
 * a reader who follows it concludes the shape is undeclared on purpose.
 *
 * Bean `3oqj`, and `audit-coverage` is what surfaced it: the kind held a file
 * that no criterion, no gate and no validator reached.
 *
 * ## What is REQUIRED, and what deliberately is not
 *
 * A profile list is required and may be **empty** — an empty list is a person
 * who has said nothing, which is a different fact from a person with no entry,
 * and the `default` block exists to carry exactly that. `note` and `source` are
 * optional because a preference stated in passing is still a preference; what
 * must not be optional is the list, since a missing one would read as "no
 * accommodations" rather than "not recorded".
 *
 * Unknown keys are ALLOWED (a non-strict object), on the rule
 * `KgAssetSchema` states: a downstream instance may carry a key this layer has
 * not learned about yet. The cost of that leniency is recorded on
 * `check-asset-roles` — a silently stripped key — so anything this layer relies
 * on is named here rather than left to be inferred.
 */
import { z } from "zod";

/** The `$schema` tag a node of this kind carries. */
export const INTERACTION_SCHEMA_TAG = "folio-interaction/v1";

/**
 * One person's preferences, or the fallback for somebody with no entry.
 *
 * The same shape for both, because they answer the same question at different
 * subjects — and a separate `default` shape would let the two drift, which is
 * how a fallback stops being a real answer.
 */
export const InteractionProfileSchema = z.object({
  /**
   * Named profiles, e.g. `low-dexterity`. Free strings on purpose: the
   * vocabulary is open and a closed enum here would reject a profile a
   * downstream instance has a name for and this layer does not.
   */
  profiles: z.array(z.string()),
  /** What the profile means for this person, in their terms or the agent's. */
  note: z.string().optional(),
  /** How it came to be known — `stated by the user`, a policy, an inference. */
  source: z.string().optional(),
});

export type InteractionProfile = z.infer<typeof InteractionProfileSchema>;

/** The whole node. */
export const InteractionNodeSchema = z.object({
  $schema: z.literal(INTERACTION_SCHEMA_TAG),
  /** Prose for a reader who opens the file; never read by a process. */
  $comment: z.string().optional(),
  /**
   * Keyed by the identity the agent can resolve — an email today.
   *
   * Required, and may be empty: a repository where nobody has stated anything
   * still HAS an interaction graph, and `{}` says so where an absent key would
   * be indistinguishable from a node that forgot to include it.
   */
  users: z.record(z.string(), InteractionProfileSchema),
  /** What to assume for somebody with no entry above. */
  default: InteractionProfileSchema.optional(),
});

export type InteractionNode = z.infer<typeof InteractionNodeSchema>;
