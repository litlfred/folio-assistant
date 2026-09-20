/**
 * Read a `.bpmn` file into a graph the interpreter can walk.
 *
 * The workflow diagrams under `skills/workflows/` are already the normative
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
import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { loadDecisionTable, possibleOutcomes, type DecisionTable } from "./decision-table.js";
import { ACTOR_KINDS, type ActorKind } from "../../schemas/role-graph.js";
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
  /** Id of that lane, so a finding can name the element rather than a string. */
  laneId?: string;
  /**
   * `<folio:role ref="…"/>` on the lane, when the diagram binds explicitly.
   *
   * A lane NAME is free text and sixty of them spell two dozen positions
   * (`schemas/role-graph.ts`); an explicit ref is the join that does not
   * depend on spelling, and it wins over name matching when present.
   */
  roleRef?: string;
  /** `<folio:skill ref="…"/>`, possibly several. */
  skills: string[];
  /**
   * `<folio:no-skill reason="…"/>` — this activity names no skill ON PURPOSE,
   * and this is why.
   *
   * A person describing the change they want, in their own words, is not an
   * unimplemented step: there is nothing for an instruction body to say. But
   * "no skill because none could exist" and "no skill because nobody wrote
   * one yet" are indistinguishable from the outside, which is why
   * `activity-names-skill` could only ever be advisory — it had legitimate
   * instances it could not tell from real gaps.
   *
   * The reason is REQUIRED and a declaration without one does not load, the
   * same rule `workflow-policy.json` relaxations follow: an exemption whose
   * justification is "" is an exemption nobody can review, and it would make
   * silencing the criterion cheaper than satisfying it.
   */
  noSkillReason?: string;
  /**
   * `<folio:fulfilment kinds="person agent" reason="…"/>` — which actor kinds
   * may perform this activity, said explicitly.
   *
   * Almost no activity needs one. The BPMN type already answers the question
   * for a `userTask` and a `serviceTask`, and `fulfilmentKindsForBpmnType` in
   * `schemas/role-graph.ts` reads that answer, so this exists for the step
   * where the derived answer is wrong — an abstract `bpmn:Task` that genuinely
   * admits only one kind, or a `serviceTask` a person really does drive.
   *
   * The reason is REQUIRED and a declaration without one does not load, on the
   * same rule as {@link ProcessNode.noSkillReason}: this declaration can
   * SILENCE a finding, and an exemption nobody can review is one somebody adds
   * to get to green. Widening `kinds` to every kind is the cheapest way to make
   * `activity-fulfilment-kind` pass, so it has to cost a sentence somebody will
   * read in the diff.
   */
  fulfilment?: { kinds: ActorKind[]; reason: string };
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

/**
 * One swimlane, which is to say one **role**.
 *
 * Kept as a first-class part of the model rather than only as a string on each
 * node, because the questions worth asking are about the lane: does it bind a
 * declared role, does that role carry the skills its activities name, is there
 * an actor who can take it on. A `lane?: string` per node cannot answer any of
 * those — it cannot even report a lane that holds no activities.
 */
