/**
 * Run a process from `process-model.ts` as a token machine.
 *
 * The point is not to execute anything — an LLM agent executes, and may take an
 * hour over one activity and be interrupted halfway. The point is that **what
 * may happen next is derived from the diagram rather than asserted by whoever
 * is working**. `Commit into the corpus` does not become enabled until the
 * editor's decision has been recorded, because there is no token on it until
 * then. That is the whole of the determinism on offer.
 *
 * ## Two things can be enabled
 *
 * - an **activity** — work to do, carrying the lane that performs it and the
 *   skill that implements it;
 * - a **decision** — an exclusive gateway reached with no outcome supplied.
 *
 * Decisions are surfaced rather than guessed. In `editing-hci-validation` the
 * parallel fork leads straight into `Judgement call?` with no activity in
 * between, so something has to be asked. Picking a branch silently would be the
 * orchestrator quietly making the call it exists to record.
 *
 * ## What this does not do
 *
 * It does not check that the work was any good. A green process means the gates
 * ran in order and a person saw the findings; whether the content is correct is
 * what the QA axes and the Lean build are for. Do not read a completed instance
 * as a reviewed paper.
 *
 * @module folio-assistant/workflow/instance
 */

import { isActivity, type ProcessModel, type ProcessNode } from "./process-model.js";
import { evaluate } from "./decision-table.js";

export interface HistoryEntry {
  at: string;
  node: string;
  /** For a decision, the outcome chosen. */
  outcome?: string;
  /** Who recorded it — free text, e.g. a role or an agent name. */
  actor?: string;
  note?: string;
}

export interface InstanceState {
  id: string;
  processId: string;
  /** Path of the `.bpmn` this was started from. */
  source: string;
  /** What this instance is about — a block label, a release, a bean id. */
  subject: string;
  /** Bean this instance is tracked under, when there is one. */
  bean?: string;
  /** Node ids currently holding a token. */
  tokens: string[];
  /**
   * Sequence flows that have delivered a token into a parallel join and are
   * waiting for their siblings. Keyed by join node id.
   */
  arrivals: Record<string, string[]>;
  history: HistoryEntry[];
  status: "running" | "completed";
  startedAt: string;
  updatedAt: string;
}

export interface EnabledActivity {
  kind: "activity";
  node: string;
  name: string;
  /** The role that performs it, from the lane. */
  lane?: string;
  skills: string[];
  touchesWorkPlan: boolean;
  documentation?: string;
  calledElement?: string;
}

export interface EnabledDecision {
  kind: "decision";
  node: string;
  /** The gateway's own label — normally a question. */
  name: string;
  lane?: string;
  /** The outcomes that will be accepted, taken from the flow labels. */
  outcomes: string[];
  /**
   * Present when the gateway carries `folio:decision`: the outcome is
   * **computed** from a DMN table, so supply `facts` rather than choosing.
   * `facts` names exactly what the table reads.
   */
  computed?: { decision: string; facts: string[] };
}

export type Enabled = EnabledActivity | EnabledDecision;

export class WorkflowError extends Error {}

const now = (): string => new Date().toISOString();

/**
 * Push a token out of `from` and let it settle.
 *
 * Routing nodes resolve immediately; activities and undecided gateways hold the
 * token. Recursion is bounded by `guard` rather than by trusting the graph to
 * be acyclic — these diagrams have deliberate loops (revise, re-validate,
 * another cycle), and a malformed one must fail loudly instead of hanging.
 */
function settle(
  model: ProcessModel,
  state: InstanceState,
  targetId: string,
  viaFlowId: string,
  guard = 0,
): void {
  if (guard > 1000) {
    throw new WorkflowError(
      `routing did not settle after 1000 hops from ${targetId} — the process ` +
        `has a cycle with no activity in it, which cannot be a real process`,
    );
  }
  const node = model.nodes.get(targetId);
  if (!node) throw new WorkflowError(`no such node: ${targetId}`);

  switch (node.kind) {
    case "end":
      // The token is consumed. The instance ends when the last one is.
      state.history.push({ at: now(), node: node.id, note: "end event reached" });
      return;

    case "activity":
      if (!state.tokens.includes(node.id)) state.tokens.push(node.id);
      return;

    case "exclusive":
      // A merge (one way out) needs no decision; a split does, and the token
      // waits on the gateway until `complete` supplies an outcome.
      if (node.outgoing.length === 1) {
        const flow = model.flows.get(node.outgoing[0])!;
        settle(model, state, flow.to, flow.id, guard + 1);
        return;
      }
      if (!state.tokens.includes(node.id)) state.tokens.push(node.id);
      return;

    case "parallel": {
      if (node.incoming.length > 1) {
        // A join: wait for one token per incoming flow before continuing.
        const seen = state.arrivals[node.id] ?? [];
        if (!seen.includes(viaFlowId)) seen.push(viaFlowId);
        state.arrivals[node.id] = seen;
        if (seen.length < node.incoming.length) return;
        delete state.arrivals[node.id];
      }
      for (const flowId of node.outgoing) {
        const flow = model.flows.get(flowId)!;
        settle(model, state, flow.to, flow.id, guard + 1);
      }
      return;
    }

    case "start": {
      for (const flowId of node.outgoing) {
        const flow = model.flows.get(flowId)!;
        settle(model, state, flow.to, flow.id, guard + 1);
      }
      return;
    }
  }
}

