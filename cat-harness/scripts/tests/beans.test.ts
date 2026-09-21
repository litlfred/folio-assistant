/**
 * The bean reader, and the three things about it that are easy to get wrong.
 *
 * @module scripts/tests/beans
 *
 * Front-matter UNESCAPING, the direction of `blocking:`, and the finding rules
 * computed from it. Each of the three has already been wrong once here: the
 * first shipped `the knowledge graph''s own structure` to a published page,
 * and the other two are the kind of defect that still computes — every finding
 * lands, each one naming the wrong bean.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beanFindings, blockedBy, hasExpiry, isOpen, readBeans } from "../beans.ts";

/** A repository-shaped temp dir with a bean store in it. */
function store(beans: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "beans-test-"));
  const defs = join(root, "beans", "defs");
  mkdirSync(defs, { recursive: true });
  writeFileSync(
    join(root, "beans", "beans.json"),
    JSON.stringify({
      name: "t",
      directories: [{ id: "defs", path: "defs", graphKinds: ["bean-defs"] }],
    }),
  );
  for (const [name, body] of Object.entries(beans)) {
    writeFileSync(join(defs, `${name}.md`), body);
  }
  return root;
}

function bean(id: string, fm: string, body = "Body."): string {
  return `---\n# ${id}\n${fm}\n---\n\n${body}\n`;
}

describe("front matter is unescaped, not merely unquoted", () => {
  test("a YAML single-quoted scalar undoubles its apostrophes", () => {
    const root = store({
      a: bean("t-a", `title: 'KG: the knowledge graph''s own structure'\nstatus: todo\ntype: task`),
    });
    expect(readBeans(root)![0]!.title).toBe("KG: the knowledge graph's own structure");
  });

  test("a double-quoted scalar undoes its backslashes instead", () => {
    const root = store({ a: bean("t-a", `title: "a \\"quoted\\" word"\nstatus: todo\ntype: task`) });
    expect(readBeans(root)![0]!.title).toBe('a "quoted" word');
  });

  test("an unquoted scalar is left exactly as written", () => {
    const root = store({ a: bean("t-a", `title: plain title\nstatus: todo\ntype: task`) });
    expect(readBeans(root)![0]!.title).toBe("plain title");
  });

  test("a lone apostrophe inside an unquoted scalar survives", () => {
    // The naive fix — strip every quote character — eats this one.
    const root = store({ a: bean("t-a", `title: don't strip me\nstatus: todo\ntype: task`) });
    expect(readBeans(root)![0]!.title).toBe("don't strip me");
  });
});

describe("`file` is relative to the root it was read with", () => {
  test("no repository-name prefix, so an edit link resolves", () => {
    // `repoRootFor` is an unconditional `join(root, "..")`. Recomputing it on
    // a root the caller already resolved prefixed every path with the
    // repository's own directory name, and every link built from it pointed
    // one level too high.
    const root = store({ a: bean("t-a", `title: a\nstatus: todo\ntype: task`) });
    expect(readBeans(root)![0]!.file).toBe("beans/defs/a.md");
  });
});

describe("no store is not an empty store", () => {
  test("a repository with no bean graph reads as null", () => {
    const root = mkdtempSync(join(tmpdir(), "beans-empty-"));
    expect(readBeans(root)).toBeNull();
  });

  test("a declared store with no beans in it reads as an empty list", () => {
    expect(readBeans(store({}))).toEqual([]);
  });
});

describe("`blocking:` names the blocked, and sits on the blocker", () => {
  const root = store({
    a: bean("t-a", `title: blocker\nstatus: todo\ntype: task\nblocking:\n    - t-b`),
    b: bean("t-b", `title: blocked\nstatus: todo\ntype: task`),
  });
  const beans = readBeans(root)!;

  test("the sequence is read off the blocker", () => {
    expect(beans.find((x) => x.id === "t-a")!.blocking).toEqual(["t-b"]);
    expect(beans.find((x) => x.id === "t-b")!.blocking).toEqual([]);
  });

  test("blockedBy inverts it, so the blocked bean can name its blocker", () => {
    // Inverting this wrongly is silent: every finding still computes and each
    // one names the wrong bean. That is why the inversion has one home.
    expect(blockedBy(beans).get("t-b")).toEqual(["t-a"]);
    expect(blockedBy(beans).get("t-a")).toBeUndefined();
  });
});

