/**
 * The documented graph kinds are exactly the registered ones.
 *
 * Bean `5o3a`. `AGENTS.md` designates `skills/folio-core/directory-conventions.md`
 * the source of truth for graph kinds, and nothing checked it against the
 * registry it describes. The drift is not hypothetical and not rare: it
 * happened once across #266/#267/#268 — every merge textually clean, every
 * check green — and then **again within hours** of being fixed, when a sibling
 * session added `bean-defs` and `workflow-state` and the table stayed at five.
 *
 * ## Both directions are hard, and that is a decision worth stating
 *
 * **Docs naming a kind the registry lacks** is unambiguous: an agent following
 * the skill writes `graph: "workplan"` and the registry refuses it with a list
 * that does not include it. The skill actively misleads.
 *
 * **The registry naming a kind the docs omit** was the arguable one — it makes
 * every new kind ship with its prose, which is a cost. Taken anyway, because it
 * is the direction that actually drifted twice, and because the omission is
 * *silent*: a reader consults the table, finds five kinds, and has no way to
 * learn there are seven. A rule that only catches the loud direction would have
 * caught neither incident.
 *
 * ## Why the first column of the table, not a grep
 *
 * `directory-conventions.md` deliberately NAMES the retired kinds in prose —
 * `workplan` and `process-state` are discussed so nobody re-proposes the split
 * they came from. A grep would read those as live claims. The table is the
 * machine-readable part, so the check parses its first column and the prose is
 * free to say what it needs to.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { defaultGraphKinds } from "../../schemas/agent-harness.js";
import "../../schemas/folio-graph-kind.js"; // registers `folio`

const SKILL = join(import.meta.dir, "../../skills/folio-core/directory-conventions.md");

/** Kind names from the first column of the graph-kinds table. */
function documentedKinds(): string[] {
  const text = readFileSync(SKILL, "utf-8");
  const start = text.indexOf("| kind | declared by |");
  if (start === -1) throw new Error("graph-kinds table not found — the check cannot be vacuously true");
  const rows = text.slice(start).split("\n");
  const out: string[] = [];
  for (const row of rows.slice(2)) {
    if (!row.startsWith("|")) break; // End of table.
    const first = row.split("|")[1]?.trim() ?? "";
    const m = /^`([^`]+)`$/.exec(first);
    if (m !== null) out.push(m[1]);
  }
  return out;
}

describe("graph kinds: docs and registry agree", () => {
  test("the table is found and non-trivial", () => {
    // Without this the two assertions below pass happily over an empty list,
    // which is the shape of failure this whole bean is about.
    expect(documentedKinds().length).toBeGreaterThanOrEqual(5);
  });

  test("every documented kind is registered", () => {
    const registered = new Set(defaultGraphKinds.names());
    const undefined_ = documentedKinds().filter((k) => !registered.has(k));
    expect(undefined_).toEqual([]);
  });

  test("every registered kind is documented", () => {
    // The direction that drifted twice. Silent when it breaks: a reader
    // consults the table and cannot learn that it is short.
    const documented = new Set(documentedKinds());
    const missing = defaultGraphKinds.names().filter((k) => !documented.has(k));
    expect(missing).toEqual([]);
  });
});
