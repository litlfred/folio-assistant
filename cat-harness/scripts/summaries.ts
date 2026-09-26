#!/usr/bin/env bun
/**
 * The block-summary queue — drained slowly, a few blocks at a time.
 *
 * Owner, 2026-09-24: *"on library/ page, the extract of a node is shown, but
 * no agentic summary"*, and on scope: *"Make as QA sidecar as part of general
 * doc ingestion to slowly drain."*
 *
 * Every prose block in every declared library enters this queue the moment it
 * exists: the queue is DERIVED (prose blocks minus the ones already carrying
 * a current summary), so nothing has to remember to enqueue anything, and a
 * re-ingested document whose text changed re-enters it on its own because its
 * summary's `source_hash` no longer matches.
 *
 * ```sh
 * bun run summaries                                  # the backlog, per entry
 * bun run summaries:next -- --n 5 [--entry <slug>]   # the next K blocks, WITH their text, as JSON
 * bun run summaries:record -- drafts.json            # write an agent's drafts as sidecars
 * ```
 *
 * ## Slowly, and never a gate
 *
 * 1335 prose blocks had no summary when this landed. Writing them in one pass
 * would be a thousand unreviewed machine summaries arriving at once — the
 * reviewer's queue buried, and every one of them a `draft` nobody will look
 * at. So an agent session doing ingestion work drains K at a time, and the
 * backlog is REPORTED (here, by `check:l1-complete`, on the library page) and
 * never failed on — the same advisory standing as the narrative review queue,
 * where a draft is work waiting on a person and not a defect.
 *
 * ## It writes drafts and nothing else
 *
 * `record` writes `state: "draft"` and refuses anything else. Confirming or
 * rejecting is a person's act and goes through `bun run narratives`, which
 * reads these sidecars (`NARRATIVE_BEARING` includes `summaries.json`) and
 * refuses to run outside a terminal. A tool that could both draft and confirm
 * would be one flag away from the failure the state machine exists to stop.
 *
 * @module scripts/summaries
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, posix, relative, resolve } from "node:path";

import { AttributionSchema, type Attribution } from "../schemas/attribution.ts";
import {
  BLOCK_SUMMARIES_SCHEMA,
  BlockSummariesSidecarSchema,
  NOT_PROSE_STATUSES,
  SUMMARIES_FILE,
  SUMMARISABLE_KINDS,
  inBacklog,
  bodyHash,
  proseBody,
  summaryStatus,
  type BlockSummariesSidecar,
  type BlockSummary,
  type SummaryStatus,
} from "../schemas/block-summary.ts";
import { NarrativeSchema, type Narrative } from "../schemas/narrative.ts";
import { directoriesForGraph, repoRootFor } from "../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "..");

/** One prose block, as the queue sees it. */
export interface SummaryItem {
  /** The block's `@id`. */
  block: string;
  /** The entry's slug. */
  entry: string;
  /** Absolute path of the entry directory. */
  entryDir: string;
  title: string;
  pageStart: number | null;
  pageEnd: number | null;
  /** The text file, ENTRY-relative, or null when the block names none. */
  source: string | null;
  /** {@link proseBody} of the source, or null when unreadable. */
  body: string | null;
  /** Its sha256, or null when unreadable. */
  hash: string | null;
  /** The sidecar's record for this block, if any. */
  record?: BlockSummary;
  status: SummaryStatus;
}

/** The entry's sidecar, parsed. `undefined` when absent; throws when present and invalid. */
export function readSidecar(entryDir: string): BlockSummariesSidecar | undefined {
  const f = join(entryDir, SUMMARIES_FILE);
  if (!existsSync(f)) return undefined;
  const raw = JSON.parse(readFileSync(f, "utf-8")) as unknown;
  const r = BlockSummariesSidecarSchema.safeParse(raw);
  if (!r.success) {
    const i = r.error.issues[0];
    throw new Error(`${f}: ${i?.path.join(".") || "(root)"} — ${i?.message ?? "invalid"}`);
  }
  return r.data;
}

