/**
 * The derived indexes index the artefacts — not their renderings, not their
 * supporting pages, and not a directory that holds neither.
 *
 * @module scripts/tests/gen-docs-auto.test
 *
 * Both of the defects pinned here were live in drafts of the generator, and
 * both had the same shape: a second answer to a question the repository
 * already answers.
 *
 *   1,522 skills — every declared directory walked, including `docs/`, which
 *                  holds a generated markdown rendering of every skill.
 *     227 skills — the skill directories walked RECURSIVELY, so
 *                  `skills/<package>/<skill>/<page>.md` counted as a skill.
 *     219 skills — `knownSkills()`'s own number, reached by asking
 *                  `skillMdDirs()` instead of re-deriving what it encodes.
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { TYPES, autoDocPage, declaredDirectories, owningDirectory } from "../gen-docs-auto.ts";
import { knownSkills } from "../known-skills.ts";
import { readDeclaration, siteDirFor } from "../../schemas/cat-harness.ts";

const INSTANCE = resolve(import.meta.dir, "..", "..");
const SITE = join(INSTANCE, siteDirFor(INSTANCE));
const HANDLER = readDeclaration(INSTANCE)?.name;

describe("the type registry", () => {
  it("every type declares the graph kind its artefacts live in", () => {
    // Not optional: without it the walk reaches `docs/`, and a RENDERING of an
    // artefact gets counted as a second artefact.
    expect(TYPES.length).toBeGreaterThan(0);
    for (const t of TYPES) {
      expect(t.graph).toBeTruthy();
      expect(t.id).toMatch(/^[a-z]+(\/[a-z-]+)*$/);
      expect(t.extracts.length).toBeGreaterThan(20);
    }
  });

  it("`toc` is not a type, and that is a decision rather than an omission", () => {
    // Owner withdrew it in the session that proposed it: a table of contents
    // is a document-order notion and a sub-graph has no single order.
    expect(TYPES.map((t) => t.id)).not.toContain("toc");
    expect(TYPES.map((t) => t.id)).not.toContain("index/toc");
  });

  it("no two types share an id", () => {
    const ids = TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("index/skills agrees with knownSkills, exactly", () => {
  const items = TYPES.find((t) => t.id === "index/skills")!.collect();

  it("the same set of names, neither more nor fewer", () => {
    // The ratchet for both historical defects at once. A superset means the
    // walk has reached renderings or supporting pages; a subset means it has
    // stopped seeing a declared directory.
    const mine = new Set(items.map((i) => i.name));
    const known = knownSkills(INSTANCE);
    expect([...known].filter((n) => !mine.has(n))).toEqual([]);
    expect([...mine].filter((n) => !known.has(n))).toEqual([]);
  });

  it("every item names a file that exists", () => {
    const repo = resolve(INSTANCE, "..");
    for (const i of items) expect(existsSync(join(repo, i.path))).toBe(true);
  });

  it("items are in a deterministic order", () => {
    const paths = items.map((i) => i.path);
    expect(paths).toEqual([...paths].sort((a, b) => a.localeCompare(b, "en")));
  });
});

describe("index/processes extracts what a BPMN declares about itself", () => {
  const items = TYPES.find((t) => t.id === "index/processes")!.collect();

  it("finds the diagrams, and each carries its lanes and activity count", () => {
    expect(items.length).toBeGreaterThan(20);
    for (const i of items) {
      expect(i.path.endsWith(".bpmn")).toBe(true);
      expect(Number(i.facts?.activities ?? "-1")).toBeGreaterThanOrEqual(0);
    }
  });

  it("at least one names the skills its activities reference", () => {
    // The repo requires `<folio:skill ref>` on every activity, so an index
    // that surfaced none would mean the extraction, not the corpus, is wrong.
    expect(items.some((i) => (i.facts?.skills ?? "").length > 0)).toBe(true);
  });

  it("summaries are one sentence, not a whole documentation block", () => {
    for (const i of items) {
      if (!i.summary) continue;
      expect(i.summary.length).toBeLessThanOrEqual(230);
      expect(i.summary).not.toContain("\n");
    }
  });
});

describe("owningDirectory picks the most specific declaration", () => {
  const dirs = [
    { id: "outer", path: "cat-harness/skills" },
    { id: "inner", path: "cat-harness/skills/workflows" },
    { id: "other", path: "who-iris/skills" },
  ];

  it("an inner declaration wins over the outer one that also contains the file", () => {
    // Attributing a workflow to `cat-harness` would leave the workflow
    // directory's own declaration indexing nothing while looking populated.
    expect(owningDirectory("cat-harness/skills/workflows/x.bpmn", dirs)?.id).toBe("inner");
  });

  it("a file only the outer declaration contains goes to the outer one", () => {
    expect(owningDirectory("cat-harness/skills/todo-manager.md", dirs)?.id).toBe("outer");
  });

  it("a file under no declaration is unattributed rather than guessed", () => {
    expect(owningDirectory("somewhere/else/x.md", dirs)).toBeUndefined();
  });

  it("a prefix that is not a path boundary does not match", () => {
    // `who-iris/skills` must not claim `who-iris/skills-extra/…`.
    expect(owningDirectory("who-iris/skills-extra/x.md", dirs)).toBeUndefined();
  });
});

describe("declaredDirectories is filtered and existence-checked", () => {
  it("returns only directories declaring the asked-for graph", () => {
    const kg = declaredDirectories("cat-harness");
    expect(kg.length).toBeGreaterThan(1);
    // `docs/` declares the `docs` graph, not `cat-harness` — it is the
    // directory whose inclusion produced the 1,522 count.
    expect(kg.map((d) => d.id)).not.toContain("docs");
  });

  it("an undeclared graph yields nothing rather than everything", () => {
    expect(declaredDirectories("no-such-graph-kind")).toEqual([]);
  });
});

describe("the emitted page", () => {
  it("carries the ownership line the pruner reads", () => {
    // `orphanSubjectPages` establishes ownership from this line. Without it a
    // page could never be pruned, and with a wrong one it could be pruned
    // from the wrong place.
    const html = autoDocPage(TYPES[0]!, [], "who-iris-skills", "who-iris/skills", []);
    expect(html).toContain('var SCOPE = "who-iris-skills";');
  });

  it("says it is an index and not the documentation", () => {
    // The authoring obligation is stated on the artefact, not only in the
    // skill — a reader who lands here from a search never opened the skill.
    const html = autoDocPage(TYPES[0]!, [], "", undefined, []);
    expect(html).toContain("not the documentation");
    expect(html).toContain("docs-auto");
  });

  it("an item with no description says so rather than showing blank", () => {
    const html = autoDocPage(TYPES[0]!, [{ path: "a/b.md", name: "b" }], "", undefined, []);
    expect(html).toContain("no description in the artefact");
  });
});

describe("what is published", () => {
  it("a sub-graph page exists for who-iris, the sparse case", () => {
    // The owner asked for the handler to be exercised on who-iris, which
    // contributes ONE skill. A thin index is a real answer; the test is that
    // it is rendered at all rather than dropped as uninteresting.
    expect(HANDLER).toBeTruthy();
    const p = join(SITE, HANDLER!, "docs-auto", "index", "skills", "who-iris-skills", "index.html");
    expect(existsSync(p)).toBe(true);
    expect(readFileSync(p, "utf-8")).toContain("iris-dspace");
  });

  it("no page is published for a sub-graph that contributes nothing", () => {
    // `dh4f` as a nav entry. `who-iris-skills` holds no BPMN, so it gets a
    // skills page and must NOT get a processes page.
    const p = join(SITE, HANDLER!, "docs-auto", "index", "processes", "who-iris-skills");
    expect(existsSync(p)).toBe(false);
  });
});
