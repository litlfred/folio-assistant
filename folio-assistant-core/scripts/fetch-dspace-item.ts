#!/usr/bin/env bun
/**
 * Fetch one item from a DSpace 7 repository — WHO IRIS, PAHO IRIS — into an
 * `uploads/<doc_id>/` directory that `bun run ingest` takes as it stands.
 *
 * Bean `5uyl`: building a DAK's library ingests the L1 sources its Component 1
 * cites, and most of those are IRIS handles. Acquisition was manual — download
 * the PDF, hand-write an `intake.json`, transcribe the licence — so a DAK with
 * ten cited sources was ten chances to file one under the wrong licence.
 *
 * ## What it writes, and what it reuses
 *
 *   - the item's ORIGINAL PDF bitstream, under its repository filename;
 *   - `<doc_id>.dc.json`: the item's metadata as a `folio-dublin-core/v1`
 *     record ({@link DublinCoreRecordSchema}) — qualified, repeated and
 *     language-tagged exactly as DSpace returns it, never flattened;
 *   - `intake.json` ({@link IntakeSchema}) naming the record through `record`,
 *     with the licence carried from the record's `dc.rights` / `dc.rights.uri`.
 *
 * The licence is STATED only when the repository states it, and its basis
 * quotes the field. This is the item metadata, not text read out of the PDF,
 * so it is what the early licence step (`ingest-document.ts`, bean `7bg9`)
 * may act on. A licence string this does not recognise is recorded as
 * `unknown`, with where it looked — never guessed.
 *
 * DSpace 7's REST API is the platform's, not WHO's, which is why this lives
 * in the content layer: `handleIri` / `handleFromUrl` from the catalogue
 * schema already parse its handles.
 *
 *   bun run folio-assistant-core/scripts/fetch-dspace-item.ts https://iris.who.int/handle/10665/340749 --out uploads
 *   bun run folio-assistant-core/scripts/fetch-dspace-item.ts <handle-url> --out <dir> --dry-run
 *
 * Exit: 0 fetched (or reported), 1 the item has no PDF or the repository refused, 2 usage.
 *
 * @module folio-assistant-core/scripts/fetch-dspace-item
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { IntakeSchema, type Intake } from "../../cat-harness/schemas/intake.ts";
import type { SourceLicence } from "../../cat-harness/schemas/source-licence.ts";
import { handleFromUrl } from "../schemas/catalogue.ts";
import { DUBLIN_CORE_SCHEMA_TAG, DublinCoreRecordSchema, type DcField, type DublinCoreRecord } from "../schemas/dublin-core.ts";

/** DSpace 7's `metadata` map: `"dc.title": [{ value, language, authority }]`. */
type DspaceMetadata = Record<string, { value: string; language?: string | null; authority?: string | null }[]>;

/**
 * DSpace metadata → a Dublin Core record. Every field and every value is
 * kept, in order; an empty language or authority is absent, not "".
 */
export function dspaceToRecord(uuid: string, metadata: DspaceMetadata, source: string, retrievedAt: string): DublinCoreRecord {
  const fields: DcField[] = [];
  for (const [name, values] of Object.entries(metadata)) {
    const [schema, element, ...rest] = name.split(".");
    const kept = values.filter((v) => v.value?.trim());
    if (!schema || !element || kept.length === 0) continue;
    fields.push({
      schema,
      element,
      ...(rest.length ? { qualifier: rest.join(".") } : {}),
      values: kept.map((v) => ({
        value: v.value,
        ...(v.language ? { language: v.language } : {}),
        ...(v.authority ? { authority: v.authority } : {}),
      })),
    });
  }
  return DublinCoreRecordSchema.parse({
    $schema: DUBLIN_CORE_SCHEMA_TAG,
    id: uuid,
    fields,
    provenance: { source, retrievedAt, method: "DSpace 7 REST API, GET /server/api/core/items/{uuid}" },
  });
}

/**
 * Licence spellings this recognises, keyed by what IRIS writes. A string not
 * here is NOT mapped by similarity: `CC BY-NC-SA 3.0 IGO` and `CC BY-NC-SA 3.0`
 * are different licences, and a near-match is how one gets filed as the other.
 */
const LICENCES: Record<string, string> = {
  "CC BY-NC-SA 3.0 IGO": "CC-BY-NC-SA-3.0-IGO",
  "CC BY 3.0 IGO": "CC-BY-3.0-IGO",
  "CC BY-NC-SA 4.0": "CC-BY-NC-SA-4.0",
  "CC BY 4.0": "CC-BY-4.0",
};

