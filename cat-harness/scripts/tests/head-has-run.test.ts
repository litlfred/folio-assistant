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

import { isPushed, resolveCommit, runsForHead } from "../check-head-has-run.js";
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
