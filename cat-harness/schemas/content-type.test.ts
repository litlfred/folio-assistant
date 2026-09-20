/**
 * Asking a repository what it is, and getting a SET back.
 *
 * @module schemas/content-type.test
 *
 * The thing this replaces is one line of shell in `getting-started.md`:
 *
 * ```sh
 * test -f harness.config.json && echo isFolio=true
 * ```
 *
 * One filename, one boolean, no type behind it — and wrong about the first
 * repository anybody asks it about, since `smart-base` is a DAK *and* a SUSHI
 * project at once. Bean `79t3`.
 *
 * Fixtures throughout. An assertion about what THIS repository is would pin
 * today's markers and go green the day somebody added one, which is a fact
 * about the subject rather than about the code.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ContentTypeConflictError,
  ContentTypeRegistry,
  describeRepository,
} from "./content-type";
import { registerBaseContentTypes } from "./content-types-base";
import { registerDakContentTypes } from "./dak-content-type";

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
});

/** A repository carrying the given marker files, by filename → contents. */
function repo(markers: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "ctype-"));
  roots.push(root);
  mkdirSync(root, { recursive: true });
  for (const [name, body] of Object.entries(markers)) {
    writeFileSync(join(root, name), body);
  }
  return root;
}

/**
 * A registry carrying every type a full stack would register, isolated from
 * the shared default.
 *
 * TWO calls, and the split is load-bearing rather than cosmetic: `harness` is
 * core's, `dak` and `sushi` are the WHO layer's, and
 * `check:partition:edges` refuses core importing `dak.ts` because `smart-base`
 * depends on core. A test that registered them from one module would be
 * testing an arrangement the import graph rejects.
 */
function base(): ContentTypeRegistry {
  const r = new ContentTypeRegistry();
  registerBaseContentTypes(r);
  registerDakContentTypes(r);
  return r;
}

