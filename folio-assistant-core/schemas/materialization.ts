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
 * | `who-iris` | IRIS, 361.55 GB | three items under `library/` | nothing |
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
 *     361.55 GB is the measured reason the IRIS import is by reference.
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
 *
 * ## Two purposes, and they want opposite things
 *
 * The owner, 2026-09-20: *"someone may want the blob/binary/pdf for archival
 * purposes (like a KG version of internet archive/wayback)."*
 *
 * That is not a variant of working materialisation, it is its opposite, and
 * three of the five gates change meaning under it:
 *
 * | | `working` | `archival` |
 * |---|---|---|
 * | what is kept | the DERIVED content — sections, OCR, structure | the ORIGINAL BYTES, unchanged |
 * | retention | expires; the original can be re-fetched | **no expiry, by design** |
 * | `sourceLoss` | unanswered — the derivation is not the source | **discharged** — this copy IS the answer |
 * | fixity | not needed; the derivation is the artefact | **required** — an archive that cannot prove it is unchanged is a copy |
 *
 * So {@link freshness} must not report an archival copy as `no-expiry`, which
 * reads as a finding; for an archive it is the specification. And an archival
 * copy with no {@link Fixity} is not an archive — it is a file somebody kept.
 *
 * **The fixity data already exists.** Every ingested entry's `structure.json`
 * carries `sha256` and `bytes` — `wpr-rdo-2020-003-eng` records
 * `5021518ccd91e26a9533edd8efc643bc24ab7bf2d4eb425c9644967e0bf72842` and
 * 2 810 648 bytes. Nothing reads them as fixity today.
 *
 * **Archival is also the only honest answer to `sourceLoss`.** The one IRIS
 * record this repository holds carries a handle on `iris.wpro.who.int`, a
 * regional instance merged into the global one. A `working` materialisation
 * cannot discharge that gate — the derived sections are not the publication —
 * and saying otherwise is how a repository believes it has a copy it does not.
 */
import { z } from "zod";

export const MATERIALIZATION_SCHEMA_TAG = "folio-materialization/v1";

/**
 * Why the bytes were taken. See the module doc — `working` and `archival` want
 * opposite things from retention, fixity and the source-loss gate.
 *
 * `both` is a real state and not a hedge: the same PDF can be the archival
 * master AND the input a derivation was run over. It carries archival's
 * obligations (fixity required, no expiry expected).
 */
export const MATERIALIZATION_PURPOSES = ["working", "archival", "both"] as const;
export type MaterializationPurpose = (typeof MATERIALIZATION_PURPOSES)[number];

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

/**
 * A digital signature over the materialized bytes.
 *
 * Owner, 2026-09-22: *"Maternalized may have provenance/digital signature later
 * that can be checked ... (see trusted data objects)"*.
 *
 * ## Why a slot exists before a verifier does
 *
 * {@link FixitySchema} answers *"unchanged since **we** recorded it"*. A
 * signature answers *"signed by whom, and verifiable against **their** key"* —
 * strictly stronger, because it survives the recorder being wrong or
 * dishonest, which a self-recorded digest does not.
 *
 * The slot is here from the start so that arrival needs no migration. What is
 * NOT here is a trusted-data-object format: "trusted data object" appears
 * nowhere else in this checkout, so inventing one would be modelling a thing
 * this repository has not adopted.
 *
 * ## A recorded signature is NOT a verified one
 *
 * There is no verifier, and nothing here pretends otherwise. `format` and
 * `value` say a signature was recorded; only `verifiedAt` says it was ever
 * checked, and `check-materialized-fixity` reports a signature it cannot check
 * under its own verdict rather than folding it into a pass. A field that reads
 * as coverage while nothing verifies it is the `dh4f` shape, and it would be
 * worse here than elsewhere: the whole point of a signature is that somebody
 * relies on it.
 */
