/**
 * An ingested upload does not stay in the queue. Bean `q7ey`.
 *
 * @module cat-harness/scripts/check-uploads-retired
 *
 * Both graphs, because the finding is a RELATION between them — a queue file
 * whose bytes some library entry derived from — and a declaration naming one
 * would credit half the audit to nothing.
 *
 * @covers uploads
 * @covers library
 *
 * ## The rule, in the owner's words
 *
 * 2026-09-29, answering *"why are ingested things still sitting in uploads and
 * not moived to library of appropraite harness?"*:
 *
 * > no, uploads is archival copy.
 *
 * then, refining where the archival copy belongs:
 *
 * > archival (once ingested into KG and put into a proper `library/` under a
 * > harness repo) then it should be moved to fsh-guts.
 *
 * So there are three stages and `uploads/` is the only temporary one: **queued**
 * in a declared `uploads/`, **derived** into `library/<slug>/`, **archived** in
 * `fsh-guts/uploads/` with a same-basename sidecar. The reasoning is in
 * `skills/folio-core/library-ingestion.md`.
 *
 * ## Why a check and not a sweep
 *
 * The rule was written on 2026-09-30 and swept by hand the same day. Within
 * that one commit the sweep produced **three** wrong answers, each invisible
 * from its own output:
 *
 *   - it reported **nine** sources to retire, having resolved
 *     `cat-harness/library/` alone. The answer was 28 across five harnesses.
 *   - it reported **five sources RESTORED** from `4b10661cdde` "after an
 *     earlier session deleted them". None had been deleted. All five were at
 *     `cat-harness/uploads/` continuously, and are there at HEAD; the sweep
 *     `git show`-ed a second copy of each into the archive. It believed them
 *     deleted because it looked for them in `uploads/`, where they were
 *     genuinely absent — they had been RENAMED into `cat-harness/uploads/`.
 *   - three more it processed from the right directory and copied rather than
 *     moved, leaving the original in place.
 *
 * Eight files in two places, and a recovery claim with nothing recovered.
 * Correcting the count did not correct the method that produced it, which is
 * the whole argument for this file: **a rule nothing checks is a rule that
 * holds until the next session, and this one did not survive its own commit.**
 *
 * `milnorlink.pdf` is the fourth case and the cleanest statement of it: it was
 * ingested to `folio-assistant-sci/library/`, so a sweep matching against
 * `cat-harness/library/` saw no match and read it as still queued. The finding
 * is not "somebody was careless"; it is that a one-directory answer looks
 * exactly like a whole one.
 *
 * ## What it compares, and what it deliberately does not
 *
 * A queue file is RETIRED when its sha256 equals the `source_sha256` recorded
 * by some library entry's manifest. Hashes rather than filenames, because a
 * rename is the normal case — `2509.06388v1.pdf` is archived as
 * `wang-rangaiah-2026-mcdm-aggregation.pdf`, and a name comparison would have
 * called that unarchived and produced a ninth duplicate.
 *
 * It does not judge whether a queued file OUGHT to be ingested. A PDF nobody
 * has read is a legitimate queue item and reports as `queued`. The finding is
 * only ever the pair: derived AND still in the queue.
 *
 * It reports rather than deletes. `deletion-requires-confirmation`: the remedy
 * names a `git mv`, or a `git rm` when the identical bytes are already in the
 * archive, and a person runs it.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";

import { directoriesForGraph } from "../schemas/cat-harness.ts";

const ROOT = resolve(import.meta.dir, "..", "..");

/**
 * The instance roots this repository's own run asks — **a pair, and neither
 * alone is the corpus.**
 *
 * `directoriesForGraph(ROOT, "library")` returns **zero** directories, because
 * the repository root is not an instance that declares a library. Measured
 * 2026-09-30, and it is why the first version of this file printed
 * "✓ 15 queue file(s), none already ingested" over a corpus it had not read —
 * `dh4f`, in the check written to stop `dh4f`.
 *
 * `cat-harness` declares one, and its declaration reaches all six
 * (`cat-harness`, `who-iris`, `agent-skills`, `folio-assistant-sci`,
 * `folio-assistant-core`, `smart-base`). The repository root declares
 * `uploads/`, which `cat-harness` does not. So both are asked.
 *
 * Exported, and passed as an ARGUMENT rather than closed over, so a fixture
 * root is genuinely isolated: a module-level constant leaks this repository
 * into every test, and the first version of the tests measured 42 ingested
 * hashes over a fixture holding two. The `readLibraryGraph(roots: string[])`
 * precedent, for the same reason.
 */
export const DEFAULT_ROOTS: readonly string[] = [ROOT, resolve(import.meta.dir, "..")];

/** Where an archived upload lives. One place, named by the owner's ruling. */
const ARCHIVE = "fsh-guts/uploads";

export type QueueState = "queued" | "retired" | "duplicated";

