/**
 * Project a Tool node onto the MCP standard.
 *
 * The mapping is `skills/folio-core/mcp-projection.md`. This is the
 * implementation, and it is a **library**: it produces declarations and argv,
 * and records what an invocation was authorised to do. It does not register
 * anything on a running server, because the harness is meant to carry no tools
 * of its own — the twelve hand-written MCP tools in `src/tools/` are content to
 * be migrated OUT, and wiring this to them would build on the thing being
 * removed.
 *
 * ## Three rules the skill states, enforced here
 *
 * **`invoke.mcp` is never a projection source.** A Tool already reachable over
 * MCP is skipped; a generator treating every arm uniformly emits a server that
 * proxies itself. (`ToolDefinitionSchema` already refuses an mcp-ONLY Tool, so
 * this handles the Tool that has both.)
 *
 * **An unmet `requires` means NOT LISTED**, never listed-and-failing.
 * `tools/list` is what a model plans against, so advertising a tool that cannot
 * run makes every plan containing it wrong. The omission is *reported*, not
 * silent — three states, as everywhere here.
 *
 * **Arguments reach the process as argv, never spliced into a shell string.**
 * That is the second line of defence and it is unconditional. The first line is
 * that the values cannot be payloads: every input references a type from
 * `schemas/tool-types.ts` that refuses shell metacharacters, and a Tool whose
 * input references an unconstrained type is rejected before it is ever run.
 *
 * @module src/mcp/project
 */
import { z } from "zod";

import type { ToolDefinition } from "../../schemas/tool.js";
import { TOOL_TYPES, isInjectionSafe, type ToolTypeName } from "../../schemas/tool-types.js";
import type { InvocationAuthority, InvocationContext, ToolInvocation } from "../../schemas/tool-invocation.js";

/** An MCP tool declaration, as `tools/list` returns it. */
export interface McpToolDeclaration {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Why a Tool was not projected. Reported, never silent. */
export interface Omission {
  tool: string;
  reason: string;
}

export interface Projection {
  declarations: McpToolDeclaration[];
  omissions: Omission[];
}

/** The `$defs` name a port's schema IRI ends in. */
export function portTypeName(port: { schema: string }): ToolTypeName | undefined {
  const n = port.schema.split("#/$defs/")[1];
  return n !== undefined && n in TOOL_TYPES ? (n as ToolTypeName) : undefined;
}

/** Host facts a `requires` block is evaluated against. */
export interface HostFacts {
  os?: string;
  runtimes?: string[];
  network?: boolean;
}

/** Is this Tool runnable here? A reason when not. */
export function unmetRequirement(t: ToolDefinition, host: HostFacts): string | undefined {
  const r = t.requires;
  if (r === undefined) return undefined;
  if (r.os !== undefined && host.os !== undefined && !r.os.includes(host.os)) {
    return `requires os ${r.os.join("|")}, host is ${host.os}`;
  }
  if (r.runtime !== undefined && host.runtimes !== undefined) {
    const missing = r.runtime.filter((x) => !host.runtimes!.includes(x));
    if (missing.length > 0) return `requires runtime ${missing.join(", ")}`;
  }
  if (r.network === true && host.network === false) return "requires network, host has none";
  return undefined;
}

/**
 * Build the `inputSchema` for one Tool from its `io.inputs`.
 *
 * The Zod schema of each declared type is rendered, so the MCP client sees the
 * SAME constraint that will reject a bad value — the pattern and the enum reach
 * the model rather than being enforced only on arrival. A model that can see
 * `BeanStatus` is an enum does not guess.
 */
export function inputSchemaFor(t: ToolDefinition): Record<string, unknown> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const input of t.io.inputs) {
    const name = portTypeName(input);
    if (name === undefined) continue;
    const base = TOOL_TYPES[name];
    shape[input.name] = input.required ? base : base.optional();
  }
  return z.object(shape) as unknown as Record<string, unknown>;
}