export interface LaneDef {
  id: string;
  name?: string;
  /** `<folio:role ref="…"/>` on the lane, when declared. */
  roleRef?: string;
  /** Ids of the flow nodes in this lane. */
  nodes: string[];
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
  /**
   * `<folio:log capture="on|off"/>` on the process — whether running THIS
   * workflow writes activity-log entries to the data store.
   *
   * Three-valued, and the third value is the point: `undefined` means the
   * process did not say, which `resolveCapture` reads as `unknown` rather
   * than as `off`. `off` is somebody's decision; `unknown` is nobody having
   * made one, and an agent that cannot tell whether its audit trail is being
   * kept must say so. The owner's ask was explicit opt-in — *"need explicit
   * like (capture log when agent runs this workflow)"* — so an unmarked
   * process does not reach the store either way; what differs is whether the
   * agent can report a decision or only a default.
   */
  logCapture?: "on" | "off";
  /** The process's lanes, in document order. A lane IS a role — see below. */
  lanes: LaneDef[];
  /** Every start event, in document order. */
  startNodes: string[];
  /**
   * Decision tables backing gateways that carry `folio:decision`, keyed by
   * gateway id. Loaded with the process, so a missing table or one that cannot
   * route is a *load* error rather than a surprise at the moment of decision.
   */
  decisions: Map<string, DecisionTable>;
  /**
   * The process each call activity expands into, keyed by the call activity's
   * node id.
   *
   * Resolved at LOAD time rather than when a token arrives, for the same reason
   * `decisions` is: a `calledElement` naming a process no file defines is a
   * defect in the diagram, and discovering it at the moment the subprocess is
   * entered is discovering it at the worst possible time. A call activity whose
   * target is absent is simply not in this map — it stays an opaque single step,
   * which is what it was before subprocess descent existed.
   */
  children: Map<string, ProcessModel>;
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

/**
 * `<folio:no-skill reason="…"/>`, with the reason enforced at LOAD time.
 *
 * Throwing here rather than recording a finding is deliberate: a declaration
 * that silences a check is exactly the thing that must not be able to arrive
 * half-formed. A reasonless exemption that merely warns is one somebody adds
 * to get to green and nobody ever reads.
 */
function noSkillReasonOf(
  ext: { $type: string; reason?: string }[],
  id: string,
): string | undefined {
  const decl = ext.find((v) => v.$type === "folio:no-skill");
  if (!decl) return undefined;
  const reason = decl.reason?.trim();
  if (!reason) {
    throw new Error(
      `${id}: <folio:no-skill/> carries no reason. An exemption with no stated ` +
        `justification cannot be reviewed — say why this step has no implementing skill.`,
    );
  }
  return reason;
}

/**
 * `<folio:fulfilment kinds="…" reason="…"/>`, validated at LOAD time.
 *
 * Three ways to get it wrong, all refused here rather than recorded as a
 * finding, because each produces a declaration that reads as an answer and is
 * not one: no `kinds`, a kind outside {@link ACTOR_KINDS}, and no `reason`.
 * The `kinds` list is whitespace-separated — a BPMN attribute is a string, and
 * a one-element list must look like the same thing as a two-element one.
 */
function fulfilmentOf(
  ext: { $type: string; kinds?: string; reason?: string }[],
  id: string,
): { kinds: ActorKind[]; reason: string } | undefined {
  const decl = ext.find((v) => v.$type === "folio:fulfilment");
  if (!decl) return undefined;
  const kinds = (decl.kinds ?? "").trim().split(/\s+/).filter(Boolean);
  if (kinds.length === 0) {
    throw new Error(
      `${id}: <folio:fulfilment/> names no kinds. Say which of ` +
        `${ACTOR_KINDS.join(", ")} may perform this step.`,
    );
  }
  const unknown = kinds.filter((k) => !(ACTOR_KINDS as readonly string[]).includes(k));
  if (unknown.length) {
    throw new Error(
      `${id}: <folio:fulfilment/> names unknown actor kind(s) ${unknown.join(", ")}. ` +
        `One or more of: ${ACTOR_KINDS.join(", ")}.`,
    );
  }
  const reason = decl.reason?.trim();
  if (!reason) {
    throw new Error(
      `${id}: <folio:fulfilment/> carries no reason. It overrides what the BPMN task ` +
        `type already says about this step, so say why the derived answer is wrong.`,
    );
  }
  return { kinds: kinds as ActorKind[], reason };
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
    values?: {
      $type: string;
      ref?: string;
      op?: string;
      enforcement?: string;
      capture?: string;
      relaxable?: string;
      reason?: string;
      kinds?: string;
    }[];
  };
  calledElement?: string;
  sourceRef?: { id: string };
  targetRef?: { id: string };
  flowElements?: ModdleElement[];
  laneSets?: {
    lanes?: {
      id?: string;
      name?: string;
      flowNodeRef?: { id: string }[];
      extensionElements?: { values?: { $type: string; ref?: string }[] };
    }[];
  }[];
  rootElements?: ModdleElement[];
}

/**
 * Find the process that declares `nodeId`, descending through call activities.
 *
 * Model-only, so it answers for a phase no instance has entered yet. That is the
 * difference between "there is no such step" and "that step is in a phase you
 * have not reached", and a gate that cannot tell them apart sends its reader to
 * look for a typo that is not there.
 */
export function findInModel(
  model: ProcessModel,
  nodeId: string,
): { model: ProcessModel; phase: string[] } | undefined {
  if (model.nodes.has(nodeId)) return { model, phase: [] };
  for (const [call, child] of model.children) {
    const hit = findInModel(child, nodeId);
    if (hit) return { ...hit, phase: [model.nodes.get(call)!.name, ...hit.phase] };
  }
  return undefined;
}

