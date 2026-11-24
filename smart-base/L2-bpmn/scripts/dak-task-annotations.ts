#!/usr/bin/env bun
/**
 * dak-task-annotations.ts: a DAK document's per-task "NOTES AND ANNOTATIONS",
 * matched to the tasks of its BPMN files and written as one reviewable
 * `<file>.tasks.json` beside each `.bpmn` (`dak-task-annotations/v1`,
 * `../schemas/task-annotations.ts`). `../schemas/extract-bpmn.ts` reads that
 * file and puts the annotations in the knowledge graph as `dak-task describes
 * bpmn-task`.
 *
 * ## Why from the L1 text, and why a sidecar
 *
 * Every DAK business process has a workflow figure followed by a numbered list,
 * one item per step, each with `»` bullets: the DAK's task table. The L1
 * library (who-iris) holds it as flattened section text; no BPMN task carries
 * it, and the KG's `dak-task` had no instances (findings/
 * bpmn-task-annotations-2026-11-18.md). The owner chose a committed sidecar per
 * BPMN, represented in the KG, with no BPMN extensions and nothing FHIR-specific
 * (2026-11-18). The BPMN file is read, never written.
 *
 * ## Matching, strongest first, and never a guess
 *
 * An item's number is its step number: figure box "1." is item 1 is activity
 * `IMMZ.B1` in the DAK spreadsheets. An item is joined to a BPMN node (a task,
 * a sub-process or a gateway: annotations describe decisions too) by:
 *
 *   1. `id`          the node's @id is the activity id (`IMMZ.B1`, `IMMZ.B.1`);
 *   2. `step-number` the node's label starts with the step number ("5. Search
 *                    for the client record") in the file for that process letter
 *                    (TB and CHUD BPMN carry Modeler ids such as `Activity_0abc`);
 *   3. `name`        the normalised label equals the item's name.
 *
 * An item that none of these joins goes to `unmatched` with the reason, for a
 * person to adjudicate (they move it into `tasks` with `matchedBy:
 * "adjudicated"`); a BPMN task no item describes goes to `unannotated`. A
 * re-run keeps adjudicated entries.
 *
 * ## What the L1 text looks like, and what is removed
 *
 * Page numbers, running heads and the DAK's side-tab labels (personas,
 * workflows, data, …) are interleaved with the items. Page numbers look like
 * item numbers, so an item number is accepted only where the sequence allows
 * it (the first item, the next top-level step, or the next sub-step), and a
 * line repeated across the section (a running head) is dropped.
 *
 *   bun run smart-base/L2-bpmn/scripts/dak-task-annotations.ts --prefix IMMZ \
 *     --document 9789240099456-eng --l1 who-iris/library/9789240099456-eng/sections/<sec>.md \
 *     --bpmn <dir-or-file>... [--xlsx <workbook>...] [--write | --check]
 *
 * `--ig-page <page.md>` reads the annotations an IG page writes as an HTML list
 * (`#### Process A: …`, then an `<ol>` of steps with `<ul>` notes) in place of,
 * or beside, the L1 text. Such a list prints no step numbers, so its items are
 * matched to tasks by name only.
 *
 *   bun run smart-base/L2-bpmn/scripts/dak-task-annotations.ts --report <dir-or-file>... \
 *     [--prefix IMMZ --xlsx <workbook>...]
 *
 * `--report` prints what the sidecars cover (tasks annotated and not, items to
 * adjudicate, dangling task ids, ids no workbook declares) and always exits 0:
 * the owner chose a report, not a gate (2026-11-18), so it is deliberately not a
 * `check:*` script.
 *
 * @module smart-base/L2-bpmn/scripts/dak-task-annotations
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

import { readWorkbook } from "../../L2/scripts/dak-data-dictionary.ts";
import {
  DAK_TASK_ANNOTATIONS_SCHEMA,
  DakTaskAnnotationsSchema,
  sidecarPath,
  type DakTaskAnnotations,
  type MatchMethod,
  type TaskAnnotation,
} from "../schemas/task-annotations.ts";

// ---------------------------------------------------------------------------
// L1 text → annotation blocks

/** One numbered item of an annotations block. */
export interface AnnotationItem {
  item: string;
  name: string;
  bullets: string[];
}

export interface AnnotationBlock {
  /** The process letter: `B`. */
  letter: string;
  heading: string;
  items: AnnotationItem[];
  /**
   * False when the source prints no step numbers (an IG page's HTML list): an item's position
   * is then not its step, so it is matched by name only (CHUD's list skips step 7).
   */
  numbered?: boolean;
}

