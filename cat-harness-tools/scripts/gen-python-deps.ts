#!/usr/bin/env bun
/**
 * Write `requirements.txt` and `requirements-extended.txt` from the declaration,
 * into this layer's declared `python/` directory — the location
 * `requirementsPath` in `cat-harness/schemas/python-deps.ts` names, and nowhere
 * else (bean `ar1s`, phase 3).
 *
 * It moved here from `cat-harness/scripts/` with the files it writes: a
 * generator in the harness writing into the tool layer above it would be a
 * wrong-direction reference by construction, whatever it was spelled as.
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
import { join } from "node:path";

import {
  DEP_TIERS,
  depsForTier,
  importNameOf,
  requirementsPath,
  type DepTier,
} from "../../cat-harness/schemas/python-deps.ts";
import { REPO_ROOT, TOOLS_ROOT } from "./lib/roots.ts";

// THIS LAYER's root, because `requirementsPath` is relative to it. The pair
// sat beside `package.json` until 2026-10-06 and moved into the declared
// `python/` directory (bean `ar1s`, phase 3); CI still installs it from the
// checkout root, as `pip install -r cat-harness-tools/python/requirements.txt`.
const ROOT = TOOLS_ROOT;

// The Dockerfile is the REPOSITORY's — its build context is the checkout.
const DOCKER_ROOT = REPO_ROOT ?? TOOLS_ROOT;

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
 * `-r <dir>/requirements.txt` — rather than parsing its package list. Any
 * directory prefix is accepted, so the root image's copy into `/tmp/` and a
 * `-r cat-harness-tools/python/requirements.txt` from the repository build
 * context (bean `ar1s`) both satisfy it. A checker that
 * re-derived the list would be a second opinion about what is installed, free
 * to disagree with the file it checks; requiring the generated file to be the
 * source removes the question instead of answering it twice.
 */
export function dockerfileInstallsDeclaredSet(root = DOCKER_ROOT): boolean {
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
