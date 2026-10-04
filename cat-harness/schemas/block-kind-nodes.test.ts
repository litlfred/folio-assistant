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

import { BLOCK_KIND_NODES, BLOCK_KINDS, DOCUMENT_BLOCK_KINDS, MATH_BLOCK_KINDS, discoverBlockKinds, kindForBuilder } from "./block-kinds";
import { BlockSchema, KNOWN_LABEL_PREFIXES, LABEL_PREFIXES } from "./constraints";
import { BLOCK_KIND_TO_FOLIO_TYPE, KIND_PREFIXES, assertPrefixesInSync } from "./jsonld";
import { KIND_HEADINGS } from "./translation";

/** The `kind` literal of each member of the discriminated union — the TYPED kinds, read from code. */
function typedKinds(): string[] {
  const options = (BlockSchema as unknown as { options: { shape: { kind: { value: string } } }[] }).options;
  return options.map((o) => o.shape.kind.value);
}

describe("block kinds are discovered, not listed", () => {
  test("every typed kind is discovered, and every discovered kind is typed", () => {
    expect([...BLOCK_KINDS].sort()).toEqual(typedKinds().sort());
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
      expect(KIND_HEADINGS.en[n.kind]).toBe(n.heading);
      expect(kindForBuilder(n.builder ?? n.kind)).toBe(n.kind);
      if (n.prefixEnforced) expect(LABEL_PREFIXES[n.kind]).toBe(`${n.labelPrefix}:`);
    }
    expect(() => assertPrefixesInSync(KNOWN_LABEL_PREFIXES)).not.toThrow();
    expect(KIND_PREFIXES.length).toBe(KNOWN_LABEL_PREFIXES.length);
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
