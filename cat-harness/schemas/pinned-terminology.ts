/**
 * @graphNode schema
 *
 * The codes a PUBLISHED IG carries at ONE pinned version — bean `7wou`.
 *
 * Owner, 2026-09-30, choosing what `check:term-mapping`'s `fhir` half
 * asserts: **"this code is in the published base IG at version X"**, not
 * "this code is in the collection this organisation curates today". The two
 * can disagree, and only the first is reproducible from the repository.
 *
 * So the codes are snapshotted rather than fetched. Three reasons, and the
 * first is the ruling: resolving against whatever a host serves today would
 * quietly turn the claim back into the live-collection one. Then
 * reachability — this environment refuses `smart.who.int:443` exactly as it
 * refuses `api.openconceptlab.org:443`, and a gate that needs the network
 * fails for the wrong reason. Then size: 585 concepts, ~120 KB.
 *
 * ## It is DERIVED, and the version is not its own to state
 *
 * {@link PinnedTerminologySchema.pin} names the external-schema record the
 * version comes from, and the `pin-ig-terminology` Tool refuses to
 * write unless the clone's own `sushi-config.yaml` declares that version. A
 * snapshot of one version labelled another is the single way this file could
 * assert something false, so it is refused at the point of writing rather
 * than reported afterwards.
 *
 * ## Why it lives beside the record it pins
 *
 * `external-schemas/` is a place to look, not a type — and until this file
 * arrived, `loadSpecs` globbed `*.json` there and parsed every one as an
 * external-schema record, so the directory could hold nothing else. That was
 * classification by directory where `directory-conventions` asks for
 * classification by declaration; the loader now reads `$schema` and skips a
 * different declared kind, while still parsing strictly anything that claims
 * to be a record or declares nothing.
 */
import { z } from "zod";

export const PINNED_TERMINOLOGY_TAG = "folio-pinned-terminology/v1";

export const PinnedConceptSchema = z
  .object({
    /** The code system's id inside the IG — its identity there, not a URL. */
    system: z.string().min(1),
    code: z.string().min(1),
    /**
     * The human label, and the ONLY field a glossary candidate can match on.
     *
     * A candidate is a label and a FHIR code is an identifier; the display is
     * the one thing the two share. Matching on `code` would be a coincidence
     * of spelling, which is why a match here yields `skos:closeMatch` and
     * never `exactMatch`.
     */
    display: z.string().min(1),
    /**
     * The edition itself marks the code deprecated: still valid to read, not
     * to write anew. Absent means the edition says nothing, not "current".
     * First user: the SPDX License List (`isDeprecatedLicenseId`), bean `sd5v`.
     */
    deprecated: z.boolean().optional(),
  })
  .strict();

export const PinnedTerminologySchema = z
  .object({
    $schema: z.literal(PINNED_TERMINOLOGY_TAG),
    _comment: z.string().optional(),
    /** The external-schema record this version is read from. */
    pin: z.string().min(1),
    /** The pinned version, which must equal that record's. */
    version: z.string().min(1),
    source: z.string().min(1),
    concepts: z.array(PinnedConceptSchema),
  })
  .strict()
  .superRefine((t, ctx) => {
    if (t.version === "unpinned") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["version"],
        message:
          "`unpinned` is not a version — the fhir half asserts a published IG AT A VERSION, so a " +
          "snapshot with no version is asserting nothing",
      });
    }
    const seen = new Set<string>();
    for (const [i, c] of t.concepts.entries()) {
      const k = `${c.system}\u0000${c.code}`;
      if (seen.has(k)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["concepts", i],
          message: `${c.system}#${c.code} appears twice`,
        });
      }
      seen.add(k);
    }
  });

export type PinnedConcept = z.infer<typeof PinnedConceptSchema>;
export type PinnedTerminologyFile = z.infer<typeof PinnedTerminologySchema>;