export function startInstance(
  model: ProcessModel,
  opts: { id: string; subject: string; bean?: string; startNode?: string },
): InstanceState {
  const startNode = opts.startNode ?? model.startNodes[0];
  if (!model.nodes.has(startNode)) {
    throw new WorkflowError(`no such start node: ${startNode}`);
  }
  const state: InstanceState = {
    id: opts.id,
    processId: model.id,
    source: model.source,
    subject: opts.subject,
    bean: opts.bean,
    tokens: [],
    arrivals: {},
    history: [{ at: now(), node: startNode, note: "instance started" }],
    status: "running",
    startedAt: now(),
    updatedAt: now(),
  };
  settle(model, state, startNode, "");
  state.updatedAt = now();
  return state;
}

/** Outcomes an exclusive split will accept, in diagram order. */
function outcomesOf(model: ProcessModel, node: ProcessNode): string[] {
  return node.outgoing.map((f, i) => model.flows.get(f)!.name ?? `flow-${i + 1}`);
}

export function enabled(model: ProcessModel, state: InstanceState): Enabled[] {
  return state.tokens.map((id) => {
    const node = model.nodes.get(id)!;
    if (node.kind === "exclusive") {
      const table = model.decisions.get(node.id);
      return {
        kind: "decision" as const,
        node: node.id,
        name: node.name,
        lane: node.lane,
        outcomes: outcomesOf(model, node),
        computed: table
          ? { decision: table.id, facts: table.inputs.map((i) => i.expression) }
          : undefined,
      };
    }
    return {
      kind: "activity" as const,
      node: node.id,
      name: node.name,
      lane: node.lane,
      skills: node.skills,
      touchesWorkPlan: node.touchesWorkPlan,
      documentation: node.documentation,
      calledElement: node.calledElement,
    };
  });
}

/**
 * Record that a node is done, and advance.
 *
 * Refuses a node that holds no token. That refusal is the feature: it is what
 * stops a step being reported as done out of order, or twice, or at all when
 * the process never reached it.
 */
