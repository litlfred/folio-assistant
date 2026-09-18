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
 * - **A job that pushes `gh-pages` without the shared concurrency group.**
 *   Every such job must declare `concurrency.group: gh-pages-push`, because
 *   they all contend for one ref.
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
  kind: "duplicate-key" | "unparseable" | "interpolated-untrusted" | "gh-pages-ungrouped";
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

/** The one group name every `gh-pages`-pushing job must share. */
export const GH_PAGES_GROUP = "gh-pages-push";

/**
 * A job that writes `gh-pages` must name the shared concurrency group.
 *
 * ## Why this needs a check and not just a convention
 *
 * The group has now been incomplete twice, in two different ways, and both
 * looked like a fix from inside the file that had it.
 *
 * **First: partial coverage.** Bean `eoix` gave the group to
 * `feature-staging`'s two jobs. A concurrency group serialises only the jobs
 * that NAME it, so the other six push sites were still free to race — and on
 * 2026-09-18 PR #297's staging deploy lost its push to a run from another
 * workflow after building the whole site.
 *
 * **Second, and harder to see: two names.** `blueprint` and `lean_ci` already
 * declared a job-level group for exactly this reason, called
 * `gh-pages-deploy`. A group matches on the literal string, so those two
 * queued against each other and against nobody else. A second name for one
 * contended resource is indistinguishable, in effect, from having no group —
 * while reading, in the file, like a solved problem.
 *
 * ## What counts as pushing
 *
 * Both mechanisms in this repo: the `peaceiris/actions-gh-pages` action, and a
 * bare `git push ... gh-pages` in a `run:` body (which is how
 * `feature-staging`'s `cleanup` removes a staging directory). Checking only
 * the action would have missed `cleanup`, which contends for the same ref.
 *
 * Scanned line-wise rather than through the parsed document because job keys,
 * `concurrency` blocks and `run:` bodies are all easy to locate by indent here,
 * and the parse is already validated above. A finding names the job, so a
 * false positive would be obvious rather than mysterious.
 */
function ghPagesUngrouped(text: string, file: string): WorkflowFinding[] {
  const lines = text.split("\n");
  type Job = { name: string; line: number; group?: string; pushes: number };
  const jobs: Job[] = [];
  let cur: Job | undefined;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const job = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(l);
    if (job !== null) {
      cur = { name: job[1], line: i + 1, pushes: 0 };
      jobs.push(cur);
      continue;
    }
    if (cur === undefined) continue;
    const g = /^ {6}group:\s*(\S+)/.exec(l);
    if (g !== null && !g[1].startsWith("${{")) cur.group = g[1];
    // A comment mentioning the action is not a use of it.
    const bare = l.trimStart().startsWith("#");
    if (!bare && /peaceiris\/actions-gh-pages@/.test(l)) cur.pushes++;
    if (!bare && /git push\b[^\n]*\bgh-pages\b/.test(l)) cur.pushes++;
  }

  return jobs
    .filter((j) => j.pushes > 0 && j.group !== GH_PAGES_GROUP)
    .map((j) => ({
      file,
      line: j.line,
      kind: "gh-pages-ungrouped" as const,
      detail:
        `job \`${j.name}\` pushes gh-pages but its concurrency group is ` +
        `${j.group === undefined ? "absent" : `\`${j.group}\``}, not \`${GH_PAGES_GROUP}\`. ` +
        "Every job contending for that ref must share one group, or it serialises against nothing.",
    }));
}

export function checkWorkflows(): WorkflowFinding[] {
  const out: WorkflowFinding[] = [];
  for (const f of readdirSync(DIR)) {
    if (!f.endsWith(".yml") && !f.endsWith(".yaml")) continue;
    const text = readFileSync(join(DIR, f), "utf-8");
    out.push(
      ...duplicateKeys(text, f),
      ...unparseable(text, f),
      ...interpolatedUntrusted(text, f),
      ...ghPagesUngrouped(text, f),
    );
  }
  return out;
}

if (import.meta.main) {
  const findings = checkWorkflows();
  const files = readdirSync(DIR).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
  console.log(`Workflows: ${files.length}\n`);
  if (findings.length === 0) {
    console.log(
      "✓ all parse; no duplicate keys; no attacker-controlled expression in a run body; " +
        `every gh-pages push is in the \`${GH_PAGES_GROUP}\` group`,
    );
  } else {
    for (const f of findings) console.error(`  ✗ ${f.file}:${f.line}  [${f.kind}] ${f.detail}`);
    process.exit(1);
  }
}
