#!/usr/bin/env bun
/**
 * §3b-cond conditional-class banner & hypothesis audit
 * (CLAUDE.md §3b-cond, items #2 and #3).
 *
 * For every block that the conjectural-propagation audit classifies
 * as "conditional-on-class" (i.e. a provable-kind block whose
 * uses[] cone touches only class-axiomatised conjectures), this
 * audit verifies:
 *
 *   (#2) **Lean class hypothesis** — the block's `.lean`
 *        declaration includes an `[Inst : C ...]` instance
 *        hypothesis whose class name matches one of the conjectures
 *        in the cone (per the conjecture's `class C` declaration).
 *
 *   (#3) **Narrative conditional banner** — the block's `.md`
 *        opens with a "Theorem (conditional on …)." (or
 *        Proposition/Lemma/Corollary) banner referencing at least
 *        one of the conjectures in the cone.
 *
 * Run from repo root:
 *
 *     bun run content/pipeline/conditional-class-banner-audit.ts
 *
 * Emits a witness JSON suitable for CI; non-zero exit on any
 * conditional-on-class block missing either component (when run
 * with `--strict`).
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { leanPackageByName } from "../../schemas/lean-packages.ts";
import { findContentRepoRoot } from "./repo-root";
import { requirePaper } from "./repo-root";
import { loadBlocksUnder, reportLoadFailures } from "./block-module";
import type { BlockLoadFailure } from "./block-module";
// Was rooted at this file's own location, which is the PLATFORM — but every
// path below is folio content. `findContentRepoRoot()` walks up from cwd;
// it must not use `import.meta.dir`, which resolves back through a folio's
// `folio-assistant/` symlink to the platform.
const REPO_ROOT = findContentRepoRoot();
// Was a hardcoded folio paper name in PLATFORM code; see `requirePaper`.
// `--paper <name>` (not a positional): several of these scripts already
// use argv[2] for an output path or a `--strict` flag, so a positional
// would collide. Matches `extract-status-sections.ts`.
const _paperIdx = process.argv.indexOf("--paper");
const _paperArg = _paperIdx >= 0 ? process.argv[_paperIdx + 1] : undefined;
const ROOT = join(REPO_ROOT, "content", requirePaper(_paperArg));
const STRICT = process.argv.includes("--strict");

// Optional baseline-allowlist file (declared before WITNESS_OUT so its
// path is not mistaken for the witness-output path below).
const BASELINE_IDX = process.argv.indexOf("--baseline-allowlist");
let BASELINE_PATH: string | null = null;
if (BASELINE_IDX >= 0) {
  const candidate = process.argv[BASELINE_IDX + 1];
  if (!candidate || candidate.startsWith("-")) {
    console.error(
      "Error: --baseline-allowlist requires a file path argument " +
        "(got " + (candidate ? `"${candidate}"` : "nothing") + ").",
    );
    process.exit(2);
  }
  BASELINE_PATH = candidate;
}
const EMIT_BASELINE = process.argv.includes("--emit-baseline");

const WITNESS_OUT = process.argv.find((a, i) =>
  a.endsWith(".json") && i !== BASELINE_IDX + 1
) ??
  join(REPO_ROOT, "docs/audits/2026-05-09-conditional-class-banner.witness.json");

// When --baseline-allowlist is provided alongside --strict, the gate
// fails only on **new** gaps — labels in `missing_lean_class_hypothesis`
// or `missing_md_conditional_banner` that are NOT in the allowlist.
// Use to lock in a non-zero baseline while preventing regressions.
//
// Allowlist JSON shape:
//   { "missing_lean_class_hypothesis": ["prop:foo", ...],
//     "missing_md_conditional_banner":  ["prop:bar", ...] }
//
// Regenerate the allowlist via `--emit-baseline` after deliberately
// accepting the current gap set.

interface Block {
  label: string;
  kind: string;
  uses: string[];
  file: string;
}

const PROVABLE = new Set(["theorem", "proposition", "lemma", "corollary"]);

/** Blocks that would not import. Never silently dropped — see STRICT below. */
const LOAD_FAILURES: BlockLoadFailure[] = [];

/**
 * Import each block rather than scanning its source.
 *
 * The regex this replaces listed twelve of the fifteen kinds in `Block`,
 * so `algorithm`, `proof` and `table` blocks were invisible to this
 * gate — the same drift `schemas/types.ts` documents costing ~13% of the
 * qou corpus across five other lists. Importing has no list to drift.
 */
async function loadAll(): Promise<Map<string, Block>> {
  const { blocks, failures } = await loadBlocksUnder(ROOT);
  if (reportLoadFailures(failures)) LOAD_FAILURES.push(...failures);
  return blocks;
}

