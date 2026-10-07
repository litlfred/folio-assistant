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
 * @covers none — a command runner, not a graph audit
 */
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

import { scriptTable } from "../schemas/script-table.ts";

const REPO = resolve(import.meta.dir, "..", "..");

/** POSIX single-quote an argument for `sh -c`. */
export function shellQuote(arg: string): string {
  return /^[A-Za-z0-9_\-./:=@%+,]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`;
}

if (import.meta.main) {
  const [name, ...args] = process.argv.slice(2);
  const table = scriptTable(REPO);
  if (name === undefined || name === "--list") {
    for (const e of [...table.values()].sort((a, b) => a.name.localeCompare(b.name))) console.log(`${e.name}\t${e.manifest}`);
    process.exit(name === undefined ? 2 : 0);
  }
  const entry = table.get(name);
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