/** A block's `text`, resolved from `blocks/` to an ENTRY-relative path. */
function entryRelative(textFromBlocksDir: string): string {
  return posix.normalize(posix.join("blocks", textFromBlocksDir.split("\\").join("/")));
}

/**
 * Every summarisable block in one entry, with its status, in page order.
 *
 * `sidecar` is taken as an argument so a caller that has already failed to
 * parse one can still ask what the blocks are.
 */
export function entryItems(entryDir: string, sidecar = readSidecar(entryDir)): SummaryItem[] {
  const blocksDir = join(entryDir, "blocks");
  if (!existsSync(blocksDir)) return [];
  const byBlock = new Map((sidecar?.summaries ?? []).map((s) => [s.block, s]));
  const entry = basename(entryDir);
  const out: SummaryItem[] = [];
  for (const f of readdirSync(blocksDir).sort()) {
    if (!f.endsWith(".jsonld")) continue;
    let d: Record<string, unknown>;
    try {
      d = JSON.parse(readFileSync(join(blocksDir, f), "utf-8")) as Record<string, unknown>;
    } catch {
      continue; // an unparseable block is `narrative-provenance`'s finding, not this queue's
    }
    if (typeof d.kind !== "string" || !SUMMARISABLE_KINDS.includes(d.kind)) continue;
    const block = typeof d["@id"] === "string" ? (d["@id"] as string) : f.replace(/\.jsonld$/, "");
    const source = typeof d.text === "string" ? entryRelative(d.text) : null;
    let body: string | null = null;
    if (source !== null) {
      try {
        body = proseBody(readFileSync(join(entryDir, source), "utf-8"));
      } catch {
        body = null;
      }
    }
    const hash = body === null ? null : bodyHash(body);
    const record = byBlock.get(block);
    out.push({
      block,
      entry,
      entryDir,
      title: typeof d.title === "string" ? d.title : "",
      pageStart: typeof d.pageStart === "number" ? d.pageStart : null,
      pageEnd: typeof d.pageEnd === "number" ? d.pageEnd : null,
      source,
      body,
      hash,
      record,
      status: summaryStatus(record, body),
    });
  }
  // Page order, then id, unplaced last — the order `readEntryBlocks` shows.
  return out.sort(
    (a, b) => (a.pageStart ?? Infinity) - (b.pageStart ?? Infinity) || a.block.localeCompare(b.block),
  );
}

/** Every entry directory in every declared library, sorted. */
export function entryDirs(root = ROOT): string[] {
  const out: string[] = [];
  // EVERY declared library, not the first. A drain that sees one library
  // reports a backlog that is short by the rest, with no sign that it is.
  for (const lib of directoriesForGraph(root, "library").filter((d) => existsSync(d)).sort()) {
    for (const slug of readdirSync(lib).sort()) {
      const dir = join(lib, slug);
      if (statSync(dir).isDirectory()) out.push(dir);
    }
  }
  return out;
}

/** Counts for one entry, or for a whole corpus. */
export interface SummaryTally {
  /** Prose blocks with readable, non-empty text. */
  prose: number;
  /** `draft` + `confirmed` against the current text. */
  summarised: number;
  /** `prose - summarised`: what the drain still owes. */
  backlog: number;
  draft: number;
  confirmed: number;
  stale: number;
  rejected: number;
  notSummarised: number;
  /** Prose blocks whose text cannot be read. Not in `prose`, not in `backlog`. */
  unreadable: number;
  /** Prose blocks whose text is empty. Not in `prose`, not in `backlog`. */
  empty: number;
}

/**
 * Counts over anything carrying a status — a queue item, or a block's
 * projected summary in the viewer. One definition of "backlog", whichever
 * reader asks.
 */
