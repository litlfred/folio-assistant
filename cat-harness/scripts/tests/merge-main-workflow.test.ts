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

const WORKFLOW = join(resolve(import.meta.dir, "../../.."), ".github", "workflows", "merge-main.yml");

interface Step { name?: string; uses?: string; run?: string }
interface Doc {
  on?: Record<string, { types?: string[]; inputs?: Record<string, { required?: boolean }> } | null>;
  true?: Doc["on"];
  jobs: Record<string, { if?: string; steps: Step[] }>;
}
const doc = Bun.YAML.parse(readFileSync(WORKFLOW, "utf-8")) as Doc;
const on = (doc.on ?? doc.true)!;

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
  const comment = steps.find((s) => s.name?.startsWith("Comment once"))!;

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
    const run = comment.run!;
    const branch = run.slice(run.indexOf('[ "$BLOCKED" = workflows ]'), run.indexOf('[ "$REJECTED" = true ]'));
    expect(branch).toContain("--add-label needs-merge-human");
    expect(branch).toContain("#1829");
    expect(branch).not.toContain("branch moved");
  });

  test("(c) 'the branch moved' is said only when the push step said so", () => {
    const run = comment.run!;
    const at = run.indexOf("the branch moved during the run");
    expect(at).toBeGreaterThan(run.indexOf('[ "$REJECTED" = true ]'));
  });

  test("the dispatch fallback runs every gating workflow, JSON-LD drift included", () => {
    const judge = steps.find((s) => s.name === "Have CI judge the merge commit")!;
    expect(judge.run).toContain("code-quality-gates.yml jsonld-gen-check.yml");
  });
});
