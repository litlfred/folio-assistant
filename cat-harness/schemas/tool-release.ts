/**
 * Tool releases — one external tool at one version, with the digest of the
 * bytes and the runtime THIS release needs. **Never the bytes.**
 *
 * @module schemas/tool-release
 * @graphNode schema
 *
 * Step 1 of `docs/proposals/tool-releases-2026-10-07.md` (issue #2481, bean
 * `3sbm`), signed off by the owner 2026-10-07. The case it exists for: a local
 * render in PR #2454 produced no PlantUML SVGs because the container had no
 * `java`, the renderer said "rendered 0", and nothing else noticed. The owner:
 *
 * > need named/versioned releases + sha of software. it's not a gate per se,
 * > but a logging of what version of the Tool was used for audit purpose.
 *
 * > different tools may need different instances of java, so cannot "pin"
 * > java globally on a diverse tool-chain
 *
 * ## A sibling of `binary-release`, not a reuse of it
 *
 * {@link module:schemas/binary-release | `binary-release`} records releases this
 * repository PUBLISHES; this records one it CONSUMES. They share the one thing
 * that is the same claim — a sha256 over an artefact's bytes — so
 * {@link ReleaseDigestSchema} is imported rather than restated. The rest differs:
 * a consumed release has one artefact rather than a list of assets, and it
 * carries how to RUN it and what runtime it runs on, which a publication record
 * has no reason to know.
 *
 * ## Runtimes are per release, never global
 *
 * The owner's second sentence above is the design. `runtimes[]` names another
 * tool release by `name@version`, and a JRE is itself a release with its own
 * digest. Two tools needing two JREs name two releases, and both sit side by
 * side in the cache. The runtime is INJECTED into the tool's environment
 * (`JAVA_HOME` or `PATH`), never inherited from the host — inheriting is how
 * "rendered 0" happened.
 *
 * `role` says which releases are ONLY runtimes, by declaration rather than by
 * inference from who points at whom. A profile names tools; a profile that
 * named a runtime would be pinning java globally by another name, and
 * {@link module:schemas/tool-profile | `tool-profile`} refuses it. A `tool`
 * may still be injected into another tool — graphviz is run on its own and is
 * also how PlantUML finds `dot` — so a `runtimes[]` entry may point at either
 * role; what it needs is an `entry.home` to inject.
 *
 * ## Four things enforced structurally
 *
 * 1. **A digest is required.** The resolver (step 2) refuses a download whose
 *    hash does not match, and a record with no digest gives it nothing to
 *    compare. Every seeded record's digest was computed over downloaded bytes
 *    or read from the publisher's own checksum file; none is a placeholder.
 * 2. **An OCI image is identified by digest, never by tag.** A tag moves under
 *    the reader; `name@sha256:<hex>` does not. And the reference's digest must
 *    equal `digest.digest`, or the record holds two answers to "which image".
 * 3. **An entry template runs THIS release.** It must use `{path}` (the cached
 *    artefact) or `{home}` (a directory inside the unpacked archive), and only
 *    those placeholders. `java -version` would run whatever `java` is around.
 * 4. **A release does not name itself as its runtime**, and names no runtime
 *    twice.
 *
 * The licence is an SPDX expression. Zod checks that it is one line; whether
 * every id is ON the pinned SPDX License List needs the list, which is read
 * from disk, so {@link toolReleaseLicenceProblem} does it with
 * `check:source-licence`'s own `checkLicenceExpression` rather than a second
 * parser.
 */
import { z } from "zod";

import { ReleaseDigestSchema } from "./binary-release";
import { checkLicenceExpression, type SpdxLicenseList } from "./spdx-license-expression";

/** The tag a tool-release document carries, so it is identified by declaration. */
export const TOOL_RELEASE_SCHEMA_TAG = "folio-tool-release/v1";

/** A tool's name: lowercase, digits, dot, dash, underscore. No `@`, so a ref splits once. */
export const ToolNameSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*$/, "a tool name: lowercase letters, digits, `.`, `_` and `-`, starting with a letter or digit");

/** A version as the publisher spells it (`21.0.4+7`, `1.2024.7`). No whitespace, `@` or `/`. */
export const ToolVersionSchema = z.string().regex(/^[^\s@/]+$/, "a version: no whitespace, `@` or `/`");

/**
 * A reference to one tool release: `<name>@<version>`.
 *
 * The form a profile and a `runtimes[]` entry both use, so a reader resolves
 * either the same way.
 */
