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
 * A library entry's `manifest.jsonld` may carry `meta.licence`:
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
 *
 * @module scripts/check-source-licence
 */
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Glob } from "bun";

import { repoRootFor } from "../schemas/cat-harness.ts";
import { buildQaResult, writeQaResult } from "./qa-results.ts";

const INSTANCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = repoRootFor(INSTANCE_ROOT);

type Searched = { where: string; result: string; on?: string };
type Licence = { status?: string; id?: string; basis?: string; searched?: Searched[]; note?: string };

export interface LicenceReport {
  entries: number;
  stated: { entry: string; id: string; basis: string }[];
  unknown: { entry: string; searched: number; note?: string }[];
  notRecorded: { entry: string }[];
  malformed: { entry: string; problem: string }[];
}

/** The problem with a record, or `undefined` when it is well formed. */
export function licenceProblem(l: Licence): string | undefined {
  if (l.status === "stated") {
    if (!l.id?.trim()) return "`stated` with no `id`";
    if (!l.basis?.trim()) return "`stated` with no `basis`: where is it stated?";
    return undefined;
  }
  if (l.status === "unknown") {
    if (!Array.isArray(l.searched) || l.searched.length === 0)
      return "`unknown` with no `searched`: unknown means somebody looked, so say where";
    const bad = l.searched.find((s) => !s?.where?.trim() || !s?.result?.trim());
    return bad ? "a `searched` entry lacks `where` or `result`" : undefined;
  }
  return `status ${JSON.stringify(l.status)} is neither \`stated\` nor \`unknown\``;
}

export function checkSourceLicence(root: string = REPO_ROOT): LicenceReport {
  const r: LicenceReport = { entries: 0, stated: [], unknown: [], notRecorded: [], malformed: [] };
  const files = [...new Glob("**/library/*/manifest.jsonld").scanSync({ cwd: root, onlyFiles: true })]
    .filter((p) => !p.includes("node_modules") && !p.includes("ingest-staging"))
    .sort();
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

if (import.meta.main) {
  const r = checkSourceLicence();
  if (r.entries === 0) {
    console.error("UNDETERMINED: no library entry found. This is not a pass; nothing was checked.");
    process.exit(2);
  }
  const doc = buildQaResult({
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
