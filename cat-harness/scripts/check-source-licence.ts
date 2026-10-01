/**
 * Every ingested source document says what licence it came under, or says
 * that nobody could find out and where they looked.
 *
 * Owner, 2026-09-23 (issue #1023), when the WireGen paper (arXiv:2312.07755)
 * arrived with no licence in its PDF and every registry that would state one
 * was unreachable: *"Make qa report, no known source. Try to find"*.
 *
 * ## Three states, never two
 *
 * A library entry's `manifest.jsonld` may carry `meta.licence`. It is AUTHORED in
 * `licence.json` beside the entry and carried verbatim by `gen-library-jsonld`,
 * because the manifest is generated: a record written into it directly is
 * erased by the next regeneration (folio-assistant#1492).
 *
 *
 * | `status`  | means                                                     | must carry |
 * |-----------|-----------------------------------------------------------|------------|
 * | `stated`  | the licence is known                                      | `id` (SPDX where one exists) and `basis`: where it is stated |
 * | `unknown` | somebody looked and could not establish it                | `searched`: one entry per place tried, with what it returned |
 * | (absent)  | nobody has recorded anything                              | nothing, and it is reported as such |
 *
 * `unknown` and absent are different facts. "We looked in five places and none
 * said" is a finding somebody can act on. "Nobody looked" is a gap. Folding
 * them together would make an entry that was searched for read the same as one
 * that was never considered.
 *
 * ## Reports, and fails only on a malformed record
 *
 * Almost no entry recorded a licence before this check existed. Gating on
 * absence would turn the corpus red for a field that did not exist yesterday.
 * So absence and `unknown` are REPORTED in the sidecar, and the check exits
 * non-zero only for a record that claims something it cannot back: `stated`
 * with no `basis`, or `unknown` with no `searched`. The same reasoning as
 * `check:methodology-evidence`: a citation that claims to resolve and does not
 * is worse than none.
 *
 * Usage:
 *   bun run check:source-licence            # report, write the sidecar
 *   bun run check:source-licence -- --json  # print the sidecar document
 *   bun run check:source-licence:check      # JUDGE: compute and judge, write nothing (the gate)
 *
 * Judge mode (`--check`, beans `bo44` and `i2kp`): 0 no malformed record · 1 a
 * malformed record · 2 no library entry found (could not determine), an
 * unknown flag, or the run threw. It judges the FRESH computation and writes
 * nothing; it does not gate on whether the committed sidecar is current,
 * because that copy leaves `main` with arc `3fva` (proposal §2.3). Staleness is
 * printed as an advisory instead — see `concludeJudgement`.
 *
 * @module scripts/check-source-licence
 * @covers library, uploads
 */
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { repoRootFor } from "../schemas/cat-harness.ts";
import { licenceProblem, type SourceLicence } from "../schemas/source-licence.ts";
import { gitScan } from "../schemas/git-corpus.ts";
import {
  buildQaResult,
  concludeJudgement,
  judgementOf,
  judgeUsage,
  judging,
  writeQaResult,
  type Judgement,
  type QaResult,
} from "./qa-results.ts";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

type Licence = SourceLicence;

export interface LicenceReport {
  entries: number;
  stated: { entry: string; id: string; basis: string }[];
  unknown: { entry: string; searched: number; note?: string }[];
  notRecorded: { entry: string }[];
  malformed: { entry: string; problem: string }[];
}

/** Moved to `schemas/source-licence.ts` (bean `7bg9`) so an intake record shares it; re-exported for existing callers. */
export { licenceProblem };

