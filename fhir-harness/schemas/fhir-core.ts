/**
 * fhir-core.ts — the FHIR core specification's StructureDefinitions, one graph
 * per STABLE FHIR release, keyed by canonical URL.
 *
 * Owner, 2026-11-14: *"fhir structured definitions and base resources etc should
 * be loaded in fhir-harness for stable fhir releases to represent it as a
 * harnessed KG."*
 *
 * Two families, both in the `fhir-core-definitions` typology:
 *
 * - `folio-fhir-core-pins/v1` (`fhir-core/pins.json`): which package each
 *   release is read from — `hl7.fhir.r4.core#4.0.1`, `hl7.fhir.r4b.core#4.3.0`,
 *   `hl7.fhir.r5.core#5.0.0` on packages.fhir.org — with the registry's sha1
 *   `shasum` and the sha512 `integrity` of the tarball's bytes. Ballots and
 *   previews are not pinned: a stable release only.
 * - `folio-fhir-core-release/v1` (`fhir-core/<release>/manifest.json`): what
 *   was read from that package, one entry per StructureDefinition chosen by
 *   {@link isCoreDefinition}, keyed by canonical URL, naming the file it is
 *   materialised to and the sha256 of its bytes. A release whose package could
 *   not be fetched or verified is `status: "unread"` with the reason, and has
 *   NO `definitions` field: "could not determine" is never an empty graph.
 *
 * The StructureDefinition bodies themselves (`fhir-core/<release>/
 * StructureDefinition-<id>.json`) are the package's own bytes, unmodified, so
 * the manifest's sha256 checks them; they are materialised by
 * `fhir-core:materialise` and not committed (12 MB of JSON across the three
 * releases, every byte of it already pinned by the package hash).
 *
 * WHO-free: nothing here is an IG's, let alone WHO's.
 *
 * @graphNode schema
 */
import { nodeKind } from "@litlfred/cat-harness-tools/schemas/kg/node-kind.ts";
import { z } from "zod";

export const FHIR_CORE_PINS_TAG = "folio-fhir-core-pins/v1" as const;
export const FHIR_CORE_RELEASE_TAG = "folio-fhir-core-release/v1" as const;

/** The canonical base of every core StructureDefinition. */
export const CORE_SD_BASE = "http://hl7.org/fhir/StructureDefinition/" as const;

/** The stable releases, and the directory each is kept in. */
export const FhirReleaseSchema = z.enum(["R4", "R4B", "R5"]);
export type FhirRelease = z.infer<typeof FhirReleaseSchema>;

export const RELEASE_DIR: Record<FhirRelease, string> = { R4: "r4", R4B: "r4b", R5: "r5" };

/** A stable FHIR version: three numbers, no ballot or snapshot suffix. */
const StableVersion = z.string().regex(/^\d+\.\d+\.\d+$/, "a stable release version (no ballot, snapshot or preview suffix)");

const Sha1Hex = z.string().regex(/^[0-9a-f]{40}$/, "the registry's sha1 shasum, hex");
const Sha512Integrity = z.string().regex(/^sha512-[A-Za-z0-9+/]{86}==$/, "an npm sha512 integrity string");
const Sha256Hex = z.string().regex(/^[0-9a-f]{64}$/);

/** Where one release is read from, and what its tarball's bytes must hash to. */
export const FhirCorePackageSchema = z
  .object({
    name: z.string().regex(/^hl7\.fhir\.r[0-9]+b?\.core$/, "an hl7.fhir.<release>.core package"),
    version: StableVersion,
    /** packages.fhir.org's URL for the exact version. */
    tarball: z.string().regex(/^https:\/\/packages\.fhir\.org\/hl7\.fhir\.r[0-9]+b?\.core\/\d+\.\d+\.\d+$/),
    shasum: Sha1Hex,
    integrity: Sha512Integrity,
  })
  .strict();
export type FhirCorePackage = z.infer<typeof FhirCorePackageSchema>;

