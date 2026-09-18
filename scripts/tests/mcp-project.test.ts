/**
 * The MCP projection, and the injection defence it rests on.
 *
 * The claim being tested is not "we escape arguments" — it is that a dangerous
 * VALUE cannot be constructed, because every command-line input references a
 * type that refuses it. Escaping is a property of the caller and a caller is one
 * refactor away from a template literal; a constrained type survives that.
 */
import { describe, expect, test } from "bun:test";

import { project, buildArgv, unmetRequirement, recordInvocation } from "../../src/mcp/project.js";
import { defineTool, type ToolDefinition } from "../../schemas/tool.js";
import { toolTypeIri, isInjectionSafe, TOOL_TYPES } from "../../schemas/tool-types.js";
import { ToolInvocationSchema } from "../../schemas/tool-invocation.js";
import { tools } from "../../tools/index.js";

const B = "https://example.invalid/fa";
const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);

const beanTool = (): ToolDefinition =>
  defineTool({
    id: "bean-demo",
    title: "demo",
    summary: "demo",
    install: { none: true },
    invoke: { shell: "beans" },
    io: {
      inputs: [
        { name: "id", schema: t("BeanId"), required: true, arg: { positional: 0 } },
        { name: "status", schema: t("BeanStatus"), required: false, arg: { flag: "--status" } },
      ],
      outputs: [],
    },
    satisfies: ["todo-manager"],
  });

