/**
 * The first QA axes scoped to a non-paper adapter.
 *
 * Until these existed, the adapter-scoping machinery was live with nothing
 * registered in it: every paper criterion correctly `n/a` on a DAK block, and
 * no DAK criterion to take its place. A corpus reporting no findings because
 * nothing was asked is the same false pass as one reporting `n/a` because the
 * gate was wrong — the shape §5 of the ingestion proposal exists to prevent.
 *
 * The one worth reading closely is `dak-companion-present`. It exists to catch
 * a manifest whose artefact is missing, so it must NOT declare that artefact
 * in `depends_on` — which gates applicability and would `n/a` exactly the
 * blocks it is for. That trap is documented on `QaCriterionDefinition` and
 * this is the first criterion to walk around it deliberately.
 */
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  checkDakCompanionPresent,
  checkDakBpmnHasProcess,
  checkDakDmnHasDecisionTable,
  checkDakFshDeclaresKind,
  checkDakLabelPrefixMatchesKind,
  DAK_AUTOMATED_CHECKERS,
  REQUIRED_COMPANION,
  WORKBOOK_BACKED_KINDS,
} from "../../content/pipeline/qa-checkers-dak";
import { QA_CRITERIA_REGISTRY } from "../../content/pipeline/qa-criteria-registry";
import { criterionAdapters } from "../../schemas/block-qa";

const DIR = mkdtempSync(join(tmpdir(), "dak-checkers-"));
const p = (n: string) => join(DIR, n);

beforeAll(() => {
  writeFileSync(p("dt-good.ts"), `export default decisionTable({ label: "dt:good" });\n`);
  writeFileSync(
    p("dt-good.dmn"),
    `<?xml version="1.0"?><definitions><decision id="d"><decisionTable/></decision></definitions>\n`,
  );

  writeFileSync(p("dt-shell.ts"), `export default decisionTable({ label: "dt:shell" });\n`);
  writeFileSync(p("dt-shell.dmn"), `<?xml version="1.0"?><definitions/>\n`);

  writeFileSync(p("dt-naked.ts"), `export default decisionTable({ label: "dt:naked" });\n`);
  writeFileSync(p("bp-naked.ts"), `export default businessProcess({ label: "bp:naked" });\n`);
  writeFileSync(p("cql-naked.ts"), `export default cqlLibrary({ label: "cql:naked" });\n`);

  writeFileSync(p("bp-good.ts"), `export default businessProcess({ label: "bp:good" });\n`);
  writeFileSync(
    p("bp-good.bpmn"),
    `<?xml version="1.0"?><bpmn:definitions><bpmn:process id="p"/></bpmn:definitions>\n`,
  );
  writeFileSync(p("bp-empty.ts"), `export default businessProcess({ label: "bp:empty" });\n`);
  writeFileSync(p("bp-empty.bpmn"), `<?xml version="1.0"?><bpmn:definitions/>\n`);

  writeFileSync(p("vs-good.ts"), `export default valueSet({ label: "vs:good" });\n`);
  writeFileSync(p("vs-good.fsh"), `ValueSet: DangerSigns\nId: danger-signs\n`);
  writeFileSync(p("vs-wrong.ts"), `export default valueSet({ label: "vs:wrong" });\n`);
  writeFileSync(p("vs-wrong.fsh"), `Profile: SomethingElse\n`);

  writeFileSync(p("dt-mislabel.ts"), `export default decisionTable({ label: "vs:mislabelled" });\n`);

  writeFileSync(p("thm-paper.ts"), `export default theorem({ label: "thm:main" });\n`);
});

afterAll(() => {
  try {
    rmSync(DIR, { recursive: true, force: true });
  } catch {}
});

