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
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import { DECLARATION_FILENAME, declaredAssets } from "../schemas/cat-harness.js";
// The `folio` graph kind is registered by CORE as a load-time side effect
// (`schemas/folio-graph-kind.ts`: "a layer that cannot render must not own the
// renderable kind"), so the harness alone does not know it exists. This module
// reads instance declarations, and this instance now DECLARES a folio graph, so
// without this import `readDeclaration` throws `unknown graph kind "folio"` on a
// declaration that is perfectly valid. Twelve tests and three gates failed that
// way the first time a folio graph was declared here (issue #464) — nothing had
// ever declared one before, so nothing had ever needed the registration to have
// happened. Same import `scripts/kg-export.ts` and
// `scripts/check-avatar-coverage.ts` already carry, and for the same reason.
import "../schemas/folio-graph-kind.js";

/**
 * Instances whose declarations this repository owns — FOUND, not listed.
 *
 * ## Twice now, and the second time the comment was already here
 *
 * The first entry was `"."`, which named the instance while the instance was
 * the repository. After the move (bean `wggr`) it named the repository root,
 * which carries no `harness.json`, so `declaredAssets` returned `[]` and this
 * gate reported "1 declared asset across 2 instances, 0 findings" over a file
 * it had not opened — a clean run across an empty set, which is `dh4f` in the
 * one check whose whole subject is a file nobody was looking at.
 *
 * That was fixed by writing down a list of two. The list then stayed at two
 * while the repository grew to SEVEN declarations — `folio-assistant-core`,
 * `who-iris`, `detangle`, `kg-navigation` and `large-datasets` all arrived and
 * none was added — and the gate went on reporting a clean run, in the same
 * words, over five instances it had never opened. Measured 2026-09-20, adding
 * the sixth (`folio-assist-sci`, bean `frs5`): the README declared by its
 * brand-new `harness.json` would not have been checked either.
 *
 * A hardcoded list is a declaration nobody declared. Enumerating is the only
 * form that cannot drift, because the thing being counted is the thing being
 * looked for.
 */
export function declaredInstances(root: string): string[] {
  const out: string[] = [];
  // One level down plus the root itself. Deeper is deliberately NOT walked: a
  // `harness.json` inside `node_modules/` or a vendored checkout belongs to
  // somebody else, and auditing another project's declared assets would report
  // findings nobody here can act on.
  if (existsSync(join(root, DECLARATION_FILENAME))) out.push(".");
  for (const e of readdirSync(root, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith(".") || e.name === "node_modules") continue;
    if (existsSync(join(root, e.name, DECLARATION_FILENAME))) out.push(e.name);
  }
  return out.sort();
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
  for (const inst of instances) {
    const abs = join(root, inst);
    declared += declaredAssets(abs).length;
    const r = auditInstance(abs);
    findings = findings.concat(r.findings);
    notChecked += r.notChecked;
  }

  for (const f of findings) {
    console.error(`  ✗ ${f.instance}/${f.asset}: ${f.kind} — ${f.detail}`);
  }
  console.log(
    `${declared} declared asset(s) across ${instances.length} instance(s) ` +
      `(${instances.join(", ")}); ` +
      `${findings.length} finding(s), ${notChecked} not checked (external or non-markdown)`,
  );
  process.exit(findings.length > 0 ? 1 : 0);
}
