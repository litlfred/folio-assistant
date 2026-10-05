/**
 * `witness:parity`: the comparison, the environment check, and the three
 * verdicts end to end against a throwaway git repository whose "producers" are
 * one-line shell commands, so the test needs git and bash but no Python stack.
 */
import { describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripEphemeral } from "../../../cat-harness/schemas/computation-witness.ts";
import { checkParity, diffPaths, environmentMismatch } from "../witness-parity.ts";

describe("stripEphemeral", () => {
  it("removes run-specific fields at every depth and keeps the rest", () => {
    const w = { computedAt: "t", data: { x: 1, elapsed_s: 2, rows: [{ durationMs: 3, y: 4 }] }, environment: { a: "1" } };
    expect(stripEphemeral(w)).toEqual({ data: { x: 1, rows: [{ y: 4 }] } });
  });
  it("masks extra keys on request", () => {
    expect(stripEphemeral({ a: 1, b: 2 }, new Set(["b"]))).toEqual({ a: 1 });
  });
});

describe("diffPaths", () => {
  it("ignores key order and names each differing path", () => {
    expect(diffPaths({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 })).toEqual([]);
    expect(diffPaths({ a: 1, b: [1, 2] }, { a: 2, b: [1, 3], c: 0 })).toEqual(["$.a", "$.b[1]", "$.c (added)"]);
    expect(diffPaths([1], [1, 2])).toEqual(["$ (length 1 → 2)"]);
  });
});

describe("environmentMismatch", () => {
  const installed = (names: string[]) =>
    Object.fromEntries(names.map((n) => [n, n === "mpmath" ? "1.3.0" : n === "python" ? "3.11.15" : null]));
  it("reports a missing or different package, and skips build fingerprints", () => {
    const env = { python: "3.11.15", mpmath: "1.3.0", pyhecke_native: "0.9.0", pyhecke_native_build: "abc" };
    expect(environmentMismatch(env, installed)).toEqual([{ key: "pyhecke_native", recorded: "0.9.0", installed: null }]);
  });
  it("treats a witness with no environment as matching", () => {
    expect(environmentMismatch(undefined, installed)).toEqual([]);
  });
});

describe("checkParity", () => {
  /** A repo whose producer writes `out` to `computations/w.witness.json`. */
  function repo(witness: object, producerOut: string) {
    const root = mkdtempSync(join(tmpdir(), "witness-parity-"));
    const g = (...a: string[]) => spawnSync("git", a, { cwd: root, encoding: "utf8" });
    g("init", "-q");
    g("config", "user.email", "t@t");
    g("config", "user.name", "t");
    mkdirSync(join(root, "computations"));
    writeFileSync(join(root, "computations", "w.witness.json"), JSON.stringify(witness));
    writeFileSync(join(root, "computations", "out.json"), producerOut);
    g("add", "-A");
    g("commit", "-qm", "init");
    return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
  }
  const base = { scriptFile: "computations/p.py", data: { x: 1 } };
  const run = (cmd: string) => ({ ...base, invocation: { reproduce: cmd } });

  it("passes when the producer rewrites the same witness, run-specific fields aside", () => {
    const w = run("cp computations/out.json computations/w.witness.json");
    const t = repo({ ...w, computedAt: "old" }, JSON.stringify({ ...w, computedAt: "new", durationMs: 9 }));
    try {
      const r = checkParity(t.root, "computations/w.witness.json");
      expect(r.verdict).toBe("pass");
    } finally {
      t.cleanup();
    }
  });

  it("fails, naming the path, when the producer writes a different value", () => {
    const w = run("cp computations/out.json computations/w.witness.json");
    const t = repo(w, JSON.stringify({ ...w, data: { x: 2 } }));
    try {
      const r = checkParity(t.root, "computations/w.witness.json");
      expect(r.verdict).toBe("fail");
      expect(r.diff).toEqual(["$.data.x"]);
    } finally {
      t.cleanup();
    }
  });

  it("is unknown, not fail, when the producer exits non-zero", () => {
    const w = run("echo 'refusing: precision floor not met'; exit 3");
    const t = repo(w, "{}");
    try {
      const r = checkParity(t.root, "computations/w.witness.json");
      expect(r.verdict).toBe("unknown");
      expect(r.reason).toContain("exited 3");
      expect(r.reason).toContain("precision floor");
    } finally {
      t.cleanup();
    }
  });

  it("is unknown on an environment mismatch, and does not run the producer", () => {
    const w = { ...run("touch ran-anyway"), environment: { surely_not_installed_pkg: "9.9.9" } };
    const t = repo(w, "{}");
    try {
      const r = checkParity(t.root, "computations/w.witness.json");
      expect(r.verdict).toBe("unknown");
      expect(r.envMismatch?.[0]?.key).toBe("surely_not_installed_pkg");
    } finally {
      t.cleanup();
    }
  });

  it("leaves the folio's own checkout untouched", () => {
    const w = run("echo changed > computations/w.witness.json");
    const t = repo(w, "{}");
    try {
      const before = readFileSync(join(t.root, "computations", "w.witness.json"), "utf8");
      checkParity(t.root, "computations/w.witness.json");
      expect(readFileSync(join(t.root, "computations", "w.witness.json"), "utf8")).toBe(before);
      const st = spawnSync("git", ["status", "--porcelain"], { cwd: t.root, encoding: "utf8" });
      expect(st.stdout).toBe("");
      const wl = spawnSync("git", ["worktree", "list"], { cwd: t.root, encoding: "utf8" });
      expect(wl.stdout.trim().split("\n")).toHaveLength(1);
    } finally {
      t.cleanup();
    }
  });
});
