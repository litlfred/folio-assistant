/**
 * `check:instance-themes` — the gate that truly covers the `themes` kind.
 *
 * Bean `z6xd`: three gates declared `@covers themes` while none of them
 * resolved a themes directory, so the kind read `covered` over ground nothing
 * reached. These tests hold the three things that made that possible.
 *
 * **The declaration must match the scan set.** The strongest test here is not
 * about this script at all: it asserts that exactly one script in the corpus
 * declares `@covers themes`, and that the one which does resolves a themes
 * directory. The original defect was written from a script's TITLE, which no
 * amount of reading the script would have caught.
 *
 * **One answer, not two.** The gate calls `instanceThemes` — the same
 * resolution every generator renders a theme reference through. A gate that
 * re-derived it would be free to disagree with the pages, which is `z6xd`'s own
 * defect one layer along, so a test asserts the import.
 *
 * **Kinds are reported and never graded.** who-iris owns a `webpage` and a
 * `publication` theme and no `sticky` one, and the board styles a card only
 * from `sticky` themes. #1584 held that open for the owner, so a green run over
 * a missing `sticky` is CORRECT here and a test pins it: a check that failed
 * would be answering a question its author was told not to.
 */
import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { coversIn } from "../audit-coverage.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
const SCRIPT = join("cat-harness", "scripts", "check-instance-themes.ts");
const SCRIPTS_DIR = join(REPO, "cat-harness", "scripts");

function run(...args: string[]): { status: number; out: string } {
  const r = spawnSync("bun", ["run", SCRIPT, ...args], { cwd: REPO, encoding: "utf-8" });
  return { status: r.status ?? -1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

/**
 * The kinds a script declares, read with **the auditor's own parser**.
 *
 * A first draft of this helper reimplemented it and got a different answer:
 * `coversIn` stops the kind list at the em-dash and treats the rest as prose,
 * so `@covers none — it reads `THEMES`, the platform's themes` declares
 * exactly `none`. The lookalike split the whole line on whitespace, found the
 * word "themes" in the REASON, and reported gen-themes-css as still claiming
 * the kind. That is the `vq8g` defect — a detector that recognises one form and
 * calls the corpus wrong — committed inside the test written to catch it. Use
 * the parser the verdict is actually computed from.
 */
function coversOf(file: string): string[] {
  return coversIn(readFileSync(join(SCRIPTS_DIR, file), "utf-8")) ?? [];
}

describe("the repository passes as committed", () => {
  test("`--check` is green", () => {
    const { status, out } = run("--check");
    expect(out).toContain("instances read");
    expect(status).toBe(0);
  });

  test("every count carries its denominator", () => {
    const { out } = run();
    expect(out).toMatch(/\.\.\.declaring a themes graph\s+\d+ of \d+/);
  });
});

describe("the declaration matches the scan set — z6xd itself", () => {
  test("exactly one script declares `@covers themes`, and it is this one", () => {
    const claimants = readdirSync(SCRIPTS_DIR)
      .filter((f) => f.endsWith(".ts"))
      .filter((f) => coversOf(f).includes("themes"));
    expect(claimants).toEqual(["check-instance-themes.ts"]);
  });

  test("the claimant actually resolves a themes directory", () => {
    // The defect was a declaration written from a script's TITLE. A claimant
    // that never asks for a directory of the kind it claims is that defect,
    // whatever its name says.
    const text = readFileSync(join(SCRIPTS_DIR, "check-instance-themes.ts"), "utf-8");
    expect(text).toContain("instanceDirectoriesForGraph");
    expect(text).toContain("THEMES_GRAPH_KIND");
  });

  test("the three former claimants declare `none` WITH a reason", () => {
    // `none` with an empty reason looks decided and is not — the same rule
    // `check:artefact-verification` applies to its own `none` entries.
    for (const f of ["check-theme-art.ts", "gen-themes-css.ts", "render-theme-sheet.ts"]) {
      // `coversIn` returns the KIND LIST only, so a correct `none` declaration
      // reads exactly ["none"] however long its reason is.
      expect(coversOf(f)).toEqual(["none"]);
      // ...and the reason must be there: `none` with nothing after it looks
      // decided and is not, the rule check:artefact-verification applies to
      // its own `none` entries.
      const line = readFileSync(join(SCRIPTS_DIR, f), "utf-8").match(/^ \* @covers none(.*)$/m);
      expect(line?.[1]?.trim().length ?? 0).toBeGreaterThan(8);
    }
  });
});

describe("one answer, not two", () => {
  test("it calls the runtime's own resolution rather than re-deriving it", () => {
    const text = readFileSync(join(SCRIPTS_DIR, "check-instance-themes.ts"), "utf-8");
    expect(text).toMatch(/import \{[^}]*instanceThemes[^}]*\} from "\.\.\/schemas\/theme-by-ref\.js"/s);
  });
});

describe("kinds are reported, never graded", () => {
  test("a declaring instance with no `sticky` theme is still green", () => {
    // who-iris owns `webpage` and `publication` and no `sticky`; the board
    // styles a card only from sticky themes. #1584 reserved that decision for
    // the owner, so this MUST pass. If it ever fails, somebody has graded an
    // authoring call.
    const { out, status } = run("--check");
    expect(out).toMatch(/kinds: .*webpage/);
    expect(out).not.toMatch(/sticky/);
    expect(status).toBe(0);
  });

  test("the kinds line is printed, so the gap is visible without being fatal", () => {
    expect(run().out).toMatch(/kinds: /);
  });
});

describe("could-not-determine is never green", () => {
  test("an empty declaring set is reported as a determined empty, not a pass", () => {
    // Today the set is 1, so this asserts the BRANCH exists rather than its
    // output: a future repository with no themes graph must not read as clean.
    const text = readFileSync(join(SCRIPTS_DIR, "check-instance-themes.ts"), "utf-8");
    expect(text).toContain("determined empty rather than a clean sweep");
    expect(text).toContain("nothing to check");
  });

  test("a themes module that throws refuses rather than counting zero", () => {
    const text = readFileSync(join(SCRIPTS_DIR, "check-instance-themes.ts"), "utf-8");
    expect(text).toContain("a module that throws is not a module that has no themes");
  });
});