describe("a repository is a SET of types, not a boolean", () => {
  test("no known marker → empty, and that is not 'it is nothing'", () => {
    // The distinction the boolean could not make: this registry found no
    // marker it knows. A consumer reading that as "not a folio" has confused
    // what was looked for with what is there.
    const d = describeRepository(repo({ "README.md": "# hi\n" }), base());
    expect(d.types).toEqual([]);
    expect(d.disagreements).toEqual([]);
  });

  test("one marker → one membership, with a dereferenceable type", () => {
    const d = describeRepository(repo({ "harness.json": '{"name":"x"}' }), base());
    expect(d.types.map((t) => t.id)).toEqual(["harness"]);
    // The IRI is the whole point: the filename asserts membership, the type
    // says what membership MEANS. A marker with no resolvable type is `blv9`.
    expect(d.types[0]!.type).toMatch(/^https?:\/\//);
    expect(d.types[0]!.marker).toBe("harness.json");
  });

  test("TWO markers → two memberships — the case the boolean got wrong", () => {
    // `smart-base` is a DAK and a SUSHI project simultaneously. This is the
    // measured shape of the repository `79t3` cites, and the reason the answer
    // had to become a set.
    const root = repo({
      "dak.json": '{"name":"base","canonicalUrl":"http://smart.who.int/base"}',
      "sushi-config.yaml": "canonical: http://smart.who.int/base\n",
    });
    expect(describeRepository(root, base()).types.map((t) => t.id).sort()).toEqual([
      "dak",
      "sushi",
    ]);
  });

  test("three at once, including ours", () => {
    const root = repo({
      "harness.json": '{"name":"x"}',
      "dak.json": '{"name":"x"}',
      "sushi-config.yaml": "canonical: http://example.org/x\n",
    });
    expect(describeRepository(root, base()).types).toHaveLength(3);
  });
});

describe("a marker that is present and unreadable is its OWN state", () => {
  test("unparseable → membership reported, `parsed: false`, no facts", () => {
    // Not absent, and not a clean membership either. Dropping it would under-
    // report what the repository asserts; reporting it as parsed would hand a
    // consumer facts nothing backs. The third state says which.
    const d = describeRepository(repo({ "harness.json": "{ not json" }), base());
    expect(d.types).toHaveLength(1);
    expect({ parsed: d.types[0]!.parsed, facts: d.types[0]!.facts }).toEqual({
      parsed: false,
      facts: {},
    });
  });

  test("YAML marker → membership reported, parsed false, and that is deliberate", () => {
    // `sushi-config.yaml` is the assertion whether or not this module can read
    // it. Reporting the membership costs nothing and losing it would be a
    // silent under-count; the facts wait on a YAML parser, which is a separate
    // decision with a real import cost.
    const d = describeRepository(repo({ "sushi-config.yaml": "canonical: http://x/\n" }), base());
    expect(d.types.map((t) => ({ id: t.id, parsed: t.parsed }))).toEqual([
      { id: "sushi", parsed: false },
    ]);
  });

  test("a marker with no facts contributes none — absent is not 'agrees'", () => {
    const d = describeRepository(repo({ "harness.json": "{}" }), base());
    expect(d.types[0]!.facts).toEqual({});
    expect(d.disagreements).toEqual([]);
  });
});

describe("two markers stating one fact differently are REPORTED, not resolved", () => {
  test("a disagreement is found and both claims are kept", () => {
    // `79t3` question 2, and its own "Done when" already answered it:
    // "a disagreement between two markers REPORTED rather than silently
    // resolved". Ranking the markers would make a repository's truth depend on
    // which layer happened to load first.
    const root = repo({
      "harness.json": '{"name":"x","canonicalUrl":"http://one.example/"}',
      "dak.json": '{"name":"x","canonicalUrl":"http://two.example/"}',
    });
    const d = describeRepository(root, base());
    expect(d.disagreements).toHaveLength(1);
    expect(d.disagreements[0]!.fact).toBe("canonicalUrl");
    expect(d.disagreements[0]!.claims).toEqual({
      harness: "http://one.example/",
      dak: "http://two.example/",
    });
  });

  test("NOTHING is resolved — neither claim is dropped or preferred", () => {
    // Stated as its own assertion because "reports it" and "reports it and
    // also quietly picks one" look identical from a caller that only reads
    // `types`. Both claims survive in full.
    const root = repo({
      "harness.json": '{"name":"x","canonicalUrl":"http://one.example/"}',
      "dak.json": '{"name":"x","canonicalUrl":"http://two.example/"}',
    });
    const d = describeRepository(root, base());
    const byId = Object.fromEntries(d.types.map((t) => [t.id, t.facts["canonicalUrl"]]));
    expect(byId).toEqual({ harness: "http://one.example/", dak: "http://two.example/" });
  });

  test("agreement is silence, not a finding", () => {
    const root = repo({
      "harness.json": '{"name":"x","canonicalUrl":"http://same.example/"}',
      "dak.json": '{"name":"x","canonicalUrl":"http://same.example/"}',
    });
    expect(describeRepository(root, base()).disagreements).toEqual([]);
  });

  test("`dak.json` spelling `canonical` is compared against `canonicalUrl`", () => {
    // The two files beside each other in `smart-base` spell one fact two ways.
    // Reading only our spelling would make every such disagreement invisible,
    // which is the failure mode this whole section exists to prevent.
    const root = repo({
      "harness.json": '{"name":"x","canonicalUrl":"http://ours.example/"}',
      "dak.json": '{"name":"x","canonical":"http://theirs.example/"}',
    });
    expect(describeRepository(root, base()).disagreements.map((x) => x.fact)).toEqual([
      "canonicalUrl",
    ]);
  });
});

describe("the registry refuses a conflicting redefinition and tolerates a diamond", () => {
  test("re-registering the SAME definition is a no-op", () => {
    const r = base();
    expect(() => registerBaseContentTypes(r)).not.toThrow();
    expect(() => registerDakContentTypes(r)).not.toThrow();
    expect(r.ids().sort()).toEqual(["dak", "harness", "sushi"]);
  });

  test("re-registering a DIFFERENT definition throws, naming the id", () => {
    const r = base();
    expect(() =>
      r.register("dak", { filename: "elsewhere.json", type: "http://x/", summary: "no" }),
    ).toThrow(ContentTypeConflictError);
  });
});
