/**
 * `merge-main.yml` must be able to fire on the PRs it exists for — bean `d33q`.
 *
 * Measured 2026-10-02: labelling 4 CONFLICTED PRs started 0 runs. The label
 * trigger was `pull_request`, and GitHub runs no `pull_request` workflow for a
 * PR without a merge ref — which is every conflicted one. The fix moved it to
 * `pull_request_target`, which carries a write token; so the same-repository
 * guard that makes that safe is pinned here too, together with its position
 * (before the checkout, in the job that checks out).
 *
 * The half of cat-harness's `scripts/tests/merge-main-workflow.test.ts` that
 * reads this repository's own `.github/workflows/merge-main.yml`, moved here
 * (owner's ruling 2026-10-09, litlfred/folio-assistant#2521, ruling 1(c)).
 * The comment composer's own tests stay with it, in cat-harness.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** This index repository's root — where `.github/workflows/` lives. */
const WORKFLOW = join(resolve(import.meta.dir, "../.."), ".github", "workflows", "merge-main.yml");

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
  // Measured 2026-10-02 on 7 real runs: `bun run cat merge:main` resolved the
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
    expect(run).toContain('bun run "$RUNNER_TEMP/tool/cat-harness-tools/scripts/merge-base.ts" --root "$GITHUB_WORKSPACE"');
    for (const s of steps) expect(runOf(s)).not.toMatch(/bun run cat merge:main\b/);
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

  test("the workflow hands the job status to main's copy of the composer", () => {
    expect(comment.env?.JOB_STATUS).toBe("${{ job.status }}");
    expect(comment.run).toContain('bun run "$RUNNER_TEMP/tool/cat-harness-tools/scripts/merge-main-comment.ts" --log "$RUNNER_TEMP/merge.log"');
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

describe("one bad member no longer reds the whole run (bean `03nl`)", () => {
  // Measured on run 37179860536: exactly ONE of the matrix members failed
  // (#1801, on a condition already fixed on another branch, bean `z7n1`), the
  // run was `failure`, and GitHub emailed the owner on every push to main —
  // which is many an hour.
  test("the matrix member allows its own failure to be ignored by the RUN", () => {
    expect((doc.jobs.merge as { "continue-on-error"?: boolean })["continue-on-error"]).toBe(true);
  });

  test("...and still fails, so it is red and findable rather than swallowed", () => {
    const fail = doc.jobs.merge!.steps.find((s) => /refused != 'true'/.test((s as { if?: string }).if ?? ""))!;
    expect(fail.run).toContain("exit 1");
  });

  test("the selection job stays loud: no continue-on-error anywhere on it", () => {
    expect((doc.jobs.select as { "continue-on-error"?: boolean })["continue-on-error"]).toBeUndefined();
  });

  test("one job, and only one, decides the run's colour", () => {
    const notify = doc.jobs.notify as { needs?: string[]; if?: string; "continue-on-error"?: boolean } | undefined;
    expect(notify).toBeDefined();
    expect(notify!.needs).toEqual(["select", "merge"]);
    // It must run when `merge` failed (the case it exists for) and when `merge`
    // was skipped (nothing behind main) — but not on a cancelled, superseded run.
    expect(notify!.if).toContain("!cancelled()");
    expect(notify!.if).not.toContain("always()");
    expect(notify!["continue-on-error"]).toBeUndefined();
  });

  test("every member reports, whatever happened to it, and hands the verdict over", () => {
    const steps = doc.jobs.merge!.steps;
    const record = steps.findIndex((s) => s.name?.startsWith("Record what this member found"));
    const upload = steps.findIndex((s) => (s.uses ?? "").startsWith("actions/upload-artifact"));
    const fail = steps.findIndex((s) => /refused != 'true'/.test((s as { if?: string }).if ?? ""));
    // After the failure step, so the step that exits 1 cannot skip it; under
    // always(), so the steps that exit 1 on purpose are covered too.
    expect(record).toBeGreaterThan(fail);
    expect((steps[record] as { if?: string }).if).toBe("always()");
    expect((steps[upload] as { if?: string }).if).toBe("always()");
    expect(upload).toBeGreaterThan(record);
    // A job that died before main's tool was checked out still writes one —
    // and so does one whose tool predates the --verdict mode, since the copy
    // that runs is main's. Both are "could not determine", which is loud.
    expect(steps[record]!.run).toContain('"verdict":"undetermined","notify":true');
    expect(steps[record]!.run).toContain('grep -q -- "--verdict" "$tool"');
  });

  test("the aggregator runs main's copy, with the remote mounts its checkout needs", () => {
    const steps = doc.jobs.notify!.steps;
    // `.github/mount-from-lock.sh` since the cat-harness cutover: cat-harness
    // is itself a mount, so the wrapper fetches the pinned `.ts` replayer.
    const mount = steps.find((s) => /mount-from-lock\.(?:sh|ts)\b/.test(s.run ?? ""));
    expect(mount).toBeDefined();
    const bun = steps.find((s) => (s.uses ?? "").startsWith("oven-sh/setup-bun")) as { with?: Record<string, unknown> };
    expect(bun.with?.["bun-version"]).toBe("1.3.14");
    const decide = steps.find((s) => s.name?.startsWith("Decide whether this run"))!;
    expect(decide.run).toContain("cat-harness-tools/scripts/merge-main-comment.ts --aggregate verdicts");
    // A download that finds nothing must not stop it: "no verdict for #N" is
    // the thing it has to report.
    const dl = steps.find((s) => (s.uses ?? "").startsWith("actions/download-artifact")) as { "continue-on-error"?: boolean };
    expect(dl["continue-on-error"]).toBe(true);
  });
});

describe("the signature is read before it is overwritten", () => {
  const steps = doc.jobs.merge!.steps;

  test("the previous signature is read in a step ahead of the comment step", () => {
    const prev = steps.findIndex((s) => s.name === "Read the failure this PR's comment already reports");
    const comment = steps.findIndex((s) => s.name?.startsWith("Comment once"));
    expect(prev).toBeGreaterThanOrEqual(0);
    expect(comment).toBeGreaterThan(prev);
    expect(steps[prev]!.run).toContain("merge-main-signature");
    expect(steps[prev]!.run).toContain('echo "signature=$sig" >> "$GITHUB_OUTPUT"');
  });

  test("the comment step keeps its plan, and knows the PR's head", () => {
    const comment = steps.find((s) => s.name?.startsWith("Comment once"))! as Step & { env?: Record<string, string> };
    expect(comment.run).toContain('--plan-out "$RUNNER_TEMP/plan.json"');
    expect(comment.env?.HEAD_SHA).toBe("${{ steps.pr.outputs.sha }}");
  });

  test("the verdict step reads that plan and that previous signature", () => {
    const record = steps.find((s) => s.name?.startsWith("Record what this member found"))! as Step & { env?: Record<string, string> };
    expect(record.run).toContain('--verdict "$out" --plan "$RUNNER_TEMP/plan.json"');
    expect(record.env?.PREVIOUS_SIGNATURE).toBe("${{ steps.prev.outputs.signature }}");
    expect(record.env?.HEAD_CHECK).toBe("${{ steps.head.outcome }}");
  });

  test("the head-moved race has an id, so the verdict can recognise it", () => {
    const head = steps.find((s) => s.name === "Check the branch did not move since selection")! as Step & { id?: string };
    expect(head.id).toBe("head");
  });
});
