/**
 * Read a `.bpmn` file into a graph the interpreter can walk.
 *
 * The workflow diagrams under `docs/workflows/` are already the normative
 * picture of how a change reaches the corpus, and every activity already names
 * the skill that implements it (`<folio:skill ref="…"/>`) and whether it
 * touches the work plan (`<folio:bean/>`). Until now nothing read them at
 * runtime: they were documentation an agent was trusted to have absorbed.
 *
 * This turns the same file into a model. `bpmn-moddle` — the parser bpmn.io
 * uses — does the XML, so the extension elements survive parsing and the
 * diagram interchange is ignored rather than reimplemented.
 *
 * ## What it supports, and why refusing the rest matters
 *
 * Nine element types: start and end events, the four activity kinds, exclusive
 * and parallel gateways, sequence flows. That is everything the six diagrams
 * in this repo use, and it is deliberately the whole list.
 *
 * Anything else — an inclusive gateway, a boundary event, an embedded
 * sub-process, a timer — throws at parse time and names what it found. The
 * alternative is to skip the element and keep walking, which produces a
 * process that runs, reports progress, and silently is not the process on the
 * diagram. This repo has that failure recorded twice over: a hand-written kind
 * list that omitted `algorithm` and `table` hid ~13% of a corpus from every QA
 * tool, and a walk that quietly dropped unlabelled blocks hid 27,390 words. A
 * gate that passes by not looking is worse than no gate.
 *
 * @module folio-assistant/workflow/process-model
 */

import { BpmnModdle } from "bpmn-moddle";
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { loadDecisionTable, possibleOutcomes, type DecisionTable } from "./decision-table.js";
import { WORK_PLAN_OPS, type WorkPlanOp } from "./bean-link.js";

/** Element types the interpreter can walk faithfully. */
const ACTIVITY_TYPES = [
  "bpmn:Task",
  "bpmn:UserTask",
  "bpmn:ServiceTask",
  "bpmn:CallActivity",
] as const;

const SUPPORTED = new Set<string>([
  "bpmn:StartEvent",
  "bpmn:EndEvent",
  "bpmn:ExclusiveGateway",
  "bpmn:ParallelGateway",
  "bpmn:SequenceFlow",
  ...ACTIVITY_TYPES,
]);

export type NodeKind = "start" | "end" | "activity" | "exclusive" | "parallel";

export interface ProcessNode {
  id: string;
  /** The `name` on the diagram, with the `[skill]` line stripped. */
  name: string;
  kind: NodeKind;
  /** BPMN type, kept so a caller can tell a userTask from a serviceTask. */
  type: string;
  /** Name of the lane this node sits in — i.e. the role that performs it. */
  lane?: string;
  /** `<folio:skill ref="…"/>`, possibly several. */
  skills: string[];
  /** True when `<folio:bean/>` marks this step as touching the work plan. */
  touchesWorkPlan: boolean;
  /**
   * `op` on `<folio:bean/>`: what this step does to the bean — `claim`, `note`
   * or `resolve`. Absent means the step touches the plan in some way the tools
   * do not perform automatically.
   */
  workPlanOp?: WorkPlanOp;
  /**
   * `<folio:policy relaxable="false"/>` — a content package may not declare a
   * relaxation for this step. These are the gate itself; if they were
   * negotiable, "strict base" would mean nothing.
   */
  relaxable: boolean;
  /**
   * `<folio:decision ref="decisions/x.dmn#Decision_Id"/>` on an exclusive
   * gateway: its outcome is **computed** from a DMN table rather than chosen.
   * Relative to the directory holding the `.bpmn`.
   */
  decisionRef?: string;
  /** `<bpmn:documentation>`, if the diagram carries one. */
  documentation?: string;
  /** For a call activity: the process it expands into. */
  calledElement?: string;
  incoming: string[];
  outgoing: string[];
}

export interface ProcessFlow {
  id: string;
  /** The flow's label. On a gateway this is the outcome that selects it. */
  name?: string;
  from: string;
  to: string;
}

export interface ProcessModel {
  /** `bpmn:process/@id`, e.g. `Process_Editing`. */
  id: string;
  name: string;
  /** File this was read from, for error messages and provenance. */
  source: string;
  /** Directory holding `source`, so a `folio:decision` ref resolves. */
  dir: string;
  nodes: Map<string, ProcessNode>;
  flows: Map<string, ProcessFlow>;
  /**
   * `<folio:policy enforcement="…"/>` on the process.
   *
   * `strict` — the content-agnostic base. A capability tool guarded by this
   * process refuses when the step is not enabled.
   * `advisory` — the per-content-type processes, where a package's own
   * judgement about its domain applies.
   */
  enforcement: "strict" | "advisory";
  /** Every start event, in document order. */
  startNodes: string[];
  /**
   * Decision tables backing gateways that carry `folio:decision`, keyed by
   * gateway id. Loaded with the process, so a missing table or one that cannot
   * route is a *load* error rather than a surprise at the moment of decision.
   */
  decisions: Map<string, DecisionTable>;
}

