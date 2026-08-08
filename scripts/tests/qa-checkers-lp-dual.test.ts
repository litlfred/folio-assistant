import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { checkComputeLpDualPresent } from "../../content/pipeline/qa-checkers-extended.ts";

/**
 * `compute-lp-dual-present` decides whether a block's OWN witness must carry
 * LP/SDP dual fields. Getting that wrong in either direction is expensive: a
 * false fire demands dual data from a block that never solved an LP, and a
 * miss lets a solver ship without its certificate.
 *
 * The filter has always had two gates — an LP hint somewhere in the block, and
 * LP evidence in `script` / `witness` / `label`. The first gate used to be a
 * DENYLIST: strip `uses:`, `cites:` and `interprets:` from the source text and
 * grep whatever remained. That reads every OTHER reference-bearing field —
 * `examples`, `proofs`, `defines`, `requires`, `mathlibLinks` — as evidence
 * about this block, when each of them points at a DIFFERENT one.
 *
 * These tests pin both directions, and the leak case is why the gate is now an
 * allowlist over named fields.
 */

let root: string;
let goodWitness: string;
let barrenWitness: string;

/** A witness carrying the full dual certificate. */
const FULL = {
  data: {
    y0_star: 1,
    y_star: [1, 2],
    primal_obj: 3,
    dual_obj: 3,
    duality_gap: 0,
    active_set: [0],
  },
};

/** A witness from a solver that recorded no dual information. */
const BARREN = { data: { value: 42 } };

function blockTs(fields: string): string {
  return `import { proposition } from "../../schema/builders";
export default proposition({
${fields}
});
`;
}

/** Write a block `.ts` into the fixture root and return its path. */
function fixture(name: string, fields: string): string {
  const p = join(root, `${name}.ts`);
  writeFileSync(p, blockTs(fields));
  return p;
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "lpdual-"));
  mkdirSync(join(root, "w"), { recursive: true });
  goodWitness = join(root, "w", "full.witness.json");
  barrenWitness = join(root, "w", "barren.witness.json");
  writeFileSync(goodWitness, JSON.stringify(FULL));
  writeFileSync(barrenWitness, JSON.stringify(BARREN));
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

describe("compute-lp-dual-present — fires when it should", () => {
  test("flags a block whose own LP script ships a witness with no dual fields", () => {
    const p = fixture(
      "solver",
      `  label: "prop:operator-selection-lp-bound",
  title: "An lp-duality bound",
  computation: { script: "computations/solve_operator_selection_lp.py", witness: "${barrenWitness}" },`,
    );
    const r = checkComputeLpDualPresent(p);
    expect(r.result).toBe("fail");
  });

  test("passes the same block once the witness carries the certificate", () => {
    const p = fixture(
      "solver-ok",
      `  label: "prop:operator-selection-lp-bound",
  title: "An lp-duality bound",
  computation: { script: "computations/solve_operator_selection_lp.py", witness: "${goodWitness}" },`,
    );
    expect(checkComputeLpDualPresent(p).result).toBe("pass");
  });
});

describe("compute-lp-dual-present — does not fire on OTHER blocks' references", () => {
  // The gate that these pin: an LP token inside a field that points at a
  // different block says nothing about what THIS block computes.
  const cases: Array<[string, string]> = [
    ["uses", `  uses: ["prop:lp-duality-bound"],`],
    ["cites", `  cites: ["prop:lp-duality-bound"],`],
    ["interprets", `  interprets: "prop:lp-duality-bound",`],
    // Not covered by the old denylist — the leak this change closes.
    ["examples", `  examples: ["ex:shadow-price-table"],`],
    ["proofs", `  proofs: ["proof:primal-dual-gap"],`],
    ["defines", `  defines: ["def:lp-dual-witness"],`],
  ];

  for (const [field, line] of cases) {
    test(`an LP token in \`${field}\` is not evidence about this block`, () => {
      const p = fixture(
        `ref-${field}`,
        `  label: "prop:some-lp-consuming-result",
  title: "A result that consumes an LP bound",
${line}
  computation: { script: "computations/solve_lp_thing.py", witness: "${barrenWitness}" },`,
      );
      expect(checkComputeLpDualPresent(p).result).toBe("pass");
    });
  }
});

describe("compute-lp-dual-present — gating", () => {
  test("n/a without a ts path", () => {
    expect(checkComputeLpDualPresent(undefined).result).toBe("n/a");
  });

  test("passes a block with no witness at all", () => {
    const p = fixture(
      "no-witness",
      `  label: "prop:lp-duality-discussion",
  title: "About lp-duality",`,
    );
    expect(checkComputeLpDualPresent(p).result).toBe("pass");
  });

  test("passes when the LP hint is only theoretical context, not the computation", () => {
    // Gate two: tags describe what a block is ABOUT; the script and witness
    // names say what it computed.
    const p = fixture(
      "context-only",
      `  label: "prop:mass-gap-estimate",
  title: "A primal-dual discussion",
  tags: ["lp-duality"],
  computation: { script: "computations/mass_gap.py", witness: "${barrenWitness}" },`,
    );
    expect(checkComputeLpDualPresent(p).result).toBe("pass");
  });
});
