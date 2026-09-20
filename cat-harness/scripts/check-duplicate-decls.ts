#!/usr/bin/env bun
/**
 * Duplicate-declaration audit — no fully-qualified name may be declared in two
 * modules of the same Lake tree.
 *
 * ## The defect this catches
 *
 * Lean's environment is flat. If two modules each declare `QOU.q_param`, a
 * third module that imports both does not get a shadowing warning or an
 * ambiguity at the use site — the *import itself* fails:
 *
 * ```
 * error: import QOU.CategoricalDqSquared failed, environment already contains
 *        'QOU.q_param' from QOU.BraidKnot.CasimirShared
 * ```
 *
 * So every duplicated FQN is a pair of modules that **can never be imported
 * together**. The library is partitioned into islands, and nobody finds out
 * until someone writes the module that needs both.
 *
 * Measured on `litlfred/qou@main` 2026-08-23 (bean `qou-kfcl`): 33 798
 * declarations, **65 duplicated FQNs, 64 mutually un-importable module pairs
 * across 70 modules**.
 * The worst is `QOU.R_q`, which denotes `RatFunc ℚ` in
 * `BraidKnot/CasimirShared.lean` and `LaurentPolynomial ℤ` in
 * `CategoricalDqSquared.lean` — the same name for two different rings.
 *
 * ## Why the build does not catch it
 *
 * `lean-direct-cone.sh --all` compiles each module against its own import
 * cone. No *existing* module imports both halves of any colliding pair, so the
 * tree is green — 2029/2040 modules, `err=0`, on the same commit that has 64
 * un-importable pairs. **A green tree is not evidence about this.** The error
 * is reachable only by writing a new module, which is how it was found.
 *
 * `check-mirror-drift.ts` reports a `duplicate-in-library` finding, but only
 * for `structure`/`class` names that also have a co-located mirror — a strict
 * subset, and it reported `0` here.
 *
 * ## Gating
 *
 * Reports and exits 0 by default; `--baseline <N>` fires on growth. Same
 * reasoning as `check-mirror-drift`: a gate that fails CI on a pre-existing
 * backlog teaches people to pass `--warn-only`.
 *
 * Exit codes:
 *   0  — under all gates, or `--warn-only`.
 *   2  — duplicated-FQN count exceeds `--max <N>`.
 *   3  — duplicated-FQN count exceeds `--baseline <N>` (growth gate).
 *
 * Usage
 * -----
 *   bun run scripts/check-duplicate-decls.ts
 *   bun run scripts/check-duplicate-decls.ts --package qou --baseline 65
 *   bun run scripts/check-duplicate-decls.ts --json
 *   bun run scripts/check-duplicate-decls.ts --tsv dups.tsv
 *
 * ## Scope and limits
 *
 * Every declaration kind is scanned, because every one of them occupies the
 * same flat namespace and so every one of them can break an import — a
 * duplicated `theorem` is as fatal as a duplicated `abbrev`.
 *
 * Regex, not Lean. It knows `namespace` / `section` / `end` and skips block
 * comments, and it deliberately does **not** try to model `open`, `export`,
 * `variable`, or anonymous constructor notation. Consequences:
 *
 *   - A declaration whose head wraps onto a second line before its name is
 *     missed.
 *   - `private` declarations are counted; they do not in fact collide across
 *     modules, so a private/private or private/public pair is a false
 *     positive. Rare enough here to report rather than filter, and filtering
 *     silently would be worse.
 *   - Two declarations that Lean would consider distinct because one is inside
 *     a `namespace` opened with `open ... in` are miscounted. Also rare.
 *
 * The population is 0.19 % of 33 798 declarations, so a handful of false
 * positives materially changes the list — check a finding by writing the
 * two-line import before acting on it, exactly as `qou-kfcl` did.
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, relative, resolve } from "path";

import { LEAN_PACKAGES, type LeanPackage } from "../schemas/lean-packages.ts";
import { findContentRepoRoot } from "../content/pipeline/repo-root";

// ── Scanning ─────────────────────────────────────────────────────

/**
 * Declaration kinds that occupy the flat environment namespace.
 *
 * All of them, deliberately. The import error does not care what kind the
 * colliding name was declared as.
 */
