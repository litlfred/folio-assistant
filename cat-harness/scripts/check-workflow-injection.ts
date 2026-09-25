/**
 * Workflow expression injection — free text must not reach a shell.
 *
 * A `${{ }}` expression is substituted into the script **text** before bash
 * parses it. So a value containing a quote closes the surrounding string and
 * the rest executes. Demonstrated rather than asserted, 2026-09-22:
 *
 * ```
 * VALUE="'; echo INJECTED-COMMAND-RAN; :'"
 * # renders to:  sel=''; echo INJECTED-COMMAND-RAN; :''
 * # runs:        INJECTED-COMMAND-RAN
 * ```
 *
 * The remedy is not quoting — it is not putting the value in the text at all.
 * Pass it through `env:` and read `"$VAR"`, where bash sees a value rather
 * than source.
 *
 * ## What this repository looked like when the gate was written
 *
 * 38 interpolations sit inside `run:` blocks across 16 workflows. Every
 * `github.event` one was a **constrained** value — `pull_request.number` (an
 * integer), `repository.name`, `event_name` and `workflow_run.conclusion`
 * (enums GitHub sets) — with one exception:
 *
 * `lake-cache-refresh.yml` interpolated a `workflow_dispatch` input straight
 * into `sel='...'`. Fixed in the same change, the same way
 * `feature-staging.yml`'s banner step already handled PR title and body — and
 * that step's comment shows somebody had understood this hazard exactly.
 * **Nothing checked it**, so the correctness was one edit from gone. That is
 * `tyyc`'s lesson: a hand-maintained property drifts, and the symptom of
 * forgetting is invisible.
 *
 * ## Three states, because "controllable" is not one question
 *
 * | class | example | verdict |
 * |---|---|---|
 * | **free text** | `pull_request.title`, `.body`, `comment.body`, a dispatch input | **FAIL** — unbounded, and a quote is all it takes |
 * | **constrained** | `pull_request.number`, `head_ref`, `repository.name` | reported, baselined; a ref or an integer cannot carry a quote |
 * | **safe** | `github.workspace`, `steps.*.outputs`, `matrix.*`, `secrets.*` | not reported |
 *
 * `head_ref` is in the middle band on purpose. Git refuses a ref containing a
 * space, a quote or a semicolon, so it cannot carry this payload — but it is
 * attacker-chosen on a fork PR, so it is reported rather than ignored. Calling
 * it safe would be asserting a property of git that this gate does not check.
 *
 * ## What it does NOT claim
 *
 * It reads `run:` blocks only. An expression in `with:`, `env:` or `if:` is
 * not a shell injection and is not graded here — `env:` is the REMEDY, and
 * flagging it would push people back toward interpolation. Template injection
 * in generated pages and prompt injection are the other two surfaces of bean
 * `1wef` and are not this file's.
 *
 * @module scripts/check-workflow-injection
 * @covers none — .github/workflows/ is not a declared graph kind
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");
const WORKFLOWS = join(ROOT, ".github", "workflows");
const BASELINE = join(import.meta.dir, "workflow-injection-baseline.json");

/**
 * Unbounded, attacker-supplied text. A quote in any of these is a shell break.
 *
 * `inputs.*` and `event.inputs.*` are here because a `workflow_dispatch` input
 * is free text. It needs write access to supply, which lowers the severity —
 * it does not change what the value can contain.
 */
const FREE_TEXT = [
  /\bgithub\.event\.(pull_request|issue|discussion)\.(title|body)\b/,
  /\bgithub\.event\.(comment|review)\.body\b/,
  /\bgithub\.event\.head_commit\.message\b/,
  /\bgithub\.event\.inputs\.[a-z_]+/i,
  /\binputs\.[a-z_]+/i,
];

/**
 * Attacker-CHOSEN but shape-constrained. Reported, never silently trusted.
 *
 * A git ref cannot contain a space, a quote or a semicolon, and a PR number is
 * an integer — so neither carries the payload above. They are listed because
 * "cannot carry THIS payload" is a narrower claim than "safe", and the
 * difference is what a reader needs.
 */
const CONSTRAINED = [
  /\bgithub\.(head_ref|ref_name|ref)\b/,
  /\bgithub\.event\.pull_request\.(number|head|base)\b/,
  /\bgithub\.event\.repository\.name\b/,
  /\bgithub\.event\.issue\.number\b/,
];

export type Severity = "free-text" | "constrained";

export interface Injection {
  workflow: string;
  line: number;
  expression: string;
  severity: Severity;
}

/**
 * Does this expression yield only quoted LITERALS, whatever the input holds?
 *
 * `${{ inputs.force_rerender == true && '--force' || '' }}` is a comparison
 * whose branches are constants: the shell receives `--force` or nothing, and
 * the input's own text never reaches it. That is a legitimate and common
 * idiom — a gate that flagged it would be training people to route around
 * itself, which is how a gate gets disabled.
 *
 * The test is deliberately narrow: an expression qualifies only when it
 * contains a comparison AND every value it can produce is a quoted literal.
 * `${{ inputs.a == 'x' && inputs.b || '' }}` does NOT qualify — one branch is
 * an input — and is still reported.
 *
 * Caught on the first run of this gate, on `discussions-maintain.yml`. Without
 * it the gate's first act would have been a false alarm on correct code.
 */
