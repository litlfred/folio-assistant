#!/usr/bin/env bun
/**
 * A DAK's Component 1 → the L1 sources it cites, as a smart-kg L1 graph.
 *
 * Bean `5uyl`. Every WHO SMART Guidelines DAK opens with Component 1, "Health
 * interventions and recommendations": §1.1 lists the interventions the DAK
 * covers and §1.2 names the WHO guidelines and guidance they draw from, each
 * with a printed back-reference `(n)` into the DAK's own reference list. That
 * section IS the DAK's L1 bibliography — the documents a library built for the
 * DAK has to hold — and until this script it was read by eye.
 *
 * ## What it emits (smart-kg L1, WHO main `66a9b13`)
 *
 *   external-artifact   one per Component 1 section read (§1.1, §1.2): the
 *                       DAK page that does the citing, addressed by IRI
 *   citation            one per printed `(n)` in §1.2, its text VERBATIM
 *                       (line breaks joined by one space, nothing else
 *                       changed — the rule `extract-smart-kg-l1.ts` follows)
 *   publication         one per distinct reference resolved to
 *   health-intervention one per item §1.1 lists
 *
 *   citation  appearsIn      external-artifact   derived
 *   citation  resolvesTo     publication         inferred — see below
 *   health-intervention implementedBy external-artifact  inferred
 *
 * ## Resolution is a judgement, and is recorded as one
 *
 * The printed number is the evidence: it is the DAK's own back-reference into
 * its own bibliography, so a citation resolves to the entry its number names.
 * What is a judgement is WHICH numbered list that is — a DAK carries several:
 * the reference list, its implementation tools' list, every workflow's
 * numbered steps — so the list is CHOSEN as the one holding every cited
 * number with the most title agreement, and the choice and its score are in
 * each edge's note. Per citation, title agreement is corroboration only: a
 * card often DESCRIBES its source ("Summarizes recommended routine
 * immunizations for all age groups … (29)") rather than naming it ("WHO
 * recommendations for routine immunization – summary tables"). Below
 * {@link AGREEMENT} the edge still resolves, its note says the words differ,
 * and the run reports it for the person who does the fidelity check.
 *
 * §1.1's "WHO universal health coverage list of essential interventions"
 * carries no number, so it is recorded as an UNRESOLVED citation with its
 * title-match candidate named in the note.
 *
 * ## Reuse
 *
 * The document envelope, identity rules and serialisation are
 * `extract-smart-kg-l1.ts`'s ({@link readEntry}, {@link publicationId},
 * {@link serialise}, {@link isCurrent}); a publication the library HOLDS takes
 * its properties from that entry's Dublin Core record
 * (`folio-dublin-core/v1`, written by `fetch-dspace-item.ts`), which maps onto
 * the smart-base `KGPublication` model element for element because that model
 * derives from `DublinCore`.
 *
 *   bun run smart-base/scripts/extract-dak-l1-references.ts --entry <DAK library entry> [--check]
 *     [--validate <smart-kg checkout>] [--validate-zod <smart-base checkout>]
 *
 * Exit: 0 written / current, 1 stale or invalid, 2 usage or unreadable entry.
 *
 * @module smart-base/scripts/extract-dak-l1-references
 * @covers library
 */
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

import { DublinCoreRecordSchema, handleFromUrl, readStructure, type DublinCoreRecord } from "../platform.js";
import { isCurrent, L1_CONTEXT, L1_ONTOLOGY_VERSION, publicationId, readEntry, readIsbn, serialise, type LibraryEntry } from "./extract-smart-kg-l1.ts";

/** Written beside the DAK's entry. Not `smart-kg-l1.json`: that name is the recommendation extractor's. */
export const DAK_L1_FILENAME = "smart-kg-l1-dak-references.json";
const SKILL = "smart-base/dak-l1-library";
/** Below this share of a citation's words found in the reference's title, the match is flagged for a person. */
export const AGREEMENT = 0.34;

