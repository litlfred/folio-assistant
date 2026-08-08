/**
 * Shared test helpers — repo paths, Lean project discovery, file scanning.
 *
 * All tests import from here so paths are consistent and
 * project discovery works for QOU, Fred2005, Unital, or any future project.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative, resolve } from "path";
import { execSync } from "child_process";
import { findContentRepoRoot, findPapers } from "../../content/pipeline/repo-root";
import { LEAN_PACKAGES } from "../../schemas/lean-packages";

// ── Paths ───────────────────────────────────────────────────────

/** Root of THIS repo — the folio-assistant platform checkout. */
export const REPO_ROOT = resolve(import.meta.dir, "../..");

/**
 * Root of the CONTENT repo (the folio), when one is attached.
 *
 * folio-assistant is the platform; the Lean workspace, `proof-objects.json`,
 * `lean-toolchain` and the papers themselves live in a SEPARATE repo which
 * embeds this one (as a sibling clone plus a `folio-assistant/` symlink —
 * see `scripts/setup-folio-assistant.sh` in the folio).
 *
 * A plain `bun test` here has no folio attached, so anything asserting a
 * content artifact must SKIP rather than fail — see `hasFolio()`. Tests
 * that hardcoded `REPO_ROOT + "content/quantum-observable-universe/..."`
 * were asserting a path that cannot exist in this repo, which is most of
 * why the suite carried 29 permanent failures.
 */
export const FOLIO_ROOT: string | undefined = (() => {
  // Resolve from `process.cwd()`, NOT from this file's location. The folio
  // embeds the platform as a SYMLINK (`<folio>/folio-assistant`), and
  // `import.meta.dir` resolves through it to the real platform path — so
  // walking up from here never reaches the folio, even when running from
  // one. (Same trap that made `q-usage-audit.ts` sweep the wrong repo.)
  //
  // Reuses the pipeline's helpers rather than carrying a second copy of
  // the walk: one implementation, already covered by tests.
  const root = findContentRepoRoot();
  return findPapers(root).length > 0 ? root : undefined;
})();

/** True when a content repo (folio) is attached and content assertions can run. */
export function hasFolio(): boolean {
  return FOLIO_ROOT !== undefined;
}

/**
 * Root Lake workspace directory.  `lake build` at this directory
 * builds every paper package registered in the root `lakefile.toml`.
 * Per-paper Lake roots are under `content/<paper>/lean/`; see
 * `schemas/lean-packages.ts` for the authoritative map.
 *
 * Lives in the FOLIO, not the platform. Empty string when none is attached —
 * guard with `hasFolio()` before using.
 */
export const LEAN_DIR = FOLIO_ROOT ?? "";
/** Legacy alias: default paper's Lake directory (QOU). */
export const QOU_LEAN_DIR = join(
  FOLIO_ROOT ?? REPO_ROOT,
  "content/quantum-observable-universe/lean",
);
export const CHAPTERS_DIR = join(REPO_ROOT, "chapters");
export const SCHEMAS_DIR = join(REPO_ROOT, "schemas");

// ── Lean project discovery ──────────────────────────────────────

/** Names that are dependencies, not user projects. */
const DEPENDENCY_NAMES = new Set([
  "mathlib", "quantumInfo", "doc-gen4", "checkdecls", "qou", "ugb", "fred2005",
]);

/**
 * Discover Lean library projects by scanning every `lakefile.toml` in
 * the repo-root workspace and its registered paper packages.  Returns
 * library names like `["QOU", "UGB", "Fred2005"]`.
 */
export function discoverLeanProjects(): string[] {
  // Anchored at the FOLIO, and derived from LEAN_PACKAGES rather than a
  // hand-listed set of paper paths: the old list was three hardcoded
  // `REPO_ROOT + content/<paper>/lean` strings, so it pointed into the
  // platform (where no paper exists) AND silently missed any paper added
  // to the registry afterwards.
  const root = FOLIO_ROOT ?? REPO_ROOT;
  const lakefiles = [
    join(LEAN_DIR, "lakefile.toml"),
    ...LEAN_PACKAGES.map((p) => join(root, p.lakeRoot, "lakefile.toml")),
  ];
  const names = new Set<string>();

  for (const lakefile of lakefiles) {
    if (!existsSync(lakefile)) continue;
    const content = readFileSync(lakefile, "utf-8");
    const libPattern = /\[\[lean_lib\]\]\s*\n\s*name\s*=\s*"([^"]+)"/g;
    let match;
    while ((match = libPattern.exec(content)) !== null) {
      const name = match[1];
      if (!DEPENDENCY_NAMES.has(name)) names.add(name);
    }
  }
  return Array.from(names);
}

/**
 * Discover required dependencies from the root `lakefile.toml`.
 * Includes mathlib and every per-paper `[[require]]` stanza.
 */
export function discoverDependencies(): string[] {
  const lakefile = join(LEAN_DIR, "lakefile.toml");
  if (!existsSync(lakefile)) return [];

  const content = readFileSync(lakefile, "utf-8");
  const deps: string[] = [];
  const reqPattern = /\[\[require\]\]\s*\n\s*name\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = reqPattern.exec(content)) !== null) {
    deps.push(match[1]);
  }
  return deps;
}

