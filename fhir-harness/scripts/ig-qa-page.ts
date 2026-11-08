#!/usr/bin/env bun
/**
 * ig-qa-page.ts — an IG site's QA report, `qa.html`: the FHIR QA and the
 * knowledge graph's QA on one page, the page the footer's "QA Report" links.
 *
 * Owner, 2026-11-06: *"QA report should link to harness QA reports = FHIR QA
 * reports + KG QA"*. Earlier (2026-10-12): *"where are qa reports
 * visible?"* — a finding a check wrote and nobody can read is the same as no
 * finding.
 *
 * ## The FHIR QA, from what the build holds
 *
 * The site is built from the IG's cached AST, never a Publisher run
 * (`ig-build-pipeline` rule 1), so the Publisher's `qa.html` is not
 * published. What the build holds is said, and what it does not hold is said
 * too:
 *
 * - the **Publisher's QA summary**, `qa.json`, which the AST build carries
 *   beside the AST (`ig-ast-build.sh`, `ig-cache.sh seed`): its errors,
 *   warnings and hints, and the run they came from. An AST cached before it
 *   carried one has none, and the page says so rather than showing zeros;
 * - the **AST's own record**: when its Publisher run generated it, with which
 *   toolchain, and which of its parts are provisional until a full run;
 * - the **AST's validity** for this checkout (`ig-repo-site ast` writes it
 *   under the work directory): valid, stale, or cannot tell, with why.
 *
 * ## The KG QA, from the harness
 *
 * cat-harness-tools `kg-qa-report.ts`: each instance's `qa-results/v1`
 * records and the harness's own view of the `qa` graph on this site. This
 * page lays it out and knows nothing of what any record is about.
 *
 *   bun run fhir-harness/scripts/ig-qa-page.ts --instance-root <dir> --docs <jekyll source> [--ast <dir>] [--work <dir>]
 *
 * @module fhir-harness/scripts/ig-qa-page
 * @covers none — it publishes QA records other checks wrote, and judges nothing
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { copyKgQaRecords, kgQaMarkdown, kgQaReport, type KgQaReport } from "../../cat-harness-tools/scripts/kg-qa-report.ts";
import { readDeclaration } from "../../cat-harness-tools/schemas/kg/cat-harness.ts";

/** Where the KG records are published under the site root. */
export const KG_QA_ASSETS = "assets/kg-qa";
/** Where the Publisher's QA summary is published under the site root. */
export const FHIR_QA_ASSETS = "assets/fhir-qa";
/** The Publisher's QA summary, as its run writes it to `output/` and the AST build carries it. */
export const PUBLISHER_QA_FILE = "qa.json";

type Json = Record<string, unknown>;

/** The FHIR half: everything optional, because each is something the build may not hold. */
export interface FhirQa {
  /** The Publisher's `qa.json`, as the AST carries it. */
  publisher?: Json;
  /** The AST's `manifest.json`. */
  manifest?: Json;
  /** `ig-ast-validity.json`, as `ig-repo-site ast` wrote it. */
  validity?: { verdict?: string; detail?: Json; recorded?: Json; current?: Json };
}

function readJson(file: string | undefined): Json | undefined {
  if (!file || !existsSync(file)) return undefined;
  try {
    const v = JSON.parse(readFileSync(file, "utf-8"));
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : undefined;
  } catch {
    return undefined;
  }
}

/** The FHIR QA the build holds: the AST directory, and the work directory the `ast` step wrote its verdict to. */
export function readFhirQa(ast: string | undefined, validityFile?: string): FhirQa {
  const publisher = ast ? readJson(join(ast, PUBLISHER_QA_FILE)) : undefined;
  const manifest = ast ? readJson(join(ast, "manifest.json")) : undefined;
  const validity = readJson(validityFile) as FhirQa["validity"];
  return { ...(publisher ? { publisher } : {}), ...(manifest ? { manifest } : {}), ...(validity ? { validity } : {}) };
}

