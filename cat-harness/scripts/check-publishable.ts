#!/usr/bin/env bun
/**
 * check-publishable.ts — the census `instance-versioning.md` §3.1 asks for,
 * plus the two rules a per-instance schema structurally cannot see.
 *
 * ## Why a census is the primary output
 *
 * §3.1's whole argument is that **absence is a third state**:
 *
 * > An instance that has not declared `publishable` is *undecided*, never
 * > *false*, and a gate reports it — the same rule `publication.host` already
 * > follows.
 *
 * A boolean defaulting to `false` would read correctly for nearly every
 * instance here, and that is exactly the trap: it makes *"we decided this is
 * internal"* and *"nobody looked"* the same value. §6 Q1 leaves WHICH
 * instances are publishable open — *"the rest are unclear and should be
 * declared rather than inferred"* — so this script does not guess. It prints
 * the three buckets and names every instance in the undecided one, which is
 * the owner's worklist.
 *
 * Consequently **an all-undecided repository is the expected state today and
 * is not a pass**. The report says so in that many words, for the same reason
 * `check:published-refs` shouts `NOTHING WAS EXAMINED`: a gate that covers
 * nothing and exits 0 is this repository's most expensive recurring defect
 * (`xom7`, `dh4f`, `a6kl`).
 *
 * ## What this checks that the schema cannot
 *
 * `CatHarnessDeclarationSchema` already refuses an `id`/`version`/`canonicalUrl`
 * that does not match the instance's `publishable` state, and refuses a range
 * version. Those are per-declaration facts and belong there. Two rules are
 * CROSS-INSTANCE, so no single parse can hold them:
 *
 * 1. **Two instances must not share an `id`.** An id is the identity a
 *    consumer resolves; two of them is two packages answering to one name.
 * 2. **An unreadable declaration is a finding, not a skip.** An instance whose
 *    `<name>.json` does not parse has an unknown publishability, and unknown
 *    is not undecided — undecided is a fact about the repository, unknown is
 *    a fact about this run. Three states again, one level up.
 *
 * @module scripts/check-publishable
 * @covers cat-harness
 */

import { relative, resolve } from "node:path";

import {
  type CatHarnessDeclaration,
  instanceRootFor,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
} from "../schemas/cat-harness.js";

/**
 * The publication state. `unknown` is about THIS RUN, not about the instance.
 *
 * `draft` is the only state a declaration can be in today — `"published"`
 * fails to PARSE, so it can never appear here. `unknown` means this run could
 * not read the declaration, which is a different fact and stays separate:
 * "everything is draft" and "we could not look" must not render alike.
 */
export type Publishability = "draft" | "unknown";

export interface InstanceRow {
  /** Repo-relative instance root, `.` for the repository root itself. */
  where: string;
  /** The declared `name`, or the directory when the declaration was unreadable. */
  name: string;
  state: Publishability;
  id?: string;
  version?: string;
  canonicalUrl?: string;
  /** Why the state is `unknown`, when it is. Never left to be inferred. */
  problem?: string;
}

export interface PublishableFinding {
  severity: "major" | "minor";
  where: string;
  detail: string;
}

export interface PublishableReport {
  rows: InstanceRow[];
  findings: PublishableFinding[];
}

/**
 * The publication state, which today is `draft` for everything.
 *
 * Absent means `draft` — the field exists to reserve the axis, not to be
 * typed out 17 times. `"published"` cannot reach here: it fails to PARSE, so
 * a declaration claiming it never becomes a `CatHarnessDeclaration` at all.
 * `skills/folio-core/instance-publication.md`.
 */
function stateOf(d: CatHarnessDeclaration): Publishability {
  return d.publication?.state ?? "draft";
}

