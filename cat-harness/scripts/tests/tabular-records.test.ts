/**
 * CSV and spreadsheets — bean `p67i`.
 *
 * `uploads/` holds four PDFs and no datasets, so every claim is made against
 * files this module builds. The xlsx fixture is written by `zipfile` at test
 * time rather than committed, and deliberately mimics what a real writer
 * emits — including the package-root-absolute relationship Target that broke
 * the first draft.
 *
 * No openpyxl, no pandas: this repository declares no Python dependencies and
 * CI installs only `ruff`, so a test needing one would pass locally and fail
 * there. The reader is stdlib and so is the fixture.
 *
 * @module scripts/tests/tabular-records
 */
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { TABULAR_RECORDS_SCHEMA_ID, TabularRecordsSchema, isTabularMimetype } from "../../schemas/tabular-records.ts";
import { checkAll, checkEntry } from "../check-l1-complete.ts";
import { planFor, sniffMimetype, tabularDelimiter } from "../ingest-document.ts";

const ROOT = resolve(import.meta.dir, "../..");
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "tab-"));
  made.push(d);
  return d;
}

/**
 * A two-sheet xlsx, shared strings and all.
 *
 * `Target="/xl/worksheets/sheet1.xml"` is PACKAGE-ROOT-ABSOLUTE, which is what
 * a real writer emits for worksheets while writing `styles.xml` relative in
 * the same file. The first reader prefixed `xl/` unconditionally, producing
 * `xl/xl/worksheets/sheet1.xml`: every read raised, every shape came back
 * `undetermined`, every header list came back empty — and the sheet NAMES were
 * still right, which is what made the output look plausible.
 */
function xlsx(dir: string, name = "book.xlsx"): string {
  const py = [
    "import zipfile, sys",
    "p = sys.argv[1]",
    "z = zipfile.ZipFile(p, 'w')",
    "z.writestr('[Content_Types].xml', '<Types/>')",
    "M='http://schemas.openxmlformats.org/spreadsheetml/2006/main'",
    "R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'",
    "z.writestr('xl/workbook.xml', f'<workbook xmlns=\"{M}\" xmlns:r=\"{R}\"><sheets>'",
    "  f'<sheet name=\"Cases\" sheetId=\"1\" r:id=\"rId1\"/>'",
    "  f'<sheet name=\"Deaths\" sheetId=\"2\" r:id=\"rId2\"/></sheets></workbook>')",
    "z.writestr('xl/_rels/workbook.xml.rels', '<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">'",
    "  '<Relationship Id=\"rId1\" Target=\"/xl/worksheets/sheet1.xml\"/>'",
    "  '<Relationship Id=\"rId2\" Target=\"/xl/worksheets/sheet2.xml\"/>'",
    "  '<Relationship Id=\"rId3\" Target=\"styles.xml\"/></Relationships>')",
    "z.writestr('xl/sharedStrings.xml', f'<sst xmlns=\"{M}\">'",
    "  '<si><t>country</t></si><si><t>year</t></si><si><t>cases</t></si><si><t>deaths</t></si></sst>')",
    "def sheet(dim, idx):",
    "    cells = ''.join(f'<c r=\"{c}1\" t=\"s\"><v>{i}</v></c>' for c, i in zip('ABC', idx))",
    "    return f'<worksheet xmlns=\"{M}\"><dimension ref=\"{dim}\"/><sheetData><row r=\"1\">{cells}</row></sheetData></worksheet>'",
    "z.writestr('xl/worksheets/sheet1.xml', sheet('A1:C3', [0,1,2]))",
    "z.writestr('xl/worksheets/sheet2.xml', sheet('A1:C2', [0,1,3]))",
    "z.close()",
  ].join("\n");
  const p = join(dir, name);
  const r = Bun.spawnSync(["python3", "-c", py, p]);
  if (r.exitCode !== 0) throw new Error(new TextDecoder().decode(r.stderr));
  return p;
}

function csv(dir: string, body: string, name = "data.csv"): string {
  const p = join(dir, name);
  writeFileSync(p, body);
  return p;
}