export function checkSourceLicence(root: string = REPO_ROOT): LicenceReport {
  const r: LicenceReport = { entries: 0, stated: [], unknown: [], notRecorded: [], malformed: [] };
  // ASKED OF GIT, and the hand-written denylist is gone because git already
  // holds it: `node_modules` is `.gitignore:1` and `cat-harness/ingest-staging/`
  // is `.gitignore:219`. That denylist was an UNDER-APPROXIMATION of the real
  // rule — it named the two ignored trees somebody had been bitten by, and any
  // third one swept in silently. `ramz` is the measured instance of that shape
  // (145 gitignored documents counted as repository content) and `xd1g` is the
  // sweep it asked for; `biz4` is what it costs when nobody notices (233 nodes
  // read as 1443, from residue a clean `git status` cannot show).
  const { files } = gitScan(root, "**/library/*/manifest.jsonld");
  for (const rel of files) {
    const entry = relative(root, dirname(resolve(root, rel)));
    r.entries += 1;
    let licence: Licence | undefined;
    try {
      licence = (JSON.parse(readFileSync(resolve(root, rel), "utf-8")) as { meta?: { licence?: Licence } }).meta?.licence;
    } catch (e) {
      r.malformed.push({ entry, problem: `manifest does not parse: ${(e as Error).message}` });
      continue;
    }
    if (licence === undefined) {
      r.notRecorded.push({ entry });
      continue;
    }
    const problem = licenceProblem(licence);
    if (problem) r.malformed.push({ entry, problem });
    else if (licence.status === "stated") r.stated.push({ entry, id: licence.id!, basis: licence.basis! });
    else r.unknown.push({ entry, searched: licence.searched!.length, ...(licence.note ? { note: licence.note } : {}) });
  }
  return r;
}

/** Bean `bo44`'s four states over a report: only a malformed record is a finding. */
export function judgeSourceLicence(r: LicenceReport): Judgement {
  return judgementOf({ failing: r.malformed.length, undetermined: r.entries === 0 });
}

/** The sidecar document for a report. Pure, so the judge and the writer render ONE computation. */
export function sourceLicenceDocument(r: LicenceReport): QaResult {
  return buildQaResult({
    script: "cat-harness/scripts/check-source-licence.ts",
    scriptAbsPath: fileURLToPath(import.meta.url),
    subject: { kind: "corpus", id: "library-source-licences" },
    families: {
      stated: { summary: "The licence is known, and the record says where it is stated.", entries: r.stated },
      unknown: {
        summary:
          "Somebody looked and could not establish the licence. Each entry records where it searched. " +
          "Holding the source may still be the owner's call, but a reader must not assume it is openly licensed.",
        entries: r.unknown,
      },
      "not-recorded": {
        summary: "No licence recorded at all: nobody has looked yet. Reported, not gated; the field is new.",
        entries: r.notRecorded,
      },
      malformed: {
        summary: "A licence record that claims something it cannot back. This is the only family that fails the check.",
        entries: r.malformed,
      },
    },
  });
}

if (import.meta.main) {
  const GATE = "check:source-licence";
  if (judging()) {
    // Judge mode: compute, judge, write NOTHING (beans `bo44`, `i2kp`).
    const usage = judgeUsage(GATE, process.argv.slice(2), []);
    if (usage !== undefined) process.exit(usage);
    let jr: LicenceReport;
    try {
      jr = checkSourceLicence();
    } catch (e) {
      process.exit(concludeJudgement({ gate: GATE, judgement: "error", detail: (e as Error).message }));
    }
    for (const m of jr.malformed) console.error(`  ✗ ${m.entry}: ${m.problem}`);
    process.exit(
      concludeJudgement({
        gate: GATE,
        judgement: judgeSourceLicence(jr),
        detail:
          jr.entries === 0
            ? "no library entry found"
            : `${jr.entries} library entries: stated ${jr.stated.length} · unknown ${jr.unknown.length} · ` +
              `not recorded ${jr.notRecorded.length} · malformed ${jr.malformed.length}`,
        ...(jr.entries === 0
          ? {}
          : { committed: { root: INSTANCE_ROOT, stem: "source-licence", fresh: sourceLicenceDocument(jr), writer: GATE } }),
      }),
    );
  }
  const r = checkSourceLicence();
  if (r.entries === 0) {
    console.error("UNDETERMINED: no library entry found. This is not a pass; nothing was checked.");
    process.exit(2);
  }
  const doc = sourceLicenceDocument(r);
  if (process.argv.includes("--json")) console.log(JSON.stringify(doc, null, 2));
  else {
    writeQaResult(INSTANCE_ROOT, "source-licence", doc);
    console.log(`source licences, ${r.entries} library entries`);
    console.log(`  stated ${r.stated.length} · unknown (searched) ${r.unknown.length} · not recorded ${r.notRecorded.length} · malformed ${r.malformed.length}`);
    for (const u of r.unknown) console.log(`  ? ${u.entry}: unknown after ${u.searched} place(s) searched`);
    for (const m of r.malformed) console.log(`  ✗ ${m.entry}: ${m.problem}`);
  }
  if (r.malformed.length > 0) process.exit(1);
}
