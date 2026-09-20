/**
 * Agent-drafted, human-confirmed narratives — bean `ju0u`.
 *
 * Nothing in `library/` carries a draft: no images, no audio, no datasets. So
 * the state machine and the review queue are both proved against fixtures, and
 * every branch is mutation-checked. A queue that finds nothing is
 * indistinguishable from a queue that cannot see.
 *
 * @module scripts/tests/narratives
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  NARRATIVE_STATES,
  NOT_AUTHORED,
  NarrativeSchema,
  REJECTION_REASONS,
  STATES_WITH_TEXT,
  awaitsConfirmation,
  isConfirmed,
} from "../../schemas/narrative.ts";
import { atATerminal, decide, queue, reviewer } from "../narratives.ts";

const ROOT = resolve(import.meta.dir, "../..");
const AGENT = { kind: "agent" as const, id: "claude-code", model: "claude-opus-5" };
const HUMAN = { kind: "human" as const, id: "litlfred" };
const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

const draft = { text: "Weekly case counts by country.", state: "draft" as const, drafted_by: AGENT };

describe("the state machine refuses records that mean nothing", () => {
  test("only `not-authored` has no text", () => {
    expect(NarrativeSchema.safeParse(NOT_AUTHORED).success).toBe(true);
    expect(NarrativeSchema.safeParse({ text: null, state: "draft", drafted_by: AGENT }).success).toBe(false);
    expect(NarrativeSchema.safeParse({ text: "x", state: "not-authored" }).success).toBe(false);
  });

  test("anything written records who wrote it", () => {
    // Otherwise `confirmed` could mean a person accepted words of unknown
    // origin — the provenance gap `iqim` closed for blocks, reappearing.
    expect(NarrativeSchema.safeParse({ text: "x", state: "draft" }).success).toBe(false);
  });

  test("AN AGENT CANNOT CONFIRM ITS OWN DRAFT", () => {
    // The load-bearing rule, and the whole difference between the option the
    // owner chose and the one they did not. Without it `confirmed` degrades
    // into "an agent said so twice".
    const base = { ...draft, state: "confirmed" as const };
    expect(NarrativeSchema.safeParse({ ...base, confirmed_by: AGENT }).success).toBe(false);
    expect(NarrativeSchema.safeParse({ ...base, confirmed_by: { kind: "script", id: "x" } }).success).toBe(false);
    expect(NarrativeSchema.safeParse({ ...base, confirmed_by: HUMAN }).success).toBe(true);
  });

  test("a rejection must say why", () => {
    const base = { ...draft, state: "rejected" as const, rejected_by: HUMAN };
    expect(NarrativeSchema.safeParse(base).success).toBe(false);
    expect(NarrativeSchema.safeParse({ ...base, rejection_reason: "" }).success).toBe(false);
    expect(NarrativeSchema.safeParse({ ...base, rejection_reason: REJECTION_REASONS[0] }).success).toBe(true);
  });

  test("a narrative cannot be both confirmed and rejected", () => {
    expect(
      NarrativeSchema.safeParse({
        ...draft,
        state: "confirmed",
        confirmed_by: HUMAN,
        rejected_by: HUMAN,
        rejection_reason: "x",
      }).success,
    ).toBe(false);
  });

  test("an agent draft still needs its model — inherited from `iqim`", () => {
    expect(
      NarrativeSchema.safeParse({ text: "x", state: "draft", drafted_by: { kind: "agent", id: "c" } }).success,
    ).toBe(false);
  });

  test("`STATES_WITH_TEXT` is derived, so a new state forces the question", () => {
    expect([...STATES_WITH_TEXT]).toEqual(NARRATIVE_STATES.filter((s) => s !== "not-authored"));
    expect(STATES_WITH_TEXT).not.toContain("not-authored");
  });

  test("only `confirmed` reads as confirmed", () => {
    expect(isConfirmed({ ...draft, state: "confirmed", confirmed_by: HUMAN })).toBe(true);
    for (const n of [NOT_AUTHORED, draft, { ...draft, state: "rejected", rejected_by: HUMAN, rejection_reason: "x" }]) {
      expect(isConfirmed(n)).toBe(false);
    }
    expect(awaitsConfirmation(draft)).toBe(true);
    expect(awaitsConfirmation(NOT_AUTHORED)).toBe(false);
  });
});

/** A repo-shaped fixture: harness.json declaring library/, and entries in it. */
function repo(entries: Record<string, unknown>): string {
  const root = mkdtempSync(join(tmpdir(), "narr-"));
  made.push(root);
  writeFileSync(
    join(root, "harness.json"),
    JSON.stringify({ name: "fixture", directories: [{ id: "library", path: "library", graphs: ["library"] }] }),
  );
  for (const [slug, narrative] of Object.entries(entries)) {
    mkdirSync(join(root, "library", slug), { recursive: true });
    writeFileSync(
      join(root, "library", slug, "tabular.jsonld"),
      JSON.stringify({ $schema: "folio-tabular-records/v1", narrative }, null, 2) + "\n",
    );
  }
  return root;
}

