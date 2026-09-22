/**
 * A `publish: "staging-only"` visualisation reaches a preview and never the
 * canonical deploy.
 *
 * Owner, 2026-09-21, on `fsh-guts`: **render it, exclude it from canonical.**
 * They had asked to see a graph whose own declaration says it is
 * *"DELIBERATELY absent from the rendered site … so that something can be kept
 * without being published"*, and both halves were meant.
 *
 * ## Why these assertions are shaped the way they are
 *
 * This feature fails in two directions and they are not symmetric. Withholding
 * too much loses a page from a preview, where the person looking at the
 * preview sees it missing. Withholding too little **publishes content somebody
 * chose not to publish**, which is visible nowhere in the build and is not
 * undone by deleting the page afterwards.
 *
 * So the default is tested as hard as the feature: a compose with NO options
 * must withhold. A test that only ever passed an explicit flag would pass just
 * as happily if the default were reversed, which is the single most expensive
 * thing that could be wrong here.
 *
 * The layer-root guard has its own test for the same reason. A visualiser ref
 * sitting directly in `cat-harness/docs/` is an ordinary declaration, and
 * without the guard one such ref marked staging-only would withhold `""` —
 * emptying the canonical deploy. That is a whole-site outage reachable from a
 * one-word declaration, and it is exactly the kind of thing that is obvious
 * once written down and invisible until then.
 *
 * @module cat-harness/scripts/tests/staging-only-publish.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { compose, isWithheld, withheldFromCanonical, withheldPathFor } from "../compose-docs.js";
import { gutsDir, gutsFiles, page, pageRelPath } from "../gen-fsh-guts-viz.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");

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

  it("never withholds a layer root, whatever is declared", () => {
    // A property of the OUTPUT: an empty string or a bare "/" would match
    // every path. True today because nothing declares a ref at a layer root —
    // which is exactly why the guard itself is tested directly below.
    for (const w of withheldFromCanonical(REPO)) {
      expect(w).not.toBe("");
      expect(w).not.toBe("/");
      expect(w.length).toBeGreaterThan(1);
    }
  });
});

describe("withheldPathFor — the layer-root guard, reachable", () => {
  /**
   * THE CASE NO TEST OVER THE REAL TREE CAN REACH. Nothing here declares a
   * visualiser ref directly in `cat-harness/docs/`, so the guard is dead code
   * from the corpus's point of view — and the failure it prevents is the
   * canonical deploy composing to an empty site, reachable from adding one
   * word to an ordinary declaration.
   */
  it("an index.* at the LAYER ROOT withholds only itself", () => {
    expect(withheldPathFor("index.md")).toBe("index.md");
    expect(withheldPathFor("index.html")).toBe("index.html");
  });

  it("an index.* in a subdirectory withholds that directory", () => {
    expect(withheldPathFor("fsh-guts/index.md")).toBe("fsh-guts/");
    expect(withheldPathFor("a/b/index.html")).toBe("a/b/");
  });

  it("a non-index page withholds only itself, at any depth", () => {
    expect(withheldPathFor("notes.md")).toBe("notes.md");
    expect(withheldPathFor("a/notes.md")).toBe("a/notes.md");
    // `index` as a stem but not the whole basename — not an index page.
    expect(withheldPathFor("a/index-of-things.md")).toBe("a/index-of-things.md");
  });

  it("what it returns can never match the whole tree", () => {
    // The property the guard exists for, over every shape above.
    for (const r of ["index.md", "index.html", "a/index.md", "notes.md", "a/b/index.html"]) {
      const w = withheldPathFor(r);
      expect(w).not.toBe("");
      expect(w).not.toBe("/");
      expect(isWithheld("some/other/page.md", [w])).toBe(false);
    }
  });
});