/** The DAK documents' side-tab labels, printed down every page's edge. */
const TAB_LABELS = new Set(["personas", "indicators", "workflows", "data", "decisions", "scenarios", "requirements", "recommendations", "components"]);
/** The block heading; IMMZ prints the process letter (`B. PLAN SERVICE DELIVERY …`), TB does not (`REGISTRATION …`). */
const HEADING = /^(?:([A-Z])\.\s+)?(.+?)\s+BUSINESS PROCESS NOTES AND ANNOTATIONS\s*$/;
/** Where an annotations block ends: the next block, a figure, a table, the next process's objective. */
const BLOCK_END = /^(?:Fig\.\s*\d|Table\s+\d|Objective:|[A-Z]\.\s+Business process for\b)|NOTES AND ANNOTATIONS\s*$/;
/** A numbered heading with sub-levels and no trailing dot: an IMMZ sub-step (`2.1 Gather…`) or a document section (`5.1 Simplified list…`). */
const DOTTED_HEADING = /^(\d+)(?:\.\d+)+\s+[A-Z]/;
const ITEM_ALONE = /^(\d+(?:\.\d+)*)\.?$/;
const ITEM_INLINE = /^(\d+(?:\.\d+)*)\.\s+(\S.*)$/;

/** Whether `next` may follow `prev` in a numbered list: the next step, or the next sub-step. */
export function followsInSequence(prev: string | undefined, next: string): boolean {
  const n = next.split(".").map(Number);
  if (!prev) return n.length === 1 && n[0] === 1;
  const p = prev.split(".").map(Number);
  // Next top-level step after any depth: 3.2 → 4, 3 → 4.
  if (n.length === 1) return n[0] === p[0]! + 1;
  // First sub-step: 3 → 3.1, 3.2 → 3.2.1.
  if (n.length === p.length + 1 && n.slice(0, -1).join(".") === prev && n.at(-1) === 1) return true;
  // Next sibling at the same depth, or up from a deeper one: 3.1 → 3.2, 3.2.1 → 3.3.
  if (n.length <= p.length) return n.slice(0, -1).join(".") === p.slice(0, n.length - 1).join(".") && n.at(-1) === p[n.length - 1]! + 1;
  return false;
}

/** Section lines with page numbers, tab labels and running heads removed. */
export function cleanLines(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\s+/g, " ").trim());
  const counts = new Map<string, number>();
  for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1);
  // A running head repeats on most pages; prose and item names do not repeat that often.
  const repeated = (l: string) => (counts.get(l) ?? 0) >= 5 && l !== "»" && !ITEM_ALONE.test(l) && l.length > 3;
  return lines.filter((l) => l && !/^\d+$/.test(l) && !TAB_LABELS.has(l.toLowerCase()) && !repeated(l));
}

