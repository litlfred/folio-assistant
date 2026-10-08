/**
 * `gate-shell` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness/scripts/tests/gate-shell.test.ts` (bean `7zz1`): they read
 * `.github/workflows/code-quality-gates.yml`, which only the checkout holds.
 * Standing alone, cat-harness has no workflows, and
 * `check:cat-harness-standalone` collects every test in that layer. The
 * script-level tests of `gate-shell.sh` stay there.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../cat-harness/scripts/tests");
/** The checkout root, three levels up from the origin directory as before. */
const REPO = join(ORIGIN_DIR, "..", "..", "..");

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
  const WORKFLOW = join(REPO, ".github", "workflows", "code-quality-gates.yml");
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
      expect(existsSync(join(REPO, rel))).toBe(true);
    }
  });
});
