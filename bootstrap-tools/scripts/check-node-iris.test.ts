import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { checkNodeIris, ownIdentifier } from "./check-node-iris.ts";
import { releaseIris } from "../schemas/release-iri.ts";

const BASE = "https://example.org/kg/";
const AGENT = `${BASE}1.2.3/`;

function kg(files: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "node-iris-"));
  for (const [p, doc] of Object.entries(files)) {
    mkdirSync(join(root, p, ".."), { recursive: true });
    writeFileSync(join(root, p), JSON.stringify(doc));
  }
  return root;
}

describe("check-node-iris", () => {
  test("an identifier that is its file's path passes; so does the path without its extension", () => {
    const root = kg({
      "schemas/a.schema.json": { $id: `${AGENT}schemas/a.schema.json` },
      "processes/ns.jsonld": { "@id": `${AGENT}processes/ns` },
      "processes/other.jsonld": { "@id": `${AGENT}processes/other.jsonld#frag` },
    });
    expect(checkNodeIris(root, BASE, AGENT)).toEqual([]);
  });

  test("a slash vocabulary names its directory: `processes/ns.jsonld` may say `processes/ns/` (#1378)", () => {
    const root = kg({ "processes/ns.jsonld": { "@id": `${AGENT}processes/ns/` } });
    expect(checkNodeIris(root, BASE, AGENT)).toEqual([]);
    const other = kg({ "processes/ns.jsonld": { "@id": `${AGENT}processes/other/` } });
    expect(checkNodeIris(other, BASE, AGENT).length).toBe(1);
  });

  test("an identifier naming another path fails — the discussion-schema defect", () => {
    const root = kg({ "schemas/discussion.input.schema.json": { $id: `${AGENT}skills/discussion/input.schema.json` } });
    expect(checkNodeIris(root, BASE, AGENT).map((f) => f.why)).toEqual([
      "names `skills/discussion/input.schema.json`, but the file sits at `schemas/discussion.input.schema.json`",
    ]);
  });

  test("an identifier at another release of the same base fails; one outside the base is not this gate's", () => {
    const root = kg({
      "a.json": { $id: `${BASE}0.9.0/a.json` },
      "b.json": { $id: "https://elsewhere.org/b.json" },
    });
    expect(checkNodeIris(root, BASE, AGENT).map((f) => f.file)).toEqual(["a.json"]);
  });

  test("a full version of the declared major is another release: it FAILS (the bootstrap-tools#39 tolerance is gone)", () => {
    const R = releaseIris({ iriBase: BASE, version: "1.4.0" })!; // agent: <BASE>v1/
    const root = kg({ "schemas/a.schema.json": { $id: `${BASE}1.2.3/schemas/a.schema.json` } });
    expect(checkNodeIris(root, R.iriBase, R.agent).map((f) => f.file)).toEqual(["schemas/a.schema.json"]);
  });


  test("only a document's own top-level identifier counts", () => {
    expect(ownIdentifier({ items: { $id: "x" } })).toBeUndefined();
    expect(ownIdentifier([{ "@id": "x" }])).toBeUndefined();
    expect(ownIdentifier({ "@id": "x" })).toBe("x");
  });
});