export class UnsupportedBpmn extends Error {}

/**
 * The label on a diagram carries the implementing skill on its own line
 * (`Draft the block edit\n[content-author]`) so a reader of the SVG can see it.
 * The model gets the skill from the extension element instead, so the name is
 * trimmed back to the activity itself — otherwise every tool output repeats it.
 */
function cleanName(raw: string | undefined): string {
  return (raw ?? "").replace(/\s*\[[a-z0-9-]+\]\s*$/i, "").replace(/\s*\n\s*/g, " ").trim();
}

/**
 * An `op` this build does not implement is refused rather than ignored: a step
 * that says it resolves a bean and quietly does nothing is the two-records
 * divergence this extension exists to close.
 */
function readWorkPlanOp(
  nodeId: string,
  ext: { $type: string; op?: string }[],
): WorkPlanOp | undefined {
  const op = ext.find((v) => v.$type === "folio:bean")?.op;
  if (op === undefined) return undefined;
  if (!WORK_PLAN_OPS.has(op)) {
    throw new UnsupportedBpmn(
      `${nodeId}: folio:bean op="${op}" is not implemented. ` +
        `Supported: ${[...WORK_PLAN_OPS].join(", ")}.`,
    );
  }
  return op as WorkPlanOp;
}

function kindOf(type: string): NodeKind {
  if (type === "bpmn:StartEvent") return "start";
  if (type === "bpmn:EndEvent") return "end";
  if (type === "bpmn:ExclusiveGateway") return "exclusive";
  if (type === "bpmn:ParallelGateway") return "parallel";
  return "activity";
}

// bpmn-moddle returns loosely-typed element trees; these shapes are the parts
// this module reads.
interface ModdleElement {
  $type: string;
  id: string;
  name?: string;
  documentation?: { text?: string }[];
  extensionElements?: {
    values?: { $type: string; ref?: string; op?: string; enforcement?: string; relaxable?: string }[];
  };
  calledElement?: string;
  sourceRef?: { id: string };
  targetRef?: { id: string };
  flowElements?: ModdleElement[];
  laneSets?: { lanes?: { name?: string; flowNodeRef?: { id: string }[] }[] }[];
  rootElements?: ModdleElement[];
}

