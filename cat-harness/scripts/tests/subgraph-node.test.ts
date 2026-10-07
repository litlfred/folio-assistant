/**
 * THE GATE for the subgraph-node pattern (bean `l4ay`): a generator that
 * publishes the contents of a declared subgraph uses the DECLARED Subgraph
 * node as its container, and every member says it is part of it.
 *
 * `PUBLISHED` lists the documents that have adopted the pattern. A generator
 * that is converted adds its row; the generators not yet converted are named
 * on the follow-up bean, not here, so this list never claims more than it
 * checks.
 *
 * The tests of this file that read the whole checkout (reads the root-declared
 * graphs (`todos/`, `beans/`) among every adopting publisher) live in
 * `test/subgraph-node-checkout.test.ts` (bean `7zz1`): standing alone,
 * cat-harness has none of it.
 */
import { describe, expect, test } from "bun:test";

import { makeIri } from "../kg-export.ts";
import { memberOf, subgraphContainer, subgraphIri, subgraphPublicationFindings } from "../subgraph-node.ts";

describe("the IRI is the one kg-export mints the node under", () => {
  for (const id of ["todos", "beans", "a b", "x#y", "p/q"]) {
    test(JSON.stringify(id), () => {
      expect(subgraphIri("https://e.org/i.jsonld", id)).toBe(makeIri("https://e.org/i.jsonld", "directory", id));
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
