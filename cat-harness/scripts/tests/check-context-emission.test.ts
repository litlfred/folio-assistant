/**
 * `check-context-emission.ts` — bean `fd6i`, the other direction from `ovkk`.
 *
 * @module scripts/tests/check-context-emission
 * @graphNode none — a test
 *
 * ## Why every test here starts by asserting the corpus is non-empty
 *
 * Every number this check produces is a count over documents. A corpus of
 * nothing makes all of them zero — and zero reads either as "every prefix is
 * dead" or, once the prefixes carry reasons, as a clean run over nothing.
 * That second reading is `6tkl` and is the one failure a check like this
 * cannot be allowed to have, because it is indistinguishable from success.
 *
 * ## Both directions, because both are silent
 *
 * A prefix bound and never emitted loses nothing at runtime — a processor
 * simply does not use it — so a check that only reported findings would look
 * identical to one that reported nothing. The mutations below therefore have
 * to break it in each direction and be caught in each.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  FORWARD_DECLARED,
  checkContextEmission,
  contentDocuments,
  prefixesOf,
} from "../check-context-emission.ts";
import { CONTENT_CONTEXT } from "../../schemas/jsonld.ts";

/** A tree of `.jsonld` documents, and nothing else. */
function corpus(docs: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "ctxemit-"));
  for (const [rel, body] of Object.entries(docs)) {
    mkdirSync(join(root, rel, ".."), { recursive: true });
    writeFileSync(join(root, rel), JSON.stringify(body));
  }
  return root;
}

const CTX = {
  doco: "http://purl.org/spar/doco/",
  dcterms: "http://purl.org/dc/terms/",
  unused: "http://example.org/unused#",
  // A term ALIAS: a node carrying `title` emits `dcterms:` once expanded,
  // with no `dcterms:` anywhere in the document.
  title: "dcterms:title",
} as Record<string, unknown>;

describe("a prefix is spoken two ways, and missing either invents a finding", () => {
  test("a literal CURIE counts", () => {
    const root = corpus({ "a.jsonld": { "@type": "doco:Section" } });
    const r = checkContextEmission(root, CTX);
    expect(r.documents).toBe(1);
    expect(r.counts.doco).toBeGreaterThan(0);
    rmSync(root, { recursive: true, force: true });
  });

  test("a TERM ALIAS counts — `title` speaks dcterms with no `dcterms:` in the file", () => {
    // The half a prefix-only scan misses. Without it `dcterms` reads as dead
    // while 1551 nodes speak it in the real corpus.
    const root = corpus({ "a.jsonld": { title: "A page" } });
    const r = checkContextEmission(root, CTX);
    expect(r.documents).toBe(1);
    expect(r.counts.dcterms).toBeGreaterThan(0);
    // ...and the literal-CURIE path did not fire for it.
    expect(r.counts.doco).toBe(0);
    rmSync(root, { recursive: true, force: true });
  });

  test("an absolute IRI is not mistaken for a CURIE", () => {
    // `https://example.org/x` would read as prefix `https` under a naive
    // `^(\w+):` — and any context binding `https` would then look alive.
    const root = corpus({ "a.jsonld": { seeAlso: "https://example.org/x" } });
    const r = checkContextEmission(root, { ...CTX, https: "http://example.org/wrong#" });
    expect(r.counts.https).toBe(0);
    rmSync(root, { recursive: true, force: true });
  });

  test("nested values count — the walk is not shallow", () => {
    const root = corpus({ "a.jsonld": { "@graph": [{ parts: [{ "@type": "doco:Figure" }] }] } });
    expect(checkContextEmission(root, CTX).counts.doco).toBeGreaterThan(0);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("the third state: forward-declared with a reason, never a silence", () => {
  test("an unemitted prefix with NO reason is the finding", () => {
    const root = corpus({ "a.jsonld": { "@type": "doco:Section", title: "x" } });
    const r = checkContextEmission(root, CTX);
    expect(r.silent).toEqual(["unused"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("...and every real unemitted prefix HAS one, so the tree passes", () => {
    // Over the REAL context and corpus, not a fixture: this is the assertion
    // that would go red if somebody bound a vocabulary and walked away.
    const r = checkContextEmission();
    expect(r.documents).toBeGreaterThan(0);
    expect(r.silent).toEqual([]);
  });

  test("a reason is not optional — every FORWARD_DECLARED entry says what would emit it", () => {
    // A one-word reason is a silence with extra steps. Each entry has to name
    // the thing whose arrival makes the exemption expire.
    const short = Object.entries(FORWARD_DECLARED).filter(([, why]) => why.trim().length < 40);
    expect(short.map(([p]) => p)).toEqual([]);
  });

  test("a forward declaration that STARTED emitting is reported as stale", () => {
    // Otherwise a later silence hides behind a reason that already came true.
    const root = corpus({ "a.jsonld": { "@type": "doco:Section" } });
    const r = checkContextEmission(root, { doco: "http://purl.org/spar/doco/" });
    expect(r.staleForward.map((s) => s.prefix)).toContain("doco");
    rmSync(root, { recursive: true, force: true });
  });
});

describe("an empty corpus is a FINDING, never a clean run", () => {
  test("zero documents is reported as zero rather than as agreement", () => {
    // `6tkl`. With no documents every count is zero, so a check that did not
    // notice would report either "everything is dead" or — since each of
    // those has a reason — "all clear". The second is the dangerous one.
    const root = mkdtempSync(join(tmpdir(), "ctxempty-"));
    const r = checkContextEmission(root, CTX);
    expect(r.documents).toBe(0);
    rmSync(root, { recursive: true, force: true });
  });

  test("the real repository HAS a corpus, so the suite above is not vacuous", () => {
    expect(contentDocuments().length).toBeGreaterThan(100);
  });
});

describe("the bound set is read from the context, not listed here", () => {
  test("every bound prefix is either counted or forward-declared — no third bucket", () => {
    const { bound } = prefixesOf(CONTENT_CONTEXT as Record<string, unknown>);
    const r = checkContextEmission();
    expect(bound.length).toBeGreaterThan(0);
    const accounted = new Set([
      ...Object.entries(r.counts).filter(([, n]) => n > 0).map(([p]) => p),
      ...r.forward.map((f) => f.prefix),
      ...r.silent,
    ]);
    expect(bound.filter((p) => !accounted.has(p))).toEqual([]);
  });

  test("a term alias is NOT counted as a bound prefix", () => {
    // `title: "dcterms:title"` declares a term, not a namespace. Counting it
    // as bound would demand that something emit a prefix called `title`.
    const { bound, aliasPrefix } = prefixesOf(CTX);
    expect(bound.sort()).toEqual(["dcterms", "doco", "unused"]);
    expect(aliasPrefix.get("title")).toBe("dcterms");
  });
});
