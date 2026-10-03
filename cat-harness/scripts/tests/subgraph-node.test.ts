/**
 * THE GATE for the subgraph-node pattern (bean `l4ay`): a generator that
 * publishes the contents of a declared subgraph uses the DECLARED Subgraph
 * node as its container, and every member says it is part of it.
 *
 * `PUBLISHED` lists the documents that have adopted the pattern. A generator
 * that is converted adds its row; the generators not yet converted are named
 * on the follow-up bean, not here, so this list never claims more than it
 * checks.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { siteDirFor } from "../../schemas/cat-harness.ts";
import { declaredSubgraphNode, makeIri } from "../kg-export.ts";
import { memberOf, subgraphContainer, subgraphIri, subgraphPublicationFindings } from "../subgraph-node.ts";

const ROOT = join(import.meta.dir, "..", "..");
const SITE = join(ROOT, siteDirFor(ROOT));

/** Declared subgraph id → the committed document that publishes its contents. */
const PUBLISHED: ReadonlyArray<{ id: string; file: string }> = [{ id: "todos", file: join(SITE, "todos.jsonld") }];

describe("the IRI is the one kg-export mints the node under", () => {
  for (const id of ["todos", "beans", "a b", "x#y", "p/q"]) {
    test(JSON.stringify(id), () => {
      expect(subgraphIri("https://e.org/i.jsonld", id)).toBe(makeIri("https://e.org/i.jsonld", "directory", id));
    });
  }
});

describe("every adopting publisher follows the pattern", () => {
  for (const { id, file } of PUBLISHED) {
    test(`${id}: ${file.slice(ROOT.length + 1)}`, () => {
      const declared = declaredSubgraphNode(ROOT, id);
      expect(declared).toBeDefined();
      const doc = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
      expect(subgraphPublicationFindings(doc, { iri: declared!.iri })).toEqual([]);
    });
  }
});

describe("the check catches each way of getting it wrong", () => {
  const IRI = "https://e.org/i.jsonld#directory/todos";
  const ctx = { Subgraph: "x", hasPart: "x", inSubgraph: "x", contentSource: "x" };
  const good = () => ({
    "@context": { ...ctx },
    ...subgraphContainer({ iri: IRI, members: ["m1", "m2"] }),
    "@graph": [
      { "@id": "m1", ...memberOf(IRI) },
      { "@id": "m2", ...memberOf(IRI) },
    ],
  });
  test("the good shape is clean", () => {
    expect(subgraphPublicationFindings(good(), { iri: IRI })).toEqual([]);
  });
  test("a parallel collection container", () => {
    const d = { ...good(), "@id": "https://e.org/todos.jsonld", "@type": "TodoGraph" };
    const f = subgraphPublicationFindings(d, { iri: IRI });
    expect(f.some((x) => /not the declared Subgraph/.test(x))).toBe(true);
    expect(f.some((x) => /parallel collection/.test(x))).toBe(true);
  });
  test("a member without inSubgraph", () => {
    const d = good();
    delete (d["@graph"][1] as Record<string, unknown>)["inSubgraph"];
    expect(subgraphPublicationFindings(d, { iri: IRI })).toEqual([`member m2 has no inSubgraph → ${IRI}`]);
  });
  test("hasPart that misses a member", () => {
    const d = { ...good(), hasPart: ["m1"] };
    expect(subgraphPublicationFindings(d, { iri: IRI }).some((x) => /hasPart/.test(x))).toBe(true);
  });
  test("a context that does not define the terms", () => {
    const d = { ...good(), "@context": {} };
    expect(subgraphPublicationFindings(d, { iri: IRI }).length).toBe(4);
  });
});
