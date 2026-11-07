/**
 * The scanner behind `check:test-gherkin` and `test-has-gherkin`. Each test
 * here is named by a Scenario in `scripts/tests/features/test-gherkin.feature`
 * — the rule this module enforces, applied to itself.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  JS_ADAPTER,
  KOTLIN_ADAPTER,
  PYTHON_ADAPTER,
  RUST_ADAPTER,
  joinTestsToScenarios,
  parseFeature,
  scanTree,
} from "../lib/test-gherkin";
import { auditTestGherkin } from "../test-plan-audit";
import { TEST_PLAN_SCHEMA_ID, TEST_PLAN_SCHEMA_ID_V1 } from "../../schemas/sdlc/test-plan";

const names = (ts: { name: string }[]) => ts.map((t) => t.name);

describe("language adapters", () => {
  test("rust: #[test] functions are named through their mod scopes", () => {
    const src = [
      "// #[test] fn in_a_comment() {}",
      'const S: &str = "#[test] fn in_a_string() {}";',
      "fn helper<'a>(x: &'a str) -> char { '{' }",
      "#[test]",
      "fn top_level() {}",
      "#[cfg(test)]",
      "mod tests {",
      "    use super::*;",
      "    #[tokio::test]",
      "    async fn async_one() {}",
      "    #[test]",
      "    #[should_panic]",
      "    fn panics() {}",
      "    mod inner { #[test] fn deep() {} }",
      "}",
      "#[test_case(1)]",
      "fn cased(n: u8) {}",
    ].join("\n");
    expect(names(RUST_ADAPTER.findTests("src/x.rs", src))).toEqual([
      "src/x.rs::top_level",
      "src/x.rs::tests::async_one",
      "src/x.rs::tests::panics",
      "src/x.rs::tests::inner::deep",
      "src/x.rs::cased",
    ]);
  });

  test("kotlin: @Test functions are named through their classes, backtick names normalised", () => {
    const src = [
      "class QrTest {",
      "    @Test fun decodes() {}",
      "    @Test",
      "    fun `reads a QR code`() { val s = \"}\" }",
      "    @Nested inner class Errors {",
      "        @ParameterizedTest @ValueSource(ints = [1]) fun rejects(n: Int) {}",
      "    }",
      "    fun notATest() {}",
      "}",
    ].join("\n");
    expect(names(KOTLIN_ADAPTER.findTests("app/QrTest.kt", src))).toEqual([
      "app/QrTest.kt::QrTest::decodes",
      "app/QrTest.kt::QrTest::reads_a_QR_code",
      "app/QrTest.kt::QrTest::Errors::rejects",
    ]);
  });

  test("js: test() and it() are named through describe() titles, whitespace as _", () => {
    const src = [
      'import { describe, test } from "bun:test";',
      'describe("loader", () => {',
      '  test("reads a plan", () => { const s = "test(\\"no\\")"; });',
      '  describe("errors", () => {',
      '    it.skip("refuses junk", () => {});',
      '  });',
      '  test.each([1, 2])("each %d", (n) => {});',
      '});',
      'test(`top level`, () => {});',
      '// test("commented out", () => {});',
    ].join("\n");
    expect(names(JS_ADAPTER.findTests("scripts/loader.test.ts", src))).toEqual([
      "scripts/loader.test.ts::loader::reads_a_plan",
      "scripts/loader.test.ts::loader::errors::refuses_junk",
      "scripts/loader.test.ts::loader::each_%d",
      "scripts/loader.test.ts::top_level",
    ]);
    expect(JS_ADAPTER.matches("a/b.test.ts")).toBe(true);
    expect(JS_ADAPTER.matches("a/b.ts")).toBe(false);
  });

  test("python: the name is pytest's node id", () => {
    const src = [
      "def helper():",
      "    def test_nested():",
      "        pass",
      "def test_load():",
      '    """',
      "    def test_in_docstring(): ...",
      '    """',
      "class TestPlan:",
      "    def test_parse(self):",
      "        pass",
      "class Helper:",
      "    def test_not_collected(self):",
      "        pass",
      "async def test_async():",
      "    pass",
    ].join("\n");
    expect(names(PYTHON_ADAPTER.findTests("tests/test_plan.py", src))).toEqual([
      "tests/test_plan.py::test_load",
      "tests/test_plan.py::TestPlan::test_parse",
      "tests/test_plan.py::test_async",
    ]);
  });
});

describe("feature files", () => {
  test("a Scenario's @test: tags are its links; Examples tags and doc strings are not", () => {
    const f = parseFeature(
      "f.feature",
      [
        "Feature: plans",
        "  @test:a.rs::one @test:b.rs::two @smoke",
        "  Scenario: two tests, one behaviour",
        "    Given a plan",
        '    """',
        "    @test:not.rs::a_tag",
        '    """',
        "  @manual",
        "  Scenario Outline: by hand",
        "    @test:c.rs::row",
        "    Examples:",
        "      | x |",
      ].join("\n"),
    );
    expect(f.scenarios.map((s) => [s.title, s.tests, s.manual])).toEqual([
      ["two tests, one behaviour", ["a.rs::one", "b.rs::two"], false],
      ["by hand", [], true],
    ]);
  });
});

describe("joining tests to Scenarios", () => {
  const t = (name: string) => ({ name, file: name.split("::")[0], line: 1, language: "rust" });

  test("orphans are reported both ways", () => {
    const feature = parseFeature(
      "f.feature",
      [
        "@test:x.rs::on_feature",
        "Feature: f",
        "  @test:x.rs::linked @test:x.rs::gone",
        "  Scenario: one",
        "  Scenario: unlinked",
        "  @test:x.rs::twice",
        "  Scenario: a",
        "  @test:x.rs::twice",
        "  Scenario: b",
      ].join("\n"),
    );
    const r = joinTestsToScenarios([t("x.rs::linked"), t("x.rs::orphan"), t("x.rs::twice")], [feature]);
    expect(r.findings.map((f) => [f.kind, f.test ?? f.line]).sort()).toEqual(
      [
        ["scenario-names-no-test", 5],
        ["tag-names-no-test", "x.rs::gone"],
        ["tag-on-feature", "x.rs::on_feature"],
        ["test-in-two-scenarios", "x.rs::twice"],
        ["test-without-scenario", "x.rs::orphan"],
      ].sort(),
    );
  });

  test("two tests that normalise to one name are ambiguous", () => {
    const r = joinTestsToScenarios([t("x.rs::a_b"), t("x.rs::a_b")], []);
    expect(r.findings.some((f) => f.kind === "ambiguous-test-name")).toBe(true);
  });

  test("a tree is scanned whole, and a clean tree has no findings", () => {
    const root = mkdtempSync(join(tmpdir(), "test-gherkin-"));
    mkdirSync(join(root, "tests"));
    writeFileSync(join(root, "tests", "hcert.rs"), "#[test]\nfn round_trip() {}\n");
    writeFileSync(join(root, "tests", "loader.test.ts"), 'test("reads a plan", () => {});\n');
    writeFileSync(
      join(root, "tests", "hcert.feature"),
      "Feature: hcert\n  @test:tests/hcert.rs::round_trip\n  Scenario: a certificate survives a round trip\n" +
        "  @test:tests/loader.test.ts::reads_a_plan\n  Scenario: a plan is read\n",
    );
    const r = scanTree(root);
    expect(r.tests.length).toBe(2);
    expect(r.findings).toEqual([]);
    expect(scanTree(root, { under: ["elsewhere"] }).tests).toEqual([]);
  });
});

describe("the kg-audit criterion test-has-gherkin", () => {
  const plan = ($schema: string, cases: { id: string; feature?: string }[]) =>
    JSON.stringify({
      $schema,
      id: "p",
      title: "p",
      status: "draft",
      version: "1",
      scope: { kind: "tool", versionRange: "*" },
      requirements: ["req:r"],
      testCases: cases.map((c) => ({ ...c, assertions: [{ id: "a", type: "required" }] })),
      exitCriteria: { decision: "x.dmn#Decision_X" },
    });

  test("plan cases with no .feature, a missing one, or an empty one are findings; a linked tree passes", () => {
    const root = mkdtempSync(join(tmpdir(), "test-has-gherkin-"));
    writeFileSync(join(root, "a.test.ts"), 'test("works", () => {});\n');
    writeFileSync(join(root, "a.feature"), "Feature: a\n  @test:a.test.ts::works\n  Scenario: it works\n");
    writeFileSync(join(root, "empty.feature"), "Feature: nothing yet\n");
    writeFileSync(join(root, "old.json"), plan(TEST_PLAN_SCHEMA_ID_V1, [{ id: "no-feature" }]));
    writeFileSync(
      join(root, "new.json"),
      plan(TEST_PLAN_SCHEMA_ID, [
        { id: "linked", feature: "a.feature" },
        { id: "missing", feature: "gone.feature" },
        { id: "empty", feature: "empty.feature" },
      ]),
    );
    const entry = auditTestGherkin({ root, plans: [join(root, "old.json"), join(root, "new.json")] });
    expect(entry.result).toBe("fail");
    expect(entry.findings.map((f) => f.where).sort()).toEqual(["new.json#empty", "new.json#missing", "old.json#no-feature"]);

    const clean = auditTestGherkin({ root, plans: [] });
    expect(clean).toEqual({ result: "pass", findings: [] });
  });

  test("nothing to judge is n/a, and many orphans in one file are one finding", () => {
    const empty = mkdtempSync(join(tmpdir(), "test-has-gherkin-"));
    expect(auditTestGherkin({ root: empty, plans: [] }).result).toBe("n/a");

    const root = mkdtempSync(join(tmpdir(), "test-has-gherkin-"));
    writeFileSync(join(root, "m.test.ts"), Array.from({ length: 7 }, (_, i) => `test("t${i}", () => {});`).join("\n"));
    const entry = auditTestGherkin({ root, plans: [] });
    expect(entry.result).toBe("fail");
    expect(entry.findings).toHaveLength(1);
    expect(entry.findings[0].detail).toContain("test-without-scenario: 7");
    expect(entry.findings[0].detail).toContain("and 2 more");
  });
});
