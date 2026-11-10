/**
 * Opt-in named sub-graphs: which are switched on for a folio, and whether a
 * directory sits inside one that is switched off.
 *
 * @module schemas/kg/opt-in-subgraphs
 * @graphNode none — a reader and predicates over declared opt-in sub-graphs; it defines no schema
 *
 * ## The rule
 *
 * A directory entry marked `optIn: true` is an opt-in sub-graph (e.g.
 * cat-harness's `sdlc` and `work-plan`). It is off in EVERY layer — including
 * the one that declares it — unless that layer lists it, qualified
 * `<instance>.<directory id>`, in its own `enableSubgraphs`.
 *
 * **The folio root decides, and nothing is inherited.** A layer's list
 * enables the sub-graphs for ITSELF. So every reader asks
 * {@link enabledSubgraphs} of the root it is resolving FOR — the folio, the
 * downstream of a mount, the layer whose own resolution it is — never of
 * the layer that declared the sub-graph.
 *
 * **A development override.** `CAT_SUBGRAPHS` (`+cat-harness.sdlc,-x.y`)
 * adjusts the root's list, so a dev session in any checkout can turn one on
 * without editing a declaration. Unset in CI, and in every agent test context.
 *
 * **Switched off is invisible, not deleted.** A switched-off sub-graph — and
 * everything declared from within it, in any member layer — is left out
 * of what the agent is given: the resolved directories, the skill overlay,
 * the served Tool groups and a mount's default directory list. An explicit
 * mount override naming it still mounts it, and the harness's own machinery
 * may still use it.
 *
 * An `enableSubgraphs` id that names nothing opt-in is refused by
 * `check:declaration-resolution` ({@link enableSubgraphsProblems}), never
 * ignored.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { findDeclarationFile, INDEX_CONFIG_FILENAME } from "./instance-roots";

/** The development override: a comma list of `+<instance>.<id>` / `-<instance>.<id>`. */
export const SUBGRAPHS_ENV = "CAT_SUBGRAPHS";

/**
 * What is switched on: a set of qualified ids, or `"all"` for a reader that
 * enumerates what is DECLARED rather than what a folio is given (a structural
 * check, the declaration's own sub-graph list).
 */
export type EnabledSubgraphs = ReadonlySet<string> | "all";

/** `<instance>.<directory id>` — the one spelling of an opt-in sub-graph's name. */
export function qualifiedSubgraphId(instance: string, id: string): string {
  return `${instance}.${id}`;
}

/** The layer and directory id of a qualified id; `undefined` when it is not `<instance>.<id>`. */
export function splitQualifiedSubgraphId(q: string): { instance: string; id: string } | undefined {
  const dot = q.indexOf(".");
  if (dot <= 0 || dot === q.length - 1) return undefined;
  return { instance: q.slice(0, dot), id: q.slice(dot + 1) };
}

/** Whether `q` is switched on. */
export function isSubgraphEnabled(enabled: EnabledSubgraphs, q: string): boolean {
  return enabled === "all" || enabled.has(q);
}

/** One `CAT_SUBGRAPHS` value, parsed. A bare id counts as `+`. */
export function parseSubgraphsEnv(value: string | undefined): { add: string[]; remove: string[] } {
  const add: string[] = [];
  const remove: string[] = [];
  for (const raw of (value ?? "").split(",")) {
    const t = raw.trim();
    if (t === "") continue;
    if (t.startsWith("-")) remove.push(t.slice(1).trim());
    else add.push(t.startsWith("+") ? t.slice(1).trim() : t);
  }
  return { add, remove };
}

/**
 * The enable set from a root's declared list and the environment: the list,
 * then `+` ids added and `-` ids removed. Pure, for a caller that has already
 * read the declaration.
 */
export function enabledSubgraphsFrom(
  declared: readonly string[] | undefined,
  // input-site: env-unset CAT_SUBGRAPHS #949cc29c — a development override switching opt-in sub-graphs on or off; unset in CI
  env: Readonly<Record<string, string | undefined>> = process.env,
): Set<string> {
  const out = new Set(declared ?? []);
  const { add, remove } = parseSubgraphsEnv(env[SUBGRAPHS_ENV]);
  for (const a of add) out.add(a);
  for (const r of remove) out.delete(r);
  return out;
}

/**
 * The `enableSubgraphs` a root declares, read STRUCTURALLY — the one field,
 * not the whole declaration, so a reader that cannot parse a declaration in
 * full (a mount planner before the kinds it mounts exist) still gets the
 * answer. No declaration, or no field, is the empty list; an unreadable file
 * is the same, since the parse that fails is reported by the reader that
 * parses it.
 *
 * **An index root** declares no instance of its own, so its list is in its
 * `index.config.json` (`folio-index-config/v1`). That is where folio-assistant,
 * the checkout the owner named, switches `sdlc` and `work-plan` on
 * (cat-harness#991 step 23.4).
 */
