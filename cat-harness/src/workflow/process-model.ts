/**
 * Read a `.bpmn` file into a graph the interpreter can walk.
 *
 * The workflow diagrams under `processes/` are already the normative
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
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { loadDecisionTable, possibleOutcomes, type DecisionTable } from "./decision-table.js";
import { ACTOR_KINDS, type ActorKind } from "../../schemas/role-graph.js";
import { CONVENTION_EXT, conventionsInForce, type ConventionScope } from "../../schemas/convention.js";
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

/**
 * The three RACI letters a diagram can declare. `responsible` is absent
 * deliberately — the lane already carries it. See {@link ProcessNode.raci}.
 */
export const RACI_INVOLVEMENTS = ["accountable", "consulted", "informed"] as const;

/**
 * RASCI — RACI plus **S**upportive: a role that does work on the activity
 * without owning the deliverable.
 *
 * ## Why `supportive` is declarable when `responsible` is not
 *
 * The obvious objection, and it was the first answer given to the owner: in a
 * lane-derived model S and R collapse, because a party that does work on the
 * activity is a lane participant. **That is wrong, and the reason is
 * structural.** A BPMN activity sits in EXACTLY ONE lane, so the lane is a
 * discriminator rather than a description: R is the owning lane, S is a
 * declared role that is not it. There is no case where both could apply.
 *
 * Checked against the corpus before this was added (2026-09-23): no activity
 * anywhere declares `involvement="responsible"`, and all declared
 * involvements used the three legal values. So the premise R-is-the-lane holds
 * corpus-wide and `supportive` inherits no ambiguity from it.
 *
 * It also buys expressiveness rather than a letter for its own sake: BPMN
 * **cannot place one activity in two lanes**, so before this there was no way
 * to say "this role also does the work here".
 */
export const RASCI_INVOLVEMENTS = [...RACI_INVOLVEMENTS, "supportive"] as const;

/**
 * The involvement vocabularies a process may declare, by name.
 *
 * **Parallel, not cumulative**, and the distinction is the whole reason this
 * is a choice rather than a superset always in force. `methodology-adoption`:
 * *"Two or more methodologies may answer the same question. Do not blend
 * them… pick one per decision, name it, and follow it."* A process that has
 * chosen four letters has chosen them, and a fifth appearing in it is a defect
 * to report — not a convenience to absorb.
 *
 * The same shape bean `5vo9` needs for adjudication: a declared enum that a
 * step's value is validated against. One mechanism, two users.
 */
export const INVOLVEMENT_VOCABULARIES = {
  raci: RACI_INVOLVEMENTS,
  rasci: RASCI_INVOLVEMENTS,
} as const satisfies Record<string, readonly string[]>;

export type InvolvementVocabulary = keyof typeof INVOLVEMENT_VOCABULARIES;

