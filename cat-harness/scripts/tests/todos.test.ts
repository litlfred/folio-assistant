/**
 * The todo graph is declared, present, and READ.
 *
 * All three, because the failure mode is the middle one going missing.
 * `schemas/todo.ts`, `schemas/todo-graph.ts` and the `todos` / `todo-items`
 * graph kinds existed before any todo did, and `harness.json` did not
 * declare `todos/`. A schema ahead of its graph is harmless. A **declared
 * directory nothing reads** is the bean `dh4f` defect — a consumer scans
 * nothing and reports a clean run over it.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readDeclaration, repoRootFor } from "../../schemas/cat-harness.js";
import { BEAN_GRAPH_FILE, parseBeanGraph } from "../../schemas/bean-graph.js";
import { TODO_GRAPH_FILE, parseTodoGraph } from "../../schemas/todo-graph.js";
import { ROOT, TODO_ROOT, readTodos, todoDirs } from "../todos.js";
import { siteDirFor } from "../../schemas/cat-harness.ts";
import { workflowFiles } from "../known-skills.js";
import { loadProcessModel } from "../../src/workflow/process-model.js";

describe("the declaration and the directory agree", () => {
  test("`harness.json` declares a `todos` graph", () => {
    const d = readDeclaration(ROOT);
    const entry = d?.directories?.find((x) => x.graphKinds?.includes("todos"));
    expect(entry?.path).toBe("todos/");
  });

  test("the declared directory EXISTS — declare only what exists", () => {
    expect(existsSync(TODO_ROOT())).toBe(true);
    expect(existsSync(join(TODO_ROOT(), TODO_GRAPH_FILE))).toBe(true);
  });

  test("its own declaration parses, and names every node", () => {
    // FOUR now, not two. `boards` and `positions` joined on 2026-09-21 (bean
    // `8hg7`), and they are the OMG split rather than two more todo folders:
    // a board is the semantic model — what it shows — and the positions are
    // its Diagram Interchange, where each note was drawn. They share a `path`
    // deliberately, because the layout belongs beside the thing it lays out.
    const g = parseTodoGraph(
      JSON.parse(readFileSync(join(TODO_ROOT(), TODO_GRAPH_FILE), "utf8")),
    );
    expect(g.directories.map((d) => d.id).sort()).toEqual([
      "boards",
      "feedback",
      "items",
      "positions",
    ]);
  });

  test("every declared node directory is on disk", () => {
    // The `dh4f` shape one level down: a node declared inside the graph but
    // absent, so the reader walks nothing and reports no todos.
    //
    // This caught its own author. `todos/feedback/` existed locally and was
    // never committed — git does not track an empty directory — so the suite
    // passed here and failed on CI's fresh clone, which is the ONLY place the
    // defect is visible. A `.gitkeep` fixes it; the test is why anyone knew.
    for (const d of todoDirs()) expect({ dir: d, there: existsSync(d) }).toEqual({ dir: d, there: true });
  });

  test("the BEAN graph's declared directories are on disk too", () => {
    // Same assertion, same defect, different graph — and this one was
    // PRE-EXISTING: `beans/beans.json` has declared a `workflows` node since
    // the graph was written and the directory had never been committed.
    // Nothing checked it, because the bean graph had no equivalent of this
    // test. Found 2026-09-19 while fixing the todo instance.
    //
    // Asserted here rather than in a bean-graph test file so the two cannot
    // drift: the rule is about DECLARATIONS, not about todos.
    const decl = join(repoRootFor(ROOT), "beans", BEAN_GRAPH_FILE);
    const g = parseBeanGraph(JSON.parse(readFileSync(decl, "utf8")));
    for (const d of g.directories) {
      const dir = join(repoRootFor(ROOT), "beans", d.path);
      expect({ node: d.id, there: existsSync(dir) }).toEqual({ node: d.id, there: true });
    }
  });
});

describe("the published process hierarchy", () => {
  const index = () =>
    JSON.parse(
      readFileSync(join(ROOT, siteDirFor(ROOT), "assets/todos/index.json"), "utf8"),
    ) as { processes: Record<string, string[]>; items: Array<{ tags: { processes: string[] } }> };

  test("real call edges are present — a silent regex failure would flatten the board", () => {
    // `processHierarchy()` reads `<bpmn:process id>` and `calledElement` with a
    // REGEX rather than through `loadProcessModel`, which is async and pulls in
    // bpmn-moddle for a generator that otherwise touches no XML. The risk of a
    // regex over XML is that it silently matches NOTHING: the hierarchy comes
    // out flat, the board stacks nothing, and every test above still passes
    // because a flat board is a valid board. These are the edges the diagrams
    // actually declare.
    const h = index().processes;
    expect(h["Process_Lifecycle"]).toContain("Process_Publication");
    expect(h["Process_Publication"]).toContain("Process_Editing");
    expect(h["Process_Review"]).toContain("Process_CodeReview");
    expect(Object.values(h).filter((v) => v.length > 0).length).toBeGreaterThan(5);
  });

  test("no PHANTOM edge — the real parser is the oracle for the generator's regex", async () => {
    // The reverse of the test above, and it was failing silently.
    // `processHierarchy()` matched `/calledElement="([^"]+)"/g` over the WHOLE
    // XML, so `upstream-version-adoption.bpmn` — which documents itself with
    // *"Callers invoke it with `calledElement="Process_UpstreamAdoption"`"* —
    // published `Process_UpstreamAdoption → itself`. A self-call that
    // `loadProcessModel` REFUSES outright: "A process cannot contain itself",
    // because an interpreter entering A → A settles forever. The published
    // hierarchy asserted an edge the engine rejects.
    //
    // The test above pins edges that must be PRESENT, so it could never have
    // caught this: a phantom edge is an addition, and every assertion there is
    // a `toContain`. Naming the one known phantom would pin the past — the
    // generator reads a regex and the next diagram to describe its own id in
    // prose would mint a new one. So the oracle is `loadProcessModel`, the
    // real parser: it is async and pulls in bpmn-moddle, which is exactly why
    // the GENERATOR does not use it and why a test can.
    const expected: Record<string, string[]> = {};
    for (const f of workflowFiles(ROOT).filter((x) => x.endsWith(".bpmn"))) {
      const m = await loadProcessModel(f);
      const calls = new Set<string>();
      for (const n of m.nodes.values()) if (n.calledElement) calls.add(n.calledElement);
      expected[m.id] = [...calls].sort();
    }
    const published = index().processes;
    // Compared as whole objects rather than key by key: a diff naming the
    // process and both edge lists is what makes a failure here readable, and
    // the direction (phantom vs missing) is then obvious from the diff itself.
    expect(published).toEqual(expected);
  });

  test("the key order is the diagrams' sorted FILENAMES, not the directory's own order", async () => {
    // Reproducibility, and it is not theoretical. `processHierarchy` builds
    // this object by walking `skills/workflows/`, and `readdirSync` under Bun
    // returns RAW directory order — on ext4, a hash of each filename against
    // the directory's own seed. `JSON.stringify` preserves insertion order, so
    // the published index came out byte-different on every checkout, and
    // `gen-docs-pages.ts --check` called a file stale that nobody had touched.
    //
    // It went unseen because that `--check` was a folded YAML continuation
    // line and had never run (bean `d2kp`); it failed on its FIRST run, on the
    // PR that un-folded it. Asserting the ORDER rather than merely the set is
    // the point — a set assertion passes under either enumeration.
    // EVERY declared knowledge-graph root, via the same helper the generator
    // uses — not the literal `skills/workflows`.
    //
    // This hardcoded that path and broke the moment a second root existed:
    // `bootstrap/workflows/bootstrap.bpmn` is in the published hierarchy and
    // was not in this expectation, so the test called the GENERATOR wrong for
    // correctly reading the declaration. A test that pins an order must derive
    // it from the same source as the thing it pins, or it pins the past.
    //
    // Note `check:declared-paths` cannot catch this: it skips `*.test.ts`.
    // That exemption is worth revisiting — this is the second hardcoded path
    // in a test to break today.
    //
    // Ids come from `loadProcessModel`, NOT from a copy of the generator's
    // regex. Replicating it made this test agree with the generator's blind
    // spot: `/<bpmn:process id="…"/` misses `translation-workflow.bpmn`, which
    // binds the BPMN namespace as its default and writes a bare `<process>`,
    // so `Process_Translation` was missing from BOTH sides and the assertion
    // passed over a hole. Deriving from the same SOURCE is the rule; deriving
    // from the same IMPLEMENTATION is how a test blesses a bug.
    const bpmn = workflowFiles(ROOT).filter((f) => f.endsWith(".bpmn"));
    const expected: string[] = [];
    for (const f of bpmn) expected.push((await loadProcessModel(f)).id);
    expect(expected.length).toBeGreaterThan(5);
    expect(Object.keys(index().processes)).toEqual(expected);
  });

  test("every process a todo names exists in the hierarchy", () => {
    // A todo tagged with a process no diagram declares would stack at depth 0
    // beside the untagged ones and look correct — a dangling tag that renders
    // as a valid one.
    const { processes, items } = index();
    for (const t of items) {
      for (const p of t.tags.processes) {
        expect({ process: p, declared: p in processes }).toEqual({ process: p, declared: true });
      }
    }
  });
});

describe("reading", () => {
  test("there are todos to read — otherwise this proves nothing", () => {
    expect(readTodos().length).toBeGreaterThan(0);
  });

  test("every todo validates; a malformed one throws rather than being skipped", () => {
    // `readTodos` throws, so reaching here is the assertion. A malformed todo
    // is a person's outstanding item no consumer will ever show them, and a
    // clean run over it is worse than a failure.
    for (const t of readTodos()) expect(t.$schema).toBe("folio-todo/v1");
  });

  test("ids are unique", () => {
    const ids = readTodos().map((t) => t.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("an identity is provider-qualified, and survives the front matter", () => {
    // `- github:litlfred` is a SCALAR, not a mapping — YAML needs colon-space
    // for a mapping. Before the parser enforced that, every identity parsed as
    // `{github: "litlfred"}` and vanished: both seeded todos read "unassigned"
    // while their front matter plainly named someone.
    const withIdentity = readTodos().filter((t) => t.tags.identities.length > 0);
    expect(withIdentity.length).toBeGreaterThan(0);
    for (const t of withIdentity) {
      for (const i of t.tags.identities) {
        expect({ id: t.id, provider: i.provider }).toEqual({ id: t.id, provider: "github" });
        expect(i.id.length).toBeGreaterThan(0);
      }
    }
  });

  test("a `- kind: x` list DOES parse as a mapping", () => {
    // The other half of the colon-space rule: requiring it must not break the
    // real mappings. A reference or artefact silently dropping to a string
    // would be the same disappearance in the other direction.
    const refs = readTodos().flatMap((t) => [...t.tags.references, ...t.tags.artefacts]);
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) {
      expect(r.kind.length).toBeGreaterThan(0);
      expect(r.id.length).toBeGreaterThan(0);
    }
  });
});
