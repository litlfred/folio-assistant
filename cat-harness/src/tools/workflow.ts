/**
 * MCP tools for running a process from `processes/*.bpmn`.
 *
 * Four tools, all content-agnostic, registered next to `work_plan_prime`:
 *
 * - `workflow_list`     — which processes exist, and which instances are open
 * - `workflow_start`    — begin one for a subject (a block, a release, a bean)
 * - `workflow_next`     — what is enabled *now*, with lane and skill
 * - `workflow_gate`     — may this step be performed right now?
 * - `workflow_complete` — record a step, or a decision, and advance
 *
 * A gateway that carries `folio:decision` is **computed**: the caller passes
 * the facts a DMN table reads (`{ failCritical: 0, failMajor: 2 }`) and the
 * table returns the branch. The agent reports numbers, not a verdict.
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
import { workflowFiles } from "../../scripts/known-skills.js";
import { z } from "zod";
import { basename, join, resolve } from "node:path";
import { findInModel, loadProcessModel, type ProcessModel } from "../workflow/process-model.js";
import { complete, describe, startInstance, type InstanceState } from "../workflow/instance.js";
import { describePreflight, preflight, preflightRefusal } from "../workflow/preflight.js";
import { describeCapture, writeLogEntry } from "../logging/log-writer.js";
import { instanceId, listInstances, loadInstance, saveInstance } from "../workflow/store.js";
import { applyWorkPlanOp } from "../workflow/bean-link.js";
import { checkGate, loadRelaxations, validateRelaxations } from "../workflow/gate.js";
import { type RoleGraph } from "../../schemas/role-graph.js";
import { roleGraphFor } from "../../scripts/known-skills.js";
import { accessContext, principalFromEnv } from "../core/access.js";
import { authorizeTask, describeVerdict, type TaskAuthVerdict } from "../workflow/authorize.js";

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });

/** Resolve a process by file stem (`editing-hci-validation`) or by process id. */
async function resolveModel(repoRoot: string, ref: string): Promise<ProcessModel> {
  // EVERY declared knowledge-graph directory, not the literal
  // `processes/`. A topical layout puts diagrams in more than one
  // place, and a resolver that knows only one of them reports a process that
  // exists as missing — which reads to a caller exactly like a typo.
  const files = workflowFiles(repoRoot).filter((f) => f.endsWith(".bpmn"));
  const stem = basename(ref).replace(/\.bpmn$/, "");

  const direct = files.find((f) => basename(f, ".bpmn") === stem);
  if (direct) return loadProcessModel(direct);

  for (const f of files) {
    const model = await loadProcessModel(f);
    if (model.id === ref) return model;
  }
  throw new Error(
    `No process "${ref}". Available: ` +
      (files.length > 0
        ? files.map((f) => basename(f, ".bpmn")).join(", ")
        : "none — no declared directory holds a .bpmn"),
  );
}

/**
 * The authorization verdict a step was just recorded under. A step inside a
 * subprocess is recorded in that child's history, so the search descends.
 */
function lastVerdict(state: InstanceState, node: string): TaskAuthVerdict | undefined {
  for (let i = state.history.length - 1; i >= 0; i--) {
    const h = state.history[i]!;
    if (h.node === node && h.authz) return h.authz;
  }
  for (const child of Object.values(state.children ?? {})) {
    const v = lastVerdict(child, node);
    if (v) return v;
  }
  return undefined;
}

