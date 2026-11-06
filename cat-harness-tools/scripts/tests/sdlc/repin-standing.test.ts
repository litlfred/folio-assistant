/**
 * Standing consent (issue #401): the coverage decision, green-commit
 * selection behind a STUBBED GitHub API, and the config + lock rewrite
 * through the mount:remote write paths, against fixture repositories served
 * over `file://` like `remote-mount-gaps.test.ts`.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import type { StandingConsent } from "../../../schemas/kg/mount-trust.js";
import type { RemoteMount } from "../../../schemas/kg/remote-mount.js";
import { applyRepin, candidateFor, planRepin, summaryOf, verdictOf, type CommitVerdict, type GitHubApi } from "../../repin-standing.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);
const D = "d".repeat(40);

/** A stub API: commits per `repo@branch`, newest first, and a verdict per sha. Records every call. */
function stubApi(commits: Record<string, string[]>, verdicts: Record<string, CommitVerdict> = {}): GitHubApi & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async branchCommits(repository, branch, limit) {
      calls.push(`commits ${repository}@${branch} ${limit}`);
      const xs = commits[`${repository}@${branch}`];
      if (!xs) throw new Error(`no branch ${branch}`);
      return xs.slice(0, limit);
    },
    async commitVerdict(repository, sha) {
      calls.push(`verdict ${repository} ${sha.slice(0, 1)}`);
      return verdicts[sha] ?? "none";
    },
  };
}

const rule = (extra: Partial<StandingConsent> = {}): StandingConsent => ({ follows: "main", consentBy: "litlfred", consentAt: "2026-10-16", require: "green", ...extra });
const mount = (harness: string, ref: string, standing?: StandingConsent): RemoteMount =>
  ({ harness, repository: `o/${harness}`, ref, trust: { consent: { by: "litlfred", on: "2026-10-15", ref, evidence: "fixture" }, ...(standing ? { standing } : {}) } }) as RemoteMount;

describe("verdictOf: green only when something checked the commit and all of it passed", () => {
  test("nothing reported is `none`, never green", () => {
    expect(verdictOf({ state: "pending", total_count: 0 }, [])).toBe("none");
    expect(verdictOf(undefined, [])).toBe("none");
  });
  test("statuses and check runs both count", () => {
    expect(verdictOf({ state: "success", total_count: 2 }, [{ status: "completed", conclusion: "success" }])).toBe("green");
    expect(verdictOf({ state: "pending", total_count: 0 }, [{ status: "completed", conclusion: "skipped" }, { status: "completed", conclusion: "success" }])).toBe("green");
    expect(verdictOf({ state: "success", total_count: 1 }, [{ status: "in_progress", conclusion: null }])).toBe("pending");
    expect(verdictOf({ state: "pending", total_count: 1 }, [])).toBe("pending");
    expect(verdictOf({ state: "success", total_count: 1 }, [{ status: "completed", conclusion: "failure" }])).toBe("red");
    expect(verdictOf({ state: "failure", total_count: 1 }, [{ status: "completed", conclusion: "success" }])).toBe("red");
    expect(verdictOf({ state: "pending", total_count: 0 }, [{ status: "completed", conclusion: "cancelled" }])).toBe("red");
  });
});

describe("candidateFor: the followed branch's newest (green) commit, through the stub", () => {
  test("require green: passes over newer pending and red commits to the newest green", async () => {
    const api = stubApi({ "o/x@main": [D, C, B, A] }, { [D]: "pending", [C]: "red", [B]: "green", [A]: "green" });
    const r = await candidateFor(api, "o/x", rule());
    expect(r.candidate).toEqual({ branch: "main", sha: B, verdict: "green" });
    expect(r.looked.map((l) => l.verdict)).toEqual(["pending", "red", "green"]);
    expect(api.calls).not.toContain("verdict o/x a");
  });
  test("require green and nothing green within depth: no candidate", async () => {
    const api = stubApi({ "o/x@main": [D, C, B] }, { [D]: "pending", [C]: "none", [B]: "green" });
    expect((await candidateFor(api, "o/x", rule(), 2)).candidate).toBeUndefined();
  });
  test("no require: the branch head, with no verdict asked", async () => {
    const api = stubApi({ "o/x@dev": [D, C] });
    expect((await candidateFor(api, "o/x", rule({ follows: "dev", require: undefined }))).candidate).toEqual({ branch: "dev", sha: D });
    expect(api.calls.some((c) => c.startsWith("verdict"))).toBe(false);
  });
});

