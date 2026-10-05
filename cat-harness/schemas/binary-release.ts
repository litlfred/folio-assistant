/**
 * Binary releases — what was published, under what version, with what digest.
 * **Never the bytes.**
 *
 * @module schemas/binary-release
 * @graphNode schema
 *
 * One node per release. It records a release's id, its version, each asset's
 * digest and size, and where each asset is fetched from. It holds no content,
 * and the schema is `.strict()` throughout so a field carrying a payload
 * cannot be added by accident.
 *
 * Registered on the owner's ruling, 2026-09-30 — **Option A** of bean `rjug`:
 * *"a `binary-release` kind, `holds: "state"`, one node per release, recording
 * id, version, digest, size and where it is fetched from, never the bytes."*
 *
 * ## Why not `materialization` — and what `gpdo` changed about that question
 *
 * Option B was to reuse `materialization`, which already answers *are any of
 * its bytes actually here*. The bean stated its own reservation and asked for
 * it to be decided rather than assumed:
 *
 * > Option B is attractive and **may be wrong: a release is an EVENT with a
 * > version and a digest, not a materialisation state.** Worth deciding rather
 * > than assuming.
 *
 * **Bean `gpdo` has since landed** (owner's pick 2026-09-23, "Third purpose";
 * issue #1194, still open), and it sharpens the mismatch rather than softening
 * it. `MATERIALIZATION_PURPOSES` is now `working | archival | both | compiled`
 * — and all four are purposes of a **copy this instance holds**:
 *
 * | purpose | the question it answers | about |
 * |---|---|---|
 * | `working` | may I re-fetch this if it rots? | a copy here |
 * | `archival` | are these the bytes we stored? | a copy here |
 * | `both` | both of the above | a copy here |
 * | `compiled` | was this built from the inputs we have NOW? | a copy here |
 *
 * A release is about none of those. Its subject is a **publication upstream**,
 * which happened whether or not this instance ever fetched a byte of it, and
 * which stays true after every local copy is deleted. `gpdo` added a third
 * question to materialization — validity against inputs — and a release does
 * not answer that one either: it has no inputs, it has a version.
 *
 * So the two compose rather than substitute. A release node says *v1.8.0
 * published `package.tgz`, 41 MB, sha256 …, at this URL*; a materialization
 * record says *and a copy of it is here, taken for this purpose*. Asking a
 * materialization node "what was released" would get an answer about what was
 * FETCHED, which is the `catalogue`-vs-`library` confusion one corpus over.
 *
 * ## Why `state`, and why `recordsWork: false`
 *
 * The ruling gives `holds`, and the axis's one question agrees: a running
 * process WRITES it — the release pipeline appends a node when it publishes.
 * It fails the stand-alone test outright, the way `qa` and `health` do:
 * detached from the thing released, a digest asserts nothing.
 *
 * It is not `derived`, and that is the interesting call now that `derived`
 * exists. A derived graph is REGENERATED from a source that still exists;
 * re-running a release pipeline produces a **different release**, with a new
 * version and a new digest. Same reasoning that put `qa-report` on `state`
 * rather than `derived`, and the same reasoning that puts its sibling
 * {@link module:schemas/ig-metadata-index | `ig-metadata-index`} on `derived`,
 * where re-harvesting an unchanged IG DOES give the same file back.
 *
 * `recordsWork: false`. Live state, but nothing anybody is partway through: a
 * published release is a completed fact, and an arriving agent cannot pick one
 * up. `check:graph-typology-work` refuses a `state` kind that has not decided,
 * and it is right to — "state" alone does not say whether a reader is looking
 * at a queue or at a ledger.
 *
 * ## The case the kind exists for: the deploy purge
 *
 * `rjug` names *"the >100 MB files the WHO deploy phase DELETES before
 * deployment"*. Those files are published, then removed from the deployed
 * tree, and after the purge **nothing anywhere records that they existed** —
 * not the deployed site, not the repository, not a materialization record,
 * because no copy was kept. A release node is the only place that fact can
 * live, which is why {@link ASSET_DISPOSITIONS} has a value for it and why an
 * asset in that state must still say where it is fetched from: the record is
 * worthless if it cannot get the file back.
 *
 * ## Three things enforced structurally
 *
 * 1. **Never the bytes.** Every object is `.strict()`, so a `content` or
 *    `data` key fails validation rather than being carried, and `fetchedFrom`
 *    is required on every asset — including a purged one. A release node that
 *    cannot say where to get the file is a size and a hash with no referent.
 * 2. **A deletion must say why.** `deleted-before-deploy` requires
 *    `dispositionReason`. "Deleted" with no reason cannot be told from "lost",
 *    which is `deletion-requires-confirmation`'s concern written into a shape:
 *    a removal nobody recorded a reason for leaves the next reader unable to
 *    distinguish a decision from an accident.
 * 3. **Could-not-determine is never clean.** `verifiedAt` lives INSIDE
 *    {@link ReleaseDigestSchema}, so a verification time with no digest is
 *    unrepresentable rather than merely refused — you cannot have verified
 *    what you did not record. And {@link binaryReleaseVerdict} returns
 *    `unknown`, never `ok`, for a release with any undigested asset or any
 *    disposition nobody has established. An unverifiable release is not an
 *    intact one.
 */
