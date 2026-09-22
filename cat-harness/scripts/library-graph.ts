#!/usr/bin/env bun
/**
 * Read the L1 corpus — `library/` entries, `uploads/` queues, and the relation
 * between them.
 *
 * @module scripts/library-graph
 * @graphNode none — a reader over the library graph, not a schema itself
 *
 * ## Why this exists
 *
 * `library/` is L1: every knowledge-graph reference to a source resolves
 * THROUGH it, never to a loose path or a bare URL. So it is the subgraph most
 * consumers depend on and the one nobody could look at. Bean `jbx2`.
 *
 * ## The finding that unblocks the badge — measured 2026-09-20
 *
 * Bean `v1hw` states, as its blocker:
 *
 * > **Nothing records that an upload was ingested.** … There is no marker on
 * > an upload, no back-reference on a library entry, and no manifest between
 * > them. So **"# uningested" is not a query anybody can currently run**.
 *
 * **That is not true of the corpus as it stands, and this module is the
 * evidence.** Every `library/<slug>/manifest.jsonld` carries
 * `meta.source_file` AND `meta.source_sha256`. Over the four entries here:
 *
 * | entry | `source_file` | in an uploads queue | sha256 |
 * |---|---|---|---|
 * | `9789241548960-eng` | `9789241548960_eng.pdf` | yes | **match** |
 * | `milnorlink` | `milnorlink.pdf` | yes | **match** |
 * | `who-pub-tps-931` | `WHO_PUB_TPS_93.1.pdf` | yes | **match** |
 * | `wpr-rdo-2020-003-eng` | `WPR-RDO-2020-003-eng.pdf` | yes | **match** |
 *
 * Four of four, and the hash is recomputed here rather than trusted — so the
 * relation is CONTENT-VERIFIED rather than name-matched, which is stronger
 * than any of the three shapes `v1hw` proposed inventing. The badge follows,
 * counting documents and not plumbing (see {@link filesIn} on dotfiles):
 * `uploads/` **26 uningested of 28**, `cat-harness/uploads/` **0 of 1**,
 * `who-iris/uploads/` **1 of 4** — re-measured 2026-09-21, after bean `yl5w`
 * moved the three WHO sources out of the harness queue and into the folio
 * beside their own intake records.
 *
 * **The relation survived the move, and that is the evidence it is real.** All
 * six entries still report `upload=match` from a recomputed hash, across three
 * queues now instead of two: a name-matched relation would have broken the
 * moment the files changed directory, and this one did not notice. The one
 * uningested file under `who-iris/uploads/` is the IRIS home capture, which is
 * a page grab rather than a document — uningested is the correct answer for it
 * rather than a backlog.
 *
 * So the harness layer's own queue is down to a single document and the
 * repository root's is untouched — which is a fact about this corpus that
 * nobody could state before, and the sharper reading of `v1hw`'s "those
 * numbers cannot be subtracted": they could not be subtracted, and they never
 * needed to be. The relation was on the manifest all along.
 *
 * What `v1hw` got right, and this keeps: the relation is only as good as the
 * manifest, so an entry with no `source_file` is **`unknown`** and never
 * silently "not from an upload". Three states, and the middle one is the one
 * that matters.
 *
 * ## Two instances declare `uploads`, and they are NOT merged
 *
 * The repository root declares `uploads/` and `cat-harness` declares its own.
 * They are two declarations on purpose, and attribution follows declaration —
 * so a viewer showing one queue of 28 would report a set that does not exist.
 * Every count here is per queue, and the reader returns them separately.
 *
 * ## What is NOT here, and why
 *
 * No ingestion is triggered and nothing is written. `jbx2`'s upload+process
 * affordance and the materialise-into-a-folio action are WRITES, and the
 * write path is the owner's open call on `yj32`. The owner's later
 * instruction — *"w/o edit functionality"* — is what lets the read-only half
 * ship first, and this module is that half.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";

import type { LibraryRef } from "./library-refs.ts";
import { basename, dirname, join, relative } from "node:path";
import { createHash } from "node:crypto";

import { directoriesForGraph, repoRootFor } from "../schemas/cat-harness.js";
import { ingestRungOf, type IngestRung } from "../content/pipeline/gen-library-jsonld.ts";

/**
 * Whether a library entry's source upload is still on disk, and whether it is
 * the same bytes.
 *
 * `unknown` is a determined answer for an entry whose manifest names no
 * source file at all — an entry authored rather than ingested. Rendering it
 * as "missing" would accuse the corpus of losing something it never had.
 */
