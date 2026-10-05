#!/usr/bin/env bun
/**
 * public-comment — intake and adjudication of public-review comments on a
 * document folio. Bean `v26p`, issue #197. Schema and lifecycle:
 * `folio-assistant-core/schemas/public-comment.ts`. Process:
 * `folio-assistant-core/processes/content/public-comment.bpmn`. Skill:
 * `public-comment`.
 *
 * ## The store
 *
 * One JSON file per comment, `<store>/comments/PC-0042.json`, so two editors
 * deciding two comments never conflict, plus `<store>/batches/<batch>.json`,
 * one per intake file, recording what it held and what became of each row.
 * `<store>/config.json` names the document, the editors and the committee.
 * The default store is `review/public-comment/` in the folio repository.
 *
 * ## The operations (each a task in public-comment.bpmn)
 *
 *   import <file.xlsx|.csv> [--channel comment-matrix|online-form] [--batch id]
 *   import-narrative <file.md|.txt> --reviewer "Name" [--org ..] [--country ..] [--acknowledge]
 *   list [--status open|<status>] [--page N] [--line L] [--block <label>] [--section 3.4] [--unplaced] [--json]
 *   triage <ref> [--type technical] [--priority high] [--to <label>]
 *   reassign <ref> --to <label>
 *   assign <ref> --to <login>[,<login>]
 *   recommend <ref> --code <decision> --by <login> [--rationale ..] [--url ..]
 *   decide <ref> --code <decision> --by <login> [--reason ..] [--branch ..] [--pr N]
 *   edit <ref> --branch <b> [--pr N] [--to <author login>] --by <login>   the author's step, human or agentic
 *   incorporate <ref> [--branch <b>] [--pr N] [--staging <url>] --by <login>
 *   duplicate <ref> --of <ref> --by <login>
 *   withdraw <ref> --by <login>
 *   github --event <event.json>     ingest committee/editor tags from an issue or PR comment
 *   summary [--json]                counts by status, decision, type and section
 *
 * Every command accepts `--repo <folio root>` and `--store <dir>`.
 *
 * ## The GitHub tag a committee member or editor writes
 *
 *     pc: PC-0042, PC-0043
 *     recommend: accepted-modified
 *
 *     The rationale, in as many lines as needed.
 *
 * `decide:` instead of `recommend:` records the editor's decision; a
 * `recommend:` is honoured from an editor or a committee member. Both roles
 * are DYNAMIC by default, read from the repository itself (owner, 2026-10-05:
 * *"committee list = dynamic list of collaborators in github repo. editor =
 * owner"*). GitHub stamps every comment event with the commenter's
 * `author_association`, so this needs no API call and no token:
 *
 * - **editor** = the repository's OWNER;
 * - **committee** = its collaborators: OWNER, MEMBER or COLLABORATOR.
 *
 * Adding someone as a collaborator on GitHub is the whole committee
 * on-boarding. An `editors` or `committee` list in `config.json` replaces that
 * role's default with exactly those logins. Anyone else's tag is reported and
 * left alone: a public comment thread is open to everyone, and the record is
 * not.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import type { AnchorBlock, ReviewAnchors } from "./docx-to-folio.js";
import {
  IN_EDIT_STATUSES,
  type Anchor,
  type Citation,
  DECISION_CODES,
  type DecisionCode,
  formatRef,
  OPEN_STATUSES,
  parseCaptionRef,
  parseLines,
  parseSection,
  PUBLIC_COMMENT_SCHEMA,
  PUBLIC_COMMENT_TRANSITIONS,
  PUBLIC_COMMENT_TYPES,
  type PublicComment,
  PublicCommentSchema,
  type PublicCommentType,
  reviewerId,
  transition,
} from "../schemas/public-comment.js";

type Cell = string | number | boolean | null;

// ── Store ────────────────────────────────────────────────────────

export interface StoreConfig {
  /** Document slug under folio/. */
  document: string;
  /**
   * GitHub logins whose `decide:` tags are honoured. Absent (the default): the
   * repository's owner, read from the comment event's `author_association`.
   * Present: exactly these logins.
   */
  editors?: string[];
  /**
   * GitHub logins whose `recommend:` tags are honoured. Absent (the default):
   * the repository's collaborators, read from the comment event's
   * `author_association`. Present: exactly these logins.
   */
  committee?: string[];
  /** Base URL of the published site, for deep links (main and STAGING/<slug>/). */
  site?: string;
}