function extract(file: string, out: string) {
  const r = Bun.spawnSync(["python3", "scripts/tabular-records.py", "-o", out, file], { cwd: ROOT });
  if (r.exitCode !== 0) throw new Error(new TextDecoder().decode(r.stderr));
  const slug = file.endsWith(".xlsx") ? "book" : "data";
  return TabularRecordsSchema.safeParse(JSON.parse(readFileSync(join(out, slug, "tabular.jsonld"), "utf-8")));
}

describe("a workbook is read for its sheets, headers and shape", () => {
  test("sheet names, headers and shape all come through", () => {
    const d = tmp();
    const r = extract(xlsx(d), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.sheets.map((s) => s.name)).toEqual(["Cases", "Deaths"]);
    expect(r.data.sheets[0].headers).toEqual(["country", "year", "cases"]);
    expect(r.data.sheets[1].headers).toEqual(["country", "year", "deaths"]);
    expect(r.data.sheets.map((s) => [s.rows, s.columns])).toEqual([[3, 3], [2, 3]]);
    for (const s of r.data.sheets) expect(s.shape_source).toBe("dimension");
  });

  test("an ABSOLUTE relationship Target resolves — the defect that looked plausible", () => {
    // The names were right and everything else was empty, which is the worst
    // shape a bug can take: the output reads as a successfully ingested
    // workbook that simply had no headers.
    const d = tmp();
    const r = extract(xlsx(d), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.sheets.every((s) => s.headers.length > 0)).toBe(true);
    expect(r.data.sheets.every((s) => s.shape_source !== "undetermined")).toBe(true);
  });

  test("the header vocabulary is the union across sheets, deduplicated", () => {
    const d = tmp();
    const r = extract(xlsx(d), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    // `country` and `year` appear on both sheets and once here: this field is
    // what a grep for a column name lands in.
    expect(r.data.header_vocabulary).toEqual(["cases", "country", "deaths", "year"]);
  });
});

describe("a CSV is read without guessing", () => {
  test("headers, row count and a sniffed delimiter", () => {
    const d = tmp();
    const r = extract(csv(d, "country,year,cases\nMWI,2024,17\nZMB,2024,42\n"), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.sheets[0].headers).toEqual(["country", "year", "cases"]);
    expect(r.data.sheets[0].rows).toBe(3);
    expect(r.data.sheets[0].delimiter).toBe(",");
  });

  test("a semicolon file is not split on commas", () => {
    const d = tmp();
    const r = extract(csv(d, "a;b;c\n1;2;3\n4;5;6\n"), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.sheets[0].headers).toEqual(["a", "b", "c"]);
  });
});

describe("the narrative slot is declared empty, never invented", () => {
  test("a fresh record is `not-authored` with no text", () => {
    const d = tmp();
    const r = extract(csv(d, "a,b\n1,2\n3,4\n"), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    // Headers are RIGHT THERE and a plausible summary could be assembled from
    // them. It is not, because shipping one as the answer is a claim nobody
    // made. Drafting one and SAYING SO is a different act — `state: "draft"`.
    expect(r.data.narrative.text).toBeNull();
    expect(r.data.narrative.state).toBe("not-authored");
  });

  test("the schema refuses a record that says two things at once", () => {
    const d = tmp();
    const r = extract(csv(d, "a,b\n1,2\n3,4\n"), join(d, "lib"));
    expect(r.success).toBe(true);
    if (!r.success) return;
    const with_ = (n: unknown) => TabularRecordsSchema.safeParse({ ...r.data, narrative: n }).success;
    // Text without a state that admits it, and a state that claims text there
    // is none of, are both refused (bean `ju0u`).
    expect(with_({ text: "a summary", state: "not-authored" })).toBe(false);
    expect(with_({ text: null, state: "draft" })).toBe(false);
    // And an agent cannot confirm its own draft.
    expect(
      with_({
        text: "a summary",
        state: "confirmed",
        drafted_by: { kind: "agent", id: "claude-code", model: "claude-opus-5" },
        confirmed_by: { kind: "agent", id: "claude-code", model: "claude-opus-5" },
      }),
    ).toBe(false);
    expect(
      with_({
        text: "a summary",
        state: "confirmed",
        drafted_by: { kind: "agent", id: "claude-code", model: "claude-opus-5" },
        confirmed_by: { kind: "human", id: "litlfred" },
      }),
    ).toBe(true);
  });
});

describe("routing: a spreadsheet is not an archive", () => {
  test("an .xlsx takes the TABULAR rung, though its magic bytes say zip", () => {
    // The whole point. An OOXML package IS a zip, so `twqe`'s routing sent it
    // to `archive-contents.py` and listed it as a bag of XML parts.
    const d = tmp();
    const book = xlsx(d);
    expect(sniffMimetype(book)).toBe(XLSX);
    expect(planFor(book, undefined, "library").rung).toBe("tabular");
  });

  test("a plain zip still takes the archive rung", () => {
    const d = tmp();
    mkdirSync(join(d, "src"), { recursive: true });
    writeFileSync(join(d, "src", "a.txt"), "x");
    Bun.spawnSync(["sh", "-c", "cd src && zip -qr ../plain.zip ."], { cwd: d });
    expect(planFor(join(d, "plain.zip"), undefined, "library").rung).toBe("archive");
  });

  test("a CSV takes the tabular rung on CONTENT, not on its name", () => {
    const d = tmp();
    // Named `.dat`, so nothing but the row shape can route it.
    const f = csv(d, "a,b,c\n1,2,3\n4,5,6\n", "mystery.dat");
    expect(sniffMimetype(f)).toBeNull();
    expect(planFor(f, undefined, "library").rung).toBe("tabular");
  });

  test("prose named .csv is NOT routed as tabular", () => {
    const d = tmp();
    const f = csv(d, "This is a paragraph of prose.\nIt has two lines and no columns.\n", "notdata.csv");
    expect(tabularDelimiter(f)).toBeNull();
    expect(planFor(f, undefined, "library").rung).not.toBe("tabular");
  });

  test("a single-column file is not a table", () => {
    const d = tmp();
    // Indistinguishable from a list of lines; claiming it would file a text
    // file as a dataset.
    expect(tabularDelimiter(csv(d, "alpha\nbravo\ncharlie\n", "one.csv"))).toBeNull();
  });

  test("a RAGGED file is refused rather than split anyway", () => {
    const d = tmp();
    expect(tabularDelimiter(csv(d, "a,b,c\n1,2\n3,4,5,6\n", "ragged.csv"))).toBeNull();
  });

  test("isTabularMimetype refuses everything else", () => {
    for (const m of ["application/zip", "application/pdf", null, "", undefined]) {
      expect(isTabularMimetype(m)).toBe(false);
    }
    expect(isTabularMimetype(XLSX)).toBe(true);
  });
});

/** A library entry whose `source` sniffed as the given mimetype. */
function entryFor(mimetype: string | null, tabular?: unknown): string {
  const root = tmp();
  const dir = join(root, "doc");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "structure.json"),
    JSON.stringify({ _schema: "pdf-structure/v1", sections: [1], source: { mimetype_sniffed: mimetype } }),
  );
  if (tabular !== undefined) {
    writeFileSync(join(dir, "tabular.jsonld"), typeof tabular === "string" ? tabular : JSON.stringify(tabular));
  }
  return dir;
}

