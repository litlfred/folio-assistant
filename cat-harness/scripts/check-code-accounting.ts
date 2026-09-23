#!/usr/bin/env bun
/**
 * check-code-accounting.ts — the two questions about a code file, kept APART.
 *
 * Bean `ylj7`'s last gate, and its wording is the whole specification: *"a QA
 * axis reports the two questions SEPARATELY, never as one number."*
 *
 * | | question | kind of property | who owns it |
 * |---|---|---|---|
 * | **1** | is this file in a directory some instance DECLARES? | filesystem | `ylj7` |
 * | **2** | is it reachable from a Tool node, and so from a process step? | graph | `d308`, `ce65` |
 *
 * ## Why one number would be a lie
 *
 * They fail independently and they are fixed by different work. A file can sit
 * in a perfectly declared directory and be reachable from nothing — declared
 * and inert. Another can be reachable from a Tool while sitting in a directory
 * no instance names, so no consumer that walks declarations will ever see it.
 * A single "coverage" percentage averages those two into a number that is true
 * of neither, and — this is the part that costs — a rise in one can HIDE a
 * fall in the other. `ylj7` was written because question 2 was being asked
 * over 15 % of the code while a clean run was reported over the rest.
 *
 * ## Question 1 has two readings, and the difference is not pedantry
 *
 * *In a directory declared as `code`* is narrower than *in any declared
 * directory*. `cat-harness/schemas/` holds 142 `.ts` and is declared — as
 * `schemas`, which is correct: those are schema modules, and adding `code` to
 * that entry would give one directory two kinds for no gain. So the question
 * that matters is **accounted for**, and `code` is one of several kinds that
 * account for a file.
 *
 * Both are printed. Round 1's number was the wide reading and round 2's the
 * narrow one, and comparing them across rounds as though they were one metric
 * would have read a 73 → 59 REGRESSION out of an improvement.
 *
 * ## Question 2 is a CLOSURE, not a count of entry points
 *
 * A Tool binds an entry point; everything that entry point imports rides
 * along. Counting the ~40 entry points and calling it coverage would report
 * about 3 % on a corpus where most modules are genuinely reachable. So the
 * closure is walked — `import`/`export … from` over relative specifiers — and
 * the entry-point count is printed BESIDE it rather than instead of it.
 *
 * The closure is a floor, not a ceiling: it follows static relative imports
 * only. A module reached by a bare specifier, a dynamic `import()` or a path
 * built at runtime is not followed and so is counted unreachable. That is the
 * safe direction — it under-claims coverage rather than over-claiming it —
 * and it is stated here rather than left for a reader to discover in a number.
 *
 * ADVISORY. It reports; it does not fail. Both questions have open beans, and
 * a gate that fails on a backlog is a gate somebody switches off.
 *
 * @module scripts/check-code-accounting
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import {
  directoriesForGraph,
  instanceRootFor,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
} from "../schemas/cat-harness.js";

/** Every `.ts` under `root`, excluding `node_modules` and dot directories. */
export function typescriptFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return; // unreadable is not this script's finding to raise
    }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const f = join(dir, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith(".ts")) out.push(f);
    }
  };
  walk(root);
  return out;
}

export interface DeclaredDirs {
  /** Absolute paths of every declared directory, whatever its kind. */
  any: string[];
  /** ...and the subset whose `graphKinds` include `code`. */
  code: string[];
}

export function declaredDirectories(repoRoot: string): DeclaredDirs {
  const any: string[] = [];
  const code: string[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    let decl;
    try {
      decl = readDeclaration(root);
    } catch {
      continue; // `check:declaration-filename` is what reports an unreadable one
    }
    for (const e of decl?.directories ?? []) {
      const abs = resolve(root, e.path);
      any.push(abs);
      if ((e.graphKinds ?? []).includes("code")) code.push(abs);
    }
  }
  return { any, code };
}

const under = (file: string, dirs: readonly string[]): boolean =>
  dirs.some((d) => file.startsWith(`${d}/`));

/**
 * Every `.ts` entry point a Tool node names, resolved through `package.json`.
 *
 * A Tool's `invoke.shell` is usually `bun run <script-name>`, and the script
 * resolves to a path — sometimes through another script. Following that chain
 * is what makes the count about CODE rather than about how a command happened
 * to be spelled; stopping at the script name would report the 20-odd tools
 * that name a path and miss the rest.
 */
export function toolEntryPoints(repoRoot: string): { shells: number; entries: string[] } {
  const pkgPath = join(repoRoot, "package.json");
  const scripts = existsSync(pkgPath)
    ? ((JSON.parse(readFileSync(pkgPath, "utf8")) as { scripts?: Record<string, string> }).scripts ?? {})
    : {};

  const shells: string[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    // ASKED OF THE DECLARATION, not composed. An instance says where its
    // `tools` graph lives, and `join(root, "tools")` would be this script
    // deciding that a second time — the literal `check:declared-paths`
    // refuses, and rightly: an instance that declared its tools elsewhere
    // would be silently skipped by a hardcoded path while this reported a
    // clean sweep over it.
    for (const dir of directoriesForGraph(root, "tools")) {
      const f = join(dir, "index.ts");
      if (!existsSync(f)) continue;
      for (const m of readFileSync(f, "utf8").matchAll(/shell:\s*"([^"]+)"/g)) shells.push(m[1]!);
    }
  }

  const entries = new Set<string>();
  const follow = (cmd: string, depth: number): void => {
    // A chain longer than this is a script calling itself, which is a defect
    // for another check; here it must simply terminate.
    if (depth > 6) return;
    for (const m of cmd.matchAll(/(?:^|&&|\|\||;)\s*bun run ([^\s&|;]+)/g)) {
      const token = m[1]!;
      if (token.endsWith(".ts")) entries.add(token);
      else if (scripts[token]) follow(scripts[token], depth + 1);
    }
  };
  for (const s of shells) follow(s, 0);
  return { shells: shells.length, entries: [...entries].sort() };
}

