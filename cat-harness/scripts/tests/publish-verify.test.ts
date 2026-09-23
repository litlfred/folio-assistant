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
import { expandFindings, isOurs, localLoader, verify } from "../publish-verify";

const site = (files: Record<string, unknown>): string => {
  const dir = mkdtempSync(join(tmpdir(), "publish-verify-"));
  for (const [p, doc] of Object.entries(files)) {
    mkdirSync(join(dir, p, ".."), { recursive: true });
    writeFileSync(join(dir, p), JSON.stringify(doc));
  }
  return dir;
};
const ours = (extra: Record<string, unknown> = {}) => ({
  "@context": { cat: CAT_HARNESS_NS, label: "http://www.w3.org/2000/01/rdf-schema#label" },
  "@id": "https://litlfred.github.io/folio-assistant/x.jsonld",
  label: "x",
  ...extra,
});

describe("the JSON-LD verifier", () => {
  test("a clean document of ours passes", async () => {
    const { exit, results } = await verify(site({ "a.jsonld": ours() }));
    expect(exit).toBe(0);
    expect(results[0]!.checked).toBe(1);
  });

  test("FAILS on a key the context does not declare — the property a processor silently drops", async () => {
    const { exit, results } = await verify(site({ "a.jsonld": ours({ layer: "harness" }) }));
    expect(exit).toBe(1);
    expect(results[0]!.findings[0]!.detail).toMatch(/invalid property \(layer\)/);
  });

  test("FAILS on a context it would have to fetch from the network", async () => {
    const doc = { "@context": [`https://example.org/ctx.jsonld`, { cat: CAT_HARNESS_NS }], "@id": "urn:x", "cat:a": 1 };
    const { exit } = await verify(site({ "a.jsonld": doc }));
    expect(exit).toBe(1);
  });

  test("third-party documents are counted, never verified, never blocking", async () => {
    const who = { "@context": { v: "http://smart.who.int/x/" }, "@id": "#relative", "v:a": 1 };
    const { exit, results } = await verify(site({ "a.jsonld": ours(), "who/b.jsonld": who }));
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
