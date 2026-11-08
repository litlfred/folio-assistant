#!/usr/bin/env bun
/**
 * LSI over Lean DECLARATIONS — bean `folio-assistant-ec2a`, second step.
 *
 * The owner, 2026-10-10 (drain session ml9h): *accept scope, blocks first* —
 * the block indexer in folio-assistant-core (core#66), then **the `lean-decl`
 * kind here**, then a cross-graph `lsi:near`. qou's 141 duplicate bean groups
 * were mostly one Lean declaration filed twice; an index whose unit is the
 * declaration can say "this bean is about declaration Z".
 *
 * ## Why here
 *
 * Lean is this instance's vocabulary: the `lean-lexer` pipeline plugin is
 * sci's contribution, and `formal-edges.ts` beside it already treats a
 * declaration as the unit. The LSI engine is a tool and is imported down from
 * cat-harness-tools.
 *
 * ## A declaration's unit
 *
 * - **id** — `<qualified name>@<module>`. The name is what a `lean.ref` uses
 *   after its package prefix: `namespace` blocks are tracked, so `theorem foo`
 *   inside `namespace QOU.Mass` is `QOU.Mass.foo`. The module is the file's
 *   path under its Lean root (`QOU/Mass/X.lean` → `QOU.Mass.X`), so a name
 *   declared in two files stays two units rather than one overwriting the other.
 * - **text** — the declaration's doc comment (`/-- … -/` immediately above it),
 *   its name split into words (`markovZ_conventionD` → `markov z convention d`),
 *   and its signature. NOT the body: a proof's tactic script is vocabulary
 *   about the proof, not about what is being claimed, and it would make every
 *   `simp`-heavy lemma near every other.
 *
 * Declarations are found by the SAME detection the rest of the pipeline uses
 * (`declarationStarts` / `splitDeclarations` in `lean-lexer.ts`), never a
 * second pattern — `lean-decl-starts-are-shared.test.ts` exists because two
 * patterns drifted apart once.
 *
 * Usage:
 *   bun run folio-assistant-sci/scripts/lsi-lean-decls.ts --lean-root <dir> [--lean-root <dir>]…
 *       [--json] [--near "<text or declaration id>"] [--top N]
 *
 * `--lean-root` is a directory of `.lean` sources (`.lake/` is skipped). A
 * module name is the file's path relative to the root it was found under.
 *
 * @module folio-assistant-sci/scripts/lsi-lean-decls
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { declarationStarts, splitDeclarations, stripLeanComments } from "../../cat-harness-tools/pipeline/lean-lexer.ts";
import { buildLsi, neighboursOf, query, type LsiUnit } from "../../cat-harness-tools/pipeline/lsi.ts";

export interface DeclUnits {
  units: LsiUnit[];
  files: number;
  /** Files that could not be read, with why. Never dropped silently. */
  unreadable: Array<{ file: string; reason: string }>;
  /** Ids seen more than once in one module (a re-declaration the lexer split twice). */
  duplicates: string[];
}

