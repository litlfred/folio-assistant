/**
 * The committed bean store holds only states the CLI can produce.
 *
 * Found 2026-09-18 while auditing bean references (#203): one bean carried
 * `status: done`, which is not in the CLI's vocabulary —
 * `draft | todo | in-progress | completed | scrapped`. Nothing rejected it,
 * so it sat in the shared work plan reading as a status while matching none
 * of the filters an agent uses to find work. `beans list --ready` and every
 * status query silently skipped it.
 *
 * The store is committed and read by every sibling session, so a malformed
 * entry is not a local mess — it is a hole in the shared plan.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { repoRootFor } from "../../schemas/cat-harness.js";

// The `bean-defs` node of the bean graph (schemas/bean-graph.ts), not the
// graph root — `beans/` itself holds only `beans.json`.
//
// The REPOSITORY's, reached from this instance. `beans/` is declared
// `scope: "repository"` because the work plan belongs to the checkout rather
// than to any instance in it; `"../../beans/defs"` was written when the two
// roots were one directory, and after the move it named a path that has never
// existed — so `beanFiles()` returned `[]` and every hygiene assertion below
// passed over an empty set. The emptiness guard is the only reason that was
// visible at all, which is what it is for.
const BEANS = join(repoRootFor(join(import.meta.dir, "../..")), "beans/defs");

/** Exactly what `beans update --status` accepts. */
const VALID = new Set(["draft", "todo", "in-progress", "completed", "scrapped"]);

function beanFiles(): string[] {
  if (!existsSync(BEANS)) return [];
  return readdirSync(BEANS).filter((f) => f.endsWith(".md"));
}

describe("bean store hygiene", () => {
  test("the store is not empty — otherwise these tests prove nothing", () => {
    // A guard against the suite passing because it found no beans to check.
    expect(beanFiles().length).toBeGreaterThan(10);
  });

  test("every bean's status is one the CLI can produce", () => {
    const bad: string[] = [];
    for (const f of beanFiles()) {
      const m = readFileSync(join(BEANS, f), "utf-8").match(/^status:\s*(.+)$/m);
      if (!m) {
        bad.push(`${f}: no status line`);
        continue;
      }
      const status = m[1].trim();
      if (!VALID.has(status)) bad.push(`${f}: "${status}"`);
    }
    expect(bad).toEqual([]);
  });

  test("every bean has a title", () => {
    const untitled = beanFiles().filter(
      (f) => !/^title:\s*\S/m.test(readFileSync(join(BEANS, f), "utf-8")),
    );
    expect(untitled).toEqual([]);
  });
});