export function complete(
  model: ProcessModel,
  state: InstanceState,
  nodeId: string,
  opts: {
    outcome?: string;
    /** For a gateway backed by a DMN table: the values it reads. */
    facts?: Record<string, unknown>;
    actor?: string;
    note?: string;
  } = {},
): InstanceState {
  if (state.status !== "running") {
    throw new WorkflowError(`instance ${state.id} is ${state.status}`);
  }
  const node = model.nodes.get(nodeId);
  if (!node) throw new WorkflowError(`no such node: ${nodeId}`);
  if (!state.tokens.includes(nodeId)) {
    const open = enabled(model, state).map((e) => e.node);
    throw new WorkflowError(
      `${nodeId} is not enabled in instance ${state.id}. ` +
        (open.length
          ? `Enabled now: ${open.join(", ")}.`
          : `Nothing is enabled; the instance is finished or stuck.`),
    );
  }

  let chosen: string | undefined;
  let computedNote: string | undefined;
  const table = model.decisions.get(nodeId);
  if (node.kind === "exclusive" && table) {
    // Computed, not chosen. Accepting a hand-supplied outcome here would let the
    // caller assert the very thing the table exists to derive.
    if (opts.outcome) {
      throw new WorkflowError(
        `${nodeId} ("${node.name}") is computed by ${table.id}, not chosen. ` +
          `Pass facts (${table.inputs.map((i) => i.expression).join(", ")}) ` +
          `instead of outcome.`,
      );
    }
    if (!opts.facts) {
      throw new WorkflowError(
        `${nodeId} ("${node.name}") is computed by ${table.id}. Supply facts: ` +
          table.inputs
            .map((i) => `${i.expression}${i.label ? ` (${i.label})` : ""}`)
            .join(", "),
      );
    }
    const result = evaluate(table, opts.facts);
    const outcomes = outcomesOf(model, node);
    const idx = outcomes.findIndex((o) => o === String(result.outcome));
    if (idx === -1) {
      // Unreachable while loadProcessModel's check holds; kept so a future
      // loosening of that check cannot turn into a silent mis-route.
      throw new WorkflowError(
        `${table.id} returned "${result.outcome}", which is not a branch of ${nodeId} ` +
          `(${outcomes.join(", ")})`,
      );
    }
    chosen = node.outgoing[idx];
    computedNote =
      `${table.id} → ${result.outcome} by ${result.rule}` +
      (result.ruleDescription ? ` (${result.ruleDescription})` : "");
  } else if (node.kind === "exclusive") {
    const outcomes = outcomesOf(model, node);
    if (!opts.outcome) {
      throw new WorkflowError(
        `${nodeId} ("${node.name}") is a decision — pass one of: ${outcomes.join(", ")}`,
      );
    }
    const idx = outcomes.findIndex((o) => o.toLowerCase() === opts.outcome!.toLowerCase());
    if (idx === -1) {
      throw new WorkflowError(
        `"${opts.outcome}" is not an outcome of ${nodeId} ("${node.name}"). ` +
          `Valid: ${outcomes.join(", ")}`,
      );
    }
    chosen = node.outgoing[idx];
  }

  state.tokens = state.tokens.filter((t) => t !== nodeId);
  state.history.push({
    at: now(),
    node: nodeId,
    outcome: chosen ? model.flows.get(chosen)!.name : undefined,
    actor: opts.actor,
    // The rule that fired is the audit trail: "which table said so, and why".
    note: [opts.note, computedNote].filter(Boolean).join(" · ") || undefined,
  });

  const flowIds = chosen ? [chosen] : node.outgoing;
  if (flowIds.length === 0) {
    throw new WorkflowError(`${nodeId} has no outgoing flow and is not an end event`);
  }
  for (const flowId of flowIds) {
    const flow = model.flows.get(flowId)!;
    settle(model, state, flow.to, flow.id);
  }

  if (state.tokens.length === 0) state.status = "completed";
  state.updatedAt = now();
  return state;
}

/** A short human- and agent-readable rendering of where an instance is. */
export function describe(model: ProcessModel, state: InstanceState): string {
  const lines: string[] = [
    `instance ${state.id} — ${model.name} (${state.processId})`,
    `  subject: ${state.subject}${state.bean ? `   bean: ${state.bean}` : ""}`,
    `  status:  ${state.status}`,
  ];
  const open = enabled(model, state);
  if (open.length === 0) {
    lines.push(state.status === "completed" ? "  nothing left to do" : "  nothing enabled — stuck");
  } else {
    lines.push("", "  enabled now:");
    for (const e of open) {
      if (e.kind === "decision") {
        lines.push(`    ? ${e.name}  [${e.node}]${e.lane ? `  — ${e.lane}` : ""}`);
        if (e.computed) {
          lines.push(
            `        computed by ${e.computed.decision} — supply facts: ${e.computed.facts.join(", ")}`,
            `        it will route to one of: ${e.outcomes.join(" | ")}`,
          );
        } else {
          lines.push(`        choose one of: ${e.outcomes.join(" | ")}`);
        }
      } else {
        lines.push(
          `    • ${e.name}  [${e.node}]${e.lane ? `  — ${e.lane}` : ""}`,
          ...(e.skills.length ? [`        skill: ${e.skills.join(", ")}`] : []),
          ...(e.touchesWorkPlan ? [`        touches the work plan (.beans/)`] : []),
          ...(e.calledElement ? [`        expands into: ${e.calledElement}`] : []),
        );
      }
    }
  }
  const done = state.history.filter((h) => isActivityHistory(model, h));
  if (done.length) {
    lines.push("", `  done (${done.length}):`);
    for (const h of done.slice(-8)) {
      lines.push(`    ✓ ${model.nodes.get(h.node)?.name ?? h.node}${h.outcome ? ` → ${h.outcome}` : ""}`);
    }
  }
  return lines.join("\n");
}

function isActivityHistory(model: ProcessModel, h: HistoryEntry): boolean {
  const n = model.nodes.get(h.node);
  return !!n && (isActivity(n) || n.kind === "exclusive");
}