/** Every letter any vocabulary admits — the union, for typing only. */
export type RaciInvolvement = (typeof RASCI_INVOLVEMENTS)[number];

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
   * `<folio:raci ref="<role>" involvement="accountable|consulted|informed"/>`.
   *
   * **R is NOT here, and that is the point.** A BPMN lane already says who
   * performs an activity — that IS Responsible — so declaring it again
   * would be one fact in two places with nothing asserting they agree, the
   * shape bean `85e8` removed `fallbackRole` for. Read `roleRef` for R.
   *
   * The other three letters have no home in BPMN and are what this adds:
   * *Accountable* (one per activity, the neck on the block), *Consulted*
   * (two-way, before) and *Informed* (one-way, after). Bean `7o7i`.
   *
   * Every value names a **role**, not an actor, for all three letters.
   * `role-model.md`'s rule is that nothing IS a reviewer — somebody acts as
   * one for the duration of a lane — and naming a concrete actor would bind
   * a process to one participant.
   */
  raci: { role: string; involvement: RaciInvolvement }[];
  /**
   * Declared `folio:raci` entries whose `involvement` is NOT in the process's
   * vocabulary — a typo, or a `supportive` in a four-letter process.
   *
   * **These used to be dropped with no trace, and the comment at the filter
   * said `check:raci` reported them. It did not.** The filter runs inside
   * `loadProcessModel`, so by the time `raci-chart.ts` sees a node the
   * rejected entries are gone; there was nothing left to report and nothing
   * ever had. Measured 2026-09-23 — `process-model.ts` is the only reader of
   * the raw element, so no other consumer could have caught them either.
   *
   * They are still **not coerced**, which was the right half of the original
   * decision: a typo read as `informed` would put somebody on a notification
   * list who was meant to be consulted. Not-coerced and not-recorded are
   * different things, and only the first was ever intended.
   */
  raciUnknown: { role: string; involvement: string }[];
  /**
   * The conventions in force HERE — process ∪ lane ∪ activity, in that order.
   *
   * `<folio:convention ref="…"/>`, mirroring `folio:skill` rather than
   * inventing a second binding syntax. Bean `3190`: a convention is context
   * attached to a process, so an agent implementing under CRDM has them and
   * one adjudicating a translation does not.
   *
   * **EMPTY WHEN NOTHING BINDS, and that is the rule.** A default of "all
   * conventions" would be the unconditional prose this replaces, wearing a
   * schema. The scope is carried per entry so a reader can tell a
   * process-wide rule from one attached to this step alone.
   */
  conventions: Array<{ ref: string; scope: ConventionScope }>;
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
   * `<folio:no-call reason="…"/>` — this step names a skill that owns a
   * same-named process, and is deliberately NOT a call activity of it.
   *
   * A call activity runs the called process from its first start event to its
   * end. A step that uses a skill's know-how for one slice of that process —
   * one check out of a review, one deploy out of a three-entry lifecycle, a
   * loop over many previews — would be misdrawn as a call. Same rule as
   * {@link noSkillReason}: the reason is required at load time, so silencing
   * `activity-calls-skill-process` costs a sentence somebody can review.
   */
  noCallReason?: string;
  /**
   * `<folio:judgement reason="…"/>` — this gateway's branch is a JUDGEMENT
   * call, on purpose, and this is why.
   *
   * ## The third state the vocabulary was missing
   *
   * An exclusive gateway either carries `folio:decision` and is computed, or
   * it does not and the caller supplies the outcome. But "no table because
   * this is somebody's call" and "no table because nobody has written one
   * yet" were **indistinguishable from the outside** — exactly the gap
   * {@link noSkillReason} closed for activities, one element type along.
   *
   * It is not hypothetical. Issue #200 §6 classifies all ten of this
   * repository's decision points: four mechanical, six judgement, with
   * reasons. That classification lives in an ISSUE, where nothing reads it
   * and nothing checks it — a claim in prose, which is the failure this
   * repository keeps writing down.
   *
   * ## Why it matters more than the activity case
   *
   * A step with no skill is a documentation gap. A gateway with no table is a
   * point where an LLM decides the branch, and **how many of those there are,
   * and which**, is the question the deterministic-vs-agentic spectrum is
   * about (bean `q0tc`). A mechanism that cannot enumerate its own judgement
   * points cannot answer it.
   *
   * The reason is REQUIRED, the same rule `no-skill` follows: an exemption
   * whose justification is "" is one somebody adds to get to green.
   */
  judgementReason?: string;
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
  /**
   * `<folio:adjudication codes="…"/>` — the activity is a judgement, and these
   * are the answers it may give.
   *
   * The declared enum a recorded outcome is validated against. Its document
   * contract is `folio-assistant-core/schemas/adjudication.ts`; see
   * {@link adjudicationOf} for why the two are not one import.
   */
  adjudication?: { codes: string[] };
  /**
   * `<folio:adjudication accepts="…"/>` — on a CALL ACTIVITY: the answers this
   * caller can act on, checked against the adjudicator inside the process it calls.
   *
   * A different claim from {@link adjudication}, on a different element, which
   * is why it is a different attribute rather than the same one reused. A
   * adjudicator SAYS what may be answered; a caller says what it can HEAR. Bean
   * `bvuk`: six diagrams call `Process_Adjudication` and each asks it a
   * different question, and nothing compared any of them to its three
   * outcomes.
   */
  adjudicationAccepts?: string[];
  /**
   * `<folio:adjudication defers="caller"/>` — this step IS an adjudication and
   * its permitted answers are the CALLER's to declare.
   *
   * Declared rather than inferred from a missing `codes`, because in this
   * corpus an absence is never allowed to read as a decision. `A_Adjudicate`
   * in `adjudication.bpmn` could have simply dropped its enum when bean `bvuk`
   * split the outcome half out; then a step that had lost its marker by
   * accident and one that deferred on purpose would parse identically, and
   * `check:workflow-refs` could not report the callers that still owe an enum.
   */
  adjudicationDefers?: boolean;
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
  /**
   * `<folio:adjudication code="…"/>` — on a branch out of an adjudicated
   * judgement's gateway, WHICH declared answer selects this branch.
   *
   * The flow's `name` is prose for a reader ("the finding stands"); this is
   * the token the recorded outcome carries. They are deliberately not the
   * same field: a label is free to be rewritten for clarity, and a code that
   * moved with it would silently invalidate every record judged under the old
   * one.
   */
  adjudicationCode?: string;
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
  /** `<bpmn:documentation>` on the lane — what the role does IN this diagram. */
  documentation?: string;
  /** `<folio:role ref="…"/>` on the lane, when declared. */
  roleRef?: string;
  /**
   * `<folio:role variable="true"/>` — this lane's PERFORMER VARIES, declared.
   *
   * Bean `ug4r`. A lane binding no role is normally a defect, and
   * `lane-binds-role` says so at severity `major`. But `log-message.bpmn`'s
   * `Actor` lane binds none ON PURPOSE: the point of that sub-process is that
   * whoever is doing the thing being logged is the actor, which is why
   * `log-message` takes `actor` as a required input and why the `logger` role
   * says the skill belongs to whoever is DOING it. A role binding `Actor`
   * would assert the opposite.
   *
   * Before this flag, that decision lived in a prose `_comment` inside
   * `bootstrap/scenarios/roles.json` — which no tool reads, so
   * "deliberately unbound" and "nobody got round to it" were the same thing
   * to every consumer. A declared answer and an absent one are different
   * facts, exactly as an empty `roles` list differs from a missing one.
   *
   * Mutually exclusive with `roleRef`: a lane that names a role has not got a
   * varying performer, and `check-workflow-policy` refuses both together.
   */
  performerVaries?: boolean;
  /** Ids of the flow nodes in this lane. */
  nodes: string[];
}

/**
 * How a declared precondition can be answered — bean `lv3j`.
 *
 * The split is the whole point, and the bean's own wording contains the trap:
 * it offers *"this file was read"* as the checkable example. **It is not.**
 * The engine can check that a file EXISTS; whether an actor READ it is not
 * observable from here, and a check that claims otherwise is a green tick over
 * something nobody verified — which is the failure this element exists to
 * stop, not one it may commit on the way.
 *
 * So the line is drawn between a claim about the WORLD and a claim about the
 * ACTOR, because that is the line observability actually falls on.
 */
export type PreconditionKind =
  /** A claim about the world, which {@link evaluatePrecondition} can answer. */
  | "checkable"
  /** A claim about the actor. Nothing here can observe it; it is RECORDED. */
  | "stated";

/** The checks the engine implements. Adding one is adding a case below. */
export type PreconditionCheck =
  /** `ref` names a path, relative to the repository root, that must exist. */
  | "file-exists";

/** One `<folio:precondition>` on a process. */
export interface Precondition {
  /** Stable id, so a report names WHICH one could not be determined. */
  id: string;
  /** The statement, in the author's words. */
  text: string;
  kind: PreconditionKind;
  /** Present exactly when `kind` is `checkable` — the parser enforces both ways. */
  check?: { kind: PreconditionCheck; ref: string };
}

