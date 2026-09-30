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
import { spawnSync } from "node:child_process";
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

  // Bean `ramz`. This walked the filesystem behind a hand-written denylist,
  // so a gitignored directory the list did not name was swept as if it were
  // repository content: 145 documents of one machine's ingestion residue
  // failed `bun test` on a clean checkout of `main`.
  //
  // BOTH halves are asserted. A fix that returned nothing at all would pass
  // the ignored half on its own, and "skip everything" is indistinguishable
  // from "skip the right things" unless something still comes back.
  test("the corpus is what GIT accounts for — ignored out, unstaged in", () => {
    const root = mkdtempSync(join(tmpdir(), "ctxgit-"));
    const git = (...args: string[]): void => {
      const r = spawnSync("git", args, { cwd: root, encoding: "utf-8" });
      expect(r.status, `git ${args.join(" ")}: ${r.stderr}`).toBe(0);
    };
    git("init", "-q");
    writeFileSync(join(root, ".gitignore"), "staging/\n");
    mkdirSync(join(root, "staging"), { recursive: true });
    mkdirSync(join(root, "content"), { recursive: true });
    const doc = JSON.stringify({ "@context": {}, "@type": "probe:Thing" });
    writeFileSync(join(root, "staging", "residue.jsonld"), doc);
    writeFileSync(join(root, "content", "tracked.jsonld"), doc);
    git("add", "content/tracked.jsonld");
    // Never staged, never ignored: part of the change under test, so the
    // check has to see it. `--cached` alone would miss it.
    writeFileSync(join(root, "content", "unstaged.jsonld"), doc);

    const found = contentDocuments(root).map((f) => f.slice(root.length + 1)).sort();
    expect(found).toEqual(["content/tracked.jsonld", "content/unstaged.jsonld"]);
    rmSync(root, { recursive: true, force: true });
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

// ── Bean `zaqn`: the direction that corrupts data ─────────────────────────
//
// A prefix SPOKEN and bound nowhere is not an error to a JSON-LD processor —
// it reads the prefix as a URI scheme. So each test below breaks the corpus
// and requires the check to see it, and the "clean" cases assert a non-empty
// corpus first, for the reason at the top of this file.

import { checkPrefixDeclaration, declaredStubs } from "../check-context-emission.ts";
import { NS_PREFIXES, stubOfNamespace } from "../../schemas/namespaces.ts";

const URL = "https://example.org/ctx.jsonld";
const OWN = "https://litlfred.github.io/folio-assistant/some-instance/ns#";
const STUBS = new Set(["some-instance"]);

describe("a prefix that is spoken must be bound", () => {
  test("an unbound prefix in @type is caught — the `folio:` defect", () => {
    const root = corpus({ "a.jsonld": { "@context": URL, "@type": "folio:Definition" } });
    const r = checkPrefixDeclaration(root, { doco: "http://purl.org/spar/doco/" }, URL, STUBS);
    expect(r.documents).toBe(1);
    expect(r.undeclared.map((u) => u.prefix)).toEqual(["folio"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("an unbound prefix used as a KEY is caught", () => {
    const root = corpus({ "a.jsonld": { "@context": { doco: "http://purl.org/spar/doco/" }, "fac:anchor": 1 } });
    const r = checkPrefixDeclaration(root, {}, URL, STUBS);
    expect(r.undeclared.map((u) => u.prefix)).toEqual(["fac"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("the published context's own term targets are checked, with no document using them", () => {
    const root = corpus({ "a.jsonld": { "@context": URL } });
    const r = checkPrefixDeclaration(root, { fac: OWN.replace("some-instance", "x"), label: "folio:label" }, URL, STUBS);
    expect(r.undeclared.map((u) => u.prefix)).toContain("folio");
    rmSync(root, { recursive: true, force: true });
  });

  test("a bound prefix, an absolute IRI and a CURIE-shaped LITERAL are all clean", () => {
    const root = corpus({
      "a.jsonld": {
        "@context": [URL, { extra: "http://example.org/x#" }],
        "@type": ["doco:Section", "extra:Thing", "http://example.org/Abs"],
        // An authored label looks exactly like a CURIE and is not one.
        label: "def:foo",
      },
    });
    const r = checkPrefixDeclaration(root, { doco: "http://purl.org/spar/doco/", label: "doco:label" }, URL, STUBS);
    expect(r.documents).toBe(1);
    expect(r.undeclared).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  test("a context URL the check cannot resolve is the third state, never clean", () => {
    const root = corpus({ "a.jsonld": { "@context": "https://elsewhere.example/ctx", "@type": "zz:Q" } });
    const r = checkPrefixDeclaration(root, {}, URL, STUBS);
    expect(r.documents).toBe(0);
    expect(r.unresolved.count).toBe(1);
    expect(r.unresolved.urls).toEqual(["https://elsewhere.example/ctx"]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe("a prefix onto our own namespace is the declaring instance's stub", () => {
  test("an abbreviation is caught, once, however many times the context is read", () => {
    const root = corpus({ "a.jsonld": { "@context": { si: OWN }, "@type": "si:Thing" } });
    const r = checkPrefixDeclaration(root, {}, URL, STUBS);
    expect(r.misspelt).toEqual([{ prefix: "si", namespace: OWN, stub: "some-instance", where: "a.jsonld" }]);
    rmSync(root, { recursive: true, force: true });
  });

  test("the stub spelling is clean — and only if an instance declares that stub", () => {
    const root = corpus({ "a.jsonld": { "@context": { "some-instance": OWN }, "@type": "some-instance:Thing" } });
    expect(checkPrefixDeclaration(root, {}, URL, STUBS).misspelt).toEqual([]);
    expect(checkPrefixDeclaration(root, {}, URL, new Set()).misspelt).toHaveLength(1);
    rmSync(root, { recursive: true, force: true });
  });

  test("NS_PREFIXES: every key IS its namespace's stub, and a declared one", () => {
    const stubs = declaredStubs();
    expect(stubs.size).toBeGreaterThan(0);
    for (const [prefix, ns] of Object.entries(NS_PREFIXES)) {
      expect(stubOfNamespace(ns)).toBe(prefix);
      expect(stubs.has(prefix)).toBe(true);
    }
  });
});

describe("the real corpus", () => {
  test("every spoken prefix is bound and every own prefix is a stub", () => {
    const r = checkPrefixDeclaration();
    expect(r.documents).toBeGreaterThan(0);
    expect(r.undeclared).toEqual([]);
    expect(r.misspelt).toEqual([]);
    expect(r.unresolved.count).toBe(0);
  });
});

// ── Every plain key is a declared term — bean `yh6u` ──────────────────────

import { checkDeclaredKeys } from "../check-context-emission.ts";

describe("a key a content document writes must be a declared term", () => {
  const C = { title: "dcterms:title", narrative: { "@id": "x:n", "@type": "@json" } } as Record<string, unknown>;
  const U = "https://example.org/ctx.jsonld";

  test("an undeclared key is caught — the 392-figure-narrative defect", () => {
    const root = corpus({ "a.jsonld": { "@context": U, title: "t", drafted_by: { id: "x" } } });
    const k = checkDeclaredKeys(root, C, U);
    expect(k.documents).toBe(1);
    expect(k.undeclared.map((u) => u.prefix).sort()).toEqual(["drafted_by", "id"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("keys INSIDE a `@json` value are data, never flagged", () => {
    const root = corpus({ "a.jsonld": { "@context": U, narrative: { text: null, drafted_by: { id: "x" } } } });
    const k = checkDeclaredKeys(root, C, U);
    expect(k.documents).toBe(1);
    expect(k.undeclared).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  test("a document on another context is not this check's to judge", () => {
    const root = corpus({ "a.jsonld": { "@context": "https://other.example/ctx", whatever: 1 } });
    expect(checkDeclaredKeys(root, C, U).documents).toBe(0);
    rmSync(root, { recursive: true, force: true });
  });

  test("the real corpus: every key declared, over a non-empty corpus", () => {
    const k = checkDeclaredKeys();
    expect(k.documents).toBeGreaterThan(0);
    expect(k.undeclared).toEqual([]);
  });
});

// ── A path is never an `@id` — bean `589f` ────────────────────────────────

import { checkPathsAreNotLinks, looksLikePath } from "../check-context-emission.ts";

describe("a file path under an `@id` term is caught", () => {
  const U = "https://example.org/ctx.jsonld";
  const LINKED = { text: { "@id": "x:text", "@type": "@id" }, uses: { "@id": "x:uses", "@type": "@id" } } as Record<string, unknown>;
  const LITERAL = { text: { "@id": "x:text" }, uses: { "@id": "x:uses", "@type": "@id" } } as Record<string, unknown>;

  test("the 589f shape — `../sections/x.md` under a coerced `text` — fails", () => {
    const root = corpus({ "a.jsonld": { "@context": U, text: "../sections/sec-001-intro.md", uses: ["papers/p/blocks/def-a"] } });
    const p = checkPathsAreNotLinks(root, LINKED, U);
    expect(p.documents).toBe(1);
    expect(p.undeclared.map((u) => u.prefix)).toEqual(["text"]);
    rmSync(root, { recursive: true, force: true });
  });

  test("the same value under a LITERAL `text` passes, and node ids never trip it", () => {
    const root = corpus({ "a.jsonld": { "@context": U, text: "../sections/sec-001-intro.md", uses: ["papers/p/blocks/def-a"] } });
    const p = checkPathsAreNotLinks(root, LITERAL, U);
    expect(p.documents).toBe(1);
    expect(p.undeclared).toEqual([]);
    rmSync(root, { recursive: true, force: true });
  });

  test("what counts as a path", () => {
    for (const v of ["../sections/a.md", "./x", "thm-foo.md", "Proof.lean", "img.PNG"]) expect(looksLikePath(v)).toBe(true);
    for (const v of ["library/doc/blocks/prose-sec-001", "papers/p/blocks/def-a", "https://example.org/x"]) expect(looksLikePath(v)).toBe(false);
  });

  test("the real corpus: no path under an `@id` term", () => {
    const p = checkPathsAreNotLinks();
    expect(p.documents).toBeGreaterThan(0);
    expect(p.undeclared).toEqual([]);
  });
});
