#!/usr/bin/env bun
/**
 * check-published-instance-exports.ts — every foreign-instance export the
 * deploy actually runs must succeed, and must mint absolute `@id`s.
 *
 * ## Why this gate exists at all
 *
 * `docs-site.yml` failed on `main` for over two hours on 2026-09-21 and the
 * fast gate set was green through every one of those runs; several merges
 * landed against that green. The break was a single command —
 * `kg-export.ts --instance ./cat-bootstrap` — that no gate ran, because the
 * gate set ran `kg-export` only for THIS instance. The export defect itself
 * is fixed (bean `40fl`); this gate is the part that was missing, and it is
 * the reason the outage was findable only from the forge.
 *
 * That is `xom7`'s finding one workflow over: a red workflow looks exactly
 * like a green one from a checkout. A gate is the only thing that makes the
 * deploy's own commands visible from inside a clone.
 *
 * ## The set is DERIVED from the workflow, never listed here
 *
 * An array of instance paths is a second answer to "what does the deploy
 * publish", free to disagree with the first the moment somebody edits the
 * YAML — and the disagreement would present as this gate passing while the
 * deploy breaks, which is precisely today's failure with an extra step. So
 * the invocations are read out of `docs-site.yml`: add an `--instance` line
 * there and it is covered here with no edit to this file.
 *
 * Same reasoning as `viewerSources()` replacing `VIEWER_SOURCES`, and as
 * `gates.ts` deriving its list from `code-quality-gates.yml`.
 *
 * ## An empty set is exit 2, not a pass
 *
 * If the regex stops matching — the command is renamed, the flag changes
 * spelling — this gate would examine nothing and report clean, which is the
 * failure it exists to prevent wearing a green tick. Nothing found is
 * "could not determine", and the third-state rule says that is never
 * rendered as clean.
 *
 * @module scripts/check-published-instance-exports
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..", "..");
const DEPLOY_WORKFLOW = join(REPO_ROOT, ".github", "workflows", "docs-site.yml");

/**
 * A `kg-export.ts --instance <path>` invocation inside the deploy workflow.
 *
 * Deliberately anchored on `kg-export.ts` rather than on `--instance` alone:
 * other scripts take an instance argument and are not this export, and a gate
 * that ran them would report failures that say nothing about the published
 * graph.
 */
const INVOCATION = /kg-export\.ts\s+--instance\s+(\S+)/g;

export interface ExportResult {
  /** The instance path exactly as the workflow spells it. */
  instance: string;
  /** True when the export exited 0. */
  ok: boolean;
  /** Why it failed — the export's own stderr, trimmed to what it reported. */
  detail?: string;
}

export interface PublishedExportReport {
  /** Instance paths read out of the workflow. */
  invocations: string[];
  results: ExportResult[];
  /** Set when the workflow itself could not be read — a third state. */
  unreadable?: string;
}

/** The instance paths the deploy workflow exports, in the order it runs them. */
export function publishedInstances(workflowText: string): string[] {
  return [...workflowText.matchAll(INVOCATION)].map((m) => m[1]!);
}

/**
 * Run one foreign export the way the deploy runs it — no `--base-url`.
 *
 * The missing flag is the point. The deploy passes none, on the declaration's
 * own authority, so a gate that supplied one would test a command nobody runs
 * and pass while the real one failed.
 */
function runExport(instance: string, outDir: string): ExportResult {
  const stub = instance.replace(/[^a-zA-Z0-9]+/g, "-");
  const r = spawnSync(
    "bun",
    ["run", join("cat-harness", "scripts", "kg-export.ts"), "--instance", instance, "--out", join(outDir, `${stub}.jsonld`)],
    { cwd: REPO_ROOT, encoding: "utf-8" },
  );
  if (r.status === 0) return { instance, ok: true };
  // The export prints its problems to stdout and exits non-zero; stderr
  // carries a crash. Both are reported, because "it failed and said nothing"
  // must not read the same as "it failed for this reason".
  const said = [r.stdout, r.stderr]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .join("\n")
    .split("\n")
    .filter((l) => l.includes("✗") || l.includes("error"))
    .join("\n")
    .trim();
  return { instance, ok: false, detail: said || `exited ${String(r.status)} with no diagnosis` };
}

export function checkPublishedInstanceExports(): PublishedExportReport {
  if (!existsSync(DEPLOY_WORKFLOW)) {
    return { invocations: [], results: [], unreadable: `${DEPLOY_WORKFLOW} is not there` };
  }
  let text: string;
  try {
    text = readFileSync(DEPLOY_WORKFLOW, "utf-8");
  } catch (e) {
    return { invocations: [], results: [], unreadable: e instanceof Error ? e.message : String(e) };
  }
  const invocations = publishedInstances(text);
  if (invocations.length === 0) return { invocations, results: [] };

  const outDir = mkdtempSync(join(tmpdir(), "published-instance-export-"));
  try {
    return { invocations, results: invocations.map((i) => runExport(i, outDir)) };
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

export function formatReport(r: PublishedExportReport): string {
  if (r.unreadable !== undefined) {
    return `Published instance exports\n  ? COULD NOT READ THE DEPLOY WORKFLOW — ${r.unreadable}.\n    That is not a pass.`;
  }
  if (r.invocations.length === 0) {
    return [
      "Published instance exports",
      "  ? EXAMINED NOTHING — no `kg-export.ts --instance` invocation found in",
      "    .github/workflows/docs-site.yml. Either the deploy stopped publishing a",
      "    foreign instance's graph, or this gate's pattern stopped matching it.",
      "    Both are findings; neither is a pass.",
    ].join("\n");
  }
  const failed = r.results.filter((x) => !x.ok);
  const out = [`Published instance exports (${r.invocations.length} invocation(s) from docs-site.yml)`];
  if (failed.length === 0) {
    for (const x of r.results) out.push(`  ✓ ${x.instance}`);
    out.push("    every graph the deploy publishes builds, with dereferenceable `@id`s");
    return out.join("\n");
  }
  for (const x of r.results) {
    if (x.ok) {
      out.push(`  ✓ ${x.instance}`);
      continue;
    }
    out.push(`  ✗ ${x.instance}`);
    for (const line of (x.detail ?? "").split("\n")) out.push(`      ${line.trim()}`);
  }
  out.push("");
  out.push("  This is the command `docs-site.yml` runs, run the way it runs it. A failure");
  out.push("  here is the Pages deploy already broken — it will not be caught later by");
  out.push("  anything else in this gate set, which is how one such break survived");
  out.push("  several merges on 2026-09-21 with every local gate green.");
  out.push("");
  out.push("  An instance publishing into THIS repository's site inherits the publishing");
  out.push("  instance's base — see `exportIdentity` in `kg-export.ts` for that rule.");
  return out.join("\n");
}

if (import.meta.main) {
  const report = checkPublishedInstanceExports();
  const clean =
    report.unreadable === undefined &&
    report.invocations.length > 0 &&
    report.results.every((x) => x.ok);
  (clean ? console.log : console.error)(formatReport(report));
  process.exit(clean ? 0 : 1);
}
