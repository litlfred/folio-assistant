#!/usr/bin/env bun
/**
 * Write `bootstrap/bootstrap.jsonld` — the graph an agent loads before it has
 * a harness to build one with.
 *
 * @module scripts/gen-bootstrap-graph
 *
 * ## Why this file is NOT committed — and why it was, until 2026-09-20
 *
 * It was committed, and the rationale written here said its reader "has just
 * been pointed at a repository and has nothing installed", so a graph that
 * only appears after a build is one that reader never sees. It cited
 * `bootstrap/README.md` step 2: *"Load `bootstrap/bootstrap.jsonld`"*.
 *
 * **Both halves were false when checked.** The string `jsonld` appears in no
 * prose file under `bootstrap/` — the README sends a cold reader to
 * `workflows/initialize-harness.bpmn` and `skills/bootstrap-kg-navigation.md`,
 * and never to this document. And nothing published it: `docs-site.yml`
 * writes `_site/bootstrap/ns.jsonld`, the NAMESPACE document, and never
 * copied this one, so its own `@id` —
 * `<base>/bootstrap/bootstrap.jsonld` — dereferenced to nothing. That is
 * `blv9`, a link-shaped value that does not resolve, in the artefact whose
 * whole purpose is to be resolved.
 *
 * So it was 52 % of `bootstrap/` by line count, read by no documented
 * instruction, published nowhere, and byte-gated in CI. It is now BUILT AT
 * RENDER TIME into the published site, which is the first time the IRI it has
 * always claimed actually answers.
 *
 * ## Still pure, and the reason has outlived the gate
 *
 * The byte gate is gone with the committed file, but purity is not a property
 * of being gated — it is what makes a published artefact diffable and
 * cacheable, and what stops two builds of one tree disagreeing. The ordering
 * guard in `tests/bootstrap-graph.test.ts` is the one that matters and it
 * never depended on the file: it asserts the ORDER on the machine that
 * introduces a regression, not only on the one that later disagrees.
 *
 * So two fields the main export carries are still deliberately absent:
 *
 * - **`generatedAt`.** A timestamp makes every run a diff, so `--check` would
 *   fail on a tree nobody touched and be switched off within a week.
 * - **`sourceCommitSha`.** The reason it was absent — a committed generated
 *   file cannot name its own commit — no longer applies now that it is built
 *   at render time, so this one is now a DEFENSIBLE ADDITION rather than an
 *   impossibility. Left out here on purpose: adding it is a change to what
 *   the document says, not to where it is written, and the two do not belong
 *   in one commit. Tracked rather than done.
 *
 * ## What it does NOT claim to have looked at
 *
 * `omitted` carries the instance-bound collectors that were not run
 * ({@link COLLECTOR_SCOPE}), so a reader can tell *"bootstrap has no tools"*
 * from *"tools were never looked for"*. An empty section rendered as a clean
 * one is the `dh4f` defect.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readDeclaration, repoRootFor } from "../schemas/cat-harness.js";
import { buildContext, collectInstanceNodes, compact, stripNamespace } from "./kg-export.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// declared-path-literal: bootstrap is not a directory THIS instance declares —
// it is a separate instance with its own `harness.json`, and the whole point is
// that it is reachable before any declaration has been read. See the module
// docs above.
const CAT_BOOTSTRAP = join(repoRootFor(ROOT), "bootstrap");
const OUT = join(CAT_BOOTSTRAP, "bootstrap.jsonld");

const PROV = "http://www.w3.org/ns/prov#";

/** The document, as a pure function of the bootstrap instance on disk. */
export async function buildCatBootstrapDocument(
  root: string = CAT_BOOTSTRAP,
  baseUrl?: string,
): Promise<Record<string, unknown>> {
  const decl = readDeclaration(root);
  const name = decl?.name ?? "bootstrap";
  // `baseUrl` is how a STAGING build says where this copy actually lives.
  //
  // Without it the document names itself by the canonical URL whatever tree it
  // was written into, so a staged copy asserts it lives on the live site —
  // which is arguably worse than the 404 it replaces, because a reader
  // following the `@id` lands on a DIFFERENT document that looks right. Bean
  // `35kc`: staging published no namespace documents and no bootstrap graph
  // at all, so a staged knowledge-graph change had a vocabulary that
  // dereferenced to nothing. `kg-export.ts` already took `--base-url` for
  // exactly this; this generator did not, and that asymmetry is why the staging
  // fix could not just copy the live build's step.
  const base = baseUrl ?? decl?.canonicalUrl ?? `https://litlfred.github.io/folio-assistant/${name}`;
  const docIri = `${base}/${name}.jsonld`;

  const problems: string[] = [];
  const { nodes, omitted } = await collectInstanceNodes(root, docIri, "", problems);
  // SORTED BY `@id`, because this file is committed and byte-gated.
  //
  // `collectInstanceNodes` returns nodes in the order the collectors found
  // them, and the collectors walk directories — so the order is `readdirSync`
  // order, which is the FILESYSTEM's, not this repository's. Two machines
  // scanning identical trees produce identical nodes in different sequences,
  // and `it is current` compares bytes.
  //
  // Measured 2026-09-20 (bean `3jj9`): the committed file held skills as
  // `bootstrap-kg-navigation, discussion, confirm-harness, log-message` and
  // processes as `InitializeHarness, LogMessage, Discussion` — neither
  // alphabetical, both stable per machine. The check passed on the container
  // that wrote the file and failed on CI, with the same inputs and the same
  // 3433 tests.
  //
  // The neighbouring purity test — "two builds are byte-identical" — cannot
  // catch this: both builds run in ONE process against ONE filesystem, so it
  // compares an ordering against itself. It is a real guard for timestamps
  // and a guard that cannot fire for ordering.
  //
  // `@id` is the sort key rather than insertion order or type: every node has
  // one, it is unique, and it is the thing a reader dereferences.
  //
  // Compared with `<` rather than `localeCompare`, and that is not a style
  // choice. `localeCompare` with no locale argument uses the RUNTIME's
  // default, which is an environment input exactly like the filesystem
  // ordering this sort exists to remove — it would swap one cross-machine
  // nondeterminism for a subtler one. Code-unit order is the same everywhere.
  const graph = nodes
    .map(compact)
    .sort((a, b) => {
      const x = String(a["@id"]);
      const y = String(b["@id"]);
      return x < y ? -1 : x > y ? 1 : 0;
    });

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
  // `--out` so the site build can write this straight into `_site/`, the same
  // shape every other published document here uses (`kg-export`, `ns-export`,
  // `fsh-guts-export`). Without it the build would have to write into the
  // working tree and copy, which is how a build artefact ends up committed by
  // somebody running `git add -A`.
  const outFlag = process.argv.indexOf("--out");
  const out = outFlag >= 0 ? resolve(process.argv[outFlag + 1] ?? "") : OUT;
  if (outFlag >= 0 && (process.argv[outFlag + 1] ?? "").length === 0) {
    console.error("✗ --out needs a path");
    process.exit(1);
  }

  const baseFlag = process.argv.indexOf("--base-url");
  if (baseFlag >= 0 && (process.argv[baseFlag + 1] ?? "").length === 0) {
    console.error("✗ --base-url needs a URL");
    process.exit(1);
  }
  const baseUrl = baseFlag >= 0 ? process.argv[baseFlag + 1] : undefined;

  const doc = await buildCatBootstrapDocument(CAT_BOOTSTRAP, baseUrl);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");

  const counts = doc.counts as Record<string, number>;
  console.log(`bootstrap graph → ${out}`);
  for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${String(v).padStart(4)}  ${k}`);
  const problems = doc.problems as string[];
  if (problems.length > 0) for (const p of problems) console.log(`  · ${p}`);
  console.log(`  not looked for: ${(doc.omitted as string[]).join(", ")}`);
}
