/**
 * Conjecture register (`folio-conjecture-register/v1`, bean `folio-assistant-ckej`):
 * - the `conjectures` graph typology (`holds: "state"`, `recordsWork: false`) and
 *   its `conjecture-register` validator node are declared together;
 * - `ConjectureRegisterNodeSchema` validates open-problem register nodes;
 * - `conjecture-status-lifecycle.dmn` computes the status lifecycle (`open` ->
 *   `attempted` -> `proved` | `disproved` | `superseded`);
 * - `computeAssumedBy` derives critical-path theorems assuming a conjecture
 *   from `lean-formal-graph` reverse edges.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { possibleOutcomes } from "../../cat-harness-tools/src/workflow/decision-table.ts";
import {
  CONJECTURE_REGISTER_SCHEMA,
  CONJECTURE_STATUSES,
  ConjectureRegisterKind,
  ConjectureRegisterNodeSchema,
  canTransitionConjectureStatus,
  computeAssumedBy,
  evaluateConjectureStatus,
  type FormalGraphEdgeRecord,
  loadConjectureStatusTable,
  transitionConjectureNode,
} from "./conjecture-register.ts";

const SCI = join(import.meta.dir, "..");
const declaration = JSON.parse(readFileSync(join(SCI, "folio-assistant-sci.json"), "utf8")) as {
  name: string;
  directories: { path: string; graphTypologies: string[] }[];
};
const dirOf = (typology: string) =>
  declaration.directories.find((d) => d.graphTypologies.includes(typology))?.path;

describe("conjecture-register typology and validator", () => {
  test("declares the conjectures typology (holds: state) and its validator node", () => {
    const kind = JSON.parse(
      readFileSync(join(SCI, dirOf("typologies")!, "conjectures.json"), "utf8"),
    );
    expect(kind.kind).toBe("conjectures");
    expect(kind.holds).toBe("state");
    expect(kind.recordsWork).toBe(false);
    expect(kind.renderable).toBe(false);
    expect(Object.keys(kind.nodeSchemas)).toEqual([CONJECTURE_REGISTER_SCHEMA]);

    const v = JSON.parse(
      readFileSync(join(SCI, dirOf("validators")!, "conjecture-register.json"), "utf8"),
    );
    expect(v.validates).toEqual({
      kind: "conjectures",
      family: CONJECTURE_REGISTER_SCHEMA,
    });
    expect(v.schema).toBe(`${declaration.name}:schemas/conjecture-register.ts#ConjectureRegisterKind`);
    expect(ConjectureRegisterKind.id).toBe("folio-conjecture-register");
  });

  test("validates formal and identification register nodes and rejects malformed entries", () => {
    const valid = {
      $schema: CONJECTURE_REGISTER_SCHEMA,
      id: "conj-spectral-gap",
      title: "Spectral gap of the transfer operator",
      sourceBlock: "conj:spectral-gap",
      conjectureKind: "formal" as const,
      status: "attempted" as const,
      leanStub: { ref: "qou:QOU.SpectralGap" },
      assumedBy: ["thm:main-decay", "cor:ergodic-limit"],
      attempts: [
        {
          beanId: "qou-a1b2",
          commit: "deadbeef",
          outcome: "partial" as const,
          summary: "Proved compact-resolvent step; spectral radius bound remains open.",
          recordedAt: "2026-10-04",
        },
      ],
    };
    const parsed = ConjectureRegisterNodeSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    expect(ConjectureRegisterKind.schema.safeParse(valid).success).toBe(true);

    // Rejects a sourceBlock whose label prefix is not `conj:`
    expect(
      ConjectureRegisterNodeSchema.safeParse({
        ...valid,
        sourceBlock: "thm:not-a-conjecture",
      }).success,
    ).toBe(false);

    // Rejects unknown properties (strict schema)
    expect(
      ConjectureRegisterNodeSchema.safeParse({
        ...valid,
        extraField: true,
      }).success,
    ).toBe(false);
  });
});

describe("conjecture status lifecycle DMN and transitions", () => {
  test("DMN table covers every ConjectureStatus and evaluates deterministically", async () => {
    const table = await loadConjectureStatusTable();
    expect(table.hitPolicy).toBe("FIRST");
    expect(table.inputs.map((i) => i.expression)).toEqual([
      "superseded",
      "disproved",
      "proved",
      "attemptCount",
    ]);
    expect(possibleOutcomes(table).sort()).toEqual([...CONJECTURE_STATUSES].sort());

    expect(
      await evaluateConjectureStatus({
        superseded: false,
        disproved: false,
        proved: false,
        attemptCount: 0,
      }),
    ).toEqual({ status: "open", rule: "Rule_Open" });

    expect(
      await evaluateConjectureStatus({
        superseded: false,
        disproved: false,
        proved: false,
        attemptCount: 2,
      }),
    ).toEqual({ status: "attempted", rule: "Rule_Attempted" });

    expect(
      await evaluateConjectureStatus({
        superseded: false,
        disproved: false,
        proved: true,
        attemptCount: 2,
      }),
    ).toEqual({ status: "proved", rule: "Rule_Proved" });

    expect(
      await evaluateConjectureStatus({
        superseded: false,
        disproved: true,
        proved: false,
        attemptCount: 1,
      }),
    ).toEqual({ status: "disproved", rule: "Rule_Disproved" });

    expect(
      await evaluateConjectureStatus({
        superseded: true,
        disproved: false,
        proved: true,
        attemptCount: 3,
      }),
    ).toEqual({ status: "superseded", rule: "Rule_Superseded" });
  });

  test("transitionConjectureNode advances open -> attempted -> proved and refuses backward transitions", () => {
    const openNode = ConjectureRegisterNodeSchema.parse({
      $schema: CONJECTURE_REGISTER_SCHEMA,
      id: "conj-mass-ratio",
      title: "Proton-to-electron mass ratio identification",
      sourceBlock: "conj:mass-ratio",
      conjectureKind: "identification",
      status: "open",
      assumedBy: [],
      attempts: [],
    });

    const attempted = transitionConjectureNode(openNode, {
      addAttempt: {
        beanId: "qou-c3d4",
        outcome: "in-progress",
        summary: "Numerical check to 30 digits",
      },
    });
    expect(attempted.status).toBe("attempted");
    expect(attempted.attempts).toHaveLength(1);

    const proved = transitionConjectureNode(attempted, {
      status: "proved",
      resolvedBy: "thm:mass-ratio-derived",
    });
    expect(proved.status).toBe("proved");
    expect(proved.resolvedBy).toBe("thm:mass-ratio-derived");

    expect(canTransitionConjectureStatus("proved", "open")).toBe(false);
    expect(canTransitionConjectureStatus("proved", "superseded")).toBe(true);
    expect(() => transitionConjectureNode(proved, { status: "open" })).toThrow(
      /Invalid conjecture status transition/,
    );
  });
});

describe("computeAssumedBy over lean-formal-graph reverse edges", () => {
  const edges: FormalGraphEdgeRecord[] = [
    { decl: "QOU.ConjAlpha", type_deps: [], value_deps: [] },
    { decl: "QOU.LemmaStep", type_deps: ["QOU.ConjAlpha"], value_deps: [] },
    { decl: "QOU.ThmMain", type_deps: [], value_deps: ["QOU.LemmaStep"] },
    { decl: "QOU.CorFinal", type_deps: ["QOU.ThmMain"], value_deps: [] },
    { decl: "QOU.Unrelated", type_deps: ["QOU.OtherDef"], value_deps: [] },
  ];

  test("computes direct and transitive reverse dependencies from formal-edge records", () => {
    expect(computeAssumedBy("qou:QOU.ConjAlpha", edges, { transitive: false })).toEqual([
      "QOU.LemmaStep",
    ]);

    expect(computeAssumedBy("qou:QOU.ConjAlpha", edges)).toEqual([
      "QOU.CorFinal",
      "QOU.LemmaStep",
      "QOU.ThmMain",
    ]);
  });

  test("maps Lean declaration names to block labels when declToBlockLabel is provided", () => {
    const declToBlockLabel = new Map([
      ["QOU.LemmaStep", "lem:step"],
      ["QOU.ThmMain", "thm:main"],
      ["QOU.CorFinal", "cor:final"],
    ]);
    expect(computeAssumedBy("qou:QOU.ConjAlpha", edges, { declToBlockLabel })).toEqual([
      "cor:final",
      "lem:step",
      "thm:main",
    ]);
  });
});
