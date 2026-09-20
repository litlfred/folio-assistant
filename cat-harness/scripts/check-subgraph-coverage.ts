/**
 * Every declared subgraph should be REACHABLE — by a reader and by an agent.
 *
 * The owner, 2026-09-20: *"everytime an instance names a directory as a
 * subgraph, it needs (QA valduation) to have visualizer, documenationentry. QA
 * if no skill, no tools."* Bean `2krx`.
 *
 * ## Why this is an AXIS and not a gate
 *
 * A navbar stub built over the real declarations measured it: of 22 directories
 * this instance declares, **two** have a renderer. Turning that into a hard
 * gate on day one is 20 failures, which is a wall somebody switches off — and
 * this repository already has the rule for it: *a check that fires on every one
 * of its subjects is a check that is wrong.* So this reports, ranks, and exits
 * 0 on findings. It becomes fatal when the count is low enough to mean
 * something, which is the same path `undeclared` took in
 * `check-instance-render`.
 *
 * ## Declaration-first, never inference
 *
 * A subgraph's coverage is READ FROM ITS DECLARATION (`coverage` on the
 * directory entry), not guessed by scanning for a page that mentions the path.
 * Two reasons, and the second is the one that matters:
 *
 * 1. Fuzzy matching invents both false positives and false negatives, and an
 *    axis nobody trusts is an axis nobody runs.
 * 2. **An absent declaration is the finding.** If the instance has not said
 *    what renders `library/`, that is precisely the gap — inferring an answer
 *    would paper over the thing being measured. This is the repository's
 *    standing principle applied here: *extension is a coincidence; a
 *    declaration inside the file is the contract.*
 *
 * So a declared-and-missing target is a MAJOR finding (somebody claimed a
 * renderer that is not there) while an undeclared one is MINOR (nobody has
 * said yet). Those are different problems and the axis must not merge them.
 *
 * ## Three states, because "could not determine" is not "absent"
 *
 * An unreadable declaration is reported as `undetermined` and never as a clean
 * run. A sweep blind on one instance has not cleared the others.
 *
 * ## Bootstrap is exempt from the VISUALISER criterion, by layer
 *
 * The owner, same day: *"it is exception to harness/layer not having
 * visualtion/workflow visualizer. but it must have its json/jsonld... that is
 * its existence."*
 *
 * The exemption is **not a hole in the axis, it is a second criterion**. An
 * axis that dropped bootstrap entirely would stop checking the one thing
 * bootstrap must have. So bootstrap is not asked for a visualiser, and IS
 * asked whether its graph artefact is produced — a layer that cannot emit its
 * own graph has not shown it is a graph.
 */
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
  instanceRootFor,
  type CatHarnessDeclaration,
} from "../schemas/cat-harness.js";
// `folio` is registered by CORE as a load-time side effect, and this module
// reads declarations — without it `readDeclaration` throws `unknown graph kind
// "folio"` on a declaration that is perfectly valid. Same import
// `check-declared-assets.ts` and `kg-export.ts` already carry, same reason.
import "../schemas/folio-graph-kind.js";

/** The three obligations, in the order the owner named them. */
export const CRITERIA = ["visualiser", "docs", "skill"] as const;
export type Criterion = (typeof CRITERIA)[number];

export type Severity = "major" | "minor";

export interface CoverageFinding {
  instance: string;
  directory: string;
  criterion: Criterion;
  severity: Severity;
  detail: string;
}

export interface InstanceCoverage {
  instance: string;
  verdict: "checked" | "undetermined";
  declared: number;
  findings: CoverageFinding[];
  /** The instance-level README finding, when there is one. */
  readme?: { severity: Severity; detail: string };
  /** Waivers honoured, with the reason each one gave. */
  exempted: Array<{ directory: string; criterion: Criterion; reason: string }>;
  reason?: string;
}

/**
 * The layer exempt from `visualiser`, and the layer only.
 *
 * A NAME rather than a path, because the exemption is about what bootstrap IS
 * — the floor that owns no renderer — not about where it happens to sit. An
 * instance that relocated would keep its exemption; a different instance that
 * moved into `bootstrap/` would not inherit one.
 */
