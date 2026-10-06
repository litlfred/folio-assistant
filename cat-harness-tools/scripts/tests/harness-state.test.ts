/**
 * `check-harness-state` — the four families, and the denominator each prints.
 *
 * Bean `h1wq`. Most of what is asserted here is that a family which finds
 * nothing says WHAT IT LOOKED AT, because three of the four are determined
 * empties on this tree and a check over a two-node corpus that prints "clean"
 * has said almost nothing.
 */
import { afterAll, describe, expect, setDefaultTimeout, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  boardPositionsPointAtBoards,
  feedbackFilesReadable,
  mergeQueueEntriesNamed,
  surveysFiledByEdge,
  todoBeanRefs,
  healthProducerCurrent,
  issueMarkEdits,
  interactionProfilesRead,
  todoProcessRefs,
  writesSidecar,
} from "../check-harness-state.js";
import { checkerHash } from "../../../cat-harness/test/health/run.js";

// `interactionProfilesRead` reads every declared code and skill directory into
// memory: about 15,000 files, 4.1-4.5 s alone on a quiet container, and 7.2 s
// under `bun run gates`, against bun's 5 s default. The walk IS the check (a
// profile is honoured only if the corpus names it), so the budget is raised
// rather than the corpus narrowed — the same remedy main took for
// claim-branch-store in 6582859.
setDefaultTimeout(30_000);

const FAMILIES = [healthProducerCurrent, todoProcessRefs, issueMarkEdits, interactionProfilesRead];

