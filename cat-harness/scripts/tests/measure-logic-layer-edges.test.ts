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
import { LOGIC_TYPES, logicTypeOf, measure, readCqlNames, readFshBlocks, report } from "../measure-logic-layer-edges.ts";

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
  test("every Library carries an edge, and they all reach the SAME single target", () => {
    const r = measure(root, indexPath).rows.Library;
    expect(r.n).toBe(2);
    expect(r.withOutEdge).toBe(2);        // 100% "coverage"...
    expect(r.meanOutDegree).toBe(1);
    expect(r.distinctTargets.size).toBe(1); // ...and one bit of information
    expect([...r.distinctTargets]).toEqual(["LogicLibrary"]);
  });

  test("the Library -> CQL edge is lost when the instance omits `Id:`", () => {
    // The regression this whole measurement turns on: `fsh-cone` guards the
    // cql-by-name edge on `node.id`, and SUSHI defaults an Instance's id to its
    // name. Neither Library reaches its own CQL body.
    const m = measure(root, indexPath);
    for (const t of m.rows.Library.distinctTargets) {
      expect(m.graph.nodes.get(t)?.kind).not.toBe("CQL");
    }
  });

  test("a PlanDefinition's library edge lands on the RuleSet, not the Library", () => {
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

  test("ground truth strictly exceeds what fsh-cone extracts — that gap IS the finding", () => {
    const m = measure(root, indexPath);
    const asMerged = new Set<string>();
    const truth = new Set<string>();
    for (const t of LOGIC_TYPES) {
      for (const x of m.rows[t].distinctTargets) asMerged.add(x);
      for (const x of m.rows[t].distinctLogicTargets) truth.add(x);
    }
    // Disjoint: as-merged reaches only RuleSets, ground truth only logic artefacts.
    expect([...asMerged].every((x) => !truth.has(x))).toBe(true);
    expect(truth.size).toBeGreaterThan(0);
  });
});

describe("report", () => {
  test("names the distinct-target collapse rather than only printing a percentage", () => {
    const text = report(measure(root, indexPath));
    expect(text).toContain("every distinct target is a shared RuleSet: YES");
    expect(text).toContain("logic -> logic edges: 0");
    expect(text).toContain("a field that could hold a dependency edge: NONE");
  });
});
