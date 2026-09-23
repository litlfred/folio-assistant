import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { CatHarnessDeclarationSchema, ExactVersionSchema, instanceRootFor, repoRootFor } from "./cat-harness";
import { dependsOnFor } from "./depends-on";
import { applyBump, clearsFloor, comparable, diffSurface, surfaceOf } from "./version-bump";
import { auditVersionBumps } from "../scripts/check-version-bump";
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

/**
 * §3.4's record, and — the point of the section — the gaps it cannot fill.
 *
 * Most instances here are not publishable and §3.1 says that is correct, so
 * most edges out of a publishable instance go to something with no id and no
 * version. `dependsOn: []` in that case would state that the instance depends
 * on nothing, which is false. Each case below is a DIFFERENT gap reason with a
 * different remedy, which is why it is an enum rather than a boolean.
 */
describe("dependsOn — §3.4's record, and what it reports instead", () => {
  function tree(instances: Record<string, unknown | string>): string {
    const root = mkdtempSync(join(tmpdir(), "depstest-"));
    for (const [name, body] of Object.entries(instances)) {
      const dir = join(root, name);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${name}.json`), typeof body === "string" ? body : JSON.stringify(body));
    }
    return root;
  }

  const published = (name: string, over: Record<string, unknown> = {}) => ({
    name,
    publishable: true,
    id: `org.example.${name}`,
    version: "1.0.0",
    canonicalUrl: `https://example.org/${name}`,
    directories: [],
    ...over,
  });

  test("a publishable instance depending on a publishable one emits the FHIR triple", () => {
    const root = tree({ base: published("base"), top: published("top", { needs: ["base"] }) });
    try {
      const out = dependsOnFor(join(root, "top"));
      expect(out.records).toEqual([
        { packageId: "org.example.base", version: "1.0.0", uri: "https://example.org/base" },
      ]);
      expect(out.gaps).toEqual([]);
      expect(out.unavailable).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an UNDECIDED dependency is a gap, not an omission — and says which reason", () => {
    const root = tree({
      base: { name: "base", directories: [] },
      top: published("top", { needs: ["base"] }),
    });
    try {
      const out = dependsOnFor(join(root, "top"));
      expect(out.records).toEqual([]);
      expect(out.gaps).toHaveLength(1);
      expect(out.gaps[0]!.reason).toBe("undecided");
      // The emptiness is explained rather than left to read as "depends on nothing".
      expect(out.unavailable).toContain("none expressible as a record");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("`internal` and `undecided` are DIFFERENT gaps — one is settled, one is not", () => {
    const root = tree({
      base: { name: "base", publishable: false, directories: [] },
      top: published("top", { needs: ["base"] }),
    });
    try {
      expect(dependsOnFor(join(root, "top")).gaps[0]!.reason).toBe("internal");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a name matching no instance is `unresolved` — external and misspelled are not the same", () => {
    const root = tree({ top: published("top", { needs: ["nowhere"] }) });
    try {
      const out = dependsOnFor(join(root, "top"));
      expect(out.gaps).toHaveLength(1);
      expect(out.gaps[0]).toMatchObject({ name: "nowhere", reason: "unresolved" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a publishable instance with no dependencies is a DETERMINED empty — no `unavailable`", () => {
    const root = tree({ solo: published("solo", { needs: [] }) });
    try {
      const out = dependsOnFor(join(root, "solo"));
      expect(out.records).toEqual([]);
      expect(out.gaps).toEqual([]);
      expect(out.unavailable).toBeUndefined();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an UNDECIDED instance withholds the block and says so — it does not emit an empty one", () => {
    const root = tree({ top: { name: "top", needs: [], directories: [] } });
    try {
      const out = dependsOnFor(join(root, "top"));
      expect(out.records).toEqual([]);
      expect(out.unavailable).toContain("undecided, never false");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an instance declaring `publishable: false` says THAT, not the undecided line", () => {
    const root = tree({ top: { name: "top", publishable: false, directories: [] } });
    try {
      expect(dependsOnFor(join(root, "top")).unavailable).toContain("`publishable: false`");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

/**
 * §4 — the bump computed from the exported-surface diff.
 *
 * §4.1's falsifier was run before this existed: 18 patch / 1 minor / 1 major
 * over the last 20 commits on `main` (`--first-parent`). These tests are the
 * rules that measurement licensed, plus the two edges it did not exercise.
 */
describe("version bump — computed from the surface, not claimed by a commit message (§4)", () => {
  const s = (type: string, id: string) => ({ type, id });

  test("a removal is MAJOR, and outranks a simultaneous addition", () => {
    const before = [s("Skill", "a"), s("Skill", "b")];
    const after = [s("Skill", "a"), s("Skill", "c")];
    const d = diffSurface(before, after);
    expect(d.bump).toBe("major");
    // Both halves are carried, so a caller can see this for the RENAME it is
    // rather than inferring "capability withdrawn" from the verdict.
    expect(d.added).toEqual([s("Skill", "c")]);
    expect(d.removed).toEqual([s("Skill", "b")]);
  });

  test("an addition alone is MINOR", () => {
    expect(diffSurface([s("Skill", "a")], [s("Skill", "a"), s("Tool", "t")]).bump).toBe("minor");
  });

  test("no change is PATCH — prose included, which is 18 of the 20 measured commits", () => {
    expect(diffSurface([s("Skill", "a")], [s("Skill", "a")]).bump).toBe("patch");
  });

  /**
   * The reason the surface is keyed on `{type, id}` rather than on the id.
   * A node keeping its id while changing its type is a different thing under
   * the same name — exactly what a consumer must be told — and an id-only key
   * would score it `patch`.
   */
  test("a node whose TYPE changed under the same id is major, not patch", () => {
    expect(diffSurface([s("Skill", "x")], [s("Tool", "x")]).bump).toBe("major");
  });

  test("surfaceOf takes every node with an @id, dedupes, and sorts", () => {
    const doc = {
      "@graph": [
        { "@id": "b", "@type": "Skill" },
        { "@id": "a", "@type": "Skill" },
        { "@id": "a", "@type": "Skill" },
        { "@type": "Skill" }, // no @id — not a subject a consumer can resolve
      ],
    };
    expect(surfaceOf(doc)).toEqual([s("Skill", "a"), s("Skill", "b")]);
  });

  test("a node with an @id but no @type is scored under `?`, never dropped", () => {
    expect(surfaceOf({ "@graph": [{ "@id": "x" }] })).toEqual([{ type: "?", id: "x" }]);
  });

  test("a multi-typed node is keyed on its types SORTED, so array order is not a change", () => {
    const one = surfaceOf({ "@graph": [{ "@id": "x", "@type": ["B", "A"] }] });
    const two = surfaceOf({ "@graph": [{ "@id": "x", "@type": ["A", "B"] }] });
    expect(diffSurface(one, two).bump).toBe("patch");
  });

  test("a document with no @graph is an empty surface, not a crash", () => {
    expect(surfaceOf({})).toEqual([]);
    expect(surfaceOf(null)).toEqual([]);
  });

  describe("applyBump", () => {
    test("bumps the right field and zeroes the ones below it", () => {
      expect(applyBump("1.2.3", "major")).toBe("2.0.0");
      expect(applyBump("1.2.3", "minor")).toBe("1.3.0");
      expect(applyBump("1.2.3", "patch")).toBe("1.2.4");
    });

    /**
     * `current` and `dev` are a STAGING choice (§3.3). Inventing a release
     * number for one would be this module asserting a publication nobody made.
     */
    test("a pseudo-version comes back unchanged rather than coerced", () => {
      expect(applyBump("current", "major")).toBe("current");
      expect(applyBump("dev", "minor")).toBe("dev");
    });
  });

  /**
   * §4.1: the gate holds the declared version to a FLOOR, never to an exact
   * value. The asymmetry is deliberate — under-bumping breaks a consumer
   * silently, over-bumping costs them a version number.
   */
  describe("clearsFloor — a floor, not an expectation", () => {
    test("equal to the floor passes", () => {
      expect(clearsFloor("1.3.0", "1.3.0")).toBe(true);
    });
    test("ABOVE the floor passes — the author may always bump further", () => {
      expect(clearsFloor("2.0.0", "1.3.0")).toBe(true);
      expect(clearsFloor("1.4.0", "1.3.0")).toBe(true);
    });
    test("below the floor fails — that is the whole gate", () => {
      expect(clearsFloor("1.2.9", "1.3.0")).toBe(false);
      expect(clearsFloor("1.0.0", "2.0.0")).toBe(false);
    });
    test("compares NUMERICALLY, so 0.10.0 is above 0.9.0", () => {
      expect(clearsFloor("0.10.0", "0.9.0")).toBe(true);
      expect(clearsFloor("0.9.0", "0.10.0")).toBe(false);
    });
    test("an uncomparable pair is NOT a pass — the caller reports it undetermined", () => {
      expect(clearsFloor("current", "1.0.0")).toBe(false);
      expect(comparable("current", "1.0.0")).toBe(false);
      expect(comparable("1.0.0", "1.2.3")).toBe(true);
    });
  });

  test("the gate over this repository reports NO publishable instance — a stated nothing, not a pass", () => {
    const report = auditVersionBumps(resolve(repoRootFor(instanceRootFor(import.meta.dir))));
    expect(report.rows).toEqual([]);
    expect(report.note).toContain("not a clean run");
  });
});
