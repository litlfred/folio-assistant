/**
 * One concept per term: a glossary that describes terms its instance's
 * vocabulary already defines uses the vocabulary's IRIs, never a second one.
 *
 * Owner, 2026-09-30 (bean `xsqm`, "one SKOS", option A). bootstrap's 22 terms
 * were published twice — `<bootstrap>/ns#Node` in `ns.jsonld`, and
 * `…ns#glossary/terms/node` in the glossary's SKOS, with the translations on
 * the second. Now the glossary's concepts ARE the vocabulary's, and carry the
 * translations as language-tagged labels on them.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { toSkos } from "../schemas/glossary.ts";
import { collect, vocabularyConcepts } from "./glossary-page.ts";

const REPO = resolve(import.meta.dir, "..", "..");
const BOOTSTRAP = join(REPO, "bootstrap");

describe("bootstrap's glossary describes bootstrap's vocabulary, not a copy of it", () => {
  const concepts = vocabularyConcepts(BOOTSTRAP, JSON.parse(readFileSync(join(BOOTSTRAP, "bootstrap.json"), "utf-8")));
  const src = collect(REPO).glossaries.find((s) => s.instance === "bootstrap" && s.glossary.id === "terms");

  test("the vocabulary is found, and the glossary is there — neither side empty", () => {
    expect(concepts.size).toBeGreaterThan(0);
    expect(src?.glossary.terms.length ?? 0).toBeGreaterThan(0);
  });

  test("every term's concept IRI is the vocabulary's, and none is minted under glossary/", () => {
    const skos = toSkos(src!.glossary, src!.ns) as { "@graph": Array<Record<string, unknown>> };
    const conceptIds = skos["@graph"].filter((n) => n["@type"] === "skos:Concept").map((n) => String(n["@id"]));
    expect(conceptIds.length).toBe(src!.glossary.terms.length);
    const vocab = new Set(concepts.values());
    for (const id of conceptIds) {
      expect(vocab.has(id)).toBe(true);
      expect(id.includes("glossary/")).toBe(false);
    }
  });

  test("the ordered list and `requires` point at the same concepts", () => {
    const skos = toSkos(src!.glossary, src!.ns) as { "@graph": Array<Record<string, unknown>> };
    const vocab = new Set(concepts.values());
    const order = skos["@graph"].find((n) => n["@type"] === "skos:OrderedCollection") as { "skos:memberList": { "@list": { "@id": string }[] } };
    for (const m of order["skos:memberList"]["@list"]) expect(vocab.has(m["@id"])).toBe(true);
    for (const n of skos["@graph"]) {
      for (const r of (n["dcterms:requires"] as { "@id": string }[] | undefined) ?? []) expect(vocab.has(r["@id"])).toBe(true);
    }
  });

  test("an instance with no declared vocabulary mints its own, as before", () => {
    expect(vocabularyConcepts(BOOTSTRAP, {}).size).toBe(0);
  });
});
