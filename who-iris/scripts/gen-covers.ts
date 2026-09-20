#!/usr/bin/env bun
/**
 * Render a cover thumbnail for every item whose PDF this repository holds.
 *
 * @module who-iris/scripts/gen-covers
 *
 * Owner, 2026-09-20: *"do the needed things like extract cover avatar igf
 * neeeded"* — the IRIS home page shows a cover beside each recent submission,
 * and a replica of it without covers is a layout rather than a replica.
 *
 * ## What is generated here is OURS, and the node has to say so
 *
 * DSpace generates a `THUMBNAIL` bundle of its own. **These are not those.**
 * `iris.who.int` is egress-blocked from this environment, so nothing upstream
 * was fetched; each cover is page 1 of a PDF we already hold, rasterised by
 * `cat-harness/scripts/pdf-cover.py`. A node recording one of these without
 * recording the derivation would assert that this repository holds a
 * bitstream IRIS produced, which is false — so this script REFUSES to write a
 * cover for a node whose THUMBNAIL bitstream does not declare it (see
 * `derivedNote` below).
 *
 * That is R8 pointed the other way. R8 says never infer metadata from the PDF
 * when a record exists; this says never let something derived from the PDF
 * pass as something the record supplied.
 *
 * ## The split with the Python
 *
 * `pdf-cover.py` is generic and decides nothing: a page raster is a PDF fact,
 * not a WHO one. This file decides which documents get a cover, where the
 * bytes land, and what the catalogue must say about them. Same split as
 * `pdf-structure.py` / `gen-library-jsonld.ts`.
 *
 * ## `--check` is the thing `yl5w` says is missing
 *
 * Bean `yl5w`: three `materialized` claims in this catalogue resolve to no
 * bytes, and `check:catalogue` does not look. It still does not — that is
 * `yl5w`'s to fix for the whole catalogue. What this adds is the narrow case
 * it is responsible for: every THUMBNAIL bitstream it would write is verified
 * to exist, to match byte for byte, and to match its recorded `sha256` and
 * pixel dimensions. A claim this script makes is a claim this script checks.
 *
 * Usage:
 *   bun run who-iris/scripts/gen-covers.ts
 *   bun run who-iris/scripts/gen-covers.ts --check
 */
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { dirname, join, relative } from "path";

import type { CatalogueNode } from "../../folio-assistant-core/schemas/catalogue.js";
import { bytesFor, INSTANCE, REPO } from "./lib/bytes.js";

const NODES = join(INSTANCE, "catalogue", "nodes");
const RENDERER = join(REPO, "cat-harness", "scripts", "pdf-cover.py");

/** The listing width. One number, because every cover shares a column. */
export const COVER_WIDTH = 300;

/**
 * What a THUMBNAIL bitstream must say about itself before its bytes are written.
 *
 * Checked as a SUBSTRING of the node's own note rather than generated into it,
 * because the note is authored content — a person writing the catalogue says
 * what this file is, and this script refuses to supply bytes for a claim
 * nobody made. Generating the sentence would make the check circular.
 */
export const DERIVED_MARKER = "rendered here from page 1";

type Cover = {
  node: CatalogueNode;
  /** The ORIGINAL bitstream the cover is rendered from. */
  sourcePdf: string;
  /** The declared THUMBNAIL bitstream, instance-relative. */
  outPath: string;
  declaredSha: string | undefined;
  declaredW: number | undefined;
  declaredH: number | undefined;
};

function nodes(): CatalogueNode[] {
  return readdirSync(NODES)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(NODES, f), "utf-8"));
      for (const k of Object.keys(raw)) if (k.startsWith("_")) delete raw[k];
      return raw as CatalogueNode;
    })
    .sort((a, b) => a.id.localeCompare(b.id, "en"));
}

/**
 * The covers the catalogue ASKS for — never the ones this script could make.
 *
 * Driven off the declared THUMBNAIL bitstream, so adding a cover is a
 * catalogue edit and this script only supplies bytes. The alternative —
 * rendering a cover for every item with a PDF — would quietly add files to the
 * repository that nobody asked for, and `deletion-requires-confirmation`'s
 * mirror image is that creation should be asked for too.
 */
