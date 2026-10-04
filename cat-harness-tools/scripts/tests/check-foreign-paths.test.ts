/**
 * `check:foreign-paths` (bean `gz47`): what counts as a foreign literal, the
 * `docs/` rule that keeps it from crying wolf, and the one-way ratchet.
 */
import { describe, expect, test } from "bun:test";

import { foreignTargets, judge, scanText, type InstanceDirs } from "../check-foreign-paths.ts";

const ROOT: InstanceDirs = { name: "root", root: "", dirs: ["beans", "fsh-guts", "themes", "uploads"] };
const HARNESS: InstanceDirs = { name: "harness", root: "harness", dirs: ["harness/themes", "harness/skills"] };
const ALL = [ROOT, HARNESS];
const targets = foreignTargets(HARNESS, ALL);
const scan = (text: string) => scanText(text, "harness/scripts/x.ts", "harness", targets);

describe("which names are foreign", () => {
  test("a name only another instance declares is foreign; a shared name is not (the `docs/` rule, shown with `themes`)", () => {
    const dirs = targets.map((t) => t.dir).sort();
    expect(dirs).toEqual(["beans", "fsh-guts", "uploads"]);
  });
  test("a directory inside the scanner's own tree is never foreign to it", () => {
    expect(foreignTargets(ROOT, ALL).map((t) => t.dir)).not.toContain("harness/themes");
  });
});

describe("what a scan counts", () => {
  test("a spelled path into another instance's directory is counted, with its owner", () => {
    const r = scan('const A = "fsh-guts/uploads";\n');
    expect(r.counted).toHaveLength(1);
    expect(r.counted[0]).toMatchObject({ target: "fsh-guts", owner: "root", line: 1 });
  });
  test("a bare segment counts only as the first literal of a path-building call", () => {
    expect(scan('readdirSync(join(ROOT, "beans", "defs"));\n').counted).toHaveLength(1);
    expect(scan('const tool = { id: "beans" };\n').counted).toHaveLength(0);
    expect(scan('join(ROOT, "x", "beans");\n').counted).toHaveLength(0);
  });
  test("a `../` path from the instance's root resolves before matching", () => {
    expect(scan('const p = "../uploads/a.pdf";\n').counted).toHaveLength(1);
  });
  test("comments, templates and sentences are not paths", () => {
    expect(scan('// see beans/defs\nconst t = `fsh-guts/${x}`;\nconst s = "beans/ is the work plan";\n').counted).toHaveLength(0);
  });
  test("a name the scanner also declares is not a finding (the false positive the shared-name rule exists for)", () => {
    expect(scan('join(ROOT, "themes", "index.md");\n').counted).toHaveLength(0);
  });
  test("a module specifier is code, not a path into a directory", () => {
    expect(scan('const m = await import("../beans/x.js");\n').counted).toHaveLength(0);
  });
  test("a literal nested in another call inside the path call is not the path (an option name)", () => {
    expect(scan('const d = resolve(opt("beans")!);\n').counted).toHaveLength(0);
  });
  test("a segment joined onto the INSTANCE's own root is the instance's own", () => {
    expect(scan('const OUT = join(INSTANCE, "beans");\n').counted).toHaveLength(0);
    expect(scan('const OUT = join(import.meta.dir, "..", "beans");\n').counted).toHaveLength(0);
    // ...while the checkout root is still caught.
    expect(scan('const D = join(REPO, "beans");\n').counted).toHaveLength(1);
  });
  test("a marked site is reported with its reason, not counted", () => {
    const r = scan('// declared-path-literal: the ignore file cannot read a declaration\nconst LOG = "fsh-guts/logs";\n');
    expect(r.counted).toHaveLength(0);
    expect(r.marked[0]?.reason).toContain("ignore file");
  });
});

describe("the ratchet is one way", () => {
  test("a rise is red, naming the file", () => {
    const j = judge({ "a.ts": 2 }, { "a.ts": 1 });
    expect(j.exit).toBe(1);
    expect(j.over).toEqual([{ file: "a.ts", was: 1, now: 2 }]);
  });
  test("a new file with any foreign literal is red", () => {
    expect(judge({ "new.ts": 1 }, {}).exit).toBe(1);
  });
  test("a fall is reported, never red — a fix elsewhere must not redden an unrelated PR", () => {
    const j = judge({}, { "a.ts": 3 });
    expect(j.exit).toBe(0);
    expect(j.under).toEqual([{ file: "a.ts", was: 3, now: 0 }]);
  });
});