export type UploadLink = "match" | "differs" | "absent" | "unknown";

/** One `library/<slug>/`. */
export interface LibraryEntry {
  /** The slug — the identifier every reference resolves through. */
  id: string;
  /** The instance whose library this is, e.g. `cat-harness`. */
  instance: string;
  /** Repo-relative directory. */
  dir: string;
  title: string;
  /** From the manifest — `ingested`, `authored`, … or `""`. */
  provenance: string;
  /** Which ingest rung: `paged`, `tabular`, or a determined `none`. */
  rung: IngestRung;
  docId: string;
  sourceFile: string;
  sourceSha256: string;
  arxiv: string;
  doi: string;
  documentClass: string;
  /** Counts of what ingestion actually produced. */
  sections: number;
  blocks: number;
  images: number;
  /** OCR page files — a THIRD state: 0 may mean "never scanned", not "failed". */
  ocrPages: number;
  /** `true` when the entry has an `ocr/` directory at all. */
  hasOcr: boolean;
  hasManifest: boolean;
  hasStructure: boolean;
  hasImagesJson: boolean;
  /** First and last page the structure covers, or `null`. */
  pageStart: number | null;
  pageEnd: number | null;
  /** Summed over the structure's sections. */
  words: number;
  chars: number;
  /** Bytes on disk, the whole entry. */
  bytes: number;
  /** Where its source sits now, and whether it is the same bytes. */
  upload: UploadLink;
  /** The uploads queue holding it, when one does. */
  uploadInstance: string;
  /**
   * What references this slug, and from where — bean `jbx2`'s third ask.
   *
   * EMPTY IS A FINDING, not a blank: `library/` is L1 because every reference
   * to a source resolves through it, so a slug nothing names is a slug that
   * claim is not true of. Attached by the caller, because resolving which
   * directories to scan needs the declaration; absent when nobody scanned,
   * which is again not the same as empty.
   */
  referencedBy?: LibraryRef[];
}

/**
 * One QUEUED UNIT — a loose file, or a declared intake.
 *
 * ## Why a unit rather than a file, and why that is read rather than assumed
 *
 * A queue held loose files until the IRIS work landed. It now also holds
 * per-document directories carrying an `intake.json` (`"$schema":
 * "folio-intake/v1"`) whose `files[]` declares the capture — for the worked
 * example, four files that are *three different kinds of thing that a single
 * `uploads/` entry has never had to tell apart before*, in its own words.
 *
 * Counting those four as four queued documents would have made the badge say
 * 4 where one document is waiting, and counting the `.extraction.json`
 * sidecars beside them would have made it 7. Neither is a queue anybody has.
 * **The intake declares which files are the capture, so the reader asks it**
 * — the same principle `directory-conventions` states for every other graph
 * here: a directory says what to expect and the files declare what they are.
 */
export interface UploadItem {
  /** File name, or the intake directory's name. */
  file: string;
  /**
   * `file` — a loose file dropped in the queue.
   * `intake` — a directory whose `intake.json` declares a capture.
   */
  kind: "file" | "intake";
  /** The instance whose queue this is. */
  instance: string;
  /** Repo-relative path. */
  path: string;
  /** Bytes: the file, or the whole intake directory. */
  bytes: number;
  /** Lower-case extension without the dot, or `""`. `""` for an intake. */
  ext: string;
  /** The library slug that names this unit, or `""` — the badge's basis. */
  ingestedBy: string;
  /** Intake only: the `doc_id` it declares. */
  docId: string;
  /** Intake only: its declared title. */
  title: string;
  /** Intake only: how many files `files[]` declares. */
  declaredFiles: number;
}

/** One declared `uploads/` queue, counted on its own. */
export interface UploadQueue {
  instance: string;
  /** Repo-relative directory. */
  dir: string;
  total: number;
  ingested: number;
  /** `total - ingested`. The badge. */
  uningested: number;
}

