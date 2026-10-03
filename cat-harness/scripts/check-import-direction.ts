#!/usr/bin/env bun
/**
 * check-import-direction.ts — no module imports from an instance built on top
 * of the one it lives in.
 *
 * ## Why this exists beside three checks that look like they already do it
 *
 * Bean `p11x`: `check:partition` is rooted at ONE instance, `check:instance-graph`
 * judges declarations and never imports, and `kg:detangle:direction` reaches only
 * the directories in its `SCAN` list — which omitted `cat-harness/adapters/`, so
 * the two `intake-records` imports into `folio-assistant-core` sat under three
 * green checks until #1687 moved the file. `bf5l`'s sentence stands: *"three
 * green checks did not mean the layering held."* `check:reference-direction`
 * is the PROSE axis (a name mentioned), not this one (a module loaded).
 *
 * So this check has no scan list to fall short of. It walks every declared
 * instance in the checkout, assigns each file to the INNERMOST instance root
 * containing it, and asks the one question that decides whether an instance can
 * be lifted into its own repository: does anything it loads live in an instance
 * that is not itself or something it (transitively) `needs`? That is the same
 * direction computation `check:reference-direction` and `kg:detangle` use —
 * `allowedFromNeeds` over `ancestorsOf` — so the three axes cannot give three
 * answers about which way an arrow may point.
 *
 * **No instance is named here.** The allowed set is read from each
 * `<instance>.json`'s `needs`, so adding `bootstrap-tools` to `cat-harness`'s
 * `needs` (bean `0lj4`) made its 20 imports legal without an edit here, and the
 * next undeclared sibling edge fails without one either.
 *
 * ## What it reads, and the two things it reports rather than grades
 *
 * - **Module specifiers**: static `import`/`export … from`, literal `import()`
 *   and `require()`, parsed by bootstrap-tools' `specifiersOf` (comments and
 *   non-specifier strings stripped, so a docblock quoting an import is not one).
 *   Only relative and absolute specifiers can cross an instance boundary in this
 *   checkout; bare ones resolve to `node_modules`.
 * - **Module-path literals**: a string such as `"../folio-assistant-sci/adapters/paper/index.ts"`
 *   handed to a VARIABLE `import(abs)`. `src/builtin-adapters.ts` was exactly
 *   that until this change, and its own docblock said *"the one edge no
 *   static-import gate here can see"*. A literal that climbs out with `../` and
 *   names a module file (`.ts`/`.js`/…) is judged as if it were imported,
 *   resolved against both the file's directory and its instance root.
 * - **Reported, not graded — variable specifiers**: `import(expr)` whose
 *   argument is not a literal. What it loads cannot be read from the source, so
 *   the count is printed as COULD NOT DETERMINE rather than folded into a zero.
 * - **Reported, not graded — `undetermined` edges**: an importer or target in an
 *   instance that declares no `needs`. Absent is nobody-has-said, not `[]`.
 *
 * ## Which instances fail the build
 *
 * `--gate <name>` (repeatable) makes a wrong-direction edge FROM that instance
 * exit 1; `--all` gates every instance that holds code. Every other instance's
 * edges are printed. The repository's standing rule is that a check becomes an
 * error only once its count is zero, because a red gate turned on teaches the
 * next agent `|| true` — and on 2026-09-30, once `builtin-adapters.ts` was
 * inverted, every instance's count WAS zero, so CI runs `--all`.
 *
 * ```sh
 * bun run check:import-direction                       # report, every instance
 * bun run check:import-direction --gate cat-harness    # …and fail on one
 * bun run check:import-direction --all                 # …and fail on any (CI)
 * ```
 *
 * Tested with planted violations in `tests/check-import-direction.test.ts`: a
 * boundary check never seen failing checks nothing (`4j3h`, `q2wn`, `p11x`).
 *
 * @module scripts/check-import-direction
 * @covers code
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { specifiersOf, stripComments } from "../../bootstrap-tools/scripts/check-closure.js";
import { findDeclarationFile, instanceRootsIn } from "../schemas/cat-harness.js";
import { ancestorsOf, flattenDependencies } from "../schemas/dependency-order.js";
import { allowedFromNeeds, directionOf, type LayerRule } from "../schemas/layer-direction.js";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

/** Files that can load a module. */
const CODE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
/** A string that names a module file, for the module-path-literal rule. */
const MODULE_FILE = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
/** Never walked: dependencies, VCS, and dot-prefixed segments (the directory conventions' guard). */
const SKIP = new Set(["node_modules"]);

export interface Instance {
  root: string;
  name: string;
  needs: string[] | undefined;
}

