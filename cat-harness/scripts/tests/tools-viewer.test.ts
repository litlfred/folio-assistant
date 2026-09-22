/**
 * The tools graph has a surface of its own, and it stays separate from skills.
 *
 * Owner, 2026-09-21: **"keep tools and skills separate!"**
 *
 * They were not. `cat-harness.json`'s `tools` entry declared its documentation
 * as `cat-harness/docs/skills.md` — a page titled *"Skills & roles"* with no
 * tools section in it. The tools graph had no documentation of its own and
 * named a page about something else.
 *
 * ## The assertion shape that matters here
 *
 * The defect was invisible to every check because the declared path **existed**.
 * An absent `docs` ref is a legible gap; a ref that resolves REPORTS COVERAGE.
 * So a test asserting only "the docs ref resolves to a file" would have passed
 * on the broken declaration, which is exactly how it survived.
 *
 * What is asserted instead is that the two graphs' documentation are DIFFERENT
 * pages, and that the tools one is about tools. The second half cannot be fully
 * mechanised — "is this page about this subject" is not decidable — so it is
 * approximated honestly: the page must mention the graph's own vocabulary, and
 * the assertion says so rather than pretending to more.
 *
 * @module cat-harness/scripts/tests/tools-viewer.test
 */
import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { declarationPathIn } from "../../schemas/cat-harness.js";
import { docsLayers } from "../compose-docs.js";
import { page, pageRelPath, skillIds, toolRows } from "../gen-tools-viz.js";

const REPO = resolve(import.meta.dir, "..", "..", "..");
/**
 * The base docs layer — asked, never spelled.
 *
 * It was `join(REPO, "cat-harness", "docs")`, and `site-dir-single-answer`
 * refused it. Rightly: the site root has moved twice (beans `x4a6`, `wggr`),
 * and a test carrying its own copy keeps checking where the site used to be
 * while reporting a pass.
 *
 * Worth noting HOW this reached CI. The pre-push checks that caught the other
 * two failures were named gate scripts, and this guard is a UNIT TEST — so a
 * targeted run of `check:*` scripts skipped it entirely. `bun test` is itself
 * a gate, and a subset of the gate set is not the gate set.
 */
const DOCS = docsLayers(REPO).layers.find((l) => !l.repositoryScoped)!.dir;

const decl = JSON.parse(readFileSync(declarationPathIn(join(REPO, "cat-harness"))!, "utf-8")) as {
  directories?: { id?: string; graphKinds?: string[]; coverage?: { docs?: string; visualiser?: unknown } }[];
};
const entryFor = (kind: string) => (decl.directories ?? []).find((e) => (e.graphKinds ?? []).includes(kind));

const { tools } = (await import("../../tools/index.js")) as { tools: () => unknown[] };
const rows = toolRows(tools());

describe("the tools graph is not documented by the skills page", () => {
  it("has a corpus at all", () => {
    // Vacuity guard — every assertion below is over `rows`.
    expect(rows.length).toBeGreaterThan(0);
  });

  it("declares a docs page", () => {
    expect(entryFor("tools")?.coverage?.docs).toBeDefined();
  });

  /**
   * A CHECK THAT IS NOT HERE, AND WHY — so it is not built a third time.
   *
   * While fixing this defect I recorded a hypothesis on bean `yunp`: *"a `docs`
   * page shared by two entries whose graph kinds are disjoint is at least
   * suspicious, and that is computable."* It was written as the weaker,
   * mechanisable form of "is this page about this graph".
   *
   * IT WAS BUILT AND THE CORPUS FALSIFIED IT IMMEDIATELY. Three hits, all
   * legitimate:
   *
   * | page | shared by | why it is fine |
   * |---|---|---|
   * | `beans-and-todos.md` | `beans`, `todos` | one page about both, and its name says so |
   * | `document-ingestion.md` | `uploads`, `library` | the two ends of one process |
   * | `subgraph-viewers.md` | `schemas`, `library` | a page about the viewer mechanism itself |
   *
   * Three of three false positives — and it would not have caught the defect
   * it was written for either, because `skills.md` was never another entry's
   * DECLARED docs. `tools` pointed at a page that merely describes skills.
   *
   * So "disjoint graph kinds" does not imply "unrelated subjects", and a check
   * that fires only on legitimate cases is worse than none: it trains a reader
   * to skip it. The guard that does work is the vocabulary approximation
   * below, which is honest about approximating.
   */

  it("and it resolves", () => {
    const d = entryFor("tools")!.coverage!.docs!;
    expect(existsSync(join(REPO, d))).toBe(true);
  });

  it("and it is about tools — approximated, and the approximation is stated", () => {
    // "Is this page about this subject" is not mechanically decidable. What IS
    // checkable: the page uses the graph's own vocabulary. A page that never
    // says `defineTool` or `satisfies` is not documentation of this graph
    // whatever its title claims, which is the property that failed before.
    const d = entryFor("tools")!.coverage!.docs!;
    const text = readFileSync(join(REPO, d), "utf-8");
    expect(text).toContain("defineTool");
    expect(text).toContain("satisfies");
    expect(text.toLowerCase()).toContain("tool");
  });

  it("the skills page is NOT silently repurposed as the tools page", () => {
    // Guards the fix from being undone by editing skills.md instead: even if
    // somebody added a tools section there, the declaration must still name a
    // page of its own.
    expect(entryFor("tools")?.coverage?.docs).not.toContain("skills.md");
  });
});

