/**
 * folio-glossary/v1 and its SKOS: the three states hold, references resolve,
 * external concepts are linked and never copied, and the repository's own
 * glossary is valid and published.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { GlossarySchema, termIri, toSkos, type Glossary } from "./glossary.ts";
import { collect, counts, instanceNs, outputs, renderPage } from "../scripts/glossary-page.ts";
import {
  ASSET_TYPES,
  EXTRACTED_PREFIX,
  decodeXml,
  fold,
  localId,
  type AssetType,
} from "../scripts/glossary-extract.ts";
import { instanceRootsIn, readDeclaration } from "../../cat-harness/schemas/cat-harness.ts";
import { parseFrontMatter } from "../../cat-harness/schemas/front-matter.ts";
import { discoverTools } from "../../cat-harness/tools/discover.ts";

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

/**
 * Bean `lqo9`, piece 1 as posed: every KG asset with a title and a
 * description, extracted as `candidate` terms. These run over the REAL
 * repository, and every count is guarded against zero first: "every extracted
 * term is a candidate" passes perfectly over no terms (`6tkl`).
 */
describe("extracted KG terms", () => {
  const c = collect();
  const REPO = resolve(import.meta.dir, "..", "..");
  const extracted = c.glossaries.filter((s) => s.extracted);
  const terms = extracted.flatMap((s) => s.glossary.terms.map((t) => ({ s, t })));
  const pathOf = (src: string) => src.split("#", 2)[0]!;
  const anchorOf = (src: string) => src.split("#", 2)[1];

  test("each asset type contributes terms, above a floor (a vacuity guard, not an exact count)", () => {
    const floors: Record<AssetType, number> = {
      "kg-skills": 200,
      "kg-tools": 80,
      "kg-bpmn-activities": 400,
      "kg-dmn-decisions": 5,
      "kg-schema-fields": 1000,
    };
    for (const type of ASSET_TYPES) {
      const n = extracted.filter((s) => s.extracted === type).reduce((k, s) => k + s.glossary.terms.length, 0);
      expect({ type, atLeast: n >= floors[type] }).toEqual({ type, atLeast: true });
    }
  });

  test("every extracted term is a candidate whose source resolves to a file in the repository", () => {
    expect(terms.length).toBeGreaterThan(0);
    const bad = terms.filter(({ t }) => t.status !== "candidate" || !t.source || !existsSync(join(REPO, pathOf(t.source))));
    expect(bad.map(({ t }) => t.source)).toEqual([]);
  });

  test("an anchored source names an element that is really in that file", () => {
    const anchored = terms.filter(({ s, t }) => s.extracted !== "kg-skills" && anchorOf(t.source!));
    expect(anchored.length).toBeGreaterThan(0);
    const text = new Map<string, string>();
    const read = (p: string) => text.get(p) ?? (text.set(p, readFileSync(join(REPO, p), "utf-8")), text.get(p)!);
    const missing = anchored.filter(({ s, t }) => {
      const body = read(pathOf(t.source!));
      const a = anchorOf(t.source!)!;
      if (s.extracted === "kg-schema-fields") {
        const [decl, field] = a.split(/\.(.*)/s) as [string, string];
        return !body.includes(decl) || !body.includes(field);
      }
      if (s.extracted === "kg-tools") return !body.includes(`"${a}"`);
      return !body.includes(`id="${a}"`);
    });
    expect(missing.map(({ t }) => t.source)).toEqual([]);
  });

  test("no definition appears that is not verbatim in its asset", () => {
    const withDef = terms.filter(({ t }) => t.definition);
    expect(withDef.length).toBeGreaterThan(1000);
    const tools = new Map(discoverTools(REPO).tools.map((t) => [t.id, t]));
    // The asset's text as a reader of the file would read it: XML entities
    // decoded, JSDoc line markers dropped, whitespace folded. Nothing else,
    // so a paraphrase, a summary or a completed sentence fails.
    const asRead = (p: string) =>
      fold(
        decodeXml(readFileSync(join(REPO, p), "utf-8"))
          .split("\n")
          .map((l) => l.replace(/^\s*(?:\/\*\*+|\*+\/?|\/\/)\s?/, ""))
          .join("\n"),
      );
    const cache = new Map<string, string>();
    const bad = withDef.filter(({ s, t }) => {
      const d = t.definition as string;
      // A Tool is a node, not a file: its description may be a concatenated
      // literal, so the verbatim check is against the node itself.
      if (s.extracted === "kg-tools") return fold(tools.get(t.notation!)?.description ?? "") !== d;
      if (s.extracted === "kg-skills") {
        const fm = parseFrontMatter(readFileSync(join(REPO, t.source!), "utf-8")).fm;
        return fold(String(fm.description ?? "")) !== d;
      }
      const p = pathOf(t.source!);
      if (!cache.has(p)) cache.set(p, asRead(p));
      return !cache.get(p)!.includes(d);
    });
    expect(bad.map(({ t }) => `${t.source}: ${t.definition}`)).toEqual([]);
  });

  test("a DMN decision is never defined by one of its rules' descriptions", () => {
    const dmn = terms.filter(({ s }) => s.extracted === "kg-dmn-decisions");
    expect(dmn.length).toBeGreaterThan(0);
    for (const { t } of dmn) {
      const xml = readFileSync(join(REPO, pathOf(t.source!)), "utf-8");
      const rules = [...xml.matchAll(/<rule\b[\s\S]*?<\/rule>/g)].flatMap((r) =>
        [...r[0].matchAll(/<description>([\s\S]*?)<\/description>/g)].map((m) => fold(decodeXml(m[1]!))),
      );
      if (t.definition) expect(rules).not.toContain(t.definition);
    }
  });

  test("no two terms, authored or extracted, mint one IRI", () => {
    const iris = c.glossaries.flatMap((s) => s.glossary.terms.map((t) => termIri(s.ns, s.glossary, t.id)));
    expect(iris.length).toBeGreaterThan(2000);
    expect(new Set(iris).size).toBe(iris.length);
    expect(c.findings.invalid).toEqual([]);
  });

  test("an extracted term's IRI is in the namespace of the instance that holds the asset", () => {
    for (const s of extracted) {
      const decl = instanceRootsIn(REPO)
        .map((r) => ({ r, d: readDeclaration(r) }))
        .find(({ d }) => d?.name === s.instance)!;
      expect(s.ns).toBe(instanceNs(decl.d!.name, decl.d!.stub));
      const rel = relative(REPO, decl.r).split("\\").join("/");
      for (const t of s.glossary.terms) expect(t.source!.startsWith(`${rel}/`)).toBe(true);
    }
  });

  test("roles and lanes are not re-extracted: the swimlane ledger carries them and is linked", () => {
    expect(c.ledgers.reduce((k, l) => k + l.terms, 0)).toBeGreaterThan(0);
    const types = new Set(extracted.map((s) => s.extracted));
    expect([...types].sort()).toEqual([...ASSET_TYPES].sort());
    // No term comes from the role registry or from a lane element.
    expect(terms.filter(({ t }) => /(^|\/)roles\.json(#|$)/.test(t.source!))).toEqual([]);
    const lanes = new Map<string, Set<string>>();
    const laneIds = (p: string) =>
      lanes.get(p) ??
      (lanes.set(p, new Set([...readFileSync(join(REPO, p), "utf-8").matchAll(/<(?:bpmn:)?lane\b[^>]*\sid="([^"]+)"/g)].map((m) => m[1]!))),
      lanes.get(p)!);
    const fromLanes = terms.filter(({ t }) => pathOf(t.source!).endsWith(".bpmn") && laneIds(pathOf(t.source!)).has(anchorOf(t.source!)!));
    expect(fromLanes.map(({ t }) => t.source)).toEqual([]);
    expect(renderPage(c)).toContain("docs-auto/glossary/glossary/");
  });

  test("the page tells extracted from authored, and only authored terms reach schema.org", () => {
    const page = renderPage(c);
    const n = counts(c);
    expect(n.extracted).toBe(terms.length);
    expect((page.match(/data-fa-state="extracted"/g) ?? []).length).toBe(n.extracted);
    expect((page.match(/data-fa-state="authored"/g) ?? []).length).toBe(n.authored);
    expect((page.match(/candidate, extracted<\/span>/g) ?? []).length).toBe(n.extracted);
    const ld = JSON.parse(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/.exec(page)![1]!) as {
      hasDefinedTerm: unknown[];
    };
    expect(ld.hasDefinedTerm.length).toBe(n.authored);
    // The page states its size and term count, which is how a reader learns
    // the load cost before scrolling 2,000 terms.
    expect(page).toMatch(new RegExp(`holds ${terms.length + n.authored} terms and is [0-9.]+ (MB|KB) before compression`));
  });

  test("extracted schemes are written under core's glossary directory, never over an authored file", () => {
    const files = [...outputs(c).keys()].map((p) => relative(REPO, p).split("\\").join("/"));
    const gen = files.filter((p) => p.endsWith(".glossary.json"));
    expect(gen.length).toBe(extracted.length);
    for (const p of gen) expect(p.startsWith("folio-assistant-core/glossary/generated/")).toBe(true);
    for (const s of c.glossaries.filter((x) => !x.extracted)) expect(gen).not.toContain(s.file);
  });

  test("an authored scheme may not take the extracted prefix", () => {
    expect(c.glossaries.filter((s) => !s.extracted && s.glossary.id.startsWith(EXTRACTED_PREFIX))).toEqual([]);
  });
});

describe("extraction helpers", () => {
  test("a local id keeps `@id` and `id` apart, and always satisfies the schema", () => {
    expect(localId("x.X.@id")).not.toBe(localId("x.X.id"));
    expect(localId("@id")).not.toBe(localId("id"));
    for (const k of ["Process_A.Task_B", "graph.GraphSchema.$schema", "x.Y.@context", "  weird  key!"]) {
      expect(ok(g({ terms: [term({ id: localId(k) })] }))).toBe(true);
    }
  });

  test("XML decoding covers the predefined entities and numeric references, once", () => {
    expect(decodeXml("a &amp;lt; b &#183; &#x41; <![CDATA[c]]>")).toBe("a &lt; b · A c");
  });
});
