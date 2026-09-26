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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MEMORY_SCHEMA_TAG,
  MemoryNodeSchema,
  memoryForAgent,
  memoryForRoles,
} from "../../schemas/memory.js";
import { EMPTY_NOTE_TAGS } from "../../schemas/carried-note.js";
import {
  AGENT_MEMORY_DIR,
  BEGIN,
  END,
  agentNames,
  droppedEntryReport,
  entriesPastBudget,
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

  test("no memory ENTRY falls past the harness's 200-line injection budget", () => {
    // Deliberately not `lines > 200`, which is what this asserted first and is
    // the wrong question. The harness injects the FIRST 200 lines, so a long
    // file loses its TAIL — the hand-written `## Session log`, which costs
    // nothing. An ENTRY past the line is memory the agent will never see.
    //
    // Measured 2026-09-19: a sibling's 37-line TRAP took
    // `content-pipeline-navigator` 13 lines over, losing only session-log
    // lines. A total-lines gate would have failed the build over that and
    // taught the next agent to write less down.
    for (const r of syncAll(false)) {
      expect({ agent: r.agent, lost: r.overflowEntries }).toEqual({ agent: r.agent, lost: [] });
    }
  });

  test("the overflow check can actually fire", () => {
    // A gate that cannot fail is not a gate. `entriesPastBudget` is exported so
    // this can be shown against a file it controls, rather than waiting for the
    // corpus to grow into the failure.
    const file = ["x", ...Array(210).fill("y"), "## TRAP — dropped"].join("\n");
    expect(entriesPastBudget(file)).toEqual(["TRAP — dropped"]);
    expect(entriesPastBudget(file, 1000)).toEqual([]);
  });
});

