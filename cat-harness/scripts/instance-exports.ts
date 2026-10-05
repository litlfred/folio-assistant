#!/usr/bin/env bun
/**
 * One knowledge-graph export per declared instance — bean `4ak5` item 1.
 *
 * @module scripts/instance-exports
 * @covers cat-harness
 *
 * Owner, 2026-10-02: *"please make sure harnesses generate json(ld)+schema for
 * their semi-static KGs … i dont see folio-assistnat.jsonld in gh-pagaes …
 * these should be split out into their component sub-grpah/harnesses."*
 *
 * Measured on `main` 2026-10-04: fourteen directories declare an instance and
 * the site published three graphs — the host's, bootstrap's and the checkout
 * root's. The other eleven (`smart-base`, `who-iris`, `folio-assistant-core`,
 * …) had a declaration and no document, so nothing could fetch one harness on
 * its own. Each of them already exported cleanly with `kg-export --instance`
 * in one to three seconds; nothing ran the command.
 *
 * ## The set is DERIVED from the declarations, never listed
 *
 * A list of instances in a workflow is a second answer to "what is declared
 * here", and it went stale the way such lists do: every instance added since
 * `l4ay` was missing from it. So the workflows run THIS script, which asks
 * {@link instanceRootsIn}, and a new declaration is published with no edit.
 *
 * ## Published elsewhere — the only list, and each entry is CHECKED
 *
 * Three instances keep the publisher they already have, for reasons that are
 * not this bean's to overturn. {@link PUBLISHED_ELSEWHERE} names each one with
 * the command that publishes it, and `check:published-instance-exports` fails
 * when a workflow that runs this script does not also run that command — so an
 * exemption cannot outlive its publisher and leave the instance with nothing.
 *
 * Each document lands at `<out-dir>/<stub>/<stub>.jsonld`, which is the
 * `docPath` `exportIdentity` gives a foreign instance (bean `dyd3`), with the
 * `.json` alias beside it because Pages serves `.jsonld` as octet-stream.
 *
 * Usage:
 *   bun run cat-harness/scripts/instance-exports.ts --out-dir ./_site [--base-url URL]
 *   bun run cat-harness/scripts/instance-exports.ts --list
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";

import { artefactStub, instanceRootsIn, readDeclaration, repoRootFor } from "../schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/** An instance this script does not export, and the command that does. */
export interface PublishedElsewhere {
  /** Matches the publishing command in a workflow's text. */
  publisher: RegExp;
  /** Why it keeps its own publisher. */
  why: string;
}

/** Keyed by declared stub (`artefactStub`), not by path: declaration over location. */
export const PUBLISHED_ELSEWHERE: Readonly<Record<string, PublishedElsewhere>> = {
  "cat-harness": {
    // `--scope instance` is optional because it is the default, and is the
    // only scope accepted: `--scope checkout` would publish every stacked
    // instance's nodes under this name again, so it does not match.
    publisher: /kg-export\.ts\s+(?:--base-url\s+\S+\s+)?(?:--scope\s+instance\s+)?--out\s+"\.\/_site\/\$\{STUB\}\.jsonld"/,
    why:
      "the host: published at the site root as `<stub>.jsonld`, the address every published `@id` names. " +
      "Built in instance scope since bean `4ak5` item 2 (the split): its own directories only, with a " +
      "tombstone for one release at each `@id` that moved to its owner's document",
  },
  "folio-assistant": {
    publisher: /kg-export\.ts\s+--instance\s+\.\s/,
    why: "the checkout root, published by its own line since bean `l4ay`, which tests pin by name",
  },
  bootstrap: {
    publisher: /bootstrap-tools\/scripts\/export-graph\.ts\s+--root\s+\.\/bootstrap\s/,
    why: "owner ruling 2026-09-30 (bean `xsqm`): bootstrap's graph is written by bootstrap-tools' `export-graph.ts`",
  },
};

/** One instance this script exports. */
export interface PlannedExport {
  /** Repository-relative, as a workflow would spell it: `./<dir>`. */
  path: string;
  stub: string;
  /**
   * The instance declares its own `canonicalUrl`, so its document's `@id` is
   * minted against that and a `--base-url` is NOT passed: `exportIdentity`
   * puts a self-based instance at `<base>/<stub>.jsonld`, which under a
   * preview's base is a path nothing writes (measured 2026-10-04 for
   * `cat-harness-tools`, `cat-openapi`, `fhir-harness` and `smart-base`).
   * Its own address is the honest one in every build.
   */
  ownCanonical: boolean;
}