describe("dak-companion-present", () => {
  test("passes when the artefact is there", () => {
    expect(
      checkDakCompanionPresent({ ts: p("dt-good.ts"), dmn: p("dt-good.dmn") }).result,
    ).toBe("pass");
  });

  test("fails a manifest with no artefact — the case depends_on could not express", () => {
    const r = checkDakCompanionPresent({ ts: p("cql-naked.ts") });
    expect(r.result).toBe("fail");
    expect(r.hits[0]!.text).toContain("no .cql companion");
  });

  test("ignores a paper block entirely", () => {
    expect(checkDakCompanionPresent({ ts: p("thm-paper.ts") }).result).toBe("pass");
  });

  test("the criterion does NOT depend on the artefact it looks for", () => {
    // Listing `.dmn` in depends_on would n/a exactly the blocks this catches.
    const def = QA_CRITERIA_REGISTRY.find((d) => d.id === "dak-companion-present")!;
    expect(def.depends_on).toEqual(["ts"]);
    expect(def.also_invalidated_by).toContain("dmn");
  });

  test("every kind with a required companion is one this can check", () => {
    for (const [, role] of Object.entries(REQUIRED_COMPANION)) {
      expect(["bpmn", "fsh", "cql"]).toContain(role);
    }
  });

  test("workbook-backed kinds require no companion — measured, not overlooked", () => {
    // Zero .dmn files exist across smart-dak-immz, smart-dak-bds and
    // smart-immunizations: WHO authors decision-support logic as a
    // spreadsheet, and one workbook covers MANY blocks. Requiring a per-block
    // artefact would report a defect in every one of them, in a corpus that is
    // correctly formed.
    for (const k of WORKBOOK_BACKED_KINDS) {
      expect(REQUIRED_COMPANION[k]).toBeUndefined();
    }
    expect(WORKBOOK_BACKED_KINDS).toContain("decision-table");
  });

  test("a decision-table with no artefact is NOT flagged", () => {
    const r = checkDakCompanionPresent({ ts: p("dt-naked.ts") });
    expect(r.result).toBe("pass");
  });

  test("a business-process with no .bpmn IS flagged — one file per process", () => {
    const r = checkDakCompanionPresent({ ts: p("bp-naked.ts") });
    expect(r.result).toBe("fail");
    expect(r.hits[0]!.text).toContain("no .bpmn companion");
  });
});

describe("dak-bpmn-has-process", () => {
  test("passes a namespaced <bpmn:process>", () => {
    expect(checkDakBpmnHasProcess({ bpmn: p("bp-good.bpmn") }).result).toBe("pass");
  });

  test("fails a definitions shell", () => {
    const r = checkDakBpmnHasProcess({ bpmn: p("bp-empty.bpmn") });
    expect(r.result).toBe("fail");
    expect(r.hits[0]!.text).toContain("no <process>");
  });

  test("no .bpmn is not this checker's business — the gate handles that", () => {
    expect(checkDakBpmnHasProcess({}).result).toBe("pass");
  });
});

describe("dak-dmn-has-decision-table", () => {
  test("passes a decision carrying a table", () => {
    expect(checkDakDmnHasDecisionTable({ dmn: p("dt-good.dmn") }).result).toBe("pass");
  });

  test("fails logic that expresses no decision", () => {
    const r = checkDakDmnHasDecisionTable({ dmn: p("dt-shell.dmn") });
    expect(r.result).toBe("fail");
    expect(r.hits[0]!.text).toContain("no <decision>");
  });
});

describe("dak-fsh-declares-kind", () => {
  test("passes when kind and FSH declaration agree", () => {
    expect(
      checkDakFshDeclaresKind({ ts: p("vs-good.ts"), fsh: p("vs-good.fsh") }).result,
    ).toBe("pass");
  });

  test("fails a value-set block whose FSH declares a Profile", () => {
    // Both files are individually valid; only the pairing is wrong, which is
    // why no schema can catch this.
    expect(
      checkDakFshDeclaresKind({ ts: p("vs-wrong.ts"), fsh: p("vs-wrong.fsh") }).result,
    ).toBe("fail");
  });
});

describe("dak-label-prefix-matches-kind", () => {
  test("passes a correctly-prefixed label", () => {
    expect(checkDakLabelPrefixMatchesKind({ ts: p("dt-good.ts") }).result).toBe("pass");
  });

  test("fails a manifest hand-edited past its builder's validation", () => {
    const r = checkDakLabelPrefixMatchesKind({ ts: p("dt-mislabel.ts") });
    expect(r.result).toBe("fail");
    expect(r.hits[0]!.text).toContain('must start with "dt:"');
  });

  test("leaves paper blocks alone", () => {
    expect(checkDakLabelPrefixMatchesKind({ ts: p("thm-paper.ts") }).result).toBe("pass");
  });
});

describe("registration", () => {
  test("every DAK criterion has a checker and vice versa", () => {
    const registered = QA_CRITERIA_REGISTRY.filter((d) => d.domain === "dak").map((d) => d.id);
    expect(registered.sort()).toEqual(Object.keys(DAK_AUTOMATED_CHECKERS).sort());
  });

  test("all of them are dak-scoped and automated", () => {
    for (const def of QA_CRITERIA_REGISTRY.filter((d) => d.domain === "dak")) {
      expect(criterionAdapters(def)).toEqual(["dak"]);
      expect(def.automated).toBe(true);
    }
  });
});
