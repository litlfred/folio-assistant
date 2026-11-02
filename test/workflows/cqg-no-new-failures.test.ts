/**
 * Code-quality gates judge a PR by "no new failures compared with main" —
 * owner card Q-PIPE-1 A (2026-11-01), issue #2899.
 *
 * Runs `.github/scripts/cqg-step.sh` and `cqg_judge.py` as the workflow does,
 * against a stand-in `gate-shell.sh` and a stand-in `gh` that serves main's
 * job log, so what is asserted is the script that ships. Most cases are ones
 * that must FAIL: a pass that should not be one is the defect this can add.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dir, "..", "..");
const STEP = join(ROOT, ".github", "scripts", "cqg-step.sh");
const JUDGE = join(ROOT, ".github", "scripts", "cqg_judge.py");
const WORKFLOW = join(ROOT, ".github", "workflows", "code-quality-gates.yml");

interface Job {
  name?: string;
  if?: string;
  env?: Record<string, string>;
  permissions?: Record<string, string>;
  defaults?: { run?: { shell?: string } };
  outputs?: Record<string, string>;
  steps: Array<{ id?: string; name?: string; if?: string; run?: string; shell?: string; env?: Record<string, string>; "continue-on-error"?: unknown }>;
}
const wf = parse(readFileSync(WORKFLOW, "utf8")) as { jobs: Record<string, Job> };
const JUDGED = ["typescript-test", "gates-kg", "gates-docs", "gates-standalone", "gates-unrun", "e2e-shard"];

/** A sandbox: a state dir, a stand-in gate-shell that runs the step with `bash -e`, and a `gh` serving `mainLog`. */
function sandbox(mainLog?: string, opts: { jobName?: string; conclusion?: string; ghFails?: boolean; refusesEscapes?: boolean } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "cqg-"));
  const state = join(dir, "state");
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const gateShell = join(dir, "gate-shell.sh");
  writeFileSync(gateShell, '#!/usr/bin/env bash\nbash -e "$1"\n');
  const jobName = opts.jobName ?? "Repository gates — x (hard)";
  writeFileSync(join(dir, "runs.json"), JSON.stringify({ workflow_runs: [{ id: 7, html_url: "https://example/runs/7" }] }));
  writeFileSync(join(dir, "jobs.json"), JSON.stringify({ jobs: [{ id: 70, name: jobName, conclusion: opts.conclusion ?? "failure" }] }));
  writeFileSync(join(dir, "job.log"), mainLog ?? "no record here\n");
  writeFileSync(
    join(bin, "gh"),
    opts.ghFails
      ? "#!/bin/sh\necho denied >&2\nexit 1\n"
      : opts.refusesEscapes
        ? // Newer gh refuses a body with terminal escapes unless it is passed --allow-escape-sequences.
          `#!/bin/sh\nif [ "$2" = --allow-escape-sequences ]; then shift; elif case "$2" in *"/logs") true ;; *) false ;; esac; then echo "the response contains terminal escape sequences; pass --allow-escape-sequences to output it anyway" >&2; exit 1; fi\ncase "$2" in\n  *"/runs?"*) cat '${dir}/runs.json' ;;\n  *"/jobs?"*) cat '${dir}/jobs.json' ;;\n  *"/logs") cat '${dir}/job.log' ;;\n  *) exit 1 ;;\nesac\n`
        : `#!/bin/sh\ncase "$2" in\n  *"/runs?"*) cat '${dir}/runs.json' ;;\n  *"/jobs?"*) cat '${dir}/jobs.json' ;;\n  *"/logs") cat '${dir}/job.log' ;;\n  *) exit 1 ;;\nesac\n`,
  );
  chmodSync(join(bin, "gh"), 0o755);
  const summary = join(dir, "summary.md");
  writeFileSync(summary, "");
  const env = (extra: Record<string, string> = {}) => ({
    PATH: `${bin}:${process.env.PATH}`,
    CQG_DIR: state,
    CQG_GATE_SHELL: gateShell,
    GITHUB_STEP_SUMMARY: summary,
    GITHUB_REPOSITORY: "o/r",
    CQG_JOB_NAME: jobName,
    ...extra,
  });
  /** Run one step's script through the wrapper, as the workflow's `shell:` does. */
  const step = (script: string, extra: Record<string, string> = {}) => {
    const file = join(dir, `step-${Math.random().toString(36).slice(2)}.sh`);
    writeFileSync(file, script + "\n");
    return spawnSync("bash", [STEP, file], { env: env(extra), encoding: "utf8" });
  };
  const begin = () => spawnSync("bash", [STEP, "--begin"], { env: env(), encoding: "utf8" });
  const verdict = (event: string, extra: Record<string, string> = {}) =>
    spawnSync("python3", [JUDGE, "verdict"], { env: env({ GITHUB_EVENT_NAME: event, ...extra }), encoding: "utf8" });
  return { dir, state, step, begin, verdict, summary: () => readFileSync(summary, "utf8"), env };
}

