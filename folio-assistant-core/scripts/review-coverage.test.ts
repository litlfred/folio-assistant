/**
 * The `folio-review-coverage` Tool (bean px0t): the computation as a pure
 * function, then the command, offline, including the feature-branch refusal.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { buildReviewComments } from "./review-comments";
import { buildCoverage } from "./review-coverage";

const SCRIPT = resolve(import.meta.dir, "review-coverage.ts");
const pc = (id: number, body: string) => ({ id, body, user: "sme1", createdAt: "2026-09-23T07:00:00Z", url: `https://github.com/o/r/pull/7#issuecomment-${id}` });
const blocks = { "prose:a": { hash: "ha", renamedFrom: [] }, "prose:b": { hash: "hb", renamedFrom: [] } };
const changeset = { changes: [{ change: "changed", label: "prose:a" }, { change: "added", label: "prose:b" }] };
const rc = buildReviewComments({
  repo: "o/r",
  pr: 7,
  commit: "c1",
  blocks,
  now: "2026-09-23T08:00:00Z",
  comments: [pc(1, "block: prose:a\nverdict: ok"), pc(2, "block: prose:b\nkind: defect\n\nWrong.")],
});

describe("buildCoverage", () => {
  it("gives the gate's facts: one block unread, one defect open", () => {
    const f = buildCoverage({ changeset, blocks, reviewComments: rc });
    expect(f.facts).toEqual({ uncoveredBlocks: 1, openDefects: 1 });
    expect(f.uncovered).toEqual(["prose:b"]);
  });

  it("an edit after the verdict reopens that block", () => {
    const f = buildCoverage({ changeset, blocks: { ...blocks, "prose:a": { hash: "ha2", renamedFrom: [] } }, reviewComments: rc });
    expect(f.uncovered).toEqual(["prose:a", "prose:b"]);
    expect(f.stale).toHaveLength(1);
  });
});

describe("the command", () => {
  let dir = "";
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  const setup = () => {
    dir = mkdtempSync(join(tmpdir(), "coverage-"));
    const git = (...a: string[]) => execFileSync("git", a, { cwd: dir, stdio: "pipe" });
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@example.org");
    git("config", "user.name", "t");
    mkdirSync(join(dir, "todos", "verdicts"), { recursive: true });
    writeFileSync(join(dir, "todos", "todos.json"), JSON.stringify({ name: "t", directories: [{ id: "verdicts", path: "verdicts", graphKinds: ["review-verdicts"] }] }));
    writeFileSync(join(dir, "changeset.json"), JSON.stringify(changeset));
    writeFileSync(join(dir, "blocks.json"), JSON.stringify(blocks));
    writeFileSync(join(dir, "review-comments.json"), JSON.stringify(rc));
    git("add", "-A");
    git("commit", "-qm", "init");
    return git;
  };
  const run = (...extra: string[]) =>
    spawnSync("bun", ["run", SCRIPT, "--changeset", "changeset.json", "--blocks", "blocks.json", "--comments", "review-comments.json", "--todos", "todos", ...extra], { cwd: dir, encoding: "utf-8" });

  it("prints only the facts on stdout", () => {
    setup();
    const r = run();
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual({ uncoveredBlocks: 1, openDefects: 1 });
  });

  it("refuses to commit verdicts on the base branch, and writes nothing", () => {
    setup();
    const r = run("--commit");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("FEATURE branch");
    expect(readdirSync(join(dir, "todos", "verdicts"))).toEqual([]);
  });

  it("commits them on a feature branch, and a second run finds nothing new", () => {
    const git = setup();
    git("switch", "-qc", "review/x");
    expect(run("--commit").status).toBe(0);
    expect(existsSync(join(dir, "todos", "verdicts", "verdict-pr7-c1-prose_a.json"))).toBe(true);
    expect(String(git("log", "--oneline")).split("\n").filter(Boolean)).toHaveLength(2);
    expect(run("--commit").stderr).toContain("nothing new to commit");
  });
});
