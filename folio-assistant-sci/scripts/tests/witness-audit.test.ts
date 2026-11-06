/**
 * Unit tests for `scripts/witness-audit.ts` — Lean `.witness` and Python `.witness.json`
 * staleness detection, legacy format detection, and `runAudit` options.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  auditLeanWitnesses,
  auditPythonWitnesses,
  fileContentHash,
  gitFileShas,
  runAudit,
} from "../witness-audit.ts";

describe("witness-audit", () => {
  test("audits Lean witnesses: fresh, stale hash, malformed JSON, and pending files", () => {
    const root = mkdtempSync(join(tmpdir(), "witness-audit-lean-"));
    try {
      const chDir = join(root, "folio", "ch1");
      mkdirSync(chDir, { recursive: true });

      // 1. Fresh Lean file + matching witness
      const freshLean = join(chDir, "Fresh.lean");
      writeFileSync(freshLean, "theorem fresh_thm : 1 + 1 = 2 := rfl\n");
      const freshHash = fileContentHash(freshLean);
      writeFileSync(
        `${freshLean}.${freshHash}.witness`,
        JSON.stringify({ commitSha: "abc123456789" }),
      );

      // 2. Stale Lean file (witness has older hash)
      const staleLean = join(chDir, "Stale.lean");
      writeFileSync(staleLean, "theorem stale_thm : 2 + 2 = 4 := rfl\n");
      writeFileSync(
        `${staleLean}.000000000000.witness`,
        JSON.stringify({ commitSha: "abc123456789" }),
      );

      // 3. Malformed Lean witness
      const malformedLean = join(chDir, "Malformed.lean");
      writeFileSync(malformedLean, "theorem bad_thm : True := trivial\n");
      const malformedHash = fileContentHash(malformedLean);
      writeFileSync(`${malformedLean}.${malformedHash}.witness`, "{ not valid json");

      // 4. Pending Lean file (no witness file)
      const pendingLean = join(chDir, "Pending.lean");
      writeFileSync(pendingLean, "theorem pending_thm : True := trivial\n");

      const entries = auditLeanWitnesses(root);
      expect(entries).toHaveLength(3);

      const byFile = new Map(entries.map((e) => [e.file, e]));
      expect(byFile.get("folio/ch1/Fresh.lean")?.stale).toBe(false);
      expect(byFile.get("folio/ch1/Fresh.lean")?.hasCommitSha).toBe(true);

      expect(byFile.get("folio/ch1/Stale.lean")?.stale).toBe(true);
      expect(byFile.get("folio/ch1/Stale.lean")?.reason).toContain("content hash mismatch");

      expect(byFile.get("folio/ch1/Malformed.lean")?.stale).toBe(true);
      expect(byFile.get("folio/ch1/Malformed.lean")?.reason).toBe("malformed witness file");

      const report = runAudit({ repoRoot: root, leanOnly: true });
      expect(report.lean.total).toBe(4);
      expect(report.lean.witnessed).toBe(1);
      expect(report.lean.stale).toBe(2);
      expect(report.lean.pending).toBe(1);
      expect(report.python.total).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("audits Python witnesses: structured fresh, stale scriptHash, legacy format, and malformed JSON", () => {
    const root = mkdtempSync(join(tmpdir(), "witness-audit-py-"));
    try {
      const compDir = join(root, "folio-assistant", "computations");
      mkdirSync(compDir, { recursive: true });

      // 1. Fresh structured Python witness
      const freshPy = join(compDir, "calc_alpha.py");
      writeFileSync(freshPy, "print('alpha = 1/137')\n");
      const freshPyHash = fileContentHash(freshPy);
      writeFileSync(
        join(compDir, "calc_alpha.witness.json"),
        JSON.stringify({
          engine: "python3",
          computedAt: "2026-10-30T00:00:00Z",
          commitSha: "deadbeef1234",
          scriptFile: "calc_alpha.py",
          scriptHash: freshPyHash,
          contentBlock: "thm:alpha",
          assertions: [{ name: "alpha_pos", passed: true }],
        }),
      );

      // 2. Stale Python witness (scriptHash mismatch)
      const stalePy = join(compDir, "calc_beta.py");
      writeFileSync(stalePy, "print('beta = 2')\n");
      writeFileSync(
        join(compDir, "calc_beta.witness.json"),
        JSON.stringify({
          engine: "python3",
          computedAt: "2026-10-30T00:00:00Z",
          scriptFile: "calc_beta.py",
          scriptHash: "000000000000",
        }),
      );

      // 3. Legacy Python witness (missing engine/computedAt)
      writeFileSync(
        join(compDir, "legacy_gamma.witness.json"),
        JSON.stringify({
          git_sha: "cafebabe",
          result: 42,
        }),
      );

      // 4. Malformed Python witness
      writeFileSync(join(compDir, "broken.witness.json"), "{ invalid json");

      const entries = auditPythonWitnesses(root);
      expect(entries).toHaveLength(4);

      const report = runAudit({ repoRoot: root, pyOnly: true });
      expect(report.python.total).toBe(4);
      expect(report.python.structured).toBe(2);
      expect(report.python.legacy).toBe(2);
      expect(report.python.stale).toBe(2);
      expect(report.python.withAssertions).toBe(1);
      expect(report.python.withCommitSha).toBe(2);
      expect(report.lean.entries).toHaveLength(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("gitFileShas passes paths with shell metacharacters to git as data", () => {
    const root = mkdtempSync(join(tmpdir(), "witness-audit-git-"));
    try {
      const git = (...args: string[]) =>
        execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
      git("init", "-q");
      git("config", "user.email", "t@t");
      git("config", "user.name", "t");
      const names = ["a$(echo x).lean", "b;c.lean", "d`e`.lean", "f g.lean", "h'i.lean", "j*.lean", "k&l|m.lean", "\u00e9.lean"];
      for (const n of names) writeFileSync(join(root, n), `-- ${n}\n`);
      writeFileSync(join(root, "jX.lean"), "-- matched only if the pathspec were a glob\n");
      git("add", "-A");
      git("commit", "-qm", "files");
      const sha = git("rev-parse", "HEAD");

      const shas = gitFileShas(names, root);
      for (const n of names) expect(shas.get(n)).toBe(sha);
      expect(shas.size).toBe(names.length);
      // Nothing was created by a shell reading the names.
      expect(readdirSync(root).filter((f) => f !== ".git").sort()).toEqual([...names, "jX.lean"].sort());
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
