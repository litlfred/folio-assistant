/**
 * A TOOL RUN RECORD — did the downstream tool run, did it succeed, and over
 * which inputs.
 *
 * Bean `fq5u`, owner 2026-09-29: *"how do we know tools like LSI are run
 * succesfully... not primary to pieple, but downstream. should be part of QA
 * process (dependences = stall QA)"* — and the design the owner chose: one QA
 * criterion family generalising `lsi-index-fresh`. Every downstream tool is a
 * Tool node declaring `downstream` (`schemas/tool.ts#ToolDownstreamSchema`),
 * and each run writes one of these.
 *
 * ## The three states, and why "no record" is not a fourth kind of green
 *
 * {@link downstreamState} reads a record against the current input
 * fingerprint:
 *
 * - **fresh** — a SUCCESSFUL run whose recorded input fingerprint matches the
 *   current one. The only state that is a pass.
 * - **stale** — a successful run over inputs that have since changed. The
 *   dependency moved, so the QA over it is stale.
 * - **not-run / failed** — no record, or the last run failed. Never green:
 *   the three-state rule this repository keeps re-finding (`ci-health`'s
 *   "could not check is never green", `test-run.ts`'s `unknown` that equals
 *   nothing). An output with no evidence that it was produced has not been
 *   shown to be current, however plausible the file on disk looks.
 *
 * ## Why the fingerprint is the tool's, not a generic file hash
 *
 * A generic hash over the declared input paths would disagree with the tool
 * about what counts as a change — LSI ignores files that yield no unit, so a
 * whole-directory hash would call an index stale that the tool itself would
 * rebuild identically. The member computes its own fingerprint and the
 * record carries it; one answer per member, not two.
 *
 * ## No timestamp, deliberately
 *
 * The record is committed and rewritten by generators that `skill:register`
 * checks for staleness. A time field would make every re-run a diff with no
 * change in what the record asserts. What the run was OVER is the identity;
 * when it happened is `git log`'s answer.
 *
 * @module schemas/tool-run
 * @graphNode schema
 */
import { z } from "zod";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/** The `$schema` tag every run record carries. */
export const TOOL_RUN_SCHEMA_ID = "folio-tool-run/v1";

/** Where run records live, under an instance's `qa` directory. */
export const TOOL_RUNS_DIR = join("test", "results", "tool-runs");

export const ToolRunRecordSchema = z.object({
  $schema: z.literal(TOOL_RUN_SCHEMA_ID),
  /** The Tool node id whose run this records. @ref ToolDefinitionSchema */
  tool: z.string().min(1),
  /** Which of the tool's outputs — one tool may keep several (LSI: one per graph). */
  target: z.string().min(1),
  outcome: z.enum(["succeeded", "failed"]),
  /**
   * The tool's own fingerprint of the inputs the run read, or `unknown` when
   * the run failed before it could compute one. `unknown` matches nothing.
   */
  inputFingerprint: z.string().min(1),
  /** For a failure: what went wrong, for a reader who has only the file. */
  detail: z.string().optional(),
});
export type ToolRunRecord = z.infer<typeof ToolRunRecordSchema>;

/** What a fingerprint says when it could not be computed. Equal to nothing. */
export const UNKNOWN_FINGERPRINT = "unknown";

export type DownstreamState = "fresh" | "stale" | "not-run" | "failed";

/**
 * The three-state read. `current` is the member's fingerprint of the inputs
 * as they are now; `unknown` there is never fresh either.
 */
export function downstreamState(record: ToolRunRecord | undefined, current: string): DownstreamState {
  if (!record) return "not-run";
  if (record.outcome === "failed") return "failed";
  if (current === UNKNOWN_FINGERPRINT || record.inputFingerprint === UNKNOWN_FINGERPRINT) return "stale";
  return record.inputFingerprint === current ? "fresh" : "stale";
}

/** A target may carry `/` (LSI's `<instance>/<graph>`); it becomes nested directories. */
export function toolRunPath(instanceRoot: string, tool: string, target: string): string {
  return join(instanceRoot, TOOL_RUNS_DIR, tool, `${target}.tool-run.json`);
}

/** The record, or `undefined` when there is none — a file that fails to parse is not a record. */
export function readToolRun(instanceRoot: string, tool: string, target: string): ToolRunRecord | undefined {
  const p = toolRunPath(instanceRoot, tool, target);
  if (!existsSync(p)) return undefined;
  return parseToolRun(readFileSync(p, "utf8"));
}

/**
 * The record a file's TEXT holds, wherever the text came from: the checkout,
 * or a tree read from the `qa-reports` branch through `scripts/qa-store.ts`
 * (bean `oq1j`). `undefined` for no text, and for text that is not a record.
 */
export function parseToolRun(text: string | undefined): ToolRunRecord | undefined {
  if (text === undefined) return undefined;
  try {
    const parsed = ToolRunRecordSchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

/** Write a record; returns its path. Written only when its content changes. */
export function writeToolRun(instanceRoot: string, record: Omit<ToolRunRecord, "$schema">): string {
  const p = toolRunPath(instanceRoot, record.tool, record.target);
  const body = JSON.stringify({ $schema: TOOL_RUN_SCHEMA_ID, ...record }, null, 2) + "\n";
  if (existsSync(p) && readFileSync(p, "utf8") === body) return p;
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
  return p;
}

/** One record as listed: its path (instance-relative), and the record or `undefined` when it does not parse. */
export interface ListedToolRun {
  path: string;
  record: ToolRunRecord | undefined;
}

/**
 * Every record under an instance, or `unknown` when there is no record
 * directory to list.
 *
 * ## Why an absent directory is `unknown`, not an empty list
 *
 * Bean `oq1j` (arc `3fva`, reader `R26`). Run records are derived QA, and
 * derived QA leaves `main` for the `qa-reports` branch (owner rulings D1/D4).
 * After that, a checkout that has not run `bun run qa:fetch` has no
 * `tool-runs/` directory at all. An empty list would then read as "examined,
 * and no record names an undeclared Tool". That is the `dh4f` defect: a miss
 * read as clean. Git stores no empty directory, so an absent one cannot be
 * told from "never written" either. Both are `unknown`, with the reason, and
 * the caller decides what that means for its criterion.
 *
 * A directory that EXISTS is determined, even when it holds nothing: the
 * writer creates it, and `qa:fetch` materialises an entry's whole tree.
 */
export type ToolRunListing = { state: "hit"; runs: ListedToolRun[] } | { state: "unknown"; reason: string };

export function listToolRuns(instanceRoot: string): ToolRunListing {
  const base = join(instanceRoot, TOOL_RUNS_DIR);
  if (!existsSync(base)) {
    return {
      state: "unknown",
      reason:
        `no ${TOOL_RUNS_DIR.split("\\").join("/")}/ in the checkout: never written here, or not fetched from the qa-reports ` +
        "branch (`bun run qa:fetch`). An absent directory cannot be told from an empty one, so no record was examined",
    };
  }
  const out: ListedToolRun[] = [];
  const walk = (d: string) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith(".tool-run.json")) {
        let record: ToolRunRecord | undefined;
        try {
          const r = ToolRunRecordSchema.safeParse(JSON.parse(readFileSync(p, "utf8")));
          record = r.success ? r.data : undefined;
        } catch {
          record = undefined;
        }
        out.push({ path: relative(instanceRoot, p), record });
      }
    }
  };
  walk(base);
  return { state: "hit", runs: out.sort((a, b) => (a.path < b.path ? -1 : 1)) };
}
