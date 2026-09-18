/**
 * The KG export is a whole graph, not a partial one wearing a total's clothes.
 *
 * The first version of `scripts/kg-export.ts` collected skills from six
 * instruction-body directories and reported **11 BPMN skill refs as dangling**.
 * They were not dangling. They resolve through `schemas/skills/<name>/`, which
 * holds a skill's I/O contract and which that collector did not know existed —
 * so the export was a partial graph published as a complete one, in the module
 * whose own doc comment warns against exactly that.
 *
 * It is worth being precise about why that is dangerous rather than merely
 * wrong. A consumer of `kg.json` cannot tell a skill that is absent from one
 * that was never collected: both are simply not in `@graph`. The counts look
 * plausible either way. Nothing errors. That is the `dh4f` shape — a clean run
 * over a corpus the tool could not read — and the only defence is an invariant
 * asserted against something outside the exporter's own view.
 *
 * So: every skill a diagram names must appear in the export. `check-workflow-refs`
 * already guarantees those refs resolve against the real skill locations, which
 * makes the set of BPMN refs an independent witness — if the exporter's notion
 * of "where skills live" narrows again, this fails.
 */
import { describe, expect, test } from "bun:test";

import { buildExport } from "../kg-export.js";
import { FOLIO_NS } from "../../schemas/namespaces.js";

const EXPORT = await buildExport();
const typed = (t: string) => EXPORT["@graph"].filter((n) => n["@type"] === `${FOLIO_NS}${t}`);

describe("kg export", () => {
  test("no source failed to read", () => {
    // `problems` is reported AND non-empty is a CLI failure; a green test here
    // is what lets the workflow trust the published file.
    expect(EXPORT.problems).toEqual([]);
  });

  test("the graph is not trivially small — otherwise every assertion below is vacuous", () => {
    expect(EXPORT["@graph"].length).toBeGreaterThan(100);
    expect(typed("Skill").length).toBeGreaterThan(50);
    expect(typed("Process").length).toBeGreaterThan(5);
  });

  test("every skill a BPMN activity names appears in the export", () => {
    const names = new Set(typed("Skill").map((n) => n.name as string));
    const referenced = new Set<string>();
    for (const n of typed("ProcessNode")) {
      for (const s of (n.implementedBy as string[] | undefined) ?? []) referenced.add(s);
    }
    // Guard the guard: if no diagram carries a ref, this proves nothing.
    expect(referenced.size).toBeGreaterThan(20);
    expect([...referenced].filter((r) => !names.has(r)).sort()).toEqual([]);
  });

  test("process nodes carry the edges that make this a graph", () => {
    const nodes = typed("ProcessNode");
    // A list of skills is not a graph. These two edges are the reason to publish.
    expect(nodes.filter((n) => n.performedBy !== undefined).length).toBeGreaterThan(100);
    expect(nodes.filter((n) => ((n.implementedBy as string[]) ?? []).length > 0).length)
      .toBeGreaterThan(50);
  });

  test("every node has an @id and an @type, and @ids are unique", () => {
    const ids = EXPORT["@graph"].map((n) => n["@id"]);
    for (const n of EXPORT["@graph"]) {
      expect(typeof n["@id"]).toBe("string");
      expect(String(n["@type"]).startsWith(FOLIO_NS)).toBe(true);
    }
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("counts agree with the graph they summarise", () => {
    // The counts block exists so a consumer can spot a truncated file. If it
    // can disagree with `@graph`, it is worse than absent.
    const recomputed: Record<string, number> = {};
    for (const n of EXPORT["@graph"]) {
      const t = String(n["@type"]).replace(FOLIO_NS, "");
      recomputed[t] = (recomputed[t] ?? 0) + 1;
    }
    expect(EXPORT.counts).toEqual(recomputed);
  });
});