describe("an expiry is prose in the body, not a field", () => {
  const root = store({
    a: bean("t-a", `title: with\nstatus: todo\ntype: task`, "Waiting. **expires**: 2026-10-19."),
    b: bean("t-b", `title: without\nstatus: todo\ntype: task`, "Waiting on the owner."),
  });
  const beans = readBeans(root)!;

  test("it is found wherever in the body it is written", () => {
    expect(hasExpiry(beans.find((x) => x.id === "t-a")!)).toBe(true);
    expect(hasExpiry(beans.find((x) => x.id === "t-b")!)).toBe(false);
  });
});

describe("findings", () => {
  test("a live block with no expiry is reported once per bean it blocks", () => {
    const root = store({
      a: bean("t-a", `title: blocker\nstatus: in-progress\ntype: task\nblocking:\n    - t-b`),
      b: bean("t-b", `title: blocked\nstatus: todo\ntype: task`),
    });
    const f = beanFindings(readBeans(root)!);
    expect(f).toHaveLength(1);
    expect(f[0]!.kind).toBe("blocked-without-expiry");
    expect(f[0]!.bean).toBe("t-a");
    expect(f[0]!.blocks).toBe("t-b");
  });

  test("a live block that STATES an expiry is not reported", () => {
    // Falsification in the other direction: adding the expiry must clear it,
    // or the finding is measuring something else.
    const root = store({
      a: bean("t-a", `title: b\nstatus: in-progress\ntype: task\nblocking:\n    - t-b`,
              "**expires**: 2026-10-19."),
      b: bean("t-b", `title: blocked\nstatus: todo\ntype: task`),
    });
    expect(beanFindings(readBeans(root)!)).toEqual([]);
  });

  test("a CLOSED blocker holding an OPEN bean is the sharper finding, and only that one", () => {
    const root = store({
      a: bean("t-a", `title: done\nstatus: completed\ntype: task\nblocking:\n    - t-b`),
      b: bean("t-b", `title: blocked\nstatus: in-progress\ntype: task`),
    });
    const f = beanFindings(readBeans(root)!);
    expect(f.map((x) => x.kind)).toEqual(["blocker-closed"]);
  });

  test("a closed blocker holding a CLOSED bean is nobody's problem", () => {
    const root = store({
      a: bean("t-a", `title: done\nstatus: completed\ntype: task\nblocking:\n    - t-b`),
      b: bean("t-b", `title: also done\nstatus: completed\ntype: task`),
    });
    expect(beanFindings(readBeans(root)!)).toEqual([]);
  });

  test("blocking a bean that does not exist is its own finding", () => {
    const root = store({
      a: bean("t-a", `title: b\nstatus: todo\ntype: task\nblocking:\n    - t-gone`,
              "**expires**: 2026-10-19."),
    });
    const f = beanFindings(readBeans(root)!);
    expect(f.map((x) => x.kind)).toEqual(["blocking-unknown"]);
  });

  test("nothing time-relative is computed, so the same store gives the same findings", () => {
    // The projection is gated on exact content. A finding that read the clock
    // would change the file on every build and the gate would fire forever.
    const root = store({
      a: bean("t-a", `title: b\nstatus: in-progress\ntype: task\nblocking:\n    - t-b`),
      b: bean("t-b", `title: blocked\nstatus: todo\ntype: task`),
    });
    const beans = readBeans(root)!;
    expect(JSON.stringify(beanFindings(beans))).toBe(JSON.stringify(beanFindings(beans)));
  });
});

describe("isOpen", () => {
  test("todo and in-progress are work; completed and scrapped are history", () => {
    const root = store({
      a: bean("t-a", `title: a\nstatus: todo\ntype: task`),
      b: bean("t-b", `title: b\nstatus: in-progress\ntype: task`),
      c: bean("t-c", `title: c\nstatus: completed\ntype: task`),
      d: bean("t-d", `title: d\nstatus: scrapped\ntype: task`),
    });
    expect(readBeans(root)!.filter(isOpen).map((x) => x.id)).toEqual(["t-a", "t-b"]);
  });
});
