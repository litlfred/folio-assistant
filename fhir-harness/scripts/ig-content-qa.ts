#!/usr/bin/env bun
/**
 * ig-content-qa.ts — the QA gate that keeps injection attempts in an IG's
 * narratives and markdown off a published site (fhir-harness#330).
 *
 * Owner, 2026-11-10: *"resource's own narrative,... for this and other
 * markdown content, need QC/QA checks to scan for injection attempts before
 * publication ..before rendering o[n the page] ... agent scan QA/sidecar w/
 * gate"*.
 *
 * ## Three lines, in order
 *
 * 1. **An agent scan, recorded as a sidecar.** An agent reads every text this
 *    module collects ({@link collectItems}: each resource's `text.div` and
 *    markdown fields from the AST, and the IG's own pages) and writes what it
 *    found to the IG's `qa/ig-content-qa.json` ({@link CONTENT_QA_SIDECAR}),
 *    stamped with the digest of exactly what it read ({@link contentDigest}).
 *    The agent looks past the pattern list: prompt-injection text aimed at an
 *    agent that reads the site, hidden text, a link whose words name one
 *    place and whose target is another. How: skill `ig-content-qa`.
 * 2. **The publish gate** ({@link contentGate}), run by `ig-site:compose`
 *    before anything is staged. It refuses when the sidecar is missing, when
 *    its digest is not the digest of the content being published (stale),
 *    when it holds an open finding, or when the pattern scan
 *    ({@link scanText}) finds anything. A pattern hit is refused whatever the
 *    sidecar says: it is the deterministic floor, never cleared by a review.
 *    A missing or stale review refuses every publish, previews included
 *    (owner, card Q-INJ-1 "B"); `IG_CONTENT_QA_ACCEPT_UNREVIEWED=1` accepts
 *    one for a local build, and its QA page says so. Nothing accepts a
 *    pattern hit or an open finding.
 * 3. **The browser** (`templates/ig-pages/ast-resource.js`) scans a fetched
 *    narrative with the same rules ({@link INJECTION_RULES}; a test holds the
 *    two lists equal) and shows a flagged one as text with a warning, never
 *    rendered. Its sanitiser stays behind that.
 *
 * ## What is a text
 *
 * One {@link ContentItem} per (where, field): `where` is `<Type>/<id>` for a
 * resource or the repository path for a page; `field` the JSON path inside
 * the resource (`text.div`, `description`, `differential.element[3].definition`)
 * or `page`. Its `sha` is the SHA-256 of the text, so a finding names the
 * text it was about and a changed text shows as changed.
 *
 * ```sh
 * bun run fhir-harness/scripts/ig-content-qa.ts scan   [--ig <checkout>] [--ast <dir>] [--out <bundle.json>]
 * bun run fhir-harness/scripts/ig-content-qa.ts record [--ig <checkout>] [--ast <dir>] --reviewer <who> [--findings <file.json>]
 * bun run fhir-harness/scripts/ig-content-qa.ts gate   [--ig <checkout>] [--ast <dir>]
 * ```
 *
 * @module fhir-harness/scripts/ig-content-qa
 * @covers none — a publish gate over an IG's texts; it judges no declared graph
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** Where the agent's review is kept in the IG repository. The IG declares it in `contentTypes.ig.include`. */
export const CONTENT_QA_SIDECAR = "qa/ig-content-qa.json";
/** The sidecar's format tag. */
export const CONTENT_QA_TAG = "ig-content-qa/v1";
/** `1` accepts a missing or stale review for a local build; every publish, previews included, refuses one (`ig-repo-site.ts` `contentQaGate`). */
export const ACCEPT_UNREVIEWED_ENV = "IG_CONTENT_QA_ACCEPT_UNREVIEWED";
/** Where the gate's verdict is published under the site root, beside the Publisher's QA summary. */
export const CONTENT_QA_PUBLISHED = "assets/fhir-qa/ig-content-qa.json";

/**
 * The pattern rules: the issue's list, plus Unicode bidirectional controls
 * (text that reads one way and runs another). The same list is in
 * `ast-resource.js` between `INJECTION_RULES:BEGIN` and `:END`, as JSON;
 * `ig-content-qa.test.ts` holds the two equal.
 */
