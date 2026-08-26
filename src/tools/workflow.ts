/**
 * MCP tools for running a process from `docs/workflows/*.bpmn`.
 *
 * Four tools, all content-agnostic, registered next to `work_plan_prime`:
 *
 * - `workflow_list`     — which processes exist, and which instances are open
 * - `workflow_start`    — begin one for a subject (a block, a release, a bean)
 * - `workflow_next`     — what is enabled *now*, with lane and skill
 * - `workflow_complete` — record a step, or a decision, and advance
 *
 * ## What this buys, and what it does not
 *
 * `workflow_next` is **derived** from the diagram, not asserted by whoever is
 * working: `Commit into the corpus` has no token on it until the editor's
 * decision is recorded, so it cannot be reported done before the HCI gate.
 * `workflow_complete` refuses a step that holds no token, which is what stops
 * work being claimed out of order.
 *
 * That is ordering, not enforcement. Nothing here prevents an agent from
 * ignoring these tools and calling `content_validate` directly — this repo has
 * the failure on file (`5rfy`: 29 of 32 workflows never fire on their own). An
 * advisory orchestrator is one more thing an agent is *supposed* to call.
 * Making it binding means gating the capability tools on instance state, which
 * is a deliberate decision and is not taken here. See
 * `docs/proposals/workflow-orchestration.md`.
 *
 * @module folio-assistant/tools/workflow
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { existsSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { loadProcessModel, type ProcessModel } from "../workflow/process-model.js";
import { complete, describe, startInstance } from "../workflow/instance.js";
import { instanceId, listInstances, loadInstance, saveInstance } from "../workflow/store.js";

const WORKFLOW_SRC = join("docs", "workflows");

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

/** Resolve a process by file stem (`editing-hci-validation`) or by process id. */
async function resolveModel(repoRoot: string, ref: string): Promise<ProcessModel> {
  const dir = join(repoRoot, WORKFLOW_SRC);
  const stem = basename(ref).replace(/\.bpmn$/, "");
  const direct = join(dir, `${stem}.bpmn`);
  if (existsSync(direct)) return loadProcessModel(direct);

  for (const f of existsSync(dir) ? readdirSync(dir).filter((x) => x.endsWith(".bpmn")) : []) {
    const model = await loadProcessModel(join(dir, f));
    if (model.id === ref) return model;
  }
  throw new Error(
    `No process "${ref}". Available: ` +
      (existsSync(dir)
        ? readdirSync(dir)
            .filter((f) => f.endsWith(".bpmn"))
            .map((f) => f.replace(/\.bpmn$/, ""))
            .join(", ")
        : `none — ${WORKFLOW_SRC} does not exist`),
  );
}

export function registerWorkflowTools(server: McpServer, repoRoot: string): void {
  const root = resolve(repoRoot);

  server.tool(
    "workflow_list",
    "List the BPMN processes this folio defines (docs/workflows/*.bpmn) and any " +
      "instances currently open. Use before workflow_start to see what exists.",
    {},
    async () => {
      const dir = join(root, WORKFLOW_SRC);
      const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".bpmn")) : [];
      const lines: string[] = ["# Processes", ""];
      for (const f of files) {
        try {
          const m = await loadProcessModel(join(dir, f));
          const acts = [...m.nodes.values()].filter((n) => n.kind === "activity");
          lines.push(
            `- **${f.replace(/\.bpmn$/, "")}** — ${m.name} (\`${m.id}\`), ` +
              `${acts.length} activities`,
          );
        } catch (e) {
          lines.push(`- **${f}** — cannot be interpreted: ${(e as Error).message}`);
        }
      }
      if (files.length === 0) lines.push("_(none)_");

      const open = listInstances(root);
      lines.push("", "# Instances", "");
      if (open.length === 0) lines.push("_(none)_");
      for (const i of open) {
        lines.push(`- \`${i.id}\` — ${i.subject} · ${i.status} · updated ${i.updatedAt}`);
      }
      return text(lines.join("\n"));
    },
  );

  server.tool(
    "workflow_start",
    "Begin a process instance for a subject (a block label, a release, a bean id). " +
      "Idempotent: an instance already open for the same process and subject is " +
      "returned rather than duplicated. Returns what is enabled first.",
    {
      process: z.string().describe("File stem, e.g. `editing-hci-validation`, or the bpmn:process id"),
      subject: z.string().describe("What this run is about — a block label, a release name"),
      bean: z.string().optional().describe("Bean id this work is tracked under"),
    },
    async ({ process, subject, bean }) => {
      const model = await resolveModel(root, process);
      const id = instanceId(model.id, subject);
      const existing = loadInstance(root, id);
      if (existing) {
        return text(
          `An instance already exists for this subject — continuing it rather than ` +
            `starting a second.\n\n${describe(model, existing)}`,
        );
      }
      const state = startInstance(model, { id, subject, bean });
      const path = saveInstance(root, state);
      return text(`Started. State in \`${path.replace(`${root}/`, "")}\`.\n\n${describe(model, state)}`);
    },
  );

  server.tool(
    "workflow_next",
    "What is enabled RIGHT NOW in an instance — the activities that may be worked, " +
      "with the lane (role) that performs each and the skill that implements it, plus " +
      "any decision waiting on an outcome. Derived from the diagram: a step not listed " +
      "here has not been reached yet.",
    { instance: z.string().describe("Instance id, from workflow_start or workflow_list") },
    async ({ instance }) => {
      const state = loadInstance(root, instance);
      if (!state) throw new Error(`No instance "${instance}". Try workflow_list.`);
      const model = await loadProcessModel(join(root, state.source.replace(`${root}/`, "")));
      return text(describe(model, state));
    },
  );

  server.tool(
    "workflow_complete",
    "Record that an enabled step is done, or answer a decision, and advance the " +
      "process. Refuses a step that is not currently enabled — that refusal is the " +
      "point: it is what keeps work from being claimed out of order.",
    {
      instance: z.string(),
      node: z.string().describe("Node id from workflow_next, e.g. `Task_DraftEdit`"),
      outcome: z
        .string()
        .optional()
        .describe("Required for a decision — one of the outcomes workflow_next listed"),
      actor: z.string().optional().describe("Who did it: a role, or an agent name"),
      note: z.string().optional().describe("What happened, for the instance history"),
    },
    async ({ instance, node, outcome, actor, note }) => {
      const state = loadInstance(root, instance);
      if (!state) throw new Error(`No instance "${instance}". Try workflow_list.`);
      const model = await loadProcessModel(join(root, state.source.replace(`${root}/`, "")));
      const next = complete(model, state, node, { outcome, actor, note });
      saveInstance(root, next);
      return text(describe(model, next));
    },
  );
}