export class Store {
  constructor(
    readonly repo: string,
    readonly dir: string,
  ) {}
  static open(repo: string, dir?: string) {
    return new Store(repo, resolve(repo, dir ?? "review/public-comment"));
  }
  config(): StoreConfig {
    const p = join(this.dir, "config.json");
    if (!existsSync(p)) throw new Error(`no ${p}: create it with {"document"}; "editors" and "committee" only to override the owner and collaborators defaults`);
    return JSON.parse(readFileSync(p, "utf-8"));
  }
  anchors(): ReviewAnchors {
    const p = join(this.repo, "folio", this.config().document, "review-anchors.json");
    if (!existsSync(p)) throw new Error(`no ${p}: run docx-to-folio.ts first`);
    return JSON.parse(readFileSync(p, "utf-8"));
  }
  /** Block text, for quote matching. Read lazily: most imports cite lines. */
  blockText(a: AnchorBlock): string {
    const p = join(this.repo, "folio", this.config().document, a.chapter, `${a.root}.md`);
    return existsSync(p) ? readFileSync(p, "utf-8") : a.excerpt;
  }
  all(): PublicComment[] {
    const d = join(this.dir, "comments");
    if (!existsSync(d)) return [];
    return readdirSync(d)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .map((f) => PublicCommentSchema.parse(JSON.parse(readFileSync(join(d, f), "utf-8"))));
  }
  get(ref: string): PublicComment {
    const r = normRef(ref);
    const p = join(this.dir, "comments", `${r}.json`);
    if (!existsSync(p)) throw new Error(`no comment ${r}`);
    return PublicCommentSchema.parse(JSON.parse(readFileSync(p, "utf-8")));
  }
  save(c: PublicComment) {
    mkdirSync(join(this.dir, "comments"), { recursive: true });
    writeFileSync(join(this.dir, "comments", `${c.public.ref}.json`), JSON.stringify(c, null, 2) + "\n");
  }
  saveBatch(id: string, data: unknown) {
    mkdirSync(join(this.dir, "batches"), { recursive: true });
    writeFileSync(join(this.dir, "batches", `${id}.json`), JSON.stringify(data, null, 2) + "\n");
  }
  batches(): Array<{ id: string; sha256?: string }> {
    const d = join(this.dir, "batches");
    if (!existsSync(d)) return [];
    return readdirSync(d).map((f) => JSON.parse(readFileSync(join(d, f), "utf-8")));
  }
}

const normRef = (r: string) => {
  const n = /(\d+)/.exec(r)?.[1];
  if (!n) throw new Error(`"${r}" is not a comment reference (PC-0042)`);
  return formatRef(Number(n));
};

// ── Anchor resolution ────────────────────────────────────────────

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Does the block cover line `l` of PDF page `p`? */
function covers(b: AnchorBlock, p: number, a: number, z: number): number {
  const last = b.pageEnd ?? b.page;
  if (p < b.page || p > last || b.lineStart === undefined) return 0;
  const lo = p === b.page ? b.lineStart : 1;
  const hi = p === last ? (b.lineEnd ?? b.lineStart) : 100_000;
  const o = Math.min(hi, z) - Math.max(lo, a) + 1;
  return o > 0 ? o : 0;
}

/**
 * Resolve where a comment points. In order of how much the reviewer said:
 * a table or figure number; page and lines; a quotation; a section; nothing.
 * The page is tried as the PRINTED page first (what a reader of the PDF
 * sees), then as the PDF's own page index, and a cited section breaks ties.
 */