/**
 * The three states, and the third is the reason this exists.
 *
 * `could-not-determine` is NOT a soft `unsatisfied`. It says the question was
 * asked and has no observable answer, which a reader must be able to tell from
 * a claim that was checked and failed — the same distinction `logCapture`
 * draws for `unknown` twenty lines up, and `ci-health` draws for "could not
 * check".
 */
export type PreconditionVerdict = "satisfied" | "unsatisfied" | "could-not-determine";

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
   * `<folio:involvement vocabulary="…"/>` — which involvement methodology's
   * letters this diagram is written in. Absent in the diagram means `raci`.
   *
   * Exposed so a consumer can say WHICH vocabulary a finding is against:
   * `supportive` is a defect in a four-letter process and correct in a
   * five-letter one, and a report that could not name the vocabulary would be
   * asserting the same value is both.
   */
  involvementVocabulary: InvolvementVocabulary;
  /**
   * `<folio:precondition>` elements on the process — what must hold BEFORE the
   * start event, bean `lv3j`.
   *
   * Empty for every diagram that declares none, which is most of them: a
   * process running inside a harness has already had its actor established.
   * `initialize-harness` is the case that motivated this — it runs BEFORE a
   * harness exists, so nothing established who the Initiator is or what it
   * knows, and the claim lived in documentation prose an engine cannot read.
   */
  preconditions: Precondition[];
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
  /**
   * `<bpmn:documentation>` on the process element itself — what the diagram
   * is FOR. The node-level `documentation` says what one step does; this is
   * the paragraph a reader meets before any step, and `process-documented`
   * in `schemas/kg-qa.ts` is what notices when it is missing.
   */
  documentation?: string;
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
  const bean = ext.find((v) => v.$type === "folio:bean");
  if (bean === undefined) return undefined;

  // AN UNKNOWN ATTRIBUTE IS REFUSED, not ignored — and this is a different
  // check from the one below, which refuses an unknown op VALUE.
  //
  // The gap between them has a measured cost recorded in
  // `processes/bean-lifecycle.bpmn`: a diagram carried
  // `<folio:bean action="create"/>`, the engine reads `op` and never looked at
  // `action`, and "the step silently did nothing for weeks". Nothing could
  // have caught it, because an absent `op` is DOCUMENTED as meaningful —
  // {@link ProcessNode.workPlanOp} says it means the step "touches the plan in
  // some way the tools do not perform automatically". So a misspelling and a
  // deliberate abstention produced the identical parse, and the abstention
  // reading is the one a reader would reach for.
  //
  // Both readings stay available; what is removed is the ambiguity between
  // them. A bare `<folio:bean/>` is still legal and still means abstention.
  //
  // moddle carries an unregistered attribute through as an own enumerable
  // string property beside `$type` — the same behaviour `folio:role variable`
  // relies on — so the check is over own keys, with moddle's own `$`-prefixed
  // internals excluded.
  const unknown = Object.keys(bean).filter((k) => !k.startsWith("$") && k !== "op");
  if (unknown.length > 0) {
    throw new UnsupportedBpmn(
      `${nodeId}: folio:bean carries ${unknown.map((k) => `"${k}"`).join(", ")}, ` +
        `which the engine does not read. The attribute is \`op\` — and an absent op ` +
        `MEANS something ("touches the plan in some way the tools do not perform ` +
        `automatically"), so a misspelling here is indistinguishable from a deliberate ` +
        `abstention. Use op="${[...WORK_PLAN_OPS].join('" | op="')}", or drop the ` +
        `attribute entirely if abstention is what you meant.`,
    );
  }

  const op = bean.op;
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

/** `<folio:no-call reason="…"/>` — same load-time rule as {@link noSkillReasonOf}. */
function noCallReasonOf(ext: { $type: string; reason?: string }[], id: string): string | undefined {
  const decl = ext.find((v) => v.$type === "folio:no-call");
  if (!decl) return undefined;
  const reason = decl.reason?.trim();
  if (!reason) {
    throw new Error(
      `${id}: <folio:no-call/> carries no reason. Say why this step uses the skill's know-how ` +
        `rather than calling its process.`,
    );
  }
  return reason;
}

/**
 * `<folio:judgement reason="…"/>`, with the reason enforced at LOAD time.
 *
 * Refused at load rather than recorded as a finding, for the reason
 * {@link noSkillReasonOf} gives: a declaration that silences a question must
 * not be able to arrive half-formed.
 *
 * **Refused on anything but an exclusive gateway**, and refused ALONGSIDE
 * `folio:decision`. A judgement marker on a computed gateway is a node
 * claiming both that a table decides it and that a person does, and a reader
 * has no way to tell which the author meant — so it is a conflict rather than
 * a preference.
 */
/**
 * `<folio:adjudication codes="a b c"/>` — this activity IS a judgement, and
 * these are the answers it may give.
 *
 * Bean `5vo9`, the owner's *"formalized adjudication process so there is 'use
 * judgement'"*. The contract for the request and outcome DOCUMENTS lives in
 * `folio-assistant-core/schemas/adjudication.ts`; this is the harness half,
 * and the two meet at the data rather than by import — core `needs`
 * cat-harness, so an import from here would run up the layer stack.
 *
 * ## The two refusals, and why the second is the point
 *
 * A bare marker would add a word to a diagram and check nothing. What makes
 * this worth a parser is that it **binds the judgement to who may make it**:
 *
 *  1. Fewer than two codes is not a judgement. One permitted answer is a step
 *     that records assent, and calling it adjudication would let a rubber
 *     stamp inherit a decision's authority.
 *  2. **A mechanical or external actor may not adjudicate.** The owner: *"ONLY
 *     agentic human actor."* `adjudication.bpmn`'s adjudicator step already declares
 *     `<folio:fulfilment kinds="person agent"/>` and says why — *"a mechanical
 *     system may NOT take this step, which is the whole reason the process
 *     exists"* — but nothing tied the two together, so a NEW adjudication step
 *     could omit the fulfilment entirely and no gate would notice. This makes
 *     the marker carry its own precondition.
 *
 * A judgement a `system` actor could perform is a rule, and a rule belongs in
 * a DMN table behind `folio:decision`, which this engine already refuses to
 * let a caller hand-answer.
 */
