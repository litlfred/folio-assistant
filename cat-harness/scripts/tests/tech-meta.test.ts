/**
 * Technical file metadata — bean `nso8`.
 *
 * The module under test is Python (`scripts/_tech_meta.py`), shared by both
 * ingest rungs so they cannot disagree. Driven here through `python3` rather
 * than reimplemented, for the same reason the module exists: a second spelling
 * drifts, which is what `rlp5` records about `slugify`.
 *
 * @module scripts/tests/tech-meta
 */
import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { libraryEntry } from "./library-dirs.ts";

import { refreshMeta } from "../ingest-document.ts";

const ROOT = resolve(import.meta.dir, "../..");
const made: string[] = [];
afterEach(() => {
  for (const d of made.splice(0)) rmSync(d, { recursive: true, force: true });
});

function techMeta(file: string): Record<string, unknown> {
  const py =
    "import sys, json, importlib.util as u\n" +
    // Absolute, from this file's location. It was `'scripts/_tech_meta.py'`,
    // relative to the CWD — a path inside a python string inside a test, which
    // no scan here reaches. Fifth instance of this exact shape on this branch.
    `spec = u.spec_from_file_location('t', ${JSON.stringify(join(import.meta.dir, "..", "_tech_meta.py"))})\n` +
    "m = u.module_from_spec(spec); spec.loader.exec_module(m)\n" +
    "print(json.dumps(m.tech_meta(sys.argv[1])))\n";
  const r = Bun.spawnSync(["python3", "-c", py, file], { cwd: ROOT });
  return JSON.parse(new TextDecoder().decode(r.stdout)) as Record<string, unknown>;
}

/** A file with exactly these leading bytes. */
function fileWith(name: string, head: Uint8Array | string): string {
  const d = mkdtempSync(join(tmpdir(), "techmeta-"));
  made.push(d);
  const p = join(d, name);
  writeFileSync(p, head);
  return p;
}