export const INJECTION_RULES: readonly { id: string; source: string; flags: string; says: string }[] = [
  { id: "script-tag", source: "<script\\b", flags: "i", says: "a <script> element" },
  { id: "iframe-tag", source: "<iframe\\b", flags: "i", says: "an <iframe> element" },
  { id: "object-tag", source: "<object\\b", flags: "i", says: "an <object> element" },
  { id: "embed-tag", source: "<embed\\b", flags: "i", says: "an <embed> element" },
  { id: "form-tag", source: "<form\\b", flags: "i", says: "a <form> element" },
  { id: "base-tag", source: "<base\\b", flags: "i", says: "a <base> element" },
  { id: "meta-http-equiv", source: "<meta\\b[^>]*http-equiv", flags: "i", says: "a <meta http-equiv> element" },
  { id: "event-handler", source: "<[a-z][a-z0-9:-]*\\b[^>]*[\\s/\"']on[a-z]+\\s*=", flags: "i", says: "an on* event handler attribute" },
  { id: "script-url", source: "(?:=\\s*[\"']?|\\]\\(\\s*<?|<|url\\(\\s*[\"']?)\\s*(?:javascript|vbscript|livescript)\\s*:", flags: "i", says: "a javascript:/vbscript: URL" },
  { id: "data-html-url", source: "data\\s*:\\s*(?:text/html|application/xhtml\\+xml)", flags: "i", says: "a data: URL carrying HTML" },
  { id: "srcdoc", source: "<[a-z][a-z0-9:-]*\\b[^>]*[\\s/\"']srcdoc\\s*=", flags: "i", says: "an srcdoc attribute" },
  { id: "css-expression", source: "expression\\s*\\(", flags: "i", says: "a CSS expression()" },
  { id: "bidi-control", source: "[\\u202A-\\u202E\\u2066-\\u2069]", flags: "", says: "a Unicode bidirectional control character" },
];

const COMPILED = INJECTION_RULES.map((r) => ({ ...r, re: new RegExp(r.source, r.flags) }));

const NAMED: Record<string, string> = { colon: ":", tab: "\t", newline: "\n", lpar: "(", rpar: ")", lt: "<", gt: ">", quot: '"', apos: "'", amp: "&", sol: "/" };

/**
 * The text as a browser would read it: character references decoded (twice,
 * for `&amp;#106;`), and the tabs and newlines a browser ignores inside a URL
 * scheme removed — `java&#x09;script:` is `javascript:` to a browser.
 */
export function decoded(text: string): string {
  let t = text;
  for (let i = 0; i < 2; i++) {
    t = t
      .replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => String.fromCodePoint(Number.parseInt(h, 16) % 0x110000))
      .replace(/&#(\d+);?/g, (_, d: string) => String.fromCodePoint(Number.parseInt(d, 10) % 0x110000))
      .replace(/&([a-z]+);/gi, (m, n: string) => NAMED[n.toLowerCase()] ?? m);
  }
  return t.replace(/[\t\n\r\0]+/g, "");
}

/** A pattern hit in one text. */
export interface PatternHit {
  rule: string;
  says: string;
  /** Up to 80 characters around the hit, as the decoded text reads. */
  excerpt: string;
}

/** The pattern rules a text breaks: each rule once, over the text as written and as decoded. */
export function scanText(text: string): PatternHit[] {
  const forms = [text, decoded(text)];
  const out: PatternHit[] = [];
  for (const r of COMPILED) {
    for (const f of forms) {
      const m = r.re.exec(f);
      if (!m) continue;
      const at = Math.max(0, m.index - 20);
      out.push({ rule: r.id, says: r.says, excerpt: f.slice(at, at + 80).replace(/\s+/g, " ") });
      break;
    }
  }
  return out;
}

// ── what is a text ─────────────────────────────────────────────────────────

/** One text the scan reads. */
export interface ContentItem {
  kind: "narrative" | "markdown" | "page";
  where: string;
  field: string;
  /** SHA-256 of `text`, hex. */
  sha: string;
  text: string;
}

/**
 * The FHIR fields whose values are markdown, or strings a page shows as such,
 * at any depth of a resource. `text` is one only when it is a string (an
 * Annotation's): a resource's `text` is its Narrative, read as `text.div`.
 */
