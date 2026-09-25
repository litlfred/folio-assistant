import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { checkTestRuns } from "../test-run-conformance.js";
import { knownSkills } from "../known-skills.js";

const INSTANCE = resolve(import.meta.dir, "../..");
const SKILLS = knownSkills(INSTANCE);
const dir = mkdtempSync(join(tmpdir(), "test-runs-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const basis = { hash: "abc", inputs: ["x"] };
function run(name: string, body: Record<string, unknown>): void {
  writeFileSync(
    join(dir, `${name}.test-run.json`),
    JSON.stringify({ $schema: "folio-test-run/v1", subject: "s", data: basis, process: basis, outcome: {}, updated_at: "t", ...body }),
  );
}

const good = { input: { text: "can you add a tool" }, output: { fires: true, categories: ["direct-capability"], excluded: false } };

describe("a test run is checked against the contract of the skill it names (#1168, B4)", () => {
  test("each state is reported separately, never folded into a pass", () => {
    run("a-good", { skill: "crdm-detect", cases: [good] });
    run("b-bad-output", { skill: "crdm-detect", cases: [good, { input: { text: "x" }, output: { fires: "yes" } }] });
    run("c-ghost", { skill: "no-such-skill-here", cases: [good] });
    run("d-no-cases", { skill: "crdm-detect" });
    run("e-no-contract", { skill: "role-model", cases: [good] });
    run("f-unparseable", { cases: [good] });

    const r = checkTestRuns(INSTANCE, dir, SKILLS);
    const names = (fs: { where: string }[]) => fs.map((f) => f.where.replace(/^.*\//, "").replace(".test-run.json", "")).sort();

    expect(r.runs).toBe(6);
    expect(r.checked).toBe(1);
    expect(names(r.nonconforming)).toEqual(["b-bad-output"]);
    expect(r.nonconforming[0]!.detail).toContain("case 1: output");
    expect(names(r.unresolved)).toEqual(["c-ghost", "f-unparseable"]);
    expect(names(r.unchecked)).toEqual(["d-no-cases", "e-no-contract"]);
  });
});
