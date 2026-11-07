import { describe, expect, test } from "bun:test";
import {
  isPrecisionScalar,
  precisionScalar,
  precisionScalarOrNumber,
} from "./precision-scalar.ts";

describe("precisionScalar schema and type guard", () => {
  test("accepts signed decimals and scientific notation with positive dps", () => {
    for (const value of ["1.10997859555418057528", "-42", "1.23e10", "1.23e+10", "1.23E-10", "0.0005E+3"]) {
      const parsed = precisionScalar.safeParse({ value, dps: 50 });
      expect(parsed.success).toBe(true);
      expect(isPrecisionScalar({ value, dps: 50 })).toBe(true);
    }
  });

  test("rejects malformed decimal strings and non-positive dps", () => {
    expect(precisionScalar.safeParse({ value: "abc", dps: 50 }).success).toBe(false);
    expect(precisionScalar.safeParse({ value: "1.2.3", dps: 50 }).success).toBe(false);
    expect(precisionScalar.safeParse({ value: "1.5", dps: 0 }).success).toBe(false);
    expect(precisionScalar.safeParse({ value: "1.5", dps: -10 }).success).toBe(false);
    expect(precisionScalar.safeParse({ value: "1.5", dps: 12.5 }).success).toBe(false);
  });

  test("precisionScalarOrNumber accepts both legacy f64 numbers and envelopes", () => {
    expect(precisionScalarOrNumber.safeParse(3.14159).success).toBe(true);
    expect(precisionScalarOrNumber.safeParse({ value: "3.14159265358979323846", dps: 20 }).success).toBe(true);
    expect(isPrecisionScalar(3.14159)).toBe(false);
    expect(isPrecisionScalar(null)).toBe(false);
  });
});
