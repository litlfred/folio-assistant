#!/usr/bin/env bun
/**
 * Language-trap audit — model-idiom tells in scholarly prose.
 *
 * A content block can be schema-clean, voice-clean under the existing
 * one-voice criteria, and still read as unedited model output through a
 * set of characteristic rhetorical constructions. This scanner adds that
 * axis: ten trap categories (owner specification, 2026-08-15), each a
 * `trap-*` criterion with a cheap deterministic detector.
 *
 * Category (severity mirrors the spec's diagnostic/density split —
 * diagnostic categories are rare in human scholarly drafting and
 * near-universal in unedited model output; density categories appear in
 * human drafts too, so the signal is concentration, not presence):
 *
 *   trap-negation-contrast   major  asserting by denying the opposite:
 *       "structural features, not afterthoughts"; "not X but Y". The
 *       positive claim alone is the human form. Plain mathematical
 *       negation ("does not converge", "is not invertible") is NOT
 *       matched — only the appositive ", not X" tail and the
 *       "not (just|merely|a|the) X but Y" contrast frame.
 *
 *   trap-rhetorical-pivot    major  setup-then-reframe: "the question is
 *       whether …", "what matters is …", "the point is not …".
 *
 *   trap-em-dash             minor  the stylistic spaced dash as a
 *       substitute for sentence structure; flagged on density, since
 *       some human writers genuinely favour it.
 *
 *   trap-triples             minor  the reflex three-item list
 *       ("collect, share and analyse"); flagged on density — genuine
 *       three-element enumerations are substantive.
 *
 *   trap-closing-aphorism    major  a quotable-sounding final line
 *       ("… will only be as strong as the consultation that shapes it").
 *
 *   trap-meta-commentary     major  the drafter narrating their own
 *       emphasis: "worth noting", "we emphasize", "the key takeaway".
 *       Plain "note that" (standard mathematical prose) is not matched.
 *
 *   trap-thesis-restatement  major  a block-final sentence restating
 *       what the paragraph already established ("This shows that …" as
 *       a closer). "This completes the proof" is exempt.
 *
 *   trap-performed-warmth    minor  register mismatch: "thank you",
 *       "we are excited", "journey", "we invite you".
 *
 *   trap-superlative         minor  maximum-strength claims on density:
 *       "most importantly", "crucially", "unprecedented", "single most".
 *
 *   trap-nonspeakable        minor  noun-heavy sentences that parse on
 *       the page but stall aloud; proxied by prose sentences over a
 *       length threshold after math is reduced to a placeholder.
 *
 * Heuristics are high-recall / agent-confirmed, exactly like
 * `definition-clarity-audit.ts`: a `fail` is a candidate, not a verdict.
 * With `--write-sidecars` the scanner upserts `reviewer.kind="script"`
 * entries into `<block>.qa.json` for agent adjudication and drain.
 *
 *   bun run content/pipeline/language-trap-audit.ts \
 *     [root ...]                 # default: content/
 *     [--json  docs/audits/<date>-language-trap-audit.json]
 *     [--md    docs/audits/<date>-language-trap-audit.md]
 *     [--only  <criterion>]
 *     [--branch <name>]
 *     [--write-sidecars]
 *     [--quiet] [--top N]
 *
 * @module content/pipeline/language-trap-audit
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join, relative, resolve, dirname, basename } from "node:path";

// ---------------------------------------------------------------------------
// block-qa/v1 sidecar types, inlined (same pattern as the sibling audits).
// ---------------------------------------------------------------------------
interface QaFieldHash {
  md?: string;
  ts?: string;
}
interface QaReviewer {
  kind: "script" | "agent" | "human";
  id: string;
  version?: string;
  script_hash?: string;
  script_commit_sha?: string;
}
interface QaCriterionEntry {
  field_hash: QaFieldHash;
  result: "pass" | "fail" | "warn" | "n/a";
  severity?: "critical" | "major" | "minor";
  evidence?: string;
  reviewer: QaReviewer;
  reviewed_at: string;
  reviewed_sha: string;
}

// ---------------------------------------------------------------------------
// Thresholds. Diagnostic criteria fire on presence; density criteria need
// both a count floor and a per-word concentration.
// ---------------------------------------------------------------------------
const T = {
  /** trap-em-dash: spaced dashes per 100 prose words AND minimum count. */
  dashPer100: 1.2,
  dashMin: 4,
  /** trap-triples: "X, Y(,) and Z" instances AND per-120-word density. */
  triplesMin: 3,
  triplesPer120: 1.0,
  /** trap-superlative: hits at/above this count flag the block. */
  superlativeMin: 2,
  /** trap-nonspeakable: prose sentences over this word count … */
  sentenceWords: 60,
  /** … and at least this many of them. */
  longSentencesMin: 2,
  /** trap-closing-aphorism: the closer must be at most this many words. */
  aphorismMaxWords: 20,
};

