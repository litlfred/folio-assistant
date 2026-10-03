/**
 * `gate-shell.sh` is the shell every `run:` step in `code-quality-gates.yml`
 * runs under, so a bug in it is a bug in every gate at once — and the two
 * that matter most are INVISIBLE from a green run:
 *
 * 1. Taking the exit status from `tee` instead of from the step script. `tee`
 *    succeeds almost always, so the whole gate set would pass and judge
 *    nothing. A workflow cannot detect this about itself.
 * 2. Adding `-o pipefail`. GitHub's default for a `run:` step is `bash -e`,
 *    NOT `bash -eo pipefail`; adding it reddens steps that pass today, and
 *    the breakage looks like a real finding rather than like this file.
 *
 * Bean `yqc4`.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SHELL = join(import.meta.dir, "..", "gate-shell.sh");

/** Run `gate-shell.sh` over a step script, as the workflow's `{0}` would. */
function runStep(body: string, opts: { summary?: boolean } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "gate-shell-test-"));
  const script = join(dir, "step.sh");
  writeFileSync(script, body);
  const summary = join(dir, "summary.md");
  if (opts.summary !== false) writeFileSync(summary, "");
  const env: Record<string, string> = { ...process.env as Record<string, string>, GITHUB_JOB: "gates" };
  if (opts.summary !== false) env.GITHUB_STEP_SUMMARY = summary;
  else delete env.GITHUB_STEP_SUMMARY;
  const r = spawnSync(SHELL, [script], { encoding: "utf-8", env });
  return {
    status: r.status,
    stdout: r.stdout ?? "",
    summary: opts.summary !== false && existsSync(summary) ? readFileSync(summary, "utf-8") : "",
  };
}

describe("gate-shell.sh", () => {
  test("is executable, or the workflow cannot use it as a shell", () => {
    const r = spawnSync("test", ["-x", SHELL]);
    expect(r.status).toBe(0);
  });

  test("passes a step's non-zero exit through — NOT tee's zero", () => {
    // The invisible bug. If this returns 0 the entire gate set is vacuous.
    expect(runStep("echo working\nexit 7\n").status).toBe(7);
    expect(runStep("exit 1\n").status).toBe(1);
  });

  test("a succeeding step still exits 0", () => {
    expect(runStep("echo fine\n").status).toBe(0);
  });

  test("does NOT add pipefail — bash -e is GitHub's default, and only that", () => {
    // `false | true` is 0 under `bash -e` and 1 under `bash -eo pipefail`.
    expect(runStep("false | true\necho reached\n").status).toBe(0);
  });

  test("keeps -e: a failing command aborts the rest of the step", () => {
    const r = runStep("false\necho NOT-REACHED\n");
    expect(r.status).toBe(1);
    // The STEP's own output, not the whole of stdout: the `::error::`
    // annotation quotes the command, so it legitimately contains the text of
    // a line that never ran. Asserting over all of stdout made this test fail
    // when the annotation was added — the test was too broad, not the code
    // wrong.
    const stepOutput = r.stdout.split("\n").filter((l) => !l.startsWith("::")).join("\n");
    expect(stepOutput).not.toContain("NOT-REACHED");
  });

  test("writes nothing to the summary when the step passes", () => {
    expect(runStep("echo fine\n").summary).toBe("");
  });

  test("names the step and keeps its output when the step fails", () => {
    const r = runStep("echo distinctive-marker\necho to-stderr >&2\nexit 3\n");
    expect(r.status).toBe(3);
    expect(r.summary).toContain("exit 3");
    expect(r.summary).toContain("gates");
    // the step body identifies WHICH step, since Actions exposes no step name
    expect(r.summary).toContain("echo distinctive-marker");
    // both streams, because a gate's verdict is as often on stderr
    expect(r.summary).toContain("distinctive-marker");
    expect(r.summary).toContain("to-stderr");
  });

  test("strips comments from the step it echoes, so the command is legible", () => {
    const r = runStep("# an explanatory comment\n\nbun run check:nothing\nexit 1\n");
    expect(r.summary).toContain("bun run check:nothing");
    expect(r.summary).not.toContain("an explanatory comment");
  });

  test("says a silent failure was silent rather than printing an empty block", () => {
    const r = runStep("false\n");
    expect(r.summary).toContain("printed nothing before failing");
  });

  test("bounds the output, because GitHub DROPS a step summary over 1 MiB", () => {
    // Losing the whole summary to a verbose gate is the failure mode that
    // would hit exactly when it is most needed.
    const r = runStep("for i in $(seq 1 5000); do echo \"line $i padding padding padding\"; done\nexit 1\n");
    expect(r.status).toBe(1);
    expect(r.summary.length).toBeLessThan(200_000);
    // the TAIL is what is kept: a gate prints its verdict last
    expect(r.summary).toContain("line 5000");
    expect(r.summary).not.toContain("line 1 padding");
  });

  test("still runs the step when GITHUB_STEP_SUMMARY is unset (local use)", () => {
    const r = runStep("echo local\nexit 4\n", { summary: false });
    expect(r.status).toBe(4);
    expect(r.stdout).toContain("local");
  });

  // ANNOTATIONS, which is the channel that actually reaches a reader outside
  // the log host. `$GITHUB_STEP_SUMMARY` does NOT populate a check run's
  // `output.summary` — measured on #2016 against a real red `Repository gates`:
  // title null, summary null, annotations only "Process completed with exit
  // code 1". The premise this script was first written on was false, so these
  // tests cover the mechanism that replaced it.
  test("emits exactly ONE ::error:: line, since the command takes a single line", () => {
    const lines = runStep("echo a\necho b\nexit 1\n").stdout.split("\n").filter((l) => l.startsWith("::error"));
    expect(lines.length).toBe(1);
  });

  test("escapes newlines as %0A — a literal one would end the command early", () => {
    const line = runStep("echo first\necho second\nexit 1\n").stdout.split("\n").find((l) => l.startsWith("::error"))!;
    expect(line).toContain("%0A");
    expect(line).toContain("first");
    expect(line).toContain("second");
  });

  test("escapes a literal % as %25, in the OUTPUT and in the command", () => {
    // Found by test rather than by reading: the command half was unescaped at
    // first, so a gate printing `50%` corrupted its own annotation.
    const line = runStep('echo "stale: 50% of files"\nexit 1\n').stdout.split("\n").find((l) => l.startsWith("::error"))!;
    expect(line).toContain("50%25 of files");
    expect(line).not.toMatch(/50% of/);
  });

  test("bounds the annotation — GitHub truncates a long one silently", () => {
    const line = runStep("for i in $(seq 1 4000); do echo \"line $i padding\"; done\nexit 1\n")
      .stdout.split("\n").find((l) => l.startsWith("::error"))!;
    expect(line.length).toBeLessThan(6000);
    expect(line).toContain("line 4000");   // the tail is what survives
  });

  test("a passing step emits no annotation at all", () => {
    expect(runStep("echo fine\n").stdout).not.toContain("::error");
  });

  test("says so in the annotation when the step printed nothing", () => {
    const line = runStep("false\n").stdout.split("\n").find((l) => l.startsWith("::error"))!;
    expect(line).toContain("printed nothing");
  });

  test("refuses a missing step script rather than passing vacuously", () => {
    const r = spawnSync(SHELL, [join(tmpdir(), "definitely-not-here.sh")], { encoding: "utf-8" });
    expect(r.status).toBe(2);
  });
});

