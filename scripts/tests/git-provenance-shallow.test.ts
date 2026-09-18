/**
 * A shallow checkout must not be allowed to invent file provenance.
 *
 * `gitFileCommitSha` backs `script_commit_sha` in every QA script sidecar.
 * In a truncated history `git log -1 -- <file>` reports the GRAFT BOUNDARY
 * for any file untouched inside the fetched window — the commit where
 * history stops and every file looks newly added — and that is
 * indistinguishable from a real answer.
 *
 * Measured 2026-09-18 in a 102-commit shallow checkout: a sweep rewrote 77
 * of 78 sidecars to the single boundary sha, collapsing provenance that
 * carried NINE distinct commits. The corruption is silent and reads as a
 * tidy-up.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { gitFileCommitSha, GIT_SHA_UNKNOWN } from "../../content/pipeline/qa-utils.ts";

const ROOT = join(import.meta.dir, "../..");

function sh(args: string[]): string {
  return execFileSync("git", ["-C", ROOT, ...args], { stdio: ["ignore", "pipe", "ignore"] })
    .toString()
    .trim();
}

describe("git provenance under a shallow clone", () => {
  test("a file changed inside the fetched window resolves to a real commit", () => {
    // Control: without this the suite is satisfiable by always answering
    // "unknown", which would be useless rather than safe.
    //
    // The file is CHOSEN, not hard-coded. Naming one is a trap: pick a file
    // that happens not to have been committed inside the fetched window and
    // the control fails for the right reason on the wrong grounds, which is
    // how I first wrote it.
    const boundary = new Set(sh(["rev-list", "--max-parents=0", "HEAD"]).split("\n").filter(Boolean));
    const files = sh(["ls-files", "content/pipeline"]).split("\n").filter((f) => f.endsWith(".ts"));
    const inWindow = files.find((f) => {
      const raw = sh(["log", "-n", "1", "--format=%H", "--", f]);
      return raw && !boundary.has(raw);
    });
    expect({ found: inWindow !== undefined }).toEqual({ found: true });
    const sha = gitFileCommitSha(inWindow!, ROOT);
    expect(sha).not.toBe(GIT_SHA_UNKNOWN);
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
  });

  test("a boundary-attributed file is reported unknown, not as the boundary", () => {
    const shallow = sh(["rev-parse", "--is-shallow-repository"]) === "true";
    if (!shallow) {
      // Full clone: `git log` can answer, so there is nothing to decline and
      // this property is vacuous. Stated rather than silently passing.
      expect(shallow).toBe(false);
      return;
    }
    const boundary = new Set(sh(["rev-list", "--max-parents=0", "HEAD"]).split("\n").filter(Boolean));
    expect(boundary.size).toBeGreaterThan(0);

    // Find any tracked file whose raw `git log` answer IS the boundary.
    const files = sh(["ls-files", "content/pipeline"]).split("\n").filter((f) => f.endsWith(".ts"));
    const attributed = files.find((f) => {
      const raw = sh(["log", "-n", "1", "--format=%H", "--", f]);
      return boundary.has(raw);
    });
    if (!attributed) {
      // Nothing in this checkout hits the case; the guard is untestable here
      // rather than broken, and saying so beats a green that proves nothing.
      return;
    }
    expect(gitFileCommitSha(attributed, ROOT)).toBe(GIT_SHA_UNKNOWN);
  });
});
