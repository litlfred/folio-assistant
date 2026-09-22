/**
 * `qa:resolve-conflicts` — and the guard is the whole test.
 *
 * Bean `520m`, the owner's ruling of 2026-09-21 (a script, not a merge driver).
 *
 * A command that resolves conflicts by regenerating is correct for the 5,883
 * script-authored entries in this repository's sidecars and DESTRUCTIVE for the
 * 13 agent-authored ones. So the assertion that matters is not that it resolves
 * — it is that it **refuses**, and refuses on a real git conflict rather than on
 * a hand-built object that never went through git's index.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative } from "node:path";

import {
  generatorFor,
  plan,
  scanConflict,
  scanDocument,
  unmergedPaths,
  type SideScan,
} from "../qa-resolve-conflicts.ts";

const QA = "cat-harness/test/results/";

/** A sidecar with one script verdict, and optionally an agent one beside it. */
function sidecar(result: string, withAgent: boolean): string {
  const criteria: Record<string, unknown[]> = {
    "translation-coverage": [
      { result, reviewer: { kind: "script", id: "content/pipeline/translation-block-qa.ts" } },
    ],
  };
  if (withAgent) {
    criteria["translation-coverage"].push({
      result: "pass",
      reviewer: { kind: "agent", id: "voice-review" },
      note: "adjudicated by hand — the string is a proper noun and is not translated",
    });
  }
  return JSON.stringify({ $schema: "translation-qa/v1", criteria }, null, 2) + "\n";
}

/**
 * A throwaway repository with a REAL conflict in the given files.
 *
 * Built through git rather than faked, because the two constraints this command
 * was written against are both properties of the index: a conflicted file does
 * not parse, and the two sides are readable only as stages.
 */
