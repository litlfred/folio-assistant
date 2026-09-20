/**
 * Tool nodes are real, well-formed, and reachable from the graph.
 *
 * Five Tool nodes were DESCRIBED across four skills and the harness analysis
 * before any existed. This is what makes the skill/Tool separation checkable
 * rather than asserted.
 */
import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { tools } from "../../tools/index.js";
import { ToolDefinitionSchema, defineTool } from "../../schemas/tool.js";
import { TOOL_TYPES } from "../../schemas/tool-types.js";
import { checkTools, knownSkills, contractRequires } from "../check-tools.js";
import { knownSkills as canonicalKnownSkills } from "../known-skills.js";
import { buildToolTypes, buildToolSchema, buildSkillIoContracts, skillIoIri, staleSkillIoIds } from "../harness-schema-export.js";


const BASE = "https://example.invalid/fa";

/**
 * The INSTANCE root, not `process.cwd()`.
 *
 * `contractRequires(root, …)` resolves `<root>/schemas/skills/<skill>/` — an
 * instance path. `process.cwd()` is the REPOSITORY root when the suite runs,
 * and the two were the same directory until the move (bean `wggr`), so passing
 * the cwd was right by coincidence rather than by argument.
 *
 * It is also the root the canonical `knownSkills` is asked for below, which is
 * the same question one level along: skill discovery resolves an instance's
 * declaration, so handing it a repository root would scan the wrong tree the
 * moment the two differ.
 */
const INSTANCE = resolve(import.meta.dir, "../..");

