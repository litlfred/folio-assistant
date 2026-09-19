#!/usr/bin/env bun
/**
 * Loader + query for the refactoring-strategy database.
 *
 * Turns `content/pipeline/refactor-strategies/*.json` into a
 * version-gated set of candidate rewrites, so `proof-simplifier` can
 * ask "what may I safely apply to a corpus on Lean X?" instead of
 * consulting a prose table that knows nothing about versions.
 *
 * See `schemas/refactor-strategy.ts` for the contract, and
 * `docs/proposals/llm-authoring-tool-integration.md` §5 for why the
 * version metadata is the point.
 *
 * Usage:
 *   bun run content/pipeline/refactor-strategy.ts --lean 4.24.0
 *   bun run content/pipeline/refactor-strategy.ts --lean 4.24.0 --applicable
 *   bun run content/pipeline/refactor-strategy.ts --json
 *
 * @module content/pipeline/refactor-strategy
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  isApplicableAt,
  type RefactorStrategy,
  type RefactorStrategyFile,
} from "../../schemas/refactor-strategy";
import { findContentRepoRoot } from "./repo-root";

const STRATEGY_DIR_REL = "content/pipeline/refactor-strategies";

/**
 * Load every strategy file.
 *
 * Looks in the content repo first, then falls back to the
 * folio-assistant tree — a content repo may curate its own strategies
 * (corpus-specific idioms) on top of the shipped defaults.
 */
export function loadStrategies(repoRoot?: string): RefactorStrategy[] {
  const roots = [
    join(repoRoot ?? findContentRepoRoot(), STRATEGY_DIR_REL),
    join(import.meta.dir, "refactor-strategies"),
  ];
  const seen = new Set<string>();
  const out: RefactorStrategy[] = [];
  for (const dir of roots) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).sort()) {
      if (!f.endsWith(".json")) continue;
      let parsed: RefactorStrategyFile;
      try {
        parsed = JSON.parse(readFileSync(join(dir, f), "utf-8"));
      } catch {
        continue;
      }
      for (const s of parsed.strategies ?? []) {
        // First definition wins, so a content repo can shadow a
        // shipped strategy by id without editing folio-assistant.
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        out.push(s);
      }
    }
  }
  return out;
}

/**
 * Read the Lean version a content repo pins, from its `lean-toolchain`.
 *
 * Returns `undefined` when there is no pin — callers must then decline
 * to auto-apply anything rather than guess a version.
 */
export function pinnedLeanVersion(repoRoot?: string): string | undefined {
  const p = join(repoRoot ?? findContentRepoRoot(), "lean-toolchain");
  if (!existsSync(p)) return undefined;
  const raw = readFileSync(p, "utf-8").trim();
  return raw.match(/v?(\d+\.\d+(?:\.\d+)?)\s*$/)?.[1];
}

/**
 * Strategies safe to apply at `version`.
 *
 * Strict by default — a strategy with no declared version range is
 * excluded, because "unknown" must not read as "fine". Pass
 * `strict: false` only to build a candidate list for a human.
 */
export function applicableStrategies(
  version: string,
  strict = true,
  repoRoot?: string,
): RefactorStrategy[] {
  return loadStrategies(repoRoot).filter((s) => isApplicableAt(s, version, strict));
}

// ── CLI ─────────────────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const onlyApplicable = args.includes("--applicable");
  const li = args.indexOf("--lean");
  const repoRoot = findContentRepoRoot();
  const version = li !== -1 && args[li + 1] ? args[li + 1] : pinnedLeanVersion(repoRoot);

  const all = loadStrategies(repoRoot);
  if (json) {
    console.log(
      JSON.stringify(
        {
          version: version ?? null,
          total: all.length,
          strategies: version
            ? all.map((s) => ({ ...s, applicable: isApplicableAt(s, version) }))
            : all,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`refactor strategies: ${all.length} loaded`);
    if (!version) {
      console.log(
        `  no Lean version given and no lean-toolchain found — cannot\n` +
          `  version-gate. Pass --lean X.Y.Z. Nothing should be auto-applied\n` +
          `  without a version.`,
      );
    } else {
      console.log(`  gating at Lean ${version}\n`);
      const byConf: Record<string, number> = {};
      for (const s of all) byConf[s.confidence] = (byConf[s.confidence] ?? 0) + 1;
      console.log(`  by confidence: ${JSON.stringify(byConf)}\n`);
      for (const s of all) {
        const ok = isApplicableAt(s, version);
        if (onlyApplicable && !ok) continue;
        console.log(`  [${ok ? "ok " : "NO "}] ${s.id}  (${s.confidence}, ${s.objectives.join("/")})`);
        console.log(`         ${s.description}`);
        if (s.caveat) console.log(`         caveat: ${s.caveat}`);
      }
      const auto = all.filter((s) => isApplicableAt(s, version) && s.confidence === "verified");
      console.log(
        `\n  ${auto.length} verified + applicable (agent may apply, compile-checked).` +
          `\n  Everything else is a suggestion for a human.`,
      );
    }
  }
}
