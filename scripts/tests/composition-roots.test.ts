/**
 * The two composition roots resolve their parts from declarations, and every
 * way of NOT resolving one is distinguishable from resolving it.
 *
 * `server.ts` imported six tool registrars and `src/index.ts` imported two
 * adapter classes. Three of the registrars and one of the adapters belong to
 * the science layer, so both generic entry points named it — and after the
 * split those imports do not resolve, failing at MODULE LOAD, before either
 * file's own error handling can run.
 *
 * The negative cases are the ones worth having. A resolver that returned
 * nothing for every miss would pass "the platform's groups register" and still
 * let a server start silently missing half its tools.
 *
 * @module scripts/tests/composition-roots.test
 */
import { describe, test, expect } from "bun:test";

import { TOOL_GROUPS, registerMcpToolGroups } from "../../adapters/mcp-server/tool-groups.ts";
import {
  registerDeclaredToolGroups,
  type ToolGroupDeclaration,
} from "../../src/tool-groups.ts";

/** The MCP server's own root, for the ad-hoc declarations below. */
const MCP_ROOT = new URL("../..", import.meta.url).pathname;
import {
  BUILTIN_ADAPTERS,
  resolveBuiltinAdapter,
} from "../../src/builtin-adapters.ts";

describe("MCP tool groups", () => {
  test("every declared group's module exists and registers here", async () => {
    // A recording server: the registrars only need something to hang tools on.
    const calls: string[] = [];
    const fake = { tool: (name: string) => calls.push(name), registerTool: (n: string) => calls.push(n) };
    const outcomes = await registerMcpToolGroups(fake);
    expect(outcomes.filter((o) => o.state !== "registered")).toEqual([]);
    expect(outcomes).toHaveLength(TOOL_GROUPS.length);
  });

  test("the declaration covers all six groups the server used to import", () => {
    expect(TOOL_GROUPS.map((g) => g.id).sort()).toEqual(
      ["deps", "lean", "preferences", "preview", "render", "validate"],
    );
  });

  test("the three TeX/Lean groups are declared `sci`", () => {
    // The boundary is reviewable in one place rather than inferable from six
    // import lines. `render`, `preview` and `lean` need a TeX installation or
    // a Lean toolchain, which is the line adapters/paper already draws.
    const sci = TOOL_GROUPS.filter((g) => g.layer === "sci").map((g) => g.id).sort();
    expect(sci).toEqual(["lean", "preview", "render"]);
  });

  test("an uninstalled layer is SKIPPED and reported, not a crash", async () => {
    // The one behaviour a hardcoded import cannot have: after the split a
    // core-only checkout has no science layer and must still start.
    const missing: ToolGroupDeclaration[] = [
      { id: "ghost", module: "adapters/mcp-server/tools/not-here.ts", registrar: "registerGhostTools", layer: "sci", requires: "a Lean toolchain" },
    ];
    const [o] = await registerDeclaredToolGroups({}, missing, MCP_ROOT);
    expect(o.state).toBe("absent");
    if (o.state === "absent") {
      expect(o.layer).toBe("sci");
      expect(o.detail).toContain("a Lean toolchain");
    }
  });

  test("a present-but-broken group is `failed`, NOT `absent`", async () => {
    // Different states because the remedies are opposite: fix the module vs
    // install the layer. Collapsing them sends the operator the wrong way.
    const broken: ToolGroupDeclaration[] = [
      { id: "wrong-export", module: "adapters/mcp-server/tools/render.ts", registrar: "registerNoSuchThing", layer: "sci" },
    ];
    const [o] = await registerDeclaredToolGroups({}, broken, MCP_ROOT);
    expect(o.state).toBe("failed");
    if (o.state === "failed") expect(o.detail).toContain("registerNoSuchThing");
  });

  test("a registrar that throws is `failed`, and does not abort the rest", async () => {
    const calls: string[] = [];
    const groups: ToolGroupDeclaration[] = [
      { id: "wrong-export", module: "adapters/mcp-server/tools/render.ts", registrar: "registerNoSuchThing", layer: "sci" },
      ...TOOL_GROUPS.filter((g) => g.id === "preferences"),
    ];
    const fake = { tool: (n: string) => calls.push(n), registerTool: (n: string) => calls.push(n) };
    const out = await registerDeclaredToolGroups(fake, groups, MCP_ROOT);
    expect(out.map((o) => o.state)).toEqual(["failed", "registered"]);
  });
});

describe("built-in content adapters", () => {
  test("both declared adapters resolve in this checkout", async () => {
    for (const d of BUILTIN_ADAPTERS) {
      const r = await resolveBuiltinAdapter(d.contentType);
      expect(r.used.contentType).toBe(d.contentType);
      expect(r.fallbackReason).toBeUndefined();
      expect(typeof r.ctor).toBe("function");
    }
  });

  test("`paper` leads the list, because it is the superset", () => {
    // Falling back TO paper loses nothing — it registers the document tools
    // too. Falling back FROM it loses Lean and TeX, which is why that
    // direction has to be announced.
    expect(BUILTIN_ADAPTERS[0].contentType).toBe("paper");
    expect(BUILTIN_ADAPTERS.find((a) => a.contentType === "paper")?.layer).toBe("sci");
    expect(BUILTIN_ADAPTERS.find((a) => a.contentType === "document")?.layer).toBe("core");
  });

  test("an unknown contentType falls back AND says so", async () => {
    // Silence here is the failure mode: a folio running on an adapter it did
    // not ask for behaves subtly differently and nothing says why.
    const r = await resolveBuiltinAdapter("no-such-type");
    expect(r.fallbackReason).toBeDefined();
    expect(r.fallbackReason).toContain("no-such-type");
    expect(typeof r.ctor).toBe("function");
  });

  test("the class name each declaration points at is the one exported", async () => {
    // Guards a rename: the module is loaded by variable path, so a class
    // renamed without updating the table fails at STARTUP, and only this test
    // catches it before a user does.
    for (const d of BUILTIN_ADAPTERS) {
      const r = await resolveBuiltinAdapter(d.contentType);
      expect(r.ctor.name).toBe(d.className);
    }
  });
});