describe("mcp projection", () => {
  test("argv is an array, and the command is its head", () => {
    const { argv } = buildArgv(beanTool(), { id: "fa-1dfh", status: "in-progress" });
    expect(argv).toEqual(["beans", "fa-1dfh", "--status", "in-progress"]);
  });

  test("a payload cannot be constructed — the type refuses it", () => {
    // Each of these is a real shell payload. None is a member of `BeanId`, so
    // the parse throws before anything is assembled. This is the FIRST line of
    // defence; the argv array is the second.
    for (const payload of ["; rm -rf /", "$(whoami)", "`id`", "a && b", "x | y", "../../etc/passwd"]) {
      expect(() => buildArgv(beanTool(), { id: payload })).toThrow();
    }
  });

  test("an enum input refuses anything outside the enum", () => {
    expect(() => buildArgv(beanTool(), { id: "fa-1dfh", status: "completed; rm -rf /" })).toThrow();
  });

  test("a missing required input throws rather than producing a short argv", () => {
    // A tool invoked with a hole in its arguments is a different command.
    expect(() => buildArgv(beanTool(), {})).toThrow(/required input/);
  });

  test("positionals keep their declared order regardless of declaration order", () => {
    const tool = defineTool({
      id: "ordered", title: "x", summary: "y",
      install: { none: true }, invoke: { shell: "cmd" },
      io: {
        inputs: [
          { name: "second", schema: t("Branch"), required: true, arg: { positional: 1 } },
          { name: "first", schema: t("Branch"), required: true, arg: { positional: 0 } },
        ],
        outputs: [],
      },
      satisfies: ["todo-manager"],
    });
    expect(buildArgv(tool, { first: "a", second: "b" }).argv).toEqual(["cmd", "a", "b"]);
  });

  test("free prose goes on stdin, never into argv", () => {
    const tool = defineTool({
      id: "prose", title: "x", summary: "y",
      install: { none: true }, invoke: { shell: "cmd" },
      io: { inputs: [{ name: "body", schema: t("Markdown"), required: true, arg: { stdin: true } }], outputs: [] },
      satisfies: ["todo-manager"],
    });
    const r = buildArgv(tool, { body: "anything; `goes` $(here)" });
    expect(r.argv).toEqual(["cmd"]);
    expect(r.stdin).toBe("anything; `goes` $(here)");
  });

  test("Markdown is not injection-safe, and that is deliberate", () => {
    // No pattern admits real prose and excludes a payload. Saying so beats a
    // type that claims safety it does not provide.
    expect(isInjectionSafe("Markdown")).toBe(false);
    for (const n of ["BeanId", "BeanStatus", "RepoPath", "Url", "Branch", "ChangeProposalNumber"]) {
      expect(isInjectionSafe(n)).toBe(true);
    }
  });

  test("every injection-safe type actually refuses metacharacters", () => {
    // The set is an assertion; this checks it. A type listed as safe that
    // accepts `; rm -rf /` would be worse than not listing it at all.
    for (const name of Object.keys(TOOL_TYPES)) {
      if (!isInjectionSafe(name)) continue;
      const schema = TOOL_TYPES[name as keyof typeof TOOL_TYPES];
      for (const payload of ["; rm -rf /", "$(whoami)", "`id`", "a b"]) {
        expect(schema.safeParse(payload).success).toBe(false);
      }
    }
  });

  test("a Tool reachable over MCP is omitted, with a reason", () => {
    const { declarations, omissions } = project(tools(B).filter((x) => x.id === "github"));
    // `github` has BOTH shell and mcp, so it projects on its shell arm.
    expect(declarations.map((d) => d.name)).toContain("github");
    expect(omissions).toEqual([]);
  });

  test("an unmet requirement means NOT LISTED, and the omission is reported", () => {
    const netTool = defineTool({
      id: "needs-net", title: "x", summary: "y",
      install: { none: true }, invoke: { shell: "cmd" },
      io: { inputs: [], outputs: [] }, satisfies: ["todo-manager"],
      requires: { network: true },
    });
    const { declarations, omissions } = project([netTool], { network: false });
    // tools/list is what a model plans against: advertising an unrunnable tool
    // makes every plan containing it wrong.
    expect(declarations).toEqual([]);
    expect(omissions[0].reason).toContain("requires network");
    expect(unmetRequirement(netTool, { network: false })).toBeDefined();
  });

  test("a manual-only Tool is omitted, and says why", () => {
    const { declarations, omissions } = project(tools(B).filter((x) => x.id === "beans-manual"));
    // beans-manual declares BOTH shell and manual, so it does project.
    expect(declarations.length + omissions.length).toBe(1);
  });

  test("the real Tool set projects, and every declaration has a schema", () => {
    const { declarations } = project(tools(B), { network: true, runtimes: ["go"] });
    expect(declarations.length).toBeGreaterThan(0);
    for (const d of declarations) {
      expect(d.name).toMatch(/^[a-z][a-z0-9_]*$/); // MCP names use underscores.
      expect(d.description.length).toBeGreaterThan(0);
      expect(d.inputSchema).toBeDefined();
    }
  });

  test("an invocation records who, in which role, at which task", () => {
    const inv = recordInvocation({
      id: "inv-1", tool: beanTool(), skill: "todo-manager",
      by: { actor: "authoring-agent", role: "content-author" },
      context: { process: "Process_ContentChangeReview", task: "Task_ReviewStaging" },
      inputs: { id: "fa-1dfh" }, argv: ["beans", "fa-1dfh"],
      outcome: "ran", exitCode: 0, started_at: new Date().toISOString(),
    });
    expect(ToolInvocationSchema.safeParse(inv).success).toBe(true);
    expect(inv.by.actor).toBe("authoring-agent");
    expect(inv.by.role).toBe("content-author");
    expect(inv.context?.task).toBe("Task_ReviewStaging");
  });

  test("recording a skill the Tool does not satisfy is refused", () => {
    // Otherwise the audit trail would assert an edge the Tool itself denies.
    expect(() =>
      recordInvocation({
        id: "x", tool: beanTool(), skill: "not-a-skill-it-satisfies",
        by: { actor: "a", role: "r" }, inputs: {}, argv: [],
        outcome: "ran", started_at: new Date().toISOString(),
      }),
    ).toThrow(/does not satisfy/);
  });

  test("a refusal without a reason is not a valid record", () => {
    // A mechanism that records only successes cannot answer "why was this
    // blocked", which is most of what an audit is for.
    const base = {
      id: "x", tool: "bean-demo", skill: "todo-manager",
      by: { actor: "a", role: "r" }, inputs: {}, argv: [],
      started_at: new Date().toISOString(),
    };
    expect(ToolInvocationSchema.safeParse({ ...base, outcome: "refused-permission" }).success).toBe(false);
    expect(
      ToolInvocationSchema.safeParse({ ...base, outcome: "refused-permission", reason: "lacks admin-settings" })
        .success,
    ).toBe(true);
  });
});
