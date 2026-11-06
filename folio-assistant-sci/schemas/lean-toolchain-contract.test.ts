/**
 * The `lean-toolchain` role held to its contract,
 * `skills/content/authoring-math/lean-toolchain-contract.md`.
 *
 * Each `describe` quotes one numbered line of "What it must do" and checks it
 * against what this repository declares about the Actor that plays the role:
 * its actor file, its capabilities, the requirement statement the capability
 * says it satisfies, and the `lean-build` Tool. Nothing here invents a duty
 * the contract does not state.
 *
 * What cannot run here, and is therefore not claimed: a `lake build` itself.
 * This layer carries no folio and no Lean install (the contract's own
 * "What it is not asked"), so line 2 is held at the level of what the
 * capability promises and the requirement demands, not by building a project.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import leanBuild from "../tools/lean-build/lean-build.ts";

const ROOT = resolve(import.meta.dir, "..");
const json = <T = Record<string, unknown>>(rel: string): T => JSON.parse(readFileSync(join(ROOT, rel), "utf-8")) as T;

interface Role { id: string; actorKinds: string[]; skills: string[] }
interface Capability { id: string; detection?: { method: string; command?: string; endpoint?: string }; fallbackTo?: string; requires?: string[]; satisfies?: string[] }
interface Statement { key: string; requirement: string; successCriteria?: { criterion: string; verification: string }[] }

// declared-path-literal: a contract test whose subject IS these named nodes — the role,
// actor, capabilities and requirement set one external party's contract is made of.
const role = json<{ roles: Role[] }>("scenarios/roles.json").roles.find((r) => r.id === "lean-toolchain")!;
const actor = json<{ id: string; kind: string; roles: string[]; capabilities: string[] }>("scenarios/actors/lean-mcp.json");
const toolchain = json<Capability>("scenarios/capabilities/lean-toolchain.json");
const mcp = json<Capability>("scenarios/capabilities/lean-mcp.json");
const statements = json<{ statements: Statement[] }>("skills/requirements/lean-verification.json").statements;
const tool = leanBuild((n) => `t:${n}`, "https://example.org/");

describe("the role is mechanical, and its contract is a skill it carries", () => {
  test("played only by a system Actor, carrying lean-toolchain-contract", () => {
    expect(role.actorKinds).toEqual(["system"]);
    expect(role.skills).toContain("lean-toolchain-contract");
  });

  test("the Actor named in the contract plays it, with the lean-toolchain capability", () => {
    expect(actor.kind).toBe("system");
    expect(actor.roles).toContain("lean-toolchain");
    expect(actor.capabilities).toContain("lean-toolchain");
  });
});

describe("2. build with `lake build` and exit 0 with no compilation errors", () => {
  test("the capability satisfies req:lean-verification#lean-compiles", () => {
    expect(toolchain.satisfies).toContain("req:lean-verification#lean-compiles");
  });

  test("that statement demands exactly that: lake build, exit code 0, no compilation errors, verified by test", () => {
    const s = statements.find((x) => x.key === "lean-compiles")!;
    expect(s.requirement).toMatch(/`lake build` without errors/);
    expect(s.successCriteria).toHaveLength(1);
    expect(s.successCriteria![0]!.criterion).toMatch(/exit code 0/);
    expect(s.successCriteria![0]!.criterion).toMatch(/no compilation errors/);
    expect(s.successCriteria![0]!.verification).toBe("test");
  });
});

describe("3. be detectable — `lean --version`, with lean-mcp the declared fallback", () => {
  test("detection is the command `lean --version`", () => {
    expect(toolchain.detection).toEqual({ method: "command", command: "lean --version" });
  });

  test("the fallback is lean-mcp, which runs Lean server-side and so does not itself need a local toolchain", () => {
    expect(toolchain.fallbackTo).toBe("lean-mcp");
    expect(mcp.id).toBe("lean-mcp");
    expect(mcp.detection?.method).toBe("mcp-probe");
    expect(mcp.requires ?? []).not.toContain("lean-toolchain");
  });
});

describe("4. report what it ran, not only that it passed", () => {
  test("the lean-build Tool writes the committable lean-build-status.json as its output", () => {
    expect(tool.id).toBe("lean-build");
    const status = tool.io.outputs?.find((o) => o.name === "status");
    expect(status).toBeDefined();
    expect(status!.description).toMatch(/lean-build-status\.json/);
    expect(status!.description).toMatch(/committable/);
  });

  test("and it says what it needs to run, rather than leaving a caller to find out", () => {
    expect(tool.requires?.runtime).toEqual(expect.arrayContaining(["lean", "lake"]));
  });
});

describe("What it is not asked: to decide — sorry tracking is verified by inspection, not by this role", () => {
  test("req:lean-verification#sorry-tracking is verified by inspection only", () => {
    const s = statements.find((x) => x.key === "sorry-tracking")!;
    expect(s.successCriteria?.map((c) => c.verification)).toEqual(["inspection"]);
  });
});
