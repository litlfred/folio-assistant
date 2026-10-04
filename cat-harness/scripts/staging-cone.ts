/**
 * The staging CONE, at file level: which rendered directories a branch's
 * changed files can reach. Bean `4j86`; owner, 2026-10-04: *"staging rebuild
 * only what is dependency cone of changes (general rule)"*, at FILE level
 * (option 1 of 3), with the generator named by `writer` on the directory
 * (option 1 of 3).
 *
 * A directory is HIT when a changed file is
 *
 *   1. under its own path (its source data, or the pages themselves), or
 *   2. in the import closure of a `writer` it declares, or under a directory
 *      `writer` names (a generator's templates are read, not imported, so
 *      they are declared as a directory rather than discovered).
 *
 * and the cone is every hit directory plus everything `derivedFrom` makes
 * downstream of it (`downstreamOf`, bean `nama`).
 *
 * ## Any doubt carries
 *
 * No file list carries everything. A writer whose closure cannot be read
 * carries its directory with the reason said, and the two causes are not the
 * same doubt:
 *
 * - a closure file that is MISSING, or a specifier that does not resolve, is
 *   unbounded — anything could be behind it — so any change carries;
 * - an `import()` of a COMPUTED path is bounded: it can load only a module
 *   (code or JSON), never a page or a skill. So it carries on a changed module
 *   file and on nothing else.
 *
 * And one computed site is not a doubt at all, because its targets are
 * DECLARED. `harness-config.ts` loads each dependency's `contributes` module,
 * and `block-module.ts` loads a folio's block manifests from its `folio`
 * directories. They were the only two in gen-ig-pages' closure (measured
 * 2026-10-04), and both are read from the declarations and walked like any
 * import, so a change to a contributions module carries exactly what reaches
 * it. Under-carrying misleads a reviewer; over-carrying costs bytes
 * (`carriedInstances`' rule, bean `ga8a`, kept).
 *
 * @module cat-harness/scripts/staging-cone
 * @covers none — it computes over declarations and code, and judges nothing
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { specifiersOf } from "../../bootstrap-tools/scripts/check-closure.js";
import { instanceRootsIn, readDeclaration } from "../schemas/cat-harness.ts";
import { contributingDependencies } from "../schemas/harness-config.ts";
import { downstreamOf, type Edge, judge, readTree, renderingOrder } from "./check-derived-from.ts";

export interface ConeDir {
  /** `instance/id`, as `check-derived-from` names a node. */
  node: string;
  /** Repo-relative, ending in `/`. */
  path: string;
  /** Repo-relative script files, or directories ending in `/`. */
  writer?: readonly string[];
}

export interface Closure {
  files: Set<string>;
  /** Why the closure is incomplete in a way any change could hide behind. */
  doubt?: string;
  /** Why the closure may also reach modules it does not list (a computed `import()`). */
  computed?: string;
}

/** What a computed `import()` can load. */
const MODULE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs|json)$/;

const EXTENSIONS = ["", ".ts", ".tsx", ".js", ".mjs"];

/** Resolve a relative specifier the way Bun does for this repo: as written, then `.js` → `.ts`, then by extension. */
function resolveSpecifier(fromAbs: string, spec: string): string | undefined {
  const base = resolve(dirname(fromAbs), spec);
  const candidates = [base, base.replace(/\.js$/, ".ts"), ...EXTENSIONS.map((e) => base + e), join(base, "index.ts")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}

/**
 * Computed `import()` sites whose targets are declared somewhere readable,
 * keyed by the importing file. Anything not listed stays a bounded doubt.
 */
export const DECLARED_COMPUTED_IMPORTS: Record<string, (repoRoot: string) => string[]> = {
  // `loadContributions`: each dependency's declared `contributes` module,
  // resolved by harness-config's OWN resolver so the two cannot disagree about
  // which file a declaration names.
  "cat-harness/schemas/harness-config.ts": (repoRoot) =>
    contributingDependencies(repoRoot).map((c) => relative(repoRoot, c.modulePath)),
  // `loadBlockModule`: a folio's block manifests, which live in the directories
  // declared with graph kind `folio`.
  "cat-harness/content/pipeline/block-module.ts": (repoRoot) =>
    instanceRootsIn(repoRoot).flatMap((root) =>
      (readDeclaration(root)?.directories ?? [])
        .filter((d) => d.graphKinds.includes("folio"))
        .flatMap((d) => tsFilesUnder(join(root, d.path)).map((f) => relative(repoRoot, f))),
    ),
};

function tsFilesUnder(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) tsFilesUnder(abs, out);
    else if (e.name.endsWith(".ts") && !e.name.endsWith(".test.ts")) out.push(abs);
  }
  return out;
}

