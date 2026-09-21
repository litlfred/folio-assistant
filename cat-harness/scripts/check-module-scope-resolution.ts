#!/usr/bin/env bun
/**
 * check-module-scope-resolution.ts — no module scope resolves the folio
 * directory, because a throw there is an error far from its cause.
 *
 * ## What this forbids, and what it deliberately does not
 *
 * `const FOLIO_DIR = folioDir(ROOT);` at module scope. `folioDir` throws on a
 * malformed declaration, and a throw during evaluation ABORTS the module —
 * leaving every export below the failing line unbound. `await import()` can
 * then hand back the half-built namespace rather than re-throwing, so the
 * error a reader sees names an unrelated binding's temporal dead zone.
 *
 * Bean `95s1` is what that costs: `qa-checkers-extended.ts` threw at line 49,
 * `EXTENDED_AUTOMATED_CHECKERS` at line 3235 was never bound, and the symptom
 * sat **3,186 lines** from the cause — close enough to a circular import that
 * the bean was opened as one and stayed wrong until the import graph was
 * actually measured.
 *
 * **`findContentRepoRoot()` at module scope is NOT flagged.** It no longer
 * throws: it catches `folioDir` failures while searching and ends in a
 * declared fallback (PR #695). Flagging it would be a gate against a hazard
 * that no longer exists, and this file would be the place a reader learned a
 * false thing about it.
 *
 * **Lazy call sites are not module scope**, so `FOLIO_DIR: () => folioDir(x)`
 * inside an object is fine and stays fine — `adapters/document/paths.ts` has
 * one deliberately.
 *
 * ## The fix a finding points at
 *
 * `folioDirDeferred(root, import.meta.url)` — resolves at load, exactly as
 * before, so a value captured under the loading cwd stays captured; only the
 * THROW waits for a caller, and arrives naming the module.
 *
 * @module scripts/check-module-scope-resolution
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

/** A module-scope `const|let|export const X = folioDir(...)`. */
const OFFENDING = /^(?:export\s+)?(?:const|let|var)\s+\w+\s*(?::[^=]*)?=\s*folioDir\s*\(/;

export interface Finding {
  file: string;
  line: number;
  text: string;
}

export interface ModuleScopeReport {
  filesRead: number;
  findings: Finding[];
}

function walk(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir).map(String);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const abs = join(dir, name);
    let isDir: boolean;
    try {
      isDir = statSync(abs).isDirectory();
    } catch {
      continue;
    }
    if (isDir) walk(abs, out);
    else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) out.push(abs);
  }
}

export function checkModuleScopeResolution(root = REPO_ROOT): ModuleScopeReport {
  const files: string[] = [];
  walk(join(root, "cat-harness"), files);

  const findings: Finding[] = [];
  for (const abs of files) {
    const rel = relative(root, abs).split("\\").join("/");
    // This gate's own regex and prose name the pattern; exempting it by path
    // rather than by a marker keeps the rule readable.
    if (rel.endsWith("scripts/check-module-scope-resolution.ts")) continue;
    for (const [i, line] of readFileSync(abs, "utf8").split("\n").entries()) {
      if (OFFENDING.test(line)) findings.push({ file: rel, line: i + 1, text: line.trim() });
    }
  }
  return { filesRead: files.length, findings };
}

export function formatReport(r: ModuleScopeReport): string {
  if (r.filesRead === 0) {
    return "Module-scope resolution\n  ? EXAMINED NOTHING — no TypeScript found. That is not a pass.";
  }
  const out = [`Module-scope resolution (${r.filesRead} file(s))`];
  if (r.findings.length === 0) {
    out.push("  ✓ no module scope calls `folioDir` — a malformed declaration cannot");
    out.push("    abort a module and strand its exports");
    return out.join("\n");
  }
  for (const f of r.findings) {
    out.push(`  ✗ ${f.file}:${f.line}`);
    out.push(`      ${f.text}`);
  }
  out.push("");
  out.push("  `folioDir` throws on a malformed declaration, and a throw at module scope");
  out.push("  aborts evaluation — every export below is left unbound and the error");
  out.push("  surfaces somewhere else entirely (bean `95s1`, 3,186 lines away).");
  out.push("");
  out.push("  Use `folioDirDeferred(root, import.meta.url)`: same resolution, at the same");
  out.push("  moment, but the failure waits for a caller and names this module.");
  return out.join("\n");
}

if (import.meta.main) {
  const report = checkModuleScopeResolution();
  const clean = report.filesRead > 0 && report.findings.length === 0;
  (clean ? console.log : console.error)(formatReport(report));
  process.exit(clean ? 0 : 1);
}
