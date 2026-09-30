#!/usr/bin/env bun
/**
 * WHERE BYTES CAME FROM — the source-side provenance pair, and a signature.
 *
 * Bean `bf5l`. These two lived in `folio-assistant-core/schemas/materialization.ts`
 * and `cat-harness/schemas/intake.ts` imported the second one across the
 * instance boundary — **up** the declared dependency order, since
 * `folio-assistant-core` declares `needs: ['cat-harness']` while `cat-harness`
 * declares only `needs: ['bootstrap']`. The code pointed one way and the
 * declarations the other, and `kg:detangle` pinned `wrongDirection: 1` on
 * `main` for it (#1375 made that count visible rather than silent).
 *
 * ## Why DOWN rather than moving `intake.ts` up
 *
 * Moving the intake record up into core was the obvious-looking alternative and
 * measurement ruled it out: `cat-harness` itself consumes it.
 * `cat-harness/adapters/document/intake-records.ts` imports
 * `../../schemas/intake.js`, and `cat-harness/schemas/graph-kind-registry.ts`
 * registers `"folio-intake/v1"` against `schemas/intake.ts#IntakeSchema`. Move
 * the file up and those become harness→core imports — one wrong-direction edge
 * traded for another, plus a validator path pointing out of the instance.
 *
 * Moving the SCHEMA down inverts nothing: a source pointer is generic, the
 * harness is the base layer, and core may import downward freely.
 *
 * ## The rename is not cosmetic — it resolves a real collision
 *
 * `cat-harness/schemas/attribution.ts` already exports a `ProvenanceSchema`,
 * and it is a DIFFERENT shape: `INGESTED | Attribution`, answering *who wrote
 * this*. This one answers *where these bytes came from*. While they sat in
 * different instances the clash was survivable; bringing this one into
 * `cat-harness` puts both names in one instance, so one had to change. The one
 * that moved is the one renamed — `SourceProvenance`, which says which
 * question it answers.
 *
 * That collision is why the layering could not be judged when `bf5l` was
 * filed: a reader asking "could `intake.ts` just import locally?" got a
 * COMPILING, WRONG answer from the other schema of the same name.
 *
 * @module cat-harness/schemas/source-provenance
 * @graphNode schema
 */
import { z } from "zod";

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
export const SourceProvenanceSchema = z
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
export type SourceProvenance = z.infer<typeof SourceProvenanceSchema>;
