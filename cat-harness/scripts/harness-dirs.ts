#!/usr/bin/env bun
/**
 * Materialise every directory this instance declares or inherits.
 *
 * The CLI face of {@link materialiseDeclaredDirectories}. Run by
 * `scripts/session-start-coord-sweep.sh` and by `init-folio`, so that a
 * declared directory exists in every checkout rather than only in the one
 * where somebody happened to create it by hand.
 *
 * Why this is a real step and not housekeeping: `AGENTS.md` records the bean
 * `dh4f` defect — "a declared-but-absent directory is where a consumer scans
 * nothing and reports a clean run over it". Absent and empty look identical to
 * a consumer, so the declaration alone converts a gap into a false pass. The
 * document-ingestion pipeline is the sharp case: the corpus checklist greps
 * `library/` and not `uploads/`, so a missing `library/` reads as "nobody has
 * ingested anything" rather than as a missing directory.
 *
 *     bun run harness:dirs            # create what is missing
 *     bun run harness:dirs --check    # report only; exit 1 if anything is missing
 *
 * @module scripts/harness-dirs
 * @covers cat-harness
 */

import { resolve } from "node:path";
import { materialiseDeclaredDirectories } from "../schemas/harness-config";

const root = resolve(import.meta.dir, "..");
const check = process.argv.includes("--check");

const results = materialiseDeclaredDirectories(root, { dryRun: check });
if (results.length === 0) {
  // Third state, reported as itself. No declaration is legitimate — an
  // unmigrated instance falls back to today's conventions — and must not be
  // rendered as "all directories present".
  console.log(
    "harness dirs: this instance declares no directories (no <name>.json, " +
      "or it declares none). Nothing to materialise; not the same as nothing missing.",
  );
  process.exit(0);
}

const missing = results.filter((r) => r.created);
for (const r of results) {
  // The DECLARED path plus its scope, not `relative(root, absPath)`: that
  // renders a repository-scoped entry as `../beans`, which reads as a
  // traversal somebody wrote rather than as the name `beans/` under the root
  // the declaration names.
  const where = r.path.replace(/\/+$/, "") || ".";
  const scope = r.scope === "repository" ? " (repo)" : "";
  const state = r.created ? (check ? "MISSING" : "created") : "ok";
  const marker = r.markerWritten ? "  +keep-marker" : "";
  console.log(`  ${state.padEnd(8)} ${(where + scope).padEnd(22)} ${r.declaredBy}${marker}`);
}

console.log(
  `\nharness dirs: ${results.length} declared, ${missing.length} ${
    check ? "missing" : "created"
  }.`,
);
if (check && missing.length > 0) process.exit(1);
