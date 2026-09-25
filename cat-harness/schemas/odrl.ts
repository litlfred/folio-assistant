/**
 * W3C ODRL 2.2 policies: what an Actor may do, scoped by Process, Task and Role.
 *
 * Owner, 2026-09-23 (issue #1180), choosing the permission language: *"W3C
 * ODRL 2.2 and W3C PROV-O for logging"*, after asking for *"more granular
 * permissions, can inherit. options for existing json open standards. doensnt
 * necc need to be rooted acyclic graph."* The design is
 * `docs/proposals/odrl-prov-actor-model.md`, and the owner's answers to its
 * open questions: policies are their own **graph kind**; an unauthenticated
 * reader may **visualize and render only**; a relationship engine (OpenFGA)
 * is **later**.
 *
 * ## The subset, and why only this much
 *
 * ODRL is large. This is the part a folio reads today: a Policy (`Set`,
 * `Offer`, `Agreement`) holding `permission` and `prohibition` rules, each
 * naming an `assignee`, an `action`, an optional `target` and optional
 * `constraint`s. Duties, refinements and party collections are ODRL too; none
 * has a reader here yet, so none is accepted. A key outside the subset is
 * refused rather than dropped (`.strict()`), because a rule that silently
 * means less than it says is exactly the failure a permission file must not
 * have.
 *
 * Terms are written as compact IRIs, as ODRL's own JSON-LD context writes
 * them: `odrl:display`, `cat-harness:perform-task`, and a bare action id for one
 * the folio profile declares (`content-authoring`).
 *
 * ## Actions inherit through `includedIn`
 *
 * The folio profile is `skills/permissions/permissions.json`: every action
 * says which broader actions it is `includedIn`, ending at ODRL's own common
 * vocabulary. A permission to a broader action permits every action included
 * in it, which is ODRL's reading of `includedIn`. The graph is walked with a
 * visited set, so it need not be a tree and need not be acyclic (the owner's
 * words), and a cycle cannot hang a decision.
 *
 * @module schemas/odrl
 * @graphNode schema
 *
 * @conformsTo w3c-odrl
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

/**
 * The ODRL 2.2 namespace. A policy here binds it as `@vocab` in an inline
 * context instead of referencing W3C's published `odrl.jsonld`, so the
 * document can be read with no network and every term still expands to the
 * IRI that context gives it.
 */
export const ODRL_NS = "http://www.w3.org/ns/odrl/2/" as const;

/**
 * The ODRL common-vocabulary actions the folio profile hangs off, with ODRL's
 * own `includedIn` for each. Only the ones used are listed; `odrl:use` is the
 * top of this part of ODRL's action graph.
 */
export const ODRL_ACTIONS: Readonly<Record<string, readonly string[]>> = {
  "odrl:use": [],
  "odrl:display": ["odrl:use"],
  "odrl:derive": ["odrl:use"],
  "odrl:annotate": ["odrl:use"],
  "odrl:modify": ["odrl:use"],
  "odrl:translate": ["odrl:use"],
  "odrl:execute": ["odrl:use"],
};

/**
 * The folio profile's `leftOperand`s: the scope of a rule. Absent means
 * everywhere (owner: grants are scoped by Process, Task or Role, and no scope
 * means everywhere).
 */
export const FOLIO_LEFT_OPERANDS = ["cat-harness:process", "cat-harness:task", "cat-harness:role"] as const;
export type FolioLeftOperand = (typeof FOLIO_LEFT_OPERANDS)[number];

/** The operators this subset evaluates: ODRL's `eq`, `neq`, `isAnyOf`, `isNoneOf`. */
export const ODRL_OPERATORS = ["odrl:eq", "odrl:neq", "odrl:isAnyOf", "odrl:isNoneOf"] as const;

/** Anyone, authenticated or not. Owner: such a reader may visualize and render, and nothing else. */
export const ANYONE = "cat-harness:anyone" as const;

/**
 * ODRL's conflict strategies. The folio profile's default when a policy names
 * none is `odrl:prohibit`: the safe reading, stated here as OUR rule rather
 * than claimed as ODRL's.
 */
export const ODRL_CONFLICT = ["odrl:perm", "odrl:prohibit", "odrl:invalid"] as const;
export const FOLIO_DEFAULT_CONFLICT = "odrl:prohibit" as const;

export const OdrlConstraintSchema = z
  .object({
    leftOperand: z.enum(FOLIO_LEFT_OPERANDS),
    operator: z.enum(ODRL_OPERATORS),
    rightOperand: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  })
  .strict()
  .refine(
    (c) => (c.operator === "odrl:isAnyOf" || c.operator === "odrl:isNoneOf") === Array.isArray(c.rightOperand),
    { message: "isAnyOf/isNoneOf take a list; eq/neq take one value" },
  );

export const OdrlRuleSchema = z
  .object({
    /** An actor id, or {@link ANYONE}. */
    assignee: z.string().min(1),
    action: z.string().min(1),
    /** What the rule applies to; absent means the instance's whole graph. */
    target: z.string().min(1).optional(),
    constraint: z.array(OdrlConstraintSchema).optional(),
  })
  .strict();

