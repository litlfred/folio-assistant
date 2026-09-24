/**
 * Source-level dependency cones over an FSH tank.
 *
 * The behaviour worth pinning is the *direction* of each edge and what counts
 * as one. A cone that is too small is the dangerous failure — it tells an
 * incremental build it may skip something it must rebuild — so every edge form
 * the parser claims to recognise gets one fixture that exercises it, and the
 * expected cones are written out by hand rather than read back from the tool.
 *
 * The fixture is a tiny tank: a profile chain bound to a value set backed by a
 * local code system, an example instance of the derived profile, a
 * PlanDefinition that inserts a RuleSet and points at a Library whose CQL
 * includes a common library, plus an invariant the base profile obeys.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  backwardCone,
  buildFshGraph,
  changeImpact,
  coneSizes,
  filesOf,
  forwardCone,
  historyImpact,
  historyReport,
  report,
  toCsv,
  type FshGraph,
} from "../../content/pipeline/fsh-cone";

const ROOT = mkdtempSync(join(tmpdir(), "fsh-cone-"));
let g: FshGraph;

function put(rel: string, body: string): void {
  const p = join(ROOT, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, body);
}

beforeAll(() => {
  put("sushi-config.yaml", "id: example.tank\ncanonical: http://example.org/tank\n");
  put("input/fsh/aliases.fsh", "Alias: $SCT = http://snomed.info/sct\nAlias: $LOCAL = http://example.org/tank/CodeSystem/local-cs\n");
  put(
    "input/fsh/profiles/PersonA.fsh",
    [
      "Profile: PersonA",
      "Parent: Patient", // external base — must NOT become an edge
      "Id: person-a",
      "* name 1..1",
      "* gender from GenderVS (required)",
      "* obeys inv-1, inv-2",
      "",
    ].join("\n"),
  );
  put("input/fsh/profiles/PersonB.fsh", "Profile: PersonB\nParent: PersonA\nId: person-b\n* birthDate 1..1\n");
  put("input/fsh/valuesets/GenderVS.fsh", "ValueSet: GenderVS\nId: gender-vs\n* include codes from system LocalCS\n* $SCT#248153007 \"Male\"\n");
  put("input/fsh/codesystems/LocalCS.fsh", "CodeSystem: LocalCS\nId: local-cs\n* #m \"Male\"\n* #f \"Female\"\n");
  put("input/fsh/invariants/inv.fsh", "Invariant: inv-1\nDescription: \"has a name\"\nExpression: \"name.exists()\"\nSeverity: #error\n\nInvariant: inv-2\nDescription: \"x\"\nExpression: \"true\"\nSeverity: #warning\n");
  put("input/fsh/examples/ExPerson.fsh", "Instance: ExPerson\nInstanceOf: PersonB\nUsage: #example\n* name.given = \"Q\"\n* maritalStatus = $LOCAL#m\n");
  put("input/fsh/rulesets/CommonMeta.fsh", "RuleSet: CommonMeta\n* ^status = #active\n");
  put(
    "input/fsh/plandefinitions/PlanX.fsh",
    "Instance: PlanX\nInstanceOf: PlanDefinition\n* insert CommonMeta\n* library = Canonical(LibX)\n* action[0].definitionCanonical = \"http://example.org/tank/ActivityDefinition/act-1\"\n",
  );
  put("input/fsh/activitydefinitions/Act1.fsh", "Instance: Act1\nInstanceOf: ActivityDefinition\nId: act-1\n* subjectReference = Reference(ExPerson)\n");
  put("input/fsh/libraries/LibX.fsh", "Instance: LibX\nInstanceOf: Library\nId: LibX\n* type = http://terminology.hl7.org/CodeSystem/library-type#logic-library\n");
  // The SAME library shape with NO `Id:` line — SUSHI defaults the id to the
  // instance NAME. This is how every Library in smart-immunizations is written
  // (279 of 279), and it was the shape no fixture had: the edge kind was dead
  // on real IGs while this suite stayed green (bean `f4gj`).
  put("input/fsh/libraries/LibY.fsh", "Instance: LibY\nInstanceOf: Library\n* insert CommonMeta\n");
  put("input/cql/LibY.cql", "library LibY version '1.0.0'\nusing FHIR version '4.0.1'\ninclude Common version '1.0.0' called C\n");
  put("input/cql/LibX.cql", "library LibX version '1.0.0'\nusing FHIR version '4.0.1'\ninclude Common version '1.0.0' called C\ninclude FHIRHelpers version '4.0.1'\n");
  put("input/cql/Common.cql", "library Common version '1.0.0'\nusing FHIR version '4.0.1'\n");
  g = buildFshGraph(ROOT);
});

afterAll(() => {
  try {
    rmSync(ROOT, { recursive: true, force: true });
  } catch {
    // best effort
  }
});

describe("graph construction", () => {
  test("every declaration and every CQL library is a node; the external include is not", () => {
    const names = [...g.nodes.keys()].sort();
    expect(names).toEqual(
      [
        "Act1", "CommonMeta", "ExPerson", "GenderVS", "LibX", "LibY", "LocalCS", "PersonA", "PersonB", "PlanX",
        "cql:Common", "cql:LibX", "cql:LibY", "inv-1", "inv-2",
      ].sort(),
    );
    expect(g.nodes.has("cql:FHIRHelpers")).toBe(false);
    expect(g.fshFiles).toBe(12);
    expect(g.cqlFiles).toBe(3);
    expect(g.canonical).toBe("http://example.org/tank");
  });

  test("each edge form is recognised, and points from the user to the used", () => {
    const deps = (n: string) => [...g.nodes.get(n)!.deps].sort();
    expect(deps("PersonB")).toEqual(["PersonA"]); // Parent:
    expect(deps("PersonA")).toEqual(["GenderVS", "inv-1", "inv-2"]); // from, obeys a, b — not Patient
    expect(deps("GenderVS")).toEqual(["LocalCS"]); // include codes from system
    expect(deps("ExPerson")).toEqual(["LocalCS", "PersonB"]); // InstanceOf, $alias#code via URL alias
    expect(deps("PlanX")).toEqual(["Act1", "CommonMeta", "LibX"]); // canonical assignment (URL), insert, Canonical()
    expect(deps("Act1")).toEqual(["ExPerson"]); // Reference()
    expect(deps("LibX")).toEqual(["cql:LibX"]); // Library ↔ cql by name, via `Id:`
    // ...and via SUSHI's name→id default, which is the case real IGs use.
    expect(deps("LibY")).toEqual(["CommonMeta", "cql:LibY"]);
    expect(deps("cql:LibX")).toEqual(["cql:Common"]); // cql include
    expect(deps("cql:Common")).toEqual([]);
    expect(deps("LocalCS")).toEqual([]);
  });
});

describe("cones", () => {
  test("forward cone of the code system reaches everything bound through it, transitively", () => {
    // LocalCS ← GenderVS ← PersonA ← PersonB ← ExPerson ← Act1 ← PlanX ; and ExPerson directly
    expect([...forwardCone(g, "LocalCS")].sort()).toEqual(["Act1", "ExPerson", "GenderVS", "PersonA", "PersonB", "PlanX"]);
  });

  test("a shared CQL library is the hub: its cone crosses from CQL into FHIR artefacts", () => {
    expect([...forwardCone(g, "cql:Common")].sort()).toEqual(["LibX", "LibY", "PlanX", "cql:LibX", "cql:LibY"]);
  });

  test("a RuleSet change invalidates its users (SUSHI expands it at compile time)", () => {
    expect([...forwardCone(g, "CommonMeta")].sort()).toEqual(["LibY", "PlanX"]);
  });

  test("leaves have empty forward cones and the root is excluded from its own cone", () => {
    expect(forwardCone(g, "PlanX").size).toBe(0);
    expect(forwardCone(g, "LocalCS").has("LocalCS")).toBe(false);
  });

  test("backward cone is the restricted checkout, measured in files", () => {
    const b = backwardCone(g, "ExPerson");
    expect([...b].sort()).toEqual(["GenderVS", "LocalCS", "PersonA", "PersonB", "inv-1", "inv-2"]);
    const files = filesOf(g, ["ExPerson", ...b]);
    expect([...files].sort()).toEqual([
      "input/fsh/codesystems/LocalCS.fsh",
      "input/fsh/examples/ExPerson.fsh",
      "input/fsh/invariants/inv.fsh",
      "input/fsh/profiles/PersonA.fsh",
      "input/fsh/profiles/PersonB.fsh",
      "input/fsh/valuesets/GenderVS.fsh",
    ]);
    // two invariants share one file, so the file count is one less than the node count + 1
    expect(coneSizes(g).backwardFiles.get("ExPerson")).toBe(6);
  });

  test("the cone sizes table agrees with the individual cones", () => {
    const s = coneSizes(g);
    expect(s.forward.get("LocalCS")).toBe(6);
    expect(s.backward.get("ExPerson")).toBe(6);
    expect(s.forward.get("PlanX")).toBe(0);
    expect(s.backward.get("cql:Common")).toBe(0);
  });
});

describe("change impact — the incremental-build question", () => {
  test("editing the value set names what to rebuild and what to check out", () => {
    const impact = changeImpact(g, ["input/fsh/valuesets/GenderVS.fsh"]);
    expect([...impact.changed]).toEqual(["GenderVS"]);
    expect([...impact.rebuild].sort()).toEqual(["Act1", "ExPerson", "GenderVS", "PersonA", "PersonB", "PlanX"]);
    // the checkout must compile every rebuilt node: their files plus their dependencies' files
    expect([...impact.checkout].sort()).toEqual([
      "input/cql/Common.cql",
      "input/cql/LibX.cql",
      "input/fsh/activitydefinitions/Act1.fsh",
      "input/fsh/codesystems/LocalCS.fsh",
      "input/fsh/examples/ExPerson.fsh",
      "input/fsh/invariants/inv.fsh",
      "input/fsh/libraries/LibX.fsh",
      "input/fsh/plandefinitions/PlanX.fsh",
      "input/fsh/profiles/PersonA.fsh",
      "input/fsh/profiles/PersonB.fsh",
      "input/fsh/rulesets/CommonMeta.fsh",
      "input/fsh/valuesets/GenderVS.fsh",
    ]);
  });

  test("editing a leaf rebuilds only itself", () => {
    const impact = changeImpact(g, [join(ROOT, "input/fsh/plandefinitions/PlanX.fsh")]);
    expect([...impact.rebuild]).toEqual(["PlanX"]);
  });

  test("a file that declares nothing changes nothing", () => {
    const impact = changeImpact(g, ["input/fsh/aliases.fsh"]);
    expect(impact.changed.size).toBe(0);
    expect(impact.rebuild.size).toBe(0);
  });
});

describe("reports", () => {
  test("the text report carries the headline figures and the CSV has one row per node", () => {
    const r = report(g, 3);
    // two invariants share one file, so 15 nodes live in 14 files
    expect(r).toContain("nodes: 15 in 14 source files (12 .fsh, 3 .cql)");
    // BOTH Library instances reach their CQL body — the one declaring `Id:` and
    // the one relying on SUSHI's name→id default (bean `f4gj`).
    expect(r).toContain("2  Library ↔ cql (by name)");
    expect(r).toContain("FORWARD cone");
    expect(r).toContain("LocalCS"); // the hub of this fixture heads the forward-cone table
    expect(r).toContain("cql include"); // and every edge form the fixture exercises is tallied
    expect(r).toContain("canonical assignment");
    const csv = toCsv(g).trim().split("\n");
    expect(csv[0]).toBe("name,kind,file,forward,backward,backward_files");
    expect(csv.length).toBe(1 + g.nodes.size);
  });

  test("replaying the git history scores each commit by its rebuild cone", () => {
    // Runs last: it turns the fixture into a git repository and edits a file. The
    // graph `g` was built before and is not affected.
    const git = (args: string) => execSync(`git -c user.name=t -c user.email=t@example.org ${args}`, { cwd: ROOT, stdio: "ignore" });
    git("init -q");
    git("add -A");
    git("commit -q -m init");
    writeFileSync(join(ROOT, "input/fsh/valuesets/GenderVS.fsh"), "ValueSet: GenderVS\nId: gender-vs\n* include codes from system LocalCS\n");
    writeFileSync(join(ROOT, "input/fsh/rulesets/CommonMeta.fsh"), "RuleSet: CommonMeta\n* ^status = #draft\n");
    git("add -A");
    git("commit -q -m 'edit the value set and the ruleset'");
    writeFileSync(join(ROOT, "sushi-config.yaml"), "id: example.tank\ncanonical: http://example.org/tank\nversion: 0.2.0\n");
    git("add -A");
    git("commit -q -m 'bump version — touches no source file'");

    const rows = historyImpact(g, 10);
    // the root commit has no parent and the version bump touches no source file
    expect(rows.length).toBe(1);
    expect(rows[0].sourceFiles).toBe(2);
    expect(rows[0].changed).toBe(2); // GenderVS, CommonMeta
    // GenderVS ← PersonA ← PersonB ← ExPerson ← Act1 ← PlanX ; CommonMeta ← PlanX, LibY
    expect(rows[0].rebuild).toBe(8);
    const text = historyReport(g, rows, 3);
    expect(text).toContain("commits touching input/fsh or input/cql: 1 of 3 inspected");
    expect(text).toContain("rebuild per commit (nodes, incl. changed): median 8");
    expect(text).toContain("zero-rebuild commits");
  });

  test("an empty tank is a determined empty, not a crash", () => {
    const empty = mkdtempSync(join(tmpdir(), "fsh-cone-empty-"));
    try {
      const eg = buildFshGraph(empty);
      expect(eg.nodes.size).toBe(0);
      expect(report(eg)).toContain("nodes: 0");
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});
