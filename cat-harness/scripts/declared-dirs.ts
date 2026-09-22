#!/usr/bin/env bun
/**
 * Print the repository-relative directories holding each named graph kind.
 *
 * @module scripts/declared-dirs
 *
 * ## Why this exists as a SEPARATE script rather than a function call
 *
 * `readDeclaration` validates EVERY kind in the declaration, not just the one
 * being asked for. This repository declares a `folio` directory whose kind is
 * registered by CORE, on importing `schemas/folio-graph-kind.ts` — and the
 * argument written on that module is that *a layer that cannot render must
 * not own the renderable kind*. So the harness layer cannot resolve ANY graph
 * kind here, because resolving one reads the whole declaration and the whole
 * declaration mentions `folio`.
 *
 * `render-pipeline.ts` is in the harness layer and needs exactly this answer
 * (bean `9c34`: a step declares the graph kinds it reads, so no step spells a
 * declared path). Its options were: spell nine paths as literals, which
 * `check:declared-paths` rejects and which go stale the moment a directory
 * moves; import core, which `check:partition` rejects; or ask across the
 * boundary the way it already does for every renderer it runs — by spawning
 * one.
 *
 * So this is the third. It is core (it imports the folio kind), it is one
 * line of output, and the pipeline parses it. **A failure prints nothing to
 * stdout and exits non-zero**, so a caller cannot mistake "could not resolve"
 * for "declares nothing" — which is the distinction the whole incremental
 * render turns on.
 *
 * Usage:
 *   bun run cat-harness/scripts/declared-dirs.ts schemas cat-harness tools
 */
import { relative, sep } from "node:path";

import { directoriesForGraph, instanceRootFor, repoRootFor } from "../schemas/cat-harness.js";

if (import.meta.main) {
  const kinds = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  if (kinds.length === 0) {
    console.error("usage: declared-dirs.ts <graph-kind>...");
    process.exit(2);
  }
  const instance = instanceRootFor(import.meta.dir);
  const repo = repoRootFor(instance);
  const out: Record<string, string[]> = {};
  for (const k of kinds) {
    out[k] = directoriesForGraph(instance, k).map((d) => relative(repo, d).split(sep).join("/")).sort();
  }
  console.log(JSON.stringify(out));
}
