/**
 * The Lean formalism layer's implementation of core's formal-reference
 * injection point.
 *
 * ## Why this module exists
 *
 * 🟧 **Owner ruling, 2026-09-27**, verbatim across two messages:
 *
 * > *"f-a-sci __should__ have scehams for math/science papers."*
 * > *"field sits on shared kinds (remark, example, algorithm, simulator), so
 * > the grammar genuinely is  vocabulary that goes tp f-a-sci"*
 *
 * `schemas/lean-packages.ts` and `content/pipeline/lean-signature.ts` are the
 * science layer's, and core may not import them. Five core modules did:
 *
 * ```
 * schemas/constraints.ts        -> lean-packages      (grammar + package lookup)
 * adapters/document/resolver.ts -> lean-packages      (source resolution)
 * adapters/mcp-server/server.ts -> lean-packages      (source resolution)
 * adapters/manifest-entries.ts  -> lean-packages      (a parse helper)
 * content/pipeline/qa-utils.ts  -> lean-packages      (canonical resolution)
 * content/pipeline/qa-utils.ts  -> lean-signature     (statement hashing)
 * ```
 *
 * Six wrong-direction edges, measured twice — at `.folio-assistant-pin` and on
 * current `main` — so the figure is not a pin artifact. This module is the
 * other half of removing them: `schemas/formal-ref.ts` is the socket, and this
 * is the plug.
 *
 * **Nine core modules import `lean-packages`, not six, and the other three are
 * exempt BY DESIGN.** `content/pipeline/export-json.ts`,
 * `conjectural-propagation-audit.ts` and `conditional-class-banner-audit.ts`
 * are composition roots (`import.meta.main`), and `partition/engine.ts` exempts
 * a composition root from the direction rule because assembling layers is what
 * one is for — while still counting the edge in `totalEdges`, so it stays
 * visible. A reader who greps importers finds nine and must not read six as an
 * undercount; re-measure with `repo-partition.ts --edges` rather than by grep.
 *
 * ## What moved, and what stayed
 *
 * The canonical-resolution machinery below was `qa-utils.ts` lines 409-735 and
 * moved **verbatim**, comments and measured counts included. That is
 * deliberate: it is the single source of truth for `lean.ref` -> on-disk file,
 * three qou scripts hold a cache for it, and a rewrite during a move would
 * make a behaviour change indistinguishable from the move. Core keeps
 * `resolveCanonicalLean` and `listPackageLeanFiles` as one-line delegations at
 * their old names and arities, so no caller changes.
 *
 * ## Installation
 *
 * Importing this module installs the resolver, and {@link installLeanFormalRefResolver}
 * is exported for a caller that wants the act to be visible rather than a side
 * effect of an import. Both are needed: a bare `import` is what a composition
 * root can add in one line, and the named call is what a test can assert.
 *
 * **`configureLeanPackages` is re-exported from here, and that is the entry
 * point callers should use.** Installing the resolver and declaring the package
 * list are two halves of installing the same layer, and a caller that does one
 * without the other gets an unconfigured resolver that answers `undefined` to
 * everything — silently, which is the whole failure mode this module exists
 * downstream of. Re-exporting means one import does both: the install happens as
 * this module evaluates, and the list is declared by the function the caller
 * came for. `schemas/lean-packages.ts` stays the low-level module and its direct
 * importers (all science-layer or tests) are unaffected.
 *
 * Measured, when the re-export was not there: the four Lean-related platform
 * test files went **9 red**, every one of them a test that called
 * `configureLeanPackages` and never installed the resolver. That is not a test
 * defect, it is the footgun arriving on the first four consumers to try it.
 *
 * Unconfigured is not empty either way: core's getters return `undefined` / `[]`,
 * and a consumer that can proceed without resolution must ask
 * `formalRefResolverConfigured()` rather than read the empty answer as a clean
 * one. That conflation is qou bean `qou-i2ed`, whose whole content is a
 * predicate with zero callers.
 *
 * @module content/pipeline/lean-formal-ref
 * @graphNode pipeline
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

import {
  configureFormalRefResolver,
  type FormalRefResolution,
  type FormalRefResolverAPI,
  type FormalTreeCache,
} from "../../schemas/formal-ref.js";
import {
  LEAN_PACKAGES,
  LEAN_REF_PATTERN,
  leanPackageByName,
  parseLeanRef,
} from "../../schemas/lean-packages.js";

// One import installs the layer. See the module docstring: declaring the
// package list and installing the resolver are two halves of one act, and a
// caller doing only the first gets `undefined` from every resolution with no
// diagnostic.
export { configureLeanPackages, leanPackagesConfigured } from "../../schemas/lean-packages.js";
export type { LeanPackage } from "../../schemas/lean-packages.js";
import { leanStatementHash } from "./lean-signature.js";

// ── Canonical lean.ref resolution (single source of truth) ──────
//
// This is THE resolver for `lean.ref` → on-disk Lean file. Every QA
// consumer — `walkBlocks` (used by qa-sweep), `q-usage-audit`,
// `qa-agent-write`, and orphan-coverage scans — routes through
// `resolveCanonicalLean` so the candidate-1 (sibling) → candidate-2
// (Lake/library tree) resolution can never drift between tools. Do not
// reimplement this walk anywhere else; pass a `LakeTreeCache` for bulk
// callers and reuse the same function.

/**
 * Per-package basename → first-path index for one Lake root, keyed by
 * the absolute Lake-root path. Bulk callers (walking many blocks) build
 * this once and reuse it so the library tree is scanned a single time
 * rather than once per ref.
 */
