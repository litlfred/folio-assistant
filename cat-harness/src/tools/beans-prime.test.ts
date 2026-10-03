/**
 * The no-CLI fallback of the work-plan primer reads the DECLARED bean store
 * (bean `gz47`). It read `beans/*.md`, where the only Markdown is the
 * directory README, so an agent without the `beans` CLI was primed with one
 * "bean": the README.
 */
import { describe, expect, test } from "bun:test";
import { join, resolve } from "node:path";

import { beanDefsDir } from "../../scripts/beans.js";
import { repoRootFor } from "../../schemas/cat-harness.js";
import { primeFromDir } from "./beans-prime.js";

const REPO = repoRootFor(resolve(import.meta.dir, "../.."));
const listed = (text: string) => text.split("\n").filter((l) => l.startsWith("- "));

describe("beans-prime's fallback reads the declared store", () => {
  test("the declared bean-defs directory primes the real beans", () => {
    const dir = beanDefsDir(REPO);
    expect(dir, "this checkout declares a bean-defs node").not.toBeNull();
    // A floor, not a count: the store has well over a thousand beans.
    expect(listed(primeFromDir(dir!)).length).toBeGreaterThan(100);
  });

  test("the old spelling primed the README alone — the defect this replaced", () => {
    expect(listed(primeFromDir(join(REPO, "beans"))).length).toBe(1);
  });
});