describe("planRepin: the coverage decision, per instance", () => {
  test("a standing rule moves its pin; an instance with no rule is never touched or even asked about", async () => {
    const api = stubApi({ "o/x@main": [C, B] }, { [C]: "green" });
    const plan = await planRepin([mount("x", A, rule()), mount("y", A)], api);
    expect(plan.moves.map((m) => [m.harness, m.from, m.to])).toEqual([["x", A, C]]);
    expect(plan.held).toEqual([]);
    expect(api.calls.some((c) => c.includes("o/y"))).toBe(false);
  });
  test("already at the newest green: held, not moved", async () => {
    const plan = await planRepin([mount("x", C, rule())], stubApi({ "o/x@main": [D, C] }, { [D]: "red", [C]: "green" }));
    expect(plan.moves).toEqual([]);
    expect(plan.held[0]!.reason).toContain("already pinned");
  });
  test("nothing green: held with the reason", async () => {
    const plan = await planRepin([mount("x", A, rule())], stubApi({ "o/x@main": [D] }, { [D]: "pending" }));
    expect(plan.moves).toEqual([]);
    expect(plan.held[0]!.reason).toContain("green");
  });
  test("an API failure is could-not-determine, never 'nothing to move'", async () => {
    const plan = await planRepin([mount("x", A, rule({ follows: "gone" }))], stubApi({}));
    expect(plan.unknown.map((u) => u.harness)).toEqual(["x"]);
    expect(summaryOf(plan, true)).toContain("Could not determine");
  });
  test("the summary names who consented, under which rule", async () => {
    const plan = await planRepin([mount("x", A, rule())], stubApi({ "o/x@main": [C] }, { [C]: "green" }));
    const s = summaryOf(plan, false);
    expect(s).toContain("| x | o/x |");
    expect(s).toContain("litlfred (standing, 2026-10-16)");
  });
});

// ── The rewrite, over fixture repositories ──────────────────────────────────

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", args, { cwd, encoding: "utf-8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}
function write(root: string, files: Record<string, string | object>): void {
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), typeof body === "string" ? body : JSON.stringify(body, null, 2));
  }
}

let base: string;
let up: { bare: string; first: string; second: string };
let other: { bare: string; sha: string };
let urlFor: (r: string) => string;

beforeAll(() => {
  base = mkdtempSync(join(tmpdir(), "repin-standing-"));
  const mk = (name: string, commits: Array<Record<string, string | object>>): { bare: string; shas: string[] } => {
    const work = join(base, `${name}-work`);
    mkdirSync(work, { recursive: true });
    git(work, "init", "-q", "-b", "main");
    const shas: string[] = [];
    for (const files of commits) {
      write(work, files);
      git(work, "add", "-A", "-f");
      git(work, "commit", "-q", "-m", "fixture");
      shas.push(git(work, "rev-parse", "HEAD"));
    }
    const bare = join(base, `${name}.git`);
    git(base, "clone", "-q", "--bare", work, bare);
    git(bare, "config", "uploadpack.allowFilter", "true");
    git(bare, "config", "uploadpack.allowAnySHA1InWant", "true");
    return { bare, shas };
  };
  const u = mk("up", [{ "up.json": { name: "up", directories: [] }, "v.txt": "1\n" }, { "v.txt": "2\n" }]);
  up = { bare: u.bare, first: u.shas[0]!, second: u.shas[1]! };
  const o = mk("other", [{ "other.json": { name: "other", directories: [] } }]);
  other = { bare: o.bare, sha: o.shas[0]! };
  const map: Record<string, string> = { "o/up": `file://${up.bare}`, "o/other": `file://${other.bare}` };
  urlFor = (r) => map[r] ?? (() => { throw new Error(`no fixture for ${r}`); })();
});
afterAll(() => rmSync(base, { recursive: true, force: true }));