export function registerWorkflowTools(server: McpServer, repoRoot: string): void {
  const root = resolve(repoRoot);

  /**
   * The role graph, so every step can say what the agent is acting AS.
   *
   * Read lazily and cached, and a read failure is swallowed to `undefined`
   * rather than taking the tools down: an instance that declares no role graph
   * is unmigrated, not broken, and the workflow interpreter predates roles.
   * A graph that is present but malformed is `kg:audit`'s finding — it fails
   * loudly there, which is where somebody can act on it.
   */
  let rolesCache: { graph: RoleGraph | undefined } | undefined;
  const roles = (): RoleGraph | undefined => {
    if (!rolesCache) {
      try {
        // declared-path-literal: the convention fallback, at the call site.
        // A role graph lives in a declared knowledge-graph root.
        rolesCache = { graph: roleGraphFor(root) };
      } catch {
        rolesCache = { graph: undefined };
      }
    }
    return rolesCache.graph;
  };

  server.tool(
    "workflow_list",
    "List the BPMN processes this folio defines, across every directory it declares as holding its knowledge graph, and any " +
      "instances currently open. Use before workflow_start to see what exists.",
    {},
    async () => {
      const files = workflowFiles(root).filter((f) => f.endsWith(".bpmn"));
      const lines: string[] = ["# Processes", ""];
      for (const f of files) {
        try {
          const m = await loadProcessModel(f);
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
            `starting a second.\n\n${describe(model, existing, roles())}`,
        );
      }
      // The pre-execution gate, and the FIRST non-test caller `<folio:precondition>`
      // has ever had (issue #853, requirement 3). Asked here rather than in
      // `startInstance` because a precondition is what must hold BEFORE the start
      // event: `startInstance` also runs for every subprocess entered mid-flight,
      // and re-asking there answers a different question.
      //
      // Only `unsatisfied` refuses. `could-not-determine` proceeds and is NAMED
      // in the output — three of the four preconditions in this repository are
      // `stated` and structurally unobservable, so blocking on them would not be
      // a gate, it would be an outage. See `workflow/preflight.ts`.
      const gate = preflight(model, root);
      const refusal = preflightRefusal(gate);
      if (refusal) throw new Error(refusal);
      const state = startInstance(model, { id, subject, bean });
      const path = saveInstance(root, state);
      // The activity log's `task-start`. Reported on the tool's own output
      // rather than written silently: the skill requires the capture state to
      // be SAID, and a caller that has to go and look at a directory to find
      // out whether it has an audit trail does not have one it can rely on.
      const log = writeLogEntry(
        root,
        {
          event: "task-start",
          summary: `started ${model.id} for ${subject}`,
          process: model.id,
          bean,
          session: id,
        },
        model.logCapture,
      );
      return text(
        `Started. State in \`${path.replace(`${root}/`, "")}\`.\n` +
          // Said on the tool's own output, on the same argument the capture
          // state is: a caller that has to go and look somewhere else to find
          // out whether the gate ran does not have one it can rely on.
          `${describePreflight(gate)}\n` +
          `${describeCapture(log)}\n\n${describe(model, state, roles())}`,
      );
    },
  );

  server.tool(
    "workflow_next",
    "What is enabled RIGHT NOW in an instance — the activities that may be worked, " +
      "with the lane (role) that performs each and the skill that implements it, plus " +
      "any decision waiting on an outcome. Derived from the diagram: a step not listed " +
      "here has not been reached yet. A call activity is entered automatically, so what " +
      "is reported is the leaf step, with the phases it sits inside shown as `inside:`.",
    { instance: z.string().describe("Instance id, from workflow_start or workflow_list") },
    async ({ instance }) => {
      const state = loadInstance(root, instance);
      if (!state) throw new Error(`No instance "${instance}". Try workflow_list.`);
      const model = await loadProcessModel(join(root, state.source.replace(`${root}/`, "")));
      return text(describe(model, state, roles()));
    },
  );

  server.tool(
    "workflow_gate",
    "May a step be performed right now? Ask before doing work a strict process " +
      "governs. The content-agnostic processes (editing, publication, lifecycle) " +
      "enforce: a step that is not enabled is refused unless a content package " +
      "declares a relaxation for it in skills/<package>/workflow-policy.json. The " +
      "per-content-type processes are advisory and always allow.",
    {
      instance: z.string(),
      activity: z.string().describe("Node id, e.g. `Task_Commit`"),
      actor: z.string().optional().describe("Who would perform it: a declared actor id"),
      target: z.string().optional().describe("The content it would act on: a block id, path or bean id"),
    },
    async ({ instance, activity, actor, target }) => {
      const state = loadInstance(root, instance);
      if (!state) throw new Error(`No instance "${instance}". Try workflow_list.`);
      const model = await loadProcessModel(join(root, state.source.replace(`${root}/`, "")));
      const relaxations = loadRelaxations(root);
      validateRelaxations(relaxations, [model]);
      const verdict = checkGate(model, state, activity, relaxations);
      // The second question a gate answers: not only "may this step run now"
      // but "may THIS actor run it" (issue #1207). Both are shown; either
      // refusing refuses.
      const owner = findInModel(model, activity);
      const authz = authorizeTask(accessContext(root), {
        principal: principalFromEnv(actor, process.env),
        process: owner?.model.id ?? model.id,
        task: activity,
        role: owner?.model.nodes.get(activity)?.roleRef,
        target,
      });
      const allowed = verdict.allowed && authz.allowed;
      return text(
        `${allowed ? "ALLOWED" : "REFUSED"} — ${verdict.reason}` +
          (verdict.relaxedBy
            ? `\n\nDeclared in skills/${verdict.relaxedBy.package}/workflow-policy.json.`
            : "") +
          `\n\n${describeVerdict(authz)}`,
      );
    },
  );

  server.tool(
    "workflow_complete",
    "Record that an enabled step is done, or answer a decision, and advance the " +
      "process. Refuses a step that is not currently enabled — that refusal is the " +
      "point: it is what keeps work from being claimed out of order. A step inside " +
      "a subprocess is named by its own id, exactly as workflow_next reported it; " +
      "the call activity itself is not completable, because a phase is done when " +
      "its steps are.",
    {
      instance: z.string(),
      node: z.string().describe("Node id from workflow_next, e.g. `Task_DraftEdit`"),
      outcome: z
        .string()
        .optional()
        .describe("For a decision a person makes — one of the outcomes workflow_next listed"),
      facts: z
        .record(z.string(), z.unknown())
        .optional()
        .describe(
          "For a decision workflow_next reported as `computed by <table>`: the values " +
            "it reads, e.g. { failCritical: 0, failMajor: 2 } from qa_sweep totals. " +
            "The table returns the branch — do not pass `outcome` for these.",
        ),
      actor: z
        .string()
        .optional()
        .describe(
          "Who did it: a declared actor id (.claude/skills/actors/). Checked against the lane's role " +
            "and the ODRL policies before the step is recorded",
        ),
      target: z.string().optional().describe("The content the step acted on: a block id, path or bean id"),
      note: z.string().optional().describe("What happened, for the instance history"),
    },
    async ({ instance, node, outcome, facts, actor, target, note }) => {
      const state = loadInstance(root, instance);
      if (!state) throw new Error(`No instance "${instance}". Try workflow_list.`);
      const model = await loadProcessModel(join(root, state.source.replace(`${root}/`, "")));
      const next = complete(model, state, node, {
        outcome,
        facts,
        actor,
        note,
        authz: { ctx: accessContext(root), principal: principalFromEnv(actor, process.env), target },
      });
      saveInstance(root, next);

      // A bean-marked step IS the work-plan operation, not a step about it.
      // Done after the advance so `resolve` can see whether the process it
      // tracks actually finished.
      //
      // Looked up through the subprocess tree, not in the top-level process:
      // once a diagram is decomposed the bean-marked steps live in its phases
      // (`A_Close` carries `op="resolve"` and sits in CRDM's close-out), and a
      // lookup that only knew the parent would find nothing and perform nothing
      // — silently, which is the worst way for a work-plan write to stop.
      // `instanceCompleted` stays the PARENT's status on purpose: a bean is
      // resolved when the whole process finished, not when one phase did.
      const authz = lastVerdict(next, node);
      const op = findInModel(model, node)?.model.nodes.get(node)?.workPlanOp;
      const plan = op
        ? applyWorkPlanOp(root, next.bean, op, {
            note,
            instanceCompleted: next.status === "completed",
          })
        : undefined;

      // `task-end` for the step just recorded. The EVENT is task-end even
      // when the instance runs on: the unit an agent starts and ends is the
      // step, and waiting for the whole process would lose every intermediate
      // one — which is most of what a log is read for. The instance's own
      // status rides along in the detail so the two are distinguishable.
      const log = writeLogEntry(
        root,
        {
          event: "task-end",
          summary: `completed ${node} in ${model.id}`,
          detail:
            `instance ${next.id} is now ${next.status}` +
            (note ? ` — ${note}` : "") +
            (authz ? ` — ${describeVerdict(authz)}` : ""),
          process: model.id,
          task: node,
          role: findInModel(model, node)?.model.nodes.get(node)?.lane,
          bean: next.bean,
          session: next.id,
        },
        model.logCapture,
      );
      return text(
        describe(model, next, roles()) +
          (authz ? `\n\n  authorization: ${describeVerdict(authz)}` : "") +
          (plan ? `\n\n  work plan: ${plan.summary}` : "") +
          `\n  ${describeCapture(log)}`,
      );
    },
  );
}