/** The whole reading. */
export interface LibraryGraph {
  entries: LibraryEntry[];
  uploads: UploadItem[];
  queues: UploadQueue[];
  /**
   * How the reference scan went, when one ran.
   *
   * Carried so a reader can tell "nothing references this" from "nothing
   * looked". Absent means no scan; `unreadable` non-empty means the scan is
   * incomplete and every zero below it is provisional.
   */
  refScan?: { filesRead: number; unreadable: string[] };
}

/** Parse JSON, or `undefined`. Unreadable and absent are the caller's to tell apart. */
function readJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return undefined;
  }
}

/**
 * Files directly in a directory, sorted; `[]` when it is not there.
 *
 * **Dot-prefixed names are not entries.** A queue's `.gitignore` is
 * repository plumbing, not a document waiting to be ingested, and counting it
 * made the first run of this reader report 23 uningested in `uploads/` when
 * 22 documents were waiting. A badge that is wrong by one is a badge nobody
 * trusts the second time, and this is the same dot-prefix rule
 * `directory-conventions` applies to every path segment.
 */
function filesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .filter((f) => !f.startsWith(".") && statSync(join(dir, f)).isFile());
}

/** Bytes of a directory tree. */
function treeBytes(dir: string): number {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    n += st.isDirectory() ? treeBytes(p) : st.size;
  }
  return n;
}

function sha256(path: string): string {
  const h = createHash("sha256");
  h.update(readFileSync(path));
  return h.digest("hex");
}

/**
 * The instance a declared directory belongs to.
 *
 * Its parent's basename — `cat-harness/library` belongs to `cat-harness`, and
 * a directory at the repository root belongs to the repository. Derived from
 * the resolved path rather than passed in, so a caller cannot label a queue
 * with an instance it did not come from, which is the mislabelling `v1hw`
 * warns about from the other direction.
 */
function instanceOf(absDir: string, repoRoot: string): string {
  const rel = relative(repoRoot, absDir).split("\\").join("/");
  const parts = rel.split("/");
  return parts.length > 1 ? parts[0]! : basename(repoRoot);
}

/**
 * Read every declared `library` and `uploads` directory reachable from these
 * roots.
 *
 * Returns `null` when no root declares either — not an empty graph. A folio
 * with no corpus simply has none, and a consumer rendering the two alike
 * reports a clean run over something it never opened.
 */