export function tally(items: readonly { status: SummaryStatus }[]): SummaryTally {
  const n = (s: SummaryStatus) => items.filter((i) => i.status === s).length;
  const t: SummaryTally = {
    prose: items.filter((i) => !NOT_PROSE_STATUSES.includes(i.status)).length,
    summarised: n("draft") + n("confirmed"),
    backlog: items.filter((i) => inBacklog(i.status)).length,
    draft: n("draft"),
    confirmed: n("confirmed"),
    stale: n("stale"),
    rejected: n("rejected"),
    notSummarised: n("not-summarised"),
    unreadable: n("unreadable"),
    empty: n("empty"),
  };
  return t;
}

/** The backlog across every declared library, in drain order. */
export function backlog(root = ROOT, opts: { entry?: string } = {}): SummaryItem[] {
  const out: SummaryItem[] = [];
  for (const dir of entryDirs(root)) {
    if (opts.entry && basename(dir) !== opts.entry) continue;
    for (const it of entryItems(dir)) if (inBacklog(it.status)) out.push(it);
  }
  return out;
}

/** What `summaries:next` hands an agent for one block. */
export interface NextBlock {
  entry: string;
  block: string;
  title: string;
  pages: string;
  /** Entry-relative. */
  source: string;
  /** Echo this back in the draft; `record` refuses a draft whose text has moved since. */
  source_hash: string;
  status: SummaryStatus;
  /** When the last draft was rejected: what it said and why it was turned down. */
  rejected?: { text: string; reason: string };
  text: string;
}

export function next(root = ROOT, opts: { n?: number; entry?: string } = {}): NextBlock[] {
  const k = opts.n ?? 5;
  return backlog(root, { entry: opts.entry })
    .slice(0, k)
    .map((it) => {
      const nar = it.record?.narrative;
      return {
        entry: it.entry,
        block: it.block,
        title: it.title,
        pages:
          it.pageStart === null
            ? ""
            : it.pageEnd !== null && it.pageEnd !== it.pageStart
              ? `${it.pageStart}-${it.pageEnd}`
              : String(it.pageStart),
        source: it.source ?? "",
        source_hash: it.hash ?? "",
        status: it.status,
        ...(nar?.state === "rejected" && nar.text && nar.rejection_reason
          ? { rejected: { text: nar.text, reason: nar.rejection_reason } }
          : {}),
        text: it.body ?? "",
      };
    });
}

/** An agent's drafts, as `summaries:record` reads them. */
export interface DraftFile {
  drafted_by: Attribution;
  /** ISO date; defaults to today. */
  drafted_at?: string;
  drafts: { block: string; source_hash: string; text: string; state?: string }[];
}

/**
 * Write an agent's drafts into the entries' sidecars.
 *
 * Refuses, before writing anything:
 * - a draft whose `state` is anything but `draft` — only a person confirms;
 * - an author who is not an `agent` naming its `model` — this is the AGENT
 *   drain; a person's summary is not a draft awaiting that person;
 * - a block that is not a summarisable block of any declared entry;
 * - a `source_hash` that is not the text's hash NOW — the agent summarised
 *   something that has since changed, and recording it would make a stale
 *   summary look current from its first moment;
 * - a block whose summary is already a current draft or confirmation — a
 *   person's `confirmed` is never overwritten by a new draft.
 *
 * A rejected or stale record is replaced, and the narrative it held is kept
 * under `superseded`, so a rejection's reason outlives the redraft.
 *
 * All-or-nothing: every draft is checked before any file is touched.
 */