export const ToolReleaseRefSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9._-]*@[^\s@/]+$/, "a release reference is `<name>@<version>`");
export type ToolReleaseRef = z.infer<typeof ToolReleaseRefSchema>;

/** Split a ref at its one `@`. The schema guarantees there is exactly one. */
export function parseToolReleaseRef(ref: ToolReleaseRef): { name: string; version: string } {
  const at = ref.indexOf("@");
  return { name: ref.slice(0, at), version: ref.slice(at + 1) };
}

/** The ref a release is addressed by. */
export function toolReleaseRef(r: { name: string; version: string }): ToolReleaseRef {
  return `${r.name}@${r.version}`;
}

/**
 * What the artefact IS, which decides how the resolver lays it down.
 *
 * - `jar` — one Java archive, run by a Java runtime.
 * - `archive` — a tarball, zip or package the resolver unpacks; `entry.home`
 *   says where inside it the tool's root is.
 * - `binary` — one executable file.
 * - `oci-image` — a container image, pulled by digest.
 * - `toolchain-file` — a file another tool reads to choose a toolchain
 *   (`lean-toolchain`, `rust-toolchain.toml`).
 */
export const TOOL_RELEASE_KINDS = ["jar", "archive", "binary", "oci-image", "toolchain-file"] as const;
export const ToolReleaseKindSchema = z.enum(TOOL_RELEASE_KINDS);
export type ToolReleaseKind = z.infer<typeof ToolReleaseKindSchema>;

/**
 * Is this release a tool somebody invokes, or a runtime a tool runs ON?
 *
 * Declared rather than inferred from `runtimes[]` pointers, because the
 * inference is wrong exactly when it matters: a runtime nobody points at yet
 * would read as a tool, and a profile could then name it.
 */
export const TOOL_RELEASE_ROLES = ["tool", "runtime"] as const;
export const ToolReleaseRoleSchema = z.enum(TOOL_RELEASE_ROLES);

/**
 * How a runtime reaches the tool's process.
 *
 * - `JAVA_HOME` — `JAVA_HOME` is set to the runtime's `entry.home`, and
 *   `<home>/bin` is put first on `PATH`.
 * - `PATH` — the runtime's `<home>/bin` is put first on `PATH`, and nothing
 *   else is set.
 *
 * Either way the runtime's record must declare `entry.home`;
 * `toolReleaseGraphProblems` refuses a ref to one that does not.
 *
 * Never "inherit": the host's runtime is the one this kind exists to stop
 * depending on.
 */
export const RUNTIME_INJECTIONS = ["JAVA_HOME", "PATH"] as const;
export const RuntimeInjectionSchema = z.enum(RUNTIME_INJECTIONS);

/** One runtime this release needs, and how it is injected. */
export const ToolRuntimeRefSchema = z
  .object({
    release: ToolReleaseRefSchema,
    inject: RuntimeInjectionSchema,
  })
  .strict();
export type ToolRuntimeRef = z.infer<typeof ToolRuntimeRefSchema>;

/** `<registry>/<repository>@sha256:<64 hex>` — the only OCI form a record accepts. */
const OCI_BY_DIGEST = /^[a-z0-9][a-z0-9.-]*(:[0-9]+)?(\/[a-z0-9._-]+)+@sha256:([0-9a-f]{64})$/;

/**
 * Where the artefact is fetched from.
 *
 * A URL for a file; an OCI reference for an image. The OCI form is accepted
 * ONLY by digest: `ghcr.io/x/y:1.0` is refused, because the bytes behind a
 * tag can change and the record would go on vouching for them.
 */
export const ToolReleaseSourceSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("url"),
      url: z.string().url().refine((u) => u.startsWith("https://"), "fetch over https"),
    })
    .strict(),
  z
    .object({
      type: z.literal("oci"),
      reference: z
        .string()
        .regex(OCI_BY_DIGEST, "an OCI image is identified by its digest — `<registry>/<repository>@sha256:<64 hex>`, never by a tag"),
    })
    .strict(),
]);
export type ToolReleaseSource = z.infer<typeof ToolReleaseSourceSchema>;

/**
 * The platform an artefact was built for, when it was built for one.
 *
 * Absent means platform-independent (a jar). A JRE tarball or a `.deb` is not,
 * and saying so is what stops a resolver handing a Linux x64 JRE to an arm64
 * host. `distribution` is for a package built against one distribution's
 * libraries (`ubuntu-24.04`).
 */