/**
 * The three attributes `<folio:adjudication/>` carries, by where it sits.
 *
 * `codes` on the adjudicating activity, `code` on a branch out of its gateway,
 * `accepts` on a call activity. They are deliberately three names rather than
 * one overloaded one: an adjudicator declaring its enum, a branch naming the answer
 * that selects it, and a caller stating what it can act on are three different
 * assertions, and a single attribute would let a reader believe any of them.
 */
const ADJUDICATION_ATTRS = {
  /**
   * On a node: an adjudicator's enum, a caller's list of answers it can act
   * on, or `defers="caller"` — an adjudication whose enum belongs to whoever
   * asked.
   */
  node: ["codes", "accepts", "defers"],
  /** On a sequence flow: the one answer that selects this branch. */
  flow: ["code"],
} as const;

/**
 * Read `<folio:adjudication/>` off an element, REFUSING an attribute the
 * engine does not read.
 *
 * The same guard `folio:bean` carries, and for the same measured reason: that
 * element gained a second attribute, a diagram spelled one of them wrong, and
 * "the step silently did nothing for weeks" because an absent attribute was
 * itself meaningful. This element now has three attributes whose absences are
 * all meaningful — an activity with no `codes` is not a judgement, a branch
 * with no `code` opts out, a caller with no `accepts` has not checked — so a
 * misspelling is again indistinguishable from an abstention.
 *
 * Written when `accepts` was added rather than before it, which is the point:
 * one attribute could not be misspelled into another's meaning.
 */
function adjudicationDeclOf(
  ext: { $type: string }[],
  elId: string,
  where: keyof typeof ADJUDICATION_ATTRS = "node",
): { codes?: string; code?: string; accepts?: string; defers?: string } | undefined {
  const decl = ext.find((v) => v.$type === "folio:adjudication") as
    | (Record<string, unknown> & {
        codes?: string;
        code?: string;
        accepts?: string;
        defers?: string;
      })
    | undefined;
  if (!decl) return undefined;
  // Checked PER POSITION, not against the union. `code` is a real attribute
  // on a flow and meaningless on an activity, so a union guard would let
  // `<folio:adjudication code="a b"/>` sit on an adjudicator and be ignored — which
  // is precisely the shape the guard exists to refuse, one element over.
  const allowed = ADJUDICATION_ATTRS[where] as readonly string[];
  const unknown = Object.keys(decl).filter((k) => !k.startsWith("$") && !allowed.includes(k));
  if (unknown.length > 0) {
    throw new UnsupportedBpmn(
      `${elId}: <folio:adjudication/> carries ${unknown.map((k) => `"${k}"`).join(", ")}, ` +
        `which the engine does not read on a ${where}. Here the attribute(s) are ` +
        `${allowed.map((a) => `\`${a}\``).join(", ")} — and each one's ABSENCE ` +
        `means something, so a misspelling reads as a deliberate abstention.`,
    );
  }
  if (decl.codes !== undefined && decl.accepts !== undefined) {
    throw new Error(
      `${elId}: <folio:adjudication/> declares both \`codes\` and \`accepts\`. ` +
        `A step either MAKES a judgement or CALLS one; declaring both says it is ` +
        `its own caller, and nothing could check that against anything.`,
    );
  }
  return decl;
}

/** Split a whitespace-separated code list, refusing a degenerate enum. */
function codeList(raw: string | undefined, elId: string, attr: string, why: string): string[] {
  const codes = (raw ?? "").trim().split(/\s+/).filter(Boolean);
  if (codes.length < 2) {
    throw new Error(
      `${elId}: <folio:adjudication ${attr}="…"/> names ${codes.length} code(s). ${why}`,
    );
  }
  if (new Set(codes).size !== codes.length) {
    throw new Error(
      `${elId}: <folio:adjudication ${attr}="…"/> repeats a code. ` +
        `The outcome could not say which was chosen.`,
    );
  }
  return codes;
}

/**
 * `<folio:adjudication accepts="a b c"/>` on a call activity — the answers
 * this caller can act on.
 *
 * Bean `bvuk`, and the measurement that produced it is worth carrying here
 * because it is the reason this is a declaration rather than an inference.
 * Six diagrams call `Process_Adjudication`; **not one of them branches on the
 * outcome** — every call activity has exactly one outgoing flow, and the
 * called process has exactly one settled end event, so no caller could branch
 * even if it wanted to. The three codes are therefore internal work selectors,
 * not a value the caller reads.
 *
 * So the mismatch could not be found by looking at the caller's own flows:
 * a caller asking "which side wins" and one asking "does this finding stand"
 * have IDENTICAL shapes. Somebody has to state what the caller can act on,
 * and then a machine can compare it.
 *
 * The check itself is in {@link loadProcessModel}'s descent, because it needs
 * the called process — see there for what it refuses and what it leaves alone.
 */
/**
 * `<folio:adjudication defers="caller"/>` — an adjudication whose enum the
 * caller declares. Bean `bvuk`.
 *
 * Carries the same actor restriction as a `codes` adjudication, because it is
 * one: the step is performed, a person or an agent performs it, and a
 * mechanical actor may not. What it does not carry is the enum.
 */
function adjudicationDefersOf(
  el: { id: string; $type: string },
  decl: { defers?: string } | undefined,
  fulfilment: { kinds: ActorKind[]; reason: string } | undefined,
): boolean {
  if (!decl || decl.defers === undefined) return false;
  if (decl.defers !== "caller") {
    throw new Error(
      `${el.id}: <folio:adjudication defers="${decl.defers}"/>. The only value is ` +
        `\`caller\` — an enum can be deferred to whoever asked, and there is nowhere ` +
        `else for it to come from.`,
    );
  }
  if (!(ACTIVITY_TYPES as readonly string[]).includes(el.$type)) {
    throw new Error(
      `${el.id}: <folio:adjudication defers="caller"/> is only meaningful on an activity — ` +
        `somebody performs an adjudication, and ${el.$type} is not performed.`,
    );
  }
  requireAdjudicatorKinds(el.id, fulfilment);
  return true;
}