/**
 * Whether the file is a bare drop in the queue or part of a structured intake.
 *
 * `who-iris` keeps one DIRECTORY per source — the PDF beside an `intake.json`
 * and an `iris-capture/` — so the remedy the flat case prints (move the PDF,
 * write a sidecar) would leave an intake record pointing at a file that is no
 * longer there. Whether such a source retires as a file or as a directory is
 * a who-iris layout decision, and that layout is under revision in #1612.
 *
 * So the two are reported as separate families and only the flat one blocks.
 * Not an exemption: the structured findings are counted and printed on every
 * run, and the family carries the reason it is advisory rather than a
 * silence. A blocking family that is right for one queue and wrong for
 * another is a gate people learn to override.
 */
export type QueueShape = "flat" | "structured-intake";

/** What marks a per-source intake directory, rather than a bare drop. */
const INTAKE_RECORD = "intake.json";

export interface QueueFile {
  /** Repo-relative path of the file in a declared `uploads/` directory. */
  rel: string;
  sha256: string;
  state: QueueState;
  /** The library entry that derived from it, when one did. */
  entry?: string;
  /** The archive copy holding identical bytes, when one exists. */
  archived?: string;
  shape: QueueShape;
}

function sha(abs: string): string {
  return createHash("sha256").update(readFileSync(abs)).digest("hex");
}

/** Every declared library across {@link roots}. See {@link DEFAULT_ROOTS}. */
export function declaredLibraries(roots: readonly string[] = DEFAULT_ROOTS): Set<string> {
  const out = new Set<string>();
  for (const r of roots) {
    for (const d of directoriesForGraph(r, "library")) out.add(d);
  }
  return out;
}

/**
 * Every library entry's recorded `source_sha256`, across every declared
 * library in every instance — the measurement the 2026-09-30 sweep got wrong
 * by asking one of them.
 *
 * Walked rather than read from a fixed key path: a manifest is JSON-LD and the
 * field's nesting has moved. What cannot move is the field NAME, so that is
 * what is matched.
 */
export function ingestedSources(roots: readonly string[] = DEFAULT_ROOTS): Map<string, string> {
  const out = new Map<string, string>();
  const libs = declaredLibraries(roots);
  const base = roots[0] ?? ROOT;
  for (const lib of libs) {
    if (!existsSync(lib)) continue;
    for (const slug of readdirSync(lib)) {
      const m = join(lib, slug, "manifest.jsonld");
      if (!existsSync(m)) continue;
      let doc: unknown;
      try {
        doc = JSON.parse(readFileSync(m, "utf-8"));
      } catch {
        continue;
      }
      const seen: string[] = [];
      const walk = (o: unknown): void => {
        if (Array.isArray(o)) {
          for (const v of o) walk(v);
        } else if (o !== null && typeof o === "object") {
          for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
            if (k === "source_sha256" && typeof v === "string") seen.push(v.toLowerCase());
            else walk(v);
          }
        }
      };
      walk(doc);
      for (const h of seen) out.set(h, relative(base, join(lib, slug)));
    }
  }
  return out;
}

/** The bytes already in the archive, by hash. */
export function archivedSources(roots: readonly string[] = DEFAULT_ROOTS): Map<string, string> {
  const out = new Map<string, string>();
  const base = roots[0] ?? ROOT;
  const dir = join(base, ARCHIVE);
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    const abs = join(dir, f);
    // The sidecar describes the artefact; it is not one.
    if (f.endsWith(".md") || !statSync(abs).isFile()) continue;
    out.set(sha(abs), relative(base, abs));
  }
  return out;
}

/** Every file under a queue directory, relative to it, recursing into subdirectories. */
function queueFiles(dir: string, prefix = ""): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir).sort()) {
    const abs = join(dir, f);
    if (statSync(abs).isDirectory()) out.push(...queueFiles(abs, join(prefix, f)));
    else out.push(join(prefix, f));
  }
  return out;
}

/** Every file sitting in a declared `uploads/`, with its state. */
export function queueState(roots: readonly string[] = DEFAULT_ROOTS): QueueFile[] {
  const base = roots[0] ?? ROOT;
  const ingested = ingestedSources(roots);
  const archived = archivedSources(roots);

  const queues = new Set<string>();
  for (const r of roots) {
    for (const d of directoriesForGraph(r, "uploads")) queues.add(d);
  }
  // An instance that declares a library declares its own queue, and that
  // declaration does not always reach the root's own resolution — measured in
  // `library-graph.ts` on 2026-09-20 for `who-iris`. Asking each library's
  // instance is what makes this total rather than nearly so.
  for (const lib of declaredLibraries(roots)) {
    for (const d of directoriesForGraph(resolve(lib, ".."), "uploads")) queues.add(d);
  }

  const out: QueueFile[] = [];
  for (const q of [...queues].sort()) {
    if (!existsSync(q)) continue;
    // The archive lives under a declared directory too; it is the destination,
    // not a queue.
    if (relative(base, q).replace(/\\/g, "/") === ARCHIVE) continue;
    // A queue may hold a DIRECTORY per source — `who-iris/uploads/` keeps
    // `9789241548960-eng/` and three siblings that way. Listing only the top
    // level would report those four queues as empty, which is the same
    // could-not-see-it-so-it-is-clean shape this file exists to stop.
    for (const f of queueFiles(q)) {
      const abs = join(q, f);
      if (basename(f) === "README.md") continue;
      const h = sha(abs);
      const entry = ingested.get(h);
      const arch = archived.get(h);
      // Read from the filesystem rather than from the file's depth: a queue
      // may nest for other reasons, and it is the intake RECORD that makes
      // the remedy different.
      const shape: QueueShape = existsSync(join(dirname(abs), INTAKE_RECORD)) ? "structured-intake" : "flat";
      out.push({
        rel: relative(base, abs),
        sha256: h,
        state: entry === undefined ? "queued" : arch === undefined ? "retired" : "duplicated",
        ...(entry === undefined ? {} : { entry }),
        ...(arch === undefined ? {} : { archived: arch }),
        shape,
      });
    }
  }
  return out;
}

