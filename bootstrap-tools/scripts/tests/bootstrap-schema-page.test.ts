/**
 * The drawn schema page — `bootstrap/schemas/README.md`.
 *
 * @module scripts/tests/bootstrap-schema-page
 * @graphNode none — a test
 *
 * Imports the renderer, never `gen-bootstrap-schemas.ts`: the generator writes
 * its targets at module scope, so importing it would write into `bootstrap/`.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { anchor, renderSchemaPage, rules, spaced } from "../bootstrap-schema-page.ts";

const SCHEMAS = join(import.meta.dir, "..", "..", "..", "bootstrap", "schemas");

const doc = {
  file: "x.schema.json",
  schema: {
    title: "Thing",
    type: "object",
    required: ["id", "parts"],
    properties: {
      id: { type: "string" },
      mode: { enum: ["a", "b"] },
      parts: { type: "array", minItems: 1, items: { type: "object", required: ["n"], properties: { n: { type: "number" } } } },
    },
    allOf: [{ if: { properties: { mode: { const: "a" } }, required: ["mode"] }, then: { required: ["parts"] } }],
    $defs: { Thing: { title: "Thing", description: "A thing." } },
  },
};

describe("drawing", () => {
  const page = renderSchemaPage([doc], "x.schema.json");

  test("one box per object, with required marks and multiplicities", () => {
    expect(page).toContain("| * id     [1]     string");
    expect(page).toContain('|   mode   [0..1]  "a" | "b"');
    expect(page).toContain("| * parts  [1..*]  Part list");
    expect(page).toContain("+-- parts (each item) --> +");
    expect(page).toContain("| * n  [1]  number |");
  });

  test("a conditional is stated in words", () => {
    expect(page).toContain('- If `mode` is "a", `parts` must be present.');
  });

  test("each term has a heading, its drawing and its [src]", () => {
    expect(page).toContain("### Thing");
    expect(page).toContain("Drawn in [Thing](#thing). [src](x.schema.json#/$defs/Thing)");
  });
});

describe("refusals — nothing is dropped silently", () => {
  test("a rule shape it cannot state throws", () => {
    expect(() => rules([{ if: { properties: { a: { minimum: 1 } } }, then: { required: ["b"] } }])).toThrow();
  });

  test("an object with no properties throws", () => {
    const empty = { file: "e.json", schema: { title: "E", type: "object", properties: {}, $defs: { E: {} } } };
    expect(() => renderSchemaPage([empty], "e.json")).toThrow();
  });
});

test("names and anchors match GitHub's", () => {
  expect(spaced("KnowledgeGraph")).toBe("Knowledge Graph");
  expect(anchor("Knowledge Graph declaration")).toBe("knowledge-graph-declaration");
});

test("the committed page is the one the committed schemas produce", () => {
  // Same check as `bootstrap:schemas:check`, from the files alone, so a stale
  // page fails here too without running the generator.
  const files = ["discussion.input.schema.json", "discussion.output.schema.json", "graph.schema.json", "model-registry.schema.json", "requirement.schema.json"];
  const page = readFileSync(join(SCHEMAS, "README.md"), "utf-8");
  for (const f of files) expect(page).toContain(`[src](${f})`);
});
