#!/usr/bin/env bun
/**
 * Conjectural-propagation audit (CLAUDE.md §3b + §3b-cond).
 *
 * Walks every block manifest under
 * content/quantum-observable-universe/, builds the uses[] graph,
 * and reports every `theorem`/`proposition`/`lemma`/`corollary`
 * block whose uses[] cone transitively touches a `conj:` label.
 *
 * Per CLAUDE.md §3b: such blocks must be `conjecture` (or recast as
 * `remark` with `interprets:`).
 *
 * §3b-cond exception (Option B substrate-axiom classification): a
 * provable block may keep its kind iff every conjecture in its
 * transitive cone has been **class-axiomatised** (Lean `class`
 * declaration in the conjecture's `.lean` file). The audit
 * separates such blocks into a "conditional-on-class" classification.
 *
 * Definitions are exempt — they name constructions, not logical
 * claims.
 */
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { leanPackageByName } from "../../schemas/lean-packages.ts";

// Resolve repo root from this script's location:
// content/pipeline/conjectural-propagation-audit.ts → repo root.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const ROOT = join(REPO_ROOT, "content/quantum-observable-universe");
const WITNESS_OUT = process.argv[2] ??
  join(REPO_ROOT, "docs/audits/2026-05-01-p3-1-conjectural-propagation.witness.json");

interface Block {
  label: string;
  kind: string;
  uses: string[];
  file: string;
}

const PROVABLE = new Set(["theorem", "proposition", "lemma", "corollary"]);

/**
 * Detect whether a conjecture has been class-axiomatised per
 * CLAUDE.md §3b-cond. Returns true iff EITHER:
 *   (a) the `.lean` sibling contains a `class` declaration, OR
 *   (b) the lean.ref-resolved file under `<paper>/lean/<Decl/Path>.lean`
 *       contains a `class` declaration.
 *
 * The fallback (b) is needed because not every block keeps its
 * Lean implementation as a direct sibling — many live under the
 * Lake-package directory structure (qou:QOU.X.Y → lean/QOU/X/Y.lean).
 */
async function isClassAxiomatised(conjBlock: Block): Promise<boolean> {
  const checkText = (text: string) => /\bclass\s+\w+/.test(text);

  // (a) sibling .lean
  const sibling = conjBlock.file.replace(/\.ts$/, ".lean");
  try {
    const text = await readFile(sibling, "utf8");
    if (checkText(text)) return true;
  } catch { /* sibling absent — try (b) */ }

  // (b) lean.ref path: parse the .ts for `ref: "<pkg>:<Decl.Path>"`
  // and resolve <pkg> via the LEAN_PACKAGES registry to get the
  // Lake-root directory (e.g. "content/quantum-observable-universe/lean").
  try {
    const tsText = await readFile(conjBlock.file, "utf8");
    const refMatch = tsText.match(/ref:\s*"([^:"]+):([^"]+)"/);
    if (!refMatch) return false;
    const pkgName = refMatch[1];
    const declPath = refMatch[2];           // e.g. "QOU.Archimedean.Foo"
    const pkg = leanPackageByName(pkgName);
    if (!pkg) return false;
    const leanFile = join(
      REPO_ROOT,
      pkg.lakeRoot,
      declPath.replace(/\./g, "/") + ".lean",
    );
    const text = await readFile(leanFile, "utf8");
    return checkText(text);
  } catch {
    return false;
  }
}

async function loadAll(): Promise<Map<string, Block>> {
  const blocks = new Map<string, Block>();
  // Walk every directory under ROOT.
  const dirs = await readdir(ROOT, { withFileTypes: true });
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const dirPath = join(ROOT, d.name);
    const files = await readdir(dirPath);
    for (const f of files) {
      if (!f.endsWith(".ts")) continue;
      const path = join(dirPath, f);
      const text = await readFile(path, "utf8");
      // Crude but sufficient parse: find the builder name and the
      // label / uses fields. Avoid running TS — too slow + needs deps.
      const builderMatch = text.match(
        /export default (definition|theorem|proposition|lemma|corollary|conjecture|remark|prose|equation|diagram|example|simulator)\(/,
      );
      if (!builderMatch) continue;
      const kind = builderMatch[1];
      const labelMatch = text.match(/label:\s*"([^"]+)"/);
      if (!labelMatch) continue;
      const label = labelMatch[1];
      // Extract uses[] — find first `uses: [` and read until matching `]`.
      const usesIdx = text.indexOf("uses:");
      let uses: string[] = [];
      if (usesIdx >= 0) {
        const afterUses = text.slice(usesIdx);
        const arrStart = afterUses.indexOf("[");
        const arrEnd = afterUses.indexOf("]", arrStart);
        if (arrStart >= 0 && arrEnd > arrStart) {
          const arr = afterUses.slice(arrStart + 1, arrEnd);
          uses = [...arr.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
        }
      }
      blocks.set(label, { label, kind, uses, file: path });
    }
  }
  return blocks;
}