type Derivation = "derived" | "inferred" | "decided";
interface Evidence {
  location: string;
  quote?: string;
}
export interface Node {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
  derivation: Derivation;
  note?: string;
  evidence?: Evidence;
  skill: string;
}
export interface Edge {
  type: "Statement";
  predicate: string;
  source: string;
  target: string;
  derivation: Derivation;
  note?: string;
  evidence?: Evidence;
  skill: string;
}
export interface Doc {
  "@context": string;
  id: string;
  type: "Entity";
  ontologyVersion: string;
  generatedAt: string;
  wasDerivedFrom: { path: string; sha256: string; note?: string }[];
  nodes: Node[];
  edges: Edge[];
  dak?: Record<string, unknown>;
}

const sha256 = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
/** The ingested PDF, as `structure.json` recorded it. */
const sourceOf = (e: LibraryEntry): { file: string; sha256: string } => (e.structure.raw as unknown as { source: { file: string; sha256: string } }).source;
const joinLines = (lines: string[]): string => lines.map((l) => l.trim()).filter((l) => l !== "").join(" ");
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// ── Reading the pages ───────────────────────────────────────────────────────

interface Page {
  /** Repo-relative path of the section file. */
  path: string;
  /** Body lines (front matter removed) with their 1-based line number in the file. */
  lines: { n: number; text: string }[];
  pdfPage?: number;
}

function pagesOf(entry: LibraryEntry): Page[] {
  const out: Page[] = [];
  for (const s of entry.structure.sections) {
    const t = entry.texts.get(s.id);
    if (!t) continue;
    const all = t.text.split("\n");
    let start = 0;
    if (all[0] === "---") start = all.indexOf("---", 1) + 1;
    const pdf = /^pdf_page:\s*(\d+)/m.exec(t.text)?.[1];
    out.push({ path: t.path, lines: all.slice(start).map((text, i) => ({ n: start + i + 1, text })), pdfPage: pdf ? Number(pdf) : undefined });
  }
  return out;
}

// ── Component 1 ─────────────────────────────────────────────────────────────

const H11 = /^\s*1\.1\s+\S/;
const H12 = /^\s*1\.2\s+.*\b(guidelines?|recommendations?|guidance)\b/i;
/** The end of §1.2: Component 2 begins, or a numbered §2.x heading. */
const END12 = /^\s*(Component\s*$|Generic personas\s*$|2\.\d\s)/;

export interface Citation {
  text: string;
  number: number;
  page: Page;
  line: number;
}

/** Every `(n)` in §1.2 with the text since the previous one, verbatim. */
export function readCitations(pages: Page[]): { section?: { page: Page; line: number; heading: string }; citations: Citation[] } {
  for (const page of pages) {
    const at = page.lines.findIndex((l) => H12.test(l.text));
    if (at < 0) continue;
    const citations: Citation[] = [];
    let buf: string[] = [];
    for (const l of page.lines.slice(at + 1)) {
      if (END12.test(l.text)) break;
      buf.push(l.text);
      const m = /\((\d{1,3})\)\s*$/.exec(l.text);
      if (!m) continue;
      let text = joinLines(buf);
      // The run-in sentence before the first card ("These interventions draw
      // from the following …") ends with a full stop; a card does not.
      const lastStop = text.lastIndexOf(". ");
      if (lastStop >= 0) text = text.slice(lastStop + 2);
      citations.push({ text, number: Number(m[1]), page, line: l.n });
      buf = [];
    }
    return { section: { page, line: page.lines[at]!.n, heading: joinLines([page.lines[at]!.text]) }, citations };
  }
  return { citations: [] };
}

export interface Intervention {
  name: string;
  group: string;
  page: Page;
  line: number;
}

