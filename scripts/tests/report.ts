/**
 * Test report generator — runs bun test with JUnit XML output,
 * converts to TestReport JSON matching schemas/qou-types.ts.
 *
 * Usage:
 *   bun run report.ts                     # JSON to stdout
 *   bun run report.ts --out report.json   # write to file
 *
 * Consumed by: CI pipelines, publication pipeline (proof coverage),
 * blueprint dependency graph.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve, join } from "path";
import { XMLParser } from "fast-xml-parser";
import { REPO_ROOT, discoverLeanProjects, getCommitSha } from "./helpers";
import type {
  TestReport,
  TestResult,
  TestSummary,
  TestCategory,
} from "../../folio-assistant/schemas/qou-types";

const startTime = Date.now();
const now = new Date().toISOString();
const junitPath = join(import.meta.dir, ".junit-report.xml");

// Run bun test → JUnit XML
try {
  execSync(`bun test --reporter=junit --reporter-outfile="${junitPath}" 2>&1`, {
    cwd: import.meta.dir,
    encoding: "utf-8",
    timeout: 120_000,
  });
} catch {
  // bun test exits non-zero on failures — XML is still written
}

// Parse JUnit XML → TestResult[] using fast-xml-parser
const xml = readFileSync(junitPath, "utf-8");
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const parsed = parser.parse(xml);

const results: TestResult[] = [];

/** Recursively collect all testcase nodes from nested testsuites. */
function collectTestcases(node: any): any[] {
  const cases: any[] = [];
  if (!node) return cases;
  const items = Array.isArray(node) ? node : [node];
  for (const item of items) {
    if (item.testcase) {
      const tc = Array.isArray(item.testcase) ? item.testcase : [item.testcase];
      cases.push(...tc);
    }
    if (item.testsuite) {
      cases.push(...collectTestcases(item.testsuite));
    }
  }
  return cases;
}

for (const tc of collectTestcases(parsed.testsuites)) {
  const name = tc["@_name"] || "unknown";
  const classname = tc["@_classname"] || "";
  const time = parseFloat(tc["@_time"] || "0");
  const file = (tc["@_file"] || "").replace(".test.ts", "");

  let outcome: TestResult["outcome"] = "pass";
  let message = "OK";
  if (tc.failure) { outcome = "fail"; message = tc.failure["@_message"] || "failed"; }
  else if (tc.skipped) { outcome = "skip"; message = "skipped"; }
  else if (tc.error) { outcome = "error"; message = "error"; }

  results.push({
    test_id: [file, classname, name].filter(Boolean).join(":"),
    outcome,
    duration_ms: Math.round(time * 1000),
    message,
    timestamp: now,
  });
}

// Clean up temp file
try { unlinkSync(junitPath); } catch {}

// Summary
const duration_ms = Date.now() - startTime;
const passed = results.filter((r) => r.outcome === "pass").length;
const failed = results.filter((r) => r.outcome === "fail").length;
const skipped = results.filter((r) => r.outcome === "skip").length;
const errored = results.filter((r) => r.outcome === "error").length;

// Infer category from test ID
function inferCategory(testId: string): TestCategory {
  if (testId.includes("Project:") || testId.includes("non-empty") || testId.includes("import")) return "lean-compile";
  if (testId.includes("toolchain") || testId.includes("dependen") || testId.includes("library") || testId.includes("discovery")) return "lean-library";
  if (testId.includes("sorry")) return "lean-sorry";
  if (testId.includes("Coverage") || testId.includes("lean{") || testId.includes("leanok") || testId.includes("lean-tag")) return "latex-lean-coverage";
  if (testId.includes("Label") || testId.includes("prefix")) return "latex-structure";
  if (testId.includes("Schema") || testId.includes("schema") || testId.includes("proof-objects.json")) return "schema-validity";
  if (testId.includes("check-lean") || testId.includes(".mcp") || testId.includes("config") || testId.includes("Deploy") || testId.includes("gitignore") || testId.includes("artifact")) return "infrastructure";
  return "custom";
}

const byCategory: TestSummary["by_category"] = {} as any;
for (const r of results) {
  const cat = inferCategory(r.test_id);
  if (!byCategory[cat]) byCategory[cat] = { total: 0, passed: 0, failed: 0 };
  byCategory[cat].total++;
  if (r.outcome === "pass") byCategory[cat].passed++;
  if (r.outcome === "fail") byCategory[cat].failed++;
}

const report: TestReport = {
  version: "1.0",
  generated_at: now,
  commit_sha: getCommitSha(),
  lean_projects: discoverLeanProjects(),
  summary: {
    total: results.length,
    passed,
    failed,
    skipped,
    errored,
    duration_ms,
    by_category: byCategory,
  },
  results,
};

// Output
const outIdx = process.argv.indexOf("--out");
if (outIdx !== -1 && process.argv[outIdx + 1]) {
  const outPath = resolve(process.argv[outIdx + 1]);
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`Report written to ${outPath}`);
  console.log(`  ${passed} passed, ${failed} failed, ${skipped} skipped (${duration_ms}ms)`);
} else {
  console.log(JSON.stringify(report, null, 2));
}

process.exit(failed > 0 ? 1 : 0);
