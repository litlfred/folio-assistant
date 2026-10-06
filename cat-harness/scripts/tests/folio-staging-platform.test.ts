/**
 * Bean `zdfa`: a folio linked to its platform as a SIBLING checkout
 * (`platform_dir: ../platform`) names a path outside the Actions workspace,
 * where `actions/checkout` cannot write. The reusable workflow checks the
 * platform out inside the workspace and links it to the path the folio names.
 *
 * These run the workflow's OWN step scripts, read from the YAML, against a
 * fake workspace, so a test cannot pass while the workflow says something else.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { parse } from "yaml";

const WORKFLOW = resolve(import.meta.dir, "../../../.github/workflows/folio-staging.yml");

interface Step { name?: string; id?: string; run?: string; with?: Record<string, string> }
const jobs = (parse(readFileSync(WORKFLOW, "utf8")) as { jobs: Record<string, { steps: Step[] }> }).jobs;

function step(job: string, name: string): Step {
  const s = jobs[job]!.steps.find((x) => x.name === name);
  if (!s) throw new Error(`${job} has no step '${name}'`);
  return s;
}

function outputs(file: string): Record<string, string> {
  return Object.fromEntries(
    readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
  );
}

/** Run a step's script in `ws` as the runner would, returning its outputs. */
function run(script: string, ws: string, env: Record<string, string>): { status: number | null; out: Record<string, string>; stderr: string } {
  const out = join(mkdtempSync(join(tmpdir(), "gh-out-")), "out");
  writeFileSync(out, "");
  const r = spawnSync("bash", ["-e", "-c", script], { cwd: ws, env: { ...process.env, ...env, GITHUB_WORKSPACE: ws, GITHUB_OUTPUT: out }, stdio: "pipe" });
  return { status: r.status, out: outputs(out), stderr: r.stdout.toString() + r.stderr.toString() };
}

for (const job of ["stage", "publish-main"]) {
  describe(`${job}: where the platform is checked out (zdfa)`, () => {
    const locate = step(job, "Locate the platform");
    const link = step(job, "Link the platform where the folio names it");

    test("a sibling path is checked out inside the workspace, then linked where the folio names it", () => {
      const ws = join(realpathSync(mkdtempSync(join(tmpdir(), "runner-"))), "repo");
      mkdirSync(ws);
      const loc = run(locate.run!, ws, { PLATFORM_DIR: "../platform" });
      expect(loc.status).toBe(0);
      expect(loc.out).toMatchObject({ outside: "true", checkout: ".folio-platform", present: "false" });
      // The checkout step writes to the path the locate step chose.
      expect(step(job, "Check out the platform").with!.path).toBe("${{ steps.platform.outputs.checkout }}");
      // Simulate that checkout, then run the link step.
      mkdirSync(join(ws, ".folio-platform"));
      writeFileSync(join(ws, ".folio-platform", "marker"), "platform");
      const ln = run(link.run!, ws, { ABS: loc.out.abs! });
      expect(ln.status).toBe(0);
      // The folio's own relative path now reaches the platform, as it does locally.
      expect(readFileSync(join(ws, "../platform/marker"), "utf8")).toBe("platform");
    });

    test("a path inside the workspace is checked out where it is named, and not linked", () => {
      const ws = realpathSync(mkdtempSync(join(tmpdir(), "runner-")));
      const loc = run(locate.run!, ws, { PLATFORM_DIR: "folio-assistant" });
      expect(loc.out).toMatchObject({ outside: "false", checkout: "folio-assistant" });
    });

    test("the link step refuses to replace something already at the named path", () => {
      const ws = join(realpathSync(mkdtempSync(join(tmpdir(), "runner-"))), "repo");
      mkdirSync(ws);
      mkdirSync(join(ws, "../platform"));
      const ln = run(link.run!, ws, { ABS: resolve(ws, "../platform") });
      expect(ln.status).not.toBe(0);
      expect(ln.stderr).toContain("refusing to replace it");
      expect(existsSync(join(ws, ".folio-platform"))).toBe(false);
    });
  });
}