/**
 * The findings: a queue file that has been ingested.
 *
 * `retired` here means "derived and NOT yet archived" — it must move.
 * `duplicated` means the identical bytes are already archived, so the queue
 * copy is redundant and the remedy is a removal rather than a move. The two
 * are separated because the remedy differs and conflating them is how the
 * 2026-09-30 sweep produced eight files in two places.
 */
export function findings(files: QueueFile[]): QueueFile[] {
  return files.filter((f) => f.state !== "queued");
}

if (import.meta.main) {
  // The denominator BEFORE the verdict. Every finding here is "this file's
  // hash is in the ingested set", so an empty ingested set makes every file
  // read as queued and the check pass over everything. That is not a
  // hypothetical: the first version of this file resolved libraries from the
  // repository root, got zero, and printed a green line.
  const ingested = ingestedSources();
  if (ingested.size === 0) {
    console.error("✗ no library entry records a `source_sha256`.");
    console.error("  Every queue file would read as not-yet-ingested, so this check");
    console.error(`  would pass vacuously. Declared libraries: ${String(declaredLibraries().size)}.`);
    process.exit(1);
  }

  const files = queueState();
  if (files.length === 0) {
    // `dh4f`: no declared queue, or an empty one, is not a clean sweep.
    console.error("✗ no file found in any declared `uploads/` directory.");
    console.error("  That is not a pass: either nothing is queued, or the declarations");
    console.error("  could not be resolved, and those two need telling apart.");
    process.exit(1);
  }

  const bad = findings(files);
  const flat = bad.filter((f) => f.shape === "flat");
  const structured = bad.filter((f) => f.shape === "structured-intake");
  const queued = files.length - bad.length;

  const remedy = (f: QueueFile): string =>
    f.state === "duplicated"
      ? `git rm "${f.rel}"  (identical bytes already at ${String(f.archived)})`
      : `git mv "${f.rel}" "${ARCHIVE}/${basename(f.rel)}"  + a same-basename .md sidecar`;

  console.log(
    `Queue retirement — ${String(files.length)} file(s) across ${String(new Set(files.map((f) => dirname(f.rel))).size)} director(y/ies),` +
      ` against ${String(ingested.size)} ingested source hash(es)\n`,
  );

  // Advisory first, so a reader does not take the blocking family's count as
  // the whole answer. The share is reported and not graded.
  if (structured.length > 0) {
    console.log(`· ${String(structured.length)} already-ingested file(s) inside a per-source intake directory — ADVISORY:`);
    for (const f of structured) {
      console.log(`    ${f.rel}`);
      console.log(`      derived to ${String(f.entry)}`);
    }
    console.log("  Each sits beside an `intake.json`, so moving the PDF alone would leave");
    console.log("  that record naming a file that is not there. Whether such a source");
    console.log("  retires as a FILE or as a DIRECTORY is a who-iris layout decision, and");
    console.log("  that layout is being reworked in #1612. Reported every run, and the");
    console.log("  count is the point: this is not a clean family.\n");
  }

  if (flat.length === 0) {
    console.log(
      `✓ ${String(queued)} queue file(s) genuinely queued, 0 already-ingested bare drop(s)` +
        `${structured.length > 0 ? `, ${String(structured.length)} advisory` : ""}.`,
    );
    process.exit(0);
  }

  console.error(`✗ ${String(flat.length)} of ${String(files.length)} queue file(s) have already been ingested:\n`);
  for (const f of flat) {
    console.error(`  ✗ ${f.rel}`);
    console.error(`      derived to  ${String(f.entry)}`);
    console.error(`      remedy: ${remedy(f)}`);
  }
  console.error(`\n  ${String(queued)} file(s) are genuinely queued and are not findings.`);
  console.error("  The rule is in skills/folio-core/library-ingestion.md");
  console.error('  §"What happens to the upload after it is ingested". Bean q7ey.');
  console.error("\n  Nothing is moved or removed here — deletion-requires-confirmation.");
  process.exit(1);
}
