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
 *   bun run ingest uploads/FILE.pdf --library who-iris
 *
 * `--library` is required only when the repository declares more than one, and
 * then it is REQUIRED rather than defaulted: since bean `frs5` there are two,
 * and a WHO publication filed into the science library reads as ingested while
 * sitting in the wrong corpus.
 *
 * Exit: 0 ingested (or dry-run reported), 1 ingestion failed, 2 could not probe.
 *
 * @module scripts/ingest-document
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ARCHIVE_MIMETYPES } from "../schemas/archive-contents.ts";
import { checkEntry, type Requirement } from "./check-l1-complete.ts";
import { TABULAR_MIMETYPES } from "../schemas/tabular-records.ts";
import { directoriesForGraph } from "../schemas/cat-harness.ts";

/**
 * This module's own instance root — where its `harness.json` is.
 *
 * `libraryRoot` defaulted to `resolve(".")`, the CWD, which read as "the
 * instance you are standing in" and was right while the instance and the
 * repository were one directory. After the move (bean `wggr`) the CWD is the
 * REPOSITORY root, which declares nothing, so `directoriesForGraph` returned
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
 * A python helper beside this module, as an ABSOLUTE path.
 *
 * Three call sites spelled `'scripts/<name>.py'` relative to the CWD inside a
 * python source string, which is the least visible place a path can hide: not
 * TypeScript, not YAML, not a config file, and unreachable by every scan here.
 * Each failed SILENTLY — the import raised, python exited non-zero, and the
 * caller's `exitCode !== 0` guard turned that into `null` or `undetermined`,
 * which reads as "this file could not be identified" rather than "the helper
 * is missing".
 *
 * One function so the next relocation is one line, and so that a reader
 * grepping for `.py` finds the resolution rather than three copies of it.
 *
 * **It did not reach the RUNG TABLE, and that is how this recurred.** Seven
 * more call sites spelled `"scripts/<name>.py"` inside the `steps` arrays
 * below — every rung that actually ingests a document — so the helper existed,
 * the comment above said the problem was solved, and `bun run ingest` could
 * not ingest anything. Fixed 2026-09-20, when ingesting the agent-skill
 * corpus hit it on the first real document.
 *
 * These seven failed LOUDLY (`can't open file`, exit 2, "stopping"), unlike
 * the three above, so nothing was mis-filed. That is luck, not design: the
 * `steps` runner checks the exit code, and the helpers it invokes are the ones
 * whose absence the three silent call sites were taught to report honestly.
 */
function pyHelper(name: string): string {
  return join(dirname(fileURLToPath(import.meta.url)), name);
}

/**
 * Where L1 source content lives, READ from `harness.json` rather than written
 * out. Each rung takes it as `-o`, so the literal would otherwise appear four
 * times in this file alone -- and `check:declared-paths` caught exactly that
 * in the first draft, as it did for the bean store an hour earlier.
 */
