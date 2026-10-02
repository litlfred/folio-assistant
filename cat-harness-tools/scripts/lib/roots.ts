/**
 * The three roots a file in this layer means, named once.
 *
 * ## Why this exists
 *
 * Code that lived in `cat-harness/` computed "the harness" as
 * `import.meta.dir/..` — 460 such sites in 399 files, measured for bean `70lx`
 * (S5 stage 1a). Once that code moves here the same expression means
 * `cat-harness-tools/`, which holds no skills, processes, docs or results, and
 * nothing fails loudly: a scan over an empty directory reports a clean run (the
 * bean `dh4f` shape). So every such site is rewritten, as it moves, to ask for
 * the root it meant:
 *
 * | constant | means | is |
 * |---|---|---|
 * | {@link HARNESS_ROOT} | the harness CONTENT this layer serves — skills, processes, schemas, `test/results/` | resolved, see below |
 * | {@link TOOLS_ROOT} | this layer itself — the code that moved | `import.meta.dir/../..` |
 * | {@link REPO_ROOT} | the checkout holding both, when there is one | `undefined` standalone |
 *
 * ## How the harness is found, and why in this order
 *
 * 1. `--harness <dir>` (or `--harness=<dir>`) — the caller said so, for this run.
 * 2. `$CAT_HARNESS_ROOT` — the environment said so, for every run.
 * 3. The sibling `../cat-harness`, **only if its declaration's `name` is
 *    `cat-harness`**. A directory that merely has the right name is not the
 *    harness; the declaration is the contract, as it is everywhere else here.
 *
 * Nothing found is a THROW, not a guess. Every caller of `HARNESS_ROOT` reads
 * content from it, and a wrong root reads as an empty corpus.
 *
 * An explicit root (1 or 2) is checked the same way: it must hold a
 * `cat-harness.json` naming `cat-harness`. A typo in `$CAT_HARNESS_ROOT`
 * should fail where it is made, not three calls later as "no skills".
 *
 * ## Why this file reads the declaration itself
 *
 * It could import `readDeclaration` from the harness, but that import is a
 * relative path into the sibling — which assumes the very layout this module
 * exists to resolve. One `JSON.parse` of one field keeps the resolver free of
 * the thing it is resolving.
 *
 * @module scripts/lib/roots
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** The harness's machine name, as its declaration states it. */
export const HARNESS_NAME = "cat-harness";

/** This layer's root: `cat-harness-tools/`, two levels above this file. */
export const TOOLS_ROOT: string = resolve(import.meta.dir, "..", "..");

/** Where a harness root came from — reported, so a surprise is diagnosable. */
export type HarnessRootSource = "flag" | "env" | "sibling";

export interface HarnessRootInputs {
  /** Command-line arguments to scan for `--harness`. Defaults to `process.argv`. */
  argv?: readonly string[];
  /** Environment to read `CAT_HARNESS_ROOT` from. Defaults to `process.env`. */
  env?: Readonly<Record<string, string | undefined>>;
  /** This layer's root, whose sibling is tried last. Defaults to {@link TOOLS_ROOT}. */
  toolsRoot?: string;
}

/** `--harness <dir>` or `--harness=<dir>`; the last one wins, as with any flag. */
export function harnessFlag(argv: readonly string[]): string | undefined {
  let found: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--harness" && i + 1 < argv.length) found = argv[++i];
    else if (a.startsWith("--harness=")) found = a.slice("--harness=".length);
  }
  return found === "" ? undefined : found;
}

/** Does `dir` hold a declaration whose `name` is the harness's? */
export function isHarnessRoot(dir: string): boolean {
  const decl = join(dir, `${HARNESS_NAME}.json`);
  if (!existsSync(decl)) return false;
  try {
    return (JSON.parse(readFileSync(decl, "utf8")) as { name?: unknown }).name === HARNESS_NAME;
  } catch {
    return false;
  }
}

/**
 * Resolve the harness root: flag, then environment, then the declared sibling.
 *
 * Throws when an explicit root is not the harness, and when nothing is found.
 */
export function resolveHarnessRoot(inputs: HarnessRootInputs = {}): { root: string; source: HarnessRootSource } {
  const argv = inputs.argv ?? process.argv;
  const env = inputs.env ?? process.env;
  const toolsRoot = inputs.toolsRoot ?? TOOLS_ROOT;

  const explicit: Array<[HarnessRootSource, string | undefined]> = [
    ["flag", harnessFlag(argv)],
    ["env", env.CAT_HARNESS_ROOT || undefined],
  ];
  for (const [source, dir] of explicit) {
    if (dir === undefined) continue;
    const root = resolve(dir);
    if (!isHarnessRoot(root)) {
      throw new Error(
        `${source === "flag" ? "--harness" : "$CAT_HARNESS_ROOT"} names ${root}, which holds no ` +
          `${HARNESS_NAME}.json declaring name "${HARNESS_NAME}".`,
      );
    }
    return { root, source };
  }

  const sibling = resolve(toolsRoot, "..", HARNESS_NAME);
  if (isHarnessRoot(sibling)) return { root: sibling, source: "sibling" };

  throw new Error(
    `cannot find the harness: no --harness flag, no $CAT_HARNESS_ROOT, and ${sibling} holds no ` +
      `${HARNESS_NAME}.json declaring name "${HARNESS_NAME}". Pass --harness <dir>.`,
  );
}

/**
 * The checkout holding both layers, or `undefined` when there is none.
 *
 * Defined as the common parent when the harness is this layer's sibling. A
 * harness found anywhere else means this layer is standalone, and there is no
 * single directory that is "the repository" for both — so the answer is
 * absent rather than a plausible wrong path.
 */
export function repoRootFor(toolsRoot: string, harnessRoot: string): string | undefined {
  const parent = dirname(resolve(toolsRoot));
  return dirname(resolve(harnessRoot)) === parent ? parent : undefined;
}

const resolved = resolveHarnessRoot();

/** The harness content this layer serves. See the module docblock for the order. */
export const HARNESS_ROOT: string = resolved.root;

/** How {@link HARNESS_ROOT} was found. */
export const HARNESS_ROOT_SOURCE: HarnessRootSource = resolved.source;

/** The checkout holding both layers; `undefined` when this layer is standalone. */
export const REPO_ROOT: string | undefined = repoRootFor(TOOLS_ROOT, HARNESS_ROOT);