export function resolveAnchor(c: Citation, text: string, anchors: ReviewAnchors, blockText?: (b: AnchorBlock) => string): Anchor {
  const secLabels = (num: string) => {
    const hits = anchors.sections.filter((s) => s.number === num || s.number?.startsWith(`${num}.`));
    return new Set(hits.map((s) => s.label));
  };
  const inSection = (b: AnchorBlock, labels: Set<string>) => b.sections.some((l) => labels.has(l));
  const section = c.section ? parseSection(c.section) : undefined;
  const secSet = section ? secLabels(section) : undefined;

  const cap = c.caption ?? parseCaptionRef(c.lines) ?? parseCaptionRef(text);
  if (cap) {
    const hit = anchors.blocks.filter((b) => b.caption === cap);
    if (hit.length === 1) return { targetLabel: hit[0].label, method: "caption", confidence: "high", candidates: [], note: `${cap} as cited` };
  }

  const ranges = parseLines(c.lines);
  const pageNum = c.page ? Number(/\d+/.exec(c.page)?.[0]) : NaN;
  if (ranges.length && Number.isFinite(pageNum)) {
    const pdfPages = new Set<number>();
    // Printed page → PDF page(s). Printed numbering restarts in front matter,
    // so one printed number can be several PDF pages; the section decides.
    for (const b of anchors.blocks) if (b.printedPage === String(pageNum)) pdfPages.add(b.page);
    const tries: Array<[string, number[]]> = [
      ["printed page", [...pdfPages]],
      ["PDF page", [pageNum]],
    ];
    for (const [how, pages] of tries) {
      const scored = anchors.blocks
        .map((b) => ({ b, s: pages.reduce((acc, p) => acc + ranges.reduce((x, [a, z]) => x + covers(b, p, a, z), 0), 0) }))
        .filter((x) => x.s > 0);
      if (!scored.length) continue;
      const preferred = secSet?.size ? scored.filter((x) => inSection(x.b, secSet)) : scored;
      const pool = (preferred.length ? preferred : scored).sort((x, y) => y.s - x.s);
      const agrees = !secSet?.size || preferred.length > 0;
      return {
        targetLabel: pool[0].b.label,
        method: "page-line",
        confidence: agrees && pages.length === 1 ? "high" : agrees ? "medium" : "low",
        candidates: pool.slice(1, 4).map((x) => x.b.label),
        note: `p.${c.page} l.${c.lines} read as the ${how}${section ? `; section ${section} ${agrees ? "agrees" : "does NOT agree"}` : ""}`,
      };
    }
  }

  // A quotation of at least a few words, in curly or straight quotes.
  const quotes = [...text.matchAll(/[“"‘']([^”"’']{24,})[”"’']/g)].map((m) => norm(m[1]));
  if (quotes.length && blockText) {
    const pool = secSet?.size ? anchors.blocks.filter((b) => inSection(b, secSet)) : anchors.blocks;
    for (const q of quotes) {
      const hits = pool.filter((b) => norm(blockText(b)).includes(q));
      if (hits.length) {
        return { targetLabel: hits[0].label, method: "quote", confidence: hits.length === 1 ? "medium" : "low", candidates: hits.slice(1, 4).map((b) => b.label), note: "quotation found in the text" };
      }
    }
  }

  if (section) {
    const s = anchors.sections.find((x) => x.number === section);
    if (s) return { targetLabel: s.label, method: "section", confidence: "medium", candidates: [], note: `section ${section} only` };
  }
  return { targetLabel: null, method: "unplaced", confidence: "low", candidates: [], note: "nothing in the citation resolved; triage places it" };
}

// ── Intake ───────────────────────────────────────────────────────

const str = (v: Cell | undefined) => (v === null || v === undefined ? "" : String(v)).replace(/ /g, " ").trim();

export interface ReviewerInput {
  name?: string;
  organisation?: string;
  country?: string;
  email?: string;
  acknowledge?: boolean;
}
export interface IntakeRow {
  row?: number;
  segment?: number;
  reviewer: ReviewerInput;
  citation: Citation;
  type?: string;
  text: string;
  suggestedRevision?: string;
}

/** The header cells that identify each column, by the words in them. */
const HEADERS: Array<[keyof IntakeRow | "section" | "page" | "lines" | "name" | "organisation" | "country" | "email", RegExp]> = [
  ["section", /section/i],
  ["page", /^\s*page/i],
  ["lines", /line|table|figure/i],
  ["type", /type/i],
  ["suggestedRevision", /suggest|revision|proposed/i],
  ["text", /comment|issue|feedback/i],
  ["name", /^\s*(reviewer\s*)?name/i],
  ["organisation", /organi[sz]ation|affiliation/i],
  ["country", /country|region/i],
  ["email", /e-?mail/i],
];

/**
 * Rows of a comment table: the WHO comment matrix (reviewer details in
 * label/value rows above a "No. | Section no. | Page | …" header), or a form
 * export (one header row, reviewer columns on every row). The header is the
 * first row naming both a comment column and a section or page column.
 */