/** Main's job log holding the record a main run with these steps would print. */
function mainLogFor(steps: string[]): string {
  const sb = sandbox();
  sb.begin();
  for (const s of steps) sb.step(s);
  const r = sb.verdict("push");
  const line = /CQG-REPORT-V1 \S+/.exec(r.stdout)![0];
  return `2026-11-01T00:00:00.0000000Z ##[group]Run x\n2026-11-01T00:00:01.0000000Z ${line}\n`;
}

describe("before `--begin`, a step's exit passes through unchanged", () => {
  test("a failing setup step fails", () => {
    const sb = sandbox();
    expect(sb.step("exit 3").status).toBe(3);
    expect(sb.step("true").status).toBe(0);
    expect(existsSync(join(sb.state, "steps.jsonl"))).toBe(false);
  });
});

describe("after `--begin`, a failing step is recorded and the next one still runs", () => {
  test("the step exits 0 and its failure is in the record", () => {
    const sb = sandbox();
    expect(sb.begin().status).toBe(0);
    expect(sb.step(": check:a\nexit 1").status).toBe(0);
    const lines = readFileSync(join(sb.state, "steps.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(lines).toHaveLength(1);
    expect(lines[0].exit).toBe(1);
    expect(lines[0].label).toBe(": check:a");
  });

  test("the step's token is not in its own environment", () => {
    const sb = sandbox();
    sb.begin();
    expect(sb.step('[ -z "${CQG_TOKEN:-}" ]', { CQG_TOKEN: "secret" }).status).toBe(0);
    const lines = readFileSync(join(sb.state, "steps.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
    expect(lines[0].exit).toBe(0);
  });
});

describe("a step marked CQG_UNJUDGED passes its exit status through, even after `--begin`", () => {
  test("its failure fails the step and is not recorded", () => {
    const sb = sandbox();
    sb.begin();
    expect(sb.step("exit 4", { CQG_UNJUDGED: "true" }).status).toBe(4);
    expect(sb.step("true", { CQG_UNJUDGED: "true" }).status).toBe(0);
    expect(existsSync(join(sb.state, "steps.jsonl"))).toBe(false);
  });
});

describe("push, merge_group and workflow_dispatch: any failure fails, so main stays red", () => {
  for (const event of ["push", "merge_group", "workflow_dispatch"]) {
    test(event, () => {
      const sb = sandbox();
      sb.begin();
      sb.step("exit 1");
      sb.step("true");
      const r = sb.verdict(event);
      expect(r.status).toBe(1);
      expect(r.stdout).toContain("CQG-REPORT-V1 ");
    });
  }

  test("a run with no failure passes", () => {
    const sb = sandbox();
    sb.begin();
    sb.step("true");
    expect(sb.verdict("push").status).toBe(0);
  });
});

describe("pull_request: only a failure main does not have fails", () => {
  const red = ": check:red-on-main\nexit 1";
  // Passes unless FLIP is set: the same step, green on main and red on the PR.
  const green = ': check:green-on-main\n[ -z "${FLIP:-}" ]';
  const mainLog = mainLogFor([red, green]);

  test("a failure main has too passes, and is listed as failing on main too", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    sb.step(red);
    sb.step(green);
    const r = sb.verdict("pull_request");
    expect(r.status).toBe(0);
    expect(sb.summary()).toContain("failing on main too");
    expect(sb.summary()).toContain("check:red-on-main");
  });

  test("main's log is read even when gh refuses its colour codes without --allow-escape-sequences", () => {
    const sb = sandbox(mainLog, { refusesEscapes: true });
    sb.begin();
    sb.step(red);
    sb.step(green);
    const r = sb.verdict("pull_request");
    expect(r.status).toBe(0);
    expect(sb.summary()).toContain("failing on main too");
  });

  test("a failure main passes is NEW and fails", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    sb.step(red);
    sb.step(green, { FLIP: "1" });
    const r = sb.verdict("pull_request");
    expect(r.status).toBe(1);
    expect(sb.summary()).toContain("new failure");
  });

  test("a failure in a step main never recorded is NEW and fails", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    sb.step(": check:brand-new\nexit 1");
    expect(sb.verdict("pull_request").status).toBe(1);
  });

  test("no failure passes without asking main at all", () => {
    const sb = sandbox(undefined, { ghFails: true });
    sb.begin();
    sb.step(green);
    expect(sb.verdict("pull_request").status).toBe(0);
  });
});

describe("could-not-determine is never green", () => {
  const red = "exit 1";

  test("main's record cannot be read", () => {
    const sb = sandbox(undefined, { ghFails: true });
    sb.begin();
    sb.step(red);
    expect(sb.verdict("pull_request").status).toBe(1);
    expect(sb.summary()).toContain("Could not determine");
  });

  test("main's log holds no record, or a corrupt one", () => {
    for (const log of ["nothing\n", "2026 CQG-REPORT-V1 bm90LXpsaWI=\n"]) {
      const sb = sandbox(log);
      sb.begin();
      sb.step(red);
      expect(sb.verdict("pull_request").status).toBe(1);
    }
  });

  test("main's record is incomplete", () => {
    const sb0 = sandbox();
    const r0 = sb0.verdict("push"); // never began
    const sb = sandbox(`x ${/CQG-REPORT-V1 \S+/.exec(r0.stdout)![0]}\n`);
    sb.begin();
    sb.step(red);
    expect(sb.verdict("pull_request").status).toBe(1);
  });

  test("the judged steps never began on head", () => {
    expect(sandbox().verdict("pull_request").status).toBe(1);
  });

  test("a step outside the judged ones failed on head", () => {
    const sb = sandbox();
    sb.begin();
    sb.step("true");
    expect(sb.verdict("pull_request", { CQG_JOB_STATUS: "failure" }).status).toBe(1);
  });

  test("a test step that failed with no report", () => {
    const sb = sandbox();
    sb.begin();
    sb.step("exit 1", { CQG_TESTS: "bun", CQG_JUNIT: join(sb.dir, "missing.xml") });
    expect(sb.verdict("pull_request").status).toBe(1);
  });
});

const BUN_JUNIT = (cases: string) => `<?xml version="1.0"?>
<testsuites name="bun test"><testsuite name="a.test.ts" file="a.test.ts">
<testsuite name="grp" file="a.test.ts">${cases}</testsuite></testsuite></testsuites>`;
const FAIL = (n: string) => `<testcase name="${n}" classname="grp"><failure type="E" message="m">E</failure></testcase>`;
const PASS = (n: string) => `<testcase name="${n}" classname="grp" />`;

/** A test step that prints `out`, writes `junit`, and exits `code`. */
function testStep(sb: ReturnType<typeof sandbox>, kind: string, junit: string, out: string, code: number) {
  const xml = join(sb.dir, `${kind}-junit.xml`);
  const outFile = join(sb.dir, `${kind}.out`);
  writeFileSync(outFile, out);
  writeFileSync(join(sb.dir, `${kind}.xml.src`), junit);
  return sb.step(`cp '${join(sb.dir, `${kind}.xml.src`)}' '${xml}'\ncat '${outFile}'\nexit ${code}`, { CQG_TESTS: kind, CQG_JUNIT: xml });
}

describe("bun test is judged per test", () => {
  const summaryOut = (fail: number, error = 0) => `\n 10 pass\n ${fail} fail\n${error ? ` ${error} error\n` : ""}Ran 11 tests across 1 file.\n`;
  const mainLog = (() => {
    const sb = sandbox();
    sb.begin();
    testStep(sb, "bun", BUN_JUNIT(FAIL("old") + PASS("ok")), summaryOut(1), 1);
    return `x ${/CQG-REPORT-V1 \S+/.exec(sb.verdict("push").stdout)![0]}\n`;
  })();

  test("the same failing test as main passes", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    testStep(sb, "bun", BUN_JUNIT(FAIL("old") + PASS("ok")), summaryOut(1), 1);
    expect(sb.verdict("pull_request").status).toBe(0);
  });

  test("a second failing test in the same step fails", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    testStep(sb, "bun", BUN_JUNIT(FAIL("old") + FAIL("ok")), summaryOut(2), 1);
    expect(sb.verdict("pull_request").status).toBe(1);
    expect(sb.summary()).toContain("a.test.ts > grp > ok");
  });

  test("an unhandled error between tests is named by its file and is new", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    const out = "b.test.ts:\n\n# Unhandled error between tests\n-----\nerror: boom\n" + summaryOut(2, 1);
    testStep(sb, "bun", BUN_JUNIT(FAIL("old")), out, 1);
    expect(sb.verdict("pull_request").status).toBe(1);
    expect(sb.summary()).toContain("b.test.ts > (unhandled error between tests)");
  });

  test("counts that do not add up are could-not-determine", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    testStep(sb, "bun", BUN_JUNIT(FAIL("old")), summaryOut(3), 1);
    expect(sb.verdict("pull_request").status).toBe(1);
    expect(sb.summary()).toContain("Could not determine");
  });

  test("a non-zero exit with no failing test is could-not-determine", () => {
    const sb = sandbox(mainLog);
    sb.begin();
    testStep(sb, "bun", BUN_JUNIT(PASS("old")), summaryOut(0), 1);
    expect(sb.verdict("pull_request").status).toBe(1);
  });
});