type Result = "pass" | "fail" | "n/a";
type Severity = "critical" | "major" | "minor";
type Kind =
  | "definition"
  | "theorem"
  | "lemma"
  | "proposition"
  | "corollary"
  | "conjecture"
  | "example"
  | "remark"
  | "proof"
  | "prose"
  | "equation"
  | "diagram"
  | "simulator";

/** kinds carrying human-language prose — the audit's whole domain. */
const PROSE_KINDS: Kind[] = [
  "definition",
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "conjecture",
  "example",
  "remark",
  "proof",
  "prose",
];

const CRITERIA = [
  "trap-negation-contrast",
  "trap-rhetorical-pivot",
  "trap-em-dash",
  "trap-triples",
  "trap-closing-aphorism",
  "trap-meta-commentary",
  "trap-thesis-restatement",
  "trap-performed-warmth",
  "trap-superlative",
  "trap-nonspeakable",
] as const;
type Criterion = (typeof CRITERIA)[number];

interface Finding {
  label: string;
  kind: Kind;
  criterion: Criterion;
  result: Result;
  severity?: Severity;
  evidence: string;
  metrics: Record<string, number | string>;
  mdPath: string;
  qaPath: string;
}

interface Block {
  root: string;
  dir: string;
  kind: Kind;
  label: string;
  mdPath: string;
  tsPath: string;
  md: string;
  ts: string;
}

// ---------------------------------------------------------------------------
// Parsing (regex-only, self-contained)
// ---------------------------------------------------------------------------
const BUILDER_RE =
  /\b(definition|theorem|lemma|proposition|corollary|conjecture|example|remark|proof|prose|equation|diagram|simulator)\s*\(\s*\{/;

function parseKind(ts: string): Kind | null {
  const m = ts.match(BUILDER_RE);
  return m ? (m[1] as Kind) : null;
}

function parseLabel(ts: string): string {
  const m = ts.match(/label:\s*"((?:[^"\\]|\\.)*)"/);
  return m ? m[1] : "";
}

/** Strip everything that is not human-language prose; inline math becomes a
 *  one-token placeholder so sentence structure survives. */
