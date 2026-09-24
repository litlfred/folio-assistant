/**
 * The logic-layer edge measurement.
 *
 * The behaviour worth pinning is the distinction the measurement exists to
 * draw: **how many artefacts carry an edge** and **how many distinct targets
 * they reach between them** are different numbers, and only the second one says
 * whether a staleness mark is possible. The fixture is built so the two diverge
 * exactly as smart-immunizations does — every Library carries one edge, to the
 * same shared RuleSet — because a fixture where they agree would pass whether
 * or not the tool draws the distinction at all.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { logicTypeOf, measure, readCqlNames, readFshBlocks, report } from "../measure-logic-layer-edges.ts";

let root: string;
let indexPath: string;

const CPG = "http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition";
const CQFM = "http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/proportion-measure-cqfm";

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "logic-edges-"));
  mkdirSync(join(root, "input", "fsh"), { recursive: true });
  mkdirSync(join(root, "input", "cql"), { recursive: true });
  writeFileSync(join(root, "sushi-config.yaml"), "canonical: http://example.org/ig\n");

  // Two CQL libraries, one including the other.
  writeFileSync(join(root, "input", "cql", "ACommon.cql"), 'library ACommon version \'1\'\n');
  writeFileSync(join(root, "input", "cql", "AOneLogic.cql"),
    'library AOneLogic version \'1\'\ninclude ACommon called C\n');

  // The shared RuleSets — the boilerplate every logic artefact inserts.
  writeFileSync(join(root, "input", "fsh", "rulesets.fsh"), [
    "RuleSet: LogicLibrary( library )",
    '* name = "{library}"',
    "",
    "RuleSet: PlanDefMain( library, version )",
    "* library = Canonical({library}Logic)",
    '* version = "{version}"',
    "",
    "RuleSet: MeasureProportion( library )",
    '* library = "http://example.org/ig/Library/{library}Logic"',
    "",
  ].join("\n"));

  // Library instances: NO `Id:` line, exactly as smart-immunizations writes them.
  writeFileSync(join(root, "input", "fsh", "libraries.fsh"), [
    "Instance: ACommon",
    "InstanceOf: Library",
    "Usage: #definition",
    "* insert LogicLibrary( ACommon )",
    "",
    "Instance: AOneLogic",
    "InstanceOf: Library",
    "Usage: #definition",
    "* insert LogicLibrary( AOneLogic )",
    "",
  ].join("\n"));

  writeFileSync(join(root, "input", "fsh", "plandefs.fsh"), [
    "Instance: AOne",
    `InstanceOf: ${CPG}`,
    "Usage: #definition",
    "* insert PlanDefMain( AOne, 0.1.0 )",
    "",
  ].join("\n"));

  writeFileSync(join(root, "input", "fsh", "measures.fsh"), [
    "Instance: AOneMeasure",
    `InstanceOf: ${CQFM}`,
    "Usage: #definition",
    "* insert MeasureProportion( AOne )",
    "",
  ].join("\n"));

  indexPath = join(root, "index.json");
  writeFileSync(indexPath, JSON.stringify({
    artifacts: [
      { key: "Library/ACommon", resourceType: "Library", id: "ACommon", version: "0.1.0" },
      { key: "Library/AOneLogic", resourceType: "Library", id: "AOneLogic", version: "0.1.0" },
      { key: "PlanDefinition/AOne", resourceType: "PlanDefinition", id: "AOne", version: "0.1.0" },
      { key: "Measure/AOneMeasure", resourceType: "Measure", id: "AOneMeasure", version: "0.1.0" },
      { key: "ValueSet/VSOther", resourceType: "ValueSet", id: "VSOther", version: "0.1.0" },
    ],
  }));
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("source readers", () => {
  test("reads a RuleSet's declared parameters", () => {
    const rs = readFshBlocks(root).find((b) => b.name === "PlanDefMain");
    expect(rs?.params).toEqual(["library", "version"]);
  });

  test("reads each CQL file's library name", () => {
    expect([...readCqlNames(root)].sort()).toEqual(["ACommon", "AOneLogic"]);
  });

  test("resolves a logic type from a dependency-package profile URL, not just a bare type", () => {
    const blocks = readFshBlocks(root);
    expect(logicTypeOf(blocks.find((b) => b.name === "AOne")!)).toBe("PlanDefinition");
    expect(logicTypeOf(blocks.find((b) => b.name === "AOneMeasure")!)).toBe("Measure");
    expect(logicTypeOf(blocks.find((b) => b.name === "ACommon")!)).toBe("Library");
    expect(logicTypeOf(blocks.find((b) => b.name === "LogicLibrary")!)).toBeUndefined();
  });
});

describe("the export side", () => {
  test("counts only the logic layer, and finds no field able to hold an edge", () => {
    const m = measure(root, indexPath);
    expect(m.exportTotal).toBe(5);
    expect(m.exportCounts).toEqual({ Library: 2, PlanDefinition: 1, Measure: 1 });
    expect(m.exportFields.some((f) => /depend|edge/i.test(f))).toBe(false);
  });

  test("reconciles every index id against a source declaration", () => {
    expect(measure(root, indexPath).unmatchedExportIds).toEqual([]);
  });
});

describe("fsh-cone as merged — coverage and information are different numbers", () => {
  test("coverage and information are different numbers, and only the second moved", () => {
    // Before cause (a) was fixed, both Libraries carried one edge each, BOTH to
    // the shared `LogicLibrary` RuleSet: 100% "coverage", one distinct target,
    // and no way to tell one Library from another. Coverage is unchanged at
    // 100%; what the fix bought is the target count.
    const r = measure(root, indexPath).rows.Library;
    expect(r.n).toBe(2);
    expect(r.withOutEdge).toBe(2);           // coverage: unchanged
    expect(r.meanOutDegree).toBe(2);         // the RuleSet AND the CQL body
    expect(r.distinctTargets.size).toBe(3);  // information: 1 -> 3
    expect([...r.distinctTargets].sort()).toEqual(["LogicLibrary", "cql:ACommon", "cql:AOneLogic"]);
  });

  test("a Library that omits `Id:` still reaches its CQL body — cause (a), fixed", () => {
    // The defect this measurement found: `fsh-cone` guarded the cql-by-name edge
    // on `node.id`, and SUSHI defaults an Instance's id to its NAME, so the edge
    // was dead on every real IG. `ACommon` and `AOneLogic` both omit `Id:`.
    // If this ever goes back to zero, cause (a) has regressed.
    const m = measure(root, indexPath);
    const reached = [...m.rows.Library.distinctTargets]
      .filter((t) => m.graph.nodes.get(t)?.kind === "CQL");
    expect(reached.sort()).toEqual(["cql:ACommon", "cql:AOneLogic"]);
  });

  test("a PlanDefinition's library edge still lands on the RuleSet — cause (b), open", () => {
    // `* library = Canonical({library}Logic)` lives inside `PlanDefMain`, so the
    // token is `{library}Logic` and resolves to nothing. Unlike (a) this is not
    // a one-line guard: it needs SUSHI's RuleSet parameter substitution.
    const r = measure(root, indexPath).rows.PlanDefinition;
    expect(r.withOutEdge).toBe(1);
    expect([...r.distinctTargets]).toEqual(["PlanDefMain"]);
  });
});

describe("ground truth — after RuleSet parameter substitution", () => {
  test("recovers the Library -> its own CQL body by the name convention", () => {
    const r = measure(root, indexPath).rows.Library;
    expect(r.withLogicEdge).toBe(2);
    expect([...r.distinctLogicTargets].sort()).toEqual(["ACommon", "AOneLogic"]);
  });

  test("recovers `Canonical({library}Logic)` from inside a parameterised RuleSet", () => {
    const r = measure(root, indexPath).rows.PlanDefinition;
    expect(r.withLogicEdge).toBe(1);
    expect([...r.distinctLogicTargets]).toEqual(["AOneLogic"]);
  });

  test("recovers a canonical written as a string URL, not a Canonical() call", () => {
    const r = measure(root, indexPath).rows.Measure;
    expect(r.withLogicEdge).toBe(1);
    expect([...r.distinctLogicTargets]).toEqual(["AOneLogic"]);
  });

  test("ground truth still exceeds what fsh-cone extracts — the REMAINING gap is (b)", () => {
    const m = measure(root, indexPath);
    // Library: closed. Extraction now finds the same logic target ground truth does.
    expect(m.rows.Library.withLogicEdge).toBe(m.rows.Library.n);
    const libExtracted = [...m.rows.Library.distinctTargets]
      .filter((t) => m.graph.nodes.get(t)?.kind === "CQL").length;
    expect(libExtracted).toBe(m.rows.Library.distinctLogicTargets.size);

    // PlanDefinition and Measure: open. Ground truth names a logic artefact that
    // extraction does not reach at all, which is exactly what (b) costs.
    for (const t of ["PlanDefinition", "Measure"] as const) {
      expect(m.rows[t].distinctLogicTargets.size).toBeGreaterThan(0);
      for (const target of m.rows[t].distinctLogicTargets) {
        expect(m.rows[t].distinctTargets.has(target)).toBe(false);
      }
    }
  });
});

describe("report", () => {
  test("names the distinct-target collapse rather than only printing a percentage", () => {
    const text = report(measure(root, indexPath));
    expect(text).toContain("a field that could hold a dependency edge: NONE");
    // (a) fixed: the two Libraries reach their CQL bodies, so not every target
    // is a RuleSet any more and the logic->logic count is no longer zero.
    expect(text).toContain("every distinct target is a shared RuleSet: no");
    expect(text).toContain("logic -> logic edges: 2");
  });
});