/** Strip Lean comments (`/-! … -/`, `/- … -/`, `-- …`) from text. */
function stripLeanComments(s: string): string {
  return s
    .replace(/\/-[\s\S]*?-\//g, "")
    .replace(/--[^\n]*/g, "");
}

/** Find the `.lean` file backing a block.
 *
 * Resolution order:
 *   1. Sibling `.lean` next to the `.ts` — but only if it has any
 *      real Lean code (declarations after stripping comments).  A
 *      sibling that is entirely a doc-comment stub (pointing at the
 *      lake-package implementation) falls through to step 2.
 *   2. The lean.ref's lake-package path.
 *   3. The lean.ref's lake-package path with the leaf component
 *      heuristically CamelCase-d (since the QOU convention is
 *      CamelCase filenames for the lake side but content blocks
 *      sometimes register lowercase / snake_case refs).
 */
async function leanFileFor(block: Block): Promise<string | null> {
  // Step 1 — sibling, but only if it has real code.
  const sibling = block.file.replace(/\.ts$/, ".lean");
  try {
    const raw = await readFile(sibling, "utf8");
    const code = stripLeanComments(raw).trim();
    if (code.length > 0) return sibling;
  } catch {}
  // Step 2 — lean.ref literal path.
  let refTail: string | null = null;
  let lakeRoot: string | null = null;
  try {
    const tsText = await readFile(block.file, "utf8");
    const refMatch = tsText.match(/ref:\s*"([^:"]+):([^"]+)"/);
    if (!refMatch) return null;
    const pkg = leanPackageByName(refMatch[1]);
    if (!pkg) return null;
    lakeRoot = pkg.lakeRoot;
    refTail = refMatch[2];
    const leanPath = join(REPO_ROOT, lakeRoot,
      refTail.replace(/\./g, "/") + ".lean");
    await readFile(leanPath, "utf8");
    return leanPath;
  } catch {}
  // Step 3 — CamelCase the leaf component (a common naming-convention
  // mismatch in `lean.ref`s).
  if (refTail && lakeRoot) {
    const parts = refTail.split(".");
    const leaf = parts[parts.length - 1];
    const camel = leaf
      .split(/[_-]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("");
    if (camel !== leaf) {
      const camelPath = join(REPO_ROOT, lakeRoot,
        [...parts.slice(0, -1), camel].join("/") + ".lean");
      try { await readFile(camelPath, "utf8"); return camelPath; } catch {}
    }
  }
  return null;
}

/** Extract the class-name registered by a `class C` declaration.
 *  Lean comments are stripped before the regex runs so narrative
 *  phrases like "the class instance is …" inside a `/-! … -/` doc
 *  comment don't get matched as `class instance`. */
async function classNameOf(conjBlock: Block): Promise<string | null> {
  const leanPath = await leanFileFor(conjBlock);
  if (!leanPath) return null;
  const raw = await readFile(leanPath, "utf8");
  const stripped = raw
    .replace(/\/-[\s\S]*?-\//g, "")
    .replace(/--[^\n]*/g, "");
  const m = stripped.match(/^class\s+(\w+)/m);
  return m ? m[1] : null;
}

/** Transitive-conjecture cone.
 *
 * Walks `uses[]` from `start` and collects every `conj:` ancestor in the
 * dependency graph.  **Stops at every `conj:` boundary** — a downstream
 * block is conditional on the conjectures it directly transitively
 * reaches through definitions / propositions / theorems / remarks, but
 * NOT on those conjectures' own transitive conjectural ancestors. Per
 * CLAUDE.md §3b-cond, the class-hypothesis encoding makes each conjecture
 * a leaf of the conditional structure: a downstream theorem with
 * `[C]` as an instance hypothesis trusts the class as input; whatever
 * `C` itself depends on conjecturally is `C`'s own conditional structure,
 * not the consumer's.
 *
 * Historical note: an earlier version of this walk crossed `conj:`
 * boundaries, bloating the cone of every block that touched a quark
 * or electron with the entire NS-conjecture web via the
 * `conj:borromean-quark → prop:ns-obstruction-tower → conj:q-aubin-lions`
 * chain.  See PR #1197 for the fix-by-workaround (removed the manifest
 * edge); this commit restores correct cone semantics, letting the edge
 * be re-added.
 */
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
      if (u.includes(":") && !["conj:", "def:", "thm:", "prop:", "lem:",
          "cor:", "rem:", "ex:", "sim:", "eq:"].some((p) => u.startsWith(p))) {
        continue;
      }
      if (u.startsWith("conj:")) {
        // Reached a conjecture: record it as a cone leaf and STOP
        // descending into its own uses[]. (See header comment above.)
        conjAncestors.add(u);
        continue;
      }
      if (!visited.has(u)) stack.push(u);
    }
  }
  cache.set(start, conjAncestors);
  return conjAncestors;
}