export const FhirCorePinSchema = z
  .object({
    release: FhirReleaseSchema,
    fhirVersion: StableVersion,
    package: FhirCorePackageSchema,
  })
  .strict()
  .refine((p) => p.package.version === p.fhirVersion, { message: "a core package's version is its FHIR version" });
export type FhirCorePin = z.infer<typeof FhirCorePinSchema>;

export const FhirCorePinsObject = z
  .object({
    $schema: z.literal(FHIR_CORE_PINS_TAG),
    registry: z.literal("https://packages.fhir.org"),
    /** What a reviewer needs to re-check the pins by hand. */
    note: z.string().min(1),
    releases: z.array(FhirCorePinSchema).min(1),
  })
  .strict();

/** No release is pinned twice. */
export function pinsAgree(d: z.infer<typeof FhirCorePinsObject>, ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  for (const [i, p] of d.releases.entries()) {
    if (seen.has(p.release)) ctx.addIssue({ code: "custom", path: ["releases", i, "release"], message: `${p.release} is pinned twice` });
    seen.add(p.release);
  }
}

export const FhirCorePinsSchema = FhirCorePinsObject.superRefine(pinsAgree);

export const FhirCorePinsKind = nodeKind("folio-fhir-core-pins", [], FhirCorePinsObject.shape, {
  strict: true,
  refine: pinsAgree,
  term: "FHIR core pins",
  summary: "Which hl7.fhir.<release>.core package each stable FHIR release is read from, by version, sha1 and sha512.",
});
export type FhirCorePins = z.infer<typeof FhirCorePinsSchema>;

export const SdKindSchema = z.enum(["primitive-type", "complex-type", "resource"]);

/** One StructureDefinition read from the package, keyed by its canonical URL. */
export const CoreDefinitionSchema = z
  .object({
    url: z.string().startsWith(CORE_SD_BASE),
    id: z.string().regex(/^[A-Za-z0-9\-.]{1,64}$/),
    name: z.string().min(1),
    /** The SD's own `version`, which is the release's FHIR version. */
    version: StableVersion,
    kind: SdKindSchema,
    type: z.string().min(1),
    abstract: z.boolean(),
    /** Absent on a root type: `Element` and `Resource` in R4/R4B, `Base` in R5. */
    derivation: z.literal("specialization").optional(),
    baseDefinition: z.string().startsWith(CORE_SD_BASE).optional(),
    /** The materialised file, relative to the release directory. */
    file: z.string().regex(/^StructureDefinition-[A-Za-z0-9\-.]+\.json$/),
    /** sha256 of the file's bytes, which are the package's bytes. */
    sha256: Sha256Hex,
  })
  .strict()
  .refine((e) => e.url === CORE_SD_BASE + e.id && e.file === `StructureDefinition-${e.id}.json`, {
    message: "a core definition's url and file are both its id's",
  });
export type CoreDefinition = z.infer<typeof CoreDefinitionSchema>;

export const CountsSchema = z
  .object({
    "primitive-type": z.number().int().nonnegative(),
    "complex-type": z.number().int().nonnegative(),
    resource: z.number().int().nonnegative(),
    /** StructureDefinitions in the package the selection left out (profiles, extensions, logical models). */
    excluded: z.number().int().nonnegative(),
  })
  .strict();

/**
 * One object rather than a discriminated union, so the node kind can be made
 * from its shape (`nodeKind` composes shapes); {@link releaseAgrees} holds the
 * two statuses apart, and {@link FhirCoreReleaseManifest} is the union a reader
 * narrows on `status`.
 */
export const FhirCoreReleaseObject = z
  .object({
    $schema: z.literal(FHIR_CORE_RELEASE_TAG),
    release: FhirReleaseSchema,
    fhirVersion: StableVersion,
    package: FhirCorePackageSchema,
    /** The rule {@link isCoreDefinition} applies, in words. */
    selection: z.string().min(1),
    status: z.enum(["read", "unread"]),
    /** `unread` only: why the package could not be read. */
    reason: z.string().min(1).optional(),
    /** `read` only. */
    counts: CountsSchema.optional(),
    /** `read` only, and never empty. An `unread` release has NO `definitions`: unread is not empty. */
    definitions: z.array(CoreDefinitionSchema).min(1).optional(),
  })
  .strict();