const KINDS = [
  "abbrev",
  "def",
  "structure",
  "class",
  "instance",
  "theorem",
  "lemma",
  "inductive",
  "opaque",
  "axiom",
] as const;

const MODIFIERS = "(?:private\\s+|protected\\s+|noncomputable\\s+|partial\\s+|unsafe\\s+)*";
/**
 * The declared name may itself be **dotted** — `theorem SurrealField.IsFinite.pow`
 * declares `…SurrealField.IsFinite.pow`, not `…SurrealField`.
 *
 * Capturing only up to the first dot is not a near-miss, it manufactures
 * collisions: the first run of this checker reported `QOU.AppendixSurreals.SurrealField`
 * as declared by a `class`, a `theorem` and a `def` in three modules, when the
 * latter two were `SurrealField.IsFinite.pow` and `SurrealField.finiteSubring`
 * and collided with nothing.
 */
const IDENT = "[A-Za-z_][A-Za-z0-9_'!?]*(?:\\.[A-Za-z_][A-Za-z0-9_'!?]*)*";
const DECL = new RegExp(
  `^\\s*(?:@\\[[^\\]]*\\]\\s*)?${MODIFIERS}(${KINDS.join("|")})\\s+(${IDENT})`,
);
const NAMESPACE = /^\s*namespace\s+([A-Za-z0-9_.'!?]+)/;
const SECTION = /^\s*section(?:\s+([A-Za-z0-9_.'!?]+))?\s*$/;
const END = /^\s*end(?:\s+([A-Za-z0-9_.'!?]+))?\s*$/;

/** One declaration, reduced to what a collision depends on. */
export interface ScannedDecl {
  fqn: string;
  kind: string;
  file: string;
  line: number;
}

/**
 * Scan one file's declarations.
 *
 * The namespace stack holds `section` entries alongside `namespace` ones: a
 * *named* section closed by `end Foo` is indistinguishable from a namespace at
 * the regex level, so both go on one stack and `end` pops whichever is on top.
 * `check-mirror-drift.ts` makes the same move for the same reason and has its
 * own tests for it; the two scanners answer different questions (that one needs
 * field lists, this one needs every declaration kind), so the stack walk is
 * repeated rather than shared, and tested on both sides.
 */
export function scanDecls(file: string, text: string): ScannedDecl[] {
  const out: ScannedDecl[] = [];
  const stack: { isNamespace: boolean; name: string }[] = [];
  let inComment = false;

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    if (inComment) {
      if (raw.includes("-/")) inComment = false;
      continue;
    }
    if (/^\s*\/-/.test(raw)) {
      if (!raw.includes("-/")) inComment = true;
      continue;
    }
    if (/^\s*--/.test(raw)) continue;

    const ns = NAMESPACE.exec(raw);
    if (ns) {
      stack.push({ isNamespace: true, name: ns[1] });
      continue;
    }
    if (SECTION.test(raw)) {
      stack.push({ isNamespace: false, name: "" });
      continue;
    }
    if (END.test(raw)) {
      stack.pop();
      continue;
    }

    const d = DECL.exec(raw);
    if (!d) continue;
    const path = stack.filter((s) => s.isNamespace).map((s) => s.name).join(".");
    out.push({
      fqn: path ? `${path}.${d[2]}` : d[2],
      kind: d[1],
      file,
      line: i + 1,
    });
  }
  return out;
}

// ── Audit ────────────────────────────────────────────────────────

interface Finding {
  fqn: string;
  sites: { file: string; line: number; kind: string }[];
}

interface Report {
  packages: string[];
  totals: {
    declarations: number;
    duplicatedFqns: number;
    /** Distinct module pairs that can never be imported together. */
    unimportablePairs: number;
    modulesInvolved: number;
  };
  findings: Finding[];
}

function walkLean(dir: string): string[] {
  const out: string[] = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop()!;
    if (d.includes("/.lake")) continue;
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.endsWith(".lean")) out.push(full);
    }
  }
  return out;
}

function audit(repoRoot: string, packages: readonly LeanPackage[]): Report {
  const byFqn = new Map<string, ScannedDecl[]>();
  let declarations = 0;

  for (const pkg of packages) {
    for (const f of walkLean(resolve(repoRoot, pkg.lakeRoot))) {
      for (const d of scanDecls(f, readFileSync(f, "utf8"))) {
        declarations++;
        const bucket = byFqn.get(d.fqn);
        if (bucket) bucket.push(d);
        else byFqn.set(d.fqn, [d]);
      }
    }
  }

  const findings: Finding[] = [];
  const pairs = new Set<string>();
  const modules = new Set<string>();

  for (const [fqn, decls] of [...byFqn].sort()) {
    // Two declarations in the SAME module are a Lean error already and are not
    // this check's business; only cross-module duplication breaks imports.
    const files = [...new Set(decls.map((d) => d.file))].sort();
    if (files.length < 2) continue;
    for (const f of files) modules.add(f);
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        pairs.add(`${files[i]} ${files[j]}`);
      }
    }
    findings.push({
      fqn,
      sites: files.map((f) => {
        const d = decls.find((x) => x.file === f)!;
        return { file: relative(repoRoot, f), line: d.line, kind: d.kind };
      }),
    });
  }

  return {
    packages: packages.map((p) => p.name),
    totals: {
      declarations,
      duplicatedFqns: findings.length,
      unimportablePairs: pairs.size,
      modulesInvolved: modules.size,
    },
    findings,
  };
}

// ── Output ───────────────────────────────────────────────────────

function printSummary(r: Report): void {
  const t = r.totals;
  console.log(
    `duplicate-decls — packages: ${r.packages.join(", ") || "(none)"}`,
  );
  console.log(`  declarations scanned: ${t.declarations}`);
  console.log(`  FQNs declared in >1 module: ${t.duplicatedFqns}`);
  console.log(
    `  mutually un-importable module pairs: ${t.unimportablePairs}  (across ${t.modulesInvolved} modules)`,
  );
  console.log();
  for (const f of r.findings) {
    console.log(f.fqn);
    for (const s of f.sites) console.log(`    ${s.kind.padEnd(9)} ${s.file}:${s.line}`);
  }
}

function writeTsv(r: Report, path: string): void {
  const rows = ["fqn\tkind\tfile\tline"];
  for (const f of r.findings) {
    for (const s of f.sites) {
      rows.push([f.fqn, s.kind, s.file, String(s.line)].join("\t"));
    }
  }
  writeFileSync(path, rows.join("\n") + "\n");
}

// ── Main ─────────────────────────────────────────────────────────

function main(): void {
  const argv = process.argv.slice(2);
  let json = false;
  let warnOnly = false;
  let tsv: string | undefined;
  let max: number | undefined;
  let baseline: number | undefined;
  let packageName: string | undefined;
  let repoRoot = findContentRepoRoot();

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--json": json = true; break;
      case "--warn-only": warnOnly = true; break;
      case "--tsv": tsv = argv[++i]; break;
      case "--max": max = Number(argv[++i]); break;
      case "--baseline": baseline = Number(argv[++i]); break;
      case "--package": packageName = argv[++i]; break;
      case "--repo-root": repoRoot = resolve(argv[++i]); break;
      default:
        console.error(`unknown argument: ${argv[i]}`);
        process.exit(64);
    }
  }

  const pkgs = packageName
    ? LEAN_PACKAGES.filter((p) => p.name === packageName)
    : LEAN_PACKAGES;
  if (packageName && pkgs.length === 0) {
    console.error(
      `no configured Lean package named "${packageName}" — have: ${LEAN_PACKAGES.map((p) => p.name).join(", ") || "(none)"}`,
    );
    process.exit(64);
  }

  const report = audit(repoRoot, pkgs);
  if (tsv) writeTsv(report, tsv);
  if (json) console.log(JSON.stringify(report, null, 2));
  else printSummary(report);

  let code = 0;
  const n = report.totals.duplicatedFqns;
  if (max !== undefined && n > max) {
    console.error(`duplicated FQNs ${n} exceeds --max ${max}`);
    code = 2;
  } else if (baseline !== undefined && n > baseline) {
    console.error(
      `duplicated FQNs ${n} exceeds --baseline ${baseline} — a new collision was introduced`,
    );
    code = 3;
  }

  if (warnOnly) {
    if (code !== 0) console.error("(warn-only: not exiting non-zero)");
    process.exit(0);
  }
  process.exit(code);
}

// Guarded so the tests can import `scanDecls` without running the audit.
if (import.meta.main) main();
