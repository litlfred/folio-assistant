#!/usr/bin/env bun
/**
 * check-closure.ts — bootstrap-tools imports nothing but itself, `zod` and
 * the runtime.
 *
 * ## Why this is a gate, not a convention
 *
 * bootstrap-tools exists to be released and run without anything above
 * bootstrap: its Zod is bootstrap's contract, and a bootstrap release must not
 * wait on a harness (owner, 2026-09-29, bean `xsqm`). Before it was re-created,
 * the same code reached 19 files / 11,577 lines of cat-harness through three
 * imports nobody had looked at (measured). A boundary nothing checks is the
 * boundary that erodes first: every gate in this repository that guarded a
 * boundary without failing on a planted violation turned out not to guard it
 * (`4j3h`, `q2wn`, `p11x`), so this one is tested with planted violations too.
 *
 * ## The rule
 *
 * For every `.ts` file under `bootstrap-tools/`:
 * - a RELATIVE import must resolve to a file inside `bootstrap-tools/`;
 * - a BARE import must be `zod`, a `node:` builtin, or — in a test file only —
 *   `bun:test` or `ajv`.
 *
 * Imports are read with comments and string literals of other statements
 * stripped, so a docblock that quotes an import is not one.
 *
 * ```sh
 * bun run check:tools-closure
 * ```
 *
 * @module bootstrap-tools/scripts/check-closure
 * @covers code
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/** Bare specifiers any file may import. */
export const ALLOWED = [/^zod$/, /^node:/];
/** …and a test file may also import. */
export const ALLOWED_IN_TESTS = [/^bun:test$/, /^ajv$/];

export interface ClosureFinding {
  file: string;
  specifier: string;
  why: string;
}

/**
 * Blank out everything that is not code — comments, and the contents of every
 * string that is not itself a module specifier — keeping line structure.
 *
 * A docblock that quotes an import is not an import, and neither is a test
 * fixture that builds one inside a string (measured: this gate's own test file
 * tripped it before strings were blanked). A string IS kept when the code
 * right before it is `from`, `import` or `import(` / `require(`.
 */
export function stripComments(src: string): string {
  let out = "";
  let i = 0;
  const blank = (t: string) => t.replace(/[^\n]/g, " ");
  while (i < src.length) {
    const c = src[i]!;
    const n = src[i + 1];
    if (c === "/" && n === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === "/" && n === "/") {
      const end = src.indexOf("\n", i);
      const stop = end < 0 ? src.length : end;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      const body = src.slice(i + 1, j);
      const isSpecifier = c !== "`" && /(\bfrom|\bimport|\bimport\s*\(|\brequire\s*\()\s*$/.test(out);
      out += c + (isSpecifier ? body : blank(body)) + (j < src.length ? c : "");
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Every module specifier a TypeScript file imports, statically or dynamically. */
export function specifiersOf(src: string): string[] {
  const s = stripComments(src);
  const out: string[] = [];
  const patterns = [
    /(?:^|[\n;])\s*import\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?["']([^"']+)["']/g,
    /(?:^|[\n;])\s*export\s+(?:type\s+)?(?:\*|\{[^}]*\})\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) for (const m of s.matchAll(re)) out.push(m[1]!);
  return out;
}

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...tsFiles(p));
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}

function resolvesTo(from: string, spec: string): string | undefined {
  const base = resolve(dirname(from), spec);
  for (const c of [base, base.replace(/\.js$/, ".ts"), `${base}.ts`, join(base, "index.ts")]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return undefined;
}

/** Every import under `root` that leaves the package or names a package it may not use. */
export function checkClosure(root: string): ClosureFinding[] {
  const findings: ClosureFinding[] = [];
  const top = resolve(root);
  for (const file of tsFiles(top)) {
    const isTest = file.endsWith(".test.ts");
    const rel = relative(top, file);
    for (const spec of specifiersOf(readFileSync(file, "utf-8"))) {
      if (spec.startsWith(".")) {
        const target = resolvesTo(file, spec);
        if (!target) findings.push({ file: rel, specifier: spec, why: "does not resolve to a file" });
        else if (!(target === top || target.startsWith(`${top}/`))) {
          findings.push({ file: rel, specifier: spec, why: `leaves bootstrap-tools (${relative(top, target)})` });
        }
      } else if (!ALLOWED.some((re) => re.test(spec)) && !(isTest && ALLOWED_IN_TESTS.some((re) => re.test(spec)))) {
        findings.push({ file: rel, specifier: spec, why: isTest ? "a package tests may not use" : "a package bootstrap-tools may not use" });
      }
    }
  }
  return findings;
}

if (import.meta.main) {
  const root = join(import.meta.dir, "..");
  const findings = checkClosure(root);
  const files = tsFiles(root).length;
  if (files === 0) {
    console.error("✗ no .ts files found under bootstrap-tools/ — nothing was checked, which is not a pass.");
    process.exit(2);
  }
  if (findings.length === 0) {
    console.log(`✓ bootstrap-tools imports only itself, zod and the runtime (${files} files).`);
    process.exit(0);
  }
  console.error(`✗ ${findings.length} import(s) leave bootstrap-tools' closure:`);
  for (const f of findings) console.error(`  · ${f.file}: "${f.specifier}" — ${f.why}`);
  console.error("bootstrap-tools may depend on bootstrap and nothing above it: move the piece down, or call it from the harness instead.");
  process.exit(1);
}
