/**
 * Lean package registry — Dependency injection point.
 * Downstream repositories must inject their LEAN_PACKAGES list
 * by calling `configureLeanPackages(packages)`.
 */

export interface LeanPackage {
  /** Short-form package name used in `lean.ref` URI prefixes. */
  name: string;
  /** Paper directory under `content/` (where the `.ts`/`.md` siblings live). */
  paperDir: string;
  /** Path to the paper's Lake package root, relative to repo root. */
  lakeRoot: string;
  /** Default `[[lean_lib]]` name (module root, e.g. "MyPaper"). */
  lib: string;
}

let configuredPackages: readonly LeanPackage[] = [];
let byName = new Map<string, LeanPackage>();
let byPaperDir = new Map<string, LeanPackage>();

export function configureLeanPackages(packages: readonly LeanPackage[]) {
  configuredPackages = packages;
  byName = new Map(packages.map(p => [p.name, p] as const));
  byPaperDir = new Map(packages.map(p => [p.paperDir, p] as const));
}

// Export the array as a proxy so it always reads the injected state
export const LEAN_PACKAGES: readonly LeanPackage[] = new Proxy([] as LeanPackage[], {
  get: (target, prop) => (configuredPackages as any)[prop],
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

/**
 * Standard folio paper packages, applied at import time so the runtime
 * pipelines (qa-sweep, validate, q-usage, …) that never call
 * `configureLeanPackages()` still resolve library-tree `lean.ref` URIs.
 *
 * Before this default, the DI registry stayed EMPTY at runtime (only the
 * unit test injected it), so `resolveCanonicalLean` returned `undefined`
 * for every library-only block (no sibling `.lean`) and wall-side / voice /
 * q-usage / compute-prop silently skipped them corpus-wide.
 *
 * Downstream repos with a different paper set may override by calling
 * `configureLeanPackages(...)` after import (as the test does). Ideally this
 * list is injected by the content repo; keeping it here as a default unbreaks
 * the pipeline without a config-discovery mechanism. Mirrors AGENTS.md §0 and
 * the qou-side static `schemas/lean-packages.ts`.
 */
export const DEFAULT_LEAN_PACKAGES: readonly LeanPackage[] = [
  {
    name: "qou",
    paperDir: "quantum-observable-universe",
    lakeRoot: "content/quantum-observable-universe/lean",
    lib: "QOU",
  },
  {
    name: "ugb",
    paperDir: "unital-groebner-bases",
    lakeRoot: "content/unital-groebner-bases/lean",
    lib: "UGB",
  },
  {
    name: "fred2005",
    paperDir: "fred2005-formal-groups",
    lakeRoot: "content/fred2005-formal-groups/lean",
    lib: "Fred2005",
  },
];

configureLeanPackages(DEFAULT_LEAN_PACKAGES);
