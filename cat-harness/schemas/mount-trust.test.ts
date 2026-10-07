import { describe, expect, test } from "bun:test";
import { mountTrust, MountTrustSchema } from "./mount-trust.ts";

const PIN = "a".repeat(40);
const OTHER = "b".repeat(40);
const consent = (ref: string) => ({ consent: { by: "litlfred", on: "2026-10-07", ref, evidence: "issue #2389" } });

describe("mount trust (H8): signed provenance or explicit consent; staging needs neither", () => {
  test("staging mounts with no signature and no consent", () => {
    expect(mountTrust({ harness: "x", ref: PIN }, "staging")).toMatchObject({ ok: true, basis: "staging" });
  });

  test("unsigned and unconsented is REFUSED", () => {
    expect(mountTrust({ harness: "x", ref: PIN }, "mount")).toMatchObject({ ok: false, state: "refused" });
  });

  test("consent for this exact pin mounts", () => {
    expect(mountTrust({ harness: "x", ref: PIN, trust: consent(PIN) }, "mount")).toMatchObject({ ok: true, basis: "consent" });
  });

  test("consent for a different pin is refused: a moved pin asks again", () => {
    expect(mountTrust({ harness: "x", ref: PIN, trust: consent(OTHER) }, "mount")).toMatchObject({ ok: false, state: "refused" });
  });

  test("a signature with no verifier is could-not-determine, never trusted", () => {
    const trust = { signature: { network: "gdhcn", keyId: "k1", signedDigest: "c".repeat(64), value: "sig" } };
    expect(mountTrust({ harness: "x", ref: PIN, trust }, "mount")).toMatchObject({ ok: false, state: "could-not-determine" });
  });

  test("the record is strict: an unknown trust key does not validate", () => {
    expect(MountTrustSchema.safeParse({ trusted: true }).success).toBe(false);
    expect(MountTrustSchema.safeParse(consent(PIN)).success).toBe(true);
  });
});