describe("the role axis discriminates — memoryForRoles is not dead code", () => {
  test("every live entry carries a lane, so untagged has no instances", () => {
    // Both subagents are declared actors now, and every non-archived entry is
    // tagged with the lane that reads it. That makes the "untagged reaches
    // everybody" clause a rule with nothing under it — worth pinning, because
    // an untagged entry added later would silently go to EVERY agent in a
    // corpus where nothing else does.
    const live = readMemoryNodes().filter((n) => !n.archived);
    const untagged = live.filter((n) => n.tags.roles.length === 0);
    expect(untagged.map((n) => n.id)).toEqual([]);
  });

  test("a CI lane sees the CI entries; another lane does not", () => {
    // The owner, 2026-09-19: "ci watchers are agents/mechanical roles that are
    // part of the CI process." `roles.json` already carried `build-pipeline`
    // and `validation-pipeline`, both `actorKind: "system"`, and the
    // `ci-pipeline` actor already took both — so the lane was declared before
    // the watcher was written, and an earlier comment of mine claiming no role
    // fit was simply wrong. Bean `29ij`.
    const nodes = readMemoryNodes();
    const ci = memoryForRoles(nodes, ["build-pipeline"]);
    const other = memoryForRoles(nodes, ["reviewer"]);
    expect(ci.length).toBeGreaterThan(other.length);
    // An untagged entry reaches everybody, so the difference is exactly the
    // tagged ones -- not an assertion that other lanes see nothing.
    expect(ci.length - other.length).toBe(
      nodes.filter((n) => n.tags.roles.includes("build-pipeline")).length,
    );
  });

  test("role tags do not change what an AGENT is handed", () => {
    // Generation goes through `memoryForAgent`, so tagging a lane is additive
    // and must not churn the generated files. If this breaks, the two axes
    // have been wired together -- which is the composition mistake the role
    // model already paid for once.
    for (const r of syncAll(false)) {
      expect({ agent: r.agent, state: r.state }).toEqual({ agent: r.agent, state: "unchanged" });
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

describe("archived entries are retained but injected nowhere", () => {
  test("the corpus has archived entries, and they reach no agent", () => {
    // The third state between "reaches everybody" and "deleted". Retiring
    // `content-pipeline-navigator` created seven of these: its sole readers,
    // with no remaining agent that had budget for them.
    const nodes = readMemoryNodes();
    const archived = nodes.filter((n) => n.archived);
    expect(archived.length).toBeGreaterThan(0);
    for (const agent of agentNames()) {
      const got = memoryForAgent(nodes, agent).filter((n) => n.archived);
      expect({ agent, archived: got.map((n) => n.id) }).toEqual({ agent, archived: [] });
    }
  });

  test("archived beats UNTAGGED, which is the ordering that matters", () => {
    // An archived entry carries no agent tag once its agent is gone, so the
    // "untagged reaches everybody" clause would hand it to every agent if it
    // were checked first. Measured: removing the retired agent's name from two
    // entries without archiving them made both untagged, which pushed
    // `platform-boundary-guard` 39 lines over its injection budget and dropped
    // one of its own TRAPs past the line.
    const base = {
      id: "a", summary: "s", comment: "c", createdAt: "2026-09-19",
      tags: EMPTY_NOTE_TAGS, label: "stable" as const, $schema: MEMORY_SCHEMA_TAG,
    };
    const untagged = MemoryNodeSchema.parse(base);
    const archived = MemoryNodeSchema.parse({ ...base, id: "b", archived: true });
    expect(memoryForAgent([untagged, archived], "anyone").map((n) => n.id)).toEqual(["a"]);
  });

  test("the ordering holds through the READER, for both front-matter spellings", () => {
    // The test above pins `memoryForAgent`, which is handed an already-parsed
    // node. The path an author actually takes is the front matter, and there
    // the flag is a STRING COMPARE -- `fm["archived"] === "true"` -- so the
    // two spellings the corpus uses (`archived: true` and `archived: "true"`)
    // must both survive the read. If one did not, the node would come back
    // live AND untagged, and the untagged clause would hand it to every agent:
    // the exact inversion archiving exists to prevent, arriving as a widened
    // blast radius rather than as a missing entry.
    const dir = mkdtempSync(join(tmpdir(), "memory-archived-"));
    try {
      const node = (id: string, archived: string): string =>
        `---\n$schema: ${MEMORY_SCHEMA_TAG}\nid: ${id}\nlabel: stable\n` +
        `summary: "${id}"\ncreatedAt: 2026-09-19\narchived: ${archived}\nagents:\n---\nbody\n`;
      writeFileSync(join(dir, "bare.md"), node("bare", "true"));
      writeFileSync(join(dir, "quoted.md"), node("quoted", '"true"'));
      writeFileSync(
        join(dir, "live.md"),
        `---\n$schema: ${MEMORY_SCHEMA_TAG}\nid: live\nlabel: stable\n` +
          `summary: "live"\ncreatedAt: 2026-09-19\nagents:\n---\nbody\n`,
      );

      const nodes = readMemoryNodes(dir);
      expect(nodes.filter((n) => n.archived).map((n) => n.id).sort()).toEqual(["bare", "quoted"]);
      // All three are untagged, so only archiving can keep two of them out.
      expect(nodes.every((n) => n.tags.references.length === 0)).toBe(true);
      expect(memoryForAgent(nodes, "anyone").map((n) => n.id)).toEqual(["live"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("a spelling the reader does not understand is REFUSED, not silently dropped", () => {
    // The test above pins the two spellings that work. This pins what happens
    // to the ones that do not, and the answer has to be an error rather than
    // absence.
    //
    // `archived` is `z.boolean().optional()`, so the schema cannot catch this:
    // an unrecognised value was COERCED AWAY before `safeParse` ever saw the
    // node, leaving the field absent -- which is valid. The node then came
    // back live, and because an archived entry has typically lost its `agents`
    // tag, the untagged clause handed it to EVERY agent. Measured on `main` at
    // `e94288562`: of `true`, `TRUE`, `True` and `yes`, three leaked to an
    // agent they were never tagged for.
    //
    // The two directions are not symmetric, which is why this refuses rather
    // than guessing. Too loose and an entry an author meant to keep goes
    // missing -- visible, and the agent's own work shows it. Too strict, as it
    // was, and the entry goes to everybody: a widened blast radius that
    // nothing reports on and no budget check counts.
    const dir = mkdtempSync(join(tmpdir(), "memory-archived-bad-"));
    try {
      writeFileSync(
        join(dir, "typo.md"),
        `---\n$schema: ${MEMORY_SCHEMA_TAG}\nid: typo\nlabel: stable\n` +
          `summary: "typo"\ncreatedAt: 2026-09-19\narchived: probably\nagents:\n---\nbody\n`,
      );
      expect(() => readMemoryNodes(dir)).toThrow(/archived/);
      // The message has to name the value and the file, or the author cannot
      // act on it.
      expect(() => readMemoryNodes(dir)).toThrow(/probably/);
      expect(() => readMemoryNodes(dir)).toThrow(/typo\.md/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("every YAML boolean spelling of archived is understood, in both cases", () => {
    // Accepting only `true` would fix the spellings somebody thought of. An
    // author writing YAML may reasonably write any of these, and each is
    // unambiguously the same boolean.
    const dir = mkdtempSync(join(tmpdir(), "memory-archived-yaml-"));
    try {
      const node = (id: string, archived: string): string =>
        `---\n$schema: ${MEMORY_SCHEMA_TAG}\nid: ${id}\nlabel: stable\n` +
        `summary: "${id}"\ncreatedAt: 2026-09-19\narchived: ${archived}\nagents:\n---\nbody\n`;
      const truthy = ["true", "True", "TRUE", "yes", "Yes", "on", '"true"'];
      const falsy = ["false", "False", "FALSE", "no", "No", "off"];
      truthy.forEach((v, i) => writeFileSync(join(dir, `t${i}.md`), node(`t${i}`, v)));
      falsy.forEach((v, i) => writeFileSync(join(dir, `f${i}.md`), node(`f${i}`, v)));

      const nodes = readMemoryNodes(dir);
      expect(nodes.filter((n) => n.archived).map((n) => n.id).sort()).toEqual(
        truthy.map((_, i) => `t${i}`),
      );
      // A FALSE spelling is not archived, and must not leak either way: it is
      // a live node, so it reaches an untagged reader deliberately.
      const live = memoryForAgent(nodes, "anyone").map((n) => n.id).sort();
      expect(live).toEqual(falsy.map((_, i) => `f${i}`));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the budget check sees a TRUNCATED entry, not just a late heading", () => {
  // Bean `g1ph`. Heading position alone let a real truncation through:
  // after evidence moved into detail files the region ended at line 209, so
  // the last entry's body ran nine lines past the cut while its heading sat
  // comfortably inside — and the check returned nothing. A truncated entry is
  // worse than a dropped one, because it still looks complete to the agent.
  const filler = (n: number): string => "x\n".repeat(n);

  test("a region ending past the budget names the last entry", () => {
    const f = `## TRAP — a thing\n${filler(250)}${END}\n`;
    const past = entriesPastBudget(f);
    expect(past).toHaveLength(1);
    expect(past[0]).toContain("a thing");
    expect(past[0]).toContain("truncated");
  });

  test("a region ending inside the budget is silent", () => {
    expect(entriesPastBudget(`## TRAP — a thing\n${filler(10)}${END}\n`)).toEqual([]);
  });

  test("a heading past the budget still wins — it is the more specific report", () => {
    const f = `${filler(210)}## TRAP — late one\n${END}\n`;
    expect(entriesPastBudget(f)[0]).toContain("late one");
    expect(entriesPastBudget(f)[0]).not.toContain("truncated");
  });

  test("this repo's own generated files are whole", () => {
    // The live assertion, not a fixture: every agent's region must END inside
    // the budget, which is what the entries-past-heading check never asked.
    for (const r of syncAll(false)) {
      if (r.state === "missing" || r.state === "no-markers") continue;
      expect(r.overflowEntries).toEqual([]);
    }
  });
});

describe("the dropped-entry gate", () => {
  // `entriesPastBudget` measures; this decides whether the build stops. They
  // were one thing inside `import.meta.main` and so the DECISION was never
  // reachable from a test — only its input was.
  test("nothing dropped is not a failure", () => {
    expect(droppedEntryReport([])).toBeNull();
  });

  test("a long file whose overflow is only the session log is not a failure", () => {
    // The state of `platform-boundary-guard` on `main`: over 200 lines, but
    // every entry lands inside the cut. Gating on line count instead of on
    // dropped entries would make this red for a reason nobody should act on.
    expect(droppedEntryReport([{ agent: "platform-boundary-guard", entries: [] }])).toBeNull();
  });

  test("a dropped entry is named, counted, and given a way out", () => {
    const report = droppedEntryReport([
      { agent: "platform-boundary-guard", entries: ["TRAP — a", "TRAP — b"] },
    ]);
    expect(report).toContain("platform-boundary-guard: 2 dropped");
    expect(report).toContain("TRAP — a; TRAP — b");
    // The remedy matters as much as the finding: the tempting "fix" is to let
    // the last entry fall off the end, which is the defect, not the cure.
    expect(report).toContain("archived: true");
    expect(report).toContain("Do not fix this by letting the last entry fall off the end");
  });

  test("every affected agent gets its own row", () => {
    const report = droppedEntryReport([
      { agent: "one", entries: ["TRAP — x"] },
      { agent: "two", entries: ["TRAP — y"] },
    ]);
    expect(report).toContain("one: 1 dropped");
    expect(report).toContain("two: 1 dropped");
  });
});
