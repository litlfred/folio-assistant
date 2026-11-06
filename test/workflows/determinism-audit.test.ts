/**
 * The determinism audit (`.github/scripts/determinism-audit.sh`), run for
 * real in a throwaway git repository: it resets the tree between the two
 * runs with `git clean -fdx`, which is only safe in a repository made for
 * the test. A deterministic producer must be reported DETERMINISTIC, one
 * that stamps the clock must be reported as differing, and one that fails
 * must be COULD NOT DETERMINE — never deterministic.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const SCRIPT = resolve(import.meta.dir, "..", "..", ".github", "scripts", "determinism-audit.sh");

function repo(): string {
  const d = mkdtempSync(join(tmpdir(), "det-audit-"));
  const g = (...a: string[]) => spawnSync("git", a, { cwd: d, encoding: "utf8" });
  g("init", "-q");
  writeFileSync(join(d, ".gitignore"), "out/\n");
  writeFileSync(join(d, "index.config.json"), JSON.stringify({ instances: [] }));
  g("add", "-A");
  spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "init"], { cwd: d });
  return d;
}

function audit(cwd: string, producers: string, out: string) {
  const r = spawnSync("bash", [SCRIPT], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, CI: "true", OUT: out, AUDIT_PRODUCERS: producers, GITHUB_STEP_SUMMARY: "" },
  });
  return { code: r.status, report: readFileSync(join(out, "report.md"), "utf8"), stderr: r.stderr };
}

describe("determinism audit", () => {
  test("deterministic, clock-stamping and failing producers are told apart", () => {
    const d = repo();
    const out = mkdtempSync(join(tmpdir(), "det-out-"));
    const producers = [
      "same|mkdir -p out && echo fixed > out/a.txt",
      "clock|mkdir -p out && date +%s%N > out/t.txt",
      "broken|exit 7",
    ].join("\n");
    const r = audit(d, producers, out);
    expect(r.report).toContain("## `same` — DETERMINISTIC");
    expect(r.report).toMatch(/## `clock` — 1 of 1 files DIFFER/);
    expect(r.report).toContain("## `broken` — COULD NOT DETERMINE");
    expect(r.code).toBe(3); // a producer that could not run outranks a difference
  }, 60_000);

  test("a producer's writes into an ignored mount are put back by every reset", () => {
    // A mounted layer is an ignored directory; a reset that skipped it left run
    // 1's writes there, so run 2 saw a drifted mount (CI, 2026-11-06).
    const d = repo();
    writeFileSync(join(d, ".gitignore"), "out/\nmnt/\n");
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qam", "ignore mnt"], { cwd: d });
    spawnSync("mkdir", ["-p", join(d, "mnt")]);
    writeFileSync(join(d, "mnt", "f"), "a");
    const out = mkdtempSync(join(tmpdir(), "det-out-"));
    const r = audit(d, "append|printf a >> mnt/f", out);
    expect(r.report).toContain("## `append` — DETERMINISTIC");
    expect(readFileSync(join(d, "mnt", "f"), "utf8")).toBe("a");
    expect(r.code).toBe(0);
  }, 60_000);

  test("a prerequisite's writes are not the producer's, and a failure's log is in the report", () => {
    const d = repo();
    const out = mkdtempSync(join(tmpdir(), "det-out-"));
    const producers = [
      // The prerequisite stamps the clock; only what the producer writes is measured.
      "reads|mkdir -p out && cp out/in.txt out/copy.txt|mkdir -p out && date +%s%N > out/clock.txt && echo fixed > out/in.txt",
      "noisy|echo 'the reason it failed' >&2; exit 4",
    ].join("\n");
    const r = audit(d, producers, out);
    expect(r.report).toContain("## `reads` — DETERMINISTIC");
    expect(r.report).toContain("## `noisy` — COULD NOT DETERMINE");
    expect(r.report).toContain("the reason it failed");
  }, 60_000);

  test("its output must live outside the checkout, where the reset cannot delete it", () => {
    const d = repo();
    const r = spawnSync("bash", [SCRIPT], { cwd: d, encoding: "utf8", env: { ...process.env, CI: "true", OUT: join(d, "build", "det"), AUDIT_PRODUCERS: "x|true" } });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("must be outside the checkout");
  });
});