export const ToolPlatformSchema = z
  .object({
    os: z.enum(["linux", "darwin", "windows"]),
    arch: z.enum(["x64", "arm64"]),
    distribution: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/).optional(),
  })
  .strict();
export type ToolPlatform = z.infer<typeof ToolPlatformSchema>;

/** The placeholders an entry template may use. */
export const ENTRY_PLACEHOLDERS = ["path", "home"] as const;

/**
 * How to run this release.
 *
 * `template` is a command line. `{path}` is the cached artefact itself;
 * `{home}` is `home`, resolved inside the unpacked artefact. A runtime's
 * executables come from its injection, which is why PlantUML's template can
 * say `java` and still mean the JRE its record names.
 */
export const ToolEntrySchema = z
  .object({
    template: z.string().min(1),
    /** The tool's root inside an unpacked archive, relative and POSIX. */
    home: z
      .string()
      .min(1)
      .refine((h) => !h.startsWith("/") && !h.split("/").includes(".."), "relative, and never above the unpacked root")
      .optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    const used = [...e.template.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]!);
    for (const p of used) {
      if (!(ENTRY_PLACEHOLDERS as readonly string[]).includes(p)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["template"],
          message: `\`{${p}}\` is not a placeholder; the template may use ${ENTRY_PLACEHOLDERS.map((x) => `\`{${x}}\``).join(" and ")}`,
        });
      }
    }
    if (!used.includes("path") && !used.includes("home")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["template"],
        message: "the template never names `{path}` or `{home}`, so it would run whatever is on the host rather than this release",
      });
    }
    if (used.includes("home") && e.home === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["home"], message: "the template uses `{home}`, so say where it is" });
    }
  });
export type ToolEntry = z.infer<typeof ToolEntrySchema>;

/** One tool release, as a `folio-tool-release/v1` document. */
export const ToolReleaseSchema = z
  .object({
    $schema: z.literal(TOOL_RELEASE_SCHEMA_TAG),
    name: ToolNameSchema,
    version: ToolVersionSchema,
    role: ToolReleaseRoleSchema,
    kind: ToolReleaseKindSchema,
    /** Required: the resolver's one refusal is a mismatch against this. */
    digest: ReleaseDigestSchema,
    source: ToolReleaseSourceSchema,
    /** An SPDX licence expression, one line. Checked against the pinned list by {@link toolReleaseLicenceProblem}. */
    licence: z
      .string()
      .min(1)
      .refine((l) => !/[\r\n]/.test(l), "a licence expression is one line"),
    /** Where the licence was read from — the jar's own `-license`, the archive's `legal/`, the repository's `LICENSE`. */
    licenceSource: z.string().min(1),
    platform: ToolPlatformSchema.optional(),
    /** Every runtime this release needs. Required, so "needs none" is stated rather than omitted. */
    runtimes: z.array(ToolRuntimeRefSchema),
    entry: ToolEntrySchema,
    /** Anything a resolver or a reader must know that the fields cannot say. */
    note: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((r, ctx) => {
    const self = toolReleaseRef(r);
    const seen = new Set<string>();
    r.runtimes.forEach((rt, i) => {
      if (rt.release === self) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["runtimes", i, "release"], message: `\`${self}\` cannot be its own runtime` });
      }
      if (seen.has(rt.release)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["runtimes", i, "release"], message: `\`${rt.release}\` is named twice` });
      }
      seen.add(rt.release);
    });
    if ((r.kind === "oci-image") !== (r.source.type === "oci")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["source", "type"],
        message: r.kind === "oci-image" ? "an `oci-image` is fetched by OCI reference" : "only an `oci-image` is fetched by OCI reference",
      });
    }
    if (r.source.type === "oci") {
      const hex = OCI_BY_DIGEST.exec(r.source.reference)?.[3];
      if (hex !== undefined && hex !== r.digest.digest) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["digest", "digest"],
          message: "the OCI reference names a different digest — one record, two answers to which image",
        });
      }
    }
  });
export type ToolRelease = z.infer<typeof ToolReleaseSchema>;

/**
 * Is the licence a valid expression over the pinned SPDX License List?
 *
 * `undefined` when it is; otherwise the problem, in the words
 * `checkLicenceExpression` gives. A deprecated id is reported by that function
 * and NOT refused here, matching `check:source-licence`.
 */
export function toolReleaseLicenceProblem(r: Pick<ToolRelease, "licence">, list: SpdxLicenseList): string | undefined {
  return checkLicenceExpression(r.licence, list).problem;
}
