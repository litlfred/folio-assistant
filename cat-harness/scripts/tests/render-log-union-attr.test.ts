/**
 * `render-log-union-attr.sh` — the fix for bean `pb4n`.
 *
 * @module scripts/tests/render-log-union-attr
 * @graphNode none — a test
 *
 * These tests do the thing the bean asks for and the CI log could not:
 * **falsify in both directions.** One builds the exact interleaving that fails
 * in CI and asserts it still fails without the attribute; the other asserts it
 * succeeds with it, AND that no line was lost. A test that only checked the
 * happy path would pass just as well against a script that did nothing.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, appendFileSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "render-log-union-attr.sh");
const LOG = "_render-log/2026-09-20.jsonl";

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

/**
 * Two clones of one publish branch, each having appended a line to the SAME
 * day's log, with the first already pushed — which is the state the second
 * job is in when its push is rejected.
 */
function interleaved(): { b: string } {
  const root = mkdtempSync(join(tmpdir(), "render-log-union-"));
  const origin = join(root, "origin.git");
  const a = join(root, "a");
  const b = join(root, "b");

  git(root, "init", "-q", "--bare", origin);
  mkdirSync(a);
  git(a, "init", "-q");
  git(a, "config", "user.email", "t@t");
  git(a, "config", "user.name", "t");
  git(a, "checkout", "-q", "-b", "gh-pages");
  mkdirSync(join(a, "_render-log"));
  writeFileSync(join(a, LOG), '{"at":"1","e":"base"}\n');
  git(a, "add", "-A");
  git(a, "commit", "-qm", "base");
  git(a, "remote", "add", "origin", origin);
  git(a, "push", "-q", "-u", "origin", "gh-pages");

  git(root, "clone", "-q", "-b", "gh-pages", origin, b);
  git(b, "config", "user.email", "t@t");
  git(b, "config", "user.name", "t");

  // A lands first.
  appendFileSync(join(a, LOG), '{"at":"2","e":"A"}\n');
  git(a, "add", "-A");
  git(a, "commit", "-qm", "A");
  git(a, "push", "-q", "origin", "gh-pages");

  // B has committed but not pushed — its push is the one that gets rejected.
  appendFileSync(join(b, LOG), '{"at":"3","e":"B"}\n');
  git(b, "add", "-A");
  git(b, "commit", "-qm", "B");
  return { b };
}

function rebases(dir: string): boolean {
  try {
    git(dir, "pull", "--rebase", "origin", "gh-pages");
    return true;
  } catch {
    return false;
  }
}

describe("render-log-union-attr.sh", () => {
  test("WITHOUT it the retry's rebase conflicts — the CI failure, reproduced", () => {
    const { b } = interleaved();
    expect(rebases(b)).toBe(false);
    // Unmerged, and in the file the bean names.
    expect(git(b, "status", "--porcelain")).toMatch(/^UU .*_render-log/m);
  });

  test("WITH it the rebase succeeds and BOTH sides' lines survive", () => {
    const { b } = interleaved();
    execFileSync("bash", [SCRIPT, b], { encoding: "utf8" });
    expect(rebases(b)).toBe(true);

    const lines = readFileSync(join(b, LOG), "utf8").trim().split("\n");
    // Three, not two: union must not drop either side's append. A fix that
    // resolved the conflict by taking one side would pass a "did it rebase"
    // check while losing a deploy record.
    expect(lines).toHaveLength(3);
    expect(lines.some((l) => l.includes('"A"'))).toBe(true);
    expect(lines.some((l) => l.includes('"B"'))).toBe(true);
  });

  test("it is idempotent — the rule is not appended twice", () => {
    const { b } = interleaved();
    execFileSync("bash", [SCRIPT, b], { encoding: "utf8" });
    execFileSync("bash", [SCRIPT, b], { encoding: "utf8" });
    const attrs = readFileSync(join(b, ".git", "info", "attributes"), "utf8");
    expect(attrs.match(/_render-log/g)).toHaveLength(1);
  });

  test("it is SCOPED to the render log, never to .jsonl at large", () => {
    // Widening it would silently union-merge files where a conflict is real
    // information. The bean says so; this pins it.
    const body = readFileSync(SCRIPT, "utf8");
    expect(body).toContain("_render-log/*.jsonl merge=union");
    expect(body).not.toMatch(/^\s*printf\s+'\*\.jsonl/m);
  });

  test("every gh-pages rebase in feature-staging.yml is preceded by it", () => {
    // The script is worth nothing where it is not called, and there are FOUR
    // push loops. This is the check that a fifth one cannot be added silently.
    const wf = readFileSync(
      join(import.meta.dir, "..", "..", "..", ".github", "workflows", "feature-staging.yml"),
      "utf8",
    ).split("\n");

    const pulls = wf.flatMap((l, i) => (/git (?:-C pages )?pull --rebase origin gh-pages/.test(l) ? [i] : []));
    expect(pulls.length).toBe(4);
    for (const i of pulls) {
      const before = wf.slice(Math.max(0, i - 4), i).join("\n");
      expect(before).toContain("render-log-union-attr.sh");
    }
  });
});
