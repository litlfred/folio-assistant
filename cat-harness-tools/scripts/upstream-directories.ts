/**
 * THE DIRECTORIES AN UPSTREAM LAYER DECLARES AT A PIN — its own entries and
 * the ones it declares FROM WITHIN them — read from a {@link RemoteTree}
 * without checking the layer out.
 *
 * @module scripts/upstream-directories
 * @graphNode none — a library: it reads declarations at a pin and judges nothing
 *
 * A remote mount (and anything else naming a subgraph of a layer it has
 * not got) needs the id → path map of the layer AT THE PIN. The top-level
 * `directories` of `<name>.json` are only half of it: an entry declared from
 * within (`skills/skills.json` naming `voices/`; `"subgraph": true`) is a
 * layer directory too, so a reader of only the top-level list would refuse
 * a nested id as "not declared".
 *
 * It does not walk the nesting itself. It checks out the declaration files
 * only — `<name>.json` and every file a known kind names as its
 * `declarationFile` — in one sparse checkout, and hands that skeleton to
 * cat-harness's `instanceDirectories`, so the remote answer and the on-disk
 * answer come from one resolver.
 *
 * What it cannot see, it says: a declaration this checkout's schema or kind
 * registry cannot read (a kind contributed by a layer not mounted here yet)
 * is `{ ok: false, detail }`, never an empty list read as "declares nothing
 * from within".
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { defaultGraphTypologies, instanceDirectories, type GraphTypologyRegistry } from "../schemas/kg/cat-harness.js";
import type { RemoteTree } from "./remote-tree.ts";
import { groupsOfDeclaration } from "./concern-groups.ts";

/** One directory as a planner needs it: the id, its instance-relative path, and the fields that say it is not where its path says. */
export interface UpstreamDirectory {
  id: string;
  path: string;
  source?: unknown;
  storage?: unknown;
  /** The id of the directory that declared this one from within; absent for an entry of `<name>.json`. */
  within?: string;
  /** An opt-in sub-graph (`opt-in-subgraphs.ts`): off for a downstream that has not enabled it. */
  optIn?: boolean;
}

export type UpstreamDirectories = { ok: true; directories: UpstreamDirectory[] } | { ok: false; detail: string };

/** Every file name a known kind declares its nested entries in (`skills.json`, `docs.json`, `graph.json`, …). */
export function declarationFileNames(registry: GraphTypologyRegistry = defaultGraphTypologies): string[] {
  const names = new Set<string>();
  for (const k of registry.names()) {
    const f = registry.get(k)?.declarationFile;
    if (f) names.add(f);
  }
  return [...names].sort();
}

/**
 * The directories layer `root` (repository-relative, `""` for the root)
 * declares at the tree's pin, `<name>.json`'s own first, then those declared
 * from within, each with an instance-relative `path`.
 *
 * Side effect, stated: it sets the tree's sparse checkout to the declaration
 * files. A later {@link RemoteTree.checkout} replaces that set, so a mount that
 * checks out afterwards gets exactly the paths it asks for.
 */
export function upstreamDirectories(
  tree: RemoteTree,
  root: string,
  declarationFile: string,
  registry: GraphTypologyRegistry = defaultGraphTypologies,
): UpstreamDirectories {
  const at = root.replace(/\/+$/, "");
  const under = at ? `${at}/` : "";
  let work: string;
  try {
    work = tree.checkout([declarationFile, ...declarationFileNames(registry).map((f) => `${under}**/${f}`)]);
  } catch (e) {
    return { ok: false, detail: `could not check the declaration files out at ${tree.sha.slice(0, 12)}: ${(e as Error).message}` };
  }
  try {
    return {
      ok: true,
      directories: instanceDirectories(join(work, at), undefined, registry).map((d) => ({
        id: d.id,
        path: d.path,
        ...(d.source !== undefined ? { source: d.source } : {}),
        ...(d.storage !== undefined ? { storage: d.storage } : {}),
        ...(d.within !== undefined ? { within: d.within } : {}),
        ...((d as { optIn?: unknown }).optIn === true ? { optIn: true } : {}),
      })),
    };
  } catch (e) {
    return { ok: false, detail: `its declaration at ${tree.sha.slice(0, 12)} could not be resolved here: ${(e as Error).message}` };
  }
}

/**
 * A CONCERN NAME at a pin (bean `mo75`): the kind-first members of concern
 * group `code` — `processes/sdlc/`, `skills/sdlc/`, `schemas/sdlc/` … — that
 * layer `root` declares. Each top-level directory whose kind groups by
 * concern is read through its own declaration file (`processes.json`
 * `groups`, `skills.json` `topics`); a group it names `code` is one member,
 * with the id `<directory id>/<code>`. `[]` when no directory names the code.
 * Like {@link upstreamDirectories}, it sets the sparse checkout to the
 * declaration files.
 */
export function upstreamConcernMembers(
  tree: RemoteTree,
  root: string,
  declarationFile: string,
  top: ReadonlyArray<{ id: string; path: string; graphTypologies?: unknown }>,
  code: string,
  registry: GraphTypologyRegistry = defaultGraphTypologies,
): UpstreamDirectories {
  const at = root.replace(/\/+$/, "");
  const under = at ? `${at}/` : "";
  let work: string;
  try {
    work = tree.checkout([declarationFile, ...declarationFileNames(registry).map((f) => `${under}**/${f}`)]);
  } catch (e) {
    return { ok: false, detail: `could not check the declaration files out at ${tree.sha.slice(0, 12)}: ${(e as Error).message}` };
  }
  const out: UpstreamDirectory[] = [];
  for (const d of top) {
    const kinds = Array.isArray(d.graphTypologies) ? d.graphTypologies.filter((k): k is string => typeof k === "string") : [];
    for (const kind of kinds) {
      const def = registry.get(kind);
      if (def?.concernGroups !== true || def.declarationFile === undefined) continue;
      const file = join(work, at, d.path, def.declarationFile);
      if (!existsSync(file)) continue;
      try {
        for (const g of groupsOfDeclaration(JSON.parse(readFileSync(file, "utf-8")), kind, file)) {
          if (g.code !== code) continue;
          const path = `${d.path.replace(/\/+$/, "")}/${g.path.replace(/\/+$/, "")}/`;
          if (!out.some((o) => o.path === path)) out.push({ id: `${d.id}/${code}`, path, within: d.id });
        }
      } catch (e) {
        return { ok: false, detail: `${d.path}${def.declarationFile} at ${tree.sha.slice(0, 12)} could not be read: ${(e as Error).message}` };
      }
    }
  }
  return { ok: true, directories: out };
}