export interface ImportEdge {
  /** Repo-relative importing file. */
  file: string;
  /** What the source says. */
  specifier: string;
  /** How it was found. */
  via: "specifier" | "module-path-literal";
  fromInstance: string;
  toInstance: string | undefined;
  verdict: "wrong-direction" | "undetermined";
  basis: string;
}

export interface ImportDirectionReport {
  instances: string[];
  /** Instances whose `needs` nobody declared — every edge from them is undetermined. */
  undeclaredNeeds: string[];
  filesRead: Map<string, number>;
  findings: ImportEdge[];
  /** `import(expr)` with a non-literal argument, per file — cannot be judged from source. */
  variableSpecifiers: { file: string; count: number }[];
}

export function readInstances(repoRoot: string): Instance[] {
  return instanceRootsIn(repoRoot).flatMap((root) => {
    const decl = JSON.parse(readFileSync(join(root, findDeclarationFile(root)!), "utf-8")) as {
      name?: string;
      needs?: string[];
    };
    // No `name` → it can own nothing by name; skipped rather than invented.
    return decl.name ? [{ root, name: decl.name, needs: decl.needs }] : [];
  });
}

/** The INNERMOST declaring root containing `abs` — the root instance contains every other one. */
export function ownerOf(abs: string, all: readonly Instance[]): Instance | undefined {
  let best: Instance | undefined;
  for (const i of all) {
    if ((abs === i.root || abs.startsWith(i.root + sep)) && (best === undefined || i.root.length > best.root.length)) {
      best = i;
    }
  }
  return best;
}

function codeFiles(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name) || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) codeFiles(p, out);
    else if (CODE.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Strip comments but KEEP every string — the opposite trade to `stripComments`,
 * which blanks non-specifier strings. Module-path literals are strings.
 */
function stringLiterals(src: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    const n = src[i + 1];
    if (c === "/" && n === "*") {
      const e = src.indexOf("*/", i + 2);
      i = e < 0 ? src.length : e + 2;
    } else if (c === "/" && n === "/") {
      const e = src.indexOf("\n", i);
      i = e < 0 ? src.length : e;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      out.push(src.slice(i + 1, j));
      i = j + 1;
    } else i++;
  }
  return out;
}

/** `import(` whose first argument is not a plain string literal. */
function variableImports(src: string): number {
  const code = stripComments(src);
  let n = 0;
  for (const m of code.matchAll(/\bimport\s*\(\s*([^)\s])/g)) {
    if (m[1] !== '"' && m[1] !== "'") n++;
  }
  return n;
}