export const MARKDOWN_FIELDS: ReadonlySet<string> = new Set([
  "description",
  "purpose",
  "copyright",
  "comment",
  "definition",
  "requirements",
  "meaningWhenMissing",
  "orderMeaning",
  "documentation",
  "usage",
  "valueMarkdown",
  "text",
]);

const sha256 = (s: string): string => createHash("sha256").update(s, "utf8").digest("hex");

function item(kind: ContentItem["kind"], where: string, field: string, text: string): ContentItem {
  return { kind, where, field, sha: sha256(text), text };
}

/** The texts of one resource: its narrative, then every markdown field, in document order. */
export function resourceItems(resource: unknown): ContentItem[] {
  if (!resource || typeof resource !== "object") return [];
  const r = resource as Record<string, unknown>;
  const where = `${String(r.resourceType ?? "?")}/${String(r.id ?? "?")}`;
  const out: ContentItem[] = [];
  const walk = (v: unknown, path: string): void => {
    if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${path}[${i}]`));
      return;
    }
    if (!v || typeof v !== "object") return;
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      const p = path ? `${path}.${k}` : k;
      if (k === "text" && x && typeof x === "object" && !Array.isArray(x)) {
        const div = (x as Record<string, unknown>).div;
        if (typeof div === "string" && div.trim()) out.push(item("narrative", where, `${p}.div`, div));
        continue;
      }
      if (typeof x === "string") {
        if (MARKDOWN_FIELDS.has(k) && x.trim()) out.push(item("markdown", where, p, x));
        continue;
      }
      // A contained resource is scanned as part of its container.
      walk(x, p);
    }
  };
  walk(r, "");
  return out;
}

/** The IG's own page directories: its authored markdown and HTML. */
export const IG_PAGE_DIRS = ["input/pagecontent", "input/pages", "input/intro-notes", "input/includes"] as const;
const PAGE_FILE = /\.(md|markdown|html?|xml|liquid)$/i;

/** What the scan may read in the IG checkout (`ig-read-scope.ts`'s two questions). */
export interface ReadScope {
  declares(rel: string): boolean;
  reaches(rel: string): boolean;
}
const EVERYTHING: ReadScope = { declares: () => true, reaches: () => true };

/** The IG's own pages under {@link IG_PAGE_DIRS}, within the read scope, sorted by path. */
export function pageItems(ig: string, scope: ReadScope = EVERYTHING): ContentItem[] {
  const out: ContentItem[] = [];
  const walk = (rel: string): void => {
    const abs = join(ig, rel);
    if (!existsSync(abs) || !scope.reaches(rel)) return;
    for (const e of readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(r);
      else if (e.isFile() && PAGE_FILE.test(e.name) && scope.declares(r)) out.push(item("page", r, "page", readFileSync(join(ig, r), "utf-8")));
    }
  };
  for (const d of IG_PAGE_DIRS) walk(d);
  return out;
}

/** Every resource's texts in an AST directory (`manifest.json` `resources[].file`), in manifest order. */
export function astItems(ast: string): ContentItem[] {
  const mf = join(ast, "manifest.json");
  if (!existsSync(mf)) throw new Error(`no AST at ${ast}: manifest.json is missing — the texts cannot be read, so they cannot be cleared`);
  const m = JSON.parse(readFileSync(mf, "utf-8")) as { resources?: { file?: string }[] };
  const out: ContentItem[] = [];
  for (const r of m.resources ?? []) {
    if (!r.file) continue;
    const f = join(ast, r.file);
    if (!existsSync(f)) throw new Error(`${f}: the AST lists it and does not hold it — refusing to clear what cannot be read`);
    out.push(...resourceItems(JSON.parse(readFileSync(f, "utf-8"))));
  }
  return out;
}

/** Everything the gate reads: the AST's texts, then the IG's pages. */
export function collectItems(o: { ig: string; ast: string; scope?: ReadScope }): ContentItem[] {
  return [...astItems(o.ast), ...pageItems(o.ig, o.scope)];
}

/**
 * The digest of a set of texts: SHA-256 over one sorted line per text,
 * `kind \t where \t field \t sha`. Order-free, and any changed, added or
 * removed text changes it.
 */
export function contentDigest(items: readonly ContentItem[]): string {
  const lines = items.map((i) => `${i.kind}\t${i.where}\t${i.field}\t${i.sha}`).sort();
  return `sha256:${sha256(lines.join("\n"))}`;
}

// ── the sidecar ────────────────────────────────────────────────────────────

/** One thing the agent found. */
export interface ReviewFinding {
  where: string;
  field: string;
  /** The text's {@link ContentItem.sha} when found. */
  sha?: string;
  /** What kind of attempt: `html-injection`, `prompt-injection`, `hidden-text`, `deceptive-link`, ... */
  kind: string;
  note: string;
  /** `open` refuses the publish; `cleared` needs a `reason`. */
  status: "open" | "cleared";
  reason?: string;
}

/** `qa/ig-content-qa.json`. */
export interface ContentQaSidecar {
  $schema: typeof CONTENT_QA_TAG;
  contentDigest: string;
  items: number;
  reviewedAt: string;
  reviewer: { kind: "agent" | "person"; name: string; session?: string };
  findings: ReviewFinding[];
}

/** Why a sidecar is not a usable review, or nothing when it is. */
export function sidecarProblems(v: unknown): string[] {
  if (!v || typeof v !== "object") return ["not a JSON object"];
  const s = v as Record<string, unknown>;
  const p: string[] = [];
  if (s.$schema !== CONTENT_QA_TAG) p.push(`$schema is ${JSON.stringify(s.$schema)}, not ${CONTENT_QA_TAG}`);
  if (typeof s.contentDigest !== "string" || !s.contentDigest.startsWith("sha256:")) p.push("contentDigest is not a sha256: digest");
  const rv = s.reviewer as Record<string, unknown> | undefined;
  if (!rv || (rv.kind !== "agent" && rv.kind !== "person") || typeof rv.name !== "string" || !rv.name) p.push("reviewer needs kind (agent|person) and name");
  if (!Array.isArray(s.findings)) p.push("findings is not a list");
  else
    s.findings.forEach((f: unknown, i: number) => {
      const x = (f ?? {}) as Record<string, unknown>;
      if (typeof x.where !== "string" || typeof x.field !== "string" || typeof x.kind !== "string" || typeof x.note !== "string") p.push(`findings[${i}] needs where, field, kind and note`);
      if (x.status !== "open" && x.status !== "cleared") p.push(`findings[${i}].status is ${JSON.stringify(x.status)}, not open or cleared`);
      if (x.status === "cleared" && (typeof x.reason !== "string" || !x.reason.trim())) p.push(`findings[${i}] is cleared without a reason`);
    });
  return p;
}

/** A sidecar for the texts `items`, from the agent's findings. */
export function makeSidecar(o: { items: readonly ContentItem[]; reviewer: ContentQaSidecar["reviewer"]; findings?: ReviewFinding[]; now?: Date }): ContentQaSidecar {
  const s: ContentQaSidecar = {
    $schema: CONTENT_QA_TAG,
    contentDigest: contentDigest(o.items),
    items: o.items.length,
    reviewedAt: (o.now ?? new Date()).toISOString(),
    reviewer: o.reviewer,
    findings: o.findings ?? [],
  };
  const p = sidecarProblems(s);
  if (p.length) throw new Error(`the review is not usable: ${p.join("; ")}`);
  return s;
}

// ── the gate ───────────────────────────────────────────────────────────────

/** A pattern hit, placed. */
export interface PlacedHit extends PatternHit {
  where: string;
  field: string;
}

/** The gate's verdict, published as {@link CONTENT_QA_PUBLISHED}. */
export interface ContentQaVerdict {
  $schema: "ig-content-qa-verdict/v1";
  ok: boolean;
  /** `reviewed`, `missing`, `stale`, `unusable`, `open-findings` or `pattern-hits`: the first reason it refused, or `reviewed`. */
  state: "reviewed" | "missing" | "stale" | "unusable" | "open-findings" | "pattern-hits";
  /** The review was missing or stale and a local build accepted it. */
  accepted?: boolean;
  items: number;
  contentDigest: string;
  reviewedDigest?: string;
  reviewer?: ContentQaSidecar["reviewer"];
  reviewedAt?: string;
  patternHits: PlacedHit[];
  openFindings: ReviewFinding[];
  said: string;
}

/**
 * Judge the texts against the review. `sidecar` is the parsed file, or
 * `undefined` when there is none. `acceptUnreviewed` (a local build's) lets a
 * missing or stale review through, said; it never lets a pattern hit or an
 * open finding through.
 */
export function contentGate(o: { items: readonly ContentItem[]; sidecar: unknown; acceptUnreviewed?: boolean }): ContentQaVerdict {
  const digest = contentDigest(o.items);
  const patternHits: PlacedHit[] = o.items.flatMap((i) => scanText(i.text).map((h) => ({ where: i.where, field: i.field, ...h })));
  const base = { $schema: "ig-content-qa-verdict/v1" as const, items: o.items.length, contentDigest: digest, patternHits };
  const problems = o.sidecar === undefined ? undefined : sidecarProblems(o.sidecar);
  const s = problems && !problems.length ? (o.sidecar as ContentQaSidecar) : undefined;
  const reviewed = s ? { reviewedDigest: s.contentDigest, reviewer: s.reviewer, reviewedAt: s.reviewedAt } : {};
  const openFindings = s ? s.findings.filter((f) => f.status === "open") : [];
  const hitsSaid = (): string =>
    `${patternHits.length} pattern hit(s) in the texts to be published — refused whatever a review says:\n  ${patternHits
      .slice(0, 20)
      .map((h) => `${h.where} ${h.field}: ${h.says} — "${h.excerpt}"`)
      .join("\n  ")}`;
  if (patternHits.length) return { ...base, ...reviewed, ok: false, state: "pattern-hits", openFindings, said: hitsSaid() };
  if (problems?.length) return { ...base, ok: false, state: "unusable", openFindings: [], said: `${CONTENT_QA_SIDECAR} is not a usable review: ${problems.join("; ")}` };
  if (openFindings.length)
    return { ...base, ...reviewed, ok: false, state: "open-findings", openFindings, said: `${openFindings.length} open finding(s) in ${CONTENT_QA_SIDECAR}:\n  ${openFindings.map((f) => `${f.where} ${f.field}: ${f.kind} — ${f.note}`).join("\n  ")}` };
  const how = `an agent reviews the texts and records the review (skill ig-content-qa: \`ig-content-qa.ts scan\`, then \`record\`)`;
  if (!s) {
    const said = `no review of the ${o.items.length} text(s) to be published (${CONTENT_QA_SIDECAR}, content ${digest}): ${how}`;
    return o.acceptUnreviewed ? { ...base, ok: true, accepted: true, state: "missing", openFindings, said: `${said} — accepted for this build` } : { ...base, ok: false, state: "missing", openFindings, said };
  }
  if (s.contentDigest !== digest) {
    const said = `the review in ${CONTENT_QA_SIDECAR} is stale: it read ${s.contentDigest} (${s.items} text(s)), the site would publish ${digest} (${o.items.length}); ${how}`;
    return o.acceptUnreviewed ? { ...base, ...reviewed, ok: true, accepted: true, state: "stale", openFindings, said: `${said} — accepted for this build` } : { ...base, ...reviewed, ok: false, state: "stale", openFindings, said };
  }
  return { ...base, ...reviewed, ok: true, state: "reviewed", openFindings, said: `${o.items.length} text(s) reviewed by ${s.reviewer.kind} ${s.reviewer.name} at ${s.reviewedAt}; no pattern hit, no open finding` };
}

/** The review file in the IG, parsed; `undefined` when it is absent or not declared. Throws on a file that is not JSON. */
export function readSidecar(ig: string, scope: ReadScope = EVERYTHING): unknown {
  const f = join(ig, CONTENT_QA_SIDECAR);
  if (!existsSync(f) || !statSync(f).isFile()) return undefined;
  if (!scope.declares(CONTENT_QA_SIDECAR)) throw new Error(`${CONTENT_QA_SIDECAR} exists but is not in contentTypes.ig.include: add it to the IG's index.config.json so the gate may read it`);
  try {
    return JSON.parse(readFileSync(f, "utf-8"));
  } catch (e) {
    return { unparsable: (e as Error).message };
  }
}

/** Run the gate for a checkout: read, judge, write the verdict under `work` when given. Throws on a refusal. */
export function runGate(o: { ig: string; ast: string; scope?: ReadScope; acceptUnreviewed?: boolean; work?: string; log?: (s: string) => void }): ContentQaVerdict {
  const log = o.log ?? ((s: string) => console.error(s));
  const items = collectItems({ ig: o.ig, ast: o.ast, ...(o.scope ? { scope: o.scope } : {}) });
  const v = contentGate({ items, sidecar: readSidecar(o.ig, o.scope), ...(o.acceptUnreviewed ? { acceptUnreviewed: true } : {}) });
  if (o.work) {
    mkdirSync(o.work, { recursive: true });
    writeFileSync(join(o.work, VERDICT_FILE), `${JSON.stringify(v, null, 2)}\n`);
  }
  if (!v.ok) throw new Error(`injection QA refused the publish: ${v.said}`);
  log(`injection QA: ${v.said}`);
  return v;
}

/** Under the site build's work directory: the gate's verdict, for the QA page. */
export const VERDICT_FILE = "ig-content-qa-verdict.json";

// ── command line ───────────────────────────────────────────────────────────

async function scopeOf(ig: string): Promise<ReadScope> {
  // Loaded here, not at the top: the functions above need no mounted layer.
  const { igReadScope } = await import("./ig-read-scope.ts");
  return igReadScope(ig);
}

async function main(argv: string[]): Promise<number> {
  const [cmd, ...args] = argv;
  const opt = (k: string): string | undefined => {
    const i = args.indexOf(`--${k}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const ig = resolve(opt("ig") ?? ".");
  const ast = resolve(opt("ast") ?? join(ig, "output-ast"));
  const scope = await scopeOf(ig);
  if (cmd === "scan") {
    const items = collectItems({ ig, ast, scope });
    const bundle = { contentDigest: contentDigest(items), items: items.map((i) => ({ ...i, patternHits: scanText(i.text) })) };
    const out = opt("out");
    if (out) {
      mkdirSync(dirname(resolve(out)), { recursive: true });
      writeFileSync(resolve(out), `${JSON.stringify(bundle, null, 2)}\n`);
    }
    const hits = bundle.items.filter((i) => i.patternHits.length);
    console.log(`${items.length} text(s), content ${bundle.contentDigest}; ${hits.length} with pattern hits${out ? `; bundle at ${out}` : ""}`);
    for (const h of hits) console.log(`  ${h.where} ${h.field}: ${h.patternHits.map((p) => p.rule).join(", ")}`);
    return 0;
  }
  if (cmd === "record") {
    const reviewer = opt("reviewer");
    if (!reviewer) throw new Error("record needs --reviewer <who>");
    const ff = opt("findings");
    const findings = ff ? (JSON.parse(readFileSync(resolve(ff), "utf-8")) as ReviewFinding[]) : [];
    const items = collectItems({ ig, ast, scope });
    const session = opt("session");
    const s = makeSidecar({ items, reviewer: { kind: (opt("kind") as "agent" | "person" | undefined) ?? "agent", name: reviewer, ...(session ? { session } : {}) }, findings });
    mkdirSync(join(ig, dirname(CONTENT_QA_SIDECAR)), { recursive: true });
    writeFileSync(join(ig, CONTENT_QA_SIDECAR), `${JSON.stringify(s, null, 2)}\n`);
    const hits = items.filter((i) => scanText(i.text).length).length;
    console.log(`${CONTENT_QA_SIDECAR}: ${s.items} text(s), ${s.contentDigest}, ${s.findings.length} finding(s)${hits ? `; ${hits} text(s) still break a pattern rule, which the gate refuses whatever this review says` : ""}`);
    return 0;
  }
  if (cmd === "gate") {
    // As the root judges: only a reviewed, clean set of texts passes.
    runGate({ ig, ast, scope });
    return 0;
  }
  console.error(
    "usage: ig-content-qa.ts scan   [--ig <checkout>] [--ast <dir>] [--out <bundle.json>]\n" +
      "       ig-content-qa.ts record [--ig <checkout>] [--ast <dir>] --reviewer <who> [--kind agent|person] [--session <url>] [--findings <file.json>]\n" +
      "       ig-content-qa.ts gate   [--ig <checkout>] [--ast <dir>]",
  );
  return 2;
}

if (import.meta.main) {
  main(process.argv.slice(2)).then(
    (c) => process.exit(c),
    (e) => {
      console.error(`✗ ig-content-qa: ${(e as Error).message}`);
      process.exit(1);
    },
  );
}
