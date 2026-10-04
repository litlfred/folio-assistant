/**
 * `merge-main.yml` must be able to fire on the PRs it exists for — bean `d33q`.
 *
 * Measured 2026-10-02: labelling 4 CONFLICTED PRs started 0 runs. The label
 * trigger was `pull_request`, and GitHub runs no `pull_request` workflow for a
 * PR without a merge ref — which is every conflicted one. The fix moved it to
 * `pull_request_target`, which carries a write token; so the same-repository
 * guard that makes that safe is pinned here too, together with its position
 * (before the checkout, in the job that checks out).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { composeComment, parseLog, type CommentInput } from "../merge-main-comment.ts";

const WORKFLOW = join(resolve(import.meta.dir, "../../.."), ".github", "workflows", "merge-main.yml");

interface Step { name?: string; uses?: string; run?: string }
interface Doc {
  on?: Record<string, { types?: string[]; inputs?: Record<string, { required?: boolean }> } | null>;
  true?: Doc["on"];
  jobs: Record<string, { if?: string; steps: Step[] }>;
}
const doc = Bun.YAML.parse(readFileSync(WORKFLOW, "utf-8")) as Doc;
const on = (doc.on ?? doc.true)!;

/** A finished, non-cancelled run with nothing to report; each test sets what it is about. */
const BASE: CommentInput = {
  jobStatus: "success", status: "1", merged: "false", pushed: "no", blocked: "", rejected: "",
  sha: "", log: "", marker: "<!-- merge-main-bot -->", runUrl: "https://example.invalid/run",
  mainFailing: () => "",
};

describe("merge-main.yml triggers", () => {
  test("the label trigger is pull_request_target, which fires on a conflicted PR", () => {
    expect(on.pull_request_target?.types).toEqual(["labeled"]);
    // `pull_request` would silently never fire for a PR with no merge ref.
    expect("pull_request" in on).toBe(false);
  });

  test("never on synchronize: its own push to a PR branch must not re-fire it", () => {
    for (const t of Object.values(on)) expect(t?.types ?? []).not.toContain("synchronize");
  });

  test("a dispatch with no PR is allowed, and sweeps", () => {
    expect(on.workflow_dispatch?.inputs?.pr?.required).toBe(false);
    const select = doc.jobs.select!.steps.map((s) => s.run ?? "").join("\n");
    expect(select).toMatch(/case "\$candidates" in\s*\n\s*""\) candidates=\$\(gh api/);
  });

  test("the job conditions name the trigger that exists", () => {
    expect(doc.jobs.select!.if).toContain("pull_request_target");
  });
});

describe("the write token never meets a fork", () => {
  test("select keeps only same-repository heads", () => {
    const select = doc.jobs.select!.steps.map((s) => s.run ?? "").join("\n");
    expect(select).toContain(".head.repo.full_name == .base.repo.full_name");
  });

  test("the merge job re-checks it BEFORE its checkout step", () => {
    const steps = doc.jobs.merge!.steps;
    const guard = steps.findIndex((s) => (s.run ?? "").includes(".head.repo.full_name == .base.repo.full_name"));
    const checkout = steps.findIndex((s) => (s.uses ?? "").startsWith("actions/checkout"));
    expect(guard).toBeGreaterThanOrEqual(0);
    expect(checkout).toBeGreaterThan(guard);
    expect(steps[guard]!.run).toContain("exit 1");
  });
});

describe("the merge runs main's tool, and fails loudly", () => {
  // Measured 2026-10-02 on 7 real runs: `bun run merge:main` resolved the
  // script from the PR's OWN package.json, which an old branch lacks —
  // `Script not found` every time, and every job green.
  const steps = doc.jobs.merge!.steps;
  const runOf = (s: Step) => s.run ?? "";
  const merge = steps.findIndex((s) => (s as { id?: string }).id === "merge");
  const tool = steps.findIndex((s) => runOf(s).includes('worktree add --detach "$RUNNER_TEMP/tool" origin/main'));

  test("main's merge-base.ts is checked out outside the tree, before the merge", () => {
    expect(tool).toBeGreaterThanOrEqual(0);
    expect(merge).toBeGreaterThan(tool);
  });

  test("the merge step runs that copy against the PR with --root, never the PR's script", () => {
    const run = runOf(steps[merge]!);
    expect(run).toContain('bun run "$RUNNER_TEMP/tool/cat-harness/scripts/merge-base.ts" --root "$GITHUB_WORKSPACE"');
    for (const s of steps) expect(runOf(s)).not.toMatch(/bun run merge:main\b/);
  });

  test("a non-zero exit that is not a refusal fails the job, after the comment", () => {
    const fail = steps.findIndex((s) => /refused != 'true'/.test((s as { if?: string }).if ?? ""));
    const comment = steps.findIndex((s) => s.name?.startsWith("Comment once"));
    expect(fail).toBeGreaterThan(comment);
    expect(runOf(steps[fail]!)).toContain("exit 1");
    expect(runOf(steps[merge]!)).toContain('echo "refused=true"');
  });
});

