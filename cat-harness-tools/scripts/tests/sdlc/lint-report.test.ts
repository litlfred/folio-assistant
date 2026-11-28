/**
 * `scripts/lint-report.ts` — the per-layer lint counts (lint baseline,
 * 2026-11-28): every finding counted against the layer that holds it, a tool
 * that is not installed read as not measured rather than 0, and an exit of 0
 * whatever was counted.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { baselineOf, layerOf, main, measure, parseRuff, parseShellcheck, shellFiles, table, type LintReport } from "../../lint-report.ts";

describe("lint:report: counting", () => {
  test("a finding is counted against the deepest layer that holds it, else the root", () => {
    const layers = ["/r/a", "/r/a/b", "/r/c"];
    expect(layerOf("/r/a/x.py", layers, "/r")).toBe("a");
    expect(layerOf("/r/a/b/y.sh", layers, "/r")).toBe("a/b");
    expect(layerOf("/r/ab/z.py", layers, "/r")).toBe(".");
    expect(layerOf("/r/x.py", ["/r", "/r/a"], "/r")).toBe("r");
  });

  test("ruff's and shellcheck's JSON are read as file and rule", () => {
    expect(parseRuff('[{"filename":"/r/a.py","code":"F401"},{"filename":"/r/b.py","code":null}]')).toEqual([["/r/a.py", "F401"], ["/r/b.py", "syntax"]]);
    expect(parseShellcheck('{"comments":[{"file":"a.sh","level":"error","code":1072}]}')).toEqual([["a.sh", "error", "SC1072"]]);
    expect(parseRuff("")).toEqual([]);
  });

  test("shell files are found under a tree, skipping dependencies and build output", () => {
    const root = mkdtempSync(join(tmpdir(), "lint-report-"));
    for (const d of ["s", "node_modules/x", "target"]) mkdirSync(join(root, d), { recursive: true });
    for (const f of ["s/a.sh", "node_modules/x/b.sh", "target/c.sh", "d.py"]) writeFileSync(join(root, f), "x\n");
    expect(shellFiles(root)).toEqual([join(root, "s", "a.sh")]);
  });

  test("a tool that is not installed reads not measured, never 0, and the run still exits 0", () => {
    const root = mkdtempSync(join(tmpdir(), "lint-report-"));
    const r = measure(root, [root], [], { PATH: "" }, join(root, "ruff.toml"));
    expect(r.layers["."]).toEqual({ "ruff:must-pass": null, "ruff:classic": null, "shellcheck:error": null, "shellcheck:all": null, actionlint: null });
    expect(r.tools).toEqual({ ruff: null, shellcheck: null, actionlint: null });
    expect(table(r)).toContain("not measured");
    const saved = process.stdout.write.bind(process.stdout);
    process.stdout.write = (() => true) as typeof process.stdout.write;
    try {
      expect(main(["--root", root], { PATH: "" })).toBe(0);
    } finally {
      process.stdout.write = saved;
    }
  });
});

describe("lint:report: the baseline", () => {
  const report: LintReport = {
    $schema: "cat-lint-report/v1",
    measuredAt: "t",
    tools: { ruff: "0.16.9", shellcheck: null, actionlint: null },
    notes: [],
    layers: { "layers/a": { "ruff:classic": { total: 5, rules: { F541: 5 } }, "shellcheck:all": null } },
  };

  test("a baseline keeps each layer's totals, keyed by its directory name", () => {
    expect(baselineOf(report).layers).toEqual({ a: { "ruff:classic": 5, "shellcheck:all": null } });
  });

  test("the table shows a count's change against the baseline, and no change as the count alone", () => {
    expect(table(report, { ...baselineOf(report), layers: { a: { "ruff:classic": 3 } } })).toContain("5 (+2 vs baseline)");
    expect(table(report, baselineOf(report))).toContain("| layers/a |  | 5 |  | not measured |  |");
  });
});