/** Project every Tool that can be projected, and say why the rest were not. */
export function project(tools: ToolDefinition[], host: HostFacts = {}): Projection {
  const declarations: McpToolDeclaration[] = [];
  const omissions: Omission[] = [];

  for (const t of tools) {
    const runnable = t.invoke.shell ?? t.invoke.container;
    if (runnable === undefined) {
      omissions.push({
        tool: t.id,
        reason:
          t.invoke.mcp !== undefined
            ? "already reachable over MCP — projecting it would proxy this server to itself"
            : "manual-only: performed by a person following the skill, with no command",
      });
      continue;
    }

    const unsafe = t.io.inputs.filter((i) => {
      const n = portTypeName(i);
      // The rule applies to COMMAND-LINE WORDS only. An input with no `arg` is
      // part of the contract but never reaches argv, and a `stdin` input is
      // data rather than program text — which is the whole reason `arg.stdin`
      // exists, and the only place free prose may appear.
      if (i.arg === undefined || "stdin" in i.arg) return false;
      return n === undefined || !isInjectionSafe(n);
    });
    if (unsafe.length > 0) {
      omissions.push({
        tool: t.id,
        reason:
          `input(s) ${unsafe.map((i) => i.name).join(", ")} reference an unconstrained type. ` +
          "A command-line argument must be of a type that cannot express a shell payload; " +
          "free text goes on stdin.",
      });
      continue;
    }

    const unmet = unmetRequirement(t, host);
    if (unmet !== undefined) {
      omissions.push({ tool: t.id, reason: `not available on this host: ${unmet}` });
      continue;
    }

    declarations.push({
      name: t.id.replace(/-/g, "_"),
      title: t.title,
      description: t.description,
      inputSchema: inputSchemaFor(t),
    });
  }

  return { declarations, omissions };
}

/**
 * Build argv for one invocation.
 *
 * Returns an **array**, always. There is no code path in this module that
 * produces a command *string*, which is the point: a caller cannot accidentally
 * hand this to a shell because it never has one to hand over.
 *
 * Throws on an input whose declared type rejects the value — the type is the
 * defence, and failing loudly is how it defends.
 */
export function buildArgv(t: ToolDefinition, inputs: Record<string, unknown>): { argv: string[]; stdin?: string } {
  const command = t.invoke.shell ?? t.invoke.container;
  if (command === undefined) throw new Error(`${t.id} has no runnable invoke arm`);

  const positionals: Array<{ at: number; value: string }> = [];
  const flags: string[] = [];
  let stdin: string | undefined;

  for (const input of t.io.inputs) {
    const raw = inputs[input.name];
    if (raw === undefined) {
      if (input.required) throw new Error(`${t.id}: required input \`${input.name}\` is missing`);
      continue;
    }
    const typeName = portTypeName(input);
    if (typeName === undefined) throw new Error(`${t.id}.${input.name}: unknown type ${input.schema}`);

    // The value is parsed by its DECLARED type before it goes anywhere. An
    // injection payload is not a member of `BeanStatus` and does not match
    // `BeanId`, so it is rejected here rather than escaped later.
    const value = TOOL_TYPES[typeName].parse(raw);
    const text = String(value);

    if (input.arg === undefined) continue; // Contract, but not passed.
    if ("stdin" in input.arg) stdin = text;
    else if ("flag" in input.arg) flags.push(input.arg.flag, text);
    else positionals.push({ at: input.arg.positional, value: text });
  }

  positionals.sort((a, b) => a.at - b.at);
  return { argv: [command, ...positionals.map((p) => p.value), ...flags], ...(stdin !== undefined ? { stdin } : {}) };
}

/**
 * Record an invocation, refusal included.
 *
 * A refusal is as much an audit event as a run — more, arguably: "the actor
 * lacked the permission" is exactly what an audit is looking for, and a
 * mechanism that only records successes cannot answer it.
 */
export function recordInvocation(args: {
  id: string;
  tool: ToolDefinition;
  skill: string;
  by: InvocationAuthority;
  context?: InvocationContext;
  inputs: Record<string, unknown>;
  argv: string[];
  outcome: ToolInvocation["outcome"];
  reason?: string;
  exitCode?: number;
  started_at: string;
  finished_at?: string;
}): ToolInvocation {
  if (!args.tool.satisfies.includes(args.skill)) {
    throw new Error(
      `${args.tool.id} does not satisfy \`${args.skill}\` — recording it would assert an edge the Tool denies`,
    );
  }
  return {
    id: args.id,
    tool: args.tool.id,
    skill: args.skill,
    by: args.by,
    context: args.context,
    inputs: args.inputs,
    argv: args.argv,
    outcome: args.outcome,
    reason: args.reason,
    exitCode: args.exitCode,
    started_at: args.started_at,
    finished_at: args.finished_at,
  };
}
