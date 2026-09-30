/**
 * CODATA ingestion (bean `uyp8`): NIST's fixed-width table becomes exact,
 * addressable values. Pinned against published CODATA 2022 values, and against
 * the committed `library/codata-2022` entry, so the entry cannot drift from
 * the parser that claims to have written it.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildCodataEntry, parseCodataAscii, slugOf } from "./codata-ingest";

// Four real rows of NIST's allascii table, CODATA 2022, spacing preserved.
const SAMPLE = [
  "electron mass                                               9.109 383 7139 e-31      0.000 000 0028 e-31      kg",
  "electron mass energy equivalent in MeV                      0.510 998 950 69         0.000 000 000 16         MeV",
  "inverse fine-structure constant                             137.035 999 177          0.000 000 021            ",
  "speed of light in vacuum                                    299 792 458              (exact)                  m s^-1",
].join("\n");

describe("parsing NIST's table", () => {
  const rows = parseCodataAscii(SAMPLE);

  test("grouping spaces go, the exponent stays, the value stays a decimal STRING", () => {
    expect(rows.get("electron-mass")).toEqual({
      quantity: "electron mass",
      value: "9.1093837139e-31",
      uncertainty: "0.0000000028e-31",
      unit: "kg",
      exact: false,
    });
  });

  test("CODATA 2022 1/alpha — not the 2018 value 137.035999084", () => {
    expect(rows.get("inverse-fine-structure-constant")?.value).toBe("137.035999177");
    expect(rows.get("inverse-fine-structure-constant")?.unit).toBeNull();
  });

  test("(exact) is exact, with no uncertainty", () => {
    expect(rows.get("speed-of-light-in-vacuum")).toMatchObject({ value: "299792458", uncertainty: null, exact: true, unit: "m s^-1" });
  });

  test("slugs are mechanical, and a collision is refused", () => {
    expect(slugOf("electron mass energy equivalent in MeV")).toBe("electron-mass-energy-equivalent-in-mev");
    expect(() =>
      parseCodataAscii(
        "a-b                                                         1                        (exact)\n" +
          "a b                                                         2                        (exact)",
      ),
    ).toThrow(/names both/);
  });
});

describe("the committed library/codata-2022 entry", () => {
  const dir = join(import.meta.dir, "..", "..", "library", "codata-2022");
  const values = JSON.parse(readFileSync(join(dir, "values.json"), "utf-8")) as Record<string, { value: string; quantity: string }>;
  const tabular = JSON.parse(readFileSync(join(dir, "tabular.jsonld"), "utf-8")) as {
    source: { sha256: string; edition: string; primaryUrl: string; obtainedFrom: string };
    sheets: Array<{ rows: number }>;
  };

  test("carries the whole table, with its provenance", () => {
    expect(Object.keys(values).length).toBe(tabular.sheets[0]!.rows);
    expect(tabular.sheets[0]!.rows).toBeGreaterThan(300);
    expect(tabular.source.edition).toBe("CODATA 2022");
    expect(tabular.source.primaryUrl).toContain("physics.nist.gov");
    expect(tabular.source.obtainedFrom).toContain("SciPy");
    expect(tabular.source.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  test("known CODATA 2022 values, as published", () => {
    expect(values["electron-mass-energy-equivalent-in-mev"]!.value).toBe("0.51099895069");
    expect(values["inverse-fine-structure-constant"]!.value).toBe("137.035999177");
    expect(values["planck-constant"]!.value).toBe("6.62607015e-34");
  });

  test("the sample rows rebuild to the same records the entry holds", () => {
    const rebuilt = buildCodataEntry({
      entryId: "codata-2022",
      sourceText: SAMPLE,
      sourceName: "x",
      edition: "2022",
      primaryUrl: "u",
      obtainedFrom: "o",
      retrievedAt: "2026-09-30",
    });
    const sampleValues = JSON.parse(rebuilt.files["values.json"]!) as Record<string, unknown>;
    for (const [slug, rec] of Object.entries(sampleValues)) expect(values[slug]).toEqual(rec as never);
  });
});
