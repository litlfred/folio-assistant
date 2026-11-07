/**
 * `ig-identity.json` — an IG's own identity and status, refused when it names
 * another package. Stage D of the smart-* separation (#1767).
 *
 * Calibrated: making `statusOf` skip the package comparison fails the
 * "another IG's identity" test.
 */
import { afterAll, describe, expect, it } from "bun:test";
import { rmSync } from "node:fs";
import { join } from "node:path";

import { IG_IDENTITY_SCHEMA_TAG, IgIdentitySchema, readIgIdentity, statusOf, type IgIdentity } from "./ig-identity";
import { IPA, IPS, IPS_IDENTITY, artifactIndex, scratchRepo } from "../test/support/ig-fixture";

const one: IgIdentity = {
  $schema: IG_IDENTITY_SCHEMA_TAG,
  id: "example.ig.one",
  canonical: "http://example.org/one",
  status: "draft",
  readFrom: "https://example.org/one sushi-config.yaml",
  readAt: "2026-10-01",
};

describe("statusOf", () => {
  it("states the status for the IG the identity names", () => {
    expect(statusOf(one, "example.ig.one")).toBe("draft");
  });
  it("refuses another IG's identity — a mis-filed copy paints no watermark", () => {
    expect(statusOf(one, "example.ig.two")).toBeUndefined();
  });
  it("no identity, or no package to compare, states nothing", () => {
    expect(statusOf(undefined, "example.ig.one")).toBeUndefined();
    expect(statusOf(one, undefined)).toBeUndefined();
  });
});

/**
 * Read from disk, as the page generator and `site.data.fhir` read it. The
 * committed WHO identities are checked in `smart-base/scripts/ig-pages-committed.test.ts`.
 */
describe("identities read from an instance", () => {
  const repo = scratchRepo({
    ips: { index: artifactIndex(IPS, "ips"), identity: IPS_IDENTITY },
    ipa: { index: artifactIndex(IPA, "ipa") },
  });
  afterAll(() => rmSync(repo, { recursive: true, force: true }));

  it("an IG's own identity validates and names its own package", () => {
    const id = readIgIdentity(join(repo, "ips", "fhir-artifact-index"));
    expect(id).toBeDefined();
    expect(IgIdentitySchema.safeParse(id).success).toBe(true);
    expect(id!.id).toBe(IPS.packageId);
  });
  it("an IG with none states no status (the third state)", () => {
    expect(readIgIdentity(join(repo, "ipa", "fhir-artifact-index"))).toBeUndefined();
  });
});
