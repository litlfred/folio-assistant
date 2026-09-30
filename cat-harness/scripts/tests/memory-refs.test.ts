/**
 * A memory entry's `roles:` and `agents:` name things that exist (#1168 B8).
 *
 * `memoryForRoles` hands an entry to every lane whose role it names, and
 * `memoryForAgent` to every agent it names. A typo in either does not fail:
 * the entry simply reaches nobody, which from the outside looks exactly like
 * an entry nobody needed. This resolves both.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Glob } from "bun";

import { list, parseFrontMatter } from "../../schemas/front-matter.ts";

const REPO = resolve(import.meta.dir, "..", "..", "..");

const roleIds = (): Set<string> => {
  const doc = JSON.parse(readFileSync(join(REPO, "cat-harness", "scenarios", "roles.json"), "utf-8")) as {
    roles?: { id: string }[] | Record<string, unknown>;
  };
  const r = doc.roles ?? {};
  return new Set(Array.isArray(r) ? r.map((x) => x.id) : Object.keys(r));
};

describe("memory entries name roles and agents that exist", () => {
  const roles = roleIds();
  const entries = [...new Glob("**/*.md").scanSync({ cwd: join(REPO, "memory") })]
    .filter((rel) => rel !== "README.md")
    .map((rel) => ({ rel, fm: parseFrontMatter(readFileSync(join(REPO, "memory", rel), "utf-8")).fm }))
    .filter((e) => e.fm["$schema"] === "folio-memory/v1")
    // An ARCHIVED entry reaches nobody on purpose — the third state between
    // "reaches everybody" and "deleted" (agent-memory skill). Its names are
    // history, and may name an agent that no longer exists.
    .filter((e) => e.fm["archived"] !== "true");

  test("the corpus is non-empty, so the assertions below are not vacuous", () => {
    expect(roles.size).toBeGreaterThan(0);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => list(e.fm, "roles").length > 0)).toBe(true);
  });

  test("every `roles:` value is a declared role", () => {
    const dangling = entries.flatMap((e) =>
      list(e.fm, "roles").filter((r) => !roles.has(r)).map((r) => `${e.rel} → ${r}`),
    );
    expect(dangling).toEqual([]);
  });

  test("every `agents:` value is a declared subagent", () => {
    const dangling = entries.flatMap((e) =>
      list(e.fm, "agents")
        .filter((a) => !existsSync(join(REPO, ".claude", "agents", `${a}.md`)))
        .map((a) => `${e.rel} → ${a}`),
    );
    expect(dangling).toEqual([]);
  });
});
