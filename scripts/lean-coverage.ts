#!/usr/bin/env bun
/**
 * lean-coverage.ts — Compute Lean formalization coverage stats.
 *
 * Scans every content block under `<content-root>/<paper>/` and reports:
 *   - provable blocks (theorem/lemma/proposition/corollary) and how many
 *     are sorry-free (i.e. carry a full Lean proof). The Lean source is
 *     resolved the same way the pipeline resolves it: sibling `.lean`
 *     first, then the `lean.ref` library file under `<paper>/lean/`, then
 *     a declaration-name grep fallback over the library tree. (Resolving
 *     via the ref — not just the sibling — is what makes the sorry-free
 *     count match reality: most proofs live in the library tree, not in a
 *     sibling file.)
 *   - conjectures, split into the categories the author-note actually
 *     wants to advertise (see the `conjectures` block below):
 *       * external  — famous open problems from the literature the paper
 *                     merely connects to (tagged `tier:famous`). These are
 *                     NOT the paper's own conjectures and are excluded.
 *       * primary   — the paper's own *root* conjectures: QOU-original
 *                     (not external) AND not downstream of another
 *                     conjecture (nothing in the transitive `uses[]` cone
 *                     is itself a conjecture). Per CLAUDE.md §3b-tax a
 *                     dependent conjecture is conditional on a primary one,
 *                     so only the primaries are genuinely open questions.
 *       * dependent — QOU-original but downstream of another conjecture.
 *   - definitions with .lean siblings.
 *
 * Usage:
 *   bun run scripts/lean-coverage.ts                       # default paper (qou)
 *   bun run scripts/lean-coverage.ts --paper qou           # explicit paper
 *   bun run scripts/lean-coverage.ts --content-root ../qou/content
 *   bun run scripts/lean-coverage.ts --json                # JSON only
 *   bun run scripts/lean-coverage.ts --out path.json       # write JSON to path
 *
 * `--content-root` is required in the two-repo split (folio-assistant holds
 * no paper content); it points at the paper repo's `content/` directory.
 * Without it the tool falls back to `$PWD/content` then `<repo>/content`.
 *
 * Output JSON consumed by:
 *   - authors-note refresh (scripts/refresh-authors-note.ts in the paper repo)
 *   - README.md generator
 *   - publish.yml (per-build coverage badge)
 */

import { readdirSync, readFileSync, existsSync, writeFileSync } from "fs";
import { join, resolve, relative, dirname, basename } from "path";

const SCRIPT_REPO_ROOT = resolve(import.meta.dir, "..");

const PROVABLE = new Set(["theorem", "lemma", "proposition", "corollary"]);

/** Tag marking a conjecture as a famous external open problem (excluded). */
const EXTERNAL_TAG = "tier:famous";

interface Block {
  ts: string;
  kind: string;
  label?: string;
  leanRef?: string;
  hasLeanField: boolean;
  leanFile?: string;
  leanHasSorry?: boolean;
  leanHasClass?: boolean;
  tags: string[];
  uses: string[];
  external: boolean;
}

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip nested build / vendored / Lean source dirs
      if (entry.name === "lean" || entry.name === "node_modules" ||
          entry.name === ".lake" || entry.name === "build") continue;
      yield* walk(p);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      yield p;
    }
  }
}

