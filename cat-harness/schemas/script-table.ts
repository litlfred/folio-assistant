/**
 * The checkout's script table, read from where each script now lives.
 *
 * Until bean `ar1s` phase 4 every script sat in the ROOT `package.json`, 509
 * of them, and that file named every layer — the aggregate a split cannot
 * divide. Now each layer carries the scripts whose command runs ITS code, in
 * its own `package.json` under `checkoutScripts`; the root keeps only the few
 * that run no layer's code (the whole-checkout `test` and `typecheck`, and the
 * `bootstrap-tools` submodule's own commands) plus `cat`, the runner.
 *
 * ## Why `checkoutScripts` and not `scripts`
 *
 * Every command here is written relative to the CHECKOUT ROOT, exactly as it
 * was in the root manifest, and `bun run cat <name>` runs it there. A layer's
 * `scripts` key, by the convention `bootstrap-tools` already keeps, is run from
 * the LAYER's directory (`cd <layer> && bun run <name>`), so putting
 * root-relative commands under it would make every one of them fail that way.
 * A separate key says which root the command expects; converting a layer to
 * its own `scripts` is that layer's split step, not this one.
 *
 * ## How a script is found
 *
 * By asking the declared instances, never by naming one: this module is the
 * LOWEST layer's, and every layer above it may hold scripts, so a literal list
 * here would be the reference-direction violation the move exists to end.
 * {@link instanceRootsIn} answers which directories are instances; each one's
 * `package.json` is read for `checkoutScripts`. A name defined twice is an
 * error, not a precedence rule — two answers to one name is the drift this
 * table must not hide.
 *
 * ## A remote-mounted layer, by reference
 *
 * A layer laid down by a remote mount (`scripts/remote-mount.ts`) is not in
 * this repository's git, so nothing reviewed its `package.json`. Its scripts
 * are read only when the mount lock lists that file as an ASSET and its bytes
 * still hash to the lock (owner, 2026-10-07, "Option A, by reference").
 * Otherwise the manifest is UNRESOLVED, the third state: `bun run cat`
 * says the script could not be resolved rather than that it does not exist,
 * and `check:script-placement` fails could-not-determine.
 *
 * @graphNode none — functions that read the script table; no schema
 * @covers none — a reader of the script table, not a graph audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { instanceRootsIn } from "./instance-roots.ts";
import { mountedManifests, type MountedManifest } from "./remote-mount.ts";

/** The key a layer's `package.json` carries its checkout-root scripts under. */
export const CHECKOUT_SCRIPTS_KEY = "checkoutScripts";

export interface ScriptEntry {
  name: string;
  /** The command, relative to the checkout root. */
  command: string;
  /** The manifest it is declared in, repository-relative (`package.json` for the root). */
  manifest: string;
}

function readJson(path: string): Record<string, unknown> | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
}

/**
 * A manifest whose scripts could not be resolved: the third state, beside
 * "declared here" and "declared nowhere".
 */
export interface UnresolvedManifest {
  /** Repository-relative: the `package.json`, or the lock that could not be read. */
  manifest: string;
  instance?: string;
  why: string;
  /**
   * The script NAMES the unverified file declares, read so a caller can say
   * "`x` is declared there but unverified" instead of "no script `x`". Names
   * only: a command from unverified bytes is never returned, let alone run.
   * `undefined` when the file could not be read at all.
   */
  declares?: string[];
}

export interface ScriptTableResult {
  table: Map<string, ScriptEntry>;
  unresolved: UnresolvedManifest[];
}

/**
 * The instances remote mounts placed in this checkout, keyed by absolute
 * root. Locks sit beside the declaring (downstream) instance, so the checkout
 * root and every instance root are asked.
 */
function mountedIn(root: string, instances: readonly string[]): { byRoot: Map<string, MountedManifest>; lockless: MountedManifest[] } {
  const byRoot = new Map<string, MountedManifest>();
  const lockless: MountedManifest[] = [];
  for (const scope of new Set([root, ...instances.map((i) => resolve(i))])) {
    for (const m of mountedManifests(scope)) {
      if (m.root === undefined) lockless.push(m);
      else if (!byRoot.has(resolve(m.root))) byRoot.set(resolve(m.root), m);
    }
  }
  return { byRoot, lockless };
}