/** What no field's own schema can say: which fields each status carries, order, versions and counts. */
export function releaseAgrees(m: z.infer<typeof FhirCoreReleaseObject>, ctx: z.RefinementCtx): void {
  if (m.status === "unread") {
    if (m.reason === undefined) ctx.addIssue({ code: "custom", path: ["reason"], message: "an unread release says why" });
    for (const k of ["counts", "definitions"] as const) {
      if (m[k] !== undefined) ctx.addIssue({ code: "custom", path: [k], message: `an unread release has no ${k}: unread is not empty` });
    }
    return;
  }
  if (m.reason !== undefined) ctx.addIssue({ code: "custom", path: ["reason"], message: "a read release has no reason" });
  if (m.counts === undefined || m.definitions === undefined) {
    ctx.addIssue({ code: "custom", path: ["definitions"], message: "a read release lists its counts and definitions" });
    return;
  }
  let prev = "";
  for (const [i, d] of m.definitions.entries()) {
    if (d.url <= prev) ctx.addIssue({ code: "custom", path: ["definitions", i, "url"], message: `${d.url} is out of order or repeated` });
    prev = d.url;
    if (d.version !== m.fhirVersion) ctx.addIssue({ code: "custom", path: ["definitions", i, "version"], message: `${d.id} is ${d.version}, not ${m.fhirVersion}` });
  }
  const counted = m.counts["primitive-type"] + m.counts["complex-type"] + m.counts.resource;
  if (counted !== m.definitions.length) ctx.addIssue({ code: "custom", path: ["counts"], message: `counts sum to ${counted}, ${m.definitions.length} definitions listed` });
}

export const FhirCoreReleaseSchema = FhirCoreReleaseObject.superRefine(releaseAgrees);

type ReleaseHead = Omit<z.infer<typeof FhirCoreReleaseObject>, "status" | "reason" | "counts" | "definitions">;
export type FhirCoreRead = ReleaseHead & { status: "read"; counts: z.infer<typeof CountsSchema>; definitions: CoreDefinition[] };
export type FhirCoreUnread = ReleaseHead & { status: "unread"; reason: string };
export type FhirCoreReleaseManifest = FhirCoreRead | FhirCoreUnread;

/** Parse a release manifest; the refinement guarantees the union's shape. */
export function parseRelease(value: unknown): FhirCoreReleaseManifest {
  return FhirCoreReleaseSchema.parse(value) as FhirCoreReleaseManifest;
}

export const FhirCoreReleaseKind = nodeKind("folio-fhir-core-release", [], FhirCoreReleaseObject.shape, {
  strict: true,
  refine: releaseAgrees,
  term: "FHIR core release",
  summary: "What was read from one stable FHIR release's core package: its pin, and every type and resource StructureDefinition by canonical URL, or why it could not be read.",
});

export const SELECTION =
  "StructureDefinitions whose url is http://hl7.org/fhir/StructureDefinition/<id>, whose kind is primitive-type, complex-type or resource, and whose derivation is specialization or absent (the root types). Constraint profiles, extension definitions and logical models are left out and counted as excluded.";

/** Whether a package resource is one of the core definitions this graph holds. */
export function isCoreDefinition(sd: unknown): boolean {
  if (typeof sd !== "object" || sd === null) return false;
  const r = sd as Record<string, unknown>;
  return (
    r.resourceType === "StructureDefinition" &&
    typeof r.id === "string" &&
    r.url === CORE_SD_BASE + r.id &&
    (r.kind === "primitive-type" || r.kind === "complex-type" || r.kind === "resource") &&
    (r.derivation === undefined || r.derivation === "specialization")
  );
}
