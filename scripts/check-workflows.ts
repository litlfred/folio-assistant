#!/usr/bin/env bun
/**
 * Workflow YAML that GitHub will actually parse.
 *
 * ## Why a local check, when CI already runs the workflows
 *
 * Because a workflow GitHub cannot parse does not fail loudly — it produces a
 * run **named by its file path instead of its `name:`**, because there is no
 * `name:` to read. `AGENTS.md` records two workflows that failed this way on
 * 2026-08-07 and stayed red for a day. I reproduced it on 2026-09-18 by adding
 * a second `env:` block to a step that already had one.
 *
 * The trap is that **`yaml.safe_load` accepts duplicate keys** — the YAML spec
 * says they are invalid, but most loaders take the last one silently. So
 * "it parses locally" is not evidence, and that is exactly what I relied on.
 *
 * ## What is checked
 *
 * - **Duplicate keys at any level.** The failure above.
 * - **`${{ }}` inside a `run:` body**, where the expression is substituted into
 *   the script TEXT before the shell parses it. Trusted contexts are allowed;
 *   anything attacker-controlled is an error. See
 *   `skills/folio-core/untrusted-input.md`.
 *
 * @module scripts/check-workflows
 */
import { readdirSync, readFileSync } from "node:fs";
import { parseDocument } from "yaml";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, ".github", "workflows");

/**
 * Expressions an attacker can choose the value of.
 *
 * Deliberately a list of the dangerous ones rather than an allow-list of safe
 * ones: a blanket rule over every `${{ }}` would flag `github.workspace` and
 * `matrix.*`, produce a wall of false findings, and get switched off — which is
 * how a check stops being a check.
 */
const ATTACKER_CONTROLLED = [
  /github\.event\.pull_request\.head\.ref/,
  /github\.event\.pull_request\.title/,
  /github\.event\.pull_request\.body/,
  /github\.event\.issue\.title/,
  /github\.event\.issue\.body/,
  /github\.event\.comment\.body/,
  /github\.event\.pull_request\.labels/,
  /github\.head_ref/,
];

export interface WorkflowFinding {
  file: string;
  line: number;
  kind: "duplicate-key" | "unparseable" | "interpolated-untrusted";
  detail: string;
}

/**
 * Duplicate keys, from a real YAML parser.
 *
 * Hand-rolled scope tracking got this wrong **twice** — first reporting
 * `types:` under `pull_request:` as a duplicate of `types:` under
 * `pull_request_target:`, then reporting `run:` in one step as a duplicate of
 * `run:` in the step before it. Both times the checker would have produced a
 * wall of false findings in a repository with no duplicates at all, which is
 * the failure its own doc comment warns about.
 *
 * Two wrong attempts is evidence, not bad luck: YAML scoping is a parser's job.
 * `yaml`'s `parseDocument` reports duplicates as errors with line/column, which
 * is exactly the question being asked, and it is the same class of parser
 * GitHub uses.
 */
function duplicateKeys(text: string, file: string): WorkflowFinding[] {
  const doc = parseDocument(text, { uniqueKeys: true, keepSourceTokens: false });
  return doc.errors
    .filter((e) => /duplicate/i.test(e.message))
    .map((e) => ({
      file,
      line: e.linePos?.[0]?.line ?? 0,
      kind: "duplicate-key" as const,
      detail: `${e.message} — loaders take the LAST silently; GitHub refuses the file.`,
    }));
}

/**
 * Anything else the parser refuses.
 *
 * A workflow GitHub cannot parse produces a run named by its FILE PATH rather
 * than by its `name:`, because there is no `name:` to read — which is why this
 * class of failure reads as an ordinary red rather than as "the file is
 * broken". Reported separately from duplicates so the message says which.
 */
function unparseable(text: string, file: string): WorkflowFinding[] {
  const doc = parseDocument(text, { uniqueKeys: true });
  return doc.errors
    .filter((e) => !/duplicate/i.test(e.message))
    .map((e) => ({
      file,
      line: e.linePos?.[0]?.line ?? 0,
      kind: "unparseable" as const,
      detail: e.message,
    }));
}

/** `${{ attacker-controlled }}` inside a `run:` body. */
function interpolatedUntrusted(text: string, file: string): WorkflowFinding[] {
  const out: WorkflowFinding[] = [];
  const lines = text.split("\n");
  let inRun = false;
  let runIndent = 0;

  lines.forEach((line, i) => {
    const m = /^(\s*)run:\s*\|?/.exec(line);
    if (m !== null) {
      inRun = true;
      runIndent = m[1].length;
      return;
    }
    if (!inRun) return;
    if (line.trim() !== "" && line.length - line.trimStart().length <= runIndent) {
      inRun = false;
      return;
    }
    for (const pat of ATTACKER_CONTROLLED) {
      if (pat.test(line) && line.includes("${{")) {
        out.push({
          file,
          line: i + 1,
          kind: "interpolated-untrusted",
          detail: `attacker-controlled expression in a run body — bind it to \`env:\` and read the variable`,
        });
        break;
      }
    }
  });
  return out;
}

export function checkWorkflows(): WorkflowFinding[] {
  const out: WorkflowFinding[] = [];
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith(".yml") && !f.endsWith(".yaml")) continue;
    const text = readFileSync(join(DIR, f), "utf-8");
    out.push(...duplicateKeys(text, f), ...unparseable(text, f), ...interpolatedUntrusted(text, f));
  }
  return out;
}

if (import.meta.main) {
  const findings = checkWorkflows();
  const files = readdirSync(DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  console.log(`Workflows: ${files.length}\n`);
  if (findings.length === 0) {
    console.log("✓ all parse; no duplicate keys; no attacker-controlled expression in a run body");
  } else {
    for (const f of findings) console.error(`  ✗ ${f.file}:${f.line}  [${f.kind}] ${f.detail}`);
    process.exit(1);
  }
}
