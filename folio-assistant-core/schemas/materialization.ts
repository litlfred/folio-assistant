/**
 * Materialising remote content — the three states, and the five gates.
 *
 * @module schemas/materialization
 * @graphNode schema
 *
 * ## One process, and this repository already runs it twice
 *
 * The owner, 2026-09-20:
 *
 * > *"so if large remote collection, and no restrictions known in context, user
 * > can import/maertialize locally. size considerations apply. similar concept
 * > in bootstrapping harness... it is remtoe. content. bootstrape materelaiz
 * > cat-harness locally (or other harness)... similar, should share common
 * > subprocess. also need to know about refreshing amterialed remote content.
 * > general process used everywhere."*
 *
 * | instance | remote source | materialised locally | refresh today |
 * |---|---|---|---|
 * | `who-iris` | IRIS, ~0.7 TB | three items under `library/` | nothing |
 * | `bootstrap` | a harness | the `cat-harness` checkout | `upstream-pins.json` + `check:upstream-pins` |
 *
 * The second row is the one that makes this a discovery rather than a design.
 * `bootstrap/workflows/initialize-harness.bpmn` fetches a harness that is
 * REMOTE CONTENT and lands it locally; `upstream-pins.json` exists because that
 * local copy goes stale. That is a materialisation and its refresh, built, in
 * production, and named neither.
 *
 * ## Three states, and the third is not a degraded second
 *
 * The same discipline `readme-sections.ts` enforces over a README region and
 * `repo-partition.ts` over a module, and the argument transfers verbatim:
 *
 *   - **`referenced`** — the node exists, we know where, we hold no bytes.
 *   - **`materialized`** — the bytes are here.
 *   - **`unknown`** — we have not established which.
 *
 * Collapsing `unknown` into `referenced` is how a catalogue reports a clean
 * scan over content nobody ever looked for. Collapsing `referenced` into
 * `materialized` is worse: `corpus-grep` searches `library/` only, so a
 * referenced-but-not-materialised node reads as ABSENT to every consumer, and a
 * clean grep then means "nobody has done this" when the source is sitting on a
 * server. That is the `uploads/` failure one level up, at catalogue scale.
 *
 * There is deliberately **no default**. A node that does not declare its state
 * is invalid, not `unknown` — because "the author did not say" and "the author
 * said they could not tell" are different facts, and only the second is a
 * finding somebody can act on.
 *
 * ## The five gates, and why a warning is not a gate
 *
 * Each is a decision a PERSON makes and none is answerable from a file. A gate
 * that only warns is a gate nobody fails, which is the `xom7` shape — a
 * workflow that failed all thirty times it ran with nothing in the repository
 * saying so.
 *
 *   - **size** — what fraction is being taken and what the whole would cost.
 *     0.7 TB is the measured reason the IRIS import is by reference.
 *   - **restrictions** — the owner's phrase is *"no restrictions known in
 *     context"*, and that is a STATE, not a green light. {@link GateVerdict}
 *     has `unknown` for exactly this, and it is never rendered as `permitted`.
 *   - **retention** — what expires this copy. A copy with no expiry cannot be
 *     told from an abandoned one, which is the argument `bean-blocking` already
 *     makes about a block with no expiry.
 *   - **sourceLoss** — what survives if the origin goes. Not hypothetical here:
 *     the one IRIS record this repository holds carries
 *     `http://iris.wpro.who.int/handle/10665.1/14518`, a regional instance that
 *     was merged away. The failure mode is already in the evidence.
 *   - **copyright** — what the licence permits, per bitstream, and whether it
 *     permits the derived work. `LICENSE-CONTENT.md` exists in this repository
 *     and the ingestion pipeline does not read it.
 */
import { z } from "zod";

export const MATERIALIZATION_SCHEMA_TAG = "folio-materialization/v1";

/**
 * Whether the bytes are here.
 *
 * Ordered weakest-to-strongest deliberately: a reader scanning the union sees
 * that `unknown` is not a kind of `referenced`.
 */
export const MATERIALIZATION_STATES = ["unknown", "referenced", "materialized"] as const;
export type MaterializationState = (typeof MATERIALIZATION_STATES)[number];

/**
 * A gate's answer.
 *
 * `unknown` is a first-class verdict and NOT a synonym for `permitted`. The
 * whole reason this enum is three-valued is the owner's "no restrictions known
 * in context": an absence of known restrictions is an absence of knowledge.
 */
export const GATE_VERDICTS = ["unknown", "refused", "permitted"] as const;
export type GateVerdict = (typeof GATE_VERDICTS)[number];

