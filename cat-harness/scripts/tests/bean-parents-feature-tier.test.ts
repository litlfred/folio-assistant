/**
 * `feature` is a TIER, and widening `PARENT_TYPES` for it opens more than it
 * looks.
 *
 * `itka` finding 2, ruled by the owner 2026-09-22. `PARENT_TYPES` held
 * `{milestone, epic}`, so a task parented to a FEATURE was refused — while
 * `check-bean-parents.ts`'s own header quotes `beans prime`'s hierarchy,
 * `milestone -> epic -> feature -> task/bug`, to justify `ROOT_TYPES`. It
 * cited the sentence and contradicted it.
 *
 * ## What these tests are really for
 *
 * Not the widening — that is one entry in a Set. **The widening's side
 * effects.** `PARENT_TYPES` answers "may this type be somebody's parent",
 * which is not "may it be THIS bean's parent"; while it held only the two
 * root types the questions happened to coincide. Adding a middle tier
 * separates them, and on its own would silently permit an epic hanging from a
 * feature and a feature nesting in a feature — an INVERTED hierarchy where
 * every parent still has an allowed type.
 *
 * So the direction is asserted here, and the sibling file
 * `check-bean-parents.test.ts` keeps asserting the rules that were already
 * there. Measured at the ruling: 45 beans are typed `feature`, all parented
 * to an epic, NONE with a child — so nothing was being refused, and these are
 * the first tests to exercise the tier at all.
 *
 * @module scripts/tests/bean-parents-feature-tier
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkBeanParents, formatReport } from "../check-bean-parents.ts";

const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Same fixture shape as `check-bean-parents.test.ts`: [id, status, type, parent]. */
function store(beans: Array<[string, string, string, string]>): string {
  const root = mkdtempSync(join(tmpdir(), "beanfeature-"));
  made.push(root);
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

const problems = (root: string) => checkBeanParents(root).problems;

describe("a feature may hold work — the ruling", () => {
  test("a task parented to a FEATURE is accepted", () => {
    // The case the old PARENT_TYPES refused outright.
    expect(
      problems(
        store([
          ["ep1", "in-progress", "epic", ""],
          ["ft1", "in-progress", "feature", "ep1"],
          ["t1", "todo", "task", "ft1"],
        ]),
      ),
    ).toEqual([]);
  });

  test("a bug parented to a feature is accepted too — `task/bug` is one tier", () => {
    expect(
      problems(
        store([
          ["ep1", "in-progress", "epic", ""],
          ["ft1", "in-progress", "feature", "ep1"],
          ["b1", "todo", "bug", "ft1"],
        ]),
      ),
    ).toEqual([]);
  });

  test("a feature still needs a parent of its own — it is a tier, not a root", () => {
    const p = problems(store([["ft1", "todo", "feature", ""]]));
    expect(p.length).toBe(1);
    expect(p[0]).toContain("no `parent`");
  });
});

describe("the direction is checked, not just the type — what widening opened up", () => {
  test("an EPIC parented to a feature is refused", () => {
    // `feature` is now an allowed parent TYPE, so only a direction rule
    // catches this. Without one it would pass silently.
    const p = problems(
      store([
        ["ep1", "in-progress", "epic", ""],
        ["ft1", "in-progress", "feature", "ep1"],
        ["ep2", "in-progress", "epic", "ft1"],
      ]),
    );
    expect(p.length).toBe(1);
    expect(p[0]).toContain("hangs below");
  });

  test("a feature nested in a feature is refused", () => {
    const p = problems(
      store([
        ["ep1", "in-progress", "epic", ""],
        ["ft1", "in-progress", "feature", "ep1"],
        ["ft2", "in-progress", "feature", "ft1"],
      ]),
    );
    expect(p.length).toBe(1);
    expect(p[0]).toContain("hangs below");
  });

  test("a MILESTONE parented to an epic is refused — the inversion at the top", () => {
    const p = problems(
      store([
        ["ep1", "in-progress", "epic", ""],
        ["m1", "in-progress", "milestone", "ep1"],
      ]),
    );
    expect(p.length).toBe(1);
    expect(p[0]).toContain("hangs below");
  });

  test("...and the message names BOTH types, so the reader sees the inversion", () => {
    const p = problems(
      store([
        ["ep1", "in-progress", "epic", ""],
        ["ft1", "in-progress", "feature", "ep1"],
        ["ep2", "in-progress", "epic", "ft1"],
      ]),
    );
    expect(p[0]).toContain("`epic`");
    expect(p[0]).toContain("`feature`");
  });
});

describe("the epic-under-epic case keeps its OWN branch, and that is deliberate", () => {
  test("it still reports the epic-specific wording, not the generic direction one", () => {
    // The direction rule subsumes it. The branch survives so the baseline key
    // `epic-under-epic:<id>` keeps matching — folding it in would report
    // `d308`'s recorded entry as stale after a change that repaired nothing.
    const p = problems(
      store([
        ["ep1", "in-progress", "epic", ""],
        ["ep2", "in-progress", "epic", "ep1"],
      ]),
    );
    expect(p.length).toBe(1);
    expect(p[0]).toContain("not another epic");
    expect(p[0]).not.toContain("hangs below");
  });
});

describe("a type the hierarchy does not mention is not direction-checked", () => {
  test("an unranked type under an epic is accepted rather than guessed at", () => {
    // The rule declines to judge what `beans prime` never placed, instead of
    // inventing a position for it.
    expect(
      problems(
        store([
          ["ep1", "in-progress", "epic", ""],
          ["x1", "todo", "chore", "ep1"],
        ]),
      ),
    ).toEqual([]);
  });
});

describe("the summary never asserts a universal the next line refutes", () => {
  // The defect that survived INSIDE the repair. With `d308` baselined, the
  // check printed:
  //
  //   ✓ ... and no epic hangs from another
  //   · outstanding (baselined): ... `folio-assistant-zzmr` is an epic
  //
  // Verdict correct, claim too strong. A reader who stops at the tick — which
  // is what a tick is for — is misled.
  const report = (outstanding: string[]) =>
    formatReport({ store: "beans/defs", open: 3, problems: [], outstanding, stale: [] });

  test("with nothing baselined the unqualified claim stands", () => {
    const out = report([]);
    expect(out).toContain("no epic hangs from another");
    expect(out).not.toContain("no NEW epic");
  });

  test("with something baselined the claim is narrowed to NEW", () => {
    const out = report(["folio-assistant-d308: an epic's parent is ... `zzmr` is an epic"]);
    expect(out).toContain("no NEW epic hangs from another");
  });

  test("...and the outstanding entry is still printed, so it is not hidden either", () => {
    expect(report(["folio-assistant-d308: whatever"])).toContain("outstanding");
  });

  test("the tick and the counterexample never appear together unqualified", () => {
    // The exact two-line contradiction, asserted as a property rather than as
    // a string match on one message.
    const out = report(["some epic under some epic"]);
    const ticksUniversally = /✓[^\n]*no epic hangs from another/.test(out);
    const listsACounterexample = /· outstanding/.test(out);
    expect(ticksUniversally && listsACounterexample).toBe(false);
  });
});