export function auditPublishable(repoRoot: string): PublishableReport {
  const rows: InstanceRow[] = [];
  const findings: PublishableFinding[] = [];

  for (const root of instanceRootsIn(repoRoot)) {
    const where = relative(repoRoot, root) || ".";
    let decl: CatHarnessDeclaration | undefined;
    try {
      decl = readDeclaration(root);
    } catch (error) {
      rows.push({ where, name: where, state: "unknown", problem: String(error).slice(0, 200) });
      findings.push({
        severity: "major",
        where,
        detail: "declaration did not parse — its publishability is UNKNOWN, which is not the same as undecided",
      });
      continue;
    }
    // `undefined` is "this root declares no instance", which `instanceRootsIn`
    // should not have returned — reported rather than dropped, for the same
    // reason as the parse failure above.
    if (decl === undefined) {
      rows.push({ where, name: where, state: "unknown", problem: "no declaration found at an instance root" });
      findings.push({
        severity: "major",
        where,
        detail: "listed as an instance root but carries no declaration — this run could not determine its publishability",
      });
      continue;
    }
    rows.push({
      where,
      name: decl.name,
      state: stateOf(decl),
      id: decl.id,
      version: decl.version,
      canonicalUrl: decl.canonicalUrl,
    });
  }

  // Cross-instance rule: an id is an identity, so it belongs to one instance.
  const byId = new Map<string, InstanceRow[]>();
  for (const row of rows) {
    if (row.id === undefined) continue;
    const list = byId.get(row.id) ?? [];
    list.push(row);
    byId.set(row.id, list);
  }
  for (const [id, list] of byId) {
    if (list.length < 2) continue;
    findings.push({
      severity: "major",
      where: list.map((r) => r.where).join(", "),
      detail: `${list.length} instances declare the id \`${id}\` — an id is the identity a consumer resolves, and two of them is two packages answering to one name`,
    });
  }

  return { rows, findings };
}

export function formatReport(report: PublishableReport): string {
  const { rows, findings } = report;
  const count = (s: Publishability) => rows.filter((r) => r.state === s).length;
  const out: string[] = [
    "Publication state — every asset carries an id and a version, and sits in DRAFT",
    "(skills/folio-core/instance-publication.md)",
    "",
  ];

  for (const row of rows) {
    const mark = { draft: "◐", unknown: "✗" }[row.state];
    // The identity is printed for EVERY row now, because every instance has
    // one. Under the old model it was printed only for the published, which
    // made an id look like a badge rather than a fact.
    const identity =
      row.problem !== undefined ? `  ${row.problem}` : `  ${row.id ?? "(no id)"} @ ${row.version ?? "(no version)"}`;
    out.push(`  ${mark} ${row.where.padEnd(24)} ${row.name.padEnd(22)} ${row.state}${identity}`);
  }

  out.push("");
  out.push(`${rows.length} instance(s): ${count("draft")} draft, ${count("unknown")} unknown.`);

  if (count("unknown") > 0) {
    out.push("");
    out.push(
      "UNKNOWN is not draft. Draft is a fact about the repository; unknown is a fact about THIS RUN — " +
        "those instances were not assessed at all, and a report that rendered them as draft would be claiming " +
        "something it never looked at.",
    );
  }

  if (count("draft") === rows.length && rows.length > 0) {
    out.push("");
    out.push("EVERY INSTANCE IS DRAFT, and that is now a DECIDED state rather than a worklist.");
    out.push(
      "§6 Q1 is ANSWERED (owner, 2026-09-23): all assets carry an id and a version and sit in draft, and formal " +
        "publication is a process that needs defining, tooling, and a per-instance answer. Nothing here is awaiting " +
        "a decision; it is awaiting that process.",
    );
  }

  if (findings.length > 0) {
    out.push("");
    for (const f of findings) {
      out.push(`  ✗ ${f.where}`);
      out.push(`    ${f.detail}`);
    }
  }
  out.push("");
  out.push(
    `${findings.length} finding(s), ${findings.filter((f) => f.severity === "major").length} major. ` +
      "Per-declaration rules (a required id and version, no range versions, and `publication.state` accepting only " +
      "`draft`) are enforced by the SCHEMA rather than here — a refusal that parses cannot be switched off the way a gate can.",
  );
  return out.join("\n");
}

if (import.meta.main) {
  const repoRoot = resolve(repoRootFor(instanceRootFor(import.meta.dir)));
  const report = auditPublishable(repoRoot);
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : formatReport(report));

  // ADVISORY by default, matching `check:published-refs` and for the same
  // reason: the scheme is a proposal, so its findings are a worklist before
  // they are a contract. The census is never a failure — being undecided is
  // legal, and a gate that failed on it would force a guess, which is the one
  // thing §6 Q1 asks nobody to do.
  if (process.argv.includes("--strict") && report.findings.length > 0) process.exit(1);
  process.exit(0);
}
