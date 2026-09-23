/**
 * Every declared `tools` graph's Tool nodes, found by asking the declarations.
 *
 * @module cat-harness/tools/discover
 *
 * ## Why this exists — bean `p0za`
 *
 * Eight of the nine modules that read a tool list imported
 * `cat-harness/tools/index.ts`, which holds only this instance's own Tools.
 * `smart-base/tools/` and `fhir-harness/tools/` declared Tool nodes that no
 * check, export or audit ever saw — declared, and unreachable. A barrel that
 * imported them would not fix it: the harness may not import an instance that
 * depends on it (`check:partition`), and a core Tool is exactly that.
 *
 * The owner ruled **auto-discovery** (2026-09-22): every directory an instance
 * declares with graph kind `tools` is loaded, and its `tools()` export merged.
 *
 * ## Why this adds no import edge
 *
 * The module specifier is a variable read from a declaration, the same pattern
 * `qa-checker-discovery.ts` uses for QA checkers. `repo-partition` counts a
 * literal `import("./x")` as an edge and a variable one as none, and that is
 * the right distinction: the edge exists exactly when the target is hardcoded.
 *
 * ## What auto-discovery gives up, and what takes its place
 *
 * The barrel's header recorded why a runtime scan was rejected before: a
 * malformed Tool would fail when something called it rather than at `tsc`.
 * That is still true of discovery. What replaces it is `check:tools`, which is
 * in the gate set and runs THIS discovery: a declared `tools` module that does
 * not load, exports no `tools()`, or yields a Tool that fails its schema is a
 * reported {@link ToolDiscovery.failures | failure}, and the gate fails on it.
 * A broken Tool is caught on push, in the same PR, not on call in production.
 *
 * ## Failures are never "no tools"
 *
 * A declared graph whose module is missing or throws is a failure with a
 * reason. Folding it into an empty list would make "this instance's Tools
 * could not be loaded" read as "this instance has no Tools", which is the
 * clean-run-over-nothing defect (`dh4f`) at the scale of a whole graph.
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { declarationPathIn, instanceDirectoryForGraph, instanceRootsIn } from "../schemas/cat-harness.js";
import { ToolDefinitionSchema, type ToolDefinition } from "../schemas/tool.js";

/** This instance's root (`<repo>/cat-harness`) and the repository above it. */
const HARNESS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(HARNESS, "..");

/**
 * The base every Tool's I/O type IRIs are minted against when the caller
 * names none: THIS instance's declared `canonicalUrl`.
 *
 * The tool-type vocabulary (`schemas/tool-types.ts`) is the harness's, and
 * it is published once, at the harness's base. Before discovery, each
 * instance's `tools()` fell back to its OWN canonical. Nothing checked that,
 * because nothing could see those Tools, and so smart-base's nine pointed at
 * `http://smart.who.int/base/tool-types.schema.json`. That is a FHIR
 * canonical, and WHO publishes no such document. Found by `tools.test.ts` the
 * first time it saw them (bean p0za). A caller that names a base (a preview
 * build) still gets that base for every instance.
 */
function harnessBase(): string | undefined {
  const p = declarationPathIn(HARNESS);
  if (p === undefined || !existsSync(p)) return undefined;
  try {
    return (JSON.parse(readFileSync(p, "utf-8")) as { canonicalUrl?: string }).canonicalUrl;
  } catch {
    return undefined;
  }
}

/**
 * Synchronous on purpose. Bun's `require` loads an ES module written in
 * TypeScript without an `await`, so every consumer keeps calling `tools()`
 * exactly as it called the barrel's, and only its import line changes. An
 * async discovery would have turned eight call sites, and everything above
 * them, into async code for no gain in what is checked.
 */
const load = createRequire(import.meta.url);

export interface ToolSource {
  /** Instance root, relative to the repository. */
  instance: string;
  /** The declared `tools` directory, relative to the repository. */
  dir: string;
  count: number;
}

export interface ToolDiscoveryFailure {
  instance: string;
  dir?: string;
  reason: string;
}

export interface ToolDiscovery {
  /** Every Tool that loaded and validated, in instance order. */
  tools: ToolDefinition[];
  sources: ToolSource[];
  failures: ToolDiscoveryFailure[];
}

/**
 * Load every declared `tools` graph under `repoRoot`.
 *
 * `baseUrl` is passed through to each `tools(baseUrl)`, for the same reason
 * the barrel threaded it: a Tool's IO schema IRIs are minted against the base
 * the document is published at.
 */