/** Extract the string literals inside a `field: [ ... ]` array in a .ts src. */
function arrayField(src: string, field: string): string[] {
  const m = src.match(new RegExp(`${field}:\\s*\\[(.*?)\\]`, "s"));
  if (!m) return [];
  return [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
}

function parseBlock(tsPath: string, repoRoot: string): Block | null {
  const src = readFileSync(tsPath, "utf-8");
  // Identify builder: export default <builder>(
  const m = src.match(/\bexport\s+default\s+(\w+)\s*\(/);
  if (!m) return null;
  const kind = m[1];
  // Skip non-block builders (paper, chapter, sectionRef, etc.)
  const blockKinds = new Set([
    "definition", "theorem", "lemma", "proposition", "corollary",
    "conjecture", "remark", "example", "prose", "equation", "diagram",
    "simulator", "proof",
  ]);
  if (!blockKinds.has(kind)) return null;

  const labelM = src.match(/label:\s*["']([^"']+)["']/);
  const leanRefM = src.match(/lean:\s*\{[^}]*ref:\s*["']([^"']+)["']/s);
  const hasLeanField = /lean:\s*\{/.test(src);
  const tags = arrayField(src, "tags");
  return {
    ts: relative(repoRoot, tsPath),
    kind,
    label: labelM?.[1],
    leanRef: leanRefM?.[1],
    hasLeanField,
    tags,
    uses: arrayField(src, "uses"),
    external: tags.includes(EXTERNAL_TAG),
  };
}

/**
 * Resolve a block's `.lean` file the way the pipeline does:
 *   1. sibling `<root>.lean`
 *   2. the `lean.ref` library file — `qou:QOU.A.B.C` → `<leanRoot>/QOU/A/B/C.lean`,
 *      walking prefix cuts and confirming the file mentions the decl's final
 *      name segment (so an aggregator module does not swallow the ref)
 *   3. a declaration-name grep fallback over the library tree
 * Returns the resolved path, or null. Mirrors `resolve_lean` in the qou
 * `scripts/lean-qa-progress-table.py`.
 */
function resolveLeanFile(
  tsPath: string,
  src: string,
  leanRoot: string,
): string | null {
  const sib = tsPath.replace(/\.ts$/, ".lean");
  if (existsSync(sib)) return sib;
  const m = src.match(/lean:\s*\{[^}]*ref:\s*["']([^"']+)["']/s);
  if (!m || !m[1].startsWith("qou:")) return null;
  const parts = m[1].slice(4).split(".");
  const decl = parts[parts.length - 1];
  const declRe = new RegExp(`\\b${decl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  for (let cut = parts.length; cut > 0; cut--) {
    const cand = join(leanRoot, ...parts.slice(0, cut)) + ".lean";
    if (existsSync(cand) && declRe.test(readFileSync(cand, "utf-8"))) return cand;
  }
  // grep fallback: find the declaration definition anywhere in the tree
  const declDefRe = new RegExp(
    `^\\s*(?:noncomputable\\s+)?(?:theorem|lemma|def|abbrev|structure|class|instance)\\s+` +
    `${decl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "m",
  );
  if (!existsSync(leanRoot)) return null;
  for (const f of walkLean(leanRoot)) {
    if (declDefRe.test(readFileSync(f, "utf-8"))) return f;
  }
  return null;
}

function* walkLean(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".lake" || entry.name === "build") continue;
      yield* walkLean(p);
    } else if (entry.isFile() && entry.name.endsWith(".lean")) {
      yield p;
    }
  }
}

function stripLeanComments(src: string): string {
  // Strip Lean block comments (`/- ... -/`, `/-- ... -/`, `/-! ... -/`) first —
  // they can contain prose like "sorry-free" that would otherwise be matched
  // by /\bsorry\b/. Block comments can be nested (Lean's lexer supports
  // arbitrary nesting), so we walk depth instead of using a single regex.
  let out = "";
  let depth = 0;
  for (let i = 0; i < src.length; i++) {
    if (depth === 0 && src[i] === "/" && src[i + 1] === "-") {
      depth = 1;
      i += 1;
      continue;
    }
    if (depth > 0) {
      if (src[i] === "/" && src[i + 1] === "-") { depth += 1; i += 1; continue; }
      if (src[i] === "-" && src[i + 1] === "/") { depth -= 1; i += 1; continue; }
      continue;
    }
    out += src[i];
  }
  // Then strip line comments (`-- ...` to EOL).
  return out.split("\n").map(line => {
    const idx = line.indexOf("--");
    return idx >= 0 ? line.slice(0, idx) : line;
  }).join("\n");
}

function inspectLean(leanPath: string): { hasSorry: boolean; hasClass: boolean } {
  const src = readFileSync(leanPath, "utf-8");
  const stripped = stripLeanComments(src);
  const hasSorry = /\bsorry\b/.test(stripped);
  // `class` keyword check uses raw source: class declarations carry doc
  // comments above them, never inside, so stripping is unnecessary.
  const hasClass = /^\s*class\s+\w+/m.test(src);
  return { hasSorry, hasClass };
}

/**
 * Does the transitive `uses[]` cone of conjecture `label` reach *another*
 * conjecture? Restricted to conjecture-labelled nodes (per CLAUDE.md §3b the
 * relevant dependency is on other conjectures). Labels are matched with and
 * without the `conj:` prefix so a `uses: ["conj:foo"]` edge resolves whether
 * or not the block's own `label` field carries the prefix.
 */
function coneTouchesConjecture(
  label: string,
  conjByLabel: Map<string, Block>,
): boolean {
  const seen = new Set<string>([label]);
  const stack = [label];
  const norm = (l: string) => l.replace(/^conj:/, "");
  const byNorm = new Map<string, string>();
  for (const l of conjByLabel.keys()) byNorm.set(norm(l), l);
  while (stack.length) {
    const cur = stack.pop()!;
    const blk = conjByLabel.get(cur) ?? conjByLabel.get(byNorm.get(norm(cur))!);
    if (!blk) continue;
    for (const u of blk.uses) {
      const key = conjByLabel.has(u) ? u : byNorm.get(norm(u));
      if (!key) continue; // not a conjecture — ignore
      if (key !== label && conjByLabel.has(key)) return true;
      if (!seen.has(key)) { seen.add(key); stack.push(key); }
    }
  }
  return false;
}

interface Stats {
  paper: string;
  generated_at: string;
  total_blocks: number;
  by_kind: Record<string, number>;
  provable: {
    total: number;
    with_lean_field: number;
    with_lean_file: number;
    sorry_free: number;
    percent_sorry_free: number;
  };
  conjectures: {
    total: number;
    external: number;
    qou_original: number;
    primary: number;
    dependent: number;
    /** class-axiomatised among the primary QOU conjectures. */
    primary_class_axiomatized: number;
    percent_primary_class_axiomatized: number;
    /** legacy: class-axiomatised among *all* conjecture blocks. */
    class_axiomatized: number;
  };
  definitions: {
    total: number;
    with_lean_file: number;
  };
}

function computeStats(paperDir: string, contentRoot: string): Stats {
  const repoRoot = resolve(contentRoot, "..");
  const root = join(contentRoot, paperDir);
  const leanRoot = join(root, "lean");
  const blocks: Block[] = [];
  for (const tsPath of walk(root)) {
    // Skip chapter and paper manifests
    const name = basename(tsPath, ".ts");
    const parent = basename(dirname(tsPath));
    if (name === parent) continue;       // <dir>/<dir>.ts (chapter manifest)
    if (name === paperDir) continue;     // paper manifest
    const block = parseBlock(tsPath, repoRoot);
    if (!block) continue;
    const leanSib = resolveLeanFile(join(repoRoot, block.ts), readFileSync(join(repoRoot, block.ts), "utf-8"), leanRoot);
    if (leanSib) {
      block.leanFile = relative(repoRoot, leanSib);
      const insp = inspectLean(leanSib);
      block.leanHasSorry = insp.hasSorry;
      block.leanHasClass = insp.hasClass;
    }
    blocks.push(block);
  }

  const byKind: Record<string, number> = {};
  for (const b of blocks) byKind[b.kind] = (byKind[b.kind] ?? 0) + 1;

  const provable = blocks.filter(b => PROVABLE.has(b.kind));
  const provableWithField = provable.filter(b => b.hasLeanField);
  const provableWithFile = provable.filter(b => b.leanFile);
  const provableSorryFree = provable.filter(b => b.leanFile && !b.leanHasSorry);

  // ── Conjecture classification ──────────────────────────────────────
  const conjectures = blocks.filter(b => b.kind === "conjecture");
  const conjByLabel = new Map<string, Block>();
  for (const b of conjectures) if (b.label) conjByLabel.set(b.label, b);

  const external = conjectures.filter(b => b.external);
  const qouOriginal = conjectures.filter(b => !b.external);
  const primary = qouOriginal.filter(
    b => !b.label || !coneTouchesConjecture(b.label, conjByLabel),
  );
  const dependent = qouOriginal.filter(
    b => b.label && coneTouchesConjecture(b.label, conjByLabel),
  );
  const primaryAxiom = primary.filter(b => b.leanFile && b.leanHasClass);
  const allAxiom = conjectures.filter(b => b.leanFile && b.leanHasClass);

  const defs = blocks.filter(b => b.kind === "definition");
  const defsWithFile = defs.filter(b => b.leanFile);

  const pct = (n: number, d: number) => d === 0 ? 0 : Math.round((n / d) * 1000) / 10;

  return {
    paper: paperDir,
    generated_at: new Date().toISOString(),
    total_blocks: blocks.length,
    by_kind: byKind,
    provable: {
      total: provable.length,
      with_lean_field: provableWithField.length,
      with_lean_file: provableWithFile.length,
      sorry_free: provableSorryFree.length,
      percent_sorry_free: pct(provableSorryFree.length, provable.length),
    },
    conjectures: {
      total: conjectures.length,
      external: external.length,
      qou_original: qouOriginal.length,
      primary: primary.length,
      dependent: dependent.length,
      primary_class_axiomatized: primaryAxiom.length,
      percent_primary_class_axiomatized: pct(primaryAxiom.length, primary.length),
      class_axiomatized: allAxiom.length,
    },
    definitions: {
      total: defs.length,
      with_lean_file: defsWithFile.length,
    },
  };
}

// ── CLI ─────────────────────────────────────────────────────────────

/** Parse a `--flag value` pair from argv; returns the value, or null if the
 *  flag is missing OR the index is the last element (no value follows). */
function flagValue(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx < 0 || idx + 1 >= args.length) return null;
  const next = args[idx + 1];
  // Reject values that look like another flag — defensive against missing values.
  if (next.startsWith("--")) return null;
  return next;
}

