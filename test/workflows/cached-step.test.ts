/**
 * The `cached-step` composite action (`.github/actions/cached-step`): the one
 * cache primitive. Runs its `cached-step.sh` as the action does, with the
 * action's environment, so what is asserted is the script that ships. Most
 * cases are ones that must NOT hit or NOT save: a hit that should not be one,
 * or a PR saving where main reads, is the defect this can add.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const ROOT = resolve(import.meta.dir, "..", "..");
const DIR = join(ROOT, ".github", "actions", "cached-step");
const SH = join(DIR, "cached-step.sh");

function run(sub: string, env: Record<string, string>) {
  const tmp = mkdtempSync(join(tmpdir(), "cached-step-"));
  const output = join(tmp, "output");
  const summary = join(tmp, "summary");
  writeFileSync(output, "");
  const r = spawnSync("bash", [SH, sub], {
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "", HOME: tmp, RUNNER_TEMP: tmp, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary, GITHUB_RUN_ID: "42", GITHUB_JOB: "j", ...env },
  });
  const outs: Record<string, string> = {};
  const lines = readFileSync(output, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const heredoc = /^([\w-]+)<<(\S+)$/.exec(lines[i]);
    if (heredoc) {
      const body: string[] = [];
      for (i++; i < lines.length && lines[i] !== heredoc[2]; i++) body.push(lines[i]);
      outs[heredoc[1]] = body.join("\n");
    } else {
      const m = /^([\w-]+)=(.*)$/.exec(lines[i]);
      if (m) outs[m[1]] = m[2];
    }
  }
  return { code: r.status, outs, tmp, stderr: r.stderr, summary: existsSync(summary) ? readFileSync(summary, "utf8") : "" };
}

describe("key", () => {
  const base = { STEP: "qa-copy", TRUST: "main-only", PHASE: "restore", PATHS: "build/x" };
  test("namespaces a digest key", () => {
    const r = run("key", { ...base, KEY: "a".repeat(64) });
    expect(r.code).toBe(0);
    expect(r.outs.determined).toBe("true");
    expect(r.outs.key).toBe(`cs1-qa-copy-${"a".repeat(64)}`);
    expect(r.outs.prefix).toBe("cs1-qa-copy-");
  });
  test("hashes a key that is not a digest rather than trimming it", () => {
    const r = run("key", { ...base, KEY: "tree abc / bun 1.4.4" });
    expect(r.outs.key).toMatch(/^cs1-qa-copy-[0-9a-f]{64}$/);
  });
  test("an empty or undetermined key is undetermined", () => {
    expect(run("key", { ...base, KEY: "" }).outs.determined).toBe("false");
    const r = run("key", { ...base, KEY: "undetermined: no input declaration" });
    expect(r.outs.determined).toBe("false");
    expect(r.outs.why).toContain("no input declaration");
  });
  test("refuses a bad step id, an unknown trust, an exact step with no verify", () => {
    expect(run("key", { ...base, KEY: "k", STEP: "Bad Step" }).code).toBe(2);
    expect(run("key", { ...base, KEY: "k", TRUST: "trusted" }).code).toBe(2);
    expect(run("key", { ...base, KEY: "k", TRUST: "exact" }).code).toBe(2);
    expect(run("key", { ...base, KEY: "k", TRUST: "exact", PHASE: "save" }).code).toBe(0);
  });
  test("a verdict caches no paths: its record is the output", () => {
    expect(run("key", { ...base, KEY: "k", TRUST: "verdict" }).code).toBe(2);
    const r = run("key", { ...base, KEY: "k", TRUST: "verdict", PATHS: "" });
    expect(r.outs.paths).toEndWith("cached-step-verdict/qa-copy");
  });
});

describe("decide", () => {
  const base = { STEP: "s", KEY: "cs1-s-k", DETERMINED: "true", PATHS: "", VERIFY: "" };
  test("undetermined is a miss, whatever was restored", () => {
    const r = run("decide", { ...base, TRUST: "main-only", DETERMINED: "false", EXACT_HIT: "true" });
    expect(r.outs.hit).toBe("false");
    expect(r.outs.result).toBe("miss");
  });
  test("exact: a restore that fails verify is removed and missed", () => {
    const tmp = mkdtempSync(join(tmpdir(), "cs-out-"));
    const out = join(tmp, "out");
    mkdirSync(out);
    writeFileSync(join(out, "f"), "bad");
    const r = run("decide", { ...base, TRUST: "exact", PATHS: out, VERIFY: `grep -q good ${out}/f`, EXACT_HIT: "true" });
    expect(r.outs.hit).toBe("false");
    expect(r.outs.why).toContain("FAILED");
    expect(existsSync(out)).toBe(false);
  });
  test("exact: a verified restore hits", () => {
    const r = run("decide", { ...base, TRUST: "exact", PATHS: "/nonexistent", VERIFY: "true", EXACT_HIT: "true" });
    expect(r.outs.hit).toBe("true");
    expect(r.summary).toContain("cached-step `s`: hit");
  });
  test("a prefix restore is a warm start, never a hit", () => {
    const r = run("decide", { ...base, TRUST: "exact", PATHS: "x", VERIFY: "true", MATCHED: "cs1-s-old" });
    expect(r.outs.hit).toBe("false");
    expect(r.outs.result).toBe("warm");
  });
  test("verdict: a restored record reports SKIPPED, not passed; no record is a miss", () => {
    const none = run("decide", { ...base, TRUST: "verdict", EXACT_HIT: "true" });
    expect(none.outs.hit).toBe("false");
    const tmp = mkdtempSync(join(tmpdir(), "cs-v-"));
    mkdirSync(join(tmp, "cached-step-verdict", "s"), { recursive: true });
    writeFileSync(join(tmp, "cached-step-verdict", "s", "record.txt"), "summary: verdict recorded green by run 7\n");
    const r = spawnSync("bash", [SH, "decide"], { encoding: "utf8", env: { PATH: process.env.PATH ?? "", RUNNER_TEMP: tmp, ...base, TRUST: "verdict", EXACT_HIT: "true" } });
    expect(r.stdout).toContain("hit=true");
    expect(r.stdout).toContain("SKIPPED, not passed: verdict recorded green by run 7");
  });
  test("writes a record whose NAME carries step and result, for the report", () => {
    const r = run("decide", { ...base, TRUST: "main-only", PATHS: "x" });
    expect(r.outs.record).toMatch(/^cached-step--s--miss--42-0-j-\d+$/);
    expect(readdirSync(join(r.tmp, "cached-step"))).toEqual([`${r.outs.record}.txt`]);
  });
});

describe("policy", () => {
  const base = { STEP: "s", KEY: "cs1-s-k", DETERMINED: "true", PATHS: "x" };
  const main = { GITHUB_REF: "refs/heads/main", GITHUB_EVENT_NAME: "push" };
  const pr = { GITHUB_REF: "refs/pull/9/merge", GITHUB_EVENT_NAME: "pull_request" };
  test("main saves every trust", () => {
    for (const TRUST of ["exact", "verdict", "main-only"]) expect(run("policy", { ...base, ...main, TRUST }).outs.save).toBe("true");
  });
  test("a PR never saves main-only, and its exact/verdict saves are its own ref's", () => {
    expect(run("policy", { ...base, ...pr, TRUST: "main-only" }).outs.save).toBe("false");
    const r = run("policy", { ...base, ...pr, TRUST: "exact" });
    expect(r.outs.save).toBe("true");
    expect(r.outs.why).toContain("only its own re-runs");
  });
  test("pull_request_target never saves, even when its ref is main", () => {
    expect(run("policy", { ...base, GITHUB_REF: "refs/heads/main", GITHUB_EVENT_NAME: "pull_request_target", TRUST: "exact" }).outs.save).toBe("false");
  });
  test("undetermined is never saved, even on main", () => {
    expect(run("policy", { ...base, ...main, TRUST: "exact", DETERMINED: "false" }).outs.save).toBe("false");
  });
  test("a verdict save writes the record that a later restore reports", () => {
    const r = run("policy", { ...base, ...main, TRUST: "verdict", GITHUB_SHA: "abc" });
    expect(readFileSync(join(r.tmp, "cached-step-verdict", "s", "record.txt"), "utf8")).toContain("recorded green by run 42");
  });
});

describe("action.yml", () => {
  const action = parse(readFileSync(join(DIR, "action.yml"), "utf8")) as { runs: { steps: Array<{ uses?: string; with?: Record<string, string> }> } };
  test("every third-party action is pinned to a full commit sha", () => {
    for (const s of action.runs.steps) if (s.uses) expect(s.uses).toMatch(/@[0-9a-f]{40}$/);
  });
  test("restores by prefix only for exact", () => {
    const restore = action.runs.steps.find((s) => s.uses?.startsWith("actions/cache/restore"));
    expect(restore?.with?.["restore-keys"]).toContain("inputs.trust == 'exact'");
  });
});

describe("committer-published entries (cache:publish → fetch-ref)", () => {
  // The entry is laid out as `cache:publish` (cat-harness-tools scripts/cache-key.ts) writes it:
  // ws/<checkout path>, home/<path under $HOME>. Built with plain git here, so this test does
  // not depend on the cat-harness-tools pin.
  test("an entry pushed to refs/cache/<key> is put back in the workspace and under $HOME", () => {
    const base = mkdtempSync(join(tmpdir(), "cs-pub-"));
    const origin = join(base, "origin.git");
    const work = join(base, "work");
    const ci = join(base, "ci");
    const g = (cwd: string, ...a: string[]) => spawnSync("git", a, { cwd, encoding: "utf8" });
    g(base, "init", "-q", "--bare", origin);
    g(base, "init", "-q", work);
    g(work, "remote", "add", "origin", origin);
    mkdirSync(join(work, "ws", "out"), { recursive: true });
    writeFileSync(join(work, "ws", "out", "f.txt"), "built");
    mkdirSync(join(work, "home", ".cache"), { recursive: true });
    writeFileSync(join(work, "home", ".cache", "m"), "mounted");
    g(work, "add", "-A");
    const tree = g(work, "write-tree").stdout.trim();
    const commit = spawnSync("git", ["commit-tree", tree, "-m", "entry"], { cwd: work, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } }).stdout.trim();
    expect(g(work, "push", "-q", "origin", `${commit}:refs/cache/cs1-demo-k1`).status).toBe(0);
    g(base, "clone", "-q", origin, ci);
    const home = join(base, "home");
    mkdirSync(home);
    const fetched = spawnSync("bash", [SH, "fetch-ref"], {
      cwd: ci,
      encoding: "utf8",
      env: { PATH: process.env.PATH ?? "", HOME: home, RUNNER_TEMP: base, GITHUB_WORKSPACE: ci, STEP: "demo", KEY: "cs1-demo-k1" },
    });
    expect(fetched.stdout).toContain("hit=true");
    expect(readFileSync(join(ci, "out", "f.txt"), "utf8")).toBe("built");
    expect(readFileSync(join(home, ".cache", "m"), "utf8")).toBe("mounted");
  });
  test("no entry under the key is no hit", () => {
    const base = mkdtempSync(join(tmpdir(), "cs-pub-"));
    spawnSync("git", ["init", "-q", "--bare", join(base, "o.git")]);
    spawnSync("git", ["clone", "-q", join(base, "o.git"), join(base, "c")]);
    const r = spawnSync("bash", [SH, "fetch-ref"], { cwd: join(base, "c"), encoding: "utf8", env: { PATH: process.env.PATH ?? "", HOME: base, RUNNER_TEMP: base, STEP: "demo", KEY: "cs1-demo-none" } });
    expect(r.stdout).toContain("hit=false");
  });
});

