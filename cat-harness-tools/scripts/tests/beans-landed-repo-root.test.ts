/**
 * `beans-landed` tests that read the aggregate repository's own root — the
 * root-declared `beans/` store — moved here from
 * `cat-harness/scripts/tests/beans-landed.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";

import { openBeans } from "../../../cat-harness/scripts/beans-landed.js";

describe("openBeans", () => {
  test("reads the real store through its declaration, and excludes epics and closed beans", () => {
    const bs = openBeans();
    expect(bs.length).toBeGreaterThan(0);
    expect(bs.every((b) => b.type !== "epic" && ["todo", "in-progress", "draft"].includes(b.status))).toBe(true);
  });
});