/** `markovZ_conventionD` → `markov z convention d`. */
export function nameWords(name: string): string {
  return name
    .split(".")
    .pop()!
    .replace(/[_']/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .toLowerCase()
    .trim();
}

/** The `/-- … -/` doc comment ending just before `at` in the raw source, if any. */
export function docCommentBefore(raw: string, at: number): string {
  const before = raw.slice(0, at).replace(/(\s|@\[[^\]]*\]|\b(?:private|protected|noncomputable|partial|unsafe)\b)*$/, "");
  if (!before.endsWith("-/")) return "";
  const open = before.lastIndexOf("/--");
  if (open < 0) return "";
  return before.slice(open + 3, -2).trim();
}

/** The namespace in force at each offset of a stripped source, as a lookup. */
function namespaceAt(stripped: string): (at: number) => string {
  const events: Array<{ at: number; stack: string[] }> = [{ at: 0, stack: [] }];
  const stack: string[] = [];
  const re = /^[ \t]*(namespace|section|end)\b[ \t]*([A-Za-z_][\w.']*)?/gm;
  // Sections are tracked so `end <section>` pops the right frame; only
  // namespace frames contribute to the qualified name.
  const kinds: Array<"ns" | "sec"> = [];
  for (const m of stripped.matchAll(re)) {
    if (m[1] === "namespace" && m[2]) {
      stack.push(m[2]);
      kinds.push("ns");
    } else if (m[1] === "section") {
      kinds.push("sec");
    } else if (m[1] === "end" && kinds.length) {
      if (kinds.pop() === "ns") stack.pop();
    }
    events.push({ at: m.index!, stack: [...stack] });
  }
  return (at) => {
    let cur: string[] = [];
    for (const e of events) {
      if (e.at > at) break;
      cur = e.stack;
    }
    return cur.join(".");
  };
}

/** Every declaration in one Lean source, as units. */
export function declUnitsOf(raw: string, module: string): LsiUnit[] {
  const stripped = stripLeanComments(raw);
  const starts = declarationStarts(stripped);
  const spans = splitDeclarations(stripped);
  const ns = namespaceAt(stripped);
  const out: LsiUnit[] = [];
  spans.forEach((span, i) => {
    const at = starts[i]!.at;
    const space = ns(at);
    const name = span.name.startsWith("_root_.") ? span.name.slice(7) : space && !span.name.startsWith(`${space}.`) ? `${space}.${span.name}` : span.name;
    const doc = docCommentBefore(raw, at);
    const text = [doc, nameWords(span.name), span.signature.replace(/\s+/g, " ").trim()].filter(Boolean).join("\n\n");
    out.push({ id: `${name}@${module}`, text });
  });
  return out;
}

function leanFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules" || e.name === "build") continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) leanFiles(p, out);
    else if (e.isFile() && e.name.endsWith(".lean")) out.push(p);
  }
  return out;
}

/** Every declaration under the given Lean roots. */
export function declUnits(roots: string[]): DeclUnits {
  const res: DeclUnits = { units: [], files: 0, unreadable: [], duplicates: [] };
  const seen = new Set<string>();
  for (const root of roots) {
    for (const file of leanFiles(root).sort()) {
      let raw: string;
      try {
        raw = readFileSync(file, "utf8");
      } catch (e) {
        res.unreadable.push({ file, reason: (e as Error).message.split("\n")[0]! });
        continue;
      }
      res.files++;
      const module = relative(root, file).replace(/\.lean$/, "").split(/[\\/]/).join(".");
      for (const u of declUnitsOf(raw, module)) {
        if (seen.has(u.id)) {
          res.duplicates.push(u.id);
          continue;
        }
        seen.add(u.id);
        res.units.push(u);
      }
    }
  }
  return res;
}

/** The index options this script builds with, shared with the `lsi:near` provider so both index the same way. */
export const DECL_INDEX_OPTIONS = { k: 100, weighting: "log-entropy", minDf: 2, maxDfShare: 0.5, powerIterations: 4, seed: 1990 } as const;

/**
 * The `lsiUnitProviders` entry `lean-decl` (bean `ec2a` step 3): every
 * declaration under the Lean roots given as `--root lean-decl=<dir>`, for
 * cross-graph `lsi:near` in cat-harness-tools (`pipeline/lsi-near-across.ts`,
 * which owns the contract). With no root it is not searched: no Lean root is
 * declared anywhere, and guessing one would index whatever happened to be
 * there.
 *
 * Explicit references: the full id `<name>@<module>`, and the qualified
 * name alone when it has a namespace (`QOU.Mass.foo`). A bare top-level name
 * is too short to stand for one declaration, so it is not a key.
 */
export function lsiNearUnits(ctx: { checkoutRoot: string; roots: string[] }): {
  units: LsiUnit[];
  unreadable: Array<{ file: string; reason: string }>;
  notSearched?: string;
  buildOptions?: typeof DECL_INDEX_OPTIONS;
  refKeys?: Array<[string, string]>;
} {
  if (ctx.roots.length === 0) return { units: [], unreadable: [], notSearched: "no Lean root given (--root lean-decl=<dir>)" };
  const d = declUnits(ctx.roots.map((r) => resolve(r)));
  const refKeys: Array<[string, string]> = [];
  for (const u of d.units) {
    refKeys.push([u.id, u.id]);
    const name = u.id.slice(0, u.id.lastIndexOf("@"));
    if (name.includes(".")) refKeys.push([name, u.id]);
  }
  return { units: d.units, unreadable: d.unreadable, buildOptions: DECL_INDEX_OPTIONS, refKeys };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const roots = argv.flatMap((a, i) => (argv[i - 1] === "--lean-root" ? [resolve(a)] : []));
  if (roots.length === 0 || roots.some((r) => !statSync(r, { throwIfNoEntry: false })?.isDirectory())) {
    console.error("usage: lsi-lean-decls --lean-root <dir> [--lean-root <dir>]… [--json] [--near <text|id>] [--top N]");
    process.exit(2);
  }
  const t0 = performance.now();
  const d = declUnits(roots);
  if (d.units.length === 0) {
    console.error(`UNKNOWN — no declaration found under ${roots.join(", ")}; nothing to index.`);
    process.exit(2);
  }
  const ix = buildLsi(d.units, DECL_INDEX_OPTIONS);
  const ms = Math.round(performance.now() - t0);
  const at = argv.indexOf("--near");
  const top = argv.includes("--top") ? Number(argv[argv.indexOf("--top") + 1]) : 10;
  if (at >= 0) {
    const text = argv[at + 1] ?? "";
    const hits = d.units.some((u) => u.id === text) ? neighboursOf(ix, text, top) : query(ix, text, top);
    for (const h of hits) console.log(`${h.cosine.toFixed(3)}  ${h.id}`);
    process.exit(0);
  }
  const summary = {
    roots,
    files: d.files,
    declarations: d.units.length,
    duplicates: d.duplicates.length,
    unreadable: d.unreadable.length,
    terms: ix.terms.length,
    k: ix.k,
    retained: Number(ix.retained.toFixed(4)),
    ms,
  };
  if (argv.includes("--json")) console.log(JSON.stringify({ ...summary, unreadableFiles: d.unreadable, duplicateIds: d.duplicates }, null, 2));
  else {
    console.log(
      `${summary.declarations} declaration(s) from ${summary.files} file(s); ${summary.terms} terms, k=${summary.k}, retained ${(summary.retained * 100).toFixed(1)}%, ${ms} ms.`,
    );
    if (d.duplicates.length) console.log(`${d.duplicates.length} id(s) declared twice in one module — kept the first; --json lists them.`);
    if (d.unreadable.length) console.log(`${d.unreadable.length} file(s) could not be read — the index covers less than the corpus.`);
  }
  process.exit(d.unreadable.length ? 1 : 0);
}
