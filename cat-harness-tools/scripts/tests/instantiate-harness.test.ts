import { describe, expect, test } from "bun:test";
import {
  parseArgs,
  planLines,
  repositoryOfNeed,
  resolveClosure,
  subClosure,
  withHoistedLinker,
  withIgnoredNodeModules,
  withSiteAndApprover,
  withWorkspaces,
  type Fetcher,
} from "../instantiate-harness.ts";

const sha = (c: string) => c.repeat(40);

/** fhir-harness's closure as it was on 2026-11-03, served without a network. */
function fakeFetcher(decls: Record<string, { name: string; needs?: string[] }>, tips: Record<string, string> = {}): Fetcher & { asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    tip: (repository) => tips[repository] ?? sha("a"),
    declaration: (repository, ref, name) => {
      asked.push(`${repository}@${ref.slice(0, 1)}:${name}`);
      const d = decls[repository];
      if (!d) throw new Error(`no ${repository}`);
      return d;
    },
  };
}

const FHIR = {
  "litlfred/fhir-harness": { name: "fhir-harness", needs: ["folio-assistant-core"] },
  "litlfred/folio-assistant-core": { name: "folio-assistant-core", needs: ["cat-harness", "cat-harness-tools"] },
  "litlfred/cat-harness": { name: "cat-harness", needs: ["bootstrap"] },
  "litlfred/cat-harness-tools": { name: "cat-harness-tools", needs: ["cat-harness", "bootstrap-tools"] },
  "litlfred/bootstrap": { name: "bootstrap" },
  "litlfred/bootstrap-tools": { name: "bootstrap-tools", needs: ["bootstrap"] },
};

describe("arguments", () => {
  test("a harness with and without a pin", () => {
    expect(parseArgs(["--harness", "litlfred/fhir-harness"]).harnessRef).toBeUndefined();
    const o = parseArgs(["--harness", `litlfred/fhir-harness@${sha("b")}`, "--pin", `cat-harness=${sha("c")}`, "--repo-of", "bootstrap=x/boot", "--local"]);
    expect(o).toMatchObject({ harness: "litlfred/fhir-harness", harnessRef: sha("b"), pins: { "cat-harness": sha("c") }, repoOf: { bootstrap: "x/boot" }, local: true, pr: true });
  });

  test("refuses what it cannot use, saying why", () => {
    expect(() => parseArgs([])).toThrow(/--harness is required/);
    expect(() => parseArgs(["--harness", "fhir-harness"])).toThrow(/OWNER\/REPO/);
    expect(() => parseArgs(["--harness", "a/b", "--pin", "x=main"])).toThrow(/40-character/);
    expect(() => parseArgs(["--harness", "a/b", "--plan", "--local"])).toThrow(/pick one/);
    expect(() => parseArgs(["--harness", "a/b", "--bogus"])).toThrow(/unknown argument/);
  });
});

