/**
 * Agent memory survives the round trip, and the generator never eats a log.
 *
 * The two failures worth gating are both silent. A parse that drops an entry
 * leaves an agent quietly less informed than its file says it is; a splice
 * that overruns its markers deletes the `## Session log` the agent wrote
 * itself. Neither shows up as an error, and both are invisible in a diff that
 * nobody reads because "it's generated".
 *
 * The tests here that read the aggregate repository's own root (the
 * root-declared `memory/` graph and the generated `.claude/agent-memory/`
 * files) live in
 * `test/agent-memory-repo-root.test.ts` (bean
 * `ho66`): standing alone, cat-harness has no such root to read.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MEMORY_SCHEMA_TAG,
  MemoryNodeSchema,
  memoryForAgent,
} from "../../schemas/memory.js";
import { EMPTY_NOTE_TAGS } from "../../schemas/carried-note.js";
import {
  BEGIN,
  END,
  droppedEntryReport,
  entriesPastBudget,
  parseMemoryFile,
  readMemoryNodes,
  slugify,
  spliceRegion,
} from "../agent-memory.js";

describe("the corpus", () => {

  test("the overflow check can actually fire", () => {
    // A gate that cannot fail is not a gate. `entriesPastBudget` is exported so
    // this can be shown against a file it controls, rather than waiting for the
    // corpus to grow into the failure.
    const file = ["x", ...Array(210).fill("y"), "## TRAP — dropped"].join("\n");
    expect(entriesPastBudget(file)).toEqual(["TRAP — dropped"]);
    expect(entriesPastBudget(file, 1000)).toEqual([]);
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

  test("slugify is stable and url-safe", () => {
    expect(slugify("`uses[]` is EDITORIAL, and immediate-neighbours only")).toBe(
      "uses-is-editorial-and-immediate-neighbours-only",
    );
  });
});

describe("archived entries are retained but injected nowhere", () => {

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
        `summary: "${id}"\ncreatedAt: 2026-09-19\narchived: ${archived}\nreferences:\n---\nbody\n`;
      writeFileSync(join(dir, "bare.md"), node("bare", "true"));
      writeFileSync(join(dir, "quoted.md"), node("quoted", '"true"'));
      writeFileSync(
        join(dir, "live.md"),
        `---\n$schema: ${MEMORY_SCHEMA_TAG}\nid: live\nlabel: stable\n` +
          `summary: "live"\ncreatedAt: 2026-09-19\nreferences:\n---\nbody\n`,
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
          `summary: "typo"\ncreatedAt: 2026-09-19\narchived: probably\nreferences:\n---\nbody\n`,
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
        `summary: "${id}"\ncreatedAt: 2026-09-19\narchived: ${archived}\nreferences:\n---\nbody\n`;
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
