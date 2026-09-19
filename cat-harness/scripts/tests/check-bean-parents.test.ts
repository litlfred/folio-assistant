/**
 * The guard has to FAIL on each defect it claims to catch.
 *
 * Written against temp stores rather than the real one on purpose: the real
 * corpus is clean, so a test that only asserts "the repo passes" would go on
 * passing if the checker were gutted to `return { problems: [] }`. Each case
 * here perturbs one thing and names what must appear in the finding.
 *
 * @module scripts/tests/check-bean-parents
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkBeanParents } from "../check-bean-parents.ts";
import { repoRootFor } from "../../schemas/cat-harness.js";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** A store of beans, each given as [id, status, type, parent]. */
function store(beans: Array<[string, string, string, string]>): string {
  const root = mkdtempSync(join(tmpdir(), "beanparents-"));
  made.push(root);
  // `root` IS a repository root — a fixture has no enclosing instance, so
  // `repoRootFor(root)` is `/tmp` and every store this made was the same one.
  const dir = join(root, "beans", "defs");
  mkdirSync(dir, { recursive: true });
  for (const [id, status, type, parent] of beans) {
    writeFileSync(
      join(dir, `${id}.md`),
      `---\n# ${id}\ntitle: '${id} title'\nstatus: ${status}\ntype: ${type}\n` +
        (parent ? `parent: ${parent}\n` : "") +
        `---\n\nbody\n`,
    );
  }
  return root;
}

const EPIC: [string, string, string, string] = ["ep1", "in-progress", "epic", ""];

describe("every open bean belongs to an epic", () => {
  test("passes when each open bean names a real epic", () => {
    const r = checkBeanParents(store([EPIC, ["a1", "todo", "task", "ep1"]]));
    expect(r.problems).toEqual([]);
    expect(r.open).toBe(1);
  });

  test("fails on an open bean with no parent, and names it", () => {
    const r = checkBeanParents(store([EPIC, ["a1", "todo", "task", ""]]));
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toContain("a1");
    expect(r.problems[0]).toContain("no `parent`");
  });

  test("fails on a parent that names no bean", () => {
    // Worse than no parent: the roadmap omits the child rather than listing
    // it under Miscellaneous, so it disappears from the plan entirely.
    const r = checkBeanParents(store([EPIC, ["a1", "todo", "task", "ghost"]]));
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toContain("names no bean");
  });

  test("fails on a parent that is not an epic", () => {
    const r = checkBeanParents(store([
      EPIC,
      ["a1", "todo", "task", "ep1"],
      ["a2", "todo", "task", "a1"],
    ]));
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0]).toContain("a2");
    expect(r.problems[0]).toContain("not an epic");
  });

  test("a CLOSED bean needs no parent — history is not back-filled", () => {
    const r = checkBeanParents(store([
      EPIC,
      ["done1", "completed", "task", ""],
      ["drop1", "scrapped", "task", ""],
    ]));
    expect(r.problems).toEqual([]);
    expect(r.open).toBe(0);
  });

  test("an epic needs no parent of its own — epics are roots", () => {
    expect(checkBeanParents(store([EPIC, ["ep2", "todo", "epic", ""]])).problems).toEqual([]);
  });

  test("no bean store is reported as such, never as a pass", () => {
    const root = mkdtempSync(join(tmpdir(), "beanparents-empty-"));
    made.push(root);
    const r = checkBeanParents(root);
    // `store: null` is the third state. It exits 0 because there is nothing to
    // check, and the report says so rather than claiming the plan is sound.
    expect(r.store).toBeNull();
    expect(r.problems).toEqual([]);
  });

  test("the real corpus passes", () => {
    const r = checkBeanParents(repoRootFor(join(import.meta.dir, "../..")));
    expect({ orphans: r.problems }).toEqual({ orphans: [] });
    expect(r.open).toBeGreaterThan(50);
  });
});
