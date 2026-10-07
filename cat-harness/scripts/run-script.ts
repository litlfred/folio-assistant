#!/usr/bin/env bun
/**
 * `bun run cat <name> [args…]` — run a checkout script wherever it is declared.
 *
 * The scripts left the root `package.json` for the layer each one runs (bean
 * `ar1s` phase 4, `schemas/script-table.ts`). `bun run` reads only the
 * manifest in the directory it starts in, so the root keeps this one entry,
 * `cat`, and this finds the script by asking the declared instances.
 *
 * A `.ts`/`.js` path in place of a name runs that file, as `bun run <file>`
 * does, so a caller whose list mixes names and files needs no second spelling.
 *
 * It runs the command exactly as `bun run` did: through `sh -c` from the
 * CHECKOUT ROOT, with `node_modules/.bin` first on PATH, the arguments
 * appended, and `npm_lifecycle_event` set to the script's name. The exit code
 * is the command's.
 *
 * A name in no manifest exits 2. A name that may be in a REMOTE-MOUNTED
 * manifest no lock vouches for exits {@link UNRESOLVED_EXIT} and says which
 * manifest and why: unresolvable is a third answer, never "no such script"
 * (owner, 2026-10-07; `schemas/script-table.ts`).
 *
 * @covers none — a command runner, not a graph audit
 */
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

import { readScriptTable, type UnresolvedManifest } from "../schemas/script-table.ts";

const REPO = resolve(import.meta.dir, "..", "..");

/**
 * The exit code for a script that could not be RESOLVED, as against one that
 * does not exist (2): a remote-mounted manifest that might declare it is one
 * no lock vouches for. A third answer, so a caller can tell them apart.
 */
export const UNRESOLVED_EXIT = 3;

/**
 * What to say when `name` is in no verified manifest but some manifest could
 * not be resolved. Names the manifest that declares it when one does; when an
 * unresolved manifest could not even be read, the script may be there and the
 * answer is still "could not resolve". `undefined` when every unresolved
 * manifest was read and none declares `name`: then "no such script" is true.
 */
export function unresolvedVerdict(name: string, unresolved: readonly UnresolvedManifest[]): string | undefined {
  const declaring = unresolved.filter((u) => u.declares?.includes(name));
  const unreadable = unresolved.filter((u) => u.declares === undefined);
  const subject = declaring.length ? declaring : unreadable;
  if (subject.length === 0) return undefined;
  const lines = subject.map((u) => `  ${u.manifest}${u.instance ? ` (mounted \`${u.instance}\`)` : ""}: ${u.why}`);
  return [
    declaring.length
      ? `bun run cat: script "${name}" is declared in a remote-mounted manifest that no mount lock vouches for, so it is UNRESOLVED, not run:`
      : `bun run cat: could not resolve "${name}": a remote-mounted manifest that might declare it could not be read:`,
    ...lines,
    "  Re-mount so the lock carries the manifest as an asset (`bun run cat mount:remote`), or move the edits upstream.",
  ].join("\n");
}

/** POSIX single-quote an argument for `sh -c`. */
export function shellQuote(arg: string): string {
  return /^[A-Za-z0-9_\-./:=@%+,]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`;
}

if (import.meta.main) {
  const [name, ...args] = process.argv.slice(2);
  const { table, unresolved } = readScriptTable(REPO);
  if (name === undefined || name === "--list") {
    for (const e of [...table.values()].sort((a, b) => a.name.localeCompare(b.name))) console.log(`${e.name}\t${e.manifest}`);
    for (const u of unresolved) console.error(`unresolved\t${u.manifest}\t${u.why}`);
    process.exit(name === undefined ? 2 : 0);
  }
  const entry = table.get(name);
  if (!entry && unresolved.length > 0) {
    const verdict = unresolvedVerdict(name, unresolved);
    if (verdict) {
      console.error(verdict);
      process.exit(UNRESOLVED_EXIT);
    }
  }
  // A FILE, not a script name: callers that pass either (qa-refresh's writer
  // list, skill-register's steps) hand it here, and it runs as `bun run <file>`
  // would have, from the checkout root.
  if (!entry && /\.(?:m?[jt]s)$/.test(name)) {
    const r = spawnSync(process.execPath, ["run", name, ...args], { cwd: REPO, stdio: "inherit", env: process.env });
    process.exit(r.status ?? (r.signal ? 1 : 0));
  }
  if (!entry) {
    const near = [...table.keys()].filter((k) => k.includes(name) || name.includes(k)).slice(0, 8);
    console.error(`bun run cat: no script "${name}" in any declared manifest.${near.length ? ` Did you mean: ${near.join(", ")}?` : ""}`);
    process.exit(2);
  }
  const command = [entry.command, ...args.map(shellQuote)].join(" ");
  const r = spawnSync("sh", ["-c", command], {
    cwd: REPO,
    stdio: "inherit",
    env: {
      ...process.env,
      PATH: `${join(REPO, "node_modules", ".bin")}:${process.env.PATH ?? ""}`,
      npm_lifecycle_event: name,
    },
  });
  process.exit(r.status ?? (r.signal ? 1 : 0));
}