describe("tools", () => {
  test("there are tools to check — otherwise everything below is vacuous", () => {
    expect(tools().length).toBeGreaterThanOrEqual(4);
  });

  test("every satisfies names a skill that exists", () => {
    // The constraint a schema cannot express: Zod can require `satisfies` to be
    // non-empty, but it does not get to read the tree.
    expect(checkTools().danglingSatisfies).toEqual([]);
  });

  test("every satisfies edge agrees with its skill's own input contract", () => {
    // A `satisfies` edge asserts the Tool is one concrete way to exercise the
    // skill. If the skill's contract requires an input the Tool has no port
    // for, the Tool cannot exercise it and the edge is false.
    //
    // This caught two edges written in #295 and both were wrong:
    // `translation-validate` claimed `content-validate` (whose contract wants
    // `targetPath`; validating a .po against a .pot is a different thing), and
    // `workflow-complete` claimed `dmn-authoring` (whose contract wants
    // `decisionName`/`inputVariables` — what you supply to WRITE a table, not
    // to answer one).
    expect(checkTools().unmetContracts).toEqual([]);
  });

  test("a contract that is present but unreadable is never counted as agreement", () => {
    // The third state. `undefined` (no contract) and `[]` (a contract
    // requiring nothing) are different answers and the checker keeps them
    // apart; an unreadable file is reported rather than passed.
    expect(checkTools().unreadableContracts).toEqual([]);
    expect(contractRequires(INSTANCE, "no-such-skill-exists")).toBeUndefined();
    const req = contractRequires(INSTANCE, "content-validate");
    expect(req).toContain("targetPath");
  });

  test("every skill I/O contract publishes at the address its own $id claims", () => {
    // All 44 carried `github.com/<owner>/<repo>/schemas/...` — a 403, because
    // GitHub's browse route needs `/blob/<ref>/`. Born that way on 2026-03-24
    // and never dereferenced since.
    const contracts = buildSkillIoContracts({ baseUrl: BASE });
    expect(contracts.length).toBeGreaterThan(0);
    for (const c of contracts) {
      const id = c.schema.$id as string;
      expect(id).toBe(skillIoIri(BASE, c.skill, c.io));
      // The published path must be exactly what the IRI's tail says, or the
      // deploy writes the file somewhere the identity does not name.
      expect(`${BASE}/${c.published}`).toBe(id);
    }
  });

  test("no source $id has drifted from where it publishes", () => {
    expect(staleSkillIoIds()).toEqual([]);
  });

  test("every io port references a type the shared vocabulary declares", () => {
    expect(checkTools().unknownTypes).toEqual([]);
  });

  test("io references are absolute IRIs into the published types document", () => {
    // Relative would resolve differently depending on where a consumer fetched
    // the Tool, so two consumers could disagree about what a tool accepts.
    const doc = buildToolTypes({ baseUrl: BASE });
    const defs = new Set(Object.keys(doc.$defs as Record<string, unknown>));
    expect(defs.size).toBe(Object.keys(TOOL_TYPES).length);
    for (const t of tools()) {
      for (const p of [...t.io.inputs, ...t.io.outputs]) {
        expect(p.schema.startsWith("https://")).toBe(true);
        expect(defs.has(p.schema.split("#/$defs/")[1] ?? "")).toBe(true);
      }
    }
  });

  test("a Tool reachable only over MCP is rejected", () => {
    // The harness assumes no MCP server, so a Tool whose ONLY arm is `mcp` is
    // not usable by the layer that defines it — and projecting it would emit a
    // server that proxies itself. Rejected at parse time, not at review.
    const mcpOnly = {
      id: "mcp-only", title: "x", description: "y",
      install: { none: true as const },
      invoke: { mcp: { tool: "something" } },
      io: { inputs: [], outputs: [] },
      satisfies: ["todo-manager"],
    };
    expect(ToolDefinitionSchema.safeParse(mcpOnly).success).toBe(false);
    // The same Tool WITH a shell arm is fine — mcp is an extra, not a defect.
    expect(ToolDefinitionSchema.safeParse({ ...mcpOnly, invoke: { ...mcpOnly.invoke, shell: "x" } }).success).toBe(true);
  });

  test("a Tool satisfying nothing is rejected", () => {
    const orphan = {
      id: "orphan", title: "x", description: "y",
      install: { none: true as const }, invoke: { shell: "x" },
      io: { inputs: [], outputs: [] }, satisfies: [],
    };
    expect(ToolDefinitionSchema.safeParse(orphan).success).toBe(false);
  });

  test("the beans pair satisfies exactly the same skills", () => {
    // The point of two beans Tools: an agent in a fresh container with no CLI
    // must still find a mechanism. If the fallback covered fewer skills it
    // would be the degraded mode `skills-and-tools` says it is not.
    const byId = new Map(tools().map((t) => [t.id, t]));
    const cli = byId.get("beans-cli")!;
    const manual = byId.get("beans-manual")!;
    expect([...manual.satisfies].sort()).toEqual([...cli.satisfies].sort());
  });

  test("the generated schemas carry an absolute $id", () => {
    expect(buildToolSchema({ baseUrl: BASE }).$id).toBe(`${BASE}/tool.schema.json`);
    expect(buildToolTypes({ baseUrl: BASE }).$id).toBe(`${BASE}/tool-types.schema.json`);
  });

  test("skill discovery is not a hardcoded list", () => {
    // Four hardcoded corpus paths have been wrong in this repo already; this
    // asserts the check sees the packages a list would have missed.
    const s = knownSkills();
    expect(s.has("smart-base-tools")).toBe(true); // skills/authoring-who-smart-guidelines
    expect(s.has("lean-formalization")).toBe(true); // schemas/skills/<name>/
    expect(s.has("kg-export")).toBe(true); // skills/folio-core
  });

  test("skill discovery is the ONE definition, not a second scan", () => {
    // REGRESSION, 2026-09-20. This module had its own `knownSkills`: the first
    // declared `cat-harness` root and its immediate subdirectories. It
    // disagreed with `known-skills.ts` in both directions at once, and each
    // direction is a different way for the check to be wrong.
    const s = knownSkills();
    const canonical = canonicalKnownSkills(INSTANCE);
    expect([...canonical].filter((n) => !s.has(n))).toEqual([]);
    expect([...s].filter((n) => !canonical.has(n))).toEqual([]);

    // The two halves, named, so a re-divergence says WHICH failure returned
    // rather than only that the sets differ.
    //
    // Admitted 36 non-skills: `skills/memory/` then held agent-memory nodes, every
    // one a `.md` in a declared directory. A directory scan cannot tell them
    // apart; `isSkillMd` does, by their `$schema:` line. Under the old scan a
    // Tool could have satisfied a memory entry and passed.
    expect(s.has("the-complement")).toBe(false);
    // Missed 2 real ones: `bootstrap/skills/` holds skills DIRECTLY rather
    // than in packages, and a scan of a root's subdirectories never looks at
    // the root. Both read as dangling, which is how this was found.
    expect(s.has("confirm-harness")).toBe(true);
    expect(s.has("log-message")).toBe(true);
  });

  test("io IRIs follow the publication base, not the declaration", async () => {
    // A staging build published tool-types.schema.json at the STAGING url while
    // its Tool nodes referenced the CANONICAL one — a document that did not
    // exist yet, because the same PR introduced it. The refs looked resolvable
    // and 404'd. Found by fetching the published artefacts rather than assuming
    // they agreed.
    //
    // The rule this pins: anything that mints an IRI takes its base from the
    // same source as the document it will be published beside.
    const { buildExport } = await import("../kg-export.js");
    const STAGING = "https://example.invalid/fa/STAGING/demo";
    const g = await buildExport({ baseUrl: STAGING });
    const toolNodes = g["@graph"].filter((n) => String(n["@type"]).endsWith("Tool"));
    expect(toolNodes.length).toBeGreaterThanOrEqual(4);

    for (const t of toolNodes) {
      const io = t.io as { inputs: Array<{ schema: string }>; outputs: Array<{ schema: string }> };
      for (const port of [...io.inputs, ...io.outputs]) {
        expect(port.schema.startsWith(`${STAGING}/tool-types.schema.json#/$defs/`)).toBe(true);
      }
    }
  });

  test("tools() honours an explicit base", () => {
    const B = "https://example.invalid/other";
    for (const t of tools(B)) {
      for (const p of [...t.io.inputs, ...t.io.outputs]) {
        expect(p.schema.startsWith(`${B}/tool-types.schema.json`)).toBe(true);
      }
    }
  });
});