function transitivelyTouchesConjecture(
  start: string,
  blocks: Map<string, Block>,
  cache: Map<string, Set<string>>,
): Set<string> {
  if (cache.has(start)) return cache.get(start)!;
  const visited = new Set<string>();
  const conjAncestors = new Set<string>();
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    const block = blocks.get(cur);
    if (!block) continue;
    for (const u of block.uses) {
      // Skip cross-paper / external refs (paper-dir:label or https).
      if (u.includes(":") && !u.startsWith("conj:") && !u.startsWith("def:")
          && !u.startsWith("thm:") && !u.startsWith("prop:")
          && !u.startsWith("lem:") && !u.startsWith("cor:")
          && !u.startsWith("rem:") && !u.startsWith("ex:")
          && !u.startsWith("sim:") && !u.startsWith("eq:")) {
        continue; // qualified cross-paper ref or URL
      }
      if (u.startsWith("conj:")) conjAncestors.add(u);
      if (!visited.has(u)) stack.push(u);
    }
  }
  cache.set(start, conjAncestors);
  return conjAncestors;
}

const blocks = await loadAll();
console.log(`Loaded ${blocks.size} blocks.`);

// Build set of class-axiomatised conjectures (per §3b-cond).
// Parallelize file I/O — sequential await would scale poorly with
// the number of conjectures.
const classAxiomatised = new Set<string>();
await Promise.all(
  [...blocks].filter(([_, block]) => block.kind === "conjecture")
    .map(async ([label, block]) => {
      if (await isClassAxiomatised(block)) classAxiomatised.add(label);
    })
);
console.log(`Class-axiomatised conjectures (§3b-cond eligible): ${classAxiomatised.size}`);
for (const c of [...classAxiomatised].sort()) console.log(`  ${c}`);

const cache = new Map<string, Set<string>>();
const violators: { label: string; kind: string; conj: string[]; file: string }[] = [];
const conditional: { label: string; kind: string; conj: string[]; file: string }[] = [];
for (const [label, block] of blocks) {
  if (!PROVABLE.has(block.kind)) continue;
  const conjAncestors = transitivelyTouchesConjecture(label, blocks, cache);
  if (conjAncestors.size === 0) continue;
  // §3b-cond eligible iff every conjecture in cone is class-axiomatised
  const allClassAxiomatised = [...conjAncestors].every((c) =>
    classAxiomatised.has(c));
  const entry = {
    label,
    kind: block.kind,
    conj: [...conjAncestors],
    file: block.file.replace(REPO_ROOT + "/", ""),
  };
  if (allClassAxiomatised) conditional.push(entry);
  else violators.push(entry);
}

violators.sort((a, b) => a.label.localeCompare(b.label));
conditional.sort((a, b) => a.label.localeCompare(b.label));
console.log(`\nViolators (cone touches non-class-axiomatised conjecture): ${violators.length}`);
console.log(`Conditional-on-class (cone fully class-axiomatised): ${conditional.length}`);
console.log();
if (conditional.length > 0) {
  console.log(`--- Conditional-on-class (eligible under §3b-cond) ---`);
  for (const v of conditional.slice(0, 20)) {
    console.log(`  ${v.kind.padEnd(11)} ${v.label.padEnd(60)} via {${v.conj.join(", ")}}`);
  }
  if (conditional.length > 20) console.log(`  … (${conditional.length - 20} more)`);
  console.log();
}
console.log(`--- Violators (require demotion to conjecture or class-axiomatisation) ---`);
for (const v of violators.slice(0, 20)) {
  console.log(`  ${v.kind.padEnd(11)} ${v.label.padEnd(60)} via {${v.conj.slice(0, 3).join(", ")}${v.conj.length > 3 ? ", …" : ""}}`);
}
if (violators.length > 20) console.log(`  … (${violators.length - 20} more)`);

// Also emit a witness JSON.
await Bun.write(
  WITNESS_OUT,
  JSON.stringify(
    {
      audit: "conjectural-propagation (CLAUDE.md §3b + §3b-cond)",
      generated: new Date().toISOString(),
      total_blocks: blocks.size,
      class_axiomatised_conjectures: [...classAxiomatised].sort(),
      provable_blocks_touching_conjecture:
        violators.length + conditional.length,
      violators,
      conditional_on_class: conditional,
    },
    null,
    2,
  ),
);
console.log(`\nWitness: ${WITNESS_OUT.replace(REPO_ROOT + "/", "")}`);
