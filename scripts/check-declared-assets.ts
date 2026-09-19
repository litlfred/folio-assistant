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
import { dirname, join, resolve } from "node:path";

import { declaredAssets } from "../schemas/cat-harness.js";

/** Instances whose declarations this repository owns. */
export const DECLARED_INSTANCES = [".", "bootstrap"] as const;

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

  for (const inst of DECLARED_INSTANCES) {
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
    `${declared} declared asset(s) across ${DECLARED_INSTANCES.length} instance(s); ` +
      `${findings.length} finding(s), ${notChecked} not checked (external or non-markdown)`,
  );
  process.exit(findings.length > 0 ? 1 : 0);
}