/**
 * Everything reachable from `entries` by static RELATIVE imports.
 *
 * A floor. See the module header: a bare specifier, a dynamic `import()` or a
 * runtime-built path is not followed, so a module reached only that way counts
 * as unreachable. Under-claiming is the safe direction for a coverage number.
 */
export function reachableFrom(repoRoot: string, entries: readonly string[]): Set<string> {
  const seen = new Set<string>();
  const resolveSpec = (fromFile: string, spec: string): string | undefined => {
    if (!spec.startsWith(".")) return undefined;
    const base = resolve(dirname(fromFile), spec).replace(/\.js$/, "");
    for (const cand of [`${base}.ts`, join(base, "index.ts"), base]) {
      if (cand.endsWith(".ts") && existsSync(cand)) return cand;
    }
    return undefined;
  };
  const stack = entries.map((e) => resolve(repoRoot, e)).filter((f) => existsSync(f));
  while (stack.length > 0) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    let src;
    try {
      src = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const m of src.matchAll(/(?:^|\n)\s*(?:import|export)[^'"\n]*from\s*['"]([^'"]+)['"]/g)) {
      const next = resolveSpec(file, m[1]!);
      if (next !== undefined && !seen.has(next)) stack.push(next);
    }
  }
  return seen;
}

export interface Accounting {
  total: number;
  /** Q1, wide reading: in any declared directory. */
  declaredAny: number;
  /** Q1, narrow reading: in a directory declared `code`. */
  declaredCode: number;
  /** Q1 residue, grouped by the first two path segments. */
  unaccounted: { where: string; files: number }[];
  /** Q2. */
  toolShells: number;
  toolEntries: number;
  reachable: number;
}

export function audit(repoRoot: string): Accounting {
  const files = typescriptFiles(repoRoot);
  const dirs = declaredDirectories(repoRoot);
  const { shells, entries } = toolEntryPoints(repoRoot);
  const reach = reachableFrom(repoRoot, entries);

  const outside = files.filter((f) => !under(f, dirs.any));
  const grouped = new Map<string, number>();
  for (const f of outside) {
    const key = relative(repoRoot, f).split("/").slice(0, 2).join("/");
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  return {
    total: files.length,
    declaredAny: files.filter((f) => under(f, dirs.any)).length,
    declaredCode: files.filter((f) => under(f, dirs.code)).length,
    unaccounted: [...grouped.entries()]
      .map(([where, n]) => ({ where, files: n }))
      .sort((a, b) => b.files - a.files),
    toolShells: shells,
    toolEntries: entries.length,
    reachable: files.filter((f) => reach.has(f)).length,
  };
}

const pct = (n: number, of: number): string => (of === 0 ? "n/a" : `${Math.round((n / of) * 100)}%`);

export function formatReport(a: Accounting): string {
  const out: string[] = [
    `Code accounting — ${a.total} .ts file(s). TWO questions, reported apart (bean \`ylj7\`).`,
    "",
    "  1. DECLARED — is the file in a directory some instance declares?",
    `       ${String(a.declaredAny).padStart(5)} in any declared directory   ${pct(a.declaredAny, a.total)}`,
    `       ${String(a.declaredCode).padStart(5)} in one declared \`code\`      ${pct(a.declaredCode, a.total)}`,
    `       ${String(a.total - a.declaredAny).padStart(5)} accounted for by nothing`,
  ];
  for (const g of a.unaccounted) out.push(`             ${String(g.files).padStart(4)}  ${g.where}`);
  out.push(
    "",
    "  2. REACHABLE — can a Tool node get to it, and so a process step?",
    `       ${String(a.toolShells).padStart(5)} Tool node(s) naming a command`,
    `       ${String(a.toolEntries).padStart(5)} distinct .ts entry point(s) they resolve to`,
    `       ${String(a.reachable).padStart(5)} file(s) reachable from one        ${pct(a.reachable, a.total)}`,
    "",
    "The two are NOT averaged, and must not be. They fail independently, they are",
    "fixed by different work, and a rise in one can hide a fall in the other —",
    "which is the defect `ylj7` was opened for.",
    "",
    "Question 2's figure is a FLOOR: the walk follows static relative imports only,",
    "so a module reached by a bare specifier, a dynamic import or a runtime path",
    "counts as unreachable. It under-claims rather than over-claims.",
  );
  return out.join("\n");
}

if (import.meta.main) {
  const repoRoot = resolve(repoRootFor(instanceRootFor(import.meta.dir)));
  const a = audit(repoRoot);
  console.log(process.argv.includes("--json") ? JSON.stringify(a, null, 2) : formatReport(a));
  // ADVISORY — see the module header. Both questions have open beans.
  process.exit(0);
}
