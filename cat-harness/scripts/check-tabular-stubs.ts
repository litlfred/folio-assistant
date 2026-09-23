#!/usr/bin/env bun
/**
 * QA that catches ABSENCE — bean `eief`.
 *
 * The owner: *"no tooling needed, stub out, make QA to catch absence."* This
 * is the second half. Declaring `tabular-csv` and `tabular-xlsx` as Tool nodes
 * makes the capability visible; without this check, a reader of `tools/` sees
 * two tools and has no way to learn that neither runs.
 *
 * ## Three things it refuses, each one paid for
 *
 * 1. **A stub reported as a result.** A stubbed table is `not-derivable`
 *    naming the tool, never `met`.
 * 2. **A HALF-STUB** — `fac:stub` alongside real columns. The schema refuses
 *    it, and this reports it too, because the schema only fires when somebody
 *    validates. A thin-but-present extraction reads as a working one: bean
 *    `6xaz`'s shape, where sheet names were right and every header list was
 *    empty, so the output looked like a workbook that simply had no headers.
 * 3. **AN EXPIRED STUB** — the tool now exists and `fac:stub` is still there.
 *    This is the ratchet, and it is the rule that rots if nobody writes it
 *    down. This session fixed the same defect four times (a restated bearing
 *    list, a reason in a YAML comment, a backlog keyed to a page, a third
 *    state with no expiry) and then introduced a fifth: a probe that looked
 *    for `transcript.json` when the arm writes `transcript/`, so it could
 *    never have fired.
 *
 * ## Why the probe is read from the TOOL, not written here
 *
 * That fifth defect is exactly why. A stub's expiry is decided by whether the
 * named tool has an implementation, and the only honest source for that is the
 * tool's own declaration — `install: { none: true }` and no invoke path. A
 * literal restated here would be a sixth instance of the same mistake.
 *
 * Exit 0 clean · 1 a finding · 2 could not determine, which is never a pass.
 */
import { noteAbsent, splitDeclared } from "./lib/declared-presence.ts";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { directoriesForGraph } from "../schemas/cat-harness.ts";
import { tools } from "../tools/index.ts";
import { TABULAR_CSVW_FILENAME, TabularCsvwSchema } from "../schemas/tabular-csvw.ts";

const ROOT = resolve(import.meta.dir, "..");

export interface StubFinding {
  severity: "stub" | "half-stub" | "expired" | "unreadable";
  entry: string;
  detail: string;
}

/** Tools that are declared but have no way to run — read, never restated. */
export function stubbedTools(tools: readonly { id: string; install?: unknown }[]): Set<string> {
  return new Set(
    tools
      .filter((t) => {
        const i = t.install as { none?: boolean } | undefined;
        return i?.none === true;
      })
      .map((t) => t.id),
  );
}

/**
 * Findings across every tabular record under a library.
 *
 * **Never empty-by-accident**: a record that will not parse is `unreadable`
 * rather than skipped, and the caller asserts that something was read.
 */
export function stubFindings(
  entries: readonly string[],
  read: (dir: string) => string | undefined,
  toolIsStubbed: (id: string) => boolean,
): StubFinding[] {
  const out: StubFinding[] = [];
  for (const dir of entries) {
    const text = read(dir);
    if (text === undefined) continue; // no tabular record here at all
    const parsed = TabularCsvwSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      out.push({
        severity: "unreadable",
        entry: dir,
        detail: `tabular record will not validate: ${parsed.error.issues[0]?.message ?? "invalid"}`,
      });
      continue;
    }
    for (const t of parsed.data.tables) {
      const stub = t["fac:stub"];
      if (!stub) continue;
      if (t.tableSchema.columns.length > 0) {
        out.push({
          severity: "half-stub",
          entry: dir,
          detail: `${t.url}: carries \`fac:stub\` AND ${t.tableSchema.columns.length} column(s) — a thin extraction reads as a working one`,
        });
        continue;
      }
      out.push(
        toolIsStubbed(stub.tool)
          ? {
              severity: "stub",
              entry: dir,
              detail: `${t.url}: awaiting \`${stub.tool}\` — ${stub.reason} (since ${stub.since})`,
            }
          : {
              severity: "expired",
              entry: dir,
              detail: `${t.url}: \`${stub.tool}\` now has an implementation, so \`fac:stub\` must go (recorded ${stub.since})`,
            },
      );
    }
  }
  return out;
}