/** §1.1's bulleted interventions: `»` opens a group, `–` an item. */
export function readInterventions(pages: Page[]): { section?: { page: Page; line: number; heading: string; lead?: string }; items: Intervention[] } {
  for (const page of pages) {
    const at = page.lines.findIndex((l) => H11.test(l.text));
    if (at < 0) continue;
    const items: Intervention[] = [];
    let group = "";
    let lead: string | undefined;
    let cur: { lines: string[]; line: number } | undefined;
    let mode: "lead" | "group" | "item" = "lead";
    const flush = () => {
      if (cur && mode === "item") items.push({ name: joinLines(cur.lines).replace(/[.,;]$/, ""), group, page, line: cur.line });
      cur = undefined;
    };
    const rest = page.lines.slice(at + 1);
    for (const l of rest) {
      const t = l.text.trim();
      if (/^Note:/.test(t) || H12.test(l.text)) break;
      if (t === "»") {
        flush();
        mode = "group";
        cur = { lines: [], line: l.n };
        continue;
      }
      if (t === "–") {
        if (mode === "group" && cur) group = joinLines(cur.lines);
        flush();
        mode = "item";
        cur = { lines: [], line: l.n + 1 };
        continue;
      }
      if (mode === "lead" && /\.$/.test(t) && !lead && !/^1\.1/.test(t) && t.length > 20) lead = t;
      cur?.lines.push(l.text);
    }
    flush();
    const heading = joinLines(page.lines.slice(at, at + 2).map((l) => l.text).filter((x) => !/^Interventions referenced/.test(x)));
    return { section: { page, line: page.lines[at]!.n, heading, lead }, items };
  }
  return { items: [] };
}

// ── Reference lists ─────────────────────────────────────────────────────────

export interface Reference {
  number: number;
  text: string;
  page: Page;
  line: number;
}

/** Every numbered list in the document; numbering restarting at 1 starts a new list. */
export function readReferenceLists(pages: Page[]): Reference[][] {
  const lists: Reference[][] = [];
  let list: Reference[] | undefined;
  for (const page of pages) {
    let cur: { r: Reference; lines: string[] } | undefined;
    const close = () => {
      if (cur) cur.r.text = joinLines(cur.lines);
      cur = undefined;
    };
    for (const l of page.lines) {
      const m = /^(\d{1,3})\.\s+(\S.*)$/.exec(l.text);
      if (m) {
        close();
        const n = Number(m[1]);
        if (n === 1 || !list || n !== list[list.length - 1]!.number + 1) {
          list = [];
          lists.push(list);
        }
        const r: Reference = { number: n, text: "", page, line: l.n };
        list.push(r);
        cur = { r, lines: [m[2]!] };
        continue;
      }
      // A reference ends at its closing ")." (the URL WHO's style puts last),
      // at the next numbered entry, or at page furniture: a bare page number
      // or a running heading. NOT at the first full stop — the title ends with
      // one, and closing there dropped reference 26's place, year and URL.
      const t = l.text.trim();
      if (cur && !/\)\.\s*$/.test(joinLines(cur.lines)) && t !== "" && !/^\d+$/.test(t) && !/^References\d*$/.test(t)) cur.lines.push(l.text);
      else close();
    }
    close();
  }
  return lists;
}

const STOP = new Set(["the", "and", "for", "with", "from", "this", "that", "including", "updated", "cited", "who", "of", "in", "on", "to", "a", "an"]);
const words = (s: string): Set<string> =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w))
      .map((w) => w.replace(/(ations?|ed|s)$/, "")),
  );

/** The reference's title: the text before its first full stop. */
export const titleOf = (ref: string): string => ref.split(/\.\s/)[0]!.replace(/\s*\[[^\]]+\]\s*$/, "").trim();

/** Share of the citation's content words found in the reference title. */
export function agreement(citation: string, ref: string): number {
  const c = words(citation);
  const t = words(titleOf(ref));
  if (c.size === 0) return 0;
  let hit = 0;
  for (const w of c) if (t.has(w)) hit++;
  return hit / c.size;
}

/** The list the citations point into: holds every number, most title agreement. */
export function chooseList(lists: Reference[][], cites: Citation[]): { list: Reference[]; score: number } | undefined {
  const needed = [...new Set(cites.map((c) => c.number))];
  let best: { list: Reference[]; score: number } | undefined;
  for (const list of lists) {
    const by = new Map(list.map((r) => [r.number, r]));
    if (!needed.every((n) => by.has(n))) continue;
    const score = cites.reduce((s, c) => s + agreement(c.text, by.get(c.number)!.text), 0) / Math.max(cites.length, 1);
    if (!best || score > best.score) best = { list, score };
  }
  return best;
}

// ── What the library holds ──────────────────────────────────────────────────

interface Held {
  record: DublinCoreRecord;
  recordPath: string;
  pdfSha256?: string;
  entryPath?: string;
}

