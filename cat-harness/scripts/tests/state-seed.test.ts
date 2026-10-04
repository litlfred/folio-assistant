/**
 * `state:seed` — refresh a seeded state branch, and refuse the two states
 * where a refresh would destroy work.
 *
 * Bean `9ofm`. Against REAL git over a local bare repository used as the
 * remote, the same harness shape as `state-drift.test.ts` beside it and for
 * the same reason: this module is git plumbing, so a stub of git would assert
 * the stub. Nothing here reaches the network.
 *
 * The refusals are what the tests are FOR. A refresh copies a whole subtree
 * in one commit, so there is no diff left to read afterwards: if
 * `authoritative` or `retired` stopped being refused, the first sign would be
 * a cutover-day store overwritten with a stale copy of a directory `main` no
 * longer tracks. That is the one failure in this file that cannot be undone
 * by re-running anything.
 *
 * @module scripts/tests/state-seed
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { BranchStore, MANIFEST_SCHEMA } from "../branch-store.ts";
import { exitCode, refreshSeed, rowFor } from "../state-seed.ts";
import { driftOf } from "../state-drift.ts";

const made: string[] = [];
afterAll(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

function run(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf-8",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" },
  });
  expect(`${args.join(" ")} -> ${r.status}: ${r.stderr}`).toBe(`${args.join(" ")} -> 0: ${r.stderr}`);
  return r.stdout.trim();
}

/** A bare remote whose `main` holds `beans/defs/a.md`. */
function remote(): { url: string; storeDir: string; work: string } {
  const base = mkdtempSync(join(tmpdir(), "state-seed-"));
  made.push(base);
  const url = join(base, "remote.git");
  run(base, "init", "-q", "--bare", "-b", "main", url);
  const work = join(base, "work");
  run(base, "clone", "-q", url, work);
  mkdirSync(join(work, "beans", "defs"), { recursive: true });
  writeFileSync(join(work, "beans", "defs", "a.md"), "one\n");
  run(work, "add", "-A");
  run(work, "commit", "-qm", "main: beans");
  run(work, "push", "-q", "origin", "main");
  return { url, storeDir: join(base, "store.git"), work };
}

