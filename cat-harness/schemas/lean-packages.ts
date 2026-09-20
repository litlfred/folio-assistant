/**
 * The `lean.ref` grammar and the package registry it resolves against.
 *
 * **Mechanism, not content.** This module knows that a block may cite a formal
 * artefact as `package:Declaration`, how to parse one, and how to look up the
 * package a folio has declared. It does not know which packages exist — a
 * folio injects those with {@link configureLeanPackages}.
 *
 * ## Why this is core and not the science layer
 *
 * `BlockBase` carries an optional `lean` field, in `schemas/types.ts`, and
 * `schemas/constraints.ts` validates its `ref` against
 * {@link LEAN_REF_PATTERN}. The field is on shared block kinds by design —
 * `remark`, `example`, `algorithm` and `simulator` all declare it and the
 * document profile forbids its use (`content/pipeline/profile-check.ts`). So
 * the **grammar belongs wherever the field does**, which is core; only the
 * package list is a property of a particular folio.
 *
 * Seven core modules import from here for exactly that reason — the ref
 * grammar and the lookup, never the list.
 *
 * ## Unconfigured is not empty
 *
 * The registry starts empty and stays empty until a folio configures it, and
 * those two states are different facts: **nobody has said** is not **there are
 * none**. {@link leanPackagesConfigured} is how a caller tells them apart, so
 * a pipeline can report "not checked" rather than silently skipping every
 * library-tree `lean.ref` and looking clean while doing so.
 *
 * That distinction replaces a hardcoded default. Until 2026-09-18 this module
 * shipped three qou-family folios — `qou`, `ugb`, `fred2005`, with their
 * content directories — as `DEFAULT_LEAN_PACKAGES`, applied at import. Its own
 * comment said the list "is injected by the content repo; keeping it here as a
 * default unbreaks the pipeline without a config-discovery mechanism". It was
 * one folio family's data living in the platform, which is the genericity
 * failure this repository is organised against, and no platform test covered
 * it: the whole suite passes with the defaults removed, because the platform
 * carries no corpus to skip.
 *
 * @module schemas/lean-packages
 * @graphNode schema
 */

export interface LeanPackage {
  /** Short-form package name used in `lean.ref` URI prefixes. */
  name: string;
  /** Paper directory under `folio/` (where the `.ts`/`.md` siblings live). */
  paperDir: string;
  /** Path to the paper's Lake package root, relative to repo root. */
  lakeRoot: string;
  /** Default `[[lean_lib]]` name (module root, e.g. "MyPaper"). */
  lib: string;
}

let configuredPackages: readonly LeanPackage[] = [];
let byName = new Map<string, LeanPackage>();
let byPaperDir = new Map<string, LeanPackage>();

/**
 * Whether a folio has configured the registry.
 *
 * Distinct from `LEAN_PACKAGES.length === 0`, and the distinction is the point:
 * a folio may legitimately declare no Lean packages, and that is a different
 * answer from nobody having declared anything. A caller that cannot resolve a
 * `lean.ref` should say which of the two it is.
 */
export function leanPackagesConfigured(): boolean {
  return configured;
}

let configured = false;

export function configureLeanPackages(packages: readonly LeanPackage[]) {
  configured = true;
  configuredPackages = packages;
  byName = new Map(packages.map(p => [p.name, p] as const));
  byPaperDir = new Map(packages.map(p => [p.paperDir, p] as const));
}

// Export the array as a proxy so it always reads the injected state
export const LEAN_PACKAGES: readonly LeanPackage[] = new Proxy([] as LeanPackage[], {
  // `Reflect.get` reads an arbitrary key off the injected array without
  // reopening its element type.
  get: (_target, prop) => Reflect.get(configuredPackages, prop),
  ownKeys: () => Reflect.ownKeys(configuredPackages),
  getOwnPropertyDescriptor: (_, prop) => Reflect.getOwnPropertyDescriptor(configuredPackages, prop),
  has: (_, key) => key in configuredPackages,
});

export function leanPackageByName(name: string): LeanPackage | undefined {
  return byName.get(name);
}

export function leanPackageByPaperDir(dir: string): LeanPackage | undefined {
  return byPaperDir.get(dir);
}

export function isLeanPackageName(name: string): boolean {
  return byName.has(name);
}

export interface ParsedLeanRef {
  package: string;
  decl: string;
  module: string;
  name: string;
}

export function parseLeanRef(ref: string): ParsedLeanRef {
  const idx = ref.indexOf(":");
  if (idx < 0) {
    throw new Error(
      `Invalid lean.ref "${ref}": expected "<package>:<Decl.Path>" (missing ':')`,
    );
  }
  const pkg = ref.slice(0, idx);
  const decl = ref.slice(idx + 1);
  if (!pkg || !decl) {
    throw new Error(
      `Invalid lean.ref "${ref}": both package and decl must be non-empty`,
    );
  }
  const lastDot = decl.lastIndexOf(".");
  const module = lastDot < 0 ? decl : decl.slice(0, lastDot);
  const name = lastDot < 0 ? decl : decl.slice(lastDot + 1);
  return { package: pkg, decl, module, name };
}

export function formatLeanRef(parts: { package: string; decl: string }): string {
  return `${parts.package}:${parts.decl}`;
}

export const LEAN_REF_PATTERN = /^[a-z][a-z0-9-]*:[^\s:]+$/;