export const OdrlPolicySchema = z
  .object({
    "@context": z.union([z.string(), z.array(z.unknown()), z.record(z.string(), z.unknown())]),
    "@type": z.enum(["Set", "Offer", "Agreement"]),
    uid: z.string().min(1),
    /** The folio ODRL profile; required, because the actions only mean something against it. */
    profile: z.string().min(1),
    /** Policies whose rules this one inherits: ODRL's `inheritFrom`. */
    inheritFrom: z.array(z.string().min(1)).optional(),
    conflict: z.enum(ODRL_CONFLICT).optional(),
    /** An Agreement names who grants it. A Set does not have to. */
    assigner: z.string().min(1).optional(),
    permission: z.array(OdrlRuleSchema).default([]),
    prohibition: z.array(OdrlRuleSchema).default([]),
  })
  .strict()
  .refine((p) => p["@type"] !== "Agreement" || !!p.assigner, {
    message: "an odrl:Agreement names its assigner",
    path: ["assigner"],
  });

export type OdrlPolicy = z.infer<typeof OdrlPolicySchema>;
export type OdrlRule = z.infer<typeof OdrlRuleSchema>;

/** Where an instance keeps its policies: the `policies` graph kind's directory. */
export const POLICY_DIR = "policies";

/**
 * Every policy in a directory, keyed by `uid`. Absent directory → none. A file
 * that is not a valid policy THROWS, on the rule every declaration here
 * follows: a permission file nobody can read would leave everyone with
 * nothing, silently.
 */