describe("a rejected fast-forward is an expected race, not a red check", () => {
  // Measured 2026-10-02 on #1790 (run 36981901740): the branch moved during
  // the run, the push was rejected, and the job failed — a red check reading
  // as a CI failure for something that is, like a refusal, reported and retried.
  const steps = doc.jobs.merge!.steps;
  const push = steps.find((s) => (s as { id?: string }).id === "push")!;

  test("the push step exits 0 when the branch moved, and says so", () => {
    expect(push.run).toContain('echo "rejected=true"');
    expect(push.run).toMatch(/if \[ -n "\$now" \] && \[ "\$now" != "\$SELECTED" \]; then[\s\S]*?exit 0/);
  });

  test("any other push failure still fails", () => {
    expect(push.run).toMatch(/push failed although the branch did not move"\s*\n\s*exit 1/);
  });

  test("nothing downstream reads the push step's OUTCOME as 'pushed'", () => {
    for (const s of steps) {
      expect(JSON.stringify(s)).not.toContain("steps.push.outcome == 'success'");
    }
  });
});

describe("a push refusal is read from stderr, not guessed", () => {
  // Measured 2026-10-02 on #1790: GitHub refused because the merge commit
  // changed a workflow file and GITHUB_TOKEN has no `workflows` permission —
  // and the comment said "the branch moved", which was false.
  const steps = doc.jobs.merge!.steps;
  const push = steps.find((s) => (s as { id?: string }).id === "push")!;

  test("(a) stderr is captured and the workflows refusal is recognised before the branch-moved check", () => {
    const run = push.run!;
    expect(run).toContain('2> "$RUNNER_TEMP/push.err"');
    const wf = run.indexOf("refusing to allow a GitHub App to create or update workflow");
    const moved = run.indexOf('echo "rejected=true"');
    expect(wf).toBeGreaterThan(0);
    expect(moved).toBeGreaterThan(wf);
    expect(run).toContain('echo "blocked=workflows"');
  });

  test("(b) the workflows refusal labels needs-merge-human and names the credentials design", () => {
    const p = composeComment({ ...BASE, merged: "true", blocked: "workflows" });
    if (p.action !== "write") throw new Error("expected a comment");
    expect(p.labelNeedsHuman).toBe(true);
    expect(p.body).toContain("#1829");
    expect(p.body).not.toContain("branch moved");
  });

  test("(c) 'the branch moved' is said only when the push step said so", () => {
    const moved = composeComment({ ...BASE, merged: "true", rejected: "true" });
    const other = composeComment({ ...BASE, merged: "true" });
    expect(moved.action === "write" && moved.body).toContain("the branch moved during the run");
    expect(other.action === "write" && other.body).not.toContain("the branch moved");
  });

  test("the dispatch fallback runs every gating workflow, JSON-LD drift included", () => {
    const judge = steps.find((s) => s.name === "Have CI judge the merge commit")!;
    expect(judge.run).toContain("code-quality-gates.yml jsonld-gen-check.yml");
  });
});

describe("a cancelled or unfinished run is not an error (#1854)", () => {
  // Measured 2026-10-02 on #1777 (run 36986362911): a newer push to main
  // cancelled the job mid-merge, the always() comment step ran with an empty
  // STATUS, and the comment became "**Error** (exit ) — merge-base failed …".
  const steps = doc.jobs.merge!.steps;
  const comment = steps.find((s) => s.name?.startsWith("Comment once"))! as Step & { if?: string; env?: Record<string, string> };

  test("empty status: the comment is left alone, and no error text is composed", () => {
    const p = composeComment({ ...BASE, status: "" });
    expect(p.action).toBe("leave");
    expect(JSON.stringify(p)).not.toContain("**Error**");
  });

  test("cancelled: superseded, the comment is left alone — even when a status was written", () => {
    for (const status of ["", "1"]) {
      const p = composeComment({ ...BASE, jobStatus: "cancelled", status });
      expect(p.action).toBe("leave");
      if (p.action === "leave") expect(p.reason).toContain("superseded");
    }
  });

  test("a real non-zero status with no refusal or unrepaired check is still the Error text", () => {
    const p = composeComment({ ...BASE, status: "2" });
    expect(p.action).toBe("write");
    if (p.action === "write") {
      expect(p.body).toContain("**Error** (exit 2) — merge-base failed for a reason that is neither a refusal nor an unrepaired check");
      expect(p.body.startsWith("<!-- merge-main-bot -->\n")).toBe(true);
      expect(p.labelNeedsHuman).toBe(false);
    }
  });

  test("the other outcomes keep their texts", () => {
    const log = [
      "  ✓ cat-harness/docs/glossary/index.md  [glossary: take-base]",
      "  ✓ cat-harness/docs/lsi/x.md  [glossary: take-base]",
      "  ✓ a.qa-results.json  [qa-results: take-base]",
      "  ✗ beans/defs/x.md  [beans: refuse] — authored",
    ].join("\n");
    expect(parseLog(log).resolved).toBe("- `glossary`: 2\n- `qa-results`: 1");
    const refused = composeComment({ ...BASE, log });
    expect(refused.action === "write" && refused.labelNeedsHuman).toBe(true);
    expect(refused.action === "write" && refused.body).toContain("**Refused — nothing pushed.**");
    expect(refused.action === "write" && refused.body).toContain("Refused:\n- beans/defs/x.md  [beans: refuse] — authored");
    const upToDate = composeComment({ ...BASE, status: "0" });
    expect(upToDate.action === "write" && upToDate.body).toContain("**Already up to date with `main`.**");
    const pushed = composeComment({ ...BASE, status: "0", merged: "true", pushed: "success", sha: "0123456789abcdef", log });
    expect(pushed.action === "write" && pushed.body).toContain("**Merged `main` and pushed `012345678`.**");
    let asked = 0;
    const unproved = composeComment({ ...BASE, log: "    ✗ check:x STILL fails", mainFailing: () => { asked++; return "TypeScript"; } });
    expect(unproved.action === "write" && unproved.body).toContain("Failing on main right now: TypeScript.");
    expect(asked).toBe(1);
  });

  test("main's CI is asked only when the outcome reports it", () => {
    let asked = 0;
    composeComment({ ...BASE, status: "0", mainFailing: () => { asked++; return ""; } });
    composeComment({ ...BASE, status: "", mainFailing: () => { asked++; return ""; } });
    expect(asked).toBe(0);
  });

  test("the workflow hands the job status to main's copy of the composer", () => {
    expect(comment.env?.JOB_STATUS).toBe("${{ job.status }}");
    expect(comment.run).toContain('bun run "$RUNNER_TEMP/tool/cat-harness/scripts/merge-main-comment.ts" --log "$RUNNER_TEMP/merge.log"');
    // `leave` exits before any write to the PR.
    const run = comment.run!;
    expect(run.indexOf("= leave ]")).toBeGreaterThan(0);
    expect(run.indexOf("= leave ]")).toBeLessThan(run.indexOf("gh api -X PATCH"));
    expect(run).not.toContain("**Error**");
  });

  test("a cancelled merge step never trips the failure step", () => {
    const fail = steps.find((s) => /refused != 'true'/.test((s as { if?: string }).if ?? ""))! as Step & { if?: string };
    expect(fail.if).toContain("steps.merge.outcome == 'success'");
  });
});

describe("a clean run clears an earlier refusal's label — bean wczm item 3", () => {
  const LOG = "  ✗ cat-harness/x.ts  [no declared pattern]";
  const write = (p: ReturnType<typeof composeComment>) => {
    if (p.action !== "write") throw new Error("expected a write");
    return p;
  };
  test("merged and pushed, or already up to date: clear it", () => {
    expect(write(composeComment({ ...BASE, status: "0", merged: "true", pushed: "success", sha: "0123456789abcdef" })).clearNeedsHuman).toBe(true);
    expect(write(composeComment({ ...BASE, status: "0" })).clearNeedsHuman).toBe(true);
  });
  test("a refusal, an unproved merge, a blocked or failed push, or an error: leave it", () => {
    expect(write(composeComment({ ...BASE, log: LOG })).clearNeedsHuman).toBe(false);
    expect(write(composeComment({ ...BASE, log: "    ✗ check:x STILL fails" })).clearNeedsHuman).toBe(false);
    expect(write(composeComment({ ...BASE, merged: "true", blocked: "workflows" })).clearNeedsHuman).toBe(false);
    expect(write(composeComment({ ...BASE, merged: "true", rejected: "true" })).clearNeedsHuman).toBe(false);
    expect(write(composeComment({ ...BASE, status: "2" })).clearNeedsHuman).toBe(false);
  });
  test("the workflow acts on it, and only when the label is there", () => {
    const wf = readFileSync(WORKFLOW, "utf-8");
    expect(wf).toContain("jq -r .clearNeedsHuman");
    expect(wf).toMatch(/grep -qx needs-merge-human; then[\s\S]{0,120}--remove-label needs-merge-human/);
  });
});