export const GateSchema = z
  .object({
    verdict: z.enum(GATE_VERDICTS),
    /**
     * Why. REQUIRED on every verdict including `permitted`, because "we checked
     * and it is fine" and "nobody looked" are indistinguishable from a bare
     * `permitted`, and this whole module exists to keep such pairs apart.
     */
    basis: z.string().min(1),
    /** Who or what decided, and when. A verdict with no date cannot be re-checked. */
    decidedAt: z.string().min(1).optional(),
    decidedBy: z.string().min(1).optional(),
  })
  .strict();
export type Gate = z.infer<typeof GateSchema>;

/** The five, all required. A materialisation that skipped one would be a materialisation whose worst risk is the one nobody wrote down. */
export const GatesSchema = z
  .object({
    size: GateSchema,
    restrictions: GateSchema,
    retention: GateSchema,
    sourceLoss: GateSchema,
    copyright: GateSchema,
  })
  .strict();
export type Gates = z.infer<typeof GatesSchema>;

/**
 * What a node says about itself.
 *
 * `gates` is required when `state` is `materialized` and forbidden otherwise —
 * see the refinement below. Bytes on disk without the five answers is exactly
 * the state this module exists to make unrepresentable.
 */
export const MaterializationSchema = z
  .object({
    $schema: z.literal(MATERIALIZATION_SCHEMA_TAG).optional(),
    state: z.enum(MATERIALIZATION_STATES),
    /** The remote thing. A URI, always — never a path, never a bare name. */
    of: z.string().min(1),
    /** Where the bytes landed, instance-relative. Present iff `materialized`. */
    localPath: z.string().min(1).optional(),
    /** Bytes held locally. Absent means not measured, which is not zero. */
    bytes: z.number().int().nonnegative().optional(),
    /**
     * Bytes the WHOLE remote collection holds, where it is known. This is what
     * makes a `size` gate answerable: 3 items of ~0.7 TB is a fraction, and
     * "3 items" alone is not.
     */
    collectionBytes: z.number().int().nonnegative().optional(),
    gates: GatesSchema.optional(),
    /** When the local copy was taken, and against what upstream version. */
    materializedAt: z.string().min(1).optional(),
    upstreamVersion: z.string().min(1).optional(),
    /** When this copy expires. Absent on a materialised node is a `retention` gate finding, not a default of "forever". */
    expiresAt: z.string().min(1).optional(),
    /** Why the state is `unknown`, where it is. An unexplained `unknown` is indistinguishable from an unfilled field. */
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((m, ctx) => {
    if (m.state === "materialized") {
      if (!m.localPath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "state `materialized` requires `localPath`: bytes that are here are somewhere",
        });
      }
      if (!m.gates) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "state `materialized` requires all five `gates`. Bytes on disk with no recorded " +
            "size / restrictions / retention / source-loss / copyright answer is the state this " +
            "schema exists to make unrepresentable",
        });
      }
    } else if (m.gates) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "gates are recorded only where something was materialized. A gate verdict on a " +
          "`referenced` node claims a decision nobody had to make",
      });
    }
  });
export type Materialization = z.infer<typeof MaterializationSchema>;

/**
 * Whether the local copy may be trusted right now.
 *
 * Deliberately NOT a boolean. "Expired", "never had an expiry" and "not
 * materialised at all" are three different situations calling for three
 * different actions, and a boolean would send all three down one branch.
 */
export type FreshnessVerdict = "fresh" | "expired" | "no-expiry" | "not-materialized";

export function freshness(m: Materialization, now: Date = new Date()): FreshnessVerdict {
  if (m.state !== "materialized") return "not-materialized";
  if (!m.expiresAt) return "no-expiry";
  return new Date(m.expiresAt).getTime() > now.getTime() ? "fresh" : "expired";
}

/**
 * Whether every gate has been answered — NOT whether every answer was yes.
 *
 * The distinction is the point. A `refused` copyright gate is a completed
 * decision and the materialisation should not have happened; an `unknown` one
 * is an open question. Both are "not permitted", and conflating them is how
 * "we may not" and "we have not asked" become one row in a report.
 */
export function unansweredGates(g: Gates): Array<keyof Gates> {
  return (Object.keys(g) as Array<keyof Gates>).filter((k) => g[k].verdict === "unknown");
}

/** Gates that came back `refused`. A non-empty result means the copy must not exist. */
export function refusedGates(g: Gates): Array<keyof Gates> {
  return (Object.keys(g) as Array<keyof Gates>).filter((k) => g[k].verdict === "refused");
}
