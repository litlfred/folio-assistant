/**
 * Agent memory survives the round trip, and the generator never eats a log.
 *
 * The two failures worth gating are both silent. A parse that drops an entry
 * leaves an agent quietly less informed than its file says it is; a splice
 * that overruns its markers deletes the `## Session log` the agent wrote
 * itself. Neither shows up as an error, and both are invisible in a diff that
 * nobody reads because "it's generated".
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MemoryNodeSchema } from "../../schemas/memory.js";
import {
  AGENT_MEMORY_DIR,
  BEGIN,
  END,
  agentNames,
  parseMemoryFile,
  readMemoryNodes,
  renderEntries,
  slugify,
  spliceRegion,
  syncAll,
} from "../agent-memory.js";

describe("the corpus", () => {
  test("there are memory nodes to check — otherwise this proves nothing", () => {
    expect(readMemoryNodes().length).toBeGreaterThan(20);
  });

  test("every node validates, and none is a baseline without provenance", () => {
    // `readMemoryNodes` throws on an invalid node, so reaching here is the
    // assertion; parsing again makes the failure name the schema rather than
    // the loader.
    for (const n of readMemoryNodes()) {
      expect(MemoryNodeSchema.safeParse(n).success).toBe(true);
    }
  });

  test("ids are unique — overlay resolves by id, so a collision hides an entry", () => {
    const ids = readMemoryNodes().map((n) => n.id);
    expect(ids.length).toBe(new Set(ids).size);
  });

  test("a shared SUMMARY is allowed, and the corpus really has one", () => {
    // `content-pipeline-navigator` and `platform-boundary-guard` both carry
    // "re-measure, do not quote" over DISJOINT bodies. Deriving ids from
    // summaries would have collided them and dropped one; this pins that the
    // corpus still exercises the case.
    const summaries = readMemoryNodes().map((n) => n.summary);
    expect(summaries.length).toBeGreaterThan(new Set(summaries).size);
  });

  test("every agent's file is assembled and current", () => {
    for (const r of syncAll(false)) {
      expect({ agent: r.agent, state: r.state }).toEqual({ agent: r.agent, state: "unchanged" });
    }
  });

  test("no agent's file overruns the harness's 200-line injection budget", () => {
    // Past 200 lines the harness silently drops the rest, so an over-long file
    // is memory that exists on disk and reaches nobody.
    for (const r of syncAll(false)) {
      expect({ agent: r.agent, over: r.lines > 200 }).toEqual({ agent: r.agent, over: false });
    }
  });
});

describe("round trip — no entry is lost", () => {
  test("every entry in every generated file parses back to a node", () => {
    const byId = new Map(readMemoryNodes().map((n) => [n.summary, n]));
    for (const agent of agentNames()) {
      const text = readFileSync(join(AGENT_MEMORY_DIR, agent, "MEMORY.md"), "utf8");
      const parsed = parseMemoryFile(text);
      expect(parsed.length).toBeGreaterThan(0);
      for (const e of parsed) {
        expect(`${agent}: ${e.summary}`).toBe(`${agent}: ${byId.get(e.summary)?.summary}`);
      }
    }
  });
});

describe("the parse keeps non-entries out", () => {
  const FILE = [
    "# a — memory",
    "preamble",
    "---",
    "## STABLE — one",
    "body one",
    "",
    "## TRAP — two",
    "body two",
    "---",
    "## Session log",
    "- did a thing",
  ].join("\n");

  test("only labelled headings are entries", () => {
    expect(parseMemoryFile(FILE).map((e) => e.summary)).toEqual(["one", "two"]);
  });

  test("the session log is NOT swallowed into the last entry's body", () => {
    // Without the non-entry-heading guard, "## Session log\n- did a thing"
    // lands in TRAP two's comment and is then written back INSIDE the markers
    // — the generator destroying the log it was supposed to leave alone.
    const two = parseMemoryFile(FILE).find((e) => e.summary === "two");
    expect(two?.comment).toBe("body two");
  });

  test("a label that is not one of the three is not an entry", () => {
    expect(parseMemoryFile("## NOTES — hello\nbody")).toEqual([]);
  });
});

describe("splice writes only between the markers", () => {
  const file = `head\n${BEGIN}\nold\n${END}\ntail\n## Session log\n- kept`;

  test("everything outside the region survives verbatim", () => {
    const out = spliceRegion(file, "new")!;
    expect(out.startsWith("head\n")).toBe(true);
    expect(out).toContain("## Session log\n- kept");
    expect(out).toContain("new");
    expect(out).not.toContain("old");
  });

  test("a file with NO markers is refused, not rewritten", () => {
    // Third state. Writing markers into a file that lacks them would mean this
    // tool deciding where an author's generated region starts.
    expect(spliceRegion("no markers here", "new")).toBeUndefined();
  });

  test("markers in the wrong order are refused too", () => {
    expect(spliceRegion(`${END}\nx\n${BEGIN}`, "new")).toBeUndefined();
  });
});

describe("rendering", () => {
  test("entries come out STABLE, then TRAP, then BASELINE", () => {
    const nodes = readMemoryNodes();
    const out = renderEntries(nodes);
    const order = [...out.matchAll(/^## (STABLE|TRAP|BASELINE) —/gm)].map((m) => m[1]);
    const rank = { STABLE: 0, TRAP: 1, BASELINE: 2 } as Record<string, number>;
    expect(order.map((o) => rank[o!])).toEqual([...order.map((o) => rank[o!])].sort());
  });

  test("slugify is stable and url-safe", () => {
    expect(slugify("`uses[]` is EDITORIAL, and immediate-neighbours only")).toBe(
      "uses-is-editorial-and-immediate-neighbours-only",
    );
  });
});
