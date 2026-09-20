#!/usr/bin/env bun
/**
 * Write `requirements.txt` and `requirements-extended.txt` from the declaration.
 *
 * Bean `68dt`. `schemas/python-deps.ts` is definitional; these are downstream,
 * the same carrier split the schema modules use (`harness-schema-export.ts`
 * does it for JSON Schema). pip cannot read TypeScript, and the declaration
 * carries two things a flat list cannot — the import name a distribution
 * provides, and why a package has no import at all — so the file is generated
 * rather than authored.
 *
 * `--check` fails when either file is stale, which is what stops the generated
 * artefact and its source drifting apart. Without it the pair is two
 * declarations of one fact, which is the defect the split exists to avoid.
 *
 *   bun run deps:python          # write both files
 *   bun run deps:python:check    # fail if either is stale
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { DEP_TIERS, depsForTier, requirementsPath, type DepTier } from "../schemas/python-deps.ts";

const ROOT = resolve(import.meta.dir, "..");

/** The file body for one tier. Deterministic, so `--check` compares bytes. */
export function requirementsBody(tier: DepTier): string {
  const deps = [...depsForTier(tier)].sort((a, b) => a.distribution.localeCompare(b.distribution));
  const head = [
    "# GENERATED — do not edit.",
    "# Source: schemas/python-deps.ts (bean 68dt). Regenerate: bun run deps:python",
    "#",
    tier === "lean"
      ? "# The set CI installs. Everything a gate can exercise."
      : "# NOT installed in CI. Declared so the cost is visible rather than implied;",
    tier === "lean" ? "#" : "# see each entry's reason in schemas/python-deps.ts.",
    "",
  ];
  const body = deps.flatMap((d) => {
    // The `why` travels with the package. A requirements file is where
    // somebody lands when an install fails, and "what is this for" is the
    // question they have — answering it in the source file only would make
    // this artefact the less useful of the two.
    const note = d.transitive ? `${d.why} (no direct import)` : d.why;
    return [`# ${d.distribution}: ${note}`, d.distribution, ""];
  });
  return [...head, ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function staleTiers(root = ROOT): DepTier[] {
  return DEP_TIERS.filter((tier) => {
    const p = join(root, requirementsPath(tier));
    if (!existsSync(p)) return true;
    return readFileSync(p, "utf-8") !== requirementsBody(tier);
  });
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  if (check) {
    const stale = staleTiers();
    if (stale.length > 0) {
      console.error(`✗ ${stale.length} requirements file(s) stale: ${stale.map(requirementsPath).join(", ")}`);
      console.error("  Run: bun run deps:python");
      process.exit(1);
    }
    console.log(`✓ ${DEP_TIERS.length} requirements file(s) current with schemas/python-deps.ts`);
    process.exit(0);
  }
  for (const tier of DEP_TIERS) {
    const p = join(ROOT, requirementsPath(tier));
    writeFileSync(p, requirementsBody(tier), "utf-8");
    console.log(`wrote ${requirementsPath(tier)}  (${depsForTier(tier).length} package(s))`);
  }
}