function adjudicationAcceptsOf(
  ext: { $type: string }[],
  el: { id: string; $type: string },
  decl: { codes?: string; accepts?: string } | undefined,
): string[] | undefined {
  if (!decl || decl.accepts === undefined) return undefined;
  if (el.$type !== "bpmn:CallActivity") {
    throw new Error(
      `${el.id}: <folio:adjudication accepts="…"/> is only meaningful on a call activity — ` +
        `it states what a CALLER can act on, and ${el.$type} calls nothing. ` +
        `A step that makes the judgement itself declares \`codes\`.`,
    );
  }
  return codeList(
    decl.accepts,
    el.id,
    "accepts",
    `A caller that can act on one answer is not consuming a judgement, and the ` +
      `called adjudicator must offer at least two.`,
  );
}

function adjudicationOf(
  ext: { $type: string; codes?: string }[],
  el: { id: string; $type: string },
  fulfilment: { kinds: ActorKind[]; reason: string } | undefined,
  decl: { codes?: string; accepts?: string } | undefined,
): { codes: string[] } | undefined {
  if (!decl || decl.codes === undefined) return undefined;
  if (!(ACTIVITY_TYPES as readonly string[]).includes(el.$type)) {
    throw new Error(
      `${el.id}: <folio:adjudication/> is only meaningful on an activity — ` +
        `somebody performs a judgement, and ${el.$type} is not performed.`,
    );
  }
  const codes = codeList(
    decl.codes,
    el.id,
    "codes",
    `A judgement needs at least two permitted answers — one is assent, and naming ` +
      `it a judgement would give a rubber stamp a decision's authority.`,
  );
  requireAdjudicatorKinds(el.id, fulfilment);
  return { codes };
}

/**
 * Refusal 2, shared by every adjudication marker naming a PERFORMED step.
 *
 * Absent fulfilment is REFUSED rather than defaulted: a step that has not said
 * who may adjudicate has not restricted anyone, and the restriction is the
 * whole reason this process kind exists. Factored out when `defers` arrived,
 * so a third marker cannot be added that quietly skips it.
 */
function requireAdjudicatorKinds(
  elId: string,
  fulfilment: { kinds: ActorKind[]; reason: string } | undefined,
): void {
  if (fulfilment === undefined) {
    throw new Error(
      `${elId}: <folio:adjudication/> with no <folio:fulfilment kinds="…"/>. ` +
        `Say who may adjudicate — an adjudication open to a mechanical actor is a rule, ` +
        `and a rule belongs in a DMN table behind <folio:decision/>.`,
    );
  }
  const forbidden = fulfilment.kinds.filter((k) => k !== "person" && k !== "agent");
  if (forbidden.length > 0) {
    throw new Error(
      `${elId}: <folio:adjudication/> on a step fulfillable by ${forbidden.join(", ")}. ` +
        `Only \`person\` and \`agent\` may adjudicate. If a mechanical actor can decide it, ` +
        `it is computable — use <folio:decision/> and a DMN table.`,
    );
  }
}