describe("Playwright is judged per spec", () => {
  const PW = (cases: string) => `<testsuites><testsuite name="a11y.e2e.ts">${cases}</testsuite></testsuites>`;
  const PF = (n: string) => `<testcase name="${n}" classname="a11y.e2e.ts"><failure message="x" type="FAILURE">x</failure></testcase>`;

  test("a spec failing on main too passes; a new one fails; errors outside tests are could-not-determine", () => {
    const m = sandbox();
    m.begin();
    testStep(m, "playwright", PW(PF("home")), "  1 failed\n", 1);
    const mainLog = `x ${/CQG-REPORT-V1 \S+/.exec(m.verdict("push").stdout)![0]}\n`;

    const same = sandbox(mainLog);
    same.begin();
    testStep(same, "playwright", PW(PF("home")), "  1 failed\n", 1);
    expect(same.verdict("pull_request").status).toBe(0);

    const added = sandbox(mainLog);
    added.begin();
    testStep(added, "playwright", PW(PF("home") + PF("menu")), "  2 failed\n", 1);
    expect(added.verdict("pull_request").status).toBe(1);

    const outside = sandbox(mainLog);
    outside.begin();
    testStep(outside, "playwright", PW(PF("home")), "  1 failed\n  1 error was not a part of any test\n", 1);
    expect(outside.verdict("pull_request").status).toBe(1);
  });
});