/** A seed branch of `beans/`, taken from a given ref of main's history. */
function seed(r: ReturnType<typeof remote>, branch: string, manifest: Record<string, unknown>, from = "main"): void {
  run(r.work, "checkout", "-q", "-B", "seedtmp", from);
  writeFileSync(join(r.work, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  run(r.work, "add", "-A");
  run(r.work, "commit", "-qm", `seed ${branch}`);
  run(r.work, "push", "-q", "origin", `seedtmp:refs/heads/${branch}`);
  run(r.work, "checkout", "-q", "main");
}

const SEED = {
  $schema: MANIFEST_SCHEMA,
  status: "seed",
  authoritative: false,
  subgraph: "beans",
  source: { ref: "main" },
  graphs: [{ path: "beans" }],
};

const row = (name = "cat/x/beans") => ({ id: "beans", shape: "branch" as const, name, legacy: [] as string[] });

function refresh(r: ReturnType<typeof remote>, opts: Record<string, unknown> = {}) {
  return refreshSeed(row(), { repoRoot: r.work, remote: r.url, storeDir: r.storeDir, log: () => {}, ...opts });
}

/** The branch's `manifest.json`, read back off the remote. */
function manifestOn(r: ReturnType<typeof remote>, name = "cat/x/beans"): Record<string, unknown> {
  const store = BranchStore.open(name, { repoRoot: r.work, remote: r.url, storeDir: r.storeDir, log: () => {} });
  const tip = store.fetchTip();
  expect(tip.state).toBe("ok");
  const tree = store.must(["rev-parse", `${tip.state === "ok" ? tip.tip : ""}^{tree}`]).trim();
  const e = store.lookup(tree, "manifest.json")!;
  store.ensureBlobs(tree, [e.sha]);
  return JSON.parse(store.blobText(e.sha)) as Record<string, unknown>;
}

describe("a seed that is already current", () => {
  test("is `current`, pushes nothing, and exits 0", () => {
    const r = remote();
    seed(r, "cat/x/beans", SEED);
    const res = refresh(r);
    expect(res.state).toBe("current");
    expect(exitCode(res)).toBe(0);
  });
});

describe("a drifted seed", () => {
  test("is refreshed to the source ref, verified by RE-READING the tip, and `state:drift` then agrees", () => {
    const r = remote();
    seed(r, "cat/x/beans", SEED);
    writeFileSync(join(r.work, "beans", "defs", "b.md"), "two\n");
    run(r.work, "add", "-A");
    run(r.work, "commit", "-qm", "main moves on");
    run(r.work, "push", "-q", "origin", "main");

    // Drifted before.
    expect(driftOf(row(), { repoRoot: r.work, remote: r.url, storeDir: r.storeDir })[0]!.state).toBe("drift");

    const res = refresh(r);
    expect(res.state).toBe("refreshed");
    if (res.state !== "refreshed") return;
    expect(res.verified).toBe(true);
    expect(res.graphs[0]!.files).toBe(2);
    expect(exitCode(res)).toBe(0);

    // The gate that demanded the refresh is the one that has to be satisfied
    // by it — asked of the real branch, not of the result object.
    expect(driftOf(row(), { repoRoot: r.work, remote: r.url, storeDir: r.storeDir })[0]!.state).toBe("in-sync");
    expect(typeof manifestOn(r).refreshedAt).toBe("string");
  });

  test("`--dry-run` reports what it WOULD push and pushes nothing", () => {
    const r = remote();
    seed(r, "cat/x/beans", SEED);
    writeFileSync(join(r.work, "beans", "defs", "b.md"), "two\n");
    run(r.work, "add", "-A");
    run(r.work, "commit", "-qm", "main moves on");
    run(r.work, "push", "-q", "origin", "main");

    const res = refresh(r, { dryRun: true });
    expect(res.state).toBe("refreshed");
    if (res.state !== "refreshed") return;
    expect(res.commit).toBeUndefined();
    // Still drifted: a dry run that moved the branch would be the worst of
    // both answers.
    expect(driftOf(row(), { repoRoot: r.work, remote: r.url, storeDir: r.storeDir })[0]!.state).toBe("drift");
  });
});

// The three that must never silently "work". Each is a different kind of
// wrong, so each is asserted on its own reason rather than on `refused` alone.
describe("what it refuses", () => {
  test("`authoritative: true` — the branch IS the store, so a refresh would overwrite live edits", () => {
    const r = remote();
    seed(r, "cat/x/beans", { ...SEED, status: "authoritative", authoritative: true });
    const res = refresh(r);
    expect(res.state).toBe("refused");
    expect(res.reason).toMatch(/IS the store/);
    expect(exitCode(res)).toBe(5);
  });

  test("`status: retired` — a superseded seed must not be made to look current", () => {
    const r = remote();
    seed(r, "cat/x/beans", { ...SEED, status: "retired" });
    const res = refresh(r);
    expect(res.state).toBe("refused");
    expect(res.reason).toMatch(/RETIRED/);
  });

  test("no root manifest — a stray branch is not a seed of anything", () => {
    const r = remote();
    run(r.work, "checkout", "-q", "-B", "nomanifest", "main");
    run(r.work, "push", "-q", "origin", "nomanifest:refs/heads/cat/x/beans");
    run(r.work, "checkout", "-q", "main");
    const res = refresh(r);
    expect(res.state).toBe("refused");
    expect(res.reason).toMatch(/not a seed of anything/);
  });

  test("a branch that is not there at all is `unknown`, never a pass", () => {
    const r = remote();
    const res = refresh(r);
    expect(res.state).toBe("unknown");
    expect(exitCode(res)).toBe(4);
  });
});

describe("the cutover's branch half", () => {
  test("`--authoritative` marks the branch the store, and the next refresh is REFUSED", () => {
    const r = remote();
    seed(r, "cat/x/beans", SEED);
    writeFileSync(join(r.work, "beans", "defs", "b.md"), "two\n");
    run(r.work, "add", "-A");
    run(r.work, "commit", "-qm", "main moves on");
    run(r.work, "push", "-q", "origin", "main");

    const res = refresh(r, { authoritative: true });
    expect(res.state).toBe("refreshed");
    if (res.state !== "refreshed") return;
    expect(res.verified).toBe(true);

    const m = manifestOn(r);
    expect(m.authoritative).toBe(true);
    expect(m.status).toBe("authoritative");
    expect(typeof m.authoritativeSince).toBe("string");
    // `state:drift` stops comparing it — there is no source ref to be current
    // with once the branch is the store.
    expect(driftOf(row(), { repoRoot: r.work, remote: r.url, storeDir: r.storeDir })[0]!.state).toBe("authoritative");
    // One-way: the command now refuses its own output.
    expect(refresh(r).state).toBe("refused");
  });
});

describe("the key it takes", () => {
  test("`rowFor` reads `special-branches.json`, so the live rows are the vocabulary", () => {
    expect(rowFor("beans")?.name).toBe("cat/cat-harness/beans");
    expect(rowFor("todos")?.name).toBe("cat/cat-harness/todos");
    expect(rowFor("no-such-row")).toBeUndefined();
  });

  test("a branch FAMILY is refused: a prefix is not a seed", () => {
    // Built inline: the special-branches table this used to read is retired (bean rva2).
    const fam = { id: "lake-cache", shape: "family", name: "cat/folio-assistant-sci/lake-cache/", legacy: [] };
    const res = refreshSeed(fam, { log: () => {} });
    expect(res.state).toBe("refused");
    expect(res.reason).toMatch(/branch FAMILY/);
  });
});
