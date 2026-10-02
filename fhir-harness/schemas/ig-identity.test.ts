/**
 * `ig-identity.json` — an IG's own identity and status, refused when it names
 * another package. Stage D of the smart-* separation (#1767).
 *
 * Calibrated: making `statusOf` skip the package comparison fails the
 * "another IG's identity" test.
 */
import { describe, expect, it } from "bun:test";
import { join, resolve } from "node:path";

import { IG_IDENTITY_SCHEMA_TAG, IgIdentitySchema, readIgIdentity, statusOf, type IgIdentity } from "./ig-identity";

const ROOT = resolve(import.meta.dir, "..", "..");

const trust: IgIdentity = {
  $schema: IG_IDENTITY_SCHEMA_TAG,
  id: "example.ig.one",
  canonical: "http://example.org/one",
  status: "draft",
  readFrom: "https://example.org/one sushi-config.yaml",
  readAt: "2026-10-01",
};

describe("statusOf", () => {
  it("states the status for the IG the identity names", () => {
    expect(statusOf(trust, "example.ig.one")).toBe("draft");
  });
  it("refuses another IG's identity — a mis-filed copy paints no watermark", () => {
    expect(statusOf(trust, "example.ig.two")).toBeUndefined();
  });
  it("no identity, or no package to compare, states nothing", () => {
    expect(statusOf(undefined, "example.ig.one")).toBeUndefined();
    expect(statusOf(trust, undefined)).toBeUndefined();
  });
});

describe("the committed identities", () => {
  it("smart-trust's validates and names its own package", () => {
    const id = readIgIdentity(join(ROOT, "smart-trust", "fhir-artifact-index"));
    expect(id).toBeDefined();
    expect(IgIdentitySchema.safeParse(id).success).toBe(true);
    expect(id!.id).toBe("smart.who.int.trust");
  });
  it("smart-base has none, so it states no status (the third state)", () => {
    expect(readIgIdentity(join(ROOT, "smart-base", "fhir-artifact-index"))).toBeUndefined();
  });
});
