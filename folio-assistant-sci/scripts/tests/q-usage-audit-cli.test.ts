/**
 * `q-usage-audit.ts`, moved from cat-harness-tools with its checker (bean
 * `saqd`, 2026-10-30). These came from three cat-harness-tools tests:
 * `q-usage-audit-roots.test.ts` (a zero-block sweep must not report success),
 * `cli-args-paper-guard.test.ts` (the module imports at all) and
 * `lean-ref-coverage.test.ts` (no private resolver). Their generic halves
 * (`findPapers`, the `--paper` guard) stay there.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

const SCRIPT = resolve(import.meta.dir, "../../pipeline/q-usage-audit.ts");

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "q-usage-audit-cli-"));
  for (const p of ["alpha-paper", "beta-paper"]) {
    mkdirSync(join(root, "folio", p), { recursive: true });
    writeFileSync(join(root, "folio", p, `${p}.ts`), "export default {};\n");
  }
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("q-usage-audit CLI: a sweep that finds nothing must not report success", () => {
  test("exits non-zero and names the searched root when no blocks match", async () => {
    const proc = Bun.spawn(
      ["bun", "run", SCRIPT, "--paper", "definitely-not-a-paper", "--no-write"],
      { cwd: root, stdout: "pipe", stderr: "pipe" },
    );
    const [code, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stderr).text(),
    ]);

    // The whole point: the old code exited 0 here.
    expect(code).not.toBe(0);
    expect(stderr).toContain("found NO blocks to audit");
    // The diagnostic must name the root it searched — that is what makes
    // a wrong-root failure diagnosable instead of mysterious.
    expect(stderr).toContain("content repo root");
  }, 60_000);
});

describe("q-usage-audit still IMPORTS", () => {
  test("the module loads at all", async () => {
    // The regression this guards was a ReferenceError at MODULE SCOPE: every
    // import threw. Importing it is the whole assertion.
    const mod = await import("../../pipeline/q-usage-audit");
    expect(mod).toBeDefined();
  });
});

describe("q-usage-audit carries no private resolver/walker", () => {
  test("it reads lean.ref resolution from the shared qa-utils", () => {
    const src = readFileSync(SCRIPT, "utf-8");
    expect(src).toContain('pipeline/qa-utils');
    expect(src).not.toContain("function resolveLakeTreePath");
    expect(src).not.toContain("function lakeTreeContains");
  });
});
