/**
 * Read a Knowledge Graph Declaration with nothing but bootstrap's own shape.
 *
 * @module bootstrap-tools/schemas/declaration
 *
 * ## Why this exists instead of cat-harness's reader
 *
 * bootstrap-tools needed three things from `cat-harness/schemas/cat-harness.ts`
 * — find a directory's declaration, parse it, list the instances in a
 * checkout — and importing them pulled in that module and seven more: 9,299 of
 * the 11,577 lines the bootstrap code reached (measured 2026-09-29). A -tools
 * package for bootstrap may depend on bootstrap and nothing above it (owner,
 * 2026-09-29: the Zod moves down, and bootstrap-tools depends on `zod` alone).
 *
 * The rule is the same one cat-harness applies, so the two cannot disagree
 * about which file is a declaration: **a directory's declaration is the
 * `<stem>.json` whose own `name` equals `<stem>`.** Nothing is inferred from
 * the directory's name. The shape is bootstrap's `KnowledgeGraphDeclarationSchema`,
 * which passes every other field through — a harness's fields are Extensions.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import type { z } from "zod";

import { KnowledgeGraphDeclarationSchema } from "./graph.ts";

export type KnowledgeGraphDeclaration = z.infer<typeof KnowledgeGraphDeclarationSchema>;

/** The declaration file in `dir`, or `undefined` when there is none. Throws on two. */
export function declarationFileIn(dir: string): string | undefined {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return undefined;
  }
  const found = entries.filter((entry) => {
    if (!entry.endsWith(".json") || entry === ".json") return false;
    try {
      return (JSON.parse(readFileSync(join(dir, entry), "utf-8")) as { name?: unknown }).name === entry.slice(0, -5);
    } catch {
      return false;
    }
  });
  if (found.length > 1) {
    throw new Error(`${resolve(dir)} carries ${found.length} declarations (${found.sort().join(", ")}); a directory is one Knowledge Graph.`);
  }
  return found[0] ? join(dir, found[0]) : undefined;
}

/** Parse `dir`'s declaration with bootstrap's shape, or `undefined` when there is none. Throws when it does not parse. */
export function readKnowledgeGraphDeclaration(dir: string): KnowledgeGraphDeclaration | undefined {
  const file = declarationFileIn(dir);
  if (!file) return undefined;
  const r = KnowledgeGraphDeclarationSchema.safeParse(JSON.parse(readFileSync(file, "utf-8")));
  if (!r.success) throw new Error(`${file} is not a Knowledge Graph declaration: ${r.error.message}`);
  return r.data;
}

/**
 * Every Knowledge Graph in a checkout: its root, if it declares one, and each
 * directory directly under it that does. One level, because that is where an
 * instance's declaration sits; a nested instance is its own checkout's to list.
 */
export function knowledgeGraphsIn(repoRoot: string): { root: string; decl: KnowledgeGraphDeclaration }[] {
  const out: { root: string; decl: KnowledgeGraphDeclaration }[] = [];
  const add = (dir: string) => {
    const decl = readKnowledgeGraphDeclaration(dir);
    if (decl) out.push({ root: resolve(dir), decl });
  };
  add(repoRoot);
  for (const entry of readdirSync(repoRoot).sort()) {
    const dir = join(repoRoot, entry);
    if (entry.startsWith(".") || entry === "node_modules" || !existsSync(dir) || !statSync(dir).isDirectory()) continue;
    add(dir);
  }
  return out;
}