export function tableRows(rows: Cell[][]): { rows: IntakeRow[]; skipped: Array<{ row: number; why: string }> } {
  const h = rows.findIndex((r) => r.some((c) => /comment|issue|feedback/i.test(str(c))) && r.some((c) => /section|page/i.test(str(c))));
  if (h < 0) throw new Error("no header row naming a comment column and a section or page column");
  const col: Partial<Record<string, number>> = {};
  rows[h].forEach((c, i) => {
    const t = str(c);
    // A cell names ONE column, the first pattern it matches, and each
    // column is taken by its first cell ("Line no(s), Table or Figure" is
    // lines; "Comment type" is type, not text).
    const hit = HEADERS.find(([k, re]) => re.test(t) && col[k] === undefined);
    if (hit) col[hit[0]] = i;
  });
  if (col.text === undefined) throw new Error("the header names no comment column");

  // Matrix-style reviewer details: "Label | value" rows above the header.
  const sheetReviewer: ReviewerInput = {};
  for (const r of rows.slice(0, h)) {
    const label = str(r[0]);
    const value = r.slice(1).map(str).find((v) => v) ?? "";
    if (!value) continue;
    if (/acknowledg/i.test(label)) sheetReviewer.acknowledge = /^y/i.test(value);
    else if (/e-?mail/i.test(label)) sheetReviewer.email = value;
    else if (/organi[sz]ation|affiliation/i.test(label)) sheetReviewer.organisation = value;
    else if (/country|region/i.test(label)) sheetReviewer.country = value;
    else if (/name/i.test(label)) sheetReviewer.name = value;
  }

  const out: IntakeRow[] = [];
  const skipped: Array<{ row: number; why: string }> = [];
  rows.slice(h + 1).forEach((r, k) => {
    const rowNo = h + 2 + k;
    const get = (key: string) => (col[key] === undefined ? "" : str(r[col[key]!]));
    const text = get("text");
    if (!text) return; // an empty template row
    if (/^e\.?g\.?$/i.test(str(r[0]))) {
      skipped.push({ row: rowNo, why: "the template's example row" });
      return;
    }
    const reviewer: ReviewerInput = { ...sheetReviewer };
    for (const k2 of ["name", "organisation", "country", "email"] as const) if (get(k2)) reviewer[k2] = get(k2);
    out.push({
      row: rowNo,
      reviewer,
      citation: {
        ...(get("section") ? { section: get("section") } : {}),
        ...(get("page") ? { page: get("page") } : {}),
        ...(get("lines") ? { lines: get("lines") } : {}),
        ...(parseCaptionRef(get("lines")) ? { caption: parseCaptionRef(get("lines")) } : {}),
        raw: [get("section") && `§${get("section")}`, get("page") && `p.${get("page")}`, get("lines") && `l.${get("lines")}`].filter(Boolean).join(" "),
      },
      type: get("type"),
      text,
      ...(get("suggestedRevision") ? { suggestedRevision: get("suggestedRevision") } : {}),
    });
  });
  return { rows: out, skipped };
}

/**
 * A narrative letter or email, split into passages. Each passage that cites
 * something (a section, a page and line, a table, a quotation) becomes its
 * own comment; passages that cite nothing are kept together as one general
 * comment, unplaced, for triage, rather than invented anchors.
 */