const blocks = await loadAll();

// Determine the class-axiomatised set + their class names.
const classNames = new Map<string, string>();
await Promise.all(
  [...blocks].filter(([_, b]) => b.kind === "conjecture")
    .map(async ([label, b]) => {
      const name = await classNameOf(b);
      if (name) classNames.set(label, name);
    }),
);

// Walk every provable block and collect conditional-on-class entries.
const cache = new Map<string, Set<string>>();
type Finding = {
  label: string;
  kind: string;
  conj_cone: string[];
  has_lean_class_hypothesis: boolean;
  has_md_conditional_banner: boolean;
  lean_file: string | null;
  md_file: string;
};
const findings: Finding[] = [];

const BANNER_RE = /\b(Theorem|Proposition|Lemma|Corollary)\s*\(\s*conditional\s+on\b/i;

for (const [label, block] of blocks) {
  if (!PROVABLE.has(block.kind)) continue;
  const cone = transitivelyTouchesConjecture(label, blocks, cache);
  if (cone.size === 0) continue;
  const allAxiomatised = [...cone].every((c) => classNames.has(c));
  if (!allAxiomatised) continue; // not §3b-cond eligible — separate concern

  // Look up the Lean file and check for an `[Inst : C ...]` hypothesis
  // matching one of the conjectures' class names.  Strip Lean comments
  // first (consistent with classNameOf above) so narrative phrases like
  // "see [BorromeanQuark] for the class" inside a `/-! … -/` doc don't
  // count as a real hypothesis.
  const leanPath = await leanFileFor(block);
  let hasClass = false;
  if (leanPath) {
    const raw = await readFile(leanPath, "utf8");
    const text = raw
      .replace(/\/-[\s\S]*?-\//g, "")
      .replace(/--[^\n]*/g, "");
    for (const c of cone) {
      const cls = classNames.get(c);
      if (!cls) continue;
      // [Inst : ClassName ...] OR [ClassName ...] OR `(_ : ClassName ...)`
      const re = new RegExp(`\\[(?:[\\w_]+\\s*:\\s*)?${cls}\\b`);
      if (re.test(text)) { hasClass = true; break; }
    }
  }

  // Look up the md file and check for the conditional-banner.
  const mdPath = block.file.replace(/\.ts$/, ".md");
  let hasBanner = false;
  try {
    const md = await readFile(mdPath, "utf8");
    hasBanner = BANNER_RE.test(md);
  } catch {}

  findings.push({
    label,
    kind: block.kind,
    conj_cone: [...cone],
    has_lean_class_hypothesis: hasClass,
    has_md_conditional_banner: hasBanner,
    lean_file: leanPath ? leanPath.replace(REPO_ROOT + "/", "") : null,
    md_file: mdPath.replace(REPO_ROOT + "/", ""),
  });
}

findings.sort((a, b) => a.label.localeCompare(b.label));

const missingLean = findings.filter((f) => !f.has_lean_class_hypothesis);
const missingBanner = findings.filter((f) => !f.has_md_conditional_banner);
const fullyCompliant = findings.filter((f) =>
  f.has_lean_class_hypothesis && f.has_md_conditional_banner);

console.log(`§3b-cond conditional-class banner audit`);
// `witness-pipeline.yml` runs this with `--strict`, so its exit code gates.
// Over an empty corpus it finds 0 labels beyond the baseline and exits 0 —
// the same shape as `trivial-skeleton-audit` (bean `pzdv`): a gate that
// passes for free because it read nothing. Auditing nothing is a failure.
if (blocks.size === 0) {
  console.error(
    `No content blocks found under ${ROOT} — refusing to report success.\n` +
    "This audits a FOLIO's blocks; folio-assistant is the platform.\n" +
    "Run it from the content repo.",
  );
  process.exit(1);
}
console.log(`Total blocks scanned:                       ${blocks.size}`);
console.log(`Conditional-on-class candidates:            ${findings.length}`);
console.log(`  ✓ fully compliant (banner + class-hyp):   ${fullyCompliant.length}`);
console.log(`  ✗ missing Lean [Class] hypothesis:        ${missingLean.length}`);
console.log(`  ✗ missing .md conditional banner:         ${missingBanner.length}`);

if (missingLean.length > 0) {
  console.log(`\nMissing Lean [Class] hypothesis:`);
  for (const f of missingLean) {
    console.log(`  ${f.kind.padEnd(11)} ${f.label}`);
    console.log(`    cone: {${f.conj_cone.join(", ")}}`);
    console.log(`    lean: ${f.lean_file ?? "(not found)"}`);
  }
}

if (missingBanner.length > 0) {
  console.log(`\nMissing .md conditional banner:`);
  for (const f of missingBanner) {
    console.log(`  ${f.kind.padEnd(11)} ${f.label}`);
    console.log(`    md: ${f.md_file}`);
  }
}

await Bun.write(
  WITNESS_OUT,
  JSON.stringify({
    audit: "§3b-cond conditional-class banner (CLAUDE.md §3b-cond #2 + #3)",
    generated: new Date().toISOString(),
    total_blocks: blocks.size,
    conditional_on_class: findings.length,
    fully_compliant: fullyCompliant.length,
    missing_lean_class_hypothesis: missingLean.length,
    missing_md_conditional_banner: missingBanner.length,
    findings,
  }, null, 2),
);
console.log(`\nWitness: ${WITNESS_OUT.replace(REPO_ROOT + "/", "")}`);

// Optionally emit the current gap set as the baseline-allowlist file.
// Use after deliberately accepting the current count — the next strict
// run will pass iff no NEW gaps appear beyond this set.
if (EMIT_BASELINE) {
  if (!BASELINE_PATH) {
    console.error(
      "Error: --emit-baseline requires --baseline-allowlist <path> " +
        "so the baseline write target is explicit (no implicit " +
        "date-stamped default).",
    );
    process.exit(2);
  }
  // Resolve baseline write path against REPO_ROOT so behaviour
  // matches the read path (`readFile(resolve(REPO_ROOT, BASELINE_PATH))`).
  const baselineOut = resolve(REPO_ROOT, BASELINE_PATH);
  await Bun.write(
    baselineOut,
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        note: "§3b-cond conditional-class banner baseline-allowlist. " +
          "Lock-in of accepted pre-existing gaps so --strict catches " +
          "only NEW regressions. Refresh with --emit-baseline after " +
          "every deliberate gap acceptance / discharge.",
        missing_lean_class_hypothesis: missingLean.map((f) => f.label).sort(),
        missing_md_conditional_banner: missingBanner.map((f) => f.label).sort(),
      },
      null,
      2,
    ),
  );
  console.log(`\nBaseline emitted: ${baselineOut.replace(REPO_ROOT + "/", "")}`);
}