function declaredNames(file: string): string[] | undefined {
  try {
    const s = (JSON.parse(readFileSync(file, "utf-8")) as Record<string, unknown>)[CHECKOUT_SCRIPTS_KEY];
    return s !== null && typeof s === "object" ? Object.keys(s as object).sort() : [];
  } catch {
    return undefined;
  }
}

/**
 * Every script the checkout declares, by name, and every manifest that could
 * not be resolved.
 *
 * A REMOTE-MOUNTED instance's `package.json` is read only when its mount lock
 * lists it as an asset and its bytes hash to the lock (owner, 2026-10-07,
 * "Option A, by reference"; {@link mountedManifests}). Otherwise its scripts
 * go to `unresolved`, never silently missing: a mounted layer whose manifest
 * cannot be vouched for has scripts nobody can say are absent.
 *
 * Throws when a name is declared in two manifests: there is no correct
 * answer to pick, so the caller must not be handed one.
 */
export function readScriptTable(repoRoot: string): ScriptTableResult {
  const root = resolve(repoRoot);
  const out = new Map<string, ScriptEntry>();
  const unresolved: UnresolvedManifest[] = [];
  const instances = instanceRootsIn(root).map((i) => resolve(i)).filter((i) => i !== root);
  const mounted = mountedIn(root, instances);
  for (const m of mounted.lockless) if (m.state === "unresolvable") unresolved.push({ manifest: relative(root, m.manifest), why: m.why });
  const roots = [...instances];
  // An instance an override moved below the first level is found by its lock, not the scan.
  for (const r of mounted.byRoot.keys()) if (!roots.includes(r) && existsSync(r)) roots.push(r);
  const add = (scripts: unknown, manifest: string): void => {
    if (scripts === null || typeof scripts !== "object") return;
    for (const [name, command] of Object.entries(scripts as Record<string, unknown>)) {
      if (typeof command !== "string") continue;
      const prior = out.get(name);
      if (prior) {
        throw new Error(`script "${name}" is declared twice: in ${prior.manifest} and in ${manifest}`);
      }
      out.set(name, { name, command, manifest });
    }
  };
  add(readJson(join(root, "package.json"))?.scripts, "package.json");
  for (const inst of roots) {
    const manifest = join(relative(root, inst), "package.json");
    const m = mounted.byRoot.get(inst);
    if (m?.state === "none") continue;
    if (m?.state === "unresolvable") {
      const declares = declaredNames(join(root, manifest));
      // A manifest that declares no `checkoutScripts` at all hides no script
      // name: there is nothing to resolve, so nothing is reported. Anything
      // else, including a file that cannot be read, is unresolved.
      if (declares === undefined || declares.length > 0) unresolved.push({ manifest, instance: m.instance, why: m.why, declares });
      continue;
    }
    add(readJson(join(root, manifest))?.[CHECKOUT_SCRIPTS_KEY], manifest);
  }
  return { table: out, unresolved };
}

/**
 * Every script the checkout declares, by name — {@link readScriptTable}'s
 * table. A mounted manifest that cannot be vouched for contributes nothing
 * here; a caller that must say so (`bun run cat`, `check:script-placement`)
 * reads {@link readScriptTable} instead.
 */
export function scriptTable(repoRoot: string): Map<string, ScriptEntry> {
  return readScriptTable(repoRoot).table;
}

/** The table as the flat `name → command` record a root `package.json`'s `scripts` used to be. */
export function scriptsOf(repoRoot: string): Record<string, string> {
  return Object.fromEntries([...scriptTable(repoRoot)].map(([n, e]) => [n, e.command]));
}

/** The script name a `bun run <name> …` or `bun run cat <name> …` command invokes, or undefined. */
export function scriptNameOf(command: string): string | undefined {
  const m = /^\s*bun run (?:cat )?([A-Za-z0-9:_.-]+)(?:\s|$)/.exec(command);
  return m?.[1];
}
