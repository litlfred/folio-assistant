import { describe, expect, test } from "bun:test";
import { processArrowFindings, schemaArrowFindings } from "../arrow-direction.js";
import type { SchemaDecl, SchemaEdge, SchemaGraph } from "../schema-graph.js";

const decl = (name: string, general = false): SchemaDecl => ({
  id: `m.ts#${name}`, name, module: "m.ts", kind: "zod-object", fields: [], extendsNames: [], values: [],
  refs: [], unresolved: [], external: [], line: 1, exported: true, ...(general ? { general: true as const } : {}),
});
const ref = (from: string, via: string, to: string): SchemaEdge => ({
  from: `m.ts#${from}`, to: `m.ts#${to}`, via, kind: "id-ref", optional: false, array: false,
});
const graph = (decls: SchemaDecl[], edges: SchemaEdge[]): SchemaGraph => ({ roots: [], modules: [], decls, edges, refProblems: [] });

describe("the dependent holds the pointer (#1168, B5)", () => {
  test("a general node pointing at a dependent is a finding; general to general is not", () => {
    const g = graph(
      [decl("Role", true), decl("Skill", true), decl("Voice")],
      [ref("Role", "skills", "Skill"), ref("Role", "voice", "Voice"), ref("Voice", "roles", "Role")],
    );
    const f = schemaArrowFindings(g);
    expect(f.map((x) => x.where)).toEqual(["m.ts#Role.voice"]);
  });

  test("only declared id-refs are arrows — composition is part-of, not a pointer", () => {
    const g = graph([decl("Role", true), decl("Part")], [{ ...ref("Role", "part", "Part"), kind: "field" }]);
    expect(schemaArrowFindings(g)).toEqual([]);
  });

  test("a process may point at its skills, roles and decisions, and at nothing that depends on it", () => {
    const bpmn = `
      <folio:skill ref="todo-manager"/><folio:role ref="author"/>
      <folio:decision ref="decisions/x.dmn#D"/><folio:bean op="claim"/>
      <folio:implements workflow=".github/workflows/x.yml"/>
      <folio:link href="x.html#y" />`;
    const f = processArrowFindings("p.bpmn", bpmn);
    expect(f.map((x) => x.detail.split(" — ")[0])).toEqual([
      '<folio:implements workflow=".github/workflows/x.yml">',
      '<folio:link href="x.html#y">',
    ]);
  });
});
