/**
 * Release-gated CI (owner, card Q-CIB-4 A, 2026-11-08: "CI not gate on
 * non-release merge to main"; cat-harness#1158).
 *
 * A pull request without the `release` label runs the fast tier only; a
 * `release` PR runs the full tier; a push to main runs the full suite at most
 * once per window. These tests read the two workflows that carry the rule.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dir, "..");
const wf = (name: string) => parse(readFileSync(join(ROOT, ".github/workflows", name), "utf8"));
const RELEASE = "contains(github.event.pull_request.labels.*.name, 'release')";

type Step = { id?: string; name?: string; if?: string; with?: Record<string, string> };
type Job = { if?: string; needs?: string[]; outputs?: Record<string, string>; steps?: Step[] };

// Adding the `release` label starts the full tier; any other label is a no-op
// (owner, 2026-11-11, card B: every PR passes the full tier before merge).
const ONLY_RELEASE_LABEL = "(github.event.action != 'labeled' || github.event.label.name == 'release')";
const NOOP_GROUP = "(github.event.action == 'labeled' && github.event.label.name != 'release') && format('noop-label-{0}', github.run_id)";

describe("pr-tests.yml (this repository's own checks)", () => {
  const doc = wf("pr-tests.yml");
  const jobs = doc.jobs as Record<string, Job>;

  test("adding the `release` label starts a run: `labeled` is a pull_request type", () => {
    expect(doc.on.pull_request.types).toContain("labeled");
  });

  test("a `labeled` run for another label skips every job and never joins the PR's concurrency group", () => {
    expect(doc.concurrency.group).toContain(NOOP_GROUP);
    // pin gates every job that needs it; the verdict job runs with !cancelled(), so it is gated itself.
    expect(jobs.pin!.if).toContain(ONLY_RELEASE_LABEL);
    expect(jobs.tests!.if).toContain(ONLY_RELEASE_LABEL);
    for (const [name, j] of Object.entries(jobs)) {
      if (name === "pin" || name === "tests") continue;
      const needs = typeof j.needs === "string" ? [j.needs] : (j.needs ?? []);
      expect({ name, needsPin: needs.includes("pin") }).toEqual({ name, needsPin: true });
    }
  });

  test("the head side of the full tier runs on a PR only with the release label", () => {
    for (const j of ["tests-head", "standalone-head"]) {
      expect(jobs[j]!.if).toContain("github.event_name == 'pull_request'");
      expect(jobs[j]!.if).toContain(RELEASE);
    }
  });

  test("the base side runs on a PR only for a release, and on a push only when the hour is not batched", () => {
    for (const j of ["tests-base", "standalone-base"]) {
      expect(jobs[j]!.if).toContain("github.event_name != 'pull_request' && needs.pin.outputs.batched != 'true'");
      expect(jobs[j]!.if).toContain(`github.event_name == 'pull_request' && ${RELEASE}`);
    }
  });

  test("pin stamps the hour on a push and says when a push is batched", () => {
    const pin = jobs.pin!;
    expect(pin.outputs!.batched).toContain("steps.integ-lookup.outputs.cache-hit == 'true'");
    const ids = pin.steps!.map((s) => s.id).filter(Boolean);
    expect(ids).toContain("integ-bucket");
    expect(ids).toContain("integ-lookup");
    const lookup = pin.steps!.find((s) => s.id === "integ-lookup")!;
    expect(lookup.with!["lookup-only"]).toBe(true as unknown as string);
    const save = pin.steps!.find((s) => s.name === "Save the stamp")!;
    expect(save.with!.key).toBe(lookup.with!.key);
  });

  test("the verdict job passes a non-release PR on the fast tier and says so", () => {
    const fast = jobs.tests!.steps!.find((s) => s.name === "Fast tier (a non-release PR)")!;
    expect(fast.if).toContain(`!${RELEASE}`);
  });
});

describe("layer-pr-checks.yml (every layer)", () => {
  const doc = wf("layer-pr-checks.yml");
  const jobs = doc.jobs as Record<string, Job & { name?: string }>;
  // The tier comes from prepare-head's tier step, which reads the PR's live
  // labels (owner, card Q-TIER-1 A; test/layer-pr-checks-live-labels.test.ts).
  const FULL = "needs.prepare-head.outputs.full == 'true'";

  test("a `labeled` run for another label judges nothing and never joins the PR's concurrency group", () => {
    expect(doc.concurrency.group).toContain(NOOP_GROUP);
    for (const j of ["prepare-head", "prepare-base", "compare"]) expect(jobs[j]!.if).toContain(ONLY_RELEASE_LABEL);
    // `run` needs prepare-head (a PR) or prepare-base (a push) to succeed; `ready-reuse` runs on ready_for_review only.
    expect(jobs.run!.needs).toEqual(["prepare-head", "prepare-base"]);
  });

  test("prepare-base does not run on the fast tier", () => {
    expect(jobs["prepare-base"]!.if).toContain(FULL);
    expect(jobs["prepare-base"]!.needs).toContain("prepare-head");
  });

  test("the verdict job is named for the tier it judged", () => {
    expect(jobs.compare!.name).toContain("Fast tier only (advisory; the full checks gate a release)");
    expect(jobs.compare!.name).toContain("No new failures (tests and gates)");
    // The fast tier is judged by prepare-head's last step, and compare is
    // skipped on it, so the fast tier never reports as "No new failures".
    expect(jobs.compare!.if).toContain("needs.prepare-head.outputs.full != 'false'");
    const steps = jobs["prepare-head"]!.steps!;
    const fast = steps[steps.length - 1]!;
    expect(fast.name).toBe("Fast tier only (advisory; the full checks gate a release)");
    expect(fast.if).toContain("steps.tier.outputs.full == 'false'");
  });

  test("a push to main is batched per integration window, and the stamp is saved under the key it is looked up by", () => {
    const inputs = doc.on.workflow_call.inputs as Record<string, { default?: unknown }>;
    expect(inputs["integration-minutes"]!.default).toBe(60);
    const steps = jobs["prepare-base"]!.steps!;
    const lookup = steps.find((s) => s.id === "integ-lookup")!;
    const save = steps.find((s) => s.name === "Save the stamp")!;
    expect(save.with!.key).toBe(lookup.with!.key);
    const skip = steps.find((s) => s.id === "skip-prep") as Step & { env?: Record<string, string> };
    expect(skip.env!.BATCHED).toContain("steps.integ-lookup.outputs.cache-hit == 'true'");
  });
});
