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
 * | **safe** | `github.workspace`, `matrix.*`, `secrets.*` | not reported |
 *
 * `head_ref` is in the middle band on purpose. Git refuses a ref containing a
 * space, a quote or a semicolon, so it cannot carry this payload — but it is
 * attacker-chosen on a fork PR, so it is reported rather than ignored. Calling
 * it safe would be asserting a property of git that this gate does not check.
 *
 * ## `steps.*.outputs` is not a class — it is a PIPE (bean `6bhf`, 2026-09-26)
 *
 * The table above listed `steps.*.outputs` as safe **unconditionally** until
 * 2026-09-26, and that was not a property of the expression: a step output
 * holds whatever the step put in it. A step that binds a free-text value to
 * `env:` correctly, reads it as `"$VAR"` correctly, and then writes it to
 * `$GITHUB_OUTPUT` has laundered free text into the band this gate does not
 * report.
 *
 * **It was live in this repository, not latent.** `release-folio-assistant.yml`
 * bound `github.event.inputs.version` to `INPUT_VERSION`, wrote it out as the
 * `version` output, and a later step interpolated
 * `${{ steps.version.outputs.version }}` into `mv *.tgz "folio-assistant-….tgz"`.
 * A dispatch of `1.0";id;"` renders `mv *.tgz "folio-assistant-1.0";id;".tgz"`
 * and runs `id`. The gate reported nothing, and the step that handled the value
 * correctly is the one that leaked it.
 *
 * **What this file measured before, and why that was the wrong measurement.**
 * The finding was first recorded as a latent gap, on the evidence that *"every
 * `>> $GITHUB_OUTPUT` write of a reason or title is a literal"*. True — and it
 * asked about two members of the free-text band while a third, the dispatch
 * input, was the one being written. A measurement over the instances an audit
 * happened to name is the same defect as a fix aimed at them; `6bhf` paid for
 * that lesson twice in one day, once here and once in `path-containment`.
 *
 * So provenance is resolved rather than assumed: `resolveProvenance` reads each
 * step that writes `$GITHUB_OUTPUT`, takes the worst severity among the
 * expressions that step binds, and a consumption of that step's output inherits
 * it. Keyed by `job.stepId`, because step outputs are job-scoped and two jobs
 * may use the same id. A job's `outputs:` block is followed one more hop, so
 * `needs.<job>.outputs.<name>` inherits the same taint.
 *
 * **Graded free text, not constrained, and deliberately so.** `feature-staging.yml`
 * reduces its slug to `[A-Za-z0-9._-]` with a `sed`, so that value genuinely
 * cannot carry a payload — and recognising that here would mean this gate
 * deciding, per site, whether somebody's sanitiser was good enough. It refuses
 * the shape instead, the way the archive guard whitelists member types rather
 * than enumerating the hostile ones: the remedy is one `env:` line either way,
 * and the three slug sites took it.
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
  /** Set when the severity came from the PRODUCING step rather than the expression. */
  via?: string;
}

/**
 * What each step output and job output CARRIES, keyed `job.stepId` / `job.outputName`.
 *
 * Empty is a perfectly good answer and means every output in the file is built
 * from values this gate does not grade — not that the question went unasked.
 */
export type Provenance = Map<string, Severity>;

/** `constrained` loses to `free-text`: an output carries the worst thing in it. */
function worse(a: Severity | null, b: Severity | null): Severity | null {
  if (a === "free-text" || b === "free-text") return "free-text";
  if (a === "constrained" || b === "constrained") return "constrained";
  return null;
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

/**
 * Classify one expression, resolving `steps.*`/`needs.*` through `prov` when given.
 *
 * With no `prov` a step output is unclassified, which is what it is on its own:
 * the expression text says nothing about what the step wrote. The caller that
 * HAS read the file supplies provenance; the two-argument form is the honest
 * one and the one the scanner uses.
 */
export function classify(expression: string, prov?: Provenance, job = ""): Severity | null {
  // A comparison yielding constants never puts the value in the script text.
  if (yieldsOnlyLiterals(expression)) return null;
  if (FREE_TEXT.some((re) => re.test(expression))) return "free-text";
  if (CONSTRAINED.some((re) => re.test(expression))) return "constrained";
  if (prov) {
    for (const [key, sev] of resolveReferences(expression, prov, job)) {
      void key;
      return sev;
    }
  }
  return null;
}

/**
 * Which producers an expression reads, and what each of them carries.
 *
 * Returned as pairs rather than one severity so a finding can name the STEP
 * that leaked — "free text via `job.version`" is actionable where "free text"
 * alone sends the reader looking at the wrong line.
 */
export function resolveReferences(
  expression: string,
  prov: Provenance,
  job: string,
): Array<[string, Severity]> {
  const out: Array<[string, Severity]> = [];
  for (const m of expression.matchAll(/\bsteps\.([A-Za-z0-9_-]+)\.outputs\.[A-Za-z0-9_-]+/g)) {
    const sev = prov.get(`${job}.${m[1]}`);
    if (sev) out.push([`${job}.${m[1]}`, sev]);
  }
  for (const m of expression.matchAll(/\bneeds\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)/g)) {
    const sev = prov.get(`${m[1]}.${m[2]}`);
    if (sev) out.push([`${m[1]}.${m[2]}`, sev]);
  }
  return out;
}

