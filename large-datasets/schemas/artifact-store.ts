/**
 * Where a large build artifact goes — and why it is never "a GitHub Release".
 *
 * @module large-datasets/schemas/artifact-store
 * @graphNode schema
 *
 * ## The instruction
 *
 * The owner, 2026-09-20, on publishing a search index outside the site tree:
 *
 * > *"2 + make tool that can be done anothr way potentially if not github cdn"*
 *
 * and earlier, on the hosting itself:
 *
 * > *"using ghpages as CDN is a tool choice, other tools possible like
 * > cloudflare, doucment that in process/BPMNS/skills"*
 *
 * So the pipeline step is **"publish a large artifact"**, and *how* is a
 * property of the instance, not of the step. A GitHub Release is one
 * implementation. Writing the release API into the pipeline would make every
 * downstream instance that does not use GitHub unable to publish at all, which
 * is the same failure `publication.host` already exists to prevent — and which
 * `harness.json` already guards with a third state: *"an instance that has not
 * said is `undefined`, and must never be read as `github-pages`."*
 *
 * ## Why a large artifact needs a store at all
 *
 * Measured on this repository, 2026-09-20:
 *
 * | | bytes | |
 * |---|---|---|
 * | 7 staging previews | 304,159,961 | ~43.5 MB each |
 * | warning threshold | 104,857,600 | the owner's own instruction, 2026-09-19 |
 * | GitHub Pages limit | 1 GB | documented |
 *
 * The previews are already **2.9×** the warning. A search index for a large
 * catalogue — 53 MB is the measured floor for full IRIS at title-and-url only —
 * cannot go in the site tree beside them. A store is what lets it live
 * somewhere the site budget does not reach.
 *
 * ## Staging gets NO index, and that is a correctness rule
 *
 * Not a saving — a correctness rule, and the saving is incidental. If staging
 * inherited a release-built index it would return hits for pages that have
 * since changed: a **wrong pass, believed**, which is the failure this
 * repository names in `readme-sections`, in `repo-partition` and in
 * `ci-health` alike. Absent is honest; stale is not. So staging disables
 * search and SAYS SO — silence would read as "no results".
 */
import { z } from "zod";

export const ARTIFACT_STORE_SCHEMA_TAG = "folio-artifact-store/v1";

/**
 * Where large artifacts go for this instance.
 *
 * `undefined` — no declaration — means the instance has **no** store, so the
 * publish step must REFUSE rather than fall back to a default. Falling back to
 * GitHub would silently publish somebody's data to a host they did not choose.
 */
export const ARTIFACT_STORE_KINDS = [
  /** A GitHub Release asset. Outside the Pages 1 GB budget; needs a token and a tag. */
  "github-release",
  /** Any object store reached over HTTPS — R2, S3, a university's own. */
  "object-store",
  /** A path inside the published site. Simple, and subject to the site's size budget. */
  "site-tree",
] as const;
export type ArtifactStoreKind = (typeof ARTIFACT_STORE_KINDS)[number];

export const ArtifactStoreSchema = z
  .object({
    $schema: z.literal(ARTIFACT_STORE_SCHEMA_TAG).optional(),
    kind: z.enum(ARTIFACT_STORE_KINDS),
    /**
     * The base the artifact will be READABLE at. Required, and it is the
     * "EXTREME care in URL handling" clause in schema form: a published URL is
     * a promise, and the address has to be decided before the upload rather
     * than discovered from whatever the host returned.
     */
    publicBaseUrl: z.string().url(),
    /**
     * Whether the store's URLs are immutable once published. `true` means a
     * re-publish MUST use a new path; `false` means readers may be served a
     * cached old copy for up to `cacheTtlSeconds`.
     */
    immutableUrls: z.boolean(),
    /** What a CDN in front of this store will hold onto. Absent means unstated, never zero. */
    cacheTtlSeconds: z.number().int().nonnegative().optional(),
    /** Largest single artifact, where the host states one. Absent means unstated, never unlimited. */
    maxArtifactBytes: z.number().int().positive().optional(),
    /** Why this store, in one sentence — it is a choice, and a choice with no reason cannot be revisited. */
    basis: z.string().min(1),
  })
  .strict();
export type ArtifactStore = z.infer<typeof ArtifactStoreSchema>;

/** Which pipeline stage is running. The index is built for exactly one of them. */
export const RENDER_STAGES = ["staging", "release"] as const;
export type RenderStage = (typeof RENDER_STAGES)[number];

/**
 * What the search index should be for a stage — never a boolean.
 *
 * Three outcomes, because "build it", "do not build it and say so" and "we
 * cannot publish it anywhere" are three different situations needing three
 * different messages to the reader.
 */
export type SearchIndexPlan =
  | { action: "build"; store: ArtifactStore; url: string }
  | { action: "omit"; reason: string }
  | { action: "refuse"; reason: string };

/**
 * Decide, for one stage.
 *
 * Deliberately takes the store as a possibly-`undefined` argument rather than
 * reading a default: an instance that has declared no store must reach
 * `refuse`, and a default would have published to somebody else's host.
 */
export function planSearchIndex(
  stage: RenderStage,
  store: ArtifactStore | undefined,
  estimatedBytes: number,
): SearchIndexPlan {
  if (stage === "staging") {
    return {
      action: "omit",
      reason:
        "staging builds no search index. A release-built index served on staging would return " +
        "hits for pages that have since changed — a wrong pass, believed. The page must SAY " +
        "search is unavailable here; silence reads as 'no results'.",
    };
  }
  if (!store) {
    return {
      action: "refuse",
      reason:
        "no artifact store is declared for this instance. Publishing to a default host would " +
        "put this data somewhere its owner did not choose — the same third-state rule " +
        "`publication.host` already follows.",
    };
  }
  if (store.maxArtifactBytes !== undefined && estimatedBytes > store.maxArtifactBytes) {
    return {
      action: "refuse",
      reason:
        `the index is an estimated ${estimatedBytes} bytes and this store states a limit of ` +
        `${store.maxArtifactBytes}. Shard it, or narrow what is indexed — publishing a truncated ` +
        `index would make an absent hit indistinguishable from an absent document.`,
    };
  }
  return {
    action: "build",
    store,
    url: `${store.publicBaseUrl.replace(/\/+$/, "")}/search-data.json`,
  };
}
