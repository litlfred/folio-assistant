/**
 * folio-glossary/v1 and its SKOS: the three states hold, references resolve,
 * external concepts are linked and never copied, and the repository's own
 * glossary is valid and published.
 */
import { describe, expect, test } from "bun:test";

import { GlossarySchema, toSkos, type Glossary } from "./glossary.ts";
import { collect, instanceNs, outputs, renderPage } from "../scripts/glossary-page.ts";

const NS = "https://example.org/x/ns#";
function g(over: Record<string, unknown> = {}): unknown {
  return { $schema: "folio-glossary/v1", id: "s", title: "T", terms: [], ...over };
}
const ok = (v: unknown) => GlossarySchema.safeParse(v).success;
const term = (over: Record<string, unknown> = {}) => ({ id: "t", prefLabel: "t", status: "candidate", ...over });

describe("folio-glossary/v1", () => {
  test("an authored term needs a definition; without one it is a candidate", () => {
    expect(ok(g({ terms: [term({ status: "authored" })] }))).toBe(false);
    expect(ok(g({ terms: [term({ status: "authored", definition: "d" })] }))).toBe(true);
    expect(ok(g({ terms: [term()] }))).toBe(true);
  });

  test("could-not-extract says why", () => {
    expect(ok(g({ terms: [term({ status: "could-not-extract" })] }))).toBe(false);
    expect(ok(g({ terms: [term({ status: "could-not-extract", reason: "scanned page" })] }))).toBe(true);
  });

  test("a match is an absolute IRI, and a broader/related reference is a local term or an IRI", () => {
    expect(ok(g({ terms: [term({ exactMatch: ["isco:2221"] })] }))).toBe(false);
    expect(ok(g({ terms: [term({ exactMatch: ["http://data.europa.eu/esco/isco/C2221"] })] }))).toBe(true);
    expect(ok(g({ terms: [term({ broader: ["nowhere"] })] }))).toBe(false);
    expect(ok(g({ terms: [term({ id: "a" }), term({ id: "b", broader: ["a"] })] }))).toBe(true);
  });

  test("ids are unique, and an unknown key is refused rather than dropped", () => {
    expect(ok(g({ terms: [term(), term()] }))).toBe(false);
    expect(ok(g({ terms: [term({ definiton: "typo" })] }))).toBe(false);
  });

  test("labels may be per language", () => {
    expect(ok(g({ terms: [term({ prefLabel: { en: "nurse", fr: "infirmière" } })] }))).toBe(true);
  });
});

describe("SKOS", () => {
  const glossary = GlossarySchema.parse(
    g({
      terms: [
        term({ id: "a", status: "authored", definition: "A.", notation: "A1", exactMatch: ["http://ex.org/c/1"] }),
        term({ id: "b", broader: ["a"] }),
      ],
      members: ["http://ex.org/c/2"],
    }),
  ) as Glossary;
  const out = toSkos(glossary, NS) as { "@graph": Array<Record<string, unknown>> };
  const node = (id: string) => out["@graph"].find((n) => n["@id"] === id)!;

  test("the scheme, each concept in it, and the IRIs follow the instance namespace", () => {
    expect(node(`${NS}glossary/s`)["@type"]).toBe("skos:ConceptScheme");
    expect(node(`${NS}glossary/s/a`)["skos:inScheme"]).toEqual({ "@id": `${NS}glossary/s` });
  });

  test("an external concept is linked, never copied", () => {
    expect(node(`${NS}glossary/s/a`)["skos:exactMatch"]).toEqual([{ "@id": "http://ex.org/c/1" }]);
    expect(out["@graph"].some((n) => n["@id"] === "http://ex.org/c/1")).toBe(false);
  });

  test("members become a skos:Collection of external IRIs", () => {
    expect(node(`${NS}glossary/s#members`)["skos:member"]).toEqual([{ "@id": "http://ex.org/c/2" }]);
  });

  test("a local broader resolves to the local IRI; a candidate says so in skos:note", () => {
    expect(node(`${NS}glossary/s/b`)["skos:broader"]).toEqual([{ "@id": `${NS}glossary/s/a` }]);
    expect(node(`${NS}glossary/s/b`)["skos:note"]).toBe("candidate");
    expect(node(`${NS}glossary/s/a`)["skos:notation"]).toBe("A1");
  });
});

describe("this repository", () => {
  const c = collect();

  test("every glossary document validates, and there is at least one (vacuity guard)", () => {
    expect(c.findings.invalid).toEqual([]);
    expect(c.glossaries.length).toBeGreaterThan(0);
  });

  test("the harness's swimlane ledgers are a source, read under their new kind", () => {
    expect(c.ledgers.map((l) => l.instance).sort()).toEqual(["bootstrap", "cat-harness"]);
  });

  test("core's terms live in core's namespace", () => {
    const core = c.glossaries.find((s) => s.instance === "folio-assistant-core")!;
    expect(core.ns).toBe(instanceNs("folio-assistant-core"));
    expect(core.ns).toBe("https://litlfred.github.io/folio-assistant/folio-assistant-core/ns#");
  });

  test("the page lists every term once, and SKOS is published for every scheme", () => {
    const page = renderPage(c);
    const terms = c.glossaries.flatMap((s) => s.glossary.terms);
    expect((page.match(/<dt id=/g) ?? []).length).toBe(terms.length);
    expect([...outputs(c).keys()].filter((p) => p.endsWith(".skos.jsonld")).length).toBe(c.glossaries.length);
  });
});
