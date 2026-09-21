/**
 * Zero checks and checks-not-started look the same. This tells them apart.
 *
 * @module scripts/tests/head-has-run
 *
 * Bean `3pqn`. The property under test is not "it queries GitHub" — it is that
 * **three answers stay three answers**. A commit with no run, a commit nobody
 * could ask about, and a commit that has runs are different facts, and the
 * failure this script exists to prevent is any two of them rendering alike.
 *
 * The first draft failed that on its own terms: `deadbeef…` reported "has NO
 * workflow run of any kind", because an id GitHub never heard of returns an
 * empty list exactly as a dropped event does. That case is pinned below.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  isPushed,
  mergeStateForHead,
  noRunAdvice,
  prNumberForHead,
  resolveCommit,
  runsForHead,
  type GitRunner,
} from "../check-head-has-run.js";
import { repoRootFor } from "../../schemas/cat-harness.js";

const REPO = repoRootFor(resolve(import.meta.dir, "..", ".."));

/** A fetch that answers with `runs` and never touches the network. */
const stub = (runs: unknown[], init: { ok?: boolean; status?: number } = {}) =>
  (async () =>
    ({
      ok: init.ok ?? true,
      status: init.status ?? 200,
      headers: new Headers(),
      json: async () => ({ workflow_runs: runs }),
    }) as unknown as Response) as unknown as typeof fetch;

/** No real sleeping in tests — see the thrown-fetch case below. */
const FAST = { attempts: 3, sleep: async () => {} };

describe("three answers stay three answers", () => {
  test("runs present is `has-run`, and they come back", async () => {
    const r = await runsForHead("o/r", "abc", stub([{ name: "gates", event: "pull_request" }]));
    expect(r.state).toBe("has-run");
    expect(r.state === "has-run" && r.runs).toHaveLength(1);
  });

  test("an EMPTY list is `no-run` — a determined absence", async () => {
    expect((await runsForHead("o/r", "abc", stub([]))).state).toBe("no-run");
  });

  test("a missing `workflow_runs` key is also `no-run`, not a crash", async () => {
    const f = (async () => ({ ok: true, status: 200, json: async () => ({}) }) as unknown as Response) as unknown as typeof fetch;
    expect((await runsForHead("o/r", "abc", f)).state).toBe("no-run");
  });

  test("NO REMOTE is `cannot-ask`, never `no-run`", async () => {
    const r = await runsForHead(undefined, "abc", stub([]));
    expect(r.state).toBe("cannot-ask");
  });

  test("a 404 is `cannot-ask` and names the token — not being ALLOWED to look is not an absence", async () => {
    const r = await runsForHead("o/r", "abc", stub([], { ok: false, status: 404 }), FAST);
    expect(r.state).toBe("cannot-ask");
    expect(r.state === "cannot-ask" && r.reason).toContain("GITHUB_TOKEN");
  });

  test("a 403 is `cannot-ask` and names rate limiting", async () => {
    const r = await runsForHead("o/r", "abc", stub([], { ok: false, status: 403 }), FAST);
    expect(r.state === "cannot-ask" && r.reason).toContain("rate limited");
  });

  test("a thrown fetch is retried, and THEN `cannot-ask` with the reason", async () => {
    // The owner's rule (2026-09-20): a falling-off retry rate on every error.
    // A dropped socket says nothing about the question, so it is worth asking
    // again — but exhausting the retries does NOT change the verdict. It is
    // the same third state it would have been without them.
    //
    // The sleep is injected. With the real one this takes 1+2+4+8s and fails
    // at bun's 5s default, which is exactly what the first draft did.
    let calls = 0;
    const f = (async () => {
      calls += 1;
      throw new Error("network is unreachable");
    }) as unknown as typeof fetch;
    const r = await runsForHead("o/r", "abc", f, { attempts: 3, sleep: async () => {} });
    expect(calls).toBe(3);
    expect(r.state === "cannot-ask" && r.reason).toContain("unreachable");
  });

  test("a 5xx is retried; a 404 is NOT — one is a blip, the other is an answer", async () => {
    let calls = 0;
    const responder = (status: number) =>
      (async () => {
        calls += 1;
        return { ok: false, status, headers: new Headers(), json: async () => ({}) } as unknown as Response;
      }) as unknown as typeof fetch;

    calls = 0;
    await runsForHead("o/r", "abc", responder(503), { attempts: 3, sleep: async () => {} });
    expect(calls).toBe(3);

    calls = 0;
    await runsForHead("o/r", "abc", responder(404), { attempts: 3, sleep: async () => {} });
    expect(calls).toBe(1);
  });
});

describe("the commit is resolved HERE before GitHub is asked", () => {
  test("an id git does not know is undefined — the CLI turns this into exit 2", () => {
    // The first draft's defect, pinned: without this, `deadbeef…` comes back
    // from the API as an empty list and reads as a dropped event.
    expect(resolveCommit(REPO, "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef")).toBeUndefined();
  });

  test("`HEAD` resolves to a full 40-character sha", () => {
    const sha = resolveCommit(REPO, "HEAD");
    expect(sha).toMatch(/^[0-9a-f]{40}$/);
  });

  test("a short sha resolves to the same full one", () => {
    const full = resolveCommit(REPO, "HEAD")!;
    expect(resolveCommit(REPO, full.slice(0, 8))).toBe(full);
  });
});

