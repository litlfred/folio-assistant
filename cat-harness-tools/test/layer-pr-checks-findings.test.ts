/**
 * A gate already red on main still fails the PR that adds a finding to it.
 *
 * `run-gates.py` records each gate's `✗` findings as `diagnostics`, and
 * `compare-gates.py` fails a PR whose side holds one more often than main's.
 * Without them, folio-assistant main stayed red on `libraries:check`,
 * `bpmn:checklist:check`, `render:bpmn:check` and `kind:json-schemas:check`
 * while layer PRs added stale files to each (2026-11-04).
 *
 * @module test/layer-pr-checks-findings.test
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DIR = resolve(import.meta.dir, "..", ".github", "scripts", "layer-pr-checks");

function findings(text: string): string[] {
  const code = [
    "import importlib.util, json, sys",
    `spec = importlib.util.spec_from_file_location("m", ${JSON.stringify(join(DIR, "run-gates.py"))})`,
    "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)",
    "print(json.dumps(m.findings(sys.stdin.read())))",
  ].join("\n");
  const r = spawnSync("python3", ["-I", "-c", code], { input: text, encoding: "utf-8" });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
}

const LIBRARIES = (files: string[]): string =>
  [`some progress`, ``, `✗ ${files.length} finding(s):`, ...files.map((f) => `    ${f}: stale — \`libraries:derive\` would rewrite it`), ``, `done`].join("\n");

function compare(base: string, head: string): number {
  const dir = mkdtempSync(join(tmpdir(), "findings-"));
  const side = (text: string) => ({ "libraries:check": { command: "x", exit: 1, tail: "", diagnostics: findings(text) } });
  writeFileSync(join(dir, "base.json"), JSON.stringify(side(base)));
  writeFileSync(join(dir, "head.json"), JSON.stringify(side(head)));
  const r = spawnSync("python3", ["-I", join(DIR, "compare-gates.py"), join(dir, "base.json"), join(dir, "head.json")], {
    encoding: "utf-8",
    // input-site: env PATH #34b0985f — PATH handed to a child process, which decides which binaries it runs
    env: { PATH: process.env.PATH ?? "" },
  });
  return r.status ?? -1;
}

describe("run-gates.py findings", () => {
  test("reads ✗ lines and the items under a ✗ count header, not the count", () => {
    const text = [LIBRARIES(["a/zod.library.json"]), "  ✗ schemas/kinds/x.schema.json is stale", "✗ 1 kind finding(s) — run it", "✓ fine"].join("\n");
    expect(findings(text)).toEqual(["a/zod.library.json: stale — `libraries:derive` would rewrite it", "schemas/kinds/x.schema.json is stale"]);
  });

  test("reads a number as #, so a count that only went down is not new", () => {
    expect(findings("✗ p.ts: 3 contract(s)")).toEqual(["p.ts: # contract(s)"]);
  });
});

describe("compare-gates.py over a gate red on both sides", () => {
  test("a PR that adds a stale file fails", () => {
    expect(compare(LIBRARIES(["a.json"]), LIBRARIES(["a.json", "b.json"]))).toBe(1);
  });

  test("a PR that leaves the findings as they were, or removes one, passes", () => {
    expect(compare(LIBRARIES(["a.json", "b.json"]), LIBRARIES(["a.json", "b.json"]))).toBe(0);
    expect(compare(LIBRARIES(["a.json", "b.json"]), LIBRARIES(["b.json"]))).toBe(0);
  });
});
