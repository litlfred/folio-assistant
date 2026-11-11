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

describe("pr-tests.yml (this repository's own checks)", () => {
  const jobs = wf("pr-tests.yml").jobs as Record<string, Job>;

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
  const FAST = `(github.event_name == 'pull_request' && !${RELEASE})`;

  test("prepare-base does not run on the fast tier", () => {
    expect(jobs["prepare-base"]!.if).toContain(`!${FAST}`);
  });

  test("the verdict job is named for the tier it judged", () => {
    expect(jobs.compare!.name).toContain("Fast tier only (advisory; the full checks gate a release)");
    expect(jobs.compare!.name).toContain("No new failures (tests and gates)");
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