/**
 * Map every `bpmn:process` id declared in a directory to the file declaring it.
 *
 * Read from disk on every load rather than cached. The corpus is twenty small
 * files, and a cache keyed by directory is exactly the thing that makes a test
 * which rewrites a fixture see the previous run's answer.
 */
function processIndex(dir: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".bpmn")).sort()) {
    const xml = readFileSync(join(dir, file), "utf-8");
    for (const m of xml.matchAll(/<bpmn:process\s+id="([^"]+)"/g)) out.set(m[1], join(dir, file));
  }
  return out;
}

export async function loadProcessModel(
  bpmnPath: string,
  /** Process ids already on the load path, so a call-activity cycle is refused. */
  seen: readonly string[] = [],
): Promise<ProcessModel> {
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
  const laneIdOf = new Map<string, string>();
  const roleRefOf = new Map<string, string>();
  const lanes: LaneDef[] = [];
  for (const lane of proc.laneSets?.[0]?.lanes ?? []) {
    const laneId = lane.id ?? lane.name ?? `lane_${lanes.length}`;
    const roleRef = (lane.extensionElements?.values ?? []).find(
      (v) => v.$type === "folio:role" && v.ref,
    )?.ref;
    const nodeIds = (lane.flowNodeRef ?? []).map((r) => r.id);
    lanes.push({ id: laneId, name: lane.name, roleRef, nodes: nodeIds });
    for (const id of nodeIds) {
      if (lane.name) laneOf.set(id, lane.name);
      laneIdOf.set(id, laneId);
      if (roleRef) roleRefOf.set(id, roleRef);
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
      laneId: laneIdOf.get(el.id),
      roleRef: roleRefOf.get(el.id),
      skills: ext.filter((v) => v.$type === "folio:skill" && v.ref).map((v) => v.ref!),
      noSkillReason: noSkillReasonOf(ext, el.id),
      fulfilment: fulfilmentOf(ext, el.id),
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

  // `<folio:log capture="…"/>`, THROWING on a value that is not implemented,
  // exactly as `folio:bean op` does. A diagram that asks for a capture mode
  // the engine does not have must not load and quietly log nothing — that is
  // the two-records divergence in a different costume, and it is worse here
  // because the missing artefact is the record of what happened.
  //
  // `unknown` is deliberately NOT accepted as a declared value. It is what
  // the absence of a declaration resolves to; writing it down would be
  // asserting that nobody could tell, which is not something a diagram is in
  // a position to assert about itself.
  const captureDeclared = procExt.find((v) => v.$type === "folio:log")?.capture;
  if (captureDeclared !== undefined && captureDeclared !== "on" && captureDeclared !== "off") {
    throw new UnsupportedBpmn(
      `${basename(bpmnPath)}: folio:log capture="${captureDeclared}" is not implemented. ` +
        `Use "on" or "off"; omit the element to leave it undetermined.`,
    );
  }
  const logCapture = captureDeclared as "on" | "off" | undefined;

  const startNodes = [...nodes.values()].filter((n) => n.kind === "start").map((n) => n.id);
  if (startNodes.length === 0) {
    throw new UnsupportedBpmn(`${basename(bpmnPath)}: no start event, so nothing can begin`);
  }

  const decisions = await loadDecisions(bpmnPath, nodes, flows);

  // Subprocess descent. A call activity naming a process defined in a sibling
  // file expands into it; one naming a process no file defines stays opaque,
  // because a folio may legitimately call out to a process it does not host.
  // A CYCLE is not legitimate and is refused here rather than at run time:
  // an interpreter that enters A → B → A settles forever.
  const children = new Map<string, ProcessModel>();
  const index = processIndex(dirname(bpmnPath));
  const path = [...seen, proc.id];
  for (const node of nodes.values()) {
    if (!node.calledElement) continue;
    if (path.includes(node.calledElement)) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: ${node.id} calls ${node.calledElement}, which is already ` +
          `on the call path (${path.join(" → ")}). A process cannot contain itself.`,
      );
    }
    const home = index.get(node.calledElement);
    if (!home) continue;
    children.set(node.id, await loadProcessModel(home, path));
  }

  return {
    id: proc.id,
    name: cleanName(proc.name) || proc.id,
    source: bpmnPath,
    dir: dirname(bpmnPath),
    enforcement,
    logCapture,
    nodes,
    flows,
    lanes,
    startNodes,
    decisions,
    children,
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