// ── File scanning ───────────────────────────────────────────────

/** Recursively find all .lean files in a directory, excluding .lake/. */
export function findLeanFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const glob = new Bun.Glob("**/*.lean");
  return Array.from(glob.scanSync({ cwd: dir, absolute: true }))
    .filter((f) => !f.includes("/.lake/") && !f.includes("/build/"))
    .sort();
}

/** Find all .tex files in chapters/. */
export function findChapterFiles(): string[] {
  if (!existsSync(CHAPTERS_DIR)) return [];
  return readdirSync(CHAPTERS_DIR)
    .filter((f) => f.endsWith(".tex"))
    .map((f) => join(CHAPTERS_DIR, f))
    .sort();
}

// ── LaTeX parsing (AST-based via unified-latex) ─────────────────

import { parse } from "@unified-latex/unified-latex-util-parse";
import { attachMacroArgs } from "@unified-latex/unified-latex-util-arguments";
import type {
  Ast as LatexAstUnion, Environment, Macro,
} from "@unified-latex/unified-latex-types";

/** One node of the unified-latex AST — `Ast` also admits an array; the
 *  walkers below take the element type. Same alias as `render-latex.ts`. */
type LatexNode = Exclude<LatexAstUnion, unknown[]>;

/** Child nodes, when this node's `content` is an array.
 *
 *  On `macro`, `string`, `comment` and `verb`, `content` is a plain STRING
 *  (for a macro, its name) rather than children — which is exactly the
 *  distinction the recursive walkers here depend on, and exactly what `any`
 *  stopped the compiler from enforcing. */
function latexChildren(node: LatexNode): LatexNode[] {
  const c = (node as { content?: unknown }).content;
  return Array.isArray(c) ? (c as LatexNode[]) : [];
}

export interface LatexEnvironment {
  envType: string;
  label: string;
  leanDecl?: string;
  hasLeanok: boolean;
  hasNotready: boolean;
  file: string;
  line: number;
}

const ENV_TYPES = new Set([
  "theorem", "lemma", "proposition", "corollary",
  "definition", "example", "remark", "conjecture",
]);

/** Custom macro signatures so the parser attaches arguments correctly. */
const MACRO_SIGNATURES = {
  lean: { signature: "m" },
  uses: { signature: "m" },
  proves: { signature: "m" },
};

/** Extract text content from a unified-latex AST node's arguments. */
function argText(node: Macro, argIndex = 0): string | undefined {
  const args = node.args;
  if (!args) return undefined;
  // Find the first arg with openMark "{" (mandatory arg)
  const mandatoryArgs = args.filter((a) => a.openMark === "{");
  const arg = mandatoryArgs[argIndex];
  if (!arg?.content?.length) return undefined;
  // `content` on the leaves here is the string payload of a `string`/`macro`
  // node; anything else contributes nothing, as before.
  return arg.content
    .map((c) => (typeof (c as { content?: unknown }).content === "string"
      ? (c as { content: string }).content : ""))
    .join("");
}

/** Recursively check if an AST node array contains a macro with given name. */
function hasMacro(nodes: LatexNode[], name: string): boolean {
  for (const n of nodes) {
    if (n.type === "macro" && n.content === name) return true;
    if (hasMacro(latexChildren(n), name)) return true;
  }
  return false;
}

/** Find a macro node by name in an AST node array. */
function findMacro(nodes: LatexNode[], name: string): Macro | undefined {
  for (const n of nodes) {
    if (n.type === "macro" && n.content === name) return n;
    const found = findMacro(latexChildren(n), name);
    if (found) return found;
  }
  return undefined;
}

/**
 * Extract theorem-like environments from a .tex file using AST parsing.
 * Returns structured data about each environment's formalization status.
 */
export function extractEnvironments(texFile: string): LatexEnvironment[] {
  const content = readFileSync(texFile, "utf-8");
  const ast = parse(content);
  attachMacroArgs(ast, MACRO_SIGNATURES);

  const envs: LatexEnvironment[] = [];

  // Walk AST for environment nodes
  function walkForEnvs(nodes: LatexNode[]) {
    for (const node of nodes) {
      if (node.type === "environment" && ENV_TYPES.has((node as Environment).env)) {
        const body = latexChildren(node);

        // Find \label
        const labelNode = findMacro(body, "label");
        if (!labelNode) continue;
        const label = argText(labelNode);
        if (!label) continue;

        // Find \lean
        const leanNode = findMacro(body, "lean");
        const leanDecl = leanNode ? argText(leanNode) : undefined;

        // Line number from position (1-indexed)
        const line = node.position?.start?.line ?? 0;

        envs.push({
          envType: node.env,
          label,
          leanDecl,
          hasLeanok: hasMacro(body, "leanok"),
          hasNotready: hasMacro(body, "notready"),
          file: relative(REPO_ROOT, texFile),
          line,
        });
      }

      // Recurse into content
      walkForEnvs(latexChildren(node));
    }
  }

  walkForEnvs(ast.content);
  return envs;
}

// ── Git helpers ─────────────────────────────────────────────────

export function getCommitSha(): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}
