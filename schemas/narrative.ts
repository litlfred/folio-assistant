/**
 * A generated narrative, and who stands behind it — bean `ju0u`.
 *
 * An image description, a transcript, a dataset summary. The owner chose
 * **agent-drafted, human-confirmed** (2026-09-19) over plain agent attribution
 * and over writing every one by hand, so this is a state machine rather than
 * the boolean dressed as an enum it replaces (`not-authored | authored`).
 *
 * ## Two attributions, because they are two acts
 *
 * `drafted_by` is who wrote the words; `confirmed_by` is who accepted them.
 * Different actors doing different things, and collapsing them loses which is
 * which — the question a reader of a narrative most wants answered is not "did
 * a machine touch this" but "has a person agreed to it".
 *
 * ## An agent cannot confirm its own draft
 *
 * `confirmed_by.kind` must be `"human"`, structurally. That single refinement
 * is the whole difference between the option the owner chose and the one they
 * did not: without it, "confirmed" degrades silently into "an agent said so
 * twice", and the state carries no more information than `draft` did.
 *
 * ## `rejected` is a state, and it keeps its reasons
 *
 * A rejected draft that is silently re-offered wastes the reviewer's time; one
 * that vanishes lets the next agent redraft the identical thing. That is the
 * argument `scrapped` wins on for beans — deletion loses the fact that someone
 * already decided — and `schemas/qa-review.ts`'s `Decision` makes the same
 * demand one layer over: at least one note saying why this outcome, not
 * another.
 *
 * ## Not a second review model
 *
 * `Attribution` and its `script | agent | human` vocabulary come from
 * `schemas/attribution.ts` (bean `iqim`), which `block-qa.ts` also re-exports.
 * One vocabulary for who did a thing, whether the thing was reviewing a block
 * or writing a description. `rlp5` records what a second spelling costs.
 *
 * @module schemas/narrative
 * @graphNode schema
 */
import { z } from "zod";

import { AttributionSchema } from "./attribution";

/**
 * Where a narrative is in its life.
 *
 * - `not-authored` — nobody has written one. The slot exists and is empty.
 * - `draft` — an agent (or a person) wrote one; nobody has accepted it.
 * - `confirmed` — a HUMAN accepted it. Only this state means the text is
 *   anybody's considered answer.
 * - `rejected` — a human turned it down, and said why.
 *
 * `not-authored` is deliberately first and is the default for a new record:
 * the failure this whole arm exists to prevent is a machine-made summary
 * arriving as though somebody had agreed to it.
 */
export const NARRATIVE_STATES = ["not-authored", "draft", "confirmed", "rejected"] as const;
export type NarrativeState = (typeof NARRATIVE_STATES)[number];

/** States in which `text` must be present. Derived, so adding a state forces the question. */
export const STATES_WITH_TEXT: readonly NarrativeState[] = NARRATIVE_STATES.filter(
  (s): s is NarrativeState => s !== "not-authored",
);

export const NarrativeSchema = z
  .object({
    /** The narrative itself, or null when nobody has written one. */
    text: z.string().min(1).nullable(),
    state: z.enum(NARRATIVE_STATES),
    /** Who wrote the words. An `agent` must name its `model` — see `attribution.ts`. */
    drafted_by: AttributionSchema.optional(),
    drafted_at: z.string().optional(),
    /** Who ACCEPTED the words. Must be a human; see the module docstring. */
    confirmed_by: AttributionSchema.optional(),
    confirmed_at: z.string().optional(),
    rejected_by: AttributionSchema.optional(),
    rejected_at: z.string().optional(),
    /** Why it was turned down. Required when rejected, and never empty. */
    rejection_reason: z.string().min(1).optional(),
  })
  // Text and state cannot contradict each other. A `confirmed` record with no
  // text says a person agreed to nothing.
  .refine((n) => (n.text !== null) === STATES_WITH_TEXT.includes(n.state), {
    message: "`text` and `state` disagree: only `not-authored` has no text",
    path: ["text"],
  })
  // Anything written has a writer. Otherwise `confirmed` could mean a person
  // accepted words of unknown origin, which is the provenance gap `iqim`
  // closed for blocks, reappearing here.
  .refine((n) => n.state === "not-authored" || n.drafted_by !== undefined, {
    message: "a narrative that exists must record who drafted it",
    path: ["drafted_by"],
  })
  // THE load-bearing rule. Without it `confirmed` degrades into "an agent said
  // so twice" and carries no more information than `draft`.
  .refine((n) => n.state !== "confirmed" || n.confirmed_by?.kind === "human", {
    message: "only a human can confirm a narrative — an agent cannot accept its own draft",
    path: ["confirmed_by"],
  })
  .refine((n) => n.state !== "rejected" || n.rejected_by?.kind === "human", {
    message: "only a human can reject a narrative",
    path: ["rejected_by"],
  })
  // A rejection with no reason is indistinguishable from an abandoned draft,
  // and it lets the next agent redraft the identical thing.
  .refine((n) => n.state !== "rejected" || !!n.rejection_reason, {
    message: "a rejection must say why — otherwise the next draft repeats it",
    path: ["rejection_reason"],
  })
  // A record cannot be both accepted and turned down.
  .refine((n) => !(n.confirmed_by && n.rejected_by), {
    message: "a narrative cannot be both confirmed and rejected",
    path: ["state"],
  });

export type Narrative = z.infer<typeof NarrativeSchema>;

/** The empty slot every record starts with. */
export const NOT_AUTHORED: Narrative = { text: null, state: "not-authored" };

/** True when a person has accepted this text — the only state that means that. */
export function isConfirmed(n: unknown): boolean {
  const r = NarrativeSchema.safeParse(n);
  return r.success && r.data.state === "confirmed";
}

/** True when this narrative is waiting on a person. */
export function awaitsConfirmation(n: unknown): boolean {
  const r = NarrativeSchema.safeParse(n);
  return r.success && r.data.state === "draft";
}

/**
 * Preset rejection reasons, chosen by NUMBER.
 *
 * The owner has very limited hand function, so a rejection that demands a
 * typed sentence is a rejection that will not happen — and an unusable review
 * step makes `confirmed` mean "nobody got round to objecting", which is worse
 * than not having the state at all. Free text stays available and is never
 * required.
 */
export const REJECTION_REASONS: readonly string[] = [
  "inaccurate — describes something the source does not contain",
  "too vague to be useful",
  "wrong emphasis — describes the incidental rather than the subject",
  "not in the register this corpus uses",
  "duplicates a description that already exists",
];