const tabState = (d: string) => checkEntry(d).requirements.find((r) => r.name === "tabular-records");

describe("the gate fires on a workbook with no record", () => {
  test("a workbook entry with no tabular.jsonld is UNMET", () => {
    const r = tabState(entryFor(XLSX));
    expect(r?.state).toBe("unmet");
    expect(r?.detail).toContain("no tabular.jsonld");
  });

  test("a valid record is MET and names the narrative state", () => {
    const d = tmp();
    const rec = extract(csv(d, "a,b\n1,2\n3,4\n"), join(d, "lib"));
    expect(rec.success).toBe(true);
    if (!rec.success) return;
    const r = tabState(entryFor(XLSX, rec.data));
    expect(r?.state).toBe("met");
    expect(r?.detail).toContain("narrative not-authored");
  });

  test("a record that is not the declared schema is UNMET", () => {
    const r = tabState(entryFor(XLSX, { $schema: "other/v1" }));
    expect(r?.state).toBe("unmet");
    expect(r?.detail).toContain(TABULAR_RECORDS_SCHEMA_ID);
  });

  test("a CSV entry is checked on its merits despite an unrecognised mimetype", () => {
    // A CSV has no magic bytes, so requiring a record of every unrecognised
    // entry would demand a dataset of every text file. Present means checked.
    const d = tmp();
    const rec = extract(csv(d, "a,b\n1,2\n3,4\n"), join(d, "lib"));
    expect(rec.success).toBe(true);
    if (!rec.success) return;
    expect(tabState(entryFor(null, rec.data))?.state).toBe("met");
    expect(tabState(entryFor(null, { $schema: "other/v1" }))?.state).toBe("unmet");
  });

  test("a PDF entry is MET and SAYS SO — a determined zero", () => {
    expect(tabState(entryFor("application/pdf"))?.detail).toBe("not tabular (application/pdf)");
  });
});