describe("verdict reuse refuses a run that passed by inheriting main's failures", () => {
  function reuse(log: string | null) {
    const sb = sandbox(log ?? undefined, { jobName: "TypeScript — bun test, shard 1/4", conclusion: "success", ghFails: log === null });
    const out = join(sb.dir, "out");
    writeFileSync(out, "");
    const r = spawnSync("python3", [JUDGE, "reuse-check"], { env: sb.env({ REPO: "o/r", RUN_ID: "7", GITHUB_OUTPUT: out }), encoding: "utf8" });
    expect(r.status).toBe(0);
    return readFileSync(out, "utf8").trim();
  }
  const clean = mainLogFor(["true"]);
  const inherited = mainLogFor(["exit 1"]);

  test("a clean record keeps the reuse", () => expect(reuse(clean)).toBe("reuse=true"));
  test("an inherited failure refuses it", () => expect(reuse(inherited)).toBe("reuse=false"));
  test("no record, or no API, refuses it", () => {
    expect(reuse("nothing\n")).toBe("reuse=false");
    expect(reuse(null)).toBe("reuse=false");
  });
});

describe("the workflow wires it as designed", () => {
  test("every judged job uses the wrapper, has actions: read, and names itself for main's lookup", () => {
    for (const id of JUDGED) {
      const job = wf.jobs[id]!;
      expect(job.defaults?.run?.shell).toBe("bash ${{ github.workspace }}/.github/scripts/cqg-step.sh {0}");
      expect(job.permissions).toEqual({ contents: "read", actions: "read" });
      expect(job.env?.CQG_JOB_NAME).toBe(job.name!);
      expect(job.steps.filter((s) => s.run === "bash .github/scripts/cqg-step.sh --begin")).toHaveLength(1);
    }
  });

  test("each judged job ends in its verdict", () => {
    for (const id of JUDGED) {
      const last = wf.jobs[id]!.steps.at(-1)!;
      const own = last.run === "python3 .github/scripts/cqg_judge.py verdict";
      expect(own || last.env?.CQG_VERDICT === "true").toBe(true);
      if (own) {
        expect(last.if).toBe("${{ !cancelled() }}");
        expect(last.shell).toBeUndefined();
        expect(last.env?.CQG_UNJUDGED).toBe("true");
      }
    }
  });

  test("bun test and the drift check stay their jobs' last steps, and give the verdict", () => {
    expect(wf.jobs["typescript-test"]!.steps.at(-1)!.run).toBe("bun test");
    expect(wf.jobs["gates-docs"]!.steps.at(-1)!.run).toBe("bun run cat translation:drift:check");
  });

  test("nothing here uses continue-on-error or `|| true`", () => {
    for (const id of JUDGED) {
      for (const s of wf.jobs[id]!.steps) {
        expect(s["continue-on-error"]).toBeUndefined();
      }
    }
    expect(readFileSync(STEP, "utf8")).not.toMatch(/\|\|\s*true/);
  });

  // GitHub rejects the whole file when a STEP's `shell:` holds an expression
  // (only `defaults.run.shell` may), and then no job runs at all: fa#2902's
  // first push. A relative path is no answer either (gate-shell-workflow.test.ts
  // wants every custom shell absolute), so a judged job's setup and verdict
  // steps keep the job's shell and say `CQG_UNJUDGED: "true"` instead.
  test("no step-level `shell:` holds an expression", () => {
    for (const job of Object.values(wf.jobs)) {
      for (const s of job.steps ?? []) {
        expect(String(s.shell ?? "")).not.toContain("${{");
      }
    }
  });

  test("verdict reuse is `true` only when the inheritance check says so", () => {
    expect(wf.jobs["verdict-reuse"]!.outputs!.reuse).toBe(
      "${{ steps.decide.outputs.reuse == 'true' && steps.inherited.outputs.reuse == 'true' && 'true' || 'false' }}",
    );
  });
});
