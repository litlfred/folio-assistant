/**
 * `subgraph-node` tests about the WHOLE CHECKOUT, moved here from
 * `cat-harness-tools/scripts/tests/kg/subgraph-node.test.ts` (bean `7zz1`, owner ruling
 * 2026-10-06 "Top-level instance"): each reads the root-declared graphs
 * (`todos/`, `beans/`) among every adopting publisher, which only the checkout
 * holds. Standing alone, cat-harness has none of it, and
 * `check:cat-harness-standalone` collects every test in that layer. The rest
 * of that file's tests stay there; every path here is composed from
 * ORIGIN_DIR, the directory they were written in, so nothing they read
 * changed.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { siteDirFor } from "../../schemas/kg/cat-harness.ts";
import { declaredSubgraphNode } from "../../scripts/kg-export.ts";
import { subgraphPublicationFindings } from "../../scripts/subgraph-node.ts";
import { ensureDocsPages, siteNotBuilt } from "../support/checkout.ts";

/** The directory these tests were written in (`cat-harness/scripts/tests/`): every path below is composed from it exactly as it was before the move, so nothing they read changed. */
const ORIGIN_DIR = join(import.meta.dir, "../../../cat-harness/scripts/tests");

const ROOT = join(ORIGIN_DIR, "..", "..");
const SITE = join(ROOT, siteDirFor(ROOT));

// The document is written by `docs:pages`, so build it when it is missing
// rather than rely on another file in this shard having run it first (#411).
ensureDocsPages(ROOT);

/** Declared subgraph id → the committed document that publishes its contents. */
const PUBLISHED: ReadonlyArray<{ id: string; file: string }> = [{ id: "todos", file: join(SITE, "todos.jsonld") }];

describe("every adopting publisher follows the pattern", () => {
  for (const { id, file } of PUBLISHED) {
    // The document is written at publish and gitignored (bean w1gy F18).
    test.skipIf(siteNotBuilt(`the ${id} document \`docs:pages\` writes at publish (gitignored)`, file))(`${id}: ${file.slice(ROOT.length + 1)}`, () => {
      const declared = declaredSubgraphNode(ROOT, id);
      expect(declared).toBeDefined();
      const doc = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
      expect(subgraphPublicationFindings(doc, { iri: declared!.iri })).toEqual([]);
    });
  }
});