describe("the real corpus", () => {
  test("four PDFs, zero datasets, said per entry rather than left silent", () => {
    // `undefined` means no `library` graph was declared, which is NOT an
    // empty corpus — a test computed over it has checked nothing.
    const reports = checkAll(ROOT);
    expect(reports, "no `library` declared under ROOT — this test would be vacuous").toBeDefined();
    if (reports === undefined) return;
    expect(reports.length).toBeGreaterThan(0);
    for (const r of reports) {
      const q = r.requirements.find((x) => x.name === "tabular-records");
      expect(`${r.slug}: ${q?.state}`).toBe(`${r.slug}: met`);
      expect(q?.detail).toContain("not tabular");
    }
  });
});

// ── The record is real JSON-LD — bean `yh6u` ───────────────────────────────
//
// It was named `.jsonld` with an `@id` and no `@context`, so a JSON-LD
// processor dropped every key. The two assertions that matter: the writer
// emits the PUBLISHED context, and every key it writes is a declared term —
// checked by the same function the CI gate runs, over the arm's real output.

import { CONTENT_CONTEXT_URL } from "../../schemas/jsonld.ts";
import { checkDeclaredKeys } from "../check-context-emission.ts";

describe("the tabular record is JSON-LD a processor keeps whole", () => {
  test("the arm emits the published content context", () => {
    const d = tmp();
    const out = join(d, "lib");
    extract(xlsx(d), out);
    const raw = JSON.parse(readFileSync(join(out, "book", "tabular.jsonld"), "utf-8"));
    expect(raw["@context"]).toBe(CONTENT_CONTEXT_URL);
  });

  test("every key the arm writes is a declared term — nested data rides in `@json`", () => {
    const d = tmp();
    const out = join(d, "lib");
    extract(xlsx(d), out);
    const k = checkDeclaredKeys(out);
    expect(k.documents).toBe(1); // not vacuous: the record was read as content
    expect(k.undeclared).toEqual([]);
  });

  test("the Python constant IS the TypeScript one — one URL, not two", () => {
    const py = readFileSync(join(ROOT, "scripts", "_content_context.py"), "utf-8");
    expect(/CONTENT_CONTEXT_URL = "([^"]+)"/.exec(py)?.[1]).toBe(CONTENT_CONTEXT_URL);
  });

  test("a record written before the arm emitted `@context` still validates", () => {
    // Folio repositories hold those. The field is optional for exactly that.
    const d = tmp();
    const out = join(d, "lib");
    extract(xlsx(d), out);
    const raw = JSON.parse(readFileSync(join(out, "book", "tabular.jsonld"), "utf-8"));
    delete raw["@context"];
    expect(TabularRecordsSchema.safeParse(raw).success).toBe(true);
    expect(TabularRecordsSchema.safeParse({ ...raw, "@context": "https://elsewhere.example/ctx" }).success).toBe(false);
  });
});