/** The repo-relative files `entry` imports, transitively, itself included. */
export function importClosure(entry: string, repoRoot: string): Closure {
  const files = new Set<string>();
  const queue = [resolve(repoRoot, entry)];
  let doubt: string | undefined;
  let computed: string | undefined;
  while (queue.length > 0) {
    const abs = queue.pop()!;
    const rel = relative(repoRoot, abs);
    if (files.has(rel)) continue;
    if (!existsSync(abs)) {
      doubt ??= `${rel} does not exist`;
      continue;
    }
    files.add(rel);
    const src = readFileSync(abs, "utf-8");
    if (/\bimport\s*\(\s*[^"'\s)]/.test(src.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""))) {
      const declared = DECLARED_COMPUTED_IMPORTS[rel];
      if (declared) for (const t of declared(repoRoot)) queue.push(resolve(repoRoot, t));
      else computed ??= `${rel} imports a computed path`;
    }
    for (const spec of specifiersOf(src)) {
      if (!spec.startsWith(".")) continue; // bare → node_modules, out of the repo's cone
      const hit = resolveSpecifier(abs, spec);
      if (hit === undefined) doubt ??= `${rel} imports ${spec}, which does not resolve`;
      else queue.push(hit);
    }
  }
  return { files, ...(doubt ? { doubt } : {}), ...(computed ? { computed } : {}) };
}

export interface ConeDecision {
  node: string;
  /** Repo-relative, ending in `/` — what a caller matches a composed directory against. */
  path: string;
  carry: boolean;
  why: string;
}

/**
 * Decide, per directory, whether the branch's changed files reach it.
 *
 * @param changed repo-relative changed paths; `undefined` when unknown
 * @param order the rendering order (`renderingOrder`), so the result reads in it
 */
export function cone(
  changed: readonly string[] | undefined,
  dirs: readonly ConeDir[],
  order: readonly string[],
  edges: readonly Edge[],
  closureOf: (writer: string) => Closure,
): ConeDecision[] {
  if (changed === undefined) {
    return dirs.map((d) => ({ node: d.node, path: d.path, carry: true, why: "no readable file list for this branch — carrying everything" }));
  }
  const files = changed.map((f) => f.replace(/^\.\//, ""));
  const direct = new Map<string, string>();
  for (const d of dirs) {
    const own = files.find((f) => f.startsWith(d.path) || `${f}/` === d.path);
    if (own) {
      direct.set(d.node, `the branch changes ${own}`);
      continue;
    }
    for (const w of d.writer ?? []) {
      if (w.endsWith("/")) {
        const hit = files.find((f) => f.startsWith(w));
        if (hit) direct.set(d.node, `the branch changes ${hit}, which its writer reads`);
      } else {
        const c = closureOf(w);
        const hit = files.find((f) => c.files.has(f));
        if (hit) direct.set(d.node, `the branch changes ${hit}, in the import closure of ${w}`);
        else if (c.doubt) direct.set(d.node, `the closure of ${w} cannot be read (${c.doubt}) — carrying it`);
        else if (c.computed) {
          const mod = files.find((f) => MODULE.test(f));
          if (mod) direct.set(d.node, `the branch changes ${mod}, and ${c.computed} that ${w} may reach — carrying it`);
        }
      }
      if (direct.has(d.node)) break;
    }
  }
  const reached = new Set(downstreamOf([...direct.keys()], order, edges));
  const from = (n: string) => {
    // Name the source the change reached it through, for the build log.
    for (const e of edges) if (e.from === n && reached.has(e.to)) return e.to;
    return undefined;
  };
  return dirs.map((d) => {
    if (direct.has(d.node)) return { node: d.node, path: d.path, carry: true, why: direct.get(d.node)! };
    if (reached.has(d.node)) {
      return { node: d.node, path: d.path, carry: true, why: `it is derived from ${from(d.node)}, which the branch reaches` };
    }
    return { node: d.node, path: d.path, carry: false, why: "no changed file reaches it" };
  });
}

/** The cone over this checkout's declarations: the one call a build makes. */
export function coneForCheckout(changed: readonly string[] | undefined, repoRoot: string): ConeDecision[] {
  const tree = readTree(repoRoot);
  const { edges } = judge(tree, (p) => existsSync(join(repoRoot, p)));
  const dirs: ConeDir[] = tree.flatMap((i) =>
    i.dirs.map((d) => ({ node: `${i.name}/${d.id}`, path: d.path ?? "", ...(d.writer ? { writer: d.writer } : {}) })),
  );
  const memo = new Map<string, Closure>();
  const closureOf = (w: string) => {
    if (!memo.has(w)) memo.set(w, importClosure(w, repoRoot));
    return memo.get(w)!;
  };
  return cone(changed, dirs, renderingOrder(tree, edges), edges, closureOf);
}