function prose(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]*?\$\$/g, " ")
    .replace(/\\begin\{[\s\S]*?\\end\{[a-zA-Z*]+\}/g, " ")
    .replace(/^[ \t]*\|.*$/gm, " ")
    .replace(/\$[^$]*\$/g, " M ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/[*_>#`]/g, " ");
}

function wordCount(s: string): number {
  return s.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
}

function countMatches(s: string, re: RegExp): number {
  let n = 0;
  for (const _ of s.matchAll(re)) n++;
  return n;
}

function sampleMatches(s: string, re: RegExp, cap = 3): string[] {
  const out: string[] = [];
  for (const m of s.matchAll(re)) {
    out.push(m[0].replace(/\s+/g, " ").trim().slice(0, 60));
    if (out.length >= cap) break;
  }
  return out;
}

/** Sentences of the stripped prose, crude split. */
function sentences(p: string): string[] {
  return p
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z"“(])/)
    .map((s) => s.trim())
    .filter((s) => wordCount(s) > 0);
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

/** appositive contrast tail: ", not <short phrase><end-punct>" */
const NEG_APPOSITIVE =
  /,\s+not\s+(?:a|an|the|its|their|our|mere(?:ly)?|just|simply|some)?\s*[A-Za-z][\w-]*(?:\s+[\w-]+){0,4}[.;:]/g;
/** "not (just|merely|a|the|…) X but (rather) Y" contrast frame */
const NEG_NOT_BUT =
  /\bnot\s+(?:just|merely|simply|only|a|an|the)\s+[\w-]+(?:\s+[\w-]+){0,4},?\s+but\s+(?:rather\s+)?/gi;

const PIVOTS = [
  /\bthe\s+(?:real\s+|deeper\s+)?question\s+is\s+(?:whether|not|how|what)\b/gi,
  /\bwhat\s+matters\s+(?:here\s+)?is\b/gi,
  /\bthe\s+point\s+is\s+not\b/gi,
  /\bit\s+is\s+not\s+a\s+question\s+of\b/gi,
  /\bwith\s+or\s+without\b[^.]*\bthe\s+question\b/gi,
];

const DASH = /\s(?:—|--|–)\s/g;

const TRIPLE =
  /\b[\w-]+,\s+[\w-]+,?\s+and\s+[\w-]+\b/g;

const APHORISM_SHAPES = [
  /\bonly\s+as\s+\w+\s+as\b/i,
  /^\s*(?:Ultimately|In\s+the\s+end|At\s+bottom|In\s+short)\b/i,
  /\bwill\s+only\s+be\s+as\b/i,
  /\bis\s+(?:the|its|what)\s+\w+\s+(?:makes|means|demands)\b/i,
];

const META = [
  /\b(?:it\s+is\s+)?worth\s+(?:noting|emphasi[sz]ing|remarking)\b/gi,
  /\bwe\s+(?:emphasi[sz]e|underline|stress|wish\s+to\s+highlight)\b/gi,
  /\bI\s+want\s+to\s+(?:underline|stress|emphasi[sz]e|highlight)\b/gi,
  /\bnote\s+the\s+framing\b/gi,
  /\bthe\s+key\s+takeaway\b/gi,
  /\bthe\s+message\s+(?:here|we\s+t\w+)\b/gi,
  /\blet\s+us\s+pause\b/gi,
];

const RESTATE_CLOSERS =
  /^(?:This|That)\s+(?:shows|establishes|answers|confirms|demonstrates|captures|reflects)\b/;
const RESTATE_PHRASES = [/\bIn\s+summary\b/gi, /\bTo\s+summari[sz]e\b/gi];
const PROOF_CLOSER = /completes\s+the\s+proof/i;

const WARMTH = [
  /\bthank\s+you\b/gi,
  /\bwe\s+are\s+(?:excited|delighted|thrilled|proud)\b/gi,
  /\b(?:our|this|the)\s+journey\b/gi,
  /\bstay\s+tuned\b/gi,
  /\bdear\s+reader\b/gi,
  /\bwe\s+invite\s+you\b/gi,
  /\bwe\s+are\s+counting\s+on\b/gi,
];

const SUPERLATIVES = [
  /\bmost\s+important(?:ly)?\b/gi,
  /\bcrucial(?:ly)?\b/gi,
  /\bremarkabl[ye]\b/gi,
  /\bstriking(?:ly)?\b/gi,
  /\bunprecedented\b/gi,
  /\bnear-universal\b/gi,
  /\bsingle\s+most\b/gi,
  /\bclearly\s+(?:demonstrates|shows|establishes)\b/gi,
  /\bthe\s+mandate\s+is\s+clear\b/gi,
];

function mkFinding(b: Block, criterion: Criterion): Finding {
  return {
    label: b.label || `(${b.root})`,
    kind: b.kind,
    criterion,
    result: "n/a",
    evidence: "",
    metrics: {},
    mdPath: b.mdPath,
    qaPath: join(b.dir, `${b.root}.qa.json`),
  };
}

function sumHits(p: string, res: RegExp[]): { n: number; ex: string[] } {
  let n = 0;
  const ex: string[] = [];
  for (const re of res) {
    n += countMatches(p, re);
    if (ex.length < 3) ex.push(...sampleMatches(p, re, 3 - ex.length));
  }
  return { n, ex };
}

function findingsFor(b: Block, only?: Criterion): Finding[] {
  const out: Finding[] = [];
  const want = (c: Criterion) => !only || only === c;
  const p = prose(b.md);
  const words = wordCount(p);
  const sents = sentences(p);

  const push = (
    f: Finding,
    hit: boolean,
    sev: Severity,
    evFail: string,
    evPass: string,
    metrics: Record<string, number | string>,
  ) => {
    f.metrics = { words, ...metrics };
    if (hit) {
      f.result = "fail";
      f.severity = sev;
      f.evidence = evFail;
    } else {
      f.result = "pass";
      f.evidence = evPass;
    }
    out.push(f);
  };

  if (want("trap-negation-contrast")) {
    const n1 = countMatches(p, NEG_APPOSITIVE);
    const n2 = countMatches(p, NEG_NOT_BUT);
    const ex = [
      ...sampleMatches(p, NEG_APPOSITIVE, 2),
      ...sampleMatches(p, NEG_NOT_BUT, 2),
    ];
    push(
      mkFinding(b, "trap-negation-contrast"),
      n1 + n2 >= 1,
      "major",
      `${n1 + n2} negation-contrast construction(s): ${ex.map((e) => `"${e}"`).join("; ")} — state the positive claim directly`,
      "no negation-contrast constructions",
      { appositive: n1, notBut: n2 },
    );
  }

  if (want("trap-rhetorical-pivot")) {
    const { n, ex } = sumHits(p, PIVOTS);
    push(
      mkFinding(b, "trap-rhetorical-pivot"),
      n >= 1,
      "major",
      `${n} rhetorical pivot(s): ${ex.map((e) => `"${e}"`).join("; ")} — the second clause carries the content; drop the setup`,
      "no rhetorical pivots",
      { pivots: n },
    );
  }

  if (want("trap-em-dash")) {
    const n = countMatches(p, DASH);
    const per100 = words ? (100 * n) / words : 0;
    push(
      mkFinding(b, "trap-em-dash"),
      n >= T.dashMin && per100 > T.dashPer100,
      "minor",
      `${n} stylistic spaced dashes in ${words} words (${per100.toFixed(2)}/100w) — restructure into sentences`,
      `dash density acceptable (${n} in ${words} words)`,
      { dashes: n, per100: Number(per100.toFixed(2)) },
    );
  }

  if (want("trap-triples")) {
    const n = countMatches(p, TRIPLE);
    const per120 = words ? (120 * n) / words : 0;
    push(
      mkFinding(b, "trap-triples"),
      n >= T.triplesMin && per120 > T.triplesPer120,
      "minor",
      `${n} three-item lists in ${words} words — check each is substantive, not the three-item reflex`,
      `triple density acceptable (${n} in ${words} words)`,
      { triples: n, per120: Number(per120.toFixed(2)) },
    );
  }

  if (want("trap-closing-aphorism")) {
    const last = sents.length ? sents[sents.length - 1] : "";
    const lw = wordCount(last);
    const shape = APHORISM_SHAPES.some((re) => re.test(last));
    const hit =
      lw > 0 && lw <= T.aphorismMaxWords && shape && !last.includes(" M ");
    push(
      mkFinding(b, "trap-closing-aphorism"),
      hit,
      "major",
      `closing line reads as an aphorism: "${last.slice(0, 80)}" — end on content, not a quotable`,
      "closer is content, not aphorism",
      { closerWords: lw },
    );
  }

  if (want("trap-meta-commentary")) {
    const { n, ex } = sumHits(p, META);
    push(
      mkFinding(b, "trap-meta-commentary"),
      n >= 1,
      "major",
      `${n} meta-commentary phrase(s): ${ex.map((e) => `"${e}"`).join("; ")} — place the emphasis; do not narrate it`,
      "no meta-commentary on the block's own rhetoric",
      { meta: n },
    );
  }

  if (want("trap-thesis-restatement")) {
    const last = sents.length ? sents[sents.length - 1] : "";
    const closerHit =
      RESTATE_CLOSERS.test(last) && !PROOF_CLOSER.test(last);
    const phraseHits = sumHits(p, RESTATE_PHRASES).n;
    const hit = closerHit || phraseHits >= 1;
    push(
      mkFinding(b, "trap-thesis-restatement"),
      hit,
      "major",
      closerHit
        ? `block closes by restating its thesis: "${last.slice(0, 80)}"`
        : `${phraseHits} summary-restatement phrase(s) ("In summary", "To summarize")`,
      "no thesis restatement",
      { closerHit: closerHit ? 1 : 0, phraseHits },
    );
  }

  if (want("trap-performed-warmth")) {
    const { n, ex } = sumHits(p, WARMTH);
    push(
      mkFinding(b, "trap-performed-warmth"),
      n >= 1,
      "minor",
      `${n} performed-warmth phrase(s): ${ex.map((e) => `"${e}"`).join("; ")} — scholarly register is institutional, not personal`,
      "register is institutional",
      { warmth: n },
    );
  }

  if (want("trap-superlative")) {
    const { n, ex } = sumHits(p, SUPERLATIVES);
    push(
      mkFinding(b, "trap-superlative"),
      n >= T.superlativeMin,
      "minor",
      `${n} maximum-strength claim(s): ${ex.map((e) => `"${e}"`).join("; ")} — qualify or drop`,
      `superlative density acceptable (${n})`,
      { superlatives: n },
    );
  }

  if (want("trap-nonspeakable")) {
    const long = sents.filter((s) => wordCount(s) > T.sentenceWords);
    push(
      mkFinding(b, "trap-nonspeakable"),
      long.length >= T.longSentencesMin,
      "minor",
      `${long.length} sentence(s) over ${T.sentenceWords} words — written for the eye, not the ear; split`,
      "sentence lengths speakable",
      { longSentences: long.length },
    );
  }

  return out;
}

// ---------------------------------------------------------------------------
// Sidecar upsert — mirrors definition-clarity-audit.ts
// ---------------------------------------------------------------------------

function sha12(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 12);
}

function headSha(repoRoot: string): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

function writeSidecar(
  b: Block,
  findings: Finding[],
  scriptHash: string,
  scriptSha: string,
  reviewedSha: string,
) {
  const qaPath = join(b.dir, `${b.root}.qa.json`);
  let doc: any = {};
  if (existsSync(qaPath)) {
    try {
      doc = JSON.parse(readFileSync(qaPath, "utf8"));
    } catch {
      doc = {};
    }
  }
  doc.$schema ??= "block-qa/v1";
  doc.label ??= b.label;
  doc.kind ??= b.kind;
  doc.criteria ??= {};
  const fh: QaFieldHash = { md: sha12(b.md), ts: sha12(b.ts) };
  const now = new Date().toISOString();
  for (const f of findings) {
    const entry: QaCriterionEntry = {
      field_hash: fh,
      result: f.result === "n/a" ? "n/a" : f.result,
      reviewer: {
        kind: "script",
        id: "content/pipeline/language-trap-audit.ts",
        version: "v1",
        script_hash: scriptHash,
        script_commit_sha: scriptSha,
      },
      reviewed_at: now,
      reviewed_sha: reviewedSha,
    };
    if (f.severity) entry.severity = f.severity;
    if (f.evidence) entry.evidence = f.evidence;
    doc.criteria[f.criterion] = [entry];
  }
  doc.updated_at = now;
  writeFileSync(qaPath, JSON.stringify(doc, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function blob(branch: string, path: string): string {
  // derive the consumer repo from its git remote so report links work in
  // any folio checkout (falls back to a plain path when no remote)
  try {
    const url = execFileSync("git", ["config", "--get", "remote.origin.url"])
      .toString()
      .trim()
      .replace(/\.git$/, "")
      .replace(/^git@github\.com:/, "https://github.com/");
    if (url.startsWith("https://")) return `${url}/blob/${branch}/${path}`;
  } catch {
    /* ignore */
  }
  return path;
}

function sevRank(s?: Severity): number {
  return s === "critical" ? 3 : s === "major" ? 2 : s === "minor" ? 1 : 0;
}

function buildMd(
  findings: Finding[],
  scanned: number,
  branch: string,
  top: number,
): string {
  const fails = findings.filter((f) => f.result === "fail");
  const lines: string[] = [];
  lines.push(
    `# Language-trap audit — ${new Date().toISOString().slice(0, 10)}`,
  );
  lines.push("");
  lines.push(
    `Scanner: [\`content/pipeline/language-trap-audit.ts\`](${blob(branch, "content/pipeline/language-trap-audit.ts")}).`,
  );
  lines.push("");
  lines.push(
    `High-recall heuristic candidates for ten model-idiom trap categories ` +
      `(owner specification 2026-08-15). A \`fail\` is a candidate the ` +
      `adjudicating agent confirms, not a verdict. The diagnostic criteria ` +
      `(negation-contrast, rhetorical-pivot, closing-aphorism, ` +
      `meta-commentary, thesis-restatement) carry severity \`major\`; the ` +
      `density criteria carry \`minor\`.`,
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Criterion | pass | fail · major | fail · minor |");
  lines.push("|---|--:|--:|--:|");
  for (const c of CRITERIA) {
    const fc = findings.filter((f) => f.criterion === c);
    const pass = fc.filter((f) => f.result === "pass").length;
    const maj = fc.filter(
      (f) => f.result === "fail" && f.severity === "major",
    ).length;
    const min = fc.filter(
      (f) => f.result === "fail" && f.severity === "minor",
    ).length;
    lines.push(`| \`${c}\` | ${pass} | ${maj} | ${min} |`);
  }
  lines.push("");
  lines.push(
    `Blocks scanned: **${scanned}**. Total candidate fails: **${fails.length}**.`,
  );
  lines.push("");
  for (const c of CRITERIA) {
    const fc = fails
      .filter((f) => f.criterion === c)
      .sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
    lines.push(`## \`${c}\` — ${fc.length} candidate(s)`);
    lines.push("");
    if (!fc.length) {
      lines.push("None.");
      lines.push("");
      continue;
    }
    for (const f of fc.slice(0, top)) {
      lines.push(
        `- **${f.label}** (${f.kind}) — ${f.evidence} · [md](${blob(branch, f.mdPath)})`,
      );
    }
    if (fc.length > top) lines.push(`- … and ${fc.length - top} more.`);
    lines.push("");
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Walk + drive
// ---------------------------------------------------------------------------

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (e === "node_modules" || e === ".git" || e === ".lake") continue;
    const full = join(dir, e);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walk(full);
    else if (e.endsWith(".md")) yield full;
  }
}

function loadBlock(mdPath: string, repoRoot: string): Block | null {
  const dir = dirname(mdPath);
  const root = basename(mdPath, ".md");
  const tsPath = join(dir, `${root}.ts`);
  if (!existsSync(tsPath)) return null;
  const ts = readFileSync(tsPath, "utf8");
  const kind = parseKind(ts);
  if (!kind || !PROSE_KINDS.includes(kind)) return null;
  const md = readFileSync(mdPath, "utf8");
  return {
    root,
    dir,
    kind,
    label: parseLabel(ts),
    mdPath: relative(repoRoot, mdPath),
    tsPath: relative(repoRoot, tsPath),
    md,
    ts,
  };
}

function main() {
  const argv = process.argv.slice(2);
  const roots: string[] = [];
  let jsonOut = "";
  let mdOut = "";
  let only: Criterion | undefined;
  let branch = "";
  let writeSidecars = false;
  let quiet = false;
  let top = 25;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") jsonOut = argv[++i];
    else if (a === "--md") mdOut = argv[++i];
    else if (a === "--only") only = argv[++i] as Criterion;
    else if (a === "--branch") branch = argv[++i];
    else if (a === "--write-sidecars") writeSidecars = true;
    else if (a === "--quiet") quiet = true;
    else if (a === "--top") top = parseInt(argv[++i], 10);
    else if (!a.startsWith("--")) roots.push(a);
  }
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"])
    .toString()
    .trim();
  if (!roots.length) roots.push(join(repoRoot, "content"));
  if (!branch) {
    try {
      branch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
        cwd: repoRoot,
      })
        .toString()
        .trim();
    } catch {
      branch = "main";
    }
  }
  if (only && !CRITERIA.includes(only)) {
    console.error(
      `unknown criterion: ${only}; choose from ${CRITERIA.join(", ")}`,
    );
    process.exit(2);
  }

  const allFindings: Finding[] = [];
  const blocks: Block[] = [];
  for (const r of roots) {
    for (const md of walk(resolve(r))) {
      const b = loadBlock(md, repoRoot);
      if (!b) continue;
      const fs = findingsFor(b, only);
      if (fs.length) {
        blocks.push(b);
        allFindings.push(...fs);
      }
    }
  }

  if (writeSidecars) {
    const scriptHash = sha12(
      readFileSync(resolve(__dirname, basename(__filename)), "utf8"),
    );
    let scriptSha = "uncommitted";
    try {
      scriptSha =
        execFileSync(
          "git",
          ["log", "-1", "--format=%H", "--", relative(repoRoot, __filename)],
          { cwd: repoRoot },
        )
          .toString()
          .trim() || "uncommitted";
    } catch {
      /* ignore */
    }
    const reviewedSha = headSha(repoRoot);
    for (const b of blocks) {
      const fs = allFindings.filter((f) => f.mdPath === b.mdPath);
      writeSidecar(b, fs, scriptHash, scriptSha, reviewedSha);
    }
  }

  const fails = allFindings.filter((f) => f.result === "fail");
  if (jsonOut) {
    writeFileSync(
      resolve(jsonOut),
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          scanned: blocks.length,
          criteria: CRITERIA,
          thresholds: T,
          findings: allFindings,
        },
        null,
        2,
      ) + "\n",
    );
  }
  if (mdOut) {
    writeFileSync(
      resolve(mdOut),
      buildMd(allFindings, blocks.length, branch, top),
    );
  }

  if (!quiet) {
    console.log(`language-trap-audit: scanned ${blocks.length} block(s)`);
    for (const c of CRITERIA) {
      const fc = allFindings.filter((f) => f.criterion === c);
      const fl = fc.filter((f) => f.result === "fail").length;
      const pass = fc.filter((f) => f.result === "pass").length;
      console.log(`  ${c.padEnd(26)} pass=${pass}  fail=${fl}`);
    }
    console.log(`  total candidate fails: ${fails.length}`);
    if (jsonOut) console.log(`  json -> ${jsonOut}`);
    if (mdOut) console.log(`  md   -> ${mdOut}`);
  }
  process.exit(fails.length ? 1 : 0);
}

main();
