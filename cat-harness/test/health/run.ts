#!/usr/bin/env bun
/**
 * Run the repository health checks, write the report, say what is wrong.
 *
 * ```sh
 * bun run health                 # run, write the report, human-readable output
 * bun run health -- --markdown   # the block the daily workflow puts in its issue
 * bun run health -- --list       # what checks exist, one line each
 * bun run health -- --warn       # report only, never fail
 * bun run health -- --strict     # also fail on `minor` findings
 * bun run health -- --no-write   # do not touch test/health/results/
 * bun run health -- --out F      # write the markdown to F, KEEP the exit code
 * ```
 *
 * ## Exit codes, and why there are three
 *
 * - **0** — every check ran and nothing gated.
 * - **1** — at least one finding at or above the gating severity.
 * - **2** — at least one check could not be evaluated.
 *
 * 2 is not a worse 1; it is a different answer. A sweep that could not read
 * `gh-pages` has not established that the previews are under 100 MB, and the
 * workflow that consumes this leaves its tracking issue untouched and fails
 * the job on a 2 — because a watchdog going blind must not read as good news.
 * `healthVerdict` in `schemas/health-report.ts` is the one place that
 * precedence lives.
 *
 * ## `--markdown` always exits 0, deliberately
 *
 * Same reason `check-ci-health.ts` gives: a caller that renders the block and
 * also branches on the exit code would otherwise both print the report and
 * declare it unchecked. The notifier gets `--out`, which writes the same
 * markdown and keeps the real exit code.
 *
 * @module test/health/run
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

import {
  HEALTH_REPORT_SCHEMA,
  type HealthCheckResult,
  type HealthReport,
  healthReportPath,
  healthVerdict,
  parseHealthReport,
} from "../../schemas/health-report.ts";
import { HEALTH_CHECKS, formatBytes, runHealthChecks, type HealthContext } from "./checks.ts";
import { gatherContext } from "./probes.ts";
import { repoRootFor } from "../../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "..", "..");

/** Short content hash of the checker, so a report can be told from a stale one. */
export function checkerHash(root: string = ROOT): string {
  const h = createHash("sha256");
  // Every module whose change could alter a verdict — the registry, the
  // evidence gathering and this entry point. The schema is deliberately NOT
  // included: it constrains the report rather than deciding it, and a comment
  // edit there would rewrite the file for no change in meaning.
  for (const f of ["test/health/checks.ts", "test/health/probes.ts", "test/health/run.ts"]) {
    h.update(readFileSync(resolve(root, f)));
  }
  return h.digest("hex").slice(0, 12);
}

/** Assemble the committed document. */
export function buildReport(
  ctx: HealthContext,
  results: HealthCheckResult[],
  opts: { hash: string; updatedAt: string },
): HealthReport {
  return parseHealthReport({
    $schema: HEALTH_REPORT_SCHEMA,
    producer: { script: "test/health/run.ts", script_hash: opts.hash },
    subject: { kind: "repository", id: ctx.subject },
    updated_at: opts.updatedAt,
    verdict: healthVerdict(results),
    checks: results,
  });
}

const MARK: Record<HealthCheckResult["state"], string> = { ok: "✓", finding: "✗", unknown: "❔" };

