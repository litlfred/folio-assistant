/**
 * The server's tools are READ from the harness's Tool nodes (bean `zmdo`,
 * owner 2026-10-04: "isn't it just presence in the KG?"). These tests hold
 * the two sides to each other: every in-process MCP Tool node resolves to a
 * registrar, and each registrar registers exactly the MCP names the KG
 * declares for its module — so a tool can neither be declared and not served,
 * nor served and not declared.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { clearCheckoutCache } from "../../cat-harness/schemas/harness-config.js";
import { tools } from "../../cat-harness/tools/index.js";
import { registerDeclaredToolGroups, toolGroupsFromNodes } from "./tool-groups.js";

const ROOT = resolve(import.meta.dir, "..");

/** A stand-in server that records the names registered on it. */
function recordingServer() {
  const names: string[] = [];
  return { names, server: { tool: (name: string) => { names.push(name); } } };
}

describe("tool groups derived from Tool nodes (zmdo)", () => {
  const nodes = tools();
  const groups = toolGroupsFromNodes(nodes);

  test("one group per module, and only for nodes served in-process over MCP", () => {
    const modules = groups.map((g) => g.module);
    expect(new Set(modules).size).toBe(modules.length);
    const served = nodes.filter((n) => n.invoke?.inProcess && n.invoke?.mcp);
    expect(new Set(served.map((n) => n.invoke!.inProcess!.module))).toEqual(new Set(modules));
  });

  test("each module registers exactly the MCP names its Tool nodes declare", async () => {
    for (const g of groups) {
      const { names, server } = recordingServer();
      const [o] = await registerDeclaredToolGroups(server, [g], ROOT, [ROOT]);
      expect(o).toEqual({ id: g.id, state: "registered" });
      const declared = nodes
        .filter((n) => n.invoke?.inProcess?.module === g.module && n.invoke?.mcp)
        .map((n) => n.invoke!.mcp!.tool)
        .sort();
      expect({ module: g.module, names: names.sort() }).toEqual({ module: g.module, names: declared });
    }
  });

  test("a module with no register… export is reported as failed, not guessed", async () => {
    const [o] = await registerDeclaredToolGroups({}, [{ id: "none", module: "src/no-content-adapter.ts", layer: "harness" }], ROOT);
    expect(o.state).toBe("failed");
    expect(o.state === "failed" && o.detail).toContain("exports no register");
  });
});

/**
 * A Tool node's `invoke.inProcess.module` is written relative to the instance
 * that DECLARES it, and stays that way when the code moves (owner, split plan
 * "Trap 1"): the loader finds the module in the one instance that implements
 * the declarer through its own `needs`. Same fixture shape as
 * `cat-harness-tools/scripts/tests/implementing-path.test.ts`.
 */
describe("a declared module resolves through the implementing instance (70lx)", () => {
  const made: string[] = [];
  afterEach(() => {
    for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
    clearCheckoutCache();
  });

  function put(root: string, rel: string, body: unknown = ""): void {
    const p = join(root, rel);
    mkdirSync(join(p, ".."), { recursive: true });
    writeFileSync(p, typeof body === "string" ? body : JSON.stringify(body, null, 2));
  }

  /** `base` declares; `impl` and `twin` each need it directly. */
  function checkout(): string {
    const root = mkdtempSync(join(tmpdir(), "tool-groups-"));
    made.push(root);
    put(root, "top.json", { name: "top", needs: ["base", "impl", "twin"], directories: [] });
    put(root, "base/base.json", { name: "base", needs: [], directories: [] });
    put(root, "impl/impl.json", { name: "impl", needs: ["base"], directories: [] });
    put(root, "twin/twin.json", { name: "twin", needs: ["base"], directories: [] });
    return root;
  }

  const registrar = (name: string) =>
    `export function registerX(server: { tool: (n: string) => void }) { server.tool(${JSON.stringify(name)}); }\n`;
  const group = { id: "x", module: "src/tools/x.ts", layer: "harness" as const };

  test("a module the declarer no longer holds is loaded from the implementer", async () => {
    const root = checkout();
    put(root, "impl/src/tools/x.ts", registrar("from_impl"));
    const { names, server } = recordingServer();
    const [o] = await registerDeclaredToolGroups(server, [group], join(root, "base"));
    expect(o).toEqual({ id: "x", state: "registered" });
    expect(names).toEqual(["from_impl"]);
  });

  test("the declarer's own copy wins, so a batch that has not moved yet is unchanged", async () => {
    const root = checkout();
    put(root, "base/src/tools/x.ts", registrar("from_base"));
    put(root, "impl/src/tools/x.ts", registrar("from_impl"));
    const { names, server } = recordingServer();
    await registerDeclaredToolGroups(server, [group], join(root, "base"));
    expect(names).toEqual(["from_base"]);
  });

  test("two implementers holding it is a FAILURE naming both, never the first by order", async () => {
    const root = checkout();
    put(root, "impl/src/tools/x.ts", registrar("from_impl"));
    put(root, "twin/src/tools/x.ts", registrar("from_twin"));
    const { names, server } = recordingServer();
    const [o] = await registerDeclaredToolGroups(server, [group], join(root, "base"));
    expect(o.state).toBe("failed");
    expect(o.state === "failed" && o.detail).toContain("impl");
    expect(o.state === "failed" && o.detail).toContain("twin");
    expect(names).toEqual([]);
  });

  test("held by nobody is still ABSENT, reported, not failed", async () => {
    const root = checkout();
    const [o] = await registerDeclaredToolGroups({}, [group], join(root, "base"));
    expect(o.state).toBe("absent");
  });
});