function site(): string {
  const root = mkdtempSync(join(base, "site-"));
  git(root, "init", "-q", "-b", "main");
  const consent = (ref: string) => ({ by: "test", on: "2026-10-15", ref, evidence: "fixture" });
  write(root, {
    "down.json": { name: "down", directories: [], mountApprovers: ["test"] },
    "index.config.json": {
      $schema: "folio-index-config/v1",
      instances: [
        { name: "down", source: { local: { at: "." } } },
        { name: "up", source: { remote: { repository: "o/up", ref: up.first, overrides: { up: { whole: true } }, trust: { consent: consent(up.first), standing: { follows: "main", consentBy: "test", consentAt: "2026-10-16", require: "green" } } } } },
        { name: "other", source: { remote: { repository: "o/other", ref: other.sha, overrides: { other: { whole: true } }, trust: { consent: consent(other.sha) } } } },
      ],
    },
  });
  return root;
}

describe("applyRepin: index.config.json and index.lock.json move through the mount:remote write paths", () => {
  test("the covered pin moves with a consent by the rule's person; the other entry is untouched; the lock follows", async () => {
    const root = site();
    const rm = await import("../../remote-mount.ts");
    expect(rm.mountRemote({ instanceRoot: root, urlFor, install: false }).plan.outcomes.every((o) => o.state === "mounted")).toBe(true);
    const otherBefore = JSON.parse(readFileSync(join(root, "index.config.json"), "utf-8")).instances.find((i: { name: string }) => i.name === "other");

    const { readDeclaredMounts } = await import("../../../schemas/kg/index-config.js");
    const plan = await planRepin(readDeclaredMounts(root).mounts, stubApi({ "o/up@main": [up.second, up.first] }, { [up.second]: "green", [up.first]: "green" }));
    expect(plan.moves.map((m) => [m.harness, m.to])).toEqual([["up", up.second]]);
    const r = await applyRepin(root, plan, { on: "2026-10-17", urlFor, install: false });
    expect(r.exit).toBe(0);
    expect(r.mountState).toBe("mounted");

    const cfg = JSON.parse(readFileSync(join(root, "index.config.json"), "utf-8"));
    const upEntry = cfg.instances.find((i: { name: string }) => i.name === "up").source.remote;
    expect(upEntry.ref).toBe(up.second);
    expect(upEntry.overrides).toEqual({ up: { whole: true } });
    expect(upEntry.trust.consent).toMatchObject({ by: "test", on: "2026-10-17", ref: up.second, standing: { follows: "main", consentAt: "2026-10-16", require: "green" } });
    expect(upEntry.trust.standing).toEqual({ follows: "main", consentBy: "test", consentAt: "2026-10-16", require: "green" });
    expect(cfg.instances.find((i: { name: string }) => i.name === "other")).toEqual(otherBefore);

    const lock = JSON.parse(readFileSync(join(root, "index.lock.json"), "utf-8"));
    expect(lock.mounts.find((m: { harness: string }) => m.harness === "up").ref).toBe(up.second);
    const inst = lock.instances.find((i: { instance: string }) => i.instance === "up");
    expect(inst.sha).toBe(up.second);
    expect(inst.trust).toMatchObject({ basis: "consent", by: "test", ref: up.second, approver: "declared", standing: { follows: "main" } });
    expect(readFileSync(join(root, "up/v.txt"), "utf-8")).toBe("2\n");
    expect(rm.checkRemote({ instanceRoot: root }).state).toBe("mounted");
  });

  test("withdrawing the rule afterwards makes the check refuse the pin it moved (it asks again)", async () => {
    const root = site();
    const { readDeclaredMounts } = await import("../../../schemas/kg/index-config.js");
    const plan = await planRepin(readDeclaredMounts(root).mounts, stubApi({ "o/up@main": [up.second] }, { [up.second]: "green" }));
    await applyRepin(root, plan, { urlFor, install: false });
    const f = join(root, "index.config.json");
    const cfg = JSON.parse(readFileSync(f, "utf-8"));
    delete cfg.instances.find((i: { name: string }) => i.name === "up").source.remote.trust.standing;
    writeFileSync(f, JSON.stringify(cfg, null, 2));
    const rm = await import("../../remote-mount.ts");
    const c = rm.checkRemote({ instanceRoot: root });
    expect(c.outcomes.find((o) => o.instance === "up")?.state).toBe("refused");
  });

  test("dry run: nothing moved means nothing written", async () => {
    const root = site();
    const before = readFileSync(join(root, "index.config.json"), "utf-8");
    expect(await applyRepin(root, { moves: [], held: [], unknown: [] })).toEqual({ exit: 0 });
    expect(readFileSync(join(root, "index.config.json"), "utf-8")).toBe(before);
  });
});