/** The block the workflow puts in its tracking issue. */
export function render(report: HealthReport): string {
  const lines: string[] = [];
  lines.push(`## Repository health — \`${report.subject.id}\``);
  lines.push("");
  lines.push(
    report.verdict === "unknown"
      ? "**Could not determine.** At least one check did not run. This is NOT a clean report — see below."
      : report.verdict === "findings"
        ? "**Findings below.** Every action names something a person does; nothing here is removed by the sweep."
        : "**Clean.** Every check ran and none had anything to report.",
  );
  lines.push("");
  lines.push("| | check | state | what it measured |");
  lines.push("|---|---|---|---|");
  for (const c of report.checks) {
    const measured = c.measurements
      .map((m) => `${m.metric} ${m.unit === "bytes" ? formatBytes(m.value) : `${m.value}${m.unit === "ratio" ? "x" : ""}`}`)
      .join(", ");
    lines.push(`| ${MARK[c.state]} | \`${c.id}\` | ${c.state} | ${measured || "—"} |`);
  }
  lines.push("");
  for (const c of report.checks) {
    if (c.state === "unknown") {
      lines.push(`### ❔ \`${c.id}\` — could not determine`);
      lines.push("");
      lines.push(c.reason ?? "");
      lines.push("");
    }
  }
  for (const c of report.checks) {
    if (c.findings.length === 0) continue;
    lines.push(`### ✗ \`${c.id}\``);
    lines.push("");
    lines.push(c.summary);
    lines.push("");
    for (const f of c.findings) {
      lines.push(`- **${f.severity}** — ${f.summary}`);
      lines.push(`  - *What to do:* ${f.action}`);
    }
    lines.push("");
  }
  lines.push("<details><summary>Thresholds, and what each is based on</summary>");
  lines.push("");
  for (const c of report.checks) {
    if (c.thresholds.length === 0) continue;
    lines.push(`**\`${c.id}\`**`);
    lines.push("");
    for (const t of c.thresholds) {
      const v = t.unit === "bytes" ? formatBytes(t.value) : `${t.value} ${t.unit}`;
      lines.push(`- \`${t.metric}\` > ${v} → *${t.severity}*. ${t.basis}`);
    }
    lines.push("");
  }
  lines.push("</details>");
  lines.push("");
  lines.push(
    `_Produced by \`${report.producer.script}\` (\`${report.producer.script_hash}\`) at ${report.updated_at}._`,
  );
  return lines.join("\n");
}

/** Does anything in the report gate, at the chosen severity floor? */
export function gates(report: HealthReport, strict: boolean): boolean {
  return report.checks.some((c) =>
    c.findings.some((f) => f.severity === "critical" || f.severity === "major" || (strict && f.severity === "minor")),
  );
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const has = (f: string): boolean => argv.includes(f);

  if (has("--list")) {
    for (const c of HEALTH_CHECKS) console.log(`${c.id.padEnd(26)} ${c.summary}`);
    process.exit(0);
  }

  const outIdx = argv.findIndex((a) => a === "--out" || a.startsWith("--out="));
  const outFile =
    outIdx === -1
      ? undefined
      : argv[outIdx].startsWith("--out=")
        ? argv[outIdx].slice("--out=".length)
        : argv[outIdx + 1];
  if (outIdx !== -1 && !outFile) {
    console.error("--out needs a file path");
    process.exit(2);
  }

  // `repoRootFor`, not ROOT. `ROOT` is the INSTANCE root — this file sits at
  // `<instance>/test/health/` — and two probes resolve their store from a
  // declaration whose entry is `scope: "repository"`: `beans/` and `todos/`
  // are at the repository root, not inside the instance.
  //
  // Passing the instance root sent them to `cat-harness/beans/defs` and
  // `cat-harness/todos/items`, neither of which exists, from the moment #437
  // moved the instance. They reported UNKNOWN rather than clean, which is the
  // whole point of the three-state rule — the sweep said "could not be
  // evaluated" and refused to call itself clean for six hours — but blind is
  // not the state a check is for.
  //
  // Every other consumer runs `git(repoRoot, …)`, which resolves the
  // repository from any directory inside it, so the true root is correct for
  // them too rather than merely tolerated.
  const ctx = await gatherContext({ repoRoot: repoRootFor(ROOT) });
  const results = runHealthChecks(ctx);
  const report = buildReport(ctx, results, {
    hash: checkerHash(),
    updatedAt: new Date().toISOString(),
  });

  if (!has("--no-write")) {
    const path = healthReportPath(ROOT);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
    if (!has("--markdown")) console.log(`wrote ${relative(ROOT, path)}`);
  }
  if (outFile) writeFileSync(outFile, `${render(report)}\n`);

  if (has("--markdown")) {
    console.log(render(report));
    process.exit(0);
  }

  console.log(`\nRepository health — ${report.subject.id} (${report.verdict})\n`);
  for (const c of report.checks) {
    console.log(`  ${MARK[c.state]} ${c.id.padEnd(26)} ${c.state === "unknown" ? c.reason : `${c.findings.length} finding(s)`}`);
    for (const f of c.findings) console.log(`      · [${f.severity}] ${f.summary}`);
  }

  if (has("--warn")) process.exit(0);
  // Order matters and is the one in `healthVerdict`: could-not-check outranks
  // a finding. A sweep that went blind on one check has not cleared the rest.
  if (report.verdict === "unknown") {
    console.error("\nAt least one check could not be evaluated. Treat this as unknown, not as clean.");
    process.exit(2);
  }
  if (gates(report, has("--strict"))) process.exit(1);
  process.exit(0);
}