export const SignatureSchema = z
  .object({
    /**
     * How to interpret `value` — a media type or a named scheme.
     *
     * REQUIRED. An unlabelled blob cannot be checked by anybody, so a
     * signature with no format is not a weaker signature, it is a string.
     */
    format: z.string().min(1),
    /** The signature itself, or a URI that resolves to it. */
    value: z.string().min(1),
    /**
     * Who signed, as a key identifier.
     *
     * Optional only because some formats carry the signer inside `value`. A
     * signature whose signer cannot be established either way is unverifiable,
     * and is reported as such rather than as absent.
     */
    signer: z.string().min(1).optional(),
    /** When it was last CHECKED against the signer's key — never when it was recorded. Same discipline as {@link FixitySchema.verifiedAt}. */
    verifiedAt: z.string().min(1).optional(),
  })
  .strict();
export type Signature = z.infer<typeof SignatureSchema>;

/**
 * WHERE THIS CAME FROM — a pointer pair, not a flag.
 *
 * Owner, 2026-09-22: *"Materialized assets not a flag true, but [a pointer] to
 * asset in `folio/` or elsewhere and a reference to the `library/` original
 * reference"*.
 *
 * ## The two references are different questions
 *
 * - **`upstream`** — the remote thing this ultimately derives from.
 * - **`local`** — the original **in this repository** it was taken from.
 *
 * They are not one field with two kinds of value, and this module already
 * proved it the hard way. Until 2026-09-22 there was a single `of`, documented
 * as *"the remote thing. A URI, always — never a path, never a bare name"* —
 * and **5 of the 9 who-iris item records violated that documentation**, in
 * three shapes, two of them inside a single file:
 *
 * | record | old `of` | what it actually was |
 * |---|---|---|
 * | the item | `local:9789241548960-eng` | its own id — a bare name, and not provenance at all |
 * | its PDF | `https://iris.who.int/handle/10665/145714` | genuine upstream |
 * | its cover PNG | `local:who-iris/uploads/…/foo.pdf#page=1` | a **local** original — a path |
 *
 * So the conflation was not hypothetical and not introduced by the copy-out:
 * it was live, and the field's own doc comment forbade the majority of its
 * contents.
 *
 * The count is 5 of 9 because it was RE-COUNTED after the migration rather
 * than carried over from the note that prompted it, which said 6. A measured
 * number quoted from prose is the failure this repository names in
 * `bpmn-processes` — count the thing, do not quote the paragraph.
 *
 * ## Why this matters before the copy-out is built
 *
 * When a reader copies materialized content into their own `folio/` to work on
 * it, a single `of` still points upstream — so the copy records where the bytes
 * ultimately came FROM and not which local original they were taken from. One
 * rename later that copy is indistinguishable from original work. `local` is
 * the field that makes a copy answerable for what it is a copy of.
 *
 * ## Both absent is legitimate, and must say so
 *
 * The who-iris item above knows it came from IRIS and does **not** know the
 * handle. That is a real state, not an unfilled field — so both pointers may be
 * absent, and then {@link MaterializationSchema}'s `note` is REQUIRED. Same
 * discipline as {@link GateSchema}'s `basis`: *"we looked and could not
 * establish it"* and *"nobody looked"* must not share a spelling.
 */
export const ProvenanceSchema = z
  .object({
    /** The remote thing. A URI, always — never a path, never a bare name. Absent means NOT RECORDED, which is not "there is none". */
    upstream: z.string().min(1).optional(),
    /**
     * The original **in this repository** this was taken from.
     *
     * A `library/` node id or an instance-relative path; the corpus carries
     * both and the migration preserved each verbatim rather than guessing a
     * normal form. Normalising them is a separate decision with a separate
     * answer, and a migration that quietly picked one would have destroyed the
     * evidence for making it.
     */
    local: z.string().min(1).optional(),
    signature: SignatureSchema.optional(),
  })
  .strict();
