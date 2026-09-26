/**
 * What the DAK placeholder promises, and — more usefully — what it promises
 * NOT to do while WHO's logical model is still being finalised.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { DAK_COMPONENTS, DAK_COMPONENT_FIELDS } from "./block-kinds";
import {
  DAK_MARKER_FILENAME,
  DAK_TYPE,
  DakDeclarationSchema,
  componentEntries,
  populatedComponents,
  readDakDeclaration,
  type DakDeclaration,
} from "./dak";

const minimal = { name: "smart-immunizations" };

function inTempRepo(contents: string | undefined, run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "dak-"));
  try {
    if (contents !== undefined) writeFileSync(join(root, DAK_MARKER_FILENAME), contents);
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("the marker", () => {
  test("is a fixed filename, so a consumer knows what to open first", () => {
    expect(DAK_MARKER_FILENAME).toBe("dak.config.json");
  });

  test("projects to WHO's own logical model, not a folio-local type", () => {
    expect(DAK_TYPE).toBe("http://smart.who.int/base/StructureDefinition/DAK");
  });

  test("absent is not an error — a repo that is not a DAK is ordinary", () => {
    inTempRepo(undefined, (root) => expect(readDakDeclaration(root)).toBeUndefined());
  });

  test("present but malformed throws, rather than reading as absent", () => {
    inTempRepo("{ not json", (root) => expect(() => readDakDeclaration(root)).toThrow(/not valid JSON/));
    inTempRepo('{"canonicalUrl":"x"}', (root) =>
      expect(() => readDakDeclaration(root)).toThrow(/not a valid DAK declaration/),
    );
  });
});

describe("what it refuses to invent", () => {
  test("a component's ELEMENTS are carried through untouched", () => {
    // The LM is not final upstream. Anything is accepted inside a component and
    // comes back byte-identical; the day the shape lands, this test changes.
    const odd = { anything: [1, 2], nested: { at: "all" } };
    const parsed = DakDeclarationSchema.parse({ ...minimal, healthInterventions: [odd] });
    expect((parsed as DakDeclaration).healthInterventions).toEqual([odd]);
  });

  test("but the CARDINALITY is enforced, because 0..* is settled", () => {
    expect(DakDeclarationSchema.safeParse({ ...minimal, personas: "not-an-array" }).success).toBe(false);
    expect(DakDeclarationSchema.safeParse({ ...minimal, personas: [] }).success).toBe(true);
  });

  test("unknown keys survive a round trip — a placeholder must not destroy data", () => {
    const extra = { name: "x", somethingWHOAdded: { deep: [1] }, anotherThing: "kept" };
    const parsed = DakDeclarationSchema.parse(extra) as Record<string, unknown>;
    expect(parsed.somethingWHOAdded).toEqual({ deep: [1] });
    expect(parsed.anotherThing).toBe("kept");
  });
});

describe("the component fields come from the vocabulary, not from this module", () => {
  test("every declared component is accepted by name", () => {
    const all = Object.fromEntries(DAK_COMPONENTS.map((c) => [DAK_COMPONENT_FIELDS[c], []]));
    expect(DakDeclarationSchema.safeParse({ ...minimal, ...all }).success).toBe(true);
  });

  test("componentEntries never needs a caller to hardcode a field name", () => {
    const d = DakDeclarationSchema.parse({ ...minimal, personas: ["a", "b"] }) as DakDeclaration;
    expect(componentEntries(d, "generic-personas")).toEqual(["a", "b"]);
    expect(componentEntries(d, "test-scenarios")).toEqual([]);
  });
});

describe("coverage distinguishes three states, not two", () => {
  test("absent, declared-and-empty, and populated are different facts", () => {
    const absent = DakDeclarationSchema.parse(minimal) as DakDeclaration;
    const empty = DakDeclarationSchema.parse({ ...minimal, personas: [] }) as DakDeclaration;
    const full = DakDeclarationSchema.parse({ ...minimal, personas: ["a"] }) as DakDeclaration;

    expect(populatedComponents(absent)).toEqual([]);
    expect(populatedComponents(empty)).toEqual([]);
    expect(populatedComponents(full)).toEqual(["generic-personas"]);

    // The first two agree on `populatedComponents` and differ on the record —
    // "nobody has said" is not "somebody said none".
    expect("personas" in absent).toBe(false);
    expect("personas" in empty).toBe(true);
  });
});

describe("labels", () => {
  test("a DAK carries the same title/description as every other KG node", () => {
    const d = DakDeclarationSchema.parse({
      ...minimal,
      title: "Immunizations",
      description: "WHO SMART Guidelines DAK for routine immunization.",
    }) as DakDeclaration;
    expect(d.title).toBe("Immunizations");
    expect(d.description).toContain("immunization");
  });
});
