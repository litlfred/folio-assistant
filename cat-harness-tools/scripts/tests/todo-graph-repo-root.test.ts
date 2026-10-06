/**
 * `todo-graph` tests that read the aggregate repository's own root — the
 * root-declared `todos/` graph — moved here from
 * `cat-harness/scripts/tests/todo-graph.test.ts` (bean `ho66`), as
 * `merge-guard-workflows.test.ts` was: a standalone cat-harness layer has no
 * such root, and `check:cat-harness-standalone` collects every test in that
 * layer. The rest of that file's tests stay there.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { siteDirFor } from "../../../cat-harness/schemas/cat-harness.ts";
import { declaredSubgraphNode } from "../../../cat-harness/scripts/kg-export.ts";
import { subgraphPublicationFindings } from "../../../cat-harness/scripts/subgraph-node.ts";

/**
 * The directory this test was written in (`cat-harness/scripts/tests/`): every path below
 * is composed from it exactly as it was before the move, so nothing it reads changed.
 */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const ROOT = join(ORIGIN_DIR, "..", "..");
const SITE = join(ROOT, siteDirFor(ROOT));

describe("what is published", () => {
  const graph = JSON.parse(readFileSync(join(SITE, "todos.jsonld"), "utf8")) as Record<string, unknown>;

  test("its container is the declared todos Subgraph node, and every todo is a member of it", () => {
    const declared = declaredSubgraphNode(ROOT, "todos");
    expect(declared).toBeDefined();
    expect(subgraphPublicationFindings(graph, { iri: declared!.iri })).toEqual([]);
    expect(graph["contentSource"]).toEqual(declared!.contentSource);
  });
});