export function yieldsOnlyLiterals(expression: string): boolean {
  if (!/(==|!=|>=|<=|>|<)/.test(expression)) return false;
  // Everything after the first `&&` is the value side: each branch must be a
  // quoted literal, `true`/`false`/a number, and nothing else.
  const valueSide = expression.split("&&").slice(1).join("&&");
  if (valueSide.trim() === "") return false;
  const branches = valueSide.split("||").map((b) => b.trim());
  return branches.every((b) => /^'[^']*'$/.test(b) || /^"[^"]*"$/.test(b) || /^(true|false|\d+)$/.test(b));
}

/** Classify one expression. `null` means it is not attacker-influenced at all. */
export function classify(expression: string): Severity | null {
  // A comparison yielding constants never puts the value in the script text.
  if (yieldsOnlyLiterals(expression)) return null;
  if (FREE_TEXT.some((re) => re.test(expression))) return "free-text";
  if (CONSTRAINED.some((re) => re.test(expression))) return "constrained";
  return null;
}

/**
 * Every `${{ }}` inside a `run:` block.
 *
 * Indentation-scoped rather than YAML-parsed on purpose: a parser resolves the
 * block into a string and loses the line numbers a finding has to name, and
 * this gate's whole output is "this file, this line".
 */
export function scanWorkflows(dir: string = WORKFLOWS): Injection[] {
  const out: Injection[] = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(f)) continue;
    const lines = readFileSync(join(dir, f), "utf-8").split("\n");
    let inRun = false;
    let runIndent = 0;
    lines.forEach((line, i) => {
      const stripped = line.trimStart();
      const indent = line.length - stripped.length;
      if (inRun && stripped !== "" && indent <= runIndent) inRun = false;
      const isRun = /^-?\s*run:\s*\|?/.test(stripped) && stripped.includes("run:");
      const haystack = isRun ? stripped.split("run:")[1] ?? "" : inRun ? line : "";
      if (isRun) {
        inRun = true;
        runIndent = indent;
      }
      for (const m of haystack.matchAll(/\$\{\{([^}]*)\}\}/g)) {
        const expression = m[1].trim();
        const severity = classify(expression);
        if (severity) out.push({ workflow: f, line: i + 1, expression, severity });
      }
    });
  }
  return out;
}

/** Keyed by workflow and expression, not line — a line moves when a step is added above. */
export function baselineKey(i: Injection): string {
  return `${i.workflow}: ${i.expression}`;
}

function readBaseline(): string[] {
  if (!existsSync(BASELINE)) return [];
  return (JSON.parse(readFileSync(BASELINE, "utf-8")) as { known: string[] }).known;
}

if (import.meta.main) {
  const found = scanWorkflows();
  const free = found.filter((i) => i.severity === "free-text");
  const constrained = found.filter((i) => i.severity === "constrained");

  if (process.argv.includes("--write-baseline")) {
    const known = [...new Set(constrained.map(baselineKey))].sort();
    writeFileSync(
      BASELINE,
      JSON.stringify(
        {
          _comment:
            "Attacker-CHOSEN but shape-constrained expressions inside `run:` blocks — refs, PR numbers, " +
            "repository names. A git ref cannot contain a space, a quote or a semicolon and a PR number is an " +
            "integer, so none carries a shell break; they are listed because 'cannot carry THIS payload' is a " +
            "narrower claim than 'safe'. FREE TEXT is never baselined: a quote is all it takes, and the remedy " +
            "(pass it through `env:`) is one line. Keyed by expression rather than line so an unrelated step " +
            "added above does not churn the file. Refresh with --write-baseline.",
          known,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`  ✓ baseline written — ${known.length} constrained expression(s)`);
    process.exit(0);
  }

  const known = new Set(readBaseline());
  const keys = new Set(constrained.map(baselineKey));
  const novel = [...keys].filter((k) => !known.has(k));
  const stale = [...known].filter((k) => !keys.has(k));

  console.log(
    `Workflow expression injection (${found.length} attacker-influenced expression(s) in \`run:\` blocks)`,
  );

  let bad = false;
  for (const i of free) {
    console.log(`  ✗ ${i.workflow}:${i.line} — FREE TEXT in a \`run:\` block: \`${i.expression}\``);
    console.log("      A quote closes the surrounding string and the rest executes.");
    console.log("      Pass it through `env:` and read \"$VAR\" — bash then sees a value, not source.");
    bad = true;
  }
  for (const k of novel) {
    console.log(`  ✗ NEW constrained expression in a \`run:\` block: ${k}`);
    console.log("      Shape-constrained, so not a break today — but decide it rather than inherit it.");
    bad = true;
  }
  for (const k of stale) {
    console.log(`  ✗ stale baseline entry, remove it: ${k}`);
    bad = true;
  }

  if (!bad) {
    console.log(
      `  ✓ no free text reaches a shell; ${constrained.length} constrained expression(s) baselined`,
    );
    process.exit(0);
  }
  process.exit(1);
}
