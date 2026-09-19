#!/usr/bin/env bun
/**
 * One entry point from `uploads/` to `library/<bib-slug>/`.
 *
 * Bean `apui`. Four rungs already existed -- `pdf-structure.py` (embedded
 * outline), `pdf-pages.py` (no outline, page granularity), `pdf-ocr.py` (no
 * usable text layer) and `pdf-tables.py` -- with the choice between them
 * carried in the ingesting agent's head. This makes that choice mechanical and
 * names the rule it applied, so two ingests of the same document agree.
 *
 * ## It chooses; it does not re-implement
 *
 * Every rung stays where it is and keeps its own flags. This probes the PDF,
 * picks one, and runs it. A rung's own behaviour is not duplicated here,
 * because two implementations of "what is a section" is the drift this
 * repository keeps paying for.
 *
 * ## The rule, and where it came from
 *
 * Read off the four entries already in `library/`, not invented:
 *
 *   toc_source: outline                       -> pdf-structure
 *   toc_source: none, text_source: text-layer -> pdf-pages
 *   toc_source: none, text_source: ocr        -> pdf-ocr, then pdf-pages --from-ocr
 *
 * **An inferred chapter tree is refused rather than guessed** -- `6xaz` records
 * two documents where inference was confidently wrong and the output did not
 * show it. So the absence of an outline selects PAGE granularity; it never
 * selects "infer one".
 *
 * ## Third state
 *
 * `--dry-run` reports the chosen rung and the evidence for it, writing nothing.
 * A PDF this cannot probe is reported as `undetermined` and NOT ingested: a
 * document filed under the wrong rung reads as ingested while its structure is
 * wrong, which is the failure mode `6xaz` is about.
 *
 * Usage:
 *   bun run ingest uploads/FILE.pdf
 *   bun run ingest uploads/FILE.pdf --dry-run
 *   bun run ingest uploads/FILE.pdf --refresh-meta   # technical facts only
 *
 * Exit: 0 ingested (or dry-run reported), 1 ingestion failed, 2 could not probe.
 *
 * @module scripts/ingest-document
 */
import { existsSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ARCHIVE_MIMETYPES } from "../schemas/archive-contents.ts";
import { TABULAR_MIMETYPES } from "../schemas/tabular-records.ts";
import { directoryForGraph } from "../schemas/cat-harness.ts";

/**
 * This module's own instance root — where its `harness.json` is.
 *
 * `libraryRoot` defaulted to `resolve(".")`, the CWD, which read as "the
 * instance you are standing in" and was right while the instance and the
 * repository were one directory. After the move (bean `wggr`) the CWD is the
 * REPOSITORY root, which declares nothing, so `directoryForGraph` returned
 * undefined and the ingest refused — correctly, by its own rule, for the wrong
 * reason: "this instance declares no `library` graph" was a true sentence
 * about a directory that is not this instance.
 *
 * Derived from the module's location rather than from the caller's, because
 * this script BELONGS to this instance. A caller who means a different one
 * passes `root`, which is what the parameter is for.
 */
const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Where L1 source content lives, READ from `harness.json` rather than written
 * out. Each rung takes it as `-o`, so the literal would otherwise appear four
 * times in this file alone -- and `check:declared-paths` caught exactly that
 * in the first draft, as it did for the bean store an hour earlier.
 */
export function libraryRoot(root = INSTANCE_ROOT): string {
  const abs = directoryForGraph(root, "library");
  if (!abs) {
    throw new Error(
      "this instance declares no `library` graph in harness.json — " +
        "ingesting into a guessed directory would file the document where nothing scans it",
    );
  }
  return relative(root, abs) || abs;
}

/** Which rung a document needs, and the evidence that chose it. */
export interface Plan {
  rung: "archive" | "tabular" | "pdf-structure" | "pdf-pages" | "pdf-ocr+pdf-pages" | "undetermined";
  why: string;
  /** Commands to run, in order, each as argv. */
  steps: string[][];
}

