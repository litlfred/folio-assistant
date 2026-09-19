/**
 * The composition roots resolve their parts from declarations, and every way
 * of NOT resolving one is distinguishable from resolving it.
 *
 * `server.ts` imported six tool registrars, five route modules and
 * `src/index.ts` two adapter classes. Three of the registrars, three of the
 * routes and one of the adapters belong to another layer, so both generic
 * entry points named it — and after the split those imports do not resolve,
 * failing at MODULE LOAD, before either file's own error handling can run.
 *
 * The routes are the case where naming them is not merely inelegant but
 * measurably unfixable by reclassification: 10 wrong-direction edges with the
 * three content routes in the harness, 11 with them in core, because the
 * composition root then crosses the line to mount them.
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
import { SERVER_ROUTES } from "../../src/server.ts";
import { dispatchGet, dispatchPost, mountDeclaredRoutes } from "../../src/route-groups.ts";

/** The HTTP server's own root, which its route declarations resolve against. */
const SERVER_ROOT = new URL("../..", import.meta.url).pathname;

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

describe("HTTP routes", () => {
  /**
   * The same fixture the server builds. `adapter` is `{}` because nothing
   * reached here calls into it — a route that DID would fail loudly, which is
   * the point of leaving it minimal rather than mocking a whole adapter.
   */
  const deps = () => ({
    repoRoot: SERVER_ROOT,
    adapter: {},
    services: { gitHelper: {}, feedbackStore: {} },
  });

  test("every declared route's module exists and mounts", async () => {
    const { routes, outcomes } = await mountDeclaredRoutes(SERVER_ROUTES, SERVER_ROOT, deps());
    expect(outcomes.filter((o) => o.state !== "mounted")).toEqual([]);
    expect(routes).toHaveLength(SERVER_ROUTES.length);
  });

  test("the declaration covers all five routes the server used to import", () => {
    expect(SERVER_ROUTES.map((r) => r.id)).toEqual(
      ["branches", "feedback", "glossary", "relevance", "chat"],
    );
  });

  test("declaration order IS dispatch order, and chat stays last", () => {
    // Dispatch is first-match-wins, so this list reproduces the sequence of
    // `if` blocks it replaced. A reordering is a behaviour change, which is
    // exactly why the order is asserted rather than left to review.
    expect(SERVER_ROUTES.at(-1)!.id).toBe("chat");
  });

  test("chat is POST-only, so GET dispatch is one shorter than POST", async () => {
    const { routes } = await mountDeclaredRoutes(SERVER_ROUTES, SERVER_ROOT, deps());
    expect(routes.filter((r) => r.get).length).toBe(routes.length - 1);
    expect(routes.filter((r) => r.post).length).toBe(routes.length);
  });

  test("the three content routes are declared `core`", () => {
    // The boundary is reviewable in one place rather than inferable from five
    // import lines. Feedback, glossary and relevance all act on a folio's
    // content; branches and chat are the harness's own.
    const core = SERVER_ROUTES.filter((r) => r.layer === "core").map((r) => r.id).sort();
    expect(core).toEqual(["feedback", "glossary", "relevance"]);
  });

  test("a missing service is reported BY NAME, not as a later TypeError", async () => {
    // The negative case that matters: without this check a route mounts fine
    // and blows up inside a handler on some request hours later, where the
    // stack names neither the service nor the declaration.
    const { routes, outcomes } = await mountDeclaredRoutes(SERVER_ROUTES, SERVER_ROOT, {
      repoRoot: SERVER_ROOT,
      adapter: {},
      services: {},
    });
    const failed = outcomes.filter((o) => o.state === "failed");
    expect(failed.map((o) => o.id).sort()).toEqual(["branches", "feedback"]);
    for (const f of failed) expect((f as { detail: string }).detail).toMatch(/gitHelper|feedbackStore/);
    // The three that need nothing still mount: one route's missing service
    // must not take the others down.
    expect(routes).toHaveLength(3);
  });

  test("an absent module is `absent`, a broken one is `failed`", async () => {
    // Two states, never one. The remedies are opposite — install that layer
    // versus fix the module — so collapsing them sends the operator the wrong
    // way half the time.
    const absent = await mountDeclaredRoutes(
      [{ id: "ghost", module: "src/routes/ghost.ts", mount: "x", layer: "sci" }],
      SERVER_ROOT,
      deps(),
    );
    expect(absent.outcomes[0]!.state).toBe("absent");
    expect(absent.routes).toHaveLength(0);

    const broken = await mountDeclaredRoutes(
      [{ id: "bad", module: "src/routes/feedback.ts", mount: "noSuchFactory", layer: "core" }],
      SERVER_ROOT,
      deps(),
    );
    expect(broken.outcomes[0]!.state).toBe("failed");
    expect((broken.outcomes[0] as { detail: string }).detail).toContain("noSuchFactory");
  });

  test("chat declares no `needs` — it never read the store it was handed", () => {
    // `handleChatPost` took a `_feedbackStore` it never read. Harmless while
    // the store was the harness's; a wrong-direction import bought with
    // nothing once it became core's. Pinned so it cannot quietly come back.
    expect(SERVER_ROUTES.find((r) => r.id === "chat")!.needs).toBeUndefined();
  });

  test("dispatch returns null for a URL nobody claims", async () => {
    const { routes } = await mountDeclaredRoutes(SERVER_ROUTES, SERVER_ROOT, deps());
    const url = new URL("http://x/api/nothing-claims-this");
    expect(await dispatchGet(routes, url)).toBeNull();
    expect(await dispatchPost(routes, url, new Request(url, { method: "POST" }))).toBeNull();
  });
});
