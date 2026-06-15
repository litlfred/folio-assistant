/**
 * Shared test helpers — repo paths, Lean project discovery, file scanning.
 *
 * All tests import from here so paths are consistent and
 * project discovery works for QOU, Fred2005, Unital, or any future project.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join, relative, resolve } from "path";
import { execSync } from "child_process";

// ── Paths ───────────────────────────────────────────────────────

export const REPO_ROOT = resolve(import.meta.dir, "../..");
/**
 * Root Lake workspace directory.  `lake build` at this directory
 * builds every paper package registered in the root `lakefile.toml`.
 * Per-paper Lake roots are under `content/<paper>/lean/`; see
 * `folio-assistant/schemas/lean-packages.ts` for the authoritative map.
 */
export const LEAN_DIR = REPO_ROOT;
/** Legacy alias: default paper's Lake directory (QOU). */
export const QOU_LEAN_DIR = join(REPO_ROOT, "content/quantum-observable-universe/lean");
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
  const lakefiles = [
    join(LEAN_DIR, "lakefile.toml"),
    join(REPO_ROOT, "content/quantum-observable-universe/lean/lakefile.toml"),
    join(REPO_ROOT, "content/unital-groebner-bases/lean/lakefile.toml"),
    join(REPO_ROOT, "content/fred2005-formal-groups/lean/lakefile.toml"),
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
function argText(node: any, argIndex = 0): string | undefined {
  const args = node.args;
  if (!args) return undefined;
  // Find the first arg with openMark "{" (mandatory arg)
  const mandatoryArgs = args.filter((a: any) => a.openMark === "{");
  const arg = mandatoryArgs[argIndex];
  if (!arg?.content?.length) return undefined;
  return arg.content.map((c: any) => c.content ?? "").join("");
}

/** Recursively check if an AST node array contains a macro with given name. */
function hasMacro(nodes: any[], name: string): boolean {
  for (const n of nodes) {
    if (n.type === "macro" && n.content === name) return true;
    if (n.content && Array.isArray(n.content) && hasMacro(n.content, name)) return true;
  }
  return false;
}

/** Find a macro node by name in an AST node array. */
function findMacro(nodes: any[], name: string): any | undefined {
  for (const n of nodes) {
    if (n.type === "macro" && n.content === name) return n;
    if (n.content && Array.isArray(n.content)) {
      const found = findMacro(n.content, name);
      if (found) return found;
    }
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
  function walkForEnvs(nodes: any[]) {
    for (const node of nodes) {
      if (node.type === "environment" && ENV_TYPES.has(node.env)) {
        const body = node.content || [];

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
      if (node.content && Array.isArray(node.content)) {
        walkForEnvs(node.content);
      }
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
