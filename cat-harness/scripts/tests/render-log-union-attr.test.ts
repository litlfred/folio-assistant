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
import { mkdtempSync, mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, normalize } from "node:path";
import { parse as parseYaml } from "yaml";

const SCRIPT = join(import.meta.dir, "..", "render-log-union-attr.sh");
const LOG = "_render-log/2026-09-20.jsonl";

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const WORKFLOW_PATH = join(REPO_ROOT, ".github", "workflows", "feature-staging.yml");
const WORKFLOW = readFileSync(WORKFLOW_PATH, "utf8");

/** Resolve a literal against the cwd its step runs in, job-root-relative. */
function resolveFrom(cwd: string, literal: string): string {
  return normalize(join(cwd, literal)).replace(/\\/g, "/");
}

/**
 * Every `render-log-union-attr.sh` invocation, resolved the way the runner
 * will resolve it: against the job's checkout layout and the step's
 * `working-directory:`, then mapped back to a path inside THIS repository.
 *
 * A job whose platform checkout carries a `path:` has nothing at its root, so
 * a bare `cat-harness/...` there names a directory that does not exist. That
 * is the defect this reads for, and it is invisible to a text match: the same
 * literal is correct in `stage` and wrong in `cleanup`.
 *
 * `resolved` is null when the literal lands outside the platform checkout —
 * which is a failure to report, never a path to go looking for on disk.
 */
function callSites(): { job: string; literal: string; cwd: string; resolved: string | null }[] {
  const wf = parseYaml(WORKFLOW) as {
    jobs: Record<
      string,
      { steps?: { uses?: string; run?: string; with?: Record<string, string>; "working-directory"?: string }[] }
    >;
  };
  const out: { job: string; literal: string; cwd: string; resolved: string | null }[] = [];

  for (const [job, def] of Object.entries(wf.jobs ?? {})) {
    // The platform checkout is the one that does NOT name another branch.
    // `path:` omitted means the job root.
    let platformAt = "";
    for (const step of def.steps ?? []) {
      if (!step.uses?.startsWith("actions/checkout")) continue;
      if (step.with?.ref) continue;
      platformAt = step.with?.path ?? "";
      break;
    }
    const prefix = platformAt ? `${platformAt.replace(/\/+$/, "")}/` : "";

    for (const step of def.steps ?? []) {
      if (!step.run?.includes("render-log-union-attr.sh")) continue;
      const cwd = step["working-directory"] ?? "";
      for (const line of step.run.split("\n")) {
        const m = /bash\s+(\S*render-log-union-attr\.sh)/.exec(line);
        if (!m) continue;
        const fromJobRoot = resolveFrom(cwd, m[1]);
        // Map job-root-relative back into the repository, via wherever the
        // platform was checked out. Anything outside it cannot resolve.
        const resolved = fromJobRoot.startsWith(prefix) ? fromJobRoot.slice(prefix.length) : null;
        out.push({ job, literal: m[1], cwd, resolved });
      }
    }
  }
  return out;
}


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
    const wf = WORKFLOW.split("\n");

    const pulls = wf.flatMap((l, i) => (/git (?:-C pages )?pull --rebase origin gh-pages/.test(l) ? [i] : []));
    expect(pulls.length).toBe(4);
    for (const i of pulls) {
      const before = wf.slice(Math.max(0, i - 4), i).join("\n");
      expect(before).toContain("render-log-union-attr.sh");
    }
  });

  test("...and every call RESOLVES from the cwd its step actually runs in", () => {
    // The test above pins that the call is THERE. It cannot see whether the
    // path works, because it matches a substring of a line whose meaning
    // depends on where the step stands — and two of the four call sites
    // shipped naming `cat-harness/...` inside a job that checks the platform
    // out at `source/`, where `bash` exits 127 and, under `bash -e`, takes the
    // whole retry with it. The call existed; the retry it guards did not run.
    //
    // So resolve each literal the way the runner will: against the job's
    // checkout layout, then the step's `working-directory:`. Bean `7iog`,
    // scoped to this one script.
    const sites = callSites();
    expect(sites.length).toBe(4);

    const unresolved = sites.filter((s) => s.resolved === null || !existsSync(join(REPO_ROOT, s.resolved)));
    expect(unresolved.map((s) => `${s.job}: ${s.literal} -> ${s.resolved ?? "outside the platform checkout"}`)).toEqual([]);
  });

  test("a path that is right for ANOTHER job is caught, not waved through", () => {
    // Falsifies the check above: `stage` keeps the platform at the job root,
    // so its own literal is bare — and that same literal is what was wrong in
    // `cleanup`. A checker keyed on the text rather than the cwd passes both.
    const byJob = (j: string) => callSites().filter((s) => s.job === j);
    expect(byJob("stage").length).toBeGreaterThan(0);
    expect(byJob("cleanup").length).toBeGreaterThan(0);

    // `stage` keeps the platform at the job root, so its literal is bare...
    for (const s of byJob("stage")) expect(s.literal.startsWith("cat-harness/")).toBe(true);
    // ...and that very literal, which is what shipped in `cleanup`, does not
    // reach the platform there. A checker keyed on the text passes both.
    for (const s of byJob("cleanup")) {
      expect(s.literal.startsWith("source/cat-harness/")).toBe(true);
      const asStageWroteIt = resolveFrom(s.cwd, "cat-harness/scripts/render-log-union-attr.sh");
      expect(asStageWroteIt.startsWith("source/")).toBe(false);
    }
  });

  test("it FAILS rather than no-ops when the attribute does not take effect", () => {
    // A silent no-op is the failure mode the script exists to prevent, so the
    // script probes itself with `check-attr`. Falsified by neutering the write.
    const { b } = interleaved();
    const neutered = join(mkdtempSync(join(tmpdir(), "neutered-")), "render-log-union-attr.sh");
    writeFileSync(neutered, readFileSync(SCRIPT, "utf8").replace(/^\s*printf '_render-log.*$/m, "  :"));

    expect(() => execFileSync("bash", [neutered, b], { encoding: "utf8", stdio: "pipe" })).toThrow();
    // ...and the unmutated script on the same checkout does not throw.
    expect(() => execFileSync("bash", [SCRIPT, b], { encoding: "utf8", stdio: "pipe" })).not.toThrow();
  });
});