describe("isWithheld distinguishes a file from a directory prefix", () => {
  it("a directory entry matches everything beneath it", () => {
    expect(isWithheld("fsh-guts/index.md", ["fsh-guts/"])).toBe(true);
    expect(isWithheld("fsh-guts/assets/app.js", ["fsh-guts/"])).toBe(true);
  });

  it("a directory entry does not match a sibling with a shared prefix", () => {
    // `fsh-guts-notes.md` starts with `fsh-guts` and is a different file. The
    // trailing slash is what makes the prefix test safe, so it is asserted.
    expect(isWithheld("fsh-guts-notes.md", ["fsh-guts/"])).toBe(false);
  });

  it("a file entry matches only itself", () => {
    expect(isWithheld("a.md", ["a.md"])).toBe(true);
    expect(isWithheld("a.md.bak", ["a.md"])).toBe(false);
    expect(isWithheld("sub/a.md", ["a.md"])).toBe(false);
  });

  it("nothing is withheld when the list is empty", () => {
    expect(isWithheld("fsh-guts/index.md", [])).toBe(false);
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
  });

  it("a withheld file is never also reported as supplied", () => {
    // The report has to stay coherent: naming a file the tree does not carry
    // is worse than not reporting it, because a reader checks the report.
    const { dir, report } = composeTo({});
    try {
      for (const w of report.withheld) expect(report.suppliedBy[w]).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the workflows sit on the right side of the default", () => {
  /**
   * Read from the REAL workflow files, the way `gates.ts` derives its list
   * from the gate workflow rather than from a copy of it. A test restating
   * what the workflow should say is a second place for it to be wrong.
   */
  const staging = readFileSync(join(REPO, ".github/workflows/feature-staging.yml"), "utf-8");
  const canonical = readFileSync(join(REPO, ".github/workflows/docs-site.yml"), "utf-8");

  const composeLines = (yml: string): string[] =>
    yml.split("\n").filter((l) => l.includes("compose-docs.ts") && !l.trimStart().startsWith("#"));

  it("the preview composes with --staging", () => {
    const lines = composeLines(staging);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l).toContain("--staging");
  });

  it("the canonical publisher composes WITHOUT it", () => {
    const lines = composeLines(canonical);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(l).not.toContain("--staging");
  });
});

describe("the fsh-guts page reports the declaration gap rather than hiding it", () => {
  const dir = gutsDir(REPO);
  const files = dir ? gutsFiles(dir) : [];

  it("reads a non-empty corpus", () => {
    // Vacuity guard: every assertion below is over `files`.
    expect(dir).toBeDefined();
    expect(files.length).toBeGreaterThan(0);
  });

  it("classifies every file into exactly one of the three states", () => {
    for (const f of files) expect(["declared", "sidecar", "undeclared"]).toContain(f.state);
  });

  it("a script with a tagged sidecar is `sidecar`, never `undeclared`", () => {
    // The distinction the page is built on: a `.py` CANNOT carry YAML front
    // matter, so filing it beside a `.md` that simply omitted the line would
    // make the format's limit and somebody's omission look the same.
    const viaSidecar = files.filter((f) => f.state === "sidecar");
    expect(viaSidecar.length).toBeGreaterThan(0);
    for (const f of viaSidecar) expect(f.rel).toMatch(/\.(py|ts|sh)$/);
  });

  it("the page names the undeclared count rather than only the total", () => {
    const n = files.filter((f) => f.state === "undeclared").length;
    const html = page(files, "https://example.invalid");
    expect(html).toContain(`| ${n} |`);
    if (n > 0) expect(html).toContain("undeclared");
  });

  it("every file in the corpus appears on the page", () => {
    const html = page(files, "https://example.invalid");
    for (const f of files) {
      const name = f.rel.slice(f.group === "." ? 0 : f.group.length + 1);
      expect(html).toContain(name);
    }
  });

  it("the page says it is not published, since that is not obvious from it", () => {
    expect(page(files, "https://example.invalid")).toContain("not on the published site");
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
