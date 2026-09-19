#!/usr/bin/env bun
/**
 * Write `bootstrap/bootstrap.jsonld` — the graph an agent loads before it has
 * a harness to build one with.
 *
 * @module scripts/gen-bootstrap-graph
 *
 * ## Why this file is COMMITTED when `_kg/` is not
 *
 * `_kg/<stub>.jsonld` is gitignored: it is a build artefact, regenerated on
 * every build, and nothing needs it in a fresh clone. Bootstrap's graph is the
 * opposite case and for the reason bootstrap exists at all — its reader has
 * **just been pointed at a repository and has nothing installed**. It cannot
 * run `bun install`, let alone `bun run kg:export`, so a graph that only
 * appears after a build is a graph that reader never sees.
 *
 * `bootstrap/README.md` step 2 says *"Load `bootstrap/bootstrap.jsonld`"*. For
 * that instruction to be true in a fresh clone, the file has to be in the
 * clone.
 *
 * ## Committed means gated, and gated means PURE
 *
 * A generated file that is committed drifts from its inputs unless something
 * checks — this repository's standing rule, and `--check` is that something.
 * Which forces a property the build artefact does not need: **the output must
 * be a pure function of its inputs.**
 *
 * So two fields the main export carries are deliberately absent:
 *
 * - **`generatedAt`.** A timestamp makes every run a diff, so `--check` would
 *   fail on a tree nobody touched and be switched off within a week.
 * - **`sourceCommitSha`.** A committed generated file *cannot* carry its own
 *   commit: the best it could name is the commit BEFORE the one containing
 *   it, which is wrong by construction and invites a consumer to check out a
 *   commit where this file says something else. Its provenance is that it is
 *   IN the repository — git already answers "which commit is this" exactly.
 *
 * ## What it does NOT claim to have looked at
 *
 * `omitted` carries the instance-bound collectors that were not run
 * ({@link COLLECTOR_SCOPE}), so a reader can tell *"bootstrap has no tools"*
 * from *"tools were never looked for"*. An empty section rendered as a clean
 * one is the `dh4f` defect.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import { buildContext, collectInstanceNodes, compact, stripNamespace } from "./kg-export.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// declared-path-literal: bootstrap is not a directory THIS instance declares —
// it is a separate instance with its own `harness.json`, and the whole point is
// that it is reachable before any declaration has been read. See the module
// docs above.
const BOOTSTRAP = join(repoRootFor(ROOT), "bootstrap");
const OUT = join(BOOTSTRAP, "bootstrap.jsonld");

const PROV = "http://www.w3.org/ns/prov#";

/** The document, as a pure function of the bootstrap instance on disk. */
export async function buildBootstrapDocument(
  root: string = BOOTSTRAP,
): Promise<Record<string, unknown>> {
  const decl = readDeclaration(root);
  const name = decl?.name ?? "bootstrap";
  const docIri = `${decl?.canonicalUrl ?? `https://litlfred.github.io/folio-assistant/${name}`}/${name}.jsonld`;

  const problems: string[] = [];
  const { nodes, omitted } = await collectInstanceNodes(root, docIri, "", problems);
  const graph = nodes.map(compact);

  const counts: Record<string, number> = {};
  for (const n of graph) {
    const t = stripNamespace(String(n["@type"]));
    counts[t] = (counts[t] ?? 0) + 1;
  }

  return {
    "@context": buildContext(),
    "@id": docIri,
    "@type": `${PROV}Entity`,
    repository: name,
    counts,
    problems,
    // Not "nothing found" — never looked for. See the module docs.
    omitted,
    "@graph": graph,
  };
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const doc = await buildBootstrapDocument();
  const next = JSON.stringify(doc, null, 2) + "\n";

  if (check) {
    if (!existsSync(OUT)) {
      console.error(`✗ ${OUT} is missing — run \`bun run bootstrap:graph\``);
      process.exit(1);
    }
    if (readFileSync(OUT, "utf-8") !== next) {
      console.error(`✗ bootstrap/bootstrap.jsonld is stale — run \`bun run bootstrap:graph\``);
      process.exit(1);
    }
    console.log(`✓ bootstrap/bootstrap.jsonld is current (${Object.keys(doc.counts as object).length} node kinds)`);
    process.exit(0);
  }

  writeFileSync(OUT, next);
  const counts = doc.counts as Record<string, number>;
  console.log(`bootstrap graph → bootstrap/bootstrap.jsonld`);
  for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);
  const problems = doc.problems as string[];
  if (problems.length > 0) for (const p of problems) console.log(`  · ${p}`);
  console.log(`  not looked for: ${(doc.omitted as string[]).join(", ")}`);
}
