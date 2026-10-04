/**
 * The files of every declared directory of one graph kind, across the
 * instances of a checkout: the one scan behind each node graph a harness
 * declares instead of a central table (`kinds/`, bean dmx1; `validators/`,
 * bean riit). Reads each declaration RAW (`directories[].graphKinds`, `path`,
 * `scope`) because the declaration's Zod schema lives in `cat-harness.ts`,
 * which imports the registry that calls this. A LEAF: filesystem and
 * `instance-roots.ts` only.
 *
 * @module cat-harness/schemas/declared-nodes
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { findDeclarationFile, instanceRootsIn } from "./instance-roots";

/** Every directory declared with `graphKind`, across the instances of a checkout (absolute paths, declaration order). */
export function declaredDirectories(repoRoot: string, graphKind: string): string[] {
  const out: string[] = [];
  for (const root of instanceRootsIn(repoRoot)) {
    const declFile = findDeclarationFile(root);
    if (declFile === undefined) continue;
    let decl: { directories?: { path?: string; scope?: string; graphKinds?: string[] }[] };
    try {
      decl = JSON.parse(readFileSync(join(root, declFile), "utf-8")) as typeof decl;
    } catch {
      continue; // an unreadable declaration is `readDeclaration`'s finding, with its own message
    }
    for (const d of decl.directories ?? []) {
      if (!d.path || !(d.graphKinds ?? []).includes(graphKind)) continue;
      out.push(join(d.scope === "repository" ? resolve(repoRoot) : root, d.path));
    }
  }
  return out;
}

/** `{ file, raw }` for every `*.json` in every directory declared with `graphKind`, files sorted. */
export function declaredNodeFiles(repoRoot: string, graphKind: string): { file: string; raw: unknown }[] {
  const out: { file: string; raw: unknown }[] = [];
  for (const dir of declaredDirectories(repoRoot, graphKind)) {
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    } catch {
      continue; // a declared-but-absent directory is `check:declared-dirs`'s finding
    }
    for (const f of files) {
      const file = join(dir, f);
      out.push({ file, raw: JSON.parse(readFileSync(file, "utf-8")) });
    }
  }
  return out;
}
