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
 * @covers none — a reader of the script table, not a graph audit
 */
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { instanceRootsIn } from "./instance-roots.ts";

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
 * Every script the checkout declares, by name.
 *
 * Throws when a name is declared in two manifests: there is no correct
 * answer to pick, so the caller must not be handed one.
 */
export function scriptTable(repoRoot: string): Map<string, ScriptEntry> {
  const root = resolve(repoRoot);
  const out = new Map<string, ScriptEntry>();
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
  for (const inst of instanceRootsIn(root)) {
    if (resolve(inst) === root) continue;
    const manifest = join(relative(root, inst), "package.json");
    add(readJson(join(root, manifest))?.[CHECKOUT_SCRIPTS_KEY], manifest);
  }
  return out;
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
