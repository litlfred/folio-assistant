/**
 * An IG's identity, as its own `sushi-config.yaml` states it — id, canonical,
 * version and publication status — kept beside that IG's artefact index.
 *
 * @graphNode schema
 * @module fhir-harness/schemas/ig-identity
 *
 * ## Why this is not a field of the chrome
 *
 * `chrome.json` (`folio-ig-chrome/v1`) is the look of a `fhir.template` CHAIN:
 * tokens and rules read from template repositories. Every IG that builds with
 * the same chain wears the same chrome, so the chrome is keyed by the chain's
 * top layer and ships with the harness. It used to carry the identity of the
 * one IG it happened to be ingested beside as well, and that IG's `draft`
 * status then read as a fact about every IG wearing the chrome — the defect
 * stage A of the smart-* separation found and stage D removes (#1767).
 *
 * Identity and status are facts about ONE IG, so they live in that IG's own
 * index directory, next to `index.json` and `menu.json`, each with its own
 * provenance. A fourth file in that directory rather than a field of the index
 * for the reason the menu is a second one: a different SOURCE. The index is
 * harvested from the IG's published output; this is read from its source
 * config, at a moment.
 *
 * An IG with no identity file has no status this pipeline can state, and draws
 * no watermark. That is the third state, not "published".
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

export const IG_IDENTITY_SCHEMA_TAG = "folio-ig-identity/v1";

/** The file an IG's index directory holds it in. */
export const IG_IDENTITY_FILENAME = "ig-identity.json";

export const IgIdentitySchema = z.object({
  $schema: z.literal(IG_IDENTITY_SCHEMA_TAG),
  /** The IG's `id` from `sushi-config.yaml`; SUSHI's `packageId` defaults to it. */
  id: z.string().min(1),
  canonical: z.string().url(),
  /** `draft`, `active`, `retired` … — what selects the template's watermark. */
  status: z.string().min(1),
  version: z.string().min(1).optional(),
  /** Where it was read: a repository and file, so the claim can be re-checked. */
  readFrom: z.string().min(1),
  /** When it was read. A status is a fact at a moment, not forever. */
  readAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type IgIdentity = z.infer<typeof IgIdentitySchema>;

/**
 * The identity in `dir`, or `undefined` when there is none.
 *
 * Throws on a file that is present but invalid: a malformed identity is a
 * defect to fix, and reading it as "no identity" would draw a page that looks
 * deliberate.
 */
export function readIgIdentity(dir: string): IgIdentity | undefined {
  const path = join(dir, IG_IDENTITY_FILENAME);
  if (!existsSync(path)) return undefined;
  const parsed = IgIdentitySchema.safeParse(JSON.parse(readFileSync(path, "utf-8")));
  if (!parsed.success) {
    throw new Error(`${path} is not a valid ${IG_IDENTITY_SCHEMA_TAG}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  return parsed.data;
}

/**
 * The identity's status, but only when the identity is THIS IG's.
 *
 * `packageId` is the index's. An identity file that names another package is
 * refused rather than believed — the rule the chrome used to need, kept here
 * so a mis-filed copy cannot paint another IG's watermark.
 */
export function statusOf(identity: IgIdentity | undefined, packageId: string | undefined): string | undefined {
  return identity !== undefined && packageId !== undefined && identity.id === packageId ? identity.status : undefined;
}
