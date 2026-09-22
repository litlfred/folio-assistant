#!/usr/bin/env bun
/**
 * Every declared asset exists, and its links resolve.
 *
 * @module scripts/check-declared-assets
 *
 * ## Why this is not "a link checker for AGENTS.md"
 *
 * Because that would special-case the file this design stops special-casing.
 * Bean `v8gh` measured seven dead links in the root `AGENTS.md`, five broken
 * by a single directory move — including the one its own banner calls the
 * place to start, so a cold agent following the banner hit a 404. The gap was
 * never "nobody wrote an AGENTS.md checker"; it was that the file was
 * **undeclared**, so no checker had any reason to look at it. `readme:audit`
 * verifies `README.md` alone and `check:agents-xref` verifies citations INTO
 * `AGENTS.md` rather than links out of it.
 *
 * So this checks **whatever an instance declares**. Declare a third markdown
 * asset tomorrow and it is covered with no change here.
 *
 * ## Three states, and the middle one is the point
 *
 * - **missing** — declared and not on disk. A finding: somebody asserted this
 *   file is ours. Unlike a conventional directory, which may simply be a
 *   convention this instance did not take up.
 * - **dead link** — a relative target that does not resolve.
 * - **not checked** — a non-markdown asset, or a link this cannot resolve
 *   offline (`http(s)`, `mailto`). Reported as such and never counted clean,
 *   because "could not determine" rendered as a pass is how a sweep blind on
 *   one check clears the others.
 *
 * Exit codes: 0 clean · 1 any missing asset or dead link.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

import { declaredAssets, instanceRootsIn } from "../schemas/cat-harness.js";

/**
 * Instances whose declarations this repository owns — **discovered, not
 * listed**, via {@link instanceRootsIn}.
 *
 * This was a literal `["cat-harness", "bootstrap"]`, and the docstring on it
 * recorded the list being wrong ONCE already: the first entry was `"."`, which
 * named the instance while the instance was the repository, and after the move
 * (bean `wggr`) it named a root carrying no `harness.json`, so `declaredAssets`
 * returned `[]` and this gate reported *"1 declared asset across 2 instances,
 * 0 findings"* over a file it had never opened.
 *
 * The list was then wrong a SECOND time, the same way. Recording that a
 * hardcoded list went stale, and then fixing it by correcting the hardcoded
 * list, buys one release. Asking the filesystem is what stops the third time
 * (bean `6tkl`).
 *
 * **How far it had drifted, measured 2026-09-20 while adding the sixth
 * instance** (`folio-assistant-sci`, bean `frs5`): the list still said two while
 * `folio-assist-core`, `who-iris`, `detangle`, `kg-navigation` and
 * `large-datasets` had all arrived. Five instances the gate had never opened,
 * reported in the same words as a clean run — and the README declared by
 * `folio-assistant-sci`'s brand-new `harness.json` would have been the sixth.
 * Widening it immediately found a dead link the list had been hiding.
 */
export function declaredInstances(repoRoot: string): string[] {
  return instanceRootsIn(repoRoot);
}

export interface AssetFinding {
  instance: string;
  asset: string;
  kind: "missing" | "dead-link";
  detail: string;
}

/** Links in a markdown body, excluding fenced code. */
export function markdownLinks(src: string): string[] {
  const body = src.replace(/```[\s\S]*?```/g, "");
  return [...body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]!.trim());
}

/** A link this can decide offline — relative, not an anchor, not a URL. */
export function isCheckable(target: string): boolean {
  if (!target || target.startsWith("#")) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(target);
}

export function auditInstance(root: string): { findings: AssetFinding[]; notChecked: number } {
  const findings: AssetFinding[] = [];
  let notChecked = 0;

  for (const a of declaredAssets(root)) {
    if (!a.exists) {
      findings.push({ instance: root, asset: a.id, kind: "missing", detail: a.src });
      continue;
    }
    if (!a.src.endsWith(".md")) {
      notChecked += 1;
      continue;
    }
    const body = readFileSync(a.absPath, "utf8");
    for (const target of markdownLinks(body)) {
      if (!isCheckable(target)) {
        notChecked += 1;
        continue;
      }
      const path = target.split("#")[0]!;
      if (!path) continue;
      if (!existsSync(resolve(dirname(a.absPath), path))) {
        findings.push({ instance: root, asset: a.id, kind: "dead-link", detail: target });
      }
    }
  }
  return { findings, notChecked };
}

if (import.meta.main) {
  const root = process.cwd();
  let findings: AssetFinding[] = [];
  let notChecked = 0;
  let declared = 0;

  const instances = declaredInstances(root);
  for (const abs of instances) {
    declared += declaredAssets(abs).length;
    const r = auditInstance(abs);
    findings = findings.concat(r.findings);
    notChecked += r.notChecked;
  }

  for (const f of findings) {
    console.error(`  ✗ ${f.instance}/${f.asset}: ${f.kind} — ${f.detail}`);
  }
  console.log(
    // NAMED, not just counted. This gate twice reported a clean run over
    // instances it had never opened, and a bare count is exactly what made
    // that readable as success — "2 instances" looks fine until you know there
    // were seven. The names are what a reader checks against the repository.
    `${declared} declared asset(s) across ${instances.length} instance(s) ` +
      `(${instances.map((p) => basename(p) || p).sort().join(", ")}); ` +
      `${findings.length} finding(s), ${notChecked} not checked (external or non-markdown)`,
  );
  process.exit(findings.length > 0 ? 1 : 0);
}