/** Every "<letter>. <PROCESS> BUSINESS PROCESS NOTES AND ANNOTATIONS" block in a section's text. */
export function parseAnnotationBlocks(text: string): AnnotationBlock[] {
  const lines = cleanLines(text);
  const blocks: AnnotationBlock[] = [];
  let ordinal = 0;
  let lastEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    const h = HEADING.exec(lines[i]!);
    if (!h) continue;
    // A heading without a letter takes the next one in document order: the TB DAK's blocks run
    // A. Registration to G. Aggregate reporting, as its BPMN files do (a-registration … g-…).
    const letter = h[1] ?? String.fromCharCode(65 + ordinal);
    ordinal++;
    const block: AnnotationBlock = { letter, heading: lines[i]!, items: [] };
    // Where the heading sits in the right-hand column, item 1 is printed just before it. It
    // starts the block only if a » bullet follows it before the heading: a figure's box labels,
    // which also precede a heading, carry no bullets.
    let start = i + 1;
    for (let k = i - 1; k > lastEnd && k >= i - 40 && !BLOCK_END.test(lines[k]!); k--) {
      const m = ITEM_ALONE.exec(lines[k]!) ?? ITEM_INLINE.exec(lines[k]!);
      if (m?.[1] === "1" && lines.slice(k + 1, i).some((l) => l.startsWith("»"))) {
        start = k;
        break;
      }
    }
    let cur: AnnotationItem | undefined;
    let mode: "name" | "bullet" = "name";
    let j = start;
    for (; j < lines.length && (j === i || !BLOCK_END.test(lines[j]!)); j++) {
      if (j === i) continue;
      const l = lines[j]!;
      const alone = ITEM_ALONE.exec(l);
      const inline = alone ? null : ITEM_INLINE.exec(l);
      const no = alone?.[1] ?? inline?.[1];
      // A number that goes BACK (or repeats) at the top level starts another list: the next
      // figure's box labels ("9. Is referral needed?" after item 9 of the TB screening block).
      // ...unless it repeats an item that has nothing yet: "10." then "10. Receive the client" is
      // one item whose number the layout printed twice.
      if (no && cur && no === cur.item && !cur.name && !cur.bullets.length) {
        cur.name = inline ? inline[2]!.split("»")[0]!.trim() : "";
        continue;
      }
      if (no && cur && !followsInSequence(cur.item, no) && !no.includes(".") && Number(no) <= Number(cur.item.split(".")[0])) break;
      // A dotted heading whose first number goes back below the current item is the document's
      // next section (`5.1 Simplified list…` after item 11); one under the current item (`2.1 …`
      // under item 2) is a sub-step and stays in the item's text.
      const dotted = DOTTED_HEADING.exec(l);
      if (dotted && cur && Number(dotted[1]) < Number(cur.item.split(".")[0])) break;
      if (no && followsInSequence(cur?.item, no)) {
        cur = { item: no, name: inline ? inline[2]!.split("»")[0]!.trim() : "", bullets: [] };
        block.items.push(cur);
        mode = "name";
        const rest = inline?.[2]!.split("»").slice(1) ?? [];
        for (const b of rest) if (b.trim()) cur.bullets.push(b.trim());
        if (rest.length) mode = "bullet";
        continue;
      }
      if (!cur) continue;
      if (l.startsWith("»")) {
        mode = "bullet";
        const b = l.slice(1).trim();
        cur.bullets.push(b);
        continue;
      }
      if (mode === "name") cur.name = cur.name ? `${cur.name} ${l}` : l;
      else if (cur.bullets.length) cur.bullets[cur.bullets.length - 1] = `${cur.bullets.at(-1)} ${l}`.trim();
    }
    blocks.push(block);
    i = j - 1;
    lastEnd = i;
  }
  return blocks;
}

/**
 * HTML as plain text: tags dropped from the raw HTML until none is left (so a nested
 * `<scr<script>ipt>` cannot reassemble one), then entities decoded (so escaped text such as
 * `a &lt; b` keeps its words), then any angle bracket left removed. The result is JSON text,
 * never rendered, and holds no markup.
 */
export const htmlText = (s: string): string => {
  let t = s.replace(/<br\s*\/?>/gi, " ");
  for (let prev = ""; prev !== t; ) {
    prev = t;
    t = t.replace(/<[^<>]*>/g, "");
  }
  return decodeXml(t.replace(/&nbsp;/g, " ")).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
};

/**
 * The annotations an IG page writes as HTML (smart-dak-chud's `business-processes.md`): under
 * `#### Process A: <title>`, after `Business process notes and annotations`, an `<ol>` whose
 * items are the steps (the text before the item's `<ul>`) and whose `<ul>` items are the notes.
 * The list prints no step numbers, so the blocks are `numbered: false`.
 */