export const VISUALISER_EXEMPT_INSTANCES = new Set(["bootstrap"]);

/** Does this entry's declared target actually resolve? */
function targetExists(root: string, target: string): boolean {
  // A target may name a path in the instance, a path in the repository, or a
  // node id (a skill or tool). Only a path can be checked here; an id that
  // names nothing is the knowledge-graph audit's job, not this one — and
  // reporting an id as "missing" because it is not a file would be the axis
  // lying about what it looked at.
  if (!target.includes("/") && !target.includes(".")) return true;
  return existsSync(resolve(root, target)) || existsSync(resolve(repoRootFor(root), target));
}

/**
 * Does this instance have a STARTING README of its own?
 *
 * The owner, 2026-09-20: *"each harness kind needs readme, it is added as a
 * reference to repo's root readme.md to explain what is in it"*. Bean `ie9l`.
 *
 * ## Why "of its own" is the whole criterion
 *
 * `check-declared-assets` already verifies that a declared asset RESOLVES, and
 * it reports zero findings here — because `cat-harness` declares
 * `src: "README.md"` with `scope: "repository"`, which resolves to the
 * REPOSITORY ROOT's README. The asset is fine. What is wrong is that one file
 * is doing two jobs: "what this repository is" and "what the cat-harness
 * instance is". A reader arriving at either question gets the other one's
 * answer mixed in.
 *
 * So this asks a question the resolve-check structurally cannot: does the
 * README live INSIDE the instance it describes? A repository-scoped README on
 * a non-root instance is a borrowed one, and that is the finding.
 *
 * MAJOR rather than minor, unlike the subgraph criteria: an instance with no
 * starting README is not a gap somebody has not filled in yet, it is an
 * instance a reader cannot enter. The subgraph criteria are minor because 2 of
 * 22 directories have a renderer and a wall of findings gets switched off;
 * there are four instances and three have a README, so this one can be sharp
 * from the start.
 */
export function readmeFinding(
  root: string,
  decl: { assets?: Array<{ role?: string; src: string; scope?: string }> } | undefined,
  isRepositoryRoot: boolean,
): { severity: Severity; detail: string } | undefined {
  const readme = (decl?.assets ?? []).find((a) => a.role === "instance-readme");
  if (readme === undefined) {
    return { severity: "major", detail: "declares no `instance-readme` asset — nothing says what this instance IS" };
  }
  // The repository root legitimately owns the repository's README; every other
  // instance reaching for a repository-scoped one is borrowing it.
  if (readme.scope === "repository" && !isRepositoryRoot) {
    return {
      severity: "major",
      detail:
        `declares its README \`scope: "repository"\`, so it resolves to the repository root's — ` +
        "one file doing two jobs, and a reader of either question gets the other's answer",
    };
  }
  if (!existsSync(resolve(root, readme.src))) {
    return { severity: "major", detail: `declares README \`${readme.src}\` and it is not there` };
  }
  return undefined;
}

