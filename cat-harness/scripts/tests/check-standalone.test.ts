/**
 * `check:standalone` — the judgement, and the two falsifiers bean `ho66` asks
 * for, run through the REAL probe on a scratch repository: an empty layer is
 * never a pass, and a planted read of a sibling the layer does not declare is
 * red.
 */
import { describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { judge, STANDALONE_EXIT } from "../check-standalone.ts";
import { probeStandalone, type LayerDecl } from "../seed-ready.ts";

describe("judge", () => {
  const measured = (findings: string[], count = findings.length) =>
    ({ state: "measured", count, findings }) as const;

  test("the same failing set holds", () => {
    expect(judge(measured(["a > b"]), { failing: ["a > b"], failed: 1 }).exit).toBe(STANDALONE_EXIT.held);
  });
  test("a new failure is red and named", () => {
    const j = judge(measured(["a > b", "c > d"]), { failing: ["a > b"], failed: 1 });
    expect(j.exit).toBe(STANDALONE_EXIT.moved);
    expect(j.lines.join("\n")).toContain("+ c > d");
  });
  test("a fixed failure is red until the baseline is lowered", () => {
    const j = judge(measured([]), { failing: ["a > b"], failed: 1 });
    expect(j.exit).toBe(STANDALONE_EXIT.moved);
    expect(j.lines.join("\n")).toContain("- a > b");
  });
  test("more unnamed failures is red", () => {
    expect(judge(measured(["a > b"], 3), { failing: ["a > b"], failed: 2 }).exit).toBe(STANDALONE_EXIT.moved);
  });
  test("an error and a missing baseline are never held", () => {
    expect(judge({ state: "error", note: "x" }, { failing: [], failed: 0 }).exit).toBe(STANDALONE_EXIT.undetermined);
    expect(judge(measured([]), undefined).exit).toBe(STANDALONE_EXIT.undetermined);
  });
});

describe("the falsifiers, through the real probe", () => {
  function scratchRepo(files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), "check-standalone-"));
    for (const [rel, body] of Object.entries(files)) {
      mkdirSync(join(root, rel, ".."), { recursive: true });
      writeFileSync(join(root, rel), body);
    }
    const git = (args: string[]) =>
      execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@invalid", "-c", "commit.gpgsign=false", ...args], {
        cwd: root,
        stdio: "ignore",
      });
    git(["init", "-q"]);
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "fixture"]);
    return root;
  }
  const DECLS: LayerDecl[] = [{ name: "layer", dir: "layer", needs: [] }];
  // A one-file fixture needs no 3 GB; the floor is for the real corpus.
  const OPTS = { minFreeBytes: 0 };

  test("an empty layer exits non-zero", () => {
    const root = scratchRepo({ "layer/README.md": "nothing to test\n" });
    try {
      const probe = probeStandalone(root, "layer", DECLS, OPTS);
      // bun finds no test and prints no summary: an error, never a measured 0.
      expect(probe.state).toBe("error");
      expect(judge(probe, { failing: [], failed: 0 }).exit).toBe(STANDALONE_EXIT.undetermined);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);

  test("a planted read of an undeclared sibling is red", () => {
    const root = scratchRepo({
      "folio-assistant-core/x": "only the monorepo has this\n",
      "layer/reads.test.ts": [
        'import { expect, test } from "bun:test";',
        'import { existsSync } from "node:fs";',
        'import { join } from "node:path";',
        'test("reads core", () => { expect(existsSync(join(import.meta.dir, "../folio-assistant-core/x"))).toBe(true); });',
        "",
      ].join("\n"),
    });
    try {
      const probe = probeStandalone(root, "layer", DECLS, OPTS);
      expect(probe).toMatchObject({ state: "measured", count: 1 }); // a mismatch prints the probe's note
      const j = judge(probe, { failing: [], failed: 0 });
      expect(j.exit).toBe(STANDALONE_EXIT.moved);
      expect(j.measured?.failing).toEqual(["reads.test.ts > reads core"]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 60_000);
});