/**
 * The slug a document lands under — asked of `scripts/_pdf_doc_id.py`, never
 * recomputed here.
 *
 * That module is the ONE definition, and bean `rlp5` is why: three routes to
 * `slugify` existed before it, one of them a 26-line loader that read the
 * function out of another file by path because a copy would drift. A fourth
 * spelling in TypeScript would be exactly that drift, and my first draft of
 * this file was one — it turned `WPR-RDO-2020-003-eng` into
 * `wpr-rdo-2020003-eng`, which is not the slug that document already has.
 */
export function bibSlug(file: string): string {
  const py =
    "import sys, importlib.util as u\n" +
    "spec = u.spec_from_file_location('d', 'scripts/_pdf_doc_id.py')\n" +
    "m = u.module_from_spec(spec); spec.loader.exec_module(m)\n" +
    "print(m.derive_doc_id(sys.argv[1]))\n";
  const r = Bun.spawnSync(["python3", "-c", py, file]);
  const out = new TextDecoder().decode(r.stdout).trim();
  if (r.exitCode !== 0 || !out) {
    throw new Error(
      `cannot determine the doc id for ${file}: scripts/_pdf_doc_id.py did not answer. ` +
        `Guessing one would file the document under a slug nothing else uses.`,
    );
  }
  return out;
}

/** What the PDF itself says: does it carry an outline, and readable text? */
export interface Probe {
  outline: number | null;
  chars: number | null;
  error?: string;
}

/**
 * Ask the PDF directly. Returns nulls rather than guesses when the backend is
 * unavailable -- "could not probe" is a third state, not "no outline".
 */