function run(): number {
  // EVERY declared library, not the one.
  //
  // This read `directoryForGraph(ROOT, "library")`, which was right while the
  // platform held the corpus and refuses — loudly, by name — now that it does
  // not. Bean `frs5` moved the four entries into `who-iris/` and
  // `folio-assistant-sci/`, and `wwi6`'s inheritance guarantee kept a third,
  // empty declaration here, so `library` has three homes.
  //
  // THE REFUSAL IS THE DESIGN WORKING. `a02m` migrated every
  // `directoriesForGraph(…)[0]` and added a test that fails on a new one, but
  // this site spells the assumption with main's accessor instead, so that test
  // never saw it. What caught it was the accessor itself, in CI, naming all
  // three candidates — which is exactly the difference between an assumption
  // that is visible and one that is checked.
  //
  // A scanner, so it fans out: this is an EXPIRY check over ingested
  // documents, and scanning one of three libraries would report every stub in
  // the other two as expired-nowhere — a clean run over the documents that
  // actually carry them.
  // Declared-but-absent is REPORTED, not dropped (bean `95ir`).
  const { present: libs, absent } = splitDeclared(directoriesForGraph(ROOT, "library"));
  noteAbsent(absent, "a library");
  if (libs.length === 0) {
    console.error("Could not resolve a `library` directory. This is NOT a pass.");
    return 2;
  }
  const entries = libs.flatMap((lib) =>
    readdirSync(lib)
      .map((d) => join(lib, d))
      .filter((d) => statSync(d).isDirectory()),
  );

  // Read from the tool declarations rather than a literal here.
  let stubbed: Set<string>;
  try {
    stubbed = stubbedTools(tools());
  } catch (e) {
    console.error(`Could not read the tool declarations: ${e instanceof Error ? e.message : e}`);
    console.error("This is NOT a pass — the expiry check has no basis without them.");
    return 2;
  }

  const findings = stubFindings(
    entries,
    (dir) => {
      const f = join(dir, TABULAR_CSVW_FILENAME);
      return existsSync(f) ? readFileSync(f, "utf-8") : undefined;
    },
    (id) => stubbed.has(id),
  );

  for (const f of findings) console.log(`  ${f.severity.padEnd(11)} ${f.detail}`);

  const blocking = findings.filter((f) => f.severity !== "stub");
  const withRecords = entries.filter((d) => existsSync(join(d, TABULAR_CSVW_FILENAME))).length;
  console.log();
  console.log(
    `  ${entries.length} entry/entries scanned, ${withRecords} with a tabular record, ` +
      `${findings.filter((f) => f.severity === "stub").length} outstanding stub(s), ` +
      `${blocking.length} blocking`,
  );

  // A corpus with NO tabular record at all is not a clean sweep — it is a
  // sweep with nothing to sweep, and saying "every stub is honest" over it
  // would be the vacuity this check exists to prevent, one level up. Said out
  // loud and exited 0, because the absence is expected today: no tabular
  // source has been ingested yet (bean `p67i`).
  if (withRecords === 0) {
    console.log("  · no entry carries a tabular record — nothing was checked, which is");
    console.log("    NOT the same as nothing being wrong. No tabular source is ingested yet.");
    return 0;
  }
  if (findings.some((f) => f.severity === "unreadable")) return 2;
  if (blocking.length) {
    console.error("\n✗ A stub has expired or is half-done. Remove `fac:stub` when the tool lands.");
    return 1;
  }
  // Outstanding stubs are REPORTED, never silent, and do not fail: they are
  // the honest state of an unbuilt tool. What fails is a stub that has stopped
  // being true.
  console.log("  ✓ every stub is outstanding and honestly recorded");
  return 0;
}

if (import.meta.main) process.exit(run());
