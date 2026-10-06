import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { NodeKindEntry } from "./node-kind-index";
import { nodesOfKind } from "./node-kind-nodes";

/**
 * Issue #2195: a kind's nodes are the files its typologies' directories hold
 * whose `$schema` the kind ACCEPTS — subclasses included.
 */
const repo = mkdtempSync(join(import.meta.dir, ".tmp-node-kind-nodes-"));
afterAll(() => rmSync(repo, { recursive: true, force: true }));

writeFileSync(
  join(repo, "alpha.json"),
  JSON.stringify({ name: "alpha", version: "0.1.0", directories: [{ id: "items", path: "items/", graphTypologies: ["todo-items"] }] }),
);
mkdirSync(join(repo, "items", "deep"), { recursive: true });
writeFileSync(join(repo, "items", "a.md"), "---\n$schema: todo/1.0.0\nid: a\nrefs:\n  - kind: bean\n    id: b1\n---\nBody.\n");
writeFileSync(join(repo, "items", "deep", "b.json"), JSON.stringify({ $schema: "sub-todo/1.1.0", id: "b" }));
writeFileSync(join(repo, "items", "c.json"), JSON.stringify({ $schema: "todo/2.0.0", id: "c" }));
writeFileSync(join(repo, "items", "d.json"), JSON.stringify({ id: "no-tag" }));
writeFileSync(join(repo, "items", "README.md"), "# not a node\n");

const entry = (id: string, version: string, extra: Partial<NodeKindEntry> = {}): NodeKindEntry => ({
  id, version, tag: `${id}/${version}`, parents: [], subclasses: [], declaredBy: "alpha", holdings: [{ typology: "todo-items" }], ...extra,
});
const index = {
  kinds: [entry("todo", "1.0.0", { subclasses: ["sub-todo"] }), entry("sub-todo", "1.2.0", { parents: ["todo"] })],
};

describe("nodesOfKind", () => {
  const nodes = nodesOfKind(index, "todo", repo);

  test("a kind's page includes its subclasses' nodes, each filed under the kind it IS", () => {
    expect(nodes.map((n) => [n.kind, n.path])).toEqual([
      ["todo", "items/a"],
      ["sub-todo", "items/deep/b"],
    ]);
  });

  test("an earlier minor is accepted; another major, no tag and a plain README are not nodes", () => {
    expect(nodes.some((n) => n.path === "items/c" || n.path === "items/d" || n.path === "items/README")).toBe(false);
  });

  test("a subclass's own page does not include its parent's nodes", () => {
    expect(nodesOfKind(index, "sub-todo", repo).map((n) => n.path)).toEqual(["items/deep/b"]);
  });

  test("each node is held by the instance that declares the directory, at a path without its extension", () => {
    expect(nodes[0]).toMatchObject({ harness: "alpha", path: "items/a", file: "items/a.md" });
  });

  test("Markdown front matter is read as YAML, so nested lists of objects survive", () => {
    expect(nodes[0]!.node.refs).toEqual([{ kind: "bean", id: "b1" }]);
  });
});