describe("substitutable Tools declare it, and say how to choose", () => {
  const all = tools("https://example.org/");
  const byId = new Map(all.map((t) => [t.id, t]));

  test("the relation is symmetric across the real tool set", () => {
    // Asymmetry is the failure this relation exists to prevent, occurring
    // exactly half the time — and the half that works makes it look
    // maintained, which is worse than not declaring it at all.
    for (const t of all) {
      for (const other of t.alternativeTo ?? []) {
        expect(`${t.id} -> ${other}`).toBe(`${t.id} -> ${byId.get(other)?.id ?? "MISSING"}`);
        expect(byId.get(other)?.alternativeTo ?? []).toContain(t.id);
      }
    }
  });

  test("every declared alternative carries all three selection fields", () => {
    for (const t of all) {
      if ((t.alternativeTo?.length ?? 0) === 0) continue;
      // `limits` is the one an author is tempted to skip. Without it an agent
      // reaches for the tool and discovers the boundary by failing.
      for (const k of ["when", "limits", "cost"] as const) {
        expect(`${t.id}.${k}`).toBe(t.selection?.[k] ? `${t.id}.${k}` : `${t.id}.${k} MISSING`);
      }
    }
  });

  test("the schema refuses an alternative with no selection", () => {
    const base = byId.get("ingest-stdlib");
    expect(base).toBeDefined();
    if (!base) return;
    const { selection: _drop, ...without } = base;
    expect(() => defineTool(without as typeof base)).toThrow(/selection/);
  });

  test("a Tool cannot be an alternative to itself", () => {
    const base = byId.get("ingest-stdlib");
    if (!base) return;
    expect(() => defineTool({ ...base, alternativeTo: [base.id] })).toThrow(/itself/);
  });

  test("sharing a skill does NOT imply substitutability", () => {
    // The measurement that refuted deriving this from `satisfies`: 12 of 25
    // skills carry more than one Tool and nearly all are COMPLEMENTARY. The
    // five `process-state` tools are steps, not choices, and must stay free
    // of a relation that would demand comparative prose about nothing.
    const processState = all.filter((t) => t.satisfies.includes("process-state"));
    expect(processState.length).toBeGreaterThan(1);
    for (const t of processState) expect(t.alternativeTo ?? []).toEqual([]);
  });

  test("the ingest pair is declared, and splits on the dependency boundary", () => {
    const std = byId.get("ingest-stdlib");
    const ext = byId.get("ingest-extended");
    expect([std?.id, ext?.id]).toEqual(["ingest-stdlib", "ingest-extended"]);
    // The whole point of the pair: one needs nothing, the other needs a
    // toolchain. `install.none` states "needs nothing" rather than leaving it
    // to absence, which is the distinction that flag exists for.
    expect(std?.install.none).toBe(true);
    expect(ext?.install.cli).toBeTruthy();
    expect(std?.satisfies).toEqual(ext?.satisfies);
    // Each names the other as where its limits are picked up.
    expect(std?.selection?.limits).toContain("ingest-extended");
    expect(ext?.selection?.limits).toContain("ingest-stdlib");
  });
});
