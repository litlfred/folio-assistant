/**
 * The re-pin train's decisions (issue #2873, owner card Q-SPD-3 B): when a
 * train opens, and when a train PR has no new failures compared with main.
 * The workflows that call them are pinned at the end.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { deflateSync } from "node:zlib";

import {
  baselineByName,
  compare,
  decide,
  decodeCqgRecord,
  mergeTrain,
  trainsToJudge,
  verdictComment,
  type Api,
  type CheckRun,
  type CqgRecord,
  type PullInfo,
  type Records,
  type TrainPr,
} from "../../.github/scripts/repin-train.ts";

const ROOT = resolve(import.meta.dir, "../..");
let nextId = 1;
const run = (name: string, conclusion: string | null, status = "completed"): CheckRun => ({ id: nextId++, name, status, conclusion });
const tree = (c: string) => c.repeat(40);
const pr = (number: number, state: "open" | "closed", t: string, verdict?: TrainPr["verdict"]): TrainPr => ({
  number,
  state,
  merged: false,
  body: `pins…\n<!-- repin-train:tree=${t} -->`,
  verdict,
});

describe("no new failures compared with main", () => {
  test("a failure main also has is known, not new", () => {
    const v = compare([run("e2e (1)", "failure"), run("lint", "success")], [run("e2e (1)", "failure"), run("lint", "success")]);
    expect(v).toEqual({ state: "success", pending: [], newFailures: [], knownFailures: ["e2e (1)"], undetermined: [] });
  });

  test("a failure main passes is new and blocks", () => {
    const v = compare([run("bun test (3)", "failure")], [run("bun test (3)", "success")]);
    expect(v.state).toBe("failure");
    expect(v.newFailures).toEqual(["bun test (3)"]);
  });

  test("a failing check main does not run at all is new", () => {
    expect(compare([run("stage", "failure")], [run("lint", "success")]).newFailures).toEqual(["stage"]);
  });

  test("cancelled and timed out are not passes", () => {
    expect(compare([run("a", "cancelled"), run("b", "timed_out")], []).newFailures).toEqual(["a", "b"]);
  });

  test("a re-run supersedes the run it repeats", () => {
    const first = run("bun test (2)", "failure");
    const rerun = run("bun test (2)", "success");
    expect(compare([first, rerun], []).state).toBe("success");
  });

  test("a running check keeps the verdict pending, unless a new failure already decides it", () => {
    expect(compare([run("a", null, "in_progress"), run("b", "success")], []).state).toBe("pending");
    expect(compare([run("a", null, "in_progress"), run("b", "failure")], []).state).toBe("failure");
  });

  test("no checks at all is never green", () => {
    expect(compare([], []).state).toBe("pending");
  });

  test("waits for a hard gate main runs that has not started on the train", () => {
    const v = compare([run("stage", "success")], [run("Repository gates (hard)", "success"), run("deploy", "success")]);
    expect(v.state).toBe("pending");
    expect(v.pending).toEqual(["Repository gates (hard)"]);
  });
});

// ── Per check, not per job (owner, 2026-11-03) ──────────────────────────────

const rec = (items: Record<string, number>, extra: Partial<CqgRecord> = {}): CqgRecord => ({
  complete: true,
  undetermined: [],
  items: Object.fromEntries(Object.entries(items).map(([k, exit]) => [k, { label: k.replace(/^(step|test):/, ""), exit }])),
  ...extra,
});
const records = (train: Record<string, CqgRecord | null>, main: Record<string, CqgRecord | null>): Records => ({
  train: new Map(Object.entries(train)),
  main: new Map(Object.entries(main)),
});
const JOB = "Repository gates — workflows, skills, knowledge graph (hard)";

describe("a failing job is judged check by check when it left a record", () => {
  test("a new failure inside a job main also fails is NEW, not masked by the job", () => {
    const v = compare(
      [run(JOB, "failure")],
      [run(JOB, "failure")],
      records({ [JOB]: rec({ "step:a": 1, "step:b": 1 }) }, { [JOB]: rec({ "step:a": 1, "step:b": 0 }) }),
    );
    expect(v.state).toBe("failure");
    expect(v.newFailures).toEqual([`${JOB} › b`]);
    expect(v.knownFailures).toEqual([`${JOB} › a`]);
  });

  test("every failing check also failing on main is known, and the train is green", () => {
    const v = compare(
      [run(JOB, "failure")],
      [run(JOB, "failure")],
      records({ [JOB]: rec({ "test:x.test.ts > t": 1, "step:a": 0 }) }, { [JOB]: rec({ "test:x.test.ts > t": 1 }) }),
    );
    expect(v.state).toBe("success");
    expect(v.knownFailures).toEqual([`${JOB} › x.test.ts > t`]);
  });

  test("a check main's record lacks is new", () => {
    const v = compare([run(JOB, "failure")], [run(JOB, "failure")], records({ [JOB]: rec({ "test:new.test.ts > t": 1 }) }, { [JOB]: rec({}) }));
    expect(v.newFailures).toEqual([`${JOB} › new.test.ts > t`]);
  });

  test("could-not-determine is never green", () => {
    const cases: Array<[CqgRecord | null, CqgRecord | null]> = [
      [null, rec({ "step:a": 1 })], // the train left no record where main has one
      [rec({ "step:a": 1 }, { complete: false }), rec({ "step:a": 1 })], // incomplete on the train
      [rec({ "step:a": 1 }, { undetermined: [{ label: "bun test", why: "no JUnit" }] }), rec({ "step:a": 1 })],
      [rec({ "step:a": 1 }), null], // main has no record to compare with
      [rec({ "step:a": 1 }), rec({ "step:a": 1 }, { complete: false })],
      [rec({ "step:a": 0 }), rec({ "step:a": 1 })], // the job failed, and its record names nothing failing
    ];
    for (const [t, m] of cases) {
      const v = compare([run(JOB, "failure")], [run(JOB, "failure")], records({ [JOB]: t }, { [JOB]: m }));
      expect(v.state).toBe("error");
      expect(v.undetermined).toHaveLength(1);
      expect(v.newFailures).toEqual([]);
    }
  });

  test("a new failure decides the verdict even when something else is undetermined", () => {
    const v = compare(
      [run(JOB, "failure"), run("other", "failure")],
      [run(JOB, "failure"), run("other", "success")],
      records({ [JOB]: null }, { [JOB]: rec({ "step:a": 1 }) }),
    );
    expect(v.state).toBe("failure");
    expect(v.newFailures).toEqual(["other"]);
  });

  test("a job with no record on either side is judged as a whole job, as before", () => {
    const v = compare([run("Feature staging", "failure")], [run("Feature staging", "failure")], records({ "Feature staging": null }, { "Feature staging": null }));
    expect(v.state).toBe("success");
    expect(v.knownFailures).toEqual(["Feature staging"]);
  });

  test("the record is read back exactly as cqg_judge.py writes it", () => {
    const json = JSON.stringify({ complete: true, undetermined: [], items: { "step:abc": { label: "bun run cat lint", exit: 1 } } });
    const line = `2026-11-03T11:22:05.8Z CQG-REPORT-V1 ${deflateSync(Buffer.from(json)).toString("base64")}`;
    const log = ["noise", "CQG-REPORT-V1 not-base64!!", line, "Post job cleanup."].join("\n");
    expect(decodeCqgRecord(log)).toEqual({ complete: true, undetermined: [], items: { "step:abc": { label: "bun run cat lint", exit: 1 } } });
    expect(decodeCqgRecord("no record here")).toBeUndefined();
  });

  test("the comment lists what could not be compared, and says the train does not merge", () => {
    const body = verdictComment({ state: "error", pending: [], newFailures: [], knownFailures: [], undetermined: ["J: why"] }, "a".repeat(40));
    expect(body).toContain("Could not determine");
    expect(body).toContain("- `J: why`");
  });
});

// ── The train merges itself on a green verdict (owner, 2026-11-03) ──────────

const REPO = "litlfred/folio-assistant";
const SHA = "1".repeat(40);
const pull = (over: Partial<PullInfo> = {}): PullInfo => ({
  number: 9,
  state: "open",
  head: { sha: SHA, ref: "repin-train/20261103-1017", repo: { full_name: REPO } },
  labels: [{ name: "repin-train" }],
  mergeable: true,
  // A fixture value; the live field can be stale (bean fx5r).
  mergeable_state: "clean",
  ...over,
});
function stubApi(pr: PullInfo | PullInfo[], opts: { statuses?: Record<string, string>; refuse?: boolean; running?: string[] } = {}) {
  const sent: Array<{ method: string; path: string; body: unknown }> = [];
  const api: Api = {
    async get<T>(path: string): Promise<T> {
      if (path.includes("/pulls?state=open")) return (Array.isArray(pr) ? pr : [pr]) as T;
      if (path.includes("/check-runs")) {
        const sha = path.split("/commits/")[1].split("/")[0];
        return { check_runs: [opts.running?.includes(sha) ? run("bun test (2)", null, "in_progress") : run("bun test (2)", "failure")] } as T;
      }
      if (path.endsWith("/status")) {
        const sha = path.split("/commits/")[1].split("/")[0];
        const state = opts.statuses?.[sha];
        return { statuses: state ? [{ context: "repin-train / no new failures", state }] : [] } as T;
      }
      return (Array.isArray(pr) ? pr[0] : pr) as T;
    },
    async send<T>(method: "POST" | "PATCH" | "PUT", path: string, body: unknown): Promise<T> {
      if (opts.refuse) throw new Error("HTTP 405 Base branch was modified");
      sent.push({ method, path, body });
      return undefined as T;
    },
    async text() {
      return "";
    },
  };
  return { api, sent };
}
const noWait = async () => {};

describe("a green train merges itself", () => {
  test("merges with a merge commit, the judged head as the expected sha", async () => {
    const { api, sent } = stubApi(pull());
    expect((await mergeTrain(api, REPO, 9, SHA, noWait)).merged).toBe(true);
    expect(sent).toEqual([{ method: "PUT", path: `/repos/${REPO}/pulls/9/merge`, body: expect.objectContaining({ merge_method: "merge", sha: SHA }) }]);
  });

  test("never merges a head that moved, a closed PR, a fork's branch, or an unmergeable PR", async () => {
    for (const p of [
      pull({ head: { sha: "2".repeat(40), ref: "repin-train/x", repo: { full_name: REPO } } }),
      pull({ state: "closed" }),
      pull({ head: { sha: SHA, ref: "repin-train/x", repo: { full_name: "someone/fork" } } }),
      pull({ head: { sha: SHA, ref: "feature/x", repo: { full_name: REPO } } }),
      pull({ labels: [] }),
      // only `dirty` is trusted as a refusal (yv4z):
      pull({ mergeable: false, mergeable_state: "dirty" }),
      pull({ mergeable: null }),
    ]) {
      const { api, sent } = stubApi(p);
      expect((await mergeTrain(api, REPO, 9, SHA, noWait)).merged).toBe(false);
      expect(sent).toEqual([]);
    }
  });

  test("a refused merge is reported, not thrown", async () => {
    const { api } = stubApi(pull(), { refuse: true });
    const m = await mergeTrain(api, REPO, 9, SHA, noWait);
    expect(m.merged).toBe(false);
    expect(m.why).toContain("405");
  });

  test("a sweep judges open trains with no final verdict, and only this repository's", async () => {
    const a = pull({ number: 1, head: { sha: "a".repeat(40), ref: "repin-train/a", repo: { full_name: REPO } } });
    const b = pull({ number: 2, head: { sha: "b".repeat(40), ref: "repin-train/b", repo: { full_name: REPO } } });
    const c = pull({ number: 3, head: { sha: "c".repeat(40), ref: "repin-train/c", repo: { full_name: REPO } } });
    const d = pull({ number: 4, head: { sha: "d".repeat(40), ref: "repin-train/d", repo: { full_name: REPO } } });
    const fork = pull({ number: 5, head: { sha: "e".repeat(40), ref: "repin-train/e", repo: { full_name: "x/fork" } } });
    const { api } = stubApi([a, b, c, d, fork], { statuses: { ["b".repeat(40)]: "failure", ["c".repeat(40)]: "success", ["d".repeat(40)]: "error" } });
    expect(await trainsToJudge(api, REPO)).toEqual(["a".repeat(40), "c".repeat(40)]);
  });

  test("a failed train is judged again while its checks still run, so the comment lists every failure", async () => {
    const b = pull({ number: 2, head: { sha: "b".repeat(40), ref: "repin-train/b", repo: { full_name: REPO } } });
    const d = pull({ number: 4, head: { sha: "d".repeat(40), ref: "repin-train/d", repo: { full_name: REPO } } });
    const { api } = stubApi([b, d], { statuses: { ["b".repeat(40)]: "failure", ["d".repeat(40)]: "failure" }, running: ["b".repeat(40)] });
    expect(await trainsToJudge(api, REPO)).toEqual(["b".repeat(40)]);
  });
});

describe("main's baseline is read one check at a time", () => {
  test("a check the newest main commit skipped takes its answer from an older commit", () => {
    const newest = [run("deploy", "success")];
    const older = [run("Repository gates (hard)", "failure"), run("deploy", "failure")];
    const base = baselineByName([newest, older]);
    expect(base.find((r) => r.name === "Repository gates (hard)")?.conclusion).toBe("failure");
    expect(base.find((r) => r.name === "deploy")?.conclusion).toBe("success");
    expect(compare([run("Repository gates (hard)", "failure")], base).knownFailures).toEqual(["Repository gates (hard)"]);
  });

  test("a check still running on the newest commit keeps the older finished answer", () => {
    const base = baselineByName([[run("bun test (1)", null, "in_progress")], [run("bun test (1)", "failure")]]);
    expect(base.map((r) => r.conclusion)).toEqual(["failure"]);
  });
});

describe("when a train opens", () => {
  test("nothing open: open a train", () => {
    expect(decide(tree("a"), [])).toEqual({ action: "open", reason: "new pins", close: [] });
  });

  test("a tree an earlier train already tested is skipped, open or closed", () => {
    expect(decide(tree("a"), [pr(7, "closed", tree("a"))]).action).toBe("skip");
    expect(decide(tree("a"), [pr(7, "open", tree("a"), "failure")]).action).toBe("skip");
  });

  test("a train still being checked keeps its pins frozen", () => {
    const d = decide(tree("b"), [pr(7, "open", tree("a"))]);
    expect(d.action).toBe("skip");
    expect(d.reason).toContain("#7");
    expect(decide(tree("b"), [pr(7, "open", tree("a"), "pending")]).action).toBe("skip");
  });

  test("a passed train waiting for its merge is not closed under that merge", () => {
    expect(decide(tree("b"), [pr(7, "open", tree("a"), "success")]).action).toBe("skip");
  });

  test("a failed train is replaced and closed", () => {
    expect(decide(tree("b"), [pr(7, "open", tree("a"), "failure"), pr(5, "closed", tree("c"))])).toEqual({ action: "open", reason: "new pins", close: [7] });
  });
});

describe("the workflows", () => {
  const train = readFileSync(join(ROOT, ".github/workflows/repin-train.yml"), "utf-8");
  const verdict = readFileSync(join(ROOT, ".github/workflows/repin-train-verdict.yml"), "utf-8");

  test("the train runs every two hours, one at a time", () => {
    expect(train).toMatch(/cron: '\d+ \*\/2 \* \* \*'/);
    expect(train).toMatch(/group: repin-train\n\s+cancel-in-progress: false/);
  });

  test("the train moves pins only through standing consent, and never merges while it cuts the next train", () => {
    expect(train).toContain("mount:repin:standing");
    expect(train).not.toMatch(/\/merge\b|gh pr merge/);
    // It judges before `decide`; a merge there would land under the train it
    // is about to cut from the old main, so it leaves the merge to the verdict.
    expect(train).toMatch(/repin-train\.ts verdict --sha "\$sha" --no-merge/);
  });

  test("the train refreshes bun.lock with its pins, so frozen installs pass", () => {
    const repin = train.indexOf("mount:repin:standing --summary-file");
    const install = train.indexOf("bun install\n", repin);
    expect(install).toBeGreaterThan(repin);
    expect(install).toBeLessThan(train.indexOf("git add -u"));
  });

  test("after the pins move, the moved tools add newly declared directories, and only when they know how", () => {
    const save = train.indexOf('cp index.config.json "$RUNNER_TEMP/index.config.before.json"');
    const repin = train.indexOf("mount:repin:standing --summary-file");
    const guard = train.indexOf("grep -q -- '--extend-from' cat-harness-tools/scripts/repin-standing.ts");
    const extend = train.indexOf('mount:repin:standing --extend-from "$RUNNER_TEMP/index.config.before.json"');
    expect(save).toBeGreaterThan(-1);
    expect(save).toBeLessThan(repin);
    expect(guard).toBeGreaterThan(repin);
    expect(extend).toBeGreaterThan(guard);
    expect(extend).toBeLessThan(train.indexOf("git add -u"));
  });

  test("the train never commits workflow files, which its token may not push", () => {
    const restore = train.indexOf("git checkout -- .github/workflows");
    expect(restore).toBeGreaterThan(train.indexOf("mount:repin:standing --summary-file"));
    expect(restore).toBeLessThan(train.indexOf("git add -u"));
  });

  test("the train judges open trains itself, since token-started CI triggers no workflow_run", () => {
    const judge = train.indexOf("repin-train.ts verdict --sha");
    expect(judge).toBeGreaterThan(-1);
    expect(judge).toBeLessThan(train.lastIndexOf("repin-train.ts decide --tree"));
    expect(train).toContain("statuses: write");
  });

  test("without a bot token, the train starts both workflows the verdict reads", () => {
    expect(train).toContain("gh workflow run code-quality-gates.yml");
    expect(train).toContain("gh workflow run feature-staging.yml");
  });

  test("the verdict judges only train branches", () => {
    expect(verdict).toContain("startsWith(github.event.workflow_run.head_branch, 'repin-train/')");
    expect(verdict).toContain("github.event.workflow_run.head_repository.full_name == github.repository");
  });

  test("the verdict sweeps open trains on a short schedule, since token-started CI triggers no workflow_run", () => {
    // The tick lives in `sweeps.yml` (2026-11-05): it asks `pending` and
    // dispatches the verdict, whose dispatched run with no sha sweeps.
    const sweeps = readFileSync(join(import.meta.dir, "../../.github/workflows/sweeps.yml"), "utf-8");
    expect(sweeps).toMatch(/schedule:\n\s+(#.*\n\s+)*- cron: '[^']+'/);
    expect(sweeps).toContain("repin-train.ts pending");
    expect(sweeps).toContain("gh workflow run repin-train-verdict.yml");
    expect(verdict).toContain("workflow_dispatch:");
    expect(verdict).toContain("repin-train.ts verdict --open");
  });

  test("the verdict's workflow_run fires only for train branches, at the trigger", () => {
    expect(verdict).toContain("branches: ['repin-train/**']");
  });

  test("the verdict merges with a token whose push starts main's workflows when one is set", () => {
    expect(verdict).toContain("MERGE_TOKEN: ${{ steps.bot.outputs.token || secrets.PUSH_BRANCH_TRIGGERING_CI || github.token }}");
    expect(verdict).toMatch(/contents: write/);
    expect(verdict).toMatch(/actions: (read|write)/);
  });
});