describe("the mimetype is sniffed, never claimed", () => {
  test("magic bytes decide, and the source says so", () => {
    const m = techMeta(fileWith("x.pdf", "%PDF-1.7\nrest"));
    expect(m.mimetype_sniffed).toBe("application/pdf");
    expect(m.mimetype_source).toBe("magic-bytes");
  });

  test("a .pdf that is really HTML is reported as HTML — the whole point", () => {
    // A saved error page named `.pdf` extracts to nothing, and every verdict
    // about it is then about the wrong document. The extension cannot catch it.
    const m = techMeta(fileWith("report.pdf", "<!DOCTYPE html><html><body>404"));
    expect(m.mimetype_sniffed).toBe("text/html");
  });

  test("unrecognised bytes are NULL, never guessed from the extension", () => {
    const m = techMeta(fileWith("thing.pdf", "just some words, no signature"));
    // Falling back to the extension would make a real sniff and a guess
    // indistinguishable, which destroys the field's only use.
    expect(m.mimetype_sniffed).toBeNull();
    expect(m.mimetype_source).toBe("unrecognised");
  });

  test("`mimetype_source` distinguishes looked-at-and-unknown from never-looked", () => {
    // A bare null cannot say which. The companion field can, and the L1 gate
    // reads it rather than the nullable one.
    expect(techMeta(fileWith("a.bin", "zzz")).mimetype_source).toBe("unrecognised");
    expect(techMeta(fileWith("b.png", new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).mimetype_source).toBe("magic-bytes");
  });
});

describe("the mechanical facts", () => {
  test("every field nso8 asks for is present", () => {
    const m = techMeta(fileWith("x.pdf", "%PDF-1.4"));
    expect(Object.keys(m).sort()).toEqual(
      ["bytes", "file", "mimetype_sniffed", "mimetype_source", "mtime", "sha256"].sort(),
    );
  });

  test("sha256 is the FULL digest, not a truncation", () => {
    // `pdf-pages.py` stamps a 16-char prefix on each section; the document-level
    // checksum is the whole thing, because its job is re-fetch-and-compare.
    expect(techMeta(fileWith("x.pdf", "%PDF-1.4")).sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  test("mtime is the SOURCE's, in UTC, to the second", () => {
    expect(techMeta(fileWith("x.pdf", "%PDF-1.4")).mtime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test("identical bytes under different names give the same digest", () => {
    const a = techMeta(fileWith("one.pdf", "%PDF-1.4 same"));
    const b = techMeta(fileWith("two.pdf", "%PDF-1.4 same"));
    expect(a.sha256).toBe(b.sha256);
    expect(a.file).not.toBe(b.file);
  });

  test("the real corpus agrees with what pdf-structure recorded independently", () => {
    // pdf-structure.py computed these digests with its own implementation
    // before this module existed. Agreement is the cross-check.
    // READ from the declaration: the corpus moved to `who-iris/` in bean
    // `frs5`, and `cat` on a missing file returns empty stdout, so composing
    // the path here would have turned a moved document into a JSON parse
    // error rather than a clear "not found".
    const entry = libraryEntry("who-pub-tps-931");
    expect(entry, "who-pub-tps-931 is not in any declared library").toBeDefined();
    const s = JSON.parse(readFileSync(join(entry!, "structure.json"), "utf-8")) as {
      source: { sha256: string; file: string };
    };
    // The SOURCE path is derived too, and it has to be: bean `yl5w` moved
    // this PDF out of `cat-harness/uploads/` and into the folio beside its own
    // intake, and the line here was `join(ROOT, "uploads/WHO_PUB_TPS_93.1.pdf")`
    // — a literal, in the one test whose own comment says asserting a spelling
    // of a location is what re-pins the next relocation. `structure.json`
    // records the source FILENAME, and the library entry says which instance and slug,
    // so the upload sits at `<instance>/uploads/<slug>/<basename>` with nothing
    // spelled out here.
    const slug = basename(entry!);
    const instance = resolve(entry!, "..", "..");
    const pdf = join(instance, "uploads", slug, s.source.file);
    expect(existsSync(pdf), `the ingested source for ${slug} is not at ${pdf}`).toBe(true);
    expect(techMeta(pdf).sha256).toBe(s.source.sha256);
  });
});

describe("--refresh-meta does not reformat the file it refreshes", () => {
  /** A structure.json written at `indent`, refreshed in place; returns the new text. */
  function refreshed(indent: number): { before: string; after: string } {
    const root = mkdtempSync(join(tmpdir(), "refresh-"));
    made.push(root);
    const lib = join(root, "library", "doc");
    mkdirSync(lib, { recursive: true });
    const pdf = join(root, "doc.pdf");
    writeFileSync(pdf, "%PDF-1.4 refreshed");
    const doc = { _schema: "pdf-structure/v1", doc_id: "doc", sections: [{ id: "a", title: "A" }] };
    const p = join(lib, "structure.json");
    const before = JSON.stringify(doc, null, indent) + "\n";
    writeFileSync(p, before);
    refreshMeta(pdf, join(root, "library"));
    return { before, after: readFileSync(p, "utf-8") };
  }

  // `pdf-structure.py` writes `indent=1` and `pdf-pages.py` writes `indent=2`.
  // A refresh that picked one of them reformatted every entry the other rung
  // authored: adding three fields to `9789241548960-eng` produced a 4 349-line
  // diff, 4 324 of them whitespace. Measured 2026-09-19, bean `nso8`.
  for (const indent of [1, 2]) {
    test(`an indent-${indent} file stays indent-${indent}`, () => {
      const { before, after } = refreshed(indent);
      const width = (s: string) => {
        const l = s.split("\n").find((x) => x.startsWith(" "));
        return l ? l.length - l.trimStart().length : null;
      };
      expect(width(after)).toBe(width(before));
      expect(width(after)).toBe(indent);
    });
  }

  test("only the `source` block is added — every other line is byte-identical", () => {
    const { before, after } = refreshed(1);
    const dropSource = (s: string) =>
      JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(s) as Record<string, unknown>).filter(([k]) => k !== "source")));
    expect(dropSource(after)).toBe(dropSource(before));
    expect((JSON.parse(after) as { source: Record<string, unknown> }).source.mimetype_source).toBe("magic-bytes");
    // The trailing newline is preserved too: its absence would show up as a
    // one-line diff on every entry, for nothing.
    expect(after.endsWith("\n")).toBe(true);
  });
});