export function discoverTools(
  repoRoot: string = REPO,
  baseUrl: string | undefined = harnessBase(),
  onlyInstance?: string,
): ToolDiscovery {
  const out: ToolDiscovery = { tools: [], sources: [], failures: [] };
  const seen = new Map<string, string>();
  const rel = (p: string) => relative(repoRoot, p) || ".";

  for (const inst of instanceRootsIn(repoRoot)) {
    if (onlyInstance !== undefined && resolve(inst) !== resolve(onlyInstance)) continue;
    let dir: string | undefined;
    try {
      dir = instanceDirectoryForGraph(inst, "tools");
    } catch (e) {
      out.failures.push({ instance: rel(inst), reason: `declaration could not be resolved: ${(e as Error).message}` });
      continue;
    }
    if (!dir) continue;

    const mod = join(dir, "index.ts");
    const where = { instance: rel(inst), dir: rel(dir) };
    if (!existsSync(mod)) {
      out.failures.push({ ...where, reason: "declares a `tools` graph but has no index.ts to load it from" });
      continue;
    }

    let ns: Record<string, unknown>;
    try {
      ns = load(mod) as Record<string, unknown>;
    } catch (e) {
      out.failures.push({ ...where, reason: `index.ts did not load: ${(e as Error).message}` });
      continue;
    }
    if (typeof ns.tools !== "function") {
      out.failures.push({ ...where, reason: "index.ts exports no `tools()` function" });
      continue;
    }

    let defs: unknown;
    try {
      defs = (ns.tools as (b?: string) => unknown)(baseUrl);
    } catch (e) {
      out.failures.push({ ...where, reason: `tools() threw: ${(e as Error).message}` });
      continue;
    }
    if (!Array.isArray(defs)) {
      out.failures.push({ ...where, reason: "tools() did not return an array" });
      continue;
    }

    let count = 0;
    for (const d of defs) {
      const parsed = ToolDefinitionSchema.safeParse(d);
      const id = (d as { id?: unknown })?.id;
      if (!parsed.success) {
        out.failures.push({ ...where, reason: `Tool ${String(id)} fails its schema: ${parsed.error.issues[0]?.message}` });
        continue;
      }
      const prior = seen.get(parsed.data.id);
      if (prior) {
        out.failures.push({ ...where, reason: `Tool id "${parsed.data.id}" is also declared by ${prior}` });
        continue;
      }
      seen.set(parsed.data.id, where.instance);
      out.tools.push(d as ToolDefinition);
      count++;
    }
    out.sources.push({ ...where, count });
  }
  return out;
}

const _cache = new Map<string, ToolDefinition[]>();

/**
 * Every discovered Tool, as the old barrel's `tools()` returned them, so a
 * consumer's call sites do not change.
 *
 * **Throws on any discovery failure.** A consumer reading a partial list would
 * export, audit or cover-check an instance as if its unloadable Tools did not
 * exist. `check:tools` reads {@link discoverTools} directly and reports each
 * failure; everything else refuses to proceed on a partial list.
 */
export function tools(baseUrl?: string): ToolDefinition[] {
  return cached(undefined, baseUrl);
}

/**
 * ONE instance's Tools: the ones its own `tools` graph declares.
 *
 * For a consumer that writes one instance's document. `kg-export` publishes
 * `<instance>.jsonld`, and filling the harness's document with smart-base's
 * Tools would give them `satisfies` links into documents that are never
 * published. A check or an audit over the whole repository reads
 * {@link tools}.
 */
export function toolsOf(instanceRoot: string, baseUrl?: string): ToolDefinition[] {
  return cached(resolve(instanceRoot), baseUrl);
}

function cached(only: string | undefined, baseUrl?: string): ToolDefinition[] {
  const key = `${only ?? "*"}\0${baseUrl ?? ""}`;
  const hit = _cache.get(key);
  if (hit) return hit;
  const d = discoverTools(REPO, baseUrl ?? harnessBase(), only);
  if (d.failures.length > 0) {
    throw new Error(
      `tool discovery failed for ${d.failures.length} declared tools graph(s):\n` +
        d.failures.map((f) => `  ${f.dir ?? f.instance}: ${f.reason}`).join("\n") +
        "\nRun `bun run check:tools` for the report.",
    );
  }
  _cache.set(key, d.tools);
  return d.tools;
}