export function record(file: DraftFile, root = ROOT): { written: string[]; blocks: number } {
  const by = AttributionSchema.safeParse(file.drafted_by);
  if (!by.success) throw new Error(`drafted_by: ${by.error.issues[0]?.message ?? "invalid attribution"}`);
  if (by.data.kind !== "agent") {
    throw new Error(`drafted_by.kind is "${by.data.kind}": this records an AGENT's drafts, and names its model`);
  }
  const at = file.drafted_at ?? new Date().toISOString().slice(0, 10);

  // Index every summarisable block once. Slugs are unique across libraries —
  // `check:l1-complete` refuses a duplicate — so the entry is found from the id.
  const items = new Map<string, SummaryItem>();
  for (const dir of entryDirs(root)) for (const it of entryItems(dir)) items.set(it.block, it);

  const byEntry = new Map<string, { dir: string; recs: BlockSummary[] }>();
  const seen = new Set<string>();
  for (const d of file.drafts) {
    if (d.state !== undefined && d.state !== "draft") {
      throw new Error(`${d.block}: state "${d.state}" refused — an agent writes drafts; only a person confirms or rejects`);
    }
    if (seen.has(d.block)) throw new Error(`${d.block}: drafted twice in one file`);
    seen.add(d.block);
    const it = items.get(d.block);
    if (!it) throw new Error(`${d.block}: not a summarisable block of any declared library entry`);
    if (it.hash === null || it.source === null || it.status === "empty") {
      throw new Error(`${d.block}: it has no text to summarise (${it.status})`);
    }
    if (d.source_hash !== it.hash) {
      throw new Error(`${d.block}: source_hash does not match the text as it is now — re-run summaries:next`);
    }
    if (it.status === "draft" || it.status === "confirmed") {
      throw new Error(`${d.block}: already has a current ${it.status} summary — nothing to drain here`);
    }
    const narrative: Narrative = { text: d.text.trim(), state: "draft", drafted_by: by.data, drafted_at: at };
    const nr = NarrativeSchema.safeParse(narrative);
    if (!nr.success) throw new Error(`${d.block}: ${nr.error.issues[0]?.message ?? "invalid narrative"}`);
    const prior = it.record;
    const superseded = prior ? [...(prior.superseded ?? []), prior.narrative] : undefined;
    const rec: BlockSummary = {
      block: d.block,
      source: it.source,
      source_hash: it.hash,
      narrative: nr.data,
      ...(superseded ? { superseded } : {}),
    };
    const slot = byEntry.get(it.entry) ?? { dir: it.entryDir, recs: [] };
    slot.recs.push(rec);
    byEntry.set(it.entry, slot);
  }

  // Compose and VALIDATE every file before writing any of them.
  const out: { path: string; doc: BlockSummariesSidecar }[] = [];
  for (const [entry, { dir, recs }] of byEntry) {
    const existing = readSidecar(dir);
    const merged = new Map((existing?.summaries ?? []).map((s) => [s.block, s]));
    for (const r of recs) merged.set(r.block, r);
    const doc = {
      $schema: BLOCK_SUMMARIES_SCHEMA,
      entry,
      summaries: [...merged.values()].sort((a, b) => a.block.localeCompare(b.block)),
    };
    const v = BlockSummariesSidecarSchema.safeParse(doc);
    if (!v.success) throw new Error(`${entry}: ${v.error.issues[0]?.message ?? "invalid sidecar"}`);
    out.push({ path: join(dir, SUMMARIES_FILE), doc: v.data });
  }
  for (const o of out) writeFileSync(o.path, JSON.stringify(o.doc, null, 2) + "\n", "utf-8");
  return { written: out.map((o) => relative(repoRootFor(root), o.path)), blocks: file.drafts.length };
}

/**
 * Semantic QA over one entry's sidecar — what the schema cannot see.
 *
 * The schema says a record is well-formed. It cannot say the record is ABOUT
 * anything: that its block exists, is prose, and points at the text the
 * record says it summarised. A record naming a block that re-ingestion
 * renamed is a broken reference, and a reader following it gets nothing.
 *
 * Returns defects. Staleness is NOT one — a stale summary is backlog, and
 * the drain is advisory.
 */