describe("the closure", () => {
  test("every instance once, breadth first, each need beside the instance that needs it", () => {
    const f = fakeFetcher(FHIR);
    const c = resolveClosure({ repository: "litlfred/fhir-harness" }, { pins: {}, repoOf: {} }, f);
    expect(c.map((e) => e.name)).toEqual(["fhir-harness", "folio-assistant-core", "cat-harness", "cat-harness-tools", "bootstrap", "bootstrap-tools"]);
    expect(c.every((e) => e.ref === sha("a"))).toBe(true);
    // cat-harness is needed twice and read once
    expect(f.asked.filter((a) => a.endsWith(":cat-harness"))).toHaveLength(1);
  });

  test("--pin and the harness's own pin win over the tip; --repo-of moves a need", () => {
    const decls = { ...FHIR, "other/bootstrap": { name: "bootstrap" } };
    delete (decls as Record<string, unknown>)["litlfred/bootstrap"];
    const c = resolveClosure({ repository: "litlfred/fhir-harness", ref: sha("f") }, { pins: { "cat-harness": sha("c") }, repoOf: { bootstrap: "other/bootstrap" } }, fakeFetcher(decls));
    expect(c.find((e) => e.name === "fhir-harness")!.ref).toBe(sha("f"));
    expect(c.find((e) => e.name === "cat-harness")!.ref).toBe(sha("c"));
    expect(c.find((e) => e.name === "bootstrap")!.repository).toBe("other/bootstrap");
  });

  test("a declaration that names another instance is refused, with the remedy", () => {
    const f = fakeFetcher({ ...FHIR, "litlfred/bootstrap": { name: "something-else" } });
    expect(() => resolveClosure({ repository: "litlfred/fhir-harness" }, { pins: {}, repoOf: {} }, f)).toThrow(/declares `something-else`.*--repo-of bootstrap=/);
  });

  test("the platform's own closure is what the bootstrap lays down", () => {
    const c = resolveClosure({ repository: "litlfred/fhir-harness" }, { pins: {}, repoOf: {} }, fakeFetcher(FHIR));
    expect(subClosure(c, "cat-harness-tools").map((e) => e.name).sort()).toEqual(["bootstrap", "bootstrap-tools", "cat-harness", "cat-harness-tools"]);
  });

  test("a need's repository", () => {
    expect(repositoryOfNeed("cat-harness", "litlfred/fhir-harness", {})).toBe("litlfred/cat-harness");
    expect(repositoryOfNeed("cat-harness", "litlfred/fhir-harness", { "cat-harness": "who/cat-harness" })).toBe("who/cat-harness");
  });
});

describe("the files it writes", () => {
  test("index.config.json: landing, agent-run, the consenter approves; existing values kept", () => {
    const c = withSiteAndApprover({ instances: [], site: { keep: ["x"] }, mountApprovers: ["a"] }, "fhir-harness", "b");
    expect(c).toEqual({ instances: [], site: { keep: ["x"], landing: "fhir-harness", agentRun: true }, mountApprovers: ["a", "b"] });
    expect(withSiteAndApprover({ mountApprovers: ["b"] }, "h", "b").mountApprovers).toEqual(["b"]);
  });

  test("package.json: the mounts become workspaces, an existing manifest is kept", () => {
    expect(withWorkspaces(undefined, "smart-x", ["cat-harness"])).toEqual({ name: "smart-x-site", private: true, type: "module", workspaces: ["cat-harness"] });
    expect(withWorkspaces({ name: "keep", workspaces: ["a"] }, "r", ["a", "b"])).toEqual({ name: "keep", workspaces: ["a", "b"] });
  });

  test("bunfig.toml: the hoisted linker, added once", () => {
    expect(withHoistedLinker(undefined)).toBe(`[install]\nlinker = "hoisted"\n`);
    expect(withHoistedLinker(`[install]\n`)).toBe(`[install]\nlinker = "hoisted"\n`);
    expect(withHoistedLinker(`[test]\nroot = "x"\n`)).toBe(`[test]\nroot = "x"\n\n[install]\nlinker = "hoisted"\n`);
    expect(withHoistedLinker(`[install]\nlinker = "isolated"\n`)).toBe(`[install]\nlinker = "isolated"\n`);
  });

  test(".gitignore: node_modules/ once, the author's lines kept", () => {
    expect(withIgnoredNodeModules("output/\n")).toBe("output/\nnode_modules/\n");
    expect(withIgnoredNodeModules("output/")).toBe("output/\nnode_modules/\n");
    expect(withIgnoredNodeModules("node_modules/\n")).toBe("node_modules/\n");
  });
});

describe("the plan", () => {
  test("names every step, and the preview path of the branch", () => {
    const o = parseArgs(["--harness", "litlfred/fhir-harness", "--consent-by", "me"]);
    const c = resolveClosure({ repository: o.harness }, o, fakeFetcher(FHIR));
    const lines = planLines(o, c, "harness/fhir-harness").join("\n");
    for (const s of ["seed", "mount", "install", "instantiate:fhir-harness", "prepare:fhir-harness", "branches/harness-fhir-harness/"]) expect(lines).toContain(s);
    expect(planLines({ ...o, local: true }, c, "b").join("\n")).toContain("--dry-run");
  });
});
