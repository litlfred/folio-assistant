import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * Exit-code contract for `check-ci-health.ts`.
 *
 * Two callers depend on it and want opposite things, which is the entire reason
 * `--out` exists as a separate flag from `--markdown`:
 *
 *   - `session-start-coord-sweep.sh` runs `--markdown` as
 *     `if ! bun run … --markdown; then <print "Not checked — treat as unknown">`.
 *     If `--markdown` ever exited non-zero on a red, the sweep would print the
 *     report AND declare it unchecked, every single time CI was red.
 *   - `ci-health.yml` needs the report body *and* a real verdict, and must
 *     never close its tracking issue on a repo it could not check.
 *
 * These run against a git repo with no `origin`, which drives the checker into
 * its `unreachable` branch without touching the network — so the tests are
 * deterministic and offline. Bean `ynu8`.
 */

const SCRIPT = resolve(import.meta.dir, "../check-ci-health.ts");
let repo: string;

const run = (args: string[]): { code: number; stdout: string; stderr: string } => {
  const r = Bun.spawnSync(["bun", "run", SCRIPT, ...args], { cwd: repo });
  return {
    code: r.exitCode,
    stdout: new TextDecoder().decode(r.stdout),
    stderr: new TextDecoder().decode(r.stderr),
  };
};

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "ci-health-cli-"));
  // A git repo with no remote: `originSlug()` finds nothing to ask about.
  execFileSync("git", ["init", "-q"], { cwd: repo });
});
afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe("the exit-code contract", () => {
  test("a repo it cannot check exits 2 — not 0", () => {
    // Exiting 0 here would make "could not look" indistinguishable from
    // "looked and it was fine", which is the failure this module exists to
    // prevent, one level up.
    expect(run([]).code).toBe(2);
  });

  test("--markdown ALWAYS exits 0, even when it could not check", () => {
    // Load-bearing for session-start-coord-sweep.sh — see the header.
    expect(run(["--markdown"]).code).toBe(0);
  });

  test("--markdown prints the unknown report rather than nothing", () => {
    const { stdout } = run(["--markdown"]);
    expect(stdout).toContain("Not checked");
    expect(stdout).toContain("treat as unknown, not as green");
  });

  test("--warn reports without failing", () => {
    expect(run(["--warn"]).code).toBe(0);
  });
});

describe("--out: the report AND the verdict, from one API call", () => {
  test("writes the report and still exits 2 when it could not check", () => {
    const out = join(repo, "report.md");
    expect(run(["--out", out]).code).toBe(2);
    expect(readFileSync(out, "utf8")).toContain("Not checked");
  });

  test("--out=<path> is accepted too", () => {
    const out = join(repo, "report2.md");
    expect(run([`--out=${out}`]).code).toBe(2);
    expect(readFileSync(out, "utf8")).toContain("treat as unknown, not as green");
  });

  test("--out with no path is its own error, not the unreachable exit", () => {
    // Both exit 2 in this fixture, so the code alone proves nothing — the
    // message is what distinguishes a misused flag from a repo it could not
    // reach, and a flag that silently wrote nowhere would be the worse bug.
    const { code, stderr } = run(["--out"]);
    expect(code).toBe(2);
    expect(stderr).toContain("--out needs a file path");
  });
});
