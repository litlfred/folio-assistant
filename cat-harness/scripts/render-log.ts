#!/usr/bin/env bun
/**
 * Append an entry to the render log on the publish branch.
 *
 * @module scripts/render-log
 *
 * Owner, 2026-09-20: *"log all staging rendering (when added, when deleted)
 * to a logging directory/file on gh-pages."* This is the tool half; the
 * discipline is in `skills/folio-core/render-logging.md` and the process is
 * `skills/workflows/staging-render-log.bpmn`.
 *
 * ## APPEND, and nothing else
 *
 * There is no `--remove`, no `--edit`, no `--id` to overwrite. A takedown is
 * an `removed` ENTRY, not the erasure of the `rendered` one before it. That
 * is what makes the never-delete rule structural here rather than a guard
 * three separate cleanup paths have to remember: the tool offers no verb that
 * could lose history, so no caller can be written wrongly.
 *
 * Emptying a log is a person's decision, taken deliberately, with the same
 * confirmation every durable artefact here requires
 * (`deletion-requires-confirmation`). It is not something this tool does.
 *
 * ## Why it writes into a directory rather than pushing
 *
 * `--dir` is a checkout of the publish branch, or a publish directory about
 * to become one. The tool never fetches, commits or pushes: the workflows
 * that call it already hold a `gh-pages` checkout with their own retry and
 * concurrency handling, and a second pusher racing those would be a new way
 * to lose a deploy. One job knows how to push; this one knows what to write.
 *
 * Usage:
 *   render-log.ts --dir DIR --event rendered --kind staging-preview \
 *     --path STAGING/slug [--slug S] --summary "..." [--reason "..."] \
 *     [--branch B] [--commit C] [--run URL] [--detail "..."]
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  RENDER_EVENTS,
  RENDER_LOG_SCHEMA_ID,
  EVENTS_REQUIRING_REASON,
  isSafeRenderPath,
  readRenderLog,
  renderLogPath,
  serializeRenderLogEntry,
  type RenderEvent,
  type RenderLogEntry,
} from "../schemas/render-log.ts";

/** Build an entry, or throw with what is wrong. Pure, so it is testable. */
export function buildEntry(o: {
  event: RenderEvent;
  kind: string;
  path: string;
  slug?: string;
  summary: string;
  detail?: string;
  reason?: string;
  branch?: string;
  commit?: string;
  run?: string;
  at: string;
  id: string;
}): RenderLogEntry {
  if (!isSafeRenderPath(o.path)) {
    // Refused on the VALUE, never on its provenance — bean `fuzm`. A slug from
    // a dispatch input is not a git ref, so the `..` rule that protects the
    // ref case does not hold for it.
    throw new Error(
      `--path \`${o.path}\` is not a safe path: it must be \`/\` or a sequence of ` +
        `plain segments, with no \`..\`, no leading \`/\` and no backslash`,
    );
  }
  if (EVENTS_REQUIRING_REASON.includes(o.event) && (o.reason ?? "").trim() === "") {
    throw new Error(
      `--reason is required for a \`${o.event}\` entry. An entry saying an artefact ` +
        `went and not why is the ambiguity this log exists to prevent`,
    );
  }
  return {
    $schema: RENDER_LOG_SCHEMA_ID,
    id: o.id,
    at: o.at,
    event: o.event,
    subject: { kind: o.kind, path: o.path, ...(o.slug ? { slug: o.slug } : {}) },
    summary: o.summary,
    ...(o.detail ? { detail: o.detail } : {}),
    ...(o.reason ? { reason: o.reason } : {}),
    ...(o.branch ? { branch: o.branch } : {}),
    ...(o.commit ? { commit: o.commit } : {}),
    ...(o.run ? { run: o.run } : {}),
    process: "staging-render-log",
    // The log IS the capture. An entry written here is kept by definition —
    // unlike the activity log, where `capture` decides whether an entry
    // reaches git at all and `unknown` must never be read as `on`.
    capture: "on",
  };
}

/** Append one entry to the right day's file, creating the directory. */
export function appendEntry(dir: string, entry: RenderLogEntry): string {
  const rel = renderLogPath(entry.at);
  const abs = join(dir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  // `appendFileSync`, never read-modify-write: six workflows publish to this
  // branch, and a rewrite loses whatever landed between the read and the
  // write. An append of one line is what the JSONL format is for.
  appendFileSync(abs, serializeRenderLogEntry(entry), "utf8");
  return rel;
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return undefined;
  const v = argv[i].startsWith(`--${name}=`) ? argv[i].slice(name.length + 3) : argv[i + 1];
  return v === undefined || v === "" ? undefined : v;
}

const USAGE =
  `usage: render-log.ts --dir DIR --event <${RENDER_EVENTS.join("|")}> --kind K --path P \\\n` +
  `         --summary TEXT [--slug S] [--reason TEXT] [--detail TEXT] \\\n` +
  `         [--branch B] [--commit C] [--run URL]\n` +
  `       render-log.ts --dir DIR --read [--day YYYY-MM-DD]`;

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const dir = flag(argv, "dir");
  if (dir === undefined) {
    console.error(USAGE);
    process.exit(2);
  }

  // A read mode, because a log nobody can read back is a write-only file and
  // the skipped-line report is the half that matters: a short count must be
  // visible as short rather than passing for complete.
  if (argv.includes("--read")) {
    const day = flag(argv, "day") ?? new Date().toISOString().slice(0, 10);
    const abs = join(dir, renderLogPath(`${day}T00:00:00.000Z`));
    if (!existsSync(abs)) {
      console.log(`render-log: no log for ${day} at ${abs}`);
      process.exit(0);
    }
    const { entries, skipped } = readRenderLog(readFileSync(abs, "utf8"));
    for (const e of entries) console.log(`${e.at}  ${e.event.padEnd(9)} ${e.subject.path}  ${e.summary}`);
    console.log(`\n${entries.length} entr${entries.length === 1 ? "y" : "ies"}`);
    if (skipped.length > 0) {
      console.error(`${skipped.length} line(s) could not be read — the count above is SHORT:`);
      for (const s of skipped) console.error(`  line ${s.line}: ${s.reason}`);
      process.exit(1);
    }
    process.exit(0);
  }

  const event = flag(argv, "event");
  const kind = flag(argv, "kind");
  const path = flag(argv, "path");
  const summary = flag(argv, "summary");
  if (
    event === undefined ||
    kind === undefined ||
    path === undefined ||
    summary === undefined ||
    !(RENDER_EVENTS as readonly string[]).includes(event)
  ) {
    console.error(USAGE);
    process.exit(2);
  }

  try {
    const at = new Date().toISOString();
    const entry = buildEntry({
      event: event as RenderEvent,
      kind,
      path,
      slug: flag(argv, "slug"),
      summary,
      detail: flag(argv, "detail"),
      reason: flag(argv, "reason"),
      branch: flag(argv, "branch"),
      commit: flag(argv, "commit"),
      run: flag(argv, "run"),
      at,
      id: `${at.replace(/[:.]/g, "-")}-${event}-${(flag(argv, "slug") ?? kind).replace(/[^\w.-]/g, "-")}`,
    });
    const rel = appendEntry(dir, entry);
    console.log(`render-log: ${event} ${path} -> ${rel}`);
    process.exit(0);
  } catch (e) {
    console.error(`render-log: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}
