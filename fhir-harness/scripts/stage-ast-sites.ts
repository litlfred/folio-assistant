#!/usr/bin/env bun
/**
 * List the IG instances whose source repository carries an IG Publisher AST
 * cache, one line each, tab-separated: `<instance-dir> <clone-url> <label> <chrome-owner|->`.
 *
 * @module fhir-harness/scripts/stage-ast-sites
 * @covers fhir-artifact-index
 *
 * The staging workflow names no IG (see its "Build each IG's own site" step):
 * which IGs are rendered is DATA. Here the data is two facts the repository
 * already holds and one it asks the IG's repository for:
 *
 * - the instance has a `fhir-artifact-index/` (it is an IG instance);
 * - its declaration names the IG's `repository` (`owner/repo`);
 * - that repository has a `cat/fhir-harness/fhir-ast/*`, `cat-fhir-ast/*` or
 *   `fhir-ast/*` branch (`git ls-remote`; the final `cat/<harness>/` scheme lands
 *   with bean tlk2, and every name is read until then), i.e. a
 *   seeded AST cache `ig-cache.sh restore` can fetch.
 *
 * An instance with no AST branch is skipped AND SAID to be, on stderr: a
 * preview that silently lacks an AST site cannot be told from one whose
 * pipeline broke.
 *
 * The fourth column is the instance that owns the template chrome, also as
 * data: the instance's own `fhir-artifact-index/chrome.json` if it has one,
 * else the ONE instance in the repository that holds one, else `-` (none,
 * and the page generator says the chrome is absent).
 *
 * Nothing here may know about WHO (fhir-harness/AGENTS.md).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { declarationPathIn } from "../../cat-harness/schemas/cat-harness.js";

const ROOT = resolve(import.meta.dir, "..", "..");

/** Which instance owns the template chrome for `instance`, or undefined. */
export function chromeOwnerFor(root: string, instance: string, all: string[]): string | undefined {
  const has = (i: string) => existsSync(join(root, i, "fhir-artifact-index", "chrome.json"));
  if (has(instance)) return instance;
  const holders = all.filter(has);
  return holders.length === 1 ? holders[0] : undefined;
}

/** The IG instances under `root` that declare a source repository. */
export function igInstances(root: string): { instance: string; repository: string; label: string }[] {
  const out: { instance: string; repository: string; label: string }[] = [];
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    const dir = join(root, e.name);
    const index = join(dir, "fhir-artifact-index", "index.json");
    if (!existsSync(index)) continue;
    const decl = declarationPathIn(dir);
    if (!decl || !existsSync(decl)) continue;
    let repository: string | undefined;
    try {
      repository = (JSON.parse(readFileSync(decl, "utf-8")) as { repository?: string }).repository;
    } catch {
      continue;
    }
    if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) continue;
    let packageId: string | undefined;
    try {
      packageId = (JSON.parse(readFileSync(index, "utf-8")) as { packageId?: string }).packageId;
    } catch {
      // the index is the gate's business, not this lister's
    }
    out.push({ instance: e.name, repository, label: `${packageId ?? e.name} (AST build)` });
  }
  return out.sort((a, b) => a.instance.localeCompare(b.instance));
}

if (import.meta.main) {
  const igs = igInstances(ROOT);
  const names = igs.map((i) => i.instance);
  for (const ig of igs) {
    const url = `https://github.com/${ig.repository}`;
    const ls = spawnSync("git", ["ls-remote", "--heads", url, "refs/heads/cat/fhir-harness/fhir-ast/*", "refs/heads/cat-fhir-ast/*", "refs/heads/fhir-ast/*"], { encoding: "utf-8", timeout: 60_000 });
    if (ls.status !== 0) {
      console.error(`could not determine: ${ig.instance} — git ls-remote ${url} failed; no AST site staged`);
      continue;
    }
    if (!ls.stdout.trim()) {
      console.error(`skipped: ${ig.instance} — ${url} has no cat/fhir-harness/fhir-ast/*, cat-fhir-ast/* or fhir-ast/* branch (no seeded AST cache)`);
      continue;
    }
    console.log(`${ig.instance}\t${url}\t${ig.label}\t${chromeOwnerFor(ROOT, ig.instance, names) ?? "-"}`);
  }
}