describe("every satisfies names a skill that exists", () => {
  const known = skillIds(REPO);

  it("the skill corpus is non-empty", () => {
    // Without this the join below passes vacuously — the `dh4f` shape, where a
    // probe sweeps nothing and reports a clean run.
    expect(known.size).toBeGreaterThan(0);
  });

  it("no tool advertises a capability the graph cannot locate", () => {
    const refs = [...new Set(rows.flatMap((r) => r.satisfies))];
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.filter((s) => !known.has(s))).toEqual([]);
  });

  it("and every tool says what it satisfies", () => {
    // A different gap from a dangling ref: the tool exists and nothing says
    // what capability it is a way of exercising.
    expect(rows.filter((r) => r.satisfies.length === 0).map((r) => r.id)).toEqual([]);
  });
});

describe("the page reports the join in both directions", () => {
  it("states that all resolve, rather than only warning when they do not", () => {
    // "Nothing unresolved" and "the check did not run" are different facts,
    // and a section that appeared only on failure could not tell them apart.
    const html = page(rows, skillIds(REPO));
    expect(html).toContain("Does every `satisfies` name a skill that exists?");
    expect(html).toMatch(/Yes — all \*\*\d+\*\*/);
  });

  it("names the unresolved ones when there are any", () => {
    // Exercised with a planted gap rather than waiting for a real one, so the
    // failure path is not dead code that has never rendered.
    const planted = [...rows, { ...rows[0]!, id: "planted", satisfies: ["no-such-skill"] }];
    const html = page(planted, skillIds(REPO));
    expect(html).toContain("no-such-skill");
    expect(html).toContain("`planted`");
    expect(html).not.toMatch(/Yes — all \*\*\d+\*\*/);
  });

  it("names a tool that satisfies nothing, as a separate finding", () => {
    const planted = [...rows, { ...rows[0]!, id: "orphan", satisfies: [] }];
    const html = page(planted, skillIds(REPO));
    expect(html).toContain("satisfy no skill at all");
    expect(html).toContain("`orphan`");
  });
});

describe("the rendered page", () => {
  const html = page(rows, skillIds(REPO));

  it("keeps the direction of the relation explicit", () => {
    // The one sentence that does the conceptual work. Without it the page is a
    // table that a reader may take either way round.
    expect(html).toContain("from a tool to a skill");
  });

  it("lists every tool", () => {
    for (const r of rows) expect(html).toContain(`\`${r.id}\``);
  });

  it("is markdown, not HTML wearing front matter", () => {
    const body = html.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/<style>[\s\S]*?<\/style>/g, "");
    expect(body).toMatch(/^## /m);
    expect(body).toMatch(/^\|---/m);
    expect(body).not.toMatch(/<table\b/);
    expect(body).not.toMatch(/<h[12]\b/);
  });

  it("declares no theme CSS of its own", () => {
    const css = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
    expect(css).not.toContain("body{");
    expect(css).not.toContain("prefers-color-scheme");
  });
});

describe("the generator writes where the declaration says", () => {
  it("resolves its page path from the declaration, not a literal", () => {
    const rel = pageRelPath(REPO);
    expect(rel).toBeDefined();
    expect(existsSync(join(DOCS, rel!))).toBe(true);
  });

  it("and the committed page is current", () => {
    // The gate runs this too; asserting it here means a stale page fails the
    // unit suite rather than only the gate, which is where it is noticed first.
    const rel = pageRelPath(REPO)!;
    expect(readFileSync(join(DOCS, rel), "utf-8")).toBe(page(rows, skillIds(REPO)));
  });
});
