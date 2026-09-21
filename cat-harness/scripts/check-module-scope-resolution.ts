#!/usr/bin/env bun
/**
 * Refuse declaration-resolving work at MODULE SCOPE.
 *
 * ## The failure this exists for
 *
 * `folioDir`, `directoryForGraph` and `directoriesForGraph` resolve through an
 * instance's declaration and **throw** when it will not parse. A throw at
 * module scope aborts evaluation, so every export below the failing line is
 * left unbound — and `await import()` does not reliably re-throw for such a
 * module: it can hand back the half-built namespace.
 *
 * The error then names a binding, not the cause. Measured 2026-09-21 (beans
 * `95s1`, `1hkj`): `qa-checkers-extended.ts` failed at its top-level root
 * resolution on line 49, and the error read *"Cannot access
 * 'EXTENDED_AUTOMATED_CHECKERS' before initialization"* — naming a symptom
 * **3,186 lines from its cause**, and looking so much like a circular import
 * that a bean was opened as one and an afternoon spent chasing a cycle that
 * did not exist.
 *
 * A lazy accessor costs one line and makes the throw happen where the value is
 * USED, naming the caller.
 *
 * ## What is NOT checked, and why that is not an oversight
 *
 * `findContentRepoRoot()` is absent from the list. Measured against a
 * directory holding `{ not json`: `folioDir`, `directoryForGraph` and
 * `directoriesForGraph` all threw; `findContentRepoRoot` returned its declared
 * fallback. It was made total in #695 — the same change that made a corrupt
 * declaration reachable here — so a module-scope call to it cannot produce
 * this failure. Twenty-eight of the fifty-three module-scope call sites bean
 * `1hkj` counted are that function; including them would have tripled the diff
 * while removing no crash, and would have moved every root resolution from
 * import time to first use — a cwd-timing change with nothing driving it.
 *
 * The bean's premise said *"Both functions throw"*. One of them does not, and
 * two that do were not in its list. Both halves were found by running the
 * functions rather than by reading about them.
 *
 * @module scripts/check-module-scope-resolution
 */

import { readdirSync, readFileSync } from "fs";
import { join, resolve } from "path";

const REPO = resolve(import.meta.dir, "../..");

/** Resolvers that throw on an unreadable declaration — measured, not assumed. */
const THROWS = ["folioDir", "directoryForGraph", "directoriesForGraph"];

/**
 * Files whose module-scope resolution is a known, tracked API migration rather
 * than an oversight.
 *
 * Named individually and kept short ON PURPOSE. An allow-list that grows
 * silently is the defect this repository has paid for more than once — a
 * hard-coded checker list in `qa-criterion-source-file.test.ts` once hid three
 * real mismatches. Each entry here is a module whose eager constants are
 * EXPORTED, so making them lazy is a change at every import site: bean `1hkj`
 * tranches 2 and 3. `document/paths.ts` already carries the lazy `get`
 * accessor beside its statics and labels them *"backward compatibility"*, so
 * that one is a migration to finish rather than to design.
 */
const TRACKED: Record<string, string> = {
  "cat-harness/adapters/mcp-server/paths.ts": "1hkj tranche 3 — exported constants, 5+ importers",
  "cat-harness/adapters/document/paths.ts": "1hkj tranche 2 — one static beside an existing lazy `get`",
  "cat-harness/scripts/todos.ts": "1hkj tranche 2 — exported TODO_ROOT",
};

const DECL = new RegExp(
  String.raw`^(export )?const ([A-Za-z_][A-Za-z0-9_]*) = (.*\b(?:${THROWS.join("|")})\(.*);$`,
  "gm",
);

/**
 * The FIXED form, which must not be reported as the defect.
 *
 * `const X = (): string => (_m ??= folioDir(ROOT));` still contains the call
 * and still starts a `const` — the first version of this gate flagged all
 * twenty-nine sites it had just been written to certify. What separates them
 * is the arrow: an accessor DEFERS the call, and deferring it is the whole
 * repair.
 */
const LAZY = /^\(\s*\)\s*(?::[^=]*)?=>/;

function tsFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) tsFiles(p, out);
    else if (e.name.endsWith(".ts")) out.push(p);
  }
  return out;
}

const findings: string[] = [];
const trackedSeen = new Set<string>();

for (const abs of tsFiles(REPO)) {
  const rel = abs.slice(REPO.length + 1);
  const src = readFileSync(abs, "utf-8");
  const hits = [...src.matchAll(DECL)].filter((m) => !LAZY.test(m[3].trim()));
  if (!hits.length) continue;
  if (rel in TRACKED) {
    trackedSeen.add(rel);
    continue;
  }
  for (const m of hits) {
    if (LAZY.test(m[3].trim())) continue;
    const line = src.slice(0, m.index).split("\n").length;
    findings.push(`${rel}:${line}  const ${m[2]} = ${m[3].trim()}`);
  }
}

// A tracked file that no longer has the pattern is an entry to DELETE. Left
// in, it silences a future regression in the same file — which is how an
// allow-list stops being a list of known exceptions and becomes a blind spot.
const stale = Object.keys(TRACKED).filter((f) => !trackedSeen.has(f));

if (findings.length === 0 && stale.length === 0) {
  console.log(
    `module-scope resolution: clean — ${THROWS.join(", ")} appear at module scope only in ` +
      `${Object.keys(TRACKED).length} tracked file(s).`,
  );
  process.exit(0);
}

if (findings.length) {
  console.error(`${findings.length} module-scope declaration resolution(s):\n`);
  for (const f of findings) console.error("  " + f);
  console.error(
    `\nEach throws on a declaration that will not parse, aborting the module's\n` +
      `evaluation and leaving every export below it unbound. Make it lazy:\n\n` +
      `  let _xMemo: string | undefined;\n` +
      `  const X = (): string => (_xMemo ??= folioDir(ROOT));\n\n` +
      `so the throw happens where the value is used and names the caller.`,
  );
}
if (stale.length) {
  console.error(`\n${stale.length} TRACKED file(s) no longer match — delete the entry:\n`);
  for (const f of stale) console.error(`  ${f}  (${TRACKED[f]})`);
}
process.exit(1);