describe("folio-staging passes render-log only paths it accepts", () => {
  // publish-main passed `--path "."`, which render-log refuses (the root is
  // `/`), so every folio's first publish of main built its site, wrote it, and
  // then failed before committing it: litlfred/smart-ra, 2026-10-05. A literal
  // path in the workflow is checked here by render-log's own rule; a `$VAR`
  // path is checked at run time by the same function.
  test("every literal --path is safe", async () => {
    const { isSafeRenderPath } = await import("../../schemas/render-log.js");
    const yml = readFileSync(resolve(import.meta.dir, "../../../.github/workflows/folio-staging.yml"), "utf-8");
    const literals = [...yml.matchAll(/render-log\.ts"[^\n]*(?:\n[^\n]*?){0,3}--path "([^"$]*)"/g)].map((m) => m[1]);
    expect(literals.length).toBeGreaterThan(0);
    for (const p of literals) expect({ path: p, safe: isSafeRenderPath(p) }).toEqual({ path: p, safe: true });
  });
});

describe("stage: a dispatched run finds its pull request (ehh6)", () => {
  // smart-ra#26: its staging runs only by dispatch, so the run said "PR n/a",
  // commented nothing and ingested no review comments, though GitHub listed
  // the run under the PR. These run the step's own script with a fake `gh`.
  const find = step("stage", "Find the pull request");
  const bin = mkdtempSync(join(tmpdir(), "fake-gh-"));
  writeFileSync(
    join(bin, "gh"),
    '#!/usr/bin/env bash\n[ -n "${FAKE_GH_FAIL:-}" ] && exit 1\nwhile [ $# -gt 0 ]; do [ "$1" = --jq ] && Q="$2"; shift; done\nprintf %s "$FAKE_GH" | jq -c "$Q"\n',
    { mode: 0o755 },
  );
  const dispatch = (prs: unknown[], extra: Record<string, string> = {}) =>
    run(find.run!, realpathSync(mkdtempSync(join(tmpdir(), "runner-"))), {
      PATH: `${bin}:${process.env.PATH}`, EVENT_PR: "", EVENT_BASE: "", BRANCH: "claude/x", GITHUB_REPOSITORY: "o/r", FAKE_GH: JSON.stringify(prs), ...extra,
    });

  test("a pull_request run keeps its own number and base, and asks nothing", () => {
    // A lookup would fail loudly here, so a quiet run proves none was made.
    const r = dispatch([], { EVENT_PR: "7", EVENT_BASE: "main", FAKE_GH_FAIL: "1" });
    expect(r.status).toBe(0);
    expect(r.out).toEqual({ number: "7", base: "main" });
    expect(r.stderr).not.toContain("could not list");
  });

  test("a dispatch takes the branch's one open PR from this repository; a fork's branch of the same name is not it", () => {
    const r = dispatch([{ number: 26, baseRefName: "main", isCrossRepository: false }, { number: 99, baseRefName: "main", isCrossRepository: true }]);
    expect(r.status).toBe(0);
    expect(r.out).toEqual({ number: "26", base: "main" });
  });

  test("no PR, several, or a failed lookup: tied to none, and the run goes on", () => {
    expect(dispatch([]).out).toEqual({});
    const two = dispatch([{ number: 1, baseRefName: "main", isCrossRepository: false }, { number: 2, baseRefName: "dev", isCrossRepository: false }]);
    expect(two.out).toEqual({});
    expect(two.stderr).toContain("several open pull requests");
    const failed = dispatch([], { FAKE_GH_FAIL: "1" });
    expect(failed.status).toBe(0);
    expect(failed.out).toEqual({});
    expect(failed.stderr).toContain("could not list pull requests");
  });

  test("every later step reads the PR from this step, never from the event", () => {
    const later = jobs.stage!.steps.slice(jobs.stage!.steps.indexOf(find) + 1);
    const text = JSON.stringify(later);
    expect(text).not.toContain("github.event.pull_request.number");
    expect(text).not.toContain("github.event.pull_request.base");
    expect(text).not.toContain("event_name == 'pull_request'");
    expect(text).not.toContain("context.issue.number");
    for (const n of ["Ingest review comments", "Comment staging URL on PR"]) expect((step("stage", n) as Step & { if?: string }).if).toBe("steps.pr.outputs.number != ''");
  });
});