export function narrativeRows(text: string, reviewer: ReviewerInput): IntakeRow[] {
  const paras = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  const cited: IntakeRow[] = [];
  const general: string[] = [];
  paras.forEach((p, i) => {
    const sec = /(?:§|section|sect\.|chapter|appendix)\s*((?:[A-Z]\.)?\d+(?:\.\d+)*|[A-Z])\b/i.exec(p)?.[1];
    const page = /\b(?:page|p\.)\s*(\d+)/i.exec(p)?.[1];
    const lines = /\b(?:lines?|ll?\.)\s*(\d+(?:\s*[-–]\s*\d+)?)/i.exec(p)?.[1];
    const cap = parseCaptionRef(p);
    const quoted = /[“"][^”"]{24,}[”"]/.test(p);
    if (sec || (page && lines) || cap || quoted) {
      cited.push({
        segment: i,
        reviewer,
        citation: { ...(sec ? { section: sec } : {}), ...(page ? { page } : {}), ...(lines ? { lines } : {}), ...(cap ? { caption: cap } : {}), raw: p.slice(0, 120) },
        text: p,
      });
    } else general.push(p);
  });
  if (general.length) cited.unshift({ segment: 0, reviewer, citation: { raw: "(no citation)" }, type: "general", text: general.join("\n\n") });
  return cited;
}

const typeOf = (t: string | undefined): PublicCommentType | undefined => {
  const v = (t ?? "").toLowerCase();
  return (PUBLIC_COMMENT_TYPES as readonly string[]).find((x) => v.startsWith(x)) as PublicCommentType | undefined;
};

export interface ImportResult {
  batch: string;
  created: string[];
  unplaced: string[];
  skipped: Array<{ row: number; why: string }>;
  alreadyImported?: boolean;
}

export function importRows(
  store: Store,
  rows: IntakeRow[],
  src: { channel: "comment-matrix" | "online-form" | "narrative"; batch: string; sha256: string; skipped?: Array<{ row: number; why: string }> },
  at = new Date().toISOString(),
): ImportResult {
  if (store.batches().some((b) => b.sha256 === src.sha256)) {
    return { batch: src.batch, created: [], unplaced: [], skipped: [], alreadyImported: true };
  }
  const anchors = store.anchors();
  const existing = store.all();
  let next = existing.reduce((m, c) => Math.max(m, Number(c.public.ref.slice(3))), 0) + 1;
  const created: string[] = [];
  const unplaced: string[] = [];
  const ingest = PUBLIC_COMMENT_TRANSITIONS.find((t) => t.name === "ingest")!.by;
  for (const r of rows) {
    const ref = formatRef(next++);
    const anchor = resolveAnchor(r.citation, r.text, anchors, (b) => store.blockText(b));
    const ack = r.reviewer.acknowledge === true;
    const who = r.reviewer.email || r.reviewer.name || `${src.batch}#${r.row ?? r.segment ?? 0}`;
    const type = typeOf(r.type);
    const first = r.text.split("\n")[0];
    const c = PublicCommentSchema.parse({
      $schema: PUBLIC_COMMENT_SCHEMA,
      id: ref.toLowerCase(),
      summary: first.length > 120 ? `${first.slice(0, 119)}…` : first,
      comment: r.text,
      createdAt: at,
      targetLabel: anchor.targetLabel,
      status: "received",
      priority: type === "technical" ? "high" : "medium",
      origin: "human",
      tags: {
        roles: ["feedback-provider"],
        processes: [ingest.process],
        tasks: [{ process: ingest.process, task: ingest.task }],
      },
      public: {
        ref,
        source: {
          channel: src.channel,
          batch: src.batch,
          sha256: src.sha256,
          ...(r.row ? { row: r.row } : {}),
          ...(r.segment !== undefined ? { segment: r.segment } : {}),
          receivedAt: at,
        },
        reviewer: {
          id: reviewerId(who),
          ...(ack && r.reviewer.name ? { name: r.reviewer.name } : {}),
          ...(r.reviewer.organisation ? { organisation: r.reviewer.organisation } : {}),
          ...(r.reviewer.country ? { country: r.reviewer.country } : {}),
          ...(r.reviewer.acknowledge !== undefined ? { acknowledge: r.reviewer.acknowledge } : {}),
        },
        citation: r.citation,
        anchor,
        ...(type ? { type } : {}),
        text: r.text,
        ...(r.suggestedRevision ? { suggestedRevision: r.suggestedRevision } : {}),
        history: [{ at, transition: "ingest", by: "intake", task: `${ingest.process}#${ingest.task}`, note: `${src.batch}${r.row ? ` row ${r.row}` : ""}` }],
      },
    });
    store.save(c);
    created.push(ref);
    if (!anchor.targetLabel) unplaced.push(ref);
  }
  store.saveBatch(src.batch, {
    id: src.batch,
    channel: src.channel,
    sha256: src.sha256,
    importedAt: at,
    rows: rows.length,
    created,
    unplaced,
    skipped: src.skipped ?? [],
  });
  return { batch: src.batch, created, unplaced, skipped: src.skipped ?? [] };
}

function readRows(file: string): Cell[][][] {
  const here = dirname(new URL(import.meta.url).pathname);
  const r = spawnSync("python3", [join(here, "intake-rows.py"), file], { encoding: "utf-8", maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(r.stderr || `intake-rows.py exited ${r.status}`);
  return (JSON.parse(r.stdout).sheets as Array<{ rows: Cell[][] }>).map((s) => s.rows);
}

// ── GitHub tags ──────────────────────────────────────────────────

export interface GithubTag {
  refs: string[];
  verb: "recommend" | "decide";
  code: DecisionCode;
  text: string;
}

export function parseGithubTag(body: string): GithubTag | { error: string } | null {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const header: Record<string, string> = {};
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  for (; i < lines.length; i++) {
    const m = /^\s*(pc|recommend|decide):\s*(.*?)\s*$/i.exec(lines[i]);
    if (!m) break;
    header[m[1].toLowerCase()] = m[2];
  }
  if (!header.pc) return null;
  const verb = header.decide !== undefined ? "decide" : header.recommend !== undefined ? "recommend" : null;
  if (!verb) return { error: "`pc:` needs a `recommend:` or `decide:` line" };
  const code = (header[verb] ?? "").toLowerCase().replace(/\s+/g, "-") as DecisionCode;
  if (!DECISION_CODES.includes(code)) return { error: `\`${verb}: ${header[verb]}\` is not one of ${DECISION_CODES.join(", ")}` };
  const refs = [...header.pc.matchAll(/PC-?\s*(\d+)/gi)].map((m) => formatRef(Number(m[1])));
  if (!refs.length) return { error: "`pc:` names no comment (PC-0042)" };
  return { refs, verb, code, text: lines.slice(i).join("\n").trim() };
}

/** The `author_association` values that make a commenter a collaborator on the repository. */
export const COLLABORATOR_ASSOCIATIONS = ["OWNER", "MEMBER", "COLLABORATOR"] as const;

/** The `author_association` value that makes a commenter the repository's owner. */
export const OWNER_ASSOCIATIONS = ["OWNER"] as const;

const hasAssociation = (set: readonly string[], association?: string) => set.includes((association ?? "").toUpperCase());

/** Is this commenter an editor? See the module docblock. */
export function isEditor(cfg: Pick<StoreConfig, "editors">, login: string, association?: string): boolean {
  if (cfg.editors) return cfg.editors.includes(login);
  return hasAssociation(OWNER_ASSOCIATIONS, association);
}

/** Is this commenter on the review committee? See the module docblock. */
export function isCommittee(cfg: Pick<StoreConfig, "committee">, login: string, association?: string): boolean {
  if (cfg.committee) return cfg.committee.includes(login);
  return hasAssociation(COLLABORATOR_ASSOCIATIONS, association);
}

export function applyGithubComment(
  store: Store,
  ev: { login: string; body: string; url: string; at: string; association?: string },
): { applied: string[]; refused: string[] } {
  const tag = parseGithubTag(ev.body);
  if (tag === null) return { applied: [], refused: [] };
  if ("error" in tag) return { applied: [], refused: [tag.error] };
  const cfg = store.config();
  const editor = isEditor(cfg, ev.login, ev.association);
  const allowed = tag.verb === "decide" ? editor : editor || isCommittee(cfg, ev.login, ev.association);
  if (!allowed) {
    const who =
      tag.verb === "decide"
        ? cfg.editors
          ? "an editor in config.json"
          : "the owner of this repository (the default editor)"
        : cfg.committee
          ? "on the committee list in config.json, or an editor"
          : "a collaborator on this repository, or an editor";
    return { applied: [], refused: [`${ev.login} is not ${who}`] };
  }
  const applied: string[] = [];
  const refused: string[] = [];
  for (const ref of tag.refs) {
    try {
      let c = store.get(ref);
      if (tag.verb === "recommend") {
        // A recommendation on a comment nobody assigned yet assigns it to the
        // recommender first, so the record shows who looked at it.
        if (c.status === "received") c = transition(c, "triage", { by: ev.login, at: ev.at });
        if (c.status === "triaged") c = transition(c, "assign", { by: ev.login, at: ev.at, assignees: [ev.login] });
        c = transition(c, "recommend", { by: ev.login, at: ev.at, recommendation: { by: ev.login, code: tag.code, rationale: tag.text, url: ev.url } });
      } else {
        c = transition(c, "decide", { by: ev.login, at: ev.at, decision: { code: tag.code, reason: tag.text } });
      }
      store.save(c);
      applied.push(ref);
    } catch (e) {
      refused.push(`${ref}: ${(e as Error).message}`);
    }
  }
  return { applied, refused };
}

// ── Listing ──────────────────────────────────────────────────────

export interface ListFilter {
  status?: string;
  page?: number;
  line?: number;
  block?: string;
  section?: string;
  unplaced?: boolean;
}

export function filterComments(all: PublicComment[], anchors: ReviewAnchors, f: ListFilter): PublicComment[] {
  const byLabel = new Map(anchors.blocks.map((b) => [b.label, b]));
  const secOf = (label: string | null) => {
    if (!label) return [];
    const b = byLabel.get(label);
    return b ? b.sections : [label];
  };
  const secNums = new Map(anchors.sections.map((s) => [s.label, s.number ?? ""]));
  return all.filter((c) => {
    if (f.status === "open" && !OPEN_STATUSES.includes(c.status)) return false;
    if (f.status && f.status !== "open" && c.status !== f.status) return false;
    if (f.unplaced && c.targetLabel) return false;
    if (f.block && c.targetLabel !== f.block) return false;
    if (f.section && !secOf(c.targetLabel).some((l) => (secNums.get(l) ?? "") === f.section || (secNums.get(l) ?? "").startsWith(`${f.section}.`))) return false;
    if (f.page !== undefined) {
      const b = c.targetLabel ? byLabel.get(c.targetLabel) : undefined;
      const cited = c.public.citation.page === String(f.page);
      const inBlock = b && f.page >= b.page && f.page <= (b.pageEnd ?? b.page);
      if (!cited && !inBlock) return false;
      if (f.line !== undefined && !(b && covers(b, f.page, f.line, f.line) > 0) && !parseLines(c.public.citation.lines).some(([a, z]) => f.line! >= a && f.line! <= z)) return false;
    }
    return true;
  });
}

export function summary(all: PublicComment[]) {
  const count = (k: (c: PublicComment) => string) =>
    all.reduce<Record<string, number>>((m, c) => ((m[k(c)] = (m[k(c)] ?? 0) + 1), m), {});
  return {
    total: all.length,
    open: all.filter((c) => OPEN_STATUSES.includes(c.status)).length,
    inEdit: all.filter((c) => IN_EDIT_STATUSES.includes(c.status)).length,
    unplaced: all.filter((c) => !c.targetLabel).length,
    byStatus: count((c) => c.status),
    byDecision: count((c) => c.public.decision?.code ?? "undecided"),
    byType: count((c) => c.public.type ?? "untyped"),
  };
}

// ── CLI ──────────────────────────────────────────────────────────

if (import.meta.main) {
  const [cmd, ...args] = process.argv.slice(2);
  const opt = (n: string) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const flag = (n: string) => args.includes(`--${n}`);
  const positional = args.find((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1].startsWith("--")));
  const store = Store.open(resolve(opt("repo") ?? process.cwd()), opt("store"));
  const now = new Date().toISOString();
  const by = opt("by") ?? process.env.GITHUB_ACTOR ?? "editor";
  const show = (c: PublicComment) =>
    `${c.public.ref}  ${c.status.padEnd(12)} ${(c.public.type ?? "").padEnd(9)} ${(c.targetLabel ?? "(unplaced)").padEnd(28)} ${c.public.citation.raw ?? ""}  ${c.summary.slice(0, 70)}`;
  try {
    switch (cmd) {
      case "import": {
        if (!positional) throw new Error("import <file.xlsx|file.csv>");
        const file = resolve(positional);
        const sha256 = createHash("sha256").update(readFileSync(file)).digest("hex");
        const sheets = readRows(file);
        const sheet = sheets.find((rows) => {
          try {
            tableRows(rows);
            return true;
          } catch {
            return false;
          }
        });
        if (!sheet) throw new Error(`${basename(file)}: no sheet has a comment table`);
        const t = tableRows(sheet);
        const channel = (opt("channel") as "comment-matrix" | "online-form") ?? (file.endsWith(".csv") ? "online-form" : "comment-matrix");
        const batch = opt("batch") ?? basename(file).replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9._-]+/g, "-");
        const r = importRows(store, t.rows, { channel, batch, sha256, skipped: t.skipped }, now);
        if (r.alreadyImported) console.error(`= ${basename(file)} was already imported (same sha256); nothing to do`);
        else console.error(`✓ ${batch}: ${r.created.length} comment(s) ${r.created[0] ?? ""}${r.created.length > 1 ? `…${r.created.at(-1)}` : ""}, ${r.unplaced.length} unplaced, ${r.skipped.length} skipped`);
        break;
      }
      case "import-narrative": {
        if (!positional) throw new Error("import-narrative <file> --reviewer <name>");
        const file = resolve(positional);
        const raw = readFileSync(file);
        const reviewer: ReviewerInput = {
          ...(opt("reviewer") ? { name: opt("reviewer") } : {}),
          ...(opt("org") ? { organisation: opt("org") } : {}),
          ...(opt("country") ? { country: opt("country") } : {}),
          acknowledge: flag("acknowledge"),
        };
        const batch = opt("batch") ?? basename(file).replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9._-]+/g, "-");
        const r = importRows(store, narrativeRows(raw.toString("utf-8"), reviewer), { channel: "narrative", batch, sha256: createHash("sha256").update(raw).digest("hex") }, now);
        console.error(r.alreadyImported ? `= already imported` : `✓ ${batch}: ${r.created.length} passage(s) → ${r.created.join(", ")}; ${r.unplaced.length} unplaced`);
        break;
      }
      case "list": {
        const out = filterComments(store.all(), store.anchors(), {
          status: opt("status"),
          page: opt("page") ? Number(opt("page")) : undefined,
          line: opt("line") ? Number(opt("line")) : undefined,
          block: opt("block"),
          section: opt("section"),
          unplaced: flag("unplaced"),
        });
        if (flag("json")) console.log(JSON.stringify(out, null, 2));
        else for (const c of out) console.log(show(c));
        console.error(`${out.length} comment(s)`);
        break;
      }
      case "summary": {
        const s = summary(store.all());
        console.log(flag("json") ? JSON.stringify(s, null, 2) : Object.entries(s).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n"));
        break;
      }
      case "github": {
        const ev = JSON.parse(readFileSync(resolve(opt("event")!), "utf-8"));
        const c = ev.comment ?? ev.review;
        if (!c?.body) {
          console.error("no comment body in the event; nothing to do");
          break;
        }
        const r = applyGithubComment(store, {
          login: c.user.login,
          body: c.body,
          url: c.html_url,
          at: c.updated_at ?? c.created_at ?? now,
          association: c.author_association,
        });
        for (const x of r.applied) console.error(`✓ ${x}`);
        for (const x of r.refused) console.error(`✗ ${x}`);
        break;
      }
      default: {
        const name = cmd;
        if (!PUBLIC_COMMENT_TRANSITIONS.some((t) => t.name === name) || name === "ingest") {
          throw new Error(`unknown command "${cmd}". See the module docblock for the commands.`);
        }
        if (!positional) throw new Error(`${name} <PC-ref>`);
        let c = store.get(positional);
        const anchors = name === "reassign" || (name === "triage" && opt("to")) ? store.anchors() : undefined;
        const target = opt("to");
        if (anchors && target && !anchors.blocks.some((b) => b.label === target) && !anchors.sections.some((s) => s.label === target)) {
          throw new Error(`${target} is not a block or section label in the folio`);
        }
        c = transition(c, name, {
          by,
          at: now,
          note: opt("note"),
          ...(anchors && target ? { anchor: { targetLabel: target, method: "manual", confidence: "high", candidates: [], note: opt("note") ?? `placed by ${by}` } } : {}),
          ...(name === "assign" || name === "edit" ? { assignees: (target ?? "").split(",").filter(Boolean) } : {}),
          ...(opt("type") ? { type: opt("type") as PublicCommentType } : {}),
          ...(opt("priority") ? { priority: opt("priority") } : {}),
          ...(name === "recommend" ? { recommendation: { by, code: opt("code") as DecisionCode, rationale: opt("rationale") ?? "", ...(opt("url") ? { url: opt("url") } : {}) } } : {}),
          ...(name === "decide"
            ? { decision: { code: opt("code") as DecisionCode, reason: opt("reason") ?? "", ...(opt("branch") ? { changeSet: { branch: opt("branch")!, ...(opt("pr") ? { pr: Number(opt("pr")) } : {}) } } : {}) } }
            : {}),
          ...(name === "edit" ? { changeSet: { branch: opt("branch") ?? "", ...(opt("pr") ? { pr: Number(opt("pr")) } : {}) } } : {}),
          ...(name === "incorporate" && opt("branch") ? { changeSet: { branch: opt("branch")!, ...(opt("pr") ? { pr: Number(opt("pr")) } : {}), ...(opt("staging") ? { stagingUrl: opt("staging") } : {}) } } : {}),
          ...(name === "duplicate" ? { duplicateOf: opt("of") ? normRef(opt("of")!) : undefined } : {}),
        });
        store.save(c);
        console.error(`✓ ${c.public.ref}: ${name} → ${c.status}`);
      }
    }
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