export function licenceFromRecord(rec: DublinCoreRecord, itemUrl: string): SourceLicence {
  const values = (element: string, qualifier?: string) =>
    rec.fields.filter((f) => f.element === element && f.qualifier === qualifier).flatMap((f) => f.values.map((v) => v.value));
  const rights = values("rights");
  const uri = values("rights", "uri");
  const known = rights.map((r) => LICENCES[r.trim()]).filter(Boolean);
  if (known.length === 1) {
    return {
      status: "stated",
      id: known[0]!,
      basis: `${itemUrl} item metadata: dc.rights = '${rights.join("; ")}'${uri.length ? `, dc.rights.uri = '${uri.join("; ")}'` : ""}`,
    };
  }
  return {
    status: "unknown",
    searched: [
      {
        where: `${itemUrl} item metadata, dc.rights and dc.rights.uri`,
        result: rights.length ? `'${rights.join("; ")}' — not a licence this recognises; a person reads it and records it` : "no dc.rights field",
      },
    ],
  };
}

interface Fetched {
  docId: string;
  pdf: Buffer;
  pdfName: string;
  record: DublinCoreRecord;
  intake: Intake;
}

async function json(url: string): Promise<any> {
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

/** Resolve a handle URL to the item, its metadata and its one ORIGINAL PDF. */
export async function fetchItem(handleUrl: string, now = new Date()): Promise<Fetched> {
  const handle = handleFromUrl(handleUrl);
  if (!handle) throw new Error(`${handleUrl} is not a handle URL (…/handle/<prefix>/<suffix>)`);
  const origin = new URL(handleUrl).origin;
  // The handle page redirects to /items/<uuid>; the API has no handle lookup on every install.
  const redirect = await fetch(`${origin}/handle/${handle}`, { redirect: "manual" });
  const uuid = /\/items\/([0-9a-f-]{36})/.exec(redirect.headers.get("location") ?? "")?.[1];
  if (!uuid) throw new Error(`${origin}/handle/${handle} did not redirect to an item (HTTP ${redirect.status})`);
  const api = `${origin}/server/api/core/items/${uuid}`;
  const item = await json(api);
  const retrievedAt = now.toISOString().replace(/\.\d+Z$/, "Z");
  const record = dspaceToRecord(uuid, item.metadata, api, retrievedAt);

  const bundles = await json(`${api}/bundles`);
  const original = bundles._embedded.bundles.find((b: { name: string }) => b.name === "ORIGINAL");
  if (!original) throw new Error(`${api}: no ORIGINAL bundle`);
  const streams = (await json(original._links.bitstreams.href))._embedded.bitstreams as { name: string; _links: { content: { href: string } } }[];
  const pdfs = streams.filter((s) => /\.pdf$/i.test(s.name));
  // More than one PDF is a choice (language editions, annexes) and is refused, not guessed.
  if (pdfs.length !== 1) throw new Error(`${api}: ${pdfs.length} PDF bitstreams (${streams.map((s) => s.name).join(", ")}) — name the one to ingest`);
  const res = await fetch(pdfs[0]!._links.content.href);
  if (!res.ok) throw new Error(`${pdfs[0]!._links.content.href}: HTTP ${res.status}`);
  const pdf = Buffer.from(await res.arrayBuffer());
  const pdfName = pdfs[0]!.name;
  const docId = pdfName.replace(/\.pdf$/i, "");
  const itemUrl = `${origin}/items/${uuid}`;
  const intake = IntakeSchema.parse({
    $schema: "folio-intake/v1",
    doc_id: docId,
    record: `${docId}.dc.json`,
    _comment: `Fetched from ${handleUrl} by folio-assistant-core/scripts/fetch-dspace-item.ts.`,
    source: { upstream: itemUrl, capturedAt: retrievedAt, capturedBy: "fetch-dspace-item.ts (DSpace 7 REST API)" },
    files: [
      {
        path: pdfName,
        bytes: pdf.length,
        sha256: createHash("sha256").update(pdf).digest("hex"),
        type: "publication",
        role: "original-bitstream",
      },
    ],
    licence: licenceFromRecord(record, itemUrl),
  });
  return { docId, pdf, pdfName, record, intake };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const outAt = args.indexOf("--out");
  const url = args.find((a, i) => !a.startsWith("--") && i !== outAt + 1);
  if (!url || outAt < 0 || !args[outAt + 1]) {
    console.error("usage: fetch-dspace-item.ts <handle URL> --out <uploads dir> [--dry-run]");
    process.exit(2);
  }
  try {
    const f = await fetchItem(url);
    const dir = join(args[outAt + 1]!, f.docId);
    console.log(`${url} -> ${dir}/${f.pdfName} (${f.pdf.length} bytes)`);
    console.log(`  licence: ${f.intake.licence?.status} ${f.intake.licence?.id ?? ""}`);
    if (args.includes("--dry-run")) process.exit(0);
    if (existsSync(join(dir, "intake.json"))) {
      console.error(`  ${dir}/intake.json exists — not overwritten (an intake may carry a person's corrections)`);
      process.exit(1);
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, f.pdfName), f.pdf);
    writeFileSync(join(dir, `${f.docId}.dc.json`), `${JSON.stringify(f.record, null, 2)}\n`);
    writeFileSync(join(dir, "intake.json"), `${JSON.stringify(f.intake, null, 2)}\n`);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
  }
}
