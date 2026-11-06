/**
 * The merge train's decisions (bean `folio-assistant-hd58`): who is opted in
 * and ready, what the next batch is, how a red batch is bisected, and that the
 * workflows that call them are wired.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  afterRed,
  builtMembers,
  decideStep,
  nextBatch,
  notReady,
  readState,
  trainBody,
  writeState,
  type Candidate,
  type TrainPr,
} from "../../.github/scripts/merge-train.ts";
import type { CheckRun } from "../../.github/scripts/repin-train.ts";

const ROOT = resolve(import.meta.dir, "../..");
let id = 1;
const run = (name: string, conclusion: string | null, status = "completed"): CheckRun => ({ id: id++, name, status, conclusion });
const sha = (c: string) => c.repeat(40);

const cand = (over: Partial<Candidate> = {}): Candidate => ({
  number: 10,
  draft: false,
  baseRef: "main",
  sameRepo: true,
  headSha: sha("a"),
  labels: ["merge-train"],
  labelledBy: "User",
  approved: false,
  files: ["src/x.ts"],
  runs: [run("lint (hard)", "success")],
  ...over,
});

const train = (number: number, state: "open" | "closed", members: number[], queue: number[][] = []): TrainPr => ({
  number,
  state,
  merged: false,
  body: `x\n${writeState({ members: members.map((n) => ({ number: n, sha: sha("b") })), queue })}`,
  headSha: sha("c"),
  headRef: `merge-train/${number}`,
});

describe("opted in and ready", () => {
  const main = [run("lint (hard)", "success"), run("tests (hard)", "failure")];

  test("a person's label, green checks: ready", () => {
    expect(notReady(cand(), main)).toBeUndefined();
  });
  test("a label added by a bot is not a person's decision", () => {
    expect(notReady(cand({ labelledBy: "Bot" }), main)).toContain("not added by a person");
  });
  test("an approval opts in without the label", () => {
    expect(notReady(cand({ labels: [], labelledBy: undefined, approved: true }), main)).toBeUndefined();
    expect(notReady(cand({ labels: [], labelledBy: undefined }), main)).toContain("not opted in");
  });
  test("drafts, forks, other bases and protected paths are never carried", () => {
    expect(notReady(cand({ draft: true }), main)).toBe("a draft");
    expect(notReady(cand({ sameRepo: false }), main)).toBe("a fork");
    expect(notReady(cand({ baseRef: "dev" }), main)).toContain("base is dev");
    expect(notReady(cand({ files: [".github/workflows/x.yml"] }), main)).toContain("never carries");
    expect(notReady(cand({ files: ["subscriptions/a/b.json"] }), main)).toContain("never carries");
  });
  test("a failure main shares does not block; a new one does; running checks wait", () => {
    expect(notReady(cand({ runs: [run("tests (hard)", "failure")] }), main)).toBeUndefined();
    expect(notReady(cand({ runs: [run("lint (hard)", "failure")] }), main)).toContain("fail where main passes");
    expect(notReady(cand({ runs: [run("lint (hard)", null, "in_progress")] }), main)).toContain("still running");
  });
  test("a conflicted PR has no runs, and the train integrates it", () => {
    expect(notReady(cand({ runs: [] }), main)).toBeUndefined();
  });
  test("a train PR is never a member of a train", () => {
    expect(notReady(cand({ labels: ["merge-train", "merge-train-batch"] }), main)).toContain("train PR itself");
  });
});

describe("bisecting a red batch", () => {
  test("one member is the culprit", () => {
    expect(afterRed([7], [[8, 9]])).toEqual({ eject: 7, queue: [[8, 9]] });
  });
  test("a larger batch splits in halves, first half first, ahead of the old queue", () => {
    expect(afterRed([1, 2, 3, 4, 5], [[9]])).toEqual({ queue: [[1, 2, 3], [4, 5], [9]] });
  });
  test("one culprit among k costs about ceil(log2 k) red runs", () => {
    for (const k of [2, 3, 5, 8, 16, 33]) {
      const culprit = k - 1;
      let queue: number[][] = [[...Array(k).keys()]];
      let red = 0;
      let landed = 0;
      while (queue.length) {
        const b = queue.shift()!;
        if (b.includes(culprit)) {
          red++;
          const r = afterRed(b, queue);
          if (r.eject !== undefined) { expect(r.eject).toBe(culprit); queue = r.queue; continue; }
          queue = r.queue;
        } else landed += b.length;
      }
      expect(landed).toBe(k - 1);
      expect(red).toBeLessThanOrEqual(Math.ceil(Math.log2(k)) + 1);
    }
  });
});

describe("the next batch", () => {
  test("the bisect queue goes first, restricted to PRs still ready", () => {
    expect(nextBatch([1, 2, 5, 9], [[3, 2], [1]])).toEqual({ batch: [2], queue: [[1]] });
    expect(nextBatch([5, 9], [[3], [4]])).toEqual({ batch: [9, 5].sort((a, b) => a - b), queue: [] });
  });
  test("with no queue, every ready PR, oldest first", () => {
    expect(nextBatch([9, 1, 5], [])).toEqual({ batch: [1, 5, 9], queue: [] });
  });
});

describe("one tick's step", () => {
  test("an open train still being checked waits", () => {
    expect(decideStep([train(50, "open", [1, 2])], "pending", [3]).action).toBe("wait");
    expect(decideStep([train(50, "open", [1, 2])], undefined, [3]).action).toBe("wait");
  });
  test("green merges; red bisects or ejects", () => {
    expect(decideStep([train(50, "open", [1, 2])], "success", []).action).toBe("merge");
    expect(decideStep([train(50, "open", [1, 2])], "failure", [])).toMatchObject({ action: "red", queue: [[1], [2]] });
    expect(decideStep([train(50, "open", [4], [[5]])], "error", [])).toMatchObject({ action: "red", eject: 4, queue: [[5]] });
  });
  test("no open train: build from the newest train's queue, else the pool", () => {
    expect(decideStep([train(52, "closed", [], [[3]]), train(51, "closed", [], [[9]])], undefined, [3, 4])).toEqual({ action: "build", batch: [3], queue: [] });
    expect(decideStep([], undefined, [4, 3])).toEqual({ action: "build", batch: [3, 4], queue: [] });
    expect(decideStep([], undefined, []).action).toBe("idle");
  });
});

describe("state in the train PR body", () => {
  test("round-trips, and a body without it reads as none", () => {
    const s = { members: [{ number: 1, sha: sha("d") }], queue: [[2, 3]] };
    expect(readState(`a\n${writeState(s)}\nb`)).toEqual(s);
    expect(readState("no state")).toBeUndefined();
    expect(readState("<!-- merge-train:state {broken} -->")).toBeUndefined();
  });
  test("only the members merge:train merged are carried; the rest are named", () => {
    const plan = { members: [{ number: 1, sha: sha("d") }, { number: 2, sha: sha("e") }], queue: [] };
    const report = {
      head: sha("f"),
      verdict: "needs-a-person",
      members: [
        { spec: `1:${sha("d")}`, sha: sha("d"), status: "merged" },
        { spec: `2:${sha("e")}`, sha: sha("e"), status: "refused", reason: "1 conflict(s) need a person" },
      ],
    };
    const { members, refused } = builtMembers(plan, report);
    expect(members.map((m) => m.number)).toEqual([1]);
    expect(refused).toEqual([{ number: 2, reason: "1 conflict(s) need a person" }]);
    const body = trainBody({ members, queue: [] }, refused, sha("f"));
    expect(readState(body)?.members).toEqual(members);
    expect(body).toContain("#2: 1 conflict(s) need a person");
  });
});

describe("the workflows are wired", () => {
  const wf = (f: string) => readFileSync(join(ROOT, ".github/workflows", f), "utf-8");
  test("merge-main's sweep skips a PR in the train", () => {
    expect(wf("merge-main.yml")).toContain(`any(.labels[]; .name == "merge-train")`);
  });
  test("the sweep dispatches the train only when `pending` says so", () => {
    const s = wf("sweeps.yml");
    expect(s).toContain("merge-train.ts pending");
    expect(s).toContain("gh workflow run merge-train.yml");
  });
  test("the train builds with merge:train and judges once", () => {
    const s = wf("merge-train.yml");
    expect(s).toContain("bun run cat merge:train -- --base origin/main");
    expect(s).toContain("merge-train.ts tick");
    expect(s).toContain("gh workflow run code-quality-gates.yml");
    // Owner, 2026-11-05: a hand-written conflict ejects the PR with a comment.
    expect(s).toContain("merge-train.ts eject-refused");
  });
  test("a dispatch on main after a train merge is looked up by its second parent", () => {
    expect(wf("code-quality-gates.yml")).toContain(`git rev-parse -q --verify 'HEAD^2'`);
  });
});

describe("a closed train carries the queue on", () => {
  test("withState replaces the state, or appends it", async () => {
    const { withState } = await import("../../.github/scripts/merge-train.ts");
    const s = { members: [], queue: [[4]] };
    expect(readState(withState(`x\n${writeState({ members: [], queue: [] })}`, s))).toEqual(s);
    expect(readState(withState("x", s))).toEqual(s);
  });
});

describe("the workflow-PR off switch (owner, 2026-11-05)", () => {
  const main: CheckRun[] = [];
  test("off: a PR changing .github/workflows/ is not carried", () => {
    expect(notReady(cand({ files: [".github/workflows/x.yml"] }), main, false)).toContain("never carries");
  });
  test("on: it is carried; subscriptions/ never is", () => {
    expect(notReady(cand({ files: [".github/workflows/x.yml", "src/a.ts"] }), main, true)).toBeUndefined();
    expect(notReady(cand({ files: ["subscriptions/a/b.json"] }), main, true)).toContain("never carries");
  });
  test("both workflows gate the switch on the variable AND a bot token", () => {
    for (const f of ["merge-train.yml", "sweeps.yml"]) {
      const s = readFileSync(join(ROOT, ".github/workflows", f), "utf-8");
      expect(s).toMatch(/MERGE_TRAIN_CARRIES_WORKFLOWS: \$\{\{ vars\.MERGE_TRAIN_CARRIES_WORKFLOWS == 'true' && \(/);
    }
  });
});

describe("the sweep starts a runner only when a tick has something to do", () => {
  const trainPull = (sha: string) => ({
    number: 70, state: "open", body: writeState({ members: [{ number: 1, sha: sha }], queue: [] }),
    head: { sha, ref: "merge-train/x", repo: { full_name: "o/r" } }, base: { ref: "main" },
    labels: [{ name: "merge-train-batch" }],
  });
  const stub = (runs: Array<{ status: string; conclusion: string | null }>) => ({
    async get<T>(path: string): Promise<T> {
      if (path.includes("/pulls?state=all")) return [trainPull("c".repeat(40))] as T;
      if (path.includes("/check-runs")) return { check_runs: runs.map((r, i) => ({ id: i + 1, name: `j${i}`, ...r })) } as T;
      throw new Error(`unexpected ${path}`);
    },
    async send<T>(): Promise<T> { throw new Error("pending must not write"); },
    async text(): Promise<string> { return ""; },
  });
  test("an open train whose checks still run is no work", async () => {
    const { pending } = await import("../../.github/scripts/merge-train.ts");
    expect(await pending(stub([{ status: "completed", conclusion: "success" }, { status: "in_progress", conclusion: null }]), "o/r")).toBeUndefined();
    expect(await pending(stub([]), "o/r")).toBeUndefined();
  });
  test("an open train whose checks all finished is", async () => {
    const { pending } = await import("../../.github/scripts/merge-train.ts");
    expect(await pending(stub([{ status: "completed", conclusion: "failure" }]), "o/r")).toContain("judge it");
  });
});

describe("one whole tick, against a stub GitHub", () => {
  const R = "o/r";
  const C = "c".repeat(40), M1 = "1".repeat(40), M2 = "2".repeat(40), MAIN = "f".repeat(40);
  const pull = (n: number, sha: string, labels: string[], ref = `b${n}`, extra: object = {}) => ({
    number: n, state: "open", draft: false, body: "", head: { sha, ref, repo: { full_name: R } }, base: { ref: "main" },
    // A stub value; the train reads `mergeable_state` only to word a refusal (fx5r).
    labels: labels.map((name) => ({ name })), mergeable: true, mergeable_state: "clean", ...extra,
  });
  function world() {
    const sent: Array<{ method: string; path: string; body: Record<string, unknown> }> = [];
    const green = { check_runs: [{ id: 9, name: "lint (hard)", status: "completed", conclusion: "success" }] };
    const train = pull(80, C, ["merge-train-batch"], "merge-train/x", {
      body: writeState({ members: [{ number: 11, sha: M1 }], queue: [] }),
    });
    const api = {
      async get<T>(p: string): Promise<T> {
        if (p.startsWith(`/repos/${R}/pulls?state=all`)) return [train] as T;
        if (p.startsWith(`/repos/${R}/commits?sha=main`)) return [{ sha: MAIN }] as T;
        if (p.includes("/check-runs")) return green as T;
        if (p === `/repos/${R}/pulls/80`) return train as T;
        if (p === `/repos/${R}/pulls/11`) return pull(11, M1, ["merge-train"]) as T;
        if (p.startsWith(`/repos/${R}/issues/80/comments`)) return [] as T;
        // GitHub has not caught up yet: #11 still reads open and labelled.
        if (p.startsWith(`/repos/${R}/pulls?state=open`)) return [pull(11, M1, ["merge-train"]), pull(12, M2, ["merge-train"])] as T;
        if (p.startsWith("/search/issues")) return { items: [] } as T;
        if (/\/issues\/1[12]\/events/.test(p)) return [{ event: "labeled", label: { name: "merge-train" }, actor: { type: "User" } }] as T;
        if (/\/pulls\/1[12]\/reviews/.test(p)) return [] as T;
        if (/\/pulls\/1[12]\/files/.test(p)) return [{ filename: "src/a.ts" }] as T;
        throw new Error(`unexpected GET ${p}`);
      },
      async send<T>(method: string, path: string, body: unknown): Promise<T> {
        sent.push({ method, path, body: (body ?? {}) as Record<string, unknown> });
        return undefined as T;
      },
      async text(): Promise<string> { return ""; },
    };
    return { api, sent };
  }

  test("a green train lands, its member is told, and the next plan does not take it again", async () => {
    const { tick } = await import("../../.github/scripts/merge-train.ts");
    const { api, sent } = world();
    const r = await tick(api as never, R, { mergeTriggersCi: false });
    // judged, then merged with the judged head as the expected sha
    expect(sent.find((s) => s.path === `/repos/${R}/statuses/${C}`)?.body.state).toBe("success");
    const merge = sent.find((s) => s.method === "PUT" && s.path === `/repos/${R}/pulls/80/merge`);
    expect(merge?.body).toMatchObject({ merge_method: "merge", sha: C });
    // a GITHUB_TOKEN merge starts no push run, so the gates are dispatched on main
    expect(sent.some((s) => s.path.endsWith("/code-quality-gates.yml/dispatches") && s.body.ref === "main")).toBe(true);
    // the member is told
    expect(sent.some((s) => s.path === `/repos/${R}/issues/11/comments`)).toBe(true);
    // #11 still reads open and labelled, but landed this tick: only #12 rides next
    expect(r.step).toEqual({ action: "build", batch: [12], queue: [] });
    expect(r.plan?.members).toEqual([{ number: 12, sha: M2 }]);
  });
});

describe("a member already on main is neither carried nor ejected", () => {
  test("builtMembers skips already-contained", () => {
    const plan = { members: [{ number: 1, sha: "d".repeat(40) }], queue: [] };
    const report = { head: "e".repeat(40), verdict: "built", members: [{ spec: `1:${"d".repeat(40)}`, sha: "d".repeat(40), status: "already-contained" }] };
    expect(builtMembers(plan, report)).toEqual({ members: [], refused: [] });
  });
});