function judgementReasonOf(
  ext: { $type: string; reason?: string }[],
  el: { id: string; $type: string },
): string | undefined {
  const decl = ext.find((v) => v.$type === "folio:judgement");
  if (!decl) return undefined;
  if (el.$type !== "bpmn:ExclusiveGateway") {
    throw new Error(
      `${el.id}: <folio:judgement/> is only meaningful on an exclusive gateway — ` +
        `it says who chooses the branch, and ${el.$type} has no branch to choose.`,
    );
  }
  if (ext.some((v) => v.$type === "folio:decision")) {
    throw new Error(
      `${el.id}: carries both <folio:decision/> and <folio:judgement/>. A gateway ` +
        `is computed or it is somebody's call; declaring both leaves a reader ` +
        `unable to tell which the author meant.`,
    );
  }
  const reason = decl.reason?.trim();
  if (!reason) {
    throw new Error(
      `${el.id}: <folio:judgement/> carries no reason. Say WHOSE call this is and ` +
        `why no table can make it — an exemption nobody can review is one ` +
        `somebody added to get to green.`,
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
      involvement?: string;
      /** `<folio:involvement vocabulary="…"/>` on the process. */
      vocabulary?: string;
      /** `<folio:adjudication codes="…"/>` on an activity. */
      codes?: string;
      /** `<folio:adjudication code="…"/>` on a branch out of its gateway. */
      code?: string;
      /** `<folio:adjudication accepts="…"/>` on a call activity. */
      accepts?: string;
      /** `<folio:adjudication defers="caller"/>` on an adjudicating activity. */
      defers?: string;
      relaxable?: string;
      /** `<folio:precondition>` — bean `lv3j`. */
      id?: string;
      kind?: string;
      text?: string;
      check?: string;
      /** bpmn-moddle puts an element's text content here when it has no `text`. */
      $body?: string;
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

/**
 * Answer one precondition, or say that it cannot be answered.
 *
 * A `stated` precondition returns `could-not-determine` on the FIRST line,
 * before anything else is consulted. That ordering is deliberate: there is no
 * path through this function on which a claim about the actor comes back
 * `satisfied`, so the guarantee is structural rather than a rule somebody has
 * to keep remembering.
 *
 * @param root Repository root that a `file-exists` ref resolves against.
 */
export function evaluatePrecondition(p: Precondition, root: string): PreconditionVerdict {
  if (p.kind === "stated") return "could-not-determine";
  // `check` is present exactly when kind is `checkable` — the parser refuses
  // both halves of the other case — but a model built by hand in a test could
  // still violate it, and guessing would be the defect this module is about.
  if (!p.check) return "could-not-determine";
  switch (p.check.kind) {
    case "file-exists":
      return existsSync(join(root, p.check.ref)) ? "satisfied" : "unsatisfied";
  }
}

/**
 * Every precondition of a process, answered.
 *
 * Returned as a list rather than a single verdict on purpose. "The process is
 * ready" is not a thing this can say when two of its three conditions are
 * unobservable, and collapsing them to one boolean is how the third state
 * gets lost — the reader needs to see WHICH held and which nobody could tell.
 */
export function evaluatePreconditions(
  model: Pick<ProcessModel, "preconditions">,
  root: string,
): Array<{ precondition: Precondition; verdict: PreconditionVerdict }> {
  return model.preconditions.map((precondition) => ({
    precondition,
    verdict: evaluatePrecondition(precondition, root),
  }));
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
  const laneConventionsOf = new Map<string, string[]>();
  const lanes: LaneDef[] = [];
  for (const lane of proc.laneSets?.[0]?.lanes ?? []) {
    const laneId = lane.id ?? lane.name ?? `lane_${lanes.length}`;
    const laneExt = lane.extensionElements?.values ?? [];
    const roleEl = laneExt.find((v) => v.$type === "folio:role");
    const roleRef = roleEl?.ref;
    // Moddle carries an unregistered attribute through as a string, which is
    // how `ref` already arrives — so `variable` needs no schema registration.
    // Only the exact string "true" counts: anything else is a typo, and
    // reading a typo as a declaration is how a defect becomes an exemption.
    const performerVaries = (roleEl as { variable?: string } | undefined)?.variable === "true";
    const laneConventions = laneExt
      .filter((v) => v.$type === CONVENTION_EXT && v.ref)
      .map((v) => v.ref!);
    const nodeIds = (lane.flowNodeRef ?? []).map((r) => r.id);
    const laneDoc = (lane as ModdleElement).documentation?.[0]?.text?.replace(/\s+/g, " ").trim() || undefined;
    lanes.push({ id: laneId, name: lane.name, ...(laneDoc ? { documentation: laneDoc } : {}), roleRef, performerVaries, nodes: nodeIds });
    for (const id of nodeIds) {
      if (lane.name) laneOf.set(id, lane.name);
      laneIdOf.set(id, laneId);
      if (roleRef) roleRefOf.set(id, roleRef);
      if (laneConventions.length) laneConventionsOf.set(id, laneConventions);
    }
  }

  // PROCESS-LEVEL conventions: bound on the <bpmn:process> itself, so they
  // reach every step in the diagram without being restated on each one.
  const processConventions = (proc.extensionElements?.values ?? [])
    .filter((v) => v.$type === CONVENTION_EXT && v.ref)
    .map((v) => v.ref!);

  // `<folio:involvement vocabulary="raci|rasci"/>` on the process — which
  // methodology's letters this diagram is written in.
  //
  // THROWS on a name no vocabulary defines, the same way `folio:policy` and
  // `folio:bean op` do. A diagram asking for letters the engine does not have
  // must not load and quietly fall back to four, because the fallback would
  // be indistinguishable from having chosen four.
  //
  // Absent means `raci`, and that default is what makes this change inert for
  // every existing diagram: nothing already written changes meaning, and a
  // process opts in to the fifth letter deliberately.
  const declaredVocabulary = (proc.extensionElements?.values ?? []).find(
    (v) => v.$type === "folio:involvement",
  )?.vocabulary;
  if (declaredVocabulary !== undefined && !(declaredVocabulary in INVOLVEMENT_VOCABULARIES)) {
    throw new UnsupportedBpmn(
      `${basename(bpmnPath)}: folio:involvement vocabulary="${declaredVocabulary}" is not a ` +
        `declared vocabulary. Use one of: ${Object.keys(INVOLVEMENT_VOCABULARIES).join(", ")}.`,
    );
  }
  const involvementVocabulary = (declaredVocabulary ?? "raci") as InvolvementVocabulary;
  const vocabulary = INVOLVEMENT_VOCABULARIES[involvementVocabulary];

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
      // An unrecognised `involvement` is never COERCED — a typo silently read
      // as `informed` would put somebody on a notification list who was meant
      // to be consulted, and the difference between those two is the whole
      // point of the model. It is now also never dropped silently: the
      // rejects land in `raciUnknown` and `check:raci` fails on them.
      raci: ext
        .filter((v) => v.$type === "folio:raci" && v.ref)
        .filter((v) => (vocabulary as readonly string[]).includes(v.involvement ?? ""))
        .map((v) => ({ role: v.ref!, involvement: v.involvement as RaciInvolvement })),
      raciUnknown: ext
        .filter((v) => v.$type === "folio:raci" && v.ref)
        .filter((v) => !(vocabulary as readonly string[]).includes(v.involvement ?? ""))
        .map((v) => ({ role: v.ref!, involvement: v.involvement ?? "(absent)" })),
      conventions: conventionsInForce({
        process: processConventions,
        lane: laneConventionsOf.get(el.id),
        activity: ext.filter((v) => v.$type === CONVENTION_EXT && v.ref).map((v) => v.ref!),
      }),
      noSkillReason: noSkillReasonOf(ext, el.id),
      noCallReason: noCallReasonOf(ext, el.id),
      judgementReason: judgementReasonOf(ext, el),
      fulfilment: fulfilmentOf(ext, el.id),
      adjudication: adjudicationOf(ext, el, fulfilmentOf(ext, el.id), adjudicationDeclOf(ext, el.id)),
      adjudicationAccepts: adjudicationAcceptsOf(ext, el, adjudicationDeclOf(ext, el.id)),
      adjudicationDefers:
        adjudicationDefersOf(el, adjudicationDeclOf(ext, el.id), fulfilmentOf(ext, el.id)) ||
        undefined,
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
    flows.set(el.id, {
      id: el.id,
      name: el.name?.trim() || undefined,
      from,
      to,
      adjudicationCode:
        adjudicationDeclOf(el.extensionElements?.values ?? [], el.id ?? "(flow)", "flow")
          ?.code?.trim() || undefined,
    });
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

  // `<folio:precondition>` — what must hold BEFORE the start event (`lv3j`).
  //
  // Every refusal below exists because the alternative is a precondition that
  // READS as verified and is not. That is worse than the documentation prose
  // this replaces: prose is honestly unchecked, a wrong declaration is
  // dishonestly checked.
  const preconditions: Precondition[] = [];
  for (const v of procExt.filter((e) => e.$type === "folio:precondition")) {
    const id = (v.id as string | undefined)?.trim();
    const text = ((v.text as string | undefined) ?? (v.$body as string | undefined) ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const kind = v.kind as string | undefined;
    const check = v.check as string | undefined;
    const ref = (v.ref as string | undefined)?.trim();

    if (!id) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: a folio:precondition has no id. A report that cannot NAME ` +
          `which precondition it could not determine is not a report.`,
      );
    }
    if (!text) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: folio:precondition ${id} has no text. The statement is the ` +
          `part a person reads; an id alone says a condition exists and not what it is.`,
      );
    }
    // NO DEFAULT. Defaulting to `stated` would let an author who meant to
    // check something forget and get silence; defaulting to `checkable` is
    // worse. The author decides, every time.
    if (kind !== "checkable" && kind !== "stated") {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: folio:precondition ${id} has kind="${kind ?? ""}". ` +
          `Use "checkable" (a claim about the world this engine can evaluate) or "stated" ` +
          `(a claim about the actor, which nothing here can observe). There is no default.`,
      );
    }
    if (kind === "stated" && (check || ref)) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: folio:precondition ${id} is kind="stated" but carries a ` +
          `check. A stated precondition is one nothing can verify — attaching a check to it ` +
          `is either a mislabelled checkable one or a check that does not answer the claim.`,
      );
    }
    if (kind === "checkable") {
      if (check !== "file-exists") {
        throw new UnsupportedBpmn(
          `${basename(bpmnPath)}: folio:precondition ${id} has check="${check ?? ""}", which ` +
            `is not implemented. Use "file-exists", or declare it kind="stated" and say so ` +
            `honestly. A checkable precondition with no check is the thing this refuses.`,
        );
      }
      if (!ref) {
        throw new UnsupportedBpmn(
          `${basename(bpmnPath)}: folio:precondition ${id} has check="file-exists" and no ` +
            `ref. The check needs to know WHAT must exist.`,
        );
      }
    }
    preconditions.push({
      id,
      text,
      kind,
      ...(kind === "checkable" ? { check: { kind: "file-exists" as const, ref: ref! } } : {}),
    });
  }
  const seenIds = new Set<string>();
  for (const p of preconditions) {
    if (seenIds.has(p.id)) {
      throw new UnsupportedBpmn(
        `${basename(bpmnPath)}: two folio:precondition elements share id "${p.id}". ` +
          `A verdict that names an id must name exactly one condition.`,
      );
    }
    seenIds.add(p.id);
  }

  // An adjudicated activity's declared codes must match the branches out of the
  // gateway it feeds — bean `5vo9`.
  //
  // Without this the codes are decoration. The adjudicator step says the answers are
  // `stands scope dispensation` and the gateway draws three branches, and
  // nothing asserts they are the same three: two statements of one fact, free
  // to drift, which is the failure this repository keeps paying for.
  //
  // The comparison is against `<folio:adjudication code="…"/>` on each branch
  // rather than against the flow's NAME. A label is prose a reader may improve
  // ("the finding stands"); the code is the token a recorded outcome carries,
  // and a code that moved when somebody reworded a label would silently
  // invalidate every record judged under the old one.
  //
  // ONLY the direct case is checked: the activity's single outgoing flow
  // reaching an exclusive gateway. A judgement whose answer is recorded rather
  // than branched is legitimate — `A_RecordEntry` is where all three of
  // adjudication.bpmn's converge — so demanding a gateway everywhere would
  // report a false finding on the diagram that motivated this.
  for (const n of nodes.values()) {
    if (n.adjudication === undefined) continue;
    const out = n.outgoing.map((f) => flows.get(f)).filter((f) => f !== undefined);
    if (out.length !== 1) continue;
    const next = nodes.get(out[0]!.to);
    if (next?.kind !== "exclusive") continue;
    const branches = next.outgoing.map((f) => flows.get(f)?.adjudicationCode);
    if (branches.every((c) => c === undefined)) continue; // gateway opts out entirely
    const onBranches = [...new Set(branches.filter((c): c is string => c !== undefined))].sort();
    const declared = [...new Set(n.adjudication.codes)].sort();
    if (onBranches.join("\u0000") !== declared.join("\u0000")) {
      throw new Error(
        `${n.id}: declares codes (${declared.join(", ")}) but ${next.id}'s branches carry ` +
          `(${onBranches.join(", ") || "none"}). A judgement's permitted answers and the branches ` +
          `that act on them must be the same set, or a recorded outcome can name an answer the ` +
          `process cannot take.`,
      );
    }
    const unlabelled = next.outgoing.filter((f) => flows.get(f)?.adjudicationCode === undefined);
    if (unlabelled.length > 0) {
      throw new Error(
        `${next.id}: branch(es) ${unlabelled.join(", ")} carry no <folio:adjudication code="…"/> ` +
          `while their siblings do. A partly-coded gateway reads as complete — either every branch ` +
          `names the answer that selects it, or none does.`,
      );
    }
  }

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
    const child = await loadProcessModel(home, path);
    children.set(node.id, child);
    checkAcceptedCodes(node, child, bpmnPath);
  }

  return {
    id: proc.id,
    name: cleanName(proc.name) || proc.id,
    source: bpmnPath,
    dir: dirname(bpmnPath),
    documentation: (proc as ModdleElement).documentation?.[0]?.text?.replace(/\s+/g, " ").trim() || undefined,
    enforcement,
    involvementVocabulary,
    logCapture,
    preconditions,
    nodes,
    flows,
    lanes,
    startNodes,
    decisions,
    children,
  };
}

