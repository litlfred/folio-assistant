import { describe, expect, test } from "bun:test";
import { documentContext } from "./content-context.ts";
import { CONTENT_CONTEXT_URL, FOLIO_BASE } from "./jsonld.ts";

const prefixes = new Map([
  ["folio-assistant-core", "https://example.org/core/ns#"],
  ["folio-assistant-sci", "https://example.org/sci/ns#"],
]);

describe("documentContext (bean 0r7u)", () => {
  test("a document whose types the published context binds carries only @base", () => {
    expect(documentContext(["cat-harness:SourceDocument", "doco:Section"], { prefixes })).toEqual([
      CONTENT_CONTEXT_URL,
      { "@base": FOLIO_BASE },
    ]);
  });

  test("an instance's kind class binds that instance's prefix locally, once", () => {
    const [, local] = documentContext(["folio-assistant-sci:Theorem", "folio-assistant-sci:Lemma", "doco:Section"], { prefixes });
    expect(local).toEqual({ "@base": FOLIO_BASE, "folio-assistant-sci": "https://example.org/sci/ns#" });
  });

  test("a different base is honoured", () => {
    expect(documentContext([], { base: "https://example.org/site/", prefixes })[1]).toEqual({ "@base": "https://example.org/site/" });
  });

  test("a prefix nothing binds is refused, never emitted", () => {
    expect(() => documentContext(["nobody:Thing"], { prefixes })).toThrow(/no context binds/);
  });
});