export type Provenance = z.infer<typeof ProvenanceSchema>;

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
    /**
     * WHERE THIS CAME FROM — see {@link ProvenanceSchema}.
     *
     * This replaced a single `of` on 2026-09-22. `of` meant "the remote thing"
     * and 6 of the 9 who-iris records were using it for a local one, so the
     * split is a correction to the corpus as much as to the model.
     */
    provenance: ProvenanceSchema,
    /** Where the bytes landed, instance-relative. Present iff `materialized`. */
    localPath: z.string().min(1).optional(),
    /** Bytes held locally. Absent means not measured, which is not zero. */
    bytes: z.number().int().nonnegative().optional(),
    /**
     * Bytes the WHOLE remote collection holds, where it is known. This is what
     * makes a `size` gate answerable: 3 items of 361.55 GB is a fraction, and
     * "3 items" alone is not.
     */
    collectionBytes: z.number().int().nonnegative().optional(),
    gates: GatesSchema.optional(),
    /** Why the bytes were taken. Required on anything materialized — the gates mean different things under each. */
    purpose: z.enum(MATERIALIZATION_PURPOSES).optional(),
    /** Required when `purpose` is `archival` or `both`. */
    fixity: FixitySchema.optional(),
    /** When the local copy was taken, and against what upstream version. */
    materializedAt: z.string().min(1).optional(),
    upstreamVersion: z.string().min(1).optional(),
    /**
     * When this copy expires. Absent on a `working` copy is a `retention`
     * finding, not a default of "forever". Absent on an `archival` one is the
     * SPECIFICATION — see {@link freshness}, which reports the two differently.
     */
    expiresAt: z.string().min(1).optional(),
    /**
     * Why the record cannot say more than it does.
     *
     * Two jobs, and both are the same discipline. Why the state is `unknown`,
     * where it is — an unexplained `unknown` is indistinguishable from an
     * unfilled field. And why BOTH provenance pointers are absent, which the
     * refinement below requires: a record that knows neither where a thing came
     * from upstream nor which local original it was taken from has either
     * looked and failed, or not looked, and only the first is a fact.
     */
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((m, ctx) => {
    if (!m.provenance.upstream && !m.provenance.local && !m.note) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "a record with neither `provenance.upstream` nor `provenance.local` requires a `note`. " +
          "Knowing a thing came from somewhere and not knowing where is a real state — the " +
          "who-iris item whose IRIS handle was never recorded is one — but it is only a state " +
          "once somebody says so. Silent, it cannot be told from a field nobody filled in",
      });
    }
    if (m.state === "materialized") {
      if (!m.localPath) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "state `materialized` requires `localPath`: bytes that are here are somewhere",
        });
      }
      if (!m.purpose) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "state `materialized` requires a `purpose`. `working` and `archival` want opposite " +
            "things from retention, fixity and the source-loss gate, so a copy that has not said " +
            "which it is cannot have any of the three judged",
        });
      }
      if ((m.purpose === "archival" || m.purpose === "both") && !m.fixity) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "an archival copy requires `fixity`. An archive that cannot demonstrate it is " +
            "unchanged is a copy — and it cannot be re-fetched to check, because the thing it " +
            "would be re-fetched from is what it exists to survive",
        });
      }
      if (m.purpose === "working" && m.gates?.sourceLoss.verdict === "permitted") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "a `working` materialization cannot discharge `sourceLoss`: the derived content is " +
            "not the source. Only an archival copy of the original bytes answers that gate",
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
export type FreshnessVerdict =
  | "fresh"
  | "expired"
  | "no-expiry"
  | "permanent"
  | "not-materialized";

/**
 * `permanent` is NOT a kind of `no-expiry`, and that is the point of having
 * both. `no-expiry` is a finding — a working copy nobody gave a lifetime, which
 * cannot be told from abandoned work. `permanent` is a specification: an
 * archive is supposed to outlive its source, so reporting it as a finding would
 * put every archived blob on a list of things to chase.
 */
export function freshness(m: Materialization, now: Date = new Date()): FreshnessVerdict {
  if (m.state !== "materialized") return "not-materialized";
  if (!m.expiresAt) {
    return m.purpose === "archival" || m.purpose === "both" ? "permanent" : "no-expiry";
  }
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
