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
    expect(r.stdout).not.toContain("NOT-REACHED");
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

  test("refuses a missing step script rather than passing vacuously", () => {
    const r = spawnSync(SHELL, [join(tmpdir(), "definitely-not-here.sh")], { encoding: "utf-8" });
    expect(r.status).toBe(2);
  });
});