/**
 * A caller's `accepts` and the adjudicator's `codes` are ONE fact — bean `bvuk`.
 *
 * ## What it refuses, and what it deliberately does not
 *
 * **Refused:** a declared `accepts` that is not the called adjudicator's enum, and a
 * declared `accepts` on a call into a process that adjudicates nothing. Both are
 * claims a reader would act on that no longer hold.
 *
 * **Not refused — reported instead, by `check:workflow-refs`:** a caller that
 * declares NOTHING. Every one of the six callers in this corpus was in that
 * state when the attribute was added, so refusing absence would mean either
 * failing the corpus on day one or backfilling six declarations nobody had
 * grounds for. Four of the six ask `Process_Adjudication` a question its three
 * QA-criterion outcomes do not obviously answer, and guessing an `accepts` for
 * them would convert an open question into a checked-looking assertion — the
 * `dh4f` shape pointed the wrong way. An undeclared caller is "could not
 * determine", and that is never rendered as clean.
 *
 * **Not checked at all:** a call into a process no file here defines. A folio
 * may legitimately call out, the descent above already leaves those opaque,
 * and a refusal would be this checker reporting on something it cannot see.
 *
 * ## Why set equality rather than a subset
 *
 * A caller accepting a strict subset would be saying it can act on some of the
 * answers the adjudicator may give — which means the others reach it and it does
 * something undefined with them. There is no useful reading of a partial
 * accept, so it is the same defect as a wrong one.
 */
