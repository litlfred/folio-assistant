/**
 * `xd1g` Done-when 3 — the census the owner ruled should ship.
 *
 * It reports and does not fail on its findings, so the cases that matter are
 * about the MEASUREMENT being honest rather than about a verdict.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { census } from "../root-scan-census.ts";

function repo(files: Record<string, string>): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "census-"));
  spawnSync("git", ["init", "-q"], { cwd: dir });
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe("root-scan census", () => {
  test("A CONVERTED SCANNER STAYS IN THE DENOMINATOR", () => {
    // The load-bearing case, and it is a defect this census actually had for
    // one run. A converted scanner no longer contains `readdirSync` or
    // `new Glob` — that IS the conversion — so a bare-walk-only pattern drops
    // it from the population instead of moving it to the population's good
    // side. The first run read "57 enumerating scripts, 1 asks git" on a tree
    // where eleven had just been converted.
    //
    // A measurement whose headline gets WORSE as the corpus improves is worse
    // than none, which is the failure this whole bean is about — committed in
    // the census reporting on it.
    const { dir, cleanup } = repo({
      "scripts/converted.ts": 'const ROOT = "x";\ngitFiles(ROOT, () => true);\n',
      "scripts/unconverted.ts": 'const ROOT = "x";\nreaddirSync(ROOT);\n',
    });
    const rows = census(join(dir, "scripts"));
    expect(rows.map((r) => r.file.split("/").at(-1)).sort()).toEqual(["converted.ts", "unconverted.ts"]);
    expect(rows.find((r) => r.file.endsWith("converted.ts"))?.gitAware).toBe(true);
    expect(rows.find((r) => r.file.endsWith("unconverted.ts"))?.gitAware).toBe(false);
    cleanup();
  });

  test("a script that enumerates but binds no root constant is not censused", () => {
    // The loose filter is already an over-count; without this it would sweep
    // every `readdirSync` in the repository and report a number nobody could
    // act on at all.
    const { dir, cleanup } = repo({ "scripts/local.ts": 'readdirSync(someDir);\n' });
    expect(census(join(dir, "scripts"))).toEqual([]);
    cleanup();
  });

  test("`seededAtRoot` is narrower than `enumerates`, and that GAP is the finding", () => {
    // The two filters disagree by design. A recursion helper defeats the tight
    // one, which is exactly why a syntactic check cannot answer this question
    // and the real guard is behavioural.
    const { dir, cleanup } = repo({
      "scripts/seeded.ts": 'const REPO_ROOT = "x";\nreaddirSync(REPO_ROOT);\n',
      "scripts/helper.ts": 'const REPO_ROOT = "x";\nconst go = (d) => readdirSync(d);\ngo(REPO_ROOT);\n',
    });
    const rows = census(join(dir, "scripts"));
    expect(rows.find((r) => r.file.endsWith("seeded.ts"))?.seededAtRoot).toBe(true);
    // Missed by the tight filter — recorded as the known limit, not as a pass.
    expect(rows.find((r) => r.file.endsWith("helper.ts"))?.seededAtRoot).toBe(false);
    cleanup();
  });

  test("tests and declaration files are not scanners", () => {
    const { dir, cleanup } = repo({
      "scripts/a.test.ts": 'const ROOT = "x";\nreaddirSync(ROOT);\n',
      "scripts/b.d.ts": 'const ROOT = "x";\nreaddirSync(ROOT);\n',
    });
    expect(census(join(dir, "scripts"))).toEqual([]);
    cleanup();
  });

  test("it is DISCRIMINATING over this repository", () => {
    // The vacuity control: a census that found nothing would satisfy every
    // shape assertion above while measuring nothing at all.
    const rows = census(resolve(import.meta.dir, ".."));
    expect(rows.length).toBeGreaterThan(20);
    expect(rows.some((r) => r.gitAware)).toBe(true);
  });
});
