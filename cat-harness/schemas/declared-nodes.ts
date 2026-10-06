/**
 * The files of every declared directory of one graph typology, across the
 * instances of a checkout: the one scan behind each node graph a harness
 * declares instead of a central table (`typologies/`, bean dmx1; `validators/`,
 * bean riit). Reads each declaration RAW (`directories[].graphTypologies`, `path`,
 * `scope`) because the declaration's Zod schema lives in `cat-harness.ts`,
 * which imports the registry that calls this. A LEAF: filesystem and
 * `instance-roots.ts` only.
 *
 * @module cat-harness/schemas/declared-nodes
 * @graphNode none — a function library over the declared directories; it defines no schema
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { findDeclarationFile, instanceRootsIn } from "./instance-roots";

/**
 * A TEST FIXTURE checkout scanned beside the real one: `FOLIO_FIXTURE_CHECKOUT`.
 *
 * Set by `test-preload.ts` only when the checkout under test holds no
 * vocabulary — cat-harness standing alone, as `check:cat-harness-standalone`
 * runs it — and never in the monorepo, where the real instances are present.
 * It points at `test/fixtures/standalone-checkout/`, copies of the node graphs
 * cat-harness's tests read from core and sci, held equal to them by
 * `standalone-fixture.test.ts`. Owner, 2026-10-05: fixture the tests rather
 * than grow the standalone baseline.
 */
const FIXTURE_ENV = "FOLIO_FIXTURE_CHECKOUT";

/** Every directory declared with `graphTypology`, across the instances of a checkout (absolute paths, declaration order). */
export function declaredDirectories(repoRoot: string, graphTypology: string): string[] {
  // input-site: env-unset FOLIO_FIXTURE_CHECKOUT #d3ac43d3 — a test-only override naming a checkout OUTSIDE the tree
  const fixture = process.env[FIXTURE_ENV];
  const roots = [...instanceRootsIn(repoRoot), ...(fixture ? instanceRootsIn(fixture) : [])];
  return roots.flatMap((root) => ownDeclaredDirectories(root, graphTypology, repoRoot));
}

/** The directories ONE instance declares with `graphTypology` (absolute paths). `repository`-scoped paths resolve against `repoRoot`. */
export function ownDeclaredDirectories(root: string, graphTypology: string, repoRoot: string = root): string[] {
  const declFile = findDeclarationFile(root);
  if (declFile === undefined) return [];
  let decl: { directories?: { path?: string; scope?: string; graphTypologies?: string[] }[] };
  try {
    decl = JSON.parse(readFileSync(join(root, declFile), "utf-8")) as typeof decl;
  } catch {
    return []; // an unreadable declaration is `readDeclaration`'s finding, with its own message
  }
  return (decl.directories ?? [])
    .filter((d) => d.path && (d.graphTypologies ?? []).includes(graphTypology))
    .map((d) => join(d.scope === "repository" ? resolve(repoRoot) : root, d.path!));
}

/** `{ file, raw }` for every `*.json` in every directory declared with `graphTypology`, files sorted. */
export function declaredNodeFiles(repoRoot: string, graphTypology: string): { file: string; raw: unknown }[] {
  const out: { file: string; raw: unknown }[] = [];
  for (const dir of declaredDirectories(repoRoot, graphTypology)) {
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