export function readPolicies(dir: string): Map<string, OdrlPolicy> {
  const out = new Map<string, OdrlPolicy>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".jsonld")).sort()) {
    const p = join(dir, f);
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(p, "utf-8"));
    } catch (e) {
      throw new Error(`${p} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (raw && typeof raw === "object") delete (raw as Record<string, unknown>)._comment;
    const parsed = OdrlPolicySchema.safeParse(raw);
    if (!parsed.success) throw new Error(`${p} is not a valid ODRL policy: ${parsed.error.message}`);
    if (out.has(parsed.data.uid)) throw new Error(`${p}: policy uid "${parsed.data.uid}" is declared twice.`);
    out.set(parsed.data.uid, parsed.data);
  }
  return out;
}

/**
 * A policy's rules with everything it inherits, depth-first, each policy once.
 * An `inheritFrom` that names no known policy throws: an inherited grant that
 * silently vanished would be a permission change nobody made.
 */
export function effectiveRules(
  policy: OdrlPolicy,
  all: ReadonlyMap<string, OdrlPolicy>,
): { permission: OdrlRule[]; prohibition: OdrlRule[] } {
  const permission: OdrlRule[] = [];
  const prohibition: OdrlRule[] = [];
  const seen = new Set<string>();
  const visit = (p: OdrlPolicy) => {
    if (seen.has(p.uid)) return;
    seen.add(p.uid);
    permission.push(...p.permission);
    prohibition.push(...p.prohibition);
    for (const uid of p.inheritFrom ?? []) {
      const parent = all.get(uid);
      if (!parent) throw new Error(`policy ${p.uid} inherits from ${uid}, which is not declared`);
      visit(parent);
    }
  };
  visit(policy);
  return { permission, prohibition };
}

/** The action graph: an action id → the actions it is `includedIn`. */
export type ActionGraph = ReadonlyMap<string, readonly string[]>;

/** The folio profile's actions joined to ODRL's. */
export function actionGraph(profile: readonly { id: string; includedIn: readonly string[] }[]): ActionGraph {
  const g = new Map<string, readonly string[]>(Object.entries(ODRL_ACTIONS));
  for (const a of profile) g.set(a.id, a.includedIn);
  return g;
}

/** `action` and every action it is included in, however reached. Cycle-safe. */
export function broaderOrSelf(action: string, graph: ActionGraph): Set<string> {
  const out = new Set<string>();
  const stack = [action];
  while (stack.length) {
    const a = stack.pop()!;
    if (out.has(a)) continue;
    out.add(a);
    for (const up of graph.get(a) ?? []) stack.push(up);
  }
  return out;
}

/** The scope a request is made in. Every field is optional, and an absent one satisfies no constraint on it. */
export interface RequestScope {
  "cat-harness:process"?: string;
  "cat-harness:task"?: string;
  "cat-harness:role"?: string;
  target?: string;
}

function constraintHolds(c: z.infer<typeof OdrlConstraintSchema>, scope: RequestScope): boolean {
  const v = scope[c.leftOperand];
  // A constraint on something the request does not say is NOT met. Reading
  // "unknown process" as "any process" would widen every scoped grant.
  if (v === undefined) return false;
  const rhs = c.rightOperand;
  switch (c.operator) {
    case "odrl:eq":
      return v === rhs;
    case "odrl:neq":
      return v !== rhs;
    case "odrl:isAnyOf":
      return (rhs as string[]).includes(v);
    case "odrl:isNoneOf":
      return !(rhs as string[]).includes(v);
  }
}

function ruleApplies(
  r: OdrlRule,
  who: string | null,
  action: string,
  scope: RequestScope,
  graph: ActionGraph,
): boolean {
  if (r.assignee !== ANYONE && r.assignee !== who) return false;
  if (!broaderOrSelf(action, graph).has(r.action)) return false;
  if (r.target !== undefined && r.target !== scope.target) return false;
  return (r.constraint ?? []).every((c) => constraintHolds(c, scope));
}

/**
 * THREE answers, never two. `unknown` means no rule speaks to the request, and
 * it is never permit: a caller that treats it as permit has built an open
 * door, and one that treats it as deny cannot tell "forbidden" from "nobody
 * has decided", which is the question the QA/QC report asks.
 */
export type Decision = "permit" | "deny" | "unknown";

export interface PermitRequest {
  /** The actor asking, or `null` for an unauthenticated reader. */
  actor: string | null;
  /** The roles the actor may act as (`ActorDef.roles`); empty or absent means unconstrained. */
  actorRoles?: readonly string[];
  action: string;
  scope?: RequestScope;
}

/**
 * May this actor do this, here? Evaluated against one policy and everything it
 * inherits.
 *
 * - A matching prohibition and no matching permission: `deny`.
 * - A matching permission and no prohibition: `permit`, unless the request
 *   names a `cat-harness:role` the actor is not eligible for. Performing a task in a
 *   lane needs both the permission and the role, as `role-model.md` keeps them
 *   apart.
 * - Both: the policy's `conflict` decides (the folio default is
 *   `odrl:prohibit`); `odrl:invalid` voids the policy, which is `deny`.
 * - Neither: `unknown`.
 */
export function permits(
  req: PermitRequest,
  policy: OdrlPolicy,
  all: ReadonlyMap<string, OdrlPolicy>,
  graph: ActionGraph,
): Decision {
  const scope = req.scope ?? {};
  const { permission, prohibition } = effectiveRules(policy, all);
  const permitted = permission.some((r) => ruleApplies(r, req.actor, req.action, scope, graph));
  const prohibited = prohibition.some((r) => ruleApplies(r, req.actor, req.action, scope, graph));
  if (!permitted && !prohibited) return "unknown";
  if (prohibited && permitted) {
    const strategy = policy.conflict ?? FOLIO_DEFAULT_CONFLICT;
    if (strategy !== "odrl:perm") return "deny";
  } else if (prohibited) {
    return "deny";
  }
  const role = scope["cat-harness:role"];
  if (role && req.actorRoles && req.actorRoles.length > 0 && !req.actorRoles.includes(role)) return "deny";
  return "permit";
}

/**
 * Every action an actor holds with NO scope: the old `permissions: [...]`
 * list, derived from the policies instead of stored on the actor. What the
 * existing readers (kg-audit, kg-export, the QA-reviewer gate) consume while
 * they move to {@link permits}.
 */
export function unscopedGrants(
  policy: OdrlPolicy,
  all: ReadonlyMap<string, OdrlPolicy>,
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const r of effectiveRules(policy, all).permission) {
    if (r.assignee === ANYONE || r.target !== undefined || (r.constraint ?? []).length > 0) continue;
    const list = out.get(r.assignee) ?? [];
    if (!list.includes(r.action)) list.push(r.action);
    out.set(r.assignee, list);
  }
  return out;
}

/**
 * Every actor's unscoped grants across every policy in a directory: the
 * `permissions` list the readers of actor files used to find on the actor.
 * `readActors(dir, readPolicyGrants(policiesDir))` restores it for them.
 */
export function readPolicyGrants(dir: string): Map<string, string[]> {
  const all = readPolicies(dir);
  const out = new Map<string, string[]>();
  for (const policy of all.values()) {
    for (const [actor, actions] of unscopedGrants(policy, all)) {
      const list = out.get(actor) ?? [];
      for (const a of actions) if (!list.includes(a)) list.push(a);
      out.set(actor, list);
    }
  }
  return out;
}

/**
 * The action every BPMN task execution asks for (owner, 2026-09-23, issue
 * #1207): one action for every task, narrowed by the `cat-harness:process`,
 * `cat-harness:task` and `cat-harness:role` constraints a rule carries and by
 * its `target`. A task that needs a more specific right says so in the POLICY,
 * as a constrained `perform-task` rule, never in the diagram.
 */
export const PERFORM_TASK = "perform-task" as const;

/**
 * {@link permits} across every policy an instance holds, which is the question
 * a caller actually has: not "does this one policy allow it" but "does
 * anything here speak to it". A `deny` from any policy wins (the folio default
 * conflict strategy is `odrl:prohibit`, and a prohibition in one file must not
 * be outvoted by a permission in another); otherwise any `permit` permits; and
 * silence everywhere stays `unknown`, never permit.
 */
export function decide(
  req: PermitRequest,
  all: ReadonlyMap<string, OdrlPolicy>,
  graph: ActionGraph,
): Decision {
  let permitted = false;
  for (const policy of all.values()) {
    const d = permits(req, policy, all, graph);
    if (d === "deny") return "deny";
    if (d === "permit") permitted = true;
  }
  return permitted ? "permit" : "unknown";
}
