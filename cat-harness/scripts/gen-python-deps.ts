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
 *
 * @covers code
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  DEP_TIERS,
  depsForTier,
  importNameOf,
  requirementsPath,
  type DepTier,
} from "../schemas/python-deps.ts";
import { repoRootFor } from "../schemas/cat-harness.js";

// THE REPOSITORY root. `requirements.txt` sits beside `package.json` and is
// installed by CI as `pip install -r requirements.txt` from the checkout
// root, so it is a repository artefact in the same class as the package
// manifest — not the instance's, even though the scripts that import these
// packages are. Arrived from main as `resolve(import.meta.dir, "..")`,
// correct there because the two roots were one directory.
const ROOT = repoRootFor(resolve(import.meta.dir, ".."));

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
    // `imports:` is STRUCTURED, not prose — `scripts/tests/python-deps-importable.test.py`
    // parses it. The mapping from a distribution to the module it provides was
    // written down in English only ("Imports as `yaml`"), which is unreadable to
    // the one check that could falsify it. Emitted for EVERY package, including
    // the ones where it equals the distribution name: a parser with a default
    // path cannot tell a missing line from an unremarkable one.
    return [`# ${d.distribution}: ${note}`, `# imports: ${importNameOf(d)}`, d.distribution, ""];
  });
  return [...head, ...body].join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

/**
 * Does the Dockerfile install the DECLARED set, rather than a list retyped
 * beside it?
 *
 * Added 2026-09-21 after the two diverged in silence. The Dockerfile carried a
 * hand-maintained pip list that omitted 6 of the 10 declared packages —
 * `cffi`, `cryptography`, `pymupdf`, `pillow`, `pdfminer.six`, `pdfplumber` —
 * and the omission was invisible because `--check` only ever compared
 * `requirements.txt` against this schema. Both were internally consistent;
 * nothing asked whether the IMAGE installed what they agreed on.
 *
 * The cost is on `requirements.txt` itself, which has documented it since
 * 2026-09-19: without `cffi`, importing `cryptography` raises
 * `ModuleNotFoundError: _cffi_backend` and then panics under pyo3, so every
 * PDF backend fails at import time. The knowledge was written down and the
 * image did not read it.
 *
 * This asserts the WEAK property deliberately — that the Dockerfile installs
 * `-r requirements.txt` — rather than parsing its package list. A checker that
 * re-derived the list would be a second opinion about what is installed, free
 * to disagree with the file it checks; requiring the generated file to be the
 * source removes the question instead of answering it twice.
 */
export function dockerfileInstallsDeclaredSet(root = ROOT): boolean {
  const p = join(root, "Dockerfile");
  if (!existsSync(p)) return true; // no Dockerfile is not a drift finding
  const df = readFileSync(p, "utf-8");
  return /pip3?\s+install[^\n]*-r\s+\S*requirements\.txt/.test(df);
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
    if (!dockerfileInstallsDeclaredSet()) {
      console.error("✗ the Dockerfile does not install the declared set (`pip install -r requirements.txt`).");
      console.error("  A list retyped beside the generated one drifts, and did: it omitted cffi,");
      console.error("  cryptography, pymupdf, pillow, pdfminer.six and pdfplumber. Without cffi,");
      console.error("  importing cryptography panics and every PDF backend fails at import.");
      process.exit(1);
    }
    console.log(`✓ ${DEP_TIERS.length} requirements file(s) current with schemas/python-deps.ts`);
    console.log("✓ the Dockerfile installs the declared set rather than retyping it");
    process.exit(0);
  }
  for (const tier of DEP_TIERS) {
    const p = join(ROOT, requirementsPath(tier));
    writeFileSync(p, requirementsBody(tier), "utf-8");
    console.log(`wrote ${requirementsPath(tier)}  (${depsForTier(tier).length} package(s))`);
  }
}