/**
 * Read one workflow's step and job outputs, and say what each one carries.
 *
 * Indentation-scoped for the same reason `scanWorkflows` is: this gate's output
 * is "this file, this line", and a YAML parser hands back a resolved tree with
 * the line numbers gone.
 *
 * A step counts as a PRODUCER when it writes `$GITHUB_OUTPUT` at all — the
 * alternative is matching which variable reaches which `echo`, and a guard that
 * has to parse shell to be right is a guard that is wrong quietly. Over-tainting
 * costs an `env:` line; under-tainting costs what `release-folio-assistant.yml`
 * cost.
 */
export function resolveProvenance(lines: string[]): Provenance {
  const prov: Provenance = new Map();
  let job = "";
  let stepId = "";
  let stepIndent = -1;
  let writesOutput = false;
  let carried: Severity | null = null;
  let outputsIndent = -1;

  const flush = () => {
    if (stepId && writesOutput && carried) prov.set(`${job}.${stepId}`, carried);
    stepId = "";
    writesOutput = false;
    carried = null;
  };

  // A job's `outputs:` block conventionally sits ABOVE its `steps:`, so its
  // referents are unknown on the pass that reads them. Collected here, resolved
  // after. Two passes rather than one, because guessing the file's order is how
  // a resolver reads clean over a file written the other way round.
  const jobOutputs: Array<[string, string, string]> = [];

  lines.forEach((line) => {
    const stripped = line.trimStart();
    if (stripped === "" || stripped.startsWith("#")) return;
    const indent = line.length - stripped.length;

    // A job header: two spaces in, under `jobs:`.
    const jobHeader = indent === 2 ? /^([A-Za-z0-9_-]+):\s*$/.exec(stripped) : null;
    if (jobHeader) {
      flush();
      job = jobHeader[1];
      outputsIndent = -1;
      stepIndent = -1;
      return;
    }

    // A job-level `outputs:` block maps a name onto a step output.
    if (indent === 4 && /^outputs:\s*$/.test(stripped)) {
      flush();
      outputsIndent = indent;
      return;
    }
    if (outputsIndent >= 0) {
      if (indent <= outputsIndent) outputsIndent = -1;
      else {
        const kv = /^([A-Za-z0-9_-]+):\s*(.+)$/.exec(stripped);
        if (kv) jobOutputs.push([job, kv[1], kv[2]]);
        return;
      }
    }

    // A new step, or the end of the one we were in.
    if (/^- /.test(stripped)) {
      flush();
      stepIndent = indent;
    } else if (stepIndent >= 0 && indent <= stepIndent) {
      flush();
      stepIndent = -1;
      return;
    }
    if (stepIndent < 0) return;

    const idLine = /^(?:- )?id:\s*(\S+)\s*$/.exec(stripped);
    if (idLine) stepId = idLine[1].replace(/^["']|["']$/g, "");
    if (line.includes("$GITHUB_OUTPUT")) writesOutput = true;
    for (const m of line.matchAll(/\$\{\{([^}]*)\}\}/g)) {
      carried = worse(carried, classify(m[1].trim(), prov, job));
    }
  });
  flush();

  for (const [owner, name, value] of jobOutputs) {
    let sev: Severity | null = null;
    for (const m of value.matchAll(/\$\{\{([^}]*)\}\}/g)) {
      sev = worse(sev, classify(m[1].trim(), prov, owner));
    }
    // One map holds both step ids and job output names, so `job.x` is ambiguous
    // if a job has a step `id: x` AND an output `x`. Merged with `worse` rather
    // than overwritten: an ambiguous key may over-report, never under-report.
    const merged = worse(prov.get(`${owner}.${name}`) ?? null, sev);
    if (merged) prov.set(`${owner}.${name}`, merged);
  }
  return prov;
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
    // Provenance first: a consumption cannot be graded before its producer is
    // known, and a producer may sit below its consumer in the file.
    const prov = resolveProvenance(lines);
    let job = "";
    let inRun = false;
    let runIndent = 0;
    lines.forEach((line, i) => {
      const stripped = line.trimStart();
      const indent = line.length - stripped.length;
      if (indent === 2 && /^[A-Za-z0-9_-]+:\s*$/.test(stripped)) job = stripped.replace(/:\s*$/, "");
      if (inRun && stripped !== "" && indent <= runIndent) inRun = false;
      const isRun = /^-?\s*run:\s*\|?/.test(stripped) && stripped.includes("run:");
      const haystack = isRun ? stripped.split("run:")[1] ?? "" : inRun ? line : "";
      if (isRun) {
        inRun = true;
        runIndent = indent;
      }
      for (const m of haystack.matchAll(/\$\{\{([^}]*)\}\}/g)) {
        const expression = m[1].trim();
        const severity = classify(expression, prov, job);
        if (!severity) continue;
        const via = resolveReferences(expression, prov, job)[0]?.[0];
        out.push({ workflow: f, line: i + 1, expression, severity, ...(via ? { via } : {}) });
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
    if (i.via) {
      // Naming the producer matters more here than anywhere else: the
      // expression on this line looks harmless, and the leak is elsewhere.
      console.log(`      It CARRIES free text — written by \`${i.via}\`, which binds a free-text value.`);
    }
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
