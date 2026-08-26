/**
 * Read a DMN decision table, and evaluate it against facts.
 *
 * Ten exclusive gateways sit across the six BPMN diagrams, and they are not all
 * the same kind of question. `Accept, revise or discard?` is the editor's call
 * and should stay one. `Build green, no sorries?` is not a call at all — it is
 * arithmetic over `proof_status` and `lean_build`, and asking an agent to
 * "decide" it invites a judgement where a computation belongs.
 *
 * A gateway that carries `<folio:decision ref="file.dmn#Decision_Id"/>` has its
 * outcome **computed** from facts the caller supplies, rather than chosen. The
 * agent reports numbers; the table returns the branch. That is determinism in
 * the strict sense, as opposed to a recorded judgement.
 *
 * ## The FEEL subset, and why it is a subset
 *
 * FEEL is a language. This implements the part decision tables in this repo
 * actually use, and **throws on the rest naming the expression it could not
 * read**:
 *
 * | unary test        | meaning                          |
 * |-------------------|----------------------------------|
 * | `-`               | any value                        |
 * | `0`, `"green"`, `true` | equals that literal         |
 * | `> 0`, `>= 3`, `< 10`, `<= 2`, `= 5` | comparison    |
 * | `1, 2, 3`         | one of                           |
 * | `"a", "b"`        | one of                           |
 *
 * Ranges (`[1..5]`), `not(...)`, function calls, date arithmetic: refused. The
 * alternative — evaluating what is understood and quietly treating the rest as
 * "no match" — produces a table that returns an answer and is not the table on
 * the page. This repo has that failure recorded twice in other guises.
 *
 * @module folio-assistant/workflow/decision-table
 */

import { DmnModdle } from "dmn-moddle";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

/** Hit policies whose semantics this evaluator implements. */
const HIT_POLICIES = new Set(["UNIQUE", "FIRST"]);

export interface TableInput {
  /** Human label from the table header. */
  label?: string;
  /** The fact this column reads, e.g. `deferredSorries`. */
  expression: string;
  typeRef?: string;
}

export interface TableRule {
  id: string;
  /** One unary test per input column, in order. */
  when: string[];
  /** One literal per output column, in order. */
  then: string[];
  description?: string;
}

export interface DecisionTable {
  id: string;
  name: string;
  source: string;
  hitPolicy: "UNIQUE" | "FIRST";
  inputs: TableInput[];
  /** Output column names. A single-output table is the common case. */
  outputs: string[];
  rules: TableRule[];
}

export class UnsupportedDmn extends Error {}
export class DecisionError extends Error {}

interface ModdleAny {
  $type?: string;
  id?: string;
  name?: string;
  drgElement?: ModdleAny[];
  decisionLogic?: ModdleAny;
  hitPolicy?: string;
  input?: { label?: string; inputExpression?: { text?: string; typeRef?: string } }[];
  output?: { name?: string; label?: string; typeRef?: string }[];
  rule?: {
    id?: string;
    description?: string;
    inputEntry?: { text?: string }[];
    outputEntry?: { text?: string }[];
  }[];
}

/**
 * Load one decision from a `.dmn` file.
 *
 * `ref` is `path#DecisionId`; the id half is required rather than defaulting to
 * "the first decision", because a file that grows a second decision would
 * silently repoint every gateway that referenced it.
 */
export async function loadDecisionTable(dmnPath: string, decisionId: string): Promise<DecisionTable> {
  const moddle = new DmnModdle();
  const { rootElement, warnings } = await moddle.fromXML(readFileSync(dmnPath, "utf-8"));
  if (warnings.length > 0) {
    throw new UnsupportedDmn(
      `${basename(dmnPath)}: ${warnings.length} parse warning(s) — ` +
        warnings.map((w: unknown) => String(w)).join("; "),
    );
  }
  const defs = rootElement as unknown as ModdleAny;
  const decision = (defs.drgElement ?? []).find(
    (e) => e.$type === "dmn:Decision" && e.id === decisionId,
  );
  if (!decision) {
    const available = (defs.drgElement ?? [])
      .filter((e) => e.$type === "dmn:Decision")
      .map((e) => e.id)
      .join(", ");
    throw new UnsupportedDmn(
      `${basename(dmnPath)} has no decision "${decisionId}". Available: ${available || "none"}`,
    );
  }

  const table = decision.decisionLogic;
  if (!table || table.$type !== "dmn:DecisionTable") {
    throw new UnsupportedDmn(
      `${decisionId} in ${basename(dmnPath)} is not a decision table ` +
        `(${table?.$type ?? "no decision logic"}). Only decision tables are implemented.`,
    );
  }

  // DMN's default hit policy is UNIQUE when the attribute is absent.
  const hitPolicy = (table.hitPolicy ?? "UNIQUE").toUpperCase();
  if (!HIT_POLICIES.has(hitPolicy)) {
    throw new UnsupportedDmn(
      `${decisionId}: hit policy ${hitPolicy} is not implemented. ` +
        `Supported: ${[...HIT_POLICIES].join(", ")}.`,
    );
  }

  const inputs: TableInput[] = (table.input ?? []).map((i, n) => {
    const expression = i.inputExpression?.text?.trim();
    if (!expression) {
      throw new UnsupportedDmn(`${decisionId}: input column ${n + 1} has no input expression`);
    }
    return { label: i.label, expression, typeRef: i.inputExpression?.typeRef };
  });

  const outputs = (table.output ?? []).map((o, n) => o.name ?? o.label ?? `output${n + 1}`);
  if (outputs.length === 0) throw new UnsupportedDmn(`${decisionId}: no output column`);

  const rules: TableRule[] = (table.rule ?? []).map((r, n) => {
    const when = (r.inputEntry ?? []).map((e) => (e.text ?? "").trim());
    const then = (r.outputEntry ?? []).map((e) => (e.text ?? "").trim());
    if (when.length !== inputs.length || then.length !== outputs.length) {
      throw new UnsupportedDmn(
        `${decisionId}: rule ${n + 1} has ${when.length} input entries and ` +
          `${then.length} output entries; the table has ${inputs.length} inputs ` +
          `and ${outputs.length} outputs`,
      );
    }
    return { id: r.id ?? `rule-${n + 1}`, when, then, description: r.description };
  });
  if (rules.length === 0) throw new UnsupportedDmn(`${decisionId}: no rules`);

  return {
    id: decisionId,
    name: decision.name ?? decisionId,
    source: dmnPath,
    hitPolicy: hitPolicy as "UNIQUE" | "FIRST",
    inputs,
    outputs,
    rules,
  };
}