/** Resolve the content root: explicit flag → $PWD/content → <repo>/content. */
function resolveContentRoot(args: string[]): string {
  const explicit = flagValue(args, "--content-root");
  if (explicit) return resolve(explicit);
  const cwdContent = resolve(process.cwd(), "content");
  if (existsSync(cwdContent)) return cwdContent;
  return join(SCRIPT_REPO_ROOT, "content");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const paper = flagValue(args, "--paper") || "quantum-observable-universe";
  const jsonOnly = args.includes("--json");
  const outPath = flagValue(args, "--out");
  const contentRoot = resolveContentRoot(args);

  const stats = computeStats(paper, contentRoot);

  if (jsonOnly) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log(`Lean coverage — paper: ${stats.paper}`);
    console.log(`Content root: ${contentRoot}`);
    console.log(`Generated: ${stats.generated_at}`);
    console.log(`Total blocks: ${stats.total_blocks}`);
    console.log(``);
    console.log(`Provable (theorem/lemma/proposition/corollary):`);
    console.log(`  total: ${stats.provable.total}`);
    console.log(`  with .lean (sibling or ref): ${stats.provable.with_lean_file}`);
    console.log(`  sorry-free (full proof): ${stats.provable.sorry_free} (${stats.provable.percent_sorry_free}%)`);
    console.log(``);
    console.log(`Conjectures (total ${stats.conjectures.total}):`);
    console.log(`  external (tier:famous, excluded): ${stats.conjectures.external}`);
    console.log(`  QOU-original: ${stats.conjectures.qou_original}`);
    console.log(`    primary (open questions): ${stats.conjectures.primary}`);
    console.log(`    dependent (conditional): ${stats.conjectures.dependent}`);
    console.log(`  primary class-axiomatised: ${stats.conjectures.primary_class_axiomatized} (${stats.conjectures.percent_primary_class_axiomatized}%)`);
    console.log(``);
    console.log(`Definitions:`);
    console.log(`  total: ${stats.definitions.total}`);
    console.log(`  with .lean sibling: ${stats.definitions.with_lean_file}`);
  }

  if (outPath) {
    writeFileSync(outPath, JSON.stringify(stats, null, 2));
    if (!jsonOnly) console.error(`\nWrote: ${outPath}`);
  }
}

export { computeStats, resolveLeanFile, inspectLean };
export type { Stats };
