/**
 * `staging-only-publish` tests that read the aggregate repository's own root —
 * the root-declared `fsh-guts` trashcan and
 * `.github/workflows/feature-staging.yml` — moved here from
 * `cat-harness/scripts/tests/staging-only-publish.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { beforeAll, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { compose, isWithheld, withheldFromCanonical } from "../../../cat-harness/scripts/compose-docs.js";
import { gutsDir, gutsFiles, pageRelPath } from "../../../cat-harness/scripts/gen-fsh-guts-viz.js";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const REPO = resolve(ORIGIN_DIR, "..", "..", "..");

// The page is BUILT AT PUBLISH (bean 0b8c, #2230): derived from a graph kept on
// a branch, so it is never committed. Build it the way the site build does —
// `state:mount`, then `derive:publish`, then compose — so the compose below
// sees what a real build sees. Fails loudly, like the build, when unmounted.
// Where it cannot be built (no mount; a standalone layer with no root script),
// the tests that need the page fail on their own, by name, rather than this
// hook failing the whole file.
beforeAll(() => {
  const r = spawnSync("bun", ["run", "derive:publish"], { cwd: REPO, encoding: "utf8" });
  if (r.status !== 0) console.warn(`derive:publish did not build the page (is fsh-guts mounted? \`bun run state:mount\`):\n${r.stdout}${r.stderr}`);
});

function composeTo(opts: { staging?: boolean }): { dir: string; report: ReturnType<typeof compose> } {
  const dir = mkdtempSync(join(tmpdir(), "compose-"));
  return { dir, report: compose(dir, REPO, opts) };
}

describe("the real declaration withholds fsh-guts and nothing else", () => {
  /**
   * Against the REAL tree rather than a fixture. A fixture would prove the
   * function works on data the test wrote; the question that matters is
   * whether this repository's own declaration produces the intended set.
   */
  it("withholds exactly the fsh-guts page directory", () => {
    expect(withheldFromCanonical(REPO)).toEqual(["fsh-guts/"]);
  });
});

describe("composing honours the default, which is the restrictive one", () => {
  it("a compose with NO options withholds — the default is not permissive", () => {
    // THE ASSERTION THIS FILE EXISTS FOR. Passing no options is what
    // `docs-site.yml` does, so this is the canonical publisher's own call.
    const { dir, report } = composeTo({});
    try {
      expect(existsSync(join(dir, "fsh-guts", "index.md"))).toBe(false);
      expect(report.withheld).toContain("fsh-guts/index.md");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("an explicit staging compose includes the page", () => {
    const { dir, report } = composeTo({ staging: true });
    try {
      expect(existsSync(join(dir, "fsh-guts", "index.md"))).toBe(true);
      expect(report.withheld).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the two trees differ by exactly the withheld files", () => {
    const canon = composeTo({});
    const stage = composeTo({ staging: true });
    try {
      const a = Object.keys(canon.report.suppliedBy).length;
      const b = Object.keys(stage.report.suppliedBy).length;
      expect(b - a).toBe(canon.report.withheld.length);
      expect(canon.report.withheld.length).toBeGreaterThan(0);
    } finally {
      rmSync(canon.dir, { recursive: true, force: true });
      rmSync(stage.dir, { recursive: true, force: true });
    }
    // Two full composes of the real tree in one body: ~5 s on an idle runner,
    // so bun's 5 s default times it out under any load (measured 5.1-6.2 s).
  }, 30_000);
});

describe("the fsh-guts page reports the declaration gap rather than hiding it", () => {
  const dir = gutsDir(REPO);
  const files = dir ? gutsFiles(dir) : [];

  it("reads a non-empty corpus", () => {
    // Vacuity guard: every assertion below is over `files`.
    expect(dir).toBeDefined();
    expect(files.length).toBeGreaterThan(0);
  });

  it("a file that CANNOT carry front matter, with a tagged sidecar, is `sidecar`", () => {
    // The distinction the page is built on: a file whose format has no YAML
    // header cannot carry the tag, so filing it beside a `.md` that simply
    // omitted the line would make the format's limit and somebody's omission
    // look the same.
    //
    // This asserted `/\.(py|ts|sh)$/` until 2026-09-30, which is the SAME
    // too-narrow rule the generator had — so the test could not have caught
    // it, and `detangle-schema-viewer.html` read as `undeclared` from the day
    // it arrived. The invariant is "not markdown", not a list of extensions;
    // bean `q7ey`'s sweep of 33 archived PDFs is what made the gap visible.
    const viaSidecar = files.filter((f) => f.state === "sidecar");
    expect(viaSidecar.length).toBeGreaterThan(0);
    for (const f of viaSidecar) expect(f.rel.endsWith(".md")).toBe(false);
  });
});

describe("the generator writes exactly what the withholding protects", () => {
  /**
   * THE INVARIANT THE WHOLE DESIGN RESTS ON, and the one a reader cannot check
   * by eye. Two independent readers of the same declaration:
   *
   * - `pageRelPath` decides where the generator WRITES the page;
   * - `withheldFromCanonical` decides which path the canonical build WITHHOLDS.
   *
   * If they ever disagree — a literal reintroduced on either side, a ref moved
   * and one reader updated — the generator writes a page that nothing protects
   * and the canonical deploy publishes it. Nothing about that failure is
   * visible from the build: the page renders, the gate passes, the withholding
   * reports a file it protected, and the wrong file ships.
   *
   * So it is asserted as AGREEMENT rather than against either path's value. A
   * test naming `fsh-guts/index.md` twice would be a third copy of the literal
   * the `check:declared-paths` gate just removed.
   */
  it("the written page is covered by the withheld set", () => {
    const rel = pageRelPath(REPO);
    expect(rel).toBeDefined();
    expect(isWithheld(rel!, withheldFromCanonical(REPO))).toBe(true);
  });

  it("and it is genuinely absent from a canonical compose", () => {
    // The same fact from the other end, against the composed tree rather than
    // the path arithmetic, so a bug shared by both readers still fails here.
    const rel = pageRelPath(REPO)!;
    const { dir } = composeTo({});
    try {
      expect(existsSync(join(dir, rel))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("and present in a staging compose", () => {
    const rel = pageRelPath(REPO)!;
    const { dir } = composeTo({ staging: true });
    try {
      expect(existsSync(join(dir, rel))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
