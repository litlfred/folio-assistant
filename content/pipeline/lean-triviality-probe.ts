#!/usr/bin/env bun
/**
 * Triviality probe — measures whether a block's goals fall to cheap,
 * general-purpose automation.
 *
 * ## Why not Nazrin
 *
 * The `nimj` proposal was to use Nazrin (arXiv 2602.18767), a GNN
 * emitting atomic tactics on consumer hardware, as a cheap oracle: if a
 * weak prover closes the goal instantly, the statement probably carries
 * no content.
 *
 * The *idea* is right and the *dependency* is not. What the criterion
 * needs is any cheap oracle, and folio already has one — Lean's own
 * automation. `trivial`, `rfl`, `simp`, `decide`, `omega`, `aesop` are
 * available, already a dependency, version-matched to the corpus, and
 * need no research checkout or GPU. Nazrin's contribution was running
 * cheaply *without* Lean; folio has Lean.
 *
 * So this probes the ladder directly. Same cache, same criterion, no
 * new dependency.
 *
 * ## Method
 *
 * For each provable declaration in a block's `.lean`, rewrite ONLY that
 * declaration's proof body to `by <tactic>` — leaving the rest of the
 * file intact so in-file dependencies still elaborate — and run `lean`.
 * If the file elaborates clean, that tactic closed the goal.
 *
 * The ladder is ordered cheapest-first; `steps` is the 1-based rung that
 * succeeded, so `steps: 1` means `trivial` alone sufficed.
 *
 * ## What a hit means
 *
 * It is a PROMPT, not a verdict. Genuine results are sometimes
 * one-liners, and `simp` closing a goal often means the content lives in
 * the `simp` set rather than that there is no content. The output feeds
 * `proof-not-machine-trivial`, which is warn-only and `minor`.
 *
 * ## Usage
 *
 *   bun run content/pipeline/lean-triviality-probe.ts \
 *     --lake-root content/<paper>/lean --limit 20 [--out docs/audits/lean-triviality.json]
 *
 * Requires a Lean toolchain and restored oleans:
 *   scripts/lake-cache.sh restore-toolchain && scripts/lake-cache.sh restore
 *
 * @module content/pipeline/lean-triviality-probe
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { execFileSync } from "child_process";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";
import { walkBlocks } from "./qa-utils";
import { parseLeanRef, refToDecl } from "./content-graph";
import { splitDeclarations, stripLeanComments } from "./lean-atlas-ingest";
import { findContentRepoRoot } from "./repo-root";

/** Cheapest-first. Position in this list becomes `steps`. */
export const TACTIC_LADDER = ["trivial", "rfl", "simp", "decide", "omega", "aesop"];

/** Kinds whose goals are worth probing. */
const PROVABLE = /^\s*(?:@\[[^\]]*\]\s*)?(?:private\s+|protected\s+|noncomputable\s+)*(theorem|lemma)\s+/m;

/**
 * Build LEAN_PATH from a Lake root's restored packages.
 *
 * Oleans live under `.lake/build/lib/lean` in current Lake, not
 * `.lake/build/lib` — pointing at the latter finds nothing and reads as
 * "unknown module prefix", which looks like a missing dependency rather
 * than a wrong path.
 */
export function leanPathFor(lakeRoot: string): string {
  const pkgs = join(lakeRoot, ".lake", "packages");
  const out: string[] = [];
  const own = join(lakeRoot, ".lake", "build", "lib", "lean");
  if (existsSync(own)) out.push(own);
  if (existsSync(pkgs)) {
    for (const p of readdirSync(pkgs)) {
      const d = join(pkgs, p, ".lake", "build", "lib", "lean");
      if (existsSync(d)) out.push(d);
    }
  }
  return out.join(":");
}

export interface ProbeResult {
  decl: string;
  closed: boolean;
  /** 1-based rung of the ladder that closed it. */
  steps?: number;
  tactic?: string;
}

/**
 * Probe one declaration by substituting its proof body.
 *
 * Returns `undefined` when the file does not even elaborate unmodified —
 * a probe against a file that is already broken measures nothing, and
 * reporting it as "not trivial" would be a false negative dressed as a
 * result.
 */