export async function loadProcessModel(bpmnPath: string): Promise<ProcessModel> {
  const moddle = new BpmnModdle();
  const { rootElement, warnings } = await moddle.fromXML(readFileSync(bpmnPath, "utf-8"));
  if (warnings.length > 0) {
    throw new UnsupportedBpmn(
      `${basename(bpmnPath)}: ${warnings.length} parse warning(s) — ` +
        `${warnings.map((w: unknown) => String(w)).join("; ")}`,
    );
  }

  const defs = rootElement as unknown as ModdleElement;
  const proc = (defs.rootElements ?? []).find((e) => e.$type === "bpmn:Process");
  if (!proc) throw new UnsupportedBpmn(`${basename(bpmnPath)}: no bpmn:Process`);

  const elements = proc.flowElements ?? [];

  // Refuse before building anything, so the error names every offender at once
  // rather than one per re-run.
  const unsupported = [...new Set(elements.filter((e) => !SUPPORTED.has(e.$type)).map((e) => e.$type))];
  if (unsupported.length > 0) {
    throw new UnsupportedBpmn(
      `${basename(bpmnPath)} uses BPMN this interpreter does not implement: ` +
        `${unsupported.join(", ")}. Supported: ${[...SUPPORTED].join(", ")}. ` +
        `Extend the interpreter rather than letting the element be skipped — a ` +
        `process that silently omits a step is not the process on the diagram.`,
    );
  }

  // lane membership, so every node can report the role that performs it
  const laneOf = new Map<string, string>();
  for (const lane of proc.laneSets?.[0]?.lanes ?? []) {
    for (const ref of lane.flowNodeRef ?? []) {
      if (lane.name) laneOf.set(ref.id, lane.name);
    }
  }

  const nodes = new Map<string, ProcessNode>();
  const flows = new Map<string, ProcessFlow>();

  for (const el of elements) {
    if (el.$type === "bpmn:SequenceFlow") continue;
    const ext = el.extensionElements?.values ?? [];
    nodes.set(el.id, {
      id: el.id,
      name: cleanName(el.name) || el.id,
      kind: kindOf(el.$type),
      type: el.$type,
      lane: laneOf.get(el.id),
      skills: ext.filter((v) => v.$type === "folio:skill" && v.ref).map((v) => v.ref!),
      touchesWorkPlan: ext.some((v) => v.$type === "folio:bean"),
      workPlanOp: readWorkPlanOp(el.id, ext),
      relaxable: ext.find((v) => v.$type === "folio:policy")?.relaxable !== "false",
      decisionRef: ext.find((v) => v.$type === "folio:decision" && v.ref)?.ref,
      documentation: el.documentation?.[0]?.text?.replace(/\s+/g, " ").trim() || undefined,
      calledElement: el.calledElement,
      incoming: [],
      outgoing: [],
    });
  }

  for (const el of elements) {
    if (el.$type !== "bpmn:SequenceFlow") continue;
    const from = el.sourceRef?.id;
    const to = el.targetRef?.id;
    if (!from || !to || !nodes.has(from) || !nodes.has(to)) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: sequence flow ${el.id} does not connect two known nodes`,
      );
    }
    flows.set(el.id, { id: el.id, name: el.name?.trim() || undefined, from, to });
    nodes.get(from)!.outgoing.push(el.id);
    nodes.get(to)!.incoming.push(el.id);
  }

  const procExt = proc.extensionElements?.values ?? [];
  const declared = procExt.find((v) => v.$type === "folio:policy")?.enforcement;
  if (declared !== undefined && declared !== "strict" && declared !== "advisory") {
    throw new UnsupportedBpmn(
      `${basename(bpmnPath)}: folio:policy enforcement="${declared}" is not a policy. ` +
        `Use "strict" or "advisory".`,
    );
  }
  // Absent means strict. A process that forgot to say is governed, not exempt —
  // the failure mode of defaulting the other way is that forgetting silently
  // turns the gate off.
  const enforcement: "strict" | "advisory" = declared === "advisory" ? "advisory" : "strict";

  const startNodes = [...nodes.values()].filter((n) => n.kind === "start").map((n) => n.id);
  if (startNodes.length === 0) {
    throw new UnsupportedBpmn(`${basename(bpmnPath)}: no start event, so nothing can begin`);
  }

  const decisions = await loadDecisions(bpmnPath, nodes, flows);

  return {
    id: proc.id,
    name: cleanName(proc.name) || proc.id,
    source: bpmnPath,
    dir: dirname(bpmnPath),
    enforcement,
    nodes,
    flows,
    startNodes,
    decisions,
  };
}

/**
 * Load every `folio:decision` table, and check each one can actually route.
 *
 * The check is the point. A table whose output is `"passed"` against a gateway
 * whose flows are `yes` and `no` parses fine, evaluates fine, and then hands
 * back an outcome that matches no branch — at the moment a decision is needed,
 * which is the worst time to discover it. Every output literal in every rule
 * must name one of the gateway's outgoing flows, verified when the process
 * loads.
 */
async function loadDecisions(
  bpmnPath: string,
  nodes: Map<string, ProcessNode>,
  flows: Map<string, ProcessFlow>,
): Promise<Map<string, DecisionTable>> {
  const out = new Map<string, DecisionTable>();
  for (const node of nodes.values()) {
    if (!node.decisionRef) continue;
    if (node.kind !== "exclusive") {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: ${node.id} carries folio:decision but is a ` +
          `${node.type}. Only an exclusive gateway routes on a decision.`,
      );
    }
    const [file, decisionId] = node.decisionRef.split("#");
    if (!file || !decisionId) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: ${node.id} has folio:decision ref="${node.decisionRef}", ` +
          `which is not \`path.dmn#DecisionId\``,
      );
    }
    const table = await loadDecisionTable(join(dirname(bpmnPath), file), decisionId);

    const branches = node.outgoing.map((f) => flows.get(f)!.name).filter(Boolean) as string[];
    const unroutable = possibleOutcomes(table).filter((o) => !branches.includes(o));
    if (unroutable.length > 0) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: ${node.id} ("${node.name}") routes to ` +
          `[${branches.join(", ")}], but ${decisionId} can return ` +
          `[${unroutable.join(", ")}] — an outcome with no branch is a decision ` +
          `that cannot be acted on.`,
      );
    }
    out.set(node.id, table);
  }
  return out;
}


/** Whether a node is work someone does, as opposed to routing. */
export function isActivity(node: ProcessNode): boolean {
  return node.kind === "activity";
}
