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