export function libraryRoot(root = INSTANCE_ROOT, choice?: string): string {
  // A WRITE target, and the one place picking the first was never defensible:
  // with several declared libraries the first is not an answer to "where does
  // this document go", it is a coin toss that files it somewhere plausible.
  //
  // THREE states, and the middle one arrived with bean `frs5`, which moved the
  // corpus into `who-iris/` and `folio-assistant-sci/`:
  //
  //   none declared   -> throw: ingesting into a guessed directory files the
  //                     document where nothing scans it
  //   exactly one     -> that one, and `--library` is not needed
  //   several         -> the CALLER must say, by name. Not a default, not the
  //                     first: a WHO publication landing in the science
  //                     library reads as ingested and is in the wrong corpus,
  //                     and nothing downstream can tell.
  const declared = directoriesForGraph(root, "library");
  if (declared.length === 0) {
    throw new Error(
      "this instance declares no `library` graph in its `<name>.json` — " +
        "ingesting into a guessed directory would file the document where nothing scans it",
    );
  }

  const named = (abs: string): string => relative(root, abs) || abs;

  if (declared.length === 1) return named(declared[0]!);

  if (choice === undefined) {
    throw new Error(
      `this repository declares ${declared.length} libraries, so the destination must be said ` +
        `rather than guessed. Pass --library <name>, one of: ` +
        declared.map((d) => named(d)).join(", "),
    );
  }

  // Matched EXACTLY, on either spelling a caller would reasonably use: the
  // relative path the declaration resolves to (`../who-iris/library`) or the
  // instance directory holding it (`who-iris`). Both work and neither is a
  // second vocabulary to learn.
  //
  // IT WAS A SUBSTRING MATCH, and that is a guess wearing the clothes of a
  // match. Measured 2026-09-20: `--library c` matched exactly one declared
  // library — `../folio-assistant-sci/library` is the only one containing a `c`
  // — so a one-character typo filed a document into the science corpus and
  // printed success. In the one function whose stated job is refusing to
  // guess a write target, and directly under a comment saying ambiguity
  // refuses "the whole point of this function": the ambiguity check was real
  // and what fed it was not.
  //
  // A loose match cannot be rescued by the ambiguity guard, because the
  // failure is a UNIQUE wrong hit. Exactness is the only form where "matches
  // one" means what it reads as.
  const instanceOf = (d: string): string => {
    const rel = named(d);
    const parts = rel.split("/").filter((p) => p.length > 0 && p !== "..");
    // `../who-iris/library` -> `who-iris`; a bare `library` is this instance's.
    return parts.length > 1 ? parts[parts.length - 2]! : ".";
  };
  const hits = declared.filter((d) => named(d) === choice || instanceOf(d) === choice);
  if (hits.length === 1) return named(hits[0]!);
  throw new Error(
    hits.length === 0
      ? `--library ${choice} matches none of: ${declared.map((d) => named(d)).join(", ")}`
      : `--library ${choice} is ambiguous between: ${hits.map((d) => named(d)).join(", ")}`,
  );
}

/** `--library <name>` from argv, or undefined. */
export function libraryChoice(argv: string[]): string | undefined {
  const i = argv.indexOf("--library");
  return i >= 0 ? argv[i + 1] : undefined;
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
    `spec = u.spec_from_file_location('d', ${JSON.stringify(pyHelper("_pdf_doc_id.py"))})\n` +
    "m = u.module_from_spec(spec); spec.loader.exec_module(m)\n" +
    // `derive_doc_id_from_pdf`, NOT `derive_doc_id`. The latter takes the
    // extracted front matter as an argument and this call site has none, so it
    // fell through to the basename slug for every arXiv paper while
    // `pdf-structure.py` — which DOES have the front matter — named the same
    // file `arxiv-<id>v<n>`. The two then disagreed about which directory the
    // document was in, and `--promote` reported the entry incomplete rather
    // than missing.
    "print(m.derive_doc_id_from_pdf(sys.argv[1]))\n";
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
  /** Raw entry count. Kept because "there is an outline, and it is junk" is
   *  a different fact from "there is no outline", and the reader needs both. */
  outline: number | null;
  /**
   * Entries that could actually carry a chapter tree. `undefined` on a probe
   * from before this field existed, which callers read as "unknown", never 0.
   *
   * Bean `8shg`. A raw count routes on the wrong question. `milnorlink.pdf`
   * carries 35 entries and NONE of them is a heading: 19 are bare page labels
   * (`p. 177`, `p. 178`, …) and 16 have no resolvable destination, because
   * the outline is JSTOR's journal wrapper — this article's pages, then
   * thirteen OTHER articles from the same issue that are not in the file.
   * Routing on `> 0` sent it to `pdf-structure`, which would have produced a
   * section tree of page numbers plus thirteen phantom chapters.
   */
  outlineUsable?: number | null;
  chars: number | null;
  error?: string;
}

/**
 * Is an outline entry capable of being a chapter?
 *
 * Two disqualifiers, both measured on the corpus rather than imagined:
 * no resolvable destination (PyMuPDF reports page `-1`), and a title that is
 * only a page reference. Neither names a division of the document.
 */
export function usableOutlineEntries(
  entries: readonly { title: string; page: number }[],
): number {
  return entries.filter(
    (e) => e.page >= 1 && !/^pp?\.?\s*\d+$/i.test(e.title.trim()),
  ).length;
}

/**
 * Ask the PDF directly. Returns nulls rather than guesses when the backend is
 * unavailable -- "could not probe" is a third state, not "no outline".
 */
