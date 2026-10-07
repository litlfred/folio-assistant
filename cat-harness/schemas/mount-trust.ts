/**
 * MOUNT TRUST — what must be true before a remote knowledge graph is mounted.
 *
 * @module schemas/mount-trust
 * @graphNode schema
 *
 * Bean `ieum`, issue #2389, rule H8 of `methodologies/zero-trust-handover.md`.
 * The owner, 2026-10-07: *"mounting remote KG needs trusted provenance sources
 * (digitally signed e.g. verifiable via GDHCN), or explicit user consent"*,
 * and, the same day, *"staging doesnt need signature"*.
 *
 * A remote mount brings in skills, voices, processes and code. A mounted skill
 * steers an agent, and mounted code runs, so mounting is a supply-chain
 * decision, not a fetch.
 *
 * ## Three ways a mount may proceed, and one it may not
 *
 * | basis | when | state |
 * |---|---|---|
 * | `staging` | the mount is for a staging preview | allowed, recorded as such |
 * | `consent` | a person consented to THIS harness at THIS pin | allowed |
 * | `signature` | a signature verifiable through a declared trust network | **could not determine**: no verifier exists yet, so a recorded signature is reported and NOT trusted |
 * | none | unsigned and unconsented | **refused** |
 *
 * **Consent is scoped to the pin.** It records the `ref` it was given for. A
 * moved pin is a different commit and different code, so it asks again rather
 * than inheriting yesterday's yes.
 *
 * **An unverified signature is not trust.** Accepting a signature this code
 * cannot check would turn "signed" into a label anyone can write. Until a
 * verifier for the declared network exists (GDHCN is the named example; its
 * trust-list model belongs to an instance above this layer), a signature-only mount is `could-not-determine`, which
 * never mounts.
 */
import { z } from "zod";


/** A full commit SHA. Restated rather than imported: `remote-mount.ts` imports THIS module, and a cycle would be the price. */
const CommitShaSchema = z.string().regex(/^[0-9a-f]{40}$/, "a full 40-character commit SHA");

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "an ISO date");

/** A person's explicit consent to mount one harness at one pin. */
export const MountConsentSchema = z
  .object({
    /** Who consented: a person, by the identity they act under here. */
    by: z.string().min(1),
    on: IsoDate,
    /** The pin consented to. Must equal the mount's `ref`; a moved pin asks again. */
    ref: CommitShaSchema,
    /** Where the consent was given (an issue comment, a chat session), so it can be read. */
    evidence: z.string().min(1),
  })
  .strict();
export type MountConsent = z.infer<typeof MountConsentSchema>;

/** A signature over the mounted declaration, by a key in a declared trust network. */
export const MountSignatureSchema = z
  .object({
    /** The trust network the key is listed in, e.g. `gdhcn`. */
    network: z.string().min(1),
    keyId: z.string().min(1),
    /** What was signed: the pinned declaration's sha256, as the lock records it. */
    signedDigest: z.string().regex(/^[0-9a-f]{64}$/),
    value: z.string().min(1),
  })
  .strict();
export type MountSignature = z.infer<typeof MountSignatureSchema>;

export const MountTrustSchema = z
  .object({
    consent: MountConsentSchema.optional(),
    signature: MountSignatureSchema.optional(),
  })
  .strict();
export type MountTrust = z.infer<typeof MountTrustSchema>;

export type TrustVerdict =
  | { ok: true; basis: "staging" | "consent"; detail: string }
  | { ok: false; state: "refused" | "could-not-determine"; detail: string };

/**
 * May this mount proceed? `purpose: "staging"` needs neither signature nor
 * consent, by the owner's ruling; anything else needs consent for this exact
 * pin, because no signature can be verified yet.
 */
export function mountTrust(mount: { harness: string; ref: string; trust?: MountTrust }, purpose: "staging" | "mount"): TrustVerdict {
  if (purpose === "staging") {
    return { ok: true, basis: "staging", detail: "a staging preview needs no signature (owner, 2026-10-07)" };
  }
  const t = mount.trust;
  if (t?.consent) {
    if (t.consent.ref !== mount.ref) {
      return {
        ok: false,
        state: "refused",
        detail: `consent by ${t.consent.by} on ${t.consent.on} was for ${t.consent.ref.slice(0, 10)}, not ${mount.ref.slice(0, 10)}: a moved pin asks again`,
      };
    }
    return { ok: true, basis: "consent", detail: `consented by ${t.consent.by} on ${t.consent.on} (${t.consent.evidence})` };
  }
  if (t?.signature) {
    return {
      ok: false,
      state: "could-not-determine",
      detail: `signed by ${t.signature.keyId} in \`${t.signature.network}\`, but no verifier for that network exists yet; an unverified signature is not trust. Record a person's consent for this pin, or build the verifier.`,
    };
  }
  return { ok: false, state: "refused", detail: `\`${mount.harness}\` at ${mount.ref.slice(0, 10)} is unsigned and unconsented, so it is not mounted (H8)` };
}
