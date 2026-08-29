/**
 * A folio label looks like a JSON-LD compact IRI and is not one. `def:foo` has
 * the shape `prefix:reference`, but `def` names a **block kind**, not a
 * namespace — and JSON-LD splits a compact IRI on its *first* colon. Handing
 * labels to a JSON-LD processor as IRI values therefore fails in two ways that
 * both produce valid output and no error:
 *
 *  - `def:quantum-universe` lands in a per-*kind* namespace, while the same
 *    block referenced cross-paper (`some-paper:def:quantum-universe`) lands in
 *    a per-*paper* one. Two IRIs, one block; every graph join under-counts.
 *  - `unital-groebner-bases:cor:pbw` splits into an undefined prefix plus
 *    `cor:pbw`, so a processor falls back to reading the whole string as an
 *    absolute IRI with scheme `unital-groebner-bases`. Well-formed, and
 *    meaningless.
 *
 * `resolveLabel` exists to make both impossible: it mints `@id` itself, so
 * every reference form for one block resolves to one IRI, and a reference it
 * cannot parse returns `undefined` rather than a plausible-looking IRI.
 *
 * These tests pin that, and pin the round-trip that lets a consumer get back
 * from an IRI to the label an author actually wrote.
 */
import { describe, test, expect } from "bun:test";
import {
  assertPrefixesInSync,
  KIND_PREFIXES,
  labelToSegment,
  parseReference,
  resolveLabel,
  segmentToLabel,
  mintNodeId,
  typesForKind,
  BLOCK_KIND_TO_FOLIO_TYPE,
} from "../../schemas/jsonld";
import { KNOWN_LABEL_PREFIXES } from "../../schemas/constraints";
import { BLOCK_KINDS } from "../../schemas/block-kinds";

describe("prefix list stays in sync with constraints.ts", () => {
  test("KIND_PREFIXES mirrors KNOWN_LABEL_PREFIXES", () => {
    expect(() => assertPrefixesInSync(KNOWN_LABEL_PREFIXES)).not.toThrow();
  });

  test("the guard actually fires when they diverge", () => {
    expect(() => assertPrefixesInSync([...KNOWN_LABEL_PREFIXES, "newkind:"])).toThrow(
      /out of sync/,
    );
  });
});

describe("parseReference — the three authored forms", () => {
  test("same-paper label", () => {
    expect(parseReference("def:quantum-universe")).toEqual({
      form: "same-paper",
      prefix: "def",
      slug: "quantum-universe",
    });
  });

  test("cross-paper label", () => {
    expect(parseReference("unital-groebner-bases:cor:pbw")).toEqual({
      form: "cross-paper",
      namespace: ["unital-groebner-bases"],
      prefix: "cor",
      slug: "pbw",
    });
  });

  test("nested namespace, per citesProvable's documented grammar", () => {
    expect(parseReference("some-ns:unital-groebner-bases:prop:foo")).toEqual({
      form: "cross-paper",
      namespace: ["some-ns", "unital-groebner-bases"],
      prefix: "prop",
      slug: "foo",
    });
  });

  test("cross-folio URL passes through untouched", () => {
    const u = "https://folio.example.org/papers/foo#def:bar";
    expect(parseReference(u)).toEqual({ form: "absolute", iri: u });
  });

  test("a slug may itself contain a colon — first kind prefix wins", () => {
    expect(parseReference("def:foo:bar")).toEqual({
      form: "same-paper",
      prefix: "def",
      slug: "foo:bar",
    });
  });
});

describe("parseReference — refuses to guess", () => {
  test("no kind prefix anywhere is unresolvable, not an absolute IRI", () => {
    const r = parseReference("unital-groebner-bases:mystery:pbw");
    expect(r.form).toBe("unresolvable");
    // The whole point: this string IS a syntactically valid absolute IRI, and
    // a naive JSON-LD processor would happily keep it.
    expect(resolveLabel("unital-groebner-bases:mystery:pbw", "qou")).toBeUndefined();
  });

  test("a bare word with no colon is unresolvable", () => {
    expect(parseReference("quantum-universe").form).toBe("unresolvable");
  });

  test("an empty slug is unresolvable", () => {
    expect(parseReference("def:").form).toBe("unresolvable");
  });
});