export function coversWanted(all: CatalogueNode[]): { covers: Cover[]; problems: string[] } {
  const covers: Cover[] = [];
  const problems: string[] = [];

  for (const n of all) {
    const thumb = n.bitstreams?.find((b) => b.bundle === "THUMBNAIL");
    if (!thumb) continue;

    const lp = thumb.materialization?.localPath;
    if (!lp) {
      problems.push(`${n.id}: THUMBNAIL "${thumb.name}" has no localPath — bytes that are here are somewhere`);
      continue;
    }
    if (!(thumb.materialization?.note ?? "").includes(DERIVED_MARKER)) {
      problems.push(
        `${n.id}: THUMBNAIL "${thumb.name}" does not declare itself derived. ` +
          `Its materialization.note must contain "${DERIVED_MARKER}" — DSpace generates its own ` +
          `THUMBNAIL bundle and a cover we rasterised must not read as one IRIS supplied.`,
      );
      continue;
    }

    const orig = n.bitstreams?.find((b) => b.bundle !== "THUMBNAIL" && b.mediaType === "application/pdf");
    if (!orig) {
      problems.push(`${n.id}: a THUMBNAIL is declared but no ORIGINAL PDF bitstream is — nothing to render from`);
      continue;
    }
    const pdf = bytesFor(orig.materialization?.localPath, orig.name);
    if (!pdf) {
      problems.push(`${n.id}: the ORIGINAL "${orig.name}" resolves to no bytes — see bean yl5w`);
      continue;
    }

    covers.push({
      node: n,
      sourcePdf: pdf,
      outPath: lp,
      declaredSha: thumb.materialization?.fixity?.digest,
      declaredW: thumb.pixelWidth,
      declaredH: thumb.pixelHeight,
    });
  }
  return { covers, problems };
}

/** One render, through the generic script. Its JSON is the provenance. */
function render(c: Cover): { png: Buffer; facts: Record<string, unknown> } {
  const tmp = join(REPO, "node_modules", ".cache", "who-iris-covers", `${createHash("sha256").update(c.outPath).digest("hex").slice(0, 16)}.png`);
  mkdirSync(dirname(tmp), { recursive: true });
  const r = Bun.spawnSync([
    "python3", RENDERER, c.sourcePdf, "-o", tmp, "--width", String(COVER_WIDTH), "--json",
  ]);
  if (r.exitCode !== 0) {
    throw new Error(
      `pdf-cover.py failed for ${c.node.id}: ${new TextDecoder().decode(r.stderr).trim() || "no stderr"}`,
    );
  }
  const facts = JSON.parse(new TextDecoder().decode(r.stdout)) as Record<string, unknown>;
  return { png: Buffer.from(readFileSync(tmp)), facts };
}

function main(): number {
  const check = process.argv.includes("--check");
  const all = nodes();
  const { covers, problems } = coversWanted(all);

  if (covers.length === 0 && problems.length === 0) {
    console.log("gen-covers: no THUMBNAIL bitstreams declared — nothing to render.");
    return 0;
  }

  let wrote = 0;
  let stale = 0;
  for (const c of covers) {
    const { png, facts } = render(c);
    const sha = createHash("sha256").update(png).digest("hex");
    const abs = join(INSTANCE, c.outPath);

    // The claims the node makes about these bytes, checked against the bytes.
    if (c.declaredSha && c.declaredSha !== sha) {
      problems.push(`${c.node.id}: declared sha256 ${c.declaredSha.slice(0, 12)}… but the render is ${sha.slice(0, 12)}…`);
    }
    if (c.declaredW !== facts.pixelWidth || c.declaredH !== facts.pixelHeight) {
      problems.push(
        `${c.node.id}: declares ${c.declaredW}x${c.declaredH} but the render is ${facts.pixelWidth}x${facts.pixelHeight}`,
      );
    }

    const prev = existsSync(abs) ? readFileSync(abs) : undefined;
    if (prev && prev.equals(png)) continue;
    if (check) {
      console.error(`${prev ? "stale" : "missing"}: ${relative(REPO, abs)}`);
      stale++;
      continue;
    }
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, png);
    wrote++;
    console.log(
      `  ${relative(REPO, abs)}  ${facts.pixelWidth}x${facts.pixelHeight}  ${facts.bytes} bytes  sha256 ${sha.slice(0, 12)}…`,
    );
  }

  if (problems.length) {
    console.error(`\n✗ ${problems.length} problem(s):`);
    for (const p of problems) console.error(`    ${p}`);
    return 1;
  }
  if (check) {
    if (stale) {
      console.error(`\n${stale} cover(s) stale or missing. Run: bun run who-iris/scripts/gen-covers.ts`);
      return 1;
    }
    console.log(`gen-covers --check: ${covers.length} cover(s) up to date, digests and dimensions match.`);
    return 0;
  }
  console.log(`\n${wrote} written, ${covers.length - wrote} already current.`);
  return 0;
}

if (import.meta.main) process.exit(main());

export { nodes };
