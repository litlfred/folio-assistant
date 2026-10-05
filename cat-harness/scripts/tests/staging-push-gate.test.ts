/**
 * `staging-push-gate` — the staging rate limit. Owner ruling 2026-10-03,
 * option 1, issues #1868 and #1956, bean `j27s`.
 *
 * @module scripts/tests/staging-push-gate.test
 *
 * The properties the ruling needs: a staging push waits out the Pages build of
 * the last staging push; it waits LONGER after anything else (the main site
 * above all); clock skew can only make it wait more; the deadline fails the
 * job rather than pushing; the comment says staged/queued with a time, never
 * "live"; and the CLI never reads an unreadable tip as an open window.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";
import {
  COMMENT_MARKER,
  EXIT_WAITED,
  LIVE_AFTER_PUSH_MS,
  MAIN_WINDOW_MS,
  MAX_WAIT_MS,
  STAGING_WINDOW_MS,
  clock,
  decide,
  estimateLive,
  parseTip,
  readTip,
  stagingComment,
  tipKind,
} from "../staging-push-gate.ts";

const NOW = Date.parse("2026-10-03T08:00:00Z");
const MIN = 60_000;
const SCRIPT = resolve(import.meta.dir, "..", "staging-push-gate.ts");

describe("the window", () => {
  test("windows are longer than a measured Pages build (≤ 3m40s on 2026-10-03)", () => {
    expect(STAGING_WINDOW_MS).toBeGreaterThan(3 * MIN + 40_000);
    expect(MAIN_WINDOW_MS).toBeGreaterThan(STAGING_WINDOW_MS);
  });

  test("a staging tip younger than the staging window holds the push", () => {
    const d = decide({ committedMs: NOW - 2 * MIN, subject: "staging(foo): from abc" }, NOW);
    expect(d.kind).toBe("staging");
    expect(d.open).toBe(false);
    expect(d.openAtMs).toBe(NOW - 2 * MIN + STAGING_WINDOW_MS);
  });

  test("and opens once it is older", () => {
    const d = decide({ committedMs: NOW - STAGING_WINDOW_MS, subject: "staging(foo): from abc" }, NOW);
    expect(d.open).toBe(true);
  });

  test("a main-site publish gets the wider window", () => {
    const tip = { committedMs: NOW - 7 * MIN, subject: "docs(gh-pages): site from 0123abcd" };
    expect(tipKind(tip.subject)).toBe("other");
    const d = decide(tip, NOW);
    expect(d.open).toBe(false); // 7 min is past the staging window, not the main one
    expect(d.openAtMs).toBe(NOW - 7 * MIN + MAIN_WINDOW_MS);
  });

  test("ANY non-staging publisher is protected, not just docs-site", () => {
    // Cleanup commits are staging's own; everything else is somebody's build.
    expect(tipKind("staging(cleanup): remove STAGING/x (PR #1 closed)")).toBe("staging");
    expect(tipKind("deploy: 0123abc")).toBe("other");
    expect(tipKind("")).toBe("other");
  });

  test("a tip from the future (clock skew) waits a full window, never opens early", () => {
    const d = decide({ committedMs: NOW + 30 * MIN, subject: "staging(foo): x" }, NOW);
    expect(d.open).toBe(false);
    expect(d.openAtMs).toBe(NOW + STAGING_WINDOW_MS);
  });

  test("waiting past the deadline is EXPIRED — the job fails rather than pushes", () => {
    const tip = { committedMs: NOW - MIN, subject: "staging(foo): x" };
    expect(decide(tip, NOW, NOW - MAX_WAIT_MS).expired).toBe(true);
    expect(decide(tip, NOW, NOW - MAX_WAIT_MS + MIN).expired).toBe(false);
    // An open window is never expired, however long the wait was.
    expect(decide({ ...tip, committedMs: NOW - MAIN_WINDOW_MS }, NOW, NOW - 10 * MAX_WAIT_MS).expired).toBe(false);
  });
});

describe("the estimate a reviewer is given", () => {
  test("push at the window, live a build later", () => {
    const tip = { committedMs: NOW - MIN, subject: "staging(foo): x" };
    const e = estimateLive(tip, NOW);
    expect(e.pushAtMs).toBe(NOW - MIN + STAGING_WINDOW_MS);
    expect(e.liveByMs).toBe(e.pushAtMs + LIVE_AFTER_PUSH_MS);
  });

  test("an open window pushes now", () => {
    const e = estimateLive({ committedMs: NOW - 60 * MIN, subject: "x" }, NOW);
    expect(e.pushAtMs).toBe(NOW);
  });
});

describe("the PR comment", () => {
  const base = { owner: "o", repo: "r", slug: "my-branch", branch: "my/branch", sha: "0123456789abcdef", nowMs: NOW };

  test("queued: says staged, gives the push and live times, and the marker", () => {
    const tip = { committedMs: NOW - MIN, subject: "staging(foo): x" };
    const body = stagingComment({ ...base, state: "queued", tip });
    expect(body.startsWith(COMMENT_MARKER)).toBe(true);
    expect(body).toContain("https://o.github.io/r/STAGING/my-branch/");
    expect(body).toContain("`0123456`");
    expect(body).toMatch(/staged/);
    const e = estimateLive(tip, NOW);
    expect(body).toContain(clock(e.pushAtMs));
    expect(body).toContain(clock(e.liveByMs));
    expect(body).toContain("#1956");
  });

  test("queued with an unreadable tip says it could not estimate — not a made-up time", () => {
    const body = stagingComment({ ...base, state: "queued" });
    expect(body).toContain("could not be estimated");
  });

  test("pushed: gives the push time and live-by time, never claims it is live", () => {
    const pushed = NOW + 3 * MIN;
    const body = stagingComment({ ...base, state: "pushed", pushedMs: pushed });
    expect(body).toContain(`pushed to \`gh-pages\` at ${clock(pushed)}`);
    expect(body).toContain(clock(pushed + LIVE_AFTER_PUSH_MS));
    expect(body).not.toMatch(/\bis live\b/);
  });
});

describe("reading the tip", () => {
  test("parses git's %ct<TAB>%s", () => {
    expect(parseTip("1759478400\tstaging(x): from y\n")).toEqual({
      committedMs: 1759478400_000,
      subject: "staging(x): from y",
    });
    expect(parseTip("")).toBeUndefined();
    expect(parseTip("abc\tx")).toBeUndefined();
  });

  function repo(subject: string, isoDate: string): string {
    const dir = mkdtempSync(join(tmpdir(), "gate-"));
    const env = { ...process.env, GIT_COMMITTER_DATE: isoDate, GIT_AUTHOR_DATE: isoDate };
    const g = (...a: string[]) => spawnSync("git", ["-C", dir, ...a], { env, encoding: "utf-8" });
    g("init", "-q");
    g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", subject);
    return dir;
  }

  test("reads a real checkout", () => {
    const dir = repo("docs(gh-pages): site from abc", "2026-10-03T07:55:00Z");
    expect(readTip(dir)).toEqual({ committedMs: Date.parse("2026-10-03T07:55:00Z"), subject: "docs(gh-pages): site from abc" });
  });

  test("CLI: an old tip opens (exit 0)", () => {
    const dir = repo("staging(a): from b", "2020-01-01T00:00:00Z");
    const r = spawnSync("bun", ["run", SCRIPT, "gate", "--dir", dir], { encoding: "utf-8" });
    expect(r.status).toBe(0);
  });

  test("CLI: an unreadable tip is exit 2, never open", () => {
    const dir = mkdtempSync(join(tmpdir(), "gate-empty-"));
    const r = spawnSync("bun", ["run", SCRIPT, "gate", "--dir", dir], { encoding: "utf-8" });
    expect(r.status).toBe(2);
  });

  test("CLI: a young tip past the deadline fails (exit 1) without sleeping", () => {
    const now = new Date().toISOString();
    const dir = repo("staging(a): from b", now);
    const queued = new Date(Date.now() - MAX_WAIT_MS - MIN).toISOString();
    const r = spawnSync("bun", ["run", SCRIPT, "gate", "--dir", dir, "--queued-at", queued], { encoding: "utf-8" });
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("NOT deployed");
    expect(EXIT_WAITED).toBe(75);
  });

  test("CLI comment writes the body from the environment", () => {
    const out = join(mkdtempSync(join(tmpdir(), "gate-c-")), "c.md");
    const r = spawnSync("bun", ["run", SCRIPT, "comment", "--state", "pushed", "--out", out, "--pushed-at", "2026-10-03T08:00:00Z"], {
      encoding: "utf-8",
      env: { ...process.env, GITHUB_REPOSITORY: "o/r", SLUG: "s", BRANCH: "b", SHA: "abcdef1234" },
    });
    expect(r.status).toBe(0);
    expect(readFileSync(out, "utf8")).toContain("pushed to `gh-pages` at 08:00 UTC");
  });
});

describe("the stage job waits at the gate before every push", () => {
  const YML = readFileSync(
    join(repoRootFor(resolve(import.meta.dir, "..", "..")), ".github", "workflows", "feature-staging.yml"),
    "utf-8",
  );
  const step = YML.slice(YML.indexOf("- name: Deploy the preview and log the render, in one commit"));
  const body = step.slice(0, step.indexOf("\n      - name:", 10));

  test("gate after the re-read, before the copy and the push; slept means re-read", () => {
    const reset = body.indexOf("git -C pages reset --hard FETCH_HEAD");
    const gate = body.indexOf("staging-push-gate.ts gate --dir pages");
    const copy = body.indexOf('cp -R _site/. "pages/STAGING/$STAGING_SLUG/"');
    const push = body.indexOf("git -C pages push origin gh-pages");
    expect([reset, gate, copy, push].every((i) => i > -1)).toBe(true);
    expect(gate).toBeGreaterThan(reset);
    expect(copy).toBeGreaterThan(gate);
    expect(push).toBeGreaterThan(copy);
    expect(body).toMatch(/if \[ "\$gate" = 75 \]; then continue; fi/);
  });

  test("a race lost to a moved tip goes back to the gate without spending an attempt", () => {
    expect(body).toMatch(/\[ "\$REMOTE" != "\$BASE" \][\s\S]*?continue/);
  });

  test("both PR comments are built by the tested function, not inline", () => {
    expect(YML).toContain("'--state', 'queued'");
    expect(YML).toContain("'--state', 'pushed'");
    expect(YML).not.toContain("## 🔍 Staging preview deployed");
  });

});
