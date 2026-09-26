/**
 * The harness's plug-in contract names no content type.
 *
 * Bean `jcmx`. `src/types.ts` is the interface each content adapter
 * implements, and it imported `FeedbackItem` and `PaperMacro` from
 * `schemas/types.ts`. Core may import the harness; the harness may not import
 * core. That single import was the LAST wrong-direction edge in the
 * partition, and it is the one the partition tool's own notes deferred
 * rather than acted on, because "splitting `ContentAdapter` out moves the
 * edge rather than removing it".
 *
 * It does — which is why the fix was not a split. Every content SHAPE
 * (`FolioItem`, `ContentOutline`, `Resolved*`) is DECLARED in `src/types.ts`,
 * not imported; only two symbols ever came from core. They are now declared
 * as the structural minimum a harness signature needs (`TodoRef`,
 * `MacroDef`), which the richer core types satisfy.
 *
 * @module scripts/tests/adapter-layering
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { analyse, classify } from "../repo-partition.ts";
import type { TodoRef, MacroDef } from "../../src/types.ts";
import type { FeedbackItem, PaperMacro } from "../../schemas/types.ts";

const INSTANCE = join(import.meta.dir, "../..");

describe("the partition has no wrong-direction edges", () => {
  test("zero, and the count is real", () => {
    const r = analyse();
    expect(r.crossEdges.map((e) => `${e.from} -> ${e.to}`)).toEqual([]);
    // A partition that scanned nothing would satisfy that trivially. The
    // tool exits 2 on an empty scan for the same reason; assert it here too,
    // because this file's whole subject is a check that used to pass over
    // ground it never covered.
    expect(r.modules.size).toBeGreaterThan(500);
    expect(r.totalEdges).toBeGreaterThan(1000);
  });

  test("...and nothing is unassigned, which is a separate axis", () => {
    const r = analyse();
    expect([...r.modules].filter(([, a]) => a.repo === "unassigned").map(([m]) => m)).toEqual([]);
    expect(r.unresolvedEdges).toEqual([]);
  });
});

describe("the harness contract does not import the content model", () => {
  test("`src/types.ts` imports nothing from `schemas/`", () => {
    const src = readFileSync(join(INSTANCE, "src/types.ts"), "utf-8");
    const imports = [...src.matchAll(/^import .*? from "([^"]+)";$/gm)].map((m) => m[1]!);
    expect(imports.filter((i) => i.includes("schemas/"))).toEqual([]);
    // Guard against the assertion passing because the regex stopped matching.
    expect(imports.length).toBeGreaterThan(0);
  });

  test("the two layers it belongs to disagree, which is why this matters", () => {
    expect(classify("src/types.ts").repo).toBe("harness");
    expect(classify("schemas/types.ts").repo).toBe("core");
  });
});

describe("the core types still satisfy the harness minima", () => {
  test("a FeedbackItem is usable wherever a TodoRef is required", () => {
    // Compile-time is the real assertion; the runtime check keeps the test
    // from being deleted as empty. If `TodoRef` ever gains a field
    // `FeedbackItem` lacks, this file stops compiling — which is the point.
    // Constructed WITHOUT a cast on purpose. `as FeedbackItem` would make the
    // compiler stop checking the literal, and the assignment below is the
    // whole assertion — a cast here would leave the test green while proving
    // nothing. (The first draft did cast, and `tsc` rejected it for using an
    // invalid `priority`, which is the check doing its job on the test.)
    const item: FeedbackItem = {
      id: "todo-001", summary: "s", comment: "c",
      status: "open", priority: "medium", origin: "human",
      createdAt: "2026-09-20T00:00:00Z",
    };
    const ref: TodoRef = item;
    expect(ref.id).toBe("todo-001");
  });

  test("a PaperMacro is usable wherever a MacroDef is required", () => {
    const macro: PaperMacro = { tex: "\\mathfrak{p}", unicode: "\u{1D52D}" };
    const def: MacroDef = macro;
    expect(def.tex).toBe("\\mathfrak{p}");
  });

  test("the minima stay MINIMA — a copy of the core model is the defect", () => {
    // `src/types.ts` once carried a hand-written second `FeedbackItem` that
    // drifted from the schema's on five fields. The guard against repeating
    // it is that `TodoRef` is far smaller than what it stands in for.
    const src = readFileSync(join(INSTANCE, "src/types.ts"), "utf-8");
    const body = src.slice(src.indexOf("export interface TodoRef"));
    const fields = [...body.slice(0, body.indexOf("}")).matchAll(/^\s{2}(\w+)[?]?:/gm)];
    expect(fields.length).toBeLessThanOrEqual(4);
  });
});
