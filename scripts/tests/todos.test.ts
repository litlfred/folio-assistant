/**
 * The todo graph is declared, present, and READ.
 *
 * All three, because the failure mode is the middle one going missing.
 * `schemas/todo.ts`, `schemas/todo-graph.ts` and the `todos` / `todo-items`
 * graph kinds existed before any todo did, and `cat-harness.json` did not
 * declare `todos/`. A schema ahead of its graph is harmless. A **declared
 * directory nothing reads** is the bean `dh4f` defect — a consumer scans
 * nothing and reports a clean run over it.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { readDeclaration } from "../../schemas/cat-harness.js";
import { TODO_GRAPH_FILE, parseTodoGraph } from "../../schemas/todo-graph.js";
import { ROOT, TODO_ROOT, readTodos, todoDirs } from "../todos.js";

describe("the declaration and the directory agree", () => {
  test("`cat-harness.json` declares a `todos` graph", () => {
    const d = readDeclaration(ROOT);
    const entry = d?.directories?.find((x) => x.graphs?.includes("todos"));
    expect(entry?.path).toBe("todos/");
  });

  test("the declared directory EXISTS — declare only what exists", () => {
    expect(existsSync(TODO_ROOT)).toBe(true);
    expect(existsSync(join(TODO_ROOT, TODO_GRAPH_FILE))).toBe(true);
  });

  test("its own declaration parses, and names both nodes", () => {
    const g = parseTodoGraph(
      JSON.parse(readFileSync(join(TODO_ROOT, TODO_GRAPH_FILE), "utf8")),
    );
    expect(g.directories.map((d) => d.id).sort()).toEqual(["feedback", "items"]);
  });

  test("every declared node directory is on disk", () => {
    // The `dh4f` shape one level down: a node declared inside the graph but
    // absent, so the reader walks nothing and reports no todos.
    for (const d of todoDirs()) expect({ dir: d, there: existsSync(d) }).toEqual({ dir: d, there: true });
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