const code = (v: unknown): string => `\`${String(v).replace(/`/g, "'")}\``;
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** The FHIR half as Markdown lines. */
export function fhirQaMarkdown(q: FhirQa, o: { up?: string } = {}): string[] {
  const up = o.up ?? "";
  const lines: string[] = [];
  lines.push("### IG Publisher", "");
  const p = q.publisher;
  if (p) {
    const rows: [string, number | undefined][] = [
      ["errors", num(p.errs)],
      ["warnings", num(p.warnings)],
      ["hints", num(p.hints)],
      ["suppressed warnings", num(p["suppressed-warnings"])],
      ["suppressed hints", num(p["suppressed-hints"])],
    ];
    const run = [p.tool ? `IG Publisher ${String(p.tool)}` : undefined, p.version ? `FHIR ${String(p.version)}` : undefined, p.date ?? p.dateISO8601 ? `on ${String(p.date ?? p.dateISO8601)}` : undefined].filter(Boolean);
    lines.push(`The Publisher's own QA summary for the run this AST came from${run.length ? ` (${run.join(", ")})` : ""}. [Summary (JSON)](${up}${FHIR_QA_ASSETS}/${PUBLISHER_QA_FILE})`, "");
    const held = rows.filter(([, n]) => n !== undefined);
    if (held.length) {
      lines.push("| messages | count |", "|---|---|");
      for (const [k, n] of held) lines.push(`| ${k} | ${n} |`);
      lines.push("");
    }
  } else {
    lines.push(
      "This build holds no Publisher QA summary (`qa.json`): the AST it was built from was cached without one. The Publisher's message list is not published here; an AST cached from a newer build carries its summary.",
      "",
    );
  }
  lines.push("### The IG's AST", "");
  const m = q.manifest;
  if (m) {
    const tc = (m.toolchain ?? {}) as Json;
    const prov = Array.isArray(m.provisional) ? (m.provisional as unknown[]).map(String) : [];
    lines.push("| field | value |", "|---|---|");
    if (m.generatedAt) lines.push(`| generated | ${code(m.generatedAt)} |`);
    if (m.authority) lines.push(`| authority | ${code(m.authority)} |`);
    for (const k of ["publisher", "core", "sushi", "java"]) if (tc[k]) lines.push(`| ${k} | ${code(tc[k])} |`);
    if (Array.isArray(m.resources)) lines.push(`| resources | ${m.resources.length} |`);
    if (prov.length) lines.push(`| provisional | ${prov.map(code).join(", ")}${m.provisionalUntil ? `, until ${String(m.provisionalUntil)}` : ""} |`);
    lines.push("");
  } else lines.push("This build holds no AST manifest.", "");
  const v = q.validity;
  if (v?.verdict) {
    const why = typeof v.detail?.why === "string" ? ` ${v.detail.why}` : "";
    lines.push(`**Validity for this checkout:** ${code(v.verdict)}.${why}`, "");
    const rec = (v.recorded ?? {}) as Json;
    const cur = (v.current ?? {}) as Json;
    const keys = ["toolchain", "sourceRevision", "inputDigest"].filter((k) => rec[k] !== undefined || cur[k] !== undefined);
    if (keys.length) {
      lines.push("| | recorded in the AST | this checkout |", "|---|---|---|");
      for (const k of keys) lines.push(`| ${k} | ${rec[k] !== undefined ? code(rec[k]) : "—"} | ${cur[k] !== undefined ? code(cur[k]) : "—"} |`);
      lines.push("");
    }
  } else lines.push("This build recorded no validity verdict for the AST.", "");
  return lines;
}

/** The whole page: front matter, then both halves inside `{% raw %}` (entries are data, not Liquid). */
export function renderQaPage(o: { title: string; fhir: FhirQa; kg: KgQaReport; up?: string }): string {
  return [
    "---",
    `title: ${JSON.stringify(o.title)}`,
    "nav_exclude: true",
    "rendered-by: ig-qa-page",
    "---",
    "",
    "{% raw %}",
    `# ${o.title}`,
    "",
    "Two halves: the FHIR QA of this implementation guide, and the knowledge graph's QA, the harness's checks over the instances this site is built from. A finding is a gap a check reports, not a failure of the build.",
    "",
    "## FHIR QA",
    "",
    ...fhirQaMarkdown(o.fhir, { up: o.up }),
    "## Knowledge-graph QA",
    "",
    ...kgQaMarkdown(o.kg, { assets: KG_QA_ASSETS, up: o.up, level: 3 }),
    "{% endraw %}",
    "",
  ].join("\n");
}

/** The page for the checkout at `root`: its text, and what it links that must be published beside it ({@link publishQaAssets}). */
export function buildQaPage(o: { root: string; ast?: string; validity?: string; title?: string }): { page: string; fhir: FhirQa; kg: KgQaReport } {
  const root = resolve(o.root);
  const fhir = readFhirQa(o.ast, o.validity);
  const kg = kgQaReport(root, readDeclaration(root)?.name);
  return { page: renderQaPage({ title: o.title ?? "QA Report", fhir, kg }), fhir, kg };
}

/** Publish what the page links under `site`: the Publisher's summary and the KG records. Returns how many KG records were copied. */
export function publishQaAssets(r: { fhir: FhirQa; kg: KgQaReport }, site: string): number {
  if (r.fhir.publisher) {
    mkdirSync(join(site, FHIR_QA_ASSETS), { recursive: true });
    writeFileSync(join(site, FHIR_QA_ASSETS, PUBLISHER_QA_FILE), `${JSON.stringify(r.fhir.publisher, null, 2)}\n`);
  }
  return copyKgQaRecords(r.kg, site, KG_QA_ASSETS);
}

function main(): number {
  const arg = (k: string) => {
    const i = process.argv.indexOf(`--${k}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const root = arg("instance-root");
  const docs = arg("docs");
  if (!root || !docs) {
    console.error("usage: ig-qa-page.ts --instance-root <dir> --docs <jekyll source> [--ast <dir>] [--work <dir>] [--title <title>]");
    return 2;
  }
  const work = arg("work");
  const r = buildQaPage({ root, ast: arg("ast") ?? join(root, "output-ast"), ...(work ? { validity: join(work, "ig-ast-validity.json") } : {}), ...(arg("title") ? { title: arg("title")! } : {}) });
  writeFileSync(join(resolve(docs), "qa.md"), r.page);
  const records = publishQaAssets(r, resolve(docs));
  console.log(`qa.md: FHIR QA ${r.fhir.publisher ? "with" : "without"} the Publisher's summary; KG QA over ${r.kg.instances.length} instance(s), ${records} record(s)`);
  return 0;
}

if (import.meta.main) process.exit(main());