export function probe(pdf: string): Probe {
  // `pymupdf`, NOT `fitz`. The legacy alias still imports, and that is the
  // trap: it prints a deprecation warning TO STDOUT before anything else, so
  // the JSON parse below saw `warning: The \`fitz\` API is deprecated…` and
  // reported "probe produced no JSON". Invisible until the backend is
  // installed — with nothing installed, `fitz` simply failed to import and
  // the honest "no PDF backend" masked it. `pdf-pages.py` and
  // `pdf-structure.py` already used the canonical name; this was the holdout.
  const py = `
import sys, json
try:
    import pymupdf
except Exception as e:
    print(json.dumps({"error": f"no PDF backend: {e}"})); sys.exit(0)
try:
    d = pymupdf.open(sys.argv[1])
    chars = sum(len(d[i].get_text()) for i in range(min(len(d), 20)))
    toc = d.get_toc()
    # Facts only. Whether an entry can carry a chapter is decided ONCE, by
    # usableOutlineEntries() above, rather than restated here: a rule spelled
    # in two languages is two rules, and this one had already diverged.
    # The Python copy lived in a JS template literal, where a regex
    # metacharacter escape is an INVALID string escape and JS drops the
    # backslash. Python therefore received a pattern that matched nothing,
    # and 35 entries of journal furniture were reported as 19 usable
    # chapters -- silent, and wrong in the unsafe direction. Bean 8shg.
    # (This comment is escape-free on purpose: the first draft of it
    # contained the very sequences it describes, and broke the parse.)
    print(json.dumps({
        "outline": len(toc),
        "toc": [[t[1], t[2]] for t in toc],
        "chars": chars,
    }))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
  const r = Bun.spawnSync(["python3", "-c", py, pdf]);
  const raw = parseProbe(new TextDecoder().decode(r.stdout)) as Probe & {
    toc?: [string, number][];
  };
  if (raw.toc === undefined) return raw;
  const { toc, ...rest } = raw;
  return {
    ...rest,
    outlineUsable: usableOutlineEntries(toc.map(([title, page]) => ({ title, page }))),
  };
}

/**
 * The probe's answer, read out of stdout that may not be only JSON.
 *
 * Takes the LAST line that parses, because a library is free to print to
 * stdout before the payload and one did: PyMuPDF's `fitz` alias emits a
 * deprecation warning there, which turned a working probe into
 * "probe produced no JSON". Parsing the whole stream assumes the tool is the
 * only thing writing to it, and that assumption is not ours to make.
 *
 * Still a third state when nothing parses — an unparseable probe is
 * `undetermined`, never "no outline".
 */
export function parseProbe(stdout: string): Probe {
  const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]) as Probe;
    } catch {
      // keep walking back
    }
  }
  return { outline: null, chars: null, error: "probe produced no JSON" };
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
  // ABSOLUTE, from this module's own location. It was `'scripts/_tech_meta.py'`
  // — a relative path inside a PYTHON SOURCE STRING inside a TypeScript file,
  // resolved against the CWD, and invisible to every path scan this repository
  // has. The move (bean `wggr`) put the helper under `cat-harness/scripts/`.
  //
  // It failed SILENTLY, which is the part worth fixing beyond the path: the
  // import raised, python exited non-zero, and the `exitCode !== 0` guard below
  // returned `null` — "nothing could determine what this file is". So every
  // `.xlsx` would have routed to the ARCHIVE rung and been listed as a bag of
  // XML parts, which is precisely the defect bean `twqe` records and this
  // function was written to fix.
  const helper = pyHelper("_tech_meta.py");
  const py =
    "import sys, json, importlib.util as u\n" +
    `spec = u.spec_from_file_location('t', ${JSON.stringify(helper)})\n` +
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
    `spec = u.spec_from_file_location('t', ${JSON.stringify(pyHelper("tabular-records.py"))})\n` +
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
      steps: [["python3", pyHelper("tabular-records.py"), "-o", lib, pdf]],
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
      steps: [["python3", pyHelper("tabular-records.py"), "-o", lib, pdf]],
    };
  }

  if (mime !== null && (ARCHIVE_MIMETYPES as readonly string[]).includes(mime)) {
    return {
      rung: "archive",
      why: `sniffed ${mime} — an archive. Its entries are listed as data, not extracted`,
      steps: [["python3", pyHelper("archive-contents.py"), "-o", lib, pdf]],
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
  // An outline was found but we cannot tell whether any of it is usable: a
  // probe predating `outlineUsable` returns it absent, and absent is UNKNOWN.
  // Routing on the raw count here would reinstate exactly the bug below;
  // calling it "no outline" would be a different lie. So: third state.
  if (p.outline > 0 && (p.outlineUsable === undefined || p.outlineUsable === null)) {
    return {
      rung: "undetermined",
      why:
        `${p.outline} outline entries, but how many can carry a chapter is unknown ` +
        `(this probe did not report it). Re-probe rather than guess a rung`,
      steps: [],
    };
  }
  if ((p.outlineUsable ?? 0) > 0) {
    return {
      rung: "pdf-structure",
      why:
        `${p.outlineUsable} of ${p.outline} embedded outline entries can carry a ` +
        `chapter — the structure is READ, not inferred`,
      steps: [["python3", pyHelper("pdf-structure.py"), "-o", lib, pdf]],
    };
  }
  // The case bean `8shg` exists for. An outline is PRESENT and carries nothing
  // usable, which is not the same as absent and must not be reported as it:
  // `milnorlink.pdf` has 35 entries of JSTOR journal furniture. Falls through
  // to the text-layer rungs, and says why so the next reader does not re-open
  // this as "the outline was ignored" — which is how this bean was opened.
  const junkOutline =
    p.outline > 0
      ? `an outline of ${p.outline} entries, none of which can carry a chapter ` +
        `(page labels and entries with no destination) — present, but not a structure. `
      : "";
  if (p.chars < OCR_THRESHOLD_CHARS) {
    return {
      rung: "pdf-ocr+pdf-pages",
      why:
        `${junkOutline || "no outline, and "}${p.chars} characters over the first pages ` +
        `(< ${OCR_THRESHOLD_CHARS}) — there is no usable text layer`,
      steps: [
        ["python3", pyHelper("pdf-ocr.py"), "-o", lib, pdf],
        ["python3", pyHelper("pdf-pages.py"), "-o", lib, "--from-ocr", pdf],
      ],
    };
  }
  return {
    rung: "pdf-pages",
    why:
      `${junkOutline || "no outline, "}${p.chars} characters of text layer — PAGE granularity. ` +
      `A chapter tree is NOT inferred (bean 6xaz)`,
    steps: [["python3", pyHelper("pdf-pages.py"), "-o", lib, pdf]],
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
  // Against INSTANCE_ROOT, same reason as the promote path below: `libraryRoot`
  // is INSTANCE-relative, and a bare `resolve` reads the CWD.
  const structure = join(resolve(INSTANCE_ROOT, libRoot), slug, "structure.json");
  if (!existsSync(structure)) throw new Error(`${structure}: no such entry to refresh`);
  // The indent is READ OFF the file, never chosen here. `pdf-structure.py`
  // writes `indent=1` and `pdf-pages.py` writes `indent=2`, so a refresh that
  // picked either would reformat every entry the other rung authored: adding
  // three fields to `9789241548960-eng` re-wrote 4 349 lines, which buries the
  // change it was making and fights every later diff. A metadata refresh is
  // not a licence to reformat a file it did not write.
  const py =
    "import sys, json, importlib.util as u\n" +
    `spec = u.spec_from_file_location('t', ${JSON.stringify(pyHelper("_tech_meta.py"))})\n` +
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

/**
 * Which half of the pipeline is being asked for — bean `pn6j`.
 *
 * Exported for the same reason as {@link mayPromote}: the first version read
 * `argv.includes("--promote")` inline at two call sites, and a mutation that
 * dropped the guard survived, because a source-text test still matched the
 * OTHER occurrence. A decision worth testing is a decision worth naming.
 */
export function ingestMode(argv: readonly string[]): "stage" | "promote" {
  return argv.includes("--promote") ? "promote" : "stage";
}

/**
 * May this staged entry cross into `library/`? — bean `pn6j`.
 *
 * Pure and exported so the decision can be mutation-tested on its own. The
 * first version of this lived inline in the CLI and was covered only by tests
 * that grep the source, which catch a RENAME and miss an inversion — the two
 * mutations that survived were `if (unmet.length)` → `if (false)` and
 * dropping the `--promote` guard, both of which read fine textually.
 *
 * `not-derivable` does NOT block. It is the third state: no arm builds that
 * requirement yet, and refusing every document until every arm exists would
 * make the gate unusable, which is how a gate gets switched off. Only `unmet`
 * — a defect in THIS entry, fixable by re-running a rung — refuses.
 */
export function mayPromote(requirements: readonly Requirement[]): boolean {
  return requirements.every((r) => r.state !== "unmet");
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const dry = argv.includes("--dry-run");
  const chosenLibrary = libraryChoice(argv);
  // The positional is the first argument that is neither a flag NOR a flag's
  // VALUE. `argv.find((a) => !a.startsWith("--"))` was enough while every flag
  // was boolean; `--library who-iris` breaks it, because `who-iris` does not
  // start with `--` and would be ingested as a filename — producing "who-iris:
  // not there" while the real argument sat untouched two places along.
  const takesValue = new Set(["--library"]);
  let pdf: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      if (takesValue.has(a)) i++;
      continue;
    }
    pdf = a;
    break;
  }
  if (!pdf) {
    console.error("usage: bun run ingest <uploads/FILE.pdf> [--dry-run] [--library <name>]");
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
  const slug = bibSlug(pdf);
  // ── Staged, then PROMOTED — bean `pn6j`, owner's decision 2026-09-20 ─────
  //
  // The arms write into `-o <dir>`, so the only change needed to gate this is
  // which directory. They used to be handed `library/` itself, which meant a
  // document that failed L1 completeness was already filed by the time
  // anything could say so — the gate ran, printed, and the entry stayed. Its
  // gap was then discovered by whoever next needed the missing artefact,
  // which is the failure `pn6j` was written to prevent.
  //
  // Refuse-to-promote rather than move-back, which is why no standing rule is
  // touched: nothing is ever moved OUT of `library/` and nothing is deleted,
  // so `deletion-requires-confirmation` does not apply. A rejected document
  // simply never arrives, and its staged output is left in place for
  // inspection rather than cleaned up — an agent tidying away the evidence of
  // its own refusal is the same act under another name.
  // NOT dot-prefixed. This repository moved `.beans/` and `.harness/` out
  // from behind dots in 2026-09-18 for exactly this reason — the artefacts a
  // person looks for first were the hardest to find — and its own dot-prefix
  // guard rejects such a segment. A staging tree holding a REFUSED document is
  // precisely something somebody will come looking for.
  // The staging LIBRARY ROOT, not the entry directory. `planFor`'s third
  // argument is what `libraryRoot()` returns, and every arm creates
  // `<lib>/<slug>/` beneath it. Passing the entry directory produced
  // `ingest-staging/<slug>/<slug>/`, so `checkEntry` read an empty parent and
  // reported EVERY requirement unmet — a refusal that looked exactly like a
  // correct one. Shipped in #495 and caught by running a CSV through the live
  // pipeline; the milnorlink checks passed over it because the incomplete
  // case is refused either way and the complete case was staged by hand,
  // directly into the entry directory.
  const stagingRoot = join(resolve(INSTANCE_ROOT), "ingest-staging");
  const staging = join(stagingRoot, slug);
  const plan = planFor(pdf, undefined, stagingRoot);
  // Resolved ONCE, before anything is written: `libraryRoot()` refuses when
  // several libraries are declared and none was chosen (bean `a02m`/`frs5`),
  // and that refusal belongs before the arms run rather than after they have
  // produced a staging tree nobody can file.
  //
  // Note the two are DIFFERENT roots and always were: the arms write beneath
  // `stagingRoot`, and `destination` is where a passing entry is promoted TO.
  // Conflating them is the defect the comment above records.
  const destination = libraryRoot(INSTANCE_ROOT, chosenLibrary);
  console.log(`${basename(pdf)} -> ${destination}/${slug}/`);
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
  for (const s of ingestMode(argv) === "promote" ? [] : plan.steps) {
    console.log(`\n$ ${s.join(" ")}`);
    const r = Bun.spawnSync(s, { stdout: "inherit", stderr: "inherit" });
    if (r.exitCode !== 0) {
      console.error(`\n${s[1]} failed (exit ${r.exitCode}) — stopping.`);
      process.exit(1);
    }
  }
  // ── Staging STOPS here unless `--promote` ───────────────────────────────
  //
  // Measured while building this: `planFor` runs ONE rung. `pdf-pages.py`
  // alone yields 20 page files and none of `structure.json`, `sections/`,
  // `blocks/`, `manifest.jsonld` or `images.json` — so gating right here
  // refused the document on SEVEN unmet requirements, and would refuse every
  // document ever ingested. A gate that always refuses is a gate somebody
  // switches off, which is worse than no gate at all.
  //
  // So promotion is its own step. The arms accumulate in `ingest-staging/`,
  // and `--promote` is the one moment anything crosses into `library/`. That
  // is what "refuse to promote" has to mean when ingestion is a pipeline
  // rather than a single command.
  if (ingestMode(argv) === "stage") {
    const staged = checkEntry(staging);
    const pending = staged.requirements.filter((r) => r.state === "unmet");
    console.log(`\n✓ staged at ${relative(resolve(INSTANCE_ROOT), staging)}/`);
    if (pending.length) {
      console.log(`  ${pending.length} requirement(s) still to satisfy before it can be promoted:`);
      for (const r of pending) console.log(`    ${r.name.padEnd(22)} ${r.detail}`);
    }
    console.log(`\nNext: run the remaining arms with -o ${relative(resolve(INSTANCE_ROOT), staging)},`);
    console.log(`then: bun run cat-harness/scripts/ingest-document.ts ${relative(resolve(INSTANCE_ROOT), pdf)} --promote`);
    process.exit(0);
  }

  // THE GATE, and the only place anything enters `library/`.
  const verdict = checkEntry(staging);
  const unmet = verdict.requirements.filter((r) => r.state === "unmet");
  if (!mayPromote(verdict.requirements)) {
    console.error(`\n✗ NOT promoted — ${unmet.length} requirement(s) unmet:`);
    for (const r of unmet) console.error(`    ${r.name.padEnd(22)} ${r.detail}`);
    console.error(`\nStaged output is at ${relative(resolve(INSTANCE_ROOT), staging)}/ and was`);
    console.error("left in place. Fix the cause and re-run; nothing was filed under");
    console.error(`${destination}/, so nothing reads as ingested.`);
    // Reported, never acted on: the owner chose reporting-only over opening a
    // bean here (2026-09-20). `beans create` dedupes on nothing and once
    // produced 14,688 duplicates, so a gate that mints one per run against
    // that store is a bad trade — and a person seeing this line has the
    // context a bean would only approximate.
    process.exit(1);
  }

  // Against INSTANCE_ROOT, never the CWD.
  //
  // `libraryRoot` returns an INSTANCE-RELATIVE path — that is its contract, and
  // it is what every `-o` argument wants. `resolve()` with one argument
  // resolves against `process.cwd()`, so running this from the repository root
  // (which is where `bun run` puts you) turned `../who-iris/library` into
  // `/home/user/who-iris/library` — OUTSIDE THE CHECKOUT. It then copied the
  // staged tree there, deleted the staging directory, and printed `✓ promoted`.
  //
  // Latent before bean `frs5` and load-bearing after it: while the only
  // library was this instance's own, the relative path was `library` and the
  // mistake resolved to a wrong directory inside the repo. Once a library
  // could sit in a SIBLING instance the path gained a `../` and the same line
  // started escaping the repository altogether.
  const out = join(resolve(INSTANCE_ROOT, destination), slug);
  mkdirSync(dirname(out), { recursive: true });
  // Only ever INTO the library. `renameSync` would fail across a filesystem
  // boundary, and a staged tree the arms just wrote is small enough that the
  // copy is not worth a fallback path nobody tests.
  cpSync(staging, out, { recursive: true });
  rmSync(staging, { recursive: true, force: true });
  console.log(`\n${existsSync(out) ? "✓" : "✗"} ${destination}/${slug}/  (L1 complete, promoted)`);
  for (const r of verdict.requirements.filter((r) => r.state === "not-derivable")) {
    console.log(`  · ${r.name}: ${r.detail}`);
  }
}