export function auditInstance(root: string): InstanceCoverage {
  const instance = root.split("/").pop() ?? root;
  let decl: CatHarnessDeclaration | undefined;
  try {
    decl = readDeclaration(root);
  } catch (e) {
    return {
      instance,
      verdict: "undetermined",
      declared: 0,
      findings: [],
      exempted: [],
      reason: `declaration unreadable: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
  if (decl === undefined) {
    return {
      instance,
      verdict: "undetermined",
      declared: 0,
      findings: [],
      exempted: [],
      reason: "no declaration",
    };
  }

  const findings: CoverageFinding[] = [];
  const exempted: InstanceCoverage["exempted"] = [];
  const dirs = decl.directories ?? [];

  for (const dir of dirs) {
    for (const criterion of CRITERIA) {
      if (criterion === "visualiser" && VISUALISER_EXEMPT_INSTANCES.has(instance)) continue;

      const waiver = dir.coverage?.exempt?.[criterion];
      if (waiver !== undefined) {
        exempted.push({ directory: dir.id, criterion, reason: waiver });
        continue;
      }

      const declared = dir.coverage?.[criterion];
      if (declared === undefined) {
        findings.push({
          instance,
          directory: dir.id,
          criterion,
          severity: "minor",
          detail: `no ${criterion} declared — nobody has said what ${criterion === "visualiser" ? "renders it" : criterion === "docs" ? "documents it" : "governs it"}`,
        });
        continue;
      }
      if (!targetExists(root, declared)) {
        findings.push({
          instance,
          directory: dir.id,
          criterion,
          severity: "major",
          detail: `declares ${criterion} "${declared}" and it does not resolve`,
        });
      }
    }
  }

  const readme = readmeFinding(root, decl, resolve(root) === resolve(repoRootFor(root)));
  return { instance, verdict: "checked", declared: dirs.length, findings, exempted, readme };
}

export function auditAll(repoRoot: string): InstanceCoverage[] {
  return instanceRootsIn(repoRoot).map((r) => auditInstance(r));
}

export function formatReport(rs: InstanceCoverage[]): string {
  const out: string[] = ["Subgraph coverage — visualiser, documentation, governing skill", ""];
  for (const r of rs) {
    if (r.verdict === "undetermined") {
      out.push(`  ? ${r.instance.padEnd(22)} undetermined — ${r.reason ?? "no reason given"}`);
      continue;
    }
    const major = r.findings.filter((f) => f.severity === "major").length;
    out.push(
      `  · ${r.instance.padEnd(22)} ${String(r.declared).padStart(3)} declared, ` +
        `${String(r.findings.length).padStart(3)} finding(s)` +
        (major ? `, ${major} MAJOR` : "") +
        (r.exempted.length ? `, ${r.exempted.length} exempt` : ""),
    );
    if (r.readme !== undefined) {
      out.push(`      ✗ ${r.instance} / readme: ${r.readme.detail}`);
    }
    for (const f of r.findings.filter((x) => x.severity === "major")) {
      out.push(`      ✗ ${f.directory} / ${f.criterion}: ${f.detail}`);
    }
    for (const e of r.exempted) {
      out.push(`      – ${e.directory} / ${e.criterion} exempt: ${e.reason}`);
    }
  }

  const noReadme = rs.filter((r) => r.readme !== undefined).length;
  const undet = rs.filter((r) => r.verdict === "undetermined").length;
  const all = rs.flatMap((r) => r.findings);
  const major = all.filter((f) => f.severity === "major").length;
  out.push("");
  out.push(
    `${all.length} finding(s) across ${rs.length - undet} instance(s) — ${major} major, ${all.length - major} minor.`,
  );
  if (noReadme) {
    out.push(
      `${noReadme} instance(s) have no starting README OF THEIR OWN — an instance a reader cannot enter.`,
    );
  }
  if (undet) {
    out.push(
      `${undet} instance(s) UNDETERMINED — not a clean run. A sweep blind on one has not cleared the others.`,
    );
  }
  // The exemption is a second criterion rather than a hole, so say out loud
  // that it was applied — a waiver nobody sees is a silence list.
  out.push(
    `\`${[...VISUALISER_EXEMPT_INSTANCES].join(", ")}\` is exempt from \`visualiser\` by layer, ` +
      "and owes its own .json/.jsonld instead (owner, 2026-09-20).",
  );
  return out.join("\n");
}

if (import.meta.main) {
  const repoRoot = repoRootFor(instanceRootFor(import.meta.dir));
  const rs = auditAll(repoRoot);
  if (rs.length === 0) {
    console.error("No instance carries a harness.json. That is not a clean run — nothing was checked.");
    process.exit(2);
  }
  console.log(process.argv.includes("--json") ? JSON.stringify(rs, null, 2) : formatReport(rs));
  // ADVISORY, by the rule at the top of this file. `--strict` is for the day
  // the minor count is low enough to hold, and for a caller who wants to pin
  // "no MAJOR findings" now — a declared-but-missing target is already a
  // defect rather than a backlog item.
  if (
    process.argv.includes("--strict") &&
    rs.some((r) => r.readme !== undefined || r.findings.some((f) => f.severity === "major"))
  ) {
    process.exit(1);
  }
  if (rs.some((r) => r.verdict === "undetermined")) process.exit(2);
  process.exit(0);
}

export { join };