export function probe(pdf: string): Probe {
  const py = `
import sys, json
try:
    import fitz
except Exception as e:
    print(json.dumps({"error": f"no PDF backend: {e}"})); sys.exit(0)
try:
    d = fitz.open(sys.argv[1])
    chars = sum(len(d[i].get_text()) for i in range(min(len(d), 20)))
    print(json.dumps({"outline": len(d.get_toc()), "chars": chars}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
  const r = Bun.spawnSync(["python3", "-c", py, pdf]);
  try {
    return JSON.parse(new TextDecoder().decode(r.stdout)) as Probe;
  } catch {
    return { outline: null, chars: null, error: "probe produced no JSON" };
  }
}

/**
 * Text below this over the first 20 pages means extraction found nothing worth
 * having and OCR is the rung. 200 is deliberately low: the cost of OCR-ing a
 * readable document is time, the cost of page-splitting an unreadable one is a
 * library entry full of empty sections that still reads as ingested.
 */
export const OCR_THRESHOLD_CHARS = 200;

/**
 * What the file IS, or `null` when nothing could determine it.
 *
 * `_tech_meta.sniff_effective_mimetype`, asked rather than reimplemented —
 * THE SAME call that fills `source.mimetype_sniffed` (bean `nso8`), so the
 * routing decision and the recorded fact cannot disagree. They did for one
 * commit: this called the magic-bytes-only `sniff_mimetype`, so every `.xlsx`
 * routed as `application/zip` to the archive rung while its own `source` block
 * correctly called it a workbook.
 */
export function sniffMimetype(file: string): string | null {
  const py =
    "import sys, json, importlib.util as u\n" +
    "spec = u.spec_from_file_location('t', 'scripts/_tech_meta.py')\n" +
    "m = u.module_from_spec(spec); spec.loader.exec_module(m)\n" +
    "print(json.dumps(m.sniff_effective_mimetype(sys.argv[1])[0]))\n";
  const r = Bun.spawnSync(["python3", "-c", py, file]);
  if (r.exitCode !== 0) return null;
  try {
    return JSON.parse(new TextDecoder().decode(r.stdout)) as string | null;
  } catch {
    return null;
  }
}


/** The delimiter `scripts/tabular-records.py` finds in this file, or `null`. */
export function tabularDelimiter(file: string): string | null {
  const py =
    "import sys, json, importlib.util as u\n" +
    "spec = u.spec_from_file_location('t', 'scripts/tabular-records.py')\n" +
    "m = u.module_from_spec(spec); spec.loader.exec_module(m)\n" +
    "print(json.dumps(m.is_tabular_text(sys.argv[1])))\n";
  const r = Bun.spawnSync(["python3", "-c", py, file]);
  if (r.exitCode !== 0) return null;
  try {
    return JSON.parse(new TextDecoder().decode(r.stdout)) as string | null;
  } catch {
    return null;
  }
}

export function planFor(
  pdf: string,
  p: Probe | undefined = undefined,
  lib: string = libraryRoot(),
  mimetype: string | null | undefined = undefined,
): Plan {
  // CONTENT decides the rung, before anything opens the file as a PDF.
  //
  // Bean `twqe`. Handing this a zip used to answer `undetermined` with
  // `why: "no PDF backend: No module named 'fitz'"` — the refusal was right
  // and the DIAGNOSIS was wrong: it reported a missing tool when the fact was
  // that the file is not a PDF, and a reader would go install PyMuPDF and fail
  // again. The probe opens everything as a PDF, so it could not say otherwise.
  //
  // Sniffed, not by extension, for the reason `nso8` gives: the name is a
  // claim by whoever made the file. A `.pdf` that is really a zip belongs on
  // the archive rung, and this is the only thing that can tell.
  const mime = mimetype === undefined ? sniffMimetype(pdf) : mimetype;

  // A spreadsheet before an archive, because an .xlsx IS a zip and would
  // otherwise be listed as a bag of XML parts rather than read as a workbook.
  // The magic bytes cannot tell them apart — both are genuinely `PK\x03\x04`
  // — so `_tech_meta.sniff_zip_package` asks the CONTAINER, which declares
  // itself via `[Content_Types].xml` or ODF's `mimetype` member. Bean `p67i`;
  // the defect was introduced by `twqe`'s routing and caught before it shipped.
  if (mime !== null && (TABULAR_MIMETYPES as readonly string[]).includes(mime)) {
    return {
      rung: "tabular",
      why: `the package declares ${mime} — a workbook, read for its sheets and headers`,
      steps: [["python3", "scripts/tabular-records.py", "-o", lib, pdf]],
    };
  }

  // A CSV has NO magic bytes, so routing one is not a sniff and must not
  // become an extension guess. `is_tabular_text` asks the only content
  // question there is: do the first rows split into the same number of fields,
  // more than one? Prose, a single column and anything ragged all answer no.
  if (mime === null && tabularDelimiter(pdf) !== null) {
    return {
      rung: "tabular",
      why: "no magic bytes, but the rows split consistently — delimited text",
      steps: [["python3", "scripts/tabular-records.py", "-o", lib, pdf]],
    };
  }

  if (mime !== null && (ARCHIVE_MIMETYPES as readonly string[]).includes(mime)) {
    return {
      rung: "archive",
      why: `sniffed ${mime} — an archive. Its entries are listed as data, not extracted`,
      steps: [["python3", "scripts/archive-contents.py", "-o", lib, pdf]],
    };
  }
  return planForPdf(pdf, p ?? probe(pdf), lib);
}

function planForPdf(pdf: string, p: Probe, lib: string): Plan {
  if (p.error || p.outline === null || p.chars === null) {
    return {
      rung: "undetermined",
      why: p.error ?? "the PDF could not be probed",
      steps: [],
    };
  }
  if (p.outline > 0) {
    return {
      rung: "pdf-structure",
      why: `${p.outline} embedded outline entries — the structure is READ, not inferred`,
      steps: [["python3", "scripts/pdf-structure.py", "-o", lib, pdf]],
    };
  }
  if (p.chars < OCR_THRESHOLD_CHARS) {
    return {
      rung: "pdf-ocr+pdf-pages",
      why:
        `no outline, and ${p.chars} characters over the first pages ` +
        `(< ${OCR_THRESHOLD_CHARS}) — there is no usable text layer`,
      steps: [
        ["python3", "scripts/pdf-ocr.py", "-o", lib, pdf],
        ["python3", "scripts/pdf-pages.py", "-o", lib, "--from-ocr", pdf],
      ],
    };
  }
  return {
    rung: "pdf-pages",
    why:
      `no outline, ${p.chars} characters of text layer — PAGE granularity. ` +
      `A chapter tree is NOT inferred (bean 6xaz)`,
    steps: [["python3", "scripts/pdf-pages.py", "-o", lib, pdf]],
  };
}

/**
 * Recompute `source` on an entry that already exists, from the upload.
 *
 * Bean `nso8` says the technical facts must be "produced by the ingest path
 * rather than backfilled", which is why this lives HERE rather than in a
 * migration script: it is the same entry point calling the same
 * `scripts/_tech_meta.py` the rungs call, applied to a document ingested
 * before those fields existed. A separate backfiller would be a second
 * implementation of the one thing `_tech_meta.py` exists to keep single.
 *
 * It needs no PDF backend — every field is computed from the file's bytes —
 * so it works where a full re-ingest cannot. It **merges**, never replaces:
 * `pages`, `text_source` and `extractor` are the rung's knowledge and this
 * has no way to recompute them.
 */
export function refreshMeta(pdf: string, libRoot = libraryRoot()): string {
  const slug = bibSlug(pdf);
  const structure = join(resolve(libRoot), slug, "structure.json");
  if (!existsSync(structure)) throw new Error(`${structure}: no such entry to refresh`);
  // The indent is READ OFF the file, never chosen here. `pdf-structure.py`
  // writes `indent=1` and `pdf-pages.py` writes `indent=2`, so a refresh that
  // picked either would reformat every entry the other rung authored: adding
  // three fields to `9789241548960-eng` re-wrote 4 349 lines, which buries the
  // change it was making and fights every later diff. A metadata refresh is
  // not a licence to reformat a file it did not write.
  const py =
    "import sys, json, importlib.util as u\n" +
    "spec = u.spec_from_file_location('t', 'scripts/_tech_meta.py')\n" +
    "m = u.module_from_spec(spec); spec.loader.exec_module(m)\n" +
    "p = sys.argv[2]\n" +
    "raw = open(p).read()\n" +
    "lines = raw.split('\\n')\n" +
    "ind = next((len(l) - len(l.lstrip(' ')) for l in lines[1:] if l.startswith(' ')), 2)\n" +
    "d = json.loads(raw)\n" +
    "d['source'] = {**d.get('source', {}), **m.tech_meta(sys.argv[1])}\n" +
    "open(p, 'w').write(json.dumps(d, indent=ind) + ('\\n' if raw.endswith('\\n') else ''))\n" +
    "print(d['source']['mimetype_source'])\n";
  const r = Bun.spawnSync(["python3", "-c", py, pdf, structure]);
  if (r.exitCode !== 0) {
    throw new Error(`refreshing ${slug}: ${new TextDecoder().decode(r.stderr).trim()}`);
  }
  return `${slug}: ${new TextDecoder().decode(r.stdout).trim()}`;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry-run");
  const pdf = argv.find((a) => !a.startsWith("--"));
  if (!pdf) {
    console.error("usage: bun run ingest <uploads/FILE.pdf> [--dry-run]");
    process.exit(1);
  }
  if (!existsSync(pdf)) {
    console.error(`${pdf}: not there`);
    process.exit(1);
  }
  if (argv.includes("--refresh-meta")) {
    console.log(refreshMeta(pdf));
    process.exit(0);
  }
  const plan = planFor(pdf);
  const slug = bibSlug(pdf);
  console.log(`${basename(pdf)} -> ${libraryRoot()}/${slug}/`);
  console.log(`  rung: ${plan.rung}`);
  console.log(`  why:  ${plan.why}`);
  if (plan.rung === "undetermined") {
    console.error("\nNOT ingested. This is not a pass — a document filed under");
    console.error("the wrong rung reads as ingested while its structure is wrong.");
    process.exit(2);
  }
  if (dry) {
    for (const s of plan.steps) console.log(`  would run: ${s.join(" ")}`);
    process.exit(0);
  }
  for (const s of plan.steps) {
    console.log(`\n$ ${s.join(" ")}`);
    const r = Bun.spawnSync(s, { stdout: "inherit", stderr: "inherit" });
    if (r.exitCode !== 0) {
      console.error(`\n${s[1]} failed (exit ${r.exitCode}) — stopping.`);
      process.exit(1);
    }
  }
  const out = join(resolve(libraryRoot()), slug);
  console.log(`\n${existsSync(out) ? "✓" : "✗"} ${libraryRoot()}/${slug}/`);
  console.log(`Next: bun run check:l1-complete ${libraryRoot()}/${slug}`);
}
