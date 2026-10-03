/**
 * `roots.ts` names the three roots a file in this layer can mean. These tests
 * pin the resolution ORDER for the harness root and the two refusals, because
 * a wrong harness root does not fail — it reads as an empty corpus.
 *
 * @module scripts/tests/roots.test
 */
import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  HARNESS_ROOT,
  REPO_ROOT,
  TOOLS_ROOT,
  harnessFlag,
  isHarnessRoot,
  repoRootFor,
  resolveHarnessRoot,
} from "../lib/roots.ts";

const scratch = mkdtempSync(join(tmpdir(), "roots-test-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** A checkout `<scratch>/<name>/` holding `cat-harness/` (declared `name`) and `cat-harness-tools/`. */
function checkout(name: string, harnessName = "cat-harness"): { repo: string; harness: string; tools: string } {
  const repo = join(scratch, name);
  const harness = join(repo, "cat-harness");
  const tools = join(repo, "cat-harness-tools");
  mkdirSync(harness, { recursive: true });
  mkdirSync(tools, { recursive: true });
  writeFileSync(join(harness, "cat-harness.json"), JSON.stringify({ name: harnessName }));
  return { repo, harness, tools };
}

describe("the constants, in this checkout", () => {
  test("TOOLS_ROOT is this layer, HARNESS_ROOT its declared sibling, REPO_ROOT the checkout", () => {
    expect(TOOLS_ROOT).toBe(resolve(import.meta.dir, "..", ".."));
    expect(TOOLS_ROOT.endsWith("cat-harness-tools")).toBe(true);
    expect(HARNESS_ROOT).toBe(resolve(TOOLS_ROOT, "..", "cat-harness"));
    expect(isHarnessRoot(HARNESS_ROOT)).toBe(true);
    expect(REPO_ROOT).toBe(resolve(TOOLS_ROOT, ".."));
  });
});

describe("resolution order: --harness, then $CAT_HARNESS_ROOT, then the declared sibling", () => {
  const a = checkout("order-a");
  const b = checkout("order-b");
  const c = checkout("order-c");

  test("the flag wins over the environment and the sibling", () => {
    const r = resolveHarnessRoot({ argv: ["bun", "x.ts", "--harness", b.harness], env: { CAT_HARNESS_ROOT: c.harness }, toolsRoot: a.tools });
    expect(r).toEqual({ root: b.harness, source: "flag" });
  });

  test("--harness=<dir> is the same flag", () => {
    expect(resolveHarnessRoot({ argv: [`--harness=${b.harness}`], env: {}, toolsRoot: a.tools }).root).toBe(b.harness);
  });

  test("the environment wins over the sibling", () => {
    const r = resolveHarnessRoot({ argv: [], env: { CAT_HARNESS_ROOT: c.harness }, toolsRoot: a.tools });
    expect(r).toEqual({ root: c.harness, source: "env" });
  });

  test("with neither, the sibling", () => {
    expect(resolveHarnessRoot({ argv: [], env: {}, toolsRoot: a.tools })).toEqual({ root: a.harness, source: "sibling" });
  });

  test("an empty $CAT_HARNESS_ROOT is absent, not the current directory", () => {
    expect(resolveHarnessRoot({ argv: [], env: { CAT_HARNESS_ROOT: "" }, toolsRoot: a.tools }).source).toBe("sibling");
  });
});

describe("refusals — a wrong root reads as an empty corpus, so it must throw instead", () => {
  test("a sibling with the right directory name but another declared name is not the harness", () => {
    const x = checkout("impostor", "something-else");
    expect(isHarnessRoot(x.harness)).toBe(false);
    expect(() => resolveHarnessRoot({ argv: [], env: {}, toolsRoot: x.tools })).toThrow(/cannot find the harness/);
  });

  test("an explicit root that is not the harness throws rather than falling through", () => {
    const ok = checkout("explicit-ok");
    const empty = join(scratch, "not-a-harness");
    mkdirSync(empty, { recursive: true });
    // Falling through to the (valid) sibling would hide the typo.
    expect(() => resolveHarnessRoot({ argv: ["--harness", empty], env: {}, toolsRoot: ok.tools })).toThrow(/--harness names/);
    expect(() => resolveHarnessRoot({ argv: [], env: { CAT_HARNESS_ROOT: empty }, toolsRoot: ok.tools })).toThrow(
      /\$CAT_HARNESS_ROOT names/,
    );
  });

  test("an unparseable declaration is not the harness", () => {
    const x = checkout("garbled");
    writeFileSync(join(x.harness, "cat-harness.json"), "{ not json");
    expect(isHarnessRoot(x.harness)).toBe(false);
  });
});

describe("REPO_ROOT is absent when this layer is standalone", () => {
  test("a sibling harness gives the common parent", () => {
    const x = checkout("together");
    expect(repoRootFor(x.tools, x.harness)).toBe(x.repo);
  });

  test("a harness elsewhere gives undefined, not a plausible wrong path", () => {
    const x = checkout("apart-tools");
    const y = checkout("apart-harness");
    expect(repoRootFor(x.tools, y.harness)).toBeUndefined();
  });
});

describe("harnessFlag", () => {
  test("the last flag wins, and an empty value is absent", () => {
    expect(harnessFlag(["--harness", "/a", "--harness=/b"])).toBe("/b");
    expect(harnessFlag(["--harness="])).toBeUndefined();
    expect(harnessFlag(["--harness"])).toBeUndefined();
    expect(harnessFlag(["--harnessy", "/a"])).toBeUndefined();
  });
});