/**
 * The workflow's side of the contract, which nothing local could otherwise
 * check. A custom `shell:` command is resolved THROUGH PATH, not against the
 * workspace — measured on #2016, where
 *
 *     shell: cat-harness/scripts/gate-shell.sh {0}
 *
 * made every one of the 13 jobs fail with `Could not find a part of the path
 * '/opt/pipx_bin/cat-harness/scripts'` — the runner's first PATH entry with
 * the relative path appended. Invoking the script directly, as the tests
 * above do, cannot reproduce that, so only this shape check stands between
 * the repository and a repeat.
 */
describe("code-quality-gates.yml wires gate-shell.sh in a form a runner can resolve", () => {
  const WORKFLOW = join(import.meta.dir, "..", "..", "..", ".github", "workflows", "code-quality-gates.yml");
  const shells = readFileSync(WORKFLOW, "utf-8")
    .split("\n")
    .filter((l) => /^\s*shell:/.test(l))
    .map((l) => l.replace(/^\s*shell:\s*/, "").trim());

  test("at least one job opts in, or the whole mechanism is dead code", () => {
    expect(shells.length).toBeGreaterThan(0);
  });

  test("every `shell:` names bash and an ABSOLUTE path, never a relative one", () => {
    for (const s of shells) {
      // `bash` first: certainly on PATH, and `PIPESTATUS` is bash-only.
      expect(s.startsWith("bash ")).toBe(true);
      // The path must not be resolved against PATH or against the cwd.
      expect(s).toContain("${{ github.workspace }}/");
      expect(s).toMatch(/\{0\}$/);
      expect(s).not.toMatch(/bash\s+cat-harness\//);
    }
  });

  test("the script every `shell:` points at exists at that repo path", () => {
    for (const s of shells) {
      const rel = s.replace(/^bash\s+\$\{\{ github\.workspace \}\}\//, "").replace(/\s+\{0\}$/, "");
      expect(existsSync(join(import.meta.dir, "..", "..", "..", rel))).toBe(true);
    }
  });
});
