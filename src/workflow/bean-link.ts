/**
 * The one place where a workflow instance and its bean become the same answer.
 *
 * `.beans/` says *what is being worked on*; an instance says *where it got to*.
 * Kept apart they diverge, and a work plan that disagrees with itself is worse
 * than one that is merely coarse. Eleven activities across the six diagrams
 * carry `<folio:bean store=".beans/" op="…"/>` — completing one is not a step
 * *about* the work plan, it **is** the work-plan operation, so doing one does
 * the other.
 *
 * Three operations, and the difference between them is who may decide:
 *
 * | op        | effect                                                |
 * |-----------|-------------------------------------------------------|
 * | `claim`   | status → `in-progress`. Safe and idempotent.          |
 * | `note`    | append a line to the bean body.                       |
 * | `resolve` | status → `completed`, **only if the process finished** |
 *
 * `resolve` is the careful one. `AGENTS.md` is explicit that a bean is not
 * closed on someone else's judgement, and "Resolve **or re-open** the bean" is
 * the activity's actual name — whether work is done is a judgement. So it is
 * not taken on the caller's say-so: the bean completes only when the instance
 * it tracks has itself completed, which is a fact derived from the process
 * rather than an assertion. A still-running instance gets a note instead.
 *
 * Only ever `state.bean` — the bean whoever started the instance nominated.
 * This never touches a bean it was not handed.
 *
 * @module folio-assistant/workflow/bean-link
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type WorkPlanOp = "claim" | "note" | "resolve";

export const WORK_PLAN_OPS = new Set<string>(["claim", "note", "resolve"]);

export interface BeanRef {
  id: string;
  title: string;
  status: string;
  path: string;
}

const BEANS_DIR = ".beans";

/** Run the beans CLI; `undefined` when it is not installed or the call fails. */
function cli(repoRoot: string, args: string[]): string | undefined {
  try {
    return execFileSync("beans", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * Find a bean by id.
 *
 * Bean filenames are `<id>--<slugged-title>.md`, so the id is a prefix rather
 * than the whole name; matching on the prefix plus the `--` separator avoids
 * `fq0b` also matching a hypothetical `fq0bx`.
 */
export function findBean(repoRoot: string, id: string): BeanRef | undefined {
  const dir = join(repoRoot, BEANS_DIR);
  if (!existsSync(dir)) return undefined;
  const file = readdirSync(dir).find((f) => f.startsWith(`${id}--`) && f.endsWith(".md"));
  if (!file) return undefined;
  const path = join(dir, file);
  const body = readFileSync(path, "utf8");
  return {
    id,
    title: body.match(/^title:\s*(.+)$/m)?.[1].trim().replace(/^['"]|['"]$/g, "") ?? id,
    status: body.match(/^status:\s*(.+)$/m)?.[1].trim() ?? "unknown",
    path,
  };
}

export function listBeans(repoRoot: string): BeanRef[] {
  const dir = join(repoRoot, BEANS_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.split("--")[0])
    .map((id) => findBean(repoRoot, id))
    .filter((b): b is BeanRef => b !== undefined);
}

/**
 * Rewrite `status:` in the front matter, and bump `updated_at`.
 *
 * The fallback for when the CLI is absent — which is not hypothetical: this
 * repo's own session-start hook reports "beans CLI not on PATH" and reads
 * `.beans/` directly. A work-plan integration that only worked with the CLI
 * installed would be off exactly when someone is picking up a fresh container.
 */
function setStatusInFile(bean: BeanRef, status: string): void {
  const body = readFileSync(bean.path, "utf8");
  if (!/^status:\s*.+$/m.test(body)) {
    throw new Error(`${bean.path} has no \`status:\` in its front matter`);
  }
  const next = body
    .replace(/^status:\s*.+$/m, `status: ${status}`)
    .replace(/^updated_at:\s*.+$/m, `updated_at: ${new Date().toISOString().replace(/\.\d+Z$/, "Z")}`);
  writeFileSync(bean.path, next, "utf8");
}

function appendToFile(bean: BeanRef, text: string): void {
  const body = readFileSync(bean.path, "utf8").replace(/\s*$/, "\n");
  writeFileSync(bean.path, `${body}\n${text}\n`, "utf8");
}

export interface WorkPlanResult {
  /** What was done, for the caller to report. */
  summary: string;
  bean?: BeanRef;
}

/**
 * Apply a work-plan operation to the instance's bean.
 *
 * Never throws for a missing bean: an instance may legitimately have none (a
 * one-off run, a subject that is not tracked). It says so instead, because
 * silently doing nothing is how the two records drift apart again.
 */
export function applyWorkPlanOp(
  repoRoot: string,
  beanId: string | undefined,
  op: WorkPlanOp,
  opts: { note?: string; instanceCompleted?: boolean } = {},
): WorkPlanResult {
  if (!beanId) {
    return { summary: `no bean on this instance, so the ${op} step recorded nothing in .beans/` };
  }
  const bean = findBean(repoRoot, beanId);
  if (!bean) {
    return { summary: `bean ${beanId} is not in .beans/ — nothing recorded` };
  }

  const note = opts.note?.trim();

  if (op === "note" || (op === "resolve" && !opts.instanceCompleted)) {
    const text = note ?? `Workflow step reached (${op}).`;
    if (cli(repoRoot, ["update", beanId, "--body-append", text]) === undefined) {
      appendToFile(bean, text);
    }
    return {
      summary:
        op === "note"
          ? `noted on bean ${beanId}`
          : `bean ${beanId} left ${bean.status}: the process it tracks is still running, ` +
            `so whether the work is done is not settled — noted instead of resolved`,
      bean,
    };
  }

  const status = op === "claim" ? "in-progress" : "completed";
  if (bean.status === status) {
    return { summary: `bean ${beanId} already ${status}`, bean };
  }
  if (cli(repoRoot, ["update", beanId, "-s", status]) === undefined) {
    setStatusInFile(bean, status);
  }
  if (note) {
    if (cli(repoRoot, ["update", beanId, "--body-append", note]) === undefined) {
      appendToFile(bean, note);
    }
  }
  return { summary: `bean ${beanId}: ${bean.status} → ${status}`, bean };
}
