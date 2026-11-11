/**
 * Where a layer's opt-in sub-graphs are on disk.
 *
 * @module schemas/kg/opt-in-roots
 * @graphNode none — a reader over declared opt-in sub-graphs; it defines no schema
 *
 * Every opt-in sub-graph a layer declares (`optIn: true`, top level or from
 * within), whether or not it is switched on, with its qualified id. A page
 * that is always mounted must not link into one (`check:optin-links`), and a
 * generated list names what is inside one without linking it (`readme:sync`).
 * Rule and reader live in `opt-in-subgraphs.ts`; this module only locates.
 */
import { sep } from "node:path";

import { readDeclaration, resolveDirectories } from "./cat-harness.js";
import { qualifiedSubgraphId } from "./opt-in-subgraphs.js";

/** One opt-in sub-graph: its qualified id and absolute path (no trailing separator). */
export interface OptInRoot {
  id: string;
  abs: string;
}

/** Every opt-in sub-graph `root` declares, top level or from within, switched on or not. */
export function optInRootsOf(root: string): OptInRoot[] {
  const decl = readDeclaration(root);
  if (decl === undefined) return [];
  return resolveDirectories([{ name: decl.name, root, own: true }], undefined, { enabledSubgraphs: "all" })
    .filter((d) => d.own && (d as { optIn?: boolean }).optIn === true)
    .map((d) => ({ id: qualifiedSubgraphId(decl.name, d.id), abs: d.absPath.replace(/[\\/]+$/, "") }));
}

/** The innermost opt-in sub-graph holding `abs`, if any. */
export function groupOf(abs: string, roots: readonly OptInRoot[]): OptInRoot | undefined {
  let best: OptInRoot | undefined;
  for (const r of roots) {
    if ((abs === r.abs || abs.startsWith(r.abs + sep)) && (best === undefined || r.abs.length > best.abs.length)) best = r;
  }
  return best;
}