import { z } from "zod";

/** The tag a `binary-release` document carries, so it is identified by declaration. */
export const BINARY_RELEASE_SCHEMA_TAG = "folio-binary-release/v1";

/**
 * Where a release was published.
 *
 * Open enough to cover what this repository actually publishes to and no
 * wider. A `workflow-artifact` is included because it is where `qa.json` and
 * the Publisher's outputs land, and it expires — which is a fact about a
 * release worth being able to state.
 */
export const RELEASE_ORIGINS = ["github-release", "package-registry", "workflow-artifact", "pages-site"] as const;
export const ReleaseOriginSchema = z.enum(RELEASE_ORIGINS);
export type ReleaseOrigin = z.infer<typeof ReleaseOriginSchema>;

/**
 * What became of one asset after it was published.
 *
 * - **`published`** — it is where the release put it, and still is.
 * - **`deleted-before-deploy`** — the WHO deploy phase's >100 MB purge, or any
 *   equivalent. Published, then removed from the deployed tree. The case this
 *   kind exists for: after the purge, this node is the only record the file
 *   ever existed.
 * - **`superseded`** — a later release replaced it under the same name.
 * - **`expired`** — a workflow artifact's retention window closed. Distinct
 *   from `deleted-before-deploy` because nobody decided it, which is exactly
 *   the distinction rule 2 in the module doc exists to keep.
 * - **`unknown`** — nobody has looked since. Never read as `published`.
 */
export const ASSET_DISPOSITIONS = ["unknown", "published", "deleted-before-deploy", "superseded", "expired"] as const;
export const AssetDispositionSchema = z.enum(ASSET_DISPOSITIONS);
export type AssetDisposition = z.infer<typeof AssetDispositionSchema>;

/** The dispositions that are a DECISION rather than a fact, and so must say why. */
export const DECIDED_DISPOSITIONS = ["deleted-before-deploy", "superseded"] as const;

/**
 * A digest over an asset's bytes.
 *
 * The same shape as `FixitySchema`, restated rather than imported. It was a
 * deliberate duplicate while `FixitySchema` lived in core's `materialization.ts`:
 * nothing under `cat-harness/` imports from `folio-assistant-core/`. Since bean
 * `tlat` (2026-10-02) `FixitySchema` lives in this instance, in
 * `materialization-state.ts`, so the two CAN now be unified without an upward
 * import; that is left as its own change, because this one's `verifiedAt`
 * semantics are a release's, and unifying is a decision about whether they are
 * the same claim, not only the same shape.
 *
 * `verifiedAt` records when the digest was last RE-COMPUTED against the bytes,
 * not when it was written down. An unverified digest ages.
 */
export const ReleaseDigestSchema = z
  .object({
    algorithm: z.literal("sha256"),
    digest: z.string().regex(/^[0-9a-f]{64}$/, "a sha256 digest is 64 lowercase hex characters"),
    verifiedAt: z.string().min(1).optional(),
  })
  .strict();
export type ReleaseDigest = z.infer<typeof ReleaseDigestSchema>;

/**
 * One published file.
 *
 * `bytes` is required and `digest` is not: a size is always knowable from a
 * listing, while a digest sometimes is not, and pretending otherwise would
 * force a fabricated hash. What is NOT permitted is a claim of verification
 * without one — see the refinement below.
 */
