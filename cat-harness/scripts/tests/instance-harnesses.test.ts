/**
 * An instance's OWN site lists the instance and what it is built on — never
 * the platform's other harnesses (bean `mftp`, owner 2026-10-05: "harnesses
 * in bottom LHS navbar link back to folio-assist, not smart-immz").
 */
import { describe, expect, test } from "bun:test";
import { instanceHarnesses } from "../mount-instance-docs.ts";

describe("instanceHarnesses", () => {
  const rows = instanceHarnesses("cat-harness", "smart-immunizations", "https://example.org/fa", ".")!;
  test("the instance comes first and links to its own site's root", () => {
    expect(rows[0]!.label).toBe("smart-immunizations");
    expect(rows[0]!.href).toBe(".");
  });
  test("it lists the harnesses the instance is built on, re-based on the platform", () => {
    const smartBase = rows.find((r) => r.label === "SMART Base");
    expect(smartBase?.href).toBe("https://example.org/fa/smart-base/");
  });
  test("it lists nothing the instance is not built on", () => {
    const labels = rows.map((r) => r.label);
    for (const other of ["smart-trust", "WHO IRIS", "Folio Assistant"]) expect(labels).not.toContain(other);
  });
});
