import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CatHarnessDeclarationSchema, ExactVersionSchema } from "./cat-harness";
import { auditPublishable, formatReport } from "../scripts/check-publishable";

/**
 * A minimal valid declaration, extended per test.
 *
 * Built by a helper rather than inlined so that a test asserting ONE rule
 * cannot be passing because of a second violation elsewhere in its fixture —
 * the same reason `qa-report.test.ts` does it.
 */
function decl(over: Record<string, unknown> = {}): unknown {
  return { name: "example", directories: [], remoteGraphs: [], ...over };
}

/** The issue paths a failed parse reported, sorted — never the message text. */
function failedPaths(value: unknown): string[] {
  const r = CatHarnessDeclarationSchema.safeParse(value);
  if (r.success) return [];
  return r.error.issues.map((i) => i.path.join(".")).sort();
}

describe("publishable is a THREE-state field (§3.1)", () => {
  test("absent is legal and obliges nothing", () => {
    expect(CatHarnessDeclarationSchema.safeParse(decl()).success).toBe(true);
  });

  test("`false` is legal and is NOT the same as absent — it obliges nothing either", () => {
    expect(CatHarnessDeclarationSchema.safeParse(decl({ publishable: false })).success).toBe(true);
  });

  /**
   * The half that gets dropped. Requiring the triple under `true` is what
   * makes a published instance resolvable; REFUSING it otherwise is what stops
   * an internal instance from reading, to any consumer of the export, exactly
   * like a published package.
   */
  test("an id or a version is REFUSED while publishability is undeclared", () => {
    expect(failedPaths(decl({ id: "org.example.thing" }))).toEqual(["id"]);
    expect(failedPaths(decl({ version: "1.0.0" }))).toEqual(["version"]);
  });

  test("an id or a version is REFUSED when publishable is explicitly false", () => {
    expect(failedPaths(decl({ publishable: false, id: "org.example.thing" }))).toEqual(["id"]);
  });
});

describe("a publishable instance owes the whole identity triple (§3.2, §3.4)", () => {
  const full = {
    publishable: true,
    id: "org.example.thing",
    version: "1.2.3",
    canonicalUrl: "https://example.org/thing",
  };

  test("id, version and canonicalUrl together parse", () => {
    expect(CatHarnessDeclarationSchema.safeParse(decl(full)).success).toBe(true);
  });

  test("each one missing is reported on its OWN path", () => {
    expect(failedPaths(decl({ ...full, id: undefined }))).toEqual(["id"]);
    expect(failedPaths(decl({ ...full, version: undefined }))).toEqual(["version"]);
    // §3.4's `dependsOn` record is `{packageId, version, uri}` and
    // `canonicalUrl` is what plays `uri`.
    expect(failedPaths(decl({ ...full, canonicalUrl: undefined }))).toEqual(["canonicalUrl"]);
  });

  test("all three missing are reported TOGETHER, not one at a time", () => {
    expect(failedPaths(decl({ publishable: true }))).toEqual(["canonicalUrl", "id", "version"]);
  });
});

describe("versions are exact — ranges cannot be expressed in FHIR `dependsOn` (§2 rule 2)", () => {
  for (const ok of ["1.0.0", "0.0.1", "10.20.30", "1.2.3-rc.1", "1.2.3+build.5", "current", "dev"]) {
    test(`accepts ${ok}`, () => {
      expect(ExactVersionSchema.safeParse(ok).success).toBe(true);
    });
  }
  for (const bad of ["^1.2.3", "~1.2.3", ">=1.0.0", "1.2.*", "1.x", "1.2", "1.0.0 || 2.0.0", "latest", ""]) {
    test(`refuses ${JSON.stringify(bad)}`, () => {
      expect(ExactVersionSchema.safeParse(bad).success).toBe(false);
    });
  }
});

/**
 * The gate's two CROSS-INSTANCE rules, which no single parse can hold.
 *
 * Each runs over a throwaway tree rather than the repository, so the
 * assertions stay true when the repository's own instances change — the
 * failure mode a test reading live data walks into (`yag0`, where the
 * assertion was derived from the very data it was meant to check).
 */
describe("check:publishable — the rules a per-declaration schema cannot see", () => {
  function tree(instances: Record<string, unknown | string>): string {
    const root = mkdtempSync(join(tmpdir(), "pubtest-"));
    for (const [name, body] of Object.entries(instances)) {
      const dir = join(root, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${name}.json`), typeof body === "string" ? body : JSON.stringify(body));
    }
    return root;
  }

  test("a duplicate id is a major finding — an id is an identity, so two is two packages under one name", () => {
    const pub = (name: string) => ({
      name,
      publishable: true,
      id: "org.example.shared",
      version: "1.0.0",
      canonicalUrl: `https://example.org/${name}`,
      directories: [],
    });
    const root = tree({ alpha: pub("alpha"), beta: pub("beta") });
    try {
      const { findings } = auditPublishable(root);
      const dup = findings.filter((f) => f.detail.includes("org.example.shared"));
      expect(dup).toHaveLength(1);
      expect(dup[0]!.severity).toBe("major");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("distinct ids raise nothing — the duplicate rule is falsifiable in both directions", () => {
    const pub = (name: string) => ({
      name,
      publishable: true,
      id: `org.example.${name}`,
      version: "1.0.0",
      canonicalUrl: `https://example.org/${name}`,
      directories: [],
    });
    const root = tree({ alpha: pub("alpha"), beta: pub("beta") });
    try {
      expect(auditPublishable(root).findings).toEqual([]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  /**
   * UNKNOWN is a fact about the run; undecided is a fact about the repository.
   * A gate that folded the first into the second would report a clean census
   * over an instance it never read — the `dh4f` shape.
   */
  test("an unreadable declaration is `unknown`, never counted as undecided", () => {
    const root = tree({ broken: "{ this is not json" });
    try {
      const { rows, findings } = auditPublishable(root);
      const broken = rows.find((r) => r.where === "broken");
      expect(broken?.state).toBe("unknown");
      expect(broken?.problem).toBeDefined();
      expect(findings.some((f) => f.where === "broken" && f.severity === "major")).toBe(true);
      expect(formatReport({ rows, findings })).toContain("UNKNOWN is not undecided");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an all-undecided census SAYS it is not a pass", () => {
    const root = tree({ alpha: { name: "alpha", directories: [] }, beta: { name: "beta", directories: [] } });
    try {
      const report = auditPublishable(root);
      expect(report.rows.every((r) => r.state === "undecided")).toBe(true);
      expect(report.findings).toEqual([]);
      expect(formatReport(report)).toContain("EVERY INSTANCE IS UNDECIDED, and that is the expected state, not a pass");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