export const ReleaseAssetSchema = z
  .object({
    /** The file's published name, e.g. `package.tgz`. */
    name: z.string().min(1),
    /** Size in bytes. Required — this is half of what the node is for. */
    bytes: z.number().int().nonnegative(),
    digest: ReleaseDigestSchema.optional(),
    /**
     * Where the bytes are fetched from. **Required, even for a purged asset**
     * — a record of a file it cannot get back is a size and a hash with no
     * referent.
     */
    fetchedFrom: z.string().min(1),
    /** Media type, where the publisher declares one. */
    contentType: z.string().min(1).optional(),
    disposition: AssetDispositionSchema,
    /** Why, for a disposition somebody DECIDED. Required for those; refused for the rest. */
    dispositionReason: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const decided = (DECIDED_DISPOSITIONS as readonly string[]).includes(a.disposition);
    if (decided && a.dispositionReason === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dispositionReason"],
        message: `\`${a.disposition}\` is a decision, and a decision with no recorded reason cannot be told from an accident — say why the file went`,
      });
    }
    if (!decided && a.dispositionReason !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dispositionReason"],
        message: `\`${a.disposition}\` is not a decision anybody made, so a reason here would attribute one — drop it, or record the disposition that was actually decided`,
      });
    }
  });
export type ReleaseAsset = z.infer<typeof ReleaseAssetSchema>;

/** The publication EVENT itself. */
export const ReleaseIdentitySchema = z
  .object({
    /** The release's own id in its origin — a GitHub release id, a registry key. */
    id: z.string().min(1),
    /** The version released. Required: an id alone collides across re-publications. */
    version: z.string().min(1),
    /** The git tag, where the origin uses one. */
    tag: z.string().min(1).optional(),
    /** When it was published. */
    publishedAt: z.string().min(1).optional(),
    /** The human-facing page for the release, if there is one. */
    url: z.string().url().optional(),
  })
  .strict();
export type ReleaseIdentity = z.infer<typeof ReleaseIdentitySchema>;

/** Who published it, and where. */
export const ReleaseOriginRefSchema = z
  .object({
    kind: ReleaseOriginSchema,
    /** The repository or registry, e.g. `WorldHealthOrganization/smart-trust`. */
    repository: z.string().min(1),
  })
  .strict();

/** A binary release, as a `folio-binary-release/v1` document. */
export const BinaryReleaseSchema = z
  .object({
    $schema: z.literal(BINARY_RELEASE_SCHEMA_TAG),
    release: ReleaseIdentitySchema,
    origin: ReleaseOriginRefSchema,
    assets: z.array(ReleaseAssetSchema),
  })
  .strict()
  .superRefine((r, ctx) => {
    // One name, one asset. Two records under one name in one release is two
    // answers to "what is `package.tgz`", and a consumer picking either is
    // picking by accident.
    const seen = new Map<string, number>();
    r.assets.forEach((a, i) => {
      const first = seen.get(a.name);
      if (first !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["assets", i, "name"],
          message: `\`${a.name}\` already appears at assets[${first}] — one release cannot hold two answers to what a file is`,
        });
      } else {
        seen.set(a.name, i);
      }
    });
  });
export type BinaryRelease = z.infer<typeof BinaryReleaseSchema>;

/** Total published size, over every asset the release records. */
export function releaseBytes(r: BinaryRelease): number {
  return r.assets.reduce((n, a) => n + a.bytes, 0);
}

/**
 * The assets a deploy phase removed, with the reason each gives.
 *
 * The question this kind was registered to make answerable: after the purge,
 * what was there?
 */
export function purgedAssets(r: BinaryRelease): ReleaseAsset[] {
  return r.assets.filter((a) => a.disposition === "deleted-before-deploy");
}

/**
 * Can this release be shown to be what it says it is?
 *
 * **Three states, and the third is the reason this function exists.** A caller
 * writing `assets.every(a => a.disposition === "published")` gets `true` for a
 * release nobody has checked since it was written down.
 *
 * - `unknown` — some asset carries no digest, or some disposition is
 *   `unknown`. Nothing was established; it is not a pass.
 * - `finding` — every asset is established and at least one is gone
 *   (`deleted-before-deploy`, `superseded` or `expired`). A determined result,
 *   not an error: it is what the node exists to record.
 * - `ok` — every asset is digested and still published.
 */
export function binaryReleaseVerdict(r: BinaryRelease): "ok" | "finding" | "unknown" {
  if (r.assets.some((a) => a.digest === undefined || a.disposition === "unknown")) return "unknown";
  if (r.assets.some((a) => a.disposition !== "published")) return "finding";
  return "ok";
}