function checkAcceptedCodes(
  node: ProcessNode,
  child: ProcessModel,
  bpmnPath: string,
): void {
  if (node.adjudicationAccepts === undefined) return;
  const adjudicators = [...child.nodes.values()].filter((n) => n.adjudication !== undefined);
  if (adjudicators.length === 0) {
    // A DEFERRING adjudicator gets its own message, because the fix is the
    // opposite one. `accepts` says "I have read your enum"; there is no enum
    // to read, and the caller is the one who has to write it.
    const deferring = [...child.nodes.values()].filter((n) => n.adjudicationDefers);
    if (deferring.length > 0) {
      throw new Error(
        `${basename(bpmnPath)}: ${node.id} declares \`accepts\`, but ${child.id}'s ` +
          `${deferring.map((d) => d.id).join(", ")} defers its enum to the caller. ` +
          `There is nothing to accept — declare <folio:adjudication codes="…"/> here ` +
          `instead, and code the branches out of this step's gateway.`,
      );
    }
    throw new Error(
      `${basename(bpmnPath)}: ${node.id} declares <folio:adjudication accepts="…"/> but ` +
        `${child.id} contains no judgement. Either the called process lost its ` +
        `<folio:adjudication codes="…"/>, or this caller is not calling an adjudication.`,
    );
  }
  if (adjudicators.length > 1) {
    throw new Error(
      `${basename(bpmnPath)}: ${node.id} calls ${child.id}, which adjudicates more than once ` +
        `(${adjudicators.map((j) => j.id).join(", ")}). One \`accepts\` cannot say which of them ` +
        `it answers, so the caller would look checked while naming nothing in particular.`,
    );
  }
  const offered = [...new Set(adjudicators[0]!.adjudication!.codes)].sort();
  const accepted = [...new Set(node.adjudicationAccepts)].sort();
  if (offered.join("\u0000") !== accepted.join("\u0000")) {
    throw new Error(
      `${basename(bpmnPath)}: ${node.id} accepts (${accepted.join(", ")}) but ` +
        `${child.id}'s ${adjudicators[0]!.id} may answer (${offered.join(", ")}). ` +
        `An answer the caller cannot act on still reaches it — see bean \`bvuk\`, ` +
        `where six callers asked one three-outcome process six different questions.`,
    );
  }
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

/**
 * Whether a node is a DECISION: an exclusive gateway with more than one way
 * out. A converging exclusive gateway, a parallel fork and a parallel join
 * decide nothing — the BPMN symbol is their whole meaning — so the
 * documentation-completeness criteria (`gateway-documented`,
 * `gateway-branches-named`) ask nothing of them.
 */
export function isDecision(node: ProcessNode): boolean {
  return node.kind === "exclusive" && node.outgoing.length > 1;
}

/** One way out of a decision, as a reader sees it. */
export interface DecisionBranch {
  flowId: string;
  /** The flow's label — the answer that selects it — if it has one. */
  label?: string;
  /** Id of the node the branch leads to. */
  to: string;
}

/** The ways out of a node, in document order. */
export function branchesOf(model: Pick<ProcessModel, "flows">, node: ProcessNode): DecisionBranch[] {
  return node.outgoing.map((id) => {
    const f = model.flows.get(id);
    return { flowId: id, label: f?.name, to: f?.to ?? "" };
  });
}

/**
 * Branches of a decision a reader cannot tell apart: one with no label, or
 * one whose label (case- and whitespace-insensitively) repeats a sibling's.
 * Every branch in a repeated pair is reported, since neither one is the
 * "right" holder of the label. Empty for a node that is not a decision.
 */
export function indistinctBranches(
  model: Pick<ProcessModel, "flows">,
  node: ProcessNode,
): Array<DecisionBranch & { problem: "unnamed" | "duplicate" }> {
  if (!isDecision(node)) return [];
  const branches = branchesOf(model, node);
  const key = (l: string): string => l.replace(/\s+/g, " ").trim().toLowerCase();
  const seen = new Map<string, number>();
  for (const b of branches) if (b.label) seen.set(key(b.label), (seen.get(key(b.label)) ?? 0) + 1);
  const out: Array<DecisionBranch & { problem: "unnamed" | "duplicate" }> = [];
  for (const b of branches) {
    if (!b.label) out.push({ ...b, problem: "unnamed" });
    else if ((seen.get(key(b.label)) ?? 0) > 1) out.push({ ...b, problem: "duplicate" });
  }
  return out;
}