const dc = (rec: DublinCoreRecord, element: string, qualifier?: string): string[] =>
  rec.fields.filter((f) => f.element === element && f.qualifier === qualifier).flatMap((f) => f.values.map((v) => v.value));

/** Dublin Core records under `<repo>/uploads/*`, keyed by handle, joined to their library entry by PDF hash. */
function heldByHandle(repo: string, libraryDirs: string[]): Map<string, Held> {
  const out = new Map<string, Held>();
  const uploads = join(repo, "uploads");
  if (!existsSync(uploads)) return out;
  const entryBySha = new Map<string, string>();
  for (const lib of libraryDirs) {
    for (const d of existsSync(lib) ? readdirSync(lib, { withFileTypes: true }) : []) {
      if (!d.isDirectory()) continue;
      const structure = readStructure(join(lib, d.name));
      if ("reason" in structure) continue;
      const sha = (structure.raw as unknown as { source?: { sha256?: string } }).source?.sha256;
      if (sha) entryBySha.set(sha, relative(repo, join(lib, d.name)));
    }
  }
  for (const d of readdirSync(uploads, { withFileTypes: true })) {
    const intakePath = join(uploads, d.name, "intake.json");
    if (!d.isDirectory() || !existsSync(intakePath)) continue;
    const intake = JSON.parse(readFileSync(intakePath, "utf-8"));
    if (!intake.record) continue;
    const recordPath = join(uploads, d.name, intake.record);
    const record = DublinCoreRecordSchema.parse(JSON.parse(readFileSync(recordPath, "utf-8")));
    const pdfSha256 = intake.files?.find((f: { role?: string }) => f.role === "original-bitstream")?.sha256;
    for (const uri of dc(record, "identifier", "uri")) {
      const h = handleFromUrl(uri);
      if (h) out.set(h, { record, recordPath: relative(repo, recordPath), pdfSha256, entryPath: pdfSha256 ? entryBySha.get(pdfSha256) : undefined });
    }
  }
  return out;
}

// ── The document ────────────────────────────────────────────────────────────

