#!/usr/bin/env bun
/**
 * Vendor the official SQLite WASM build into the docs site. Bean `q8ar`.
 *
 * The client (`docs/assets/js/slice-sqlite.js`) loads SQLite from
 * `docs/assets/js/vendor/sqlite-wasm/` and NOT from a CDN, for two measured
 * reasons:
 *
 * - `cdn.jsdelivr.net` is refused by this container's egress proxy (403 on
 *   CONNECT, 2026-10-03), so a CDN-loaded page could not be tested here;
 * - a reader's search would then depend on a third host, where the rest of the
 *   page depends only on Pages.
 *
 * The repository already vendors JS (`vendor/qrcode.js`), so this follows that
 * precedent. Only two files are copied:
 *
 * - `index.mjs`, the ESM bundle;
 * - `sqlite3.wasm`, which the bundle finds through `import.meta.url`.
 *
 * `sqlite3-worker1.mjs` and `sqlite3-opfs-async-proxy.js` serve the `opfs` VFS
 * and the Worker1 API, and neither is used. The `opfs` VFS needs
 * SharedArrayBuffer, hence COOP/COEP headers, which GitHub Pages cannot send.
 * The client therefore uses `opfs-sahpool` inside its own Worker.
 *
 * The SOURCE is the pinned devDependency `@sqlite.org/sqlite-wasm`. So an
 * upgrade is a `package.json` bump plus `bun run slice:sqlite:vendor`.
 * `--check` fails when the vendored bytes differ from the pinned package, which
 * catches a hand-edit and a bump that was never re-vendored.
 *
 * @module cat-harness/scripts/vendor-sqlite-wasm
 * @covers none — vendored third-party bytes compared with their pinned package; no declared graph typology
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { repoRootFor, siteDirFor } from "../schemas/cat-harness.ts";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const PKG = join(repoRootFor(INSTANCE_ROOT), "node_modules", "@sqlite.org", "sqlite-wasm");
export const VENDOR_DIR = join(INSTANCE_ROOT, siteDirFor(INSTANCE_ROOT), "assets", "js", "vendor", "sqlite-wasm");
export const VENDORED = ["index.mjs", "sqlite3.wasm"] as const;

function license(version: string): string {
  return [
    `@sqlite.org/sqlite-wasm ${version}, vendored by cat-harness/scripts/vendor-sqlite-wasm.ts (bean q8ar).`,
    "",
    "The npm wrapper is Apache-2.0 (https://github.com/sqlite/sqlite-wasm).",
    "SQLite itself is in the public domain (https://sqlite.org/copyright.html).",
    "The Emscripten glue in index.mjs is MIT / University of Illinois NCSA;",
    "the full notice is the @preserve block at the top of index.mjs.",
    "",
  ].join("\n");
}

export function vendorProblems(): string[] {
  if (!existsSync(PKG)) return [`${PKG} is missing: run bun install`];
  const version = (JSON.parse(readFileSync(join(PKG, "package.json"), "utf-8")) as { version: string }).version;
  const problems: string[] = [];
  for (const f of VENDORED) {
    const dest = join(VENDOR_DIR, f);
    if (!existsSync(dest)) problems.push(`${f} is not vendored`);
    else if (!readFileSync(dest).equals(readFileSync(join(PKG, "dist", f)))) problems.push(`${f} differs from @sqlite.org/sqlite-wasm ${version}`);
  }
  const lic = join(VENDOR_DIR, "LICENSE.txt");
  if (!existsSync(lic) || readFileSync(lic, "utf-8") !== license(version)) problems.push(`LICENSE.txt does not name ${version}`);
  return problems;
}

if (import.meta.main) {
  if (process.argv.includes("--check")) {
    const p = vendorProblems();
    if (p.length) {
      for (const x of p) console.error(`  ✗ ${x} — run bun run slice:sqlite:vendor`);
      process.exit(1);
    }
    console.log("✓ vendored sqlite-wasm matches the pinned package");
  } else {
    const version = (JSON.parse(readFileSync(join(PKG, "package.json"), "utf-8")) as { version: string }).version;
    mkdirSync(VENDOR_DIR, { recursive: true });
    for (const f of VENDORED) copyFileSync(join(PKG, "dist", f), join(VENDOR_DIR, f));
    writeFileSync(join(VENDOR_DIR, "LICENSE.txt"), license(version));
    console.log(`  · vendored @sqlite.org/sqlite-wasm ${version} → ${VENDOR_DIR}`);
  }
}
