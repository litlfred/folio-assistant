#!/usr/bin/env bun
/**
 * Report sessions that have been waiting on a person for too long.
 *
 * ```sh
 * bun run check:session-staleness <listing.json>   # a saved list_sessions payload
 * cat listing.json | bun run check:session-staleness
 * bun run check:session-staleness --repo litlfred/folio-assistant listing.json
 * bun run check:session-staleness --warn listing.json   # report, never fail
 * bun run check:session-staleness --no-mark listing.json # do not leave the trace
 * ```
 *
 * **It takes the listing as INPUT and does not fetch it.** Probed 2026-09-21
 * from inside a session container: no session credential in the environment,
 * `api.anthropic.com/v1/sessions` → 401, `claude.ai/api/code/sessions` → 403.
 * `list_sessions` is an MCP tool an AGENT holds, not an endpoint a script can
 * call — the same wall that makes `sibling-sessions.ts` infer sessions from
 * commit trailers.
 *
 * **So this is not a CI gate and must not be wired in as one.** A gate whose
 * input CI cannot obtain would examine nothing and report a clean run over
 * everything — the `dh4f` defect. It belongs in the session-start sweep, run
 * by an agent that can produce the listing.
 *
 * The rules, their thresholds and every threshold's basis are in
 * `src/sessions/staleness.ts`. Bean `rq8s`.
 *
 * @module folio-assistant/scripts/check-session-staleness
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  SESSION_LISTING_MARK_TAG,
  type SessionListingMark,
} from "../schemas/session-listing-mark.js";
import { readRows, render, stale, type Report } from "../src/sessions/staleness.js";

const argv = process.argv.slice(2);
const warn = argv.includes("--warn");
const repoAt = argv.indexOf("--repo");
const onlyRepo = repoAt >= 0 ? argv[repoAt + 1] : undefined;
// `repoAt` is -1 when `--repo` is absent, so `repoAt + 1` is 0 -- which would
// exclude the FIRST positional argument and silently fall through to reading
// stdin, where it blocks forever. Caught by this script's own first run.
const repoValueAt = repoAt >= 0 ? repoAt + 1 : -1;
const file = argv.find((a, i) => !a.startsWith("--") && i !== repoValueAt);

function readInput(): { text: string } | { because: string } {
  try {
    return { text: file ? readFileSync(file, "utf8") : readFileSync(0, "utf8") };
  } catch (e) {
    return {
      because: file
        ? `could not read ${file} — ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`
        : "no input: pass a saved `list_sessions` payload as a file, or pipe it on stdin",
    };
  }
}

const input = readInput();
const report: Report = ((): Report => {
  if ("because" in input) return { state: "unknown", because: input.because };
  const rows = readRows(input.text);
  if ("because" in rows) return { state: "unknown", because: rows.because };
  return { state: "checked", read: rows.rows.length, findings: stale(rows.rows, new Date(), onlyRepo) };
})();

console.log(argv.includes("--json") ? JSON.stringify(report, null, 2) : render(report));

/**
 * Leave the trace that this ran — bean `rq8s`, the owner's ruling 2026-09-23.
 *
 * The sweep asks an agent to run this by name, because a shell cannot fetch the
 * listing. A rule in prose that leaves no trace when skipped makes a skip and a
 * clean run print the same thing, which is the defect this whole check exists
 * for, one level up.
 *
 * **Only a CHECKED run writes.** An `unknown` — no input, unreadable payload —
 * is precisely the case that must not look like a look, so it leaves the
 * previous mark alone rather than refreshing it with a failure.
 *
 * Written before the exit below, and never allowed to change the exit code: a
 * repository whose `session-marks/` cannot be written still has sessions
 * waiting, and failing the check for the bookkeeping would hide the finding
 * behind the record of it.
 */
function writeMark(r: Report): void {
  if (r.state !== "checked") return;
  const mark: SessionListingMark = {
    $schema: SESSION_LISTING_MARK_TAG,
    checkedAt: new Date().toISOString(),
    // `CLAUDE_SESSION_ID` where the runner sets it; a mark from a runner that
    // cannot name itself is still a mark.
    ...(process.env.CLAUDE_SESSION_ID ? { by: process.env.CLAUDE_SESSION_ID } : {}),
    sessionsRead: r.read,
    findings: r.findings.length,
  };
  try {
    const dir = resolve(".", "session-marks");
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, "session-listing.json"), `${JSON.stringify(mark, null, 2)}\n`);
  } catch (e) {
    console.error(`(could not write session-marks/session-listing.json: ${e instanceof Error ? e.message : e})`);
  }
}
if (!argv.includes("--no-mark")) writeMark(report);

// `unknown` exits non-zero too: it is not a pass, and a caller that treats a
// zero exit as "nothing waiting" must never get one from a listing this could
// not read.
if (warn) process.exit(0);
process.exit(report.state === "unknown" || report.findings.length > 0 || report.read === 0 ? 1 : 0);
