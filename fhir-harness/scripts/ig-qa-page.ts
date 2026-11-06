#!/usr/bin/env bun
/**
 * ig-qa-page.ts — an IG site's QA page: every `qa-results/v1` record the
 * instance declares, published verbatim and summarised on one page.
 *
 * Owner, 2026-10-12, on the four personas no swimlane names: *"should be in QA
 * report. where are qa reports visible?"* On the main site a QA record is
 * published under `/assets/qa/` and badged on its page; an IG repository's own
 * site (`templates/ig-repo-site/folio-site.yml`, since replaced by `site-publish.yml`) published none of them. A
 * finding a check wrote and nobody can read is the same as no finding.
 *
 * The records are found through the declaration, never a path: every
 * directory of the instance whose graph typologies include `qa`. Each
 * `*.qa-results.json` there that says `"$schema": "qa-results/v1"` is copied
 * to `<docs>/assets/ig-qa/` and gets a section on `<docs>/qa.md`: its
 * producer, its subject, and per family the summary, the count and the
 * entries. A file that does not parse, or is not `qa-results/v1`, is listed as
 * unreadable rather than dropped — a page that silently omits a record would
 * read as one with nothing to report.
 *
 * Generic: nothing here knows what any record is about.
 *
 *   bun run fhir-harness/scripts/ig-qa-page.ts --instance-root <dir> --docs <jekyll source>
 *
 * @module fhir-harness/scripts/ig-qa-page
 * @covers none — it publishes QA records other checks wrote, and judges nothing
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { instanceDirectoriesForGraph } from "@litlfred/cat-harness-tools/schemas/kg/cat-harness.ts";

export const QA_ASSETS = "assets/ig-qa";

interface Family {
  summary?: string;
  count?: number;
  entries?: unknown[];
}

export interface QaRecord {
  file: string;
  record?: {
    $schema?: string;
    producer?: { script?: string; script_hash?: string };
    subject?: { kind?: string; id?: string };
    families?: Record<string, Family>;
    total?: number;
  };
  unreadable?: string;
}

/** Every `*.qa-results.json` in `dirs`, parsed, in a stable order. */
export function readQaRecords(dirs: string[]): QaRecord[] {
  const out: QaRecord[] = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".qa-results.json")).sort()) {
      const file = join(dir, f);
      try {
        const record = JSON.parse(readFileSync(file, "utf-8"));
        if (record?.$schema !== "qa-results/v1") out.push({ file, unreadable: `not qa-results/v1 (${JSON.stringify(record?.$schema)})` });
        else out.push({ file, record });
      } catch (e) {
        out.push({ file, unreadable: `does not parse: ${(e as Error).message}` });
      }
    }
  }
  return out;
}

const cell = (v: unknown): string => {
  const s = typeof v === "string" ? v : v === undefined || v === null ? "" : JSON.stringify(v);
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
};

/** The page's Markdown body (inside `{% raw %}`: entries are data, not Liquid). */
export function renderQaPage(records: QaRecord[], title: string): string {
  const lines: string[] = [
    "---",
    `title: ${JSON.stringify(title)}`,
    "rendered-by: ig-qa-page",
    "---",
    "",
    "{% raw %}",
    `# ${title}`,
    "",
    "The quality checks recorded for this IG. Each is a check's own record, published unchanged; a finding is a gap the check reports, not a failure of the build.",
    "",
  ];
  if (!records.length) {
    lines.push("This IG declares a QA directory, but no check has written a record to it.", "");
  }
  for (const r of records) {
    const name = basename(r.file).replace(/\.qa-results\.json$/, "");
    lines.push(`## ${name}`, "");
    if (r.unreadable) {
      lines.push(`**Unreadable:** \`${basename(r.file)}\` ${r.unreadable}.`, "");
      continue;
    }
    const rec = r.record!;
    const fams = Object.entries(rec.families ?? {});
    const total = rec.total ?? fams.reduce((n, [, f]) => n + (f.count ?? 0), 0);
    lines.push(
      `${total === 0 ? "No findings." : `**${total} finding(s).**`} Written by \`${rec.producer?.script ?? "?"}\`` +
        `${rec.subject?.id ? ` about \`${rec.subject.id}\`` : ""}. [Record (JSON)](${QA_ASSETS}/${basename(r.file)})`,
      "",
    );
    if (fams.length) {
      lines.push("| check | what it reports | findings |", "|---|---|---|");
      for (const [id, f] of fams) lines.push(`| \`${id}\` | ${cell(f.summary)} | ${f.count ?? f.entries?.length ?? 0} |`);
      lines.push("");
    }
    for (const [id, f] of fams) {
      const entries = (f.entries ?? []).filter((e) => e !== undefined);
      if (!entries.length) continue;
      const cols = [...new Set(entries.flatMap((e) => (e && typeof e === "object" && !Array.isArray(e) ? Object.keys(e) : ["value"])))];
      lines.push(`### \`${id}\``, "", `| ${cols.join(" | ")} |`, `|${cols.map(() => "---").join("|")}|`);
      for (const e of entries) {
        const o = e && typeof e === "object" && !Array.isArray(e) ? (e as Record<string, unknown>) : { value: e };
        lines.push(`| ${cols.map((c) => cell(o[c])).join(" | ")} |`);
      }
      lines.push("");
    }
  }
  lines.push("{% endraw %}", "");
  return lines.join("\n");
}

function main(): number {
  const arg = (k: string) => {
    const i = process.argv.indexOf(`--${k}`);
    return i >= 0 ? process.argv[i + 1] : undefined;
  };
  const root = arg("instance-root");
  const docs = arg("docs");
  if (!root || !docs) {
    console.error("usage: ig-qa-page.ts --instance-root <dir> --docs <jekyll source> [--title <title>]");
    return 2;
  }
  const dirs = instanceDirectoriesForGraph(resolve(root), "qa");
  if (!dirs.length) {
    console.log(`${root} declares no qa directory: no QA page`);
    return 0;
  }
  const records = readQaRecords(dirs);
  const assets = join(resolve(docs), QA_ASSETS);
  mkdirSync(assets, { recursive: true });
  for (const r of records) if (!r.unreadable) copyFileSync(r.file, join(assets, basename(r.file)));
  writeFileSync(join(resolve(docs), "qa.md"), renderQaPage(records, arg("title") ?? "Quality checks"));
  const bad = records.filter((r) => r.unreadable);
  console.log(`qa.md: ${records.length - bad.length} record(s) from ${dirs.join(", ")}${bad.length ? `, ${bad.length} UNREADABLE` : ""}`);
  return 0;
}

if (import.meta.main) process.exit(main());
