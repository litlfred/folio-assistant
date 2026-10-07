/**
 * The tools graph has a surface of its own, and it stays separate from skills.
 *
 * Owner, 2026-09-21: **"keep tools and skills separate!"**
 *
 * They were not. `cat-harness.json`'s `tools` entry declared its documentation
 * as `cat-harness/docs/concepts/skills.md` — a page titled *"Skills & roles"* with no
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
 *
 * The tests of this file that read the whole checkout (joins every Tool to the
 * skills of every instance in the checkout) live in
 * `test/tools-viewer-checkout.test.ts` (bean `7zz1`): standing alone,
 * cat-harness has none of it.
 */
import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

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

const { tools } = (await import("../../tools/index.js")) as { tools: () => unknown[] };
const rows = toolRows(tools());

describe("the page reports the join in both directions", () => {

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

  it("carries no Liquid syntax, because Jekyll renders it as a page", () => {
    // A Tool description quoting a Liquid include tag reached this page and
    // Jekyll tried to execute it: the staging build died on `tools/index.md`
    // while every repository gate was green (PR #1489). Say it in words.
    const body = html.replace(/^---\n[\s\S]*?\n---\n/, "");
    expect(body).not.toMatch(/\{%|\{\{/);
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
});

/**
 * Bean `qgjh`: a `satisfies` that names a skill with a published instruction
 * page is a link; one without a page stays code rather than a link that 404s.
 */
describe("satisfies links what resolves (qgjh)", () => {
  const TOOLS_PAGE = pageRelPath(REPO)!;
  const withSkill = rows.find((r) => r.satisfies.length > 0)!;
  const s = withSkill.satisfies[0]!;
  const line = (md: string): string => md.split("\n").find((l) => l.startsWith(`| \`${withSkill.id}\``))!;

  it("links a skill whose page exists, relative to the page it sits on", () => {
    expect(line(page(rows, new Set([s]), new Set([s]), TOOLS_PAGE))).toContain(
      `[\`${s}\`](../reference/skill-instructions/${s}.html)`,
    );
  });

  it("leaves a skill with no page as code", () => {
    const l = line(page(rows, new Set([s]), new Set(), TOOLS_PAGE));
    expect(l).toContain(`\`${s}\``);
    expect(l).not.toContain(`[\`${s}\`]`);
  });
});
