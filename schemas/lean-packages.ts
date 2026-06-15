/**
 * Lean package registry — single source of truth for mapping
 * content-block `lean.ref` URI prefixes to Lake packages and paper
 * directories.
 *
 * A content-block `lean.ref` has the form `"<package>:<Decl.Path>"`.
 * The `<package>` component is the short-form Lake package name as
 * declared in the root `lakefile.toml` (not the paper directory name).
 *
 * To register a new paper:
 *   1. Add a `[[require]]` stanza to the root `lakefile.toml` pointing
 *      at `content/<paper-dir>/lean/`.
 *   2. Add an entry to `LEAN_PACKAGES` below mapping the short-form
 *      package name to the paper directory and default library name.
 *   3. Update `defaultTargets` in the root `lakefile.toml`.
 *
 * @module folio-assistant/schemas/lean-packages
 */

export interface LeanPackage {
  /** Short-form package name used in `lean.ref` URI prefixes. */
  name: string;
  /** Paper directory under `content/` (where the `.ts`/`.md` siblings live). */
  paperDir: string;
  /** Path to the paper's Lake package root, relative to repo root. */
  lakeRoot: string;
  /** Default `[[lean_lib]]` name (module root, e.g. "QOU"). */
  lib: string;
}

export const LEAN_PACKAGES: readonly LeanPackage[] = [
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
] as const;

const BY_NAME = new Map(LEAN_PACKAGES.map(p => [p.name, p] as const));
const BY_PAPER_DIR = new Map(LEAN_PACKAGES.map(p => [p.paperDir, p] as const));

export function leanPackageByName(name: string): LeanPackage | undefined {
  return BY_NAME.get(name);
}

export function leanPackageByPaperDir(dir: string): LeanPackage | undefined {
  return BY_PAPER_DIR.get(dir);
}

export function isLeanPackageName(name: string): boolean {
  return BY_NAME.has(name);
}

/**
 * Parsed form of a `lean.ref` URI.
 *
 * For `"qou:QOU.Torsion.lifting_exists"`:
 *   - `package`  = "qou"
 *   - `decl`     = "QOU.Torsion.lifting_exists"
 *   - `module`   = "QOU.Torsion"
 *   - `name`     = "lifting_exists"
 */
export interface ParsedLeanRef {
  /** Lake package name (e.g. "qou"). */
  package: string;
  /** Fully qualified Lean declaration (e.g. "QOU.Torsion.lifting_exists"). */
  decl: string;
  /** Module path (namespace prefix, e.g. "QOU.Torsion"). */
  module: string;
  /** Bare declaration name (last component, e.g. "lifting_exists"). */
  name: string;
}

/**
 * Parse a `lean.ref` URI into its structural components.
 *
 * Throws if the URI is malformed (missing `:` separator or empty
 * package / decl component).  Does NOT validate that the package is
 * registered — use `isLeanPackageName` for that.
 */
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

/**
 * Format a parsed `lean.ref` back to URI form.
 */
export function formatLeanRef(parts: { package: string; decl: string }): string {
  return `${parts.package}:${parts.decl}`;
}

/**
 * Regex matching a valid `lean.ref` URI shape.
 *
 * Package = lowercase alphanumerics + hyphens.
 * Decl    = dot-separated Lean identifiers (letters, digits, underscores,
 *           primes, Greek letters; we accept any non-whitespace after the
 *           `:` to stay permissive for Mathlib cross-refs).
 */
export const LEAN_REF_PATTERN = /^[a-z][a-z0-9-]*:[^\s:]+$/;