const urlOf = (ref: string): string | undefined => {
  const m = /\((https?:\/\/[^)]*)\)\.?\s*$/.exec(ref);
  // A URL broken across lines was joined with a space; the space is the join, not the URL.
  return m ? m[1]!.replace(/\s+/g, "") : undefined;
};
const yearOf = (ref: string): string | undefined => [...ref.replace(/\(https?:[^)]*\)/g, "").matchAll(/\b(19|20)\d{2}\b/g)].pop()?.[0];
/** "<title>. <place>: <publisher>; <year>" or, for an undated web page, "<place>: <publisher> (<url>)". */
const publisherOf = (ref: string): string | undefined => /\.\s+[^.:;]+:\s*([^;:(]+?)\s*[;(]/.exec(ref)?.[1]?.trim();

/** publicationType from the title's own words, and only from them. */
export function publicationTypeOf(title: string): string | undefined {
  if (/\bsummary tables?\b/i.test(title)) return "summary-table";
  if (/\bguidelines?\b/i.test(title)) return "guideline";
  if (/\bguidance\b/i.test(title)) return "guidance";
  if (/\bclassification\b/i.test(title)) return "classification";
  return undefined;
}

export function dakL1Document(entry: LibraryEntry, repo: string, libraryDirs: string[], dakRecord: Held | undefined, generatedAt: string, dakJson?: Record<string, unknown>): { doc: Doc; report: string[] } {
  const pages = pagesOf(entry);
  const report: string[] = [];
  const { isbn } = readIsbn(entry.texts.values());
  const dakId = publicationId(isbn, sourceOf(entry).sha256);
  const dakUrl = dakRecord ? dc(dakRecord.record, "identifier", "uri")[0] : undefined;
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const at = (p: Page, line: number) => `${p.path}:${line}${p.pdfPage ? ` (PDF p. ${p.pdfPage})` : ""}`;
  const pageIri = (p: Page) => `${dakUrl ?? dakId}${p.pdfPage ? `#page=${p.pdfPage}` : ""}`;

  // §1.2 — cited guidance
  const { section: s12, citations } = readCitations(pages);
  if (!s12) report.push("no §1.2 heading (\"1.2 … guidelines / recommendations / guidance\") found — nothing cited is read");
  const lists = readReferenceLists(pages);
  const chosen = chooseList(lists, citations);
  if (citations.length && !chosen) report.push(`no numbered list holds every cited number (${[...new Set(citations.map((c) => c.number))].join(", ")})`);
  const held = heldByHandle(repo, libraryDirs);

  if (s12) {
    const artId = `${dakId}#component-1.2`;
    nodes.push({
      id: artId,
      type: "external-artifact",
      label: `DAK Component 1, ${s12.heading}`,
      properties: { iri: pageIri(s12.page), targetKind: "DAK Component 1 section (L2)" },
      derivation: "derived",
      evidence: { location: at(s12.page, s12.line), quote: s12.heading },
      skill: SKILL,
    });
    const pubs = new Map<number, string>();
    for (const c of citations) {
      const ref = chosen?.list.find((r) => r.number === c.number);
      const score = ref ? agreement(c.text, ref.text) : 0;
      const resolved = !!ref;
      const weak = !!ref && score < AGREEMENT;
      const cid = `${dakId}#citation-${c.number}-${createHash("sha256").update(c.text).digest("hex").slice(0, 8)}`;
      nodes.push({
        id: cid,
        type: "citation",
        label: `${c.text.replace(/\s*\(\d+\)$/, "")} (${c.number})`,
        properties: { text: c.text, location: at(c.page, c.line), numbering: String(c.number), resolutionStatus: resolved ? "resolved" : "unresolved" },
        derivation: "derived",
        skill: SKILL,
      });
      edges.push({ type: "Statement", predicate: "appearsIn", source: cid, target: artId, derivation: "derived", skill: SKILL });
      if (!ref) {
        report.push(`(${c.number}) is not in the chosen reference list`);
        continue;
      }
      if (weak) report.push(`(${c.number}) "${c.text}" — title agreement ${score.toFixed(2)} < ${AGREEMENT}: resolved by its number; a person should confirm it`);
      if (!pubs.has(c.number)) {
        const url = urlOf(ref.text);
        const h = url ? handleFromUrl(url) : undefined;
        const lib = h ? held.get(h) : undefined;
        const title = titleOf(ref.text);
        let id: string;
        let props: Record<string, unknown>;
        let note = `Read from reference ${c.number} of the DAK's reference list: title = the text before its first full stop, date = the last year outside the URL, url = the parenthesised URL with line-break spaces removed, publisher = the name after "<place>:".`;
        if (lib) {
          const isbns = dc(lib.record, "identifier", "isbn").map((v) => v.replace(/\s*\(.*\)\s*$/, "").replace(/[^0-9X]/g, ""));
          id = isbns[0] ? `urn:isbn:${isbns[0]}` : (url ?? `${dakId}#reference-${c.number}`);
          props = {
            title: dc(lib.record, "title")[0] ?? title,
            creator: dc(lib.record, "contributor", "author"),
            publisher: dc(lib.record, "publisher")[0],
            date: dc(lib.record, "date", "issued")[0],
            identifier: [...dc(lib.record, "identifier", "isbn").map((v) => `ISBN ${v}`), ...dc(lib.record, "identifier", "uri")],
            language: dc(lib.record, "language", "iso").join(", ") || undefined,
            rights: dc(lib.record, "rights")[0],
            url: dc(lib.record, "identifier", "uri")[0] ?? url,
            ...(lib.pdfSha256 ? { sha256: lib.pdfSha256 } : {}),
            ...(publicationTypeOf(title) ? { publicationType: publicationTypeOf(title) } : {}),
          };
          note = `Held by this library${lib.entryPath ? ` as ${lib.entryPath}` : ""}; properties are its repository Dublin Core record (${lib.recordPath}), matched to reference ${c.number} by handle ${h}. sha256 pins the PDF ingested.`;
        } else {
          id = url ?? `${dakId}#reference-${c.number}`;
          props = { title, ...(yearOf(ref.text) ? { date: yearOf(ref.text) } : {}), ...(publisherOf(ref.text) ? { publisher: publisherOf(ref.text) } : {}), ...(url ? { url } : {}), ...(publicationTypeOf(title) ? { publicationType: publicationTypeOf(title) } : {}) };
          note += url ? " Not held by this library: no Dublin Core record for it under uploads/." : " Not held, and the reference carries no URL.";
        }
        for (const k of Object.keys(props)) if (props[k] === undefined || (Array.isArray(props[k]) && (props[k] as unknown[]).length === 0)) delete props[k];
        if (props.publicationType) note += ` publicationType "${props.publicationType}" is read from the title's own words.`;
        nodes.push({ id, type: "publication", label: String(props.title), properties: props, derivation: "inferred", note, evidence: { location: at(ref.page, ref.line), quote: ref.text }, skill: SKILL });
        pubs.set(c.number, id);
      }
      edges.push({
        type: "Statement",
        predicate: "resolvesTo",
        source: cid,
        target: pubs.get(c.number)!,
        derivation: "inferred",
        note: `By the printed number (${c.number}) into the reference list starting ${chosen!.list[0]!.page.path}:${chosen!.list[0]!.line} (chosen of ${lists.length} numbered lists: it holds every cited number, mean title agreement ${chosen!.score.toFixed(2)}), title agreement ${score.toFixed(2)}${weak ? ` — BELOW ${AGREEMENT}: the citation's words differ from the reference title, so this rests on the printed number alone and a person should confirm it` : ""}.`,
        evidence: { location: at(ref.page, ref.line), quote: ref.text },
        skill: SKILL,
      });
    }
  }

  // §1.1 — interventions
  const { section: s11, items } = readInterventions(pages);
  if (!s11) report.push("no §1.1 heading found — no health interventions read");
  if (s11) {
    const artId = `${dakId}#component-1.1`;
    nodes.push({
      id: artId,
      type: "external-artifact",
      label: `DAK Component 1, ${s11.heading}`,
      properties: { iri: pageIri(s11.page), targetKind: "DAK Component 1 section (L2)" },
      derivation: "derived",
      evidence: { location: at(s11.page, s11.line), quote: s11.heading },
      skill: SKILL,
    });
    for (const it of items) {
      const id = `${dakId}#health-intervention-${slug(it.name)}`;
      nodes.push({ id, type: "health-intervention", label: it.name, properties: { name: it.name, description: it.group }, derivation: "derived", evidence: { location: at(it.page, it.line), quote: it.name }, skill: SKILL });
      edges.push({
        type: "Statement",
        predicate: "implementedBy",
        source: id,
        target: artId,
        derivation: "inferred",
        note: "Listed in Component 1 §1.1 as an intervention the DAK references; the DAK is the L2 artefact that operationalises it. Listing is the evidence, not a reading of the DAK's workflows.",
        evidence: { location: at(it.page, it.line), quote: `${it.group} – ${it.name}` },
        skill: SKILL,
      });
    }
    if (s11.lead) {
      const m = /based on (WHO [^.]+?)\./i.exec(s11.lead);
      if (m) {
        const text = m[1]!;
        const cand = lists.flat().map((r) => ({ r, s: agreement(text, r.text) })).sort((a, b) => b.s - a.s)[0];
        nodes.push({
          id: `${dakId}#citation-1.1-${slug(text)}`,
          type: "citation",
          label: text,
          properties: { text, location: at(s11.page, s11.line), resolutionStatus: "unresolved" },
          derivation: "derived",
          note: cand && cand.s >= AGREEMENT ? `Unnumbered. Best title match is reference ${cand.r.number} ("${titleOf(cand.r.text)}", agreement ${cand.s.toFixed(2)}); not resolved on words alone.` : "Unnumbered, and no reference title agrees with it.",
          skill: SKILL,
        });
        edges.push({ type: "Statement", predicate: "appearsIn", source: nodes[nodes.length - 1]!.id, target: artId, derivation: "derived", skill: SKILL });
      }
    }
  }

  const pageFiles = [...new Set([...citations.map((c) => c.page), ...(s11 ? [s11.page] : []), ...(chosen ? chosen.list.map((r) => r.page) : [])].map((p) => p.path))];
  const listing = pageFiles.map((p) => `${sha256(readFileSync(join(repo, p)))}  ${p}`).join("\n") + "\n";
  const doc: Doc = {
    "@context": L1_CONTEXT,
    id: `${dakId}#kg-l1-dak-references`,
    type: "Entity",
    ontologyVersion: L1_ONTOLOGY_VERSION,
    generatedAt,
    wasDerivedFrom: [
      { path: sourceOf(entry).file, sha256: sourceOf(entry).sha256, note: "The DAK PDF as hashed at ingest (structure.json); not re-read here." },
      { path: `${entry.path}/structure.json`, sha256: entry.structureSha256 },
      { path: `${entry.path}/sections/`, sha256: sha256(listing), note: `The ${pageFiles.length} page text(s) read, hashed as a sha256sum listing (<hex>  <path>).` },
      ...[...new Set([...held.values()].map((h) => h.recordPath))].sort().map((p) => ({ path: p, sha256: sha256(readFileSync(join(repo, p))), note: "A Dublin Core record a held publication's properties were read from." })),
    ],
    nodes,
    edges,
    ...(dakJson ? { dak: Object.fromEntries(["id", "name", "title", "version", "status", "canonicalUrl", "publicationUrl"].filter((k) => k in dakJson).map((k) => [k, dakJson[k]])) } : {}),
  };
  report.unshift(
    `${citations.length} citation(s) in §1.2 → ${nodes.filter((n) => n.type === "publication").length} publication(s), ` +
      `${nodes.filter((n) => n.type === "publication" && String(n.note).startsWith("Held")).length} held by the library; ` +
      `${items.length} intervention(s) in §1.1`,
  );
  return { doc, report };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function gitRoot(dir: string): string {
  return execFileSync("git", ["-C", dir, "rev-parse", "--show-toplevel"], { encoding: "utf-8" }).trim();
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const opt = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const entryArg = opt("--entry");
  if (!entryArg) {
    console.error("usage: extract-dak-l1-references.ts --entry <DAK library entry> [--check] [--validate <smart-kg>] [--validate-zod <smart-base>]");
    process.exit(2);
  }
  const dir = resolve(entryArg);
  const repo = gitRoot(dir);
  const entry = readEntry(dir, repo);
  if ("reason" in entry) {
    console.error(`✗ ${entryArg}: ${entry.reason}`);
    process.exit(2);
  }
  const library = dirname(dir);
  const held = heldByHandle(repo, [library]);
  const dakSha = sourceOf(entry).sha256;
  const dakRecord = [...held.values()].find((h) => h.pdfSha256 === dakSha);
  const dakJsonPath = join(repo, "dak.json");
  const dakJson = existsSync(dakJsonPath) ? JSON.parse(readFileSync(dakJsonPath, "utf-8")) : undefined;
  const { doc, report } = dakL1Document(entry, repo, [library], dakRecord, new Date().toISOString().replace(/\.\d+Z$/, "Z"), dakJson);
  const target = join(dir, DAK_L1_FILENAME);
  const existing = existsSync(target) ? readFileSync(target, "utf-8") : undefined;
  for (const r of report) console.log(`  ${r}`);
  if (args.includes("--check")) {
    if (!isCurrent(existing, doc as never)) {
      console.error(`✗ ${relative(process.cwd(), target)} is stale — re-run without --check`);
      process.exit(1);
    }
    console.log(`✓ ${relative(process.cwd(), target)} current`);
  } else if (!isCurrent(existing, doc as never)) {
    writeFileSync(target, serialise(doc as never));
    console.log(`wrote ${relative(process.cwd(), target)}`);
  } else console.log(`${relative(process.cwd(), target)} current`);
  let failed = 0;
  const kg = opt("--validate");
  if (kg) failed |= spawnSync("node", [join(kg, "tools", "validate.mjs"), target], { stdio: "inherit" }).status ?? 1;
  const zod = opt("--validate-zod");
  if (zod) failed |= spawnSync("npx", ["tsx", "src/validate.ts", target], { cwd: join(zod, "kg"), stdio: "inherit" }).status ?? 1;
  process.exit(failed ? 1 : 0);
}
