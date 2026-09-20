/**
 * No call site takes the FIRST directory of a graph without saying it expects
 * one — and saying it means an accessor that refuses, not an index.
 *
 * ## The history this guards
 *
 * `directoryForGraph` returned the first declaration silently and was excised
 * on 2026-09-20 after costing three bugs in a day. `directoriesForGraph`'s doc
 * comment then settled where the singular assumption belongs, and that
 * decision stands:
 *
 * > *A caller that genuinely wants one writes `directoriesForGraph(...)[0]`,
 * > so the assumption is visible where it is made and greppable across the
 * > repo.*
 *
 * Visible, yes. **Checked, no.** `[0]` states "I expect one home" and then
 * quietly takes the first when there are four — and `schemas` HAD four, with
 * four call sites indexing it, for as long as nobody looked. Bean `a02m`.
 *
 * ## Why a test and not a review habit
 *
 * The last fix of this shape was `schema-nodes.ts`, one site, and it left
 * thirty-one. A defect that is fixed one occurrence at a time is a defect that
 * comes back, because the fix is knowledge in one person's head at one moment.
 * `directoryForGraph` and `instanceDirectoryForGraph` make the assumption
 * enforceable; this makes it enforced.
 *
 * @module scripts/tests/no-silent-first-directory
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/** The repository root — this rule is about every instance, not one. */
const REPO = resolve(import.meta.dir, "../../..");

/** Directories that are not source we control. */
const SKIP = new Set(["node_modules", "_kg", "_site", "dist", "build"]);

/**
 * `directoriesForGraph(…)[0]` in CODE.
 *
 * Deliberately not matched inside a comment: the migrated call sites each
 * explain what they used to be, naming the old form, and a check that cannot
 * be written about is a check nobody can leave a note beside. Comment lines
 * are stripped before matching rather than excluded by a cleverer pattern,
 * because a pattern that tries to tell code from prose in one regex is the
 * kind of thing that silently stops matching.
 */
const OFFENDING = /directoriesForGraph\([^;]*?\)\s*\[\s*0\s*\]/;

/** Strip `//` and `/* *​/` comments, crudely but predictably. */
function withoutComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => (/^\s*(\/\/|\*)/.test(l) ? "" : l))
    .join("\n");
}

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.startsWith(".") || SKIP.has(e)) continue;
      const p = join(dir, e);
      if (statSync(p).isDirectory()) {
        walk(p);
        continue;
      }
      if (e.endsWith(".ts")) out.push(p);
    }
  };
  walk(REPO);
  return out.sort();
}

describe("a call site that wants ONE directory says so with an accessor that refuses", () => {
  const files = sourceFiles();

  test("the scan found source — otherwise the assertion below proves nothing", () => {
    // A floor, not a count. The failure this guards against is the scan
    // matching nothing and the suite reporting a clean sweep over it, which is
    // the same shape as the defect the whole bean is about.
    expect(files.length).toBeGreaterThan(200);
  });

  test("no module indexes the first declared directory", () => {
    const offenders: string[] = [];
    for (const f of files) {
      // This file quotes the offending form in its own documentation.
      if (f.endsWith("no-silent-first-directory.test.ts")) continue;
      if (OFFENDING.test(withoutComments(readFileSync(f, "utf-8")))) {
        offenders.push(relative(REPO, f));
      }
    }
    // Named, not counted: a failure should say which file to open. The message
    // is part of the check — "2 offenders" sends the next person grepping for
    // the same thing this test already knows.
    expect(
      offenders,
      "use directoryForGraph (refuses when there are several), " +
        "instanceDirectoryForGraph (the one at this instance's own root), " +
        "or directoriesForGraph and scan them all",
    ).toEqual([]);
  });
});
