/**
 * Every `render-log-union-attr.sh` call in `feature-staging.yml` is there, and
 * resolves — bean `pb4n`, `7iog`.
 *
 * The half of cat-harness's `scripts/tests/render-log-union-attr.test.ts` that
 * reads this repository's own `.github/workflows/feature-staging.yml`, moved
 * here (owner's ruling 2026-10-09, litlfred/folio-assistant#2521, ruling
 * 1(c)). The script's own behaviour — that it makes the rebase succeed, and
 * fails rather than no-ops — is tested beside it, in cat-harness.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join, normalize } from "node:path";
import { parse as parseYaml } from "yaml";

/** This index repository's root: the workflows, and the mounted platform they call. */
const REPO_ROOT = join(import.meta.dir, "..", "..");
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

describe("render-log-union-attr.sh", () => {
  test("every gh-pages rebase in feature-staging.yml is preceded by it", () => {
    // The script is worth nothing where it is not called, and there are THREE
    // rebasing push loops. This is the check that a fourth one cannot be added
    // silently. There were four until issue #1868: the `stage` loop now
    // re-reads `gh-pages` and rebuilds its commit on every attempt instead of
    // rebasing (its commit carries preview-cap removals, and a replayed
    // removal is a stale one), so it appends to a fresh log and never merges.
    const wf = WORKFLOW.split("\n");

    const pulls = wf.flatMap((l, i) => (/git (?:-C pages )?pull --rebase origin gh-pages/.test(l) ? [i] : []));
    expect(pulls.length).toBe(3);
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
    // Three since issue #1868 — see the count above.
    expect(sites.length).toBe(3);

    const unresolved = sites.filter((s) => s.resolved === null || !existsSync(join(REPO_ROOT, s.resolved)));
    expect(unresolved.map((s) => `${s.job}: ${s.literal} -> ${s.resolved ?? "outside the platform checkout"}`)).toEqual([]);
  });

  test("a path that is right for ANOTHER job is caught, not waved through", () => {
    // Falsifies the check above: `stage` keeps the platform at the job root,
    // so its own literal is bare — and that same literal is what was wrong in
    // `cleanup`. A checker keyed on the text rather than the cwd passes both.
    //
    // `stage` no longer calls the script (issue #1868: it re-reads instead of
    // rebasing), so the bare literal it used to carry is reconstructed here
    // rather than read from it.
    const byJob = (j: string) => callSites().filter((s) => s.job === j);
    expect(byJob("stage")).toEqual([]);
    expect(byJob("cleanup").length).toBeGreaterThan(0);

    // A job that keeps the platform at the job root would write it bare,
    // and that very literal, which is what shipped in `cleanup`, does not
    // reach the platform there. A checker keyed on the text passes both.
    for (const s of byJob("cleanup")) {
      expect(s.literal.startsWith("source/cat-harness/")).toBe(true);
      const asStageWroteIt = resolveFrom(s.cwd, "cat-harness/scripts/render-log-union-attr.sh");
      expect(asStageWroteIt.startsWith("source/")).toBe(false);
    }
  });
});
