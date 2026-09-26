/**
 * The pre-deployment verifier set — bean `vigi`.
 *
 * Falsified, not assumed: each property is asserted on a document built to
 * break it, beside the real generated documents that must pass.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import jsonld from "jsonld";

import { CONTENT_CONTEXT_URL } from "../../schemas/jsonld";
import { CAT_HARNESS_NS } from "../../schemas/namespaces";
import { buildFshGutsExport } from "../fsh-guts-export";
import { buildGlossary } from "../glossary-export";
import { buildVocabulary } from "../ns-export";
import { codeListDirs, loadCodeLists } from "../../schemas/code-list";
import { buildCodeListsDoc } from "../code-lists";
import { HTML_UNIQUE_IDS, JSONLD_EXPAND, declaredBase, expandFindings, isOurs, localLoader, verify } from "../publish-verify";

const site = (files: Record<string, unknown>): string => {
  const dir = mkdtempSync(join(tmpdir(), "publish-verify-"));
  for (const [p, doc] of Object.entries(files)) {
    mkdirSync(join(dir, p, ".."), { recursive: true });
    writeFileSync(join(dir, p), typeof doc === "string" ? doc : JSON.stringify(doc));
  }
  return dir;
};
// One verifier at a time: a tree holding only JSON-LD is "could not tell" for
// the HTML check, which is right for a deploy and noise for these cases.
const JSONLD = [JSONLD_EXPAND];
const ours = (extra: Record<string, unknown> = {}) => ({
  "@context": { cat: CAT_HARNESS_NS, label: "http://www.w3.org/2000/01/rdf-schema#label" },
  "@id": "https://litlfred.github.io/folio-assistant/x.jsonld",
  label: "x",
  ...extra,
});

describe("the JSON-LD verifier", () => {
  test("a clean document of ours passes", async () => {
    const { exit, results } = await verify(site({ "a.jsonld": ours() }), JSONLD);
    expect(exit).toBe(0);
    expect(results[0]!.checked).toBe(1);
  });

  test("FAILS on a key the context does not declare — the property a processor silently drops", async () => {
    const { exit, results } = await verify(site({ "a.jsonld": ours({ layer: "harness" }) }), JSONLD);
    expect(exit).toBe(1);
    expect(results[0]!.findings[0]!.detail).toMatch(/invalid property \(layer\)/);
  });

  test("FAILS on a context it would have to fetch from the network", async () => {
    const doc = { "@context": [`https://example.org/ctx.jsonld`, { cat: CAT_HARNESS_NS }], "@id": "urn:x", "cat:a": 1 };
    const { exit } = await verify(site({ "a.jsonld": doc }), JSONLD);
    expect(exit).toBe(1);
  });

  test("third-party documents are counted, never verified, never blocking", async () => {
    const who = { "@context": { v: "http://smart.who.int/x/" }, "@id": "#relative", "v:a": 1 };
    const { exit, results } = await verify(site({ "a.jsonld": ours(), "who/b.jsonld": who }), JSONLD);
    expect(exit).toBe(0);
    expect(results[0]!.outOfScope).toBe(1);
    expect(isOurs(who)).toBe(false);
  });

  test("nothing to verify is COULD NOT TELL, not a pass", async () => {
    const { exit, results } = await verify(site({}));
    expect(exit).toBe(2);
    expect(results[0]!.couldNotTell).toBeDefined();
  });
});

describe("the unique-id verifier — bean uknu", () => {
  const page = (body: string) => `<!doctype html><html><body>${body}</body></html>`;

  test("a page declaring each id once passes", async () => {
    const { exit, results } = await verify(site({ "a.html": page('<h2 id="x">X</h2><a href="#x">x</a>') }), [HTML_UNIQUE_IDS]);
    expect(exit).toBe(0);
    expect(results[0]!.checked).toBe(1);
  });

  test("FAILS on the defect that was shipped: the nav checkbox rendered twice", async () => {
    const box = '<input type="checkbox" class="fa-nav-open" id="fa-nav-open">';
    const { exit, results } = await verify(site({ "p/a.html": page(box + box) }), [HTML_UNIQUE_IDS]);
    expect(exit).toBe(1);
    expect(results[0]!.findings).toEqual([{ verifier: "html-unique-ids", file: "p/a.html", detail: "duplicate id fa-nav-open ×2" }]);
  });

  test("...and names the page and every id it repeats", async () => {
    const { results } = await verify(site({ "x.html": page('<h3 id="hl7-fhir">HL7 FHIR</h3><p><a id="hl7-fhir"></a></p>') }), [HTML_UNIQUE_IDS]);
    expect(results[0]!.findings.map((f) => f.detail)).toEqual(["duplicate id hl7-fhir ×2"]);
  });
  // The scanner's own edge cases (code samples, script bodies, quote styles)
  // are `duplicate-ids.test.ts`'s; this file owns only the verifier around it.
});

describe("the documents this platform actually publishes", () => {
  // Built in memory by the same functions the site build runs. The two found
  // by the first run — `layer` on 159 vocabulary terms, `skipped` on the
  // trashcan export — are the regression this pins.
  const loader = localLoader(tmpdir());
  test.each([
    ["the swimlane glossary", () => buildGlossary().doc],
    ["the vocabulary", () => buildVocabulary().doc],
    ["the fsh-guts export", () => buildFshGutsExport()],
  ])("%s expands with no warning", async (_name, build) => {
    expect(await expandFindings(build() as object, loader)).toEqual([]);
  });

  test("the glossary round-trips: expand then compact keeps every concept", async () => {
    const doc = buildGlossary().doc as { "@context": object; "@graph": unknown[] };
    const expanded = await jsonld.expand(doc as object, { documentLoader: loader as never });
    const compacted = (await jsonld.compact(expanded, doc["@context"] as never, { documentLoader: loader as never })) as {
      "@graph"?: unknown[];
    };
    expect((compacted["@graph"] ?? []).length).toBe(doc["@graph"].length);
  });

  test("the content context resolves locally, never over the network", async () => {
    const r = await localLoader(tmpdir())(CONTENT_CONTEXT_URL);
    expect(r.document).toHaveProperty("@context");
  });
});

describe("a document published at our address is ours, whatever vocabulary it speaks — bean 7h1c", () => {
  const INSTANCE = join(import.meta.dir, "..", "..");
  const BASE = declaredBase(INSTANCE)!;
  const skosOnly = (id: string) => ({
    "@context": { skos: "http://www.w3.org/2004/02/skos/core#", prefLabel: "skos:prefLabel" },
    "@id": id,
    prefLabel: "x",
  });

  test("the declaration names the base — otherwise every case below is vacuous", () => {
    expect(BASE).toMatch(/^https:\/\//);
  });

  test("an @id under a base makes a SKOS-only document ours; a lookalike prefix does not", () => {
    expect(isOurs(skosOnly(`${BASE}/cat-harness-code-lists.jsonld`), [BASE])).toBe(true);
    expect(isOurs(skosOnly(`${BASE}-evil/x.jsonld`), [BASE])).toBe(false);
    expect(isOurs(skosOnly(`${BASE}/x.jsonld`))).toBe(false);
  });

  test("the REAL code-lists document is checked, not counted out of scope", async () => {
    // The defect this bean records: its context binds only skos/dcterms/owl/rdf,
    // so the context test alone scoped it out and nothing verified it.
    const lists = [...loadCodeLists(await codeListDirs(INSTANCE)).values()];
    const doc = buildCodeListsDoc(lists, `${BASE}/cat-harness-code-lists.jsonld`);
    const dir = site({ "cat-harness-code-lists.jsonld": doc });
    const before = await verify(dir, JSONLD);
    expect(before.results[0]!.outOfScope).toBe(1);
    const after = await verify(dir, JSONLD, { bases: [BASE] });
    expect(after.exit).toBe(0);
    expect(after.results[0]!.checked).toBe(1);
    expect(after.results[0]!.outOfScope).toBe(0);
  });
});
