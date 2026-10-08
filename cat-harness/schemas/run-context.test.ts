import { describe, expect, test } from "bun:test";

import { RUN_CONTEXT_SCHEMA_TAG, RunContextRefSchema, RunContextSchema, runContextRef, unprovisioned, type RunContext } from "./run-context";

const SHA = "a".repeat(64);
const COMMIT = "1".repeat(40);

function ctx(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $schema: RUN_CONTEXT_SCHEMA_TAG,
    platform: { commit: COMMIT },
    mounts: {
      state: "locked",
      lock: { file: "folio-assistant.mount-lock.json", sha256: SHA },
      instances: [{ instance: "bootstrap", repository: "litlfred/bootstrap", sha: "2".repeat(40) }],
    },
    profile: { name: "default", sha256: SHA },
    releases: [
      { state: "provisioned", release: "plantuml@1.2024.7", digest: { algorithm: "sha256", digest: SHA } },
      { state: "provisioned", release: "temurin-jre@21.0.4+7", digest: { algorithm: "sha256", digest: "b".repeat(64) } },
    ],
    invoker: { kind: "system", id: "cat-harness/scripts/plantuml-render.ts", script_hash: "abcdef012345" },
    inputs: [{ hash: "abcdef012345", inputs: ["cat-harness/uml/a.puml"] }],
    prov: { activity: "urn:folio:activity:render-1" },
    ...over,
  };
}

const ok = (c: unknown) => RunContextSchema.safeParse(c).success;

describe("folio-run-context/v1", () => {
  test("a valid context parses", () => {
    expect(ok(ctx())).toBe(true);
  });

  test("strict: an unknown top-level field is refused", () => {
    expect(ok(ctx({ engine_version: "1" }))).toBe(false);
  });

  test("the platform commit is a full SHA — an abbreviated one is ambiguous", () => {
    expect(ok(ctx({ platform: { commit: "1234567" } }))).toBe(false);
  });

  describe("releases — `could-not-provision` is a state with a reason", () => {
    test("could-not-provision WITH a reason parses, and is reported", () => {
      const c = RunContextSchema.parse(
        ctx({ releases: [{ state: "could-not-provision", release: "temurin-jre@21.0.4+7", reason: "no network: api.adoptium.net refused" }] }),
      );
      expect(unprovisioned(c).map((r) => r.release)).toEqual(["temurin-jre@21.0.4+7"]);
    });

    test("could-not-provision WITHOUT a reason is refused", () => {
      expect(ok(ctx({ releases: [{ state: "could-not-provision", release: "temurin-jre@21.0.4+7" }] }))).toBe(false);
      expect(ok(ctx({ releases: [{ state: "could-not-provision", release: "temurin-jre@21.0.4+7", reason: "" }] }))).toBe(false);
    });

    test("provisioned WITHOUT a digest is refused", () => {
      expect(ok(ctx({ releases: [{ state: "provisioned", release: "plantuml@1.2024.7" }] }))).toBe(false);
    });

    test("one release listed twice is refused", () => {
      const r = { state: "provisioned", release: "plantuml@1.2024.7", digest: { algorithm: "sha256", digest: SHA } };
      expect(ok(ctx({ releases: [r, r] }))).toBe(false);
    });
  });

  describe("mounts — none, locked, or could-not-determine", () => {
    test("`none` parses; `locked` with no instances does not", () => {
      expect(ok(ctx({ mounts: { state: "none" } }))).toBe(true);
      expect(ok(ctx({ mounts: { state: "locked", lock: { file: "x.mount-lock.json", sha256: SHA }, instances: [] } }))).toBe(false);
    });

    test("`could-not-determine` needs its reason", () => {
      expect(ok(ctx({ mounts: { state: "could-not-determine" } }))).toBe(false);
      expect(ok(ctx({ mounts: { state: "could-not-determine", reason: "the lock did not parse" } }))).toBe(true);
    });

    test("a mounted instance pinned by branch name is refused", () => {
      expect(ok(ctx({ mounts: { state: "locked", lock: { file: "x.mount-lock.json", sha256: SHA }, instances: [{ instance: "bootstrap", repository: "litlfred/bootstrap", sha: "main" }] } }))).toBe(false);
    });
  });

  describe("invoker", () => {
    test("a `system` invoker must give its script hash — `unknown` is allowed and is not a hash", () => {
      expect(ok(ctx({ invoker: { kind: "system", id: "scripts/x.ts" } }))).toBe(false);
      expect(ok(ctx({ invoker: { kind: "system", id: "scripts/x.ts", script_hash: "unknown" } }))).toBe(true);
      expect(ok(ctx({ invoker: { kind: "system", id: "scripts/x.ts", script_hash: "not-a-hash" } }))).toBe(false);
    });

    test("a person needs no script hash; an unknown actor kind is refused", () => {
      expect(ok(ctx({ invoker: { kind: "person", id: "litlfred" } }))).toBe(true);
      expect(ok(ctx({ invoker: { kind: "robot", id: "x" } }))).toBe(false);
    });
  });

  test("inputs reuse HashBasisSchema: a basis over nothing is refused", () => {
    expect(ok(ctx({ inputs: [{ hash: "abc", inputs: [] }] }))).toBe(false);
  });

  test("profile and prov are optional — a run may select no profile and record no PROV activity yet", () => {
    const { profile: _p, prov: _v, ...rest } = ctx();
    expect(ok(rest)).toBe(true);
  });
});

describe("the reference a report carries (C1: by sha256)", () => {
  test("RunContextRefSchema is `{ sha256 }` and nothing else", () => {
    expect(RunContextRefSchema.safeParse({ sha256: SHA }).success).toBe(true);
    expect(RunContextRefSchema.safeParse({ sha256: SHA, context: {} }).success).toBe(false);
    expect(RunContextRefSchema.safeParse({ sha256: "abc" }).success).toBe(false);
  });

  test("the reference does not depend on the order a writer set fields in", () => {
    const a = RunContextSchema.parse(ctx()) as RunContext;
    const reordered = Object.fromEntries(Object.entries(ctx()).reverse());
    const b = RunContextSchema.parse(reordered) as RunContext;
    expect(runContextRef(a)).toEqual(runContextRef(b));
    expect(RunContextRefSchema.safeParse(runContextRef(a)).success).toBe(true);
  });

  test("a different context has a different reference", () => {
    const a = RunContextSchema.parse(ctx()) as RunContext;
    const b = RunContextSchema.parse(ctx({ platform: { commit: "3".repeat(40) } })) as RunContext;
    expect(runContextRef(a).sha256).not.toBe(runContextRef(b).sha256);
  });
});