describe("the queue shows exactly what is waiting on a person", () => {
  test("a draft appears; settled and empty ones do not", () => {
    const root = repo({
      adraft: draft,
      bconfirmed: { ...draft, state: "confirmed", confirmed_by: HUMAN },
      crejected: { ...draft, state: "rejected", rejected_by: HUMAN, rejection_reason: "x" },
      dempty: NOT_AUTHORED,
    });
    const q = queue(root);
    expect(q.map((i) => i.slug)).toEqual(["adraft"]);
  });

  test("a REJECTED draft is never re-offered", () => {
    // The reasons exist precisely so the same text does not come back around.
    const root = repo({ x: { ...draft, state: "rejected", rejected_by: HUMAN, rejection_reason: REJECTION_REASONS[1] } });
    expect(queue(root)).toEqual([]);
  });

  test("an unparseable file is skipped rather than crashing the queue", () => {
    const root = repo({ ok: draft });
    mkdirSync(join(root, "library", "broken"), { recursive: true });
    writeFileSync(join(root, "library", "broken", "tabular.jsonld"), "{ not json");
    expect(queue(root).map((i) => i.slug)).toEqual(["ok"]);
  });

  test("no library at all is an empty queue, not a crash", () => {
    const root = mkdtempSync(join(tmpdir(), "narr-none-"));
    made.push(root);
    writeFileSync(join(root, "harness.json"), JSON.stringify({ name: "x", directories: [] }));
    expect(queue(root)).toEqual([]);
  });

  test("the real corpus has nothing waiting — a determined zero", () => {
    expect(queue(ROOT)).toEqual([]);
  });
});

describe("deciding writes the file, and validates before it does", () => {
  const now = new Date("2026-09-19T16:00:00.000Z");

  test("confirming records the HUMAN and the time", () => {
    const root = repo({ x: draft });
    const q = queue(root);
    const out = decide(q[0], "confirm", { by: HUMAN, now, root });
    expect(out.state).toBe("confirmed");
    expect(out.confirmed_by).toEqual(HUMAN);
    expect(out.confirmed_at).toBe("2026-09-19T16:00:00Z");
    // The draft attribution SURVIVES: who wrote it and who accepted it are
    // both still answerable afterwards.
    expect(out.drafted_by).toEqual(AGENT);
    const onDisk = JSON.parse(readFileSync(join(root, q[0].file), "utf-8")) as { narrative: unknown };
    expect(NarrativeSchema.safeParse(onDisk.narrative).success).toBe(true);
    expect(queue(root)).toEqual([]);
  });

  test("rejecting keeps the reason", () => {
    const root = repo({ x: draft });
    const out = decide(queue(root)[0], "reject", { by: HUMAN, reason: REJECTION_REASONS[0], now, root });
    expect(out.state).toBe("rejected");
    expect(out.rejection_reason).toBe(REJECTION_REASONS[0]);
    expect(out.text).toBe(draft.text);
  });

  test("an invalid decision NEVER reaches the file", () => {
    // Validated before the write, because a bad record on disk is one the gate
    // has to catch later — by which time it is committed.
    const root = repo({ x: draft });
    const q = queue(root);
    const before = readFileSync(join(root, q[0].file), "utf-8");
    expect(() => decide(q[0], "reject", { by: HUMAN, now, root })).toThrow(/must say why/);
    expect(readFileSync(join(root, q[0].file), "utf-8")).toBe(before);
    expect(() =>
      decide(q[0], "confirm", { by: AGENT as unknown as typeof HUMAN, now, root }),
    ).toThrow(/human/);
    expect(readFileSync(join(root, q[0].file), "utf-8")).toBe(before);
  });
});

