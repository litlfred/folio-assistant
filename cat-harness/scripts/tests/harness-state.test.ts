/**
 * `check-harness-state` — the four families, and the denominator each prints.
 *
 * Bean `h1wq`. Most of what is asserted here is that a family which finds
 * nothing says WHAT IT LOOKED AT, because three of the four are determined
 * empties on this tree and a check over a two-node corpus that prints "clean"
 * has said almost nothing.
 */
import { describe, expect, test } from "bun:test";

import {
  healthProducerCurrent,
  issueMarkEdits,
  interactionProfilesRead,
  todoProcessRefs,
  writesSidecar,
} from "../check-harness-state.js";
import { checkerHash } from "../../test/health/run.js";

const FAMILIES = [healthProducerCurrent, todoProcessRefs, issueMarkEdits, interactionProfilesRead];

describe("every family reports its own denominator", () => {
  test("each examined something, or said it could not determine", () => {
    // §1.2a of `generalise-the-fix`. A family at `examined: 0` with no
    // `unreadable` reason is the exact shape this repository has paid for three
    // times — a filter over nothing that exits clean.
    for (const f of FAMILIES.map((fn) => fn())) {
      if (f.unreadable) {
        expect(f.unreadable.length).toBeGreaterThan(0);
        continue;
      }
      // A STORED record not in this checkout (bean 0dav) is the other
      // could-not-determine, and it must say so just as loudly.
      if (f.stored) {
        expect(f.stored.length).toBeGreaterThan(0);
        expect(f.examined).toBe(0);
        continue;
      }
      expect(f.examined, `${f.id} examined nothing and gave no reason`).toBeGreaterThan(0);
    }
  });

  test("each carries a summary phrased as what a FAILURE means", () => {
    for (const f of FAMILIES.map((fn) => fn())) {
      expect(f.summary.length).toBeGreaterThan(40);
      expect(f.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test("ids are unique, so two families cannot collide in the sidecar", () => {
    const ids = FAMILIES.map((fn) => fn().id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the corpus, as it stands", () => {
  test("the committed health result is from the CURRENT checker", () => {
    // It was not, when this was written: the result recorded `760c506fd051`
    // against a checker at `1401c8090bf5`, and its staging remedy still told a
    // reader to apply `staging:cleanup` to an orphan — which `7umv` had proved
    // cannot reach one. Stale advice presented as the fix.
    const f = healthProducerCurrent();
    // With the report off `main` (bean 0dav) there is nothing here to judge,
    // and the family must SAY so rather than pass on an empty list.
    if (f.stored) expect(f.examined).toBe(0);
    else expect(f.examined).toBeGreaterThan(0);
    expect(f.findings).toEqual([]);
  });

  test("every todo process reference resolves", () => {
    expect(todoProcessRefs().findings).toEqual([]);
  });

  test("every issue mark accounts for edits", () => {
    expect(issueMarkEdits().findings).toEqual([]);
  });

  test("every declared interaction profile is read by something", () => {
    expect(interactionProfilesRead().findings).toEqual([]);
  });
});

describe("the health family asks the producer for its own hash", () => {
  test("it compares against checkerHash(), not a re-derivation", () => {
    // The first version recomputed `sha256(run.ts)` and could NEVER have
    // passed: the field records `checkerHash`, which hashes three modules
    // because any of them can alter a verdict. A re-derived hash makes a check
    // that cannot pass, and a check that cannot pass gets deleted.
    const h = checkerHash();
    expect(h).toMatch(/^[0-9a-f]{12}$/);
    // The family is green, which is only possible if it is reading this value.
    expect(healthProducerCurrent().findings).toEqual([]);
  });
});

describe("nodesOf dedupes — two instance roots can name one directory", () => {
  test("the todo count is the number of items, not double it", () => {
    // Measured: the repository root and `cat-harness` both resolve `todos` to
    // `./todos`, so a naive walk reported 3 items as 6 and one planted defect
    // twice. A doubled denominator is worse than a wrong one — it reads as
    // coverage while measuring the same file again.
    const f = todoProcessRefs();
    expect(f.examined).toBeLessThan(6);
    expect(f.examined).toBeGreaterThan(0);
  });
});

describe("the gate form writes nothing (bean r7v6)", () => {
  // Measured 2026-10-01: `check:harness-state:check` over an absent results
  // tree recreated `harness-state.qa-results.json`. The judge writes nothing;
  // only the producer form does. Pinned both ways, as bo44 pins
  // `skill-register`'s `writesReport`.
  test("--check writes no sidecar", () => {
    expect(writesSidecar(["bun", "check-harness-state.ts", "--check"])).toBe(false);
  });
  test("the producer form still writes it", () => {
    expect(writesSidecar(["bun", "check-harness-state.ts"])).toBe(true);
  });
});
