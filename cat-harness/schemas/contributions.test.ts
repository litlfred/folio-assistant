/**
 * Tests for the contribution registry and its loader — issue #223, Phase 0.1.
 *
 * The gate the migration plan sets for this phase: a synthetic two-repo
 * fixture where the dependency contributes one block kind, one skill and one
 * MCP tool, and the root resolves all three — plus a test asserting a kind
 * collision is REFUSED rather than silently overlaid.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { HARNESS_CONFIG } from "./harness-config";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  ContributionRegistry,
  ContributionCollisionError,
  composedKindOwner,
  type FolioContribution,
} from "./contributions";
import { loadContributions } from "./harness-config";
import { adapterForKind } from "./block-kinds";

const TMP = join(import.meta.dir, "__test_contributions__");

beforeAll(() => {
  // ── The gate fixture: a root folio with one dependency that contributes
  //    a block kind, a skill and an MCP tool.
  const dep = join(TMP, "dep-sci");
  mkdirSync(join(dep, "skills", "authoring-math"), { recursive: true });
  writeFileSync(join(dep, "skills", "authoring-math", "SKILL.md"), "# math\n", "utf-8");

  writeFileSync(
    join(dep, "contributions.ts"),
    `export default function () {
       return {
         name: "dep-sci",
         blockKinds: [{ kind: "knot-diagram", adapter: "sci" }],
         adapter: { name: "sci", module: "./adapters/sci/index.ts" },
         tools: [{ name: "lean", register: (s) => { (globalThis).__leanRegistered = s; } }],
       };
     }`,
    "utf-8",
  );
  writeFileSync(join(dep, HARNESS_CONFIG), JSON.stringify({ contributes: "./contributions.ts" }), "utf-8");

  mkdirSync(join(TMP, "skills"), { recursive: true });
  writeFileSync(
    join(TMP, HARNESS_CONFIG),
    JSON.stringify({ contentType: "document", dependencies: { folioAssistant: [{ name: "dep-sci", path: dep }] } }),
    "utf-8",
  );

  // ── A dependency that declares a contributes module which is not there.
  const broken = join(TMP, "dep-broken");
  mkdirSync(broken, { recursive: true });
  writeFileSync(join(broken, HARNESS_CONFIG), JSON.stringify({ contributes: "./nope.ts" }), "utf-8");
  const brokenRoot = join(TMP, "root-broken");
  mkdirSync(brokenRoot, { recursive: true });
  writeFileSync(
    join(brokenRoot, HARNESS_CONFIG),
    JSON.stringify({ dependencies: { folioAssistant: [{ name: "dep-broken", path: broken }] } }),
    "utf-8",
  );
});

afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe("ContributionRegistry", () => {
  const sci = (): FolioContribution => ({
    name: "folio-asst-sci",
    blockKinds: [{ kind: "knot-diagram", adapter: "sci" }],
    adapter: { name: "sci", module: "./index.ts" },
    tools: [{ name: "lean", register: () => {} }],
  });

  it("accepts a contribution and reports what it added", () => {
    const r = new ContributionRegistry();
    r.register(sci());
    expect(r.kindOwner("knot-diagram")).toBe("sci");
    expect(r.adapterModule("sci")).toBe("./index.ts");
    expect(r.contributedTools()).toEqual(["lean"]);
  });

  it("is idempotent for the same contributor — a DIAMOND is not a collision", () => {
    // base -> kg -> core and sci -> core, so a depth-first walk reaches core
    // twice. Without this rule every realistic dependency tree throws a false
    // collision on first load, and the obvious fix (dropping the collision
    // check) is the one that must not be made.
    const r = new ContributionRegistry();
    r.register(sci());
    expect(() => r.register(sci())).not.toThrow();
    expect(r.contributedKinds()).toHaveLength(1);
  });

  it("REFUSES a kind claimed by a different contributor, naming both", () => {
    const r = new ContributionRegistry();
    r.register(sci());
    let err: unknown;
    try {
      r.register({ name: "smart-base", blockKinds: [{ kind: "knot-diagram", adapter: "dak" }] });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ContributionCollisionError);
    expect((err as Error).message).toContain("folio-asst-sci");
    expect((err as Error).message).toContain("smart-base");
  });

  it("refuses a kind the platform already owns", () => {
    // Shadowing `theorem` from a config file two repos away would change what
    // every existing folio validates against.
    const r = new ContributionRegistry();
    expect(() => r.register({ name: "rogue", blockKinds: [{ kind: "theorem", adapter: "mine" }] }))
      .toThrow(ContributionCollisionError);
  });

  it("refuses an adapter name the platform already owns", () => {
    const r = new ContributionRegistry();
    expect(() => r.register({ name: "rogue", adapter: { name: "paper", module: "./x.ts" } }))
      .toThrow(ContributionCollisionError);
  });

  it("refuses a tool group claimed by a different contributor", () => {
    const r = new ContributionRegistry();
    r.register(sci());
    expect(() => r.register({ name: "other", tools: [{ name: "lean", register: () => {} }] }))
      .toThrow(ContributionCollisionError);
  });

  it("runs every contributed tool registrar against the server", () => {
    const seen: string[] = [];
    const r = new ContributionRegistry();
    r.register({ name: "a", tools: [{ name: "lean", register: () => seen.push("lean") }] });
    r.register({ name: "b", tools: [{ name: "fsh", register: () => seen.push("fsh") }] });
    r.registerTools({});
    expect(seen.sort()).toEqual(["fsh", "lean"]);
  });
});

describe("composedKindOwner", () => {
  it("consults the platform first, the registry second", () => {
    const r = new ContributionRegistry();
    r.register({ name: "sci", blockKinds: [{ kind: "knot-diagram", adapter: "sci" }] });
    expect(composedKindOwner("theorem", r, adapterForKind)).toBe("paper");
    expect(composedKindOwner("knot-diagram", r, adapterForKind)).toBe("sci");
  });

  it("returns undefined for an unknown kind — never a guess", () => {
    // Same contract as adapterForKind: the caller decides what unknown means.
    expect(composedKindOwner("nonsense", new ContributionRegistry(), adapterForKind)).toBeUndefined();
  });
});

describe("loadContributions — the Phase 0.1 gate", () => {
  it("a dependency contributes a block kind, an adapter and an MCP tool", async () => {
    const r = await loadContributions<FolioContribution, ContributionRegistry>(TMP, new ContributionRegistry());
    expect(r.kindOwner("knot-diagram")).toBe("sci");
    expect(r.adapterModule("sci")).toBe("./adapters/sci/index.ts");
    expect(r.contributedTools()).toEqual(["lean"]);
  });

  it("the dependency's declared name wins over whatever the module claims", async () => {
    // A contributor that could rename itself could impersonate another
    // contributor's namespace and turn a collision into a silent merge.
    const r = await loadContributions<FolioContribution, ContributionRegistry>(TMP, new ContributionRegistry());
    expect(r.contributedKinds()[0]?.contributor).toBe("dep-sci");
  });

  it("a declared-but-missing contributes module fails loudly", async () => {
    // A stated intention that silently did nothing is the exact failure mode
    // AGENTS.md records under "move wiring and script together".
    await expect(loadContributions<FolioContribution, ContributionRegistry>(join(TMP, "root-broken"), new ContributionRegistry())).rejects.toThrow(/does not exist/);
  });

  it("a folio with no dependencies loads an empty registry, not an error", async () => {
    const bare = join(TMP, "bare");
    mkdirSync(bare, { recursive: true });
    writeFileSync(join(bare, HARNESS_CONFIG), JSON.stringify({ contentType: "document" }), "utf-8");
    const r = await loadContributions<FolioContribution, ContributionRegistry>(bare, new ContributionRegistry());
    expect(r.contributedKinds()).toEqual([]);
  });
});

describe("contributed QA checkers", () => {
  const checker = (result: "pass" | "fail") => () => ({ result, hits: [] });

  it("a dependency's checker is reachable by the criterion it answers", () => {
    const r = new ContributionRegistry();
    r.register({ name: "smart-base", qaCheckers: [{ criterion: "dak-bpmn-has-process", check: checker("pass") }] });
    expect(r.qaChecker("dak-bpmn-has-process")).toBeDefined();
    expect(r.contributedQaCheckers()).toEqual([
      { criterion: "dak-bpmn-has-process", contributor: "smart-base" },
    ]);
  });

  it("an unimplemented criterion is undefined, never a default pass", () => {
    const r = new ContributionRegistry();
    expect(r.qaChecker("nobody-implements-this")).toBeUndefined();
  });

  it("two contributors claiming one criterion throws, naming both", () => {
    const r = new ContributionRegistry();
    r.register({ name: "smart-base", qaCheckers: [{ criterion: "shared", check: checker("pass") }] });
    expect(() =>
      r.register({ name: "folio-asst-sci", qaCheckers: [{ criterion: "shared", check: checker("fail") }] }),
    ).toThrow(/both "smart-base" and "folio-asst-sci"/);
  });

  it("the same contributor re-registering is a no-op, so a diamond loads", () => {
    const r = new ContributionRegistry();
    const c = { name: "smart-base", qaCheckers: [{ criterion: "shared", check: checker("pass") }] };
    r.register(c);
    expect(() => r.register(c)).not.toThrow();
    expect(r.contributedQaCheckers()).toHaveLength(1);
  });
});

describe("contributed renderers", () => {
  const tex = {
    format: "latex",
    adapters: ["paper"],
    render: () => "\\begin{theorem}x\\end{theorem}",
    validate: (s: string) => ({ valid: s.includes("\\end"), errors: [] }),
  };

  it("a render target is reachable by format and by adapter", () => {
    const r = new ContributionRegistry();
    r.register({ name: "folio-asst-sci", renderers: [tex] });
    expect(r.renderer("latex")).toBeDefined();
    expect(r.renderersFor("paper")).toHaveLength(1);
  });

  it("an adapter with no contributed target gets a DETERMINED empty", () => {
    // Not the same as having no registry: this caller knows there is nothing,
    // rather than knowing nothing.
    const r = new ContributionRegistry();
    r.register({ name: "folio-asst-sci", renderers: [tex] });
    expect(r.renderersFor("dak")).toEqual([]);
  });

  it("a target may render without validating, and says so by omission", () => {
    // `validate` absent means NO STRUCTURAL CHECK, which a caller must report
    // as not-checked rather than as a pass.
    const r = new ContributionRegistry();
    r.register({
      name: "folio-assist-core",
      renderers: [{ format: "markdown", adapters: ["document"], render: () => "# x" }],
    });
    expect(r.renderer("markdown")?.validate).toBeUndefined();
    expect(r.renderer("markdown")?.render).toBeDefined();
  });

  it("two contributors claiming one format throws, naming both", () => {
    const r = new ContributionRegistry();
    r.register({ name: "folio-asst-sci", renderers: [tex] });
    expect(() =>
      r.register({ name: "other", renderers: [{ ...tex, render: () => "" }] }),
    ).toThrow(/both "folio-asst-sci" and "other"/);
  });

  it("the same contributor re-registering is a no-op, so a diamond loads", () => {
    const r = new ContributionRegistry();
    const c = { name: "folio-asst-sci", renderers: [tex] };
    r.register(c);
    expect(() => r.register(c)).not.toThrow();
    expect(r.contributedRenderers()).toHaveLength(1);
  });

  it("the listing names the format, its adapters and its contributor", () => {
    const r = new ContributionRegistry();
    r.register({ name: "folio-asst-sci", renderers: [tex] });
    expect(r.contributedRenderers()).toEqual([
      { format: "latex", adapters: ["paper"], contributor: "folio-asst-sci" },
    ]);
  });
});
