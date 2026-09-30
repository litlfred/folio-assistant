/**
 * Every fsh-guts record's `bean:` names a bean that exists (#1168 B8).
 *
 * `BeanIdSchema` checks the SHAPE of the id; this checks that it resolves. A
 * retirement record whose bean is gone points a reader at nothing — the one
 * reader who most needs the reasons is the one about to reinstate the field.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { Glob } from "bun";

const REPO = resolve(import.meta.dir, "..", "..", "..");

function beanIds(): Set<string> {
  const out = new Set<string>();
  for (const rel of new Glob("**/*.md").scanSync({ cwd: join(REPO, "beans", "defs") })) {
    const m = /^([a-z0-9]+(?:-[a-z0-9]+)*?-[a-z0-9]{4})--/.exec(basename(rel));
    if (m) out.add(m[1]!);
  }
  return out;
}

describe("fsh-guts bean references resolve", () => {
  const ids = beanIds();
  const refs = [...new Glob("**/*.md").scanSync({ cwd: join(REPO, "fsh-guts") })].flatMap((rel) => {
    const m = /^bean:\s*(\S+)\s*$/m.exec(readFileSync(join(REPO, "fsh-guts", rel), "utf-8").slice(0, 4000));
    return m ? [{ rel, bean: m[1]! }] : [];
  });

  test("the corpus is non-empty, so the assertion below is not vacuous", () => {
    expect(ids.size).toBeGreaterThan(0);
    expect(refs.length).toBeGreaterThan(0);
    expect(readdirSync(join(REPO, "fsh-guts")).length).toBeGreaterThan(0);
  });

  test("every `bean:` names a bean in the work plan", () => {
    const dangling = refs.filter((r) => !ids.has(r.bean)).map((r) => `${r.rel} → ${r.bean}`);
    expect(dangling).toEqual([]);
  });
});