/** @deprecated Use {@link FormalTreeCache}; kept so the moved bodies below read unchanged. */
type LakeTreeCache = FormalTreeCache;

/** Walk one Lake root once, indexing `*.lean` basename → absolute path. */
function buildLakeBasenameMap(absRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const stack: string[] = [absRoot];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        // First occurrence wins for ambiguous basenames; the common
        // case (one file per basename) is unambiguous.
        else if (e.isFile() && e.name.endsWith(".lean") && !map.has(e.name))
          map.set(e.name, full);
      }
    }
  } catch {
    /* Lake root missing — empty map */
  }
  return map;
}

/** Fetch (or lazily build + cache) the basename index for a Lake root. */
function lakeBasenameMap(
  absRoot: string,
  cache?: LakeTreeCache,
): Map<string, string> {
  if (!cache) return buildLakeBasenameMap(absRoot);
  let m = cache.get(absRoot);
  if (!m) {
    m = buildLakeBasenameMap(absRoot);
    cache.set(absRoot, m);
  }
  return m;
}

/**
 * Resolve a content block's package-qualified `lean.ref` URI (e.g.
 * `qou:QOU.FluidDynamics.q_bkm_criterion`) to the **canonical compiled
 * declaration file** under the package's Lake tree, e.g.
 * `<repo>/content/quantum-observable-universe/lean/QOU/FluidDynamics/q_bkm_criterion.lean`.
 *
 * Tries (a) the direct module-path file, then (b) a basename search
 * under the package Lake root. Returns `undefined` if the ref is absent,
 * malformed, the package is unknown, or no file is found.
 *
 * QA tooling uses this so it scores the canonical (package-compiled)
 * declaration rather than an uncompiled sibling stub: a content block's
 * `<root>.lean` may be a `True := by trivial` placeholder while the real
 * statement lives in the library module named by `lean.ref` (CLAUDE.md
 * §3b-cond — the sibling stub is not the integrity gate).
 *
 * Pass a shared `cache` when resolving many refs (e.g. a corpus sweep)
 * so the Lake tree is scanned once; omit it for single-block callers.
 */
/**
 * Does `file` textually declare a top-level `name` (theorem/def/…)?
 *
 * Used to reject the **import-only aggregator** trap: a ref like
 * `qou:QOU.BraidKnot.foo` has module `QOU.BraidKnot`, whose direct
 * module-path `QOU/BraidKnot.lean` is an `import …`-only aggregator that
 * declares nothing. Candidate (a) must not return it — the decl `foo`
 * lives in a leaf file under `QOU/BraidKnot/`. Lenient (comment-blind) on
 * purpose: it only *gates* candidate (a), and a false positive there is no
 * worse than the pre-fix behaviour.
 */
/** Regex fragment listing every Lean top-level declaration keyword. */
const _DECL_KW =
  "theorem|lemma|def|abbrev|instance|structure|class|inductive|opaque|axiom";

/**
 * Does `file` declare **anything at all**, or is it an import-only aggregator?
 *
 * Used to keep the safe fallback from handing back a file that declares
 * nothing. A ref naming a decl that does not exist (e.g. `qou:QOU.Foo` when no
 * `Foo` was ever written) parses with module `QOU`, whose module-path file is
 * the library root — a list of `import` lines. Returning that made every
 * checker audit the import list and **pass**, which is strictly worse than the
 * honest `n/a` an unresolved ref produces. Measured on the qou corpus
 * 2026-08-15: 65 of 1220 blocks resolved this way (bean `qou-cu0a`).
 */