export function parseIgPageAnnotations(md: string): AnnotationBlock[] {
  const blocks: AnnotationBlock[] = [];
  for (const sec of md.split(/^#{2,6}\s+/m).slice(1)) {
    const head = /^Process\s+([A-Z])\s*[:.]\s*(.+)$/m.exec(sec.split("\n")[0] ?? "");
    const at = sec.search(/notes and annotations/i);
    if (!head || at < 0) continue;
    const list = /<ol\b[^>]*>([\s\S]*)<\/ol>/i.exec(sec.slice(at))?.[1] ?? "";
    const items: AnnotationItem[] = [];
    // Top-level <li> of the <ol>: split at depth 0, so a nested list stays inside its item.
    let depth = 0;
    let start = -1;
    for (const m of list.matchAll(/<(\/?)(li|ul|ol)\b[^>]*>/gi)) {
      const closing = m[1] === "/";
      const tag = m[2]!.toLowerCase();
      if (tag === "li" && !closing && depth === 0) start = m.index! + m[0].length;
      if (tag === "li" && closing && depth === 0 && start >= 0) {
        const li = list.slice(start, m.index);
        const cut = li.search(/<ul\b/i);
        const name = htmlText(cut >= 0 ? li.slice(0, cut) : li);
        const bullets = [...(cut >= 0 ? li.slice(cut) : "").matchAll(/<li\b[^>]*>([\s\S]*?)(?=<li\b|<\/ul>|$)/gi)].map((b) => htmlText(b[1]!)).filter(Boolean);
        if (name) items.push({ item: String(items.length + 1), name, bullets });
        start = -1;
      }
      if (tag !== "li") depth += closing ? -1 : 1;
    }
    blocks.push({ letter: head[1]!, heading: `Process ${head[1]}: ${head[2]!.trim()} — business process notes and annotations`, items, numbered: false });
  }
  return blocks;
}

// ---------------------------------------------------------------------------
// BPMN → nodes

export interface BpmnNode {
  id: string;
  name: string;
  kind: string;
  lane?: string;
  /** The sub-process this node sits in, if any. */
  parent?: string;
  calledDecisions: string[];
}

const NODE_KINDS = "task|userTask|serviceTask|businessRuleTask|manualTask|scriptTask|sendTask|receiveTask|callActivity|subProcess|adHocSubProcess|transaction|exclusiveGateway|inclusiveGateway|parallelGateway|eventBasedGateway";
/** XML attribute text decoded once: `&amp;` last, so `&amp;lt;` stays the literal text `&lt;`. */
export const decodeXml = (s: string) =>
  s
    .replace(/&#10;|&#xA;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const attrOf = (tag: string, name: string) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decodeXml(m[1]!) : undefined;
};

/** The activities and gateways of a BPMN file, with their lane and any calledDecision. */
export function readBpmnNodes(xml: string): BpmnNode[] {
  const laneOf = new Map<string, string>();
  for (const [, laneTag, body] of xml.matchAll(/<(?:bpmn2?:)?lane\b([^>]*)>([\s\S]*?)<\/(?:bpmn2?:)?lane>/g)) {
    const name = attrOf(laneTag!, "name");
    if (!name) continue;
    for (const [, ref] of body!.matchAll(/<(?:bpmn2?:)?flowNodeRef>([^<]+)</g)) laneOf.set(ref!.trim(), name);
  }
  // A file with pools and no lanes: the pool's participant performs what its process holds.
  const poolOf = new Map<string, string>();
  const participantOf = new Map<string, string>();
  for (const [tag] of xml.matchAll(/<(?:bpmn2?:)?participant\b[^>]*>/g)) {
    const ref = attrOf(tag, "processRef");
    const name = attrOf(tag, "name");
    if (ref && name) participantOf.set(ref, name);
  }
  for (const [, procTag, body] of xml.matchAll(/<(?:bpmn2?:)?process\b([^>]*)>([\s\S]*?)<\/(?:bpmn2?:)?process>/g)) {
    const pool = participantOf.get(attrOf(procTag!, "id") ?? "");
    if (!pool) continue;
    for (const [, id] of body!.matchAll(/\sid="([^"]+)"/g)) poolOf.set(id!, pool);
  }
  const parentOf = new Map<string, string>();
  for (const [block, , subTag] of xml.matchAll(/<(?:bpmn2?:)?(subProcess|adHocSubProcess|transaction)\b([^>]*)>[\s\S]*?<\/(?:bpmn2?:)?\1>/g)) {
    const sub = attrOf(subTag!, "id");
    for (const [, id] of block.matchAll(/\sid="([^"]+)"/g)) if (sub && id !== sub && !parentOf.has(id!)) parentOf.set(id!, sub);
  }
  const nodes: BpmnNode[] = [];
  const re = new RegExp(`<(?:bpmn2?:)?(${NODE_KINDS})\\b([^>]*?)(\\/>|>)`, "g");
  for (const m of xml.matchAll(re)) {
    const [, kind, attrs, close] = m;
    const id = attrOf(attrs!, "id");
    if (!id) continue;
    let calledDecisions: string[] = [];
    if (close === ">") {
      // The element's own body; for a sub-process that is every decision its children call.
      const start = m.index! + m[0].length;
      const end = xml.slice(start).search(new RegExp(`</(?:bpmn2?:)?${kind}>`));
      const inner = end >= 0 ? xml.slice(start, start + end) : "";
      calledDecisions = [...inner.matchAll(/calledDecision\b[^>]*\sdecisionId="([^"]+)"/g)].map((d) => d[1]!);
    }
    nodes.push({ id, name: attrOf(attrs!, "name") ?? "", kind: kind!, lane: laneOf.get(id) ?? poolOf.get(id), parent: parentOf.get(id), calledDecisions });
  }
  return nodes;
}

/** A DAK id prefix: capitals, digits and dots (`IMMZ`, `TB`, `CHUD`). Anything else is refused, not escaped around. */
export const PREFIX = /^[A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)*$/;

/** A string as a regular-expression literal, every metacharacter (backslash included) escaped. */
export const reEscape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The prefix, checked and escaped for use inside a pattern. */
const prefixPattern = (prefix: string): string => {
  if (!PREFIX.test(prefix)) throw new Error(`not a DAK id prefix: ${JSON.stringify(prefix)} (expected capitals, digits and dots, e.g. IMMZ)`);
  return reEscape(prefix);
};

/** `IMMZ.B.1`, `IMMZ.B1`, `IMMZ.B1.Name` → `IMMZ.B1`; null when it is not an activity id of `prefix`. */
export function activityCode(s: string, prefix: string): string | null {
  const m = new RegExp(`^\\s*${prefixPattern(prefix)}\\.([A-Z])\\.?(\\d+(?:\\.\\d+)*)(?![\\d])`).exec(s);
  return m ? `${prefix}.${m[1]}${m[2]}` : null;
}

/** The step number a label starts with: `5. Search for…` → `5`, `8.1 Review…` → `8.1`. */
export const stepNumber = (label: string): string | null => /^\s*(\d+(?:\.\d+)*)\.?\s/.exec(label)?.[1] ?? null;

/**
 * The process letter a BPMN file holds, from its node ids (`IMMZ.B3`), its file
 * name (`IMMZ.B.Plan…`, `CHUD_A`, `a-registration`) or its process name.
 */
export function processLetter(path: string, xml: string, nodes: BpmnNode[], prefix: string): string | null {
  const fromIds = new Set(nodes.map((n) => activityCode(n.id, prefix)?.slice(prefix.length + 1, prefix.length + 2)).filter(Boolean));
  if (fromIds.size === 1) return [...fromIds][0]!;
  const b = basename(path);
  const f =
    new RegExp(`^${prefixPattern(prefix)}[._ -]([A-Z])(?:[._ -]|\\.bpmn$)`, "i").exec(b) ?? /^([a-z])-[a-z]/.exec(b) ?? null;
  if (f) return f[1]!.toUpperCase();
  const pn = /<(?:bpmn2?:)?process\b[^>]*\sname="([A-Z])\.\s/.exec(xml);
  return pn ? pn[1]! : null;
}

const norm = (s: string) => s.toLowerCase().replace(/^\s*\d+(\.\d+)*\.?\s*/, "").replace(/[^a-z0-9]+/g, "");

// ---------------------------------------------------------------------------
// DAK spreadsheets → links keyed by activity id

export interface ActivityLinks {
  dataElements: Map<string, Set<string>>;
  requirements: Map<string, Set<string>>;
  decisionTables: Map<string, Set<string>>;
  /** Every requirement, data element and decision id the workbooks declare, keyed to an activity or not. */
  declared: Set<string>;
}

export const emptyLinks = (): ActivityLinks => ({ dataElements: new Map(), requirements: new Map(), decisionTables: new Map(), declared: new Set() });
const add = (m: Map<string, Set<string>>, k: string, v: string) => (m.get(k) ?? m.set(k, new Set()).get(k)!).add(v);
/** Every activity id a cell names (`IMMZ.C4.Create… OR IMMZ.C5.…` names two). */
const codesIn = (cell: string, prefix: string) =>
  [...cell.matchAll(new RegExp(`${prefixPattern(prefix)}\\.[A-Z]\\.?\\d+(?:\\.\\d+)*`, "g"))].map((m) => activityCode(m[0], prefix)!).filter(Boolean);

/**
 * Read the activity keys of a DAK workbook: the data dictionary (`Activity ID`
 * + `Data element ID`), the functional requirements (`Requirement ID` +
 * `Activity ID and name`), and the decision-support logic (a `Decision ID`
 * row and the `Trigger` row naming the activity).
 */
export function readActivityLinks(sheets: { name: string; rows: string[][] }[], prefix: string, links = emptyLinks()): ActivityLinks {
  const key = (h: string) => h.toLowerCase().replace(/\*/g, "").replace(/\s+/g, " ").trim();
  for (const sheet of sheets) {
    let decisionId: string | null = null;
    let cols: { activity: number; de: number; req: number } | null = null;
    for (const row of sheet.rows) {
      const k = row.map((c) => key(c ?? ""));
      const a = k.findIndex((c) => c === "activity id" || c === "activity id and name" || c === "activity id and description");
      if (a >= 0) {
        cols = { activity: a, de: k.indexOf("data element id"), req: k.indexOf("requirement id") };
        continue;
      }
      // The label sits in the first non-empty cell, not always column A.
      const f = k.findIndex((c) => c !== "");
      const value = f >= 0 ? row.slice(f + 1).find((c) => c?.trim())?.trim() : undefined;
      // A READ ME sheet has a "Decision ID" row too, explaining the notation; only an id of this DAK counts.
      if (k[f] === "decision id" && value?.startsWith(`${prefix}.`)) links.declared.add((decisionId = value));
      if (k[f] === "trigger" && decisionId && value) for (const c of codesIn(value, prefix)) add(links.decisionTables, c, decisionId);
      if (!cols) continue;
      if (cols.de >= 0 && row[cols.de]?.trim()) links.declared.add(row[cols.de]!.trim());
      if (cols.req >= 0 && row[cols.req]?.trim()) links.declared.add(row[cols.req]!.trim());
      const codes = codesIn(row[cols.activity] ?? "", prefix);
      if (cols.de >= 0 && row[cols.de]?.trim()) for (const c of codes) add(links.dataElements, c, row[cols.de]!.trim());
      if (cols.req >= 0 && row[cols.req]?.trim()) for (const c of codes) add(links.requirements, c, row[cols.req]!.trim());
    }
  }
  return links;
}

// ---------------------------------------------------------------------------
// Matching

export interface MatchInput {
  prefix: string;
  document: string;
  bpmnPath: string;
  xml: string;
  blocks: AnnotationBlock[];
  links?: ActivityLinks;
  /** A sidecar already on disk: its adjudicated entries are kept. */
  previous?: DakTaskAnnotations;
}

const ANNOTATABLE = /Task$|^task$|^callActivity$|[sS]ubProcess$|^transaction$|Gateway$/;

/** Match one BPMN file's nodes to its process's annotation block; null when no block is for it. */
export function matchAnnotations(input: MatchInput): DakTaskAnnotations | null {
  const { prefix, document, bpmnPath, xml, blocks, links = emptyLinks(), previous } = input;
  const nodes = readBpmnNodes(xml).filter((n) => ANNOTATABLE.test(n.kind));
  const letter = processLetter(bpmnPath, xml, nodes, prefix);
  const block = letter ? blocks.find((b) => b.letter === letter) : undefined;
  if (!letter || !block) return null;

  const byCode = new Map<string, BpmnNode>();
  const byStep = new Map<string, BpmnNode>();
  const byName = new Map<string, BpmnNode | null>();
  for (const n of nodes) {
    const c = activityCode(n.id, prefix);
    if (c && !byCode.has(c)) byCode.set(c, n);
    const s = stepNumber(n.name);
    if (s && !byStep.has(s)) byStep.set(s, n);
    const k = norm(n.name);
    if (k) byName.set(k, byName.has(k) ? null : n);
  }

  const adjudicated = new Map((previous?.tasks ?? []).filter((t) => t.matchedBy === "adjudicated").map((t) => [t.source.item, t]));
  const tasks: TaskAnnotation[] = [];
  const unmatched: DakTaskAnnotations["unmatched"] = [];
  const used = new Set<string>();
  const numbered = block.numbered !== false;
  for (const item of block.items) {
    const kept = adjudicated.get(item.item);
    let node: BpmnNode | undefined;
    let how: MatchMethod | undefined;
    const printed = `${prefix}.${letter}${item.item}`;
    if (kept) {
      node = nodes.find((n) => n.id === kept.bpmnTask);
      how = "adjudicated";
    }
    if (!node && numbered && byCode.has(printed)) [node, how] = [byCode.get(printed), "id"];
    if (!node && numbered && byStep.has(item.item)) [node, how] = [byStep.get(item.item), "step-number"];
    if (!node && byName.get(norm(item.name))) [node, how] = [byName.get(norm(item.name))!, "name"];
    if (!node || used.has(node.id)) {
      unmatched.push({
        item: item.item,
        name: item.name,
        reason: node
          ? `BPMN node ${node.id} is already annotated by another item`
          : numbered
            ? `no BPMN node has id ${printed}, label step ${item.item}, or this name`
            : "the list prints no step numbers, and no BPMN node has this name",
      });
      continue;
    }
    used.add(node.id);
    // For a numbered source the activity id is the printed step; otherwise it is the matched
    // node's: its id when that is an activity id, else its label's step number.
    const nodeStep = stepNumber(node.name);
    const code = numbered
      ? printed
      : (activityCode(node.id, prefix) ?? (nodeStep ? `${prefix}.${letter}${nodeStep}` : `${prefix}.${letter}:${node.id}`));
    const sorted = (s?: Set<string>) => [...(s ?? [])].sort();
    tasks.push({
      bpmnTask: node.id,
      activityId: code,
      // An item printed as its number then straight into bullets has no name of its own: use the
      // task's label, without its step number.
      name: item.name || node.name.replace(/^\s*\d+(?:\.\d+)*\.?\s*/, "") || code,
      description: item.bullets.map((b) => `- ${b}`).join("\n"),
      personas: node.lane ? [node.lane] : [],
      dataElements: sorted(links.dataElements.get(code)),
      requirements: sorted(links.requirements.get(code)),
      decisionTables: [...new Set([...sorted(links.decisionTables.get(code)), ...node.calledDecisions])].sort(),
      matchedBy: how!,
      source: { document, item: item.item },
    });
  }
  // A task inside an annotated sub-process is described by the sub-process's item (IMMZ.D2 holds
  // one business-rule task per vaccine), so it is not a gap.
  const covered = (n: BpmnNode): boolean => used.has(n.id) || (!!n.parent && covered(nodes.find((p) => p.id === n.parent) ?? { ...n, parent: undefined, id: "" }));
  const unannotated = nodes.filter((n) => /Task$|^task$|^callActivity$|[sS]ubProcess$|^transaction$/.test(n.kind) && !covered(n)).map((n) => n.id).sort();
  return DakTaskAnnotationsSchema.parse({
    $schema: DAK_TASK_ANNOTATIONS_SCHEMA,
    bpmn: basename(bpmnPath),
    process: `${prefix}.${letter}`,
    document,
    heading: block.heading,
    tasks,
    unmatched,
    unannotated,
  });
}

// ---------------------------------------------------------------------------
// Report (owner, 2026-11-18: report only, never a gate)

export interface CoverageRow {
  sidecar: string;
  process: string;
  annotated: number;
  unannotated: number;
  unmatched: number;
  /** Annotations naming a BPMN node the file beside the sidecar does not hold. */
  dangling: string[];
  /** Linked ids no workbook read declares (only when workbooks were given). */
  unresolved: string[];
}

/**
 * What a set of sidecars covers: per BPMN, the tasks annotated and not, the items left to
 * adjudicate, annotations naming a node the BPMN no longer holds, and linked ids that no
 * workbook declares. A report: it never fails, whatever it finds.
 */
export function coverage(sidecars: string[], links?: ActivityLinks): CoverageRow[] {
  return sidecars.map((path) => {
    const doc = DakTaskAnnotationsSchema.parse(JSON.parse(readFileSync(path, "utf8")));
    const bpmn = join(path, "..", doc.bpmn);
    const ids = existsSync(bpmn) ? new Set(readBpmnNodes(readFileSync(bpmn, "utf8")).map((n) => n.id)) : new Set<string>();
    const linked = doc.tasks.flatMap((t) => [...t.dataElements, ...t.requirements, ...t.decisionTables]);
    return {
      sidecar: path,
      process: doc.process,
      annotated: doc.tasks.length,
      unannotated: doc.unannotated.length,
      unmatched: doc.unmatched.length,
      dangling: doc.tasks.filter((t) => !ids.has(t.bpmnTask)).map((t) => t.bpmnTask),
      unresolved: links && links.declared.size ? [...new Set(linked.filter((id) => !links.declared.has(id)))].sort() : [],
    };
  });
}

// ---------------------------------------------------------------------------
// CLI

const argsOf = (argv: string[], flag: string) => argv.flatMap((a, i) => (a === flag && argv[i + 1] ? [argv[i + 1]!] : []));
const bpmnFiles = (p: string): string[] =>
  statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((e) => bpmnFiles(join(p, e))) : p.toLowerCase().endsWith(".bpmn") ? [p] : [];

const sidecarFiles = (p: string): string[] =>
  statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((e) => sidecarFiles(join(p, e))) : p.endsWith(".tasks.json") ? [p] : [];

export function main(argv: string[]): number {
  const report = argsOf(argv, "--report");
  if (argv.includes("--report")) {
    const files = report.flatMap((p) => (existsSync(p) ? sidecarFiles(p) : []));
    const xlsx = argsOf(argv, "--xlsx");
    const prefix = argsOf(argv, "--prefix")[0] ?? "";
    if (xlsx.length && !PREFIX.test(prefix)) {
      console.error(`--report with --xlsx needs --prefix, a DAK id prefix: capitals, digits and dots only (IMMZ, TB, CHUD)`);
      return 2;
    }
    const links = xlsx.length ? emptyLinks() : undefined;
    for (const x of xlsx) readActivityLinks(readWorkbook(readFileSync(x)), prefix, links);
    const rows = coverage(files, links);
    console.log("| process | annotated | without annotation | to adjudicate | dangling | unresolved ids |\n|---|---|---|---|---|---|");
    const few = (xs: string[]) => (xs.length > 8 ? `${xs.slice(0, 8).join(", ")} (+${xs.length - 8} more)` : xs.join(", "));
    for (const r of rows) console.log(`| ${r.process} | ${r.annotated} | ${r.unannotated} | ${r.unmatched} | ${few(r.dangling)} | ${few(r.unresolved)} |`);
    const a = rows.reduce((n, r) => n + r.annotated, 0);
    const t = rows.reduce((n, r) => n + r.annotated + r.unannotated, 0);
    console.log(`\n${a}/${t} BPMN tasks annotated across ${rows.length} sidecar(s). Report only: this never fails.`);
    return 0;
  }
  const prefix = argsOf(argv, "--prefix")[0];
  const document = argsOf(argv, "--document")[0];
  const l1 = argsOf(argv, "--l1");
  const igPages = argsOf(argv, "--ig-page");
  const bpmn = argsOf(argv, "--bpmn").flatMap(bpmnFiles);
  if (prefix && !PREFIX.test(prefix)) {
    console.error(`--prefix ${JSON.stringify(prefix)} is not a DAK id prefix: capitals, digits and dots only (IMMZ, TB, CHUD)`);
    return 2;
  }
  if (!prefix || !document || !(l1.length || igPages.length) || !bpmn.length) {
    console.error("usage: dak-task-annotations.ts --prefix <IMMZ> --document <id> (--l1 <section.md> | --ig-page <page.md>)... --bpmn <dir|file>... [--xlsx <workbook>...] [--write | --check]");
    return 2;
  }
  const blocks = [
    ...l1.flatMap((f) => parseAnnotationBlocks(readFileSync(f, "utf8"))),
    ...igPages.flatMap((f) => parseIgPageAnnotations(readFileSync(f, "utf8"))),
  ];
  const links = emptyLinks();
  for (const x of argsOf(argv, "--xlsx")) readActivityLinks(readWorkbook(readFileSync(x)), prefix, links);
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  let stale = 0;
  let total = 0;
  let annotated = 0;
  for (const path of bpmn) {
    const out = sidecarPath(path);
    const previous = existsSync(out) ? DakTaskAnnotationsSchema.parse(JSON.parse(readFileSync(out, "utf8"))) : undefined;
    const doc = matchAnnotations({ prefix, document, bpmnPath: path, xml: readFileSync(path, "utf8"), blocks, links, previous });
    if (!doc) {
      console.error(`  - ${basename(path)}: no annotations block for its process`);
      continue;
    }
    const json = JSON.stringify(doc, null, 2) + "\n";
    total += doc.tasks.length + doc.unannotated.length;
    annotated += doc.tasks.length;
    console.error(
      `  ${doc.process} ${basename(path)}: ${doc.tasks.length} annotated, ${doc.unannotated.length} tasks without one, ${doc.unmatched.length} items to adjudicate`,
    );
    if (check && (!existsSync(out) || readFileSync(out, "utf8") !== json)) {
      console.error(`    stale: ${out}`);
      stale++;
    }
    if (write) writeFileSync(out, json);
  }
  console.error(`${annotated}/${total} BPMN tasks annotated across ${bpmn.length} file(s)`);
  return check && stale ? 1 : 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
