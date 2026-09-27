/**
 * Every workflow installs the SAME Bun, and `.bun-version` says which.
 *
 * Bean `3ozg`. `upstream-pins.json`'s own note is the reason this gate has to
 * exist rather than being a convention:
 *
 *   > NOTE WHAT IS NOT HERE: the pinned version. It lives in the file the build
 *   > reads … a registry with its own copy would be a second answer to "what are
 *   > we running", free to disagree with the build.
 *
 * The workflows are what CI actually reads, and there are **22** `setup-bun`
 * sites across 12 files. So `.bun-version` is one answer and those 22 are
 * copies — and copies are only not a second answer while something forbids them
 * from disagreeing. That is this file. Without it, `pinnedIn: ../.bun-version`
 * would point at a file no build consults, and the registry would be watching a
 * number with no consequence.
 *
 * ## Why not let `setup-bun` read `.bun-version` and delete the 22 literals
 *
 * Because it cannot be verified from here. The action may well read
 * `.bun-version` — four of the 22 sites already omit `bun-version` and take its
 * default — but egress to the action's documentation is blocked in this
 * container, and an unverifiable assumption would make the pin SILENTLY do
 * nothing: every site would fall back to whatever the default is, the sidecars
 * would keep churning, and the gate would still be green because the literals
 * it compares would all be absent. Explicit literals are checkable from the
 * repository alone, which is the property that matters for a gate.
 *
 * ## What the pin is for
 *
 * `engine_version` in a QA script sidecar is `bun-${Bun.version}`, and
 * `saveQaScriptSidecar` treats it as a SUBSTANTIVE field — correctly, since a
 * verdict produced by a different engine is a different verdict. With nothing
 * pinning the runtime, that field recorded whoever ran last: 86 committed
 * sidecars held two values (72 at `bun-1.3.14`, 14 at `bun-1.3.11`) and CI's
 * `bun-version: latest` would have rewritten all of them to `bun-1.4.2` on its
 * next sweep. `bun run gates`' tree-mutation detector therefore ended "NOT
 * clean" on every branch, pristine `main` included — and a signal that is always
 * red is one nobody reads, which is the `ymsu` failure class the detector exists
 * to catch.
 *
 * `tools` is the graph kind: the subject is `.github/workflows/`, this harness's
 * own CI definition, and no folio content is read. Declared rather than
 * inferred, per `3srh`.
 *
 * Usage:
 *   bun run check:bun-pin
 *
 * @covers none — .github/workflows/ is not a declared graph kind
 * @graphNode tool
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { parse } from "yaml";

const INSTANCE_ROOT = resolve(import.meta.dir, "..");
const REPO_ROOT = resolve(INSTANCE_ROOT, "..");
const PIN_FILE = ".bun-version";
const WORKFLOW_DIR = join(REPO_ROOT, ".github", "workflows");

export interface Finding {
  workflow: string;
  job: string;
  step: string;
  /** `unpinned` — no `bun-version` at all · `disagrees` — a different version. */
  kind: "unpinned" | "disagrees";
  found?: string;
}

export interface Report {
  /** The literal `.bun-version` holds, when it could be read. */
  expected?: string;
  workflows: number;
  /** `setup-bun` steps seen, so a scan that matched nothing cannot read clean. */
  sites: number;
  findings: Finding[];
}

/** The version in `.bun-version`: one bare `X.Y.Z`, nothing else. */
export function readPinFile(text: string): string | undefined {
  const m = /^(\d+\.\d+\.\d+)\s*$/m.exec(text);
  return m?.[1];
}

interface Step {
  name?: string;
  uses?: string;
  with?: Record<string, unknown>;
}

/**
 * Judge one parsed workflow.
 *
 * Takes the parsed document so the tests can build a disagreement rather than
 * describe one — this gate's whole value is that it fails, and a gate that can
 * only be pointed at a correct repository has never been shown to.
 */
export function auditWorkflow(name: string, doc: unknown, expected: string): Omit<Report, "expected" | "workflows"> {
  const findings: Finding[] = [];
  let sites = 0;
  const jobs = (doc as { jobs?: Record<string, { steps?: Step[] }> } | null)?.jobs ?? {};
  for (const [job, def] of Object.entries(jobs)) {
    const steps = Array.isArray(def?.steps) ? def.steps : [];
    steps.forEach((step, i) => {
      if (typeof step?.uses !== "string" || !step.uses.includes("oven-sh/setup-bun")) return;
      sites++;
      const label = step.name ?? `step ${i + 1}`;
      const found = step.with?.["bun-version"];
      if (found === undefined) {
        findings.push({ workflow: name, job, step: label, kind: "unpinned" });
        return;
      }
      // YAML may give a number for `1.3` or a string for `1.3.14`; compare as
      // written, because `bun-version: 1.3` is a DIFFERENT request to the action
      // than `1.3.14` and must not be normalised into agreement.
      const asText = String(found);
      if (asText !== expected) {
        findings.push({ workflow: name, job, step: label, kind: "disagrees", found: asText });
      }
    });
  }
  return { sites, findings };
}

export function bunPin(repoRoot: string = REPO_ROOT): Report {
  const expected = readPinFile(readFileSync(join(repoRoot, PIN_FILE), "utf-8"));
  const report: Report = { expected, workflows: 0, sites: 0, findings: [] };
  if (expected === undefined) return report;

  const dir = join(repoRoot, ".github", "workflows");
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml")).sort()) {
    report.workflows++;
    const one = auditWorkflow(f, parse(readFileSync(join(dir, f), "utf-8")), expected);
    report.sites += one.sites;
    report.findings.push(...one.findings);
  }
  return report;
}

if (import.meta.main) {
  const report = bunPin();

  if (report.expected === undefined) {
    console.error(
      `${PIN_FILE} does not hold a bare X.Y.Z version. It is the ONE answer to which Bun this ` +
        `repository runs — \`upstream-pins.json\` reads it as the \`bun\` pin and every workflow ` +
        `literal is checked against it — so an unreadable one is a blocker, not a default.`,
    );
    process.exit(2);
  }
  if (report.sites === 0) {
    console.error(
      `Scanned ${report.workflows} workflow(s) under ${WORKFLOW_DIR} and found no ` +
        `\`oven-sh/setup-bun\` step — refusing to call that clean. Either the action was replaced, ` +
        `in which case this gate needs to follow it, or the scan is looking in the wrong place.`,
    );
    process.exit(2);
  }

  console.log(
    `Bun pin — ${PIN_FILE} says ${report.expected}; ${report.sites} setup-bun site(s) ` +
      `across ${report.workflows} workflow(s)`,
  );
  if (report.findings.length === 0) {
    console.log("  ✓ every site installs it, so `engine_version` is the same wherever CI runs");
    process.exit(0);
  }

  console.error(`\n✗ ${report.findings.length} site(s) do not install ${report.expected}:`);
  for (const f of report.findings) {
    const what = f.kind === "unpinned" ? "no `bun-version`" : `\`bun-version: ${f.found}\``;
    console.error(`  ${f.workflow}  job \`${f.job}\`  "${f.step}"  — ${what}`);
  }
  console.error(
    `\nSet \`bun-version: ${report.expected}\` on each, or change ${PIN_FILE} and every site together.\n` +
      `Adopting a NEWER Bun is not this gate's to wave through: it is the ` +
      `\`upstream-version-adoption\` process, whose accepting step is a person.`,
  );
  process.exit(1);
}
