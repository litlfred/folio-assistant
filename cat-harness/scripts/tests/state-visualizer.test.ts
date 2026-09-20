/**
 * The state visualiser's output shape.
 *
 * @module scripts/tests/state-visualizer
 *
 * This generator has **no `--check`** — it writes into `_site`, a build output
 * that is not committed, so there is no committed copy for a staleness gate to
 * disagree with, and a gate over an absent tree could only ever report every
 * file missing. That is the shape this repository calls a check that is wrong,
 * and `gates.test.ts` caught the `state:visualizer:check` script the first
 * draft shipped with.
 *
 * So this file is the gate instead, and it has to earn that: it runs the real
 * generator against the real repository and asserts what a reader depends on,
 * rather than re-deriving the answer the same way the generator does. The one
 * thing it must never do is assert a COUNT of beans or of epics — those move
 * whenever anybody works, and a test that fails because somebody closed a bean
 * is a test that gets deleted.
 */
import { describe, expect, test, beforeAll } from "bun:test";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HERE = import.meta.dir;
const SCRIPT = join(HERE, "..", "state-visualizer.ts");
const REPO = join(HERE, "..", "..", "..");

let OUT: string;

beforeAll(async () => {
  OUT = mkdtempSync(join(tmpdir(), "state-viz-"));
  const proc = Bun.spawn(["bun", "run", SCRIPT, "--out-dir", OUT], {
    cwd: REPO,
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`generator exited ${code}: ${await new Response(proc.stderr).text()}`);
  }
});

/** Where this repository's harness instance publishes. Read, never composed. */
const STUB = "folio-assistant";

describe("the route an instantiated harness gets", () => {
  test("an index at <stub>/state-visualizer/", () => {
    expect(existsSync(join(OUT, STUB, "state-visualizer", "index.html"))).toBe(true);
  });

  test("a page per declared state graph beneath it", () => {
    for (const id of ["beans", "todos", "qa", "health", "uploads"]) {
      expect(existsSync(join(OUT, STUB, "state-visualizer", id, "index.html"))).toBe(true);
    }
  });

  test("the instance SEGMENT is used, so two instances cannot collide", () => {
    // `cat-bootstrap` declares no state graph and still gets an index saying
    // so — the honest answer about that instance, and not a 404.
    const other = join(OUT, "cat-bootstrap", "state-visualizer", "index.html");
    expect(existsSync(other)).toBe(true);
    expect(readFileSync(other, "utf-8")).toContain("declares no state graph");
  });
});

describe("the data it publishes", () => {
  test("beans and todos are written under <stub>/state/", () => {
    expect(existsSync(join(OUT, STUB, "state", "beans.json"))).toBe(true);
    expect(existsSync(join(OUT, STUB, "state", "todos.json"))).toBe(true);
  });

  test("the bean index carries items and findings, and declares what it is", () => {
    const doc = JSON.parse(readFileSync(join(OUT, STUB, "state", "beans.json"), "utf-8"));
    expect(doc.$schema).toBe("folio-bean-index/v1");
    expect(Array.isArray(doc.items)).toBe(true);
    expect(Array.isArray(doc.findings)).toBe(true);
    // A shape assertion, not a count: every item carries the fields the
    // renderer reads, whatever the work plan happens to hold today.
    for (const key of ["id", "title", "status", "type", "parent", "updatedAt"]) {
      expect(doc.items[0]).toHaveProperty(key);
    }
  });

  test("no title carries a YAML-escaped apostrophe", () => {
    // The defect this visualiser surfaced on its first render: single-quoted
    // front matter writes `'` as `''`, and stripping only the outer quotes
    // published `the knowledge graph''s own structure` to a page.
    const doc = JSON.parse(readFileSync(join(OUT, STUB, "state", "beans.json"), "utf-8"));
    expect(doc.items.filter((i: { title: string }) => i.title.includes("''"))).toEqual([]);
  });
});

describe("the pages are self-contained and resolve nothing at runtime", () => {
  const read = (...p: string[]) => readFileSync(join(OUT, STUB, "state-visualizer", ...p), "utf-8");

  test("the renderer and its styles are inlined, so no asset is fetched", () => {
    const html = read("index.html");
    expect(html).toContain("fa-workplan");
    // A marker from work-plan.js and one from work-plan.css, proving both were
    // inlined rather than linked.
    expect(html).toContain("mountWorkPlan");
    expect(html).toContain("--fa-wp-surface");
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain("cdn.");
  });

  test("data paths are RELATIVE to the page, at the right depth", () => {
    expect(read("index.html")).toContain('content="../state/beans.json"');
    expect(read("beans", "index.html")).toContain('content="../../state/beans.json"');
  });

  test("a graph page names only its own graph", () => {
    // A beans page carrying the todo meta would render the combined view and
    // quietly stop being a per-graph page.
    //
    // Asserted on the META TAG, not on the bare string: the renderer is
    // INLINED into every page and its source names both metas, because
    // querying for them is its job. The first draft of this test asserted the
    // string and failed on the renderer's own code — a true fact about the
    // file and nothing at all about the page.
    const meta = (html: string, name: string) =>
      new RegExp(`<meta name="${name}"`).test(html);
    expect(meta(read("beans", "index.html"), "fa-beans-src")).toBe(true);
    expect(meta(read("beans", "index.html"), "fa-todo-src")).toBe(false);
    expect(meta(read("todos", "index.html"), "fa-todo-src")).toBe(true);
    expect(meta(read("todos", "index.html"), "fa-beans-src")).toBe(false);
  });

  test("a declared graph with no renderer says so instead of rendering empty", () => {
    const html = read("qa", "index.html");
    expect(html).toContain("declared");
    expect(html).toContain("2krx");
    // No CONTAINER in the body, so the renderer never mounts and cannot show
    // zeros for a graph nothing read. Matched as the element rather than as
    // the attribute name, which the inlined renderer also contains.
    expect(/<div class="fa-workplan" data-fa-workplan>/.test(html)).toBe(false);
    expect(/<meta name="fa-(beans|todo)-src"/.test(html)).toBe(false);
  });

  test("every page carries the do-not-hand-edit notice", () => {
    for (const p of [["index.html"], ["beans", "index.html"], ["qa", "index.html"]]) {
      expect(read(...p)).toContain("Do not hand-edit");
    }
  });
});