describe("the review step is selection, not typing", () => {
  test("every rejection reason is reachable by NUMBER", () => {
    // The owner has very limited hand function. A rejection that demands a
    // typed sentence is a rejection that will not happen, and `confirmed`
    // then means "nobody got round to objecting" — worse than not having the
    // state at all.
    expect(REJECTION_REASONS.length).toBeGreaterThan(0);
    for (const r of REJECTION_REASONS) expect(r.length).toBeGreaterThan(0);
  });

  test("a decision is one word and one number — measured, not asserted vaguely", () => {
    // The falsifier for this whole design: if confirming costs a sentence of
    // typing it will not happen, and `confirmed` becomes "nobody got round to
    // objecting". So the cost is measured rather than hoped for.
    const confirm = "bun run narratives:confirm 1";
    const reject = "bun run narratives:reject 1 --why 2";
    // Past the script name, the user types a number and at most a flag+number.
    expect(confirm.slice("bun run narratives:confirm ".length)).toBe("1");
    expect(reject.slice("bun run narratives:reject ".length)).toBe("1 --why 2");
    // And no rejection anywhere needs prose: every reason has a number.
    expect(REJECTION_REASONS.every((_, i) => Number.isInteger(i + 1))).toBe(true);
  });

  test("a bad selection says the range rather than acting", () => {
    for (const n of ["0", "99", "x"]) {
      const r = Bun.spawnSync(["bun", "run", "scripts/narratives.ts", "confirm", n], { cwd: ROOT });
      expect(r.exitCode).not.toBe(0);
    }
  });

  test("a rejection with no reason is refused at the CLI too", () => {
    const r = Bun.spawnSync(["bun", "run", "scripts/narratives.ts", "reject", "1"], { cwd: ROOT });
    expect(r.exitCode).not.toBe(0);
  });
});

describe("an agent cannot record itself as the human — the hole the tool itself opened", () => {
  test("`reviewer()` refuses outside a terminal", () => {
    // Found by DRIVING the CLI, not by reading it. In this container
    // `git config user.name` is "Claude", so the tool wrote
    //   "rejected_by": { "kind": "human", "id": "Claude" }
    // — the agent recorded itself as the human reviewer. The schema could not
    // catch it: a rule about WHO MAY ACT cannot be enforced by a rule about
    // what is written.
    expect(() => reviewer({ interactive: false })).toThrow(/non-interactive/);
  });

  test("the test suite itself has no terminal, which is the point", () => {
    // If this ever reads true under `bun test`, the guard has stopped guarding
    // and every assertion below it is worthless.
    expect(atATerminal()).toBe(false);
  });

  test("a scripted decision must supply the reviewer explicitly", () => {
    // `opts.by` is the caller's assertion and is trusted as such; omitting it
    // falls through to `reviewer()`, which refuses here.
    const root = repo({ x: draft });
    expect(() => decide(queue(root)[0], "confirm", { root })).toThrow(/non-interactive/);
  });

  test("the CLI refuses and leaves the record untouched", () => {
    const root = repo({ x: draft });
    const before = readFileSync(join(root, queue(root)[0].file), "utf-8");
    const r = Bun.spawnSync(["bun", "run", "scripts/narratives.ts", "confirm", "1"], { cwd: ROOT });
    expect(r.exitCode).not.toBe(0);
    expect(readFileSync(join(root, queue(root)[0].file), "utf-8")).toBe(before);
  });
});