/**
 * Does this instance mint its `@id`s against its OWN `canonicalUrl`? Then the
 * deploy passes it no `--base-url` ({@link PlannedExport.ownCanonical}), and
 * anything that names a node in its published document — `kg-export`'s
 * tombstones and re-homed skill links (bean `4ak5` item 2) — must mint the
 * same way, or it names a document nobody writes.
 */
export function declaresOwnCanonical(decl: { canonicalUrl?: string } | undefined): boolean {
  return typeof decl?.canonicalUrl === "string" && decl.canonicalUrl !== "";
}

/** Every declared instance's stub, readable declarations only. */
export function declaredInstanceStubs(repo: string = REPO): Set<string> {
  const out = new Set<string>();
  for (const abs of instanceRootsIn(repo)) {
    try {
      const d = readDeclaration(abs);
      if (d) out.add(artefactStub(d));
    } catch {
      // unreadable: its own checkers report it
    }
  }
  return out;
}

/**
 * Every declared instance not in {@link PUBLISHED_ELSEWHERE}, in path order.
 * An unreadable declaration is skipped here and reported by `readDeclaration`'s
 * own checkers; the completeness gate still sees the instance, by its root.
 */
export function instanceExportPlan(repo: string = REPO): PlannedExport[] {
  const out: PlannedExport[] = [];
  for (const abs of instanceRootsIn(repo)) {
    let stub: string;
    let ownCanonical: boolean;
    try {
      const d = readDeclaration(abs);
      if (!d) continue;
      stub = artefactStub(d);
      ownCanonical = declaresOwnCanonical(d);
    } catch {
      continue;
    }
    if (stub in PUBLISHED_ELSEWHERE) continue;
    const rel = relative(repo, abs).replace(/\\/g, "/");
    out.push({ path: rel === "" ? "." : `./${rel}`, stub, ownCanonical });
  }
  return out;
}

if (import.meta.main) {
  const arg = (flag: string): string | undefined => {
    const i = process.argv.indexOf(flag);
    return i !== -1 ? process.argv[i + 1] : undefined;
  };
  const plan = instanceExportPlan();
  if (process.argv.includes("--list")) {
    for (const p of plan) console.log(`${p.path}\t${p.stub}`);
    for (const [stub, e] of Object.entries(PUBLISHED_ELSEWHERE)) console.log(`(elsewhere)\t${stub}\t${e.why}`);
    process.exit(0);
  }
  const outDir = arg("--out-dir");
  if (!outDir) {
    console.error("usage: instance-exports.ts --out-dir <dir> [--base-url <url>] | --list");
    process.exit(2);
  }
  if (plan.length === 0) {
    // Nothing declared is could-not-determine, not a clean publish.
    console.error("✗ no declared instance to export — the declarations were not found");
    process.exit(2);
  }
  const baseUrl = arg("--base-url");
  // The deploy publishes documents, not QA sidecars: those are committed and
  // compared by `kg:export:check`. A temp root keeps this run from writing
  // into the tree it publishes.
  const qaRoot = mkdtempSync(join(tmpdir(), "instance-exports-qa-"));
  let failed = 0;
  try {
    for (const p of plan) {
      const doc = join(outDir, p.stub, `${p.stub}.jsonld`);
      mkdirSync(join(outDir, p.stub), { recursive: true });
      const args = ["run", join(ROOT, "scripts", "kg-export.ts"), "--instance", p.path, "--out", doc, "--qa-root", qaRoot];
      if (baseUrl && !p.ownCanonical) args.push("--base-url", baseUrl);
      const r = spawnSync("bun", args, { cwd: REPO, encoding: "utf-8" });
      if (r.status !== 0) {
        failed++;
        console.error(`  ✗ ${p.path}: kg-export exited ${r.status}\n${(r.stderr ?? "").trim()}`);
        continue;
      }
      copyFileSync(doc, doc.replace(/\.jsonld$/, ".json"));
      console.log(`  ✓ ${p.path} → ${relative(process.cwd(), doc)}`);
    }
  } finally {
    rmSync(qaRoot, { recursive: true, force: true });
  }
  console.log(`${plan.length - failed} of ${plan.length} instance graph(s) exported; ${Object.keys(PUBLISHED_ELSEWHERE).length} published by their own step.`);
  process.exit(failed > 0 ? 1 : 0);
}