export function sidecarDefects(entryDir: string): string[] {
  let sidecar: BlockSummariesSidecar | undefined;
  try {
    sidecar = readSidecar(entryDir);
  } catch (e) {
    return [`${SUMMARIES_FILE} will not parse: ${e instanceof Error ? e.message.split(": ").slice(1).join(": ") : e}`];
  }
  if (!sidecar) return [];
  const out: string[] = [];
  const slug = basename(entryDir);
  if (sidecar.entry !== slug) out.push(`${SUMMARIES_FILE} names entry "${sidecar.entry}", but sits in ${slug}/`);
  const items = new Map(entryItems(entryDir, sidecar).map((i) => [i.block, i]));
  for (const s of sidecar.summaries) {
    const it = items.get(s.block);
    if (!it) out.push(`${s.block}: no such prose block in this entry`);
    else if (it.source !== s.source) out.push(`${s.block}: records source ${s.source}, the block reads ${it.source}`);
  }
  return out;
}

function pad(s: string | number, n: number): string {
  return String(s).padStart(n);
}

function listing(root: string): void {
  const rows: { entry: string; t: SummaryTally }[] = [];
  for (const dir of entryDirs(root)) {
    let items: SummaryItem[];
    try {
      items = entryItems(dir);
    } catch (e) {
      console.error(`  ✗ ${relative(repoRootFor(root), dir)}: ${e instanceof Error ? e.message : e}`);
      continue;
    }
    const t = tally(items);
    if (t.prose + t.unreadable + t.empty > 0) rows.push({ entry: relative(repoRootFor(root), dir), t });
  }
  const all = tally(entryDirs(root).flatMap((d) => {
    try {
      return entryItems(d);
    } catch {
      return [];
    }
  }));
  console.log(`${"entry".padEnd(66)} prose  done  draft  conf  stale  rej  backlog`);
  for (const { entry, t } of rows) {
    console.log(
      `${entry.padEnd(66)} ${pad(t.prose, 5)} ${pad(t.summarised, 5)} ${pad(t.draft, 6)} ${pad(t.confirmed, 5)} ` +
        `${pad(t.stale, 6)} ${pad(t.rejected, 4)} ${pad(t.backlog, 8)}`,
    );
  }
  console.log(
    `\n${all.backlog} of ${all.prose} prose block(s) await an agent summary ` +
      `(${all.notSummarised} never summarised, ${all.stale} stale, ${all.rejected} rejected); ` +
      `${all.draft} draft(s) await a person (bun run narratives), ${all.confirmed} confirmed.` +
      (all.unreadable ? ` ${all.unreadable} block(s) have unreadable text.` : "") +
      (all.empty ? ` ${all.empty} block(s) have empty text and nothing to summarise.` : ""),
  );
  console.log("Advisory: drained a few at a time — bun run summaries:next -- --n 5");
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const mode = argv[0];
  try {
    if (mode === "next") {
      const n = Number(flag(argv, "--n") ?? "5");
      if (!Number.isInteger(n) || n < 1) throw new Error("--n takes a positive integer");
      console.log(JSON.stringify(next(ROOT, { n, entry: flag(argv, "--entry") }), null, 2));
    } else if (mode === "record") {
      const f = argv[1];
      if (!f) throw new Error("usage: bun run summaries:record -- <drafts.json>");
      const file = JSON.parse(readFileSync(resolve(f), "utf-8")) as DraftFile;
      const r = record(file, ROOT);
      console.log(`recorded ${r.blocks} draft(s) in ${r.written.join(", ")}`);
      console.log("They are DRAFTS. A person confirms or rejects them with `bun run narratives`.");
    } else if (mode === undefined || mode === "list") {
      if (argv.includes("--json")) {
        console.log(JSON.stringify(tally(entryDirs(ROOT).flatMap((d) => entryItems(d))), null, 2));
      } else listing(ROOT);
    } else {
      throw new Error(`unknown mode "${mode}" — list | next | record`);
    }
  } catch (e) {
    console.error(String(e instanceof Error ? e.message : e));
    process.exit(1);
  }
}
