/**
 * The runtime half of the input-site audit — bean `f017`.
 *
 * @module scripts/input-trace
 * @graphNode none — a one-function hook called at `traced` input sites
 *
 * `input-sites.ts` audits a check's import closure STATICALLY, which
 * over-approximates: a `git ls-remote` inside a function that no check ever
 * calls still sits in the closure of every check whose imports reach its
 * module (an instance's `platform.ts` barrel makes that most of them). Such a
 * site cannot honestly be called `inert`, and leaving it unannotated makes
 * every one of those checks unskippable.
 *
 * So a site may instead be `traced`: the line directly above it calls
 * {@link inputSiteReached}. When `regen` or `gates` runs a check it may record,
 * it names a fresh trace file in {@link TRACE_ENV}; a run that REACHED a traced
 * site writes to it, and that run records nothing. A run that did not reach it
 * records as usual — and the next run on the same inputs takes the same path
 * (every other input it reads is hashed or audited), so it does not reach it
 * either. Child processes inherit the variable with the rest of the
 * environment.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

/** The environment variable naming the trace file of the run being recorded. */
export const TRACE_ENV = "INPUT_HASH_TRACE";

/** Say that a `traced` input site is about to read something the input hash cannot see. */
export function inputSiteReached(what: string): void {
  // input-site: inert #aff7f52b — names the trace file of the recording run; what is written there is never part of an answer
  const path = process.env[TRACE_ENV];
  if (path) appendFileSync(path, `${what}\n`);
}

let traceSeq = 0;

/**
 * A fresh trace file for one recorded run, under the input-hash cache's own
 * directory — which the tree digest leaves out, so writing it moves no
 * fingerprint. Returns the environment to run with and a probe to ask after.
 */
export function openTrace(root: string): { env: Record<string, string | undefined>; reached: () => string | undefined } {
  const dir = join(root, "build", "regen-cache", "traces");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${process.pid}-${++traceSeq}.log`);
  rmSync(path, { force: true });
  return {
    env: { ...process.env, [TRACE_ENV]: path },
    reached: () => {
      if (!existsSync(path)) return undefined;
      const what = readFileSync(path, "utf-8").trim().split("\n")[0];
      rmSync(path, { force: true });
      return what || "a traced input site";
    },
  };
}