export function probeDeclaration(
  src: string,
  declName: string,
  lakeRoot: string,
  leanBin: string,
  timeoutMs = 120_000,
): ProbeResult | undefined {
  const stripped = stripLeanComments(src);
  const decls = splitDeclarations(stripped);
  const target = decls.find((d) => d.name === declName);
  if (!target || !target.body) return undefined;

  const env = { ...process.env, LEAN_PATH: leanPathFor(lakeRoot) };
  const dir = mkdtempSync(join(tmpdir(), "triv-probe-"));
  const file = join(dir, "P.lean");

  const elaborates = (text: string): boolean => {
    writeFileSync(file, text);
    try {
      execFileSync(leanBin, [file], { env, timeout: timeoutMs, stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  };

  // Baseline: does the file elaborate as-is? If not, any probe result is
  // meaningless.
  if (!elaborates(src)) return undefined;

  // Locate the body in the ORIGINAL source. `stripped` preserves byte
  // offsets (comments are blanked, not removed), so an offset found in
  // the stripped text indexes the original correctly.
  const bodyStart = stripped.indexOf(target.body, stripped.indexOf(target.name));
  if (bodyStart < 0) return undefined;
  const bodyEnd = bodyStart + target.body.length;

  for (let i = 0; i < TACTIC_LADDER.length; i++) {
    const t = TACTIC_LADDER[i];
    const probe = src.slice(0, bodyStart) + `:= by ${t}\n` + src.slice(bodyEnd);
    if (elaborates(probe)) {
      return { decl: declName, closed: true, steps: i + 1, tactic: t };
    }
  }
  return { decl: declName, closed: false };
}

// ── CLI ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const arg = (n: string) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const lakeRoot = arg("--lake-root");
  const limit = parseInt(arg("--limit") ?? "20", 10);
  const repoRoot = findContentRepoRoot();
  const out = arg("--out") ?? join(repoRoot, "docs/audits/lean-triviality.json");
  const leanBin = arg("--lean") ?? "lean";

  if (!lakeRoot) {
    console.log(`Triviality probe — measures whether goals fall to cheap automation.

  --lake-root DIR   Lake root with restored oleans (required)
  --limit N         Blocks to probe (default 20)
  --lean PATH       lean binary (default: 'lean' on PATH)
  --out FILE        Output cache (default docs/audits/lean-triviality.json)

Ladder (cheapest first): ${TACTIC_LADDER.join(", ")}
Needs: scripts/lake-cache.sh restore-toolchain && ... restore`);
    process.exit(2);
  }

  const abs = join(repoRoot, lakeRoot);
  const searchRoot = join(repoRoot, "content");
  const decls: Record<string, unknown> = {};
  let probed = 0,
    skipped = 0,
    closed = 0;

  for (const b of walkBlocks(searchRoot)) {
    if (probed >= limit) break;
    if (!b.lean) continue;
    let src: string;
    try {
      src = readFileSync(b.lean, "utf-8");
    } catch {
      continue;
    }
    if (!PROVABLE.test(src)) continue;
    const decl = refToDecl(parseLeanRef(readFileSync(b.ts, "utf-8")));
    if (!decl) continue;
    const short = decl.split(".").pop()!;

    const r = probeDeclaration(src, short, abs, leanBin);
    if (!r) {
      skipped++;
      console.log(`  skip  ${b.label}  (file does not elaborate standalone — probe would be meaningless)`);
      continue;
    }
    probed++;
    if (r.closed) closed++;
    decls[decl] = {
      closed: r.closed,
      steps: r.steps,
      tactic: r.tactic,
      lean_path: b.lean.startsWith(repoRoot) ? b.lean.slice(repoRoot.length + 1) : b.lean,
      checked_at: new Date().toISOString(),
    };
    console.log(
      `  ${r.closed ? `CLOSED(${r.tactic}, step ${r.steps})` : "not closed"}  ${b.label}`,
    );
  }

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(
      {
        $schema: "lean-triviality/v1",
        generated_at: new Date().toISOString(),
        oracle: `lean-tactic-ladder(${TACTIC_LADDER.join("|")})`,
        decls,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `\nprobed ${probed}, closed ${closed}, skipped ${skipped} (unelaborable)\n-> ${out}`,
  );
}