describe("every family reports its own denominator", () => {
  test("each examined something, or said it could not determine", () => {
    // §1.2a of `generalise-the-fix`. A family at `examined: 0` with no
    // `unreadable` reason is the exact shape this repository has paid for three
    // times — a filter over nothing that exits clean.
    for (const f of FAMILIES.map((fn) => fn())) {
      if (f.unreadable) {
        expect(f.unreadable.length).toBeGreaterThan(0);
        continue;
      }
      // A STORED record not in this checkout (bean 0dav) is the other
      // could-not-determine, and it must say so just as loudly.
      if (f.stored) {
        expect(f.stored.length).toBeGreaterThan(0);
        expect(f.examined).toBe(0);
        continue;
      }
      expect(f.examined, `${f.id} examined nothing and gave no reason`).toBeGreaterThan(0);
    }
  });

  test("each carries a summary phrased as what a FAILURE means", () => {
    for (const f of FAMILIES.map((fn) => fn())) {
      expect(f.summary.length).toBeGreaterThan(40);
      expect(f.id).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test("ids are unique, so two families cannot collide in the sidecar", () => {
    const ids = FAMILIES.map((fn) => fn().id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("the corpus, as it stands", () => {
  test("the committed health result is from the CURRENT checker", () => {
    // It was not, when this was written: the result recorded `760c506fd051`
    // against a checker at `1401c8090bf5`, and its staging remedy still told a
    // reader to apply `staging:cleanup` to an orphan — which `7umv` had proved
    // cannot reach one. Stale advice presented as the fix.
    const f = healthProducerCurrent();
    // With the report off `main` (bean 0dav) there is nothing here to judge,
    // and the family must SAY so rather than pass on an empty list.
    if (f.stored) expect(f.examined).toBe(0);
    else expect(f.examined).toBeGreaterThan(0);
    expect(f.findings).toEqual([]);
  });

  test("every todo process reference resolves", () => {
    expect(todoProcessRefs().findings).toEqual([]);
  });

  test("every issue mark accounts for edits", () => {
    expect(issueMarkEdits().findings).toEqual([]);
  });

  test("every declared interaction profile is read by something", () => {
    expect(interactionProfilesRead().findings).toEqual([]);
  });
});

describe("the health family asks the producer for its own hash", () => {
  test("it compares against checkerHash(), not a re-derivation", () => {
    // The first version recomputed `sha256(run.ts)` and could NEVER have
    // passed: the field records `checkerHash`, which hashes three modules
    // because any of them can alter a verdict. A re-derived hash makes a check
    // that cannot pass, and a check that cannot pass gets deleted.
    const h = checkerHash();
    expect(h).toMatch(/^[0-9a-f]{12}$/);
    // The family is green, which is only possible if it is reading this value.
    expect(healthProducerCurrent().findings).toEqual([]);
  });
});

describe("nodesOf dedupes — two instance roots can name one directory", () => {
  test("the todo count is the number of items, not double it", () => {
    // Measured: the repository root and `cat-harness` both resolve `todos` to
    // `./todos`, so a naive walk reported 3 items as 6 and one planted defect
    // twice. A doubled denominator is worse than a wrong one — it reads as
    // coverage while measuring the same file again.
    const f = todoProcessRefs();
    expect(f.examined).toBeLessThan(6);
    expect(f.examined).toBeGreaterThan(0);
  });
});

describe("the gate form writes nothing (bean r7v6)", () => {
  // Measured 2026-10-01: `check:harness-state:check` over an absent results
  // tree recreated `harness-state.qa-results.json`. The judge writes nothing;
  // only the producer form does. Pinned both ways, as bo44 pins
  // `skill-register`'s `writesReport`.
  test("--check writes no sidecar", () => {
    expect(writesSidecar(["bun", "check-harness-state.ts", "--check"])).toBe(false);
  });
  test("the producer form still writes it", () => {
    expect(writesSidecar(["bun", "check-harness-state.ts"])).toBe(true);
  });
});

// ── The five nested-declaration kinds (PR #2094) ─────────────────────────
//
// Each family gets one fixture that FIRES and one that is CLEAN, because a
// check that has never been seen to fire is indistinguishable from one that
// cannot. Fixtures go through the same `dirs` parameter the run resolves from
// the declaration.

const NESTED = [mergeQueueEntriesNamed, surveysFiledByEdge, todoBeanRefs, feedbackFilesReadable, boardPositionsPointAtBoards];
const scratch = mkdtempSync(join(tmpdir(), "harness-state-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** A fresh directory holding `files` (name → text). */
function fixture(name: string, files: Record<string, string>): string {
  const dir = join(scratch, name);
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(dir, rel, ".."), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

const BEANS = new Set(["folio-assistant-ab12"]);
const entry = (repo: string, pr: number, beans: string[]) =>
  JSON.stringify({ $schema: "folio-merge-queue-entry/v1", repository: repo, pr, beans });
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const survey = (from: string, to: string, commits: number) =>
  JSON.stringify({ $schema: "folio-session-survey/v1", from, to, commits });
const todo = (beanId: string) =>
  `---\n$schema: todo/1.0.0\nid: t\nreferences:\n  - kind: bean\n    id: ${beanId}\n---\nbody\n`;
const board = (id: string) => JSON.stringify({ $schema: "folio-board/v1", id, title: id });
const positions = (boards: Record<string, Record<string, { x: number; y: number }>>) =>
  JSON.stringify({ $schema: "folio-board-positions/v1", boards }, null, 2) + "\n";

describe("the five nested-declaration families, on the corpus as it stands", () => {
  test("each walked its declared directory and found nothing — or said it could not determine", () => {
    for (const f of NESTED.map((fn) => fn())) {
      expect(f.unreadable, `${f.id}: ${f.unreadable}`).toBeUndefined();
      // A determined empty is allowed, but only with the directories named:
      // `walked` is what separates it from a blind pass over nothing.
      expect(f.walked?.length ?? 0, `${f.id} names no directory it walked`).toBeGreaterThan(0);
      expect(f.findings).toEqual([]);
    }
  });
  test("ids are unique against the original four as well", () => {
    const ids = [...FAMILIES, ...NESTED].map((fn) => fn().id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("merge-queue-entry-is-named-for-its-pr", () => {
  test("fires on an entry filed under another PR, and on a bean the store lacks", () => {
    const dir = fixture("queue-bad", {
      "litlfred--folio-assistant--2075.json": entry("litlfred/folio-assistant", 2078, ["folio-assistant-ab12"]),
      "litlfred--folio-assistant--9.json": entry("litlfred/folio-assistant", 9, ["folio-assistant-zz99"]),
    });
    const f = mergeQueueEntriesNamed({ dirs: [dir], beans: BEANS });
    expect(f.examined).toBe(2);
    expect(f.findings.map((x) => x.detail).join("\n")).toMatch(/belongs at `litlfred--folio-assistant--2078.json`/);
    expect(f.findings.map((x) => x.detail).join("\n")).toMatch(/folio-assistant-zz99/);
  });
  test("clean when name, content and beans agree", () => {
    const dir = fixture("queue-ok", { "o--r--5.json": entry("o/r", 5, ["folio-assistant-ab12"]) });
    const f = mergeQueueEntriesNamed({ dirs: [dir], beans: BEANS });
    expect(f.examined).toBe(1);
    expect(f.findings).toEqual([]);
  });
});

describe("survey-is-filed-under-its-upper-edge", () => {
  test("fires on a misfiled survey and on edges that contradict the count", () => {
    const dir = fixture("surveys-bad", {
      "not-the-edge.json": survey(SHA_A, SHA_B, 3),
      [`${SHA_A.slice(0, 12)}.json`]: survey(SHA_A, SHA_A, 4),
    });
    const f = surveysFiledByEdge({ dirs: [dir] });
    expect(f.examined).toBe(2);
    const text = f.findings.map((x) => x.detail).join("\n");
    expect(text).toMatch(/belongs at `bbbbbbbbbbbb.json`/);
    expect(text).toMatch(/empty window/);
  });
  test("clean when filed under `to` with a consistent window", () => {
    const dir = fixture("surveys-ok", { [`${SHA_B.slice(0, 12)}.json`]: survey(SHA_A, SHA_B, 2) });
    const f = surveysFiledByEdge({ dirs: [dir] });
    expect(f.examined).toBe(1);
    expect(f.findings).toEqual([]);
  });
});

describe("todo-item-bean-references-resolve", () => {
  test("fires on a reference to a bean the store does not hold", () => {
    const f = todoBeanRefs({ dirs: [fixture("todos-bad", { "a.md": todo("folio-assistant-zz99") })], beans: BEANS });
    expect(f.examined).toBe(1);
    expect(f.findings).toHaveLength(1);
  });
  test("clean when the bean exists", () => {
    const f = todoBeanRefs({ dirs: [fixture("todos-ok", { "a.md": todo("folio-assistant-ab12") })], beans: BEANS });
    expect(f.examined).toBe(1);
    expect(f.findings).toEqual([]);
  });
});

describe("feedback-file-reads-back-as-a-list", () => {
  test("fires on a file the store would read as empty, and on a duplicated id", () => {
    const dir = fixture("feedback-bad", {
      "block-a/root.json": "{ not json",
      "block-b/root.json": JSON.stringify({ id: "x" }),
      "block-c/root.json": JSON.stringify([{ id: "x" }, { id: "x" }]),
    });
    const f = feedbackFilesReadable({ dirs: [dir] });
    expect(f.examined).toBe(3);
    expect(f.findings).toHaveLength(3);
  });
  test("clean on a readable list, and a determined empty on an empty directory", () => {
    const ok = feedbackFilesReadable({ dirs: [fixture("feedback-ok", { "block-a/root.json": JSON.stringify([{ id: "x" }, { id: "y" }]) })] });
    expect(ok.examined).toBe(1);
    expect(ok.findings).toEqual([]);
    const empty = feedbackFilesReadable({ dirs: [fixture("feedback-empty", {})] });
    expect(empty.examined).toBe(0);
    expect(empty.walked).toHaveLength(1);
    expect(empty.unreadable).toBeUndefined();
  });
});

describe("board-positions-point-at-declared-boards", () => {
  test("fires on a board nothing declares, and on a non-canonical file", () => {
    const dir = fixture("boards-bad", {
      "b1.json": board("b1"),
      "board-positions.json":
        JSON.stringify({ $schema: "folio-board-positions/v1", boards: { gone: { n: { x: 1, y: 2 } }, b1: {} } }) + "\n",
    });
    const f = boardPositionsPointAtBoards({ dirs: [dir], boardDirs: [dir] });
    expect(f.examined).toBe(1);
    const text = f.findings.map((x) => x.detail).join("\n");
    expect(text).toMatch(/board `gone`/);
    expect(text).toMatch(/canonical order/);
  });
  test("clean when every laid-out board is declared and the file is canonical", () => {
    const dir = fixture("boards-ok", { "b1.json": board("b1"), "board-positions.json": positions({ b1: { n: { x: 1, y: 2 } } }) });
    const f = boardPositionsPointAtBoards({ dirs: [dir], boardDirs: [dir] });
    expect(f.examined).toBe(1);
    expect(f.findings).toEqual([]);
  });
});
