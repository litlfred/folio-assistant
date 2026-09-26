/**
 * folio-glossary/v1 and its SKOS: the three states hold, references resolve,
 * external concepts are linked and never copied, and the repository's own
 * glossary is valid and published.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { GlossarySchema, schemeIri, termIri, toSkos, type Glossary } from "./glossary.ts";
import {
  PAGE_KEYS,
  budgetOf,
  collect,
  counts,
  instanceNs,
  instanceOwners,
  ownerOfPath,
  repoPathOf,
  schemeOwner,
  outputs,
  pageOf,
  pagePath,
  permalinkOf,
  renderPages,
} from "../scripts/glossary-page.ts";
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
    const pages = renderPages(c);
    const ids = [...pages.values()].flatMap((p) => [...p.matchAll(/<dt id="([^"]+)"/g)].map((m) => m[1]!));
    const terms = c.glossaries.flatMap((s) => s.glossary.terms);
    expect(ids.length).toBe(terms.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...outputs(c).keys()].filter((p) => p.endsWith(".skos.jsonld")).length).toBe(c.glossaries.length);
  });
});

/**
 * Owner, 2026-09-24: "Split per asset type". The index keeps the authored
 * terms, the counts and the sources; each asset type has a page of its own.
 */
describe("the glossary pages", () => {
  const c = collect();
  const pages = renderPages(c);
  const idsOn = (page: string) => [...page.matchAll(/<dt id="([^"]+)"/g)].map((m) => m[1]!);
  const idOf = (s: (typeof c.glossaries)[number], t: { id: string }) => `${s.instance}--${s.glossary.id}--${t.id}`;

  test("there is an index and one page per asset type, and each is an output", () => {
    expect([...pages.keys()]).toEqual([...PAGE_KEYS]);
    expect(PAGE_KEYS).toEqual(["index", ...ASSET_TYPES]);
    const out = outputs(c);
    for (const k of PAGE_KEYS) expect(out.get(pagePath(k))).toBe(pages.get(k)!);
  });

  test("every term appears exactly once across all the pages, and on the page its scheme belongs to", () => {
    const seen = new Map<string, string>();
    for (const [k, page] of pages) {
      for (const id of idsOn(page)) {
        expect(seen.has(id) ? `${id} on ${seen.get(id)} and ${k}` : "").toBe("");
        seen.set(id, k);
      }
    }
    const all = c.glossaries.flatMap((s) => s.glossary.terms.map((t) => ({ s, t })));
    expect(all.length).toBeGreaterThan(ASSET_TYPES.length); // vacuity guard
    expect(seen.size).toBe(all.length);
    for (const { s, t } of all) expect(seen.get(idOf(s, t))).toBe(pageOf(s));
  });

  test("the index holds the authored terms only; each type's page holds that type's extracted terms only", () => {
    const n = counts(c);
    const index = pages.get("index")!;
    expect((index.match(/data-fa-state="extracted"/g) ?? []).length).toBe(0);
    expect(idsOn(index).length).toBe(c.glossaries.filter((s) => !s.extracted).reduce((k, s) => k + s.glossary.terms.length, 0));
    for (const t of ASSET_TYPES) {
      const page = pages.get(t)!;
      const want = c.glossaries.filter((s) => s.extracted === t).reduce((k, s) => k + s.glossary.terms.length, 0);
      expect(idsOn(page).length).toBe(want);
      expect((page.match(/data-fa-state="extracted"/g) ?? []).length).toBe(want);
      expect((page.match(/candidate, extracted<\/span>/g) ?? []).length).toBe(want);
    }
    expect(n.authored).toBeGreaterThan(0);
  });

  test("each page is under its stated size budget, and says so", () => {
    for (const [k, page] of pages) {
      const bytes = Buffer.byteLength(page, "utf-8");
      expect(`${k} ${bytes <= budgetOf(k) ? "within" : `over: ${bytes} > ${budgetOf(k)}`}`).toBe(`${k} within`);
      expect(page).toMatch(/is [0-9.]+ (MB|KB) before compression, (fetched in one request, )?within its budget of [0-9.]+ (MB|KB)/);
    }
    // The budgets are what the split was for: the index stays small, and no
    // type's page is fetched at the size the single page had (1.4 MB).
    expect(budgetOf("index")).toBeLessThanOrEqual(64 * 1024);
    for (const t of ASSET_TYPES) expect(budgetOf(t)).toBeLessThan(1.4 * 1024 * 1024);
  });

  test("the index links every per-type page, and each per-type page links back", () => {
    const index = pages.get("index")!;
    for (const t of ASSET_TYPES) {
      expect(index).toContain(`{{ '${permalinkOf(t)}' | relative_url }}`);
      const page = pages.get(t)!;
      expect(page).toContain(`permalink: ${permalinkOf(t)}\n`);
      expect(page).toContain("parent: Glossary\n");
      expect(page).toContain(`{{ '${permalinkOf("index")}' | relative_url }}`);
    }
    expect(index).toContain("has_children: true\n");
  });

  test("every page keeps the text filter and the A–Z bar", () => {
    for (const [k, page] of pages) {
      if (!idsOn(page).length) continue;
      expect(`${k}: ${page.includes('id="fa-gloss-q"') && page.includes('<nav aria-label="Letters">')}`).toBe(`${k}: true`);
    }
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
    expect(renderPages(c).get("index")).toContain("docs-auto/glossary/glossary/");
  });

  test("the pages tell extracted from authored, and only authored terms reach schema.org", () => {
    const pages = renderPages(c);
    const all = [...pages.values()].join("\n");
    const n = counts(c);
    expect(n.extracted).toBe(terms.length);
    expect((all.match(/data-fa-state="extracted"/g) ?? []).length).toBe(n.extracted);
    expect((all.match(/data-fa-state="authored"/g) ?? []).length).toBe(n.authored);
    expect((all.match(/candidate, extracted<\/span>/g) ?? []).length).toBe(n.extracted);
    const index = pages.get("index")!;
    const ld = JSON.parse(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/.exec(index)![1]!) as {
      hasDefinedTerm: unknown[];
    };
    expect(ld.hasDefinedTerm.length).toBe(n.authored);
    // Only the index carries the DefinedTermSet.
    expect(all.match(/<script type="application\/ld\+json">/g)?.length).toBe(1);
    // Each page states its term count and size, which is how a reader learns
    // the load cost before scrolling.
    expect(index).toMatch(new RegExp(`holds ${n.authored} terms and is [0-9.]+ (MB|KB) before compression`));
    for (const t of ASSET_TYPES) {
      const k = extracted.filter((s) => s.extracted === t).reduce((m, s) => m + s.glossary.terms.length, 0);
      expect(pages.get(t)!).toMatch(new RegExp(`holds ${k} terms and is [0-9.]+ (MB|KB) before compression`));
    }
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

/**
 * Owner, 2026-09-24: *"make sure all glossary terms properly localed to ihris
 * so [no] collision w/ other subgraphs. general rule/skill"*. A term lives in
 * the namespace of the instance that owns its source asset, never of whichever
 * instance happens to declare the `glossary/` directory. Each check below runs
 * over the REAL repository and works its answer out independently of
 * `collect()`: the instance holding a path is found here by walking the
 * declared roots, not by calling the code under test.
 */
describe("every term in the namespace of the instance that owns its source", () => {
  const REPO = resolve(import.meta.dir, "..", "..");
  const c = collect();
  // Independent: every declared root, longest first.
  const roots = instanceRootsIn(REPO)
    .map((r) => ({ root: resolve(r), decl: readDeclaration(r)! }))
    .filter((r) => r.decl)
    .sort((a, b) => b.root.length - a.root.length);
  const nsOfName = new Map(roots.map((r) => [r.decl.name, instanceNs(r.decl.name, r.decl.stub)] as const));
  const holder = (path: string) => {
    const p = resolve(REPO, path);
    return roots.find((r) => p === r.root || p.startsWith(`${r.root}/`))?.decl.name;
  };
  // A repository path is one that exists; a scheme's dcterms:source may be prose.
  const isPath = (src?: string) =>
    !!src && !/^[a-z][a-z0-9+.-]*:\/\//i.test(src) && existsSync(resolve(REPO, src.split("#", 2)[0]!));

  test("(a) no two schemes, in any instance, mint one scheme IRI", () => {
    expect(c.findings.invalid.filter((f) => f.includes("collision"))).toEqual([]);
    const iris = c.glossaries.map((s) => schemeIri(s.ns, s.glossary));
    expect(iris.length).toBeGreaterThan(ASSET_TYPES.length); // vacuity guard
    expect(iris.filter((x, i) => iris.indexOf(x) !== i)).toEqual([]);
  });

  test("(b) no two instances resolve to one namespace", () => {
    const all = [...nsOfName.values()];
    expect(all.length).toBeGreaterThan(1); // vacuity guard
    expect(all.filter((x, i) => all.indexOf(x) !== i)).toEqual([]);
  });

  test("(c) every term with a repository source is minted in the namespace of the instance whose root holds it, authored and extracted alike", () => {
    const wrong: string[] = [];
    let checked = 0;
    let authored = 0;
    for (const s of c.glossaries) {
      // A scheme whose own source is a repository path is DEFINED by that
      // instance, and a term contributed from elsewhere (a code list extended
      // by another package) is still the defining instance's.
      const defining = isPath(s.glossary.source) ? holder(s.glossary.source!.split("#", 2)[0]!) : undefined;
      for (const t of s.glossary.terms) {
        if (!isPath(t.source)) continue;
        const owner = defining ?? holder(t.source!.split("#", 2)[0]!);
        const ns = owner ? nsOfName.get(owner) : undefined;
        checked++;
        if (!s.extracted) authored++;
        const iri = termIri(s.ns, s.glossary, t.id);
        if (!ns || !iri.startsWith(ns)) wrong.push(`${iri} (source ${t.source}, owner ${owner ?? "none"})`);
      }
    }
    expect(checked).toBeGreaterThan(1000); // vacuity guard: extracted terms
    expect(authored).toBeGreaterThan(0); // and authored ones, which are what the rule added
    expect(wrong).toEqual([]);
  });

  test("an authored scheme sourced in several instances with no defining source is refused, not guessed", () => {
    const owners = instanceOwners(REPO);
    const g = (over: Record<string, unknown>) => GlossarySchema.parse({ $schema: "folio-glossary/v1", id: "x", title: "X", ...over });
    const mixed = g({
      terms: [
        { id: "a", prefLabel: "a", status: "candidate", source: "cat-harness/schemas/odrl.ts" },
        { id: "b", prefLabel: "b", status: "candidate", source: "folio-assistant-core/schemas/glossary.ts" },
      ],
    });
    expect("error" in schemeOwner(REPO, mixed, "folio-assistant-core", owners)).toBe(true);
    // The code-list case: the scheme names the instance that DEFINES it.
    expect(schemeOwner(REPO, { ...mixed, source: "cat-harness/schemas/odrl.ts" }, "folio-assistant-core", owners)).toEqual({ owner: "cat-harness" });
    // One instance holds every source: that instance, not the declaring one.
    expect(schemeOwner(REPO, g({ terms: [mixed.terms[0]] }), "folio-assistant-core", owners)).toEqual({ owner: "cat-harness" });
    // No repository source at all: the instance whose directory holds the file.
    expect(schemeOwner(REPO, g({ terms: [] }), "folio-assistant-core", owners)).toEqual({ owner: "folio-assistant-core" });
    // A sub-instance, never the root, holds a path inside it.
    expect(ownerOfPath(REPO, "cat-harness/schemas/odrl.ts", owners)).toBe("cat-harness");
    expect(ownerOfPath(REPO, "package.json", owners)).toBe("folio-assistant");
    expect(repoPathOf("https://example.org/x#y", REPO)).toBeUndefined();
    expect(repoPathOf("Skills of cat-harness", REPO)).toBeUndefined();
    expect(repoPathOf("cat-harness/schemas/odrl.ts#Policy", REPO)).toBe("cat-harness/schemas/odrl.ts");
  });
});