// ── the FEEL subset ──────────────────────────────────────────────

/** Parse a DMN literal: a quoted string, a number, or a boolean. */
function literal(text: string): string | number | boolean {
  const t = text.trim();
  if (/^".*"$/.test(t)) return t.slice(1, -1);
  if (t === "true") return true;
  if (t === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  throw new UnsupportedDmn(
    `cannot read \`${text}\` as a DMN literal — expected a quoted string, a number, or true/false`,
  );
}

/** Split on commas that are not inside quotes. */
function splitTop(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of text) {
    if (ch === '"') inQuotes = !inQuotes;
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/**
 * Does `value` satisfy the unary test `test`?
 *
 * Throws rather than returning false when the test cannot be read, so an
 * expression this evaluator does not implement can never be mistaken for a
 * rule that simply did not match.
 */
export function unaryTest(test: string, value: unknown): boolean {
  const t = test.trim();
  if (t === "" || t === "-") return true;

  const parts = splitTop(t);
  if (parts.length > 1) return parts.some((p) => unaryTest(p, value));

  const cmp = /^(<=|>=|<|>|=)\s*(.+)$/.exec(t);
  if (cmp) {
    const want = literal(cmp[2]);
    if (cmp[1] === "=") return value === want;
    if (typeof value !== "number" || typeof want !== "number") {
      throw new DecisionError(
        `\`${t}\` compares numbers, but the fact is ${JSON.stringify(value)}`,
      );
    }
    switch (cmp[1]) {
      case "<":
        return value < want;
      case "<=":
        return value <= want;
      case ">":
        return value > want;
      default:
        return value >= want;
    }
  }

  if (/^\[|^\]|\.\./.test(t) || /^not\s*\(/.test(t) || /\(/.test(t)) {
    throw new UnsupportedDmn(
      `unary test \`${t}\` uses FEEL this evaluator does not implement ` +
        `(ranges, not(), function calls). Supported: -, a literal, a comparison, ` +
        `or a comma-separated list.`,
    );
  }

  return value === literal(t);
}

export interface DecisionResult {
  /** The single output value, for the common single-output table. */
  outcome: string | number | boolean;
  /** Every output column, keyed by name. */
  outputs: Record<string, string | number | boolean>;
  /** Which rule fired, for the instance history. */
  rule: string;
  ruleDescription?: string;
}

/**
 * Evaluate a table against facts.
 *
 * A fact the table names but the caller did not supply is an error, not a
 * `false`. A gate that answers on data it never received is the failure this
 * whole mechanism exists to remove.
 */
export function evaluate(table: DecisionTable, facts: Record<string, unknown>): DecisionResult {
  for (const input of table.inputs) {
    if (!(input.expression in facts)) {
      throw new DecisionError(
        `${table.name} needs the fact \`${input.expression}\`` +
          (input.label ? ` (${input.label})` : "") +
          `, which was not supplied. Facts given: ` +
          `${Object.keys(facts).join(", ") || "none"}.`,
      );
    }
  }

  const matched = table.rules.filter((rule) =>
    rule.when.every((test, i) => unaryTest(test, facts[table.inputs[i].expression])),
  );

  if (matched.length === 0) {
    throw new DecisionError(
      `${table.name} matched no rule for ` +
        `${JSON.stringify(pick(facts, table.inputs.map((i) => i.expression)))}. ` +
        `A decision table with a gap is a gate that cannot answer — add a ` +
        `catch-all rule.`,
    );
  }
  if (table.hitPolicy === "UNIQUE" && matched.length > 1) {
    throw new DecisionError(
      `${table.name} is UNIQUE but ${matched.length} rules matched ` +
        `(${matched.map((m) => m.id).join(", ")}). Either the rules overlap or ` +
        `the hit policy should be FIRST.`,
    );
  }

  const rule = matched[0];
  const outputs: Record<string, string | number | boolean> = {};
  table.outputs.forEach((name, i) => {
    outputs[name] = literal(rule.then[i]);
  });
  return {
    outcome: outputs[table.outputs[0]],
    outputs,
    rule: rule.id,
    ruleDescription: rule.description,
  };
}

/**
 * Every distinct value the table's first output column can take.
 *
 * Read straight off the rules rather than by evaluating them: the caller wants
 * to know what the table *could* return, which is not a question about any
 * particular set of facts.
 */
export function possibleOutcomes(table: DecisionTable): string[] {
  return [...new Set(table.rules.map((r) => String(literal(r.then[0]))))];
}

function pick(o: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
}
