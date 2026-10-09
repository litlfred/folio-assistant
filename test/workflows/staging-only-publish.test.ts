/**
 * A `publish: "staging-only"` visualisation reaches a preview and never the
 * canonical deploy — the half of that property this repository's workflows
 * hold.
 *
 * Owner, 2026-09-21, on `fsh-guts`: **render it, exclude it from canonical.**
 * The composer withholds by default and the preview opts in with `--staging`;
 * this pins that each publish workflow sits on its side of that default.
 *
 * Moved here from cat-harness's `scripts/tests/staging-only-publish.test.ts`
 * (owner's ruling 2026-10-09, litlfred/folio-assistant#2521, ruling 1(c)): it
 * reads this repository's own `.github/workflows/`. The composer's default,
 * and the fsh-guts page, are tested beside them in cat-harness.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

/** This index repository's root — where `.github/workflows/` lives. */
const REPO = resolve(import.meta.dir, "..", "..");

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