describe("pushed or not, because the two need different advice", () => {
  test("a commit on a remote-tracking ref reads as pushed", () => {
    // Asserted against `origin/main`, which any clone that can run this has.
    const sha = resolveCommit(REPO, "origin/main") ?? resolveCommit(REPO, "HEAD")!;
    expect(isPushed(REPO, sha)).toBe(true);
  });

  test("a commit in a fresh repo with no remote reads as NOT pushed", () => {
    // Telling somebody "GitHub dropped your event" when they simply have not
    // pushed is how a warning gets ignored.
    const root = mkdtempSync(join(tmpdir(), "headrun-"));
    const g = (...a: string[]) => execFileSync("git", ["-C", root, ...a], { stdio: "ignore" });
    g("init", "-q");
    g("config", "user.email", "t@e");
    g("config", "user.name", "t");
    g("commit", "-q", "--allow-empty", "-m", "only commit");
    expect(isPushed(root, resolveCommit(root, "HEAD")!)).toBe(false);
  });
});

/**
 * Bean `sddf` — WHY a head has no run, and the branch that used to be wrong.
 *
 * The old no-run message asserted *"It IS pushed, so this is bean `3pqn`: the
 * event was dropped"* and told the reader to dispatch the workflow. Two
 * sentences later the same message admitted a PR with zero checks *"looks
 * exactly like one whose checks have not started"* — a cause stated as fact
 * beside the admission that the evidence cannot establish it.
 *
 * Worse, the advice is now known to be unsafe: a dispatch resolves
 * `refs/heads/<branch>`, not the merge ref, so on a conflicted PR it is a green
 * signal for a tree that will never exist. `yv4z` measured that on PR #813 and
 * `prepare-merge` §Guardrails gained a step 0 for it; this script did not.
 *
 * `noRunAdvice` is a pure function precisely so these branches can be run. The
 * conflicted one could not be reached at all while it lived inline — it needs a
 * live forge holding a PR that is open and conflicted at the same moment.
 */
const HEADS = [
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\trefs/pull/11/head",
  "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\trefs/pull/22/head",
].join("\n");

/** A forge where PR 11 is mergeable and PR 22 is not. */
const fakeGit =
  (heads = HEADS, mergeable = new Set(["11"])): GitRunner =>
  (args) => {
    const ref = args[args.length - 1] ?? "";
    if (ref === "refs/pull/*/head") return heads;
    const n = /refs\/pull\/(\d+)\/merge/.exec(ref)?.[1];
    return n && mergeable.has(n) ? `cafe\t${ref}\n` : "";
  };

describe("sddf — the merge ref is the discriminator, not the clock", () => {
  test("a sha that is a PR head is found, with its number", () => {
    expect(prNumberForHead(".", "a".repeat(40), fakeGit())).toBe(11);
    expect(prNumberForHead(".", "b".repeat(40), fakeGit())).toBe(22);
  });

  test("a sha that is no PR's head is `not-a-pr-head` — nothing was ever owed", () => {
    expect(prNumberForHead(".", "c".repeat(40), fakeGit())).toBeUndefined();
    expect(mergeStateForHead(".", "c".repeat(40), fakeGit())).toBe("not-a-pr-head");
  });

  test("a merge ref present means a run is OWED", () => {
    expect(mergeStateForHead(".", "a".repeat(40), fakeGit())).toBe("mergeable");
  });

  test("NO merge ref means conflicted — this head will never get a run", () => {
    // The measurement, PR #813: conflicted -> no merge ref for 433s and no
    // `pull_request` run; resolved -> merge ref within 15s and runs in 7s.
    expect(mergeStateForHead(".", "b".repeat(40), fakeGit())).toBe("conflicted");
  });

  test("a FAILING probe is `unknown`, never `conflicted`", () => {
    // The third state, and the one this whole file exists for: a read that did
    // not happen is not an answer. Reporting it as `conflicted` would send
    // somebody to resolve a conflict that may not exist.
    const throws: GitRunner = (args) => {
      if (args[args.length - 1] === "refs/pull/*/head") return HEADS;
      throw new Error("ls-remote failed");
    };
    expect(mergeStateForHead(".", "a".repeat(40), throws)).toBe("unknown");
  });
});

/**
 * Wrapped prose, compared without its wrapping. Asserting on a literal
 * substring breaks the moment somebody re-flows a paragraph, which would make
 * this suite punish an editorial change and teach the next person to loosen
 * the assertion rather than keep it.
 */
const flat = (s: string): string => s.replace(/\s+/g, " ");

describe("sddf — the advice, per state", () => {
  test("CONFLICTED never says dispatch, and never says dropped", () => {
    const msg = flat(noRunAdvice("conflicted"));
    // The two defects, asserted as absences.
    expect(msg).not.toContain("the event was dropped");
    expect(msg).toContain("Do NOT dispatch");
    // And it must say what to do instead, or it is only a refusal.
    expect(msg).toContain("MERGE THE BASE BRANCH IN");
    expect(msg).toContain("a tree that will never exist");
  });

  test("MERGEABLE is the only state where dispatching is offered", () => {
    const msg = flat(noRunAdvice("mergeable"));
    expect(msg).toContain("safe HERE");
    // Still no confident cause: `3pqn` is named as the open question it is.
    expect(msg).toContain("NOT established");
    // And the clock is explicitly disclaimed, because `yv4z` proposed one.
    expect(msg).toContain("Latency is no guide");
  });

  test("NO state claims a cause it cannot establish", () => {
    for (const m of ["conflicted", "mergeable", "not-a-pr-head", "unknown"] as const) {
      expect(flat(noRunAdvice(m))).not.toContain("the event was dropped");
    }
  });

  test("UNKNOWN warns against dispatching rather than recommending it", () => {
    const msg = flat(noRunAdvice("unknown"));
    expect(msg).toContain("by hand");
    expect(msg).toContain("a tree that will never exist");
    expect(msg).not.toContain("safe HERE");
  });
});