export function declaredEnableSubgraphs(root: string): string[] {
  const file = findDeclarationFile(root) ?? (existsSync(join(root, INDEX_CONFIG_FILENAME)) ? INDEX_CONFIG_FILENAME : undefined);
  if (file === undefined) return [];
  try {
    const raw = JSON.parse(readFileSync(join(root, file), "utf-8")) as { enableSubgraphs?: unknown };
    return Array.isArray(raw.enableSubgraphs) ? raw.enableSubgraphs.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** The opt-in sub-graphs switched on for the folio at `folioRoot`: its own list, adjusted by `CAT_SUBGRAPHS`. */
export function enabledSubgraphs(
  folioRoot: string,
  // input-site: env-unset CAT_SUBGRAPHS #949cc29c — a development override switching opt-in sub-graphs on or off; unset in CI
  env: Readonly<Record<string, string | undefined>> = process.env,
): Set<string> {
  return enabledSubgraphsFrom(declaredEnableSubgraphs(folioRoot), env);
}

/** The fields of a directory entry this module reads. */
export interface OptInCarrier {
  id: string;
  optIn?: boolean;
  /** The layer whose declaration (or declaration file from within) wrote the entry. */
  declaredBy?: string;
  /** The id of the entry this one was declared from within. */
  within?: string;
  /** Set by `resolveDirectories`: the nearest enclosing opt-in sub-graph, qualified. */
  optInSubgraph?: string;
}

/** The qualified id of `dir` itself when it is an opt-in entry. */
export function ownOptInId(dir: OptInCarrier): string | undefined {
  return dir.optIn === true && dir.declaredBy !== undefined ? qualifiedSubgraphId(dir.declaredBy, dir.id) : undefined;
}

/**
 * Whether `dir` is inside a switched-off opt-in sub-graph: it, or any
 * ancestor through `within` (looked up by `parentOf`), is an opt-in entry
 * whose qualified id is not enabled. A resolved entry carrying
 * `optInSubgraph` is judged by that too.
 */
export function switchedOff(
  dir: OptInCarrier,
  enabled: EnabledSubgraphs,
  parentOf: (id: string) => OptInCarrier | undefined = () => undefined,
): boolean {
  if (dir.optInSubgraph !== undefined && !isSubgraphEnabled(enabled, dir.optInSubgraph)) return true;
  const seen = new Set<string>();
  for (let cur: OptInCarrier | undefined = dir; cur !== undefined && !seen.has(cur.id); cur = cur.within === undefined ? undefined : parentOf(cur.within)) {
    seen.add(cur.id);
    const q = ownOptInId(cur);
    if (q !== undefined && !isSubgraphEnabled(enabled, q)) return true;
  }
  return false;
}

/** One instance of a chain, as {@link enableSubgraphsProblems} needs it. */
export interface DeclaredOptIns {
  name: string;
  /** Every directory the layer declares — top level and from within — with its `optIn`. */
  directories: ReadonlyArray<{ id: string; optIn?: boolean }>;
}

/**
 * Why each `enableSubgraphs` id of `self` cannot be honoured: not
 * `<instance>.<id>`, names a layer outside `self` and its `needs`
 * closure (`closure`), names a directory that layer does not declare, or
 * one that is not `optIn`. Empty means every id names an opt-in sub-graph.
 */
export function enableSubgraphsProblems(
  self: string,
  ids: readonly string[],
  closure: readonly DeclaredOptIns[],
): Array<{ id: string; detail: string }> {
  const byName = new Map(closure.map((c) => [c.name, c]));
  const out: Array<{ id: string; detail: string }> = [];
  for (const q of ids) {
    const parts = splitQualifiedSubgraphId(q);
    if (parts === undefined) {
      out.push({ id: q, detail: "not a qualified sub-graph id: write `<instance>.<directory id>`, e.g. `cat-harness.sdlc`" });
      continue;
    }
    const inst = byName.get(parts.instance);
    if (inst === undefined) {
      out.push({ id: q, detail: `\`${parts.instance}\` is neither ${self} nor an instance in its \`needs\` closure` });
      continue;
    }
    const dir = inst.directories.find((d) => d.id === parts.id);
    if (dir === undefined) {
      out.push({ id: q, detail: `\`${parts.instance}\` declares no directory \`${parts.id}\`` });
      continue;
    }
    if (dir.optIn !== true) {
      out.push({ id: q, detail: `\`${parts.instance}\`'s \`${parts.id}\` is not an opt-in sub-graph (\`optIn: true\`); it is on everywhere and needs no enabling` });
    }
  }
  return out;
}