export function analyse(repoRoot = REPO_ROOT): ImportDirectionReport {
  const root = resolve(repoRoot);
  const all = readInstances(root);
  const byName = new Map(all.map((i) => [i.name, i]));
  const flat = flattenDependencies(
    all.map((i) => ({ id: i.name, needs: (i.needs ?? []).filter((n) => byName.has(n)), fatal: false })),
  );
  if (flat.problems.length > 0) {
    // No ancestor set exists for a broken graph, and a partial one reports
    // allowed edges as wrong-direction — refused, the same as its siblings.
    throw new Error(`check:import-direction: the instance needs graph is broken — ${flat.problems.map((p) => p.detail).join("; ")}`);
  }
  const rule: LayerRule = {
    allowed: allowedFromNeeds(new Map(all.map((i) => [i.name, i.needs])), ancestorsOf(flat.order)),
  };

  const findings: ImportEdge[] = [];
  const variableSpecifiers: { file: string; count: number }[] = [];
  const filesRead = new Map<string, number>();

  const judge = (abs: string, target: string, from: Instance, specifier: string, via: ImportEdge["via"]) => {
    const to = ownerOf(target, all);
    if (to === from) return;
    const v = directionOf({ from: from.name, to: to?.name ?? target }, from.name, to?.name, rule);
    if (v.verdict === "allowed" || v.verdict === "permitted") return;
    findings.push({
      file: relative(root, abs),
      specifier,
      via,
      fromInstance: from.name,
      toInstance: to?.name,
      verdict: v.verdict,
      basis: v.basis,
    });
  };

  for (const abs of codeFiles(root)) {
    const from = ownerOf(abs, all);
    if (from === undefined) continue;
    filesRead.set(from.name, (filesRead.get(from.name) ?? 0) + 1);
    const src = readFileSync(abs, "utf-8");

    const seen = new Set<string>();
    for (const spec of specifiersOf(src)) {
      if (!spec.startsWith(".") && !spec.startsWith("/")) continue; // bare → node_modules
      // One edge per (file, specifier): `import` + `export … from` of the same
      // module is one dependency, and counting it twice inflates the number a
      // reader compares across runs.
      if (seen.has(spec)) continue;
      seen.add(spec);
      judge(abs, resolve(dirname(abs), spec), from, spec, "specifier");
    }

    for (const lit of stringLiterals(src)) {
      if (seen.has(lit) || !lit.startsWith("../") || !MODULE_FILE.test(lit) || /[\s${}]/.test(lit)) continue;
      // Only a literal that climbs out and then NAMES another instance's
      // directory — `../<instance>/…`. Resolved against the file's own
      // directory and against its instance root, because a variable import
      // usually joins the literal onto a ROOT constant (`builtin-adapters.ts`
      // did). A bare `../x.ts` names no instance and is a sibling file far more
      // often than a crossing; judging it against the instance root measured
      // five false findings in one run.
      const named = lit.split("/").find((s) => s !== "..");
      const candidates = all.filter((i) => i !== from && i.root.endsWith(sep + named));
      for (const base of new Set([dirname(abs), from.root])) {
        const target = resolve(base, lit);
        const hit = candidates.find((i) => target.startsWith(i.root + sep));
        if (hit) {
          judge(abs, target, from, lit, "module-path-literal");
          break;
        }
      }
    }

    const v = variableImports(src);
    if (v > 0) variableSpecifiers.push({ file: relative(root, abs), count: v });
  }

  return {
    instances: all.map((i) => i.name),
    undeclaredNeeds: all.filter((i) => i.needs === undefined).map((i) => i.name),
    filesRead,
    findings,
    variableSpecifiers,
  };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const gated = new Set<string>();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--gate" && args[i + 1]) gated.add(args[++i]!);
  }

  const r = analyse();
  // `--all`: every declared instance that HOLDS code. One with no code files is
  // reported, not gated — `--gate` on it refuses, and `--all` must not either
  // pass or refuse on its behalf.
  if (args.includes("--all")) for (const n of r.instances) if ((r.filesRead.get(n) ?? 0) > 0) gated.add(n);
  const unknownGates = [...gated].filter((g) => !r.instances.includes(g));
  if (unknownGates.length > 0) {
    // A gate over an instance that is not here checks nothing — refused, not passed.
    console.error(`✗ --gate names no declared instance: ${unknownGates.join(", ")}. Nothing was checked for it, which is not a pass.`);
    process.exit(2);
  }
  for (const g of gated) {
    if ((r.filesRead.get(g) ?? 0) === 0) {
      console.error(`✗ no code files found in gated instance '${g}' — nothing was checked, which is not a pass.`);
      process.exit(2);
    }
  }

  const wrong = r.findings.filter((f) => f.verdict === "wrong-direction");
  const undetermined = r.findings.filter((f) => f.verdict === "undetermined");
  const byInstance = new Map<string, number>();
  for (const f of wrong) byInstance.set(f.fromInstance, (byInstance.get(f.fromInstance) ?? 0) + 1);

  console.log(`check:import-direction — ${r.instances.length} declared instances, every code file in each (no scan list).`);
  for (const name of r.instances) {
    const n = byInstance.get(name) ?? 0;
    const files = r.filesRead.get(name) ?? 0;
    const tag = gated.has(name) ? "GATED   " : "reported";
    console.log(`  ${tag} ${name.padEnd(26)} ${String(files).padStart(5)} files  ${n === 0 ? "0" : `✗ ${n}`} wrong-direction`);
  }
  if (r.undeclaredNeeds.length > 0) {
    console.log(`  undetermined: ${r.undeclaredNeeds.join(", ")} declare no \`needs\` — ${undetermined.length} edge(s) cannot be judged, NOT counted as clean.`);
  }
  const varTotal = r.variableSpecifiers.reduce((s, v) => s + v.count, 0);
  console.log(
    `  could not determine: ${varTotal} \`import(expr)\` call(s) in ${r.variableSpecifiers.length} file(s) take a non-literal ` +
      `specifier; what they load cannot be read from source and is not in the counts above.`,
  );

  for (const f of wrong) {
    const mark = gated.has(f.fromInstance) ? "✗" : "·";
    console.log(`  ${mark} ${f.file}: "${f.specifier}" (${f.via}) → ${f.toInstance ?? "no instance"} — ${f.basis}`);
  }

  const failing = wrong.filter((f) => gated.has(f.fromInstance));
  if (failing.length > 0) {
    console.error(
      `✗ ${failing.length} wrong-direction import(s) from gated instance(s). Move the code to the instance that owns it, ` +
        `or invert the dependency: the lower instance declares a registry or an interface, the higher one registers.`,
    );
    process.exit(1);
  }
  if (gated.size > 0) console.log(`✓ no wrong-direction import from ${[...gated].join(", ")}.`);
}