function repoWithConflict(files: { path: string; ours: string; theirs: string }[]): string {
  const dir = mkdtempSync(join(tmpdir(), "qa-resolve-"));
  const g = (...args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf-8" });
  g("init", "-q", "-b", "main");
  g("config", "user.email", "t@example.invalid");
  g("config", "user.name", "t");
  for (const f of files) {
    mkdirSync(join(dir, f.path, ".."), { recursive: true });
    writeFileSync(join(dir, f.path), "{}\n");
  }
  g("add", ".");
  g("commit", "-qm", "base");
  g("checkout", "-q", "-b", "side");
  for (const f of files) writeFileSync(join(dir, f.path), f.theirs);
  g("commit", "-qam", "theirs");
  g("checkout", "-q", "main");
  for (const f of files) writeFileSync(join(dir, f.path), f.ours);
  g("commit", "-qam", "ours");
  try {
    g("merge", "side");
  } catch {
    /* the conflict is the point */
  }
  return dir;
}

const dirs: string[] = [];
function conflicted(files: { path: string; ours: string; theirs: string }[]): string {
  const d = repoWithConflict(files);
  dirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

describe("the guard refuses what regeneration would destroy", () => {
  test("a sidecar carrying an AGENT verdict is refused, not resolved", () => {
    const path = `${QA}translation-qa/docs/x.translation-qa.json`;
    const dir = conflicted([{ path, ours: sidecar("warn", true), theirs: sidecar("fail", true) }]);
    expect(unmergedPaths(dir)).toEqual([path]);
    const [o] = plan(dir, QA, unmergedPaths(dir));
    expect(o!.action).toBe("refuse");
    expect(o!.reason).toContain("agent");
  });

  test("...and the same file WITHOUT the agent verdict is resolved", () => {
    // The falsification. A guard that refuses everything is a guard that has
    // stopped discriminating, and would be indistinguishable from a correct
    // one on the test above alone.
    const path = `${QA}translation-qa/docs/x.translation-qa.json`;
    const dir = conflicted([{ path, ours: sidecar("warn", false), theirs: sidecar("fail", false) }]);
    const [o] = plan(dir, QA, unmergedPaths(dir));
    expect(o!.action).toBe("resolve");
  });

  test("a side that is not valid JSON is REFUSED, never read as 'nothing found'", () => {
    // The failure this command would have had if the guard read the working
    // tree: every conflicted file throws, and a caught throw looks exactly
    // like a clean scan.
    const path = `${QA}translation-qa/docs/broken.translation-qa.json`;
    const dir = conflicted([{ path, ours: "{ not json\n", theirs: sidecar("fail", false) }]);
    const [o] = plan(dir, QA, unmergedPaths(dir));
    expect(o!.action).toBe("refuse");
    expect(o!.reason).toContain("not valid JSON");
  });

  test("a conflict OUTSIDE the declared qa graph is left alone", () => {
    const path = "cat-harness/schemas/thing.ts";
    const dir = conflicted([{ path, ours: "export const a = 1;\n", theirs: "export const a = 2;\n" }]);
    const [o] = plan(dir, QA, unmergedPaths(dir));
    expect(o!.action).toBe("skip");
    expect(o!.reason).toContain("outside");
  });

  test("a mixed merge partitions rather than refusing wholesale", () => {
    const safe = `${QA}translation-qa/docs/safe.translation-qa.json`;
    const risky = `${QA}translation-qa/docs/risky.translation-qa.json`;
    const code = "cat-harness/schemas/thing.ts";
    const dir = conflicted([
      { path: safe, ours: sidecar("warn", false), theirs: sidecar("fail", false) },
      { path: risky, ours: sidecar("warn", true), theirs: sidecar("fail", true) },
      { path: code, ours: "export const a = 1;\n", theirs: "export const a = 2;\n" },
    ]);
    const byAction = Object.fromEntries(
      plan(dir, QA, unmergedPaths(dir)).map((o) => [o.path, o.action]),
    );
    expect(byAction[safe]).toBe("resolve");
    expect(byAction[risky]).toBe("refuse");
    expect(byAction[code]).toBe("skip");
  });
});

describe("the scanner", () => {
  test("reads git STAGES, so a conflicted file's markers never reach the parser", () => {
    const path = `${QA}translation-qa/docs/x.translation-qa.json`;
    const dir = conflicted([{ path, ours: sidecar("warn", true), theirs: sidecar("fail", true) }]);
    const scan = scanConflict(dir, path);
    expect(scan.unreadable).toEqual([]);
    // One script + one agent per side, two sides.
    expect(scan.kinds.length).toBe(4);
    expect(scan.nonScript.length).toBe(2);
    expect(scan.reviewerIds).toContain("content/pipeline/translation-block-qa.ts");
  });

  test("a family with NO reviewer anywhere scans clean — and that is a different fact", () => {
    // `kg-qa/v1` records `criteria[id].result` with no reviewer at all; it is
    // wholly derived by `kg-audit`. "Found none" and "the shape has none" are
    // both safe here and are reported differently by --explain.
    const into: SideScan = { kinds: [], nonScript: [], reviewerIds: [], unreadable: [] };
    scanDocument(
      { $schema: "kg-qa/v1", criteria: { "skill-is-brief": { result: "fail", findings: [] } } },
      into,
    );
    expect(into.kinds).toEqual([]);
    expect(into.nonScript).toEqual([]);
  });

  test("it does not stop at the first reviewer it finds", () => {
    const into: SideScan = { kinds: [], nonScript: [], reviewerIds: [], unreadable: [] };
    scanDocument(
      {
        a: { reviewer: { kind: "script", id: "s.ts" } },
        b: [{ reviewer: { kind: "agent", id: "someone" } }],
        c: { d: { e: { reviewer: { kind: "human", id: "litlfred" } } } },
      },
      into,
    );
    expect(into.kinds.sort()).toEqual(["agent", "human", "script"]);
    expect(into.nonScript.length).toBe(2);
  });
});

describe("the generator is looked up, never guessed", () => {
  const scripts = {
    "translation:block-qa": "bun run cat-harness/content/pipeline/translation-block-qa.ts",
    "translation:block-qa:check": "bun run cat-harness/content/pipeline/translation-block-qa.ts --check",
    "kg:audit": "bun run cat-harness/scripts/kg-audit.ts",
    "kg:audit:check": "bun run cat-harness/scripts/kg-audit.ts --check",
  };

  test("the WRITING script is chosen and the :check one excluded", () => {
    // A `:check` verifies and writes nothing, so running it to resolve a
    // conflict would leave the conflict resolved to one arbitrary side.
    expect(generatorFor(scripts, "content/pipeline/translation-block-qa.ts")).toBe("translation:block-qa");
    expect(generatorFor(scripts, "cat-harness/scripts/kg-audit.ts")).toBe("kg:audit");
  });

  test("an unrecognised reviewer yields undefined rather than a plausible guess", () => {
    expect(generatorFor(scripts, "content/pipeline/not-a-thing.ts")).toBeUndefined();
  });

  test("this repository's real package.json still answers for its own reviewers", () => {
    // The fixtures above prove the matcher; this proves it against the file
    // that is actually read at runtime, which is what drifts.
    const real = (JSON.parse(
      readFileSync(join(import.meta.dir, "..", "..", "..", "package.json"), "utf-8"),
    ) as { scripts: Record<string, string> }).scripts;
    expect(generatorFor(real, "content/pipeline/translation-block-qa.ts")).toBe("translation:block-qa");
  });
});

describe("the qa directory is resolved, not assembled", () => {
  test("`directoryForGraph` returns an ABSOLUTE path, which is what the caller must expect", async () => {
    // The bug this pins. The command joined the declaration onto the instance
    // root as though it were instance-relative, producing
    // `cat-harness/home/user/…/test/results/` — a prefix nothing matches. Every
    // conflicted sidecar was then classified "outside the declared graph" and
    // the command did nothing while exiting 0.
    //
    // It FAILED OPEN, which is the shape the command exists to prevent, in the
    // command itself. It was found on its first real conflict rather than by a
    // test, so the shape of the return value is asserted here directly.
    const { directoryForGraph, repoRootFor } = await import("../../schemas/cat-harness.ts");
    await import("../../schemas/folio-graph-kind.js");
    const instance = join(import.meta.dir, "..", "..");
    const qa = directoryForGraph(instance, "qa");
    expect(qa).toBeDefined();
    expect(isAbsolute(qa!)).toBe(true);

    // And the repo-relative form the command actually needs is what git's
    // output can be matched against.
    const rel = relative(repoRootFor(instance), qa!);
    expect(isAbsolute(rel)).toBe(false);
    expect(rel).toBe("cat-harness/test/results");
  });

  test("a conflicted sidecar under the real qa directory is not classed 'outside'", () => {
    // The end-to-end form of the same regression, on a throwaway repo laid out
    // the way this one is. With the old joining bug the action was "skip".
    const path = "cat-harness/test/results/translation-qa/docs/x.translation-qa.json";
    const dir = conflicted([{ path, ours: sidecar("warn", false), theirs: sidecar("fail", false) }]);
    const [o] = plan(dir, "cat-harness/test/results/", unmergedPaths(dir));
    expect(o!.action).not.toBe("skip");
    expect(o!.action).toBe("resolve");
  });
});
