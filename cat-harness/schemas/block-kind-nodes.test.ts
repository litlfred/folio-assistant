/**
 * The block kinds are DISCOVERED from `folio-block-kind/v1` nodes (bean riit,
 * step 2). Owner, 2026-10-04: *"kinds need to be discoverable … not
 * centrally managed"*. These tests pin the properties that make discovery
 * safe to rely on.
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  BLOCK_KIND_NODES, BLOCK_KINDS, CONTENT_ADAPTERS, CONTENT_ADAPTER_NODES, DOCUMENT_BLOCK_KINDS, MATH_BLOCK_KINDS,
  discoverBlockKinds, discoverContentAdapters, kindForBuilder, type ContentAdapter,
} from "./block-kinds";
import { ADAPTER_COMPANION_ROLES } from "./block-qa";
import { KNOWN_LABEL_PREFIXES, LABEL_PREFIXES, typedBlockKinds } from "./constraints";
import { BLOCK_KIND_TO_FOLIO_TYPE, KIND_PREFIXES, assertPrefixesInSync } from "./jsonld";
import { kindHeading } from "./translation";

describe("block kinds are discovered, not listed", () => {
  test("every typed kind is discovered, and every discovered kind is typed", () => {
    expect([...BLOCK_KINDS].map(String).sort()).toEqual(typedBlockKinds().sort());
  });

  test("the math kinds are the paper adapter's, declared by folio-assistant-sci; the rest by folio-assistant-core", () => {
    expect([...MATH_BLOCK_KINDS].sort()).toEqual(
      ["conjecture", "corollary", "definition", "lemma", "proof", "proposition", "theorem"],
    );
    expect(MATH_BLOCK_KINDS.length + DOCUMENT_BLOCK_KINDS.length).toBe(BLOCK_KINDS.length);
  });

  test("each per-kind table is read off the nodes", () => {
    for (const n of BLOCK_KIND_NODES) {
      expect(BLOCK_KIND_TO_FOLIO_TYPE[n.kind as keyof typeof BLOCK_KIND_TO_FOLIO_TYPE]).toBe(n.folioType);
      expect(KNOWN_LABEL_PREFIXES).toContain(`${n.labelPrefix}:`);
      expect(kindHeading(n.kind, "en")).toBe(n.heading!);
      expect(kindForBuilder(n.builder ?? n.kind)).toBe(n.kind);
      if (n.prefixEnforced) expect(LABEL_PREFIXES[n.kind]).toBe(`${n.labelPrefix}:`);
    }
    expect(() => assertPrefixesInSync(KNOWN_LABEL_PREFIXES)).not.toThrow();
    expect(KIND_PREFIXES.length).toBe(KNOWN_LABEL_PREFIXES.length);
  });

  test("non-English headings come from the owners' translation catalogues", () => {
    expect(kindHeading("theorem", "fr")).toBe("Théorème"); // folio-assistant-sci/translations/fr
    expect(kindHeading("table", "zh-Hans")).toBe("表"); // folio-assistant-core/translations/zh
    expect(kindHeading("figure", "es")).toBe("Figura"); // had no row before; diagram's rendering
    expect(kindHeading("prose", "ru")).toBe(""); // shown with no heading, in every locale
    expect(kindHeading("lemma", "xx")).toBe("Lemma"); // no catalogue: the node's English
    expect(kindHeading("decision-table", "fr")).toBe("Decision-table"); // no node here: title-cased
  });

  test("a kind declared by two files is refused, naming both", () => {
    const root = mkdtempSync(join(tmpdir(), "block-kinds-"));
    for (const inst of ["a", "b"]) {
      mkdirSync(join(root, inst, "block-kinds"), { recursive: true });
      writeFileSync(
        join(root, inst, `${inst}.json`),
        JSON.stringify({ name: inst, directories: [{ id: `${inst}-bk`, path: "block-kinds/", graphKinds: ["block-kinds"] }] }),
      );
      writeFileSync(
        join(root, inst, "block-kinds", "note.json"),
        JSON.stringify({
          $schema: "folio-block-kind/v1", kind: "note", adapter: "paper", profile: "document",
          labelPrefix: "note", folioType: "x:Note", heading: "Note", headingPlural: "Notes",
        }),
      );
    }
    expect(() => discoverBlockKinds(root)).toThrow(/declared twice: .*a\/block-kinds\/note\.json and .*b\/block-kinds\/note\.json/);
  });

  test("a checkout that declares no block-kinds graph is refused rather than read as having no kinds", () => {
    const root = mkdtempSync(join(tmpdir(), "block-kinds-empty-"));
    expect(() => discoverBlockKinds(root)).toThrow(/no block kinds discovered/);
  });
});

describe("content-adapter vocabularies are nodes (bean riit, step 5)", () => {
  test("the typed vocabularies the nodes declare are the ones the code types", () => {
    // `ContentAdapter` is a type, erased at runtime; an exhaustive Record over
    // it is the one place tsc and the nodes meet. Add a typed vocabulary to
    // the type without a node, or a `typed: true` node without the type, and
    // this fails — at compile time or here.
    const typed: Record<ContentAdapter, true> = { paper: true };
    expect([...CONTENT_ADAPTERS].sort() as string[]).toEqual(Object.keys(typed).sort());
  });

  test("each typed vocabulary's companion roles come from its node", () => {
    for (const n of CONTENT_ADAPTER_NODES.filter((x) => x.typed)) {
      expect(ADAPTER_COMPANION_ROLES[n.adapter as ContentAdapter]).toEqual(n.companionRoles);
    }
    expect(ADAPTER_COMPANION_ROLES.paper).toEqual(["md", "ts", "lean"]);
  });

  test("every block-kind node names a vocabulary that has a node", () => {
    const names = new Set(CONTENT_ADAPTER_NODES.map((n) => n.adapter));
    for (const k of discoverBlockKinds()) expect(names.has(k.adapter)).toBe(true);
  });

  test("a node is never mistaken for an instance declaration", () => {
    // `paper.json` carrying `name: "paper"` read as a declaration, made
    // `content-adapters/` an instance, and hid core from sci's needs. The
    // field is `adapter` so the two shapes cannot coincide.
    for (const n of CONTENT_ADAPTER_NODES) expect("name" in n).toBe(false);
  });

  test("a vocabulary declared twice throws, and so does finding no typed one", () => {
    const tmp = mkdtempSync(join(tmpdir(), "content-adapters-"));
    const inst = (name: string, nodes: Record<string, unknown>) => {
      mkdirSync(join(tmp, name, "content-adapters"), { recursive: true });
      writeFileSync(
        join(tmp, name, `${name}.json`),
        JSON.stringify({ name, directories: [{ id: `${name}-ca`, path: "content-adapters/", graphKinds: ["content-adapters"] }] }),
      );
      for (const [f, n] of Object.entries(nodes)) writeFileSync(join(tmp, name, "content-adapters", f), JSON.stringify(n));
    };
    const node = (adapter: string, typed: boolean) => ({ $schema: "folio-content-adapter/v1", adapter, typed, companionRoles: ["md"] });
    inst("a", { "x.json": node("x", false) });
    expect(() => discoverContentAdapters(tmp)).toThrow(/no typed content adapter/);
    inst("b", { "x.json": node("x", true) });
    expect(() => discoverContentAdapters(tmp)).toThrow(/declared twice/);
  });
});