export function readLibraryGraph(roots: string[]): LibraryGraph | null {
  const repoRoot = repoRootFor(roots[0] ?? ".");
  const libDirs = new Set<string>();
  const upDirs = new Set<string>();
  for (const r of roots) {
    for (const d of directoriesForGraph(r, "library")) libDirs.add(d);
    for (const d of directoriesForGraph(r, "uploads")) upDirs.add(d);
  }
  // An instance that declares a library declares its own queue, and that
  // declaration does not always reach the roots passed in: measured
  // 2026-09-20, `directoriesForGraph(cat-harness, "library")` resolves
  // `who-iris/library` while `…(cat-harness, "uploads")` does NOT resolve
  // `who-iris/uploads`. Reading the entries of a queue this reader then
  // omitted would report an instance's corpus as though it arrived from
  // nowhere. So each library's own instance root is asked for its queue.
  for (const lib of [...libDirs]) {
    for (const d of directoriesForGraph(dirname(lib), "uploads")) upDirs.add(d);
  }
  if (libDirs.size === 0 && upDirs.size === 0) return null;

  // Entries first: the uploads pass needs to know which files are named.
  const entries: LibraryEntry[] = [];
  /** `source_file` → the slug naming it, and the sha it claims. */
  const named = new Map<string, { slug: string; sha: string }>();

  for (const libDir of [...libDirs].sort()) {
    const instance = instanceOf(libDir, repoRoot);
    for (const slug of readdirSync(libDir).sort()) {
      const dir = join(libDir, slug);
      if (!statSync(dir).isDirectory()) continue;
      const has = (f: string): boolean => existsSync(join(dir, f));
      const manifest = readJson<{
        title?: string;
        provenance?: string;
        meta?: Record<string, unknown>;
      }>(join(dir, "manifest.jsonld"));
      const meta = (manifest?.meta ?? {}) as Record<string, unknown>;
      const str = (k: string): string => (typeof meta[k] === "string" ? (meta[k] as string) : "");
      const structure = readJson<{
        sections?: Array<{ page_start?: number; page_end?: number; n_words?: number; n_chars?: number }>;
      }>(join(dir, "structure.json"));
      const secs = structure?.sections ?? [];
      /**
       * Sum a section field, keeping only the values that are actually numbers.
       *
       * The guard is not defensive tidiness — it is the difference between a
       * count and a script. `structure.json` comes from an ingested corpus
       * this repository did not author, and `reduce((n, s) => n + s.n_words)`
       * is string CONCATENATION the moment one `n_words` is a string. The
       * result then flows to `gen-library-viz`, which renders `words` through
       * `toLocaleString()` — one of only two fields it does NOT pass through
       * `esc()`, because both were assumed numeric — and straight into
       * `innerHTML`.
       *
       * Measured 2026-09-22 with `n_words: '<img src=x onerror="alert(1)">'`:
       * `words` came out as the string `0<img src=x onerror="alert(1)">` and
       * rendered unescaped. Bean `1wef`, surface 2.
       *
       * The `pages` line directly below already guards this exact class with
       * `typeof n === "number"`. That guard was the one `words` and `chars`
       * needed, four lines away.
       */
      const sumSections = (pick: (s: (typeof secs)[number]) => unknown): number =>
        secs.reduce((n, s) => {
          const v = pick(s);
          return typeof v === "number" && Number.isFinite(v) ? n + v : n;
        }, 0);
      const pages = secs.flatMap((s) => [s.page_start, s.page_end]).filter((n): n is number => typeof n === "number");
      const images = readJson<{ images?: unknown[] }>(join(dir, "images.json"));
      const sourceFile = str("source_file");
      const sourceSha = str("source_sha256");
      if (sourceFile) named.set(sourceFile, { slug, sha: sourceSha });

      entries.push({
        id: slug,
        instance,
        dir: relative(repoRoot, dir).split("\\").join("/"),
        title: manifest?.title ?? slug,
        provenance: manifest?.provenance ?? "",
        rung: ingestRungOf(has),
        docId: str("doc_id"),
        sourceFile,
        sourceSha256: sourceSha,
        arxiv: str("arxiv"),
        doi: str("doi"),
        documentClass: str("document_class"),
        sections: filesIn(join(dir, "sections")).filter((f) => f.endsWith(".md")).length,
        blocks: filesIn(join(dir, "blocks")).filter((f) => f.endsWith(".jsonld")).length,
        images: images?.images?.length ?? filesIn(join(dir, "images")).length,
        ocrPages: filesIn(join(dir, "ocr")).length,
        hasOcr: existsSync(join(dir, "ocr")),
        hasManifest: has("manifest.jsonld"),
        hasStructure: has("structure.json"),
        hasImagesJson: has("images.json"),
        pageStart: pages.length ? Math.min(...pages) : null,
        pageEnd: pages.length ? Math.max(...pages) : null,
        words: sumSections((s) => s.n_words),
        chars: sumSections((s) => s.n_chars),
        bytes: treeBytes(dir),
        // Filled in by the uploads pass: the link is a fact about both ends,
        // and deciding it here would mean deciding it without the file.
        upload: sourceFile ? "absent" : "unknown",
        uploadInstance: "",
      });
    }
  }

  const uploads: UploadItem[] = [];
  const queues: UploadQueue[] = [];
  const byId = new Map(entries.map((e) => [e.id, e]));

  for (const upDir of [...upDirs].sort()) {
    const instance = instanceOf(upDir, repoRoot);
    let ingested = 0;

    // Declared intakes first. A directory carrying `intake.json` is ONE
    // queued document, whatever it holds — see the note on `UploadItem`.
    for (const name of existsSync(upDir) ? readdirSync(upDir).sort() : []) {
      const sub = join(upDir, name);
      if (name.startsWith(".") || !statSync(sub).isDirectory()) continue;
      const intake = readJson<{
        doc_id?: string;
        title?: string;
        files?: unknown[];
      }>(join(sub, "intake.json"));
      // A subdirectory with no intake is not a queued unit and not an error
      // either: it is something this reader does not model, and saying so is
      // better than counting it as a document.
      if (!intake) continue;
      const docId = intake.doc_id ?? name;
      const hit = byId.has(docId) ? docId : "";
      if (hit) ingested++;
      uploads.push({
        file: name,
        kind: "intake",
        instance,
        path: relative(repoRoot, sub).split("\\").join("/"),
        bytes: treeBytes(sub),
        ext: "",
        ingestedBy: hit,
        docId,
        title: intake.title ?? "",
        declaredFiles: intake.files?.length ?? 0,
      });
      const e = byId.get(docId);
      // An intake IS the source, so an entry reached through one is linked
      // even when no single `source_file` sits loose in the queue.
      if (e && e.upload === "absent") {
        e.upload = "match";
        e.uploadInstance = instance;
      }
    }

    const loose = filesIn(upDir);
    // A SIDECAR IS NOT A QUEUED DOCUMENT.
    //
    // `<source>.extraction.json` describes the capture of `<source>`; counting
    // it as a unit of its own is the same error `UploadItem`'s own note records
    // for an intake's declared files, and that note names THIS case in the same
    // breath: *"counting the `.extraction.json` sidecars beside them would have
    // made it 7."* The intake half was handled when it was written; the loose
    // half was not, so a queue of fifteen sources counted as thirty and the
    // uploads view's headline — the number the whole page exists to state —
    // was inflated by its own metadata. Found by rendering it (issue #836).
    //
    // Keyed on the SOURCE being present, so an ORPHAN sidecar whose source has
    // gone stays visible as a unit rather than vanishing. A file nothing
    // accounts for is precisely what a queue view exists to surface, and
    // silently dropping it would be this defect with the sign flipped.
    const present = new Set(loose);
    const files = loose.filter((f) => {
      const source = f.endsWith(".extraction.json")
        ? f.slice(0, -".extraction.json".length)
        : "";
      return source === "" || !present.has(source);
    });
    for (const file of files) {
      const hit = named.get(file);
      if (hit) {
        ingested++;
        const e = byId.get(hit.slug);
        if (e) {
          // Recomputed, never trusted. A name match says somebody dropped a
          // file with the right name; a hash match says it is the same
          // document. Only the second is evidence, and the difference is
          // exactly the one a queue badge would otherwise paper over.
          e.upload = hit.sha ? (sha256(join(upDir, file)) === hit.sha ? "match" : "differs") : "unknown";
          e.uploadInstance = instance;
        }
      }
      uploads.push({
        file,
        kind: "file",
        instance,
        path: relative(repoRoot, join(upDir, file)).split("\\").join("/"),
        bytes: statSync(join(upDir, file)).size,
        ext: (file.split(".").pop() ?? "").toLowerCase() === file ? "" : (file.split(".").pop() ?? "").toLowerCase(),
        ingestedBy: hit?.slug ?? "",
        docId: "",
        title: "",
        declaredFiles: 0,
      });
    }
    const dirRel = relative(repoRoot, upDir).split("\\").join("/");
    const units = uploads.filter((u) => u.instance === instance && u.path.startsWith(`${dirRel}/`));
    queues.push({
      instance,
      dir: dirRel,
      total: units.length,
      ingested,
      uningested: units.length - ingested,
    });
  }

  // Sorted: the projection built from this is committed, and an artefact
  // reproducible only where it was generated is a snapshot, not a generated
  // file.
  entries.sort((a, b) => a.dir.localeCompare(b.dir));
  uploads.sort((a, b) => a.path.localeCompare(b.path));
  queues.sort((a, b) => a.dir.localeCompare(b.dir));
  return { entries, uploads, queues };
}

if (import.meta.main) {
  const here = join(import.meta.dir, "..");
  const g = readLibraryGraph([here, repoRootFor(here)]);
  if (g === null) {
    console.error("no library or uploads directory is declared — nothing to read");
    process.exit(2);
  }
  console.log(`entries  ${g.entries.length}`);
  for (const e of g.entries) {
    console.log(
      `  ${e.id.padEnd(24)} ${e.rung.padEnd(8)} sections=${String(e.sections).padStart(4)} ` +
        `blocks=${String(e.blocks).padStart(4)} ocr=${String(e.ocrPages).padStart(4)} upload=${e.upload}`,
    );
  }
  console.log(`queues`);
  for (const q of g.queues) {
    console.log(`  ${q.dir.padEnd(22)} ${q.total} file(s), ${q.ingested} ingested, ${q.uningested} UNINGESTED`);
  }
}