// Load baseline-allowlist if requested. Labels in the allowlist are
// not counted toward the STRICT exit code — only NEW gaps fail.
let allowedLean = new Set<string>();
let allowedBanner = new Set<string>();
if (BASELINE_PATH) {
  const resolvedBaseline = resolve(REPO_ROOT, BASELINE_PATH);
  try {
    const raw = await readFile(resolvedBaseline, "utf8");
    const parsed = JSON.parse(raw);
    allowedLean = new Set<string>(parsed.missing_lean_class_hypothesis ?? []);
    allowedBanner = new Set<string>(parsed.missing_md_conditional_banner ?? []);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(
      `\nFailed to load baseline-allowlist ${resolvedBaseline}: ${msg}`,
    );
    process.exit(2);
  }
}

const newMissingLean = missingLean.filter((f) => !allowedLean.has(f.label));
const newMissingBanner = missingBanner.filter((f) => !allowedBanner.has(f.label));
const regressionsLean = newMissingLean.length;
const regressionsBanner = newMissingBanner.length;

if (BASELINE_PATH) {
  console.log(`\nBaseline-allowlist: ${BASELINE_PATH}`);
  console.log(`  Baselined missing-Lean:    ${allowedLean.size}`);
  console.log(`  Baselined missing-banner:  ${allowedBanner.size}`);
  console.log(`  NEW missing-Lean:          ${regressionsLean}`);
  console.log(`  NEW missing-banner:        ${regressionsBanner}`);
  if (regressionsLean > 0) {
    console.log(`\nNEW Missing Lean [Class] hypothesis (regression):`);
    for (const f of newMissingLean) {
      console.log(`  ${f.kind.padEnd(11)} ${f.label}`);
    }
  }
  if (regressionsBanner > 0) {
    console.log(`\nNEW Missing .md conditional banner (regression):`);
    for (const f of newMissingBanner) {
      console.log(`  ${f.kind.padEnd(11)} ${f.label}`);
    }
  }
}

if (STRICT) {
  // A block that would not load was not audited. Passing STRICT while
  // part of the corpus went unread is the failure mode this whole gate
  // exists to prevent, so it fails instead.
  if (LOAD_FAILURES.length > 0) {
    console.error(
      `\nSTRICT mode: ${LOAD_FAILURES.length} block(s) could not be loaded and were not audited`,
    );
    process.exit(1);
  }
  const counted = BASELINE_PATH
    ? (regressionsLean + regressionsBanner)
    : (missingLean.length + missingBanner.length);
  if (counted > 0) {
    const label = BASELINE_PATH ? "regressions beyond baseline" : "compliance gaps";
    console.error(`\nSTRICT mode: ${counted} ${label}`);
    process.exit(1);
  }
}
