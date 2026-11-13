/**
 * The tier (full or fast) is read from the PR's labels as they are NOW, not
 * from the event payload (owner, card Q-TIER-1 A, 2026-11-12).
 *
 * The merge flow adds `ready-to-merge`, removes `release` and toggles draft;
 * the final ready_for_review event's payload then said "no release", and the
 * run was the fast tier only (cat-harness#1275, and two PRs of a layer above). The
 * `tier` job's own script is read out of `layer-pr-checks.yml` and run with a
 * fake `curl`, so what is tested is the shell the workflow runs.
 *
 * @module test/layer-pr-checks-live-labels.test
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const WORKFLOW = resolve(import.meta.dir, "..", ".github", "workflows", "layer-pr-checks.yml");
const TEXT = readFileSync(WORKFLOW, "utf-8");
type Job = { needs?: string | string[]; if?: string; name?: string; steps?: Array<{ name?: string; run?: string; if?: string; env?: Record<string, string> }> };
const WF = parse(TEXT, { maxAliasCount: -1 }) as { jobs: Record<string, Job> };

/**
 * Run the tier step. `withToken` / `anonymous`: what the fake curl answers
 * for a request with and without the token (a JSON body, or null to fail).
 */
function tier(opts: { event?: string; withToken?: string | null; anonymous?: string | null; payloadFull?: string }): { full: string; out: string } {
  const dir = mkdtempSync(join(tmpdir(), "tier-"));
  const enc = (v: string | null | undefined) => (v === null || v === undefined ? "" : Buffer.from(v).toString("base64"));
  writeFileSync(
    join(dir, "curl"),
    [
      "#!/usr/bin/env bash",
      'auth=no; for a in "$@"; do case "$a" in Authorization:*) auth=yes ;; esac; done',
      `if [ "$auth" = yes ]; then b='${enc(opts.withToken)}'; else b='${enc(opts.anonymous)}'; fi`,
      '[ -n "$b" ] || exit 22',
      'printf %s "$b" | base64 -d',
    ].join("\n"),
  );
  chmodSync(join(dir, "curl"), 0o755);
  const output = join(dir, "out");
  writeFileSync(output, "");
  const step = WF.jobs.tier!.steps!.find((s) => s.name === "Full tier or fast tier?")!;
  const r = spawnSync("bash", ["-c", step.run!], {
    encoding: "utf-8",
    env: {
      // input-site: env PATH #34b0985f — PATH handed to a child process, which decides which binaries it runs
      PATH: `${dir}:${process.env.PATH ?? ""}`,
      GITHUB_OUTPUT: output,
      GH_TOKEN: "t",
      EVENT: opts.event ?? "pull_request",
      REPO: "o/r",
      PR: "7",
      PAYLOAD_FULL: opts.payloadFull ?? "false",
    },
  });
  const full = /full=(\w+)/.exec(readFileSync(output, "utf-8"))?.[1] ?? "";
  return { full, out: r.stdout + r.stderr };
}

const labels = (...names: string[]) => JSON.stringify(names.map((name) => ({ name })));

describe("tier: the PR's live labels decide, not the payload", () => {
  test("cat-harness#1275: release removed, ready-to-merge added, payload says no release -> the FULL tier", () => {
    const r = tier({ withToken: labels("ready-to-merge"), payloadFull: "false" });
    expect(r.full).toBe("true");
    expect(r.out).toContain("live labels: ready-to-merge -> full tier");
  });

  test("release live -> full; neither -> fast, even when the payload still says release", () => {
    expect(tier({ withToken: labels("release", "docs") }).full).toBe("true");
    expect(tier({ withToken: labels("docs"), payloadFull: "true" }).full).toBe("false");
    expect(tier({ withToken: "[]", payloadFull: "true" }).full).toBe("false");
  });

  test("the token refused: the anonymous read decides", () => {
    expect(tier({ withToken: null, anonymous: labels("ready-to-merge") }).full).toBe("true");
  });

  test("no read at all: the payload decides, with a warning", () => {
    const r = tier({ withToken: null, anonymous: null, payloadFull: "true" });
    expect(r.full).toBe("true");
    expect(r.out).toContain("::warning::the PR's labels could not be read");
    expect(tier({ withToken: "not json", anonymous: null, payloadFull: "false" }).full).toBe("false");
  });

  test("a push is always the full tier", () => {
    expect(tier({ event: "push", withToken: null, anonymous: null }).full).toBe("true");
  });
});

describe("every tier condition reads the tier job", () => {
  test("no condition outside the tier job reads the payload's labels", () => {
    const outside = TEXT.split("\n").filter((l) => l.includes("labels.*.name") && !l.includes("PAYLOAD_FULL:"));
    expect(outside).toEqual([]);
  });

  test("each job that reads needs.tier (directly or through an anchored step) lists tier in needs", () => {
    for (const [name, job] of Object.entries(WF.jobs)) {
      if (!JSON.stringify(job).includes("needs.tier")) continue;
      const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
      expect(needs, name).toContain("tier");
    }
  });

  test("the tier job skips a no-op labeled event, like every job after it", () => {
    expect(WF.jobs.tier!.if).toContain("github.event.label.name == 'release'");
  });
});