describe("resolveLabel — one block, one IRI", () => {
  test("same-paper and cross-paper forms of one block agree", () => {
    const fromInside = resolveLabel("cor:pbw", "unital-groebner-bases");
    const fromOutside = resolveLabel("unital-groebner-bases:cor:pbw", "qou");
    expect(fromInside).toBe("papers/unital-groebner-bases/blocks/cor-pbw");
    expect(fromOutside).toBe(fromInside);
  });

  test("the same label in two papers does NOT collide", () => {
    expect(resolveLabel("def:foo", "qou")).not.toBe(resolveLabel("def:foo", "other"));
  });

  test("nested namespaces become path segments", () => {
    expect(resolveLabel("some-ns:paper-dir:prop:foo", "qou")).toBe(
      "papers/some-ns/paper-dir/blocks/prop-foo",
    );
  });

  test("emitted IRIs are relative, so a deploy-base change rewrites nothing", () => {
    expect(resolveLabel("def:foo", "qou")!.startsWith("http")).toBe(false);
  });
});

describe("label ↔ IRI segment round-trip", () => {
  test("round-trips a hyphenated slug", () => {
    const seg = labelToSegment("def", "quantum-universe");
    expect(seg).toBe("def-quantum-universe");
    expect(segmentToLabel(seg)).toBe("def:quantum-universe");
  });

  test("round-trips every known kind prefix", () => {
    for (const p of KIND_PREFIXES) {
      expect(segmentToLabel(labelToSegment(p, "a-b-c"))).toBe(`${p}:a-b-c`);
    }
  });

  test("a foreign segment yields undefined rather than a bogus label", () => {
    expect(segmentToLabel("notaprefix-foo")).toBeUndefined();
    expect(segmentToLabel("nohyphen")).toBeUndefined();
  });
});

describe("types", () => {
  test("every block kind has a folio type", () => {
    for (const k of BLOCK_KINDS) {
      expect(BLOCK_KIND_TO_FOLIO_TYPE[k]).toBeTruthy();
      expect(typesForKind(k).length).toBeGreaterThan(0);
    }
  });

  test("an unknown kind yields no types rather than a guessed one", () => {
    expect(typesForKind("not-a-kind")).toEqual([]);
  });

  test("simulator carries no DoCO co-type — it has no counterpart", () => {
    expect(typesForKind("simulator")).toEqual(["folio:Simulator"]);
  });
});

describe("mintNodeId — a block's own label always yields an id", () => {
  test("a prefixed label mints the same id resolveLabel gives", () => {
    expect(mintNodeId("def:widget", "qou")).toBe(resolveLabel("def:widget", "qou")!);
  });

  test("a prefix-less label still gets a UNIQUE id", () => {
    // Measured on the qou corpus: emitting one shared `.../blocks/UNRESOLVED`
    // placeholder for these gave 12 blocks the same @id. The graph index
    // correctly refused to let one overwrite another, so twelve real blocks
    // vanished from the graph while the generator reported success. Every
    // fixture label had a prefix, so only a real run could surface it.
    const a = mintNodeId("tm-general-form", "qou");
    const b = mintNodeId("tm-knot-pairs", "qou");
    expect(a).not.toBe(b);
    expect(a).toBe("papers/qou/blocks/tm-general-form");
  });

  test("it never returns undefined, however odd the label", () => {
    for (const label of ["tm-x", "weird label!", "::", "", "a/b"]) {
      expect(typeof mintNodeId(label, "qou")).toBe("string");
      expect(mintNodeId(label, "qou").length).toBeGreaterThan(0);
    }
  });

  test("but a prefix-less REFERENCE stays unresolvable", () => {
    // The asymmetry is deliberate: a block's own label is its identity and
    // cannot be wrong, whereas a reference is a claim that must resolve.
    // Making resolveLabel this forgiving would mask every typo.
    expect(resolveLabel("tm-general-form", "qou")).toBeUndefined();
  });
});
