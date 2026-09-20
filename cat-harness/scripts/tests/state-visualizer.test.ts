/**
 * The state dashboards: their route, and what each page can and cannot claim.
 *
 * @module scripts/tests/state-visualizer
 *
 * The generator writes COMMITTED pages under this instance's site dir, so
 * `state:visualizer:check` is the staleness gate and this file is the
 * behaviour gate. It reads what the generator produced rather than re-deriving
 * it the same way, and it must never assert a COUNT of beans or epics — those
 * move whenever anybody works, and a test that fails because somebody closed a
 * bean is a test that gets deleted.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { instanceRootFor, siteDirFor } from "../../schemas/cat-harness.ts";
import "../../schemas/folio-graph-kind.ts";

const ROOT = instanceRootFor(import.meta.dir);
const SITE = join(ROOT, siteDirFor(ROOT));

/** A dashboard's committed page. */
const read = (graph: string) =>
  readFileSync(join(SITE, graph, "index.html"), "utf-8");
const has = (graph: string) => existsSync(join(SITE, graph, "index.html"));

describe("the route is the policy, not this generator's choice", () => {
  test("the visualiser is AT the directory's own URL, one per declared state graph", () => {
    for (const id of ["beans", "todos", "qa", "health", "issue-marks", "uploads"]) {
      expect(has(id)).toBe(true);
    }
  });

  test("no stub segment, and no invented one", () => {
    // Bean `o7eq` ruling 1: the segment is the instance's NAME, never its
    // stub. Two earlier drafts published under `folio-assistant`, which names
    // the published graph DOCUMENT and not the instance. Ruling 3 then elides
    // this instance's own name, because its docs are the published root.
    expect(existsSync(join(SITE, "folio-assistant"))).toBe(false);
    expect(existsSync(join(SITE, "state"))).toBe(false);
    expect(existsSync(join(SITE, "state-visualizer"))).toBe(false);
    // And no segment BENEATH the directory either. `harness-requirements`
    // names `<base-url>/beans` as the obligation, so a page one level deeper
    // leaves that URL a 404 and does not meet it.
    expect(existsSync(join(SITE, "beans", "dashboard"))).toBe(false);
  });

  test("the segment is the declared ID, because two paths basename alike", () => {
    // `qa` is `test/results/` and `health` is `test/health/results/`. Taking
    // the basename — which the sibling schema visualiser does, correctly, for
    // its own graph — would give both the segment `results`, and one dashboard
    // would silently overwrite the other.
    expect(has("qa")).toBe(true);
    expect(has("health")).toBe(true);
    expect(existsSync(join(SITE, "results", "index.html"))).toBe(false);
  });
});

describe("each page reads the projection that already exists", () => {
  test("relative to itself, at the depth its own route implies", () => {
    expect(read("beans")).toContain('content="../assets/beans/index.json"');
    expect(read("todos")).toContain('content="../assets/todos/index.json"');
  });

  test("and that projection is really there", () => {
    // The generator publishes no data of its own — `gen-docs-pages.ts` does.
    // A second copy would be two answers to what the work plan holds.
    expect(existsSync(join(SITE, "assets", "beans", "index.json"))).toBe(true);
    expect(existsSync(join(SITE, "assets", "todos", "index.json"))).toBe(true);
  });

  test("a graph page names only its own graph", () => {
    // Asserted on the META TAG, not the bare string: the renderer is INLINED
    // into every page and its source names both metas, because querying for
    // them is its job. An earlier draft asserted the string and failed on the
    // renderer's own code — a true fact about the file and nothing about the
    // page.
    const meta = (html: string, name: string) => new RegExp(`<meta name="${name}"`).test(html);
    expect(meta(read("beans"), "fa-beans-src")).toBe(true);
    expect(meta(read("beans"), "fa-todo-src")).toBe(false);
    expect(meta(read("todos"), "fa-todo-src")).toBe(true);
    expect(meta(read("todos"), "fa-beans-src")).toBe(false);
  });
});

describe("what a page may claim", () => {
  test("a graph with no projection says so instead of rendering zeros", () => {
    const html = read("qa");
    expect(html).toContain("declared");
    expect(html).toContain("2krx");
    // No container in the BODY, so the renderer never mounts. Matched as the
    // element rather than the attribute name, which the inlined renderer also
    // contains.
    expect(/<div class="fa-workplan" data-fa-workplan>/.test(html)).toBe(false);
    expect(/<meta name="fa-(beans|todo)-src"/.test(html)).toBe(false);
  });

  test("every page carries the registry, so the set is navigable from any of them", () => {
    // There is no index above these: `<base>/` is the documentation site's.
    // The way across is on each page, which is what makes them registered
    // sub-visualisations rather than six unrelated pages.
    for (const id of ["beans", "todos", "qa"]) {
      expect(read(id)).toContain("State graphs this harness declares");
    }
    // The link to beans is on every page EXCEPT the beans page, which is the
    // next assertion and the reason this one cannot simply check all three.
    expect(read("todos")).toContain('href="../beans/"');
    expect(read("qa")).toContain('href="../beans/"');
  });

  test("a page never links to itself", () => {
    // A link to here is a control that does nothing, and a reader who clicks
    // it learns only that it did nothing. The current row is plain text.
    expect(read("beans")).not.toContain('href="../beans/"');
    expect(read("todos")).not.toContain('href="../todos/"');
    expect(read("beans")).toContain('<span class="sv-here">beans</span>');
  });

  test("the renderer and its styles are inlined, so no asset is fetched", () => {
    const html = read("beans");
    expect(html).toContain("mountWorkPlan");
    expect(html).toContain("--fa-wp-surface");
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain("cdn.");
  });

  test("every page carries the do-not-hand-edit notice", () => {
    for (const id of ["beans", "todos", "qa"]) {
      expect(read(id)).toContain("Do not hand-edit");
    }
  });
});