function fileDeclaresAnything(file: string): boolean {
  let body: string;
  try {
    body = readFileSync(file, "utf-8");
  } catch {
    return false;
  }
  return new RegExp(`^\\s*(?:noncomputable\\s+|private\\s+|protected\\s+)*(?:${_DECL_KW})\\s`, "mu")
    .test(body);
}

function fileDeclaresName(file: string, name: string): boolean {
  let body: string;
  try {
    body = readFileSync(file, "utf-8");
  } catch {
    return false;
  }
  const short = name.includes(".") ? name.split(".").pop()! : name;
  const esc = short.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `\\b(?:theorem|lemma|def|abbrev|instance|structure|class|inductive|opaque|axiom)\\s+(?:[\\w'.\\u00C0-\\uFFFF]*\\.)?${esc}\\b`,
    "u",
  ).test(body);
}

const _DECL_RE =
  /^(?:@\[[^\]]*\]\s*)*(?:(?:private|protected|scoped|local|noncomputable|partial|unsafe|nonrec)\s+)*(?:theorem|lemma|def|abbrev|instance|structure|class|inductive|opaque|axiom)\s+([A-Za-z_À-￿][^\s:({\[⦃⟨]*)/u;
const _NS_RE = /^namespace\s+([A-Za-z_À-￿][\w'.À-￿]*)/u;
const _END_RE = /^end\b/;
const _SEC_RE = /^section\b/;
const _SHORT = "|short|";

/**
 * Walk one Lake root once, indexing **fully-qualified declaration name →
 * file** (namespace-aware). This is candidate (c): it resolves a
 * `lean.ref` whose last segment is a *declaration* name whose file
 * basename differs (e.g. `binding_isovector_mirror_from_chiral` living in
 * `BindingIsovectorChiralResidue.lean`) — the case candidates (a) and (b)
 * both miss. Unambiguous short names are also indexed under a sentinel key
 * as a looser fallback. Comment/section aware so a keyword inside `/- … -/`
 * or a `namespace … end` scope is handled correctly.
 */
function buildLakeDeclMap(absRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  const short = new Map<string, string | null>();
  const files: string[] = [];
  try {
    const stack: string[] = [absRoot];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile() && e.name.endsWith(".lean")) files.push(full);
      }
    }
  } catch {
    return map;
  }
  for (const file of files) {
    let body: string;
    try {
      body = readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const nsStack: string[] = [];
    const openKind: ("ns" | "sec")[] = [];
    let blockDepth = 0;
    for (const rawLine of body.split("\n")) {
      // Strip block comments (`/- … -/`, nesting) and `--` line comments.
      let line = "";
      let i = 0;
      while (i < rawLine.length) {
        if (blockDepth > 0) {
          if (rawLine.startsWith("-/", i)) {
            blockDepth--;
            i += 2;
          } else if (rawLine.startsWith("/-", i)) {
            blockDepth++;
            i += 2;
          } else i++;
        } else if (rawLine.startsWith("/-", i)) {
          blockDepth++;
          i += 2;
        } else if (rawLine.startsWith("--", i)) {
          break;
        } else {
          line += rawLine[i];
          i++;
        }
      }
      const t = line.trim();
      if (!t) continue;
      let m: RegExpMatchArray | null;
      if ((m = t.match(_NS_RE))) {
        nsStack.push(m[1]);
        openKind.push("ns");
        continue;
      }
      if (_SEC_RE.test(t)) {
        openKind.push("sec");
        continue;
      }
      if (_END_RE.test(t)) {
        if (openKind.pop() === "ns") nsStack.pop();
        continue;
      }
      if ((m = t.match(_DECL_RE))) {
        const declName = m[1];
        const full = [nsStack.join("."), declName].filter(Boolean).join(".");
        if (!map.has(full)) map.set(full, file);
        const s = declName.includes(".") ? declName.split(".").pop()! : declName;
        if (!short.has(s)) short.set(s, file);
        else if (short.get(s) !== file) short.set(s, null);
      }
    }
  }
  for (const [k, v] of short) if (v && !map.has(_SHORT + k)) map.set(_SHORT + k, v);
  return map;
}

/** Fetch (or lazily build + cache) the decl-name index for a Lake root. */
function lakeDeclMap(
  absRoot: string,
  cache?: LakeTreeCache,
): Map<string, string> {
  const key = `${absRoot}|decls`;
  if (!cache) return buildLakeDeclMap(absRoot);
  let m = cache.get(key);
  if (!m) {
    m = buildLakeDeclMap(absRoot);
    cache.set(key, m);
  }
  return m;
}

function resolveCanonicalLean(
  ref: string | undefined,
  repoRoot: string,
  cache?: LakeTreeCache,
): string | undefined {
  if (!ref) return undefined;
  let parsed: ReturnType<typeof parseLeanRef>;
  try {
    parsed = parseLeanRef(ref);
  } catch {
    return undefined;
  }
  const pkg = leanPackageByName(parsed.package);
  if (!pkg) return undefined;
  const lakeRootAbs = resolve(repoRoot, pkg.lakeRoot);
  // (a) Direct module-path — trust ONLY if the file actually declares the
  //     decl. This rejects the import-only aggregator (`QOU/BraidKnot.lean`)
  //     that a module-with-subdirectory shares its name with.
  const direct = resolve(
    lakeRootAbs,
    `${parsed.module.replace(/\./g, "/")}.lean`,
  );
  const directExists = existsSync(direct);
  if (directExists && fileDeclaresName(direct, parsed.name)) return direct;
  // (b) Basename fallback under the Lake tree.
  const byBasename = lakeBasenameMap(lakeRootAbs, cache).get(
    `${parsed.name}.lean`,
  );
  if (byBasename) return byBasename;
  // (c) Fully-qualified decl → file scan (decl-named ref whose file basename
  //     differs AND whose module path is an aggregator).
  const declMap = lakeDeclMap(lakeRootAbs, cache);
  const byDecl = declMap.get(parsed.decl) ?? declMap.get(_SHORT + parsed.name);
  if (byDecl) return byDecl;
  // (safe fallback) preserve legacy behaviour: a ref that resolved to the
  //   direct module-path before the (a)-gate still resolves to it, so no
  //   previously-resolving ref regresses to `undefined`.
  //
  //   EXCEPT when that file declares nothing at all. An import-only aggregator
  //   carries no statement to audit, so returning it makes every checker pass
  //   vacuously on a list of `import` lines — strictly worse than the honest
  //   `n/a` that `undefined` produces, because a false green is indistinguishable
  //   from a real one. Refs naming a decl that exists nowhere land here (module
  //   `QOU` → the library root); 65 of 1220 qou blocks did, bean `qou-cu0a`.
  //   Real single-module files still fall back exactly as before.
  if (directExists && fileDeclaresAnything(direct)) return direct;
  return undefined;
}

/**
 * Enumerate every `*.lean` file under every configured package's Lake
 * tree (absolute paths). Single source for "what library-tree files
 * exist", consumed by orphan-coverage scans that audit Lean files
 * reachable by **no** block's `lean.ref`. Returns `[]` when no packages
 * are configured (e.g. the framework repo with no content injected).
 */
function listPackageLeanFiles(repoRoot: string): string[] {
  const out: string[] = [];
  for (const pkg of LEAN_PACKAGES) {
    const absRoot = resolve(repoRoot, pkg.lakeRoot);
    try {
      const stack: string[] = [absRoot];
      while (stack.length) {
        const dir = stack.pop()!;
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          // `.lake/` is Lake's BUILD DIRECTORY: vendored third-party sources
          // (Mathlib, Batteries, …) plus build output. Measured on qou
          // 2026-08-30: 8,013 of the 10,412 `.lean` files under the Lake root
          // live there — 77 %. Walking them makes every consumer audit its own
          // dependencies: the q-usage audit reported `wall-base-ring-minimal`
          // findings against `.lake/packages/mathlib/Mathlib/Algebra/CharP/*`,
          // "…and 1474 more".
          //
          // This function's own contract is why the exclusion is correct and
          // not merely convenient: it feeds "orphan-coverage scans that audit
          // Lean files reachable by NO block's `lean.ref`". A Mathlib file is
          // not an orphan of this corpus — it is not ours to cover.
          if (e.isDirectory() && e.name === ".lake") continue;
          const full = join(dir, e.name);
          if (e.isDirectory()) stack.push(full);
          else if (e.isFile() && e.name.endsWith(".lean")) out.push(full);
        }
      }
    } catch {
      /* Lake root missing — skip this package */
    }
  }
  return out;
}

// ── The injection ───────────────────────────────────────────────

/**
 * Candidate source paths for a `lean.ref`, repo-root-relative.
 *
 * Reproduces the conventions core used to build inline. They are NOT
 * interchangeable, and the three call sites did not agree — which is why the
 * record carries **two** lists rather than one merged one:
 *
 *  - **The decl-prefix ladder**, longest first down to two segments, is
 *    `candidatePaths`. Both resolvers walked exactly this, because a ref's last
 *    segment may be a declaration name rather than a module, in which case the
 *    file is a *prefix* of the ref.
 *  - **The direct module path** — `<lakeRoot>/<module-as-path>.lean` — is
 *    `fallbackPaths` when the ladder does not already contain it. That happens
 *    precisely when the decl has one dot (`qou:QOU.Foo` → module `QOU`), and the
 *    path is then the **library root**: a list of `import` lines. That is the
 *    `qou-cu0a` aggregator trap — 65 of 1220 qou blocks resolved onto it, where
 *    every checker passed vacuously. `schemas/constraints.ts` accepted it and
 *    still does; neither source resolver did and neither now does.
 *  - **A basename scan** under the Lake root is `basename` + `treeRoot`, not
 *    performed here, because the validator does it through its own injected
 *    `lakeTreeContainsBasename`.
 *
 * Merging the two lists would have been the obvious move and is a behaviour
 * change in the worse direction: it would put the aggregator in front of the
 * decl-path file for the two resolvers, so the MCP server would start showing
 * an import list as a block's Lean source. Keeping them separate is what makes
 * this a move rather than a rewrite — each caller gets back exactly the set it
 * had.
 */
function leanResolve(ref: string): FormalRefResolution | undefined {
  let parsed: ReturnType<typeof parseLeanRef>;
  try {
    parsed = parseLeanRef(ref);
  } catch {
    // Malformed — distinct from "parsed but the package is undeclared", which
    // resolves to a record with no candidates. A caller writing a diagnostic
    // needs to name which of the two it hit.
    return undefined;
  }
  const pkg = leanPackageByName(parsed.package);
  const basename = `${parsed.name}.lean`;
  if (!pkg) {
    return { candidatePaths: [], declName: parsed.name, basename };
  }
  // The decl-prefix ladder, longest first down to two segments.
  const candidates: string[] = [];
  const parts = parsed.decl.split(".");
  for (let i = parts.length; i >= 2; i--) {
    candidates.push(`${pkg.lakeRoot}/${parts.slice(0, i).join("/")}.lean`);
  }
  const modulePath = `${pkg.lakeRoot}/${parsed.module.replace(/\./g, "/")}.lean`;
  // A dotless decl (`qou:Foo`) gives an empty ladder, and `parseLeanRef` sets
  // `module === decl` there, so the module path IS the only candidate and is not
  // an aggregator. Every other case already has it in the ladder or demotes it.
  if (candidates.length === 0) candidates.push(modulePath);
  const fallbackPaths = candidates.includes(modulePath) ? [] : [modulePath];
  return {
    candidatePaths: candidates,
    fallbackPaths,
    declName: parsed.name,
    // The library subtree a grep fallback should search. `lib` is the module
    // root, so this is narrower than `lakeRoot` and excludes Lake's `.lake/`
    // build directory without needing a rule about it.
    searchDir: `${pkg.lakeRoot}/${pkg.lib}`,
    basename,
    treeRoot: pkg.lakeRoot,
  };
}

/** This layer's contract implementation. */
export const LEAN_FORMAL_REF_RESOLVER: FormalRefResolverAPI = {
  resolve: leanResolve,
  statementHash: leanStatementHash,
  refPattern: LEAN_REF_PATTERN,
  refPatternMessage:
    'Lean ref must be "<package>:<Decl.Path>" (e.g. "qou:QOU.Foo"). ' +
    "If this branch still uses the legacy { decl, file } shape, " +
    "run `cd content && bun run migrate-lean-refs` to convert it.",
  resolveCanonical: (ref: string, repoRoot: string, cache?: FormalTreeCache) =>
    resolveCanonicalLean(ref, repoRoot, cache),
  listSourceFiles: (repoRoot: string) => listPackageLeanFiles(repoRoot),
};

/**
 * Install the Lean resolver into core's injection point.
 *
 * Idempotent, and called once at import. Exported so a composition root can
 * make the installation explicit and a test can install without relying on
 * module-evaluation order.
 */
export function installLeanFormalRefResolver(): void {
  configureFormalRefResolver(LEAN_FORMAL_REF_RESOLVER);
}

installLeanFormalRefResolver();
